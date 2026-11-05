// Faire-part : un mot de passe commun ouvre le site ; chacun indique ensuite
// qui vient, et envoie sa réponse. Toutes les données affichées passent par
// textContent : rien de ce qui vient du tableur n'est interprété comme du HTML.
(function () {
  "use strict";

  const config = window.MARIAGE;
  const modeDemo = !config.apiUrl;
  const evenementsParId = new Map(config.evenements.map((evenement) => [evenement.id, evenement]));
  const PRECISER = "à préciser";

  const $ = (id) => document.getElementById(id);
  const sansAnimation = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let motDePasseCourant = "";
  let numeroPersonne = 0;

  // ---------- Utilitaires ----------

  function el(tag, attributs, ...enfants) {
    const noeud = document.createElement(tag);
    for (const [cle, valeur] of Object.entries(attributs || {})) {
      if (valeur === false || valeur === null || valeur === undefined) continue;
      if (cle === "class") noeud.className = valeur;
      else if (cle === "for") noeud.htmlFor = valeur;
      else noeud.setAttribute(cle, valeur === true ? "" : valeur);
    }
    for (const enfant of enfants) {
      if (enfant === null || enfant === undefined || enfant === false) continue;
      noeud.append(typeof enfant === "string" ? document.createTextNode(enfant) : enfant);
    }
    return noeud;
  }

  // Les dessins (les fleurs de la tenue) : du SVG, qui a son propre espace de noms.
  function fleur(teintes) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "camaieu__fleur");
    svg.setAttribute("aria-hidden", "true");
    svg.style.setProperty("--rose-1", teintes[0]);
    svg.style.setProperty("--rose-2", teintes[1]);
    svg.style.setProperty("--rose-3", teintes[2]);
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#rose");
    svg.append(use);
    return svg;
  }

  function montrer(id, visible) {
    $(id).hidden = !visible;
  }

  // Majuscules, minuscules, accents et espaces ne comptent pas : « Soleil 2027 »
  // et « soleil2027 » ouvrent pareil.
  function normaliserMotDePasse(valeur) {
    return String(valeur || "")
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  }


  // ---------- Échanges avec le script Google (ou la démo) ----------

  // Le mot de passe est vérifié par le script Google : il n'est écrit nulle
  // part dans le site. En démo, il est dans config.js (motDePasseDemo).
  async function verifierMotDePasse(motDePasse) {
    if (modeDemo) return { ok: motDePasse === normaliserMotDePasse(config.motDePasseDemo), erreur: "mot_de_passe" };
    const url = new URL(config.apiUrl);
    url.searchParams.set("mdp", motDePasse);
    const reponse = await fetch(url.toString(), { method: "GET" });
    if (!reponse.ok) throw new Error("HTTP " + reponse.status);
    return reponse.json();
  }

  async function envoyerReponse(corps) {
    if (modeDemo) {
      await new Promise((resoudre) => setTimeout(resoudre, 400));
      return { ok: true, groupe: corps.groupe || `DEMO-${Date.now()}` };
    }
    // text/plain évite la requête préalable CORS, que Google Apps Script ne gère pas.
    const reponse = await fetch(config.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(corps),
    });
    if (!reponse.ok) throw new Error("HTTP " + reponse.status);
    return reponse.json();
  }

  // ---------- Affichage ----------

  // Sous vos noms : la période du week-end (« Du vendredi 23 au dimanche 25 juillet 2027 »).
  // Le compte à rebours jusqu'au mariage, en jours.
  function afficherCompte() {
    const mariage = new Date(config.dateMariage + "T00:00:00");
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    const jours = Math.round((mariage - aujourdhui) / 86_400_000);
    $("compte-jours").textContent =
      jours > 1 ? `Plus que ${jours} jours` : jours === 1 ? "C'est demain !" : jours === 0 ? "C'est aujourd'hui !" : "Merci d'avoir été là";
  }

  function afficherEnTete() {
    $("hero-dates").replaceChildren(...config.periode.flatMap((ligne, index) => (index ? [el("br"), ligne] : [ligne])));
  }

  // Le programme : une frise verticale, un moment par ligne (pensé pour téléphone).
  function afficherProgramme(evenements) {
    $("liste-evenements").replaceChildren(
      el(
        "ol",
        { class: "frise" },
        ...evenements.map((evenement) =>
          el(
            "li",
            { class: "frise__moment" },
            el(
              "p",
              { class: "frise__date", "aria-hidden": "true" },
              el("span", { class: "frise__jour" }, evenement.jour),
              el("span", { class: "frise__mois" }, evenement.mois),
            ),
            el(
              "div",
              { class: "frise__texte" },
              el("p", { class: "frise__semaine" }, `${evenement.dateTexte} ${config.annee}`),
              el("h3", { class: "frise__nom" }, evenement.nom),
              evenement.lieu ? el("p", { class: "frise__lieu" }, evenement.lieu) : null,
              evenement.horaires ? el("p", { class: "frise__horaires" }, evenement.horaires) : null,
              evenement.carte
                ? el("a", { class: "lien", href: evenement.carte, target: "_blank", rel: "noopener" }, "Voir sur la carte")
                : null,
            ),
          ),
        ),
      ),
    );
  }

  function afficherInfos(evenements) {
    const ids = new Set(evenements.map((evenement) => evenement.id));
    const infos = config.infos.filter((info) => info.evenements.some((id) => ids.has(id)));
    $("liste-infos").replaceChildren(
      ...infos.map((info) =>
        el(
          "div",
          { class: "info" },
          el("h4", {}, info.titre),
          info.couleurs
            ? el(
                "div",
                { class: "info__corps" },
                el("p", {}, info.texte),
                el(
                  "ul",
                  { class: "camaieu" },
                  ...info.couleurs.map((couleur) => el("li", {}, fleur(couleur.teintes), couleur.nom)),
                ),
              )
            : el("p", {}, info.texte),
        ),
      ),
    );
  }

  function questionPresence(personne, evenement) {
    const nom = `presence-${personne.id}-${evenement.id}`;
    const actuelle = personne.reponse?.presences?.[evenement.id] || "";
    const option = (valeur, texte) =>
      el(
        "label",
        { class: "choix" },
        el("input", { type: "radio", name: nom, value: valeur, required: true, checked: actuelle === valeur }),
        el("span", {}, texte),
      );
    return el(
      "fieldset",
      { class: "question", "data-question": nom },
      el(
        "legend",
        {},
        evenement.nom,
        el("small", {}, [`${evenement.dateTexte} ${config.annee}`, evenement.lieu].filter(Boolean).join(" · ")),
      ),
      el("div", { class: "choix-groupe" }, option("oui", "Présent·e"), option("non", "Absent·e")),
    );
  }

  function questionRegime(personne) {
    const idSelect = `regime-${personne.id}`;
    const idDetail = `regime-detail-${personne.id}`;
    const actuel = personne.reponse?.regime || "Aucun";
    const select = el(
      "select",
      { id: idSelect, name: idSelect },
      ...config.regimes.map((regime) => el("option", { value: regime, selected: regime === actuel }, regime)),
    );
    const detail = el("input", {
      id: idDetail,
      name: idDetail,
      type: "text",
      maxlength: "200",
      placeholder: "Précisez",
      "aria-label": "Précisions sur le régime alimentaire",
      value: personne.reponse?.regimeDetail || "",
    });
    const majDetail = () => {
      detail.hidden = !select.value.includes(PRECISER);
    };
    select.addEventListener("change", majDetail);
    majDetail();
    return el(
      "div",
      { class: "champ" },
      el("label", { for: idSelect }, "Régime alimentaire"),
      select,
      el("div", { style: "margin-top:.5rem" }, detail),
    );
  }

  function champTexte(id, libelle, valeur) {
    return el(
      "div",
      { class: "champ" },
      el("label", { for: id }, libelle),
      el("input", { id, name: id, type: "text", maxlength: "60", autocomplete: "off", required: true, value: valeur || "" }),
    );
  }

  // Une personne : prénom, nom, adulte ou enfant, présence à chaque moment,
  // régime. La première est la personne qui répond ; les suivantes viennent
  // avec le bouton +, autant qu'on veut, et « Retirer » les enlève.
  function blocPersonne(personne, premiere) {
    numeroPersonne += 1;
    const id = `p${numeroPersonne}`;
    const avecId = { ...personne, id, reponse: personne };
    const nomType = `type-${id}`;
    const typeActuel = personne.type || (premiere ? "adulte" : "");
    const optionType = (valeur, texte) =>
      el(
        "label",
        { class: "choix" },
        el("input", { type: "radio", name: nomType, value: valeur, required: true, checked: typeActuel === valeur }),
        el("span", {}, texte),
      );
    const bloc = el(
      "fieldset",
      { class: premiere ? "personne" : "personne personne--ajout", "data-personne": id },
      el("legend", {}, premiere ? "Vous" : "Une personne en plus"),
      el("div", { class: "identite" }, champTexte(`prenom-${id}`, "Prénom", personne.prenom), champTexte(`nom-${id}`, "Nom", personne.nom)),
      el(
        "fieldset",
        { class: "question", "data-question": nomType },
        el("legend", {}, "Adulte ou enfant ?"),
        el("div", { class: "choix-groupe" }, optionType("adulte", "Adulte"), optionType("enfant", "Enfant")),
      ),
      ...config.evenements.map((evenement) => questionPresence(avecId, evenement)),
      questionRegime(avecId),
      premiere ? null : el("button", { type: "button", class: "bouton bouton--discret personne__retirer" }, "Retirer cette personne"),
    );
    bloc.querySelector(".personne__retirer")?.addEventListener("click", () => {
      bloc.remove();
      $("bouton-ajouter").focus();
    });
    return bloc;
  }

  // Le formulaire, vide ou avec la réponse déjà envoyée depuis ce navigateur.
  function afficherFormulaire(reponse) {
    numeroPersonne = 0;
    const personnes = reponse?.personnes?.length ? reponse.personnes : [{}];
    $("personnes").replaceChildren(...personnes.map((personne, index) => blocPersonne(personne, index === 0)));
    $("message").value = reponse?.message || "";
  }

  function ajouterPersonne() {
    const bloc = blocPersonne({}, false);
    $("personnes").append(bloc);
    bloc.querySelector("input").focus();
  }

  $("bouton-ajouter").addEventListener("click", ajouterPersonne);

  // La réponse envoyée depuis ce navigateur : pour la modifier plus tard, et
  // pour que le jeu sache au nom de qui inscrire une photo trouvée. Elle ne
  // quitte pas ce navigateur, sauf vers le Google Sheet à l'envoi.
  function reponseEnregistree() {
    try {
      return JSON.parse(window.localStorage.getItem("reponse") || "null");
    } catch {
      return null;
    }
  }

  function enregistrerReponse(reponse) {
    try {
      window.localStorage.setItem("reponse", JSON.stringify(reponse));
    } catch {
      // Navigateur sans stockage : la réponse est envoyée, seule la reprise est perdue.
    }
  }

  // ---------- Le parcours en étapes ----------

  // Les étapes 0 (accès) et 1 (la lettre) sont des écrans à part ; ensuite,
  // quatre écrans plein écran. Sur les écrans « au toucher », toucher l'écran
  // fait passer au suivant. Pas sur le jeu (on y clique partout pour chercher)
  // ni sur le formulaire.
  const ETAPES = ["mariage", "infos", "jeu", "invites"];
  const AU_TOUCHER = new Set(["mariage", "infos"]);
  const INTERACTIF = "a, button, input, select, textarea, label, .cachette";

  function etapeCourante() {
    return document.querySelector(".etape:not([hidden])")?.dataset.etape;
  }

  function allerA(etape, options = { focus: true }) {
    const rang = ETAPES.indexOf(etape);
    document.querySelectorAll(".etape").forEach((section) => {
      section.hidden = section.dataset.etape !== etape;
    });

    $("etape-precedente").hidden = rang === 0;

    // Chaque étape est un écran : on repart du haut.
    window.scrollTo({ top: 0, behavior: "auto" });
    if (options.focus) {
      // Le premier titre de l'écran reçoit le focus (lecteurs d'écran, clavier).
      const titre = document.querySelector(`.etape[data-etape="${etape}"] :is(h1, h2)`);
      titre.setAttribute("tabindex", "-1");
      titre.focus({ preventScroll: true });
    }
  }

  function etapeVoisine(decalage) {
    const cible = ETAPES[ETAPES.indexOf(etapeCourante()) + decalage];
    if (cible) allerA(cible);
  }

  $("etape-precedente").addEventListener("click", () => etapeVoisine(-1));
  $("passer-jeu").addEventListener("click", () => etapeVoisine(1));

  // Toucher l'écran : passe au suivant, sauf sur un élément cliquable.
  $("contenu-invite").addEventListener("click", (evenement) => {
    if (!AU_TOUCHER.has(etapeCourante()) || evenement.target.closest(INTERACTIF)) return;
    etapeVoisine(1);
  });

  // Au clavier : → ou Entrée pour avancer sur les écrans au toucher, ← pour reculer.
  document.addEventListener("keydown", (evenement) => {
    if ($("contenu-invite").hidden || $("site").inert || !$("victoire").hidden) return;
    if (evenement.target.closest("input, select, textarea, button, a")) return;
    if (evenement.key === "ArrowLeft") etapeVoisine(-1);
    else if (AU_TOUCHER.has(etapeCourante()) && ["ArrowRight", "Enter", " "].includes(evenement.key)) {
      evenement.preventDefault();
      etapeVoisine(1);
    }
  });

  function afficherInvitation() {
    afficherEnTete();
    afficherCompte();
    afficherProgramme(config.evenements);
    afficherInfos(config.evenements);
    afficherLots();

    const dejaRepondu = reponseEnregistree();
    afficherFormulaire(dejaRepondu);
    montrer("form-reponse", !dejaRepondu);
    montrer("merci", Boolean(dejaRepondu));
    if (dejaRepondu) $("merci-texte").textContent = "Nous avons bien votre réponse. Vous pouvez la modifier.";

    allerA(ETAPES[0], { focus: false });
    montrer("contenu-invite", true);
  }

  // ---------- Étape 0 : accès restreint ----------

  function accesRefuse(message) {
    const acces = $("acces");
    $("acces-statut").textContent = "Accès refusé";
    $("erreur-code").textContent = message;
    acces.classList.remove("acces--refus");
    void acces.offsetWidth; // relance l'animation à chaque refus
    acces.classList.add("acces--refus");
    $("champ-code").focus();
    $("champ-code").select();
  }

  function accesAutorise() {
    const acces = $("acces");
    acces.classList.remove("acces--refus");
    acces.classList.add("acces--ok");
    $("acces-statut").textContent = "Accès autorisé";
    $("erreur-code").textContent = "";
    $("acces-bienvenue").textContent = "Bienvenue !";
    const passerALaLettre = () => {
      acces.hidden = true;
      montrer("ouverture", true);
      $("medaillon").focus({ preventScroll: true });
    };
    // Le temps de lire « Bienvenue » et de voir le cadenas s'ouvrir.
    if (sansAnimation) passerALaLettre();
    else {
      window.setTimeout(() => acces.classList.add("acces--sortie"), 1400);
      window.setTimeout(passerALaLettre, 1900);
    }
  }

  async function ouvrir(motDePasse) {
    const bouton = $("bouton-acces");
    bouton.disabled = true;
    bouton.textContent = "Vérification…";
    $("erreur-code").textContent = "";
    try {
      const resultat = await verifierMotDePasse(motDePasse);
      if (!resultat.ok) {
        accesRefuse(
          resultat.erreur === "mot_de_passe"
            ? "Ce n'est pas le bon mot de passe. Vérifiez-le, ou écrivez-nous."
            : "Impossible d'ouvrir l'invitation pour le moment. Réessayez dans un instant.",
        );
        return;
      }
      motDePasseCourant = motDePasse;
      afficherInvitation();
      accesAutorise();
    } catch {
      accesRefuse("Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.");
    } finally {
      bouton.disabled = false;
      bouton.textContent = "Entrer";
    }
  }

  $("form-code").addEventListener("submit", (evenement) => {
    evenement.preventDefault();
    const motDePasse = normaliserMotDePasse($("champ-code").value);
    if (!motDePasse) {
      accesRefuse("Entrez le mot de passe reçu avec votre invitation.");
      return;
    }
    ouvrir(motDePasse);
  });

  // ---------- Envoi de la réponse ----------

  function lireReponses() {
    const formulaire = $("form-reponse");
    const manquants = [];
    const valeur = (selecteur) => formulaire.querySelector(selecteur)?.value.trim() || "";
    const personnes = [...$("personnes").querySelectorAll("[data-personne]")].map((bloc) => {
      const id = bloc.dataset.personne;
      const prenom = valeur(`#prenom-${id}`);
      const nom = valeur(`#nom-${id}`);
      if (!prenom) manquants.push(`#prenom-${id}`);
      if (!nom) manquants.push(`#nom-${id}`);
      const type = formulaire.querySelector(`input[name="type-${id}"]:checked`)?.value || "";
      if (!type) manquants.push(`[data-question="type-${id}"] input`);
      const presences = {};
      for (const evenement of config.evenements) {
        const choix = formulaire.querySelector(`input[name="presence-${id}-${evenement.id}"]:checked`);
        if (choix) presences[evenement.id] = choix.value;
        else manquants.push(`[data-question="presence-${id}-${evenement.id}"] input`);
      }
      const regime = formulaire.querySelector(`#regime-${id}`).value;
      return { prenom, nom, type, presences, regime, regimeDetail: regime.includes(PRECISER) ? valeur(`#regime-detail-${id}`) : "" };
    });
    return { personnes, manquants };
  }

  $("form-reponse").addEventListener("submit", async (evenement) => {
    evenement.preventDefault();
    const erreur = $("erreur-reponse");
    erreur.textContent = "";
    const { personnes, manquants } = lireReponses();
    if (manquants.length) {
      erreur.textContent = "Il manque une réponse : pour chacun, le prénom, le nom, adulte ou enfant, et s'il sera là.";
      $("form-reponse").querySelector(manquants[0])?.focus();
      return;
    }

    const bouton = $("bouton-envoyer");
    bouton.disabled = true;
    bouton.textContent = "Envoi…";
    try {
      const message = $("message").value.trim();
      // Le même navigateur remplace sa réponse précédente (même « groupe ») ;
      // les photos déjà trouvées au jeu sont inscrites au tirage avec elle.
      const groupe = reponseEnregistree()?.groupe || "";
      const resultat = await envoyerReponse({ mdp: motDePasseCourant, groupe, personnes, message, photos: [...photosTrouvees()] });
      if (!resultat.ok) throw new Error(resultat.erreur || "refus");
      enregistrerReponse({ groupe: resultat.groupe, personnes, message });
      afficherLots();
      const viennent = personnes.some((personne) => Object.values(personne.presences).includes("oui"));
      $("merci-texte").textContent =
        (viennent ? "Votre réponse est bien enregistrée. Nous avons hâte de vous voir !" : "Votre réponse est bien enregistrée. Vous nous manquerez.") +
        (modeDemo ? " (Démo : rien n'a été envoyé.)" : "");
      montrer("form-reponse", false);
      montrer("merci", true);
      $("merci").focus();
    } catch {
      erreur.textContent = "Votre réponse n'a pas pu être envoyée. Réessayez dans un instant.";
    } finally {
      bouton.disabled = false;
      bouton.textContent = "Envoyer notre réponse";
    }
  });

  $("bouton-modifier").addEventListener("click", () => {
    afficherFormulaire(reponseEnregistree());
    montrer("merci", false);
    montrer("form-reponse", true);
    $("personnes").querySelector("input, select")?.focus();
  });

  // ---------- Le jeu : trois photos de Claire cachées ----------

  // Une zone de clic invisible : ni image, ni focus clavier, ni nom lu.
  function cachette(photo) {
    return el("button", {
      type: "button",
      class: "cachette cachette--lot",
      "data-photo": photo,
      tabindex: "-1",
      "aria-hidden": "true",
    });
  }

  function lotDeLaPhoto(photo) {
    const index = config.jeu.lots.findIndex((lot) => lot.photo === photo);
    return index === -1 ? null : { ...config.jeu.lots[index], numero: index + 1 };
  }

  function afficherLots() {
    const trouvees = photosTrouvees();
    $("liste-lots").replaceChildren(
      ...config.jeu.lots.map((lot, index) => {
        const trouvee = trouvees.has(lot.photo);
        return el(
          "article",
          { class: "lot" },
          el("img", { src: lot.image, alt: lot.nom }),
          el("p", { class: "lot__rarete" }, config.jeu.rarete),
          el("p", { class: "lot__numero" }, `Lot n° ${index + 1}`),
          el("p", { class: "lot__nom" }, lot.nom),
          el(
            "p",
            { class: trouvee ? "lot__statut lot__statut--trouvee" : "lot__statut" },
            trouvee ? (reponseEnregistree() ? "✓ Vous participez" : "✓ Trouvée !") : `Photo n° ${lot.photo} à trouver`,
          ),
          // La photo 2 se cache dans le coin de la carte du lot n° 2.
          lot.photo === "2" ? cachette("2") : null,
        );
      }),
    );
  }

  // Mémoire locale de ce navigateur, juste pour le compteur « 2 / 3 ».
  // Le classement qui compte est dans le Google Sheet.
  function photosTrouvees() {
    try {
      return new Set(JSON.parse(window.localStorage.getItem("photos-trouvees") || "[]"));
    } catch {
      return new Set();
    }
  }

  function noterPhoto(photo) {
    const trouvees = photosTrouvees();
    trouvees.add(photo);
    try {
      window.localStorage.setItem("photos-trouvees", JSON.stringify([...trouvees]));
    } catch {
      // Navigateur sans stockage : le compteur repartira de zéro, sans gravité.
    }
    return trouvees.size;
  }

  // Une photo trouvée après avoir répondu : inscrite tout de suite, au nom de
  // la réponse de ce navigateur. Avant d'avoir répondu, elle part avec la réponse.
  async function signalerTrouvaille(photo, groupe) {
    const reponse = await fetch(config.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "trouve", mdp: motDePasseCourant, groupe, photo }),
    });
    if (!reponse.ok) throw new Error("HTTP " + reponse.status);
    return reponse.json();
  }

  // Feu d'artifice et confettis sur un canvas plein écran, sans bibliothèque.
  // Les couleurs du vitrail : or, nacre, rose poudré, sauge.
  const COULEURS = ["#c28a45", "#efc98a", "#e6b467", "#f0a88c", "#fbdccb", "#e3d9a6", "#b5a76a", "#fdf6ec"];
  let particules = [];
  let animation = 0;

  function exploser(canvas, x, y, nombre) {
    for (let i = 0; i < nombre; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const vitesse = 2 + Math.random() * 7;
      particules.push({
        x,
        y,
        vx: Math.cos(angle) * vitesse,
        vy: Math.sin(angle) * vitesse - 1.5,
        vie: 60 + Math.random() * 50,
        age: 0,
        taille: 2 + Math.random() * 3,
        couleur: COULEURS[Math.floor(Math.random() * COULEURS.length)],
        confetti: false,
      });
    }
  }

  function pleuvoirConfettis(canvas, nombre) {
    for (let i = 0; i < nombre; i += 1) {
      particules.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.5,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 3,
        vie: 260,
        age: 0,
        taille: 5 + Math.random() * 6,
        couleur: COULEURS[Math.floor(Math.random() * COULEURS.length)],
        confetti: true,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
      });
    }
  }

  function lancerFeuxDArtifice(options = {}) {
    const salves = options.salves ?? 9;
    const confettis = options.confettis ?? 160;
    const canvas = $("feux");
    const ratio = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    const contexte = canvas.getContext("2d");
    particules = [];
    window.cancelAnimationFrame(animation);

    for (let i = 0; i < salves; i += 1) {
      window.setTimeout(() => {
        exploser(canvas, canvas.width * (0.15 + Math.random() * 0.7), canvas.height * (0.15 + Math.random() * 0.45), 90 * ratio);
      }, i * 280);
    }
    pleuvoirConfettis(canvas, confettis);

    const image = () => {
      contexte.clearRect(0, 0, canvas.width, canvas.height);
      particules = particules.filter((p) => p.age < p.vie);
      for (const p of particules) {
        p.age += 1;
        p.x += p.vx * ratio;
        p.y += p.vy * ratio;
        if (p.confetti) {
          p.vx *= 0.99;
          p.rotation += p.spin;
        } else {
          p.vx *= 0.97;
          p.vy = p.vy * 0.97 + 0.12;
        }
        contexte.globalAlpha = Math.max(0, 1 - p.age / p.vie);
        contexte.fillStyle = p.couleur;
        if (p.confetti) {
          contexte.save();
          contexte.translate(p.x, p.y);
          contexte.rotate(p.rotation);
          contexte.fillRect((-p.taille * ratio) / 2, (-p.taille * ratio) / 4, p.taille * ratio, (p.taille * ratio) / 2);
          contexte.restore();
        } else {
          contexte.beginPath();
          contexte.arc(p.x, p.y, p.taille * ratio * (1 - p.age / p.vie / 2), 0, Math.PI * 2);
          contexte.fill();
        }
      }
      contexte.globalAlpha = 1;
      if (particules.length) animation = window.requestAnimationFrame(image);
    };
    animation = window.requestAnimationFrame(image);
  }

  let elementAvantVictoire = null;

  async function victoire(bouton) {
    const photo = bouton.dataset.photo;
    const total = Object.keys(config.jeu.photos).length;
    const trouvees = noterPhoto(photo);
    const lot = lotDeLaPhoto(photo);
    const annonceLot = lot ? `tirage au sort du lot n° ${lot.numero} : ${lot.nom}` : "tirage au sort";
    afficherLots();

    elementAvantVictoire = document.activeElement;
    $("victoire-photo").src = config.jeu.photos[photo];
    $("victoire-titre").textContent = "Bravo !";
    $("victoire-texte").textContent = `Tu as trouvé une photo de Claire ! Te voilà inscrit au ${annonceLot}.`;
    $("victoire-lot").hidden = !lot;
    if (lot) {
      $("victoire-lot").src = lot.image;
      $("victoire-lot").alt = lot.nom;
    }
    $("victoire-score").textContent = `Photos trouvées : ${trouvees} / ${total}`;
    montrer("victoire", true);
    $("victoire-fermer").focus();
    $("site").classList.add("secousse");
    window.setTimeout(() => $("site").classList.remove("secousse"), 600);
    if (!sansAnimation) lancerFeuxDArtifice();

    if (modeDemo) {
      $("victoire-texte").textContent = `Tu as trouvé une photo de Claire ! Tu participerais au ${annonceLot}. (Démo : rien n'est enregistré.)`;
      return;
    }
    const groupe = reponseEnregistree()?.groupe;
    if (!groupe) {
      $("victoire-texte").textContent = `Tu as trouvé une photo de Claire ! Envoie ta réponse à la fin du site pour participer au ${annonceLot}.`;
      return;
    }
    try {
      const resultat = await signalerTrouvaille(photo, groupe);
      if (!resultat || !resultat.ok) throw new Error("refus");
      $("victoire-texte").textContent = resultat.deja
        ? `Déjà trouvée ! Tu es bien inscrit au ${annonceLot}.`
        : `Tu as trouvé une photo de Claire ! Te voilà inscrit au ${annonceLot}. 🎁`;
    } catch {
      $("victoire-texte").textContent = "Tu as trouvé une photo de Claire ! (Ta participation n'a pas pu être enregistrée, réessaie plus tard.)";
    }
  }

  function fermerVictoire() {
    montrer("victoire", false);
    window.cancelAnimationFrame(animation);
    particules = [];
    // Efface aussi la dernière image : sinon les confettis restent figés à l'écran.
    const canvas = $("feux");
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    if (elementAvantVictoire && typeof elementAvantVictoire.focus === "function") elementAvantVictoire.focus();
  }

  document.addEventListener("click", (evenement) => {
    const bouton = evenement.target.closest(".cachette");
    if (bouton) victoire(bouton);
  });
  $("victoire-fermer").addEventListener("click", fermerVictoire);
  document.addEventListener("keydown", (evenement) => {
    if (evenement.key === "Escape" && !$("victoire").hidden) fermerVictoire();
  });

  // ---------- Démarrage ----------

  $("nom-mariee").textContent = config.mariee;
  $("nom-marie").textContent = config.marie;
  $("arche-invitation").textContent = config.invitation;
  // La photo du merci : cachée si elle manque, plutôt qu'une image cassée.
  if (config.photoMerci) {
    $("merci-photo").addEventListener("error", () => montrer("merci-photo", false));
    $("merci-photo").src = config.photoMerci;
    montrer("merci-photo", true);
  }
  montrer("bandeau-demo", modeDemo);

  // ---------- La lettre ----------


  function ouvrirLettre() {
    const ouverture = $("ouverture");
    if (ouverture.classList.contains("ouverte")) return;
    ouverture.classList.add("ouverte");
    const reveler = () => {
      document.body.classList.remove("enveloppe-fermee");
      $("site").inert = false;
      ouverture.hidden = true;
      allerA(ETAPES[0]);
    };
    if (sansAnimation) {
      reveler();
      return;
    }
    // Le rythme suit styles.css : le médaillon s'efface, les battants
    // s'ouvrent (1,1 s) ; le feu d'artifice part quand ils s'écartent, puis
    // fondu vers le site.
    window.setTimeout(() => lancerFeuxDArtifice({ salves: 7, confettis: 120 }), 450);
    window.setTimeout(() => {
      $("site").classList.add("apparait");
      ouverture.classList.add("fin");
    }, 1150);
    window.setTimeout(reveler, 1750);
  }

  // Toucher le médaillon ouvre la porte en vitrail.
  $("medaillon").addEventListener("click", ouvrirLettre);

  montrer("acces-demo", modeDemo);
  if (modeDemo) $("acces-demo").textContent = `Mode démo : le mot de passe est ${config.motDePasseDemo}.`;
  $("champ-code").focus({ preventScroll: true });
})();

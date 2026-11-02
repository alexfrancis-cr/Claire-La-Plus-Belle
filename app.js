// Faire-part : charge le foyer correspondant au code, affiche seulement ce qui
// le concerne, et envoie sa réponse. Toutes les données affichées passent par
// textContent : rien de ce qui vient du tableur n'est interprété comme du HTML.
(function () {
  "use strict";

  const config = window.MARIAGE;
  const modeDemo = !config.apiUrl;
  const evenementsParId = new Map(config.evenements.map((evenement) => [evenement.id, evenement]));
  const PRECISER = "à préciser";

  const $ = (id) => document.getElementById(id);
  const sansAnimation = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let codeCourant = "";
  let foyerCourant = null;

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

  function montrer(id, visible) {
    $(id).hidden = !visible;
  }

  function normaliserCode(valeur) {
    return String(valeur || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  }

  function joindre(mots) {
    if (mots.length <= 1) return mots.join("");
    return mots.slice(0, -1).join(", ") + " et " + mots[mots.length - 1];
  }

  // ---------- Échanges avec le script Google (ou la démo) ----------

  async function chargerFoyer(code) {
    if (modeDemo) {
      const foyer = (window.DEMO_FOYERS || {})[code];
      if (!foyer) return { ok: false, erreur: "code_inconnu" };
      return {
        ok: true,
        foyer: {
          personnes: foyer.personnes.map((personne) => ({ ...personne, reponse: null })),
          message: "",
        },
      };
    }
    const url = new URL(config.apiUrl);
    url.searchParams.set("code", code);
    const reponse = await fetch(url.toString(), { method: "GET" });
    if (!reponse.ok) throw new Error("HTTP " + reponse.status);
    return reponse.json();
  }

  async function envoyerReponse(corps) {
    if (modeDemo) {
      await new Promise((resoudre) => setTimeout(resoudre, 400));
      return { ok: true };
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

  function evenementsDuFoyer(foyer) {
    const ids = new Set(foyer.personnes.flatMap((personne) => personne.evenements));
    return config.evenements.filter((evenement) => ids.has(evenement.id));
  }

  function nomAffiche(personne, rang) {
    if (personne.prenom) return [personne.prenom, personne.nom].filter(Boolean).join(" ");
    if (personne.type === "enfant") return rang.enfants > 1 ? `Votre enfant n° ${rang.enfant}` : "Votre enfant";
    return "Votre accompagnant·e";
  }

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
          el("p", {}, info.texte),
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

  function afficherFormulaire(foyer) {
    const enfants = foyer.personnes.filter((personne) => personne.type === "enfant" && !personne.prenom).length;
    let rangEnfant = 0;

    $("personnes").replaceChildren(
      ...foyer.personnes.map((personne) => {
        if (personne.type === "enfant" && !personne.prenom) rangEnfant += 1;
        const titre = nomAffiche(personne, { enfants, enfant: rangEnfant });
        const evenements = config.evenements.filter((evenement) => personne.evenements.includes(evenement.id));
        // Ce qu'on sait déjà est pré-rempli : l'invité confirme ou corrige.
        const champIdentite = (cle, libelle) =>
          el(
            "div",
            { class: "champ" },
            el("label", { for: `${cle}-${personne.id}` }, libelle),
            el("input", {
              id: `${cle}-${personne.id}`,
              name: `${cle}-${personne.id}`,
              type: "text",
              maxlength: "60",
              autocomplete: "off",
              value: personne[cle] || "",
            }),
          );
        return el(
          "fieldset",
          { class: "personne", "data-personne": personne.id },
          el("legend", {}, titre),
          el("div", { class: "identite" }, champIdentite("prenom", "Prénom"), champIdentite("nom", "Nom")),
          ...evenements.map((evenement) => questionPresence(personne, evenement)),
          questionRegime(personne),
        );
      }),
    );
    $("message").value = foyer.message || "";
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

  function afficherFoyer(foyer) {
    foyerCourant = foyer;
    const evenements = evenementsDuFoyer(foyer);
    const prenoms = foyer.personnes.map((personne) => personne.prenom).filter(Boolean);

    $("accueil").textContent = prenoms.length ? `Bonjour ${joindre(prenoms)} !` : "Bonjour !";
    if (prenoms.length) $("enveloppe-pour").textContent = `Pour ${joindre(prenoms)}`;
    afficherEnTete();
    afficherCompte();
    afficherProgramme(evenements);
    afficherInfos(evenements);
    afficherLots();
    afficherFormulaire(foyer);

    const dejaRepondu = foyer.personnes.some((personne) => personne.reponse);
    montrer("form-reponse", !dejaRepondu);
    montrer("merci", dejaRepondu);
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

  function accesAutorise(foyer) {
    const prenoms = foyer.personnes.map((personne) => personne.prenom).filter(Boolean);
    const acces = $("acces");
    acces.classList.remove("acces--refus");
    acces.classList.add("acces--ok");
    $("acces-statut").textContent = "Accès autorisé";
    $("erreur-code").textContent = "";
    $("acces-bienvenue").textContent = prenoms.length ? `Bienvenue ${joindre(prenoms)} !` : "Bienvenue !";
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

  async function ouvrir(code) {
    codeCourant = code;
    const bouton = $("bouton-acces");
    bouton.disabled = true;
    bouton.textContent = "Vérification…";
    $("erreur-code").textContent = "";
    try {
      const resultat = await chargerFoyer(code);
      if (!resultat.ok) {
        accesRefuse(
          resultat.erreur === "code_inconnu"
            ? "Ce code ne correspond à aucune invitation. Vérifiez-le, ou écrivez-nous."
            : "Impossible d'ouvrir cette invitation pour le moment. Réessayez dans un instant.",
        );
        return;
      }
      afficherFoyer(resultat.foyer);
      accesAutorise(resultat.foyer);
    } catch {
      accesRefuse("Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.");
    } finally {
      bouton.disabled = false;
      bouton.textContent = "Entrer";
    }
  }

  $("form-code").addEventListener("submit", (evenement) => {
    evenement.preventDefault();
    const code = normaliserCode($("champ-code").value);
    if (!code) {
      accesRefuse("Entrez le code reçu avec votre invitation.");
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("code", code);
    window.history.replaceState(null, "", url.toString());
    ouvrir(code);
  });

  // ---------- Envoi de la réponse ----------

  function lireReponses() {
    const formulaire = $("form-reponse");
    const manquants = [];
    const personnes = foyerCourant.personnes.map((personne) => {
      const presences = {};
      for (const idEvenement of personne.evenements) {
        const choix = formulaire.querySelector(`input[name="presence-${personne.id}-${idEvenement}"]:checked`);
        if (choix) presences[idEvenement] = choix.value;
        else manquants.push(`presence-${personne.id}-${idEvenement}`);
      }
      const regime = formulaire.querySelector(`#regime-${personne.id}`).value;
      const detail = formulaire.querySelector(`#regime-detail-${personne.id}`);
      return {
        id: personne.id,
        prenom: formulaire.querySelector(`#prenom-${personne.id}`).value.trim(),
        nom: formulaire.querySelector(`#nom-${personne.id}`).value.trim(),
        presences,
        regime,
        regimeDetail: regime.includes(PRECISER) ? detail.value.trim() : "",
      };
    });
    return { personnes, manquants };
  }

  $("form-reponse").addEventListener("submit", async (evenement) => {
    evenement.preventDefault();
    const erreur = $("erreur-reponse");
    erreur.textContent = "";
    const { personnes, manquants } = lireReponses();
    if (manquants.length) {
      erreur.textContent = "Indiquez pour chacun s'il sera présent ou absent.";
      document.querySelector(`[data-question="${manquants[0]}"] input`).focus();
      return;
    }

    const bouton = $("bouton-envoyer");
    bouton.disabled = true;
    bouton.textContent = "Envoi…";
    try {
      const resultat = await envoyerReponse({ code: codeCourant, personnes, message: $("message").value.trim() });
      if (!resultat.ok) throw new Error(resultat.erreur || "refus");
      foyerCourant.personnes = foyerCourant.personnes.map((personne) => {
        const reponse = personnes.find((r) => r.id === personne.id);
        return { ...personne, prenom: reponse.prenom || personne.prenom, nom: reponse.nom || personne.nom, reponse };
      });
      foyerCourant.message = $("message").value.trim();
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
    afficherFormulaire(foyerCourant);
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
            trouvee ? "✓ Vous participez" : `Photo n° ${lot.photo} à trouver`,
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

  async function signalerTrouvaille(photo) {
    if (modeDemo || !codeCourant || !foyerCourant) return null;
    const reponse = await fetch(config.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "trouve", code: codeCourant, photo }),
    });
    if (!reponse.ok) throw new Error("HTTP " + reponse.status);
    return reponse.json();
  }

  // Feu d'artifice et confettis sur un canvas plein écran, sans bibliothèque.
  // Les couleurs du vitrail : or, nacre, rose poudré, sauge.
  const COULEURS = ["#b48a4f", "#e9c98f", "#d9b77a", "#e3bfb0", "#f6e4dc", "#cfd9c2", "#8fa27f", "#fbf7f1"];
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
    if (foyerCourant) afficherLots();

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
    if (!foyerCourant) {
      $("victoire-texte").textContent = `Tu as trouvé une photo de Claire ! Ouvre ton invitation avec ton code pour participer au ${annonceLot}.`;
      return;
    }
    try {
      const resultat = await signalerTrouvaille(photo);
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

  // Le lien personnel pré-remplit le code ; l'invité valide lui-même l'accès.
  montrer("acces-demo", modeDemo);
  const codeUrl = normaliserCode(new URLSearchParams(window.location.search).get("code"));
  if (codeUrl) $("champ-code").value = codeUrl;
  $("champ-code").focus({ preventScroll: true });
})();

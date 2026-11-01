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
        foyer: { personnes: foyer.personnes.map((personne) => ({ ...personne, reponse: null })), message: "" },
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
    if (personne.prenom) return personne.prenom;
    if (personne.type === "enfant") return rang.enfants > 1 ? `Votre enfant n° ${rang.enfant}` : "Votre enfant";
    return "Votre accompagnant·e";
  }

  function afficherEnTete(evenements) {
    const dates = $("hero-dates");
    dates.replaceChildren();
    evenements.forEach((evenement, index) => {
      if (index > 0) dates.append(el("br"));
      dates.append(evenement.dateTexte);
    });
    if (evenements.length) dates.append(el("br"), config.annee);
  }

  function afficherProgramme(evenements) {
    $("liste-evenements").replaceChildren(
      ...evenements.map((evenement) =>
        el(
          "article",
          { class: "evenement" },
          el("h3", { class: "evenement__nom" }, evenement.nom),
          el("p", { class: "evenement__date" }, evenement.dateTexte),
          el("p", { class: "evenement__lieu" }, config.annee),
          evenement.horaires ? el("p", { class: "evenement__horaires" }, evenement.horaires) : null,
          evenement.carte
            ? el("a", { class: "lien", href: evenement.carte, target: "_blank", rel: "noopener" }, "Voir sur la carte")
            : null,
        ),
      ),
    );
  }

  function afficherInfos(evenements) {
    const ids = new Set(evenements.map((evenement) => evenement.id));
    const infos = config.infos.filter((info) => info.evenements.some((id) => ids.has(id)));
    $("liste-infos").replaceChildren(
      ...infos.map((info) => el("div", { class: "info" }, el("h3", {}, info.titre), el("p", {}, info.texte))),
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
        el("small", {}, `${evenement.dateTexte} ${config.annee}`),
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
        const idPrenom = `prenom-${personne.id}`;
        return el(
          "fieldset",
          { class: "personne", "data-personne": personne.id },
          el("legend", {}, titre),
          personne.prenom
            ? null
            : el(
                "div",
                { class: "champ" },
                el("label", { for: idPrenom }, "Prénom ", el("span", { class: "facultatif" }, "(facultatif)")),
                el("input", {
                  id: idPrenom,
                  name: idPrenom,
                  type: "text",
                  maxlength: "60",
                  autocomplete: "off",
                  value: personne.reponse?.prenom || "",
                }),
              ),
          ...evenements.map((evenement) => questionPresence(personne, evenement)),
          questionRegime(personne),
        );
      }),
    );
    $("message").value = foyer.message || "";
  }

  function afficherFoyer(foyer) {
    foyerCourant = foyer;
    const evenements = evenementsDuFoyer(foyer);
    const prenoms = foyer.personnes.map((personne) => personne.prenom).filter(Boolean);

    $("accueil").textContent = prenoms.length ? `Bonjour ${joindre(prenoms)} !` : "Bonjour !";
    if (prenoms.length) $("enveloppe-pour").textContent = `Pour ${joindre(prenoms)}`;
    afficherEnTete(evenements);
    afficherProgramme(evenements);
    afficherInfos(evenements);
    afficherFormulaire(foyer);

    const dejaRepondu = foyer.personnes.some((personne) => personne.reponse);
    montrer("form-reponse", !dejaRepondu);
    montrer("merci", dejaRepondu);
    if (dejaRepondu) $("merci-texte").textContent = "Nous avons bien votre réponse. Vous pouvez la modifier.";

    montrer("section-code", false);
    montrer("contenu-invite", true);
  }

  // ---------- Chargement par code ----------

  async function ouvrir(code) {
    codeCourant = code;
    $("erreur-code").textContent = "";
    montrer("chargement", true);
    try {
      const resultat = await chargerFoyer(code);
      if (!resultat.ok) {
        montrer("section-code", true);
        $("champ-code").value = code;
        $("erreur-code").textContent =
          resultat.erreur === "code_inconnu"
            ? "Ce code ne correspond à aucune invitation. Vérifiez-le, ou écrivez-nous."
            : "Impossible d'ouvrir cette invitation pour le moment. Réessayez dans un instant.";
        return;
      }
      afficherFoyer(resultat.foyer);
    } catch {
      montrer("section-code", true);
      $("champ-code").value = code;
      $("erreur-code").textContent = "Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.";
    } finally {
      montrer("chargement", false);
    }
  }

  $("form-code").addEventListener("submit", (evenement) => {
    evenement.preventDefault();
    const code = normaliserCode($("champ-code").value);
    if (!code) {
      $("erreur-code").textContent = "Entrez le code reçu avec votre invitation.";
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
      const prenom = formulaire.querySelector(`#prenom-${personne.id}`);
      return {
        id: personne.id,
        prenom: prenom ? prenom.value.trim() : "",
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
      foyerCourant.personnes = foyerCourant.personnes.map((personne) => ({
        ...personne,
        reponse: personnes.find((reponse) => reponse.id === personne.id),
      }));
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

  // ---------- Démarrage ----------

  $("nom-mariee").textContent = config.mariee;
  $("nom-marie").textContent = config.marie;
  $("hero-lieu").textContent = config.lieu;
  montrer("bandeau-demo", modeDemo);

  // ---------- La lettre ----------

  const sansAnimation = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ouvrirLettre() {
    const ouverture = $("ouverture");
    if (ouverture.classList.contains("ouverte")) return;
    ouverture.classList.add("ouverte");
    const reveler = () => {
      document.body.classList.remove("enveloppe-fermee");
      $("site").inert = false;
      ouverture.hidden = true;
      if ($("section-code").hidden) {
        $("accueil").setAttribute("tabindex", "-1");
        $("accueil").focus({ preventScroll: true });
      } else {
        $("champ-code").focus({ preventScroll: true });
      }
    };
    // Durée totale de l'animation (rabat, lettre, fondu) : voir styles.css.
    if (sansAnimation) reveler();
    else window.setTimeout(reveler, 2400);
  }

  $("sceau").addEventListener("click", ouvrirLettre);

  const codeUrl = normaliserCode(new URLSearchParams(window.location.search).get("code"));
  if (codeUrl) ouvrir(codeUrl);
  else montrer("section-code", true);
})();

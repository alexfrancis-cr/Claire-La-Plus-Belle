// Tout ce qui change souvent est ici : titre, lieu, dates, infos pratiques,
// et l'adresse du script Google qui reçoit les réponses.
window.MARIAGE = {
  mariee: "Claire la plus belle",
  marie: "Alex",
  lieu: "Angresse",
  // Affiché sous vos noms, sur le premier écran.
  // Sous vos noms, sur le premier écran.
  invitation: "ont la joie de vous inviter à leur mariage",
  periode: ["Du vendredi 23 au dimanche 25 juillet 2027 · Angresse"],
  // Pour le compte à rebours.
  dateMariage: "2027-07-24",
  annee: "2027",

  // Adresse de l'application Google Apps Script (voir apps-script/README.md).
  // Laisser vide pour le mode démo : le site utilise alors les foyers fictifs
  // de demo.js et n'envoie aucune réponse.
  apiUrl: "",

  // Un foyer ne voit que les moments auxquels au moins une de ses personnes
  // est invitée (colonnes invite_arrivee / invite_mariage / invite_brunch).
  // Pour l'instant, seulement les dates : « horaires » et « carte » restent
  // vides et ne s'affichent pas.
  evenements: [
    {
      id: "arrivee",
      nom: "Soirée d'arrivée",
      dateTexte: "Vendredi 23 juillet",
      jour: "23",
      jourSemaine: "Vendredi",
      mois: "juillet",
      horaires: "",
      carte: "",
    },
    {
      id: "mariage",
      nom: "Mariage",
      dateTexte: "Samedi 24 juillet",
      jour: "24",
      jourSemaine: "Samedi",
      mois: "juillet",
      lieu: "Église de Hossegor",
      horaires: "",
      carte: "",
    },
    {
      id: "brunch",
      nom: "Brunch",
      dateTexte: "Dimanche 25 juillet",
      jour: "25",
      jourSemaine: "Dimanche",
      mois: "juillet",
      horaires: "",
      carte: "",
    },
  ],

  // Chaque bloc s'affiche seulement si le foyer est invité à l'un des
  // moments listés.
  infos: [
    {
      titre: "Hébergement",
      evenements: ["arrivee", "mariage", "brunch"],
      texte: "Nos adresses à Angresse et aux alentours arrivent bientôt.",
    },
    {
      titre: "Tenue",
      evenements: ["arrivee", "mariage", "brunch"],
      texte: "À venir.",
    },
    {
      titre: "Liste de mariage",
      evenements: ["arrivee", "mariage", "brunch"],
      texte: "À venir.",
    },
  ],

  // Le jeu : trois photos de Claire cachées, invisibles, sur le site. Chaque
  // foyer qui trouve une photo est inscrit (Google Sheet, feuille
  // « Trouvailles ») au tirage au sort du lot de cette photo.
  jeu: {
    photos: {
      1: "jeu/claire-1.jpg",
      2: "jeu/claire-2.jpg",
      3: "jeu/claire-3.jpg",
    },
    // Des boosters super rares : affiché sur chaque carte de lot.
    rarete: "Super rare ✨",
    lots: [
      { photo: "1", nom: "Booster Pokémon Team Up", image: "jeu/lot-1.jpg" },
      { photo: "2", nom: "Booster Pokémon Générations", image: "jeu/lot-2.png" },
      { photo: "3", nom: "Lot de 6 boosters Méga-Évolution Héros Transcendants", image: "jeu/lot-3.jpg" },
    ],
  },

  regimes: [
    "Aucun",
    "Végétarien",
    "Végétalien",
    "Sans gluten",
    "Sans porc",
    "Allergie (à préciser)",
    "Autre (à préciser)",
  ],
};

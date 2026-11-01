// Tout ce qui change souvent est ici : titre, lieu, dates, infos pratiques,
// et l'adresse du script Google qui reçoit les réponses.
window.MARIAGE = {
  mariee: "Claire la plus belle",
  marie: "Alex",
  lieu: "Hossegor",
  annee: "2027",

  // Adresse de l'application Google Apps Script (voir apps-script/README.md).
  // Laisser vide pour le mode démo : le site utilise alors les foyers fictifs
  // de demo.js et n'envoie aucune réponse.
  apiUrl: "",

  // Deux listes : un foyer ne voit que les moments auxquels au moins une de
  // ses personnes est invitée (colonnes invite_arrivee / invite_mariage).
  // Pour l'instant, seulement les dates : « horaires » et « carte » restent
  // vides et ne s'affichent pas.
  evenements: [
    {
      id: "arrivee",
      nom: "Soirée d'arrivée",
      dateTexte: "Vendredi 23 juillet",
      horaires: "",
      carte: "",
    },
    {
      id: "mariage",
      nom: "Mariage",
      dateTexte: "Samedi 24 juillet",
      horaires: "",
      carte: "",
    },
  ],

  // Chaque bloc s'affiche seulement si le foyer est invité à l'un des
  // moments listés.
  infos: [
    {
      titre: "Hébergement",
      evenements: ["arrivee", "mariage"],
      texte: "Nos adresses à Hossegor et aux alentours arrivent bientôt.",
    },
    {
      titre: "Tenue",
      evenements: ["arrivee", "mariage"],
      texte: "À venir.",
    },
    {
      titre: "Liste de mariage",
      evenements: ["arrivee", "mariage"],
      texte: "À venir.",
    },
  ],

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

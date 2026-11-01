// Foyers FICTIFS pour le mode démo (quand apiUrl est vide dans config.js).
// Aucun vrai invité ici : la vraie liste ne doit jamais être publiée.
//
// Tout le monde est invité à la soirée d'arrivée et au mariage.
// Essayer :  index.html?code=DEMOMARI   un couple
//            index.html?code=DEMODEUX   un adulte, son +1 et un enfant
//            index.html?code=DEMOBLAG   la page secrète de la blague
//            index.html                 sans code : la page d'accès demande le code
window.DEMO_FOYERS = {
  DEMOMARI: {
    personnes: [
      { id: "D001", prenom: "Octave", nom: "Bellerose", type: "adulte", evenements: ["arrivee", "mariage"] },
      { id: "D002", prenom: "Sidonie", nom: "Bellerose", type: "adulte", evenements: ["arrivee", "mariage"] },
    ],
  },
  // La blague, en démo : Gaspard reçoit le code d'Anatole.
  DEMOBLAG: {
    personnes: [{ id: "D006", prenom: "Gaspard", nom: "Lierre", type: "adulte", evenements: ["arrivee", "mariage"] }],
    blague: { code: "DEMODEUX", prenom: "Anatole" },
  },
  DEMODEUX: {
    personnes: [
      { id: "D003", prenom: "Anatole", nom: "Fougère", type: "adulte", evenements: ["arrivee", "mariage"] },
      { id: "D004", prenom: "", nom: "", type: "accompagnant", evenements: ["arrivee", "mariage"] },
      { id: "D005", prenom: "", nom: "Fougère", type: "enfant", evenements: ["arrivee", "mariage"] },
    ],
  },
};

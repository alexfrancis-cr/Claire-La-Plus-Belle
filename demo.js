// Foyers FICTIFS pour le mode démo (quand apiUrl est vide dans config.js).
// Aucun vrai invité ici : la vraie liste ne doit jamais être publiée.
//
// Tout le monde est invité à la soirée d'arrivée et au mariage.
// Essayer :  index.html?code=DEMOMARI   un couple
//            index.html?code=DEMODEUX   un adulte, son +1 et un enfant
//            index.html                 sans code : la page d'accès demande le code
window.DEMO_FOYERS = {
  DEMOMARI: {
    personnes: [
      { id: "D001", prenom: "Octave", type: "adulte", evenements: ["arrivee", "mariage"] },
      { id: "D002", prenom: "Sidonie", type: "adulte", evenements: ["arrivee", "mariage"] },
    ],
  },
  DEMODEUX: {
    personnes: [
      { id: "D003", prenom: "Anatole", type: "adulte", evenements: ["arrivee", "mariage"] },
      { id: "D004", prenom: "", type: "accompagnant", evenements: ["arrivee", "mariage"] },
      { id: "D005", prenom: "", type: "enfant", evenements: ["arrivee", "mariage"] },
    ],
  },
};

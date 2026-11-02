// Foyers FICTIFS pour le mode démo (quand apiUrl est vide dans config.js).
// Aucun vrai invité ici : la vraie liste ne doit jamais être publiée.
//
// Tout le monde est invité à la soirée d'arrivée, au mariage et au brunch.
// Essayer :  index.html?code=DEMOMARI   un couple
//            index.html?code=DEMODEUX   un adulte, son +1 et un enfant
//            index.html                 sans code : la page d'accès demande le code
window.DEMO_FOYERS = {
  DEMOMARI: {
    personnes: [
      { id: "D001", prenom: "Octave", nom: "Bellerose", type: "adulte", evenements: ["arrivee", "mariage", "brunch"] },
      { id: "D002", prenom: "Sidonie", nom: "Bellerose", type: "adulte", evenements: ["arrivee", "mariage", "brunch"] },
    ],
  },
  DEMODEUX: {
    personnes: [
      { id: "D003", prenom: "Anatole", nom: "Fougère", type: "adulte", evenements: ["arrivee", "mariage", "brunch"] },
      { id: "D004", prenom: "", nom: "", type: "accompagnant", evenements: ["arrivee", "mariage", "brunch"] },
      { id: "D005", prenom: "", nom: "Fougère", type: "enfant", evenements: ["arrivee", "mariage", "brunch"] },
    ],
  },
};

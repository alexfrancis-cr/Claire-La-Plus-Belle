// Foyers FICTIFS pour le mode démo (quand apiUrl est vide dans config.js).
// Aucun vrai invité ici : la vraie liste ne doit jamais être publiée.
//
// Essayer :  index.html?code=DEMOMARI   invité au mariage seulement
//            index.html?code=DEMODEUX   invité aux deux, avec un +1 et un enfant
//            index.html                 sans code : la lettre demande le code
window.DEMO_FOYERS = {
  DEMOMARI: {
    personnes: [
      { id: "D001", prenom: "Octave", type: "adulte", evenements: ["mariage"] },
      { id: "D002", prenom: "Sidonie", type: "adulte", evenements: ["mariage"] },
    ],
  },
  DEMODEUX: {
    personnes: [
      { id: "D003", prenom: "Anatole", type: "adulte", evenements: ["arrivee", "mariage"] },
      { id: "D004", prenom: "", type: "accompagnant", evenements: ["arrivee", "mariage"] },
      { id: "D005", prenom: "", type: "enfant", evenements: ["mariage"] },
    ],
  },
};

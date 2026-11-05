// Tout ce qui change souvent est ici : titre, lieu, dates, infos pratiques,
// et l'adresse du script Google qui reçoit les réponses.
window.MARIAGE = {
  mariee: "Claire la plus belle",
  marie: "Alex",
  lieu: "Angresse",
  // Affiché sous vos noms, sur le premier écran.
  // Sous vos noms, sur le premier écran.
  invitation: "ont la joie de vous inviter à leur mariage",
  // Une ligne par élément : la date sur une ligne, le lieu en dessous.
  periode: ["Du vendredi 23 au dimanche 25 juillet 2027", "Angresse"],
  // Pour le compte à rebours.
  dateMariage: "2027-07-24",
  annee: "2027",

  // Adresse de l'application Google Apps Script (voir README.md). Le mot de
  // passe n'est jamais écrit ici (ce fichier est public) : c'est le script
  // qui le vérifie (Propriétés du script → MOT_DE_PASSE).
  apiUrl: "https://script.google.com/macros/s/AKfycbwmxgB18_k9C2eSbkKkuQQR0yO2Ia9swcrVIYHKpdjncu5EjtbZpk4Dh1qi_6A795gx/exec",

  // Tout le monde est invité aux trois moments. Pour l'instant, seulement
  // les dates : « horaires » et « carte » restent vides et ne s'affichent pas.
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

  // Les infos pratiques, sous le programme.
  infos: [
    {
      titre: "Hébergement",
      evenements: ["arrivee", "mariage", "brunch"],
      texte: "Hossegor, Capbreton, Angresse, Seignosse",
    },
    {
      titre: "Tenue",
      evenements: ["arrivee", "mariage", "brunch"],
      texte: "Un camaïeu d'été",
      // Une fleur par couleur : clair, la couleur, foncé (le cœur de la rose).
      couleurs: [
        { nom: "Terracotta", teintes: ["#f1c3ab", "#d27d55", "#a9502e"] },
        { nom: "Orange", teintes: ["#f9d2b2", "#e9975f", "#c46f35"] },
        { nom: "Jaune", teintes: ["#fae7b8", "#eec36a", "#c99a3c"] },
        { nom: "Lin", teintes: ["#fbf5ec", "#eadbc4", "#c9b495"] },
      ],
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

  // L'écran de remerciement, après la réponse. Laisser vide : pas de photo.
  photoMerci: "merci/nous.jpg",

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

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
      photoCachee: "2", // le jeu : une zone invisible dans ce bloc cache la photo 2
    },
    {
      titre: "Liste de mariage",
      evenements: ["arrivee", "mariage"],
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
    lots: [
      { photo: "1", nom: "Booster Pokémon Team Up", image: "jeu/lot-1.jpg" },
      { photo: "2", nom: "Booster Pokémon Générations", image: "jeu/lot-2.png" },
      { photo: "3", nom: "Lot de 6 boosters Méga-Évolution Héros Transcendants", image: "jeu/lot-3.jpg" },
    ],
  },

  // La page « Ton Pokémon ». Les images vont dans site/pokemon/ ; tant qu'un
  // fichier manque, la carte affiche l'initiale du Pokémon.
  // L'identifiant (id) doit rester celui de POKEMONS dans apps-script/Code.gs.
  pokemons: [
    { id: "pikachu", nom: "Pikachu", image: "pokemon/pikachu.png" },
    { id: "psykokwak", nom: "Psykokwak", image: "pokemon/psykokwak.png" },
    { id: "salameche", nom: "Salamèche", image: "pokemon/salameche.png" },
    { id: "carapuce", nom: "Carapuce", image: "pokemon/carapuce.png" },
    { id: "imposteur", nom: "Pikachu imposteur", image: "pokemon/imposteur.png" },
    { id: "rondoudou", nom: "Rondoudou", image: "pokemon/rondoudou.png" },
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

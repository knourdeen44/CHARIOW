/*
 * fallback.js — Générateur SANS IA (mode repli).
 * Sert quand il n'y a pas de clé API ou que le quota gratuit est atteint.
 * Utilise des modèles variés + un peu de hasard pour ne jamais répéter la même pub.
 */

const Fallback = (() => {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const accroches = {
    "avant-après": [
      "Avant : des calculs sur un cahier 😩. Après : tout est clair en 2 minutes 📊",
      "De la galère du cahier au tableau de bord pro en un clic.",
    ],
    témoignage: [
      "« Depuis que j'utilise ce fichier, je connais enfin mon vrai bénéfice. »",
      "Une cliente m'a dit : « C'est comme avoir un comptable dans mon téléphone. »",
    ],
    démo: [
      "Regarde comme c'est simple : tu remplis, tout se calcule tout seul.",
      "3 colonnes à remplir, et ton bénéfice s'affiche automatiquement.",
    ],
    question: [
      "Tu sais exactement combien tu gagnes chaque mois ? 🤔",
      "Et si gérer ta boutique te prenait 5 minutes par jour seulement ?",
    ],
  };

  function ad(produit, plateforme, angle) {
    const a = accroches[angle] || accroches["démo"];
    const prix = `${produit.prix} ${produit.devise || "FCFA"}`;
    return {
      accroche: pick(a),
      corps: `${produit.nom} : ${produit.description || "gère ton commerce sans te casser la tête"}. Tout est automatique, fait pour le ${produit.categorie.toLowerCase()}. Prix : ${prix}.`,
      cta: pick([
        "Écris-moi « EXCEL » pour recevoir le lien 👇",
        "Clique sur le lien en bio pour l'avoir maintenant.",
        "Envoie « INFO » en privé, je te montre tout.",
      ]),
      texteEcran: pick([
        "Gère ta boutique facilement 📊",
        "Stop aux calculs à la main ✋",
        `Spécial ${produit.categorie} 🔥`,
      ]),
      ideeVisuel:
        angle === "avant-après"
          ? "Filme un cahier raturé, puis l'écran Excel propre."
          : "Montre l'écran du fichier en train de calculer tout seul.",
    };
  }

  function plan(produits) {
    const jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
    const plateformes = ["TikTok", "WhatsApp Status", "Facebook"];
    const angles = ["avant-après", "témoignage", "démo", "question"];
    return jours.map((jour, i) => {
      const p = produits[i % Math.max(produits.length, 1)] || { nom: "Mon produit" };
      return {
        jour,
        plateforme: plateformes[i % plateformes.length],
        produit: p.nom,
        angle: angles[i % angles.length],
        idee: `Mettre en avant ${p.nom} avec un angle « ${angles[i % angles.length]} ».`,
      };
    });
  }

  function relance(client, produit, montant, dateLimite) {
    return {
      message: `Bonjour ${client} 🙂, tu étais intéressé(e) par « ${produit} » (${montant} FCFA). Il est toujours dispo, je peux te le réserver jusqu'à ${dateLimite}. On valide ?`,
    };
  }

  return { ad, plan, relance };
})();

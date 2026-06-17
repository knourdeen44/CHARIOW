/*
 * ai.js — Client IA pour le navigateur (OpenRouter).
 *
 * La clé API n'est JAMAIS dans le code. Elle est saisie par toi dans la page "Réglages"
 * et stockée uniquement dans ton navigateur (localStorage).
 *
 * S'il n'y a pas de clé, ou si le quota gratuit est atteint, on utilise un GÉNÉRATEUR
 * DE REPLI (templates variés) pour que le site marche quand même, sans crash.
 */

const AI = (() => {
  const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
  // Cascade de modèles gratuits : si l'un est saturé (429), on bascule sur le suivant.
  const FREE_MODELS = [
    "openai/gpt-oss-120b:free",
    "google/gemma-4-31b-it:free",
    "openai/gpt-oss-20b:free",
    "meta-llama/llama-3.3-70b-instruct:free",
  ];

  function hasKey() {
    return !!Store.settings.get("openrouter_key");
  }

  async function callModel(key, model, systemPrompt, userPrompt) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
        "HTTP-Referer": location.origin,
        "X-Title": "Agent Chariow",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.9,
      }),
    });

    if (res.status === 401) throw new Error("Clé API invalide. Vérifie ta clé OpenRouter dans Réglages.");
    if (res.status === 429) throw new Error("RATE_LIMIT");
    if (!res.ok) throw new Error("Erreur IA (" + res.status + ").");

    const data = await res.json();
    const txt = data?.choices?.[0]?.message?.content?.trim();
    if (!txt) throw new Error("Réponse IA vide.");
    return txt;
  }

  // Appel générique : essaie le modèle perso (Réglages) puis la cascade gratuite.
  async function chat(systemPrompt, userPrompt) {
    const key = Store.settings.get("openrouter_key");
    if (!key) throw new Error("NO_KEY");

    const custom = Store.settings.get("openrouter_model");
    const models = [custom, ...FREE_MODELS].filter(Boolean);
    let lastErr;
    for (const model of models) {
      try {
        return await callModel(key, model, systemPrompt, userPrompt);
      } catch (e) {
        lastErr = e;
        if (e.message === "RATE_LIMIT") continue;
        throw e;
      }
    }
    throw new Error("Tous les modèles gratuits sont saturés. Réessaie dans un instant.");
  }

  // --- Prompts métier -------------------------------------------------------

  const SYSTEM = `Tu es un expert en marketing pour des petits commerçants en Afrique francophone (FCFA).
Tu écris des publicités courtes, simples, percutantes et chaleureuses, prêtes à copier-coller.
Tu varies toujours le style pour ne jamais répéter deux fois la même chose.
Tu réponds UNIQUEMENT en JSON valide, sans texte autour.`;

  function adPrompt(produit, plateforme, angle) {
    return `Génère une publicité pour la plateforme "${plateforme}", angle "${angle}".
Produit : ${produit.nom} (catégorie ${produit.categorie}), prix ${produit.prix} ${produit.devise || "FCFA"}.
Description : ${produit.description || ""}
Lien : ${produit.lienChariow || ""}

Réponds en JSON avec EXACTEMENT ces clés :
{
  "accroche": "phrase d'accroche qui stoppe le scroll",
  "corps": "2-4 phrases qui donnent envie",
  "cta": "appel à l'action clair (ex: écris-moi EXCEL)",
  "texteEcran": "texte court à afficher sur la vidéo/image",
  "ideeVisuel": "idée concrète de visuel à filmer ou créer"
}`;
  }

  function planPrompt(produits) {
    const liste = produits.map((p) => `- ${p.nom} (${p.categorie})`).join("\n");
    return `Crée un plan de publication sur 7 jours (lundi à dimanche) équilibré entre les plateformes
TikTok, Facebook et WhatsApp Status, pour ces produits :
${liste}

Réponds en JSON : un tableau de 7 objets avec les clés :
{ "jour": "Lundi", "plateforme": "TikTok", "produit": "nom du produit", "angle": "avant-après|témoignage|démo|question", "idee": "idée en une phrase" }`;
  }

  function relancePrompt(client, produit, montant, dateLimite) {
    return `Rédige un message WhatsApp de relance, chaleureux et non insistant, pour récupérer une vente.
Client : ${client}. Produit : ${produit}. Montant : ${montant} FCFA. Date limite : ${dateLimite}.
Réponds en JSON : { "message": "le texte du message" }`;
  }

  // Extrait le premier bloc JSON d'une réponse (au cas où le modèle ajoute du texte).
  function parseJSON(txt) {
    try {
      return JSON.parse(txt);
    } catch {
      const start = txt.indexOf("{") >= 0 ? txt.indexOf("{") : txt.indexOf("[");
      const end = Math.max(txt.lastIndexOf("}"), txt.lastIndexOf("]"));
      if (start >= 0 && end > start) return JSON.parse(txt.slice(start, end + 1));
      throw new Error("Réponse IA illisible.");
    }
  }

  return { hasKey, chat, adPrompt, planPrompt, relancePrompt, parseJSON, SYSTEM };
})();

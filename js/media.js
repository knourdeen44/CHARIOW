/*
 * media.js — Génération d'IMAGES gratuite, sans clé (Pollinations.ai).
 *
 * Pourquoi Pollinations : c'est l'une des rares solutions 100 % gratuites, sans compte
 * ni clé API, et utilisable directement depuis un site statique (l'image est une simple URL).
 * Parfait pour GitHub Pages. Aucune clé à protéger.
 *
 * Format adapté à chaque plateforme :
 *   - TikTok / WhatsApp Status / Reels : vertical 9:16
 *   - Facebook : carré 1:1
 */

const Media = (() => {
  const BASE = "https://image.pollinations.ai/prompt/";

  function sizeFor(plateforme = "") {
    if (/tiktok|status|reel|short/i.test(plateforme)) return { w: 768, h: 1344 }; // 9:16
    if (/facebook|feed/i.test(plateforme)) return { w: 1200, h: 1200 }; // 1:1
    return { w: 1024, h: 1024 };
  }

  // Construit l'URL de l'image (sans texte, car ces modèles écrivent mal le texte :
  // ton accroche/CTA s'ajoutent par-dessus dans l'app de montage ou Canva).
  function imageUrl(prompt, plateforme, seed) {
    const { w, h } = sizeFor(plateforme);
    const clean = (prompt || "").replace(/\s+/g, " ").trim().slice(0, 400);
    const s = seed ?? Math.floor(Math.random() * 1e6);
    return (
      BASE +
      encodeURIComponent(clean) +
      `?width=${w}&height=${h}&model=flux&nologo=true&seed=${s}`
    );
  }

  // Prompt visuel à partir de la pub générée + du produit.
  function buildPrompt(ad, produit) {
    const base = ad?.ideeVisuel || `publicité pour ${produit?.nom || "un produit"}`;
    return `${base}. Publicité moderne pour ${produit?.nom || ""} (${produit?.categorie || ""}), couleurs vives vert et ambre, style professionnel, photographie réaliste, haute qualité, SANS texte, sans lettres`;
  }

  return { imageUrl, buildPrompt, sizeFor };
})();

#!/usr/bin/env node
/*
 * publish-meta.js — Publie automatiquement le contenu du jour sur Facebook + Instagram.
 *
 * Fonctionne en 2 temps (à cause de l'hébergement de l'image pour Instagram) :
 *   1) node agent/publish-meta.js prepare
 *        -> choisit la pub du jour, génère l'image (pour Insta), écrit data/publish-pending.json
 *      (le workflow committe ensuite assets/ + le pending, pour que l'image soit accessible)
 *   2) node agent/publish-meta.js post
 *        -> publie sur Facebook (texte) et Instagram (image + légende), journalise, nettoie
 *
 * Jetons (Secrets GitHub, jamais dans le code) :
 *   META_PAGE_ID, META_PAGE_TOKEN  (Facebook)   |  IG_USER_ID (Instagram, facultatif)
 *
 * Sans jetons -> messages clairs, aucune publication, aucun crash.
 */

import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { postFacebook, postInstagram } from "./lib/meta.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...x) => join(ROOT, ...x);
const readJSON = async (f, d) => {
  try {
    return JSON.parse(await readFile(p(f), "utf8"));
  } catch {
    return d;
  }
};
const writeJSON = (f, data) => writeFile(p(f), JSON.stringify(data, null, 2) + "\n", "utf8");

const IMG_PATH = "assets/pub-latest.jpg";

// Construit la légende complète à partir d'une publication.
function buildCaption(pub, lien) {
  const parts = [pub.accroche, "", pub.corps, "", pub.cta];
  if (lien) parts.push("", "👉 " + lien);
  parts.push("", "#business #FCFA #entrepreneur #commerce");
  return parts.filter((x) => x !== undefined).join("\n");
}

// Génère une image via Pollinations (côté serveur, ça fonctionne) et l'enregistre.
async function generateImage(pub) {
  const prompt = `${pub.ideeVisuel || "publicité"}. Publicité moderne, couleurs vives, professionnel, sans texte`;
  const url =
    "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(prompt.slice(0, 350)) +
    "?width=1080&height=1080&model=flux&nologo=true&seed=" +
    Math.floor(Math.random() * 1e6);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Génération image échouée (HTTP " + res.status + ")");
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(p("assets"), { recursive: true });
  await writeFile(p(IMG_PATH), buf);
  return IMG_PATH;
}

// URL publique immédiate de l'image (raw GitHub, dispo dès le push, sans build Pages).
function rawImageUrl() {
  const repo = process.env.GITHUB_REPOSITORY || "knourdeen44/CHARIOW";
  const branch = process.env.GITHUB_REF_NAME || "main";
  return `https://raw.githubusercontent.com/${repo}/${branch}/${IMG_PATH}`;
}

// ---- ÉTAPE 1 : préparation -------------------------------------------------
async function prepare() {
  const products = await readJSON("data/products.json", []);
  const queue = await readJSON("data/queue.json", {});
  const pubs = queue.publicationsDuJour || [];
  const pub = pubs.find((x) => !x.publieAuto);

  if (!pub) {
    console.log("ℹ️  Aucune pub du jour à publier (queue vide). Rien à préparer.");
    return;
  }

  const igActif = !!process.env.IG_USER_ID;
  let imagePath = null;
  if (igActif) {
    try {
      imagePath = await generateImage(pub);
      console.log("🖼️  Image générée pour Instagram :", imagePath);
    } catch (e) {
      console.warn("⚠️  Image non générée (" + e.message + ") — Instagram sera ignoré.");
    }
  }

  const lien = products.find((pr) => pr.id === pub.produitId)?.lienChariow || "";
  await writeJSON("data/publish-pending.json", {
    creePour: pub.jour,
    plateforme: pub.plateforme,
    produitId: pub.produitId,
    message: [pub.accroche, "", pub.corps, "", pub.cta, lien ? "\n👉 " + lien : ""].join("\n"),
    caption: buildCaption(pub, lien),
    imagePath,
    fb: true,
    ig: igActif && !!imagePath,
  });
  console.log("✅ Préparation OK. (FB:", true, "| IG:", igActif && !!imagePath, ")");
}

// ---- ÉTAPE 2 : publication -------------------------------------------------
async function post() {
  if (!existsSync(p("data/publish-pending.json"))) {
    console.log("ℹ️  Rien en attente de publication.");
    return;
  }
  const pending = await readJSON("data/publish-pending.json", null);
  if (!pending) return;

  const pageId = process.env.META_PAGE_ID;
  const token = process.env.META_PAGE_TOKEN;
  const igUserId = process.env.IG_USER_ID;

  if (!pageId || !token) {
    console.log("ℹ️  META_PAGE_ID / META_PAGE_TOKEN absents — publication ignorée.");
    console.log("    Ajoute-les dans les Secrets GitHub (voir docs/META_SETUP.md).");
    return;
  }

  const results = [];

  // Facebook
  if (pending.fb) {
    try {
      const id = await postFacebook({ pageId, token, message: pending.message });
      results.push("Facebook OK (" + id + ")");
      console.log("📘 Publié sur Facebook :", id);
    } catch (e) {
      results.push("Facebook ÉCHEC : " + e.message);
      console.error("❌ Facebook :", e.message);
    }
  }

  // Instagram
  if (pending.ig && igUserId && pending.imagePath) {
    try {
      const id = await postInstagram({
        igUserId,
        token,
        imageUrl: rawImageUrl(),
        caption: pending.caption,
      });
      results.push("Instagram OK (" + id + ")");
      console.log("📸 Publié sur Instagram :", id);
    } catch (e) {
      results.push("Instagram ÉCHEC : " + e.message);
      console.error("❌ Instagram :", e.message);
    }
  }

  // Marque la pub comme publiée + journalise
  const queue = await readJSON("data/queue.json", {});
  const pub = (queue.publicationsDuJour || []).find(
    (x) => x.produitId === pending.produitId && x.jour === pending.creePour
  );
  if (pub) pub.publieAuto = true;
  await writeJSON("data/queue.json", queue);

  const activity = await readJSON("data/activity.json", []);
  activity.unshift({
    date: new Date().toISOString(),
    acteur: "agent",
    action: "Publication automatique — " + results.join(" ; "),
  });
  await writeJSON("data/activity.json", activity.slice(0, 200));

  // Nettoie le pending
  await rm(p("data/publish-pending.json"), { force: true });
  console.log("✅ Terminé :", results.join(" ; "));
}

const mode = process.argv[2];
const run = mode === "post" ? post : mode === "prepare" ? prepare : null;
if (!run) {
  console.error("Usage : node agent/publish-meta.js [prepare|post]");
  process.exit(1);
}
run().catch((e) => {
  console.error("Erreur publication :", e.message);
  process.exit(1);
});

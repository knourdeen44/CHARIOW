#!/usr/bin/env node
/*
 * run.js — Agent autonome.
 *
 * Ce que fait l'agent (en local OU via GitHub Actions chaque matin) :
 *   1. Lit les produits (data/products.json).
 *   2. Génère le CONTENU PUB DU JOUR (1 à 2 publications) -> data/queue.json
 *   3. Prépare des RELANCES proposées (si des ventes "à relancer" existent).
 *   4. Journalise tout dans data/activity.json (visible dans l'onglet "Activité" du site).
 *
 * Sécurité : la clé API vient de OPENROUTER_API_KEY (GitHub Secret), jamais en dur.
 * Robustesse : si pas de clé ou quota atteint -> mode REPLI (templates), aucun crash.
 *
 * Lancer en local :   node agent/run.js
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { hasKey, chat, parseJSON } from "./lib/provider.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = (f) => join(ROOT, "data", f);

const SYSTEM = `Tu es un expert marketing pour petits commerçants en Afrique francophone (FCFA).
Tu écris des publicités courtes, simples, chaleureuses, prêtes à copier-coller, toujours variées.
Tu réponds UNIQUEMENT en JSON valide, sans texte autour.`;

// ---------- Lecture / écriture JSON ----------
async function readJSON(file, def) {
  try {
    return JSON.parse(await readFile(DATA(file), "utf8"));
  } catch {
    return def;
  }
}
async function writeJSON(file, data) {
  await writeFile(DATA(file), JSON.stringify(data, null, 2) + "\n", "utf8");
}

// ---------- Repli sans IA ----------
const pick = (a) => a[Math.floor(Math.random() * a.length)];
function fallbackAd(p, plateforme, angle) {
  return {
    accroche: pick([
      `${angle === "question" ? "Tu sais combien tu gagnes vraiment ?" : "Arrête de tout noter sur un cahier 😩"}`,
      `Spécial ${p.categorie} : gère tout en 2 minutes 📊`,
      `« Ce fichier a changé ma façon de gérer ma boutique. »`,
    ]),
    corps: `${p.nom} : ${p.description || "tout se calcule automatiquement"}. Prix ${p.prix} ${p.devise || "FCFA"}.`,
    cta: pick(["Écris-moi « EXCEL » pour le lien 👇", "Lien en bio.", "Envoie « INFO » en privé."]),
    texteEcran: pick(["Gère ta boutique facilement 📊", "Stop aux calculs à la main ✋"]),
    ideeVisuel: "Montre l'écran Excel qui calcule tout seul, ou un avant/après cahier vs tableau.",
  };
}

// ---------- Génération d'une publication ----------
async function genPublication(produit, plateforme, angle) {
  const prompt = `Génère une publicité pour "${plateforme}", angle "${angle}".
Produit : ${produit.nom} (${produit.categorie}), prix ${produit.prix} ${produit.devise || "FCFA"}.
Description : ${produit.description || ""}
Réponds en JSON: {"accroche","corps","cta","texteEcran","ideeVisuel"}`;
  if (hasKey()) {
    try {
      return { mode: "IA", ...parseJSON(await chat(SYSTEM, prompt)) };
    } catch (e) {
      console.warn("IA indisponible (" + e.message + ") -> repli.");
    }
  }
  return { mode: "repli", ...fallbackAd(produit, plateforme, angle) };
}

// ---------- Programme principal ----------
async function main() {
  const today = new Date();
  const jour = today.toISOString().slice(0, 10);
  console.log("🤖 Agent Chariow — exécution du", jour);

  const products = await readJSON("products.json", []);
  const publies = products.filter((p) => p.statut === "publié");
  const cibles = (publies.length ? publies : products).slice(0, 4);

  if (!cibles.length) {
    console.log("Aucun produit. Rien à générer.");
    return;
  }

  const plateformes = ["TikTok", "WhatsApp Status", "Facebook"];
  const angles = ["avant-après", "témoignage", "démo", "question"];

  // 1 à 2 publications du jour (produit + plateforme tournent selon la date)
  const dayIndex = Math.floor(today.getTime() / 86400000);
  const publicationsDuJour = [];
  const nbPubs = Math.min(2, cibles.length);
  for (let i = 0; i < nbPubs; i++) {
    const produit = cibles[(dayIndex + i) % cibles.length];
    const plateforme = plateformes[(dayIndex + i) % plateformes.length];
    const angle = angles[(dayIndex + i) % angles.length];
    const pub = await genPublication(produit, plateforme, angle);
    publicationsDuJour.push({ jour, plateforme, produitId: produit.id, angle, ...pub });
    console.log(`  ✅ Pub ${i + 1} (${pub.mode}) : ${produit.nom} / ${plateforme} / ${angle}`);
  }

  // Conserve le plan hebdo existant s'il y en a un
  const prevQueue = await readJSON("queue.json", {});
  const queue = {
    genereLe: new Date().toISOString(),
    source: hasKey() ? "openrouter" : "repli",
    publicationsDuJour,
    relancesProposees: prevQueue.relancesProposees || [],
    plan: prevQueue.plan || null,
  };
  await writeJSON("queue.json", queue);

  // Journal d'activité
  const activity = await readJSON("activity.json", []);
  activity.unshift({
    date: new Date().toISOString(),
    acteur: "agent",
    action: `Contenu pub du jour généré (${publicationsDuJour.length} publication(s)) — source ${queue.source}.`,
  });
  await writeJSON("activity.json", activity.slice(0, 200));

  console.log("📜 Journal mis à jour. Terminé.");
}

main().catch((e) => {
  console.error("Erreur agent :", e.message);
  process.exit(1);
});

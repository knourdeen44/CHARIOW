#!/usr/bin/env node
/*
 * sync-chariow.js — Synchronise les VRAIES données de ta boutique Chariow.
 *
 * Ce script :
 *   1. Appelle l'API Chariow (clé secrète CHARIOW_API_KEY) côté serveur.
 *   2. Récupère tes produits et tes ventes réels.
 *   3. Les écrit dans data/products.json et data/sales.json (lus par le site).
 *   4. Journalise dans data/activity.json.
 *
 * Sécurité : la clé n'est jamais dans le code. En prod c'est un GitHub Secret ;
 * en local, mets-la dans .env (ignoré par git).
 * Robustesse : sans clé -> message clair, on garde les données existantes, aucun crash.
 *
 * Lancer en local :   node agent/sync-chariow.js
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { hasKey, getStore, listProducts, listSales } from "./lib/chariow.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = (f) => join(ROOT, "data", f);

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

// Statuts considérés comme de vraies ventes encaissées
const VENTES_OK = new Set(["completed", "settled"]);

// --- Conversion Chariow -> notre format -----------------------------------

function mapProduct(p, ventesParProduit) {
  const prix =
    p?.pricing?.price?.value ??
    p?.pricing?.current_price?.value ??
    p?.pricing?.effective?.value ??
    0;
  return {
    id: p.id,
    nom: p.name,
    categorie: p?.category?.label || p?.type || "Général",
    prix: Number(prix) || 0,
    devise: p?.pricing?.price?.currency || "FCFA",
    lienChariow: p.lienChariow || p.url || "",
    statut: p.status === "published" ? "publié" : "brouillon",
    ventes: ventesParProduit[p.id] || 0,
    description: p.description || "",
  };
}

function mapSale(s) {
  const date = (s.completed_at || s.created_at || "").slice(0, 10);
  return {
    id: s.id,
    productId: s?.product?.id || "",
    produit: s?.product?.name || "",
    date,
    quantite: 1,
    montant: Number(s?.amount?.value) || 0,
    client: s?.customer?.name || s?.customer?.email || "—",
    statut: s.status,
  };
}

// --- Programme principal ---------------------------------------------------

async function main() {
  if (!hasKey()) {
    console.log("ℹ️  Aucune clé CHARIOW_API_KEY trouvée.");
    console.log("    -> On garde les données actuelles (exemple ou dernière synchro).");
    console.log("    -> Ajoute ta clé dans .env (local) ou dans les Secrets GitHub (en ligne).");
    return;
  }

  console.log("🔌 Connexion à Chariow…");
  const store = await getStore().catch(() => ({}));
  if (store?.name) console.log("   Boutique :", store.name, store.url ? "(" + store.url + ")" : "");

  // 1) Ventes (sert aussi à compter les ventes par produit)
  const rawSales = await listSales();
  console.log("   Ventes récupérées :", rawSales.length);
  const sales = rawSales.map(mapSale).filter((s) => VENTES_OK.has(s.statut));

  const ventesParProduit = {};
  sales.forEach((s) => {
    if (s.productId) ventesParProduit[s.productId] = (ventesParProduit[s.productId] || 0) + s.quantite;
  });

  // 2) Produits
  const rawProducts = await listProducts();
  console.log("   Produits récupérés :", rawProducts.length);
  let products = rawProducts.map((p) => mapProduct(p, ventesParProduit));

  // Complète le lien produit avec l'URL de la boutique si dispo
  if (store?.url) {
    products = products.map((p) => {
      if (!p.lienChariow) {
        const raw = rawProducts.find((r) => r.id === p.id);
        if (raw?.slug) p.lienChariow = store.url.replace(/\/$/, "") + "/" + raw.slug;
      }
      return p;
    });
  }

  // 3) Écriture
  await writeJSON("products.json", products);
  await writeJSON("sales.json", sales);

  // 4) Ventes "à relancer" (paniers abandonnés / paiements en attente) -> queue
  const relances = rawSales
    .map(mapSale)
    .filter((s) => ["abandoned", "awaiting_payment"].includes(s.statut))
    .map((s) => ({ client: s.client, produit: s.produit, montant: s.montant, date: s.date }));
  const queue = await readJSON("queue.json", {});
  queue.relancesProposees = relances;
  await writeJSON("queue.json", queue);

  // 5) Journal
  const totalCA = sales.reduce((t, s) => t + s.montant, 0);
  const activity = await readJSON("activity.json", []);
  activity.unshift({
    date: new Date().toISOString(),
    acteur: "agent",
    action: `Synchro Chariow : ${products.length} produit(s), ${sales.length} vente(s) encaissée(s) (${totalCA} FCFA), ${relances.length} relance(s) possible(s).`,
  });
  await writeJSON("activity.json", activity.slice(0, 200));

  console.log(`✅ Synchro terminée : ${products.length} produits, ${sales.length} ventes, ${relances.length} relances possibles.`);
}

main().catch((e) => {
  console.error("Erreur synchro Chariow :", e.message);
  process.exit(1);
});

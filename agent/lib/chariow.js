/*
 * chariow.js — Client de l'API Chariow (côté serveur uniquement).
 *
 * ⚠️ La clé API Chariow est SECRÈTE. Elle ne doit JAMAIS être dans le site (public).
 * Elle vient de la variable d'environnement CHARIOW_API_KEY (GitHub Secret en prod,
 * fichier .env en local). Node 18+ fournit fetch globalement.
 *
 * Doc : https://chariow.dev — Base : https://api.chariow.com/v1
 */

const BASE = "https://api.chariow.com/v1";

export function hasKey() {
  return !!process.env.CHARIOW_API_KEY;
}

async function api(path, params = {}) {
  const key = process.env.CHARIOW_API_KEY;
  if (!key) throw new Error("NO_KEY");

  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  }

  const res = await fetch(url, {
    headers: { Authorization: "Bearer " + key, Accept: "application/json" },
  });

  if (res.status === 401) throw new Error("Clé API Chariow invalide (401). Vérifie ta clé dans app.chariow.com > Paramètres > Clés API.");
  if (res.status === 403) throw new Error("Accès refusé par Chariow (403). La clé n'a peut-être pas les bonnes permissions.");
  if (!res.ok) throw new Error("Erreur API Chariow HTTP " + res.status + " sur " + path);

  return res.json();
}

// Récupère TOUTES les pages d'un endpoint de liste (suit le curseur).
// Réponse Chariow : { data: { data: [...], pagination: { has_more, next_cursor } } }
async function listAll(path, params = {}) {
  const out = [];
  let cursor;
  let guard = 0; // sécurité anti-boucle infinie
  do {
    const body = await api(path, { per_page: 100, cursor, ...params });
    const page = body?.data?.data || [];
    out.push(...page);
    const pg = body?.data?.pagination || {};
    cursor = pg.has_more ? pg.next_cursor : null;
  } while (cursor && ++guard < 100);
  return out;
}

export function getStore() {
  return api("/store").then((b) => b?.data || {});
}

export function listProducts() {
  return listAll("/products");
}

export function listSales() {
  return listAll("/sales");
}

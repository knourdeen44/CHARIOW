/*
 * store.js — Couche de stockage des données.
 *
 * Principe (100 % gratuit) :
 *  - Les données "officielles" sont des fichiers JSON dans /data, versionnés dans le repo.
 *  - Comme GitHub Pages est un site STATIQUE, le navigateur ne peut pas réécrire ces fichiers.
 *    Donc tes ajouts/modifs faits dans le site sont gardés dans le navigateur (localStorage),
 *    PAR-DESSUS les fichiers du repo. Le bouton "Exporter" te permet de télécharger le JSON
 *    à jour pour le recommettre dans le repo quand tu veux (facultatif).
 *
 * Pour brancher Google Sheets / Supabase plus tard :
 *  - Il suffit de remplacer les fonctions loadRemote() ci-dessous par un appel à ton API.
 *  - Le reste de l'application n'a pas besoin de changer (c'est le rôle de cette abstraction).
 */

const Store = (() => {
  const LS_PREFIX = "chariow_agent_";

  // Lit la version locale (navigateur) si elle existe.
  function readLocal(key) {
    try {
      const raw = localStorage.getItem(LS_PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeLocal(key, value) {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  }

  // Charge un fichier JSON du dossier /data.
  async function loadRemote(file) {
    const res = await fetch("data/" + file + ".json", { cache: "no-store" });
    if (!res.ok) throw new Error("Impossible de charger data/" + file + ".json");
    return res.json();
  }

  // Récupère une collection : version navigateur si modifiée, sinon fichier du repo.
  async function get(key, file) {
    const local = readLocal(key);
    if (local !== null) return local;
    try {
      return await loadRemote(file || key);
    } catch {
      return [];
    }
  }

  // Sauvegarde une collection dans le navigateur.
  function save(key, value) {
    writeLocal(key, value);
  }

  // Réinitialise (revient aux fichiers du repo).
  function reset(key) {
    localStorage.removeItem(LS_PREFIX + key);
  }

  // Réglages (clé API OpenRouter, modèle) — stockés UNIQUEMENT dans le navigateur.
  const settings = {
    get(name, def = "") {
      return localStorage.getItem(LS_PREFIX + "set_" + name) ?? def;
    },
    set(name, value) {
      localStorage.setItem(LS_PREFIX + "set_" + name, value);
    },
  };

  // Téléchargement d'un JSON (pour recommettre dans le repo).
  function download(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return { get, save, reset, settings, download };
})();

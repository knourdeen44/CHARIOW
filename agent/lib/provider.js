/*
 * provider.js — Appel au modèle IA (OpenRouter) côté serveur/agent.
 * La clé vient de la variable d'environnement OPENROUTER_API_KEY (GitHub Secret),
 * JAMAIS écrite en dur. Node 18+ fournit fetch globalement.
 */

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

// Cascade de modèles gratuits : si l'un est saturé (429), on essaie le suivant.
// Les modèles ":free" sont partagés, donc un seul peut être indisponible à un instant T.
const MODELS = [
  process.env.OPENROUTER_MODEL, // ton modèle perso s'il est défini (prioritaire)
  "openai/gpt-oss-120b:free",
  "google/gemma-4-31b-it:free",
  "openai/gpt-oss-20b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
].filter(Boolean);

export function hasKey() {
  return !!process.env.OPENROUTER_API_KEY;
}

async function callModel(key, model, system, user) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com",
      "X-Title": "Agent Chariow (cron)",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.9,
    }),
  });

  if (res.status === 401) throw new Error("Clé API OpenRouter invalide.");
  if (res.status === 429) throw new Error("RATE_LIMIT"); // saturé -> on tentera le modèle suivant
  if (!res.ok) throw new Error("Erreur IA HTTP " + res.status);

  const data = await res.json();
  const txt = data?.choices?.[0]?.message?.content?.trim();
  if (!txt) throw new Error("Réponse IA vide.");
  return txt;
}

export async function chat(system, user) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("NO_KEY");

  let lastErr;
  for (const model of MODELS) {
    try {
      return await callModel(key, model, system, user);
    } catch (e) {
      lastErr = e;
      if (e.message === "RATE_LIMIT" || /HTTP 5/.test(e.message)) continue; // modèle suivant
      throw e; // erreur "dure" (ex: clé invalide) -> on arrête
    }
  }
  throw new Error("Tous les modèles gratuits sont saturés pour le moment. " + (lastErr?.message || ""));
}

export function parseJSON(txt) {
  try {
    return JSON.parse(txt);
  } catch {
    const s = txt.indexOf("{") >= 0 ? txt.indexOf("{") : txt.indexOf("[");
    const e = Math.max(txt.lastIndexOf("}"), txt.lastIndexOf("]"));
    if (s >= 0 && e > s) return JSON.parse(txt.slice(s, e + 1));
    throw new Error("Réponse IA illisible.");
  }
}

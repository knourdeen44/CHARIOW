/*
 * provider.js — Appel au modèle IA (OpenRouter) côté serveur/agent.
 * La clé vient de la variable d'environnement OPENROUTER_API_KEY (GitHub Secret),
 * JAMAIS écrite en dur. Node 18+ fournit fetch globalement.
 */

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";

export function hasKey() {
  return !!process.env.OPENROUTER_API_KEY;
}

export async function chat(system, user) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("NO_KEY");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com",
      "X-Title": "Agent Chariow (cron)",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.9,
    }),
  });

  if (res.status === 401) throw new Error("Clé API OpenRouter invalide.");
  if (res.status === 429) throw new Error("Quota gratuit atteint.");
  if (!res.ok) throw new Error("Erreur IA HTTP " + res.status);

  const data = await res.json();
  const txt = data?.choices?.[0]?.message?.content?.trim();
  if (!txt) throw new Error("Réponse IA vide.");
  return txt;
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

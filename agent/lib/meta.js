/*
 * meta.js — Helpers pour publier sur Facebook Page + Instagram (Meta Graph API v21.0).
 *
 * ⚠️ Les jetons sont SECRETS (jamais dans le code) :
 *   - META_PAGE_ID         : l'identifiant de ta Page Facebook
 *   - META_PAGE_TOKEN      : un "Page Access Token" longue durée (60 jours)
 *   - IG_USER_ID           : l'identifiant de ton compte Instagram Professionnel (facultatif)
 *
 * Facebook : un simple POST texte sur le fil de la Page.
 * Instagram : 2 étapes (créer un conteneur média avec une image, puis le publier).
 *   -> Instagram EXIGE une image accessible publiquement (image_url).
 */

const API = "https://graph.facebook.com/v21.0";

async function call(path, params, method = "POST") {
  const url = new URL(API + path);
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) body.set(k, v);
  }
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: method === "GET" ? undefined : body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const msg = data.error?.message || ("HTTP " + res.status);
    throw new Error("Meta API: " + msg);
  }
  return data;
}

// Publie un texte sur la Page Facebook. Retourne l'id du post.
export async function postFacebook({ pageId, token, message, link }) {
  const data = await call(`/${pageId}/feed`, { message, link, access_token: token });
  return data.id;
}

// Publie une image + légende sur Instagram (2 étapes). Retourne l'id du média.
export async function postInstagram({ igUserId, token, imageUrl, caption }) {
  // 1) créer le conteneur
  const container = await call(`/${igUserId}/media`, {
    image_url: imageUrl,
    caption,
    access_token: token,
  });
  // 2) publier le conteneur
  const published = await call(`/${igUserId}/media_publish`, {
    creation_id: container.id,
    access_token: token,
  });
  return published.id;
}

// Vérifie un jeton (utile pour le diagnostic). Retourne les infos de la Page.
export async function checkToken({ pageId, token }) {
  return call(`/${pageId}`, { fields: "name,id", access_token: token }, "GET");
}

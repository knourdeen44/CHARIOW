/*
 * app.js — Logique du tableau de bord (vanilla JS).
 * Pas de build, pas de framework : tout tourne directement dans le navigateur.
 */

// ---------- Petits utilitaires ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const fcfa = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";
const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 2500);
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Copié ✅");
  } catch {
    toast("Copie impossible, sélectionne le texte à la main.");
  }
}

function modal(html) {
  $("#modalBody").innerHTML = html;
  $("#modal").classList.remove("hidden");
}
function closeModal() {
  $("#modal").classList.add("hidden");
}
$("#modal").addEventListener("click", (e) => {
  if (e.target.id === "modal") closeModal();
});

// ---------- État ----------
let state = { products: [], sales: [], messages: [], queue: {}, activity: [], store: {} };

async function loadAll() {
  state.products = await Store.get("products");
  state.sales = await Store.get("sales");
  state.messages = await Store.get("messages");
  state.queue = await Store.get("queue");
  state.activity = await Store.get("activity");
  state.store = await Store.get("store");
  if (!Array.isArray(state.activity)) state.activity = [];
  if (Array.isArray(state.store) || !state.store) state.store = {};
}

// Personnalise l'en-tête et le mémo avec la vraie boutique Chariow
function renderStore() {
  const s = state.store || {};
  if (s.name) {
    $("#storeName").textContent = s.name;
    $("#storeLine").textContent = "Tableau de bord — pub & gestion automatisées";
    document.title = s.name + " — Tableau de bord";
  }
  const memo = $("#memoStore");
  if (memo) {
    if (s.url) {
      memo.innerHTML = `Ta boutique : <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener" class="text-brand-700 underline font-medium">${escapeHtml(s.name || s.url)}</a>`;
    } else {
      memo.textContent = "Boutique pas encore connectée — ajoute le secret CHARIOW_API_KEY (voir README).";
    }
  }
}

function logActivity(action) {
  state.activity.unshift({ date: new Date().toISOString(), acteur: "moi", action });
  Store.save("activity", state.activity);
  renderActivity();
}

// ---------- Onglets ----------
function setTab(name) {
  $$("[x-tab]").forEach((s) => s.classList.toggle("active", s.getAttribute("x-tab") === name));
  $$(".tab-btn").forEach((b) => {
    const on = b.dataset.tab === name;
    b.classList.toggle("border-brand-600", on);
    b.classList.toggle("text-brand-700", on);
    b.classList.toggle("font-semibold", on);
  });
  location.hash = name;
}
$("#tabs").addEventListener("click", (e) => {
  const btn = e.target.closest(".tab-btn");
  if (btn) setTab(btn.dataset.tab);
});

// ---------- PRODUITS ----------
function renderProducts() {
  const el = $("#productsList");
  if (!state.products.length) {
    el.innerHTML = `<div class="sm:col-span-2 bg-white rounded-xl border border-dashed p-6 text-center">
      <p class="text-3xl mb-2">🛍️</p>
      <p class="font-medium">Aucun produit pour l'instant</p>
      <p class="text-sm text-slate-500 mt-1">Dès que tu <b>publies un produit sur Chariow</b>, il apparaît ici automatiquement. Tu peux aussi en ajouter un à la main avec « + Ajouter ».</p>
    </div>`;
    return;
  }
  el.innerHTML = state.products
    .map((p) => {
      const pub = p.statut === "publié";
      return `<div class="bg-white rounded-xl border p-4">
        <div class="flex items-start justify-between gap-2">
          <div>
            <h3 class="font-semibold">${escapeHtml(p.nom)}</h3>
            <p class="text-xs text-slate-500">${escapeHtml(p.categorie)} • ${fcfa(p.prix)}</p>
          </div>
          <span class="text-xs px-2 py-0.5 rounded-full ${pub ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-500"}">${pub ? "publié" : "brouillon"}</span>
        </div>
        <p class="text-sm text-slate-600 mt-2">${escapeHtml(p.description || "")}</p>
        <div class="flex items-center justify-between mt-3 text-xs text-slate-500">
          <span>🛒 ${p.ventes || 0} ventes</span>
          <div class="flex gap-3">
            <button class="text-brand-700" data-edit-product="${p.id}">Modifier</button>
            <button class="text-red-600" data-del-product="${p.id}">Supprimer</button>
          </div>
        </div>
      </div>`;
    })
    .join("");
}

function productForm(p = {}) {
  const f = (k) => escapeHtml(p[k] ?? "");
  modal(`<h3 class="font-bold mb-3">${p.id ? "Modifier" : "Ajouter"} un produit</h3>
    <div class="space-y-2 text-sm">
      <input id="f_nom" class="w-full border rounded-lg p-2" placeholder="Nom" value="${f("nom")}" />
      <input id="f_cat" class="w-full border rounded-lg p-2" placeholder="Catégorie / métier" value="${f("categorie")}" />
      <input id="f_prix" type="number" class="w-full border rounded-lg p-2" placeholder="Prix (FCFA)" value="${f("prix")}" />
      <input id="f_lien" class="w-full border rounded-lg p-2" placeholder="Lien Chariow" value="${f("lienChariow")}" />
      <textarea id="f_desc" class="w-full border rounded-lg p-2" placeholder="Description">${f("description")}</textarea>
      <select id="f_statut" class="w-full border rounded-lg p-2">
        <option ${p.statut === "publié" ? "selected" : ""}>publié</option>
        <option ${p.statut !== "publié" ? "selected" : ""}>brouillon</option>
      </select>
      <input id="f_ventes" type="number" class="w-full border rounded-lg p-2" placeholder="Nombre de ventes" value="${f("ventes")}" />
    </div>
    <div class="flex gap-2 mt-4">
      <button id="f_save" class="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm flex-1">Enregistrer</button>
      <button id="f_cancel" class="border px-4 py-2 rounded-lg text-sm">Annuler</button>
    </div>`);
  $("#f_cancel").onclick = closeModal;
  $("#f_save").onclick = () => {
    const data = {
      id: p.id || "p" + Date.now(),
      nom: $("#f_nom").value.trim(),
      categorie: $("#f_cat").value.trim() || "Général",
      prix: Number($("#f_prix").value) || 0,
      devise: "FCFA",
      lienChariow: $("#f_lien").value.trim(),
      description: $("#f_desc").value.trim(),
      statut: $("#f_statut").value,
      ventes: Number($("#f_ventes").value) || 0,
    };
    if (!data.nom) return toast("Le nom est obligatoire.");
    if (p.id) state.products = state.products.map((x) => (x.id === p.id ? data : x));
    else state.products.push(data);
    Store.save("products", state.products);
    logActivity(`${p.id ? "Produit modifié" : "Produit ajouté"} : ${data.nom}`);
    closeModal();
    renderProducts();
    fillProductSelect();
    toast("Enregistré ✅");
  };
}

$("#addProduct").onclick = () => productForm();
$("#productsList").addEventListener("click", (e) => {
  const ed = e.target.dataset.editProduct;
  const dl = e.target.dataset.delProduct;
  if (ed) productForm(state.products.find((p) => p.id === ed));
  if (dl) {
    const p = state.products.find((x) => x.id === dl);
    if (confirm(`Supprimer « ${p.nom} » ?`)) {
      state.products = state.products.filter((x) => x.id !== dl);
      Store.save("products", state.products);
      logActivity(`Produit supprimé : ${p.nom}`);
      renderProducts();
      fillProductSelect();
    }
  }
});

// ---------- VENTES ----------
function renderSales() {
  const total = state.sales.reduce((s, v) => s + Number(v.montant || 0), 0);
  const moisCourant = new Date().toISOString().slice(0, 7);
  const totalMois = state.sales
    .filter((v) => (v.date || "").startsWith(moisCourant))
    .reduce((s, v) => s + Number(v.montant || 0), 0);
  const nb = state.sales.length;

  $("#salesStats").innerHTML = [
    ["Total encaissé", fcfa(total)],
    ["Ce mois-ci", fcfa(totalMois)],
    ["Nombre de ventes", nb],
  ]
    .map(
      ([k, v]) =>
        `<div class="bg-white rounded-xl border p-4"><p class="text-xs text-slate-500">${k}</p><p class="text-lg font-bold text-brand-700">${v}</p></div>`
    )
    .join("");

  // Graphe simple en barres (par produit)
  const parProduit = {};
  state.sales.forEach((v) => {
    parProduit[v.productId] = (parProduit[v.productId] || 0) + Number(v.montant || 0);
  });
  const max = Math.max(1, ...Object.values(parProduit));
  $("#salesChart").innerHTML =
    Object.entries(parProduit)
      .map(([pid, m]) => {
        const nom = state.products.find((p) => p.id === pid)?.nom || pid;
        const w = Math.round((m / max) * 100);
        return `<div>
          <div class="flex justify-between text-xs mb-0.5"><span>${escapeHtml(nom)}</span><span>${fcfa(m)}</span></div>
          <div class="bg-slate-100 rounded-full h-3"><div class="bg-brand-600 h-3 rounded-full" style="width:${w}%"></div></div>
        </div>`;
      })
      .join("") || `<p class="text-slate-400 text-sm">Aucune vente pour l'instant — tes ventes Chariow s'afficheront ici dès la première commande.</p>`;

  $("#salesList").innerHTML =
    [...state.sales]
      .reverse()
      .slice(0, 15)
      .map((v) => {
        const nom = state.products.find((p) => p.id === v.productId)?.nom || v.productId;
        return `<div class="p-3 flex items-center justify-between text-sm">
          <div><b>${escapeHtml(nom)}</b><br><span class="text-xs text-slate-500">${escapeHtml(v.date)} • ${escapeHtml(v.client || "—")}</span></div>
          <span class="font-semibold text-brand-700">${fcfa(v.montant)}</span>
        </div>`;
      })
      .join("") || `<p class="p-3 text-slate-400 text-sm">Aucune vente.</p>`;
}

$("#addSale").onclick = () => {
  const opts = state.products.map((p) => `<option value="${p.id}">${escapeHtml(p.nom)}</option>`).join("");
  modal(`<h3 class="font-bold mb-3">Ajouter une vente</h3>
    <div class="space-y-2 text-sm">
      <select id="s_prod" class="w-full border rounded-lg p-2">${opts}</select>
      <input id="s_date" type="date" class="w-full border rounded-lg p-2" value="${new Date().toISOString().slice(0, 10)}" />
      <input id="s_qte" type="number" class="w-full border rounded-lg p-2" placeholder="Quantité" value="1" />
      <input id="s_montant" type="number" class="w-full border rounded-lg p-2" placeholder="Montant total (FCFA)" />
      <input id="s_client" class="w-full border rounded-lg p-2" placeholder="Client (facultatif)" />
    </div>
    <div class="flex gap-2 mt-4">
      <button id="s_save" class="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm flex-1">Enregistrer</button>
      <button id="s_cancel" class="border px-4 py-2 rounded-lg text-sm">Annuler</button>
    </div>`);
  $("#s_cancel").onclick = closeModal;
  $("#s_save").onclick = () => {
    const v = {
      id: "s" + Date.now(),
      productId: $("#s_prod").value,
      date: $("#s_date").value,
      quantite: Number($("#s_qte").value) || 1,
      montant: Number($("#s_montant").value) || 0,
      client: $("#s_client").value.trim(),
    };
    state.sales.push(v);
    Store.save("sales", state.sales);
    // Incrémente le compteur de ventes du produit
    const prod = state.products.find((p) => p.id === v.productId);
    if (prod) {
      prod.ventes = (prod.ventes || 0) + v.quantite;
      Store.save("products", state.products);
    }
    logActivity(`Vente enregistrée : ${fcfa(v.montant)} (${prod?.nom || ""})`);
    closeModal();
    renderSales();
    renderProducts();
    toast("Vente ajoutée ✅");
  };
};

// ---------- GÉNÉRATEUR PUB ----------
function fillProductSelect() {
  const opts = state.products.map((p) => `<option value="${p.id}">${escapeHtml(p.nom)}</option>`).join("");
  $("#adProduct").innerHTML = opts;
}

$("#genAd").onclick = async () => {
  const p = state.products.find((x) => x.id === $("#adProduct").value);
  if (!p) return toast("Ajoute d'abord un produit.");
  const plateforme = $("#adPlatform").value;
  const angle = $("#adAngle").value;
  const box = $("#adResult");
  box.innerHTML = `<p class="text-sm text-slate-500">Génération en cours…</p>`;

  let ad, mode;
  try {
    if (AI.hasKey()) {
      const txt = await AI.chat(AI.SYSTEM, AI.adPrompt(p, plateforme, angle));
      ad = AI.parseJSON(txt);
      mode = "IA";
    } else {
      ad = Fallback.ad(p, plateforme, angle);
      mode = "sans IA";
    }
  } catch (err) {
    ad = Fallback.ad(p, plateforme, angle);
    mode = "repli (" + err.message + ")";
  }

  const full = `${ad.accroche}\n\n${ad.corps}\n\n${ad.cta}`;
  box.innerHTML = `<div class="bg-white rounded-xl border p-4">
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">${plateforme} • ${angle} • ${mode}</span>
      <button id="copyAd" class="text-sm text-brand-700">📋 Copier</button>
    </div>
    <p class="font-semibold">${escapeHtml(ad.accroche)}</p>
    <p class="text-sm text-slate-600 mt-1">${escapeHtml(ad.corps)}</p>
    <p class="text-sm font-medium text-amber-500 mt-1">${escapeHtml(ad.cta)}</p>
    <hr class="my-3" />
    <p class="text-xs text-slate-500">🖼️ Texte à l'écran : <b>${escapeHtml(ad.texteEcran)}</b></p>
    <p class="text-xs text-slate-500">🎬 Idée de visuel : ${escapeHtml(ad.ideeVisuel)}</p>
  </div>`;
  $("#copyAd").onclick = () => copy(full);
  logActivity(`Pub générée (${mode}) pour ${p.nom} — ${plateforme}/${angle}`);
};

// ---------- CALENDRIER ----------
function renderCalendar(plan) {
  const data = plan || state.queue?.plan || null;
  if (!data) {
    $("#calendar").innerHTML = `<p class="text-slate-400 text-sm">Clique « Proposer la semaine ».</p>`;
    return;
  }
  $("#calendar").innerHTML = data
    .map((d, i) => {
      const done = !!d.publie;
      return `<div class="bg-white rounded-xl border p-3 flex items-center gap-3 ${done ? "opacity-60" : ""}">
        <input type="checkbox" data-cal="${i}" ${done ? "checked" : ""} class="w-5 h-5 accent-brand-600" />
        <div class="flex-1 text-sm">
          <b>${escapeHtml(d.jour)}</b> — <span class="text-amber-500">${escapeHtml(d.plateforme)}</span><br>
          <span class="text-slate-600">${escapeHtml(d.produit)} • ${escapeHtml(d.angle)}</span>
          <p class="text-xs text-slate-500">${escapeHtml(d.idee || "")}</p>
        </div>
      </div>`;
    })
    .join("");
}

$("#calendar").addEventListener("change", (e) => {
  const i = e.target.dataset.cal;
  if (i == null) return;
  const data = state.queue.plan || [];
  if (data[i]) {
    data[i].publie = e.target.checked;
    state.queue.plan = data;
    Store.save("queue", state.queue);
    renderCalendar();
    if (e.target.checked) logActivity(`Publié : ${data[i].jour} ${data[i].plateforme} (${data[i].produit})`);
  }
});

$("#genPlan").onclick = async () => {
  $("#calendar").innerHTML = `<p class="text-sm text-slate-500">Génération du planning…</p>`;
  let plan, mode;
  try {
    if (AI.hasKey()) {
      const txt = await AI.chat(AI.SYSTEM, AI.planPrompt(state.products));
      plan = AI.parseJSON(txt);
      mode = "IA";
    } else {
      plan = Fallback.plan(state.products);
      mode = "sans IA";
    }
  } catch (err) {
    plan = Fallback.plan(state.products);
    mode = "repli";
  }
  state.queue.plan = plan;
  Store.save("queue", state.queue);
  renderCalendar(plan);
  logActivity(`Calendrier de la semaine généré (${mode}).`);
  toast("Planning prêt ✅");
};

// ---------- MESSAGES ----------
function renderMessages() {
  $("#messagesList").innerHTML = state.messages
    .map(
      (m) => `<div class="bg-white rounded-xl border p-4">
        <div class="flex items-center justify-between mb-1">
          <h3 class="font-semibold text-sm">${escapeHtml(m.titre)} <span class="text-xs text-slate-400">(${escapeHtml(m.type)})</span></h3>
          <button class="text-sm text-brand-700" data-copy-msg="${m.id}">📋 Copier</button>
        </div>
        <textarea data-msg="${m.id}" class="w-full border rounded-lg p-2 text-sm" rows="3">${escapeHtml(m.contenu)}</textarea>
      </div>`
    )
    .join("");
}
$("#messagesList").addEventListener("click", (e) => {
  const id = e.target.dataset.copyMsg;
  if (id) copy($(`textarea[data-msg="${id}"]`).value);
});
$("#messagesList").addEventListener("change", (e) => {
  const id = e.target.dataset.msg;
  if (id) {
    const m = state.messages.find((x) => x.id === id);
    if (m) {
      m.contenu = e.target.value;
      Store.save("messages", state.messages);
      toast("Message enregistré ✅");
    }
  }
});

$("#genRelance").onclick = () => {
  modal(`<h3 class="font-bold mb-3">Relance personnalisée (IA)</h3>
    <div class="space-y-2 text-sm">
      <input id="r_nom" class="w-full border rounded-lg p-2" placeholder="Nom du client" />
      <input id="r_prod" class="w-full border rounded-lg p-2" placeholder="Produit" value="${escapeHtml(state.products[0]?.nom || "")}" />
      <input id="r_montant" type="number" class="w-full border rounded-lg p-2" placeholder="Montant (FCFA)" value="${state.products[0]?.prix || ""}" />
      <input id="r_date" class="w-full border rounded-lg p-2" placeholder="Date limite (ex: vendredi)" value="vendredi" />
    </div>
    <div class="flex gap-2 mt-4">
      <button id="r_go" class="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm flex-1">✨ Générer</button>
      <button id="r_cancel" class="border px-4 py-2 rounded-lg text-sm">Fermer</button>
    </div>
    <div id="r_out" class="mt-3"></div>`);
  $("#r_cancel").onclick = closeModal;
  $("#r_go").onclick = async () => {
    const nom = $("#r_nom").value.trim() || "client";
    const prod = $("#r_prod").value.trim();
    const montant = $("#r_montant").value;
    const date = $("#r_date").value.trim();
    $("#r_out").innerHTML = `<p class="text-sm text-slate-500">Génération…</p>`;
    let msg;
    try {
      if (AI.hasKey()) {
        const txt = await AI.chat(AI.SYSTEM, AI.relancePrompt(nom, prod, montant, date));
        msg = AI.parseJSON(txt).message;
      } else {
        msg = Fallback.relance(nom, prod, montant, date).message;
      }
    } catch {
      msg = Fallback.relance(nom, prod, montant, date).message;
    }
    $("#r_out").innerHTML = `<div class="bg-slate-50 border rounded-lg p-3 text-sm">${escapeHtml(msg)}</div>
      <button id="r_copy" class="mt-2 text-sm text-brand-700">📋 Copier</button>`;
    $("#r_copy").onclick = () => copy(msg);
    logActivity(`Relance générée pour ${nom} (${prod}).`);
  };
};

// ---------- ACTIVITÉ ----------
function renderActivity() {
  const el = $("#activityList");
  if (!state.activity.length) {
    el.innerHTML = `<p class="text-slate-400 text-sm">Aucune activité pour le moment.</p>`;
    return;
  }
  el.innerHTML = state.activity
    .slice(0, 50)
    .map((a) => {
      const d = new Date(a.date);
      const quand = isNaN(d) ? a.date : d.toLocaleString("fr-FR");
      const icon = a.acteur === "agent" ? "🤖" : "🧑";
      return `<div class="bg-white rounded-xl border p-3 text-sm flex gap-3">
        <span>${icon}</span>
        <div><p>${escapeHtml(a.action)}</p><p class="text-xs text-slate-400">${escapeHtml(quand)}</p></div>
      </div>`;
    })
    .join("");
}

// ---------- RÉGLAGES ----------
function loadSettings() {
  $("#setKey").value = Store.settings.get("openrouter_key");
  $("#setModel").value = Store.settings.get("openrouter_model");
  updateAiBadge();
}
function updateAiBadge() {
  $("#aiBadge").textContent = AI.hasKey() ? "🤖 IA activée" : "✋ mode sans IA";
}
$("#saveSettings").onclick = () => {
  Store.settings.set("openrouter_key", $("#setKey").value.trim());
  Store.settings.set("openrouter_model", $("#setModel").value.trim());
  updateAiBadge();
  toast("Réglages enregistrés ✅");
};
$("#resetData").onclick = async () => {
  if (!confirm("Revenir aux données du repo ? Tes modifs locales seront effacées.")) return;
  ["products", "sales", "messages", "queue", "activity"].forEach((k) => Store.reset(k));
  await loadAll();
  renderAll();
  toast("Données réinitialisées ✅");
};

// ---------- EXPORT ----------
$$("[data-export]").forEach((btn) => {
  btn.onclick = () => {
    const key = btn.dataset.export;
    Store.download(key + ".json", state[key]);
    toast(`${key}.json téléchargé — recommite-le dans /data si tu veux.`);
  };
});

// ---------- INIT ----------
function renderAll() {
  renderStore();
  renderProducts();
  fillProductSelect();
  renderSales();
  renderMessages();
  renderCalendar();
  renderActivity();
}

(async function init() {
  await loadAll();
  loadSettings();
  renderAll();
  const start = (location.hash || "#produits").slice(1);
  setTab(["produits", "ventes", "pub", "calendrier", "messages", "memo", "activite", "reglages"].includes(start) ? start : "produits");
})();

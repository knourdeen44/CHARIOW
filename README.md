# 📊 Agent Chariow — Tableau de bord + Agent IA (100 % gratuit)

Un petit site web **gratuit** pour gérer ta boutique Chariow (fichiers Excel de gestion en **FCFA**) :
- suivre tes **produits** et tes **ventes**,
- un **agent IA** qui génère tes **pubs** (TikTok / Facebook / WhatsApp), un **calendrier de publication** et tes **messages de relance**,
- un **agent automatique** (cron GitHub Actions) qui prépare le **contenu du jour** chaque matin,
- un **journal d'activité** pour voir tout ce qui a été fait.

> Le site **prépare et planifie** ton contenu. Il ne publie pas à ta place et ne paie pas la pub. Tu copies-colles le contenu sur tes réseaux.

---

## 🗂️ Ce qu'il y a dans le projet

```
index.html              ← le tableau de bord (le site)
js/                     ← le code du site (store, ai, fallback, app)
agent/run.js            ← l'agent automatique (Node)
data/                   ← tes données (produits, ventes, messages…) en JSON
.github/workflows/      ← le cron GitHub Actions
serve.js                ← mini serveur pour tester en local
.env.example            ← modèle pour ta clé API (à copier en .env)
```

Tout est **gratuit** : pas de base de données payante (données en fichiers JSON), hébergement gratuit (GitHub Pages), IA gratuite (OpenRouter free tier).

---

## 1) 🚀 Lancer le site en local (sur ton ordinateur)

Tu as besoin de **Node.js** (gratuit) : https://nodejs.org (prends la version LTS).

Ensuite, dans un terminal, place-toi dans le dossier du projet et lance :

```bash
npm run serve
```

Puis ouvre **http://localhost:8080** dans ton navigateur.

> ⚠️ Ne double-clique pas `index.html` directement : le navigateur bloque le chargement des données en mode fichier. Passe toujours par `npm run serve`.

Le site marche **tout de suite**, même **sans clé IA** (mode « sans IA » avec des modèles variés).

---

## 2) 🤖 Obtenir une clé IA gratuite (OpenRouter)

1. Va sur **https://openrouter.ai** et crée un compte (gratuit).
2. Ouvre **https://openrouter.ai/keys** et clique **Create Key**.
3. Copie la clé (elle commence par `sk-or-...`).

### Utiliser la clé sur le site (dans ton navigateur)
- Ouvre l'onglet **⚙️ Réglages** du site → colle la clé → **Enregistrer**.
- La clé reste **uniquement dans ton navigateur**. Elle n'est **jamais** mise dans le code.

### Utiliser la clé pour l'agent en local (facultatif)
- Copie `.env.example` en `.env` et mets ta clé dedans.
- Lance l'agent :

```bash
npm run agent
```

L'agent écrit le contenu du jour dans `data/queue.json` et ajoute une ligne dans `data/activity.json`.

---

## 3) 🌍 Déployer gratuitement (GitHub Pages)

1. Crée un compte sur **https://github.com** (gratuit).
2. Crée un **nouveau dépôt** (repository), par ex. `agent-chariow`.
3. Envoie ce dossier dans le dépôt :

```bash
git init
git add .
git commit -m "Premier dépôt — Agent Chariow"
git branch -M main
git remote add origin https://github.com/TON_PSEUDO/agent-chariow.git
git push -u origin main
```

4. Sur GitHub : **Settings** → **Pages** → *Build and deployment* → **Deploy from a branch** → branche **main**, dossier **/ (root)** → **Save**.
5. Au bout d'une minute, ton site est en ligne à l'adresse affichée (ex. `https://TON_PSEUDO.github.io/agent-chariow/`).

---

## 4) ⏰ Activer l'agent automatique (cron gratuit)

L'agent tourne tout seul chaque matin grâce à **GitHub Actions** (déjà configuré dans `.github/workflows/agent.yml`).

1. Sur GitHub : **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
2. Nom : `OPENROUTER_API_KEY` — Valeur : ta clé `sk-or-...` → **Add secret**.
3. (Recommandé) Va dans l'onglet **Actions**, autorise les workflows si demandé.
4. Pour tester sans attendre : onglet **Actions** → **Agent Chariow** → **Run workflow**.

> Le cron est réglé sur **06h00 UTC**. Pour changer l'heure, modifie la ligne `cron:` dans `.github/workflows/agent.yml` (format : `minute heure * * *`).

Chaque exécution :
- régénère `data/queue.json` (contenu du jour),
- ajoute une ligne dans `data/activity.json`,
- recommite automatiquement → le site se met à jour.

---

## 5) ✍️ Modifier tes données

Deux façons :

**A. Directement sur le site** (le plus simple)
- Ajoute/modifie produits, ventes et messages dans le site.
- Ces changements sont gardés **dans ton navigateur**.
- Clique **⬇️ Exporter JSON** pour télécharger le fichier, puis remplace le fichier correspondant dans `data/` et recommite (si tu veux que ce soit permanent et visible partout).

**B. Directement dans les fichiers** `data/*.json`
- Édite `data/products.json`, `data/sales.json`, `data/messages.json`, puis commit.

> Plus tard, tu pourras brancher **Google Sheets** ou **Supabase** : il suffit de modifier `js/store.js` (fonction `loadRemote`) et `agent/run.js`. Le reste ne change pas.

---

## ✅ Checklist de vérification

- [ ] `npm run serve` ouvre le site sur http://localhost:8080
- [ ] Onglet **Produits** : j'ajoute / modifie / supprime un produit
- [ ] Onglet **Ventes** : j'ajoute une vente, le graphique se met à jour
- [ ] Onglet **Générateur pub** : un clic génère une pub (sans IA, ça marche aussi)
- [ ] Onglet **Réglages** : je colle ma clé OpenRouter → badge « 🤖 IA activée »
- [ ] `npm run agent` (avec `.env`) écrit dans `data/queue.json` et `data/activity.json`
- [ ] Sur GitHub : Pages est activé, le site est en ligne
- [ ] Secret `OPENROUTER_API_KEY` ajouté, le workflow **Actions** tourne
- [ ] **Aucune clé** n'apparaît dans le code (vérifie : elle est dans Réglages / .env / Secret seulement)

---

## ❓ Problèmes fréquents

- **Le site est vide / erreur de chargement** → tu as ouvert `index.html` en double-clic. Utilise `npm run serve`.
- **« mode sans IA »** → normal si pas de clé. Ajoute ta clé dans **Réglages**.
- **« Quota gratuit atteint »** → réessaie plus tard, ou change de modèle dans **Réglages** (ex. un autre modèle `:free` d'OpenRouter).
- **L'agent ne recommite pas** → vérifie que *Actions* a la permission d'écrire (le workflow demande `permissions: contents: write`, déjà inclus).

Bon business 💪

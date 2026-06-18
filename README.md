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

## 2 bis) 🛒 Connecter ta vraie boutique Chariow (produits + ventes réels)

Le site peut afficher tes **vrais produits** et tes **vraies ventes** Chariow, mis à jour automatiquement.

> Comment ça marche (et pourquoi c'est sûr) : la clé API Chariow est **secrète**. On ne la met **jamais** dans le site (qui est public). C'est **GitHub Actions** (le robot) qui appelle Chariow côté serveur avec la clé, récupère tes données, et les écrit dans `data/products.json` et `data/sales.json`. Le site lit ensuite ces fichiers.

### Obtenir ta clé API Chariow
1. Connecte-toi sur **https://app.chariow.com**.
2. Va dans **Paramètres → Clés API** (API Keys).
3. Crée une clé (format `sk_live_...`) et copie-la.

### Brancher la clé
- **En ligne (recommandé)** : sur GitHub → **Settings → Secrets and variables → Actions → New repository secret** → Nom : `CHARIOW_API_KEY`, Valeur : ta clé `sk_live_...`.
- **En local (pour tester)** : mets-la dans `.env`, puis lance :

```bash
npm run sync
```

Tu verras dans le terminal le nombre de produits et de ventes récupérés. Les fichiers `data/products.json` et `data/sales.json` sont alors remplis avec tes vraies données.

> La synchro tourne **toute seule toutes les 6 heures** une fois le secret ajouté (et à chaque « Run workflow » manuel). Les paniers abandonnés / paiements en attente sont aussi récupérés comme **relances possibles** (dans `data/queue.json`).

---

## 2 ter) 🖼️ Générer des images de pub (gratuit, sans clé)

Dans l'onglet **✨ Générateur pub**, après avoir généré le texte, clique **🖼️ Générer le visuel**.
- C'est **100 % gratuit et sans clé** (service Pollinations.ai), directement dans le site.
- L'image est au bon format selon la plateforme (vertical 9:16 pour TikTok/Status, carré pour Facebook).
- Boutons **⬇️ Télécharger** et **🔄 Une autre image**.
- Astuce : ces modèles écrivent mal le texte. Le visuel sert de **fond** ; ajoute ton accroche/CTA par-dessus dans Canva ou l'éditeur de TikTok (le texte est déjà prêt à copier juste au-dessus).

### 🎬 Créer une vidéo de pub (gratuit, dans le navigateur)
Toujours dans **✨ Générateur pub**, clique **🎬 Créer la vidéo**.
- Génère une courte vidéo verticale (≈10 s, format TikTok/Status) avec **texte animé** sur un **fond animé aux couleurs de ta marque**. 100 % gratuit, sans clé.
- **Facultatif** : ajoute une **image de fond** (télécharge d'abord le visuel, puis sélectionne-le dans « Image de fond ») — un fichier local marche parfaitement.
- Bouton **⬇️ Télécharger la vidéo** (.webm). À uploader ensuite dans TikTok / WhatsApp Status.
- Marche mieux sur **Google Chrome** (l'enregistrement vidéo n'est pas dispo sur tous les navigateurs).

> ℹ️ Les images IA en ligne (Pollinations) s'affichent mais ne peuvent pas être enregistrées directement dans la vidéo (blocage anti-bot/CORS). D'où le fond animé par défaut + l'option « déposer ton image ».

---

## 2 quater) 📱 Publier automatiquement sur Facebook + Instagram (optionnel)

L'agent peut publier ta pub du jour **tout seul** sur ta Page Facebook et ton compte Instagram Pro.
- C'est **gratuit**, mais demande une configuration Meta (compte développeur). **Guide complet pas à pas : [docs/META_SETUP.md](docs/META_SETUP.md).**
- Une fois les 3 secrets ajoutés (`META_PAGE_ID`, `META_PAGE_TOKEN`, `IG_USER_ID`), le workflow **Publication réseaux** s'occupe de tout (chaque jour à 08h, ou « Run workflow »).
- Facebook = post texte. Instagram = image (générée côté serveur) + légende.
- Sans ces secrets, rien n'est publié (le reste du projet fonctionne normalement).

TikTok n'est pas encore branché (audit TikTok plus lourd) — possible dans un second temps.

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
- [ ] `npm run sync` (avec clé Chariow dans `.env`) remplit `data/products.json` et `data/sales.json` avec mes vraies données
- [ ] `npm run agent` (avec `.env`) écrit dans `data/queue.json` et `data/activity.json`
- [ ] Secret `CHARIOW_API_KEY` ajouté sur GitHub (synchro automatique des ventes)
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

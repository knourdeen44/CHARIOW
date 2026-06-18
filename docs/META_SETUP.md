# 📱 Brancher la publication automatique Facebook + Instagram

Ce guide t'explique, pas à pas, comment connecter ta **Page Facebook** et ton **compte Instagram Professionnel** pour que l'agent publie tout seul. C'est **gratuit**. Compte ~30-45 min la première fois.

> Important : la publication se fait depuis **GitHub Actions** (un robot), pas depuis le site (qui est public). Tes jetons restent **chiffrés** dans les Secrets GitHub.

---

## Ce qu'il te faut AVANT de commencer
1. Une **Page Facebook** (pas un profil perso — une Page).
2. Un compte **Instagram Professionnel** (Business ou Créateur).
   - Dans l'app Instagram : *Paramètres → Type de compte → Passer en compte professionnel*.
3. **Lier** ton Instagram à ta Page Facebook.
   - Sur la Page Facebook : *Paramètres → Comptes liés → Instagram → Connecter*.

---

## Étape 1 — Créer une application Meta (développeur)
1. Va sur **https://developers.facebook.com/** et connecte-toi.
2. *Mes applications → Créer une application*.
3. Type : choisis **« Autre » → « Entreprise »** (Business).
4. Donne un nom (ex. « Agent Chariow ») et crée l'app.

> Ton app reste en **mode développement** : c'est suffisant pour publier sur **tes propres** Page et Insta (pas besoin de la longue revue d'app).

## Étape 2 — Ajouter les produits/permissions
1. Dans l'app, ajoute le produit **« Instagram »** (ou « Instagram Graph API »).
2. Ouvre **l'Explorateur d'API Graph** : https://developers.facebook.com/tools/explorer/
3. En haut à droite, sélectionne ton app, puis **« Générer un token d'accès »**.
4. Coche ces permissions, puis valide la connexion avec ton compte Facebook :
   - `pages_show_list`
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `instagram_basic`
   - `instagram_content_publish`
   - `business_management`

## Étape 3 — Récupérer tes 3 identifiants

**A. L'ID de ta Page + son jeton**
1. Dans l'Explorateur, requête : `me/accounts` (méthode GET) → **Envoyer**.
2. Repère ta Page : note son **`id`** (= `META_PAGE_ID`) et son **`access_token`** (= jeton de Page).

**B. L'ID de ton compte Instagram**
1. Requête : `{META_PAGE_ID}?fields=instagram_business_account` → **Envoyer**.
2. Note l'`id` renvoyé (= `IG_USER_ID`).

**C. Transformer le jeton en jeton « longue durée » (60 jours)**
- Colle cette URL dans ton navigateur (remplace les 3 valeurs) :
```
https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=TON_APP_ID&client_secret=TON_APP_SECRET&fb_exchange_token=LE_JETON_DE_PAGE
```
- `TON_APP_ID` et `TON_APP_SECRET` sont dans *Paramètres → Général* de ton app.
- Le `access_token` renvoyé est ton **`META_PAGE_TOKEN`** (longue durée).

> 🔁 Le jeton expire après 60 jours sans usage. Comme l'agent publie régulièrement, il reste actif. Si un jour ça expire, refais l'étape C.

## Étape 4 — Mettre les 3 secrets dans GitHub
Sur ton dépôt GitHub : **Settings → Secrets and variables → Actions → New repository secret**. Crée :

| Nom du secret | Valeur |
|---|---|
| `META_PAGE_ID` | l'ID de ta Page (étape 3A) |
| `META_PAGE_TOKEN` | le jeton longue durée (étape 3C) |
| `IG_USER_ID` | l'ID Instagram (étape 3B) — *facultatif, pour publier aussi sur Insta* |

## Étape 5 — Tester
1. Onglet **Actions → Publication réseaux → Run workflow**.
2. Regarde le résultat : tu dois voir « Publié sur Facebook » (et Instagram si configuré).
3. Le journal du site (onglet **Activité**) affiche aussi la publication.

> S'il n'y a « rien à publier », c'est qu'il n'y a pas de pub du jour dans la file (`data/queue.json`). Publie d'abord un produit sur Chariow et laisse l'agent générer le contenu (ou lance le workflow **Agent Chariow** d'abord).

---

## Dépannage
- **« Meta API: (#200) … permissions »** → il manque une permission (étape 2) ou le compte Insta n'est pas Professionnel / pas lié à la Page.
- **Instagram ignoré** → `IG_USER_ID` non renseigné, ou l'image n'a pas pu être générée. Facebook fonctionne quand même.
- **Jeton expiré** → refais l'étape 3C et remets à jour `META_PAGE_TOKEN`.
- **« rien à publier »** → la file est vide ; génère d'abord le contenu (workflow Agent Chariow).

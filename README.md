# DrumTempo

## C'est quoi?

DrumTempo est un petit programme web qui s'adresse aux adeptes de la batterie.  Il esst destiné à enregistrer vos meilleurs tempos lors de vos pratiques de batterie, pour chacun de vos rudiments ou exercices.

## Comment ça marche?

Vous accédez au site web, vous vous inscrivez, ou vous vous connectez.  Une fois sur votre page de DrumTempo, vous inscrivez un rudiment que vous pratiquez, et le meilleur tempo obtenu pour ce rudiment.  À chaque fois que vous 
réussissez à augmenter votre tempo, vous l'augmentez sur la page web, et DrumTempo se rappellera de vos tempos pour chaque rudiment inscrit.  Vous pouvez aussi diminuer le tempo pour un exercice, et supprimer un exercice que vous ne pratiquez plus.

## Comment installer et faire fonctionner DrumTempo

Le projet n'est pas encore déployé, alors les développeurs intéressés peuvent le faire fonctionner facilement en clonant le dépôt git, et en démarrant les conteneurs dockers appropriés.  Des instructions se trouvent dans les sections suivantes.
Il faut configurer les variables d'environnement dans un fichier ```.env``` pour configurer l'authentification entre le backend et la base de données.  Il faut ensuite configurer l'adresse IP du serveur frontend afin d'y accéder sur un portable.  
Le serveur frontend est aussi accessible sur la machine locale à ```localhost:5173```.  Il suffit ensuite d'utiliser ```docker-compose``` pour faire démarrer le tout.

## Pile Technologique (Tech Stack)
- **Frontend** : Vue.js 3 (Composition API), JavaScript moderne, CSS Mobile-First.
- **Backend** : Node.js avec Express, écrit en TypeScript.
- **Base de données** : MongoDB (NoSQL).
- **Déploiement** : Docker et Docker Compose.

## Modèle de Données (MongoDB / Mongoose)
Collection `exercises` :
- `name` : String (Requis, unique, ex: "Paradiddle")
- `current_tempo` : Number | null (Optionnel, entre TEMPO_MIN=40 et TEMPO_MAX=300 — null si aucun tempo encore déterminé)
- `updated_at` : Date (Horodatage automatique via les timestamps Mongoose)

## Architecture Docker
L'application est divisée en 3 conteneurs orchestrés par `docker-compose.yml` :
1. `drumtempo-db` : Image officielle MongoDB, volume persistant pour les données.
2. `drumtempo-backend` : Node.js/TypeScript, expose l'API REST sur le port 3000.
3. `drumtempo-frontend` : Vue.js (Vite), expose l'application sur le port 5173.

## Normes de Codage (Code Style)
- **Backend** : TypeScript strict. Utilisation de Mongoose pour typer les modèles.
- **Frontend** : Vue.js 3 avec la syntaxe `<script setup>`. CSS épuré avec de grandes zones de clic pour usage mobile.
- **Réseau** : Le frontend communique avec le backend via des variables d'environnement (`VITE_API_URL`).

## Commandes de Démarrage (Docker)
- Lancer tout l'environnement : `docker-compose up --build`
- Arrêter les conteneurs : `docker-compose down`
- Voir les logs du backend : `docker-compose logs -f backend`

## Backend — Documentation de l'API

Une documentation interactive (OpenAPI / Swagger UI) est générée automatiquement à partir des annotations
`@openapi` dans `backend/src/routes/exerciseRoutes.ts` et `backend/src/models/Exercise.ts`.

Une fois le backend démarré (voir section suivante), elle est accessible à :

```
http://localhost:3000/api-docs
```

On peut y consulter chaque route, ses paramètres, ses schémas de requête/réponse et ses codes de statut,
et exécuter des requêtes directement depuis la page.

## Backend — Tester l'API REST

### Prérequis

- Docker et Docker Compose installés
- WebStorm (ou une autre IDE JetBrains) pour l'outil HTTP intégré

### 1. Configurer les secrets

Deux fichiers `.env` distincts, tous deux non versionnés :

**`backend/.env`** — secrets applicatifs (JWT), lus par le backend via `dotenv` :

```sh
cp backend/.env.example backend/.env
```

Le dossier `/backend` étant monté en volume dans le conteneur (voir `docker-compose.yml`), ce fichier est
automatiquement visible par le backend, que ce soit via `docker-compose up` ou `npm run dev` en local.

**`.env`** (racine du projet) — identifiants MongoDB, lus directement par `docker-compose.yml` (substitution
`${VAR}`, chargée automatiquement par Docker Compose depuis un `.env` situé à côté de lui) :

```sh
cp .env.example .env
```

Aucun de ces `.env` ne contient de valeur codée en dur dans un fichier versionné — voir `.gitignore`.

### 2. Démarrer l'environnement

Depuis la racine du projet :

```sh
docker-compose up --build
```

Le `--build` est nécessaire après toute modification du code backend qui touche à la configuration Docker
(ex: changement de `Dockerfile` ou `docker-compose.yml`). Pour un simple changement de code TypeScript,
`docker-compose up` suffit — le volume monté sur `/backend` permet à `tsx watch` de recharger automatiquement.

**Après l'ajout ou la mise à jour d'une dépendance npm** (changement de `package.json`), utiliser plutôt :

```sh
docker-compose up --build -V
```

Le `-V` (`--renew-anon-volumes`) force la recréation du volume anonyme `/app/node_modules` — sans lui, Docker
Compose réattache l'ancien volume (sans la nouvelle dépendance) par-dessus l'image fraîchement reconstruite,
et le backend plante avec `Cannot find module '...'`.

Le backend est prêt quand les logs affichent la connexion à MongoDB et l'écoute sur le port 3000
(`docker-compose logs -f backend`).

### 3. Réinitialiser la base de données

Depuis la version avec authentification MongoDB activée (Étape 5.3), toute commande `mongosh` doit fournir
les identifiants root définis dans le `.env` racine (`MONGO_ROOT_USERNAME` / `MONGO_ROOT_PASSWORD`).

Les fichiers de tests `backend/auth.http` et `backend/exercises.http` supposent des collections vides
au départ (certains tests créent un utilisateur ou un exercice qui doit être unique). Avant chaque
exécution complète des tests, vider les collections :

```sh
docker exec -it drumtempo-db mongosh drumtempo \
  -u <MONGO_ROOT_USERNAME> -p <MONGO_ROOT_PASSWORD> --authenticationDatabase admin \
  --eval "db.exercises.deleteMany({}); db.users.deleteMany({})"
```

- `drumtempo-db` est le nom du conteneur MongoDB (défini dans `docker-compose.yml`)
- `drumtempo` est le nom de la base de données (défini par `MONGO_URI` dans `docker-compose.yml`)
- `--authenticationDatabase admin` est requis car l'utilisateur root est créé dans la base `admin`
  (comportement standard de `MONGO_INITDB_ROOT_USERNAME`/`MONGO_INITDB_ROOT_PASSWORD`)

**Important** : les identifiants root ne sont appliqués qu'à l'initialisation d'un volume `mongo_data`
**vide**. Si tu changes `MONGO_ROOT_USERNAME`/`MONGO_ROOT_PASSWORD` dans `.env` après le premier démarrage,
il faut supprimer le volume pour que le changement prenne effet :

```sh
docker-compose down -v && docker-compose up --build
```

⚠️ Cette commande efface toutes les données de la base (exercices et utilisateurs).

### 4. Exécuter les tests HTTP

1. Ouvrir `backend/auth.http` dans WebStorm et exécuter les requêtes **dans l'ordre**, du haut vers le
   bas, en cliquant sur le bouton "Run" (▷) au-dessus de chaque requête. Les requêtes #6 et #7 capturent
   les tokens JWT des utilisateurs A et B dans des variables globales (`tokenUserA`, `tokenUserB`),
   réutilisées par `exercises.http`.
2. Ouvrir ensuite `backend/exercises.http` et exécuter les requêtes dans l'ordre. La requête #2 capture
   l'id de l'exercice créé dans une variable globale (`exerciceId`), réutilisée par les requêtes suivantes.
3. Valider les codes de statut retournés par chaque requête.

`auth.http` :

| # | Requête                                          | Code attendu |
|---|---------------------------------------------------|--------------|
| 1 | `POST /register` — inscription valide (userA)      | 201          |
| 2 | `POST /register` — email déjà utilisé              | 409          |
| 3 | `POST /register` — mot de passe trop court         | 400          |
| 4 | `POST /register` — email mal formé                 | 400          |
| 5 | `POST /register` — inscription valide (userB)      | 201          |
| 6 | `POST /login` — connexion valide (userA)           | 200          |
| 7 | `POST /login` — connexion valide (userB)           | 200          |
| 8 | `POST /login` — mauvais mot de passe               | 401          |
| 9 | `POST /login` — email inconnu                      | 401          |

`exercises.http` :

| #  | Requête                                                | Code attendu |
|----|---------------------------------------------------------|--------------|
| 0  | `GET` — sans token                                       | 401          |
| 1  | `GET` — lister les exercices (userA)                     | 200          |
| 2  | `POST` — exercice valide (avec tempo)                    | 201          |
| 3  | `POST` — exercice valide (sans tempo)                    | 201          |
| 4  | `POST` — tempo hors plage (< 40)                         | 400          |
| 5  | `POST` — nom dupliqué pour le même utilisateur           | 409          |
| 5b | `POST` — même nom, autre utilisateur (userB)             | 201          |
| 6  | `PATCH` — mise à jour du tempo (userA sur son exercice)  | 200          |
| 6b | `PATCH` — userB sur l'exercice de userA                  | 404          |
| 7  | `PATCH` — id inexistant (bien formé)                     | 404          |
| 7b | `DELETE` — userB sur l'exercice de userA                 | 404          |
| 8  | `DELETE` — suppression de l'exercice, par userA           | 204          |
| 9  | `DELETE` — id inexistant (bien formé)                    | 404          |
| 10 | `PATCH` — id malformé (`id-invalide`)                    | 400          |

Si des tests retournent 500 au lieu du code attendu, le backend tourne probablement sur une image Docker
périmée — relancer avec `docker-compose up --build`.

## Frontend — Tester sur un iPhone (même réseau Wi-Fi)

Vite écoute déjà sur toutes les interfaces réseau (`server.host: true`), donc l'app est accessible
depuis un autre appareil sur le même réseau local — mais deux variables d'environnement doivent
pointer vers l'IP locale de l'ordinateur plutôt que `localhost` :

1. Trouver l'IP locale du Mac :
   ```sh
   ipconfig getifaddr en0
   ```
2. Dans `docker-compose.yml` :
   - `VITE_API_URL` (service `frontend`) doit être `http://<IP_LOCALE>:3000` — c'est le navigateur du
     client (l'iPhone) qui résout cette adresse, pas le conteneur. `localhost` y pointerait vers
     l'iPhone lui-même, pas vers l'ordinateur.
   - `CORS_ORIGIN` (service `backend`) doit inclure `http://<IP_LOCALE>:5173` dans sa liste
     d'origines séparées par des virgules, en plus de `http://localhost:5173` (pour continuer à
     fonctionner depuis le navigateur du Mac).
3. Redémarrer les conteneurs pour appliquer les nouvelles variables d'environnement :
   ```sh
   docker-compose up
   ```
4. Sur l'iPhone (connecté au même Wi-Fi), ouvrir `http://<IP_LOCALE>:5173` dans le navigateur.

**Note** : l'IP locale peut changer si le routeur la réattribue (DHCP). Si l'app cesse d'être accessible
depuis le téléphone après un certain temps, revalider l'IP avec `ipconfig getifaddr en0` et mettre à jour
`docker-compose.yml` en conséquence.

## Déploiement en production (architecture cible — non implémentée)

**Statut : documentation seulement.** Rien ci-dessous n'est en place dans `docker-compose.yml` — c'est la
référence à suivre le jour où un vrai déploiement public sera fait, une fois l'Étape 6 (tests automatisés,
voir `TODO.md`) complétée. Contexte : projet étudiant à but pédagogique, faible charge attendue, mais
l'objectif est d'appliquer de vraies pratiques "grade production" plutôt que de couper les coins ronds,
tout en gardant un coût minime.

### Vue d'ensemble

```
[ iPhone / navigateur ] → HTTPS (TLS 1.3)
        ▼
[ Cloudflare ]  — DNS, WAF, CDN, anti-DDoS (plan gratuit)
        ├──▶ app.tondomaine.com ──▶ [ Vercel/Netlify ]  (build statique Vue.js, gratuit)
        └──▶ api.tondomaine.com ──▶ [ VPS Linux ] (Hetzner/DigitalOcean/OVH, ~5$/mois)
                                          ├─ Caddy (reverse proxy, TLS via certificat
                                          │  Cloudflare Origin CA — mode "Full strict")
                                          └─ Conteneur backend (déjà durci : helmet,
                                             rate-limit, non-root, Mongo authentifié)
                                                ▼ TLS (mongodb+srv://)
                                          [ MongoDB Atlas M0 ]  (gratuit, managé, isolé)
```

**Coût estimé : ~5-7$/mois** — le VPS (~4-6$/mois) et le nom de domaine (~1$/mois amorti) sont les seuls
postes payants. Cloudflare, Vercel/Netlify, MongoDB Atlas M0 et GitHub Actions sont gratuits à cette échelle.

**Pourquoi cette répartition** :
- Le frontend est une SPA compilée en fichiers statiques — un CDN gratuit (Vercel/Netlify) la sert mieux
  qu'un serveur maison, sans le coût de le gérer soi-même
- Le backend reste sur un VPS Docker plutôt qu'en serverless : il est déjà écrit et déjà durci (Étape 5),
  le réécrire en fonctions serverless serait un détour pédagogique inutile
- MongoDB Atlas plutôt qu'un Mongo auto-hébergé sur le VPS : évite la responsabilité opérationnelle
  (patchs, sauvegardes, monitoring de la base) — et illustre une pratique "grade production" courante,
  séparer la base de l'infrastructure applicative

### Le point clé : Cloudflare seul ne donne pas de HTTPS de bout en bout

Cloudflare chiffre la connexion entre le client et son propre edge — mais le segment **Cloudflare → origine**
(Vercel et le VPS) est un deuxième saut séparé, avec son propre mode de chiffrement configurable côté
Cloudflare :

- **Flexible** : Cloudflare↔origine en HTTP simple, non chiffré — à proscrire ici (JWT et mots de passe transitent)
- **Full** : HTTPS entre Cloudflare et l'origine, mais avec n'importe quel certificat, même non validé
- **Full (strict)** : HTTPS avec un certificat valide sur l'origine — c'est le mode requis pour un vrai
  chiffrement de bout en bout

Vercel/Netlify gèrent ça nativement. Pour le VPS, ça implique d'installer **Caddy** en reverse proxy devant
le conteneur backend, avec un certificat **Cloudflare Origin CA** (gratuit, généré depuis le dashboard
Cloudflare, valide spécifiquement pour le segment Cloudflare↔origine — pas besoin de Let's Encrypt ici).

### Ajustements de configuration nécessaires le jour du déploiement

- `Config.CORS_ORIGINS` (backend) : remplacer les origines locales par `https://app.tondomaine.com`
- `VITE_API_URL` (frontend) : variable de build configurée dans le dashboard Vercel/Netlify, pointant vers
  `https://api.tondomaine.com`
- `MONGO_URI` (backend) : remplacer par la chaîne `mongodb+srv://...` fournie par Atlas (TLS activé par
  défaut, pas besoin de `?authSource=admin` comme en local)
- Retirer le service `db` de `docker-compose.yml` sur le VPS — Atlas le remplace entièrement
- Sur Atlas : restreindre l'accès réseau à l'IP du VPS uniquement (pas `0.0.0.0/0`), créer un utilisateur DB
  dédié avec accès limité à la base `drumtempo` plutôt qu'un compte admin du cluster

### Secrets en production

Plus de `.env` de développeur sur une machine locale. Les secrets (`JWT_SECRET`, chaîne de connexion Atlas)
doivent être injectés comme variables d'environnement au niveau du VPS (permissions de fichier restreintes)
ou via un gestionnaire de secrets (ex: Doppler, 1Password, Vault) — jamais committés, jamais dans une image
Docker.

### Limite du tier gratuit Atlas (M0)

Le tier M0 **n'inclut pas les sauvegardes automatiques** (fonctionnalité payante à partir du tier M10).
Pour ce projet, c'est acceptable tel quel vu le faible enjeu — mais une alternative peu coûteuse existe si
une vraie posture de sauvegarde est souhaitée : un script `mongodump` planifié (cron) qui pousse une
sauvegarde vers un stockage objet bon marché (ex: Backblaze B2, quelques cents/mois).

### Principe du pipeline CI/CD

GitHub Actions (gratuit à cette échelle) exécute la suite de tests (Étape 6) à chaque push/PR. Une fois
l'Étape 6 en place, le déploiement peut être conditionné à des tests verts : build + push de l'image Docker
backend vers le VPS, et déploiement automatique du frontend par Vercel/Netlify (déclenché nativement par un
push sur la branche principale, sans configuration additionnelle côté GitHub Actions).

### Déploiement effectif du backend (Étape 8.4)

**Statut : implémenté.** `docker-compose.prod.yml` et `caddy/Caddyfile` sont les fichiers réels utilisés sur
le VPS — contrairement au reste de cette section (toujours au stade documentation pour 8.5-8.7).

Différences avec `docker-compose.yml` (dev) :
- pas de service `db` (remplacé par Atlas)
- `backend` tourne sans bind-mount (image buildée telle quelle, `npm run build && npm run start`) et
  n'expose aucun port sur l'hôte — seul `caddy` est joignable depuis l'extérieur
- `caddy` fait office de reverse proxy TLS devant le backend, certificat Cloudflare Origin CA (mode "Full
  strict", voir plus haut)

**Préparation ponctuelle (une seule fois) :**

1. Cloudflare : SSL/TLS → mode "Full (strict)". DNS → enregistrement `A` `api` → IP du VPS, proxifié
   (nuage orange). SSL/TLS → Origin Server → *Create Certificate* pour `api.drumtempo.com` → récupérer le
   certificat PEM et la clé privée.
2. Sur le VPS, dans le dossier du dépôt cloné :
   ```sh
   mkdir -p caddy/certs
   # coller le certificat Cloudflare dans caddy/certs/origin.pem
   # coller la clé privée dans caddy/certs/origin-key.pem
   chmod 600 caddy/certs/origin-key.pem
   ```
3. Créer `.env.prod` à partir de `.env.prod.example` (jamais commité, reste sur le VPS) : `JWT_SECRET`
   généré via `openssl rand -hex 64` (**distinct** du secret de dev), `MONGO_URI` = chaîne Atlas de
   l'utilisateur applicatif dédié (Étape 8.2).

**Déploiement / redéploiement :**

```sh
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

(`docker compose`, sans tiret : le VPS a le *plugin* Docker Compose, pas le binaire autonome `docker-compose`
utilisé en local.)

**Test manuel :**
```sh
curl -I https://api.drumtempo.com/health   # 200, certificat valide
```
Puis rejouer `backend/auth.http` et `backend/exercises.http` en pointant vers `https://api.drumtempo.com`
au lieu de `localhost:3000`.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

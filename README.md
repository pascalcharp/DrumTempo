# drum_companion

This template should help get you started developing with Vue 3 in Vite.

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


# DEVLOG - DrumTempo

## 2026-07-20 — Étape 0 : Réorganisation du scaffold

- Déplacement du scaffold Vue 3 + Vite dans `/frontend` (src/, public/, index.html, vite.config.js, jsconfig.json, package.json)
- Suppression des composants par défaut : `HelloWorld.vue`, `TheWelcome.vue`, `WelcomeItem.vue`, dossier `icons/`, `assets/logo.svg`
- `App.vue` réduit à une base vierge avec `<h1>DrumTempo</h1>`
- CSS remplacé : `base.css` et `main.css` adaptés en mobile-first (max-width 480px, police système, dark mode)
- `npm install` relancé dans `/frontend`
- `node_modules` orphelin à la racine supprimé

## 2026-07-20 — Étape 1 : Infrastructure Docker et environnement

- Création de `/backend/` : Express + TypeScript minimal (`src/index.ts`, route `/health`)
- Création de `backend/src/config/Config.ts` : classe de constantes globales (PORT, MONGO_URI)
- Création de `backend/tsconfig.json` (strict, CommonJS, ES2022)
- Création de `backend/Dockerfile` et `frontend/Dockerfile` (node:22-alpine, dev mode)
- Création de `docker-compose.yml` : 3 services (drumtempo-db, drumtempo-backend, drumtempo-frontend)
- Mise à jour de `frontend/vite.config.js` : `server.host: true` pour écoute sur 0.0.0.0 dans Docker
- `npm install` exécuté dans `/backend` pour le support IDE

## 2026-07-20 — Étape 2 : Modèle de données et connexion MongoDB

- Création de `backend/src/config/ExerciseConfig.ts` : TEMPO_MIN=40, TEMPO_MAX=300, NAME_MAX_LENGTH=100
- Création de `backend/src/db/database.ts` : connexion Mongoose avec gestion d'erreurs
- Création de `backend/src/models/Exercise.ts` : schéma Mongoose avec `current_tempo` optionnel (null si aucun tempo encore déterminé), validateur personnalisé pour la plage de tempo
- Mise à jour de `backend/src/index.ts` : connexion DB avant démarrage du serveur Express
- Création de `backend/src/scripts/testModel.ts` : script de test temporaire (5 cas : tempo null, tempo valide, tempo trop bas, tempo trop haut, nom dupliqué)
- Mise à jour de `CLAUDE.md` : `current_tempo` marqué comme optionnel (Number | null)

## 2026-07-20 — Étape 3 : API REST

- CORS configuré via `Config.CORS_ORIGIN` (variable d'environnement injectée par Docker)
- 4 routes implémentées dans `backend/src/routes/exerciseRoutes.ts` (implémentation par l'utilisateur) :
  - `GET /api/exercises` — `Exercise.find().lean()`
  - `POST /api/exercises` — `new Exercise(req.body).save()`
  - `PATCH /api/exercises/:id` — `findByIdAndUpdate` avec `{ runValidators: true, new: true }`
  - `DELETE /api/exercises/:id` — `findByIdAndDelete`, retourne 204

## 2026-07-21 — Tests HTTP reproductibles pour l'API

- Création de `backend/exercises.http` : fichier de requêtes HTTP (format WebStorm/JetBrains) couvrant les 4 routes de l'API `/api/exercises`, plus des cas d'erreur (tempo hors plage, nom dupliqué, id inexistant en PATCH/DELETE)
- Remplace les tests manuels ad hoc faits via l'outil HTTP de WebStorm/Postman par des requêtes rejouables et versionnées
- Diagnostic : erreur 500 au test #2 causée par l'index unique sur `name` (le catch générique des routes renvoie 500 pour toute erreur, y compris une clé dupliquée) — se produit si la base contient déjà un exercice "Paradiddle" d'une exécution précédente
- Décision : pour l'instant, réinitialiser manuellement la base via `mongosh` avant de rejouer `exercises.http`. Documentation détaillée du processus dans `README.md` à faire plus tard (Étape 3, TODO)

## 2026-07-21 — Granularité des erreurs API (en cours)

- Squelette ajouté dans `exerciseRoutes.ts` (POST, PATCH, DELETE) : TODO avec indices sur les propriétés Mongoose à vérifier (`err.name === 'ValidationError'` -> 400, `err.name === 'CastError'` -> 400, `err.code === 11000` -> 409) avant le fallback 500
- TODO ajouté dans `ExerciseConfig.ts` pour les nouvelles constantes de message
- Ajout du test #10 dans `exercises.http` (id malformé) pour valider le futur comportement
- Implémentation de la logique et des messages laissée à l'utilisateur
- Bug de déploiement trouvé en testant : `docker-compose.yml` ne montait aucun volume pour `/backend`, donc les modifications sur l'hôte n'atteignaient jamais le conteneur en cours d'exécution (image figée au dernier build) — les 3 nouveaux cas d'erreur retournaient encore 500
- Correctif : ajout d'un volume monté (`./backend:/app` + volume anonyme pour `/app/node_modules`) dans `docker-compose.yml` pour que `tsx watch` recharge les changements sans rebuild
- ✅ Tests 4, 5 et 10 confirmés (400/409/400) après rebuild — granularité des erreurs API complétée
- Documentation ajoutée dans `README.md` : section "Backend — Tester l'API REST" avec prérequis, commande de reset `mongosh`, procédure d'exécution de `exercises.http` et tableau des codes de statut attendus (Étape 3 du TODO complétée)

## 2026-07-21 — Documentation OpenAPI / Swagger UI

- Ajout des dépendances `swagger-jsdoc`, `swagger-ui-express` (+ types)
- Création de `backend/src/config/SwaggerConfig.ts` : constantes (titre, version, description, chemin `/api-docs`, glob des fichiers annotés)
- Création de `backend/src/docs/swaggerSpec.ts` : génération du spec OpenAPI 3.0 via `swagger-jsdoc`
- Annotations `@openapi` ajoutées : schéma `Exercise` dans `Exercise.ts`, les 4 routes dans `exerciseRoutes.ts` (paramètres, corps de requête, réponses 200/201/204/400/404/409/500)
- `index.ts` : montage de Swagger UI sur `SwaggerConfig.DOCS_PATH` (`/api-docs`)
- `README.md` : section "Backend — Documentation de l'API" ajoutée
- Bug de déploiement trouvé au premier `docker-compose up --build` après l'ajout des dépendances : le volume anonyme `/app/node_modules` (créé lors du build précédent) était réattaché tel quel par-dessus la nouvelle image, masquant `swagger-ui-express` fraîchement installé (`Cannot find module`). Correctif documenté dans `README.md` : utiliser `docker-compose up --build -V` après tout changement de `package.json`

## 2026-07-21 — Étape 4 : Interface Utilisateur (démarrage)

- Décision UX : mise à jour du tempo via boutons +/- par incrément fixe (5 BPM), plutôt qu'un champ numérique libre
- Création de `frontend/src/config/ApiConfig.js` (URL de base depuis `VITE_API_URL`) et `frontend/src/config/TempoConfig.js` (TEMPO_MIN, TEMPO_MAX, TEMPO_STEP)
- Création de `frontend/src/services/exerciseService.js` : wrapper fetch pour les 4 routes de l'API
- Styles de base ajoutés dans `base.css` : boutons et inputs avec zone de clic ≥ 48px (format iPhone)
- Squelettes créés avec TODOs (implémentation par l'utilisateur) : `ExerciseList.vue`, `ExerciseForm.vue`, `App.vue`
- Implémentation par l'utilisateur : `ExerciseList.vue` (emit ajuster-tempo/supprimer, boutons désactivés aux bornes) et handlers dans `App.vue` (chargement au montage, `handleAjustertempo`, `handleSupprimer`)
- Bugs trouvés en revue avant test : décalage d'arguments entre l'emit `ajuster-tempo` (2 args) et `handleAjustertempo` (3 args), et `exercices.value` remplacé par l'objet unique retourné par `mettreAJourTempo` au lieu de mettre à jour un seul élément du tableau — corrigés par l'utilisateur
- ✅ Cycle liste / +5/-5 BPM / suppression confirmé fonctionnel dans le navigateur — reste `ExerciseForm.vue` (ajout) à compléter
- Implémentation de `ExerciseForm.vue` par l'utilisateur : bug trouvé en revue — `@submit.prevent` posé sur le `<button>` au lieu du `<form>` (l'événement `submit` ne se déclenche que sur le `<form>`), causant un rechargement natif de la page sans appel à l'API. Corrigé.
- ✅ Étape 4 complétée et confirmée : cycle complet (ajout, +5/-5 BPM, suppression, persistance) fonctionnel de bout en bout

## 2026-07-22 — Étape 5.1 + 5.2 : Authentification & secrets

- Dépendances ajoutées : `bcrypt`, `jsonwebtoken`, `dotenv` (+ types)
- `backend/.env` (non versionné) + `backend/.env.example` (versionné) : `JWT_SECRET`, `JWT_EXPIRES_IN`,
  `BCRYPT_SALT_ROUNDS`. `backend/src/env.ts` charge `dotenv` en tout premier dans `index.ts`. `AuthConfig.ts`
  lit ces variables et lève une erreur au démarrage si `JWT_SECRET` est absent
- `backend/src/models/User.ts` : schéma `email`/`passwordHash` (`select: false`), hook `pre('save')` pour le
  hachage bcrypt et méthode `comparePassword` — implémentés par l'utilisateur à partir d'un squelette avec
  indices
- `backend/src/middleware/requireAuth.ts` : extraction/vérification du JWT (`Authorization: Bearer`),
  attache `req.userId` — implémenté par l'utilisateur. Type `Express.Request.userId` ajouté par déclaration
  globale dans `backend/src/types/express.d.ts`
- `backend/src/routes/authRoutes.ts` : `POST /register` et `POST /login`, documentés en OpenAPI (avec
  schéma de sécurité `bearerAuth` ajouté à `swaggerSpec.ts` et appliqué aux 4 routes `/api/exercises`) —
  implémentés par l'utilisateur
- Décision de conception (validée avec l'utilisateur) : unicité du nom d'exercice passée de globale à
  scopée par utilisateur (index composé `{ name, owner }` sur `Exercise`), pour que deux utilisateurs
  puissent chacun avoir un exercice du même nom (ex. "Paradiddle")
- Toutes les routes `/api/exercises` protégées par `requireAuth` dans `index.ts` ; filtrage/assignation par
  `owner` implémenté par l'utilisateur dans les 4 handlers de `exerciseRoutes.ts`
- Bugs trouvés en revue et corrigés par l'utilisateur pendant l'implémentation :
  - Hook `pre('save')` mélangeant callback (`next`) et `async/await` sans `try/catch` : une erreur dans
    `bcrypt.hash` n'aurait jamais appelé `next()`, bloquant `.save()` indéfiniment. Corrigé avec un
    `try/catch` explicite (`next()` / `next(err)`)
  - `POST /register` : bloc de code mort laissé après le `try/catch` (ancien commentaire TODO), causant un
    double envoi de réponse (`ERR_HTTP_HEADERS_SENT`) à chaque appel ; absence de `return` après le 400 de
    validation du mot de passe, qui n'empêchait donc pas la création malgré un mot de passe trop court
  - `POST /login` : même bloc de code mort laissant le `try` sans `catch`, erreur de syntaxe
  - `jwt.sign` : erreur de surcharge TypeScript sur `expiresIn` (`AuthConfig.JWT_EXPIRES_IN` typé `string`
    générique, incompatible avec le type `StringValue` attendu par `@types/jsonwebtoken`) — résolu par une
    assertion de type au point d'appel
  - `PATCH /api/exercises/:id` : destructuration `const {ownerToDiscard, ...updates}` qui ne retirait pas
    réellement `owner` de `req.body` (clé inexistante) ; et `updates` glissé par erreur à l'intérieur du
    filtre de `findOneAndUpdate` au lieu d'être passé comme deuxième argument séparé — rendait la route
    non fonctionnelle à 100 % (404 systématique), corrigé par l'utilisateur
- `backend/auth.http` créé (inscription/connexion, cas valides et invalides, deux utilisateurs A/B) ;
  `backend/exercises.http` mis à jour (token requis sur toutes les requêtes, cas croisés userA/userB pour
  valider l'absence de fuite entre propriétaires)
- `README.md` mis à jour : section "Configurer les secrets", reset DB incluant `users`, tableaux de tests
  pour `auth.http` et `exercises.http`
- Ajout à `CLAUDE.md`, à la demande de l'utilisateur : "La lisibilité est une PRIORITÉ ABSOLUE" dans la
  section Style de programmation
- ✅ Étape 5.1 et 5.2 complétées et confirmées par l'utilisateur (cycle complet testé via `auth.http` et
  `exercises.http`, y compris les cas de séparation entre utilisateurs)

## 2026-07-22 — Étape 5.3 : Sécurisation de MongoDB

- `.env` racine (non versionné) + `.env.example` (versionné) : `MONGO_ROOT_USERNAME`, `MONGO_ROOT_PASSWORD`
  — chargés automatiquement par Docker Compose (`${VAR}`) depuis un `.env` situé à côté de
  `docker-compose.yml`, distinct de `backend/.env` (secrets applicatifs lus par `dotenv`)
- `docker-compose.yml` : service `db` reçoit `MONGO_INITDB_ROOT_USERNAME`/`MONGO_INITDB_ROOT_PASSWORD` ;
  `MONGO_URI` du service `backend` mis à jour avec les identifiants + `?authSource=admin`
- Volume `mongo_data` supprimé et recréé (`docker-compose down -v`) — nécessaire car
  `MONGO_INITDB_ROOT_*` ne s'applique qu'à l'initialisation d'un volume vide (confirmé avec l'utilisateur
  avant l'exécution, données de test effacées)
- `README.md` mis à jour : section secrets (deux `.env` distincts), commande de reset DB avec
  `-u`/`-p`/`--authenticationDatabase admin`, avertissement sur la suppression du volume
- ✅ Étape 5.3 confirmée : `mongosh` sans identifiants → `MongoServerError: Command find requires
  authentication` ; avec identifiants (`-u`/`-p`/`--authenticationDatabase admin`) → succès. Backend
  connecté normalement via le `MONGO_URI` authentifié (`Connected to MongoDB` dans les logs)

## 2026-07-22 — Étape 5.4 : Durcissement HTTP

- Dépendances ajoutées : `helmet`, `express-rate-limit`
- Création de `backend/src/config/HttpConfig.ts` : `JSON_BODY_LIMIT` (10kb), `RATE_LIMIT_WINDOW_MS`
  (15 min), `RATE_LIMIT_MAX_REQUESTS` (100), message 429
- `index.ts` : `helmet()` en tout premier middleware ; limite de taille appliquée à `express.json()` ;
  rate-limiter monté sur le préfixe `/api` (avant `authRoutes`/`exerciseRoutes`, donc actif même sur les
  requêtes non authentifiées) — `/health` et `/api-docs` non affectés
- ✅ Tests confirmés : en-têtes de sécurité (`Content-Security-Policy`, `X-Frame-Options`, etc.) présents
  via `curl -I` ; 100 requêtes sur `/api/exercises` traitées normalement puis 429 à partir de la 101e ;
  `/health` accessible pendant le blocage ; payload JSON de 20kb → 413
- Le rate-limiter étant en mémoire (par IP), un test répété depuis la même machine épuise le quota partagé
  pour ~15 minutes — le conteneur `backend` a été redémarré après les tests pour réinitialiser le compteur
  avant de rendre la main pour les tests manuels (`auth.http`/`exercises.http`)

## 2026-07-22 — Étape 5.5 : Validation et sanitation des entrées

- **Faille trouvée** : `POST /api/auth/login` avec `{"email":{"$ne":null},"password":{"$ne":null}}`
  retournait 500 — le filtre `email: {$ne: null}` était transmis tel quel à MongoDB (opérateur réellement
  interprété, pas juste une erreur de validation), le 500 venait de `bcrypt.compare` plantant sur un mot de
  passe non-string. Un attaquant fournissant un vrai mot de passe en clair aurait pu matcher un utilisateur
  arbitraire de la collection via l'opérateur, un vecteur d'injection NoSQL classique
- **Correctif** : `mongoose.set('sanitizeFilter', true)` activé globalement dans `backend/src/db/database.ts`
  — Mongoose neutralise désormais toute clé `$`-préfixée dans les filtres de requête (les traite comme une
  valeur littérale plutôt qu'un opérateur), pour toutes les requêtes de l'application
- Effet de bord découvert : une fois l'opérateur neutralisé, Mongoose tente de caster l'objet résiduel vers
  le type `String` du champ `email` et lève un `CastError` — non géré dans `login` (seule route sans
  `switch(true)` sur `err.name`, contrairement à `register` et aux routes `/api/exercises`). Ajouté par
  l'utilisateur : cas `CastError` → 400 dans le `catch` de `login`
- Audit des autres routes : `register` (déjà 400 via `ValidationError`, la casse échoue au niveau du
  document et pas de la requête), `PATCH`/`DELETE` de `exerciseRoutes.ts` (déjà `CastError` → 400) — `login`
  était le seul point d'entrée non couvert
- Vérifié également : tempo non numérique (`ValidationError` déjà géré → 400) et nom d'exercice trop long
  (`maxlength` du schéma déjà en place → 400) — aucun changement nécessaire, comportement déjà correct
- Tests effectués directement via `curl` contre le backend en cours d'exécution (utilisateur/exercices de
  test nettoyés de la base après coup)
- ✅ Étape 5.5 confirmée : injection `$ne` → 400 propre, login légitime toujours fonctionnel

## 2026-07-22 — Étape 5.6 : Durcissement Docker (utilisateur non-root)

- `backend/Dockerfile` et `frontend/Dockerfile` : bascule vers l'utilisateur `node` (déjà présent dans
  l'image `node:22-alpine`, uid 1000) au lieu de tourner en root
- Premier essai raté : `USER node` placé juste avant `CMD` (après `COPY`/`RUN npm install` en root) —
  laissait `/app` et `node_modules` root-owned, ce qui aurait cassé toute écriture ultérieure sous `/app`
  (ex: cache de pré-bundling Vite dans `node_modules/.vite`)
- Deuxième essai raté : bascule vers `node` avant `npm install` avec `COPY --chown=node:node`, mais
  `WORKDIR /app` crée le répertoire `/app` lui-même appartenant à `root` — `--chown` sur `COPY` ne change
  que les fichiers copiés, pas le répertoire parent, donc `npm install` échouait à créer `node_modules`
  (`EACCES`, "The operation was rejected by your operating system")
- Correctif final : `RUN chown node:node /app` (en root, juste après `WORKDIR`) avant de basculer vers
  `USER node`, puis `COPY --chown=node:node` et `npm install` en tant que `node`
- ✅ Rebuild (`docker-compose up --build -V`) réussi ; `docker exec drumtempo-backend/-frontend whoami` →
  `node` dans les deux conteneurs ; aucune erreur de permission dans les logs ; test de fumée complet
  (register → login → création d'exercice → liste) confirmé via `curl` après le changement d'utilisateur

## 2026-07-21 — Accès depuis un iPhone sur le réseau local

- `Config.CORS_ORIGIN` (string unique) remplacé par `Config.CORS_ORIGINS` (tableau, parsé depuis une liste séparée par des virgules) dans `backend/src/config/Config.ts` et `index.ts`, pour accepter plusieurs origines simultanément (Mac via `localhost` + iPhone via IP locale)
- `docker-compose.yml` : `CORS_ORIGIN` inclut maintenant `http://localhost:5173` et `http://192.168.2.61:5173` ; `VITE_API_URL` pointe vers l'IP locale (`http://192.168.2.61:3000`) plutôt que `localhost`, puisque cette variable est résolue par le navigateur du client, pas par le conteneur
- Documentation ajoutée dans `README.md` : section "Frontend — Tester sur un iPhone (même réseau Wi-Fi)"
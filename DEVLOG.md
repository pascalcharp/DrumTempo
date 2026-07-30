
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

## 2026-07-25 — Étape 7.1/7.2 : authentification frontend (plomberie + écran de connexion)

- Plomberie écrite directement (Étape 7.1) : `AuthConfig.js` (endpoints login/register, clé `localStorage`),
  `tokenStorage.js`, `httpClient.js` (extraction de `traiterReponse`, partagée avec `exerciseService.js`,
  erreur enrichie d'un `.status` pour la détection du 401 à l'Étape 7.3), `authService.js` (`login`,
  `register`), `exerciseService.js` mis à jour avec l'en-tête `Authorization: Bearer <token>` sur les 4 appels
- Squelettes laissés en TODO pour l'utilisateur : `exerciseService.test.js`, `authService.test.js` (restent à
  faire), `LoginForm.vue`, `LoginForm.test.js`
- Implémentation de `LoginForm.vue` par l'utilisateur (Étape 7.2) : `basculerMode()` via table de
  correspondance (`modeToggler`) plutôt qu'un if/else — jugé plus lisible et gardé tel quel malgré la règle
  "aucune constante codée en dur" (valeurs strictement locales à ce composant, extraction jugée dogmatique
  pour ce cas précis)
- Bug trouvé en revue dans `soumettre()` : la charge utile émise était `(email.value, mode.value)` au lieu de
  `{ email, password }` — le mot de passe n'était jamais transmis. Corrigé en une ligne :
  `emit(mode.value, { email: email.value, password: motDePasse.value })` (le `switch` initial était
  redondant, `mode.value` valant déjà le nom de l'événement à émettre)
- `LoginForm.test.js` complété par l'utilisateur : 4 cas (connexion par défaut, bascule vers inscription,
  double bascule qui revient à connexion, affichage du message d'erreur). Import résiduel non utilisé
  (`TempoConfig`, copié depuis `ExerciseForm.test.js`) trouvé en revue et retiré
- ✅ Étape 7.1 (plomberie) et 7.2 entièrement complétées et confirmées : `npm test` (frontend) tous verts.
  Reste : tests `exerciseService.test.js`/`authService.test.js` (7.1) et orchestration `App.vue` (7.3,
  `handleConnexion`/`handleInscription`/`handleDeconnexion`/gestion du 401 encore en TODO)

## 2026-07-25 — Étape 7.3 : orchestration de l'authentification dans `App.vue`

- Décision validée : inscription enchaîne automatiquement sur `handleConnexion` (pas de message "connectez-
  vous manuellement") — `register()` puis réutilisation de `handleConnexion({email, password})`
- `handleConnexion`, `handleInscription`, `handleDeconnexion` implémentés par l'utilisateur à partir du
  squelette avec indices
- Bug trouvé en revue dans `gererErreurApi` (branche 401) : le message "Session expirée" était écrit dans
  `erreur.value` au lieu de `erreurAuth.value`. Or dès qu'un 401 survient, `token.value` passe à `null` et le
  template bascule vers `<LoginForm :erreur="erreurAuth">` — le paragraphe lié à `erreur` (dans le bloc
  `v-else`, réservé à la session active) ne s'affiche plus du tout à ce moment. Le message était donc perdu
  silencieusement. Corrigé en écrivant dans `erreurAuth.value`
- Constante `AuthConfig.SESSION_EXPIREE_MESSAGE` ajoutée (message flaggé comme "à confirmer" par
  l'utilisateur lui-même dans un commentaire ; extraction jugée justifiée ici — contrairement à
  `modeToggler` — car il existe un précédent direct dans le projet (`ApiConfig.messageErreurHttpParDefaut`
  pour le même type de message HTTP)
- 5 cas ajoutés à `App.test.js` par l'utilisateur (squelette avec indices) : écran de connexion sans token,
  connexion réussie, échec de connexion, déconnexion, retour à la connexion sur 401 (ce dernier vérifie
  explicitement `props('erreur') === AuthConfig.SESSION_EXPIREE_MESSAGE`, plutôt qu'un littéral dupliqué)
- Deux nettoyages mineurs trouvés en revue et corrigés : imports morts (`listerExercices`, `obtenirToken`
  importés directement en plus des namespaces `exerciseService`/`tokenStorage`, jamais utilisés sous cette
  forme — résidu de copier-coller) et `await` manquant sur `disconnectButtonWrapper.trigger('click')`
  (incohérent avec le reste du fichier, source potentielle de flakiness si `handleDeconnexion` devenait un
  jour asynchrone)
- ✅ **Étape 7.3 entièrement complétée et confirmée le 2026-07-25** : `npm test` (frontend) — 38 tests, tous
  verts. **Étape 7 (authentification frontend) essentiellement complète** — reste `exerciseService.test.js`/
  `authService.test.js` (squelettes 7.1 encore en TODO) et le test manuel final de bout en bout via
  `docker-compose up --build`

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

## 2026-07-22 — Étape 5.7 : Audit des dépendances

- `npm audit` sur `/backend` et `/frontend` : `0 vulnerabilities` dans les deux projets, aucun correctif
  nécessaire
- ✅ Étape 5.7 confirmée

## 2026-07-22 — Décision d'architecture de déploiement + réordonnancement du plan

- Architecture de déploiement production retenue (but pédagogique, coût minime, ~5-7$/mois) : Cloudflare
  (DNS/WAF/CDN) → Vercel/Netlify (frontend statique) + VPS Linux avec Caddy + conteneur backend → MongoDB
  Atlas M0 (TLS natif). Détails et raisonnement complet documentés dans `TODO.md` (Étape 5.8)
- Point technique clé identifié : Cloudflare seul ne donne pas de HTTPS de bout en bout — le segment
  Cloudflare→origine doit être en mode "Full (strict)" avec un certificat validé sur l'origine (Caddy +
  certificat Cloudflare Origin CA sur le VPS), sinon ce segment reste soit non chiffré ("Flexible"), soit
  chiffré avec un certificat non validé ("Full")
- Étape 5.8 reformulée : reste documentation seulement (comme prévu à l'origine), mais maintenant concrète
  (architecture ci-dessus) plutôt que générique ("reverse proxy + certificat")
- **Nouvelle Étape 6 ajoutée, avant tout déploiement réel** : tests automatisés (Vitest partout,
  `supertest` + `mongodb-memory-server` côté backend, `@vue/test-utils` côté frontend, CI GitHub Actions).
  Décision motivée par le constat que chaque changement d'infrastructure de l'Étape 5 (rate-limiter,
  utilisateur Docker non-root, `sanitizeFilter`) a dû être revalidé manuellement via `auth.http`/
  `exercises.http` — une suite automatisée capture cette couverture une fois pour toutes
- Le déploiement réel de l'architecture ci-dessus devient une future Étape 7 (pas encore détaillée),
  volontairement après l'Étape 6

## 2026-07-22 — Étape 5.8 : Documentation de l'architecture de déploiement

- Section "Déploiement en production (architecture cible — non implémentée)" ajoutée au `README.md` :
  diagramme, raisonnement du mode Cloudflare "Full (strict)" + Caddy/Origin CA, tableau de coûts,
  ajustements de config à faire le jour venu (`CORS_ORIGINS`, `VITE_API_URL`, `MONGO_URI` Atlas, retrait du
  service `db`), gestion des secrets en prod, limite du tier gratuit Atlas M0 (pas de sauvegarde
  automatique) et alternative `mongodump`, principe du pipeline CI/CD
- ✅ **Étape 5 (Sécurité) entièrement complétée** (5.1 à 5.8) — reste au stade documentation pour le
  déploiement réel, qui attend l'Étape 6

## 2026-07-21 — Accès depuis un iPhone sur le réseau local

- `Config.CORS_ORIGIN` (string unique) remplacé par `Config.CORS_ORIGINS` (tableau, parsé depuis une liste séparée par des virgules) dans `backend/src/config/Config.ts` et `index.ts`, pour accepter plusieurs origines simultanément (Mac via `localhost` + iPhone via IP locale)
- `docker-compose.yml` : `CORS_ORIGIN` inclut maintenant `http://localhost:5173` et `http://192.168.2.61:5173` ; `VITE_API_URL` pointe vers l'IP locale (`http://192.168.2.61:3000`) plutôt que `localhost`, puisque cette variable est résolue par le navigateur du client, pas par le conteneur
- Documentation ajoutée dans `README.md` : section "Frontend — Tester sur un iPhone (même réseau Wi-Fi)"

## 2026-07-22 — Étape 6.1 : Outillage & configuration des tests automatisés

- Backend : ajout de `vitest`, `supertest`, `@types/supertest`, `mongodb-memory-server` (devDependencies),
  script `npm test` (`vitest run`)
- `backend/vitest.config.ts` : environnement `node`, `setupFiles` vers `src/test/setup.ts`, `hookTimeout`
  augmenté à 60s (téléchargement du binaire MongoDB au premier lancement)
- `backend/src/test/setup.ts` : démarre un `MongoMemoryServer` (vrai moteur `mongod`, stockage en RAM,
  instance complètement séparée de la base de dev/Atlas) avant la suite, connecte Mongoose dessus, vide
  les collections après chaque test, ferme tout à la fin
- Test de fumée `backend/src/test/sanity.test.ts` : écrit/relit un document via un modèle Mongoose jetable,
  pour valider la chaîne complète Vitest → MongoDB en mémoire → Mongoose
- Frontend : ajout de `vitest`, `@vue/test-utils`, `jsdom` (devDependencies), script `npm test`
  (`vitest run`), bloc `test` (`environment: 'jsdom'`) ajouté à `vite.config.js`
- Test de fumée `frontend/src/test/sanity.test.js` : monte un composant Vue trivial via
  `@vue/test-utils` et vérifie le rendu
- ✅ Étape 6.1 confirmée le 2026-07-22 : `npm test` réussi dans `/backend` et `/frontend`

## 2026-07-22 — Étape 6.2 : Tests unitaires backend (modèles `Exercise` et `User`)

- `backend/vitest.config.ts` : ajout de `test.env.JWT_SECRET` (valeur de test fixe) — `AuthConfig` exige
  `JWT_SECRET` dès le chargement du module (initialiseur statique) et les tests ne passent pas par
  `env.ts`/`dotenv`, donc ne doivent pas dépendre d'un `.env` local (important pour la CI de l'Étape 6.5)
- `backend/src/models/Exercise.test.ts` : 6 cas — `current_tempo` null valide, rejet sous `TEMPO_MIN`,
  rejet au-dessus de `TEMPO_MAX`, acceptation des bornes exactes, `name` requis, unicité de `name` scopée
  par `owner` (duplicata total rejeté avec code Mongo `11000`, duplicata partiel — même nom, owner
  différent — accepté)
- `backend/src/models/User.test.ts` : 5 cas — mot de passe haché (≠ valeur brute), `comparePassword` vrai/
  faux mot de passe, `email` requis, rejet d'un format d'email invalide
- Bugs trouvés en revue et corrigés par l'utilisateur pendant l'implémentation :
  - Premier test `User` : `expect(...)` appelé sans matcher (`.not.toBe(...)` manquant) — l'assertion ne
    vérifiait rien
  - Test `comparePassword` : appelé sur `savedUser.toObject()` (qui dépouille les méthodes du document
    Mongoose) plutôt que sur le document lui-même, et sans `await` sur une méthode asynchrone
  - Test d'unicité `Exercise` : `it.fails("message")` utilisé à l'intérieur d'un test pour tenter de le
    faire échouer manuellement — n'est pas une assertion valide (ce modificateur ne s'utilise qu'à la
    déclaration d'un test) ; remplacé par `await expect(totalDuplicate.save()).rejects.toMatchObject({
    code: 11000 })`
- ✅ Étape 6.2 confirmée le 2026-07-22 : `npm test` (backend) — 11 tests, tous verts

## 2026-07-23 — Étape 6.3 (en cours) : refactor `app.ts`/`index.ts` + tests d'intégration `auth`

- `backend/src/app.ts` créé : extrait de `index.ts` toute la construction de l'app Express (middlewares,
  routes, Swagger) sans `connectDatabase()` ni `app.listen()`, pour la rendre importable par `supertest`
  sans se connecter à la vraie base ni ouvrir un port. `index.ts` réduit à l'assemblage
  (`connectDatabase().then(() => app.listen(...))`)
- `backend/src/test/authHelper.ts` : `createAuthenticatedUser(email)` crée un utilisateur directement en
  base et signe un token JWT valide, pour les futurs tests de routes `exercises` (évite de retester le
  flot d'inscription/connexion à chaque cas)
- `backend/src/routes/authRoutes.test.ts` : 8 cas (register x4, login x4, dont l'injection d'opérateur
  Mongo `$ne`)
- **Régression de sécurité trouvée et corrigée pendant l'écriture des tests** : `mongoose.set
  ('sanitizeFilter', true)` (protection anti-injection de l'Étape 5.5) était déclaré dans
  `db/database.ts`, en effet de bord au chargement du module — actif seulement quand ce fichier est
  importé. En production `index.ts` l'importe toujours (via `connectDatabase`), mais le nouveau `app.ts`
  ne l'importe pas, et `test/setup.ts` (Étape 6.1) se connecte directement à `MongoMemoryServer` sans
  passer par `connectDatabase()` — la sanitation n'était donc **jamais active pendant les tests**. Le test
  d'injection Mongo l'a révélé : `POST /api/auth/login` avec `{"email":{"$ne":null},"password":"..."}`
  retournait 200 (connexion réussie comme n'importe quel utilisateur existant en base), pas 400.
  Corrigé en déplaçant `mongoose.set('sanitizeFilter', true)` de `db/database.ts` vers `app.ts` — c'est une
  configuration globale de Mongoose, pas une étape de connexion, donc elle doit s'appliquer dès le
  chargement de l'app peu importe comment la connexion Mongo est établie ensuite
- Bugs trouvés en revue et corrigés par l'utilisateur pendant l'implémentation (avant la régression
  ci-dessus) : mot de passe de test trop court pour un cas de succès (6 caractères vs
  `PASSWORD_MIN_LENGTH` = 8) ; `toBeNull()` utilisé alors que la route retire complètement `passwordHash`
  de la réponse (`undefined`, pas `null`) ; premier essai du test d'injection envoyait la chaîne littérale
  `"{$ne: null}"` au lieu d'un véritable objet `{ "$ne": null }` (ne testait donc rien de pertinent)
- `npm test` (backend) : 34 tests, tous verts après le correctif

## 2026-07-23 — Étape 6.3 (suite et fin) : tests `exercises`, nettoyage de l'API, messages de validation

- `backend/src/routes/exerciseRoutes.test.ts` : 12 cas (auth requise x2, CRUD complet, isolation entre
  utilisateurs x3)
- Discussion de conception initiée par l'utilisateur, deux améliorations apportées à l'API pendant
  l'écriture des tests (pas des bugs, des décisions de nettoyage) :
  - `exerciseRoutes.ts` (POST + PATCH) : les erreurs `ValidationError` renvoient maintenant le message
    précis de Mongoose (`Object.values(err.errors).map(...)`, factorisé dans `extractValidationMessage`)
    au lieu du message générique `MSG_MONGOOSE_VALIDATION_ERROR`. Jugé acceptable ici car les bornes de
    validation (tempo, longueur du nom) sont déjà publiques dans la doc Swagger — le message précis
    n'expose rien de nouveau et améliore l'UX (`ExerciseConfig.MSG_MONGOOSE_VALIDATION_ERROR` n'est plus
    utilisé côté exercises, conservé côté auth)
  - `Exercise.ts` : `owner` marqué `select: false` (même pattern que `passwordHash` sur `User`) — exclu par
    défaut de `find`/`findOne`/`findOneAndUpdate`, donc invisible dans `GET`/`PATCH`. Schéma configuré en
    `versionKey: false` — `__v` n'est plus créé du tout. Exception : le document retourné par
    `nouvelExercice.save()` (POST) n'est pas issu d'une requête, donc `select: false` ne s'y applique
    pas — `owner` est retiré manuellement par déstructuration dans `exerciseRoutes.ts`, même raison que le
    retrait de `passwordHash` dans `authRoutes.ts` au register
  - `ExerciseConfig.ts` : constante `MSG_TEMPO_OUT_OF_RANGE` ajoutée (message de validation du tempo,
    auparavant codé en dur dans `Exercise.ts`), sur le même modèle que `UserConfig.MSG_PASSWORD_TOO_SHORT`
- Bugs trouvés en revue et corrigés par l'utilisateur pendant l'implémentation : test "token invalide"
  utilisait `.send({'Authorization': ...})` au lieu de `.set('Authorization', ...)` — l'en-tête n'était
  jamais réellement envoyé, le test passait via la branche "pas de token" plutôt que "token invalide" ;
  test "DELETE sur un id inexistant" utilisait `.patch(...)` au lieu de `.delete(...)` (copier-coller non
  corrigé du test précédent) — passait sans jamais exercer la route DELETE
- ✅ **Étape 6.3 entièrement complétée et confirmée le 2026-07-23** : `npm test` (backend) — 34 tests, tous
  verts (5 fichiers : sanity, `Exercise`, `User`, `authRoutes`, `exerciseRoutes`)

## 2026-07-24 — Étape 6.4 : Tests composants frontend

- `frontend/src/components/ExerciseList.test.js` : 10 cas — rendu nom/tempo (dont `null` → `"-"`), emit
  `ajuster-tempo` sur les boutons `+`/`-`, emit `supprimer`, désactivation des boutons aux bornes
  (`TEMPO_MIN`, `TEMPO_MAX`, `null`), réactivation dynamique après `setProps` — implémentés par
  l'utilisateur, un test à la fois, squelette déjà en place depuis l'Étape 4
- Bug trouvé en revue sur le premier test rempli : `_id` manquant dans les props de l'exercice de test, donc
  `exercice._id` valait `undefined` côté composant — corrigé par l'utilisateur
- `frontend/src/components/ExerciseForm.test.js` : 4 cas — emit `ajouter` avec nom+tempo, `current_tempo:
  null` quand le champ n'est jamais rempli, `current_tempo: null` quand le champ est rempli puis effacé
  (`""`, cas ajouté après coup pour couvrir explicitement la branche `tempo.value === ""` de
  `creerNouvelExercice`), réinitialisation des deux champs après soumission
- `frontend/src/App.test.js` : 5 cas — chargement et affichage au montage, message d'erreur si le
  chargement échoue, ajout d'exercice via `ExerciseForm`, passage de `current_tempo: null` directement à
  `TEMPO_MIN` (pas d'addition du delta à `null`, décision UX de l'Étape 4), suppression via `ExerciseList`
- Discussion de conception sur le test d'erreur réseau : le fallback de message HTTP
  (``Erreur HTTP ${status}``) dans `exerciseService.js` était codé en dur, en violation de la règle
  "aucune constante codée en dur" du `CLAUDE.md` — déplacé vers `ApiConfig.messageErreurHttpParDefaut(status)`.
  Clarifié avec l'utilisateur que, ces tests mockant entièrement `exerciseService`/`fetch`, chaque scénario
  d'erreur est entièrement contrôlé par le test — les assertions peuvent donc rester précises (comparaison
  exacte du message) plutôt qu'affaiblies à une simple vérification de non-vacuité
  - Constante ajoutée dans `ApiConfig.js`, `exerciseService.js` mis à jour pour l'utiliser
- Imports inutilisés relevés en revue (sans impact fonctionnel, non corrigés) : `ExerciseList` dans
  `ExerciseForm.test.js`, `creerExercice` dans `App.test.js`
- ✅ **Étape 6.4 entièrement complétée et confirmée le 2026-07-24** : `npm test` (frontend) — 19 tests, tous
  verts (`ExerciseList` 10, `ExerciseForm` 4, `App.vue` 5)

## 2026-07-24 — Étape 6.5 : Intégration continue (CI)

- `.github/workflows/tests.yml` créé : deux jobs parallèles (`backend-tests`, `frontend-tests`) sur
  `push`/`pull_request` — `actions/checkout@v4`, `actions/setup-node@v4` (Node 22, cache npm via
  `cache-dependency-path` vers chaque `package-lock.json`), `npm ci`, `npm test` dans le répertoire respectif
- Aucune configuration supplémentaire requise : `backend/vitest.config.ts` fournit déjà `JWT_SECRET` en dur
  pour les tests (anticipé dès l'Étape 6.2 pour ne pas dépendre d'un `.env` local en CI), et
  `mongodb-memory-server` télécharge son propre binaire `mongod` — aucun service MongoDB ni secret à
  provisionner dans le workflow
- ✅ Confirmé le 2026-07-24 : premier push déclenche le workflow, les deux jobs passent au vert sur GitHub
- Vérification du chemin d'échec (plan de test de `TODO.md`) : assertion volontairement cassée dans
  `ExerciseList.test.js` (`toHaveLength(2)` → `toHaveLength(3)`), commit+push → workflow rouge confirmé sur
  GitHub ; assertion restaurée, commit+push → workflow vert de nouveau

## 2026-07-26 — Étape 7.1 : tests `authService.test.js` et `exerciseService.test.js`

- `frontend/src/services/authService.test.js` : 4 cas — `login()` retourne le token à la connexion réussie,
  `login()` lance une erreur 401 (identifiants invalides), `register()` retourne l'utilisateur créé,
  `register()` lance une erreur 409 (email déjà utilisé). Mock du `fetch` global (`vi.stubGlobal`), même
  patron que les tests backend d'auth
  - Coquille relevée en revue : une assertion `toMatchObject({ messsage: ... })` (typo, trois "s") comparait
    une clé inexistante et masquait le vrai diff (`Error {status: 401}` sans le message attendu) — corrigée
    en `message`
- `frontend/src/services/exerciseService.test.js` : 5 cas — en-tête `Authorization: Bearer <token>` envoyé
  sur les appels authentifiés (token lu depuis `localStorage` via `AuthConfig.TOKEN_STORAGE_KEY`), corps JSON
  parsé sur réponse OK, erreur avec le message du corps JSON sur réponse non-OK, erreur avec le message de
  fallback (`ApiConfig.messageErreurHttpParDefaut`) si le corps n'a pas de `message`, `null` retourné sur une
  réponse 204 (suppression) — couvre la logique partagée `enTetesAuthentifies`/`traiterReponse`, jamais
  testée directement jusqu'ici (seulement mockée dans `App.test.js`)
- ✅ **Étape 7.1 entièrement complétée et confirmée le 2026-07-26** : `npm test` (frontend) — 7 fichiers,
  38 tests, tous verts. Il ne reste, pour clore l'Étape 7 au complet, que le test manuel de bout en bout
  (`docker-compose up --build`)

## 2026-07-26 — Étape 7 : test manuel final de bout en bout

- `docker-compose up --build -V` : inscription, connexion, mots de passe trop courts/incorrects rejetés,
  CRUD exercices complet (ajout/ajustement/suppression), persistance de session après rafraîchissement,
  déconnexion, redemande de connexion après rafraîchissement une fois déconnecté — tous fonctionnels
- Point UX relevé par l'utilisateur, analysé et confirmé **non bogué** : l'inscription demande 2 clics
  (bascule vers le mode inscription, puis soumission) et enchaîne directement sur la connexion sans écran
  de confirmation intermédiaire — comportement conforme à la décision validée le 2026-07-25 (auto-connexion
  après inscription). `mode.value` piloté par un seul `ref`, lu à la fois par le texte affiché et par
  `soumettre()` dans le même rendu — aucune désynchronisation possible entre les deux boutons. Repoussé à
  une amélioration UX future (ex. message "Inscription réussie" avant la transition), pas une correction
  urgente
- ✅ **Étape 7 (frontend — intégration de l'authentification) entièrement complétée et confirmée le
  2026-07-26.**
- ✅ **Étape 6 (Tests automatisés + CI) entièrement complétée**

## 2026-07-27 — Étape 8.1 : Nom de domaine & Cloudflare

- Domaine `drumtempo.com` enregistré via Cloudflare Registrar (1 an)
- DNS configuré : enregistrements placeholder `app.`/`api.` créés, proxy Cloudflare activé (nuage orange)
  — cibles réelles à ajuster en 8.4 (VPS) et 8.5 (Vercel)
- ✅ Confirmé le 2026-07-27 : `dig` renvoie des IP Cloudflare, domaine "actif" au tableau de bord,
  `nslookup` confirme les nameservers Cloudflare
- ✅ **Étape 8.1 entièrement complétée.** Prochaine étape : 8.2 (MongoDB Atlas M0)

## 2026-07-27 — Étape 8.2 : MongoDB Atlas M0

- Compte Atlas et cluster M0 gratuit créés
- Utilisateur applicatif dédié créé (`readWrite` limité à la base `drumtempo`, distinct du compte admin
  Atlas)
- Chaîne de connexion `mongodb+srv://` récupérée
- Accès réseau limité temporairement à l'IP locale (le temps du test) — sera remplacé par l'IP du VPS une
  fois celui-ci créé (Étape 8.3), pas laissé à `0.0.0.0/0`
- ✅ Confirmé le 2026-07-27 : connexion `mongosh` réussie, lecture/écriture/suppression confirmées
- Étape 8.2 quasi complète — seule la restriction réseau finale (allowlist → IP du VPS) reste en suspens,
  dépendante de l'Étape 8.3
- Prochaine étape : 8.3 (VPS DigitalOcean & durcissement de base)

## 2026-07-28 — Étape 8.3 : VPS DigitalOcean & durcissement de base

- Droplet Ubuntu LTS créé sur DigitalOcean, login root initial via clé SSH
- Utilisateur non-root `deploy` créé avec `sudo`, clé SSH copiée depuis `authorized_keys` de root
- Bug de connexion trouvé et résolu : `ssh deploy@<IP>` refusait la clé (`Permission denied (publickey)`)
  malgré des permissions et un contenu de `authorized_keys` corrects. Diagnostic par élimination
  (permissions du fichier, du répertoire `.ssh`, de `/home/deploy`, de `/home`, config `sshd` et ses
  drop-in `cloud-init` — tout en ordre) jusqu'à la sortie verbeuse du client (`ssh -v`) : le fingerprint de
  la clé offerte par l'agent SSH local ne correspondait pas à celui présent dans `authorized_keys`. Cause
  réelle : la paire de clés dédiée à DigitalOcean (`~/.ssh/digitalocean`/`.pub`) n'est pas un nom de fichier
  d'identité par défaut (`id_ed25519`, etc.), donc jamais offerte automatiquement par le client SSH — corrigé
  en ajoutant une entrée `Host drumtempo-vps` dans `~/.ssh/config` local avec `IdentityFile
  ~/.ssh/digitalocean` et `IdentitiesOnly yes`
- Authentification par mot de passe confirmée désactivée (`PasswordAuthentication no`, déjà présent via les
  drop-in `cloud-init` de l'image Ubuntu)
- Login root SSH désactivé (`PermitRootLogin no` dans `sshd_config`, `systemctl restart ssh`)
- Pare-feu `ufw` configuré : `22` (OpenSSH), `80`, `443` en `ALLOW`, activé
- Docker et le plugin Docker Compose installés (script officiel `get-docker.sh`), utilisateur `deploy`
  ajouté au groupe `docker`
- ✅ Confirmé le 2026-07-28 : mot de passe refusé, root désactivé, `ufw status` conforme, `docker run
  hello-world` réussi
- ✅ **Étape 8.3 entièrement complétée.** Prochaine étape : 8.4 (déploiement du backend — Caddy + conteneur
  backend)

## 2026-07-28 — Finalisation de l'allowlist Atlas (Étape 8.2)

- IP locale (temporaire) retirée de Network Access, remplacée par l'IP publique du VPS (`142.93.146.19/32`)
- ✅ Confirmé le 2026-07-28 : connexion à Atlas confirmée perméable depuis le VPS, et confirmée refusée
  depuis le poste local — preuve que l'allowlist est bien restrictive
- ✅ **Étape 8.2 entièrement complétée.** Prochaine étape : 8.4 (déploiement du backend — Caddy + conteneur
  backend)
## 2026-07-28 — Étape 8.4 : Déploiement du backend (Caddy + conteneur backend)

- Cloudflare : mode SSL/TLS basculé à "Full (strict)" ; enregistrement DNS `A` `api` → IP du VPS
  (`142.93.146.19`), proxifié (nuage orange) ; certificat Origin Server généré pour `api.drumtempo.com`
  (RSA 2048, validité 15 ans)
- Fichiers ajoutés au dépôt : `docker-compose.prod.yml` (fichier autonome, pas un override — un override
  Compose ne peut pas retirer un service ; sans `db`, `backend` sans bind-mount ni port publié sur l'hôte,
  ajout du service `caddy`), `caddy/Caddyfile` (TLS manuel via le certificat Origin CA — pas d'ACME),
  `.env.prod.example` (toutes les variables prod du backend réunies en un seul fichier, faute de bind-mount
  `backend/.env` en prod). Corrigé au passage : `backend/.dockerignore` ne contenait pas `.env`, ce qui
  aurait permis à un `.env` de dev de se retrouver copié dans l'image au build
- Sur le VPS : certificat + clé privée collés dans `caddy/certs/` (`chmod 600` sur la clé, jamais commité),
  `.env.prod` créé (JWT_SECRET généré via `openssl rand -hex 64`, distinct du secret de dev ; `MONGO_URI`
  = utilisateur applicatif Atlas)
- **Incident rencontré et résolu** : premier `docker compose -f docker-compose.prod.yml --env-file .env.prod
  up -d --build` — le build de l'image a réussi, mais le conteneur `backend` s'est fait tuer (`Exited 137`)
  juste après le message `tsc`, sans autre erreur explicite. Diagnostic : le droplet DigitalOcean (le plus
  petit plan, 458 Mio de RAM, **aucun swap**) n'a pas assez de mémoire pour que `tsc` compile le backend au
  démarrage du conteneur (`command: npm run build && npm run start`) — code de sortie 137 = SIGKILL,
  signature classique de l'OOM killer du noyau. Corrigé en ajoutant un fichier swap de 1 Gio sur le VPS
  (`fallocate`/`mkswap`/`swapon` + entrée `/etc/fstab` pour survivre à un reboot) — solution standard
  recommandée par DigitalOcean pour ce plan. Deuxième tentative : `tsc` a compilé (lentement, via le swap),
  le serveur a démarré normalement, connexion à Atlas confirmée dans les logs
- ✅ Confirmé le 2026-07-28 : `curl -Iv https://api.drumtempo.com/health` → `HTTP/2 200`, TLS 1.3, chaîne de
  certificat valide, en-têtes `helmet` présents, `server: cloudflare` (confirme le passage par l'edge
  Cloudflare, pas un accès direct au VPS). `auth.http` et `exercises.http` rejoués contre
  `https://api.drumtempo.com` (via `@baseUrl` temporaire dans WebStorm, remis à `localhost:3000` ensuite) —
  tous les cas passent (inscription, connexion, CRUD complet, isolation entre utilisateurs, cas d'erreur
  400/401/404/409)
- ✅ **Étape 8.4 entièrement complétée.** Prochaine étape : 8.5 (déploiement du frontend sur Vercel)

## 2026-07-28 — Étape 8.5 : Déploiement du frontend (Vercel)

- Projet Vercel créé, dépôt GitHub `DrumTempo` importé, Root Directory réglé sur `frontend` (le repo a
  `frontend/` et `backend/` à la racine, pas de `package.json` racine)
- Variable d'environnement `VITE_API_URL=https://api.drumtempo.com` configurée dans Vercel — aucun
  changement de code nécessaire, `ApiConfig.js`/`AuthConfig.js` la consomment déjà via `import.meta.env`
- Premier déploiement sur l'URL temporaire `drum-tempo.vercel.app` : test d'inscription échoué (`Load
  failed`) — comportement attendu et vérifié volontairement plutôt que corrigé : `curl -X OPTIONS
  https://api.drumtempo.com/api/auth/register -H "Origin: https://drum-tempo.vercel.app"` confirme
  l'absence de `access-control-allow-origin` dans la réponse, cohérent avec `CORS_ORIGIN` restreint à
  `https://app.drumtempo.com` en prod (pas d'ouverture large à `*.vercel.app`)
- Domaine custom `app.drumtempo.com` ajouté dans Vercel ; CNAME `app` → `0fbf7447e66876b4.vercel-dns-017.com`
  créé dans Cloudflare DNS, proxifié (nuage orange) ; domaine passé à "Valid" côté Vercel en quelques minutes
- ✅ Confirmé le 2026-07-28 : `https://app.drumtempo.com` répond `200` (Cloudflare + Vercel), cycle complet
  (inscription, connexion, ajout/ajustement/suppression d'exercice) testé et fonctionnel contre le backend
  de production
- ✅ **Étape 8.5 entièrement complétée.** Prochaine étape : 8.6 (pipeline de déploiement automatisé — CD)

## 2026-07-30 — Étape 8.6 : Pipeline de déploiement automatisé (CD)

- Vercel : vérifié dans Settings → Git que "Production Branch" = `main` et "Ignored Build Step" =
  `Automatic` (Vercel compare le commit courant à la dernière build et ne redéclenche que si `frontend/` a
  changé — comportement voulu pour ce monorepo, rien à activer, c'était déjà natif depuis l'import en 8.5)
- Backend : paire de clés SSH dédiée générée localement (`~/.ssh/drumtempo_deploy`, jamais la clé perso de
  8.3) — clé privée copiée directement dans le presse-papier (`pbcopy`) pour être collée comme secret
  GitHub sans jamais transiter par le chat. Trois secrets ajoutés au repo (`DEPLOY_SSH_KEY`, `DEPLOY_HOST`,
  `DEPLOY_USER`)
- Clé publique installée dans `~/.ssh/authorized_keys` du VPS avec une commande forcée
  (`command="~/deploy.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding ...`) : même si le
  secret GitHub fuit un jour, cette clé ne permet rien d'autre que de relancer le déploiement, jamais un
  accès shell général
- Nouveau job `deploy-backend` dans `.github/workflows/tests.yml` : `needs: backend-tests`,
  `if: github.ref == 'refs/heads/main' && github.event_name == 'push'`, utilise `appleboy/ssh-action@v1` —
  le `script:` envoyé est un simple echo, ignoré de toute façon puisque la commande forcée côté VPS prend
  le dessus
- ⚠️ Incident (x2) : le collage de la ligne `command="..."` dans le terminal SSH a coupé la ligne en deux
  (retour à la ligne inséré au milieu), cassant le format `authorized_keys` — première fois la commande
  forcée manquait sa clé (ligne suivante devenue une clé *sans* restriction, faille de sécurité), deuxième
  fois seul le commentaire optionnel s'est détaché (sans impact fonctionnel, mais nettoyé quand même).
  Diagnostiqué via `cat -A ~/.ssh/authorized_keys` (repère les fins de ligne réelles). Corrigé en déplaçant
  la commande dans un script dédié `~/deploy.sh` (ligne `authorized_keys` beaucoup plus courte, moins
  exposée au bug de collage) — leçon retenue : éviter de coller de très longues lignes uniques dans un
  terminal SSH interactif
- ⚠️ Bug de frappe repéré dans `~/deploy.sh` lors de sa création : shebang `#!/bin/bash/` (slash final en
  trop, chemin invalide) — corrigé en `#!/bin/bash`. Permissions resserrées à `700` (propriétaire seulement,
  le `750`/groupe n'étant pas nécessaire pour un script invoqué par une commande forcée SSH)
- ✅ Confirmé le 2026-07-30 : cas négatif testé (push sur branche `test/cd-negatif` → job `deploy-backend`
  absent des jobs déclenchés, confirmant le filtre `if:`). Cas positif testé (merge fast-forward de
  `test/cd-negatif` dans `main`, push → `backend-tests` vert → `deploy-backend` déclenché → logs GitHub
  Actions montrent `git pull` réel, build Docker complet, `Container drumtempo-backend Recreate →
  Recreated → Started` → `curl -I https://api.drumtempo.com/health` toujours `200`, conteneur backend up
  depuis moins de 5 minutes)
- ✅ **Étape 8.6 entièrement complétée.** Prochaine étape : 8.7 (vérification finale de bout en bout en
  production, idéalement depuis un iPhone en réseau cellulaire)

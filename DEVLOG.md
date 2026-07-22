
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

## 2026-07-21 — Accès depuis un iPhone sur le réseau local

- `Config.CORS_ORIGIN` (string unique) remplacé par `Config.CORS_ORIGINS` (tableau, parsé depuis une liste séparée par des virgules) dans `backend/src/config/Config.ts` et `index.ts`, pour accepter plusieurs origines simultanément (Mac via `localhost` + iPhone via IP locale)
- `docker-compose.yml` : `CORS_ORIGIN` inclut maintenant `http://localhost:5173` et `http://192.168.2.61:5173` ; `VITE_API_URL` pointe vers l'IP locale (`http://192.168.2.61:3000`) plutôt que `localhost`, puisque cette variable est résolue par le navigateur du client, pas par le conteneur
- Documentation ajoutée dans `README.md` : section "Frontend — Tester sur un iPhone (même réseau Wi-Fi)"
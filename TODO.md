# Plan de Travail - DrumTempo

## Étape 0 : Réorganisation du scaffold existant
- [x] Déplacer le scaffold Vue 3 (src/, public/, index.html, vite.config.js, etc.) dans `/frontend`
- [x] Supprimer les composants par défaut (`HelloWorld.vue`, `TheWelcome.vue`, `WelcomeItem.vue`, `assets/logo.svg`)
  *Test manuel : Lancer `npm run dev` depuis `/frontend` et valider que l'app démarre sans erreur.*

## Étape 1 : Initialisation de l'infrastructure Docker et Environnement
- [x] Créer la structure du dossier `/backend`
- [x] Configurer les fichiers `Dockerfile` pour chaque service (`/frontend/Dockerfile`, `/backend/Dockerfile`)
- [x] Créer le fichier `docker-compose.yml` (Frontend + Backend + MongoDB)
- [x] Créer la classe de gestion des constantes globales (Configuration / Variables d'environnement)
  *Test manuel : Lancer les conteneurs et valider que MongoDB et le serveur Node vierge démarrent sans erreur.*

## Étape 2 : Modèle de Données et Connexion MongoDB (Backend)
- [x] Configurer la connexion Mongoose avec gestion des erreurs
- [x] Créer le Schéma/Modèle Mongoose pour `Exercise` en TypeScript
- [x] Créer la classe de constantes pour les validations (ex: TEMPO_MIN, TEMPO_MAX)
  *Test manuel : Écrire un script temporaire qui insère un exercice valide et bloque un exercice invalide.*

## Étape 3 : API REST (Backend)
- [x] Configurer CORS pour autoriser les appels depuis le conteneur frontend
- [x] Créer la route `GET /api/exercises` (Lister)
- [x] Créer la route `POST /api/exercises` (Ajouter)
- [x] Créer la route `PATCH /api/exercises/:id` (Mettre à jour le tempo)
- [x] Créer la route `DELETE /api/exercises/:id` (Supprimer un exercice)
- [x] Créer `backend/exercises.http` avec les requêtes reproductibles pour les 4 routes + cas d'erreur
- [x] Documenter dans `README.md` les instructions exactes et détaillées pour réinitialiser la base (`mongosh`) et rejouer `exercises.http` — doit être suivable par quelqu'un de nouveau sur le projet
- [x] Augmenter la granularité des erreurs API : distinguer 400 (ValidationError/CastError Mongoose), 409 (clé dupliquée, code 11000) et 500 (erreur imprévue seulement), au lieu de tout renvoyer en 500
  *Test manuel : Rejouer `backend/exercises.http` dans WebStorm (bouton "Run" au-dessus de chaque requête) et valider les codes de statut (200/201/204/404) et messages d'erreur. ✅ Confirmé le 2026-07-21.*
- [x] Documenter l'API avec OpenAPI/Swagger UI (`swagger-jsdoc` + `swagger-ui-express`), annotations sur les 4 routes et le modèle `Exercise`
  *Test manuel : Après `docker-compose up --build -V`, ouvrir `http://localhost:3000/api-docs` et valider que les 4 routes apparaissent avec schémas et codes de statut, puis tester une requête "Try it out" depuis la page. ✅ Confirmé le 2026-07-21.*

## Étape 4 : Interface Utilisateur (Frontend Vue.js)
- [x] Adapter le scaffold Vue 3 pour le mode Mobile-First (CSS, viewport, boutons/inputs à grande zone de clic)
- [x] Créer le service d'appel API (Fetch natif) avec URL centralisée dans une constante (`ApiConfig.js`, `exerciseService.js`)
- [x] Développer la vue de liste et de mise à jour rapide du tempo (Gros boutons iPhone)
- [x] Développer le formulaire d'ajout d'un exercice
- [x] Ajouter le bouton de suppression d'un exercice
- [x] Orchestrer les composants dans `App.vue` (chargement au montage, handlers d'ajout/ajustement/suppression)
  *Test manuel : Ouvrir l'application sur le simulateur iPhone de l'IDE ou un appareil connecté et tester le cycle complet (ajout, +5/-5 BPM, suppression, persistance après rafraîchissement). ✅ Confirmé le 2026-07-21 — cycle complet fonctionnel.*

## Étape 5 : Sécurité (durcissement selon les standards de l'industrie)

Contexte : l'app pourrait un jour être exposée au-delà du réseau local (distribution, but pédagogique).
L'authentification devient donc une fondation, pas une option. Ordre recommandé : 5.1 et 5.2 ensemble
en premier (l'auth a besoin d'une gestion de secrets propre dès le départ), puis 5.3 à 5.7, puis 5.8.

### 5.1 — Authentification & autorisation
- [ ] Modèle `User` (Mongoose) : email, mot de passe hashé avec `bcrypt`
- [ ] Route `POST /api/auth/register` (inscription)
- [ ] Route `POST /api/auth/login` (connexion, émission d'un JWT)
- [ ] Middleware `requireAuth` protégeant toutes les routes `/api/exercises`
- [ ] Champ `owner` (userId) sur le modèle `Exercise`, filtrage des requêtes par propriétaire
- [ ] Classe de config `AuthConfig` (secret JWT, durée d'expiration, coût `bcrypt`) — rien codé en dur
  *Test manuel : requête sans token sur `/api/exercises` → 401. Token valide d'un autre utilisateur → 404 sur
  les exercices d'autrui (pas de fuite d'existence). Inscription/connexion testées via un nouveau fichier
  `.http` (ou ajouts à `exercises.http`).*

### 5.2 — Secrets & configuration
- [ ] `.env` non versionné pour les secrets locaux (JWT_SECRET, identifiants Mongo)
- [ ] `.env.example` versionné comme documentation des variables attendues
  *Test manuel : `git status` ne montre jamais `.env`. L'app démarre correctement avec les valeurs de `.env`.*

### 5.3 — Sécurisation de MongoDB
- [ ] Activer l'authentification MongoDB (utilisateur/mot de passe), même si la base n'est pas publiée sur l'hôte
  *Test manuel : une connexion sans identifiants échoue.*

### 5.4 — Durcissement HTTP
- [ ] Ajouter `helmet` (en-têtes de sécurité standards)
- [ ] Limiter explicitement la taille des payloads JSON
- [ ] Ajouter un rate-limiter (`express-rate-limit`) sur les routes API
  *Test manuel : `curl -I` montre les en-têtes de sécurité. Après un grand nombre de requêtes rapides, le
  serveur répond 429.*

### 5.5 — Validation et sanitation des entrées
- [ ] Vérifier/renforcer le mode strict de Mongoose contre l'injection de champs arbitraires
  *Test manuel : envoyer des payloads malveillants (opérateurs Mongo, tempo non numérique, chaînes très
  longues) via `exercises.http` → rejet propre en 400, jamais de crash serveur.*

### 5.6 — Durcissement Docker
- [ ] Utilisateur non-root dans les `Dockerfile` (backend et frontend)
  *Test manuel : `docker exec drumtempo-backend whoami` retourne un utilisateur non-root.*

### 5.7 — Dépendances
- [ ] `npm audit` sur `/frontend` et `/backend`, corriger les vulnérabilités trouvées
  *Test manuel : `npm audit` ne retourne plus de vulnérabilité high/critical.*

### 5.8 — HTTPS (documentation seulement pour l'instant)
- [ ] Documenter dans `README.md` les étapes nécessaires pour un vrai déploiement (reverse proxy + certificat) —
  non implémenté dans le `docker-compose.yml` local actuel1    
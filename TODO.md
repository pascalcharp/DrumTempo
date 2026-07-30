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

### 5.1 — Authentification & autorisation ✅
- [x] Modèle `User` (Mongoose) : email, mot de passe hashé avec `bcrypt`
- [x] Route `POST /api/auth/register` (inscription)
- [x] Route `POST /api/auth/login` (connexion, émission d'un JWT)
- [x] Middleware `requireAuth` protégeant toutes les routes `/api/exercises`
- [x] Champ `owner` (userId) sur le modèle `Exercise`, filtrage des requêtes par propriétaire
- [x] Classe de config `AuthConfig` (secret JWT, durée d'expiration, coût `bcrypt`) — rien codé en dur
  *Test manuel : requête sans token sur `/api/exercises` → 401. Token valide d'un autre utilisateur → 404 sur
  les exercices d'autrui (pas de fuite d'existence). Inscription/connexion testées via un nouveau fichier
  `.http` (ou ajouts à `exercises.http`). ✅ Confirmé le 2026-07-22.*

### 5.2 — Secrets & configuration ✅
- [x] `.env` non versionné pour les secrets locaux (JWT_SECRET — identifiants Mongo à ajouter à l'Étape 5.3)
- [x] `.env.example` versionné comme documentation des variables attendues
  *Test manuel : `git status` ne montre jamais `.env`. L'app démarre correctement avec les valeurs de `.env`.
  ✅ Confirmé le 2026-07-22.*

### 5.3 — Sécurisation de MongoDB ✅
- [x] Activer l'authentification MongoDB (utilisateur/mot de passe), même si la base n'est pas publiée sur l'hôte
  *Test manuel : une connexion sans identifiants échoue. ✅ Confirmé le 2026-07-22 : `mongosh` sans
  identifiants → `MongoServerError: Command find requires authentication` ; avec identifiants → succès.
  Backend connecté normalement via `MONGO_URI` authentifié.*

### 5.4 — Durcissement HTTP ✅
- [x] Ajouter `helmet` (en-têtes de sécurité standards)
- [x] Limiter explicitement la taille des payloads JSON
- [x] Ajouter un rate-limiter (`express-rate-limit`) sur les routes API
  *Test manuel : `curl -I` montre les en-têtes de sécurité. Après un grand nombre de requêtes rapides, le
  serveur répond 429. ✅ Confirmé le 2026-07-22 : en-têtes `helmet` présents sur `/health` ; 100 requêtes
  sur `/api/exercises` traitées normalement puis 429 à partir de la 101e ; `/health` non affecté par le
  rate-limit (hors préfixe `/api`) ; payload JSON > 10kb → 413.*

### 5.5 — Validation et sanitation des entrées ✅
- [x] Vérifier/renforcer le mode strict de Mongoose contre l'injection de champs arbitraires
  *Test manuel : envoyer des payloads malveillants (opérateurs Mongo, tempo non numérique, chaînes très
  longues) via `exercises.http` → rejet propre en 400, jamais de crash serveur. ✅ Confirmé le 2026-07-22 :
  faille réelle trouvée et corrigée (voir DEVLOG) — `{"email":{"$ne":null},"password":"..."}` sur
  `/api/auth/login` retourne maintenant 400 au lieu de 500/contournement ; tempo non numérique et nom trop
  long déjà correctement rejetés en 400 (`ValidationError` existant).*

### 5.6 — Durcissement Docker ✅
- [x] Utilisateur non-root dans les `Dockerfile` (backend et frontend)
  *Test manuel : `docker exec drumtempo-backend whoami` retourne un utilisateur non-root. ✅ Confirmé le
  2026-07-22 : `whoami` → `node` dans les deux conteneurs ; cycle complet validé par test de fumée et par
  `auth.http`/`exercises.http` rejoués dans WebStorm.*

### 5.7 — Dépendances ✅
- [x] `npm audit` sur `/frontend` et `/backend`, corriger les vulnérabilités trouvées
  *Test manuel : `npm audit` ne retourne plus de vulnérabilité high/critical. ✅ Confirmé le 2026-07-22 :
  `0 vulnerabilities` dans les deux projets, aucun correctif nécessaire.*

### 5.8 — Documentation de l'architecture de déploiement (production, documentation seulement) ✅

Architecture cible retenue (2026-07-22, but pédagogique : pratiques "grade production" à coût minime) :

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

Coût estimé : ~5-7$/mois (VPS + nom de domaine amorti ; Cloudflare, Vercel/Netlify, Atlas M0 et
GitHub Actions gratuits à cette échelle).

- [ ] Documenter l'architecture ci-dessus dans `README.md`, avec le raisonnement du mode "Full strict"
  (pourquoi Cloudflare seul ne suffit pas pour un HTTPS de bout en bout — Caddy + certificat Origin CA
  nécessaires sur le VPS)
- [ ] Documenter les ajustements de config nécessaires le jour du déploiement : `Config.CORS_ORIGINS`
  (domaine Vercel/Netlify), `VITE_API_URL` (sous-domaine du VPS), `MONGO_URI` (Atlas), retrait du service
  `db` de `docker-compose.yml` (remplacé par Atlas), gestion des secrets en prod (pas de `.env` de dev)
- [ ] Documenter la limite du tier gratuit Atlas M0 (pas de sauvegarde automatique) et l'alternative
  `mongodump` planifié + stockage objet bon marché (ex: Backblaze B2)
- [ ] Documenter le principe du pipeline CI/CD (GitHub Actions) pour le déploiement automatisé
  *Test manuel : relecture du README par l'utilisateur — permet de reproduire le déploiement sans
  redécouvrir ces décisions. Reste au stade documentation ; l'implémentation réelle (future Étape 7) attend
  la complétion de l'Étape 6 (tests automatisés). ✅ Section "Déploiement en production (architecture
  cible)" ajoutée au README le 2026-07-22.*

## Étape 6 : Tests automatisés (avant le déploiement en production)

Contexte : chaque changement d'infrastructure depuis le début de l'Étape 5 (rate-limiter, utilisateur
Docker non-root, `sanitizeFilter`) a dû être revalidé manuellement via `auth.http`/`exercises.http`. Une
suite automatisée capture cette couverture une fois pour toutes et évite de perdre du temps à chaque
itération future, en particulier une fois le déploiement (Étape 7) entamé.

Outillage retenu : **Vitest** partout (déjà l'écosystème du frontend via Vite — un seul outil de test à
apprendre plutôt que Jest+Vitest séparés), `supertest` + `mongodb-memory-server` côté backend (teste l'API
sans toucher à Mongo dev/Atlas), `@vue/test-utils` côté frontend.

### 6.1 — Outillage & configuration ✅
- [x] Ajouter Vitest à `/backend` et `/frontend`
- [x] Backend : ajouter `supertest` + `mongodb-memory-server`
- [x] Frontend : ajouter `@vue/test-utils`
  *Test manuel : `npm test` s'exécute (suite vide) sans erreur de configuration, dans les deux projets.
  ✅ Confirmé le 2026-07-22 : test de fumée backend (écriture/lecture Mongoose sur MongoDB en mémoire) et
  test de fumée frontend (montage d'un composant via `@vue/test-utils`) tous deux réussis.*

### 6.2 — Tests unitaires backend : modèles & config ✅
- [x] `Exercise` : bornes de tempo (TEMPO_MIN/MAX), nom requis, unicité par `owner`, `current_tempo` null valide
- [x] `User` : hachage du mot de passe (hash ≠ mot de passe brut), `comparePassword` (vrai/faux mot de passe)
  *Test manuel : `npm test` (backend) — tous les cas passent ; un cas volontairement invalide fait échouer
  le test (preuve que la suite détecte vraiment les régressions).
  ✅ Confirmé le 2026-07-22 : `Exercise.test.ts` (6 cas) et `User.test.ts` (5 cas) tous verts.*

### 6.3 — Tests d'intégration backend : routes API ✅
- [x] `auth` : register (succès, email dupliqué, mot de passe trop court, email malformé), login (succès,
  mauvais mot de passe, email inconnu, injection d'opérateur Mongo)
  *✅ Confirmé le 2026-07-23 — voir DEVLOG pour la régression de sécurité trouvée et corrigée au passage.*
- [x] `exercises` : CRUD complet + isolation entre utilisateurs (404 sur les exercices d'autrui) + 401 sans token
  *Reprend la couverture actuelle de `auth.http`/`exercises.http`, automatisée.*
  *Test manuel : `npm test` (backend) reproduit tous les cas sans intervention manuelle.
  ✅ Confirmé le 2026-07-23 : 34 tests, tous verts (voir DEVLOG pour le détail : refactor `app.ts`,
  nettoyage de la sortie API `owner`/`__v`, messages de validation spécifiques).*

### 6.4 — Tests composants frontend
- [x] `ExerciseList` (rendu, emit `ajuster-tempo`/`supprimer`, désactivation des boutons aux bornes)
  ✅ Confirmé le 2026-07-24 : 10 tests, tous verts (rendu, emit +/- et suppression, désactivation aux
  bornes TEMPO_MIN/TEMPO_MAX/null, réactivation dynamique via `setProps`).
- [x] `ExerciseForm` (soumission, validation)
  ✅ Confirmé le 2026-07-24 : 4 tests, tous verts (émission `ajouter` avec nom+tempo, `current_tempo: null`
  quand le tempo n'est pas renseigné, `current_tempo: null` quand le champ est effacé (`""`),
  réinitialisation des deux champs après soumission).
- [x] `App.vue` (orchestration : chargement au montage, handlers) avec `exerciseService` mocké
  ✅ Confirmé le 2026-07-24 : 5 tests, tous verts (chargement au montage, message d'erreur si le
  chargement échoue, ajout d'exercice via `ExerciseForm`, passage de `null` à `TEMPO_MIN` sans addition de
  delta, suppression via `ExerciseList`).
  *Test manuel : `npm test` (frontend) — tous les cas passent.*

**Étape 6.4 ✅ entièrement complétée et confirmée (2026-07-24) : `ExerciseList` (10), `ExerciseForm` (4),
`App.vue` (5) — 19 tests, tous verts.**

### 6.5 — Intégration continue (CI) ✅
- [x] Workflow GitHub Actions : `npm test` sur `/backend` et `/frontend` à chaque push/PR
  ✅ Confirmé le 2026-07-24 : `.github/workflows/tests.yml` (jobs `backend-tests`/`frontend-tests`) vert au
  premier push ; test volontairement cassé dans `ExerciseList.test.js` → workflow rouge confirmé sur
  GitHub ; correctif → workflow vert de nouveau. Plan de test entièrement validé.

**Étape 6 (Tests automatisés + CI) entièrement complétée.**

## Étape 7 : Frontend — intégration de l'authentification

Constat (2026-07-23, découvert en préparant l'Étape 6.4) : le frontend (Étape 4) a été construit avant
l'authentification backend (Étape 5.1/5.2) et n'a jamais été mis à jour. `exerciseService.js` n'envoie
aucun en-tête `Authorization`, et `App.vue` n'a ni formulaire de connexion/inscription ni stockage de
token — en l'état, l'application réelle recevrait un 401 sur chaque appel à `/api/exercises`. Non
bloquant pour les tests (6.4 mocke `exerciseService`), mais à traiter avant tout déploiement réel.

Décision validée (2026-07-24) : stockage du token en `localStorage` (persiste entre ouvertures de l'app —
convient à un usage personnel sur iPhone, évite une reconnexion à chaque fois).

### 7.1 — Services d'authentification (plomberie, écrite directement) ✅
- [x] `frontend/src/config/AuthConfig.js` : endpoints login/register, clé de stockage du token
- [x] `frontend/src/services/tokenStorage.js` : lecture/écriture/suppression du token dans `localStorage`
- [x] `frontend/src/services/httpClient.js` : extraction de `traiterReponse` (partagée entre
  `exerciseService.js` et le nouveau `authService.js`), erreur enrichie d'un `status` (nécessaire pour
  détecter un 401 dans `App.vue` à l'Étape 7.3)
- [x] `frontend/src/services/authService.js` : `login()`, `register()`
- [x] `exerciseService.js` mis à jour : en-tête `Authorization: Bearer <token>` sur les 4 appels
- [x] `exerciseService.test.js` et `authService.test.js` (écrits par l'utilisateur) : mock du `fetch`
  global — comble aussi le trou de couverture déjà existant sur `exerciseService.js` (jamais testé
  directement jusqu'ici, seulement mocké)
  *Test manuel : `npm test` (frontend) — tous les cas passent. ✅ Confirmé le 2026-07-26 : `authService.test.js`
  (4 cas : login succès, login 401, register succès, register 409) et `exerciseService.test.js` (5 cas :
  en-tête Authorization, parsing JSON réussi, message d'erreur du corps, message de fallback, 204→null),
  tous verts.*

### 7.2 — Écran de connexion/inscription ✅
- [x] `LoginForm.vue` : formulaire email/mot de passe, bascule connexion/inscription, émet les identifiants
  saisis (n'appelle pas `authService` directement — même patron que `ExerciseForm.vue`)
- [x] `LoginForm.test.js` : 4 cas (connexion, bascule + inscription, double bascule, message d'erreur)
  *Test manuel : `npm test` (frontend) — tous les cas passent. ✅ Confirmé le 2026-07-25.*

### 7.3 — Orchestration dans `App.vue` ✅
- [x] Affichage conditionnel : `LoginForm` si aucun token, app normale sinon (vérifié au montage)
- [x] Handlers de connexion/inscription (appel à `authService`, stockage du token au succès ; inscription
  enchaîne automatiquement sur `handleConnexion` — décision validée le 2026-07-25)
- [x] Gestion centralisée d'un 401 en cours d'usage (token expiré) → efface le token, retour à l'écran de
  connexion (message `AuthConfig.SESSION_EXPIREE_MESSAGE` affiché sur `LoginForm`)
- [x] Bouton de déconnexion
- [x] Nouveaux cas ajoutés au squelette de `App.test.js` : 5 cas (LoginForm sans token, connexion réussie,
  échec de connexion, déconnexion, retour à la connexion sur 401)
  *Test manuel : `npm test` (frontend) — tous les cas passent. ✅ Confirmé le 2026-07-25 : 38 tests, tous
  verts.*

- [x] **Test manuel final (bout en bout)** : `docker-compose up --build`, dans le navigateur — inscription →
  connexion → ajout/ajustement/suppression d'exercices → rafraîchir la page reste connecté → déconnexion →
  rafraîchir redemande la connexion.
  *✅ Confirmé le 2026-07-26 : authentification, mots de passe trop courts/incorrects rejetés, CRUD
  exercices et déconnexion tous fonctionnels. Point UX à améliorer plus tard (pas un bug — comportement
  actuel volontaire, voir DEVLOG) : l'inscription prend 2 clics (bascule de mode puis soumission) et enchaîne
  directement sur la connexion sans écran de confirmation intermédiaire.*

## Étape 8 : Déploiement en production

Contexte : l'app est fonctionnelle et entièrement testée (Étape 7). On met en œuvre l'architecture documentée
en 5.8. Fournisseurs retenus (décision prise le 2026-07-26, utilisateur novice en déploiement — priorité à la
simplicité et à la documentation disponible plutôt qu'à l'optimisation de coût) :
- **Cloudflare** : registraire de domaine + DNS + CDN + WAF (un seul tableau de bord pour tout, évite un
  aller-retour entre un registraire tiers et Cloudflare)
- **DigitalOcean** : VPS pour le backend (tutoriels "DigitalOcean Community" abondants pour cette pile
  exacte : Ubuntu + Docker + Caddy)
- **Vercel** : hébergement du frontend statique (déploiement Vite zéro-config, intégration GitHub → build
  automatique à chaque push)
- **MongoDB Atlas M0** et **Caddy** : déjà décidés en 5.8 (base managée gratuite ; reverse proxy à TLS
  automatique via certificat Cloudflare Origin CA, mode "Full strict")

Coût estimé : ~7-10$/mois (droplet DigitalOcean ~6$ + domaine ~1-2$/mois amorti ; Cloudflare, Vercel et
Atlas M0 gratuits à cette échelle).

### 8.1 — Nom de domaine & Cloudflare ✅
- [x] Enregistrer un nom de domaine via Cloudflare Registrar
- [x] Domaine actif sur Cloudflare avec le proxy activé (nuage orange) pour les futurs sous-domaines
  `app.` et `api.`
  *Test manuel : `dig`/`nslookup` du domaine renvoie des IP Cloudflare ; le domaine apparaît "actif" dans
  le tableau de bord Cloudflare. ✅ Confirmé le 2026-07-27 : domaine `drumtempo.com` enregistré (1 an), DNS
  configuré (enregistrements placeholder `app.`/`api.` proxifiés), `dig`, statut "actif" et `nslookup` (NS
  Cloudflare) tous confirmés.*

### 8.2 — MongoDB Atlas M0 (base de données managée) ✅
- [x] Créer un compte Atlas, un cluster M0 gratuit (région la plus proche disponible)
- [x] Créer un utilisateur applicatif dédié (droits limités à la base `drumtempo`, distinct du compte admin
  Atlas)
- [x] Restreindre l'accès réseau (IP allowlist) à l'IP du VPS une fois celui-ci créé (8.3) — pas
  `0.0.0.0/0`
- [x] Récupérer la chaîne de connexion `mongodb+srv://`
  *Test manuel : connexion via `mongosh` depuis le poste local (IP autorisée temporairement) confirme
  lecture/écriture ; l'IP locale est ensuite retirée de l'allowlist. ✅ Confirmé le 2026-07-27 : cluster M0
  créé, utilisateur applicatif dédié ajouté, connexion `mongosh` réussie, lecture/écriture/suppression
  confirmées. ✅ Confirmé le 2026-07-28 : allowlist finalisée à l'IP du VPS uniquement — accès confirmé
  perméable depuis le VPS et exclusif (poste local refusé).*

### 8.3 — VPS DigitalOcean & durcissement de base ✅
- [x] Créer un droplet (Ubuntu LTS, plus petit plan suffisant)
- [x] Accès SSH par clé uniquement (mot de passe désactivé), utilisateur non-root avec `sudo`, pare-feu
  (`ufw`) limité aux ports 22/80/443
- [x] Installer Docker et Docker Compose sur le droplet
  *Test manuel : une connexion SSH par mot de passe est refusée ; `ufw status` confirme les ports ouverts ;
  `docker --version` répond sur le VPS. ✅ Confirmé le 2026-07-28 : droplet créé, utilisateur `deploy` non-root
  avec `sudo` créé et accessible par clé SSH (dépannage d'un mismatch de clé — voir DEVLOG), authentification
  par mot de passe refusée, login root SSH désactivé (`PermitRootLogin no`), `ufw` actif (22/80/443 en
  ALLOW), Docker et Docker Compose installés et fonctionnels (`docker run hello-world` réussi).*

### 8.4 — Déploiement du backend (Caddy + conteneur backend) ✅
- [x] `docker-compose.prod.yml` (fichier autonome, pas un override) : retrait du service `db` (remplacé par
  Atlas), `MONGO_URI` pointé vers Atlas, ajout de Caddy comme reverse proxy devant le conteneur backend
- [x] `Caddyfile` : `api.drumtempo.com` → conteneur backend, TLS via certificat Cloudflare Origin CA (mode
  "Full strict", comme documenté en 5.8)
- [x] `CORS_ORIGIN` mis à jour avec le domaine Vercel définitif (`app.drumtempo.com`)
- [x] Secrets de production (`JWT_SECRET`, `MONGO_URI`) dans un `.env.prod` local au VPS uniquement, jamais
  commité (même principe que 5.2, nouvel environnement)
  *Test manuel : `https://api.drumtempo.com/health` répond 200 avec certificat valide (cadenas navigateur) ;
  `auth.http`/`exercises.http` rejoués contre l'URL de production.
  ✅ Confirmé le 2026-07-28 : `curl -Iv https://api.drumtempo.com/health` → `200`, TLS 1.3, chaîne de
  certificat valide (Cloudflare edge), en-têtes `helmet` présents. `auth.http` (inscription/connexion,
  9 cas) et `exercises.http` (CRUD + isolation entre utilisateurs, 0-10) rejoués contre l'URL de production
  via `@baseUrl` temporaire dans WebStorm — tous les codes de statut attendus obtenus. Voir DEVLOG pour
  l'incident OOM rencontré et corrigé (ajout de swap sur le VPS) en cours de route.*

### 8.5 — Déploiement du frontend (Vercel) ✅
- [x] Connecter le dépôt GitHub à Vercel, `VITE_API_URL` configuré vers `api.drumtempo.com`
- [x] `app.drumtempo.com` pointé vers Vercel via un enregistrement DNS Cloudflare (CNAME)
  *Test manuel : `https://app.drumtempo.com` charge l'app ; cycle complet (inscription/connexion/CRUD)
  fonctionne contre le backend de production.
  ✅ Confirmé le 2026-07-28 : projet Vercel importé (Root Directory `frontend`, `VITE_API_URL` en variable
  d'environnement), déploiement initial testé sur l'URL temporaire `drum-tempo.vercel.app` — CORS
  correctement refusé à ce stade (confirmé via `curl -X OPTIONS` : aucun `access-control-allow-origin`,
  cohérent avec `CORS_ORIGIN=https://app.drumtempo.com` en prod, aucune origine Vercel générique acceptée).
  Domaine custom `app.drumtempo.com` ajouté (CNAME Cloudflare, proxifié), validé par Vercel. Cycle complet
  (inscription/connexion/CRUD) testé et confirmé fonctionnel sur `https://app.drumtempo.com` contre
  `https://api.drumtempo.com`.*

### 8.6 — Pipeline de déploiement automatisé (CD) ✅
- [x] Vercel : déploiement automatique déjà natif via l'intégration GitHub (à vérifier/activer)
- [x] Backend : étendre `.github/workflows` avec un job de déploiement (déclenché après succès des tests sur
  `main`) qui se connecte au VPS et relance les conteneurs avec la nouvelle image
  *Test manuel : un commit sur `main` déclenche tests → déploiement automatique → nouvelle version visible
  en production, sans intervention manuelle.*
  ✅ Confirmé le 2026-07-30 : Vercel — "Production Branch" = `main` confirmé, "Ignored Build Step" =
  `Automatic` (build sautée si aucun changement dans `frontend/`, comportement voulu pour un monorepo).
  Backend — nouveau job `deploy-backend` dans `.github/workflows/tests.yml` (`needs: backend-tests`,
  `if: github.ref == 'refs/heads/main' && github.event_name == 'push'`), via `appleboy/ssh-action@v1` et
  une paire de clés SSH dédiée (`~/.ssh/drumtempo_deploy`, jamais la clé perso) restreinte côté VPS par une
  commande forcée dans `authorized_keys` (`command="~/deploy.sh",no-port-forwarding,no-X11-forwarding,
  no-agent-forwarding ...`) — même si le secret GitHub fuit, aucun accès shell général n'est possible.
  Cas négatif testé (push sur une branche non-`main` → `deploy-backend` n'apparaît pas). Cas positif testé
  (push sur `main` → tests verts → déploiement déclenché → conteneur `backend` recréé → `/health` toujours
  200). Deux incidents de collage rencontrés et corrigés en cours de route (voir DEVLOG.md).

### 8.7 — Vérification finale de bout en bout en production
- [ ] Reprendre le scénario de test manuel de l'Étape 7 (inscription/connexion/CRUD/persistance/
  déconnexion), cette fois sur les URLs de production, idéalement depuis un iPhone en réseau cellulaire
  (pas seulement en Wi-Fi local)
  *Test manuel : cycle complet réussi en conditions réelles d'utilisation.*

**Étape 7 (frontend — intégration de l'authentification) entièrement complétée.**
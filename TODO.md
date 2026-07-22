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
  *Test manuel : Ouvrir l'application sur le simulateur iPhone de l'IDE ou un appareil connecté et tester le cycle complet (ajout, +5/-5 BPM, suppression, persistance après rafraîchissement). ✅ Confirmé le 2026-07-21 — cycle complet fonctionnel.*1    
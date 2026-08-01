# Tâches futures - DrumTempo

Améliorations, nouvelles fonctionnalités et corrections de bogues pour l'application en production.
Le développement initial (Étapes 0 à 8) est archivé dans `TODO.md`.

## Légende des priorités
- **P1** — Immédiat : bogue critique, bloquant en production
- **P2** — Urgent : à faire bientôt
- **P3** — Normal : amélioration importante mais non urgente
- **P4** — Bas : nice to have
- **P5** — Cool à faire un jour : idée, pas encore priorisée

## Tâches

### P2
- [ ] Vérification du courriel à l'inscription : actuellement (`backend/src/models/User.ts`,
  `backend/src/routes/authRoutes.ts`), un compte est créé et utilisable immédiatement avec n'importe
  quel courriel, même invalide ou appartenant à quelqu'un d'autre — aucune vérification n'est faite.
  À ajouter : à l'inscription, générer un jeton de vérification à usage unique et à durée de vie
  limitée, l'envoyer par courriel via un lien sécurisé (ex: `/verify-email?token=...`), et marquer le
  compte comme non vérifié (`emailVerified: false`) tant que le lien n'a pas été suivi. Implique un
  changement au modèle `User` (champs `emailVerified`, `verificationToken`, expiration) et l'ajout d'un
  service d'envoi de courriel (actuellement absent du projet — à choisir).

- [ ] Confirmation avant suppression d'un exercice : le bouton "Supprimer" dans `ExerciseList.vue`
  (`supprimerExercice`) déclenche la suppression immédiatement, sans confirmation — une erreur de clic
  (facile sur mobile) entraîne une perte de données irréversible. À ajouter : un splash/dialogue
  "Êtes-vous certain?" avant d'émettre l'événement `supprimer`.

### P3
- [ ] Réorganisation complète de la documentation : `README.md` devient le point d'entrée unique vers
  toute la documentation du projet, structuré en 6 sections :
  1. Présentation du projet + survol de la pile technologique
  2. Build et lancement, y compris en installation locale (comme durant le développement)
  3. Comment collaborer
  4. Comment tester
  5. Prérequis : dépendances, système
  6. Structure du projet : catalogue des fichiers et de leur fonction
  Objectif : une personne voulant collaborer doit pouvoir comprendre le repo sans effort.

- [ ] Catégorisation des exercices : les exercices peuvent être classés par catégorie (ex: rudiments,
  patterns, exercices techniques). La catégorie `rudiments` existe par défaut et comprend d'emblée les 40
  rudiments de base internationaux (Percussive Arts Society). Implique un changement au modèle de données
  (`exercises`, ajout d'un champ catégorie) et une donnée d'amorçage (seed) pour les 40 rudiments.

### P4
- [ ] Messages d'erreur réseau bruts affichés à l'utilisateur : quand `fetch()` échoue avant même de
  recevoir une réponse (coupure réseau, perte de signal cellulaire, timeout), le navigateur lève une
  erreur avec un message technique brut (ex: `"Load failed"` sur Safari/iPhone, `"Failed to fetch"` sur
  Chrome) qui est affiché tel quel dans l'UI (`App.vue`, `erreur.value = error.message`). `httpClient.js`
  ne reformule ce message convivial (`ApiConfig.messageErreurHttpParDefaut`) que pour les erreurs HTTP
  (réponse reçue avec statut d'erreur), pas pour les échecs réseau en amont. À corriger : détecter ce cas
  (ex: `TypeError` sans `.status`) et afficher un message clair type "Problème de connexion, réessaie."

- [ ] Historique des tempos : conserver l'évolution dans le temps du `current_tempo` de chaque exercice
  (actuellement seule la valeur courante est stockée, l'ancienne est perdue à chaque mise à jour).
  Éventuellement, permettre de grapher cette progression. Implique un nouveau modèle de données
  (ex: collection `tempo_history` avec exercice, tempo, date) et une décision sur la rétention.

### P5
- [ ] UX inscription : le flux prend 2 clics (bascule de mode + soumission) et enchaîne directement sur
  la connexion sans écran de confirmation intermédiaire. Pas un bogue — comportement voulu à l'Étape 7 —
  mais pourrait être amélioré (ex: message de bienvenue, écran de confirmation).

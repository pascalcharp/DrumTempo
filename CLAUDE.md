# DrumTempo - Application de suivi de pratique de batterie

Application web pour suivre le tempo atteint lors des pratiques de batterie, optimisée pour iPhone et orchestrée avec Docker.

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

## Flot

### Pour chaque session, et chaque tâche:

- Proposer un plan
- Chaque étape du plan est testable, par une librairie de tests, ou manuellement.
- Les tests doivent être clairement énoncés et décrits
- Je roule moi-même les tests dans l'IDE

## Fichier TODO.md

    - La liste des tâches à accomplir est dans le fichier TODO.md.  

    - Dès qu'une tâche est accomplie: 
         - on marque cette tâche comme terminée dans TODO.md
         - on met à jour la priorité des tâches dans TODO.md.  J'ai le mot final pour approuver ce plan de travail.

## Fichier DEVLOG.md

La liste des modifications faites est consignée dans le fichier DEVLOG.md

## Commits

Accompagner chaque commit d'un message clair et descriptif qu'un humain comprend facilement.

## Style de programmation
La lisibilité est une PRIORITÉ ABSOLUE.

AUCUNE constante codée en dur dans le code source.  Toute constante est consignée dans une classe appropriée: soit une
classe créée à cet effet, soit une classe existante ayant un lien logique avec la constante.
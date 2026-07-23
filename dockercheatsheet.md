# 🐳 Aide-mémoire Docker Compose - DrumTempo

Ce guide rassemble les commandes indispensables pour gérer l'infrastructure (Frontend, Backend, MongoDB) de l'application en développement et en sécurité.

## 🏃‍♂️ Démarrage et Cycle de Vie

### Lancer l'environnement au premier plan
Affiche tous les logs en direct dans le terminal actuel (bloque la console).
```bash
docker-compose up
```

### Lancer en arrière-plan (Mode détaché)
Libère instantanément votre terminal WebStorm pour vous permettre de continuer à taper des commandes.
```bash
docker-compose up -d
```

### Recompiler et lancer (Le combo classique)
Force la reconstruction des images (à faire dès que vous modifiez le code source ou ajoutez un package npm).
```bash
docker-compose up --build
```

### Le Combo Ultime de Développement
Recompile tout, vide les caches des volumes anonymes de dépendances, et lance discrètement en arrière-plan.
```bash
docker-compose up --build -V -d
```

---

## 🛑 Arrêt et Nettoyage

### Arrêter les conteneurs (Sans perte de données)
Éteint les services mais conserve vos exercices et utilisateurs intacts dans la base de données.
```bash
docker-compose down
```

### Réinitialisation Totale (Raser la base de données)
Arrête les conteneurs et **supprime définitivement tous les volumes**. Utile pour vider MongoDB et tester l'authentification sur une base 100 % vierge.
```bash
docker-compose down -v
```

---

## 🔍 Inspection et Diagnostic

### Voir les logs de tous les services en continu
```bash
docker-compose logs -f
```

### Voir les logs d'un service spécifique (ex: backend ou frontend)
```bash
docker-compose logs -f backend
```

### Vérifier le statut des conteneurs
Affiche quels conteneurs tournent, leurs identifiants et les ports réseau exposés.
```bash
docker-compose ps
```

---

## 🛠️ Commandes Avancées (Pédagogique)

### Exécuter une commande à l'intérieur d'un conteneur
Permet de lancer une commande directement dans l'environnement du conteneur (ex: vérifier l'utilisateur actif).
```bash
docker-compose exec backend whoami
```

### Ouvrir un terminal interactif dans un conteneur
```bash
docker-compose exec backend sh
```

### Se connecter manuellement à la base MongoDB du conteneur
Permet d'ouvrir le terminal MongoDB pour inspecter vos collections de batteurs au besoin.
```bash
docker-compose exec db mongosh
```

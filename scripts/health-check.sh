#!/bin/bash
# Vérifie l'état de la production DrumTempo (VPS) : health check HTTP, logs backend
# récents et état des conteneurs Docker. Affiche "Status OK" si tout va bien, sinon
# la liste des problèmes détectés.
#
# Usage (sur le VPS, depuis ~/drumtempo) : ./scripts/health-check.sh

cd ~/drumtempo

PROBLEMES=()

# 1. Health check HTTP
REPONSE_HEALTH=$(curl -sI https://api.drumtempo.com/health)
if ! echo "$REPONSE_HEALTH" | grep -q "HTTP.*200"; then
  PROBLEMES+=("Health check échoué : $(echo "$REPONSE_HEALTH" | head -n1)")
fi

# 2. Logs backend des 10 dernières minutes : chercher des erreurs
LOGS_BACKEND=$(docker compose -f docker-compose.prod.yml --env-file .env.prod logs backend --since 10m 2>&1)
if echo "$LOGS_BACKEND" | grep -qi "error"; then
  PROBLEMES+=("Erreurs trouvées dans les logs backend (10 dernières minutes)")
fi

# 3. État des conteneurs
ETAT_CONTENEURS=$(docker compose -f docker-compose.prod.yml --env-file .env.prod ps)
if ! echo "$ETAT_CONTENEURS" | grep -q "drumtempo-backend.*Up"; then
  PROBLEMES+=("Conteneur drumtempo-backend n'est pas 'Up'")
fi
if ! echo "$ETAT_CONTENEURS" | grep -q "drumtempo-caddy.*Up"; then
  PROBLEMES+=("Conteneur drumtempo-caddy n'est pas 'Up'")
fi

if [ ${#PROBLEMES[@]} -eq 0 ]; then
  echo "Status OK"
else
  echo "Problème(s) détecté(s) :"
  printf ' - %s\n' "${PROBLEMES[@]}"
fi

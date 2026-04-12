#!/bin/bash
# Script d'import des workflows n8n pour maxmorrys.me
# Usage: N8N_URL=https://... N8N_API_KEY=... ./import.sh

set -euo pipefail

N8N_URL="${N8N_URL:?Erreur: N8N_URL non defini. Export N8N_URL=https://votre-instance-n8n.com}"
N8N_API_KEY="${N8N_API_KEY:?Erreur: N8N_API_KEY non defini. Export N8N_API_KEY=votre-cle}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Ordre d'import (respecte les dependances)
WORKFLOWS=(
  "creation-medias/WF-15-generation-images.json"
  "community-management/WF-01-veille-geolocalisee.json"
  "redaction-web/WF-07-recherche-idees-tendances.json"
  "community-management/WF-02-calendrier-editorial.json"
  "community-management/WF-03-generation-posts.json"
  "redaction-web/WF-08-redaction-articles-seo.json"
  "creation-medias/WF-16-creation-carrousels.json"
  "creation-medias/WF-17-creation-visuels-reels.json"
  "lms-course-builder/WF-10-recherche-planification-cours.json"
  "lms-course-builder/WF-11-conception-pedagogique.json"
  "lms-course-builder/WF-12-generation-contenu-cours.json"
  "lms-course-builder/WF-13-creation-exercices-quiz.json"
  "creation-medias/WF-18-creation-supports-cours.json"
  "lms-course-builder/WF-14-publication-validation.json"
  "community-management/WF-04-publication-automatique.json"
  "community-management/WF-05-gestion-commentaires.json"
  "community-management/WF-06-reporting-analytics.json"
  "redaction-web/WF-09-production-newsletters.json"
)

echo "=== Import des workflows n8n pour maxmorrys.me ==="
echo "Instance: $N8N_URL"
echo ""

imported=0
failed=0

for wf in "${WORKFLOWS[@]}"; do
  filepath="$SCRIPT_DIR/$wf"
  name=$(basename "$wf" .json)

  if [ ! -f "$filepath" ]; then
    echo "SKIP  $name — fichier non trouve"
    continue
  fi

  echo -n "IMPORT $name ... "

  response=$(curl -s -w "\n%{http_code}" \
    -X POST "$N8N_URL/api/v1/workflows" \
    -H "X-N8N-API-KEY: $N8N_API_KEY" \
    -H "Content-Type: application/json" \
    -d @"$filepath")

  http_code=$(echo "$response" | tail -1)
  body=$(echo "$response" | head -n -1)

  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    wf_id=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "OK (id: $wf_id)"
    ((imported++))
  else
    echo "ERREUR (HTTP $http_code)"
    echo "  $body" | head -3
    ((failed++))
  fi
done

echo ""
echo "=== Resultat ==="
echo "Importes: $imported"
echo "Echoues: $failed"
echo ""
echo "IMPORTANT: Les workflows sont importes en mode INACTIF."
echo "Remplacez les %%PLACEHOLDER%% puis activez-les dans l'ordre indique dans README.md"

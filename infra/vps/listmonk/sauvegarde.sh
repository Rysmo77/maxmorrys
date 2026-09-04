#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# SAUVEGARDE QUOTIDIENNE DE LA BASE LISTMONK.
#
# Ce que contient cette base n'existe NULLE PART ailleurs : les consentements et leurs
# horodatages, les désabonnements, l'historique des campagnes. Firestore porte les adresses,
# pas la preuve du consentement telle que Listmonk la tient. Une perte ici n'est pas une
# gêne, c'est l'impossibilité de prouver qu'on avait le droit d'écrire.
#
# Pose : /opt/maxmorrys-stack/sauvegarde-listmonk.sh, puis
#   0 2 * * * /opt/maxmorrys-stack/sauvegarde-listmonk.sh >> /var/log/listmonk-backup.log 2>&1
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DEST="${LISTMONK_BACKUP_DIR:-/opt/maxmorrys-stack/sauvegardes/listmonk}"
GARDE_JOURS="${LISTMONK_BACKUP_KEEP_DAYS:-30}"
HORODATAGE="$(date -u +%Y%m%dT%H%M%SZ)"
FICHIER="$DEST/listmonk-$HORODATAGE.sql.gz"

mkdir -p "$DEST"

# `pg_dump` dans le conteneur, compression au vol : la base tient en mémoire du flux, on
# n'écrit jamais de dump non compressé sur un disque qu'on ne maîtrise pas.
docker exec maxmorrys-listmonk-db pg_dump -U listmonk -d listmonk | gzip -9 > "$FICHIER"

# Un dump vide ou tronqué est PIRE qu'aucun dump : il fait croire à une sauvegarde. On
# vérifie l'intégrité de l'archive avant de considérer l'opération réussie.
gzip -t "$FICHIER"
TAILLE=$(wc -c < "$FICHIER")
if [ "$TAILLE" -lt 1024 ]; then
  echo "ÉCHEC : dump suspect ($TAILLE octets) — conservé pour examen : $FICHIER" >&2
  exit 1
fi

# La rotation ne s'exécute qu'APRÈS la vérification : purger d'abord reviendrait à jeter
# les bonnes sauvegardes le jour où la nouvelle échoue.
find "$DEST" -name 'listmonk-*.sql.gz' -type f -mtime +"$GARDE_JOURS" -delete

echo "OK $HORODATAGE — $TAILLE octets — $FICHIER"

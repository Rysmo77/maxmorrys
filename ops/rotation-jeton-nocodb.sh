#!/usr/bin/env bash
# Rotation du jeton NocoDB « n8n-maxmorrys » (n°1), exposé dans une sortie de commande le 04/11/2026.
# À lancer DU MAC, en deux temps (aucune valeur n'est jamais affichée) :
#
#   ssh maxmorrys-vps 'bash -s' < ops/rotation-jeton-nocodb.sh            # 1. crée et pose le nouveau
#   ssh maxmorrys-vps 'bash -s -- retirer' < ops/rotation-jeton-nocodb.sh # 2. supprime l'ancien
#
# Temps 1 : nouveau jeton (même format que le n°1) → accepté par NocoDB ? → posé dans l'identifiant
# n8n « NocoDB Max-Morrys » (MMNOCODBCRED001), dans /opt/maxmorrys-stack/.nocodb-api-token et
# /etc/mm-agents/env. L'ancien reste valide : rien ne casse si une étape échoue.
# Temps 2 : vérifie que n8n et les fichiers portent le nouveau, puis supprime le n°1.
set -euo pipefail
umask 077
PG=maxmorrys-postgres; N8N=maxmorrys-n8n; CRED=MMNOCODBCRED001
FICHIER=/opt/maxmorrys-stack/.nocodb-api-token; ENVF=/etc/mm-agents/env
sql() { printf '%s\n' "$1" > /tmp/rot.sql; docker cp /tmp/rot.sql $PG:/tmp/rot.sql; shred -u /tmp/rot.sql
        docker exec $PG sh -c 'psql -qtA -U $POSTGRES_USER -d nocodb -f /tmp/rot.sql; rm /tmp/rot.sql'; }
empreinte() { tr -d '\r\n' | sha256sum | cut -c1-10; }
jeton_n8n() { docker exec $N8N n8n export:credentials --id=$CRED --decrypted --output=/tmp/c.json >/dev/null 2>&1
  docker exec $N8N node -e 'const c=JSON.parse(require("fs").readFileSync("/tmp/c.json","utf8"));const x=Array.isArray(c)?c[0]:c;
    const k=Object.keys(x.data).find(k=>/token/i.test(k));process.stdout.write(String(x.data[k]))'
  docker exec $N8N rm -f /tmp/c.json; }
teste() { curl -s -o /dev/null -w '%{http_code}' -H "xc-token: $1" http://127.0.0.1:8091/api/v1/db/meta/projects/ph7ugup4mggzj2y/tables; }

if [ "${1:-}" = retirer ]; then
  NV=$(tr -d '\r\n' < $FICHIER)
  [ "$(teste "$NV")" = 200 ] || { echo "✖ le jeton du fichier n'est pas accepté : rien supprimé"; exit 1; }
  [ "$(jeton_n8n | empreinte)" = "$(printf %s "$NV" | empreinte)" ] || { echo "✖ n8n ne porte pas le nouveau jeton : rien supprimé"; exit 1; }
  [ "$(sed -n 's/^NOCODB_TOKEN=//p' $ENVF | empreinte)" = "$(printf %s "$NV" | empreinte)" ] || { echo "✖ $ENVF pas à jour : rien supprimé"; exit 1; }
  sql "delete from nc_api_tokens where id = 1 and description = 'n8n-maxmorrys';"
  docker restart nocodb-maxmorrys >/dev/null   # vide le cache de jetons de NocoDB
  shred -u /root/.nocodb-api-token.ancien 2>/dev/null || true
  echo "✔ ancien jeton supprimé ; jetons restants :"; sql "select id||' · '||description from nc_api_tokens order by id;"
  exit 0
fi

T2=$(tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 40)
sql "insert into nc_api_tokens (description, token, enabled, fk_user_id, created_at, updated_at)
     select 'n8n-maxmorrys-2026-11-04', '$T2', true, fk_user_id, now(), now() from nc_api_tokens where id = 1;"
c=$(teste "$T2"); echo "nouveau jeton accepté par NocoDB : HTTP $c"
[ "$c" = 200 ] || { echo "✖ arrêt : n8n et les fichiers n'ont pas été touchés"; exit 1; }

docker exec $N8N n8n export:credentials --id=$CRED --decrypted --output=/tmp/c.json >/dev/null 2>&1
docker exec -e T2="$T2" $N8N node -e '
  const fs=require("fs"); const c=JSON.parse(fs.readFileSync("/tmp/c.json","utf8")); const x=Array.isArray(c)?c[0]:c;
  const k=Object.keys(x.data).filter(k=>/token/i.test(k)); if(k.length!==1){console.error("champs jeton : "+k);process.exit(1)}
  x.data[k[0]]=process.env.T2; fs.writeFileSync("/tmp/c.json", JSON.stringify([x])); console.log("n8n : champ "+k[0]+" remplacé");'
docker exec $N8N sh -c 'n8n import:credentials --input=/tmp/c.json >/dev/null 2>&1; r=$?; rm -f /tmp/c.json; exit $r'
[ "$(jeton_n8n | empreinte)" = "$(printf %s "$T2" | empreinte)" ] && echo "✔ n8n porte le nouveau jeton" || { echo "✖ n8n pas à jour"; exit 1; }

cp $FICHIER /root/.nocodb-api-token.ancien
printf '%s\n' "$T2" > $FICHIER
sed -i "s/^NOCODB_TOKEN=.*/NOCODB_TOKEN=$T2/" $ENVF
echo "✔ $FICHIER et $ENVF à jour"
echo "→ Attends un passage réussi d'un workflow NocoDB (WF-HEALTH, WF-SOCIAL-04), puis lance le temps 2 (retirer)."

#!/usr/bin/env bash
# Remise en route du VPS après une coupure (renouvellement Contabo du 04/11/2026), lancée DU MAC.
#
#   bash ops/vps-reprise.sh              # attend le VPS, contrôle, installe les agents, essai réel
#   bash ops/vps-reprise.sh --sans-essai # tout sauf le lancement réel d'une mission
#
# Ce que fait ce script :
#   1. attend que le VPS réponde en SSH (30 min au plus) ;
#   2. contrôle les services Max-Morrys (n8n, Postgres, NocoDB, Paperclip, render-card, Caddy,
#      sauvegarde nocturne) et relance UNIQUEMENT les conteneurs Max-Morrys arrêtés — les autres
#      projets du VPS (khanouss, steps) sont seulement signalés ;
#   3. contrôle les adresses publiques et le nombre de workflows n8n actifs ;
#   4. installe les agents autonomes : clé de lecture GitHub (déjà enregistrée, lecture seule),
#      kit et secrets de ops/agents-autonomes/secrets/ (effacés du VPS par install.sh) ;
#   5. lance une mission réelle de test (demandes, Ibrahima) et montre le calendrier.
# Les secrets ne sont jamais affichés.
set -uo pipefail

ICI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RACINE="$(cd "$ICI/.." && pwd)"
KIT="$ICI/agents-autonomes"
SEC="$KIT/secrets"
H=root@158.220.124.185
# Une seule connexion réutilisée : une rafale de connexions SSH déclenche le blocage
# anti-intrusion du VPS (vécu le 04/11/2026, adresse du Mac bannie en pleine installation).
CTL="/tmp/mm-vps-%C"   # court : macOS limite un chemin de socket à 104 caractères
SSH=(ssh -i "$HOME/.ssh/maxmorrys_vps" -o IdentitiesOnly=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new
     -o ControlMaster=auto -o ControlPath="$CTL" -o ControlPersist=10m -o ServerAliveInterval=30 "$H")
ESSAI=1; [ "${1:-}" = "--sans-essai" ] && ESSAI=0

etape() { printf '\n\033[1m▶ %s\033[0m\n' "$*"; }
ok() { printf '  ✔ %s\n' "$*"; }
ko() { printf '  ✖ %s\n' "$*"; }

# ── 1. Attendre le VPS ───────────────────────────────────────────────────────────
etape "Attente du VPS (SSH)"
for i in $(seq 1 60); do
  nc -z -G 5 158.220.124.185 22 2>/dev/null && "${SSH[@]}" true 2>/dev/null && { ok "joignable"; break; }
  if [ "$i" = 60 ]; then
    if [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 https://n8n.maxmorrys.me/healthz)" = 200 ]; then
      ko "n8n répond mais SSH reste fermé : l'adresse du Mac est bannie par fail2ban."
      ko "Console Contabo (VNC), en root : fail2ban-client set sshd unbanip $(curl -s --max-time 8 https://api.ipify.org)"
    else ko "VPS injoignable après 30 min : vérifie le renouvellement chez Contabo"; fi
    exit 1
  fi
  sleep 30
done
"${SSH[@]}" 'echo "  · $(hostname) — démarré depuis $(uptime -p | sed "s/up //")"; df -h / | awk "NR==2{print \"  · disque : \"\$5\" utilisé\"}"; free -h | awk "/Mem/{print \"  · mémoire : \"\$3\" / \"\$2}"'

# ── 2. Services ──────────────────────────────────────────────────────────────────
etape "Services"
"${SSH[@]}" 'bash -s' <<'DISTANT'
for c in $(docker ps -a --format '{{.Names}}' | grep -i maxmorrys); do
  s=$(docker inspect -f '{{.State.Status}}' "$c")
  if [ "$s" != running ]; then docker start "$c" >/dev/null && echo "  ↻ $c relancé (était $s)" || echo "  ✖ $c ne redémarre pas"
  else echo "  ✔ $c"; fi
done
for c in $(docker ps -a --format '{{.Names}}' | grep -vi maxmorrys); do
  s=$(docker inspect -f '{{.State.Status}}' "$c"); [ "$s" = running ] && echo "  ✔ $c (autre projet)" || echo "  ⚠ $c : $s (autre projet, non touché)"
done
for u in paperclip-maxmorrys paperclip-maxmorrys-bridge render-card; do
  systemctl list-unit-files "$u.service" >/dev/null 2>&1 || continue
  [ "$(systemctl is-active "$u")" = active ] && echo "  ✔ $u" || { systemctl restart "$u" && echo "  ↻ $u relancé" || echo "  ✖ $u en échec"; }
done
systemctl is-active maxmorrys-backup.timer >/dev/null && echo "  ✔ sauvegarde nocturne programmée" || echo "  ✖ maxmorrys-backup.timer inactif"
curl -s -o /dev/null -w '  · render-card local : HTTP %{http_code}\n' --max-time 5 http://127.0.0.1:8787/ || true
DISTANT

# ── 3. Adresses publiques et n8n ─────────────────────────────────────────────────
etape "Adresses publiques"
sleep 5
for u in https://n8n.maxmorrys.me/healthz https://noco.maxmorrys.me/api/v1/health https://paperclip.maxmorrys.me/; do
  printf '  · %-45s HTTP %s\n' "$u" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$u")"
done
NKEY="$(grep -E '^(export )?N8N_API_KEY=' "$RACINE/.env.local" | tail -1 | sed -E 's/^(export )?N8N_API_KEY=//; s/^["'\'']|["'\'']$//g')"
if [ -n "$NKEY" ]; then
  n=$(curl -s --max-time 15 -H "X-N8N-API-KEY: $NKEY" 'https://n8n.maxmorrys.me/api/v1/workflows?active=true&limit=250' \
      | python3 -c 'import json,sys; print(len(json.load(sys.stdin)["data"]))' 2>/dev/null)
  [ -n "$n" ] && ok "n8n : $n workflows actifs (14 attendus au 04/11)" || ko "n8n : API muette"
fi

# ── 4. Agents autonomes ──────────────────────────────────────────────────────────
etape "Installation des agents autonomes"
for f in mm_agents_deploy mm_agents_deploy.pub firebase-sa.json marketing.key; do
  [ -s "$SEC/$f" ] || { ko "manque $SEC/$f"; exit 1; }
done
"${SSH[@]}" 'install -d -o maxmorrys -g maxmorrys -m 700 /home/maxmorrys/.ssh && rm -rf /root/agents-autonomes && mkdir -p /root/agents-autonomes'
# La clé de lecture va directement à sa place ; le reste du kit (secrets compris) dans /root.
"${SSH[@]}" 'cat > /home/maxmorrys/.ssh/mm_agents_deploy'     < "$SEC/mm_agents_deploy"
"${SSH[@]}" 'cat > /home/maxmorrys/.ssh/mm_agents_deploy.pub' < "$SEC/mm_agents_deploy.pub"
"${SSH[@]}" 'chown maxmorrys:maxmorrys /home/maxmorrys/.ssh/mm_agents_deploy*; chmod 600 /home/maxmorrys/.ssh/mm_agents_deploy; chmod 644 /home/maxmorrys/.ssh/mm_agents_deploy.pub'
COPYFILE_DISABLE=1 tar -C "$KIT" -chf - --exclude 'secrets/mm_agents_deploy*' --exclude '.DS_Store' . \
  | "${SSH[@]}" 'tar -C /root/agents-autonomes -xf - && chmod 700 /root/agents-autonomes/secrets && chmod 600 /root/agents-autonomes/secrets/*' \
  || { ko "copie du kit interrompue"; exit 1; }
"${SSH[@]}" 'test -s /home/maxmorrys/.ssh/mm_agents_deploy && test -s /root/agents-autonomes/install.sh' || { ko "kit incomplet sur le VPS"; exit 1; }
ok "kit copié"
"${SSH[@]}" 'bash /root/agents-autonomes/install.sh' || { ko "install.sh a échoué (voir ci-dessus)"; exit 1; }
"${SSH[@]}" 'ls /root/agents-autonomes/secrets 2>/dev/null | grep -q . && { shred -u /root/agents-autonomes/secrets/* 2>/dev/null; echo "  ✔ restes de secrets effacés"; } || echo "  ✔ aucun secret laissé dans /root"'

# ── 5. Essai réel ────────────────────────────────────────────────────────────────
if [ "$ESSAI" = 1 ]; then
  etape "Essai réel : mission « demandes » (Ibrahima, brouillons seulement, compte-rendu Telegram)"
  "${SSH[@]}" 'systemctl start --no-block mm-agent@demandes.service; sleep 20; systemctl status mm-agent@demandes.service --no-pager | head -6; tail -n 5 /var/log/mm-agents/*demandes* 2>/dev/null'
  echo "  · suite : ssh maxmorrys-vps journalctl -u mm-agent@demandes -f"
fi

etape "Calendrier"
"${SSH[@]}" "systemctl list-timers 'mm-agent-*' --no-pager"
echo
echo "✅ Reprise terminée. Couper tous les agents : ssh maxmorrys-vps touch /opt/mm-agents/PAUSE"

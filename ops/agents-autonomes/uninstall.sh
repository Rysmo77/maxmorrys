#!/usr/bin/env bash
# Retire les agents BMad autonomes du VPS (symétrique d'install.sh). Idempotent.
#
#   sudo bash uninstall.sh            → arrête et retire minuteries, unités, /opt/mm-agents, /etc/mm-agents
#   sudo bash uninstall.sh --purge    → retire AUSSI la copie du dépôt, la clé SSH, les sorties et les journaux
#
# Ne touche ni à n8n, ni à NocoDB, ni à Paperclip, ni au jeton Claude.
set -euo pipefail
PURGE=0; [ "${1:-}" = --purge ] && PURGE=1
[ "$(id -u)" = 0 ] || { echo "à lancer en root : sudo bash $0" >&2; exit 1; }
USR=maxmorrys; HOME_U=/home/$USR

echo "▶ Minuteries et unités"
for t in /etc/systemd/system/mm-agent-*.timer; do [ -e "$t" ] && systemctl disable --now "$(basename "$t")" 2>/dev/null || true; done
systemctl stop 'mm-agent@*.service' 2>/dev/null || true
rm -f /etc/systemd/system/mm-agent@.service /etc/systemd/system/mm-agent-*.timer
systemctl daemon-reload
systemctl reset-failed 'mm-agent@*' 2>/dev/null || true

echo "▶ Lanceur, environnement et secrets copiés (firebase-sa.json, gsc-sa.json, marketing.key)"
rm -rf /opt/mm-agents /etc/mm-agents

if [ "$PURGE" = 1 ]; then
  echo "▶ Purge : copie, clé, sorties, état partagé, journaux"
  rm -rf "$HOME_U/agents" /var/log/mm-agents
  rm -f "$HOME_U/.ssh/mm_agents_deploy" "$HOME_U/.ssh/mm_agents_deploy.pub"
  cat <<'EOF'
  ⚠ Pense à retirer la clé côté GitHub, depuis ton Mac :
    gh repo deploy-key list --repo Rysmo77/maxmorrys
    gh repo deploy-key delete <id> --repo Rysmo77/maxmorrys
EOF
else
  echo "  (gardés : $HOME_U/agents — copie, sorties et état partagé —, la clé $HOME_U/.ssh/mm_agents_deploy, /var/log/mm-agents — --purge pour tout retirer)"
fi
echo "✅ Désinstallé."

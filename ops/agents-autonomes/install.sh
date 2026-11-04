#!/usr/bin/env bash
# Installe les agents BMad autonomes sur le VPS. Idempotent : se relance sans risque.
#
#   sudo bash install.sh [--branch <branche>]      (depuis le dossier ops/agents-autonomes)
#
# Ce que fait ce script (et rien d'autre) :
#   1. vérifie les prérequis (utilisateur maxmorrys, claude, node, git, flock, fichiers de jetons) ;
#   2. installe le lanceur, les outils, les missions et le calendrier des lettres dans
#      /opt/mm-agents (root, lecture seule pour l'agent) ;
#   3. crée la clé SSH de LECTURE du dépôt si elle manque, et AFFICHE la commande `gh` à lancer
#      sur le Mac (il ne touche pas à GitHub) — puis attend que la clé soit acceptée ;
#   4. clone la copie jetable dans /home/maxmorrys/agents/maxmorrys.me ;
#   5. range les secrets dans /etc/mm-agents (maxmorrys, 600) : Search Console (copié du VPS),
#      compte de service Firebase et clé marketing (déposés par Max dans ./secrets/, puis effacés) ;
#      écrit /etc/mm-agents/env (NocoDB local, branche, rendu local, chemins des secrets) ;
#   6. installe les unités systemd et active toutes les minuteries du kit ;
#   7. fait un essai à blanc (--dry-run) de chaque tâche.
# Désinstaller : sudo bash uninstall.sh
set -euo pipefail

ICI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRANCHE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --branch) BRANCHE="$2"; shift 2 ;;
    *) echo "option inconnue : $1" >&2; exit 2 ;;
  esac
done

USR=maxmorrys
HOME_U=/home/$USR
MM_HOME=/opt/mm-agents
ETC=/etc/mm-agents
LOGS=/var/log/mm-agents
COPIE=$HOME_U/agents/maxmorrys.me
CLE=$HOME_U/.ssh/mm_agents_deploy
DEPOT_SSH=git@github.com:Rysmo77/maxmorrys.git
DEPOT_GH=Rysmo77/maxmorrys
VPS=root@158.220.124.185
JETON_NOCO=/opt/maxmorrys-stack/.nocodb-api-token
RENDER_ENV=/etc/render-card/env
GSC_SRC=/opt/maxmorrys-stack/gsc-sa.json
CLAUDE_ENV=/etc/paperclip/maxmorrys.env
# Clé d'hôte publiée par GitHub (docs « GitHub's SSH key fingerprints ») : pas de confiance aveugle.
GITHUB_HOTE='github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl'

etape() { printf '\n\033[1m▶ %s\033[0m\n' "$*"; }
ok() { printf '  ✔ %s\n' "$*"; }
die() { printf '  ✖ %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" = 0 ] || die "à lancer en root : sudo bash $0"

# ── 1. Prérequis ────────────────────────────────────────────────────────────────
etape "Prérequis"
id "$USR" >/dev/null 2>&1 || die "utilisateur $USR absent"
for b in claude node git flock timeout curl ssh-keygen systemctl; do command -v "$b" >/dev/null || die "$b introuvable"; done
for f in "$JETON_NOCO" "$CLAUDE_ENV"; do [ -s "$f" ] || die "$f absent ou vide"; done
grep -q '^CLAUDE_CODE_OAUTH_TOKEN=.' "$CLAUDE_ENV" || die "CLAUDE_CODE_OAUTH_TOKEN absent de $CLAUDE_ENV"
# mm-decision.mjs est un lien vers scripts/growth/decision.mjs (scp -r et install copient la cible).
OUTILS="mm-rendu mm-meta-verif.mjs qa-lot.mjs mm-firestore.mjs mm-gsc.mjs mm-lettre-epreuve.mjs mm-decision.mjs mm-idees.mjs"
for f in run-agent.sh lib.sh calendrier-lettres.txt systemd/mm-agent@.service $(for o in $OUTILS; do echo "outils/$o"; done); do
  [ -f "$ICI/$f" ] || die "fichier manquant dans $ICI : $f"
done
ok "claude $(sudo -u "$USR" claude --version 2>/dev/null | head -1), node $(node --version), $(git --version)"

# Branche : option > valeur déjà installée > défaut (celle qui porte les skills mm-agent-*).
if [ -z "$BRANCHE" ] && [ -r "$ETC/env" ]; then BRANCHE="$(sed -n 's/^MM_BRANCH=//p' "$ETC/env" | tail -1)"; fi
BRANCHE="${BRANCHE:-refonte/sous-domaines}"
ok "branche suivie : $BRANCHE"

# ── 2. Lanceur, outils, missions ────────────────────────────────────────────────
etape "Lanceur et outils dans $MM_HOME"
install -d -o root -g root -m 755 "$MM_HOME" "$MM_HOME/bin" "$MM_HOME/missions"
install -o root -g root -m 755 "$ICI/run-agent.sh"            "$MM_HOME/bin/run-agent.sh"
for o in $OUTILS; do install -o root -g root -m 755 "$ICI/outils/$o" "$MM_HOME/bin/$o"; done
install -o root -g root -m 644 "$ICI/lib.sh" "$MM_HOME/lib.sh"
install -o root -g root -m 644 "$ICI/calendrier-lettres.txt" "$MM_HOME/calendrier-lettres.txt"
rm -f "$MM_HOME"/missions/*.md
install -o root -g root -m 644 "$ICI"/missions/*.md "$MM_HOME/missions/"
install -d -o "$USR" -g "$USR" -m 750 "$LOGS" "$HOME_U/agents" "$HOME_U/agents/sorties" "$HOME_U/agents/etat"
ok "$(ls "$MM_HOME/missions" | wc -l | tr -d ' ') missions, $(echo $OUTILS | wc -w | tr -d ' ') outils"
ok "installé (les missions du dépôt priment sur cette copie dès qu'elles y sont poussées)"

# ── 3. Clé de lecture du dépôt ──────────────────────────────────────────────────
etape "Clé SSH de lecture (deploy key)"
install -d -o "$USR" -g "$USR" -m 700 "$HOME_U/.ssh"
if [ ! -f "$CLE" ]; then
  sudo -u "$USR" ssh-keygen -q -t ed25519 -N '' -C "vps-agents-bmad@$(hostname)" -f "$CLE"
  ok "clé créée : $CLE"
else ok "clé déjà présente : $CLE"; fi
touch "$HOME_U/.ssh/known_hosts"; chown "$USR:$USR" "$HOME_U/.ssh/known_hosts"; chmod 600 "$HOME_U/.ssh/known_hosts"
grep -qF "$GITHUB_HOTE" "$HOME_U/.ssh/known_hosts" || echo "$GITHUB_HOTE" >> "$HOME_U/.ssh/known_hosts"
SSH_CMD="ssh -i $CLE -o IdentitiesOnly=yes -o BatchMode=yes"

acces() { sudo -u "$USR" env GIT_SSH_COMMAND="$SSH_CMD" git ls-remote --heads "$DEPOT_SSH" "$BRANCHE" 2>/dev/null | grep -q .; }
if acces; then ok "GitHub accepte la clé (branche $BRANCHE visible)"
else
  cat <<EOF

  ┌─ À LANCER SUR TON MAC (une seule fois) ──────────────────────────────────────
  │ ssh -i ~/.ssh/maxmorrys_vps $VPS cat $CLE.pub > /tmp/vps-agents-bmad.pub && gh repo deploy-key add /tmp/vps-agents-bmad.pub --repo $DEPOT_GH --title vps-agents-bmad
  └──────────────────────────────────────────────────────────────────────────────
  (clé en lecture seule : sans --allow-write, elle ne peut rien pousser)
  Clé publique : $(cat "$CLE.pub")

  J'attends que GitHub accepte la clé (15 min au plus ; Ctrl-C puis relance plus tard sans risque)…
EOF
  for _ in $(seq 1 60); do acces && break; sleep 15; done
  acces || die "clé toujours refusée (ou branche « $BRANCHE » absente du dépôt). Lance la commande ci-dessus, puis relance : sudo bash $0"
  ok "GitHub accepte la clé"
fi

# ── 4. Copie jetable ────────────────────────────────────────────────────────────
etape "Copie jetable du dépôt"
if [ ! -d "$COPIE/.git" ]; then
  sudo -u "$USR" env GIT_SSH_COMMAND="$SSH_CMD" git clone -q --depth 1 --branch "$BRANCHE" "$DEPOT_SSH" "$COPIE"
  ok "clonée dans $COPIE"
else ok "déjà présente : $COPIE"; fi
sudo -u "$USR" git -C "$COPIE" config core.sshCommand "$SSH_CMD"
sudo -u "$USR" git -C "$COPIE" config remote.origin.fetch "+refs/heads/$BRANCHE:refs/remotes/origin/$BRANCHE"
sudo -u "$USR" git -C "$COPIE" fetch -q --depth 1 origin "$BRANCHE"
sudo -u "$USR" git -C "$COPIE" reset -q --hard "origin/$BRANCHE"
ok "à jour : $(sudo -u "$USR" git -C "$COPIE" log -1 --format='%h %s' | cut -c1-80)"
for f in scripts/growth/nocodb.mjs scripts/growth/nayo.mjs .claude/skills/mm-agent-mariam/references/lot-social.md \
         .claude/skills/mm-agent-yann/references/verification-publie.md; do
  [ -f "$COPIE/$f" ] || die "la branche $BRANCHE ne contient pas $f : choisis une autre branche (--branch)"
done

# ── 5. Secrets et environnement ─────────────────────────────────────────────────
etape "Secrets dans $ETC (maxmorrys, 600)"
install -d -o root -g "$USR" -m 750 "$ETC"
ranger() { # ranger <source> <nom> <effacer-la-source:0|1>
  local src="$1" dst="$ETC/$2"
  if [ -s "$src" ]; then
    install -o "$USR" -g "$USR" -m 600 "$src" "$dst"
    [ "$3" = 1 ] && { shred -u "$src" 2>/dev/null || rm -f "$src"; }
    ok "$2 ← $src$([ "$3" = 1 ] && echo ' (source effacée)')"
  elif [ -s "$dst" ]; then ok "$2 déjà en place"
  else printf '  ⚠ %s absent : les missions qui en dépendent le signaleront (README § Secrets)\n' "$2"; fi
}
ranger "$GSC_SRC" gsc-sa.json 0
ranger "$ICI/secrets/firebase-sa.json" firebase-sa.json 1
ranger "$ICI/secrets/marketing.key" marketing.key 1

etape "Environnement $ETC/env"
RKEY="$( [ -r "$RENDER_ENV" ] && sed -n 's/^RENDER_KEY=//p' "$RENDER_ENV" | tail -1 || true)"
umask 027
TMP="$(mktemp "$ETC/.env.XXXXXX")"
{
  echo "# Écrit par install.sh le $(date '+%F %T') — relancer install.sh pour le régénérer."
  echo "NOCODB_URL=http://127.0.0.1:8091"
  echo "NOCODB_TOKEN=$(tr -d '\r\n' < "$JETON_NOCO")"
  echo "MM_BRANCH=$BRANCHE"
  echo "MM_REPO_DIR=$COPIE"
  echo "# Rendu render-card en local (scripts/growth/nayo.mjs) au lieu du SSH du Mac."
  echo "NAYO_RENDER_LOCAL=1"
  echo "NAYO_RENDER_URL=http://127.0.0.1:8787/render"
  [ -n "$RKEY" ] && echo "RENDER_KEY=$RKEY"
  echo "# Secrets des outils (absents → l'outil le dit, la mission le rapporte)."
  echo "GOOGLE_APPLICATION_CREDENTIALS=$ETC/firebase-sa.json"
  echo "MM_GSC_SA=$ETC/gsc-sa.json"
  echo "MM_MARKETING_KEY_FILE=$ETC/marketing.key"
} > "$TMP"
chown root:"$USR" "$TMP"; chmod 640 "$TMP"; mv -f "$TMP" "$ETC/env"
umask 022
ok "écrit (root:$USR 640, jeton NocoDB non affiché)"

# ── 6. Unités systemd ───────────────────────────────────────────────────────────
etape "Unités systemd"
# Minuteries installées mais retirées du kit (ex. l'ancien bilan du vendredi) : désactivées.
for t in /etc/systemd/system/mm-agent-*.timer; do
  [ -e "$t" ] || continue
  [ -f "$ICI/systemd/$(basename "$t")" ] && continue
  systemctl disable --now "$(basename "$t")" >/dev/null 2>&1 || true; rm -f "$t"; ok "retirée : $(basename "$t")"
done
install -o root -g root -m 644 "$ICI/systemd/mm-agent@.service" "$ICI"/systemd/mm-agent-*.timer /etc/systemd/system/
systemctl daemon-reload
systemd-analyze verify /etc/systemd/system/mm-agent-*.timer 2>&1 | grep -v '^$' | sed 's/^/  · /' || true
TIMERS=$(cd "$ICI/systemd" && ls mm-agent-*.timer)
# shellcheck disable=SC2086
systemctl enable --now $TIMERS >/dev/null
ok "$(echo $TIMERS | wc -w | tr -d ' ') minuteries actives :"
systemctl list-timers 'mm-agent-*' --no-pager | sed 's/^/    /'

# ── 7. Essai à blanc ────────────────────────────────────────────────────────────
etape "Essai à blanc (aucun appel à claude, aucun Telegram)"
for t in $(cd "$ICI/systemd" && ls mm-agent-*.timer | sed 's/^mm-agent-//; s/\.timer$//'); do
  printf '    %-16s ' "$t"
  sudo -u "$USR" env MM_HOME="$MM_HOME" bash -c "set -a; . $ETC/env; set +a; $MM_HOME/bin/run-agent.sh $t --dry-run" 2>&1 | tail -n 1 | sed 's/^[0-9-]* [0-9:]*  //'
done

cat <<EOF

✅ Installé.
   Lancer à la main : sudo systemctl start mm-agent@lot-social.service   (article/lettre hors calendrier : @article-force)
   Suivre          : journalctl -u 'mm-agent@*' -f     ·  journaux : $LOGS/
   Couper          : sudo touch $MM_HOME/PAUSE         ·  reprendre : sudo rm $MM_HOME/PAUSE
EOF

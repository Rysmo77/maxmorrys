#!/usr/bin/env bash
# Lanceur des agents BMad autonomes (VPS). Une tâche = une mission = une session Claude neuve.
#
#   run-agent.sh <tâche>[-force] [--dry-run]
#
# Tâches : veille · lot-social · article · diffusion · relecture · lecons · rysmo-faq ·
#          revue-mensuelle · seo-mensuel · conformite · lettre · demandes · prospection ·
#          booster · revenus · bilan (manuel, sans minuterie)
# Le suffixe `-force` (ex. `mm-agent@article-force.service`) passe outre la porte de calendrier
# (article un jeudi sur deux, lettre à J-5) : pour un rattrapage à la main.
#
# Installé par install.sh dans /opt/mm-agents/bin/run-agent.sh (root, non modifiable par
# l'agent) et appelé par systemd (mm-agent@<tâche>.service) en tant que `maxmorrys`.
# Étapes : porte de calendrier → interrupteur → verrou → copie jetable remise à
# origin/<branche> + état partagé restauré → mission → `claude -p` borné (outils, tours,
# 45 min) → état et archive → Telegram.
#
# --dry-run : n'appelle ni git, ni claude, ni Telegram ; affiche ce qui serait fait.
#   Sur le Mac : MM_HOME=$PWD/ops/agents-autonomes MM_REPO_DIR=$PWD MM_LOG_DIR=/tmp/mm \
#     MM_STATE_DIR=/tmp/mm/etat bash ops/agents-autonomes/run-agent.sh lot-social --dry-run
#
# Secrets : jamais en argument, jamais dans le journal (voir lib.sh).
set -euo pipefail

TACHE="${1:-}"
MM_DRY_RUN=0
for a in "${@:2}"; do [ "$a" = --dry-run ] && MM_DRY_RUN=1; done
export MM_DRY_RUN
FORCE=0
case "$TACHE" in *-force) TACHE="${TACHE%-force}"; FORCE=1 ;; esac

# ── Environnement ────────────────────────────────────────────────────────────────
if [ -z "${NOCODB_TOKEN:-}" ] && [ -r /etc/mm-agents/env ]; then set -a; . /etc/mm-agents/env; set +a; fi
MM_HOME="${MM_HOME:-/opt/mm-agents}"
MM_REPO_DIR="${MM_REPO_DIR:-/home/maxmorrys/agents/maxmorrys.me}"
MM_BRANCH="${MM_BRANCH:-refonte/sous-domaines}"
MM_LOG_DIR="${MM_LOG_DIR:-/var/log/mm-agents}"
MM_OUT_DIR="${MM_OUT_DIR:-/home/maxmorrys/agents/sorties}"
MM_STATE_DIR="${MM_STATE_DIR:-/home/maxmorrys/agents/etat}"
MM_LOCK="${MM_LOCK:-/home/maxmorrys/agents/.mm-agents.lock}"
MM_TIMEOUT="${MM_TIMEOUT:-45m}"
export TZ=Africa/Dakar NOCODB_URL="${NOCODB_URL:-http://127.0.0.1:8091}"
B="$MM_HOME/bin"

# ── Table des tâches ─────────────────────────────────────────────────────────────
# AGENT (message de début) · TOURS · ÉCRITURE en plus de _bmad-output/growth · OUTILS en plus
# du socle · options : SILENCE_RAS (Telegram seulement s'il y a un problème), PAS_DE_DEBUT.
SILENCE_RAS=0; PAS_DE_DEBUT=0; ECRITURE=(); EXTRA=()
WEB=( "WebSearch" "WebFetch" )
SITE=( "WebFetch(domain:maxmorrys.me)" "WebFetch(domain:edu.maxmorrys.me)" "WebFetch(domain:club.maxmorrys.me)" )
# Décisions par boutons (decision.mjs, 04/11/2026) : poser une question fermée à Max, lire ses réponses.
DECIDER=( "Bash(node $B/mm-decision.mjs ask *)" "Bash(node $B/mm-decision.mjs liste *)" "Bash(node $B/mm-decision.mjs liste)" "Bash(node $B/mm-decision.mjs lire *)" )
MOTIFS=( "Bash(node $B/mm-decision.mjs liste *)" )
# Idées de posts (Fatou, 04/11/2026) : sources en lecture, dépôt en « proposé », cartes à Max.
IDEES=( "Bash(node scripts/growth/nocodb.mjs create idees-posts *)" "Bash(node $B/mm-idees.mjs *)"
        "Bash(node $B/mm-gsc.mjs requetes *)" "Bash(node $B/mm-meta-verif.mjs *)" "Bash(node $B/mm-firestore.mjs rysmo *)" "${DECIDER[@]}" )
DEPOT_POSTS=( "Bash(node scripts/growth/nocodb.mjs create contenus *)" "Bash(node scripts/growth/nayo.mjs brief *)"
              "Bash(node $B/qa-lot.mjs *)" "Bash($B/mm-rendu)" )
case "$TACHE" in
  veille)          AGENT="🔎 Thierry — veille et Flash du lundi"; TOURS=150; EXTRA=( "${DEPOT_POSTS[@]}" "${WEB[@]}" ) ;;
  lot-social)      AGENT="🗓 Mariam & Salimata — lot social";     TOURS=200; EXTRA=( "${DEPOT_POSTS[@]}" "${WEB[@]}" "${MOTIFS[@]}" "Bash(node $B/mm-idees.mjs *)" ) ;;
  article)         AGENT="🗞️ Rédaction — article de la quinzaine"; TOURS=250; ECRITURE=( "content/blog/**" )
                   EXTRA=( "${WEB[@]}" "Bash(node scripts/growth/blog-lint.mjs *)" "Bash(node scripts/growth/blog-publish.mjs content/blog/*)"
                           "Bash(node $B/mm-firestore.mjs blog *)" "Bash(node $B/mm-firestore.mjs blog)" "${DECIDER[@]}" ) ;;
  diffusion)       AGENT="🚀 Omar — indexation et diffusion des articles"; TOURS=120
                   EXTRA=( "${DEPOT_POSTS[@]}" "${SITE[@]}" "Bash(node $B/mm-gsc.mjs *)" "Bash(node $B/mm-firestore.mjs blog *)" "Bash(node $B/mm-firestore.mjs blog)" ) ;;
  relecture)       AGENT="🖋️ Béatrice — relecture des cartes"; TOURS=80; SILENCE_RAS=1; PAS_DE_DEBUT=1
                   EXTRA=( "Bash(node scripts/growth/nayo.mjs brief *)" ) ;;
  lecons)          AGENT="🎓 Adjoa — leçons en brouillon"; TOURS=200; ECRITURE=( "content/lecons/**" )
                   EXTRA=( "Bash(node $B/mm-firestore.mjs formations *)" "Bash(node $B/mm-firestore.mjs formations)" "${SITE[@]}" "${DECIDER[@]}" ) ;;
  rysmo-faq)       AGENT="🤗 Josiane — questions posées à Rysmo"; TOURS=80
                   EXTRA=( "Bash(node $B/mm-firestore.mjs rysmo *)" ) ;;
  revue-mensuelle) AGENT="🧭 Awa — revue du mois et plan"; TOURS=150
                   EXTRA=( "Bash(node $B/mm-meta-verif.mjs *)" "Bash(node $B/mm-firestore.mjs blog *)" "Bash(node $B/mm-firestore.mjs blog)" "${DECIDER[@]}" ) ;;
  seo-mensuel)     AGENT="🧩 Rokia — bilan Search Console"; TOURS=120
                   EXTRA=( "Bash(node $B/mm-gsc.mjs *)" "Bash(node $B/mm-firestore.mjs blog *)" "Bash(node $B/mm-firestore.mjs blog)" "${SITE[@]}" ) ;;
  conformite)      AGENT="⚖️ Ndèye — conformité des contenus du mois"; TOURS=120
                   EXTRA=( "Bash(node $B/mm-firestore.mjs blog *)" "Bash(node $B/mm-firestore.mjs blog)" "${SITE[@]}" ) ;;
  lettre)          AGENT="💌 Serge — lettre et épreuve"; TOURS=120
                   EXTRA=( "Bash(node $B/mm-lettre-epreuve.mjs *)" "Bash(node $B/mm-firestore.mjs blog *)" "Bash(node $B/mm-firestore.mjs blog)" "${SITE[@]}" ) ;;
  demandes)        AGENT="🤝 Ibrahima — demandes et relances"; TOURS=120; ECRITURE=( "_bmad-output/commercial/**" )
                   EXTRA=( "Bash(node $B/mm-firestore.mjs collection *)" "${DECIDER[@]}" ) ;;
  prospection)     AGENT="🤝 Ibrahima — prospection"; TOURS=150; ECRITURE=( "_bmad-output/commercial/**" ); EXTRA=( "${WEB[@]}" ) ;;
  booster)         AGENT="🎯 Koffi — post à booster"; TOURS=80; EXTRA=( "Bash(node $B/mm-meta-verif.mjs *)" "${DECIDER[@]}" ) ;;
  revenus)         AGENT="💹 Aboubacar — revenus du mois"; TOURS=120; EXTRA=( "Bash(node $B/mm-firestore.mjs collection *)" "${SITE[@]}" ) ;;
  idees)           AGENT="💡 Fatou — idées de posts de la semaine"; TOURS=150; EXTRA=( "${IDEES[@]}" "${WEB[@]}" ) ;;
  idees-mois)      AGENT="💡 Fatou — axes et temps forts du mois suivant"; TOURS=120; EXTRA=( "${IDEES[@]}" "${WEB[@]}" ) ;;
  bilan)           AGENT="📈 Yann — bilan de la semaine"; TOURS=80; EXTRA=( "Bash(node $B/mm-meta-verif.mjs *)" ) ;;
  *) echo "usage : run-agent.sh <veille|lot-social|article|diffusion|relecture|lecons|rysmo-faq|revue-mensuelle|seo-mensuel|conformite|lettre|demandes|prospection|booster|revenus|idees|idees-mois|bilan>[-force] [--dry-run]" >&2; exit 2 ;;
esac
TOURS="${MM_MAX_TURNS:-$TOURS}"
export MM_TACHE="$TACHE"   # lu par mm-firestore.mjs : chaque tâche n'ouvre que ses collections
# shellcheck source=lib.sh
. "$MM_HOME/lib.sh"

STAMP="$(date +%Y-%m-%d_%H%M)"
mkdir -p "$MM_LOG_DIR"
# `|| true` : sous `set -e`, une affectation dont la substitution échoue arrête le script
# (toutes les vraies exécutions mouraient ici sans un mot, le 04/11/2026).
LOG="$MM_LOG_DIR/${STAMP}-${TACHE}$([ "$MM_DRY_RUN" = 1 ] && echo -dry || true).log"
exec > >(tee -a "$LOG") 2>&1
log() { printf '%s  %s\n' "$(date '+%F %T')" "$*"; }
log "▶ tâche=$TACHE force=$FORCE branche=$MM_BRANCH dry-run=$MM_DRY_RUN utilisateur=$(id -un)"

if [ "$MM_DRY_RUN" = 0 ] && [ "$(id -un)" != maxmorrys ]; then
  log "✖ une vraie exécution tourne en tant que maxmorrys : sudo systemctl start mm-agent@${TACHE}.service"
  exit 2
fi

# ── Dates (Dakar = UTC+0), calculées ici et non laissées au modèle ───────────────
eval "$(node -e '
  const iso = (d) => d.toISOString().slice(0, 10);
  const plus = (d, n) => { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x; };
  const semaine = (d) => { const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); const j = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - j); const a = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((t - a) / 864e5 + 1) / 7); };
  const S = (d) => "S" + String(semaine(d)).padStart(2, "0");
  const now = new Date(), auj = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const lundi = plus(auj, -((auj.getUTCDay() + 6) % 7)), w2 = plus(lundi, 14);
  const m0 = new Date(Date.UTC(auj.getUTCFullYear(), auj.getUTCMonth(), 1)), mp = new Date(Date.UTC(auj.getUTCFullYear(), auj.getUTCMonth() - 1, 1));
  const v = {
    D_MAINTENANT: now.toISOString().slice(0, 16).replace("T", " "), D_AUJ: iso(auj),
    D_QUANTIEME: auj.getUTCDate(), D_JOUR: ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"][auj.getUTCDay()],
    D_SEM: S(auj), D_SEM_NUM: semaine(auj), D_LUNDI: iso(lundi), D_DIMANCHE: iso(plus(lundi, 6)),
    D_W1_LUNDI: iso(plus(lundi, 7)), D_W1_DIM: iso(plus(lundi, 13)),
    D_W2_LUNDI: iso(w2), D_W2_DIM: iso(plus(w2, 6)), D_W2_SEM: S(w2),
    D_MOIS: iso(m0).slice(0, 7), D_MOIS_PREC: iso(mp).slice(0, 7), D_MOIS_PREC_DEBUT: iso(mp), D_MOIS_PREC_FIN: iso(plus(m0, -1)),
    D_J5: iso(plus(auj, 5)), D_MOINS7: iso(plus(auj, -7)), D_MOINS21: iso(plus(auj, -21)), D_PLUS14: iso(plus(auj, 14)),
  };
  for (const [k, x] of Object.entries(v)) console.log(k + "=\x27" + String(x) + "\x27");')"

# ── 0. Porte de calendrier (silencieuse : un jour « sans » n'est pas un événement) ─
calendrier() { local f="$MM_REPO_DIR/ops/agents-autonomes/calendrier-lettres.txt"; [ -f "$f" ] || f="$MM_HOME/calendrier-lettres.txt"; echo "$f"; }
if [ "$FORCE" = 0 ]; then
  if [ "$TACHE" = article ] && [ $((D_SEM_NUM % 2)) = 1 ]; then
    log "⏭ $D_SEM est impaire : l'article se prépare les jeudis des semaines paires (pour le jeudi suivant)"; exit 0
  fi
  if [ "$TACHE" = lettre ] && ! grep -qx "$D_J5" "$(calendrier)" 2>/dev/null; then
    log "⏭ aucune lettre prévue le $D_J5 (J+5) dans $(calendrier)"; exit 0
  fi
fi

# ── 1. Interrupteur ──────────────────────────────────────────────────────────────
if [ -e "$MM_HOME/PAUSE" ]; then
  log "⏸ $MM_HOME/PAUSE présent : rien n'est lancé"
  [ "$SILENCE_RAS" = 1 ] || tg_send "⏸ Agents en pause ($MM_HOME/PAUSE) : « $TACHE » n'a pas tourné."
  exit 0
fi
if etat="$(cfg_get AGENTS_ENABLED)"; then
  case "$(printf '%s' "$etat" | tr '[:upper:]' '[:lower:]')" in
    false|0|non|off|no)
      log "⏸ Config AGENTS_ENABLED=$etat : rien n'est lancé"
      [ "$SILENCE_RAS" = 1 ] || tg_send "⏸ Agents coupés (Config AGENTS_ENABLED) : « $TACHE » n'a pas tourné."
      exit 0 ;;
  esac
  log "interrupteur : AGENTS_ENABLED=${etat:-(absent → actif)}"
else
  if [ "$MM_DRY_RUN" = 1 ]; then log "⚠ Config NocoDB injoignable ($NOCODB_URL) — ignoré en dry-run"
  else log "✖ Config NocoDB injoignable ($NOCODB_URL) : sans NocoDB l'agent ne peut rien faire"; exit 1; fi
fi

# ── 2. Verrou : un agent à la fois (la copie est partagée) ; on attend son tour ───
mkdir -p "$(dirname "$MM_LOCK")"
if ! command -v flock >/dev/null; then
  [ "$MM_DRY_RUN" = 1 ] || { log "✖ flock introuvable"; exit 1; }
  log "⚠ flock introuvable (Mac ?) — verrou ignoré en dry-run"
else
  exec 9>"$MM_LOCK"
  if ! flock -n 9; then
    log "⏳ un autre agent tourne : j'attends mon tour (90 min au plus)"
    flock -w 5400 9 || { log "⏭ verrou toujours pris après 90 min : passage abandonné"; tg_send "⏭ « $TACHE » abandonné : un autre agent occupait la place depuis 90 min."; exit 0; }
  fi
fi

# ── 3. Copie jetable remise à l'état du dépôt, puis état partagé restauré ─────────
# L'état (`$MM_STATE_DIR`) garde ce que les agents ont produit (plans, veille, bilans, lettres,
# articles, leçons) pour que la tâche suivante le lise. Le dépôt prime : `cp -n` n'écrase rien.
if [ "$MM_DRY_RUN" = 1 ]; then
  log "[dry-run] git fetch --depth 1 origin $MM_BRANCH && git reset --hard origin/$MM_BRANCH && git clean -fdq ; cp -Rn $MM_STATE_DIR/. copie/"
  [ -d "$MM_REPO_DIR/.git" ] && log "[dry-run] HEAD actuel : $(git -C "$MM_REPO_DIR" log -1 --format='%h %s' 2>/dev/null | cut -c1-90)"
else
  git -C "$MM_REPO_DIR" fetch -q --depth 1 origin "+refs/heads/${MM_BRANCH}:refs/remotes/origin/${MM_BRANCH}"
  git -C "$MM_REPO_DIR" reset -q --hard "origin/${MM_BRANCH}"
  git -C "$MM_REPO_DIR" clean -fdq
  [ -d "$MM_STATE_DIR" ] && cp -Rn "$MM_STATE_DIR/." "$MM_REPO_DIR/"
  log "copie à jour : $(git -C "$MM_REPO_DIR" log -1 --format='%h %s' | cut -c1-90)"
fi

# ── 4. Mission et contexte ───────────────────────────────────────────────────────
MISSION="$MM_REPO_DIR/ops/agents-autonomes/missions/${TACHE}.md"
[ -f "$MISSION" ] || MISSION="$MM_HOME/missions/${TACHE}.md"
[ -f "$MISSION" ] || { log "✖ mission introuvable : ${TACHE}.md"; exit 1; }
log "mission : $MISSION"

dispo() { [ -n "${1:-}" ] && [ -r "$1" ] && echo oui || echo "NON (voir README § Secrets)"; }
CONTEXTE="- Date et heure d'exécution (Dakar, UTC+0) : $D_MAINTENANT
- Aujourd'hui : $D_AUJ ($D_JOUR, semaine $D_SEM) · semaine en cours : $D_LUNDI → $D_DIMANCHE
- Semaine W+1 : $D_W1_LUNDI → $D_W1_DIM · semaine W+2 : $D_W2_SEM, $D_W2_LUNDI → $D_W2_DIM
- Mois en cours : $D_MOIS · mois écoulé : $D_MOIS_PREC ($D_MOIS_PREC_DEBUT → $D_MOIS_PREC_FIN)
- Quantième : $D_QUANTIEME$([ "$D_QUANTIEME" -le 7 ] && echo " → c'est la PREMIÈRE semaine du mois" || true)
- Il y a 7 jours : $D_MOINS7 · il y a 21 jours : $D_MOINS21 · dans 14 jours : $D_PLUS14 · J+5 : $D_J5
- Secrets disponibles : Firestore (compte de service) = $(dispo "${GOOGLE_APPLICATION_CREDENTIALS:-}") · Search Console = $(dispo "${MM_GSC_SA:-}") · clé marketing (épreuve de lettre) = $(dispo "${MM_MARKETING_KEY_FILE:-}")
- Outils maison : $B/ (mm-rendu, qa-lot.mjs, mm-firestore.mjs, mm-gsc.mjs, mm-meta-verif.mjs, mm-lettre-epreuve.mjs)"
[ "$FORCE" = 1 ] && CONTEXTE="$CONTEXTE
- Lancement forcé à la main (porte de calendrier ignorée)."
log "contexte :"; printf '%s\n' "$CONTEXTE" | sed 's/^/    /'

PROMPT_FILE="$(mktemp)"
trap 'rm -f "$PROMPT_FILE" "${SORTIE:-}"' EXIT
{
  echo "Tu travailles SEUL, sans humain joignable pendant la session : n'attends aucune réponse, ne pose aucune question."
  echo "Exécution automatique « $TACHE » lancée par $B/run-agent.sh depuis $MM_REPO_DIR."
  echo
  echo "## Contexte d'exécution (calculé par le lanceur, fait foi)"
  printf '%s\n' "$CONTEXTE"
  echo "- Lance chaque commande depuis la racine de la copie, sans « cd », sans enchaîner avec « && », « | » ou « ; »."
  echo "- Les fichiers que tu écris sont gardés d'un passage à l'autre (état partagé) et archivés."
  echo
  echo "## Garde-fous communs (priment sur tout)"
  echo "Jamais « validé », « en_publication » ni « publié ». Aucune publication, aucun envoi réel d'e-mail ou de WhatsApp, aucune dépense, aucun git push. Aucune lecture de la table Config ni d'un fichier de secrets ; aucun jeton affiché. Si un outil manque ou un secret est absent : fais ce qui reste possible et dis-le dans ton message final."
  echo
  cat "$MISSION"
} > "$PROMPT_FILE"

# ── 5. Outils permis (tout le reste est refusé : --permission-mode dontAsk) ────────
OUTILS=(
  "Read(./**)" "Glob" "Grep" "TodoWrite"
  "Edit(./_bmad-output/growth/**)" "Write(./_bmad-output/growth/**)"
  "Bash(node scripts/growth/nocodb.mjs tables)"
  "Bash(node scripts/growth/nocodb.mjs schema *)"
  "Bash(node scripts/growth/nocodb.mjs list *)"
  "Bash(node scripts/growth/nocodb.mjs get *)"
  "Bash(node scripts/growth/nocodb.mjs stats *)"
  "Bash(date)" "Bash(date *)"
)
for p in "${ECRITURE[@]+"${ECRITURE[@]}"}"; do OUTILS+=( "Edit(./$p)" "Write(./$p)" ); done
OUTILS+=( "${EXTRA[@]+"${EXTRA[@]}"}" )
INTERDITS=(
  "Bash(git *)" "Bash(curl *)" "Bash(wget *)" "Bash(rm *)" "Bash(ssh *)" "Bash(scp *)" "Bash(sudo *)"
  "Bash(node -e *)" "Bash(npm *)" "Bash(npx *)" "Bash(systemctl *)"
  "Bash(node scripts/growth/nocodb.mjs update *)" "Bash(node scripts/growth/blog-publish.mjs * --update *)"
  "Read(~/.claude/**)" "Read(~/.ssh/**)" "Read(//etc/**)" "Read(//root/**)" "Read(//opt/maxmorrys-stack/**)"
  "Agent" "Task"
)
[ "$TACHE" = article ] || INTERDITS+=( "Bash(node scripts/growth/blog-publish.mjs *)" )
CMD=( claude -p --output-format json --permission-mode dontAsk --setting-sources project
      --max-turns "$TOURS" --allowedTools "${OUTILS[@]}" --disallowedTools "${INTERDITS[@]}" )
[ -n "${MM_MODEL:-}" ] && CMD+=( --model "$MM_MODEL" )

DEBUT_TXT="$AGENT : je commence ($D_AUJ)."

if [ "$MM_DRY_RUN" = 1 ]; then
  log "[dry-run] commande : timeout -k 60 $MM_TIMEOUT ${CMD[*]} < prompt ($(wc -l < "$PROMPT_FILE" | tr -d ' ') lignes)"
  [ "$PAS_DE_DEBUT" = 1 ] || tg_send "$DEBUT_TXT"
  log "[dry-run] ✔ terminé — journal : $LOG"
  exit 0
fi

# ── 6. Exécution ─────────────────────────────────────────────────────────────────
[ "$PAS_DE_DEBUT" = 1 ] || tg_send "$DEBUT_TXT"
SORTIE="$(mktemp)"
T0=$(date +%s)
set +e
( cd "$MM_REPO_DIR" && timeout -k 60 "$MM_TIMEOUT" "${CMD[@]}" < "$PROMPT_FILE" > "$SORTIE" )
RC=$?
set -e
DUREE=$(( ($(date +%s) - T0) / 60 ))
cp "$SORTIE" "$MM_LOG_DIR/${STAMP}-${TACHE}.json" 2>/dev/null || true

champ() { node -e '
  const fs = require("fs"); let j = {};
  try { j = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); } catch {}
  const k = process.argv[2];
  if (k === "ok") process.stdout.write(String(j.is_error === false && j.subtype === "success"));
  else if (k === "info") process.stdout.write((j.subtype || "?") + ", " + (j.num_turns ?? "?") + " tours");
  else process.stdout.write(String(j.result || "").trim());' "$SORTIE" "$1"; }
OK="$(champ ok)"; INFO="$(champ info)"; TEXTE="$(champ texte)"
log "claude : code=$RC ($INFO), ${DUREE} min"
printf '%s\n' "$TEXTE" | sed 's/^/    > /'

# ── 7. État partagé et archive (la copie est nettoyée au prochain passage) ────────
DEST="$MM_OUT_DIR/${STAMP}-${TACHE}"
N=0
# --ignored : `_bmad-output/commercial/` (données de prospects) est ignoré par git mais doit être gardé.
while IFS= read -r f; do
  f="${f%/}"
  if [ -d "$MM_REPO_DIR/$f" ]; then
    mkdir -p "$DEST/$f" "$MM_STATE_DIR/$f"
    cp -R "$MM_REPO_DIR/$f/." "$DEST/$f/"; cp -R "$MM_REPO_DIR/$f/." "$MM_STATE_DIR/$f/"; N=$((N + 1)); continue
  fi
  [ -f "$MM_REPO_DIR/$f" ] || continue
  mkdir -p "$DEST/$(dirname "$f")" "$MM_STATE_DIR/$(dirname "$f")"
  cp "$MM_REPO_DIR/$f" "$DEST/$f"; cp "$MM_REPO_DIR/$f" "$MM_STATE_DIR/$f"; N=$((N + 1))
done < <(git -C "$MM_REPO_DIR" status --porcelain --untracked-files=all --ignored=matching -- _bmad-output content | sed 's/^...//')
[ "$N" -gt 0 ] && log "sorties : $N fichier(s) → $DEST (et état partagé $MM_STATE_DIR)"

# ── 8. Compte rendu ──────────────────────────────────────────────────────────────
if [ "$RC" = 124 ] || [ "$RC" = 137 ]; then
  tg_send "⚠️ « $TACHE » arrêté au bout de $MM_TIMEOUT (délai dépassé). Journal : $LOG"
  exit 1
elif [ "$RC" != 0 ] || [ "$OK" != true ]; then
  tg_send "⚠️ « $TACHE » terminé en échec (code $RC, $INFO, ${DUREE} min). Journal : $LOG${TEXTE:+

$TEXTE}"
  exit 1
fi
if [ "$SILENCE_RAS" = 1 ] && printf '%s' "$TEXTE" | head -n 1 | grep -q '^RAS'; then
  log "✔ RAS — aucun message envoyé"; exit 0
fi
tg_send "${TEXTE:-« $TACHE » terminé sans compte rendu.}

— ${DUREE} min, $INFO$([ "$N" -gt 0 ] && echo " · sorties : $DEST" || true)"
log "✔ terminé — journal : $LOG"

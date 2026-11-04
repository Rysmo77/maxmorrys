# shellcheck shell=bash
# Fonctions communes des agents autonomes (sourcé par run-agent.sh et mm-rendu).
#
# Règle d'or : AUCUN secret ne passe en argument de commande (visible dans `ps`) ni dans
# un journal. Les jetons voyagent par descripteur (`-H @<(…)`, `--config <(…)`) ou stdin.
#
# Attend dans l'environnement : NOCODB_URL, NOCODB_TOKEN (fichier /etc/mm-agents/env).

MM_CONFIG_TABLE='mo6ubcgxi9x4u7d'   # NocoDB « Config » (Cle / Valeur), secrets en clair

# cfg_get CLE → écrit la Valeur sur stdout (vide si la clé n'existe pas).
# Code retour : 0 = lu (même vide), 2 = NocoDB injoignable ou réponse illisible.
cfg_get() {
  local cle="$1" body
  [ -n "${NOCODB_URL:-}" ] && [ -n "${NOCODB_TOKEN:-}" ] || return 2
  body=$(curl -sS -m 20 -G "${NOCODB_URL%/}/api/v2/tables/${MM_CONFIG_TABLE}/records" \
    --data-urlencode "where=(Cle,eq,${cle})" --data-urlencode 'fields=Cle,Valeur' --data-urlencode 'limit=1' \
    -H @<(printf 'xc-token: %s\n' "$NOCODB_TOKEN") 2>/dev/null) || return 2
  printf '%s' "$body" | node -e '
    let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => {
      try {
        const j = JSON.parse(s);
        if (!Array.isArray(j.list)) process.exit(2);
        const v = j.list[0] ? j.list[0].Valeur : "";
        process.stdout.write(v == null ? "" : String(v).trim());
      } catch { process.exit(2); }
    });' || return 2
}

# tg_send "texte" → envoie un message Telegram en texte brut (pas de parse_mode : rien à échapper).
# Le jeton et le chat sont lus dans Config, jamais affichés. Ne fait jamais échouer l'appelant.
tg_send() {
  local texte="$1" token chat code
  if [ "${MM_DRY_RUN:-0}" = 1 ]; then printf '[dry-run] Telegram ← %s\n' "$texte" | head -c 4000; echo; return 0; fi
  token=$(cfg_get TELEGRAM_BOT_TOKEN) || { echo "telegram : Config illisible" >&2; return 0; }
  chat=$(cfg_get TELEGRAM_CHAT_ID) || { echo "telegram : Config illisible" >&2; return 0; }
  if [ -z "$token" ] || [ -z "$chat" ]; then echo "telegram : TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID absents de Config" >&2; return 0; fi
  code=$(MM_TG_CHAT="$chat" MM_TG_TEXT="$texte" node -e '
      const t = process.env.MM_TG_TEXT;
      process.stdout.write(JSON.stringify({ chat_id: process.env.MM_TG_CHAT, text: t.length > 4000 ? t.slice(0, 3990) + "\n…" : t, disable_web_page_preview: true }));' |
    curl -sS -m 20 -o /dev/null -w '%{http_code}' \
      --config <(printf 'url = "https://api.telegram.org/bot%s/sendMessage"\n' "$token") \
      -H 'Content-Type: application/json' --data-binary @- 2>/dev/null) || code='000'
  [ "$code" = 200 ] || echo "telegram : HTTP $code" >&2
  return 0
}

#!/usr/bin/env python3
"""
Pull Google Search Console -> table NocoDB `SEO` (mysghf7takowmb1, base Max-Morrys).
Migré d'Airtable vers NocoDB le 29/10/2026 (Airtable n'est plus écrit).

Exécution prévue : cron root sur le VPS, 07:15 Africa/Dakar
  GSC_SA_FILE=/opt/maxmorrys-stack/gsc-sa.json NOCODB_URL=http://127.0.0.1:8091 \
  NOCODB_TOKEN_FILE=/opt/maxmorrys-stack/.nocodb-api-token python3 /opt/maxmorrys-stack/gsc-pull.py
En local (Mac) : lit NOCODB_URL / NOCODB_TOKEN dans .env.local.
La clé de compte de service ne quitte jamais le disque (fichier 600, gitignoré). Aucune clé en base.
Idempotent : si des lignes existent déjà pour la date du jour, rien n'est écrit (sauf --force,
qui les remplace).
"""
import json, base64, time, subprocess, os, tempfile, urllib.request, urllib.parse, datetime, sys, re

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SA_FILE = os.environ.get("GSC_SA_FILE", os.path.join(REPO, "max-morrys-28f5d199939f.json"))
SITE = os.environ.get("GSC_SITE_URL", "sc-domain:maxmorrys.me")
NOCODB_SEO_TABLE = os.environ.get("NOCODB_SEO_TABLE", "mysghf7takowmb1")

def env_from_local(key):
    """Lit une clé depuis .env.local (sans la logger)."""
    p = os.path.join(REPO, ".env.local")
    if os.path.exists(p):
        for line in open(p):
            m = re.match(r'^(?:export\s+)?' + re.escape(key) + r'="?([^"\n]+)"?', line)
            if m:
                return m.group(1)
    return os.environ.get(key)

NOCODB_URL = (os.environ.get("NOCODB_URL") or env_from_local("NOCODB_URL") or "https://noco.maxmorrys.me").rstrip("/")

def nocodb_token():
    f = os.environ.get("NOCODB_TOKEN_FILE")
    if f and os.path.exists(f):
        return open(f).read().strip()
    return os.environ.get("NOCODB_TOKEN") or env_from_local("NOCODB_TOKEN")

def b64u(b):
    if isinstance(b, str): b = b.encode()
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()

def gsc_token(sa):
    now = int(time.time())
    si = (b64u(json.dumps({"alg": "RS256", "typ": "JWT"})) + "." + b64u(json.dumps({
        "iss": sa["client_email"], "scope": "https://www.googleapis.com/auth/webmasters.readonly",
        "aud": sa["token_uri"], "iat": now, "exp": now + 3600}))).encode()
    with tempfile.NamedTemporaryFile("w", suffix=".pem", delete=False) as f:
        f.write(sa["private_key"]); kf = f.name
    os.chmod(kf, 0o600)
    try:
        sig = subprocess.run(["openssl", "dgst", "-sha256", "-sign", kf], input=si, capture_output=True).stdout
    finally:
        os.remove(kf)
    jwt = si.decode() + "." + b64u(sig)
    data = urllib.parse.urlencode({"grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", "assertion": jwt}).encode()
    return json.load(urllib.request.urlopen(urllib.request.Request(sa["token_uri"], data=data)))["access_token"]

def query(tok, dims, limit=10):
    end = datetime.date.today() - datetime.timedelta(days=2)
    start = end - datetime.timedelta(days=28)
    body = json.dumps({"startDate": str(start), "endDate": str(end), "dimensions": dims, "rowLimit": limit}).encode()
    url = f"https://searchconsole.googleapis.com/webmasters/v3/sites/{urllib.parse.quote(SITE, safe='')}/searchAnalytics/query"
    req = urllib.request.Request(url, data=body, headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req)).get("rows", [])

def nocodb(method, path, token, body=None):
    req = urllib.request.Request(NOCODB_URL + path, method=method,
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={"xc-token": token, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        t = r.read()
        return json.loads(t) if t else None

def nocodb_ids_for_date(token, day):
    where = urllib.parse.quote(f"(Date,eq,exactDate,{day})")
    res = nocodb("GET", f"/api/v2/tables/{NOCODB_SEO_TABLE}/records?where={where}&fields=Id&limit=1000", token)
    return [r["Id"] for r in (res or {}).get("list", [])]

def nocodb_create(token, records):
    for i in range(0, len(records), 50):
        nocodb("POST", f"/api/v2/tables/{NOCODB_SEO_TABLE}/records", token, records[i:i+50])

def main():
    sa = json.load(open(SA_FILE))
    tok = gsc_token(sa)
    today = str(datetime.date.today())
    recs = []
    for r in query(tok, ["query"], 12):
        recs.append({"Date": today, "Type": "query", "Dimension": r["keys"][0],
            "Clicks": int(r["clicks"]), "Impressions": int(r["impressions"]),
            "CTR": round(r["ctr"], 4), "Position": round(r["position"], 1)})
    for r in query(tok, ["page"], 12):
        recs.append({"Date": today, "Type": "page", "Dimension": r["keys"][0],
            "Clicks": int(r["clicks"]), "Impressions": int(r["impressions"]),
            "CTR": round(r["ctr"], 4), "Position": round(r["position"], 1)})
    tot = query(tok, [], 1)
    if tot:
        t = tot[0]
        recs.append({"Date": today, "Type": "total", "Dimension": "TOTAL 28j",
            "Clicks": int(t["clicks"]), "Impressions": int(t["impressions"]),
            "CTR": round(t["ctr"], 4), "Position": round(t["position"], 1),
            "Notes": f"site={SITE}"})
    token = nocodb_token()
    if not token:
        sys.exit("GSC pull ERREUR: jeton NocoDB introuvable (NOCODB_TOKEN_FILE / NOCODB_TOKEN)")
    existing = nocodb_ids_for_date(token, today)
    if existing and "--force" not in sys.argv:
        print(f"GSC pull: {len(existing)} lignes déjà présentes pour {today}, rien écrit (--force pour remplacer)")
        return
    if existing:
        for i in range(0, len(existing), 100):
            nocodb("DELETE", f"/api/v2/tables/{NOCODB_SEO_TABLE}/records", token, [{"Id": x} for x in existing[i:i+100]])
    if recs:
        nocodb_create(token, recs)
    print(f"GSC pull OK: {len(recs)} lignes écrites dans NocoDB SEO (date {today})")

if __name__ == "__main__":
    main()

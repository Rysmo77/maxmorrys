#!/usr/bin/env python3
"""
Pull Google Search Console -> table Airtable SEO.
La clé service account reste LOCALE (fichier gitignoré). Aucune clé en base.
Planifié via launchd (com.maxmorrys.gsc-pull). Lecture par l'agent SEO Analytics + digest Telegram.
"""
import json, base64, time, subprocess, os, tempfile, urllib.request, urllib.parse, datetime, sys, re

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SA_FILE = os.environ.get("GSC_SA_FILE", os.path.join(REPO, "max-morrys-28f5d199939f.json"))
SITE = os.environ.get("GSC_SITE_URL", "sc-domain:maxmorrys.me")
AIRTABLE_BASE = "apppkEbepilHCYiso"
AIRTABLE_SEO = "tblhLk66jOUsEhi7G"

def env_from_local(key):
    """Lit une clé depuis .env.local (sans la logger)."""
    p = os.path.join(REPO, ".env.local")
    if os.path.exists(p):
        for line in open(p):
            m = re.match(r'^(?:export\s+)?' + re.escape(key) + r'="?([^"\n]+)"?', line)
            if m:
                return m.group(1)
    return os.environ.get(key)

PAT = env_from_local("AIRTABLE_PAT")

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

def airtable_create(records):
    for i in range(0, len(records), 10):
        body = json.dumps({"records": records[i:i+10], "typecast": True}).encode()
        req = urllib.request.Request(f"https://api.airtable.com/v0/{AIRTABLE_BASE}/{AIRTABLE_SEO}",
                                     data=body, headers={"Authorization": "Bearer " + PAT, "Content-Type": "application/json"})
        urllib.request.urlopen(req)

def main():
    sa = json.load(open(SA_FILE))
    tok = gsc_token(sa)
    today = str(datetime.date.today())
    recs = []
    for r in query(tok, ["query"], 12):
        recs.append({"fields": {"Date": today, "Type": "query", "Dimension": r["keys"][0],
            "Clicks": int(r["clicks"]), "Impressions": int(r["impressions"]),
            "CTR": round(r["ctr"], 4), "Position": round(r["position"], 1)}})
    for r in query(tok, ["page"], 12):
        recs.append({"fields": {"Date": today, "Type": "page", "Dimension": r["keys"][0],
            "Clicks": int(r["clicks"]), "Impressions": int(r["impressions"]),
            "CTR": round(r["ctr"], 4), "Position": round(r["position"], 1)}})
    tot = query(tok, [], 1)
    if tot:
        t = tot[0]
        recs.append({"fields": {"Date": today, "Type": "total", "Dimension": "TOTAL 28j",
            "Clicks": int(t["clicks"]), "Impressions": int(t["impressions"]),
            "CTR": round(t["ctr"], 4), "Position": round(t["position"], 1),
            "Notes": f"site={SITE}"}})
    if PAT and recs:
        airtable_create(recs)
    print(f"GSC pull OK: {len(recs)} lignes écrites (date {today})")

if __name__ == "__main__":
    main()

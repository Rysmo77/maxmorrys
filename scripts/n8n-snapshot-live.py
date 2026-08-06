#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fige les workflows n8n de PRODUCTION dans `n8n/live/`, pour servir de base aux patchs.

Pourquoi : les patchs de la stratégie ont d'abord été construits sur
`backups/n8n-cutover-20260709/` — des exports antérieurs à la **migration Airtable → NocoDB du
2026-08-06**. Les réappliquer aurait ramené quatre workflows sur Airtable, c'est-à-dire sur la
copie gelée qui ne sert plus que de rollback. On repart donc du live, et on le versionne pour que
la génération reste reproductible et relisible.

    python3 scripts/n8n-snapshot-live.py

Lit `N8N_URL` et `N8N_API_KEY` depuis `.env.local`. **Lecture seule** — n'écrit jamais sur n8n.
"""
import json
import os
import sys
import urllib.request

OUT = os.path.join("n8n", "live")

# Les workflows dont la stratégie a besoin. Les autres ne sont pas figés : moins on en fige,
# moins on risque de réimporter par erreur quelque chose qu'on n'a pas relu.
WANTED = [
    "WF-TG-ROUTER", "WF-THEMES", "WF-SOCIAL-03", "WF-SOCIAL-04",
]

# Métadonnées serveur : inutiles à l'import, et bruyantes dans un diff.
SERVER_META = [
    "activeVersion", "activeVersionId", "versionId", "versionCounter", "shared",
    "triggerCount", "createdAt", "updatedAt", "isArchived", "sourceWorkflowId",
    "meta", "pinData", "staticData",
]


def load_env(path=".env.local") -> dict:
    env = {}
    if not os.path.exists(path):
        return env
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def main() -> int:
    env = load_env()
    url = env.get("N8N_URL") or os.environ.get("N8N_URL")
    key = env.get("N8N_API_KEY") or os.environ.get("N8N_API_KEY")
    if not url or not key:
        print("N8N_URL / N8N_API_KEY absents de .env.local", file=sys.stderr)
        return 1

    req = urllib.request.Request(
        f"{url.rstrip('/')}/api/v1/workflows?limit=200", headers={"X-N8N-API-KEY": key}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = json.load(resp)
    workflows = payload.get("data", payload if isinstance(payload, list) else [])

    os.makedirs(OUT, exist_ok=True)
    failures = []
    for prefix in WANTED:
        cands = [w for w in workflows if w["name"].startswith(prefix)]
        if not cands:
            failures.append(f"{prefix} : introuvable sur l'instance")
            continue
        # Plusieurs workflows partagent le même nom (copies inactives). L'actif fait foi :
        # c'est lui qui tourne, et les copies inactives divergent (vu sur WF-SOCIAL-04).
        actifs = [w for w in cands if w.get("active")]
        if len(actifs) > 1:
            failures.append(f"{prefix} : {len(actifs)} workflows ACTIFS portent ce nom — lequel ?")
            continue
        wf = actifs[0] if actifs else cands[0]
        if not actifs:
            failures.append(f"{prefix} : aucun workflow actif ({len(cands)} inactif(s)) — non figé")
            continue

        for k in SERVER_META:
            wf.pop(k, None)

        noco = sum(1 for n in wf["nodes"] if n["type"].endswith("nocoDb"))
        air = sum(1 for n in wf["nodes"] if "airtable" in n["type"].lower())
        path = os.path.join(OUT, f"{prefix}.json")
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(wf, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        flag = "  ⚠️ NŒUDS AIRTABLE RESTANTS" if air else ""
        print(f"  ✓ {prefix:16} {len(wf['nodes']):>3} nœuds  (NocoDB {noco}, Airtable {air}){flag}")

    if failures:
        print("\n⚠️  ÉCHECS :", file=sys.stderr)
        for f in failures:
            print(f"   - {f}", file=sys.stderr)
        return 1
    print(f"\n✓ Base live figée dans {OUT}/ — c'est elle que patche n8n-patch-strategy-2026.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())

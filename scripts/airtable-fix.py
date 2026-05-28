#!/usr/bin/env python3
"""
Applique les corrections Airtable identifiées par l'audit :
1. Met à jour Config.GEMINI_MODEL_IMAGE (modèle cassé)
2. Renomme les champs dépréciés avec préfixe _DEPRECATED_

Usage:
    set -a && source .env.local && set +a
    python3 scripts/airtable-fix.py [--dry-run]
"""
import json
import os
import sys
import argparse
import urllib.request
import urllib.error

BASE_ID = 'apppkEbepilHCYiso'
CONTENUS_TABLE = 'tblPYoyzcZLdtBTO3'
CONFIG_TABLE = 'tblQqVRtboYFSGNt8'

DEPRECATED_RENAMES = {
    # field_id → new_name
    'fldY0QNeNGLQ0R6ff': '_DEPRECATED_Blotato_PostSubmissionIDs',  # Blotato_PostSubmissionIDs
    'fld8UCKvVYxYo5J2e': '_DEPRECATED_Blotato_PublicUrls',         # Blotato_PublicUrls
}


def at_request(method, path, pat, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        f"https://api.airtable.com/v0/{path}",
        data=data, method=method,
        headers={
            'Authorization': f'Bearer {pat}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try: body = json.loads(e.read())
        except: body = {'raw': e.read().decode()[:300]}
        return e.code, body


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    pat = os.environ.get('AIRTABLE_PAT')
    if not pat:
        print("ERROR: AIRTABLE_PAT not set")
        sys.exit(1)

    # 1. Trouver le record GEMINI_MODEL_IMAGE et le mettre à jour
    print("[1/2] Update Config.GEMINI_MODEL_IMAGE → gemini-2.5-flash-image-preview")
    status, recs = at_request('GET', f"{BASE_ID}/{CONFIG_TABLE}?filterByFormula=%7BCle%7D%3D%27GEMINI_MODEL_IMAGE%27", pat)
    if status != 200 or not recs.get('records'):
        print(f"  ERROR {status}: {recs}")
    else:
        rec = recs['records'][0]
        cur = rec['fields'].get('Valeur', '')
        print(f"  current: '{cur}'")
        if cur == 'gemini-2.5-flash-image-preview':
            print("  already correct, skipping")
        elif args.dry_run:
            print(f"  DRY-RUN would PATCH record {rec['id']}")
        else:
            status2, resp = at_request('PATCH', f"{BASE_ID}/{CONFIG_TABLE}/{rec['id']}", pat,
                                       body={'fields': {'Valeur': 'gemini-2.5-flash-image-preview'}})
            if status2 == 200:
                print(f"  ✓ updated record {rec['id']}")
            else:
                print(f"  FAILED {status2}: {resp}")

    # 2. Renommer les champs dépréciés
    print("\n[2/2] Renommer les champs dépréciés (préfixe _DEPRECATED_)")
    for field_id, new_name in DEPRECATED_RENAMES.items():
        if args.dry_run:
            print(f"  DRY-RUN PATCH field {field_id} → '{new_name}'")
            continue
        status, resp = at_request('PATCH', f"meta/bases/{BASE_ID}/tables/{CONTENUS_TABLE}/fields/{field_id}", pat,
                                  body={'name': new_name})
        if status == 200:
            print(f"  ✓ {field_id} → '{new_name}'")
        else:
            print(f"  FAILED {field_id} ({status}): {resp}")


if __name__ == '__main__':
    main()

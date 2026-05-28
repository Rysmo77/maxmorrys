#!/usr/bin/env python3
"""
Convertit les colonnes texte en singleSelect avec options seedées depuis les valeurs existantes
+ ajout des statuts canoniques attendus par les workflows.

Conservateur : on inclut TOUTES les valeurs existantes pour ne rien casser.

Usage:
    set -a && source .env.local && set +a
    python3 scripts/airtable-singleselect.py [--dry-run]
"""
import json
import os
import sys
import argparse
import urllib.request
import urllib.error

BASE_ID = 'apppkEbepilHCYiso'

# table_id -> [{field_name, additional_options}]
# Existing values get included automatically; additional_options seed the canonical set.
CONVERSIONS = [
    {
        'table_name': 'Banque Idees Articles',
        'table_id': 'tblA8gHrbE78CfukY',
        'fields': [
            {'name': 'Status', 'additional': ['nouveau', 'produit_draft', 'publié', 'rejeté', 'erreur', 'en_production']},
        ],
    },
    {
        'table_name': 'Banque Idees Cours',
        'table_id': 'tblcn2MyeFR9IekHX',
        'fields': [
            {'name': 'Status', 'additional': ['nouveau', 'erreur', 'en_production', 'publié', 'rejeté']},
        ],
    },
    {
        'table_name': 'Medias Generes',
        'table_id': 'tbleUm1UoP9qqOdOn',
        'fields': [
            {'name': 'Status', 'additional': ['uploaded', 'uploaded_r2', 'erreur', 'en_cours']},
            {'name': 'Type', 'additional': ['social_post', 'article', 'carousel', 'reel', 'lesson', 'newsletter', 'course_cover', 'formation', 'misc']},
        ],
    },
]

# Color palette to rotate over options
COLORS = ['blueLight2', 'greenLight2', 'yellowLight2', 'orangeLight2', 'redLight2',
          'purpleLight2', 'pinkLight2', 'grayLight2', 'cyanLight2', 'tealLight2']


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


def collect_existing_values(pat, table_id, field_name):
    """Pull all records and collect distinct values for a field."""
    vals = set()
    offset = None
    while True:
        path = f"{BASE_ID}/{table_id}?pageSize=100&fields%5B%5D={field_name}"
        if offset: path += f"&offset={offset}"
        status, recs = at_request('GET', path, pat)
        if status != 200: return vals
        for r in recs.get('records', []):
            v = r.get('fields', {}).get(field_name)
            if isinstance(v, str) and v.strip(): vals.add(v)
        offset = recs.get('offset')
        if not offset: break
    return vals


def fetch_field_info(pat, table_id, field_name):
    status, schema = at_request('GET', f"meta/bases/{BASE_ID}/tables", pat)
    if status != 200: return None, None
    for t in schema['tables']:
        if t['id'] != table_id: continue
        for f in t['fields']:
            if f['name'] == field_name: return f['id'], f['type']
    return None, None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    pat = os.environ.get('AIRTABLE_PAT')
    if not pat:
        print("ERROR: AIRTABLE_PAT not set")
        sys.exit(1)

    for entry in CONVERSIONS:
        print(f"\n=== {entry['table_name']} ===")
        for fld in entry['fields']:
            field_id, cur_type = fetch_field_info(pat, entry['table_id'], fld['name'])
            if not field_id:
                print(f"  ✗ field '{fld['name']}' not found")
                continue
            if cur_type == 'singleSelect':
                print(f"  ✓ {fld['name']} already singleSelect, skipping")
                continue
            existing = collect_existing_values(pat, entry['table_id'], fld['name'])
            all_opts = sorted(set(fld['additional']) | existing)
            print(f"  {fld['name']} [{cur_type}] → singleSelect ({len(all_opts)} options)")
            print(f"    existing in data: {sorted(existing)}")
            print(f"    final options: {all_opts}")
            choices = [{'name': o, 'color': COLORS[i % len(COLORS)]} for i, o in enumerate(all_opts)]
            if args.dry_run:
                print(f"    DRY-RUN (no PATCH)")
                continue
            status, resp = at_request('PATCH',
                f"meta/bases/{BASE_ID}/tables/{entry['table_id']}/fields/{field_id}",
                pat,
                body={'type': 'singleSelect', 'options': {'choices': choices}})
            if status == 200:
                print(f"    ✓ converted")
            else:
                print(f"    FAILED {status}: {resp}")


if __name__ == '__main__':
    main()

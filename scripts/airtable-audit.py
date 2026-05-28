#!/usr/bin/env python3
"""
Audit Airtable base Max-Morrys PB (apppkEbepilHCYiso) — snapshot schéma,
échantillonne les rows, repère options dropdown manquantes vs. les valeurs réelles.

Usage:
    set -a && source .env.local && set +a   # exporte AIRTABLE_PAT
    python3 scripts/airtable-audit.py
"""
import json
import os
import sys
import urllib.request
import urllib.error
from collections import defaultdict

BASE_ID = 'apppkEbepilHCYiso'
AUDIT_DIR = 'backups/airtable-audit-20260520'

# Expected enum values (from BLOTATO_INTEGRATION.md + workflow code)
EXPECTED = {
    'Contenus': {
        'Reseau': ['fb', 'ig', 'tiktok', 'youtube', 'linkedin', 'x'],
        'Format_Post': ['post', 'story', 'thread', 'reel', 'carrousel', 'short', 'community_post', 'live'],
        'Status': ['idée', 'planifié', 'rédigé', 'image_needed', 'prêt_à_valider',
                   'validé', 'en_publication', 'publié', 'échec'],
    }
}

# Champs dépréciés (à marquer _DEPRECATED_)
DEPRECATED_FIELDS = {
    'Contenus': [
        'Reseaux_Cibles', 'Plateforme_Principale',
        'Texte_Facebook', 'Texte_Instagram', 'Texte_LinkedIn',
        'Texte_X', 'Texte_TikTok', 'Texte_YouTube',
        'Blotato_PostSubmissionIDs', 'Blotato_PublicUrls',
    ]
}


def at_get(path, pat):
    req = urllib.request.Request(
        f"https://api.airtable.com/v0/{path}",
        headers={'Authorization': f'Bearer {pat}', 'Accept': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


def fetch_schema(pat):
    return at_get(f"meta/bases/{BASE_ID}/tables", pat)


def fetch_records(pat, table_id, limit=100):
    return at_get(f"{BASE_ID}/{table_id}?pageSize={limit}", pat)


def main():
    pat = os.environ.get('AIRTABLE_PAT')
    if not pat:
        print("ERROR: AIRTABLE_PAT not set. Add to .env.local and `set -a && source .env.local && set +a`.")
        sys.exit(1)

    os.makedirs(AUDIT_DIR, exist_ok=True)

    print(f"[1/3] Fetching schema for base {BASE_ID}...")
    status, schema = fetch_schema(pat)
    if status != 200:
        print(f"  ERROR {status}: {schema}")
        sys.exit(1)
    json.dump(schema, open(f"{AUDIT_DIR}/schema.json", 'w'), indent=2, ensure_ascii=False)
    print(f"  ✓ {len(schema['tables'])} tables saved → {AUDIT_DIR}/schema.json")

    # Build a lookup: table_name -> {field_name -> field_def}
    tables = {t['name']: t for t in schema['tables']}

    findings = {'mismatches': [], 'deprecated': [], 'tables': {}}

    for tname, tbl in tables.items():
        print(f"\n[2/3] Table '{tname}' (id={tbl['id']}, {len(tbl['fields'])} fields)")
        findings['tables'][tname] = {'id': tbl['id'], 'fields': []}
        for f in tbl['fields']:
            ftype = f['type']
            choices = []
            if ftype in ('singleSelect', 'multipleSelects'):
                choices = [o['name'] for o in f.get('options', {}).get('choices', [])]
            findings['tables'][tname]['fields'].append({
                'id': f['id'], 'name': f['name'], 'type': ftype, 'choices': choices
            })
            print(f"  • {f['name']:35} [{ftype}] {choices if choices else ''}")

            # Check expected enum coverage
            if tname in EXPECTED and f['name'] in EXPECTED[tname]:
                missing = set(EXPECTED[tname][f['name']]) - set(choices)
                extra = set(choices) - set(EXPECTED[tname][f['name']])
                if missing or extra:
                    findings['mismatches'].append({
                        'table': tname, 'field': f['name'], 'type': ftype,
                        'expected': EXPECTED[tname][f['name']],
                        'actual': choices,
                        'missing': sorted(missing),
                        'extra': sorted(extra),
                    })

            # Deprecated fields
            if tname in DEPRECATED_FIELDS and f['name'] in DEPRECATED_FIELDS[tname]:
                findings['deprecated'].append({
                    'table': tname, 'field': f['name'], 'field_id': f['id'], 'type': ftype
                })

    # Sample rows for Contenus to find orphan values
    if 'Contenus' in tables:
        print("\n[3/3] Sampling Contenus rows (last 100)...")
        status, recs = fetch_records(pat, tables['Contenus']['id'], limit=100)
        if status == 200:
            json.dump(recs, open(f"{AUDIT_DIR}/contenus-sample.json", 'w'), indent=2, ensure_ascii=False)
            actual_values = defaultdict(set)
            for r in recs.get('records', []):
                for fname, val in r.get('fields', {}).items():
                    if isinstance(val, str): actual_values[fname].add(val)
                    elif isinstance(val, list):
                        for v in val:
                            if isinstance(v, str): actual_values[fname].add(v)
            # Check orphans for enum-targeted fields
            for fname, expected in EXPECTED.get('Contenus', {}).items():
                actual = actual_values.get(fname, set())
                orphans = actual - set(expected)
                if orphans:
                    findings.setdefault('orphans', []).append({
                        'table': 'Contenus', 'field': fname, 'orphans': sorted(orphans)
                    })

    json.dump(findings, open(f"{AUDIT_DIR}/findings.json", 'w'), indent=2, ensure_ascii=False)

    # Print summary
    print("\n" + "="*70)
    print("AUDIT SUMMARY")
    print("="*70)
    if findings.get('mismatches'):
        print(f"\n⚠ Enum mismatches ({len(findings['mismatches'])}) :")
        for m in findings['mismatches']:
            print(f"  - {m['table']}.{m['field']}:")
            if m['missing']: print(f"      manquants: {m['missing']}")
            if m['extra']:   print(f"      en trop:   {m['extra']}")
    if findings.get('orphans'):
        print(f"\n⚠ Valeurs orphelines dans données ({len(findings['orphans'])}) :")
        for o in findings['orphans']:
            print(f"  - {o['table']}.{o['field']}: {o['orphans']}")
    if findings.get('deprecated'):
        print(f"\n⚠ Champs dépréciés présents ({len(findings['deprecated'])}) :")
        for d in findings['deprecated']:
            print(f"  - {d['table']}.{d['field']} (id={d['field_id']}, type={d['type']})")
    print(f"\n✓ Snapshot complet → {AUDIT_DIR}/")


if __name__ == '__main__':
    main()

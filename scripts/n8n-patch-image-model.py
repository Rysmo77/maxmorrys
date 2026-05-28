#!/usr/bin/env python3
"""
Phase 6 — Switch image model to gemini-3.1-flash-image-preview + auto-validation Status.

Targets:
  - WF-SOCIAL-04 (774G38cqIvZsJUHm) :
      * HTTP node URL : gemini-2.5-flash-image-preview → gemini-3.1-flash-image-preview
      * Renommer HTTP node : "HTTP — Gemini 2.5 Flash Image" → "HTTP — Gemini 3.1 Flash Image"
      * Ajouter node "Airtable — Lire VALIDATION_MODE" connecté à Cron
      * Modifier Code "Collect — URLs par contenu" pour lire VALIDATION_MODE et set Status dynamique

  - WF-08 (OQMIBhbc7Y9OFQzL) IMG4 : déjà gemini-3.1-flash-image-preview → skip
  - WF-14 (sai5IKLQIVRJhhCg) IMG4 : déjà gemini-3.1-flash-image-preview → skip

  - Airtable Config : GEMINI_MODEL_IMAGE → gemini-3.1-flash-image-preview

Usage:
    set -a && source .env.local && set +a
    python3 scripts/n8n-patch-image-model.py [--dry-run]
"""
import json
import os
import sys
import copy
import uuid
import argparse
import urllib.request
import urllib.error

ALLOWED_FIELDS = {'name', 'nodes', 'connections', 'settings', 'staticData'}
ALLOWED_SETTINGS = {'saveExecutionProgress', 'saveManualExecutions',
                    'saveDataErrorExecution', 'saveDataSuccessExecution',
                    'executionTimeout', 'errorWorkflow', 'timezone', 'executionOrder'}

VALIDATION_MODE_NODE_NAME = 'Airtable — Lire VALIDATION_MODE'

NEW_COLLECT_CODE = """// runOnceForAllItems — groupe par id, collecte les URLs, émet 1 item par contenu
// Status auto/manual selon Config.VALIDATION_MODE (auto → validé, manual → prêt_à_valider)
const items = $input.all().map(i => i.json);
let mode = 'manual';
try {
  const cfg = $('Airtable — Lire VALIDATION_MODE').all().map(i => i.json);
  if (cfg.length && cfg[0].Valeur) mode = String(cfg[0].Valeur).trim().toLowerCase();
} catch(e) {}
const targetStatus = mode === 'auto' ? 'validé' : 'prêt_à_valider';

const byId = {};
for (const it of items) {
  if (!byId[it.id]) byId[it.id] = { id: it.id, urls: [], visual_strategy: it.visual_strategy };
  byId[it.id].urls[it.image_index - 1] = it.public_url;
}
return Object.values(byId).map(g => ({ json: {
  id: g.id,
  Status: targetStatus,
  Visuels_URLs: JSON.stringify(g.urls.filter(Boolean)),
  Visual_Strategy: JSON.stringify(g.visual_strategy || {})
}}));
"""


def patch_wf_social_04(wf):
    log = []
    nodes = wf['nodes']
    conns = wf.setdefault('connections', {})

    # 1. HTTP node : URL + rename
    old_http_name = None
    new_http_name = 'HTTP — Gemini 3.1 Flash Image'
    for n in nodes:
        if n.get('type','').endswith('.httpRequest') and 'generativelanguage' in str(n.get('parameters',{}).get('url','')):
            url = n['parameters']['url']
            if 'gemini-2.5-flash-image-preview' in url:
                n['parameters']['url'] = url.replace('gemini-2.5-flash-image-preview', 'gemini-3.1-flash-image-preview')
                log.append(f"  • URL: model → gemini-3.1-flash-image-preview")
            if 'gemini-3.1-flash-image-preview' not in n['parameters']['url']:
                log.append(f"  • WARNING: URL still references {n['parameters']['url']}")
            if n['name'] != new_http_name:
                old_http_name = n['name']
                n['name'] = new_http_name
                log.append(f"  • Renamed node: '{old_http_name}' → '{new_http_name}'")

    # Rewire connections if HTTP node was renamed
    if old_http_name:
        if old_http_name in conns:
            conns[new_http_name] = conns.pop(old_http_name)
        for src, c in conns.items():
            for outs in c.get('main', []):
                for entry in outs:
                    if entry.get('node') == old_http_name:
                        entry['node'] = new_http_name

    # 2. Add Airtable — Lire VALIDATION_MODE node if not present
    has_vm_node = any(n['name'] == VALIDATION_MODE_NODE_NAME for n in nodes)
    if not has_vm_node:
        # Find cron node + reference airtable node to copy positioning
        cron_node = next((n for n in nodes if n.get('type','').endswith('.scheduleTrigger')), None)
        ref_airtable = next((n for n in nodes if n['name'] == 'Airtable — Lire rédigés'), None)
        if cron_node and ref_airtable:
            new_id = f"vm-{uuid.uuid4().hex[:12]}"
            new_pos = [ref_airtable['position'][0], ref_airtable['position'][1] + 200]
            vm_node = {
                'id': new_id,
                'name': VALIDATION_MODE_NODE_NAME,
                'type': 'n8n-nodes-base.airtable',
                'typeVersion': 2.1,
                'position': new_pos,
                'parameters': {
                    'authentication': 'airtableTokenApi',
                    'resource': 'record',
                    'operation': 'search',
                    'base': {'__rl': True, 'value': 'apppkEbepilHCYiso', 'mode': 'list'},
                    'table': {'__rl': True, 'value': 'tblQqVRtboYFSGNt8', 'mode': 'list'},
                    'filterByFormula': "{Cle} = 'VALIDATION_MODE'",
                    'returnAll': True,
                    'options': {},
                    'sort': {},
                },
                'credentials': ref_airtable.get('credentials', {}),
                'continueOnFail': True,
            }
            nodes.append(vm_node)
            # Connect Cron → vm_node (in parallel to existing main connections)
            cron_conns = conns.setdefault(cron_node['name'], {}).setdefault('main', [[]])
            if cron_conns and isinstance(cron_conns[0], list):
                cron_conns[0].append({'node': VALIDATION_MODE_NODE_NAME, 'type': 'main', 'index': 0})
                log.append(f"  • Added node '{VALIDATION_MODE_NODE_NAME}' connected from Cron")
            else:
                log.append(f"  • WARNING: could not wire Cron → {VALIDATION_MODE_NODE_NAME}")
    else:
        log.append(f"  • Node '{VALIDATION_MODE_NODE_NAME}' already exists, skipping insertion")

    # 3. Replace Collect Code with new version that reads VALIDATION_MODE
    for n in nodes:
        if n['name'] == 'Collect — URLs par contenu':
            old_code = n['parameters'].get('jsCode', '')
            if "VALIDATION_MODE" not in old_code:
                n['parameters']['jsCode'] = NEW_COLLECT_CODE
                log.append(f"  • Updated 'Collect — URLs par contenu' to read VALIDATION_MODE and pick auto Status")
            else:
                log.append(f"  • 'Collect' already reads VALIDATION_MODE, skipping")

    return log


def push_workflow(wf_id, wf_body, api_key, api_url, dry_run=False):
    payload = {k: v for k, v in wf_body.items() if k in ALLOWED_FIELDS}
    settings = payload.get('settings') or {}
    payload['settings'] = {k: v for k, v in settings.items() if k in ALLOWED_SETTINGS}
    if dry_run:
        return None, "DRY-RUN"
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{api_url}/api/v1/workflows/{wf_id}",
        data=data, method='PUT',
        headers={'X-N8N-API-KEY': api_key, 'Content-Type': 'application/json'},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, 'OK'
    except urllib.error.HTTPError as e:
        return e.code, f"HTTPError: {e.read().decode()[:400]}"


def update_airtable_config(pat, dry_run=False):
    record_id = 'recdgiMFukusxKlog'  # GEMINI_MODEL_IMAGE
    target = 'gemini-3.1-flash-image-preview'
    url = f"https://api.airtable.com/v0/apppkEbepilHCYiso/tblQqVRtboYFSGNt8/{record_id}"
    if dry_run:
        return None, f"DRY-RUN would PATCH {record_id} → {target}"
    data = json.dumps({'fields': {'Valeur': target}}).encode()
    req = urllib.request.Request(url, data=data, method='PATCH',
                                 headers={'Authorization': f'Bearer {pat}',
                                          'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, 'OK'
    except urllib.error.HTTPError as e:
        return e.code, f"HTTPError: {e.read().decode()[:300]}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    api_key = os.environ.get('N8N_API_KEY')
    api_url = os.environ.get('N8N_URL')
    pat = os.environ.get('AIRTABLE_PAT')
    if not all([api_key, api_url, pat]):
        print("ERROR: missing env vars")
        sys.exit(1)

    # ---- WF-SOCIAL-04 ----
    wf_id = '774G38cqIvZsJUHm'
    req = urllib.request.Request(f"{api_url}/api/v1/workflows/{wf_id}",
                                 headers={'X-N8N-API-KEY': api_key})
    with urllib.request.urlopen(req, timeout=30) as r:
        wf = json.loads(r.read())
    print(f"\n[{wf_id}] WF-SOCIAL-04 — Visuels")
    log = patch_wf_social_04(wf)
    for l in log: print(l)
    os.makedirs('backups/n8n-audit-20260520/patched-v3', exist_ok=True)
    json.dump(wf, open(f'backups/n8n-audit-20260520/patched-v3/{wf_id}.json', 'w'),
              indent=2, ensure_ascii=False)
    status, resp = push_workflow(wf_id, wf, api_key, api_url, dry_run=args.dry_run)
    if status is None: print(f"  → {resp}")
    elif 200 <= status < 300: print(f"  → PUT {status} ✓")
    else:
        print(f"  → PUT {status} FAIL: {resp}")
        sys.exit(1)

    # ---- Airtable Config ----
    print("\n[Airtable] Config.GEMINI_MODEL_IMAGE → gemini-3.1-flash-image-preview")
    status, resp = update_airtable_config(pat, dry_run=args.dry_run)
    if status is None: print(f"  → {resp}")
    elif 200 <= status < 300: print(f"  → PATCH {status} ✓")
    else: print(f"  → PATCH {status} FAIL: {resp}")


if __name__ == '__main__':
    main()

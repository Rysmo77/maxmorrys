#!/usr/bin/env python3
"""
Patch n8n workflows : disable Gemini "thinking" budget (causes premature truncation
on gemini-2.5-* models) + bump maxOutputTokens + make Parse nodes tolerant.

Usage:
    set -a && source .env.local && set +a
    python3 scripts/n8n-patch-thinking.py [--dry-run] [--workflow ID]
"""
import json
import os
import sys
import copy
import argparse
import urllib.request
import urllib.error

# Per-workflow node-level overrides (also sets thinkingBudget=0 on every Gemini text node)
PER_NODE_TUNING = {
    # workflow_id : { node_name : (maxOutputTokens, optional_temperature) }
    'wJDQo9PjaT7RSJkw': {  # WF-SOCIAL-01
        'Gemini Pro — Proposer idées': (32768, None),
    },
    'k9vnobzVadNeU3tk': {  # WF-SOCIAL-03
        'Gemini Pro — Rédiger textes': (16384, None),
    },
    '774G38cqIvZsJUHm': {  # WF-SOCIAL-04
        'Gemini Pro — Stratégie V3': (32768, None),
    },
    'LOvoUdV3nKCsPd46': {  # WF-07
        'Gemini Pro — Proposer des sujets': (8192, None),  # was 4096 — too low for ideation
    },
    'OQMIBhbc7Y9OFQzL': {  # WF-08 — the failing one
        'Gemini Pro — Phase Recherche': (16384, None),
        "Gemini Pro — Rédiger l'article": (16384, None),
        'IMG2 — Gemini — Enrichir le prompt': (2048, None),  # bump 1024 → 2048
    },
    'AaIYKK3sM3kUwk2D': {  # WF-10
        'Gemini Pro — Proposer des cours': (8192, None),
    },
    '1gWJboq8sA4KmvYZ': {  # WF-11 — keep 65536, just add thinking=0
        'Gemini Pro — Concevoir le curriculum': (None, None),
    },
    'knz9CrfAak37RLAV': {  # WF-12
        'Gemini Pro — Contenu de la leçon': (16384, None),
    },
    'J97nElquwqmZkafH': {  # WF-13
        'Gemini Pro — Générer quiz & exercices': (8192, None),
    },
    'sai5IKLQIVRJhhCg': {  # WF-14
        'IMG2 — Enrichir prompt': (2048, None),  # was 512 — too tight
    },
    'bWBnavxblOSxA8ey': {  # WF-18
        'Gemini — Diagramme Mermaid': (8192, None),
        'Gemini — Infographie HTML': (16384, None),
    },
}

# Parse nodes to harden (throw → return [])
PARSE_HARDENING = {
    'OQMIBhbc7Y9OFQzL': {
        # Replace throw → return []
        'Parse — Construire BlogPost': (
            "throw new Error('Impossible d\\'extraire un JSON valide de la reponse Gemini. Debut du texte: ' + rawText.substring(0, 300));",
            "// Truncated/invalid Gemini output → skip this row rather than crash workflow\n  return [];"
        ),
    },
}


def patch_workflow(wf, wf_id):
    log = []
    tuning = PER_NODE_TUNING.get(wf_id, {})
    parse_fix = PARSE_HARDENING.get(wf_id, {})

    for n in wf['nodes']:
        # Gemini text nodes: add thinkingBudget=0 + bump maxOutputTokens
        if 'googleGemini' in n.get('type', ''):
            p = n.setdefault('parameters', {})
            # Skip image-resource nodes (no thinkingBudget needed)
            if p.get('resource') == 'image':
                continue
            opts = p.setdefault('options', {})
            if opts.get('thinkingBudget') != 0:
                opts['thinkingBudget'] = 0
                log.append(f"  • thinkingBudget=0 sur '{n['name']}'")
            override = tuning.get(n['name'])
            if override:
                new_mot, new_temp = override
                if new_mot is not None and opts.get('maxOutputTokens') != new_mot:
                    old = opts.get('maxOutputTokens', '?')
                    opts['maxOutputTokens'] = new_mot
                    log.append(f"  • maxOutputTokens {old}→{new_mot} sur '{n['name']}'")
                if new_temp is not None:
                    opts['temperature'] = new_temp

        # Parse hardening
        if n['name'] in parse_fix:
            old_str, new_str = parse_fix[n['name']]
            code = n['parameters'].get('jsCode', '')
            if old_str in code:
                n['parameters']['jsCode'] = code.replace(old_str, new_str)
                log.append(f"  • Parse hardened (return [] au lieu de throw) sur '{n['name']}'")
    return log


ALLOWED_FIELDS = {'name', 'nodes', 'connections', 'settings', 'staticData'}
ALLOWED_SETTINGS = {'saveExecutionProgress', 'saveManualExecutions',
                    'saveDataErrorExecution', 'saveDataSuccessExecution',
                    'executionTimeout', 'errorWorkflow', 'timezone', 'executionOrder'}


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
        headers={'X-N8N-API-KEY': api_key, 'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, 'OK'
    except urllib.error.HTTPError as e:
        return e.code, f"HTTPError: {e.read().decode()[:300]}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--workflow', help='Comma-separated IDs')
    args = ap.parse_args()

    api_key = os.environ.get('N8N_API_KEY')
    api_url = os.environ.get('N8N_URL')
    if not api_key or not api_url:
        print("ERROR: source .env.local first")
        sys.exit(1)

    ids = args.workflow.split(',') if args.workflow else list(PER_NODE_TUNING.keys())

    for wf_id in ids:
        # Pull fresh state from n8n (in case of intervening edits)
        req = urllib.request.Request(f"{api_url}/api/v1/workflows/{wf_id}",
                                     headers={'X-N8N-API-KEY': api_key})
        with urllib.request.urlopen(req, timeout=30) as r:
            wf = json.loads(r.read())
        name = wf.get('name', '?')
        print(f"\n[{wf_id}] {name}")
        log = patch_workflow(wf, wf_id)
        if not log:
            print("  (no changes)")
            continue
        for l in log: print(l)
        # Backup the modified state
        os.makedirs('backups/n8n-audit-20260520/patched-v2', exist_ok=True)
        json.dump(wf, open(f'backups/n8n-audit-20260520/patched-v2/{wf_id}.json', 'w'),
                  indent=2, ensure_ascii=False)
        status, resp = push_workflow(wf_id, wf, api_key, api_url, dry_run=args.dry_run)
        if status is None: print(f"  → {resp}")
        elif 200 <= status < 300: print(f"  → PUT {status} ✓")
        else: print(f"  → PUT {status} FAIL: {resp}")


if __name__ == '__main__':
    main()

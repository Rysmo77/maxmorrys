#!/usr/bin/env python3
"""
WF-07 — Plan de correction (6 items).

1. Parse hardening (return [] au lieu de throw)
2. Fix Longueur_Recommandee=0 hardcodé → expression Gemini
3. Log structuré dans Airtable Logs (succès)
4. Retry Gemini (retryOnFail 2x)
5. Cron 5h UTC au lieu de 0h
6. Refactor Merge : $input.all() au lieu de liste hardcodée
+ Ajout option WF-07 dans Airtable Logs.Workflow

Usage:
    set -a && source .env.local && set +a
    python3 scripts/n8n-fix-wf07.py [--dry-run]
"""
import json
import os
import sys
import uuid
import argparse
import urllib.request
import urllib.error

WF_ID = 'LOvoUdV3nKCsPd46'
BASE_ID = 'apppkEbepilHCYiso'
LOGS_TABLE = 'tblHtN3jKqvwFXkXN'
LOGS_WORKFLOW_FIELD = 'fldVYFnnaIWTAdRHi'

ALLOWED_FIELDS = {'name', 'nodes', 'connections', 'settings', 'staticData'}
ALLOWED_SETTINGS = {'saveExecutionProgress', 'saveManualExecutions',
                    'saveDataErrorExecution', 'saveDataSuccessExecution',
                    'executionTimeout', 'errorWorkflow', 'timezone', 'executionOrder'}

COLORS = ['blueLight2', 'greenLight2', 'yellowLight2', 'orangeLight2', 'redLight2',
          'purpleLight2', 'pinkLight2', 'grayLight2', 'cyanLight2', 'tealLight2']

NEW_PARSE_CODE = """const input = $input.first().json;
const today = new Date().toISOString().split('T')[0];

// Robust extraction: handle markdown code fences, truncation, nested .content.parts
function extractText(inp) {
  if (inp.content?.parts) return inp.content.parts.map(p => p.text || '').join('');
  if (inp.candidates?.[0]?.content?.parts) return inp.candidates[0].content.parts.map(p => p.text || '').join('');
  if (typeof inp === 'string') return inp;
  if (inp.text) return inp.text;
  return '';
}
function cleanupJson(txt) {
  let s = String(txt || '').trim();
  s = s.replace(/^```(?:json)?\\s*\\n?/i, '').replace(/\\n?```\\s*$/i, '').trim();
  const last = s.lastIndexOf('}');
  if (last !== -1 && last < s.length - 1) s = s.slice(0, last + 1);
  return s;
}

let parsed;
try {
  if (input.articles) { parsed = input; }
  else {
    const txt = extractText(input);
    if (!txt) { parsed = input; }
    else parsed = JSON.parse(cleanupJson(txt));
  }
} catch (e) {
  return [];
}

const articles = (parsed.articles || []).map(a => ({
  Date: today, Titre_SEO: a.title_seo, Mot_Cle: a.main_keyword,
  Angle_Local: a.local_angle, Volume_Estime: a.competition_level,
  Score: a.seo_potential_score, Status: 'nouveau',
  Meta_Description: a.meta_description,
  Keywords_Secondaires: (a.secondary_keywords || []).join(', '),
  Structure: (a.suggested_structure || []).join(' | '),
  Longueur_Recommandee: a.recommended_length,
  Intent: a.search_intent, Content_Gap: a.content_gap,
  Inspiration: a.inspiration_source || ''
}));

return articles.map(a => ({ json: a }));
"""

NEW_MERGE_CODE = """// Refactored : $input.all() au lieu d'itérer sur une liste de noms RSS hardcodée.
// Détecte le type d'item par signature (RSS / Firestore / Airtable Articles).
const inputItems = $input.all().map(i => i.json);

// 1. Articles existants (Airtable) — référence par nom (1 seul node)
const existing = $('Airtable — Articles existants').all().map(i => i.json);
const existingTitles = existing.map(e => e.Titre_SEO || '').filter(Boolean);

// 2. Firestore — référence par nom (2 nodes stables)
let messageQuestions = [];
try {
  const docs = $('Firestore — Messages récents').first().json?.documents || [];
  messageQuestions = docs.map(doc => {
    const f = doc.fields || {};
    return {
      title: f.subject?.stringValue || '',
      snippet: (f.message?.stringValue || '').substring(0, 200),
      url: '',
      source: 'Messages visiteurs',
    };
  }).filter(m => m.title || m.snippet);
} catch (e) {}

let faqItems = [];
try {
  const faqs = $('Firestore — FAQ (questions fréquentes)').first().json?.documents || [];
  faqItems = faqs.map(doc => {
    const f = doc.fields || {};
    return {
      title: f.question?.stringValue || '',
      snippet: (f.answer?.stringValue || '').substring(0, 150),
      url: '',
      source: 'FAQ maxmorrys.me',
    };
  }).filter(f => f.title);
} catch (e) {}

// 3. RSS — détection par signature (title + contentSnippet/content, sans documents, sans recXX)
const existingIds = new Set(existing.map(e => e.id));
const allSources = inputItems
  .filter(it => it
    && typeof it.title === 'string'
    && !it.documents
    && !(typeof it.id === 'string' && it.id.startsWith('rec'))
    && !existingIds.has(it.id))
  .map(it => ({
    title: it.title,
    snippet: String(it.contentSnippet || it.content || '').substring(0, 300),
    url: it.link || it.url || '',
    source: 'rss',
  }));

return [{ json: {
  rss_results: allSources,
  user_questions: messageQuestions,
  faq_questions: faqItems,
  existing_articles: existingTitles,
  total_sources: allSources.length + messageQuestions.length + faqItems.length,
} }];
"""


def http_request(method, url, headers, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read()) if r.headers.get('content-type','').startswith('application/json') else r.read()
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:400]
        try: body = json.loads(body)
        except: pass
        return e.code, body


def add_wf07_option(pat, dry_run):
    """Ajoute 'WF-07' aux options du field Workflow de Logs.
    Airtable Meta API exige de re-passer les options EXISTANTES avec leur id +
    ajouter les NOUVELLES sans id (id sera généré).
    """
    headers = {'Authorization': f'Bearer {pat}', 'Content-Type': 'application/json'}
    # Fetch current state
    status, schema = http_request('GET', f"https://api.airtable.com/v0/meta/bases/{BASE_ID}/tables",
                                  {'Authorization': f'Bearer {pat}', 'Accept': 'application/json'})
    if status != 200:
        return f'GET schema failed: {schema}'
    choices = None
    for t in schema['tables']:
        if t['id'] == LOGS_TABLE:
            for f in t['fields']:
                if f['id'] == LOGS_WORKFLOW_FIELD:
                    choices = list(f['options']['choices'])
                    break
            break
    if choices is None:
        return 'field not found'
    if any(c['name'] == 'WF-07' for c in choices):
        return 'WF-07 already present'
    # Append new option (no id — Airtable generates)
    choices.append({'name': 'WF-07', 'color': 'blueLight2'})
    if dry_run:
        return f'DRY-RUN: would add WF-07 to {len(choices)} options'
    url = f"https://api.airtable.com/v0/meta/bases/{BASE_ID}/tables/{LOGS_TABLE}/fields/{LOGS_WORKFLOW_FIELD}"
    status, resp = http_request('PATCH', url, headers, body={'options': {'choices': choices}})
    return f'PATCH {status}: {resp}' if status != 200 else 'WF-07 added ✓'


def patch_workflow(wf):
    log = []
    nodes = wf['nodes']
    conns = wf.setdefault('connections', {})

    # 1. Cron 5h UTC
    for n in nodes:
        if n['name'] == 'Chaque Lundi':
            rule = n['parameters'].setdefault('rule', {})
            iv = rule.setdefault('interval', [{}])
            if iv and isinstance(iv, list):
                if iv[0].get('triggerAtHour') != 5:
                    iv[0]['triggerAtHour'] = 5
                    log.append("  • Cron → lundi 5h UTC")

    # 2. Parse hardening
    for n in nodes:
        if n['name'] == 'Parse — Structurer les sujets':
            if 'cleanupJson' not in n['parameters'].get('jsCode',''):
                n['parameters']['jsCode'] = NEW_PARSE_CODE
                log.append("  • Parse hardened (return [] au lieu de throw)")

    # 3. Merge refactor
    for n in nodes:
        if n['name'] == 'Merge — Compiler les données':
            if '$input.all()' not in n['parameters'].get('jsCode',''):
                n['parameters']['jsCode'] = NEW_MERGE_CODE
                log.append("  • Merge refactoré ($input.all() + détection par signature)")

    # 4. Retry Gemini
    for n in nodes:
        if n['name'] == 'Gemini Pro — Proposer des sujets':
            if not n.get('retryOnFail'):
                n['retryOnFail'] = True
                n['maxTries'] = 2
                n['waitBetweenTries'] = 30000
                log.append("  • Gemini: retryOnFail 2x (wait 30s)")

    # 5. Fix Longueur_Recommandee
    for n in nodes:
        if n['name'] == 'Airtable — Sauvegarder les idées':
            cols = n['parameters'].setdefault('columns', {})
            vals = cols.setdefault('value', {})
            cur = vals.get('Longueur_Recommandee')
            if cur != '={{ $json.Longueur_Recommandee }}':
                vals['Longueur_Recommandee'] = '={{ $json.Longueur_Recommandee }}'
                log.append(f"  • Longueur_Recommandee: {cur} → expression Gemini")

    # 6. Add Log node + connect
    has_log_node = any(n['name'] == 'Airtable — Log run' for n in nodes)
    if not has_log_node:
        ref_airtable = next((n for n in nodes if n['name'] == 'Airtable — Sauvegarder les idées'), None)
        if ref_airtable:
            new_id = f"log-{uuid.uuid4().hex[:12]}"
            ref_pos = ref_airtable.get('position', [0, 0])
            new_node = {
                'id': new_id,
                'name': 'Airtable — Log run',
                'type': 'n8n-nodes-base.airtable',
                'typeVersion': 2.1,
                'position': [ref_pos[0] + 250, ref_pos[1]],
                'parameters': {
                    'authentication': 'airtableTokenApi',
                    'resource': 'record',
                    'operation': 'create',
                    'base': {'__rl': True, 'value': BASE_ID, 'mode': 'list'},
                    'table': {'__rl': True, 'value': LOGS_TABLE, 'mode': 'list'},
                    'columns': {
                        'mappingMode': 'defineBelow',
                        'value': {
                            'Event': 'Génération idées articles',
                            'Workflow': 'WF-07',
                            'Timestamp': '={{ $now.toISO() }}',
                            'Status': 'success',
                            'Details': '={{ JSON.stringify({count: $(\'Parse — Structurer les sujets\').all().length, total_sources: $(\'Merge — Compiler les données\').first().json.total_sources}) }}',
                        },
                    },
                    'options': {'typecast': True},
                },
                'credentials': ref_airtable.get('credentials', {}),
                'continueOnFail': True,
                'executeOnce': True,
            }
            nodes.append(new_node)
            # Connect Sauvegarder → Log run
            sav_conn = conns.setdefault('Airtable — Sauvegarder les idées', {}).setdefault('main', [[]])
            if not sav_conn or not isinstance(sav_conn[0], list):
                sav_conn[:] = [[]]
            sav_conn[0].append({'node': 'Airtable — Log run', 'type': 'main', 'index': 0})
            log.append("  • Added node 'Airtable — Log run' connecté en aval de Sauvegarder")

    return log


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    api_key = os.environ.get('N8N_API_KEY')
    api_url = os.environ.get('N8N_URL')
    pat = os.environ.get('AIRTABLE_PAT')
    if not all([api_key, api_url, pat]):
        print("ERROR: env vars manquantes")
        sys.exit(1)

    # 1. Airtable: add WF-07 option
    print("[Airtable] Add 'WF-07' to Logs.Workflow options")
    result = add_wf07_option(pat, args.dry_run)
    print(f"  → {result}")

    # 2. n8n: patch WF-07
    print(f"\n[n8n] Fetch live workflow {WF_ID}")
    status, wf = http_request('GET', f"{api_url}/api/v1/workflows/{WF_ID}",
                              {'X-N8N-API-KEY': api_key, 'Accept': 'application/json'})
    if status != 200:
        print(f"  GET failed: {wf}")
        sys.exit(1)

    print(f"  fetched ({len(wf['nodes'])} nodes)")
    log = patch_workflow(wf)
    if not log:
        print("  (no changes — already patched)")
        return
    for l in log: print(l)

    # Backup
    os.makedirs('backups/n8n-audit-20260520/patched-v4', exist_ok=True)
    json.dump(wf, open(f'backups/n8n-audit-20260520/patched-v4/{WF_ID}.json', 'w'),
              indent=2, ensure_ascii=False)

    # PUT
    if args.dry_run:
        print("  → DRY-RUN (no PUT)")
        return
    payload = {k: v for k, v in wf.items() if k in ALLOWED_FIELDS}
    payload['settings'] = {k: v for k, v in (payload.get('settings') or {}).items() if k in ALLOWED_SETTINGS}
    status, resp = http_request('PUT', f"{api_url}/api/v1/workflows/{WF_ID}",
                                {'X-N8N-API-KEY': api_key, 'Content-Type': 'application/json'}, body=payload)
    if 200 <= status < 300:
        print(f"  → PUT {status} ✓")
    else:
        print(f"  → PUT {status} FAILED: {resp}")
        sys.exit(1)


if __name__ == '__main__':
    main()

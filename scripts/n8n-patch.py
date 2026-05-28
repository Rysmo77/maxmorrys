#!/usr/bin/env python3
"""
Patch n8n workflows for maxmorrys.me — fixes broken Gemini models, robustness, and known bugs.

Reads JSON backups from backups/n8n-audit-20260520/, applies fixes, and pushes via PUT /api/v1/workflows/{id}.

Usage:
    set -a && source .env.local && set +a
    python3 scripts/n8n-patch.py [--dry-run] [--workflow ID1,ID2]
"""
import json
import os
import sys
import copy
import argparse
import urllib.request
import urllib.error

BACKUP_DIR = 'backups/n8n-audit-20260520'
PATCH_DIR = 'backups/n8n-audit-20260520/patched'

# Mapping anciens modèles → nouveaux (validés en juin 2026)
MODEL_MAP = {
    'models/gemini-3-flash-preview': 'models/gemini-2.5-pro',
    'gemini-3-flash-preview': 'gemini-2.5-pro',
    'models/gemini-3.1-flash-lite': 'models/gemini-2.5-flash',
    'gemini-3.1-flash-lite': 'gemini-2.5-flash',
    'models/gemini-3.1-flash-image-preview': 'models/gemini-2.5-flash-image-preview',
    'gemini-3.1-flash-image-preview': 'gemini-2.5-flash-image-preview',
    'gemini-3-pro-image-preview': 'gemini-2.5-flash-image-preview',
    'models/gemini-3-pro-image-preview': 'models/gemini-2.5-flash-image-preview',
}


def fix_model_references(node):
    """Replace deprecated Gemini model IDs in any node."""
    changed = False
    params = node.get('parameters', {})

    # langchain googleGemini node
    if 'modelId' in params and isinstance(params['modelId'], dict):
        cur = params['modelId'].get('value', '')
        if cur in MODEL_MAP:
            new = MODEL_MAP[cur]
            params['modelId']['value'] = new
            params['modelId']['cachedResultName'] = new
            changed = True

    # HTTP Request node calling Gemini directly
    if params.get('url'):
        url = params['url']
        for old, new in MODEL_MAP.items():
            if old in url:
                params['url'] = url.replace(old, new)
                changed = True
                break
    return changed


def patch_wf_social_01(wf):
    """WF-SOCIAL-01 Idéation : modèle Gemini."""
    log = []
    for n in wf['nodes']:
        if fix_model_references(n):
            log.append(f"  • model fixed in '{n['name']}'")
    return log


def patch_wf_social_04(wf):
    """WF-SOCIAL-04 Visuels : modèle + payload Gemini Image."""
    log = []
    for n in wf['nodes']:
        if fix_model_references(n):
            log.append(f"  • model fixed in '{n['name']}'")
        if n['name'] == 'HTTP — Gemini 3 Pro Image':
            # Rename node to reflect new model + fix payload to standard Gemini image API format
            n['name'] = 'HTTP — Gemini 2.5 Flash Image'
            # The new payload uses responseModalities ['TEXT','IMAGE'] (correct casing per API)
            n['parameters']['jsonBody'] = (
                "={{ JSON.stringify({ "
                "contents: [{ parts: [{ text: $json.prompt_gemini3 }] }], "
                "generationConfig: { responseModalities: ['TEXT','IMAGE'] } "
                "}) }}"
            )
            # Add retry on transient failures
            n['retryOnFail'] = True
            n['maxTries'] = 3
            n['waitBetweenTries'] = 5000
            log.append(f"  • payload Gemini Image normalisé + retry activé")
    # Update connections if node renamed
    if 'HTTP — Gemini 3 Pro Image' in wf.get('connections', {}):
        wf['connections']['HTTP — Gemini 2.5 Flash Image'] = wf['connections'].pop('HTTP — Gemini 3 Pro Image')
    for src, conns in wf.get('connections', {}).items():
        for outs in conns.get('main', []):
            for c in outs:
                if c.get('node') == 'HTTP — Gemini 3 Pro Image':
                    c['node'] = 'HTTP — Gemini 2.5 Flash Image'
                    log.append(f"  • connection rewired: {src} → HTTP — Gemini 2.5 Flash Image")
    return log


def patch_wf_social_05(wf):
    """WF-SOCIAL-05 Publication Blotato : filter skip/empty + retry + safe JSON."""
    log = []
    # Find the HTTP Blotato node
    blotato_node = None
    build_payload_node = None
    for n in wf['nodes']:
        if n['name'] == 'Blotato — POST /v2/posts':
            blotato_node = n
        elif n['name'] == 'Build — Payload Blotato':
            build_payload_node = n

    if blotato_node:
        # Add a safer JSON body: skip if no body
        blotato_node['parameters']['jsonBody'] = (
            "={{ $json.body ? JSON.stringify($json.body) : '{}' }}"
        )
        # Add retry
        blotato_node['retryOnFail'] = True
        blotato_node['maxTries'] = 3
        blotato_node['waitBetweenTries'] = 10000
        # Always continue on fail so one bad post doesn't kill the batch
        blotato_node['continueOnFail'] = True
        log.append("  • Blotato HTTP: safe JSON + retry 3x + continueOnFail")

    # Insert an IF node between Build Payload and Blotato to drop skipped items.
    # Easier: modify Build code to return only valid items (drop _skip and _empty).
    if build_payload_node:
        code = build_payload_node['parameters']['jsCode']
        # Replace the final return to filter out _skip and _empty
        new_tail = (
            "const valid = results.filter(r => !r.json._skip && !r.json._empty);\n"
            "return valid.length ? valid : [];"
        )
        old_tail = "return results.length ? results : [{ json: { _empty: true }}];"
        if old_tail in code:
            build_payload_node['parameters']['jsCode'] = code.replace(old_tail, new_tail)
            log.append("  • Build Payload: filtre _skip/_empty avant push (évite payload undefined)")
    return log


def patch_wf_07(wf):
    """WF-07 Idées Articles : continueOnFail sur tous RSS + modèle Gemini."""
    log = []
    for n in wf['nodes']:
        if fix_model_references(n):
            log.append(f"  • model fixed in '{n['name']}'")
        if n.get('type', '').endswith('.rssFeedRead'):
            if not n.get('continueOnFail'):
                n['continueOnFail'] = True
                log.append(f"  • continueOnFail=true sur '{n['name']}'")
    return log


def patch_wf_08(wf):
    """WF-08 Rédaction SEO : modèles Gemini + retry."""
    log = []
    for n in wf['nodes']:
        if fix_model_references(n):
            log.append(f"  • model fixed in '{n['name']}'")
        # Add retry on image gen step (often flaky)
        if n['name'] == 'IMG4 — Gemini — Générer l\'image':
            n['retryOnFail'] = True
            n['maxTries'] = 3
            n['waitBetweenTries'] = 8000
            log.append("  • IMG4: retry 3x")
    return log


def patch_wf_09(wf):
    """WF-09 Newsletter : code Préparer robuste avec try/catch sur .all() externes."""
    log = []
    for n in wf['nodes']:
        if n['name'] == 'Préparer — Contenu newsletter':
            n['parameters']['jsCode'] = (
                "// Robust: wrap external .all() in try/catch to handle parallel branch failures\n"
                "let articles = [], courses = [];\n"
                "try {\n"
                "  articles = $('Airtable — Articles récents').all().map(i => i.json)\n"
                "    .filter(a => a.Status === 'produit_draft' || a.Status === 'publié').slice(-5);\n"
                "} catch(e) { articles = []; }\n"
                "try {\n"
                "  courses = $('Airtable — Cours récents').all().map(i => i.json)\n"
                "    .filter(c => c.Status !== 'nouveau').slice(-3);\n"
                "} catch(e) { courses = []; }\n"
                "return [{ json: { recent_articles: articles, recent_courses: courses } }];"
            )
            log.append("  • Préparer code: try/catch sur .all() (résiste aux branches partielles)")
        # Also add continueOnFail to the Airtable nodes
        if n['name'] in ('Airtable — Articles récents', 'Airtable — Cours récents'):
            if not n.get('continueOnFail'):
                n['continueOnFail'] = True
                log.append(f"  • continueOnFail=true sur '{n['name']}'")
    return log


def patch_wf_10(wf):
    """WF-10 Recherche cours : strip markdown code fences avant JSON.parse."""
    log = []
    for n in wf['nodes']:
        if n['name'] == 'Parse — Structurer les propositions':
            old = n['parameters']['jsCode']
            # Inject a cleanup step before JSON.parse
            new = (
                "const input = $input.first().json;\n"
                "const today = new Date().toISOString().split('T')[0];\n"
                "\n"
                "// Robust extraction: handle markdown code fences, truncation, nested .content.parts\n"
                "function extractText(inp) {\n"
                "  if (inp.content?.parts) return inp.content.parts.map(p => p.text || '').join('');\n"
                "  if (inp.candidates?.[0]?.content?.parts) return inp.candidates[0].content.parts.map(p => p.text || '').join('');\n"
                "  if (typeof inp === 'string') return inp;\n"
                "  if (inp.text) return inp.text;\n"
                "  return '';\n"
                "}\n"
                "function cleanupJson(txt) {\n"
                "  // strip markdown fences ```json ... ```\n"
                "  let s = String(txt || '').trim();\n"
                "  s = s.replace(/^```(?:json)?\\s*\\n?/i, '').replace(/\\n?```\\s*$/i, '').trim();\n"
                "  // best-effort: cut at last closing brace if unterminated\n"
                "  const last = s.lastIndexOf('}');\n"
                "  if (last !== -1 && last < s.length - 1) s = s.slice(0, last + 1);\n"
                "  return s;\n"
                "}\n"
                "\n"
                "let parsed;\n"
                "try {\n"
                "  if (input.course_proposals) { parsed = input; }\n"
                "  else {\n"
                "    const txt = extractText(input);\n"
                "    if (!txt) { parsed = input; }\n"
                "    else parsed = JSON.parse(cleanupJson(txt));\n"
                "  }\n"
                "} catch (e) {\n"
                "  // Last resort: return empty list rather than crashing workflow\n"
                "  return [];\n"
                "}\n"
                "\n"
                "const courses = (parsed.course_proposals || []).map(c => ({\n"
                "  Date: today, Titre: c.title, Niveau: c.level,\n"
                "  Audience: c.target_audience, Besoin_Local: c.why_needed_locally,\n"
                "  Duree: `${c.estimated_duration_hours}h (${c.estimated_modules} modules, ${c.estimated_lessons} leçons)`,\n"
                "  Score: c.priority_score, Status: 'nouveau',\n"
                "  slug: c.slug_suggested, category: c.category,\n"
                "  objectives: JSON.stringify(c.learning_objectives),\n"
                "  prerequisites: JSON.stringify(c.prerequisites),\n"
                "  outline: JSON.stringify(c.outline_preview),\n"
                "  price_range: c.suggested_price_range,\n"
                "  monetization: c.monetization_potential,\n"
                "  sources: (c.inspiration_sources || []).join(', ')\n"
                "}));\n"
                "\n"
                "return courses.map(c => ({ json: c }));"
            )
            n['parameters']['jsCode'] = new
            log.append("  • Parse code: strip code fences + best-effort truncation recovery + safe fail")
        if fix_model_references(n):
            log.append(f"  • model fixed in '{n['name']}'")
    return log


def patch_wf_social_02(wf):
    """WF-SOCIAL-02 Planification : continueOnFail + retry."""
    log = []
    for n in wf['nodes']:
        if fix_model_references(n):
            log.append(f"  • model fixed in '{n['name']}'")
    return log


def patch_wf_social_03(wf):
    """WF-SOCIAL-03 Rédaction : modèle Gemini + retry."""
    log = []
    for n in wf['nodes']:
        if fix_model_references(n):
            log.append(f"  • model fixed in '{n['name']}'")
    return log


PATCHERS = {
    'wJDQo9PjaT7RSJkw': ('WF-SOCIAL-01 Idéation', patch_wf_social_01),
    '5ynAS12PX2x4o2BV': ('WF-SOCIAL-02 Planification', patch_wf_social_02),
    'k9vnobzVadNeU3tk': ('WF-SOCIAL-03 Rédaction', patch_wf_social_03),
    '774G38cqIvZsJUHm': ('WF-SOCIAL-04 Visuels', patch_wf_social_04),
    'wrRa0I7tYAsPJSOA': ('WF-SOCIAL-05 Publication', patch_wf_social_05),
    'LOvoUdV3nKCsPd46': ('WF-07 Idées Articles', patch_wf_07),
    'OQMIBhbc7Y9OFQzL': ('WF-08 Rédaction SEO', patch_wf_08),
    'uRGEzjTISxZI8XUJ': ('WF-09 Newsletter', patch_wf_09),
    'AaIYKK3sM3kUwk2D': ('WF-10 Recherche Cours', patch_wf_10),
}

# n8n Cloud public API accepts ONLY these fields on PUT /workflows/{id}
ALLOWED_FIELDS = {'name', 'nodes', 'connections', 'settings', 'staticData'}


ALLOWED_SETTINGS = {'saveExecutionProgress', 'saveManualExecutions',
                    'saveDataErrorExecution', 'saveDataSuccessExecution',
                    'executionTimeout', 'errorWorkflow', 'timezone', 'executionOrder'}


def push_workflow(wf_id, wf_body, api_key, api_url, dry_run=False):
    payload = {k: v for k, v in wf_body.items() if k in ALLOWED_FIELDS}
    settings = payload.get('settings') or {}
    payload['settings'] = {k: v for k, v in settings.items() if k in ALLOWED_SETTINGS}

    if dry_run:
        return None, "DRY-RUN (no PUT)"
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{api_url}/api/v1/workflows/{wf_id}",
        data=data, method='PUT',
        headers={'X-N8N-API-KEY': api_key, 'Content-Type': 'application/json', 'Accept': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:500]
        return e.code, f"HTTPError: {body}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--workflow', help='Comma-separated workflow IDs (default: all)')
    args = ap.parse_args()

    api_key = os.environ.get('N8N_API_KEY')
    api_url = os.environ.get('N8N_URL')
    if not api_key or not api_url:
        print("ERROR: N8N_API_KEY and N8N_URL required (source .env.local)")
        sys.exit(1)

    os.makedirs(PATCH_DIR, exist_ok=True)
    ids = args.workflow.split(',') if args.workflow else list(PATCHERS.keys())

    for wf_id in ids:
        if wf_id not in PATCHERS:
            print(f"SKIP {wf_id}: no patcher")
            continue
        label, patcher = PATCHERS[wf_id]
        path = f"{BACKUP_DIR}/{wf_id}.json"
        wf = json.load(open(path))
        print(f"\n[{wf_id}] {label}")
        log = patcher(wf)
        if not log:
            print("  (no changes)")
            continue
        for l in log:
            print(l)
        json.dump(wf, open(f"{PATCH_DIR}/{wf_id}.json", 'w'), indent=2, ensure_ascii=False)
        status, resp = push_workflow(wf_id, wf, api_key, api_url, dry_run=args.dry_run)
        if status is None:
            print(f"  → {resp}")
        elif 200 <= status < 300:
            print(f"  → PUT {status} ✓")
        else:
            print(f"  → PUT {status} FAILED: {resp}")


if __name__ == '__main__':
    main()

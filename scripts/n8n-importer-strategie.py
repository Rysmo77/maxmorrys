#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Importe dans n8n les workflows générés par `n8n-patch-strategy-2026.py`.

    python3 scripts/n8n-importer-strategie.py            # à blanc
    python3 scripts/n8n-importer-strategie.py --apply     # applique

Ordre imposé : le routeur en DERNIER. C'est lui qui porte les menus, et il ne sert à rien tant que
le reste n'est pas en place ; c'est aussi lui qui porte le webhook Telegram et les approbations en
attente — donc celui dont une panne se voit le plus vite.

Garde-fous :
  - refuse de partir si `n8n/live/` a dérivé de la production (quelqu'un a modifié en ligne) ;
  - n'envoie que `name`, `nodes`, `connections`, `settings` — les seuls champs acceptés par
    `PUT /workflows/{id}` ;
  - pour un workflow à déclencheur webhook, applique le cycle **désactiver → activer**, qui
    réenregistre proprement le webhook Telegram ;
  - relit chaque workflow après écriture et compare les nœuds — on ne se fie pas au code retour.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

SRC = "n8n/strategy-2026"
LIVE = "n8n/live"

# (fichier généré, préfixe du workflow live). Le routeur en dernier — voir docstring.
A_METTRE_A_JOUR = [
    ("WF-THEMES.json", "WF-THEMES"),
    ("WF-SOCIAL-03.json", "WF-SOCIAL-03"),
    ("WF-SOCIAL-04.json", "WF-SOCIAL-04"),
    ("WF-TG-ROUTER.json", "WF-TG-ROUTER"),
]
# Nouveau workflow : créé, puis laissé INACTIF. Son cron enverrait des relances Telegram ; on
# l'active une fois le premier rituel passé, pas avant.
A_CREER = [("WF-PICKS-RELANCE.json", "WF-PICKS-RELANCE")]

CHAMPS_ACCEPTES = ("name", "nodes", "connections", "settings")

# `PUT /workflows/{id}` valide `settings` contre un schéma strict et rejette tout le reste
# (`request/body/settings must NOT have additional properties`). Les exports du serveur portent
# des clés que l'API n'accepte pas en écriture — `binaryMode` notamment. On ne garde que celles
# du schéma, en préservant `errorWorkflow` : c'est WF-ERR, le filet qui alerte sur Telegram.
SETTINGS_ACCEPTES = (
    "executionOrder", "timezone", "errorWorkflow", "executionTimeout",
    "saveExecutionProgress", "saveManualExecutions",
    "saveDataErrorExecution", "saveDataSuccessExecution",
)


def env(path=".env.local") -> dict:
    out = {}
    if os.path.exists(path):
        with open(path, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    out[k.strip()] = v.strip().strip('"').strip("'")
    return out


CFG = env()
BASE = (CFG.get("N8N_URL") or "").rstrip("/")
KEY = CFG.get("N8N_API_KEY")


def api(path: str, method="GET", body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{BASE}{path}", data=data, method=method, headers={
        "X-N8N-API-KEY": KEY, "Content-Type": "application/json", "Accept": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read().decode()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code} {method} {path} — {e.read().decode()[:400]}") from None


def signature(nodes) -> list:
    """Empreinte comparable d'un jeu de nœuds.

    ⚠️ **n8n normalise ce qu'il stocke** : il retire les paramètres à valeur par défaut
    (`resource: "row"`, `dataToSend: "mapWithFields"`…) et renomme certaines sous-clés de
    conditions. Comparer les `parameters` bruts fait donc voir une « dérive » après chaque import,
    alors que rien n'a bougé — vérifié : le `jsCode` revient au caractère près.

    On compare donc ce qu'on écrit vraiment et qui survit tel quel : la liste des nœuds (nom + type)
    et le code des nœuds `Code`. C'est ce qui attrape le cas réel qu'on veut attraper — quelqu'un
    modifie un nœud dans l'UI. Un changement de table ou de condition fait dans l'UI passerait au
    travers ; la vérification post-import (noms, credentials, absence d'Airtable) le rattraperait.
    """
    return sorted(
        (n["name"], n["type"],
         (n.get("parameters") or {}).get("jsCode", ""),
         # `alwaysOutputData` est une propriété DU NŒUD, pas un paramètre — et elle décide si une
         # lecture vide tue la branche en aval. L'omettre ici rendrait invisible le correctif du
         # 2026-08-06, et l'import se croirait « déjà à jour ».
         bool(n.get("alwaysOutputData")))
        for n in nodes
    )


def detailler_ecart(live_nodes, gen_nodes) -> list:
    """Dit précisément ce qui sépare la production du fichier généré."""
    L = {n["name"]: n for n in live_nodes}
    G = {n["name"]: n for n in gen_nodes}
    lignes = []
    for nom in sorted(set(G) - set(L)):
        lignes.append(f"+ absent en production : « {nom} »")
    for nom in sorted(set(L) - set(G)):
        lignes.append(f"- en production mais plus généré : « {nom} »")
    for nom in sorted(set(L) & set(G)):
        l, g = L[nom], G[nom]
        if bool(l.get("alwaysOutputData")) != bool(g.get("alwaysOutputData")):
            lignes.append(f"~ « {nom} » : alwaysOutputData "
                          f"{bool(l.get('alwaysOutputData'))} → {bool(g.get('alwaysOutputData'))}")
        if (l.get("parameters") or {}).get("jsCode", "") != (g.get("parameters") or {}).get("jsCode", ""):
            lignes.append(f"~ « {nom} » : le code diffère")
        if l["type"] != g["type"]:
            lignes.append(f"~ « {nom} » : type {l['type']} → {g['type']}")
    return lignes or ["(aucun écart détaillé — différence hors périmètre de l'empreinte)"]


def a_un_webhook(nodes) -> bool:
    return any("trigger" in n["type"].lower() or "webhook" in n["type"].lower() for n in nodes)


def main() -> int:
    if not BASE or not KEY:
        print("N8N_URL / N8N_API_KEY absents de .env.local", file=sys.stderr)
        return 1
    apply = "--apply" in sys.argv
    print(f"Cible : {BASE}\nMode  : {'IMPORT RÉEL' if apply else 'à blanc (rien ne sera écrit)'}\n")

    workflows = api("/api/v1/workflows?limit=200").get("data", [])
    par_prefixe = {}
    for w in workflows:
        for _, prefix in A_METTRE_A_JOUR:
            if w["name"].startswith(prefix) and w.get("active"):
                par_prefixe[prefix] = w

    # 1. Contrôle de dérive — on ne patche que ce qu'on a lu.
    #    Deux états sont acceptables : la production correspond au snapshot (pas encore importé),
    #    ou elle correspond déjà au fichier généré (import partiel à reprendre). Tout autre écart
    #    signifie que quelqu'un a modifié en ligne, et on refuse d'écraser.
    derives, deja_importes = [], set()
    for fichier, prefix in A_METTRE_A_JOUR:
        live = par_prefixe.get(prefix)
        if not live:
            derives.append(f"{prefix} : aucun workflow ACTIF de ce nom")
            continue
        snap = json.load(open(os.path.join(LIVE, f"{prefix}.json"), encoding="utf-8"))
        gen = json.load(open(os.path.join(SRC, fichier), encoding="utf-8"))
        sig_live = signature(live["nodes"])
        if sig_live == signature(gen["nodes"]):
            deja_importes.add(prefix)
        elif sig_live != signature(snap["nodes"]):
            # Un refus sec n'aide personne : on dit CE QUI diffère, pour que la décision
            # d'écraser ou non soit prise en connaissance de cause.
            derives.append(f"{prefix} : la production ne correspond ni au snapshot ni au fichier généré")
            for ligne in detailler_ecart(live["nodes"], gen["nodes"]):
                derives.append(f"     {ligne}")
    if derives:
        forcer = "--forcer" in sys.argv
        print("⚠️  DÉRIVE DÉTECTÉE :", file=sys.stderr)
        for d in derives:
            print(f"   - {d}", file=sys.stderr)
        if not forcer:
            print("\n   Import refusé. Deux cas :\n"
                  "     • l'écart ci-dessus est le tien (modif dans l'UI) → relance"
                  " n8n-snapshot-live.py puis n8n-patch-strategy-2026.py ;\n"
                  "     • l'écart est une version précédente de ces mêmes patchs → relance avec"
                  " --forcer.", file=sys.stderr)
            return 1
        print("\n   → --forcer : on écrase quand même (écart lu et assumé).\n", file=sys.stderr)
    else:
        print("✓ Aucune dérive : la production correspond au snapshot ayant servi de base.\n")

    # 2. Aperçu.
    plan = []
    for fichier, prefix in A_METTRE_A_JOUR:
        gen = json.load(open(os.path.join(SRC, fichier), encoding="utf-8"))
        live = par_prefixe[prefix]
        if prefix in deja_importes:
            print(f"  = {prefix:16} déjà à jour en production ({len(live['nodes'])} nœuds) — ignoré")
            continue
        plan.append(("update", prefix, live["id"], gen, len(live["nodes"]), len(gen["nodes"])))
        print(f"  ↻ {prefix:16} {len(live['nodes']):>2} → {len(gen['nodes']):>2} nœuds   (id {live['id']})")
    for fichier, nom in A_CREER:
        gen = json.load(open(os.path.join(SRC, fichier), encoding="utf-8"))
        deja = [w for w in workflows if w["name"].startswith(nom)]
        if deja:
            print(f"  = {nom:16} existe déjà (id {deja[0]['id']}) — non recréé")
        else:
            plan.append(("create", nom, None, gen, 0, len(gen["nodes"])))
            print(f"  + {nom:16} à CRÉER — {len(gen['nodes'])} nœuds, laissé INACTIF")

    if not apply:
        print(f"\n{len(plan)} action(s). Relance avec --apply pour importer.")
        return 0

    # 3. Import.
    print()
    resultats = []
    for kind, nom, wid, gen, avant, apres in plan:
        payload = {k: gen[k] for k in CHAMPS_ACCEPTES if k in gen}
        payload["settings"] = {k: v for k, v in (gen.get("settings") or {}).items()
                               if k in SETTINGS_ACCEPTES}
        try:
            if kind == "create":
                cree = api("/api/v1/workflows", "POST", payload)
                wid = cree["id"]
                print(f"  ✓ {nom} créé (id {wid}, inactif)")
            else:
                api(f"/api/v1/workflows/{wid}", "PUT", payload)
                # Le cycle désactiver→activer réenregistre le webhook Telegram proprement.
                if a_un_webhook(gen["nodes"]):
                    api(f"/api/v1/workflows/{wid}/deactivate", "POST")
                    time.sleep(1)
                    api(f"/api/v1/workflows/{wid}/activate", "POST")
                    print(f"  ✓ {nom} mis à jour ({avant} → {apres} nœuds) + webhook réenregistré")
                else:
                    print(f"  ✓ {nom} mis à jour ({avant} → {apres} nœuds)")
            resultats.append((nom, wid, gen, kind))
        except RuntimeError as e:
            print(f"  ✗ {nom} — {e}", file=sys.stderr)
            print("\n     ROLLBACK : réimporter depuis backups/n8n-avant-strategie-20260806/",
                  file=sys.stderr)
            return 1

    # 4. Relecture — on vérifie ce qui est réellement en base, pas le code retour.
    print("\n── Vérification (relecture depuis n8n) ──")
    ok = True
    for nom, wid, gen, kind in resultats:
        relu = api(f"/api/v1/workflows/{wid}")
        memes = signature(relu["nodes"]) == signature(gen["nodes"])
        actif = relu.get("active")
        noco = sum(1 for n in relu["nodes"] if n["type"].endswith("nocoDb"))
        air = sum(1 for n in relu["nodes"] if "airtable" in n["type"].lower())
        sans_creds = [n["name"] for n in relu["nodes"]
                      if (n["type"].endswith("nocoDb") or "googleGemini" in n["type"])
                      and not n.get("credentials")]
        etat = "actif" if actif else "inactif"
        drapeau = "✓" if memes and not air and not sans_creds else "✗"
        if drapeau == "✗":
            ok = False
        print(f"  {drapeau} {nom:18} {len(relu['nodes']):>2} nœuds · {etat:7} · "
              f"NocoDB {noco} · Airtable {air}"
              + (f" · ⚠️ SANS CREDENTIALS : {sans_creds}" if sans_creds else "")
              + ("" if memes else " · ⚠️ contenu différent de ce qui a été envoyé"))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())

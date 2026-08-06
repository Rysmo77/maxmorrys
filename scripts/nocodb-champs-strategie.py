#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Crée dans NocoDB les champs dont la stratégie de contenu 2026 S2 a besoin.

    python3 scripts/nocodb-champs-strategie.py          # à blanc : montre ce qui serait fait
    python3 scripts/nocodb-champs-strategie.py --apply   # applique

Pourquoi un script et pas des `curl` : ça écrit dans la base de PRODUCTION. Il faut que ce soit
relisible, rejouable sans dégât, et vérifié après coup.

⚠️ **NocoDB refuse toute valeur hors options d'un `SingleSelect`** (`Invalid option(s) … provided
for column`), là où le `typecast` d'Airtable la créait à la volée. Un champ dont il manque une
option ne dégrade pas : il fait **échouer le nœud n8n**. D'où l'exigence de déclarer toutes les
options d'avance.

Idempotent : un champ déjà présent est laissé tel quel ; sur `Offre`, seules les options manquantes
sont ajoutées, en **préservant les `id` des options existantes** — les changer orphelinerait les
valeurs déjà saisies sur les lignes.
"""
import json
import os
import sys
import urllib.error
import urllib.request

# Palette reprise des SingleSelect existants, pour que les nouveaux champs ne détonnent pas.
PALETTE = ["#cfdffe", "#d0f1fd", "#c2f5e8", "#ffdaf6", "#ffdce5", "#fee2d5"]

# Les champs à garantir sur la table `Contenus`.
CHAMPS = [
    {
        "title": "Serie",
        "uidt": "SingleSelect",
        "options": ["RADAR", "ATELIER", "PREUVE", "COULISSES", "CERCLE", "OFFRE"],
        "pourquoi": "le rendez-vous éditorial d'un contenu",
    },
    {
        "title": "Cible",
        "uidt": "SingleSelect",
        "options": ["Apprenants", "Commerçants", "Mixte"],
        "pourquoi": "la piste d'audience servie",
    },
    {
        # Texte libre, et pas un SingleSelect : la série ATELIER doit pouvoir accueillir n'importe
        # quel outil du moment, y compris celui qui sortira le mois prochain. Un SingleSelect
        # rejetterait tout nom inconnu et refermerait la liste qu'on veut justement ouvrir.
        "title": "Outil",
        "uidt": "SingleLineText",
        "options": None,
        "pourquoi": "l'outil traité par un contenu ATELIER (anti-répétition + suivi)",
    },
]

# `Offre` existe déjà : il lui manque la ligne agence.
OPTIONS_A_AJOUTER = {"Offre": ["Agence"]}


def env(path=".env.local") -> dict:
    out = {}
    if not os.path.exists(path):
        return out
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def api(url: str, token: str, method="GET", body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "xc-token": token, "Content-Type": "application/json", "Accept": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read().decode()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode()[:500]
        raise RuntimeError(f"HTTP {e.code} sur {method} {url}\n      {detail}") from None


def main() -> int:
    apply = "--apply" in sys.argv
    cfg = env()
    base_url = (cfg.get("NOCODB_URL") or "").rstrip("/")
    token = cfg.get("NOCODB_TOKEN")
    table = cfg.get("NOCODB_TABLE_CONTENUS")
    if not (base_url and token and table):
        print("NOCODB_URL / NOCODB_TOKEN / NOCODB_TABLE_CONTENUS absents de .env.local", file=sys.stderr)
        return 1

    meta = api(f"{base_url}/api/v2/meta/tables/{table}", token)
    existants = {c["title"]: c for c in meta["columns"]}
    print(f"Table « {meta.get('title')} » — {len(existants)} colonnes")
    print(f"Mode : {'APPLICATION' if apply else 'à blanc (rien ne sera écrit)'}\n")

    actions = []

    # 1. Les champs manquants.
    for champ in CHAMPS:
        titre = champ["title"]
        if titre in existants:
            print(f"  = {titre:10} déjà présent ({existants[titre]['uidt']}) — inchangé")
            continue
        payload = {"title": titre, "column_name": titre, "uidt": champ["uidt"]}
        if champ["options"]:
            payload["colOptions"] = {"options": [
                {"title": o, "color": PALETTE[i % len(PALETTE)], "order": i + 1}
                for i, o in enumerate(champ["options"])
            ]}
        libelle = champ["uidt"] + (f" ({len(champ['options'])} options)" if champ["options"] else "")
        print(f"  + {titre:10} à CRÉER — {libelle} · {champ['pourquoi']}")
        actions.append(("create", titre, payload))

    # 2. Les options manquantes sur un champ existant.
    for titre, manquantes in OPTIONS_A_AJOUTER.items():
        col = existants.get(titre)
        if not col:
            print(f"  ⚠️ {titre:10} introuvable — impossible d'y ajouter {manquantes}")
            continue
        actuelles = [o["title"] for o in (col.get("colOptions") or {}).get("options", [])]
        a_ajouter = [o for o in manquantes if o not in actuelles]
        if not a_ajouter:
            print(f"  = {titre:10} contient déjà {manquantes} — inchangé")
            continue
        # On renvoie les options existantes AVEC leur `id` : les omettre les recréerait, et les
        # valeurs déjà posées sur les lignes pointeraient dans le vide.
        options = [
            {"id": o["id"], "title": o["title"], "color": o.get("color"), "order": o.get("order")}
            for o in col["colOptions"]["options"]
        ]
        for i, o in enumerate(a_ajouter):
            options.append({
                "title": o,
                "color": PALETTE[(len(options) + i) % len(PALETTE)],
                "order": len(options) + i + 1,
            })
        print(f"  ~ {titre:10} ajouter l'option {a_ajouter} (garde les {len(actuelles)} existantes)")
        actions.append(("patch", titre, {
            "title": titre, "column_name": col.get("column_name") or titre,
            "uidt": "SingleSelect", "colOptions": {"options": options},
            "_id": col["id"],
        }))

    if not actions:
        print("\n✓ Rien à faire — tout est déjà en place.")
        return 0
    if not apply:
        print(f"\n{len(actions)} action(s) en attente. Relance avec --apply pour les appliquer.")
        return 0

    print()
    for kind, titre, payload in actions:
        try:
            if kind == "create":
                api(f"{base_url}/api/v2/meta/tables/{table}/columns", token, "POST", payload)
            else:
                col_id = payload.pop("_id")
                api(f"{base_url}/api/v2/meta/columns/{col_id}", token, "PATCH", payload)
            print(f"  ✓ {titre}")
        except RuntimeError as e:
            print(f"  ✗ {titre} — {e}", file=sys.stderr)
            return 1

    # 3. Relecture : on ne se fie pas au code retour, on vérifie ce qui est réellement en base.
    print("\n── Vérification (relecture du schéma) ──")
    meta = api(f"{base_url}/api/v2/meta/tables/{table}", token)
    cols = {c["title"]: c for c in meta["columns"]}
    ok = True
    attendu = {c["title"]: c for c in CHAMPS}
    for titre, champ in attendu.items():
        c = cols.get(titre)
        if not c:
            print(f"  ✗ {titre} ABSENT après création"); ok = False; continue
        if c["uidt"] != champ["uidt"]:
            print(f"  ✗ {titre} type {c['uidt']} au lieu de {champ['uidt']}"); ok = False; continue
        if champ["options"]:
            got = [o["title"] for o in (c.get("colOptions") or {}).get("options", [])]
            absents = [o for o in champ["options"] if o not in got]
            if absents:
                print(f"  ✗ {titre} options manquantes : {absents}"); ok = False; continue
            print(f"  ✓ {titre:10} {c['uidt']} → {', '.join(got)}")
        else:
            print(f"  ✓ {titre:10} {c['uidt']}")
    for titre, manquantes in OPTIONS_A_AJOUTER.items():
        got = [o["title"] for o in (cols.get(titre, {}).get("colOptions") or {}).get("options", [])]
        absents = [o for o in manquantes if o not in got]
        if absents:
            print(f"  ✗ {titre} options manquantes : {absents}"); ok = False
        else:
            print(f"  ✓ {titre:10} SingleSelect → {', '.join(got)}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())

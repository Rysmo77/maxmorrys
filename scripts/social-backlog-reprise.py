#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Remet la file de contenus sociaux à niveau après la réparation de la chaîne (2026-08-20).

Contexte : entre le 7 et le 20 août, le prompt de rédaction de WF-SOCIAL-03 partait en littéral
(il lui manquait le `=` qui fait d'une chaîne une expression n8n). Gemini n'a jamais vu les titres
et a écrit 26 fois la même légende « commerce de quartier », pendant que la créa, elle, affichait
le vrai titre — d'où des images qui ne collaient pas aux textes. Les posts concernés sont encore
en `prêt_à_valider`, et leurs images pointent sur Cloud Storage, mort depuis le passage au plan
Spark du 13 août (403).

Ce script fait deux choses, dans cet ordre :

1. **Redate** chaque post sur la grille hebdomadaire de `docs/STRATEGIE_COMMUNICATION_2026.md`,
   au premier créneau libre de même (Reseau, Format_Post) à partir du lundi suivant. Sans ça,
   toutes les dates étant dans le passé, chaque ✅ Telegram part au cron des 15 minutes : la file
   entière sortirait d'un coup.
2. **Repasse en `planifié`** et vide `Blotato_PostSubmissionID` — c'est ce champ qui marque un post
   comme déjà notifié ; tant qu'il est rempli, WF-SOCIAL-07 ne renverra pas la carte Telegram.
   Le cycle reprend alors du début : WF-03 réécrit, WF-04 réillustre, WF-07 renotifie.

À lancer **après** l'import des workflows corrigés, jamais avant : sinon WF-03 réécrirait avec le
prompt cassé, et WF-04 appellerait un moteur de rendu qui n'existe plus.

S'exécute **sur le VPS** (NocoDB n'écoute que sur la boucle locale) :

    ssh maxmorrys-vps 'sudo python3 - --apply' < scripts/social-backlog-reprise.py

Sans `--apply`, n'écrit rien et se contente d'afficher le plan.
"""
import json
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

NOCODB = "http://127.0.0.1:8091"
T_CONTENUS = "m3wim4coagaoot7"
JETON = "/opt/maxmorrys-stack/.nocodb-api-token"

# Grille hebdomadaire — docs/STRATEGIE_COMMUNICATION_2026.md §5 et §6, identique à celle que
# `TH — Décliner (build)` applique aux semaines à venir. [jourOffset, heure, reseau, format].
# Africa/Dakar = UTC+0 : l'heure locale et l'heure stockée coïncident, sans conversion.
GRILLE = [
    (0, 9, "linkedin", "post"), (0, 12, "ig", "story"), (0, 18, "ig", "carrousel"),
    (1, 10, "linkedin", "carrousel"), (1, 12, "ig", "story"), (1, 12, "fb", "carrousel"),
    (1, 19, "ig", "carrousel"),
    (2, 9, "fb", "post"), (2, 12, "ig", "story"), (2, 18, "ig", "post"),
    (3, 11, "ig", "carrousel"), (3, 12, "ig", "story"), (3, 18, "fb", "community_post"),
    (4, 10, "linkedin", "post"), (4, 12, "ig", "story"), (4, 17, "x", "thread"),
    (5, 11, "ig", "carrousel"), (5, 12, "ig", "story"), (5, 18, "fb", "post"),
    (6, 10, "linkedin", "post"), (6, 12, "ig", "story"),
]

# Le board a retiré TikTok de la grille le 2026-08-06 (« zéro vidéo, zéro TikTok ») et aucun jeton
# TikTok n'existe en Config : redater ces posts les enverrait juste échouer à la publication.
# On les gare en `échec`, avec la raison écrite — un statut réversible, pas une suppression.
SANS_CRENEAU = {"tiktok"}

SEMAINES_MAX = 8  # borne de sécurité : au-delà, c'est que la file déborde et mérite un arbitrage


def jeton() -> str:
    with open(JETON, encoding="utf-8") as fh:
        return fh.read().strip().split("=")[-1].strip()


def appel(methode: str, chemin: str, corps=None, tok: str = ""):
    data = json.dumps(corps).encode() if corps is not None else None
    req = urllib.request.Request(NOCODB + chemin, data=data, method=methode,
                                 headers={"xc-token": tok, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as fh:
        return json.loads(fh.read().decode())


def creneaux(depart: datetime):
    """Les créneaux de la grille, semaine après semaine, à partir du lundi `depart`."""
    for semaine in range(SEMAINES_MAX):
        lundi = depart + timedelta(weeks=semaine)
        for jour, heure, reseau, format_post in GRILLE:
            yield (reseau, format_post), lundi + timedelta(days=jour, hours=heure)


def main() -> int:
    applique = "--apply" in sys.argv
    tok = jeton()

    lignes = appel("GET", f"/api/v2/tables/{T_CONTENUS}/records"
                          "?where=%28Status%2Ceq%2Cpr%C3%AAt_%C3%A0_valider%29&limit=500", tok=tok)["list"]
    lignes.sort(key=lambda r: r["Id"])
    print(f"{len(lignes)} contenus en attente de validation")

    # Les créneaux déjà pris par du contenu programmé, pour ne pas doubler un rendez-vous.
    occupes = set()
    for statut in ("planifié", "rédigé", "image_needed", "validé"):
        deja = appel("GET", f"/api/v2/tables/{T_CONTENUS}/records"
                            f"?where=%28Status%2Ceq%2C{urllib.parse.quote(statut)}%29&limit=500", tok=tok)["list"]
        for r in deja:
            if r.get("Date_Publication_Prevue"):
                occupes.add(str(r["Date_Publication_Prevue"])[:16])

    aujourdhui = datetime.now(timezone.utc)
    lundi = (aujourdhui + timedelta(days=(7 - aujourdhui.weekday()) or 7)).replace(
        hour=0, minute=0, second=0, microsecond=0)

    libres = {}
    for cle, quand in creneaux(lundi):
        if quand.strftime("%Y-%m-%d %H:%M") in occupes:
            continue
        libres.setdefault(cle, []).append(quand)

    maj, gares, sans_place, deja = [], [], [], []
    for r in lignes:
        # Un post dont les créas sont déjà sur `media.maxmorrys.me` est passé par la chaîne réparée :
        # le refaire ne ferait que gaspiller des rendus et lui redonner une date.
        if "media.maxmorrys.me" in str(r.get("Visuels_URLs") or ""):
            deja.append(r)
            continue
        cle = (str(r.get("Reseau") or "").lower(), str(r.get("Format_Post") or "").lower())
        if cle[0] in SANS_CRENEAU:
            gares.append(r)
            continue
        dispo = libres.get(cle)
        if not dispo:
            sans_place.append((r, cle))
            continue
        quand = dispo.pop(0)
        maj.append({
            "Id": r["Id"],
            "Date_Publication_Prevue": quand.strftime("%Y-%m-%d %H:%M:%S+00:00"),
            "Status": "planifié",
            # Vidé pour que WF-SOCIAL-07 reprenne le post et renvoie une carte Telegram fraîche.
            "Blotato_PostSubmissionID": "",
        })
        print(f"  {r['Id']:>4}  {cle[0]:<9}{cle[1]:<15} → {quand:%a %d %b %Hh}  {str(r.get('Titre'))[:44]}")

    for r in deja:
        print(f"  {r['Id']:>4}  déjà refait par la chaîne réparée — laissé tel quel")
    for r in gares:
        print(f"  {r['Id']:>4}  garé en échec (hors grille, aucun jeton) : {str(r.get('Titre'))[:44]}")
    for r, cle in sans_place:
        print(f"  ⚠️ {r['Id']:>4}  aucun créneau {cle} sur {SEMAINES_MAX} semaines — laissé en l'état")

    if not applique:
        print(f"\nSimulation. {len(maj)} à replanifier, {len(gares)} à garer. Relancer avec --apply.")
        return 0

    for lot in [maj[i:i + 20] for i in range(0, len(maj), 20)]:
        appel("PATCH", f"/api/v2/tables/{T_CONTENUS}/records", lot, tok=tok)
    if gares:
        appel("PATCH", f"/api/v2/tables/{T_CONTENUS}/records", [
            {"Id": r["Id"], "Status": "échec",
             "Erreurs": "Hors grille 2026 S2 (le board a retiré TikTok le 2026-08-06) et aucun "
                        "jeton TikTok en Config. Repasser en planifié si la décision change."}
            for r in gares], tok=tok)
    print(f"\n✓ {len(maj)} contenus replanifiés et remis en rédaction, {len(gares)} garés.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

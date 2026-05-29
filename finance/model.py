#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Moteur de modele financier — Max-Morrys (My Onoma SARL)
Projections 5 ans, 3 scenarios (prudent / base / optimiste), pre-lancement (0 client An 1).
Tous montants en FCFA (XOF). Genere les CSV dans finance/ et imprime une synthese.

Hypotheses 100% explicites ci-dessous. Tarifs verifies dans le code applicatif.
"""
import csv
import os

EUR = 655.957  # parite fixe XOF/EUR

YEARS = [1, 2, 3, 4, 5]

# ---------------------------------------------------------------------------
# 1. TARIFS (verifies dans le code)
# ---------------------------------------------------------------------------
CLUB_PRICE = 19_900           # /an  (ClubSubscriptionGate.tsx)
RYSMO_LITE = 3_000            # /mois (RysmoStoreTab.tsx)
RYSMO_PRO = 7_500             # /mois (RysmoStoreTab.tsx)
RYSMO_BLENDED_MONTHLY = round(0.70 * RYSMO_LITE + 0.30 * RYSMO_PRO)  # mix 70/30 = 4350
RYSMO_PACK_AVG = 1_500       # panier moyen pack (mix 500/1500/3500, skew Regular)

# ---------------------------------------------------------------------------
# 2. DRIVERS PAR SCENARIO
# ---------------------------------------------------------------------------
SCEN = {
    "prudent": {
        # Nouveaux inscrits gratuits / an (funnel haut)
        "new_free": [1_500, 3_500, 6_000, 9_000, 13_000],
        # Formations
        "conv_buyer": 0.025,        # inscrits -> acheteur formation
        "courses_per_buyer": 1.10,  # cours achetes / acheteur / an
        "asp": 110_000,             # prix moyen pondere (mix promo)
        # Club (recurrent annuel)
        "club_join_rate": 0.15,     # % des acheteurs formation rejoignant le Club
        "club_retention": 0.60,     # renouvellement annuel
        # Rysmo+ (abonnement mensuel)
        "rysmo_sub_rate": 0.015,    # % inscrits demarrant un abo / an
        "rysmo_sub_months": 4.0,    # duree moyenne active (mois)
        # Packs Rysmo
        "pack_rate": 0.040,         # % inscrits achetant des packs / an
        "pack_freq": 1.5,           # achats / acheteur de pack / an
        # Couts
        "personnel": [4_500_000, 8_400_000, 13_200_000, 19_200_000, 27_000_000],
        "mkt_pct": 0.18, "mkt_floor": [1_500_000, 2_000_000, 2_500_000, 3_000_000, 3_500_000],
        "outils": [600_000, 840_000, 1_080_000, 1_320_000, 1_560_000],
        "gna": [1_200_000, 1_500_000, 1_900_000, 2_400_000, 3_000_000],
        "apport": 6_000_000,
    },
    "base": {
        "new_free": [2_500, 6_000, 12_000, 20_000, 30_000],
        "conv_buyer": 0.040,
        "courses_per_buyer": 1.25,
        "asp": 125_000,
        "club_join_rate": 0.25,
        "club_retention": 0.70,
        "rysmo_sub_rate": 0.025,
        "rysmo_sub_months": 5.0,
        "pack_rate": 0.070,
        "pack_freq": 2.0,
        "personnel": [5_400_000, 11_400_000, 19_800_000, 28_800_000, 39_600_000],
        "mkt_pct": 0.22, "mkt_floor": [2_000_000, 3_000_000, 4_000_000, 5_000_000, 6_000_000],
        "outils": [720_000, 1_080_000, 1_440_000, 1_800_000, 2_160_000],
        "gna": [1_500_000, 2_000_000, 2_600_000, 3_400_000, 4_200_000],
        "apport": 9_000_000,
    },
    "optimiste": {
        "new_free": [4_000, 11_000, 24_000, 42_000, 65_000],
        "conv_buyer": 0.060,
        "courses_per_buyer": 1.40,
        "asp": 135_000,
        "club_join_rate": 0.35,
        "club_retention": 0.80,
        "rysmo_sub_rate": 0.040,
        "rysmo_sub_months": 6.0,
        "pack_rate": 0.100,
        "pack_freq": 2.5,
        "personnel": [7_200_000, 16_800_000, 30_000_000, 45_600_000, 64_800_000],
        "mkt_pct": 0.25, "mkt_floor": [3_000_000, 5_000_000, 7_000_000, 10_000_000, 13_000_000],
        "outils": [900_000, 1_500_000, 2_100_000, 2_700_000, 3_300_000],
        "gna": [1_800_000, 2_500_000, 3_400_000, 4_600_000, 6_000_000],
        "apport": 14_000_000,
    },
}

# Couts variables (COGS)
BICTORYS_FEE = 0.030          # 3% commission encaissement
INFRA_PER_FREE = 300          # FCFA / inscrit gratuit / an (Gemini gratuit + Firebase + bande passante)
INFRA_PER_RYSMO_SUB = 4_000   # FCFA / abo Rysmo+ / an (usage Gemini intensif)


def compute(scn):
    p = SCEN[scn]
    rows = []  # par annee
    club_active_prev = 0
    for i, y in enumerate(YEARS):
        free = p["new_free"][i]
        # Formations
        buyers = free * p["conv_buyer"]
        courses = buyers * p["courses_per_buyer"]
        rev_form = courses * p["asp"]
        # Club : nouveaux + retenus
        club_new = buyers * p["club_join_rate"]
        club_active = club_new + club_active_prev * p["club_retention"]
        rev_club = club_active * CLUB_PRICE
        club_active_prev = club_active
        # Rysmo+ abonnements
        rysmo_new_subs = free * p["rysmo_sub_rate"]
        rev_rysmo_sub = rysmo_new_subs * p["rysmo_sub_months"] * RYSMO_BLENDED_MONTHLY
        # Packs
        pack_buyers = free * p["pack_rate"]
        pack_purchases = pack_buyers * p["pack_freq"]
        rev_packs = pack_purchases * RYSMO_PACK_AVG
        rev_total = rev_form + rev_club + rev_rysmo_sub + rev_packs

        # COGS
        cogs_pay = rev_total * BICTORYS_FEE
        cogs_infra = free * INFRA_PER_FREE + rysmo_new_subs * INFRA_PER_RYSMO_SUB
        cogs = cogs_pay + cogs_infra
        gross = rev_total - cogs

        # OPEX
        personnel = p["personnel"][i]
        mkt = max(p["mkt_floor"][i], rev_total * p["mkt_pct"])
        outils = p["outils"][i]
        gna = p["gna"][i]
        opex = personnel + mkt + outils + gna
        ebitda = gross - opex
        # Pas d'amortissement significatif (actif quasi nul) -> resultat net ~ ebitda - IS
        tax = max(0, ebitda) * 0.30   # IS Senegal 30% sur benefice
        net = ebitda - tax

        rows.append({
            "year": y, "free": free,
            "buyers": buyers, "courses": courses,
            "club_active": club_active,
            "rysmo_new_subs": rysmo_new_subs,
            "pack_buyers": pack_buyers, "pack_purchases": pack_purchases,
            "rev_form": rev_form, "rev_club": rev_club,
            "rev_rysmo_sub": rev_rysmo_sub, "rev_packs": rev_packs,
            "rev_total": rev_total,
            "cogs_pay": cogs_pay, "cogs_infra": cogs_infra, "cogs": cogs,
            "gross": gross,
            "personnel": personnel, "mkt": mkt, "outils": outils, "gna": gna, "opex": opex,
            "ebitda": ebitda, "tax": tax, "net": net,
        })
    return rows


def fmt(n):
    return f"{round(n):,}".replace(",", " ")


def eur(n):
    return f"{n/EUR:,.0f}".replace(",", " ")


RESULTS = {s: compute(s) for s in SCEN}

# ---------------------------------------------------------------------------
# CSV
# ---------------------------------------------------------------------------
OUT = os.path.dirname(os.path.abspath(__file__))


def w(name, header, data):
    with open(os.path.join(OUT, name), "w", newline="", encoding="utf-8") as f:
        wr = csv.writer(f)
        wr.writerow(header)
        for r in data:
            wr.writerow(r)


# hypotheses.csv
hyp_header = ["Driver", "Prudent", "Base", "Optimiste"]
hyp = [
    ["Nouveaux inscrits gratuits An1", SCEN["prudent"]["new_free"][0], SCEN["base"]["new_free"][0], SCEN["optimiste"]["new_free"][0]],
    ["Nouveaux inscrits gratuits An5", SCEN["prudent"]["new_free"][4], SCEN["base"]["new_free"][4], SCEN["optimiste"]["new_free"][4]],
    ["Taux conversion acheteur formation", "2,5%", "4,0%", "6,0%"],
    ["Cours / acheteur / an", "1,10", "1,25", "1,40"],
    ["Prix moyen formation (ASP, FCFA)", 110000, 125000, 135000],
    ["Taux adhesion Club (% acheteurs)", "15%", "25%", "35%"],
    ["Retention annuelle Club", "60%", "70%", "80%"],
    ["Taux abonnement Rysmo+ (% inscrits)", "1,5%", "2,5%", "4,0%"],
    ["Duree moyenne abo Rysmo+ (mois)", "4,0", "5,0", "6,0"],
    ["Taux achat packs Rysmo (% inscrits)", "4%", "7%", "10%"],
    ["Achats packs / acheteur / an", "1,5", "2,0", "2,5"],
    ["Commission Bictorys", "3,0%", "3,0%", "3,0%"],
    ["IS Senegal", "30%", "30%", "30%"],
    ["Apport / financement initial (FCFA)", SCEN["prudent"]["apport"], SCEN["base"]["apport"], SCEN["optimiste"]["apport"]],
]
w("hypotheses.csv", hyp_header, hyp)

# revenus_par_flux_5ans.csv
rev_header = ["Scenario", "Annee", "Formations", "Club Digitos", "Rysmo+ abos", "Packs Rysmo", "Total CA"]
rev_data = []
for s in SCEN:
    for r in RESULTS[s]:
        rev_data.append([s, f"An{r['year']}", round(r["rev_form"]), round(r["rev_club"]),
                         round(r["rev_rysmo_sub"]), round(r["rev_packs"]), round(r["rev_total"])])
w("revenus_par_flux_5ans.csv", rev_header, rev_data)

# compte_resultat_5ans.csv (toutes lignes, 3 scenarios)
pl_header = ["Scenario", "Annee", "CA total", "COGS paiement", "COGS infra/IA", "Marge brute",
             "Personnel", "Marketing", "Outils", "G&A", "Total OPEX", "EBITDA", "IS (30%)", "Resultat net"]
pl_data = []
for s in SCEN:
    for r in RESULTS[s]:
        pl_data.append([s, f"An{r['year']}", round(r["rev_total"]), round(r["cogs_pay"]),
                        round(r["cogs_infra"]), round(r["gross"]), round(r["personnel"]),
                        round(r["mkt"]), round(r["outils"]), round(r["gna"]), round(r["opex"]),
                        round(r["ebitda"]), round(r["tax"]), round(r["net"])])
w("compte_resultat_5ans.csv", pl_header, pl_data)

# cashflow_tresorerie_5ans.csv (base encaissement: net + apport An1)
cf_header = ["Scenario", "Annee", "Encaissements (CA)", "Decaissements (COGS+OPEX+IS)",
             "Flux net annuel", "Apport", "Tresorerie fin de periode"]
cf_data = []
for s in SCEN:
    treso = 0
    for i, r in enumerate(RESULTS[s]):
        encaiss = r["rev_total"]
        decaiss = r["cogs"] + r["opex"] + r["tax"]
        flux = encaiss - decaiss
        apport = SCEN[s]["apport"] if i == 0 else 0
        treso = treso + flux + apport
        cf_data.append([s, f"An{r['year']}", round(encaiss), round(decaiss), round(flux),
                        apport, round(treso)])
w("cashflow_tresorerie_5ans.csv", cf_header, cf_data)

# scenarios_comparatif.csv
cmp_header = ["Indicateur"] + [f"{s} An{y}" for s in SCEN for y in YEARS]
def cmp_row(label, key):
    row = [label]
    for s in SCEN:
        for i in range(5):
            row.append(round(RESULTS[s][i][key]))
    return row
cmp_data = [cmp_row("CA total", "rev_total"), cmp_row("EBITDA", "ebitda"), cmp_row("Resultat net", "net")]
# tresorerie finale par scenario/annee
trow = ["Tresorerie fin periode"]
for s in SCEN:
    treso = 0
    for i, r in enumerate(RESULTS[s]):
        flux = r["rev_total"] - (r["cogs"] + r["opex"] + r["tax"])
        treso += flux + (SCEN[s]["apport"] if i == 0 else 0)
        trow.append(round(treso))
cmp_data.append(trow)
w("scenarios_comparatif.csv", cmp_header, cmp_data)

# tresorerie_mensuelle_an1.csv (scenario base, ramp de lancement)
base_y1 = RESULTS["base"][0]
# ramp mensuel (poids) : lancement progressif
ramp = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 16]  # somme = 94
ramp_sum = sum(ramp)
months = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"]
mh_header = ["Mois", "Encaissements", "COGS", "Personnel", "Marketing", "Outils+G&A", "Flux net", "Tresorerie cumulee"]
mh_data = []
apport_b = SCEN["base"]["apport"]
treso = apport_b
fixed_monthly_personnel = base_y1["personnel"] / 12
fixed_monthly_outils_gna = (base_y1["outils"] + base_y1["gna"]) / 12
for i, m in enumerate(months):
    wgt = ramp[i] / ramp_sum
    enc = base_y1["rev_total"] * wgt
    cogs_m = base_y1["cogs"] * wgt
    mkt_m = base_y1["mkt"] * wgt
    flux = enc - cogs_m - fixed_monthly_personnel - mkt_m - fixed_monthly_outils_gna
    apport_m = apport_b if i == 0 else 0
    label_apport = ""
    treso += flux
    mh_data.append([m, round(enc), round(cogs_m), round(fixed_monthly_personnel),
                    round(mkt_m), round(fixed_monthly_outils_gna), round(flux), round(treso)])
# ajouter ligne apport en tete (info)
with open(os.path.join(OUT, "tresorerie_mensuelle_an1.csv"), "w", newline="", encoding="utf-8") as f:
    wr = csv.writer(f)
    wr.writerow([f"Apport initial (Jan): {apport_b} FCFA — tresorerie de depart"])
    wr.writerow(mh_header)
    for r in mh_data:
        wr.writerow(r)

# ---------------------------------------------------------------------------
# SYNTHESE IMPRIMEE (pour le narratif)
# ---------------------------------------------------------------------------
print("=" * 78)
for s in SCEN:
    print(f"\n### SCENARIO {s.upper()}")
    treso = 0
    for i, r in enumerate(RESULTS[s]):
        flux = r["rev_total"] - (r["cogs"] + r["opex"] + r["tax"])
        treso += flux + (SCEN[s]["apport"] if i == 0 else 0)
        print(f"An{r['year']}: CA={fmt(r['rev_total'])}  (Form {fmt(r['rev_form'])} | Club {fmt(r['rev_club'])} | Rysmo+ {fmt(r['rev_rysmo_sub'])} | Packs {fmt(r['rev_packs'])})")
        print(f"      MargeBrute={fmt(r['gross'])}  OPEX={fmt(r['opex'])}  EBITDA={fmt(r['ebitda'])}  Net={fmt(r['net'])}  Treso={fmt(treso)}")
        print(f"      [acheteurs {r['buyers']:.0f} | club actifs {r['club_active']:.0f} | rysmo subs {r['rysmo_new_subs']:.0f}]")

print("\n--- Tresorerie mensuelle An1 (base) ---")
for r in mh_data:
    print(f"{r[0]}: enc={fmt(r[1])} flux={fmt(r[6])} treso={fmt(r[7])}")
print(f"\nPoint bas tresorerie An1 (base): {fmt(min(r[7] for r in mh_data))}")
print("\nCSV generes dans finance/")

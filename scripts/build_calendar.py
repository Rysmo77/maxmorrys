#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Génère calendrier-prompts-youtube-maxmorrys.ics
266 événements (Juillet 2026 → janvier 2027), un ou plusieurs par jour, avec TOUS
les prompts intégrés (verbatim depuis PROMPTS_YOUTUBE_MAXMORRYS.md) et la distribution.

Par vidéo (samedi de publication = S) :
  SCRIPT Lun(S-5) · P9 Mar(S-4) · P10 Mer(S-3) · Montage Jeu(S-2) · PUBLICATION Sam(S)
  · Engagement Dim(S+1) · Podcast Lun(S+2) · Short#1 Mer(S+4) · Short#2 Ven(S+6) · Short#3 Dim(S+8)
+ 1 P0 Idéation par mois.

Lancer : python3 scripts/build_calendar.py
"""

import os

# ----------------------------------------------------------------------------
# 1) PROMPTS VERBATIM (depuis PROMPTS_YOUTUBE_MAXMORRYS.md)
# ----------------------------------------------------------------------------

MAITRE = """# RÔLE
Tu es Max-Morrys Eyoum, créateur de contenu et expert en marketing digital basé à Dakar. Tu es LE youtubeur de référence en marketing digital, SEO et intelligence artificielle pour l'Afrique de l'Ouest francophone (Sénégal, Côte d'Ivoire, Cameroun) et la diaspora. Tu es à la fois pédagogue, stratège et créateur tendance. Ta mission : aider les entrepreneurs, créateurs et PME à transformer leurs idées en business rentables grâce au digital, "sans blabla".

# TON IDENTITÉ & TA CRÉDIBILITÉ (à utiliser avec parcimonie, jamais te vanter)
- Tu t'es presque auto-formé au marketing digital depuis 2021. Ta force = passion authentique + apprentissage constant.
- Résultats réels que tu peux citer comme preuves : +1 790 % de trafic web et +8 000 abonnés organiques en 18 mois pour une organisation que tu as accompagnée ; plusieurs plateformes web et workflows IA en production.
- Tu vis à Dakar, à la croisée du marketing, de l'IA, du produit web et des partenariats à impact.

# TON STYLE (NON NÉGOCIABLE)
- Français standard, TUTOIEMENT systématique ("tu", "ta", "tes"). Parle comme à un ami entrepreneur.
- Direct, SANS BLABLA : du concret, des exemples réels, zéro jargon inutile, zéro théorie abstraite.
- Phrases courtes et punchy. Langage oral, énergique, mais professionnel.
- Toujours orienté ACTION : chaque idée se termine par "la prochaine étape concrète".
- Valorise les résultats MESURABLES ("4x plus de visiteurs", "en 3 mois", "+1790%").
- TOUCHES LOCALES LÉGÈRES (à doser, ~1 à 3 par vidéo, sans forcer) : références à Dakar/Abidjan/Douala, Wave & Orange Money, mobile money, PME et boutiques locales, WhatsApp Business, marché local, réalités de l'entrepreneur africain. PAS de patois ni de créole : français standard accessible à toute la francophonie + diaspora.
- Tu animes une COMMUNAUTÉ : tu interpelles, tu poses des questions, tu crées de l'engagement, tu n'es pas qu'un prof.

# CONTRAINTE AUDIO / PODCAST
L'audio de chaque vidéo est republié en podcast. Donc le texte A-Roll (ce que tu dis) doit être COMPRÉHENSIBLE À L'OREILLE SEULE, sans dépendre des visuels. Quand tu montres quelque chose à l'écran, dis-le aussi à voix haute.

# FORMAT DE SORTIE OBLIGATOIRE
Quand je te demande un script vidéo, réponds EXACTEMENT dans cette structure, en français :

═══════════════════════════════════
🎯 TITRE (3 options cliquables, < 60 caractères)
1. ...
2. ...
3. ...

🧲 ACCROCHE / HOOK (0–15 s) — la première phrase doit donner envie de rester. Donne le texte EXACT à dire.

⏱️ DURÉE CIBLE : {indiquée par la demande}

📦 PROMESSE DE LA VIDÉO (1 phrase) : ce que le spectateur saura faire à la fin.

───────────────────────────────────
DÉCOUPAGE EN SCÈNES
Pour CHAQUE scène, utilise ce gabarit :

▶️ SCÈNE [n] — [titre court de la scène] ([timecode approx.])
🎙️ A-ROLL (face caméra) : [le texte EXACT, mot pour mot, que Max dit face caméra]
🎥 B-ROLL : [plans de coupe / captures d'écran / visuels à filmer ou insérer pour illustrer]
🔤 TEXTE À L'ÉCRAN : [titre/incrustation qui apparaît + à quel moment de la scène]
✂️ TRANSITION → [type de transition vers la scène suivante : cut sec, zoom punch-in, swipe, fondu, whip pan, J-cut audio...]

(Répète pour toutes les scènes : Hook → Intro → corps en 3 à 6 blocs → récap → CTA.)

───────────────────────────────────
📣 CTA (appel à l'action) : formulation exacte, naturelle, non agressive (ex : commenter, s'abonner, télécharger la ressource, rejoindre le Club des Digitos, s'inscrire à une formation — choisis le plus pertinent, UN SEUL principal).

✂️ DÉCLINAISONS SHORTS (2 à 3) : pour chaque Short, indique le segment du script à réutiliser, le hook vertical (< 3 s) et le texte à l'écran.

🎧 NOTE PODCAST : 1–2 phrases d'adaptation pour la version audio (intro parlée, ou précision à ajouter à l'oral car un visuel manque).

🖼️ IDÉE MINIATURE : visuel + 3 à 4 mots max du texte de miniature.
═══════════════════════════════════

# RÈGLES DE QUALITÉ
- Hook = la chose la plus importante. Promesse claire + tension/curiosité dans les 5 premières secondes. Jamais "Salut c'est Max, aujourd'hui on va parler de...".
- Rythme : une idée par scène, pas de remplissage. Coupe tout ce qui n'apporte rien.
- Donne des exemples CHIFFRÉS et des cas concrets adaptés à l'Afrique francophone.
- Insère au moins 1 "pattern interrupt" (changement de plan, question directe, stat choc) toutes les 30–40 s.
- N'invente pas de faux chiffres : si tu as besoin d'un chiffre d'exemple, présente-le comme un exemple ("imagine une boutique à Dakar qui...").

Quand tu as compris, réponds juste : "Prêt. Donne-moi le sujet de la vidéo." et attends ma demande."""

P0 = """En tant que Max-Morrys, propose-moi 20 idées de vidéos YouTube sur le thème : "{THEME}".

Contraintes :
- Adaptées à l'Afrique de l'Ouest francophone (entrepreneurs, créateurs, PME).
- Mix de formats : pédagogie (tutos), divertissement, opinion/débat, étude de cas, storytelling, animation de communauté.
- Surfe sur les tendances ACTUELLES (IA, automatisation, side business, mobile money, e-commerce local).
- Chaque idée doit avoir un fort potentiel de clic.

Pour chaque idée, donne sous forme de tableau :
| # | Titre cliquable (<60 car.) | Type de contenu | Angle/Hook en 1 phrase | Pourquoi ça peut exploser |

Termine par : les 3 idées que tu tournerais EN PREMIER et pourquoi."""

P1 = """Écris-moi le script complet d'une vidéo TUTORIEL au format de sortie obligatoire.

- Sujet : "{SUJET}"
- Promesse : à la fin, le spectateur sait {résultat concret}.
- Durée cible : {DUREE}.
- Niveau audience : {NIVEAU}.
- Étapes à couvrir si tu en as : {liste optionnelle, sinon propose la meilleure méthode}.

Exigences spécifiques :
- Structure en étapes numérotées claires (Étape 1, 2, 3...).
- Pour chaque étape, le B-Roll doit montrer une capture d'écran ou démonstration concrète.
- Inclure 1 erreur fréquente à éviter + 1 astuce de pro (touche locale si pertinent).
- CTA : proposer une ressource gratuite ou la formation Max-Morrys correspondante."""

P2 = """Écris-moi le script complet d'une vidéo de DÉCRYPTAGE D'ACTUALITÉ au format de sortie obligatoire.

- Tendance / actu à décrypter : "{SUJET}"
- Angle de Max-Morrys : {NIVEAU}.
- Durée cible : {DUREE}.

Exigences :
- Hook qui crée l'urgence ("Si tu fais du business en ligne, ce truc va te concerner").
- Explique la tendance SIMPLEMENT (vulgarise pour un débutant).
- 3 implications concrètes pour un entrepreneur/créateur en Afrique francophone.
- 1 prédiction ou prise de position assumée de Max pour générer du débat en commentaire.
- B-Roll : captures de l'actu, démos, exemples.
- CTA : "Dis-moi en commentaire ce que tu en penses"."""

P3 = """Écris-moi le script complet d'une vidéo ÉTUDE DE CAS au format de sortie obligatoire.

- Cas : "{SUJET}".
- Résultat principal mis en avant : {NIVEAU}.
- Durée cible : {DUREE}.

Exigences :
- Structure narrative : Situation de départ → Problème → Stratégie étape par étape → Résultats chiffrés → Leçons reproductibles.
- Chaque chiffre annoncé doit être appuyé par un B-Roll (graphique, dashboard, capture).
- Rendre la méthode REPRODUCTIBLE : le spectateur doit pouvoir l'appliquer à sa propre boutique/PME.
- Touche locale : ancrer le cas dans un contexte africain (boutique Dakar, PME, e-commerce WhatsApp...).
- CTA : ressource ou formation pour appliquer la méthode."""

P4 = """Écris-moi le script complet d'une vidéo STORYTELLING / INSPIRANTE au format de sortie obligatoire.

- Histoire : "{SUJET}".
- Leçon centrale que le spectateur doit retenir : {NIVEAU}.
- Durée cible : {DUREE}.

Exigences :
- Ton intime, authentique, vulnérable mais inspirant. Max se livre.
- Structure : moment fort d'ouverture → contexte → péripéties/échecs → déclic → ce que ça t'apprend, à toi spectateur.
- B-Roll : photos d'archives, plans d'ambiance Dakar, lifestyle créateur, vieux écrans/projets.
- Connecter l'histoire perso à l'audience : "si tu débutes aujourd'hui, voilà ce que je ferais à ta place".
- CTA doux : s'abonner pour suivre l'aventure / rejoindre la communauté."""

P5 = """Écris-moi le script complet d'une vidéo OPINION / COUP DE GUEULE au format de sortie obligatoire.

- Prise de position : "{SUJET}".
- Durée cible : {DUREE}.

Exigences :
- Hook polarisant mais défendable (jamais gratuit, toujours étayé).
- Argumentation en 3 points avec preuves/exemples.
- Anticiper l'objection principale et y répondre.
- Nuance finale pour rester crédible et pro.
- Volontairement conçu pour générer des commentaires et du débat.
- CTA : "Team d'accord ou team pas d'accord ? Commentaire."."""

P6 = """Écris-moi le script complet d'une vidéo FORMAT LISTE au format de sortie obligatoire.

- Sujet : "{SUJET}".
- Nombre d'éléments : {N}.
- Durée cible : {DUREE}.

Exigences :
- Hook qui annonce la valeur ("le n°{X} est celui que personne n'utilise").
- Chaque élément = une mini-scène : nom + à quoi ça sert + démo B-Roll + cas d'usage local concret.
- Garder le meilleur/le plus surprenant pour la fin pour la rétention.
- Texte à l'écran : numéro + nom de l'outil/erreur en gros à chaque transition.
- Transitions rythmées (cut sec / punch-in) entre chaque élément.
- CTA : ressource récapitulative téléchargeable."""

P7 = """Écris-moi le script complet d'une vidéo Q&A / RÉACTION au format de sortie obligatoire.

- Format : "{SUJET}".
- Questions ou éléments à traiter : {NIVEAU}.
- Durée cible : {DUREE}.

Exigences :
- Ambiance conviviale, proximité, on parle à la communauté ("Les Digitos").
- Pour chaque question/cas : reformuler → répondre cash → 1 conseil actionnable.
- Valoriser les membres (mentionner pseudo/ville façon "Awa à Abidjan demande...").
- B-Roll : captures des questions/sites concernés, réactions face cam.
- CTA : "Pose ta question en commentaire pour la prochaine vidéo / rejoins le Club des Digitos."."""

P8 = """Écris-moi le script complet d'une vidéo CHALLENGE / EXPÉRIENCE au format de sortie obligatoire.

- Challenge : "{SUJET}".
- Durée cible : {DUREE}.

Exigences :
- Hook = enjeu + tension ("est-ce que c'est possible ? On va voir").
- Structure narrative type vlog : règles du challenge → étapes/jour par jour → rebondissements → résultat final chiffré → verdict honnête.
- Beaucoup de B-Roll d'action et d'ambiance, rythme dynamique.
- Suspense maintenu jusqu'au résultat (ne pas spoiler le verdict avant la fin).
- Ouvre la porte à un format série (épisode suivant).
- CTA : "Tu veux que je teste quoi ensuite ? Commentaire."."""

P9 = """À partir du script vidéo ci-dessous, génère 3 Shorts verticaux (< 60 s) prêts à tourner/monter.

[COLLE ICI LE SCRIPT LONG]

Pour chaque Short :
- 🎯 Angle / titre du Short
- 🧲 Hook (< 3 s) : texte EXACT, doit stopper le scroll
- 🎙️ A-ROLL : texte condensé à dire (script mot pour mot, ~120-150 mots max)
- 🔤 TEXTE À L'ÉCRAN : sous-titres clés / mots punch à incruster
- 🎥 B-ROLL : visuels verticaux suggérés
- 📣 CTA final (1 phrase) + redirection vers la vidéo longue
- #️⃣ 3 à 5 hashtags pertinents (mix global + local Afrique francophone)"""

P10 = """En tant que Max-Morrys, optimise le packaging YouTube de cette vidéo : "{SUJET}" (colle le script si tu veux).

Donne :
1. 🎯 5 titres A/B testables (< 60 car.), classés du plus fort au plus sûr, avec pour chacun le levier psychologique utilisé (curiosité, peur de rater, bénéfice, chiffre, contre-intuitif).
2. 🖼️ 3 concepts de miniature : visuel décrit + texte (3-4 mots max) + émotion du visage.
3. 📝 Description YouTube optimisée SEO : 2 premières lignes accrocheuses, résumé, timestamps (chapitrage), liens (formations/Club/newsletter), puis bloc mots-clés.
4. #️⃣ 8-12 hashtags (mix marketing digital global + Afrique francophone).
5. 📌 1 commentaire épinglé à poster pour lancer l'engagement."""

TEMPLATES = {"P1": P1, "P2": P2, "P3": P3, "P4": P4, "P5": P5, "P6": P6, "P7": P7, "P8": P8}

# ----------------------------------------------------------------------------
# 2) PLANIFICATION
# ----------------------------------------------------------------------------

MONTHS = {
    7: ("JUILLET", "L'IA pour ton business"),
    8: ("AOÛT", "Trouver des clients (SEO & visibilité locale)"),
    9: ("SEPTEMBRE", "Personal branding & création de contenu"),
    10: ("OCTOBRE", "Vendre en ligne (e-commerce & tunnel de vente)"),
    11: ("NOVEMBRE", "Growth & publicité (acquisition)"),
    12: ("DÉCEMBRE", "Bilan, stratégie & préparer 2027"),
}

P0_DATES = [
    ((2026, 6, 28), 7),
    ((2026, 7, 26), 8),
    ((2026, 8, 30), 9),
    ((2026, 9, 27), 10),
    ((2026, 10, 25), 11),
    ((2026, 11, 29), 12),
]

WEEKS = [
    ((2026, 7, 4),  "P1", "Tuto",        "automatiser 1 mois de contenu réseaux sociaux avec l'IA", "12-14 min", "débutant", ""),
    ((2026, 7, 11), "P2", "Tendance",    "la montée des agents IA", "9-11 min", "ce que ça change pour une PME africaine", ""),
    ((2026, 7, 18), "P6", "Liste",       "7 outils IA gratuits pour une PME", "9-11 min", "", "7"),
    ((2026, 7, 25), "P5", "Débat",       "l'IA ne te remplacera pas, mais celui qui la maîtrise oui", "7-9 min", "", ""),

    ((2026, 8, 1),  "P1", "Tuto",        "configurer une fiche Google Business Profile qui ramène des clients", "12-15 min", "débutant", ""),
    ((2026, 8, 8),  "P2", "Tendance",    "les changements SEO/Google de 2026 (IA dans la recherche)", "9-11 min", "comment s'adapter", ""),
    ((2026, 8, 15), "P3", "Étude de cas", "passer de presque 0 à +1790% de trafic organique", "12-15 min", "+1790% de trafic", ""),
    ((2026, 8, 22), "P7", "Q&A",         "je réponds à vos questions SEO", "10-15 min", "6-8 questions typiques de débutants", ""),
    ((2026, 8, 29), "P8", "Challenge",   "améliorer le référencement d'un site de zéro en 7 jours", "10-14 min", "", ""),

    ((2026, 9, 5),  "P1", "Tuto",        "construire ton autorité et trouver des clients sur LinkedIn", "12-15 min", "intermédiaire", ""),
    ((2026, 9, 12), "P2", "Tendance",    "le format de contenu qui performe le plus en ce moment", "8-10 min", "comment l'adapter à ta niche", ""),
    ((2026, 9, 19), "P6", "Liste",       "5 erreurs qui tuent ta marque personnelle", "8-10 min", "", "5"),
    ((2026, 9, 26), "P4", "Storytelling", "comment j'ai construit ma marque personnelle depuis Dakar", "8-12 min", "tout le monde peut commencer", ""),

    ((2026, 10, 3),  "P1", "Tuto",       "créer un tunnel de vente simple qui convertit", "13-16 min", "intermédiaire", ""),
    ((2026, 10, 10), "P2", "Tendance",   "le social commerce + mobile money en Afrique", "9-11 min", "opportunité pour les petites boutiques", ""),
    ((2026, 10, 17), "P3", "Étude de cas", "comment une boutique qui vend sur WhatsApp a multiplié ses ventes", "12-15 min", "x ventes/mois", ""),
    ((2026, 10, 24), "P7", "Réaction",   "je réagis à vos pages de vente / sites e-commerce", "10-15 min", "4-5 cas types", ""),
    ((2026, 10, 31), "P8", "Challenge",  "vendre un produit en 48h sans budget publicitaire", "10-14 min", "", ""),

    ((2026, 11, 7),  "P1", "Tuto",       "lancer ta première publicité Facebook/Instagram sans gaspiller ton budget", "13-16 min", "débutant", ""),
    ((2026, 11, 14), "P2", "Tendance",   "Black Friday : la stratégie gagnante pour une PME africaine", "8-10 min", "stratégie PME africaine", ""),
    ((2026, 11, 21), "P6", "Liste",      "7 leviers de croissance gratuits avant de payer de la pub", "9-11 min", "", "7"),
    ((2026, 11, 28), "P5", "Débat",      "payer de la pub trop tôt = gaspiller son argent", "7-9 min", "", ""),

    ((2026, 12, 5),  "P1", "Tuto",       "faire le bilan marketing de ton année avec un template simple", "10-14 min", "débutant", ""),
    ((2026, 12, 12), "P2", "Tendance",   "les tendances marketing et IA pour 2027", "9-12 min", "ce qu'il faut préparer dès maintenant", ""),
    ((2026, 12, 19), "P4", "Storytelling", "mon bilan personnel de l'année, mes échecs et mes leçons", "8-12 min", "la constance paye", ""),
    ((2026, 12, 26), "P7", "Communauté", "je t'aide à fixer tes objectifs digitaux 2027", "10-15 min", "5-6 objectifs/questions types", ""),
]

# ----------------------------------------------------------------------------
# 3) HELPERS .ics
# ----------------------------------------------------------------------------

DTSTAMP = "20260617T120000"

def esc(text):
    return (text.replace("\\", "\\\\")
                .replace(";", "\\;")
                .replace(",", "\\,")
                .replace("\n", "\\n"))

def fold(line):
    out = []
    cur = b""
    first = True
    for ch in line:
        b = ch.encode("utf-8")
        limit = 73 if first else 72
        if len(cur) + len(b) > limit:
            out.append(cur)
            cur = b
            first = False
        else:
            cur += b
    out.append(cur)
    return "\r\n ".join(seg.decode("utf-8") for seg in out)

def add_days(date, n):
    import datetime
    d = datetime.date(*date) + datetime.timedelta(days=n)
    return (d.year, d.month, d.day)

def stamp(date, hh, mm):
    y, m, d = date
    return "%04d%02d%02dT%02d%02d00" % (y, m, d, hh, mm)

def fill(template, sujet="", duree="", extra="", n="", theme=""):
    return (template.replace("{SUJET}", sujet)
                    .replace("{DUREE}", duree)
                    .replace("{NIVEAU}", extra)
                    .replace("{N}", n)
                    .replace("{THEME}", theme))

EVENTS = []

def event(uid, date, hh, mm, dur_min, summary, description):
    eh, em = hh, mm + dur_min
    eh += em // 60
    em = em % 60
    lines = [
        "BEGIN:VEVENT",
        "UID:%s" % uid,
        "DTSTAMP;TZID=Africa/Dakar:%s" % DTSTAMP,
        "DTSTART;TZID=Africa/Dakar:%s" % stamp(date, hh, mm),
        "DTEND;TZID=Africa/Dakar:%s" % stamp(date, eh, em),
        fold("SUMMARY:" + esc(summary)),
        fold("DESCRIPTION:" + esc(description)),
        "END:VEVENT",
    ]
    EVENTS.append("\r\n".join(lines))

# ----------------------------------------------------------------------------
# 4) CONSTRUCTION
# ----------------------------------------------------------------------------

SEP = "\n\n──────────\n\n"

# Mapping mois -> sujets que P0 alimente (depuis WEEKS)
SUBJECTS_BY_MONTH = {}
for sat, pcode, label, sujet, duree, extra, n in WEEKS:
    SUBJECTS_BY_MONTH.setdefault(sat[1], []).append((sat, pcode, label, sujet))

# P0 mensuel
for sun, month in P0_DATES:
    mname, theme = MONTHS[month]
    lignes = []
    for (y, m, d), pcode, label, sujet in SUBJECTS_BY_MONTH.get(month, []):
        lignes.append("• %02d/%02d · %s (%s) · %s" % (d, m, label, pcode, sujet))
    bloc_sujets = ("=== SUJETS DU MOIS QUE CETTE IDÉATION ALIMENTE ===\n"
                   "Ces 4-5 sujets remplissent le {Sujet} des SCRIPT (P1–P8) des semaines à venir :\n%s"
                   % "\n".join(lignes))
    desc = ("🎯 IDÉATION DU MOIS — %s (thème : %s).\n"
            "Colle d'abord le PROMPT MAÎTRE, puis le P0 ci-dessous. Choisis/affine ensuite les 4-5 sujets du mois.%s"
            "=== PROMPT MAÎTRE ===\n%s%s=== P0 — IDÉATION ===\n%s%s%s") % (
            mname, theme, SEP, MAITRE, SEP, fill(P0, theme=theme), SEP, bloc_sujets)
    event("mm-yt-%04d%02d%02d-p0@maxmorrys.me" % sun, sun, 10, 0, 45,
          "🧠 P0 Idéation — %s (%s)" % (mname, theme), desc)

# Semaines
for sat, pcode, label, sujet, duree, extra, n in WEEKS:
    mname, theme = MONTHS[sat[1]]
    key = "%04d%02d%02d" % sat
    titre_court = sujet if len(sujet) <= 46 else sujet[:43] + "..."

    mon = add_days(sat, -5)
    tue = add_days(sat, -4)
    wed = add_days(sat, -3)
    thu = add_days(sat, -2)
    sun1 = add_days(sat, 1)
    mon2 = add_days(sat, 2)
    wed2 = add_days(sat, 4)
    fri2 = add_days(sat, 6)
    sun2 = add_days(sat, 8)

    # LUNDI — SCRIPT (MAÎTRE + spécialisé rempli)
    filled = fill(TEMPLATES[pcode], sujet=sujet, duree=duree, extra=extra, n=n)
    desc_mon = ("🎬 SCRIPT DE LA SEMAINE — Thème : %s.\n"
                "Copie TOUT ce bloc dans ChatGPT (MAÎTRE + demande), d'un coup.%s"
                "=== PROMPT MAÎTRE ===\n%s%s=== DEMANDE (%s) ===\n%s") % (
                theme, SEP, MAITRE, SEP, label, filled)
    event("mm-yt-%s-script@maxmorrys.me" % key, mon, 9, 0, 60,
          "🎬 SCRIPT — %s (%s %s)" % (titre_court, pcode, label), desc_mon)

    # MARDI — P9 Shorts
    desc_tue = ("✂️ SHORTS — décline le script d'hier en 3 Shorts.\n"
                "Colle d'abord le PROMPT MAÎTRE si nouvelle conversation, puis le script généré lundi "
                "à la place de [COLLE ICI LE SCRIPT LONG].%s"
                "=== P9 — DÉCLINAISON SHORTS ===\n%s") % (SEP, P9)
    event("mm-yt-%s-p9@maxmorrys.me" % key, tue, 9, 0, 30,
          "✂️ P9 Shorts — %s" % titre_court, desc_tue)

    # MERCREDI — P10 Packaging
    desc_wed = ("📦 PACKAGING — titres, miniature, description SEO, hashtags, commentaire épinglé.%s"
                "=== P10 — MÉTADONNÉES & MINIATURE ===\n%s") % (SEP, fill(P10, sujet=sujet))
    event("mm-yt-%s-p10@maxmorrys.me" % key, wed, 9, 0, 30,
          "📦 P10 Packaging — %s" % titre_court, desc_wed)

    # JEUDI — Montage
    desc_thu = ("🎬 TOURNAGE + MONTAGE — %s.\n"
                "Tourne (A-Roll face caméra + B-Roll listés dans le script) puis monte. "
                "Pas de prompt aujourd'hui. Objectif : vidéo prête à programmer.") % sujet
    event("mm-yt-%s-montage@maxmorrys.me" % key, thu, 9, 0, 120,
          "🎬 Tournage/Montage — %s" % titre_court, desc_thu)

    # SAMEDI — Publication
    desc_sat = ("🎥 PUBLICATION (19h Dakar) — %s.\n"
                "Checklist :\n"
                "1. Publie la vidéo longue.\n"
                "2. Colle le commentaire épinglé (généré par P10).\n"
                "3. Shorts et podcast déjà planifiés cette semaine (voir événements dédiés).") % sujet
    event("mm-yt-%s-publi@maxmorrys.me" % key, sat, 19, 0, 60,
          "🎥 PUBLICATION — %s (%s)" % (titre_court, label), desc_sat)

    # DIMANCHE (S+1) — Engagement
    desc_eng = ("💬 ENGAGEMENT — %s.\n"
                "Réponds à TOUS les commentaires de la vidéo publiée hier (boost l'algo + "
                "nourrit la communauté « Les Digitos »). Épingle les meilleurs.") % sujet
    event("mm-yt-%s-engage@maxmorrys.me" % key, sun1, 18, 0, 30,
          "💬 Engagement commentaires — %s" % titre_court, desc_eng)

    # LUNDI (S+2) — Podcast
    desc_pod = ("🎧 PODCAST — %s.\n"
                "Republie l'audio de la vidéo de samedi en épisode de podcast. "
                "Suis la NOTE PODCAST du script (intro parlée + précisions là où un visuel manque).") % sujet
    event("mm-yt-%s-podcast@maxmorrys.me" % key, mon2, 10, 0, 30,
          "🎧 Podcast (audio) — %s" % titre_court, desc_pod)

    # MERCREDI (S+4) — Short #1
    event("mm-yt-%s-short1@maxmorrys.me" % key, wed2, 12, 0, 15,
          "✂️ Short #1 — %s" % titre_court,
          "✂️ Publie le Short #1 (généré via P9) de la vidéo : %s." % sujet)

    # VENDREDI (S+6) — Short #2
    event("mm-yt-%s-short2@maxmorrys.me" % key, fri2, 12, 0, 15,
          "✂️ Short #2 — %s" % titre_court,
          "✂️ Publie le Short #2 (généré via P9) de la vidéo : %s." % sujet)

    # DIMANCHE (S+8) — Short #3
    event("mm-yt-%s-short3@maxmorrys.me" % key, sun2, 12, 0, 15,
          "✂️ Short #3 — %s" % titre_court,
          "✂️ Publie le Short #3 (généré via P9) de la vidéo : %s." % sujet)

# ----------------------------------------------------------------------------
# 5) VCALENDAR + VTIMEZONE Africa/Dakar (UTC+0, sans DST)
# ----------------------------------------------------------------------------

VTZ = "\r\n".join([
    "BEGIN:VTIMEZONE",
    "TZID:Africa/Dakar",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0000",
    "TZOFFSETTO:+0000",
    "TZNAME:GMT",
    "END:STANDARD",
    "END:VTIMEZONE",
])

head = "\r\n".join([
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Max-Morrys//Calendrier de prompts YouTube//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:YouTube – Prod (Max-Morrys)",
    "X-WR-TIMEZONE:Africa/Dakar",
])

ics = "\r\n".join([head, VTZ] + EVENTS + ["END:VCALENDAR"]) + "\r\n"

out_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                        "calendrier-prompts-youtube-maxmorrys.ics")
with open(out_path, "w", encoding="utf-8") as f:
    f.write(ics)

print("OK -> %s" % out_path)
print("Événements : %d" % len(EVENTS))

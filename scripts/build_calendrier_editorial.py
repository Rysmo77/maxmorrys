#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Génère docs/calendrier_editorial_12_semaines.csv

12 semaines (lun 10/08/2026 → dim 01/11/2026), 21 contenus/semaine = 252 lignes.
Colonnes alignées sur les champs réels de la table Airtable `Contenus` (tblPYoyzcZLdtBTO3).
Heures en Africa/Dakar (UTC+0).
"""
import csv
from datetime import datetime, timedelta

OUT = "docs/calendrier_editorial_12_semaines.csv"
FIRST_MONDAY = datetime(2026, 8, 10)

# ── La grille des 14 posts ────────────────────────────────────────────────────
# (jourOffset, heure, reseau, format, pilier, serie, cible)
GRID = [
    (0,  9, "linkedin", "post",           "Autorité",   "RADAR",     "Mixte"),
    (0, 18, "ig",       "carrousel",      "Éducation",  "ATELIER",   "Apprenants"),
    (1, 10, "linkedin", "carrousel",      "Éducation",  "ATELIER",   "Mixte"),
    (1, 12, "fb",       "carrousel",      "Autorité",   "PREUVE",    "Commerçants"),
    (1, 19, "ig",       "carrousel",      "Éducation",  "ATELIER",   "Apprenants"),
    (2,  9, "fb",       "post",           "Produit",    "OFFRE",     "Commerçants"),
    (2, 18, "ig",       "post",           "Inspiration","COULISSES", "Apprenants"),
    (3, 11, "ig",       "carrousel",      "Autorité",   "PREUVE",    "Apprenants"),
    (3, 18, "fb",       "community_post", "Communauté", "CERCLE",    "Commerçants"),
    (4, 10, "linkedin", "post",           "Inspiration","COULISSES", "Mixte"),
    (4, 17, "x",        "thread",         "Autorité",   "RADAR",     "Mixte"),
    (5, 11, "ig",       "carrousel",      "Produit",    "OFFRE",     "Apprenants"),
    (5, 18, "fb",       "post",           "Produit",    "OFFRE",     "Commerçants"),
    (6, 10, "linkedin", "post",           "Communauté", "CERCLE",    "Mixte"),
]

# ── La bande de stories : 7/semaine, tous les jours à 12h ─────────────────────
# (jourOffset, pilier, serie, cible)
STORIES = [
    (0, "Communauté",  "CERCLE",    "Mixte"),       # sondage
    (1, "Inspiration", "COULISSES", "Mixte"),       # coulisses
    (2, "Éducation",   "ATELIER",   "Apprenants"),  # astuce express
    (3, "Autorité",    "PREUVE",    "Mixte"),       # preuve
    (4, "Communauté",  "CERCLE",    "Mixte"),       # boîte à questions
    (5, "Produit",     "OFFRE",     "Mixte"),       # rappel d'offre (alterné)
    (6, "Inspiration", "COULISSES", "Mixte"),       # récap + inspiration
]

# ── Rotation des offres sur les 3 créneaux OFFRE ──────────────────────────────
# Index 5 (mer FB)  : toujours Agence — Facebook porte la piste commerçants.
# Index 11 (sam IG) : plateforme, rotation Formations → Club Digitos → Rysmo.
# Index 12 (sam FB) : Agence pendant les 4 semaines de lancement, puis plateforme.
ROT_IG = ["Formations", "Club Digitos", "Rysmo"]
ROT_FB_CRUISE = ["Accompagnement", "Formations", "Club Digitos"]
# Pendant le lancement, le créneau FB du samedi reste sur la ligne agence, en alternant
# la mise en place (Agence) et le récurrent (Accompagnement) — c'est la conversion à J+30
# qui décide de la rentabilité de la ligne, elle mérite d'être vendue dès le départ.
ROT_FB_LAUNCH = ["Agence", "Accompagnement"]
LAUNCH_WEEKS = 4
LIGNE_AGENCE = {"Agence", "Accompagnement"}

CTA_BY_OFFRE = {
    "Agence": "Trouve ton pack en 3 questions",
    "Formations": "Découvre la formation",
    "Club Digitos": "Rejoins le Club",
    "Rysmo": "Essaie Rysmo",
    "Accompagnement": "Parlons-en sur WhatsApp",
}
CTA_BY_SERIE = {
    "ATELIER": "Sauvegarde pour plus tard",
    "RADAR": "Dis-moi ce que tu en penses en commentaire",
    "PREUVE": "Sauvegarde et compare",
    "COULISSES": "Raconte-moi ton parcours en commentaire",
    "CERCLE": "Réponds en commentaire",
}
# CTA par JOUR, pas par série : lundi et vendredi sont tous deux CERCLE mais
# l'un est un sondage et l'autre une boîte à questions — l'appel à l'action diffère.
CTA_STORY_BY_DAY = [
    "Réponds au sondage",        # lun — sondage
    "Envoie-moi un message",     # mar — coulisses
    "Essaie ce soir",            # mer — astuce express
    "Swipe pour le détail",      # jeu — preuve
    "Pose ta question",          # ven — boîte à questions
    None,                        # sam — rappel d'offre : CTA dérivé de l'offre
    "Sauvegarde le récap",       # dim — récap
]

# Les stories du samedi (rappel d'offre) et du dimanche (récap) sont générées :
# le samedi doit toujours annoncer l'offre RÉELLEMENT calculée pour la semaine,
# et le dimanche est unique par construction. Les cinq autres sont écrites à la main.
OFFRE_PITCH = {
    "Agence": "En 30 secondes : je digitalise ton commerce",
    "Formations": "En 30 secondes : la formation du moment",
    "Club Digitos": "En 30 secondes : le Club des Digitos",
    "Rysmo": "En 30 secondes : Rysmo, ton répétiteur IA",
    "Accompagnement": "En 30 secondes : l'accompagnement mensuel",
}

# ── Les 12 semaines : fil rouge du mois, thème hebdo, 14 titres + 7 stories ───
WEEKS = [
    # ═══════════ AOÛT — « Être trouvé » ═══════════
    dict(
        fil="Être trouvé", theme="Ta fiche Google, de zéro à complète",
        posts=[
            "Google Maps est devenu le premier moteur de recherche des commerces de quartier",
            "Ta fiche Google, champ par champ : la configuration complète",
            "Référencement local : les 4 signaux qui décident vraiment de ta place",
            "Une fiche mal remplie contre une fiche complète : le même commerce, deux résultats",
            "Les photos qui font cliquer sur ta fiche Google",
            "Je t'offre l'audit de ta fiche Google — dis-moi ton métier et ton quartier",
            "Pourquoi je commence toujours par Google Maps, jamais par le site web",
            "Ce que change une fiche complète, en chiffres",
            "Tape ton métier et ton quartier sur Google Maps. Tu apparais ? Dis-le-moi",
            "La première fois que j'ai montré Google Maps à un commerçant qui ne s'y trouvait pas",
            "La recherche locale a changé : 7 choses à savoir cette semaine",
            "Maîtriser le SEO de A à Z : ce que tu sais faire à la fin",
            "Trouve ton pack en 3 questions, sans parler à personne",
            "Quelle est la première chose qu'on trouve en cherchant ton nom en ligne ?",
        ],
        stories=[
            "Ta fiche Google : complète, ou jamais touchée ?",
            "Ce matin : je remplis une fiche Google en direct",
            "Le champ que 9 fiches sur 10 laissent vide",
            "Cette fiche est passée de 12 à 340 vues par semaine",
            "Boîte à questions : tout sur Google Maps",
            "La formation SEO, en 30 secondes",
            "Les 3 contenus à retenir de la semaine",
        ],
    ),
    dict(
        fil="Être trouvé", theme="Apparaître sur Google Maps dans ton quartier",
        posts=[
            "Pourquoi ton concurrent apparaît avant toi sur Maps (et ce n'est pas un hasard)",
            "Le référencement local expliqué à quelqu'un qui déteste le mot « référencement »",
            "Proximité, pertinence, notoriété : les trois leviers de Google Maps",
            "Le vrai prix d'un site web à Dakar : la fourchette, sans détour",
            "Obtenir tes 10 premiers avis clients sans quémander",
            "L'audit gratuit de ta présence Google : ce que je regarde en 10 minutes",
            "Un commerçant m'a dit : « de toute façon mes clients me connaissent »",
            "Combien de clients faut-il pour rembourser une mise en place ? Le calcul entier",
            "Quel est ton quartier ? Je regarde qui apparaît avant toi",
            "Ce que j'ai appris en refaisant la présence de commerces qui ne se ressemblaient pas",
            "Recherche locale : ce que les plateformes récompensent en 2026",
            "Le Club des Digitos : ce qui s'y passe vraiment chaque semaine",
            "Présence Locale, Commerce Visible, Boutique Digitale : lequel est pour toi",
            "Le dernier client qui t'a trouvé sur Internet, il est venu comment ?",
        ],
        stories=[
            "Tu apparais sur Maps quand on cherche ton métier ? Oui / Non",
            "En route pour un rendez-vous : je te montre ce que je prépare",
            "L'astuce des horaires : le détail qui change ton classement",
            "3 avis clients en 48h, la méthode tient en une phrase",
            "Boîte à questions : le référencement local",
            "L'offre agence, en 30 secondes",
            "Ce qu'il faut retenir de la semaine",
        ],
    ),
    dict(
        fil="Être trouvé", theme="Être cité par les IA : la recherche change d'adresse",
        posts=[
            "Être cité par ChatGPT et Gemini : la recherche ne passe plus seulement par Google",
            "Écrire une page que les IA citent : la structure qui marche",
            "GEO, AEO, SEO : ce que ces sigles changent concrètement pour toi",
            "J'ai demandé à trois IA de recommander un restaurant à Dakar. Voilà ce qui s'est passé",
            "Structurer ton contenu pour être compris par une machine ET par un humain",
            "Ta présence en ligne existe-t-elle pour une IA ? Je vérifie pour toi",
            "Ce que j'ai changé dans ma façon d'écrire depuis que les IA répondent à ma place",
            "Le SEO n'est pas mort, il a changé d'adresse : la démonstration",
            "Est-ce que tu demandes déjà des recommandations à une IA ? Sois honnête",
            "J'ai passé six mois à me tromper sur les IA génératives",
            "Ce qui bouge dans la recherche cette semaine : le décryptage",
            "Rysmo : pose-lui la question que tu n'oses poser à personne",
            "Ta présence digitale, installée une fois, pilotée ensuite",
            "Quand tu cherches un service, tu ouvres quoi en premier ?",
        ],
        stories=[
            "Tu utilises l'IA pour chercher des infos ? Oui / Pas encore",
            "Mon écran ce matin : je teste comment les IA parlent de mes clients",
            "La balise que tout le monde oublie et que les IA lisent",
            "Cette page est citée par 2 IA sur 3. Voici pourquoi",
            "Boîte à questions : IA et recherche",
            "Rysmo, ton répétiteur IA, en 30 secondes",
            "Le récap de la semaine",
        ],
    ),
    dict(
        fil="Être trouvé", theme="Les avis clients, ton meilleur référencement",
        posts=[
            "Pourquoi les avis clients valent plus que ta publicité",
            "Demander un avis sans mettre ton client mal à l'aise : le message exact",
            "Répondre à un avis négatif : la structure en quatre phrases",
            "Un commerce à 4,8 étoiles contre un commerce sans avis : l'écart réel",
            "Le moment précis où il faut demander l'avis (ce n'est pas celui que tu crois)",
            "Je note la présence Google de cinq secteurs à Dakar. Les résultats font mal",
            "L'avis client qui m'a le plus appris sur mon propre travail",
            "Ce que change le passage de 3 à 30 avis, mesuré",
            "Ton pire avis client, tu en as fait quoi ?",
            "J'ai longtemps eu peur de demander des avis. Voilà ce qui a débloqué",
            "Confiance en ligne : ce qui a changé cette année",
            "Le Personal Branding : devenir une référence dans ton domaine",
            "Ta fiche, tes avis, tes photos : je m'occupe de tout, tu valides",
            "Un avis t'a déjà fait choisir un commerce plutôt qu'un autre ?",
        ],
        stories=[
            "Combien d'avis Google as-tu ? Moins de 10 / Plus de 10",
            "Je réponds à des avis clients, en direct",
            "Le message de demande d'avis qui obtient 1 réponse sur 2",
            "De 3 à 47 avis en quatre mois",
            "Boîte à questions : les avis clients",
            "La formation Personal Branding, en 30 secondes",
            "Ce qu'on a vu cette semaine",
        ],
    ),
    # ═══════════ SEPTEMBRE — « Ton système, pas ton temps » ═══════════
    dict(
        fil="Ton système, pas ton temps", theme="Un mois de contenu en une heure",
        posts=[
            "Publier tous les jours sans y penser : le principe, pas la magie",
            "Construire un calendrier éditorial d'un mois en une heure",
            "Choisis tes deux réseaux et abandonne les autres sans culpabiliser",
            "Le temps réel que prend une publication quotidienne, chronométré",
            "La méthode des lots : produire quatre semaines d'avance",
            "Tes publications préparées et programmées — tu valides d'un message",
            "Comment je prépare une semaine de contenu, écrans à l'appui",
            "Six mois sans publier : ce qui arrive vraiment à ta visibilité",
            "Combien de temps tu passes sur tes réseaux chaque semaine ? Sois honnête",
            "Le jour où j'ai arrêté de publier à l'inspiration",
            "Ce qui a changé dans la production de contenu cette année",
            "Marketing Digital Complet : la formation qui structure tout",
            "L'accompagnement mensuel : ce que tu reçois vraiment chaque mois",
            "Qu'est-ce qui t'empêche de publier régulièrement ?",
        ],
        stories=[
            "Tu publies : tous les jours / quand tu peux ?",
            "Mon tableau de contenu du mois, en vrai",
            "La règle des 3 colonnes pour ne jamais sécher",
            "12 publications préparées en 58 minutes",
            "Boîte à questions : organiser son contenu",
            "La formation Marketing Digital, en 30 secondes",
            "Le récap de la semaine",
        ],
    ),
    dict(
        fil="Ton système, pas ton temps", theme="Créer tes visuels sans designer",
        posts=[
            "Le contenu IA est partout — pourquoi le fait main reprend de la valeur",
            "Le kit de marque Canva : configure-le une fois, gagne 20 minutes par visuel",
            "Redimensionner un visuel en trois formats sans le refaire",
            "Ce que coûte vraiment un visuel : designer, Canva, ou IA",
            "Les cinq réglages Canva qui séparent l'amateur du professionnel",
            "Photographier ton produit avec ton téléphone : lumière, fond, angle",
            "Pourquoi mes visuels ne sortent jamais d'une image IA brute",
            "Un carrousel soigné contre un carrousel bâclé : l'écart de portée",
            "Tu fais tes visuels toi-même ou tu délègues ?",
            "J'ai mis deux ans à comprendre qu'un visuel raté tue un bon texte",
            "Design et IA : ce qui a changé ce mois-ci",
            "Le Club des Digitos : les sessions live du mois",
            "Ta vitrine en ligne a l'air professionnelle. Sans designer, sans te ruiner",
            "Ton dernier visuel, tu l'as fait avec quoi ?",
        ],
        stories=[
            "Tu utilises Canva ? Tous les jours / Jamais",
            "Je monte un visuel de A à Z, en accéléré",
            "Le raccourci Canva que personne ne connaît",
            "Même message, deux visuels : 3× plus de vues",
            "Boîte à questions : design et Canva",
            "L'offre agence, en 30 secondes",
            "Ce qu'il faut retenir",
        ],
    ),
    dict(
        fil="Ton système, pas ton temps", theme="Faire écrire l'IA sans perdre ta voix",
        posts=[
            "Les agents IA pour un solopreneur : ce qui marche, ce qui n'est que démo",
            "Écrire un prompt qui donne un résultat utilisable du premier coup",
            "Faire écrire l'IA sans perdre ta voix : la méthode des trois exemples",
            "Texte écrit par l'IA contre texte retravaillé : ce que voient tes lecteurs",
            "Générer une image de fond correcte : ce qu'il faut décrire, ce qu'il ne faut pas",
            "Répondre plus vite à tes clients grâce à l'IA — sans devenir un robot",
            "Ce que l'IA a changé dans mon travail, et ce qu'elle n'a pas remplacé",
            "Le taux de réponse d'un message écrit à la main contre un message IA brut",
            "L'IA t'a déjà fait gagner du temps, ou tu n'as pas encore essayé ?",
            "Mon premier texte 100 % IA était mauvais. Voilà ce que j'ai compris depuis",
            "IA générative : ce qui a bougé cette semaine",
            "L'IA pour les Entrepreneurs : la formation qui va à l'essentiel",
            "Douze publications rédigées pour toi chaque mois, à ta voix",
            "Tu utilises l'IA pour écrire ? Dis-moi comment",
        ],
        stories=[
            "L'IA écrit mieux que toi ? Oui / Non / Ça dépend",
            "Mon prompt de travail, celui que j'utilise vraiment",
            "Le mot à ajouter à tes prompts pour changer le résultat",
            "Même sujet, deux versions : celle qui a marché",
            "Boîte à questions : l'IA au quotidien",
            "La formation IA, en 30 secondes",
            "Le récap de la semaine",
        ],
    ),
    dict(
        fil="Ton système, pas ton temps", theme="Automatiser sans se faire remplacer",
        posts=[
            "Ce que l'IA change au métier de community manager, et ce qu'elle ne remplacera pas",
            "Connecter deux outils sans écrire une ligne de code",
            "Automatiser ton calendrier de contenu : le principe, étape par étape",
            "Le vrai prix d'un community manager à Dakar — et ce que tu as pour ce prix",
            "Sous-titres automatiques : le réglage qui les rend enfin lisibles",
            "Publier tous les jours sans y penser : comment ça marche chez mes clients",
            "Pourquoi je ne crois pas au « tout automatique »",
            "Automatisé contre fait à la main : les chiffres après trois mois",
            "Qu'est-ce que tu automatiserais en premier si tu pouvais ?",
            "L'automatisation qui m'a fait perdre un client (et la leçon)",
            "Agents IA et automatisation : le point de la semaine",
            "Growth Hacking Avancé : la formation pour aller plus vite",
            "Croissance Automatisée : la mise en place, puis le pilotage mensuel",
            "Quelle tâche répétitive t'épuise le plus ?",
        ],
        stories=[
            "Tu automatises déjà quelque chose ? Oui / Non",
            "Les coulisses de ma production de contenu",
            "Le réglage sous-titres que tout le monde rate",
            "Trois heures par semaine récupérées, mesurées",
            "Boîte à questions : automatisation",
            "L'accompagnement mensuel, en 30 secondes",
            "Ce qu'on a vu cette semaine",
        ],
    ),
    # ═══════════ OCTOBRE — « Vendre sans forcer » ═══════════
    dict(
        fil="Vendre sans forcer", theme="WhatsApp, ton meilleur canal de vente",
        posts=[
            "WhatsApp comme canal de vente principal : le basculement est fait",
            "Configurer WhatsApp Business : catalogue, réponses rapides, horaires",
            "Le message de premier contact qui obtient une réponse",
            "Commandes WhatsApp désordonnées contre commandes organisées : le coût du désordre",
            "Organiser tes commandes WhatsApp sans te noyer",
            "Tes produits commandables directement sur WhatsApp",
            "Pourquoi je réponds encore moi-même aux premiers messages",
            "Le taux de réponse d'un catalogue WhatsApp bien rangé",
            "Tu vends déjà sur WhatsApp ? Raconte-moi comment ça se passe",
            "La conversation client qui m'a fait changer toute mon offre",
            "Commerce conversationnel : ce qui bouge en Afrique de l'Ouest",
            "Le Club des Digitos : les opportunités publiées ce mois-ci",
            "Ton catalogue installé, tes boutons en place, tes commandes rangées",
            "Combien de commandes te passent par WhatsApp chaque semaine ?",
        ],
        stories=[
            "Tu vends sur WhatsApp ? Oui / Pas encore",
            "Je range un catalogue WhatsApp en direct",
            "Les réponses rapides : le réglage qui fait gagner 10 min/jour",
            "De 6 à 40 commandes WhatsApp par semaine",
            "Boîte à questions : WhatsApp Business",
            "L'offre agence, en 30 secondes",
            "Le récap de la semaine",
        ],
    ),
    dict(
        fil="Vendre sans forcer", theme="Décrire un produit pour qu'on l'achète",
        posts=[
            "Le format carrousel résiste à tout — voilà pourquoi",
            "Décrire un produit pour qu'on l'achète, pas juste pour qu'on le comprenne",
            "Le hook : six ouvertures qui fonctionnent, et pourquoi",
            "Deux fiches produit, le même article : celle qui vend",
            "Réécrire un texte plat en trois passes",
            "Tes produits présentés correctement, en ligne, tout le temps",
            "La description produit que j'ai réécrite quatre fois",
            "Ce que change une bonne description, mesuré sur trois semaines",
            "Décris-moi ton produit phare en une phrase. Je te réponds",
            "J'ai vendu ma première prestation avec un texte que je trouvais nul",
            "Formats et algorithmes : ce que les plateformes récompensent maintenant",
            "Maîtriser le SEO : écrire pour Google et pour les humains",
            "Commerce Visible : la mise en place complète, en une à trois semaines",
            "Quel produit tu n'arrives pas à décrire ?",
        ],
        stories=[
            "Tu écris tes descriptions toi-même ? Oui / Non",
            "Je réécris une fiche produit, en direct",
            "La règle du bénéfice avant la caractéristique",
            "Même produit, deux descriptions : +38 % de clics",
            "Boîte à questions : rédaction",
            "La formation SEO, en 30 secondes",
            "Ce qu'il faut retenir",
        ],
    ),
    dict(
        fil="Vendre sans forcer", theme="La preuve sociale : avis, témoignages, chiffres",
        posts=[
            "Les micro-communautés battent les grandes audiences — la preuve par les chiffres",
            "Structurer un post long pour qu'il soit lu jusqu'au bout",
            "Transformer un client content en preuve utilisable",
            "Mythe contre réalité : « il faut une grosse audience pour vendre »",
            "Écrire un appel à l'action qu'on suit vraiment",
            "Ta page, tes avis, tes preuves : installés une fois, mis à jour ensuite",
            "Le témoignage que je n'ai jamais osé publier",
            "Le taux de complétion de nos formations, et pourquoi il est ce qu'il est",
            "Un membre du Club et ce qu'il a construit en six mois",
            "Ce que la diaspora m'a appris sur la confiance en ligne",
            "Preuve sociale et authenticité : le point de la semaine",
            "Rejoins le Club des Digitos : la communauté, les lives, les opportunités",
            "L'accompagnement mensuel : le rapport chiffré que tu reçois",
            "Quelle preuve te fait choisir un prestataire plutôt qu'un autre ?",
        ],
        stories=[
            "Tu demandes des témoignages ? Oui / Jamais",
            "Je prépare le rapport mensuel d'un client",
            "La question à poser pour obtenir un bon témoignage",
            "98 % de taux de complétion : ce qu'il y a derrière",
            "Boîte à questions : preuve et crédibilité",
            "Le Club des Digitos, en 30 secondes",
            "Le récap de la semaine",
        ],
    ),
    dict(
        fil="Vendre sans forcer", theme="Le vrai prix des choses",
        posts=[
            "La saturation du contenu : publier moins mais mieux est-il devenu rentable ?",
            "Les UTM : savoir enfin d'où viennent tes clients",
            "Un tunnel simple qui tient sur une page",
            "Ce que coûte vraiment « le site pas cher du neveu »",
            "Poser un positionnement en une phrase",
            "Mes prix, en clair : ce que ça coûte et ce que tu reçois",
            "Pourquoi j'affiche mes prix alors que personne ne le fait ici",
            "Combien rapporte un client Internet ? Le calcul complet",
            "Tu trouves les prix du digital opaques ? Dis-le franchement",
            "L'erreur de tarification qui m'a coûté le plus cher",
            "Marché du digital ouest-africain : ce qui a changé ce trimestre",
            "Toutes les formations : trouve celle qui correspond à ton objectif",
            "Présence Locale, Commerce Visible, Boutique Digitale : les trois, en clair",
            "Qu'est-ce qui te retient vraiment : le prix, ou le doute ?",
        ],
        stories=[
            "Les prix du digital sont-ils clairs pour toi ? Oui / Non",
            "Je prépare un devis, je te montre comment je le construis",
            "Le calcul à faire avant de dire « c'est cher »",
            "33 clients pour rembourser une mise en place. Le détail",
            "Boîte à questions : prix et budget",
            "L'offre agence, en 30 secondes",
            "Le bilan des 12 semaines",
        ],
    ),
]

assert len(WEEKS) == 12, len(WEEKS)
for i, w in enumerate(WEEKS):
    assert len(w["posts"]) == 14, (i, len(w["posts"]))
    assert len(w["stories"]) == 7, (i, len(w["stories"]))


def offre_for_slot(idx: int, week_no: int) -> str:
    """Quelle offre porte ce créneau ? Non-produit pour tout ce qui n'est pas OFFRE."""
    if idx == 5:                       # mer 9h, Facebook — toujours l'agence
        return "Agence"
    if idx == 11:                      # sam 11h, Instagram — plateforme, rotation
        return ROT_IG[(week_no - 1) % len(ROT_IG)]
    if idx == 12:                      # sam 18h, Facebook
        if week_no <= LAUNCH_WEEKS:    # lancement : 2 ligne agence / 1 plateforme
            return ROT_FB_LAUNCH[(week_no - 1) % len(ROT_FB_LAUNCH)]
        return ROT_FB_CRUISE[(week_no - 1 - LAUNCH_WEEKS) % len(ROT_FB_CRUISE)]
    return "Non-produit"


rows = []
for w_idx, week in enumerate(WEEKS):
    week_no = w_idx + 1
    monday = FIRST_MONDAY + timedelta(weeks=w_idx)
    thematique = f'{week["fil"]} — {week["theme"]}'

    for idx, (day, hour, reseau, fmt, pilier, serie, cible) in enumerate(GRID):
        when = monday + timedelta(days=day, hours=hour)
        offre = offre_for_slot(idx, week_no)
        # Le créneau samedi 18h passe en cible Mixte dès qu'il ne porte plus la ligne agence.
        cible_eff = "Mixte" if (idx == 12 and offre not in LIGNE_AGENCE) else cible
        cta = CTA_BY_OFFRE[offre] if serie == "OFFRE" else CTA_BY_SERIE[serie]
        rows.append({
            "Semaine": week_no,
            "Date_Publication_Prevue": when.strftime("%Y-%m-%dT%H:%M:%S+00:00"),
            "Reseau": reseau,
            "Format_Post": fmt,
            "Pilier": pilier,
            "Serie": serie,
            "Offre": offre,
            "Cible": cible_eff,
            "Thematique": thematique,
            "Titre": week["posts"][idx],
            "CTA": cta,
            "Status": "planifié",
        })

    for idx, (day, pilier, serie, cible) in enumerate(STORIES):
        when = monday + timedelta(days=day, hours=12)
        titre = week["stories"][idx]
        if serie == "OFFRE":
            # Le rappel du samedi alterne : semaines impaires plateforme, paires agence.
            offre = ROT_IG[(week_no - 1) % len(ROT_IG)] if week_no % 2 == 1 else "Agence"
            cible_eff = "Commerçants" if offre == "Agence" else "Apprenants"
            cta = CTA_BY_OFFRE[offre]
            titre = OFFRE_PITCH[offre]          # toujours l'offre réellement calculée
        else:
            offre, cible_eff, cta = "Non-produit", cible, CTA_STORY_BY_DAY[idx]
            if idx == 6:                        # dimanche : récap, unique par construction
                titre = f'Récap semaine {week_no} — {week["theme"]}'
        rows.append({
            "Semaine": week_no,
            "Date_Publication_Prevue": when.strftime("%Y-%m-%dT%H:%M:%S+00:00"),
            "Reseau": "ig",
            "Format_Post": "story",
            "Pilier": pilier,
            "Serie": serie,
            "Offre": offre,
            "Cible": cible_eff,
            "Thematique": thematique,
            "Titre": titre,
            "CTA": cta,
            "Status": "planifié",
        })

rows.sort(key=lambda r: r["Date_Publication_Prevue"])

with open(OUT, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)

# ── Contrôles ────────────────────────────────────────────────────────────────
from collections import Counter
print(f"{len(rows)} lignes → {OUT}")
posts = [r for r in rows if r["Format_Post"] != "story"]
stories = [r for r in rows if r["Format_Post"] == "story"]
print(f"  posts={len(posts)}  stories={len(stories)}")
print("  séries (posts) / semaine :", {k: v // 12 for k, v in Counter(r["Serie"] for r in posts).items()})
print("  réseaux (posts) / semaine :", {k: v // 12 for k, v in Counter(r["Reseau"] for r in posts).items()})
print("  formats (posts) / semaine :", {k: v // 12 for k, v in Counter(r["Format_Post"] for r in posts).items()})
print("  cibles (posts) / semaine :", {k: v / 12 for k, v in Counter(r["Cible"] for r in posts).items()})
print("  offres (tout) :", dict(Counter(r["Offre"] for r in rows)))
assert not [r for r in rows if r["Reseau"] == "tiktok"], "TikTok doit être absent"
assert not [r for r in rows if r["Format_Post"] in ("reel", "short", "live")], "aucune vidéo"
# Les 168 posts doivent tous être distincts. Les stories des créneaux récurrents
# (rappel d'offre du samedi) se répètent volontairement — c'est un rendez-vous.
assert len(set(r["Titre"] for r in posts)) == len(posts), "titres de posts non uniques"
# Couverture des 5 offres sur toute fenêtre de 3 semaines glissantes
offres = {"Formations", "Club Digitos", "Rysmo", "Agence", "Accompagnement"}
for start in range(1, 11):
    window = {r["Offre"] for r in rows if start <= r["Semaine"] <= start + 2}
    manquantes = offres - window
    assert not manquantes, f"semaines {start}-{start+2} : offres absentes {manquantes}"
print("  ✓ contrôles OK (0 vidéo, titres uniques, 5 offres couvertes sur 3 semaines glissantes)")

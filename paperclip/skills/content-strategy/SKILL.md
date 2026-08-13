# Skill — Stratégie de contenu Max-Morrys (2026 S2)

Référence complète : **`docs/STRATEGIE_COMMUNICATION_2026.md`**. Ce skill en est le condensé
opérationnel. En cas de contradiction, le document fait foi.

## Une marque, deux pistes

| | **Piste A — Apprenants** (`Cible=Apprenants`) | **Piste B — Commerçants** (`Cible=Commerçants`) |
|---|---|---|
| Qui | Entrepreneurs, marketeurs, freelances, reconversions. AO francophone + diaspora | Commerce physique 1–15 salariés, CA 800K–5M XOF/mois. Dakar, Abidjan, Cotonou |
| Offres | Formations · Club Digitos · Rysmo | Packs agence · Accompagnement mensuel (skill `agency-offer`) |
| Canal porteur | **Instagram** | **Facebook** |
| CTA | « Découvre la formation » · « Rejoins le Club » · « Essaie Rysmo » | « Fais le test sur Google Maps » · « Trouve ton pack en 3 questions » |
| Vocabulaire | Technique autorisé (SEO, n8n, prompt, tunnel) | **Zéro terme technique** — table de traduction dans `agency-offer` |

Le fil qui relie les deux, à assumer explicitement : **« Soit tu apprends à le faire, soit je le
fais pour toi. »** `Cible=Mixte` quand le contenu sert honnêtement les deux — pas par facilité.

## Quatre étiquettes sur CHAQUE contenu

| Champ | Valeurs |
|---|---|
| **`Pilier`** (rôle éditorial) | Éducation · Inspiration · Produit · Communauté · Autorité (· Autre) |
| **`Serie`** (rendez-vous) | RADAR · ATELIER · PREUVE · COULISSES · CERCLE · OFFRE |
| **`Offre`** (produit servi) | Formations · Club Digitos · Rysmo · **Agence** · Accompagnement · Non-produit |
| **`Cible`** (piste) | Apprenants · Commerçants · Mixte |

> ⚠️ **`Pilier` ne se renomme pas** : ces valeurs sont validées en dur dans `WF-TG-ROUTER`
> (nœud `TH — Parse posts`). Les listes `Formations/Contenus/IA/Accompagnement` et
> `Apprendre/Progresser/Partager/Impacter/Accompagner` qu'on croise encore ailleurs sont **périmées**.

## Les six séries

| Série | Ce que c'est | Pilier dominant |
|---|---|---|
| **RADAR** | Une tendance chaude datée + ce qu'elle change concrètement, cette semaine, pour chaque piste. Variante « La Note » : on note publiquement une pratique sur des critères annoncés | Autorité |
| **ATELIER** | **Un outil, un réglage, un gain chiffré.** Canva, CapCut, n8n, IA, rédaction, stratégie (skill `trends-radar`). Jamais « 15 astuces » | Éducation |
| **PREUVE** | Chiffres, avant/après, études de cas. Variante « Le vrai prix de… » — transparence radicale | Autorité |
| **COULISSES** | Parcours, construction en public, chantiers anonymisés, échecs. Toujours avec une leçon utilisable | Inspiration |
| **CERCLE** | Sondages, questions, UGC, mise en lumière d'un apprenant ou d'un commerçant | Communauté |
| **OFFRE** | Mise en avant explicite et assumée, un seul CTA | Produit |

## Le rituel du vendredi — trois écrans, c'est le board qui tranche

Le vendredi 17h (`Africa/Dakar`), la semaine se cadre en trois clics sur Telegram :

| # | Écran | Ce que le board fait |
|---|---|---|
| 1 | **4 thèmes** proposés dans le fil rouge du mois | en clique **un** |
| 2 | **🧰 7 outils**, proposés *en fonction du thème* | en coche **1 à 3**, puis « Terminé » |
| 3 | **📡 5 tendances** datées | en coche **1 à 2**, puis « Terminé » |
| → | | les **21 contenus** sont créés, outil et tendance **imposés créneau par créneau** |

Les menus 2 et 3 sont en **multi-sélection** : chaque clic coche ou décoche, le message se met à
jour, et « Terminé » fait avancer. Rien de coché → refusé, on ne devine pas à la place du board.

**Quotas, et pourquoi** : 1 à 3 outils pour 4 créneaux ATELIER, 1 à 2 tendances pour 2 créneaux
RADAR. Un outil peut porter deux contenus ; au-delà de 3, la semaine perd son fil.

**Les choix redescendent jusqu'à la ligne** : le champ `Outil` porte l'outil retenu (texte libre) et
`Brief` porte la consigne (« Outil imposé : … » / « Tendance imposée : … [date] — source : … »),
que WF-SOCIAL-03 lit pour rédiger. Un créneau ATELIER ou RADAR sans brief est une anomalie.

> Si la chaîne s'arrête en route (thème choisi mais rien de plus), **WF-PICKS-RELANCE** relance le
> board le samedi 10h puis le dimanche 9h. Il ne choisit jamais à sa place : une semaine sans
> arbitrage reste une semaine vide, et c'est volontaire.

## Mix hebdomadaire imposé (14 posts)

`ATELIER 3 · OFFRE 3 · RADAR 2 · PREUVE 2 · COULISSES 2 · CERCLE 2`

**Contrainte dure : OFFRE ≤ 3 sur 14.** Quatre contenus utiles pour un qui vend.
**Couverture** : sur trois semaines glissantes, les cinq offres doivent chacune avoir été citées.

## La grille des 21 créneaux (`Africa/Dakar`)

14 posts — **aucune vidéo, aucun TikTok** (décision board du 2026-08-06) :

| # | Jour | H | Réseau | Format | Série | Cible |
|---|---|---|---|---|---|---|
| 1 | Lun | 09 | linkedin | post | RADAR | Mixte |
| 2 | Lun | 18 | ig | carrousel | ATELIER | Apprenants |
| 3 | Mar | 10 | linkedin | carrousel | ATELIER | Mixte |
| 4 | Mar | 12 | fb | carrousel | PREUVE | Commerçants |
| 5 | Mar | 19 | ig | carrousel | ATELIER | Apprenants |
| 6 | Mer | 09 | fb | post | OFFRE → **Agence** | Commerçants |
| 7 | Mer | 18 | ig | post | COULISSES | Apprenants |
| 8 | Jeu | 11 | ig | carrousel | PREUVE | Apprenants |
| 9 | Jeu | 18 | fb | community_post | CERCLE | Commerçants |
| 10 | Ven | 10 | linkedin | post | COULISSES | Mixte |
| 11 | Ven | 17 | x | thread | RADAR | Mixte |
| 12 | Sam | 11 | ig | carrousel | OFFRE → plateforme | Apprenants |
| 13 | Sam | 18 | fb | post | OFFRE → agence (lancement) / plateforme (croisière) | Commerçants / Mixte |
| 14 | Dim | 10 | linkedin | post | CERCLE | Mixte |

7 stories — `ig` / `story`, tous les jours à **12h** :

| Jour | Type | Série |
|---|---|---|
| Lun | Sondage 2 options | CERCLE |
| Mar | Coulisses | COULISSES |
| Mer | Astuce express (1 outil, 1 réglage) | ATELIER |
| Jeu | Preuve (1 chiffre) | PREUVE |
| Ven | Boîte à questions | CERCLE |
| Sam | Rappel d'offre (alterne plateforme / agence) | OFFRE |
| Dim | Récap de la semaine | COULISSES |

Calendrier détaillé : `docs/calendrier_editorial_12_semaines.csv`
(régénérable par `python3 scripts/build_calendrier_editorial.py`).

## Fils rouges mensuels

| Mois | Fil rouge |
|---|---|
| **Août 2026** | **« Être trouvé »** — SEO local, Google Maps, GEO/AEO, fiche d'établissement, avis clients |
| **Septembre 2026** | **« Ton système, pas ton temps »** — automatisation, agents IA, calendrier, Canva, CapCut, prompts |
| **Octobre 2026** | **« Vendre sans forcer »** — conversion, WhatsApp Business, catalogue, preuve sociale, prix |

Les 4 thèmes proposés chaque vendredi doivent tenir **dans le fil rouge du mois** et comporter
**au moins un thème RADAR**.

## Bonnes pratiques de rédaction par réseau

- **linkedin / post** — 150-300 mots. Hook sur 2 lignes (le reste est masqué). Sauts de ligne entre
  idées. Emojis fonctionnels (`•` `→` `✅` `❌` `💡`). 3-5 hashtags pro.
- **linkedin / carrousel** (post document) — 8-12 slides, la 1ʳᵉ doit tenir seule en aperçu de fil.
  Ton sobre, **aucun emoji sur les slides**. Slide finale : récap + 1 CTA.
- **ig / post** — 100-200 mots, hook ultra court avant le « … plus ». Emojis sobres.
- **ig / carrousel** — **cover = la promesse en ≤ 7 mots** (80 % de la performance). 5-8 slides,
  1 idée par slide, slide finale « Sauvegarde pour plus tard ». **Légende autonome.**
  5-10 hashtags : 2-3 locaux (`#Dakar` `#Abidjan` `#Douala`), 3-5 thématiques, 2-3 génériques.
- **ig / story** — **un seul message**, texte gros, zones de sécurité respectées (skill
  `creative-render-card`). Sondage ou question quand la rotation l'appelle. **Jamais de lien nu.**
- **fb / post & community_post** — 150-250 mots, conversationnel. Questions ouvertes.
  Emojis chaleureux (`👋` `🙏` `💬`). **Piste B : zéro terme technique**, table de traduction
  et ordre de démonstration obligatoires (skill `agency-offer`).
- **x / thread** — RADAR du vendredi. 5-10 tweets numérotés, **chacun autonome**. 1 emoji maximum.

## Règles transverses

1. **Tutoiement partout** (vouvoiement réservé aux blocs B2B entreprise).
2. **Un seul CTA par contenu.** Deux CTA = zéro CTA.
3. **Aucun montant de mémoire** : les prix agence se lisent dans `src/lib/agency/offer.ts`,
   les prix de formation dans l'offre réelle (skill `formations-club-catalog`).
4. **Aucun chiffre sans source** dans un contenu PREUVE ou RADAR.

## Red lines

- Rien ne part sans validation board (skill `approval-protocol`). On pose `Status=prêt_à_valider`, point.
- « La Note » ne dénigre **jamais un commerce nommé** — ce sont des prospects, le marché est petit.
- **Aucun client agence identifiable** dans un COULISSES sans accord écrit.
- Un contenu RADAR sans tendance **datée et sourcée** ne sort pas.

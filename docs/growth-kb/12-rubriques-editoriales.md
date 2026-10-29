# 12 — Rubriques éditoriales récurrentes (social, lettre, blog)

> Décidé en comité « contenu 360 » (Awa, Aminata, Thierry, Rokia) le 29/10/2026. Statut : proposition, **en attente de la validation de Max** (plan complet : `_bmad-output/growth/2026-10-29-plan-editorial-nov-jan.md`). Pour Mariam (lots), Aminata (calendrier), Cheikh (plume), Salimata (visuels).
> Les règles de `00-essentiel.md` et de `10-community-management.md` restent valables ; ce fichier n'ajoute que les rubriques.

> **Cadence décidée par Max le 29/10/2026 : 8 à 10 posts par semaine + 7 stories.** Les rubriques gardent leur rendez-vous ; on réduit d'abord COULISSES et CERCLE ; OFFRE ≤ 2 par semaine.

## Principe

Une rubrique est un **sous-format** rangé dans une des six séries NocoDB, qui ne changent pas : RADAR · ATELIER · PREUVE · COULISSES · CERCLE · OFFRE. Elle sert à **éduquer** et à fidéliser : c'est un rendez-vous reconnaissable, pas un post isolé.

`Contenus` n'a pas de champ « Rubrique ». On la note donc à trois endroits :
- en tête du `Titre` : « Flash du lundi #3 — … » ;
- en première ligne du `Brief` : « Rubrique : Flash du lundi » ;
- dans le `sourcil` du visuel : `LE FLASH DU LUNDI · N°3`. Aucun emoji sur le visuel.

## Les 8 rubriques

| Rubrique | Promesse | Série | Fréquence, créneau (heure de Dakar) | Format, `Gabarit` |
|---|---|---|---|---|
| **Le Flash du lundi** | 3 actus marketing de la semaine, et ce que ça change pour toi | RADAR | hebdo, lun. 19 h IG | carrousel 5 slides : couverture, 1 actu par slide, « Ce que je ferais cette semaine » |
| **Nouveau sur…** | une nouveauté Meta, Google, TikTok ou WhatsApp, testée, avec « Dispo chez nous ? » | RADAR | toutes les 2 sem., jeu. 12 h FB | `affiche` ou `etapes` |
| **Le mot du digital** | un mot du métier expliqué en 3 lignes, avec un exemple d'ici | ATELIER | hebdo, mar. 19 h IG + story du mercredi | `affiche` ; parfois un carrousel de 3 mots |
| **Mythe ou réalité ?** | une idée reçue, la vraie réponse, la source | PREUVE | toutes les 2 sem., mar. 12 h FB (sondage en story la veille) | `avant_apres` (« Mythe » / « Réalité ») |
| **Le vrai prix de…** | ce que ça coûte vraiment : FCFA, temps, data | PREUVE | toutes les 2 sem., mar. 12 h FB (alterne avec Mythe ou réalité) | `chiffre` (source obligatoire) |
| **L'outil à 0 F** | un outil gratuit, un réglage, un gain ; testé sur un Android d'entrée de gamme, sans carte bancaire | ATELIER | hebdo, jeu. 19 h IG | carrousel `etapes`, champ `Outil` rempli |
| **Ta question, ma réponse** | tu demandes, je réponds en public | CERCLE | hebdo : boîte à questions en story le vendredi, réponse le mer. 19 h IG | `citation` (question anonyme) ou `question` |
| **Décrypte cette pub** | une campagne de grande marque démontée en 4 points réutilisables | RADAR | mensuelle, jeu. 12 h | carrousel, schéma redessiné (pas de capture d'une création protégée) |

**Grille v2 (14 posts par semaine).** 6 créneaux de rubrique fixes : lun. 19 h IG Flash · mar. 12 h FB Mythe ou Vrai prix · mar. 19 h IG Mot · mer. 19 h IG Ta question · jeu. 12 h FB Nouveau sur, Décrypte ou RADAR du fil rouge · jeu. 19 h IG Outil à 0 F. Les 8 autres créneaux vont au fil rouge du mois et aux OFFRE (3 au plus : mer. 9 h FB agence, sam. 11 h IG plateforme, plus un créneau du week-end).

**Lettre** (une par mois, le jeudi qui suit un article ; ⛔ elle ne part que si l'envoi réel marketing est ouvert, voir `08-emailing.md`) : le Flash du mois, l'article, le mot du mois, l'outil à 0 F du mois. Un seul CTA.

**Blog** : la page pilier « Lexique du marketing digital » regroupe les mots de la rubrique « Le mot du digital ». Chaque post y renvoie dès qu'elle est publiée.

## Règles de veille (Thierry) — non négociables

1. Chaque fait porte une URL, une date de publication, une date de consultation et une citation exacte, dans le `Brief`. Aucun chiffre demandé à un modèle.
2. Flash : des faits de moins de 30 jours, dont au moins 1 local (paiement mobile, régulation, plateforme vue depuis Dakar). S'il n'y a que 2 faits solides, on en publie 2.
3. Nouveau sur… : annonce officielle datée **et** test sur nos comptes. La mention « Dispo chez nous ? Oui / Pas encore / Annoncé seulement » est obligatoire.
4. Mythe ou réalité : seulement des idées reçues qu'une source officielle tranche (aide Google, aide Meta, CGV…). Une opinion ne fait pas une « réalité ».
5. Le vrai prix : nos prix se lisent dans le code (`src/lib/club/pricing.ts`, `src/lib/presence/offer.ts` en HT, `worker/apps/api/src/lib/bictorys.ts`). Un calcul d'exemple porte l'étiquette « exemple ». Aucun prix de concurrent sans source datée.
6. L'outil à 0 F : la gratuité se vérifie le jour même ; on indique le poids de l'appli et si elle marche sans connexion. Au moins 2 outils sur 3 hors des incontournables (Canva, CapCut, WhatsApp Business, fiche Google).
7. Décrypte : grandes marques seulement, analyse neutre ou positive, lien vers l'original. Jamais un petit commerce, jamais un concurrent dénigré.
8. Ta question : question réelle et anonymisée. Les questions posées à Rysmo ne servent qu'en **thèmes agrégés**.

**Sources à suivre.**
- Plateformes : Meta Newsroom, blogs WhatsApp et WhatsApp Business, journal des modifications de Meta for Developers, blog Instagram, blog Google, blog Google Search Central, aide Google Business Profile, notes de version de Gemini, TikTok Newsroom, LinkedIn News.
- Afrique de l'Ouest : ARTP Sénégal, BCEAO, GSMA (mobile money), DataReportal (*Digital 2026*), ANSD, communiqués de Wave et d'Orange Money ; presse : Le Soleil, APS, Fraternité Matin, Financial Afrik, TechCabal.
- Nous-mêmes : requêtes GSC (table `seo`), commentaires, DM, `/contact`.

## Ce qu'on ne fait pas

- Aucun contenu commercial accroché à une fête religieuse : Magal, Gamou, Tamkharit, Noël, Ramadan, Korité, Tabaski, Vodun. Au plus un vœu neutre, sans offre.
- Aucune remise de fête ni de Black Friday sur nos offres. Aucune fausse urgence.
- Aucune actualité politique. Aucun logo ni aucune image de compétition sportive.
- Aucune rubrique quotidienne. Aucune promesse de cadence dans un texte public.

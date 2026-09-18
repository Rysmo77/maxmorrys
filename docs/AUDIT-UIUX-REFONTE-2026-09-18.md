# Audit UI/UX de la refonte en deux pistes — constats et corrections

**Objet** — relire la refonte livrée le 17/09/2026 comme un visiteur la lit : page après page,
à la suite. Chercher en priorité les doublons de pages et de sections.
**Date** — 18 septembre 2026. **Branche** — `feature/refonte-deux-pistes`.

---

## 1 · Pourquoi cet audit a trouvé quelque chose

Au moment de le commencer, toutes les portes du dépôt étaient vertes : `lint`, `typecheck`,
`build`, 957 tests unitaires, 128 tests de règles, 418 tests Worker, `proof:check`, `ds:check`,
`og:check`.

**Aucune de ces portes ne regarde ce qu'un visiteur voit.** Elles vérifient des invariants de
données, de jetons et d'URL — pas si deux pages racontent la même chose, pas si une carte est
cliquable, pas si une rangée de puces tient sur un téléphone. Sept lots de refonte ayant été
menés en parallèle sur des périmètres étanches, chacun a résolu correctement son problème, et
personne n'a lu les cinq pages d'affilée.

Trois des défauts ci-dessous n'existaient que parce que deux lots corrects se rencontraient.

---

## 2 · Méthode, et ce qu'elle ne couvre pas

Trois inventaires exhaustifs (piste Conception · pages pivot et chrome · composants et design
system), puis cinq mesures faites sur le dépôt et sur un navigateur réel :

- comparaison exacte des 14 catalogues français ;
- détection de paraphrases par similarité de Jaccard sur les chaînes de plus de 60 caractères ;
- graphe des liens internes ;
- **relevé au navigateur** : Chrome en métriques d'appareil émulées, `document.fonts.ready`
  attendu avant toute lecture, 8 routes × 7 largeurs × 2 langues.

**Limites assumées.** Le graphe de liens est bâti par expression rationnelle et ne voit pas les
tables — il a d'abord fait croire que l'accueil ne reliait aucune piste, ce qui est faux
(`Home.tsx:76-77`). Et la première estimation du débordement mobile, purement arithmétique,
était **25 % trop haute** : c'est la mesure au navigateur qui a donné les vrais chiffres, et qui
a surtout corrigé la nature du symptôme.

---

## 3 · Les doublons — ce qui a été trouvé, et ce qui a été fait

| # | Constat | Correction |
|---|---|---|
| **D1** | **L'accueil et À propos étaient la même section.** 28 mots identiques mot pour mot, la même formule d'ouverture, des libellés de bouton identiques au caractère près, le même texte alternatif de portrait, et **les mêmes 4 compteurs** issus du même `getPublicCounts()` | Répartition : l'accueil dit ce qu'**est** chaque piste, À propos ce que Max-Morrys y **fait** (CDC §4.4). Les compteurs restent sur À propos ; l'accueil garde un seul fait daté et **renvoie** au décompte. Une requête Firestore de moins sur la seule page non-`lazy()` |
| **D2** | **Deux bandes « méthode » de quatre étapes** sur la piste Conception, rendues par **15 lignes de JSX identiques ligne pour ligne** | Le dessin passe dans un composant partagé ; la page mère garde **la méthode de travail**, la page sur-mesure devient **le parcours d'engagement**. Chacun des trois faits qui se chevauchaient a désormais une seule adresse |
| **D3** | **La même énumération de prestations, trois fois** — deux identiques à 1,00, rendues sur deux pages — puis redéveloppée en cinq cartes sur la page qui venait de l'écrire | Deux écritures : une pour l'écran, une pour les machines. Le chapô de la page sur-mesure **ouvre** désormais la section au lieu de la répéter |
| **D4** | Le renvoi My Onoma écrit **9 fois**, avec une **contradiction d'attribution** (« acquisition » → My Onoma ici, → Cléa ailleurs) et **trois casses** du nom | Le nom vient du code par interpolation. L'attribution nomme deux étages — la société, puis sa practice — ce qui dissout la contradiction : les deux formulations ne s'opposaient pas, elles désignaient deux niveaux sans le dire |
| **D5** | **22 panneaux de vérité** sur les pages publiques, dont **4 titres réutilisés à l'identique** | Un seul panneau par page. Neuf titres réécrits pour nommer chacun leur objet. `/club-des-digitos` passe de 3 surfaces à 1 sans perdre un fait |
| **D6** | **Trois cartes du même dessin pour deux objets.** La séparation projet client / venture — que `clients.ts` exige — ne tenait plus que par le texte d'une étiquette | Une coque partagée, deux adaptateurs qui épinglent chacun leur constante. **Une page ne peut plus exprimer le mauvais appariement** |
| **D7** | **7 paires clé/valeur identiques à l'octet près** entre deux namespaces | Source unique dans `shared`, qui est toujours chargé — donc sans ajouter de namespace paresseux à la page mère |
| **D8** | **Deux sorties identiques** sur la page commerçants : bandeau (haut) et pont (bas), questions jumelles, même bouton | Le bandeau cesse de poser une question et redevient un panneau indicateur. Le pont garde la sienne : elle s'adresse à quelqu'un dont le besoin a grandi en lisant |
| **D9** | **Le pied de page pointait deux fois vers `/contact`**, sans rien qui distingue les deux | La seconde entrée mène à `?rdv=1`, et la page ouvre le créneau d'appel. Deux **états**, plus deux liens jumeaux |
| **D10** | « sous deux jours ouvrés » **3 fois** dans un entonnoir ; « Voir les formations » dans **8 clés de 8 namespaces** | Deux écritures à deux instants distincts. Et `common.cta.*` livré — une décision d'août 2026 jamais mise en œuvre |

**Un doublon trouvé par la garde elle-même, pendant son écriture** : sur `/blog`, la même phrase
était lue **deux fois sur un seul écran** — dans le bloc de la page et dans le pied de page.

---

## 4 · Les défauts introduits par la refonte

### F1 · Les sous-navigations débordaient sur mobile — mesuré, corrigé, gardé

`SubNav` n'avait jamais servi qu'à **deux puces**. La refonte l'a emmenée à trois et quatre, sur
toutes les pages des deux pistes, sans que personne mesure.

**Le symptôme n'était pas une barre de défilement.** Faute de mécanisme de débordement, le
navigateur élargit la fenêtre visuelle pour absorber le dépassement : sur un téléphone de
390 px, `/apprendre` s'affichait à **458** — tout le contenu 15 % plus petit que dessiné. Et
avant d'en arriver là, les puces se **comprimaient** dans une pilule dont la hauteur est figée
à 42 px.

| | avant | après |
|---|---|---|
| Fenêtres gonflées (56 combinaisons) | **22** | **2** |
| `/apprendre` à 390 px | 440 demandés dans 354, fenêtre à 458 | la rangée défile, fenêtre à 390 |
| Témoin à 2 puces | comprimait ses puces à 320 px | défile, largeur naturelle préservée |

Les 2 restantes après ce correctif — `/en/learning` à 375 et 390 px — relevaient d'un défaut
**distinct**, identique avant et après. **Racine trouvée par bissection du DOM** : le titre du
héros anglais. `SiteDisplay` rend chaque ligne en `nowrap` (AD-13 : les titres ne sont pas
traduits, ils sont ÉCRITS par langue avec leurs propres coupures), et « YOU READ. YOU LISTEN. »
réclamait **402 px dans une colonne de 354**. Le français, « TU LIS. TU ÉCOUTES. », en demande
344 : il tenait, de justesse.

L'anglais a été recoupé en quatre lignes — un verbe par ligne, ce qu'il gagne en rythme.
**Mesure finale : 56 combinaisons sur 56, aucune fenêtre gonflée.**

C'est aussi ce qui explique l'anomalie non monotone qui m'avait arrêté : `--dsp-wrap` replie
les lignes **sous** 375 px, et la colonne devient assez large **au-delà** de 420. Le défaut ne
pouvait donc exister que dans cette bande étroite — celle des téléphones les plus répandus.

### F6 · Quatre autres titres trop longs, trouvés par le même geste

Le relevé prescrit par `display-fit.test.ts` — « refaire ce relevé est le geste à reproduire
quand on touche à un titre long » — a été passé sur **28 routes × 2 largeurs, les deux langues**.
Il a trouvé douze lignes débordant leur colonne, dont trois gonflaient la fenêtre :

| Ligne | Demandait | Colonne | Sort |
|---|---|---|---|
| « Trois packs. Les prix sont affichés. » | 359 px | 339 | recoupée en deux lignes écrites |
| « Three packs. The prices are shown. » | 366 px | 339 | recoupée |
| « Why there are no star ratings here » | 356 px | 339 | recoupée |

Ces titres étaient des chaînes d'un seul tenant, réemployées en données structurées : la coupure
vit donc dans une clé `titleLines` dédiée, et la chaîne plate reste pour le balisage, qui ne veut
pas de lignes.

**Quatre lignes restent tendues**, à 375 px uniquement : « CONCEPTION WEB » (349), « avec
[MAX-MORRYS BUSINESS]. » (348), « TU LIS. TU ÉCOUTES. » (344), « with [MAX-MORRYS BUSINESS]. »
(349), pour une colonne de 339. Elles dépassent leur colonne **sans sortir de l'écran** : à
375 px, une ligne ne casse la fenêtre qu'au-delà de **357 px** (la largeur moins la gouttière).
Il leur reste donc 8 à 13 px. Elles ne sont pas corrigées : recouper le titre principal de
l'accueil pour dix pixels de marge coûterait plus que le défaut. **Le seuil est écrit ici pour
que la prochaine retouche sache où est le bord.**

### F2 · `aria-current="page"` mentait
Sur une fiche, la puce de l'index se déclarait page courante. Une distinction `page` / `section`
est passée dans la primitive et propagée aux trois fiches du produit. Rien ne change à l'écran :
c'est une correction qui ne s'entend que dans une synthèse vocale.

### F3 · La piste commerciale n'avait aucune sortie
Zéro lien vers `/contact` sur `/conception`, `/conception/projets-sur-mesure` et
`/conception/realisations`. **La page mère de la piste la plus chère se terminait sur un lien
sortant du site.** Un composant de sortie partagé est monté sur les pages mères — pas sur la page
sur-mesure, qui *est* le formulaire.

### F4 · Deux barres de puces, deux sens opposés
Sur l'index des réalisations, la navigation de piste et les filtres avaient la même forme, avec
deux puces « actives » simultanées. Réglé par un sourcil (« Filtrer par catégorie ») plutôt que
par une seconde forme de pilule : trois langages coûteraient plus que la confusion corrigée.

### F5 · Deux promesses retournées, servies aux moteurs
Le miroir SEO affirmait à **quatre endroits** « chaque leçon a une transcription » et « le poids
de chaque vidéo est annoncé » — pendant que le produit disait l'inverse à l'écran, de son plein
gré. Corrigé, **et fermé** : `proof:check` règle 10 porte désormais une entrée qui lit l'aveu du
produit comme preuve, et sa portée s'étend au miroir SEO, qu'elle ne balayait pas.
*Cette phrase avait été reconduite la veille en resynchronisant l'accueil : l'erreur est de moi.*

Et « Cosmétique Almadies » — l'exemple d'ancrage local, un différenciateur du positionnement —
ne survivait plus que dans le miroir. Il est rendu à la piste Apprendre, devant le blog qu'il décrit.

---

## 5 · Cohérence de système

Corrigés : la barre de filtres qui réimplémentait `ChipRow` (que les trois autres index publics
emploient) · la page mère sans aucun `Button` · les tons divergents pour une même action · quatre
rayons hors échelle et `rounded-xl` détourné en cadre de portrait · une classe CSS du design
system prise à la main · deux pastilles d'icône hors famille · `CheckLine` redessinée faute d'un
ton d'alerte · deux en-têtes qui se justifiaient par un namespace supprimé.

**Non fait, et c'est une décision.** Les cinq implémentations du geste « choisis une porte » ne
sont pas unifiées. `TerritoryCard` peint un dégradé et bascule ses textes sur l'encre de carte ;
les cartes de `/conception` portent des `CheckLine` et des `Tag` dont les tons sont des valeurs
de *page* — sur un dégradé, ils virent au gris sale. Il faudrait **deux élargissements du design
system** pour reconstruire un dessin qui tient déjà la seule contrainte dure du cahier des
charges (deux cartes de poids strictement égal). À la place, la règle est écrite : *carte de
territoire = on entre dans une piste ; verre = on choisit dans une page déjà entrée.*

---

## 6 · Ce qui a été vérifié et qui tenait

- **La séparation des pistes est stricte** : aucune page d'une piste ne lie l'autre ; elles ne se
  croisent qu'à l'accueil, sur À propos et au pied de page — exactement le §3.1 du CDC.
- Un `h1` unique et correct sur les huit pages · aucun contrôle rendu deux fois et visible
  simultanément dans la barre haute · l'aperçu de site n'est pas une copie de ce qu'il remplace
  mais une réécriture qui corrige six écarts de jeton.
- **Les primitives React du design system ne sont pas régénérées** : `ds:sync` et AD-1 ne couvrent
  que le CSS. Les corrections apportées à `SubNav`, `ChipRow`, `GlassPanel` et `CheckLine` ne
  seront pas écrasées à la prochaine livraison du kit.

---

## 7 · Neuf gardes nouvelles

Toutes structurelles : le dépôt n'a aucun harnais de rendu, et en ajouter un est une décision,
pas un détail.

| Garde | Ce qu'elle rend impossible |
|---|---|
| `copie-doublons` | Une phrase de plus de 60 caractères servie à deux endroits. Exemptions ancrées sur des **chemins de clés**, jamais sur une valeur — une exemption qui cite la phrase se périme au premier mot changé |
| `subnav-debordement` | Le retour du débordement mesuré. L'en-tête porte le relevé avant/après |
| `subnav-page-courante` | Une fiche qui se déclare index |
| `sortie-contact` | Une page mère sans porte de sortie — un défaut d'**absence**, la classe qu'aucun outil ne voit |
| `cartes-realisation` | Une page qui nomme la relation d'une venture |
| `titres-verite-uniques` | Un titre de panneau de vérité qui conviendrait ailleurs |
| `marque-noms` | Une casse du nom de la société tapée dans un catalogue |
| `rayons-refonte` | Un rayon hors échelle sur les surfaces de la refonte |
| `chips-uniques` | Une pilule redessinée hors du design system |

⚠️ **Quatre de ces gardes ont dû apprendre à ignorer les commentaires** — dont la première
version de l'une d'elles, qui s'est déclenchée sur l'en-tête expliquant précisément pourquoi le
motif interdit n'était pas employé. Un nettoyage laisse toujours derrière lui un commentaire qui
cite ce qu'il a retiré.

Et une garde existante a été **étendue** : `route-namespaces` ne scannait que le fichier de route
et ne suivait pas les imports. Monter sur une page un composant qui lit un autre namespace passait
le test **tout en rendant les clés brutes en production**. Elle suit désormais les imports locaux.

---

## 8 · État des vérifications

```
npm run lint          0 erreur (22 warnings préexistants)
npm run typecheck     0 erreur
npm run build         ✓
npm test              82 fichiers, 988 tests — tous verts   (957 avant)
cd worker && npm test 418 tests — tous verts
npm run proof:check   0 constat  ·  règle 10 étendue au miroir SEO, et vérifiée comme mordante
npm run ds:check      0 constat
npm run og:check      47 cartes
```

⚠️ **`npm run seo:check` interroge la production**, pas la branche (`scripts/seo-check.mjs:25`).
Il ne prouve rien du travail livré tant que le Worker n'est pas déployé.

---

## 9 · Ce qui reste ouvert

1. **« Stratégie de marque » : MY ONOMA ou Max-Morrys Agency ?** Le CDC §5.1 la range côté
   MY ONOMA ; `docs/BRAND-ARCHITECTURE.md §3` en fait une capability de Max-Morrys Agency, et
   `practices.build.discipline` contient `Brand`. **Les deux documents se contredisent.** Le CDC
   a été suivi — la piste refuse donc à l'écran une capability que son modèle de données lui
   attribue.
3. **Les compteurs ont quitté l'accueil** — écart assumé au CDC §4.1, décidé explicitement.
4. **Un titre dupliqué subsiste, en console** : `admin:settings.panelSupportScopeTitle` =
   `errors:forbidden.scopeTitle`. Les deux surfaces sont hors du périmètre de cet audit — l'une
   n'est lue que par un opérateur, l'autre est une page d'erreur.
5. **Quatre titres tendus à 375 px**, documentés au §4 avec leur seuil de rupture (357 px).

# Contenu à fournir

Ce document liste ce que la plateforme **ne peut pas publier** en l'état, faute d'élément
vérifiable dans le dépôt. Rien de ce qui suit n'a été inventé, deviné ou reconduit par défaut.

Règle appliquée : lorsqu'une information manque, elle est marquée `TODO_CONTENT` et **la
surface concernée reste vide plutôt que fausse**.

_Dernière mise à jour : 13 août 2026._

---

## 1. Chiffres publiés — non vérifiables et contradictoires

### Constat

| Chiffre | Où | Problème |
| --- | --- | --- |
| `+340 %` croissance de trafic en 1 an | `src/pages/Home.tsx:26-31` | Contredit la page À propos |
| `+1 790 %` trafic | `src/pages/About.tsx` (hero + section impact) | Contredit la page d'accueil |
| `+5 plateformes` | `src/pages/About.tsx` | Le tableau juste en dessous en liste **6** |
| `50+ étudiants formés` | `home.json` (`manifesto.statValue`, `stats`) | Aucune source ; affiché à deux endroits |
| `94 % taux de réussite` | `Home.tsx:26-31` | Aucune source, aucune méthode de calcul |
| `10+ cours créés` | `Home.tsx:26-31` | Aucune source |
| `+8 000 abonnés (dont +4 000 LinkedIn)` | `About.tsx` | Aucune source, non daté |

Les deux chiffres de trafic ne peuvent pas être vrais simultanément sans périmètre explicite :
`+1 790 %` est libellé « De 34 à 643 visites mensuelles en un an » sur Eyone Medical, tandis
que `+340 %` est présenté sans périmètre sur la page d'accueil.

### Action attendue

Pour **chaque** chiffre conservé, fournir : la valeur, le périmètre exact, la période et la
source (capture GA4, Search Console, export plateforme). Un chiffre sans ces quatre éléments
est retiré, pas arrondi.

### Règle appliquée dans le code

Aucun chiffre n'a été modifié, ni supprimé, ni recalculé. La nouvelle page `/agence` est
livrée **sans aucune preuve chiffrée** : ni compteur, ni logo client, ni témoignage.

---

## 2. Portraits de Max-Morrys — images générées

### Constat

Les deux visuels présentés comme des portraits de Max-Morrys sont des fichiers distants dont
le nom indique une génération par IA :

| Emplacement | Fichier |
| --- | --- |
| `src/pages/Home.tsx:24` (section Manifeste) | `media.maxmorrys.me/A-propos/ChatGPT Image 14 mai 2026, 00_49_18 (3).png` |
| `src/pages/About.tsx:441` (portrait principal) | `media.maxmorrys.me/A-propos/ChatGPT Image 14 mai 2026, 00_44_30 (1).png` |

Leurs attributs `alt` sont « Max-Morrys » et « Max-Morrys Eyoum ». Une image générée présentée
comme le portrait d'une personne réelle est un problème de crédibilité sur une plateforme dont
tout le positionnement repose sur l'authenticité du praticien.

Le dépôt ne contient **aucune photographie** de Max-Morrys. `src/assets/` n'existe pas. Les
quatre `.webp` de `public/` sont des banques d'images génériques (vérifiées visuellement) :
`chiffres-parlent.webp`, `contenu-gratuit.webp`, `methode-complete.webp`, `niveau-superieur.webp`.

### Action attendue

Fournir des photographies réelles : un portrait vertical (À propos), un format paysage
(accueil), et idéalement deux ou trois photos de contexte (atelier, prise de parole, plateau).

### Règle appliquée dans le code

**Aucune substitution automatique.** Les visuels existants n'ont pas été remplacés par
d'autres images générées, et aucun portrait n'a été produit. Le constat est consigné ici.

---

## 3. STEPS — deux présentations incompatibles

### Constat

| Source | Présentation |
| --- | --- |
| `src/pages/About.tsx:59` + `about.json` | « STEPS Magazine », `stepsmag.com`, tag **Média**, dans la liste des _plateformes que je maintiens_ |
| `My-onoma/apps/web/src/lib/brand/ventures.ts` | **STEPS**, catégorie Media, `operator` et `owner` = **MY ONOMA SARL**, mention « A MY ONOMA Venture » |

Les deux affirmations ne sont pas nécessairement contradictoires — on peut maintenir
techniquement une plateforme détenue par une société — mais elles sont **présentées
différemment sur deux sites publics**, sans que la relation de propriété soit lisible.

### ✅ Tranché le 13 août 2026

**STEPS est une venture MY ONOMA, et rien d'autre.**

La section « Plateformes que je maintiens » de la page À propos a été fusionnée dans les
Réalisations de `/agence`. STEPS n'a **pas** suivi : il reste dans `ventures.ts`, présenté sous
la seule mention « A MY ONOMA Venture ». La présentation concurrente a disparu avec la section
qui la portait.

Il n'existe donc plus qu'une seule affirmation publique sur la propriété de STEPS, et elle est
alignée sur le dépôt corporate qui fait autorité.

### Règle appliquée dans le code

`src/lib/brand/clients.ts` porte un avertissement explicite interdisant d'y ajouter STEPS :
l'y faire figurer le rendrait deux fois sur `/agence`, avec deux relations contradictoires.

---

## 3bis. Page À propos — incohérences relevées à la fusion des sections

Le 13 août 2026, les sections « Expériences professionnelles » et « Parcours » ont été
fusionnées en une frise unique : elles listaient les **4 mêmes employeurs sur la même période**,
et les jalons qui distinguaient réellement « Parcours » (2014-2021) étaient repliés par défaut.

La comparaison a fait remonter trois constats, **non tranchés**.

### a. Titre du poste — ✅ résolu

Le même emploi portait **trois libellés** : « Responsable Marketing Digital, Growth &
Automatisation IA », « Marketing & Growth Manager » et « Expert en marketing digital, SEO et
IA » (JSON-LD de l'accueil). Tout est aligné sur **« Marketing & Growth Manager »**.

### b. `worksFor` divergent — ouvert

Les deux `Person` du site ne déclarent pas le même employeur :

| Page | `jobTitle` | `worksFor` |
| --- | --- | --- |
| `/a-propos` | Marketing & Growth Manager | **Eyone Medical** |
| `/` | Marketing & Growth Manager | **Max-Morrys** (le site) |

Même personne, mêmes profils `sameAs`, deux employeurs déclarés. Ce n'est pas une coquille mais
une question de fond : lequel doit figurer dans les données structurées ? À trancher.

### c. Contradiction de diplôme — ouvert

`parcours.p1` affirme : _« Je ne suis pas le genre qui te dira qu'il a tel MBA ou tel **Master en
Marketing Digital** (même si j'en ai un) »_.

Or les jalons publiés listent « Master en Gestion & Développement d'Entreprises — BEM Dakar »
(2020) et « Master en Digital Business — BEM Dakar » (2023). **Aucun master en marketing digital
n'apparaît.** Soit le récit désigne l'un des deux par un raccourci, soit un diplôme manque à la
frise.

### d. Répétition des chiffres — ouvert

`+1 790 %` apparaît **quatre fois sur la seule page À propos** (hero, résumé d'impact, bloc
expertise, jalon 2024) et `+8 000 abonnés` **trois fois**. Ces chiffres sont déjà signalés comme
non vérifiables au §1 ; leur répétition en amplifie la portée. Aucun n'a été retiré.

### e. Piste SEO non exploitée

Le JSON-LD `Person` n'expose ni `alumniOf` ni `hasOccupation`. Les ~5 500 caractères
d'expériences et les deux masters ne servent donc à rien pour le référencement. Hors périmètre
du chantier, mais l'occasion est là.

---

## 4. Rôle de Max-Morrys au sein de MY ONOMA

### Constat

Le dépôt My-onoma est explicite (`docs/CONTENT-TODO.md §5`) :

> Max-Morrys n'est **pas** présenté comme Practice Lead ou Founder : cette information n'est
> pas validée.

Or maxmorrys.me publie déjà, dans la frise de la page À propos
(`about.json`, `milestones.m2023Onoma`) :

> « My Onoma — Digital Marketer Freelance / Premiers contrats freelance… **Co-création de
> My Onoma**. »

et une entrée d'expérience « My Onoma — Digital Marketer Freelance, Janvier 2023 – Octobre 2023 ».

Ces mentions sont **antérieures** à ce chantier et relèvent du récit de parcours. Elles n'ont
pas été supprimées, mais elles divergent de la position tenue par le site corporate.

### Action attendue

1. Confirmer si « co-création de My Onoma » peut être publié.
2. Le cas échéant, aligner les deux dépôts — et fournir la fonction exacte si elle doit
   apparaître.

### Règle appliquée dans le code

**Aucun rôle, titre ou fonction n'a été ajouté.** Le site énonce uniquement la relation de
marque : _Max-Morrys Agency est la practice Product, AI, Technology & Brand de MY ONOMA._
Aucune affiliation MY ONOMA n'a été ajoutée au JSON-LD `Person`.

---

## 5. Selected work — preuve de la page /agence

### Constat

Le dépôt ne contenait, avant ce chantier, **aucune** trace d'Amour Divin, DOVEN ou NAYO. Les
données publiées proviennent intégralement de
`My-onoma/apps/web/src/lib/brand/{clients,ventures}.ts`, elles-mêmes sourcées des sites publics
des produits.

### Ce qui est publié

- **Amour Divin** — `amourdivin.app`, Consumer Product, `owner: client`. Rôle : product
  strategy, product design, UX/UI, engineering, platform architecture, design system, security
  rules. Stack : Next.js, React, TypeScript, Tailwind CSS, Firebase, Cloudflare Workers,
  Cloudflare R2.
- **DOVEN / NAYO / STEPS** — nom, catégorie, domaine, statut.

### Ce qui n'est pas publié

Aucune métrique, aucun chiffre d'utilisateurs, de revenus, de traction ou de levée. Aucune
donnée contractuelle. Aucune information non accessible publiquement.

### À confirmer avant publication

⚠️ **Le périmètre s'est élargi une seconde fois le 13 août 2026.** Onze dépôts git ont été
fournis, portant à **douze** le nombre d'organisations nommées publiquement sur `/agence`.

1. **Accord écrit pour l'usage du nom, de l'aperçu et la publication**, pour chacune des douze :
   Amour Divin, Khanouss, Loma, HolyCash, English Lab, Klio Pro, ResHo Konnexion, Je Témoigne,
   LauraVerse, Dunamis Holydays, Jubilé de Grâce, IN Sénégal 2026.
   Le dépôt My-onoma porte le même point ouvert pour Amour Divin
   (`LEGAL-ALIGNMENT-TODO.md §6`).

2. ✅ **Eyone Medical — résolu.** Retiré de `/agence` : c'est l'employeur de Max-Morrys, pas un
   client. La question soulevée précédemment est tranchée.

3. **⚠️ Le rôle tenu n'est publié que pour ce que le code prouve.** La règle de déduction figure
   en tête de `src/lib/brand/clients.ts` :

   | Preuve dans le dépôt | Capability publiée |
   | --- | --- |
   | code applicatif | `engineering` |
   | `firestore.rules` | `securityRules` |
   | Worker Cloudflare ou monodépôt | `platformArchitecture` |
   | dépendance LLM déclarée | `aiAutomation` |

   **`productStrategy`, `productDesign`, `uxui` et `designSystem` ne sont publiées pour aucun
   des onze nouveaux projets** — un `package.json` ne prouve ni un cadrage produit ni un travail
   de design. Seul Amour Divin les porte, parce qu'elles étaient déjà sourcées. Les compléter
   suppose de pouvoir les documenter.

4. **⚠️ Domaine à confirmer — LauraVerse.** `lauraverse.blog` est déduit d'un sous-domaine
   (`img.lauraverse.blog`) trouvé dans le dépôt, pas d'une URL canonique. Si l'adresse publique
   diffère, l'aperçu retombera sur le nom de domaine.

5. Les captures d'écran sont générées à la volée depuis les **sites publics**. Aucune donnée
   privée n'est exposée, mais publier l'aperçu d'un site tiers relève du même accord que le nom.

---

## 6. Ressources

L'architecture cible évoquait une rubrique « Ressources ». Le dépôt ne contient **aucune**
ressource téléchargeable : ni fichier, ni collection Firestore, ni page, ni segment d'URL.

**Aucune page `/ressources` n'a été créée** — elle serait vide. À rouvrir le jour où il y a
quelque chose à y mettre.

---

## 7. Témoignages

Les témoignages proviennent de Firestore (`getFeaturedTestimonials`) et d'un jeu de démonstration
(`src/data/testimonials.ts`). Aucun n'a été ajouté, modifié ou déplacé.

La nouvelle page `/agence` **ne comporte aucun témoignage**. Pour en publier, chaque entrée doit
porter : `name`, `role`, `organization`, `context` — et être authentique.

---

## 8. Visuels de la page /agence

Les visuels de l'ancienne page agence (`media.maxmorrys.me/Agence/hero.webp` et `process.webp`)
suivent l'offre « Digital Commerce Local » vers `/presence-digitale`.

La `/agence` reste construite **sans photographie** : sa qualité repose sur la typographie, la
mise en page, le rythme et la hiérarchie. Aucun visuel générique n'y a été introduit — ni
dégradé violet/bleu, ni blob, ni robot, ni circuit imprimé, ni faux dashboard, ni photo de
bureau artificielle.

### Mise à jour du 13 août 2026 — la section Réalisations a des aperçus

La page n'est plus entièrement sans image, et la distinction mérite d'être posée : ce ne sont
pas des **illustrations**, ce sont des **captures réelles de sites en production**, générées à
la volée depuis leurs URLs publiques. C'est exactement le type de preuve vérifiable qui manquait
à la page — l'opposé d'un faux dashboard.

Mécanisme repris tel quel de la page À propos, où il tournait déjà en production :
`s.wp.com/mshots` en bureau, `api.microlink.io` en mobile, chargement différé, repli sur le nom
de domaine en cas d'échec. Aucun ajout de domaine à la CSP n'a été nécessaire — `img-src`
autorise déjà `https:`.

⚠️ Ces services sont **tiers et gratuits** : ni disponibilité ni fraîcheur garanties. Le repli
textuel existe pour cela. Si la page devient critique commercialement, envisager des captures
figées hébergées sur `media.maxmorrys.me`.

# Refonte en deux pistes — livraison du lot 1

**Cahier des charges** — « Refonte du site Max-Morrys · Séparation en deux pistes », v1.0 du 14/09/2026.
**Date de livraison** — 17 septembre 2026.
**Branche** — `feature/refonte-deux-pistes`.
**Périmètre livré** — lot 0 (audit, document séparé) et lot 1 en entier. Les lots 2 et 3 ne sont pas commencés.

---

## 1 · Ce qui est en service après cette branche

### L'architecture à deux pistes

| Route | État | Namespace i18n |
|---|---|---|
| `/conception` | **neuve** — page mère, registre professionnel | `conception` |
| `/conception/commerces-et-tpe` | déplacée depuis `/presence-digitale` | `presence` |
| `/conception/commerces-et-tpe/devis/:ref` | déplacée | `presence` |
| `/conception/projets-sur-mesure` | **neuve** — sur devis, aucun prix affiché | `conception` |
| `/conception/realisations` | **neuve** — portfolio technique | `realisations` |
| `/conception/realisations/:slug` | **neuve** — une fiche par réalisation | `realisations` |
| `/apprendre` | **neuve** — page mère de la piste média et formation | `apprendre` |
| `/agence` | **supprimée**, 301 vers `/conception` | — |
| `/presence-digitale` | **supprimée**, 301 vers `/conception/commerces-et-tpe` | — |

Contreparties anglaises : `/en/design`, `/en/design/shops-and-small-business`,
`/en/design/custom-projects`, `/en/design/work`, `/en/learning`.

**Aucune URL de blog, de formation, de podcast ou de FAQ n'a bougé.** C'était l'interdit le plus
ferme du CDC, et la recette du §9.2 le vérifie exhaustivement.

### La navigation

La barre haute porte quatre entrées neutres — **Conception · Apprendre · À propos · Contact**.
Les six verbes à la première personne ne sont pas supprimés : ils **descendent d'un étage**, dans
les deux sous-navigations de piste (`src/components/navigation/PisteSubNav.tsx`), où ils
s'adressent au bon public. Aucun menu déroulant au survol : les deux entrées mènent à des pages
mères qui présentent leur piste.

Conséquence assumée : les entrées de la barre ne portent plus de filet de territoire. Ni
« Conception » ni « Apprendre » n'EST un territoire — la première vit hors des quatre verbes, la
seconde les contient tous les quatre. La correspondance couleur ↔ territoire est rendue par les
deux `SubNav`, une pastille par verbe.

### Le registre

| | Piste Conception | Piste Apprendre |
|---|---|---|
| Voix | vouvoiement strict, « nous / vous » | tutoiement, première personne — **inchangé** |
| Exception | `/conception/commerces-et-tpe` garde son ton direct, **et porte le bandeau de segment** | — |

`tests/unit/voix-tutoiement.test.ts` interdisait le vouvoiement dans **tous** les catalogues
français. Il est désormais **par piste et bidirectionnel** : les catalogues de la piste Conception
ne peuvent pas tutoyer, les autres ne peuvent pas vouvoyer. Sans cette modification, le CDC était
inapplicable — et une simple exemption aurait laissé les deux catalogues neufs sans aucune garde.

### Le pont avec My Onoma — trois liens, pas un de plus

1. l'accueil, une phrase et un lien sortant ;
2. `/conception`, le bloc « Pour un projet intégré » ;
3. le pied de page, la mention de rattachement (elle existait déjà).

Les trois passent par le même composant, `src/components/brand/MyOnomaBridge.tsx`, et par la même
URL, `corporateUrl` de `src/lib/brand` — jamais une adresse retapée.

**Plus aucune prestation de direction marketing, de stratégie de marque ou d'acquisition n'est
proposée à la vente sur maxmorrys.me** (objectif O3). Ce qui a été retiré est listé au §3.

---

## 2 · Ce qui a été trouvé en chemin — défauts réels, corrigés

Aucun de ces quatre n'était dans le périmètre du CDC. Tous étaient vivants.

1. **Les demandes de formation d'équipe s'affichaient en clé brute dans la console.**
   `AdminMissions` rend `admin.missions.projectTypes.<type>`, où `training` manquait dans les deux
   langues. Le test qui prétendait garder ce libellé épinglait un autre catalogue — `agency.json`,
   que plus personne ne rendait. Le libellé est posé, le test réorienté.
2. **L'URL du devis partageable — celle qui part sur WhatsApp — était construite à la main**
   (`usePresenceQuote.ts`), avec une troisième copie de la table des segments. Elle aurait survécu
   au déménagement en pointant vers une redirection, sans qu'aucune porte le voie.
3. **Les trois ventures avaient disparu du site** quand `/agence` a été absorbée : `VentureCard`
   n'avait plus aucun point de montage. Le bloc est reposé sur `/conception`, avec l'étiquette de
   relation rendue à l'écran sur chaque carte — la distinction que `clients.ts` et `ventures.ts`
   exigent ne vivait que dans un titre de section.
4. **`tests/unit/route-namespaces.test.ts` lisait les commentaires.** Expliquer pourquoi on
   n'utilise PAS un namespace suffisait à le faire échouer. Il retire désormais les commentaires
   avant analyse, comme son voisin le fait déjà.

Trois fichiers morts ont été retirés avec leur objet : `src/pages/Agence.tsx`, les cinq composants
de `src/components/agency/`, et le catalogue `agency.json` avec son entrée dans `LAZY_NAMESPACES`.

---

## 3 · Décisions humaines en attente

Elles sont **commerciales ou contractuelles**, pas techniques. Rien ne les bloque à l'écran ;
chacune laisse aujourd'hui le site dans un état honnête mais incomplet.

| # | Point | État livré | Décision attendue |
|---|---|---|---|
| 1 | **Villes du bandeau de segment** | « Dakar, Abidjan, Cotonou », formulé comme un MARCHÉ, jamais comme une implantation | La seule adresse documentée est Dakar. Si l'on ne veut affirmer que le prouvable, corriger le bandeau **et** les deux phrases du miroir SEO en même temps |
| 2 | **Prix de la formule Commerce 360** | Grille **inchangée**. La 6ᵉ puce — « un accompagnement commercial » — a été retirée : elle vendait du conseil marketing | La formule perd un argument sans perdre un franc. Assumer, ou réajuster le prix |
| 3 | **Nom commercial de l'offre TPE** | « Présence Digitale » conservé partout (libellés, WhatsApp, devis). Seule l'URL a changé | Renommer commercialement, ou non |
| 4 | **Durée et résultat mesurable des réalisations** | **Non affichés.** Les emplacements existent, vides ; une note de dette visible dit l'absence et sa raison | Il faut les DEUX : une valeur publiquement vérifiable, et un accord de publication élargi — l'accord actuel ne couvre aucun résultat |
| 5 | **Certificats délivrés sur l'accueil** | **Non affiché.** La collection n'est lisible que par son titulaire et l'admin ; un visiteur ne peut pas la compter | Poser un compteur public agrégé, ou renoncer au chiffre |
| 6 | **Ancienneté de publication** (« publie chaque semaine depuis X ») | **Non affirmée.** L'accueil montre la date de la dernière publication, lue en base | Relever une date vérifiable, ou garder la formulation actuelle |
| 7 | **URL du formulaire MY ONOMA** | La branche « direction marketing » de `/contact` renvoie vers la page de la practice Cléa, faute de mieux | Si un vrai formulaire existe, l'ajouter à `src/lib/brand/company.ts` — une ligne à changer ensuite |
| 8 | **Trafic par section** | **Inconnu du dépôt.** Aucun chiffre n'a été écrit | Exige un accès Search Console `sc-domain:maxmorrys.me`. C'est une condition de sortie du lot 0 au CDC §9.1 |

Deux points de l'annexe du CDC sont tranchés par la livraison : le nom de la piste est
**« Conception »**, et le contenu de `/agence` est **absorbé** par `/conception` et
`/conception/projets-sur-mesure`. La marque « Max-Morrys Studio » n'est utilisée nulle part.

**Hors périmètre, mais relevé par l'audit** : la case « analytics » de la bannière de consentement
est **pré-cochée** (`src/components/shared/CookieBanner.tsx`). C'est un défaut RGPD antérieur à la
refonte, indépendant du CDC, et il n'a pas été corrigé ici.

---

## 4 · Ce que la recette du §9.2 donne aujourd'hui

| Point de recette | Résultat |
|---|---|
| Aucune URL de blog, formation, podcast n'a changé | ✅ vérifié exhaustivement, pas par échantillon |
| Redirections `/presence-digitale` et `/agence` en place et testées | ✅ 301 des deux côtés (hébergement **et** bord), couvertes par les tests du Worker |
| Achat d'une formation par Wave, Orange Money, carte | ⛔ **non joué** — exige trois paiements réels chez Bictorys. Aucun code du tunnel n'a été modifié |
| Connexion au Club et vérification d'un certificat | ⛔ **non joué** — aucun code de ces chemins n'a été modifié |
| Un visiteur atteint sa piste en un clic depuis l'accueil | ✅ deux cartes de poids strictement égal |
| Bandeau de segment présent ; Projets sur mesure sans tutoiement | ✅ le second est tenu par un test, plus par la relecture |
| Budgets de performance | ⛔ **aucun critère de passage** — il n'existe aucun budget chiffré dans le dépôt (audit §6.3) |
| Accessibilité AA vérifiée, tunnel compris | ⛔ non joué — aucun outil d'accessibilité n'est installé |
| Les trois liens My Onoma pointent vers des pages publiées | ⚠️ à vérifier **après** la mise en ligne de My Onoma |
| Aucune direction marketing vendue sur maxmorrys.me | ✅ |

### Ce qui a été exécuté et qui passe

```
npm run lint          0 erreur (22 warnings préexistants)
npm run typecheck     0 erreur
npm run build         ✓
npm test              957 tests, 73 fichiers — tous verts
npm run test:rules    128 tests — tous verts  (exige JAVA_HOME=/opt/homebrew/opt/openjdk@21)
cd worker && npm test 418 tests — tous verts
npm run proof:check   0 constat
npm run ds:check      0 constat
npm run seo:check     0 contradiction
npm run og:check      47 cartes présentes
```

---

## 5 · Mise en ligne — trois gestes, dont deux manuels

**L'ordre du CDC §9.1 est impératif** : ce lot se livre **après** la mise en ligne de My Onoma.
Un renvoi vers une page qui n'existe pas encore est pire que pas de renvoi du tout.

1. **Le frontend** part par la CI, au `push` sur `main` (origin-pull depuis `max-morrys.web.app`).
   Les cartes d'aperçu des routes neuves sont des fichiers statiques de `public/og/`, déjà générés
   et commités : elles partent avec le build.
2. **Le Worker doit être déployé à la main.** C'est lui qui porte les 301 servies au bord, le
   pré-rendu des pages neuves, le sitemap et les cartes OG. Tant qu'il n'est pas déployé, les
   nouvelles routes existent pour les humains et **pas pour les moteurs**.
   ```
   cd worker/apps/site && npx wrangler deploy
   npx wrangler versions view --json      # la seule lecture qui dise ce qui est EN SERVICE
   ```
3. **Les règles Firestore** ne changent pas de comportement — seuls leurs commentaires ont été mis
   à jour, plus quatre cas de test neufs sur `messages`. Un déploiement n'est pas nécessaire ;
   s'il est fait, c'est `firebase deploy --only firestore:rules`.

**Après la bascule, à vérifier en premier** : que `/presence-digitale` et `/agence` répondent bien
301 en production, et que les trois liens My Onoma ouvrent des pages publiées.

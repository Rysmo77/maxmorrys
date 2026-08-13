# Audit UX/UI — maxmorrys.me

Constat daté et décisions retenues. _13 août 2026._

---

## 1. Le problème central — la bifurcation n'est pas lisible

Un visiteur qui arrive sur maxmorrys.me comprend vite qu'il peut **apprendre**. Il ne comprend
pas qu'il peut **faire construire**.

| Symptôme | Constat |
| --- | --- |
| L'agence est un lien de navigation ordinaire | Aucun bouton plein dans l'en-tête ; le seul bouton solide est « Connexion » sur mobile |
| L'agence apparaît **une fois** sur l'accueil | Position 5 sur 12, sous « Tu as un commerce ? » — un fondateur de startup passe à côté |
| L'entrée s'appelle « Je te digitalise » | Le libellé annonce un service aux commerçants, pas une practice produit |
| La page À propos se termine par « Travaillons ensemble » → `/contact` | Le seul appel B2B du site renvoie vers un formulaire générique, pas vers l'agence |

**Décision** : l'agence obtient une entrée de navigation neutre (« Agence ») **et** le premier
bouton plein de l'en-tête (« Travaillons ensemble »). L'accueil gagne une section « Build with
me » distincte de la section commerce local.

### Addendum — 13 août 2026 : la bifurcation était lisible, pas les deux offres

La décision ci-dessus a résolu la visibilité de l'agence, et créé un problème voisin : les deux
sections commerciales de l'accueil se lisaient comme deux variantes d'une même offre.

| Cause mesurée | Correctif appliqué |
| --- | --- |
| Sections **adjacentes** (5 et 6 sur 13), même conteneur, même échelle typo, même pastille | Le quiz orange s'intercale : agence (5) → quiz (6) → présence (7) |
| La section agence déclarait `grid lg:grid-cols-2` avec **un seul enfant** → colonne droite vide, elle passait pour une version appauvrie de sa voisine | Bloc centré `max-w-3xl`, purement typographique, sans carte. La présence garde ses 4 cartes : les squelettes ne sont plus partagés |
| `home.presence.cta` = « **Découvrir l'offre agence** » pointait vers `/presence-digitale`, à côté de « Découvrir l'agence » → `/agence` | « Voir les packs et les tarifs ». Le mot « agence » disparaît du bloc commerce ; le prix devient le signal qui sépare |
| `home.agency.eyebrow` = « **Travailler avec moi** », le libellé le plus générique du site : un commerçant s'y reconnaît | « Max-Morrys Agency ». Une section porte un **nom d'entité**, l'autre pose une **question d'audience** |

**Deuxième décision** : « Je te digitalise » **revient en navigation**, pointant cette fois vers
`/presence-digitale`. Le libellé n'a jamais été fautif — c'est sa destination qui l'était (il
menait à `/agence` du temps où l'offre TPE y vivait). Voir `AGENCY-POSITIONING.md §9`.

**Troisième décision** : le renvoi entre les deux offres devient **réciproque**. `/agence`
renvoyait vers `/presence-digitale` sans contrepartie : un fondateur atterrissant sur la page
commerce n'avait aucune sortie. Un bloc miroir a été ajouté en bas de `/presence-digitale`.

Écart §1 corrigé au passage : `About.tsx` — « Travaillons ensemble » mène désormais à `/agence`.
Le CTA générique « Prendre contact » du bloc final garde `/contact`.

---

## 2. Deux audiences, un seul registre

Tout le site tutoie, y compris la page commerciale. Or les deux offres ne s'adressent pas aux
mêmes personnes :

| Territoire | Audience | Registre retenu |
| --- | --- | --- |
| LEARN — formations, blog, podcast, vidéos | Apprenants, entrepreneurs individuels | **Tutoiement** — « Je te forme », « Je t'informe » |
| PRÉSENCE DIGITALE | Commerçants, décideur unique | **Tutoiement** — inchangé, c'est ce qui fonctionne |
| AGENCY | Fondateurs, PME, scale-ups, institutions | **Vouvoiement** |

Le système « Je te… » est un actif de marque rare et mémorable : il est **intégralement
préservé** sur LEARN. Seule l'entrée agence en sort.

### Incohérences de registre préexistantes

La page FAQ mélangeait **trois registres dans la même page** : « Tu ne trouves pas ta
réponse ? » et « N'hésite pas à me contacter » (tu), « Nous contacter » (nous), « Écrivez-moi
directement » et « Trouvez rapidement des réponses à vos questions » (vous).

**Décision** : la FAQ est harmonisée au tutoiement — elle s'adresse aux apprenants.

En revanche, `formations.business.cta` (« Discutons de votre projet ») **n'est pas** une
erreur : il porte l'offre *Max-Morrys Business*, qui s'adresse à des organisations souhaitant
former leurs équipes. Son vouvoiement est cohérent avec la règle ci-dessus — B2B au
vouvoiement — et a donc été conservé.

Le titre SEO par défaut vouvoie (« Maîtrisez le digital ») alors que le H1 de l'accueil tutoie
(« Maîtrise le digital »). Signalé ([SEO-AUDIT §5](./SEO-AUDIT.md)) mais **non modifié** : il
porte du référencement acquis, et le changer est un arbitrage éditorial, pas un correctif.

---

## 3. Inflation des appels à l'action

Relevé sur les pages publiques :

| Destination | Nombre de formulations | Exemples |
| --- | --- | --- |
| `/formations` | **6** | « Explorer les formations », « Découvrir toutes les formations », « Voir les formations », « Trouve ta formation », « Voir les nouveautés », « Ou découvre mes formations » |
| `/contact` | **5** | « Prendre contact », « Nous contacter », « Me contacter », « Contacte-moi », « Prendre rendez-vous » |
| WhatsApp (page agence) | **4** | « En parler sur WhatsApp », « Poser ma question sur WhatsApp », « Continuer sur WhatsApp », … |

Dix libellés distincts cohabitent sur la seule page agence. Il n'existe **aucun module de
vocabulaire partagé** : chaque libellé est une clé i18n isolée, donc rien n'empêche la dérive.

**Décision** : introduction d'un vocabulaire CTA partagé (`common.cta.*`) organisé par intention :

```
EDUCATION   Découvrir les formations · Commencer à apprendre
CONTENT     Lire · Regarder · Écouter · S'abonner
AGENCY      Travaillons ensemble · Parlons de votre projet
```

Les libellés spécifiques à un contexte (le tunnel de devis TPE notamment) restent locaux — la
mutualisation ne doit pas appauvrir une page qui convertit.

---

## 4. Accessibilité

### Ce qui est déjà en place

- `ProtectedRoute`, `Modal` (piège de focus + restauration), `Input` (`aria-invalid`,
  `aria-describedby`, `role="alert"`), `Toggle` (`role="switch"`), lien d'évitement
  (`nav.skipToContent`).
- Coupe-circuit global `prefers-reduced-motion` dans `src/index.css`, et `useReducedMotion()`
  honoré dans les presets de `src/lib/animations.ts`.
- Boutons dimensionnés à 36 / 44 / 48 px de hauteur minimale.

### ⚠️ Le piège de contraste `lagoon`

Documenté dans `tailwind.config.js` et `src/lib/sectionThemes.ts` :

> `lagoon-500` sur blanc = **2,6:1** → **interdit pour du texte**.

Règles à respecter : `lagoon-700` pour le texte et les boutons pleins sur fond clair,
`lagoon-400` sur fond sombre, `lagoon-600` pour les indicateurs de chargement. Le remplissage
`bg-lagoon-500 text-neutral-900` est admis comme aplat de signature (8,1:1), **avec texte
sombre**.

C'est l'univers de l'agence : chaque élément de la nouvelle page doit être vérifié contre cette
contrainte.

### Écarts constatés

| # | Constat |
| --- | --- |
| 1 | `Badge` n'a pas de variante `lagoon`, `EditorialHeading` n'accepte pas `lagoon` → risque de contournement par classes inline, hors du système de thèmes |
| 2 | La page 404 s'affiche **sans en-tête ni pied de page** : le catch-all vit dans `AuthLayout`. Un visiteur en 404 n'a aucun moyen de navigation |
| 3 | Les votes 👍/👎 de la FAQ affichent un retour visuel mais **n'écrivent rien** — l'interface promet une action qui n'existe pas |
| 4 | Le formulaire newsletter n'a ni case de consentement, ni lien vers la politique de confidentialité |
| 5 | Deux entrées du pied de page (« Contact » et « Prendre rendez-vous ») pointent vers la même URL |

**Traités dans ce chantier** : 1 (variantes ajoutées) et 4 (consentement explicite, jamais
pré-coché). Les autres sont consignés.

---

## 5. Mobile

L'audience cible est majoritairement mobile. Points de vigilance relevés :

- L'en-tête mobile reprend fidèlement la navigation desktop, avec le repli « Je te transforme ».
- `StickyWhatsApp` apparaît après 600 px de défilement, en tenant compte de la zone sûre iOS.
- L'écran de succès du devis utilise un vrai `<a href>` et non `window.open()` — choix documenté
  dans le code : Safari/iOS bloquerait l'ouverture après un `await`. **À ne pas « corriger ».**
- La vidéo de fond en autoplay de l'accueil est le poste le plus lourd du site sur mobile.

La nouvelle `/agence` est conçue sans image ni vidéo, et vérifiée de 320 à 1920 px.

---

## 6. États vides, erreurs, chargements

Correctement traités : `Skeleton` et `CardSkeleton`, `ErrorBoundary`, retours d'erreur par
`addToast`, écran « Récapitulatif introuvable » avec appel à l'action de repli, `PageLoader` en
`Suspense` sur chaque route, rechargement automatique sur chunk périmé (`lazyWithReload`).

Restent perfectibles : la page 404 sans navigation (§4.2), et l'absence de retour serveur sur
les erreurs de formulaire — toute la validation est côté client.

---

## 7. Design de la page /agence

Contraintes tenues :

- **Aucun** dégradé violet/bleu générique, blob, robot, circuit imprimé, faux dashboard, carte
  flottante arbitraire ni photo de bureau artificielle.
- La qualité repose sur la typographie, la mise en page, le rythme, la hiérarchie et les
  micro-interactions.
- Expression **plus sobre et plus structurée** que le reste du site, dans le **même** design
  system : mêmes tokens, mêmes primitives, mêmes conventions de conteneur et d'espacement.
  Pas de second site visuel.
- Réutilisation de l'existant plutôt que création : `EditorialHeading`, `AnimatedIcon`,
  `Button`, `Card`, `Badge`, `LocalizedLink`, conteneur `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`,
  sections `py-20 lg:py-24` en alternance de fonds.

Contrainte de style du dépôt : `cn()` **n'est pas** `tailwind-merge` — aucune résolution de
conflit. `className` se concatène toujours en dernier, et les classes Tailwind ne se construisent
jamais par concaténation (la purge les supprimerait).

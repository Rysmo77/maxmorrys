# Addendum — PRD Plateforme Max-Morrys

Ce qui relève du *comment*, et n'a pas sa place dans un PRD. Destiné à l'architecture, à la
conception détaillée, et surtout à la personne qui rejoint le projet.

Les sections sont ordonnées par le moment où on en a besoin : ce qu'il faut savoir avant d'écrire,
puis avant de déployer, puis avant de modifier quoi que ce soit de transverse.

> **À savoir avant tout le reste.** Relevé du 30 août 2026 : la plateforme est **déployée mais non
> lancée**. Cinq comptes, aucune vente, aucune formation publiée, deux inscriptions à 0 %. Cela
> change la façon de travailler dessus : **il n'y a pas d'utilisateurs à ménager, mais pas non plus
> de données réelles pour éprouver quoi que ce soit.** Une migration, une règle, un webhook se
> testent ici sur des cas fabriqués — et §2.2 rappelle qu'il n'existe aucun environnement où les
> éprouver autrement.

---

## 1. Avant d'écrire une ligne

### 1.1 Versions — là où l'a priori se trompe

| Couche | Technologie |
|---|---|
| Front | React 18.3.1 · TypeScript strict · Vite 5.4.21 |
| Routage | React Router 7.17.0, data router (`createBrowserRouter`) |
| Styles | Tailwind 3.4.17 — configuration JavaScript, `darkMode: 'class'` |
| État / données | `useState`/`useEffect` majoritaires · TanStack Query dans 10 fichiers |
| i18n | i18next 26.3.2 · 23 espaces de noms, 8 bundlés statiquement, 15 chargés à la demande |
| Backend | Firebase Auth + Firestore · Cloud Functions v2 · Cloudflare Workers |
| Médias | Cloudflare R2 via un sous-domaine dédié — **pas** le stockage Firebase |
| Paiement | Bictorys uniquement |
| IA | Google Gemini |
| Observabilité | Sentry · web-vitals · GTM, GA4, Meta Pixel + API de conversions |

Ces majeures sont plus anciennes que ce qu'un modèle de langage suppose par défaut, et c'est la
première source d'erreur sur ce dépôt. La plupart des écarts ne lèvent aucune erreur de type :
Tailwind 4 casserait silencieusement une quarantaine de jetons de couleur, les idiomes React 19
n'existent pas ici, le mode framework de React Router non plus.

Trois mineures ont par ailleurs dérivé au-dessus de leur valeur déclarée : `package.json`
n'utilise que des carets. **Le fichier de verrouillage fait foi** — installation par `npm ci`
exclusivement, un `npm install` le déplace.

### 1.2 Trois projets TypeScript, aucun fichier partageable

| Projet | Modules | Cible | Types | Vérification en CI |
|---|---|---|---|---|
| `src/` | ESM | ES2020 | DOM | typecheck, lint, tests, build |
| `functions/src/` | CommonJS | ES2017 | Node | typecheck, build |
| `worker/` | ESM | ES2022 | types Workers seuls | typecheck, tests |

Les trois sont bloquants. Le Worker n'a ni DOM ni Node — pas de variables d'environnement de
processus, pas de `Buffer`. Les fonctions, en CommonJS et ES2017, n'ont pas d'attente de haut
niveau.

La duplication serveur est **structurelle**, pas négligente : les trois projets ne pouvant
s'importer entre eux, toute constante partagée est nécessairement recopiée. C'est la cause racine
de NFR-01 et de FR-089.

---

## 2. Avant de déployer

### 2.1 Ce que la chaîne d'intégration continue fait, et ne fait pas

Elle déploie le frontend : un `push` sur la branche principale publie le build sur l'hébergement
Firebase, que le Worker de production sert par origin-pull.

Elle ne déploie ni les règles Firestore, ni les index, ni les Cloud Functions, ni les Workers.
Ceux-là sont construits et vérifiés, jamais mis en ligne (R-11). En particulier, `wrangler deploy`
reste nécessaire pour le code du Worker — pré-rendu, en-têtes de bord, et la table de redirections
`/via/<slug>`, sans laquelle chaque lien d'affiliation distribué répond 404.

Avant d'affirmer quoi que ce soit sur cette chaîne : comparer l'empreinte du bundle servi par le
domaine à celle du build local. C'est la seule vérification qui tranche.

### 2.2 Les trois pièges à conséquence destructrice

1. Vérifiez la branche avant tout `wrangler deploy`. Deux branches déclarent le même nom de
   Worker et les mêmes routes de production, avec des architectures d'assets opposées : déployer
   l'une écrase l'autre.
2. Ne testez **jamais** une migration de données sur une prévisualisation. Il n'existe aucun
   environnement de préproduction : les prévisualisations de propositions de modification se
   déploient sur le projet de production et partagent sa base, ses règles et ses fonctions.
3. Exportez `JAVA_HOME=/opt/homebrew/opt/openjdk@21` avant `npm run test:rules`.
   `firebase-tools` exige Java 21 ; la machine de développement de référence a Java 1.8 par
   défaut, avec le JDK 21 installé mais inactif. Sans cette variable, la commande échoue au
   lancement de l'émulateur, et rien n'indique que les règles n'ont pas été testées.

### 2.3 Reste ouvert

Le job de tests des règles n'est pas dans les prérequis du déploiement : des règles peuvent partir
sans que leurs tests soient verts (FR-088).

Reproductibilité : deux binaires natifs sont requis à chaque construction pour l'optimisation
d'images. Une installation cassée casse la construction entière, pas seulement les images.

### 2.4 État de la migration d'infrastructure

Le produit fonctionne à cheval sur deux fournisseurs. Le Worker implémente les paiements, mais
charges et webhook tournent encore sur les Cloud Functions : le portage existe, activé en
préversion. Une exception connue — la charge d'abonnement au Club est implémentée dans le Worker
mais absente de la liste de préversion. Les médias sont entièrement sur R2.

Les interrupteurs de bascule doivent rester réversibles (NFR-13).

---

## 3. Les modifications qui se propagent

Trois familles de changements touchent plusieurs fichiers à la fois, sans qu'aucun outil ne le
signale. Ce sont les seules pages de ce document à relire clavier en main.

### 3.1 Changer un prix

Le tarif du Club a été recopié à treize endroits sans point de contact, jusqu'à ce que les
conditions générales annoncent 10 000 FCFA pendant que le code en débitait 19 900 — deux valeurs
introduites par deux commits distincts, sur un abonnement engageant douze mois.

| Fichier | Nature | Couvert par un test ? |
|---|---|---|
| `src/lib/club/pricing.ts` | Source unique côté client | oui |
| `functions/src/payment.ts` → `CLUB_PRICE` | Débit réel. Reconstruire `functions/lib` après | non |
| `worker/apps/api/src/lib/bictorys.ts` → `CLUB_PRICE` | Débit réel, port Cloudflare | non |
| `src/i18n/locales/{fr,en}/legal.json` | Texte contractuel, dans les deux langues | oui |
| `finance/model.py` | Projections | non |
| `BUSINESS_MODEL.md`, `BUSINESS_PLAN.md` | Argumentaire | non |

Les quatre « non » sont exactement ce que FR-089 doit fermer : aucun test ne peut atteindre les
miroirs serveur depuis `src/`. La grille TPE a la même structure, plus le corps de texte du
pré-rendu utilisé pour le référencement.

### 3.2 Ajouter ou renommer une route

L'arbre est monté deux fois : en français canonique non préfixé, et sous `/en` par une fonction de
localisation. Les segments d'URL eux-mêmes sont traduits.

*Ajouter* une route demande deux éditions — le chemin français dans le routeur, et son segment
dans la table de traduction. Sans le second, la version anglaise sert silencieusement l'URL
française. Chaque valeur anglaise doit par ailleurs être unique sur toute la table.

*Renommer* un segment public en demande sept :

1. `src/i18n/segments.ts` — la table de segments ;
2. `firebase.json` — les réécritures, 34 au total dont 15 sous `/en` ;
3. `worker/apps/site/src/routes.ts` ;
4. `functions/src/prerender.ts` ;
5. `functions/src/sitemap.ts` ;
6. `worker/apps/site/src/seo/sitemap.ts` ;
7. et, pour le seul segment de retour de paiement, `functions/src/payment.ts` ainsi que
   `worker/apps/api/src/lib/bictorys.ts`, où il est codé en dur.

Le septième est le plus dangereux : renommer le retour de paiement sans le répercuter ferait
atterrir tout paiement en cours sur une page introuvable (NFR-03).

### 3.3 Changer la région d'une fonction

Les régions sont câblées dans les réécritures d'hébergement. Changer la région d'une fonction sans
changer la réécriture correspondante casse son appel.

---

## 4. Conventions de code

- Vérification de types stricte, avec échec sur variable ou paramètre inutilisé : un import mort
  casse la chaîne. L'exemption par préfixe souligné ne vaut que pour les *paramètres*.
- Certains paramètres sont volontairement ignorés côté client parce que le serveur les redérive.
  Ne pas les « corriger » en les supprimant.
- Gestion d'erreur : capture en type inconnu, jamais en type quelconque. Le rétrécissement se fait
  par transtypage, pas par test d'instance.
- N'appelez jamais Sentry directement : passez par `captureError()` (`src/lib/sentry.ts`), qui
  retombe sur la console en l'absence de configuration et reste désactivé en développement.
- Aucun formateur n'est configuré : calquer le style du fichier voisin.
- Le découpage manuel des paquets est une fonction, pas une liste figée : `react-router`, puis
  React et son ordonnanceur, puis l'intégralité des modules Firebase, puis Framer Motion.

### Trois silences à connaître

- La signature du webhook de paiement se calcule sur le **corps brut**, jamais sur un objet
  re-sérialisé : la moindre re-sérialisation change les octets et invalide la signature.
  `verifyWebhookSignature()` (`functions/src/payment.ts`) échoue fermé — absence de signature ou
  de secret vaut rejet.
- Les secrets se déclarent **fonction par fonction**. Un secret oublié dans la déclaration d'une
  fonction n'y lève aucune erreur : il vaut chaîne vide, et le traitement continue avec.
- `updateUserProfile()` (`src/lib/firestore/users.ts`) **filtre avant d'écrire** : tout champ
  absent de `ALLOWED_PROFILE_FIELDS` est retiré de l'objet, et l'écriture réussit sans lui. Il n'y
  a donc **pas d'erreur de permission à chercher** — l'interface semble fonctionner, le champ
  n'arrive jamais. Et si *tous* les champs sont filtrés, la fonction retourne sans écrire du tout.

Enfin, les cartes de source sont émises en mode masqué : déployées sans être annoncées, elles
restent récupérables par qui devine leur nom. Le code de production est lisible.

---

## 5. Invariants à ne pas casser

Quatre propriétés tiennent une correction de sécurité ou d'intégrité. Les défaire rouvrirait un
défaut réel — le récit de ces corrections est en annexe A.

1. Le miroir public de certificat est indexé **par le code de vérification**. C'est ce qui fait de
   la vérification un `get` direct et jamais une requête de liste, donc ce qui rend l'énumération
   des certificats structurellement impossible. Changer son identifiant rouvre la fuite.
2. **Le repère de progression ne décroît jamais**, la règle Firestore l'impose. C'est lui qui
   interdit d'encaisser deux fois le même palier d'expérience. Décocher une leçon doit rester
   permis ; refarmer ne doit pas l'être.
3. Le périmètre du rôle `support` est déclaré dans **une source unique**,
   `SUPPORT_ALLOWED_PATHS` (`src/lib/adminAccess.ts`), lue par le menu et par le garde de route.
   Un second endroit rendrait de nouveau un écran visible sans être atteignable, ou l'inverse.
4. Le helper d'audit **n'échoue jamais bruyamment**. Un échec de journalisation part dans les logs
   et n'annule pas l'opération métier qui vient de réussir. La collection reste fermée en écriture
   au client, admins compris : un journal auquel le sujet de l'audit peut écrire ne vaut rien.

---

## 6. Système de design

Palettes par univers de section, échelles complètes : marque, accentuation, succès, avertissement,
erreur, neutre, plus quatre teintes de section (blog, podcasts et Club, Rysmo, offre TPE) et une
teinte d'identité personnelle.

Contraintes non négociables :

- La teinte d'accentuation de l'offre TPE atteint **2,6:1 sur blanc — interdite pour du texte**.
  Variantes prescrites selon le fond (NFR-09).
- Deux teintes partagent volontairement le même code hexadécimal : choisir par le sens, pas par la
  couleur.
- `cn()` (`src/lib/utils.ts`) **n'est pas** l'association habituelle de `clsx` et
  `tailwind-merge` : c'est une concaténation filtrée, sans résolution de conflit. Concaténez
  toujours la classe entrante en dernier.
- Les identités de section sont exprimées en classes littérales, contrainte de purge.

Accident toléré, à ne pas propager : deux bibliothèques d'icônes coexistent — l'une sur le site
public et l'administration, l'autre sur le Club et l'espace apprenant. Graisses et grilles optiques
diffèrent, la couture est visible au passage de l'un à l'autre. Suivre le fichier environnant, ne
pas étendre à une zone nouvelle.

Absent volontairement : ni composant de section, ni conteneur, ni en-tête de section. La mise en
page est reconstruite à la main selon une convention stable. L'échelle typographique personnalisée
existe mais est quasiment inutilisée.

---

## 7. Conception de Rysmo

Deux choix non évidents, le reste étant spécifié au PRD (FR-037 à FR-045, NFR-10) :

- **Le profil de mémoire est régénéré tous les *N* échanges**, pas à chaque requête — compromis
  entre coût et pertinence.
- **Les quotas quotidiens sont cumulatifs** : socle gratuit, bonus d'appartenance au Club, puis
  remplacement par le quota d'abonnement.

---

## Annexe A — Journal du 29 août 2026

Quatre exigences de la Partie A décrivaient un comportement qui n'existait pas. Elles ont été
corrigées dans le produit avant que le PRD ne les affirme. Les invariants qui en résultent sont en
section 5 ; ce qui suit est le raisonnement, conservé pour qui voudrait le rouvrir.

*Vérification publique des certificats.* Le document de certificat est identifié par
`{uid}_{formationId}`, mais la page de vérification n'en connaît que le code. Elle faisait donc une
requête de liste filtrée sur le code — que la règle refusait, faute de filtre sur l'identifiant du
propriétaire. La vérification échouait pour tout le monde, y compris pour le titulaire.
*Alternatives écartées :* ouvrir la collection en lecture aurait suffi en une ligne, mais aurait
permis d'énumérer tous les certificats émis — donc de compter les clients — et aurait exposé les
identifiants ; un point d'accès HTTP sur le Worker aurait évité tout changement de règle, au prix
d'un saut réseau et d'un chemin de plus à maintenir. *Retenu :* un miroir écrit par la fonction
d'émission, portant titre, date et nom du titulaire, avec un backfill idempotent réservé aux
admins. Effet de bord corrigé au passage : le nom du titulaire n'était jamais affiché, le libellé
existait sans sa valeur.

*Expérience d'apprentissage.* Neuf barèmes déclarés, trois câblés, tous côté Club. Terminer une
leçon ne rapportait rien. Câbler naïvement aurait ouvert une boucle : décocher puis recocher aurait
rapporté indéfiniment, et cette expérience alimente le classement et les badges de parrainage.
*Retenu :* un repère de progression maximale, avec une clé ajoutée à la liste des champs
modifiables. *Alternative écartée :* déplacer l'attribution côté serveur, ce que le commentaire de
la règle recommande comme correctif de fond — c'est un chantier, pas un correctif, et le plafond
par écriture continue de borner l'exposition.

*Périmètre du rôle `support`.* Le garde autorisait admin et support sur la totalité des écrans ;
le drapeau qui déclarait l'intention ne masquait qu'un menu. Taper l'URL suffisait à atteindre les
transactions, les utilisateurs et les paramètres. *Retenu :* une table unique, et **suppression**
du drapeau de navigation — c'était un second endroit où déclarer le même périmètre.

*Journal d'audit.* La collection existait en règle et en index ; rien n'y écrivait. *Retenu :* un
helper serveur appelé depuis les trois fonctions d'administration authentifiées et depuis
l'émission de certificat. Limite assumée et écrite dans l'exigence : les écrans qui écrivent
directement depuis le navigateur ne sont pas tracés (FR-092).

---

## Annexe B — Errata sur les autres documents du dépôt

Quatre affirmations d'autres documents ont été vérifiées fausses. Elles sont consignées ici parce
qu'elles circulent encore et ont déjà induit ce PRD en erreur.

| Document | Affirmation | Réalité vérifiée |
|---|---|---|
| `docs/MAXMORRYS-CURRENT-STATE.md` | Les tests unitaires ne sont jamais exécutés en CI | Ils le sont, et l'étape est bloquante |
| `docs/MAXMORRYS-CURRENT-STATE.md` | La newsletter ne recueille aucun consentement | Case, horodatage, et règle serveur qui l'exige |
| `docs/MAXMORRYS-CURRENT-STATE.md` | `robots.txt` ne couvre pas les routes `/en/` | Les cinq sont exclues |
| `_bmad-output/project-context.md` | Le groupe Firebase ne couvre que quatre modules | Il les couvre tous ; le commentaire du code dit l'avoir corrigé |

Une note antérieure de ce dépôt affirmait par ailleurs que la chaîne d'intégration continue ne
déployait pas le frontend. Elle était fausse, et a fait annoncer deux fois un déploiement manuel
inutile.

*Règle de méthode.* Ces documents servent à savoir où regarder, jamais à savoir ce qui est vrai.
Toute affirmation qu'on en tire se rejoue contre le code avant d'être écrite.

---

## Annexe C — Contexte écarté du PRD

- Onze lignes de service sont décrites dans `BUSINESS_MODEL.md` ; cinq seulement sont
  implémentées et monétisées, et le PRD ne traite que celles-là. Les six autres relèvent de la
  stratégie, pas de la spécification.
- Le modèle financier à cinq ans et ses trois scénarios vivent dans `BUSINESS_PLAN.md` et le
  modèle Python. Le PRD n'en reprend aucun chiffre : ils dépendent d'hypothèses de prix et de
  conversion que la recherche a établies comme non validées. Les deux documents divergent par
  ailleurs d'un facteur 2,7 sur l'année 1 (D-03).
- L'automatisation par workflows externes est un actif d'exploitation réel, mais extérieur au
  produit tel que l'utilisateur le rencontre.
- Les documents contractuels de l'offre TPE existent séparément et font foi côté commercial.
  Ils portent déjà une procédure de conversion J−3 → J+30 à raccrocher à M-12.

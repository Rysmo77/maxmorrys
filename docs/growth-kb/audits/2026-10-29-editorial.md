# Audit de la chaîne éditoriale (blog) de maxmorrys.me — 29/10/2026

Audit en lecture seule. Je n'ai fait aucune écriture dans Firestore, n8n, NocoDB ou Airtable, et je n'ai modifié aucun fichier du dépôt.

**Accès utilisés :**
- les fichiers du dépôt ;
- l'API n8n en lecture (`https://n8n.maxmorrys.me/api/v1`) ;
- le journal d'événements n8n sur le VPS, consulté avec `grep` ;
- l'API NocoDB en lecture ;
- l'API REST Firestore publique (clé web, lecture autorisée par les règles sur `status == 'published'`) ;
- l'API Search Console (scope `webmasters.readonly`) ;
- `npm run seo:check` et des `curl` sur la production avec un user-agent de robot.

**Non vérifié :** les brouillons Firestore. Les règles les réservent aux administrateurs, et la lecture par compte de service a été refusée par le garde-fou de permissions.

---

## TL;DR

1. **La chaîne n8n éditoriale ne produit plus rien depuis le 22/05/2026.**
   - Les 46 articles publiés viennent **tous** de WF-08 : marqueur `createdAt`, HTML Gemini, H1 dans le corps, couverture R2. Ils ont été créés entre le 15/04 et le 22/05/2026.
   - Aucun article n'a été écrit à la main dans l'admin.
   - Depuis la migration vers NocoDB (06/08), WF-08 n'a fait passer **aucune** ligne en `produit_draft` : les 43 lignes dans ce statut portent toutes la date d'import du 06/08 à 13:23.
   - WF-07, WF-08 et WF-09 sont `active=true`, mais **aucune exécution n'a réussi depuis au moins le 05/10** (journal d'événements). Les dernières erreurs sont des `503 high demand` sur `gemini-2.5-flash`, sans relance automatique.
   - Il y a aussi des défauts **structurels** qui empêcheraient WF-08 de produire même si Gemini répondait (section 2).
2. **Le chemin natif du site est sain.** L'admin écrit directement dans Firestore `blog/`. Le Worker prérend l'article avec les métadonnées, le JSON-LD `Article`, le fil d'Ariane, hreflang, le sitemap avec appariement et le RSS. Le contenu est en ligne en moins de 5 minutes ; sitemap et RSS suivent en moins d'1 h.
3. **Le contenu publié s'écarte de la charte actuelle** :
   - 29/46 articles ont des emojis ;
   - 46/46 ont un H1 dans le corps ;
   - 10/46 vouvoient au moins une fois ;
   - on trouve des chiffres et des exemples non sourcés ;
   - les CTA de fin varient (Club, formation, slogan) et ne correspondent pas au CTA fixé par la page.
4. **Le SEO éditorial est quasi nul.** Sur 90 jours, le blog fait **2 clics et 87 impressions** dans GSC. Sur un échantillon de 25 articles, 15 sont indexés, 5 « découverts mais non indexés » et 5 inconnus de Google.
5. **Verdict : la recommandation candidate est la bonne, avec trois amendements** (section 5). Il faut sortir la rédaction de n8n et ne pas réparer WF-08 pour rédiger.

---

## 1. Le chemin réel d'un article aujourd'hui

### 1.1 Stockage

- **Collection :** Firestore `blog/{autoId}` (`src/lib/firestore/blog.ts:5-58`).
- **Type `BlogPost` :** `src/types/index.ts:156-186`.
  - `title`, `slug`, `slug_en?`, `excerpt`, `content` (Markdown ou HTML), `coverImage`, `category`, `tags[]`, `author`, `publishedAt`, `updatedAt?`, `readTime`, `featured` ;
  - `status: 'draft' | 'published' | 'scheduled'` ;
  - champs SEO : `metaTitle`, `metaDescription`, `focusKeyword`, `og*`, `twitter*`, `noIndex`, `canonicalUrl`.
- **Règles :** lecture publique si `status == 'published'`, écriture admin uniquement, plus un `views+1` public (`firestore.rules:172-183`).
- **Le statut `scheduled` n'est pas implémenté.**
  - L'admin ne propose que `draft` et `published` (`src/pages/admin/articles/useArticles.ts:59,142`).
  - Le site ne filtre pas sur `publishedAt <= now` (`blog.ts:8-9`).
  - Une date future publie donc immédiatement. Exemple : `vendre-en-ligne...lois-2026`, créé le 22/05, `publishedAt` au 04/06.
- **Traduction anglaise : rien n'est stocké en dehors de `slug_en`.**
  - Le corps est traduit à la volée côté client par le callable `translateContent` (`src/lib/contentTranslation.ts:1-60`).
  - Ce callable est routé vers `https://api.maxmorrys.me` (`src/config/firebase.ts:41-55`), soit le Worker `worker/apps/api/src/handlers/translateContent.ts`, avec `gemini-2.5-flash` et un cache dans la collection Firestore `translations/`.
  - Pour les robots, le Worker `site` traduit seulement les métadonnées, le H1 et 2 000 caractères du corps (`worker/apps/site/src/prerender/index.ts:179-184`, `worker/packages/shared/src/translate.ts:162-184`).

### 1.2 Qui écrit

| Producteur | Mécanisme | Constat |
|---|---|---|
| **Admin** (`/admin/articles`, `src/pages/admin/AdminArticles.tsx` + `articles/useArticles.ts`) | `savePost` → `setDoc`/`addDoc` client (`useArticles.ts:160-231`). Calcule `slug`, génère `slug_en` (`generateSlugEn`), `readTime`, `author: 'Max-Morrys'`. Si l'article est publié, appelle `notifyOnPublish` (Worker), qui notifie les comptes opt-in (`worker/apps/api/src/handlers/notifyOnPublish.ts`). | Éditeur `RichEditor` (`AdminArticles.tsx:6,226`). **N'écrit jamais `updatedAt`**, donc `dateModified` du JSON-LD = `publishedAt` partout (0/46 articles ont `updatedAt`). |
| **n8n WF-08** | `POST https://firestore.googleapis.com/.../documents/blog` avec un credential `googleApi` (compte de service) qui contourne les règles. Écrit `status: 'draft'`. | **N'écrit pas `slug_en`** (l'article reste « Sans URL anglaise » tant que l'admin ne le réenregistre pas ou que `backfillSlugEn` ne passe pas), écrit un champ hors type `createdAt` et fixe `publishedAt` à la date de création du brouillon. Il n'appelle pas `notifyOnPublish`. La publication passe forcément par l'admin, qui bascule en `published`. |
| Scripts du dépôt | Aucun script versionné de publication d'article. Il existe `worker/apps/api/src/handlers/backfillSlugEn.ts` (callable admin) et `scripts/rewrite-firestore-urls.mjs`. | — |

**Origine des 46 articles publiés** (lecture REST publique, `runQuery` sur `status == published`) :
- tous portent `createdAt`, champ que seul WF-08 écrit ;
- tous ont un corps HTML (`<…`) contenant un `<h1>` ;
- toutes les couvertures sont sur `pub-98fc057d…r2.dev` (étape IMG6 de WF-08) ;
- `createTime` : 31 en avril et 15 en mai 2026, dernier le **22/05/2026** ;
- **conclusion : 100 % sont des brouillons n8n, puis relus et publiés dans l'admin.** L'admin n'a jamais servi à créer un article.

**Doublons en base :** trois slugs français sont publiés deux fois :
- `vendre-en-ligne-afrique-francophone-lois-2026` ;
- `algorithme-instagram-2026-vues-strategie` ;
- `materiel-video-entrepreneur-guide-2026` (l'un avec `slug_en` suffixé `-2`).

`getPostBySlug` prend `limit(1)`, donc l'un des deux est inaccessible en français. Le sitemap neutralise le problème en écartant la paire (`worker/apps/site/src/seo/sitemap.ts:155-190`), mais le RSS publie les 46 éléments, doublons compris.

### 1.3 Prérendu par le Worker (`worker/apps/site`)

- **Routes :** `/blog`, `/blog/**`, `/en/blog/**` (`routes.ts:17,50,75,93`).
- **Résolution :** `resolveBySlug`, sur `slug_en` en anglais puis `slug` (`prerender/content.ts:27-55`). Le chemin anglais est canonisé en retirant `/en` (`prerender/index.ts:114-120`).
- **Métadonnées** (`content.ts:122-172`) :
  - `title` = `metaTitle || title` + ` | Max-Morrys` ;
  - `description` = `metaDescription || excerpt` ;
  - `og:type=article` et `noindex` si `noIndex`.
- **Corps SEO :** H1 et 2 000 premiers caractères.
- **JSON-LD `Article`** : `headline`, `datePublished`, `dateModified`, `author` Person, `publisher` Organization, `articleBody`, `timeRequired`, plus un `BreadcrumbList`.
- **hreflang fr / en / x-default** et canonique (`content.ts:57-70`, `meta.ts:25-29`).
- **Vérifié en production :** `curl -A Googlebot https://maxmorrys.me/blog/tarifs-marketing-fixer-prix-fcfa-2026` renvoie un title correct, la canonique, les trois alternates, `Article` et `BreadcrumbList`, et un seul `<h1>` côté serveur.
- **Sitemap** (`seo/sitemap.ts`) : entrées FR et EN appariées, `lastmod = updatedAt || publishedAt`, articles en `monthly` 0.7. En production : 86 URL `/blog/`, soit 43 paires (46 moins les 3 doublons).
- **RSS** (`seo/rss.ts`) : `/rss.xml`, FR uniquement, 46 éléments.
- **Délais :**
  - publication dans Firestore immédiate ;
  - cache KV des métadonnées 300 s (absence 60 s) (`prerender/index.ts:35-37`) ;
  - sitemap et RSS 3 600 s (`index.ts:54,100-111`) ;
  - l'exploration Google prend ensuite des jours à des semaines (section 4).

**Défauts relevés dans le prérendu :**
- **D1 (P1) — `mainEntityOfPage.@id` faux en anglais.** Il est construit avec le slug de l'URL demandée sans préfixe `/en` (`content.ts:160`). En production, `/en/blog/marketing-rates-…` déclare `@id = https://maxmorrys.me/blog/marketing-rates-…`, une URL qui renvoie le shell en `noindex` (vérifié).
- **D2 (P1) — Métadonnées anglaises servies en français quand Gemini sature.** `translateMetaToEn` revient au français en cas d'erreur (`translate.ts:180-183`) et ce repli est **mis en cache 300 s**. Vérifié à 15 h : `/en/blog/marketing-rates-how-to-set-your-prices-in-fcfa-in-2026` sert `<title>Tarifs Marketing : Comment fixer tes prix…`, `lang="en"`, avec H1 et description en français. D'autres pages anglaises sont, elles, bien traduites. C'est la même saturation Gemini que celle qui casse n8n.
- **D3 (P2)** — Le fil d'Ariane du JSON-LD affiche « Accueil » en anglais.
- **D3 (P2)** — `publisher.logo` pointe vers l'image OG par défaut.
- **D3 (P2)** — Le RSS n'est pas dédoublonné.

---

## 2. Audit en direct des workflows n8n

**Source :** `GET /api/v1/workflows`, soit 37 workflows. La rétention des exécutions est de 14 jours (`EXECUTIONS_DATA_MAX_AGE=336`, `docker exec maxmorrys-n8n env`). Pour remonter plus loin, j'ai lu le journal `n8nEventLog*.log` (depuis le 05/10).

| WF | ID | Actif | Planification | Exécutions depuis le 05/10 | Dernière erreur |
|---|---|---|---|---|---|
| WF-07 Recherche d'idées | `3kpXjWE4azageRz1` | oui | lundi 5 h | 3 échecs (12/10, 19/10, 26/10), **0 succès** | `Gemini Pro — Proposer des sujets` : *503 « This model is currently experiencing high demand »* (exéc. 20042, 18809) |
| WF-08 Rédaction SEO | `2JjbvTHuX2JPp7Fh` | oui | `0 9 * * 1` (lundi 9 h ; le nœud s'appelle pourtant « 9h quotidien ») | 3 échecs, **0 succès** | `Gemini Pro — Rédiger l'article` : 503 (exéc. 20066, 18834) |
| WF-09 Newsletter | `i5EvGUGhVvzKIM2U` | oui | jeudi 8 h | 4 échecs (08, 15, 22, 29/10), **0 succès** | `Gemini Flash — Rédiger newsletter` : 503 (exéc. 20584, 19353) |

Autres workflows liés :
- `WF-EMAIL-SEND — Envoi Brevo` : 2 copies, **inactives**.
- `WF-THEMES`, `WF-SOCIAL-03/04/05/07` : actifs, sociaux, hors périmètre blog.
- `WF-ERR` (`MMERRALERT0001`) est le workflow d'erreur des trois : les échecs ont donc dû remonter sur Telegram.
- 13 workflows sont en doublon inactif (copies du 28/06 et du 04/07). C'est du bruit à nettoyer.

### 2.1 Modèles Gemini
Tous les modèles sont valides : `models/gemini-2.5-flash` pour WF-07/08/09, `gemini-2.5-flash-image-preview` pour la couverture (IMG4). **Aucun modèle 2.0 ou 3.x.**

Mais :
- les nœuds s'appellent « Gemini **Pro** » alors qu'ils tournent en Flash ;
- **ni WF-08 (« Phase Recherche », « Rédiger ») ni WF-09 n'ont `retryOnFail`**. Seul WF-07 l'a, avec 2 essais espacés de 5 s, ce qui ne suffit pas contre un 503.

La cause immédiate de tous les échecs est donc la **saturation transitoire de Gemini, sans relance**.

### 2.2 Où ils écrivent

- **NocoDB `ph7ugup4mggzj2y`** (`noco.maxmorrys.me`) :
  - table `mp8tvctpl38ufmo` « Banque Idees Articles » (1 202 lignes) ;
  - `m460m48wd0qnzsu` « Logs » ;
  - `moz0ikbdwhdryvj` « Cours ».
  - Les nœuds s'appellent encore « Airtable — … », mais ce sont des nœuds `nocoDb`.
- **Firestore en direct**, avec le credential `googleApi` :
  - WF-08 écrit des `POST blog` ;
  - WF-07 lit `messages` et `faq`.
  - Aucun appel aux Cloud Functions : ces workflows ne sont **pas** touchés par la suppression de `functions/`.
- **Airtable résiduel :** pas dans ces workflows. En revanche, **`scripts/gsc-pull.py` écrit toujours dans Airtable** (`apppkEbepilHCYiso/tblhLk66jOUsEhi7G`, l.12-13), via launchd chaque jour à 7 h. Il a encore réussi ce matin (« GSC pull OK: 21 lignes », `~/.cloudflared/gsc-pull.log`).
- **WF-09 n'envoie rien.** Il s'arrête à `Telegram — Preview à l'admin`.

### 2.3 Défauts structurels (qui empêchent la production même avec un Gemini disponible)

- **S1 — WF-08 ne voit que 100 lignes sur 1 202.**
  - `Lire articles valides (NocoDB)` est configuré avec `returnAll: false, limit: 100`, sans filtre côté serveur. Le filtre `Status = valide` est appliqué après lecture.
  - Il reste 5 lignes `valide` (Id 78, 137, 197, 302, 491). L'exécution 20066 n'en a trouvé qu'**une** sur 100.
  - Une fois l'Id 78 produit, **les quatre autres ne seront jamais lues**.
  - Le filtre ne limite pas non plus à un article par exécution.
- **S2 — Personne ne valide les idées.**
  - 1 141 lignes sont en `nouveau` contre 5 en `valide`.
  - Toutes les lignes `valide` datent de l'import du 06/08.
  - Il n'existe aucune interface ni aucun rituel de tri : la file de WF-08 est vide par construction.
- **S3 — WF-07 appelle Gemini une fois par branche.**
  - Le trigger alimente 29 branches (RSS, NocoDB, Firestore) qui convergent toutes sur l'entrée 0 d'un **nœud Code** « Merge — Compiler les données », et non sur un nœud Merge.
  - En `executionOrder: v1`, le Code et Gemini s'exécutent **à chaque branche qui arrive**. L'exécution 20042 a appelé Gemini après la seule branche NocoDB, sans aucun flux RSS.
  - Preuve indirecte : le 19/10, la table Logs a reçu **3 lignes « success » WF-07** (05:01:31, 05:01:51, 05:02:16) pour une exécution qui a fini en erreur.
  - Conséquences : coût et quota Gemini multipliés, idées générées sur des données partielles, doublons.
- **S4 — WF-09 lit la banque d'idées, pas le site.**
  - « Articles récents » vient de NocoDB `Banque Idees` filtrée sur `produit_draft | publié` (nœud `Préparer — Contenu newsletter`).
  - La lettre mettrait donc en avant des **brouillons et des idées sans URL publiée**.
  - Elle ne s'appuie ni sur Firestore `blog` ni sur `/rss.xml`.
  - Elle s'annonce comme « hebdomadaire », alors que `fr/footer.json:39` dit « pas chaque semaine ».
  - Le canal de diffusion réel est Brevo (D-08), et le workflow Brevo est inactif.
- **S5 — La copie de WF-08 dans le dépôt est périmée.** `n8n/redaction-web/WF-08…json` date du 12/04 et n'a ni les nœuds IMG* ni `categoryToPole`. `n8n/live/` n'a pas de snapshot de WF-07/08/09. **La production n'est pas versionnée.**
- **S6 — Champs écrits par WF-08 :** pas de `slug_en`, un `createdAt` hors type, un `publishedAt` égal à la date du brouillon, `canonicalUrl` vide. Ce n'est pas bloquant, mais cela pollue.

### 2.4 Prompts comparés à la charte en vigueur (prompt live de « Rédiger l'article »)

**Conforme :**
- tutoiement systématique ;
- exemples locaux (Afrique de l'Ouest et centrale), FCFA, Wave et Orange Money ;
- les six pôles canoniques sont imposés ;
- les liens internes sont limités aux slugs réels (catalogue Firestore injecté).

**Non conforme :**
- impose `<h1>` dans `content_html`, ce qui donne un **double H1** (la page rend déjà le titre) ;
- autorise **1 à 2 emojis**, alors que le DS dit « aucun emoji, nulle part » ;
- la phase Recherche demande à Gemini « **5 statistiques avec source et date** » et « 3 exemples concrets » **sans aucune recherche web**. Ce sont donc des chiffres et des cas potentiellement inventés, contraires à la règle « aucun nombre inventé » (`DS_Final/readme.md:86-90`) ;
- CTA de conclusion « formation, newsletter, Club des Digitos », alors que la page impose déjà « Tu veux qu'on le fasse pour toi ? / Voir les packs » (`src/locales…/fr/blog.json:52-54`, `BlogPost.tsx:36-37`), ce qui fait deux CTA ;
- aucune consigne sur la première personne du singulier (pourtant pratiquée), sur les dates écrites en toutes lettres ni sur l'interdiction des promesses de cadence ;
- titre et H1 « 60 caractères », mais le suffixe ` | Max-Morrys` fait dépasser : **`seo:check` relève 15 titres d'articles entre 71 et 76 caractères**.

Le prompt de WF-09 : tutoiement correct, mais il promet une lettre « hebdomadaire » et contient plusieurs CTA.

---

## 3. Charte éditoriale et style en vigueur

Ordre d'autorité constaté :
1. **les tests qui bloquent la CI** ;
2. le PRD rév. 5 du 28/10 ;
3. `DS_Final/readme.md` §3 ;
4. `docs/BRAND-ARCHITECTURE.md` pour les relations entre marques ;
5. tout le reste (skills paperclip et `skills/*` du 06/08, BrandKit de juillet, prompts n8n d'avril), qui est antérieur à la refonte (CDC) du 14/09.

### 3.1 Règles concrètes

- **Registre par piste (règle bidirectionnelle, en production depuis le 18/09) :**
  - la piste **Conception** vouvoie (`conception.json`, `realisations.json`) ;
  - **tout le reste tutoie**, y compris l'étage commerçants et les CGV.
  - Sources : `tests/unit/voix-tutoiement.test.ts:28-42,51,59,81,87,106`.
- **Le blog appartient à la piste Apprendre** : tutoiement et « je » (`prd.md:334-337,2233` ; `DS_Final/readme.md:17,32,80-81`, « c'est une personne qui parle, pas une entreprise »).
- **Anglais réécrit, pas traduit** : `I'll keep you posted` ; sont interdits `Contact us`, `our team` et `our agency` (`tests/unit/voix-anglaise.test.ts:50-57,99-109`).
- **Ton** : clair, direct, pédagogique, ambitieux sans promesse irréaliste, humain (`Max-Morrys_Charte_Graphique_Complete.md:169-173`). Phrases courtes, zéro jargon creux, une à trois touches locales (`paperclip/skills/maxmorrys-brand/SKILL.md:63-68`).
- **Interdits :**
  - aucune note ni nombre d'inscrits (`tests/unit/interdits-preuve-sociale.test.ts:61`) ;
  - aucune négation de ce que le produit propose (`scripts/proof-check.mjs:315-351`) ;
  - énumération complète des moyens de paiement : Wave, Orange Money et carte (`proof-check.mjs:216-259`) ;
  - aucune date en toutes lettres dans l'i18n (`proof-check.mjs:134-171`) ;
  - aucun emoji (`DS_Final/readme.md:101-102`) ;
  - aucun chiffre inventé (`DS_Final/readme.md:86-90`) ;
  - face aux commerçants : ni « SEO », ni « workflow », ni « n8n »… (`maxmorrys-brand/SKILL.md:87-89`).
- **Typographie :** guillemets « ». **Aucune règle sur les espaces insécables** ; la pratique réelle est l'espace ordinaire (614 occurrences, 0 U+00A0 ou U+202F dans les catalogues FR). Écriture inclusive au point médian, pratiquée mais non documentée. Ligne de 68 caractères au maximum.
- **Structure d'un article :**
  - le titre est le seul H1, rendu par la page (`BlogPost.tsx:207`) ;
  - le sommaire est construit sur les H2 et H3 (`src/lib/markdown.ts:263-288`) ;
  - catégorie parmi les six pôles (`src/lib/blogCategories.ts:11-18`) ;
  - le CTA est fixé par la page (« Voir les packs ») : pas de CTA concurrent dans le texte ;
  - **aucune norme de longueur.** WF-08 vise 1 500 mots ; la page promet « des articles courts… lisibles sur téléphone » (`fr/blog.json:24`).
- **Marque :**
  - Max-Morrys est la marque personnelle ;
  - MY ONOMA passe par `{{company}}` et n'est jamais tapé à la main (`tests/unit/marque-noms.test.ts:27`) ;
  - Cléa est une practice sœur ;
  - jamais « Max-Morrys Agency » ;
  - `/agence` et `/presence-digitale` sont des redirections 301 vers la piste Conception.
- **Garde-fou absent :** aucune garde de voix ou de preuve ne lit le **corps des articles** dans Firestore. Les tests ne couvrent que `src/i18n/locales/fr/*.json`, et `proof-check` couvre en plus `static-pages.ts`. Pour le blog, le respect de la charte repose entièrement sur la relecture.

### 3.2 Le style réel des articles publiés (mesuré sur les 46)

| Critère | Résultat | Écart à la charte |
|---|---|---|
| Tutoiement dominant | 46/46 | — |
| Vouvoiement résiduel (`vous`, `votre`, `vos`) | 10/46 | écart |
| « Je » présent plus de 3 fois | 45/46 | — |
| Emojis | **29/46** | écart |
| `<h1>` dans le corps | **46/46** | écart (le H1 rendu côté serveur reste unique, mais un second H1 apparaît dans le DOM client) |
| Section FAQ | 45/46 | — |
| Encadré « À retenir » | 46/46 | — |
| Chiffres en pourcentage | 42/46 | — |
| Mention de source (« selon », « source ») | 14/46 | — |
| Liens externes | 0 | — |
| Liens internes `/blog/` | 61 au total, 38/46 articles | — |
| Lien vers `/formations` | 3 | — |
| Longueur | 528 à 1 591 mots, médiane 1 050 | — |
| Titres avec « 2026 » dans le slug | 11 | contenu daté, à rafraîchir en 2027 |

Extraits représentatifs :
1. `rentabiliser-50000-fcfa-publicite-facebook-afrique`, le seul article qui fait des clics :
   > « Tu as enfin mis 50 000 FCFA de côté pour booster ton business. C'est une belle somme, mais je sais ce qui te fait peur : voir cet argent disparaître en 48 heures sans recevoir le moindre message WhatsApp. À Lomé, Cotonou ou Douala… »
   >
   > Suivi de « Une boutique de prêt-à-porter à Adjamé… 15 ventes fermes… 225 000 FCFA » : **un exemple chiffré non sourcé, typique de la phase Recherche de Gemini**.
2. `tiktok-ads-afrique-guide-pme` :
   > « le coût par clic (CPC) sur TikTok est incroyablement bas. On parle de tarifs allant de 12 à 30 FCFA… En Côte d'Ivoire, l'audience a bondi de 31 % en seulement un an. »
   >
   > Chiffres sans source. La fin est un slogan : « Je te forme, je t'informe, je te transforme. »
3. `vendre-montage-video-freelance-afrique`, en fin d'article :
   > « Rejoins le Club des Digitos pour recevoir mes meilleures astuces chaque semaine. On avance ensemble, pas de secret entre nous ! »
   >
   > C'est un CTA concurrent de « Voir les packs » et une **promesse de cadence** non tenue.

### 3.3 Contradictions entre les sources

- **C1 — `/agence`** : décrite en tutoiement par les skills, en vouvoiement par `BRAND-ARCHITECTURE.md:83-84`, alors que c'est aujourd'hui une redirection 301.
- **C2 — Vouvoiement « B2B »** (skills d'août) contre « piste Conception » (CDC).
- **C3 — « Tutoiement sans exception »** (`DS_Final/readme.md:78`), antérieur au CDC.
- **C4 — Table commerçants vouvoyée** (`paperclip/skills/agency-offer/SKILL.md:69-75`), alors que l'étage commerçants tutoie.
- **C5 — Le miroir SEO de l'accueil vouvoie** (`static-pages.ts:48`), et aucune garde ne le voit.
- **C6 — Prompts WF-08** : H1 dans le corps, emojis permis, statistiques inventées, CTA multiples.
- **C7 — WF-09 « hebdomadaire »** contre `fr/footer.json:39`.
- **C8 — « Le blog paraît chaque semaine »** (`formations.json:234`, `static-pages.ts:560`) : **faux depuis le 22/05**, et la copie dit en même temps « pas de lettre » alors qu'un formulaire de lettre existe.
- **C10 — Le CTA anglais « Want *us* to do it for you? »** contredit la première personne du singulier, et la regex de `voix-anglaise` ne le détecte pas.
- **C11 — Trois listes de piliers éditoriaux.**
- **C12 — `skills/seo-kit` cite `functions/src/prerender.ts`, `sitemap.ts` et `rss.ts`**, qui n'existent plus.
- **C14 — `docs/calendrier_editorial_12_semaines.csv`** se termine le 01/11/2026, ne contient **aucune ligne blog** et cible encore « Agence ».
- **C15 — Emojis** : « rares et sobres » dans les skills, aucun dans le DS.

Note : contrairement à ce qu'on pourrait croire, `.claude/skills/` contient 55 skills `bmad-*` et 8 skills `higgsfield-*`, mais **aucune skill de marque ou de rédaction propre au projet**. Les skills de marque vivent dans `skills/` et `paperclip/skills/`, dans des formats Paperclip, et datent toutes du 06/08.

---

## 4. État du SEO éditorial

- **GSC** (requête en direct, `sc-domain:maxmorrys.me`, 90 jours) :
  - site : **4 clics, 135 impressions**, position moyenne 12 ;
  - blog : **2 clics, 87 impressions**, position moyenne 15,7.
  - Par mois (blog) : mai 1 clic / 36 impressions, juin 1/60, juillet 3/63, août 0/24, sept. 0/14, oct. 0/39.
  - Pages qui ressortent : `rentabiliser-50000-fcfa-publicite-facebook-afrique` (2 clics, 29 impressions, position 7,1), `mistral-ai-marketing…` (15 impressions, position 14,5), `tiktok-ads-afrique-guide-pme` (11 impressions, position 10,9). **Seuls 11 articles sur 46 ont eu au moins une impression en 90 jours.**
  - Requêtes : « booster tiktok afrique » (8 impressions, position 11), « blog seo afrique » (position 65), « blog marketing digital dakar » (position 20), « publicité facebook ads sénégal » (position 5).
  - Anomalie : `https://www.maxmorrys.me/blog` apparaît séparément (5 impressions), signe qu'une variante `www` a été indexée.
- **Indexation** (URL Inspection API, 25 articles sur 46, l'échantillon s'est arrêté sur une erreur 500 de l'API) :
  - **15 « Submitted and indexed »** (exploration du 19 au 29/10) ;
  - 5 « Discovered – currently not indexed » : `vendre-en-ligne…lois-2026`, `vendre-montage-video…`, `automatiser-ton-marketing-ia…`, `linkedin-b2b-2026…`, `influenceur-cameroun…` ;
  - **5 « URL is unknown to Google »** : `vendre-sur-whatsapp…`, `seo-immobilier-dakar…`, `materiel-video…`, `tiktok-seo-recherche-dakar…`, `influenceur-cote-divoire…`.
- **Sitemaps GSC :** `sitemap.xml` téléchargé le 21/10, 204 URL web et 96 images, 0 erreur. Un **ancien `sitemap_index.xml`** (téléchargé le 14/10/2025, 1 erreur, 2 avertissements) est toujours déclaré : à retirer.
- **`npm run seo:check`** (production) : « ✔ Aucune contradiction. 38 avertissement(s) », dont **15 titres d'articles de 71 à 76 caractères**. Le reste concerne les vidéos, podcasts et FAQ.
- **Mots-clés et clusters :**
  - chaque article a un `focusKeyword` (46/46), hérité de WF-07 ;
  - les six pôles servent de clusters de fait (Business & Gestion 11, Réseaux sociaux 10, E-commerce 8, IA 6, SEO 6, Publicité 5) ;
  - **il n'existe ni pages piliers, ni cartographie mots-clés → URL, ni suivi de positions en service.** SerpBear tourne sur le VPS (`eyone-serpbear`), mais c'est l'instance Eyone : je ne l'ai pas vérifiée pour maxmorrys.
  - **Cannibalisation** : deux articles « algorithme Instagram 2026 », deux « lois e-commerce 2026 », deux « matériel vidéo 2026 », plus deux articles « 50 000 FCFA publicité Facebook » (`publicite-facebook-petit-budget-50000-fcfa` et `rentabiliser-50000-fcfa-…`).
- **Maillage :** 61 liens internes entre articles (38 articles en ont au moins un), seulement 3 vers `/formations`, aucun vers les pages des pistes. Le CTA de page « Voir les packs » couvre le lien commercial.
- **Données GSC :** `scripts/gsc-pull.py` (launchd, 7 h) écrit toujours dans **Airtable**, pas dans NocoDB. C'est le seul flux GSC, et il alimente une base en cours d'abandon.

---

## 5. Verdict : faut-il garder n8n pour l'éditorial ?

**Non pour la rédaction, oui pour la veille, la diffusion et la lettre, après réparation.** Ta recommandation candidate tient, et les faits la renforcent :

1. **n8n n'a apporté aucune valeur éditoriale depuis 5 mois.** Il a produit 0 article depuis le 22/05, 0 idée validée depuis le 06/08, et ses trois workflows échouent toutes les semaines.
2. **Sa qualité est le principal passif SEO et marque.** Les statistiques et exemples « recherchés » par Gemini sans navigation sont invérifiables. S'y ajoutent les emojis, le double H1, les doublons et la cannibalisation, des titres trop longs, des CTA et des promesses de cadence hors charte. Un pipeline d'agents dans le dépôt peut **faire respecter la charte par du code** (tests, `proof:check`), ce que n8n ne peut pas.
3. **La versionnabilité.** Les prompts de production ne sont pas dans git (S5), alors que la charte, elle, vit dans les tests du dépôt.

### Amendements à la recommandation

- **A1 — Ajouter une garde de charte sur le corps des articles, en plus des agents.** C'est un script versionné (par exemple `scripts/blog-lint.mjs`) qui applique au Markdown d'un article :
  - les regex de `voix-tutoiement` (piste Apprendre) ;
  - l'interdiction des emojis ;
  - l'absence de H1 dans le corps ;
  - un titre de 47 caractères au maximum (60 moins le suffixe ` | Max-Morrys`) ;
  - une meta description de 155 caractères au maximum ;
  - l'interdiction des dates et cadences écrites ;
  - un chiffre ⇒ un lien ou une source obligatoire ;
  - un pôle valide ;
  - aucun CTA de fin (la page porte le sien).

  Il se lance avant toute publication. Sans lui, les agents reproduiront les dérives actuelles.
- **A2 — Publier par script versionné, en brouillon par défaut.** Le script part d'un fichier `content/blog/<slug>.md` avec un front-matter, ce qui donne au contenu un historique git. Il écrit Firestore par compte de service et pose `status: 'draft'`, `slug_en`, `updatedAt` et `author`. Il refuse un slug déjà pris. Il **laisse la bascule en `published` à l'admin**, qui déclenche aussi `notifyOnPublish` ; sinon le script doit appeler cet endpoint lui-même. L'admin reste l'unique porte de publication : c'est le chemin le plus sûr, car les règles et la notification y vivent déjà.
- **A3 — La recherche doit être sourcée pour de vrai.** L'agent de recherche s'appuie sur une recherche web (Firecrawl ou WebSearch) et sur GSC, avec des URL citées dans le brief. Jamais de « 5 statistiques » demandées à un LLM.
- **Ce qui reste à n8n :**
  - la veille du lundi (RSS → NocoDB), **sans rédaction** ;
  - la lettre construite à partir de `/rss.xml` ou de Firestore `published`, puis envoyée par Brevo après validation Telegram ;
  - la diffusion sociale d'un nouvel article. Déclencheur : un webhook appelé par l'admin ou le script à la publication, ou un sondage du RSS.

### Si l'on garde n8n : ce qui est cassé, par priorité

**P0 (bloquant)**
1. **Relance Gemini** : `retryOnFail` (3 à 5 essais, 30 à 60 s) sur `Phase Recherche`, `Rédiger l'article` (WF-08) et `Rédiger newsletter` (WF-09) ; réglage plus long sur WF-07. C'est la cause immédiate des 10 échecs relevés depuis le 05/10.
2. **Lecture NocoDB de WF-08** : `returnAll` ou un filtre côté serveur `(Status,eq,valide)` avec `limit 1`. Sinon les Id 137, 197, 302 et 491 ne seront jamais traités (S1).
3. **Validation des idées** : définir qui valide et où (vue NocoDB filtrée ou commande Telegram), sinon WF-08 reste sans entrée (S2).
4. **Fan-in de WF-07** : remplacer le nœud Code par de vrais nœuds `Merge` (ou un « wait for all »), sinon il y a N appels Gemini par exécution sur des données partielles (S3).
5. **Source de WF-09** : lire Firestore `published` ou `/rss.xml`, pas la banque d'idées ; la lettre mettrait sinon en avant des brouillons sans URL (S4).

**P1 (qualité et conformité)**
6. Prompt WF-08 : supprimer le `<h1>` du corps et les emojis, supprimer les « 5 statistiques », exiger des sources réelles, supprimer le CTA de conclusion, ajouter « je » et l'interdiction des dates et cadences, titre de 47 caractères au maximum.
7. Écriture Firestore de WF-08 : ajouter `slug_en` et `updatedAt`, supprimer `createdAt`, ne pas fixer `publishedAt` sur la date du brouillon, refuser un slug existant.
8. WF-09 : retirer « hebdomadaire », garder un seul CTA, brancher l'envoi Brevo (WF-EMAIL-SEND inactif) après validation.
9. Versionner le JSON de production de WF-07/08/09 dans `n8n/live/`, car le dépôt diverge (S5).
10. `scripts/gsc-pull.py` : basculer Airtable vers NocoDB (l.12-13, 55-60).

**P2 (hygiène)**
11. Renommer les nœuds « Airtable — … » et « Gemini Pro » (qui tournent sur NocoDB et Flash), corriger « 9h quotidien » (c'est le lundi), supprimer les 13 workflows en doublon inactifs.

### À corriger quelle que soit l'option (côté site et contenu)

- **P0 — Fusionner ou supprimer les trois doublons de slug**, avec une redirection 301 depuis `-2`, et traiter les deux paires cannibales « 50 000 FCFA » et « algorithme Instagram ». Cela touche Firestore : une écriture, à décider par le porteur.
- **P0 — Retirer « le blog paraît chaque semaine »** (`formations.json:234`, `static-pages.ts:560`) et les promesses de cadence dans le corps des articles. C'est faux depuis 5 mois.
- **P1 — Prérendu :**
  - corriger `mainEntityOfPage.@id` en anglais (`content.ts:160`) ;
  - ne pas mettre en cache le repli français de `translateMetaToEn`, ou le mettre avec un TTL court (`prerender/index.ts:179-184`, `translate.ts:180`) ;
  - faire écrire `updatedAt` par l'admin (`useArticles.ts:170-193`).
- **P1 — Nettoyer le corps des 46 articles** : H1 du corps, emojis, vouvoiement résiduel, CTA de fin, chiffres non sourcés. Le prérendu contourne une partie du problème, mais pas la lecture humaine.
- **P1 — GSC :** retirer le `sitemap_index.xml` de 2025, enquêter sur la variante `www`, demander l'indexation des 5 URL inconnues de Google.
- **P2 :** le fil d'Ariane anglais, le dédoublonnage du RSS, le statut `scheduled` (l'implémenter ou le retirer du type), et mettre à jour `skills/seo-kit` (références `functions/` mortes) et le calendrier éditorial (qui expire le 01/11).

---

### Annexe : commandes et endpoints utilisés (tous en lecture)

- `GET https://n8n.maxmorrys.me/api/v1/workflows`, `/workflows/{id}`, `/executions?workflowId=…`, `/executions/{id}?includeData=true`
- `ssh … docker exec maxmorrys-n8n env` ; `grep` sur `/var/lib/docker/volumes/maxmorrys_n8n_data/_data/n8nEventLog*.log`
- `GET https://noco.maxmorrys.me/api/v2/meta/tables/{mp8tvctpl38ufmo,m460m48wd0qnzsu}` et `/api/v2/tables/…/records`
- `POST firestore.googleapis.com/v1/projects/max-morrys/databases/(default)/documents:runQuery?key=<clé web>` (filtre `status == published`)
- `curl -A Googlebot` sur `https://maxmorrys.me/blog/…`, `/en/blog/…`, `/sitemap.xml`, `/rss.xml`
- Search Console `searchAnalytics/query`, `sitemaps.list` et `urlInspection/index:inspect` (scope `webmasters.readonly`)
- `npm run seo:check`

Fichiers bruts conservés dans le scratchpad : `wf_*.json`, `exd_*.json`, `blog.json`, `blog_rows.json`, `idees.json`, `seocheck.txt`.

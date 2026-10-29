# 11 — Visuels sociaux : kit DS, gabarits, studio NAYO (état au 29/10/2026)

> Décision de Max du 29/10/2026 : (1) visuels alignés sur le **design system produit** du site, pas sur l'ancien kit marketing ; (2) **4 à 6 familles** de visuels choisies post par post ; (3) **posts phares** faits sur mesure dans le studio NAYO.
> Revérifier l'état live avant d'agir : il bouge. ⛔ Aucune publication, aucun passage en `validé` par un agent (`00-essentiel.md` règle 9).

## 1. Ce qui tourne aujourd'hui

| Maillon | État |
|---|---|
| `render-card` (VPS `/opt/render-card`, Satori + resvg) | ✅ gabarits **kit DS** ajoutés (`src/ds.ts`), activés par `kit: 'ds'` dans la charge. Sans ce champ, rendu historique **identique à l'octet** (vérifié sur 3 charges). Sauvegarde : `/opt/render-card.bak-20261029-1814.tgz` et `backups/n8n-corrections-20261029/render-card-avant-ds/`. |
| `WF-SOCIAL-04` (n8n) | ✅ nœud « Build — URL publique » : un post qui porte un **`Gabarit`** part au kit DS ; un post sans `Gabarit` garde la charge historique. Bascule globale `DS_PAR_DEFAUT = false` en tête du nœud. Sauvegarde : `backups/n8n-corrections-20261029/774G38cqIvZsJUHm-WF-SOCIAL-04-avant-kit-ds.json`. |
| NocoDB `Contenus` | ✅ champ **`Gabarit`** (SingleSelect) créé : `affiche · citation · chiffre · avant_apres · question · etapes · coulisses · offre · studio`. Vide = ancien rendu. |
| Dépôt des PNG sur R2 | ⛔ **EN PANNE** (constaté le 29/10, 18 h 14 Paris) : `POST https://media-api.maxmorrys.me/internal/upload` répond 404. La route n'existe que sur la branche `feat/cloudflare-exit-blaze` (commit `e3a1d7e`) ; le Worker `maxmorrys-media` déployé ne l'a plus. Dernier rendu réussi : 22/08. Tant que ce n'est pas réparé, **chaque carte échoue** (ancien comme nouveau kit) et WF-04 pose `image_needed`. Réparation : redéployer `worker/apps/media` avec `handleInternalUpload` + secret `INTERNAL_UPLOAD_KEY` = `MEDIA_INTERNAL_KEY` du VPS (`/etc/render-card/env`). Décision et déploiement : Max. |
| NAYO (https://nayo.pro) | ⚠️ en production (`/api/health` → `{"status":"ok"}`), mais **inutilisable par clé d'API pour produire** (§ 4). Réservé au studio, à la main, pour les posts phares. |

## 2. Circuit d'un visuel

1. Mariam dépose le post en `rédigé` avec `Gabarit` et, si la famille l'exige, les données dans `Slides_JSON` (§ 3).
2. `WF-SOCIAL-04` (toutes les 2 h, 8-20 h UTC, 6 lignes par passage) construit la charge avec `construireCharges` (source : `scripts/growth/nayo.mjs`), appelle render-card, écrit `Visuels_URLs`, pose `prêt_à_valider` (ou `image_needed` si une carte manque). Circuit de statut inchangé.
3. `WF-SOCIAL-07` envoie la carte Telegram ; Max valide.
4. `Gabarit = studio` : WF-04 rend quand même une carte kit DS provisoire (la file ne bloque pas) ; Salimata fait le visuel dans le studio NAYO, Max le valide, puis on **remplace `Visuels_URLs`** avant validation (§ 5).

Aperçu local d'un post, sans rien écrire : `node scripts/growth/nayo.mjs brief <Id>` (la charge) ou `render <Id> --out <dossier>` (rendu réel via le VPS — bloqué tant que le dépôt R2 est en panne).

## 3. Les familles (`Gabarit`)

Choisir **post par post** selon ce que le post doit faire, pas selon la série. Varier dans un lot : jamais trois fois la même famille d'affilée.

| Gabarit | Quand | Données (`Slides_JSON`, 1re entrée) | Repli si données absentes |
|---|---|---|---|
| `affiche` | Une idée, une phrase forte (RADAR, accroche) | `titre`, `corps?`, `cta?` | — |
| `etapes` | Méthode en 2 à 5 étapes (ATELIER) | `etapes: [...]`, ou `corps` « a · b · c » | `affiche` |
| `question` | Sondage, question au public (CERCLE) | `options: [...]` (2 à 4), ou `corps` « A … · B … · C … » ; `cta` = consigne de réponse | `affiche` |
| `chiffre` | Un nombre **sourcé** (PREUVE, RADAR) | `chiffre`, **`source`** obligatoire (règle du monospace) | `affiche` + avertissement |
| `avant_apres` | Transformation, mythe/réalité | `avant: [...]`, `apres: [...]`, `avantTitre?`, `apresTitre?` | `affiche` |
| `citation` | Phrase de Max ou témoignage **avec accord** | `titre` = la citation, `auteur`, `role?` | — |
| `coulisses` | COULISSES, fond nuit | `photo?` (URL https d'une photo **réelle** fournie par Max) | sans photo : typographique nuit |
| `offre` | OFFRE, prix affiché | `prix` (ex. `1 658 FCFA`), `prixUnite?` (`/ mois`), `prixNote?`, `points: [...]` (≤ 3), `paiement?`, `cta?` | titre + corps |
| `studio` | Post phare : lancement, offre majeure | — | carte DS provisoire |
| *(carrousel)* | `Format_Post = carrousel` → toujours des slides : couverture, une idée par slide, dernière avec le CTA. « 1. L'accroche » fait sortir le numéro en grand. | une entrée par slide | — |

Communs à toutes : `sourcil?` (remplace « SÉRIE · OUTIL »), `territoire?` (force la couleur), `fond?` (`papier` | `nuit`). **`[mot]`** dans un titre passe le mot dans la couleur du territoire (même convention que les titres du site — crochets porteurs). Aucun emoji dans `Slides_JSON`.

⛔ Prix : seulement ceux du post et du code (CGV, i18n). Le Club s'écrit `1 658 FCFA / mois` avec « 19 900 F payés une fois pour l'année » dessous (règle des prix cadrés du DS).

## 4. Couleur et règles du kit DS

**Territoire** (déduit, surcharge par `territoire`) : `Offre` Formations/Accompagnement → **forme** #0057BC · Club Digitos/Rysmo → **transforme** #6C23DD · Agence + Cible Commerçants → **digitalise** #02AC9C · Agence sinon → **agence** (corail #FF6E7F, accent typographique à l'encre) · Non-produit : Commerçants → digitalise, CERCLE/COULISSES → transforme, PREUVE → forme, sinon **informe** #F38B0A.

Appliqué par `render-card/src/ds.ts` (valeurs reprises de `src/design-system/css/tokens/colors.css` et `css/brand/mesh.css`) :
- maillage à trois lobes du territoire + voile de lisibilité (couleur en haut, texte en bas sur fond presque blanc) ; mode nuit #0A0D11 ;
- Fraunces 900 (titres, interlettrage −0,03 em), Schibsted Grotesk (corps), JetBrains Mono (sourcils en capitales +0,14 em, prix, numéros) ;
- texte de territoire en **versions texte** sur papier (#8A4B00, #00695E, #5A17BE) et **versions nuit** sur fond sombre — orange et teal jamais en texte sur blanc ;
- verrouillage de marque : pastille blanche du M (`public/icone-mm.png` réduit à 200 px) + « Max-Morrys » en Fraunces ;
- faux verre (voile 74 %, liseré de lumière), cartes territoire à deux arrêts, rayons 24/30, boutons pilule à l'encre ; aucune bordure gauche colorée, aucun fond photo IA, aucun visage généré ;
- typographie française : espaces insécables avant ? ! : ; et dans « », apostrophe typographique, petit nombre soudé au mot suivant.

## 5. Posts phares : le studio NAYO

**Ce que NAYO permet (étude du 29/10, code `~/NaYo` + sondes prod) :**

| Besoin | Par clé d'API | Dans l'interface (session de Max) |
|---|---|---|
| Créer org / entité / charte | ❌ | ✅ (`/api/v1/orgs`, `/api/v1/brand`, `/api/v1/entities/[id]/brandkit` — jeton Firebase + `x-org-id`) |
| Générer une créa depuis un brief, dans un style et un format | ❌ | ✅ (directions artistiques, créa éditable, déclinaison 4:5 / 1:1 / 9:16 / 16:9 / A4) |
| Récupérer les PNG | ❌ | ✅ export depuis le studio |
| Estimer le coût avant | ❌ (`/api/v1/estimate` exige une session) | ✅ affiché avant l'opération |

- Une clé d'API NAYO ne porte que les scopes `projects:read` et `insights:read` (`apps/web/app/api/v1/apikeys/route.ts`), et `/api/public/v1/` n'expose que `GET projects` (401 sans clé ; `designs`, `jobs`, `estimate`… → 404). Créer une clé exige MFA + réauthentification récente.
- Production en `AI_PROVIDER=mock` (`apps/web/wrangler.jsonc`, `apphosting.yaml`) : directions et créas sont **déterministes**, sans LLM (le compte Anthropic était sans crédit le 17/10). L'extraction de charte appelle quand même Claude si la clé existe.
- Catalogue de polices du rendu NAYO (`packages/renderer/src/fontes.ts`) : **Fraunces ✅, JetBrains Mono ✅, Schibsted Grotesk ❌** (à ajouter : fichier woff2 + entrée de catalogue — modification du code de NAYO, à décider par Max).
- Textes verrouillés : un calque `locked` refuse toute opération tant qu'il n'est pas déverrouillé (`assertEditScope`) ; les faits critiques liés (prix, dates) sont vérifiés à l'export — c'est le garde-fou qui empêche un prix modifié de partir.

**✅ Mise en place FAITE le 29/10/2026** (par API, avec le compte NAYO `rys.digi+lms@gmail.com` fourni par Max — mot de passe non consigné) :
- Organisation **Max-Morrys** `org_fd1f9099-e7e2-402c-8a65-d6423281b3dc` (verticale éducation, SN, Africa/Dakar, XOF), rôle owner.
- Entité **Max-Morrys** `ent_cda5e3e7-d064-4959-9140-85d97c942c70`, rattachée à la charte publiée **`kit_6b21a4f1-01a8-492f-ad8d-2503b89aca1a-v2`** « Max-Morrys — design system produit ».
- Charte : rôles primary #0057BC, dark/text #0E1116, light #FFFFFF, accent #F38B0A ; titres Fraunces 900, corps **Schibsted Grotesk** 400/600/700 (TTF OFL importés comme actifs de l'org ; ⚠️ constaté le 29/10 : le moteur de NAYO **ne la rend pas**, le texte sort en Inter — défaut à signaler à NAYO), logo officiel importé (`asset_d2137ec0-…`), voix « tu », 7 règles (orange/teal jamais en texte sur blanc, aucun emoji, aucun visage généré, prix venus du site, couleur par territoire, aucune preuve sociale non sourcée), mentions obligatoires (⚠️ saisies comme étiquettes « Prix agence : HT, TVA 18 % en sus » alors que NAYO les cherche mot pour mot : elles bloquent tout export tant qu'elles ne sont pas réécrites en texte réel, ex. « TVA 18 % », « Wave, Orange Money ou carte »), termes interdits (remboursement, garantie, 14 jours, coaching, « My Onoma »…).
- ⚠️ Limite : NAYO ne gère que 5 rôles de couleur ; violet #6C23DD, turquoise #02AC9C et corail #FF6E7F ne sont pas dans la palette de la charte (ils restent dans la règle « couleur par territoire »).
- Crédits : 1,5 crédit offert à l'inscription, rien consommé. Pas de clé d'API créée (inutile tant que NAYO n'ouvre pas de scope d'écriture ; elle exigerait la MFA).
- Accès à l'API depuis un script : le pare-feu Cloudflare de nayo.pro rejette l'agent Python par défaut (erreur 1010) → envoyer un `User-Agent` explicite.

<details><summary>Procédure d'origine</summary>

**Mise en place, à faire par Max (une fois, ~15 min) :**
1. Se connecter sur https://nayo.pro avec son compte (e-mail vérifié, MFA active).
2. Créer (ou choisir) l'organisation, puis une entité **« Max-Morrys »**.
3. Charte de l'entité : couleurs par rôle — primary #0057BC, dark #0E1116, light #FFFFFF, text #0E1116, accent #F38B0A (sur fond sombre seulement) ; ajouter #6C23DD, #02AC9C, #FF6E7F en palette. Polices : Fraunces 900 (titres), JetBrains Mono (sourcils, prix) ; corps en Schibsted Grotesk **si ajoutée au catalogue**, sinon Inter en attendant (écart à noter). Logo : `public/icone-mm.png` (variante couleur ; pastille blanche sur fond coloré). Règles à saisir : « orange et teal jamais en texte sur blanc », « aucun emoji », « aucun visage généré », « un prix vient du site ».
4. Pour une future automatisation : créer une clé d'API nommée `max-morrys-social` — utile seulement quand NAYO ouvrira un scope d'écriture (§ 7).

</details>

**Faire un post phare :** Salimata écrit le brief (intention, public, preuve, texte exact, prix vérifié, format) → Max ouvre le studio, lance les directions (coût affiché avant), retouche, valide → export PNG par format → upload → Salimata prépare `{Id, Visuels_URLs}` (simulation puis `--apply`, sans toucher au `Status`). Photos : seulement celles que Max fournit ; ⛔ jamais de visage généré.

## 6. Coûts

| Moteur | Coût |
|---|---|
| render-card (série) | 0 crédit : service local au VPS ; ~1,5-2 s par carte |
| NAYO studio (barème `packages/billing/src/couts.ts`, réservation en micro-USD) | directions 0,08 $ · créa maîtresse 0,28 $ · déclinaison 0,10 $ par format · kit de campagne 0,15 $ · publication 0 $. En `AI_PROVIDER=mock`, rien n'est facturé à un fournisseur d'IA. Un post phare en 4 formats ≈ 0,66 $ réservé. |

Toute dépense NAYO : devis montré à Max avant, comme pour Higgsfield et Canva.

## 7. Ce qui manque pour brancher NAYO au circuit automatique

1. Un scope d'écriture sur les clés (ex. `designs:write`) et des routes `/api/public/v1/` pour : créer un projet depuis un brief structuré, choisir style et format, lancer, lire l'état du job, récupérer l'URL d'export, estimer — **modification du code de production de NAYO**, à arbitrer par Max.
2. Schibsted Grotesk dans le catalogue de polices du rendu.
3. Ensuite seulement : un nœud « HTTP — NAYO » avant render-card dans WF-04 (clé en credential n8n `httpHeaderAuth`, jamais dans la table Config), avec repli sur render-card si échec ou crédit insuffisant. `scripts/growth/nayo.mjs estimate` dit à tout moment si une route publique de génération répond.

## 8. Basculer et re-rendre

- **Le lot S45-S46** (28 lignes `rédigé` le 29/10 au soir) n'a pas de `Gabarit` : il part à l'ancien rendu… qui échoue tant que le dépôt R2 est en panne → `image_needed`.
- Pour le re-rendre au kit DS, **après accord de Max** : (1) réparer le dépôt R2 ; (2) poser `Gabarit` sur chaque ligne (ou passer `DS_PAR_DEFAUT = true` dans WF-04) ; (3) repasser les lignes `image_needed` en `rédigé` — `node scripts/growth/nocodb.mjs update contenus --file … --apply`. Un agent ne le fait pas de lui-même.
- Modifier la mise en forme : éditer `construireCharges` dans `scripts/growth/nayo.mjs`, puis `node scripts/growth/wf04-visuels-ds.mjs` (simulation) / `--apply` (sur un nœud déjà équipé, il ne remplace que l'en-tête et garde la valeur de `DS_PAR_DEFAUT`), puis `node scripts/n8n-export-live.mjs`.
- Modifier un gabarit : `/opt/render-card/src/ds.ts` sur le VPS (sauvegarde, `sudo -u render npm run build`, `systemctl restart render-card`, rendu d'essai).

## 8. Essai du 29/10/2026 — post 158 (Salimata)

- Projet NAYO `proj_b9954106-bd3f-4a34-b511-353c42ed029e` ; **0,84 crédit** consommé (dont 0,30 perdus : deux exports débités puis refusés — barrière qualité, erreur 500 ; le compteur affiche encore 1,5).
- **Export PNG NAYO en panne en production** (export payant et brouillon gratuit → 500). La 9:16 recomposée écrase les retouches faites en 4:5 ; titres rognés sans alerte ; directions génériques en mode mock (fonds nuit, vocabulaire de culte).
- Bien : la charte s'applique d'office, les faits du brief (prix) sont verrouillés, la barrière qualité bloque réellement, l'éditeur direct est riche, les retouches par format sont gratuites.
- Verdict : **render-card au kit DS** pour les visuels courants ET pour ce post phare (direction « Le test ») ; NAYO à réévaluer après correction de ses 4 défauts. Fichiers : `_bmad-output/growth/crea-158/`.

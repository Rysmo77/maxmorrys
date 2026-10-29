# 08 — L'e-mailing : transactionnel par Cloudflare, marketing par Brevo

> Mis à jour le 29/10/2026 (décision de Max, « option 2 »). **Deux canaux, et la frontière est
> le régime de l'e-mail** :
>
> - **transactionnel** (ce qu'une personne a déclenché ou ce qu'un contrat promet) →
>   **Cloudflare Email Service**, binding `EMAIL` du Worker `maxmorrys-api`, depuis
>   `facture@mail.maxmorrys.me` ;
> - **marketing** (la lettre, la bienvenue n°2/n°3, les futures relances) → **Brevo**, depuis
>   `lettre@lettre.maxmorrys.me`.
>
> Le code fait foi : `worker/apps/api/src/lib/` (`email.ts` pour Cloudflare, `brevo-send.ts` et
> `brevo-contacts.ts` pour Brevo, `envoi-modele.ts` qui choisit selon le régime).

---

## 0. Pourquoi deux fournisseurs

| | Cloudflare Email Service | Brevo (plan gratuit) |
|---|---|---|
| Marketing / lettre | **Interdit.** FAQ : « *Can I use Email Service for marketing emails? — No. Email Service supports transactional email only.* » | **Autorisé** : c'est son métier (campagnes, listes, désinscription gérée). |
| Transactionnel | Conforme. Aucun secret, DMARC `p=reject` sur `mail.`. | Possible, mais on ne l'y met pas (voir ci-dessous). |
| Volume | Quota journalier « prudent » qui monte avec la réputation ; 3 000 e-mails/mois inclus (Workers Paid), puis 0,35 $ les 1 000. | **300 envois par jour**, toutes API confondues (campagnes + envois unitaires). Logo Brevo en pied des campagnes sur le plan gratuit. |
| Domaine | `mail.maxmorrys.me` (MX, SPF, DKIM `cf-bounce`, DMARC `p=reject`) | `lettre.maxmorrys.me` (code Brevo, SPF `include:spf.brevo.com -all`, DKIM `brevo1`, DMARC `p=quarantine`) — vérifié au DNS public le 29/10/2026 |

**La raison de fond** : si la lettre partait par Cloudflare, une suspension du compte pour usage
interdit couperait **aussi la facture et les rappels d'échéance** — même binding, même compte.
Avec deux fournisseurs et deux sous-domaines, un incident marketing (plainte, suspension Brevo)
ne touche jamais le courrier promis par contrat, et inversement.

**La règle dans le code** : le transport découle du régime déclaré dans `modeles.ts`, jamais de
l'appelant. Les tests l'affirment dans les deux sens (`test/envoi-modele.test.ts`,
`test/campagne.test.ts`, `test/lifecycle.test.ts`) : aucun transactionnel n'appelle Brevo, aucun
marketing ne touche le binding Cloudflare, et sans Brevo configuré le marketing **échoue** au
lieu de se rabattre sur Cloudflare.

---

## 1. Tous les e-mails de la plateforme

Aperçu de chacun, en HTML et en texte, FR et EN : voir §7 (`email:apercu`).

### Transactionnels → Cloudflare (aucun consentement, aucun lien de retrait)

| E-mail | Quand il part | Code |
|---|---|---|
| Facture / reçu | Paiement validé (webhook Bictorys) ; renvoi possible depuis l'admin | `invoice.ts` via `transaction-mail.ts` |
| Confirmation d'achat (formation, Club, pack Rysmo, Rysmo+) | Paiement validé | `purchase.ts` via `transaction-mail.ts` |
| Rappel d'échéance du Club — **J-15** (variante « renouvellement programmé » si le membre a consenti au lien annuel) | Cron 08:00 UTC, jour exact | `renewal.ts` |
| *Lien de paiement du renouvellement (J-7)* | *Envoyé par **Bictorys** (abonnement `billing/v1/subscriptions`), pas par le Worker* | `club-autorenew.ts` le programme |
| Rappel d'échéance Rysmo+ — J-5 | Cron 08:00 | `rysmo-renewal.ts` |
| Relance de devis — J-7 avant expiration | Cron 08:00 | `quote-expiry.ts` |
| Réponse à un message de contact | L'admin répond (`replyToMessage`) | `reply.ts` |
| Accusé de rendez-vous | `acknowledgeAppointment` | `appointment.ts` |
| Liste d'attente — inscription, puis ouverture (**le seul e-mail promis**) | `joinWaitlist`, `notifyWaitlist` | `waitlist-mail.ts` |
| Certificat obtenu | `issueCertificate` | `modeles.ts` › `certificat` |
| Bienvenue n°1 | Cron 08:00, compte créé il y a 0 à 2 jours | `modeles.ts` › `bienvenue1` |
| Panier abandonné (un seul rappel) | Cron 08:00, transaction `pending` d'hier | `modeles.ts` › `panierAbandonne` |
| Accusé de devis Présence Digitale | `accuserDevis` | `modeles.ts` › `accuseDevis` |
| Accusé de demande agence | `accuserDemandeAgence` | `modeles.ts` › `accuseAgence` |

### Marketing → Brevo (consentement + retrait + accord de Max)

| E-mail | Comment il part | État |
|---|---|---|
| **La lettre** | n8n WF-09 ou un agent → `POST /marketing/campagne` → **campagne Brevo** par lot | Route livrée ; épreuve opérationnelle dès le déploiement ; réel **fermé** |
| Bienvenue n°2 (J+2) et n°3 (J+5) | Cron 08:00 → **envoi unitaire Brevo**, si la lettre a été acceptée | Prête ; ne lit rien tant que le réel est fermé |
| Mur de quota Rysmo, série rompue, relance Club inactif, nurture de devis | — | Gabarits prêts, **aucun déclencheur** |

### Ce qui n'est pas un e-mail (et ne doit pas en devenir un sans décision)

- **Liste d'attente formations** : « Un seul e-mail, le jour de l'ouverture. Pas de lettre, pas
  de relance. » ⛔ Aucune séquence sur cette liste.
- **`notifyOnPublish`** : notification dans l'application, pas un consentement marketing.
- **Parrainage, digest du Club, relances d'engagement** : in-app.

---

## 2. Le système de gabarits — le même HTML pour les deux canaux

Une seule enveloppe, `worker/apps/api/src/lib/email-design.ts`, alignée sur `src/design-system/` :
encre `#0E1116`, papier blanc, arc des cinq teintes en cellules pleines, aucune teinte de
territoire en texte, Fraunces / Schibsted Grotesk / JetBrains Mono avec replis, tables
imbriquées, CSS en ligne, 600 px, mode sombre ; un seul bouton ; pied légal **MY ONOMA SARL**
(`marque.ts`) et, pour le marketing seulement, la phrase de consentement + « Me désabonner en un
clic ». Les gabarits (`modeles.ts`) et les campagnes sont décrits en **blocs** (`blocs.ts`).

**Aucun modèle ne vit chez Brevo.** Le HTML envoyé à Brevo — campagne ou envoi unitaire — est
celui que rendent nos gabarits ; la copie se relit en revue de code. (L'ancien
`scripts/brevo-templates.mjs`, qui recopiait le gabarit dans des modèles Brevo, est retiré.)

Différence d'un seul endroit, le lien de retrait :

| | Lien « Me désabonner » | En-tête `List-Unsubscribe` |
|---|---|---|
| Campagne (la lettre) | `{{ unsubscribe }}` — remplacé par Brevo | posé par Brevo |
| Envoi unitaire (bienvenue n°2/n°3, épreuve) | notre lien signé `/desabonnement?e=…&s=…` | le nôtre + `List-Unsubscribe-Post: List-Unsubscribe=One-Click` |

Voix : tutoiement, « je » de Max, aucun emoji, aucune promesse de remboursement ni de garantie
(CGV art. 6), le prélèvement automatique n'est nommé que pour dire qu'il n'existe pas.

---

## 3. Envoyer la lettre

### La route

```
POST https://api.maxmorrys.me/marketing/campagne
Content-Type: application/json
X-Marketing-Key: <secret MARKETING_API_KEY>
```

| Champ | Obligatoire | Valeur |
|---|---|---|
| `id` | oui | identifiant **stable** `[a-z0-9-]`, 3–64 car. — ex. `lettre-2026-11-05`. Clé d'idempotence. |
| `objet` | oui | 3–90 caractères (viser < 50). |
| `preheader` | oui | 3–140 caractères. |
| `langue` | non | `fr` (défaut) ou `en`. Filtre l'audience sur sa langue. |
| `blocs` | l'un des deux | **recommandé** — contenu structuré, mis en page par le design system. |
| `html` + `texte` | l'un des deux | fragment HTML de la carte (pas de `<html>`, `<script>`, `<style>`, `<form>`, `on…=`, ni lien `http:`) + version texte. |
| `segment` | non | `lettre` (défaut), `comptes`, `sans-compte`. |
| `ids` | non | restreint le segment à des identifiants (`users/{uid}` ou `newsletter/{id}`), 500 max. |
| `mode` | oui | `test` ou `reel`. |
| `adresseTest` | non | une adresse **de `MARKETING_TEST_TO`** (sinon la première). |
| `taille` | non | lot par appel, 1–50 (défaut 25). |

Blocs : `titre` (≤ 80), `surTitre`, `paragraphe` (`sourdine: true`), `mention`, `encadre`,
`encart` (`surTitre`, `valeur`, `note`), `bouton` (`libelle` ≤ 40 en casse de phrase, `url`
https — **un seul**), `filet`. Refusé d'office (400) : remboursement, garantie, refund, emoji,
`{{variable}}`, `[à écrire]`, deux boutons, bouton en capitales.

### Le parcours, en trois temps

1. **Test** — `mode: "test"`. Une **épreuve** part par l'envoi unitaire Brevo vers l'adresse de
   test, objet préfixé `[TEST]`. Fonctionne **sans l'accord** (c'est fait pour) mais exige
   Brevo configuré. Réponse : `audiencePrevue` (combien recevraient en réel). L'empreinte du
   contenu est notée dans `campaigns/{id}`. 30 épreuves par jour au plus ; chacune compte dans
   les 300 envois Brevo du jour.
2. **Relecture humaine** de l'épreuve reçue. Toute modification ⇒ nouvelle épreuve.
3. **Réel** — **exactement le même corps**, `mode: "reel"`. Refusé (409 `testRequis`) si le
   contenu diffère. Chaque appel :
   1. relit les contacts de la liste Brevo et **reporte dans Firestore** chaque désinscription
      faite chez Brevo (`newsletter.unsubscribedAt`, `preferences.newsletter = false`) — si
      Brevo est illisible, **rien ne part** (502) ;
   2. prend un lot de l'audience Firestore, hors personnes déjà traitées ;
   3. le réserve sur le plafond du jour (300) ;
   4. crée une **liste Brevo propre au lot** (`<id> · lot <date>`, dans le dossier de la liste
      principale), y place ces contacts, crée une **campagne Brevo** sur cette liste avec notre
      HTML, et l'envoie (`sendNow`).

   Rappeler avec le même corps tant que `restants > 0`. Un rappel après la fin ne renvoie rien.

Réponse réelle : `{ ok, mode: "reel", campagne, audience, dejaTraites, envoyes, echecs, ignores,
restants, plafondAtteint, statut, retraitsRepris, campagneBrevo }`. `envoyes` = remis à Brevo
(Brevo écarte encore de lui-même ses contacts en liste noire).

Codes : 200 · 400 corps invalide · 401 clé · 403 `canalFerme` (pas d'accord) · 409 `testRequis`
· 429 `plafondTests` (30 épreuves, ou plafond Brevo atteint) · 502 `brevoIndisponible` (Brevo a
refusé ou est injoignable : **rien n'est parti**, on peut rejouer le même appel) · 503
`nonConfigure` (secret `MARKETING_API_KEY` absent, Brevo non configuré, `MARKETING_TEST_TO`
vide) · 500.

**Idempotence** : avant tout appel à Brevo, une trace `campaign_sends/{id}__{empreinte adresse}`
est créée avec la précondition « n'existe pas » — pas de double envoi, même en concurrence. Si
Brevo **refuse** (réponse reçue), les traces du lot sont effacées et le quota rendu : l'appel
suivant reprend le lot. Si l'issue est **inconnue** (coupure réseau pendant `sendNow`), le lot
est marqué `echec` et n'est jamais retenté — un manquant plutôt qu'un doublon.

### Le plafond de 300 par jour, en pratique

Une lettre à 700 abonnés part sur **trois jours** : 300, 300, 100 (moins les épreuves du jour).
n8n s'arrête sur `plafondAtteint: true` et reprend le lendemain avec le **même `id`** — aucun
doublon possible. Le compteur est par jour UTC (`_ratelimits/marketing_jour_AAAA-MM-JJ`) et
inclut la bienvenue n°2/n°3. Au-delà de ~250 abonnés actifs, passer au plan payant Brevo et
remonter `MARKETING_PLAFOND_JOUR` dans `wrangler.jsonc`.

### Exemple (curl)

```bash
curl -sS https://api.maxmorrys.me/marketing/campagne \
  -H 'Content-Type: application/json' \
  -H "X-Marketing-Key: $MARKETING_API_KEY" \
  -d '{
    "id": "lettre-2026-11-05",
    "objet": "Vendre sans site, d’abord",
    "preheader": "Trois choses, cinq minutes de lecture.",
    "langue": "fr",
    "mode": "test",
    "blocs": [
      { "type": "surTitre", "texte": "La lettre · numéro 1" },
      { "type": "titre", "texte": "Vendre sans site, d’abord." },
      { "type": "paragraphe", "texte": "Bonjour," },
      { "type": "paragraphe", "texte": "Ces deux semaines, j’ai publié un guide sur le catalogue WhatsApp Business." },
      { "type": "encadre", "texte": "Dix produits bien photographiés vendent mieux que cent que personne ne voit." },
      { "type": "bouton", "libelle": "Lire le guide", "url": "https://maxmorrys.me/blog/catalogue-whatsapp" },
      { "type": "paragraphe", "texte": "Max-Morrys" }
    ]
  }'
```

### n8n — WF-09 (la lettre), à construire

1. Déclencheur : Max passe le numéro au statut `validé` dans NocoDB (jamais un cron seul).
2. Nœud *Code* : construire le corps (`id` = `lettre-AAAA-MM-JJ`, blocs depuis le brouillon).
3. *HTTP Request* `POST /marketing/campagne`, `mode: "test"`, en-tête `X-Marketing-Key` depuis un
   **credential n8n** (Header Auth), jamais en clair dans le workflow ni dans la table `Config`.
4. Telegram : « épreuve envoyée, audience prévue N, réponds OK pour envoyer ».
5. Sur OK : même corps, `mode: "reel"`, en **boucle** tant que `restants > 0` (pause 2 s ; arrêt
   si `plafondAtteint` — reprendre le lendemain avec le même `id` ; sur 502, réessayer une fois
   après 1 min).
6. Telegram : bilan (`envoyes`, `echecs`, `retraitsRepris`).

⚠️ n8n n'appelle **pas** Brevo directement : les anciens `WF-EMAIL-NOTIFY` / `WF-EMAIL-SEND`
(campagne Brevo créée depuis n8n) restent archivés. Passer par la route garantit l'audience
consentante, la reprise des désinscriptions, l'idempotence et le plafond.

### Agents BMad (`mm-agent-serge`, `mm-agent-aminata`)

Les agents **rédigent** (blocs JSON dans `_bmad-output/growth/AAAA-MM-JJ-lettre-….json`) et
peuvent lancer le **mode test** si Max leur fournit la clé pour la session. Ils ne lancent
**jamais** le mode réel : c'est Max, ou WF-09 après son OK. Ils ne rédigent pas « à charger
dans Brevo » : Brevo est un transport, la copie vit dans le dépôt.

---

## 4. Audience, consentement, désinscription

- **Source de vérité : Firestore.** `audience.ts` lit à l'envoi `newsletter` (`consent == true`)
  + `users.preferences.newsletter == true`, déduplique par adresse, exclut le personnel
  (`admin`, `support`). **Un retrait l'emporte toujours.** La preuve du consentement
  (`consentAt`) ne quitte pas Firestore.
- Jamais une audience : `appointments`, `messages`, `agency_leads`, `engagement_leads`,
  `transactions`, `club_subscriptions`, `waitlist`.
- **Ce que Brevo détient** : l'adresse, l'appartenance aux listes, l'état de retrait. **Aucun
  attribut** (ni prénom, ni ville, ni langue) : la segmentation se fait chez nous, et Brevo
  rejette un contact entier sur un attribut non déclaré.
- **Synchronisation** (`brevo-contacts.ts`, cron 08:00 UTC, après les courriers contractuels) :
  1. **Brevo → Firestore, toujours** (dès que Brevo est configuré) : chaque contact de la liste
     en liste noire ou désinscrit de la liste est retiré chez nous par la même fonction que
     notre lien signé, et laisse une trace `brevo_retraits/{empreinte}`.
  2. **Firestore → Brevo, seulement avec l'accord** (`MARKETING_ENVOI_REEL = "oui"`),
     incrémental : ajoute les consentants absents de la liste ; met en liste noire un retiré
     chez nous que Brevo connaît encore (un retiré inconnu de Brevo n'y est pas envoyé).
  3. **On ne lève jamais une liste noire de Brevo**, sauf réabonnement explicite : un titulaire
     de compte dont le retrait a été repris de Brevo et qui recoche la préférence dans son
     espace. (Une liste noire peut venir d'une plainte ou d'un rebond dur.) Un abonné sans
     compte retiré l'est à vie, comme avant.
- **Désinscription** :
  - depuis une **campagne** : lien Brevo → liste noire Brevo → reporté dans Firestore au plus tard
    au prochain envoi réel ou au cron du lendemain (avant la bienvenue n°2/n°3, qui passe après
    la synchronisation) ;
  - depuis un **envoi unitaire** ou le bouton natif de Gmail/Yahoo/Apple : notre route signée
    `GET`/`POST /desabonnement` (RFC 8058) → Firestore immédiatement → liste noire Brevo au
    cron suivant.
  - ⚠️ Tant que le cron n'a pas tourné, une campagne lancée **à la main depuis l'interface Brevo**
    pourrait atteindre une personne retirée chez nous depuis la veille. Ne jamais envoyer depuis
    l'interface Brevo : passer par la route.
- **Journal** : `campaigns/{id}` (empreinte testée, statut, audience, `derniereCampagneBrevo`),
  `campaign_sends/{id}__{empreinte}` (adresse, `envoye`/`echec`, `campagneBrevo`, `listeBrevo`),
  `brevo_retraits/{empreinte}`. Collections fermées au client (règle par défaut).
- **À faire côté conformité** : formulaire en opt-in simple (case non cochée, horodatée) ; le
  double opt-in reste recommandé — non implémenté.

---

## 5. Les interrupteurs

| Variable | Où | Valeur livrée | Rôle |
|---|---|---|---|
| `BREVO_API_KEY` | secret | **déjà posé** en production | clé API v3 |
| `BREVO_LIST_ID` | `wrangler.jsonc` | `4` (« Lettre — apprenants ») | liste principale — **à reconfirmer** (une note de juin parlait de la liste 2) |
| `BREVO_SENDER_EMAIL` | `wrangler.jsonc` | `lettre@lettre.maxmorrys.me` | expéditeur marketing (domaine authentifié Brevo) |
| `MARKETING_ENVOI_REEL` | `wrangler.jsonc` | **`non`** | **l'accord de Max**. `oui` ouvre le réel (campagnes, bienvenue n°2/n°3, poussée de contacts) |
| `MARKETING_PLAFOND_JOUR` | `wrangler.jsonc` | `300` | plafond Brevo/jour UTC, tout compris |
| `MARKETING_API_KEY` | secret | **à poser** | clé de la route, partagée avec n8n |
| `MARKETING_TEST_TO` | secret | **à poser** | adresses d'épreuve, séparées par des virgules |
| `EXPORT_SIGNING_KEY` | secret | déjà posé | signe les liens de retrait |

L'envoi réel exige **les deux** : Brevo configuré **et** `MARKETING_ENVOI_REEL = "oui"`.

---

## 6. Déploiement (manuel, par Max)

Rien n'a été déployé, aucun secret posé, rien commité. Depuis la racine du dépôt :

```bash
# 0. Vérifier le compte Brevo — LECTURE SEULE, n'envoie rien
read -s BREVO_API_KEY && export BREVO_API_KEY       # coller la clé xkeysib-… (rien ne s'affiche)
node worker/apps/api/scripts/brevo-verifier.mjs      # compte, plan, liste 4, expéditeur, domaine lettre.
unset BREVO_API_KEY
#   → si la liste ou l'expéditeur ne correspondent pas : corriger BREVO_LIST_ID /
#     BREVO_SENDER_EMAIL dans worker/apps/api/wrangler.jsonc (les DEUX blocs), ou ajouter
#     l'expéditeur dans Brevo (Expéditeurs, domaines et IP dédiées).

cd worker/apps/api

# 1. Secrets de la route (une fois)
openssl rand -hex 32                                 # → valeur de la clé, à copier aussi dans n8n
npx wrangler secret put MARKETING_API_KEY            # coller la valeur
npx wrangler secret put MARKETING_TEST_TO            # ex. ton adresse (deux au plus, séparées par une virgule)
npx wrangler secret list                             # doivent figurer : BREVO_API_KEY, EXPORT_SIGNING_KEY,
                                                     # MARKETING_API_KEY, MARKETING_TEST_TO

# 2. Vérifier puis déployer
(cd ../.. && npm run typecheck && npm test)
npx wrangler deploy --dry-run --env=""
npx wrangler deploy --env=""
npx wrangler versions view --json | head -40        # ce qui est EN SERVICE (pas wrangler.jsonc)
```

Épreuve après déploiement (mode test : une seule adresse, la tienne) :

```bash
curl -sS -X POST https://api.maxmorrys.me/marketing/campagne -H 'Content-Type: application/json' \
  -H "X-Marketing-Key: $MARKETING_API_KEY" \
  -d '{"id":"fumee-1","objet":"Test de fumée","preheader":"Vérification du canal.","mode":"test",
       "blocs":[{"type":"paragraphe","texte":"Si tu lis ceci, le canal Brevo répond."}]}'
# attendu : {"ok":true,"mode":"test","envoye":true,"audiencePrevue":N,…}
```

**Ouvrir l'envoi réel** (décision de Max, après l'épreuve relue) :

```bash
# dans worker/apps/api/wrangler.jsonc, les DEUX blocs : "MARKETING_ENVOI_REEL": "oui"
npx wrangler deploy --env=""
```

Effets immédiats de l'ouverture : la route accepte `mode: "reel"`, le cron de 08:00 pousse
l'audience consentante dans la liste Brevo et envoie la bienvenue n°2/n°3 aux comptes à J+2/J+5
ayant accepté la lettre. Pour refermer : remettre `"non"` et redéployer.

---

## 7. Vérifier et prévisualiser

```bash
cd worker
npm test                                     # dont brevo-contacts, campagne, envoi-modele, lifecycle
npm run typecheck
npm -w @mm/api-worker run email:apercu       # écrit apps/api/.email-preview/ (ignoré par git)
open apps/api/.email-preview/index.html
```

Tout nouvel e-mail s'ajoute au catalogue `worker/apps/api/test/apercu/catalogue.ts` (vérifié :
version texte, voix, emoji, retrait, contraste, bouton unique), et son **régime** dans
`modeles.ts` décide de son transport.

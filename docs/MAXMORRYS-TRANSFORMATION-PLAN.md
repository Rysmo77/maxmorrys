# Plan de transformation — maxmorrys.me

État de départ : [MAXMORRYS-CURRENT-STATE.md](./MAXMORRYS-CURRENT-STATE.md).
Architecture cible : [BRAND-ARCHITECTURE.md](./BRAND-ARCHITECTURE.md).

_13 août 2026._

---

## 1. Positionnement actuel

Max-Morrys est perçu comme **formateur et créateur de contenu digital**, avec une activité
annexe de **digitalisation de commerces de proximité**.

Le pied de page indique que la marque est opérée par My Onoma SARL, mais rien n'explique ce
qu'est My Onoma, ni comment travailler avec Max-Morrys au-delà d'un formulaire de contact
générique.

La page `/agence` — seule porte d'entrée commerciale B2B — vend des packs à 295 000 – 895 000 XOF
à des commerçants, au tutoiement, avec grille tarifaire publique et transfert WhatsApp. Un
fondateur de startup ou un directeur d'institution n'y trouve rien qui le concerne.

**Perception résultante** : un formateur qui fait aussi des sites pour commerçants.

---

## 2. Positionnement cible

Max-Morrys est un **praticien du digital** : product builder, expert marketing, spécialiste de
l'IA appliquée, entrepreneur, formateur et créateur de contenu. À l'intersection
**Marketing × Product × Technology × AI**.

La promesse de marque est conservée — **« Maîtrise le digital, accélère ta croissance »** — mais
elle se décline désormais en deux parcours explicites :

```
LEARN          → Apprendre avec Max-Morrys
WORK WITH ME   → Construire avec Max-Morrys Agency
```

**Perception cible** : un praticien crédible dont on peut apprendre, et dont le studio peut
construire.

### L'expérience en 20 secondes

| Question | Réponse que le site doit donner |
| --- | --- |
| Qui est-il ? | Marketer, builder, formateur, entrepreneur |
| Que puis-je apprendre ? | Marketing, Product, IA, SEO, outils digitaux |
| Puis-je me former ? | Oui |
| Puis-je travailler avec lui ? | Oui, via Max-Morrys Agency |
| Que construit son agence ? | Produits numériques, plateformes, systèmes IA, expériences digitales |
| Qui réalise ces missions ? | Max-Morrys Agency, au sein de MY ONOMA |
| Et si mon besoin est Growth ? | Cléa Growth Office, au sein de MY ONOMA |

---

## 3. Routes existantes

Voir [MAXMORRYS-CURRENT-STATE.md §2](./MAXMORRYS-CURRENT-STATE.md) pour la cartographie
complète : 19 routes publiques, 13 routes LMS, 6 routes auth/divers, 17 écrans admin — chacune
montée deux fois (FR canonique, EN sous `/en`).

---

## 4. Architecture informationnelle cible

```
/                              Accueil — marque personnelle
/a-propos                      À propos + « Au-delà de la marque personnelle »
/formations                    ─┐
/blog                           │  LEARN + écosystème de contenu
/podcasts                       │  (inchangés structurellement)
/videos                         │
/faq                           ─┘
/contact
/agence                        ★ Max-Morrys Agency — high-ticket
/presence-digitale             ★ Digital Commerce Local — offre TPE déplacée
/presence-digitale/devis/:ref  ★ Récapitulatif de devis, déplacé
/legal/*                       inchangées, entité complétée
```

### Navigation principale

```
Je suis Max-Morrys · Je te forme · Je t'informe · Je te transforme ▾ · Je te digitalise · Contacte-moi
                                          [🔍 FR ☾] │ Connexion │ [ Agence ]
```

L'agence devient visible sans devenir le centre du site : elle est le **seul bouton plein** de
l'en-tête, et le seul libellé au registre entité. Le libellé « Travaillons ensemble » a été
retiré de la nav (la clé `nav.workWithMe` est supprimée) : une nav liste des destinations.

`/presence-digitale` **est entrée** dans la navigation le 13/08/2026 sous « Je te digitalise »
(révision de la décision initiale — voir `AGENCY-POSITIONING.md §9`). Elle reste accessible par
le pied de page, une section de la page d'accueil et un renvoi en bas de `/agence`, désormais
réciproque.

⚠️ La barre compte six libellés FR longs : le padding des items, le rappel `⌘K` et la gouttière
de la rangée ont été compactés pour tenir à `xl` (1280 px). Un septième libellé imposerait une
nouvelle compensation.

---

## 5. Pages préservées

Sans changement structurel : `/formations`, `/formations/:slug`, `/blog`, `/blog/:slug`,
`/podcasts`, `/podcasts/:slug`, `/videos`, `/videos/:slug`, `/faq`, `/contact`, toutes les pages
légales, **l'intégralité du LMS**, l'espace membre, le Club des Digitos, Rysmo et l'admin.

`/a-propos` conserve son récit et sa frise ; une seule section y est ajoutée.

L'identité éditoriale « Je te… » est préservée sur tout le territoire LEARN.

---

## 6. Pages fusionnées

**Aucune.** Aucune fusion n'est justifiée : les pages existantes ont chacune un rôle distinct.

L'architecture cible évoquait des sous-pages `/agence/product`, `/agence/ai-automation`,
`/agence/technology`, `/agence/personal-branding`, `/agence/work`. Elles **ne sont pas créées** :
le volume de contenu ne les justifie pas, et une excellente page unique vaut mieux que cinq
pages pauvres.

---

## 7. Pages créées

| Route | Rôle |
| --- | --- |
| `/agence` (reconstruite) | Landing high-ticket Product · AI · Technology · Brand |
| `/presence-digitale` | Accueil de l'offre TPE, déplacée telle quelle |
| `/presence-digitale/devis/:ref` | Récapitulatif de devis, déplacé |
| `/admin/projets` | Suivi des demandes de mission high-ticket |

**Non créée : `/ressources`.** Le dépôt ne contient aucune ressource téléchargeable. La page
serait vide. Voir [CONTENT-TODO.md §6](./CONTENT-TODO.md).

---

## 8. Pages supprimées

**Aucune.** Rien n'est supprimé.

L'offre « Digital Commerce Local » est **déplacée**, pas retirée : pages, tarifs, sélecteur,
tunnel de devis, transfert WhatsApp, écran d'administration et collections Firestore sont
conservés à l'identique.

---

## 9. Migration de contenu

| Depuis | Vers | Nature |
| --- | --- | --- |
| `src/pages/Agence.tsx` | `src/pages/PresenceDigitale.tsx` | Déplacement à contenu constant |
| `src/pages/AgenceDevis.tsx` | `src/pages/PresenceDevis.tsx` | Déplacement |
| `src/i18n/locales/{fr,en}/agency.json` | `presence.json` | Clés inchangées |
| `src/lib/agency/{offer,whatsapp}.ts` | `src/lib/presence/` | Déplacement |
| `src/components/agency/*` | `src/components/presence/` | Déplacement |
| — | `src/i18n/locales/{fr,en}/agency.json` | **Nouveau** contenu high-ticket, vouvoiement |

**Collections Firestore inchangées** : `agency_leads` et `agency_quotes` conservent leurs noms.
Les renommer casserait les données de production, les règles et l'écran d'administration. Le
vocabulaire évolue dans l'interface, pas en base.

La nouvelle collection `engagement_leads` accueille les demandes high-ticket, dont le schéma n'a
rien à voir avec celui des prospects TPE (`businessName`, `sector`, `pack`, `plan`).

---

## 10. Architecture de marque

Nouveau module [`src/lib/brand/`](../src/lib/brand/), calqué sur celui du dépôt corporate afin
que les deux plateformes ne puissent pas diverger :

| Fichier | Contenu |
| --- | --- |
| `company.ts` | `legalEntity`, `legalName`, `positioning`, contacts, réseaux |
| `practices.ts` | `build` (Max-Morrys Agency) et `grow` (Cléa Growth Office), pilier ≠ marque |
| `ventures.ts` | DOVEN, NAYO, STEPS — `operator` / `owner` / `status` séparés |
| `clients.ts` | Amour Divin — `owner: 'client'` |
| `index.ts` | Barrel unique |

`https://myonoma.com`, aujourd'hui codé en dur dans le pied de page, y remonte.
`seo-config.ts` devient consommateur de `brand/company.ts` au lieu d'être une source concurrente.

Détail complet : [BRAND-ARCHITECTURE.md](./BRAND-ARCHITECTURE.md).

---

## 11. Repositionnement de l'agence

Structure de `/agence` :

```
01 HERO                  02 WHO WE HELP          03 CAPABILITIES
04 SELECTED WORK         05 HOW WE WORK          06 MY ONOMA
07 FAQ                   08 QUALIFICATION FORM   09 FINAL CTA
```

Aucune grille tarifaire · aucune stack dans le hero · aucun chiffre, logo ou témoignage
inventé · vouvoiement intégral.

Détail : [AGENCY-POSITIONING.md](./AGENCY-POSITIONING.md).

---

## 12. Intégration MY ONOMA

Trois surfaces, et trois seulement :

1. **`/agence`, section 06** — « Max-Morrys Agency est la practice Product, AI, Technology &
   Brand de MY ONOMA », avec le renvoi vers Cléa Growth Office et le lien « Discover MY ONOMA ».
2. **`/a-propos`** — une section courte « Au-delà de la marque personnelle » (BUILD · GROW · OWN).
3. **Pied de page et pages légales** — la mention existante, désormais alimentée par
   `brand/company.ts`.

MY ONOMA ne devient **pas** une co-marque omniprésente. Aucun rôle, titre ou fonction de
Max-Morrys au sein de MY ONOMA n'est publié.

---

## 13. Migration SEO

`/agence` **conserve son URL** — c'est l'adresse déclarée par le dépôt corporate
(`practices.build.externalUrl`). Seul son contenu change.

| Action | Détail |
| --- | --- |
| Redirection | `/agence/devis/:ref` → `/presence-digitale/devis/:ref` — des liens de devis circulent déjà sur WhatsApp |
| Nouvelles entrées | `/presence-digitale` dans le sitemap et le prerender, FR **et** EN |
| Métadonnées | Le `bodyText` de prerender de `/agence`, qui récitait les tarifs TPE, suit vers `/presence-digitale` |
| JSON-LD `/agence` | `Service` + `provider: Organization(MY ONOMA SARL)` + `brand: 'Max-Morrys Agency'` — **jamais** une société autonome |
| JSON-LD `/presence-digitale` | Le `Service` avec `areaServed` Dakar/Abidjan/Cotonou suit l'offre TPE |
| Correctifs | `BreadcrumbList` ajouté sur `/agence`, `/a-propos`, `/faq`, `/contact` ; `/legal/cgu` ajouté au sitemap ; handle Twitter aligné |

> ⚠️ Chaque route touchée doit être répercutée dans **six** emplacements :
> `functions/src/prerender.ts`, `functions/src/sitemap.ts`,
> `worker/apps/site/src/prerender/static-pages.ts`, `worker/apps/site/src/seo/sitemap.ts`,
> `worker/apps/site/src/routes.ts` et `firebase.json`. En oublier un laisse l'edge servir
> l'ancienne marque aux robots.

Détail : [SEO-AUDIT.md](./SEO-AUDIT.md).

---

## 14. Analytics

Événements ajoutés, via les fonctions existantes de `src/lib/tracking.ts` — sans doublonner
l'existant :

```
agency_view              agency_capability_view    agency_cta_click
agency_form_start        agency_form_submit        growth_referral_click
```

La soumission du formulaire de qualification passe par `trackGenerateLead('agency_engagement')`,
déjà câblé sur GA4 et Meta Pixel. Les événements TPE existants sont conservés tels quels.

---

## 15. Points juridiques

Neuf décisions sont à rendre, dont une urgente : **le prix du Club des Digitos**, annoncé à
10 000 FCFA/an dans les CGV et débité à 19 900 FCFA par le code.

Aucun de ces points n'a été tranché dans le code. Détail : [LEGAL-TODO.md](./LEGAL-TODO.md).

Frontières de propriété intellectuelle : [IP-BOUNDARIES.md](./IP-BOUNDARIES.md).

---

## 16. Risques

| Risque | Traitement |
| --- | --- |
| **Casser le tunnel de paiement** | `/paiement/retour` et `/checkout` ne sont pas touchés. Le segment est codé en dur côté serveur : tout renommage enverrait les paiements en cours sur une 404 |
| **Perdre la ligne commerciale TPE** | Déplacement à contenu, tarifs et collections constants. Les 28 tests de `agency-offer` restent verts |
| **Liens de devis déjà partagés** | Redirection `/agence/devis/:ref` maintenue |
| **Divergence edge / SPA** | Les six emplacements de routage sont mis à jour ensemble ; vérification par `curl` avec un user-agent de robot |
| **Régression `/en`** | Chaque nouveau segment reçoit une valeur EN **unique** ; parcours testés dans les deux langues |
| **Divergence avec le dépôt corporate** | `src/lib/brand/` est un miroir ; en cas de conflit, My-onoma fait foi |
| **Publier une preuve inventée** | `/agence` sort sans chiffre, logo ni témoignage. Tout est listé dans CONTENT-TODO |
| **Casser la newsletter** | Le plafond `keys().size()` des règles Firestore est relevé **en même temps** que l'ajout du champ de consentement |
| **Règles non déployées** | La CI ne déploie que le hosting : le déploiement des règles reste manuel et explicite |

---

## 17. Ordre d'exécution

1. **Documentation** — les 9 documents de `docs/`, avant toute modification de code.
2. **Configuration de marque** — `src/lib/brand/`, branchement de `seo-config` et du pied de page.
3. **Déplacement de l'offre TPE** — à contenu constant, tests verts.
4. **Reconstruction de `/agence`** — 9 sections, nouveau namespace i18n, vouvoiement.
5. **Formulaire de qualification** — `engagement_leads`, règles Firestore, routage Cléa, admin.
6. **Accueil, À propos, navigation, CTA**.
7. **SEO, edge, analytics** — les six emplacements, JSON-LD, redirections.
8. **Correctifs transverses** — consentement newsletter, `navigate()` localisés, entité légale.
9. **Vérification** — lint, typecheck, tests, build, Worker, puis parcours manuels FR et EN.

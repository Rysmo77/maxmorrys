# Skill — Offre Agence « Digital Commerce Local » (/agence)

La **ligne 11** du business model : je digitalise les commerces de quartier. C'est la piste B de la
stratégie de contenu (skill `content-strategy`).

**Sources de vérité, dans cet ordre :**
1. **`src/lib/agency/offer.ts`** — les montants. *SOURCE DE VÉRITÉ UNIQUE.* Aucun prix ne se cite de mémoire.
2. `docs/OFFRE_AGENCE_TPE.md` — la référence commerciale complète.
3. `src/i18n/locales/fr/agency.json` — la copie publique exacte de la page.
4. `skills/commercial-kit/SKILL.md` — le playbook de vente.

Pages publiques : **`https://maxmorrys.me/agence`** · devis : `/agence/devis/:ref` ·
version anglaise : `/en/agency`.

## À qui je vends

Commerce physique établi, **1 à 15 salariés**, CA mensuel **800 000 – 5 000 000 XOF**, décideur
unique joignable sur WhatsApp. **Dakar, Abidjan, Cotonou.**

Secteurs : restaurants / fast-food / pâtisseries · prêt-à-porter, chaussures, cosmétiques ·
salons de beauté, barbiers, spas · pharmacies, cliniques, cabinets · quincailleries, matériaux,
pièces auto · écoles et centres de formation.

**Bons signaux** : une page Facebook ou Instagram existante mais mal tenue ; des commandes WhatsApp
désordonnées.

**À refuser** (ne jamais produire de contenu qui les attire) : celui qui veut « le site le moins
cher » ; celui qui demande les accès aux outils d'automatisation ; celui qui exige un résultat
chiffré garanti ; une trésorerie visiblement tendue.

## La grille (montants XOF — **relire `offer.ts` avant toute citation**)

**Mise en place — paiement unique :**

| Pack | Prix | Promo | Support inclus |
|---|---:|---:|---|
| Présence Locale | 295 000 | 250 000 | 30 j |
| **Commerce Visible** ⭐ *offre principale* | **495 000** | — | 30 j |
| Boutique Digitale | 895 000 | — | 60 j |

**Accompagnement mensuel :**

| Formule | Mise en place | Mensuel | Engagement |
|---|---:|---:|---|
| **Croissance Automatisée** ⭐ | 375 000 | 175 000 | aucun |
| Commerce 360 | 750 000 | 225 000 | **6 mois → 2 100 000 au total** |

> **Commerce 360 : toujours annoncer le total ET la décomposition.** « 750 000 pour construire
> l'écosystème, puis 225 000 par mois pour le faire fonctionner. » Cacher le total détruit la
> confiance dès la première facture.

**Options à la carte** : produit supplémentaire 1 000–3 500 · page 35 000–75 000 · mesure avancée
75 000–350 000 · **Automatisation sur mesure** 125 000–250 000 · maintenance 45 000–75 000/mois ·
référencement local 125 000–300 000/mois (engagement 6 mois).

**Conditions** : 60 % à la commande, 40 % avant mise en ligne · 2 séries de modifications incluses ·
publicité, nom de domaine, API et abonnements tiers **exclus** · **domaine et comptes au nom du client** ·
délai de livraison 1 à 3 semaines.

> **Prix planchers** (225 000 / 400 000 / 700 000) : garde-fous **internes**. Jamais affichés,
> jamais franchis, jamais évoqués dans un contenu.

## Traduire la technique en bénéfice — table obligatoire

Aucun terme technique dans un contenu piste B, un devis ou une page de vente.

| ❌ Ne jamais écrire | ✅ Toujours écrire |
|---|---|
| Site web | « Votre commerce visible 24h/24, même fermé » |
| Catalogue Meta / WhatsApp | « Vos produits commandables directement sur WhatsApp » |
| Merchant Center | « Vos produits affichés dans les résultats Google » |
| Fiche d'établissement Google | « Apparaître sur Google Maps quand on cherche votre métier dans votre quartier » |
| GA4, Tag Manager, Pixel | « Savoir combien de clients Internet vous rapporte » |
| Référencement, SEO | « Passer devant vos concurrents sur Google » |
| Workflow n8n, automatisation | « Publier tous les jours sans y penser » |

## Ordre de démonstration — non négociable

1. **Google Maps d'abord** : « tape ton métier et ton quartier ». On lui montre où il est, ou n'est pas.
2. **La comparaison** : sa page sociale contre celle d'un concurrent qui publie régulièrement.
3. **Seulement ensuite**, les packs.

> **Ne jamais commencer par le site web.** C'est l'erreur qui transforme une vente de système en
> vente d'objet — et un objet, ça se compare au prix.

## Les objections, et les réponses de la page

- *« C'est trop cher pour mon commerce. »* → « Combien vaut un nouveau client pour toi ? Si c'est
  15 000 FCFA, le pack Commerce Visible est remboursé au bout de 33 clients. La vraie question n'est
  pas le montant, c'est en combien de temps il te revient. »
- *« Mon neveu peut me faire un site pour moins cher. »* → « Un site est un objet ; ce que je te
  vends, c'est un système. »
- *« Combien de clients tu me garantis ? »* → « Aucun, et méfie-toi de quiconque te garantit un
  chiffre. Je garantis la qualité de ce que j'installe et la régularité de ce que je publie. »
- *« Et si j'arrête, je perds tout ? »* → « Non. Ton nom de domaine, tes contenus et tes comptes
  sont créés à ton nom dès le départ. »

## Le KPI qui décide de tout

En setup-first solo, le plafond est de **3 à 4 mises en place par mois** (~20 M XOF/an sur la seule
mise en place). Ce qui casse ce plafond : **le taux de conversion des clients livrés vers un
accompagnement mensuel — cible ≥ 40 %, mesuré à J+30**, à la fin du support inclus. La marge brute
du récurrent est d'environ 96 %.

→ **Conséquence éditoriale** : l'accompagnement (`Offre=Accompagnement`) doit être présent dans le
calendrier, pas seulement la mise en place. Vendre l'installation sans vendre le pilotage, c'est
travailler pour le plafond.

Autres suivis : leads agence (`agency_leads`, vue `/admin/prospects-agence`), pipeline pondéré
(`new: 0 · qualified: 0,25 · quoted: 0,5 · signed: 1`), délai de livraison moyen.

**Parrainage** : 15 % de la mise en place + 1 mois d'accompagnement offert au parrain,
code `PRENOM-AGENCE`.

## Red lines (NON négociables)

- **Ne jamais livrer, montrer ni décrire de façon reproductible les workflows n8n ou les gabarits
  Paperclip.** Le client achète un résultat, jamais l'outil. Les livrer supprime la marge et
  fabrique un concurrent. Vocabulaire imposé : « tes publications préparées et programmées, tu
  valides d'un message ». L'option payante s'appelle **« Automatisation sur mesure »**.
  → Le mot « n8n » est **autorisé face aux apprenants** (piste A, sujet de formation légitime),
  **proscrit face aux commerçants** (piste B).
- **Ne jamais facturer à l'heure ou à la journée** — les TPE achètent un résultat, pas du temps.
- **Ne jamais vendre « SEO » ou « Analytics » en ligne isolée** à un petit commerce : invérifiable
  de son point de vue, donc perçu comme du vent et générateur de litiges.
- **Aucune obligation de résultat** sur un canal tiers (Meta, Google) : obligation de moyens explicite.
- **Aucun démarrage sans l'acompte de 60 % encaissé.**
- **Aucun compte au-dessus de 25 % du CA de la ligne** — refuser sa croissance plutôt que créer une dépendance.
- **Aucun message sortant à un prospect réel sans approbation board.** Le closing est humain, jamais l'agent.
- **Un devis partageable (`agency_quotes`) ne contient JAMAIS de donnée personnelle** : le lien
  circule sur WhatsApp. Téléphone, email et nom du contact restent dans `agency_leads`.
- **Aucun client identifiable** dans un contenu sans accord écrit.

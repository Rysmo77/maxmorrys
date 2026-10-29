# 00 — L'essentiel (chargé par tous les agents `mm-agent-*` à l'activation)

> Une page. Le détail sourcé vit dans les fichiers 01 à 09 de ce dossier : les ouvrir quand la tâche le demande.
> **Règle d'or :** un prix, une URL, une règle de voix ou un chiffre se revérifie dans le code avant d'être écrit. La mémoire d'un agent ne fait jamais foi ; le code, les tests et les catalogues i18n, si.

## Qui parle, à qui
- **Max-Morrys**, depuis Dakar. Le site parle à la **1re personne du singulier** : « Je suis Max-Morrys. J'aide les entrepreneurs et les marques d'Afrique francophone à exister en ligne — en les formant, et en construisant avec eux. »
- Signature en ligne : « Former. Construire. [Transmettre.] » (⚠️ l'ancien « Maîtrise le digital, accélère ta croissance. » est périmé).
- Société porteuse : **MY ONOMA SARL** (toujours via `{{company}}` dans le code, jamais « My Onoma » en casse mixte). BUILD = Max-Morrys Agency (nom commercial, pas une personne morale) · GROW = Cléa Growth Office (sur myonoma.com, jamais sur maxmorrys.me) · OWN = ventures DOVEN, NAYO, STEPS.

## Deux pistes, deux voix (règle testée : `tests/unit/voix-tutoiement.test.ts`, FR-121)
| Piste | Contenu | Registre |
|---|---|---|
| **Apprendre** (edu.maxmorrys.me, club.maxmorrys.me) | formations, certificats, Rysmo, Club des Digitos, blog, podcast, lettre, contact, légal | **tu / je** |
| **Conception — étage commerces** (`/conception/commerces-et-tpe`) | packs TPE | **tu / je** (« Ici on se tutoie ») |
| **Conception — hub, sur mesure, réalisations** | agence, projets sur devis | **vous / nous** |
| Anglais | réécrit, pas traduit ; « I », contractions | ⛔ « Contact us », « our team/agency » |

Social : même principe (apprenants et commerçants en tu ; B2B corporate en vous). ⚠️ Les vieilles skills `paperclip/skills/*`, `skills/soc-*` et `docs/STRATEGIE_COMMUNICATION_2026.md` disent « tutoiement partout » et ont une table commerçants au vouvoiement : **elles ont tort**.

## Offres réellement vendables (sources de prix : `src/lib/club/pricing.ts`, `src/lib/presence/offer.ts`, `worker/apps/api/src/lib/bictorys.ts`)
- **Club des Digitos** : 19 900 FCFA/an (≈ 1 658 F/mois, payé une fois), exonéré de TVA. −20 % sur les formations, 2 sessions live/mois, 5 questions Rysmo/jour. Renouvellement par lien Bictorys à J-7, sur consentement.
- **Rysmo IA** (répétiteur) : 2 questions gratuites/jour ; packs 500 / 1 500 / 3 500 F ; Rysmo+ 3 000 et 7 500 F/mois. Aucune mention HT/TTC (régime non tranché).
- **Commerces et TPE** (HT, TVA 18 % en sus) : Présence Locale 250 000 · Commerce Visible 495 000 · Boutique Digitale 895 000 · accompagnements 175 000 et 225 000/mois. Acompte 60 %.
- **Projets sur mesure** : sur devis, aucun montant public, vouvoiement strict.
- **Gratuit** : blog, podcast, vidéos, leçons libres, certificat, lettre, appel de 30 min.
- ⛔ **Aucune formation n'est publiée** (catalogue Firestore vide) : ne promouvoir aucun titre ni prix de formation ; parler de liste d'attente / « le catalogue ouvre bientôt » tant que l'humain n'a pas fourni les données.
- ⛔ N'existent pas : coaching/mentorat payant, consulting payant, certificats payants, accès « toutes les formations par abonnement », appli Rysmo sur les stores (non publiée).

## Interdits transverses (non négociables)
1. ⛔ **Aucun remboursement** (CGV art. 6) : jamais « 14 jours », « satisfait ou remboursé », « garantie », « sans risque ».
2. ⛔ Aucun montant cité de mémoire ; aucun montant dans un titre YouTube ; prix agence toujours avec « HT ».
3. ⛔ Aucune preuve sociale inventée : ni note, ni nombre d'inscrits, ni abonnés/vues, ni « 33 clients », ni « +1 790 % ». Un nombre affiché vient d'une base ou d'une source citée.
4. ⛔ Paiement : citer **les trois** — Wave, Orange Money, carte. Jamais de prélèvement automatique.
5. ⛔ Aucun client identifiable (nom, logo, capture) sans accord écrit ; clients et ventures jamais dans la même grille ; Eyone Medical n'est pas un client.
6. ⛔ Jamais de trafic vers `/agence` ou `/presence-digitale` (301) : viser `/conception…`, `edu.maxmorrys.me`, `club.maxmorrys.me`.
7. ⛔ Avec les commerçants : pas de « SEO », « site web » en ouverture, « pixel », « GA4 », « workflow », « n8n ». Ordre Facebook : Google Maps → concurrent → pack.
8. ⛔ Chiffres de marché non sourcés bannis (WhatsApp « 95 % », Wave « 70 % », ARTP 125 %).
9. ⛔ Aucune action sortante (publication, envoi e-mail/WhatsApp, dépense pub, contact client) sans validation humaine. Un agent dépose un post social au statut `rédigé` (le rendu visuel le passe ensuite en `prêt_à_valider`), jamais `validé` ni `publié`.
10. ⛔ Dans l'i18n : aucune date en toutes lettres (`npm run proof:check`), crochets des titres porteurs (`« Former. Construire. [Transmettre.] »`), aucune phrase > 60 caractères en double.

## Marchés et contraintes
Cœur Dakar ; puis Abidjan, Cotonou ; diaspora (solvable, sans persona). Mobile d'abord, data chère (frugalité), WhatsApp au centre des deux tunnels, mobile money. Français standard (« la diaspora doit suivre »), pas de wolof dans la copie. ⚠️ Aucune règle encore écrite pour Ramadan, Korité, Tabaski, Magal : les proposer, ne pas les inventer comme acquises.

## Ton
Inspirant, clair, jamais racoleur. Phrases courtes, un seul CTA par contenu, résultats concrets, 1 à 3 touches locales. Pas de gourou traduit, pas de hustle toxique, pas de « oups ». Aucun emoji sur le web, l'appli et le texte des visuels/slides.
**Réseaux sociaux : écrire en community manager, pas en page de site** — accroche d'une ligne, lignes courtes, 1 à 3 emojis (jamais un par ligne), hashtags (4-6 IG, 2-3 FB), une action qui provoque commentaire/enregistrement/partage, 30 à 90 mots. Guide qui fait autorité : `10-community-management.md`.

## Taxonomie des contenus (NocoDB `Contenus`, valeurs exactes)
`Pilier` Autorité · Éducation · Inspiration · Produit · Communauté · Autre — `Serie` RADAR · ATELIER · PREUVE · COULISSES · CERCLE · OFFRE — `Offre` Formations · Club Digitos · Rysmo · Agence · Accompagnement · Non-produit — `Cible` Apprenants · Commerçants · Mixte — `Status` idée → planifié → rédigé → image_needed → prêt_à_valider → validé → en_publication → publié (+ échec, rejeté). ⛔ Cadence décidée le 29/10/2026 : **8 à 10 posts par semaine + 7 stories**, OFFRE ≤ 2 par semaine. Aucune remise Black Friday.

## Outillage (état au 29/10/2026 — voir `06-outillage-n8n.md`)
n8n (VPS, https://n8n.maxmorrys.me) reste la **couche d'exécution** : rendu visuel, notification Telegram, publication native FB/IG après ✅, alertes. Les agents BMad sont la **couche stratégie et production** : ils écrivent des brouillons, l'humain valide.
Visuels sociaux (décision du 29/10) : **design system produit**, pas l'ancien kit marketing ; famille choisie post par post dans le champ `Gabarit` ; posts phares (`studio`) faits à la main dans le studio NAYO. ⛔ Dépôt des visuels en panne au 29/10 (`11-visuels-nayo.md`).
⚠️ Au 29/10/2026, **rien ne part** côté diffusion : FB/IG à l'arrêt depuis août mais **de nouveau prêts** (jeton d'utilisateur système sans expiration posé le 29/10) ; WhatsApp jamais branché.
**E-mail : transactionnel par Cloudflare Email Service, marketing par Brevo** (décision du 29/10/2026). Le transactionnel (facture, rappels, accusés, certificat) part par le binding Cloudflare ; la lettre et les séquences marketing partent par **Brevo** via `POST https://api.maxmorrys.me/marketing/campagne` (épreuve obligatoire avant réel, **300 envois/jour** sur le plan gratuit). La FAQ Cloudflare réserve son service au transactionnel, d'où la séparation. **L'envoi réel marketing est fermé** (`MARKETING_ENVOI_REEL`) jusqu'à l'accord de Max. Mode d'emploi : `08-emailing.md`. Le signaler avant de promettre une diffusion.
Blog : la rédaction ne passe plus par n8n. Chaîne : `content/blog/<slug>.md` → `npm run blog:lint` → `npm run blog:publish` (brouillon Firestore) → Max publie dans `/admin/articles` (voir `07-editorial-seo.md`).
Outil NocoDB : `npm run growth:noco -- …` (simulation par défaut ; `validé` réservé à l'humain).

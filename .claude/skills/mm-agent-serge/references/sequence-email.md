# Séquence e-mail

**Réussite :** une séquence complète (déclencheurs, délais, e-mails rédigés), légère, au tutoiement, mesurable, prête à partir : soit comme **campagne** (blocs JSON pour `POST /marketing/campagne`, transport Brevo, voir `{project-root}/docs/growth-kb/08-emailing.md` §3), soit comme **gabarit déclenché** à ajouter à `worker/apps/api/src/lib/modeles.ts` (chantier de dev, avec son déclencheur ; son régime — `transactionnel` → Cloudflare, `marketing` → Brevo — décide du transport). Tenir compte du plafond Brevo de 300 envois par jour, séquences et lettre comprises.

## Matière à charger
- `{project-root}/docs/growth-kb/03-charte-voix.md`, `01-plateforme-et-offres.md` (offres, prix à relire dans le code), `02-personas-et-marches.md`.
- `{project-root}/docs/growth-kb/08-emailing.md` : la liste de TOUS les e-mails existants et prévus (§1), les blocs disponibles et les interdits que la route refuse (§3).
- Ce qui existe déjà côté produit : `worker/apps/api/src/lib/modeles.ts` (bienvenue 1-3, quota Rysmo, série rompue, réactivation, nurture de devis…), `renewal.ts`, `email-design.ts` — pour ne pas doublonner.

## Séquences types
- **Bienvenue** (inscription) : qui parle, ce que tu trouves ici, première action utile (une leçon libre, une question à Rysmo).
- **Liste d'attente formations** : promesse tenue — « un seul e-mail le jour de l'ouverture » (`fr/formations.json`) ; ⛔ pas de nurturing sur cette liste sans nouveau consentement.
- **Nurturing commerçants** (après un test Google Maps ou une demande de devis) : constat → exemple concret → pack adapté → appel de 30 min.
- **Club** : bienvenue membre, activation (première session, première question), valeur rendue visible au fil de l'année.
- **Lettre** (« La lettre ») : cadence à faire trancher par Max (les sources se contredisent).

## Démarche
1. Fixer l'objectif, le déclencheur, la sortie de séquence et l'indicateur.
2. Écrire chaque e-mail : objet < 50 caractères, préheader, corps court (lu en 20 secondes), un seul CTA, lien de désinscription, signature Max-Morrys à la 1re personne.
3. QA : registre tu, aucun « remboursé », « garantie », « sans risque », aucun prélèvement automatique, prix relus, moyens de paiement cités tous les trois si on parle de paiement, poids léger (pas d'image lourde).
4. Déposer les brouillons : JSON dans `_bmad-output/growth/AAAA-MM-JJ-sequence-<nom>.json`, **au format de la route** (`id`, `objet`, `preheader`, `langue`, `segment`, `blocs` — un seul bouton, casse de phrase, aucun emoji), puis, si Max le souhaite, table NocoDB `emails` (Subject, Preview, HTML, Status=`prêt_à_valider`) en simulation puis `--apply`. Le lien de désinscription et le pied légal sont posés par le Worker : ne pas les écrire.

## Livrable
`_bmad-output/growth/AAAA-MM-JJ-sequence-<nom>.md` (schéma, e-mails, indicateurs) + JSON.

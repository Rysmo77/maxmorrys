# Base de connaissance marketing et éditoriale (`growth-kb`)

Socle commun des agents BMad `mm-agent-*` (`.claude/skills/mm-agent-*/`). Chaque agent charge `00-essentiel.md` à l'activation, plus les fichiers de son métier ; les autres s'ouvrent à la demande.

| Fichier | Contenu |
|---|---|
| `00-essentiel.md` | une page : voix par piste, offres vendables, interdits, taxonomie |
| `01-plateforme-et-offres.md` | identité, marques, sous-domaines, canaux, catalogue complet et incohérences |
| `02-personas-et-marches.md` | personas (toutes des hypothèses), marchés, contraintes mobile, data, paiement |
| `03-charte-voix.md` | registre testé, ton, lexique, typographie, copie de référence |
| `04-taxonomie-reseaux-qa.md` | taxonomie NocoDB, mix, règles par réseau, UTM, nommage, QA, validation |
| `05-identite-visuelle-concurrents.md` | les deux kits visuels, concurrents et références |
| `06-outillage-n8n.md` | n8n, NocoDB, Telegram, Paperclip : rôles, état des canaux, corrections |
| `07-editorial-seo.md` | chaîne éditoriale, règles d'un article, état SEO du blog |
| `08-emailing.md` | e-mailing : transactionnel = Cloudflare, marketing = Brevo ; tous les e-mails, gabarits, envoi de la lettre (n8n, agents), désinscription, plafond 300/jour, déploiement |
| `10-community-management.md` | écrire pour le fil et l'algorithme : accroche, longueurs, emojis, hashtags, voix CM |
| `11-visuels-nayo.md` | visuels sociaux : kit DS produit, familles `Gabarit`, circuit WF-04 → render-card, studio NAYO pour les posts phares, coûts |
| `12-rubriques-editoriales.md` | les 8 rubriques récurrentes (Flash du lundi, Le mot du digital, L'outil à 0 F…) : série de rattachement, créneaux, règles de veille, interdits |
| `09-trous-et-decisions-ouvertes.md` | contradictions et décisions humaines attendues |
| `audits/` | rapports d'audit datés (preuves) |

## Les agents

**Marketing (`team = growth`)** — party `comite-growth`
- 🧭 `mm-agent-awa` Awa, directrice marketing & growth (CMO)
- 🎯 `mm-agent-koffi` Koffi, performance & acquisition
- 📣 `mm-agent-mariam` Mariam, social & communauté
- 💌 `mm-agent-serge` Serge, CRM & lifecycle
- 🎨 `mm-agent-salimata` Salimata, création & marque
- 📈 `mm-agent-yann` Yann, analytics & insights
- 🤝 `mm-agent-ibrahima` Ibrahima, B2B, partenariats & commercial
- 📱 `mm-agent-landry` Landry, marketing de l'application mobile
- 💹 `mm-agent-aboubacar` Aboubacar, prix & revenus

**Rédaction (`team = editorial`)** — party `salle-de-redaction`
- 🗞️ `mm-agent-aminata` Aminata, rédactrice en chef
- 🔎 `mm-agent-thierry` Thierry, veille & recherche
- 🧩 `mm-agent-rokia` Rokia, stratège SEO
- ✍️ `mm-agent-cheikh` Cheikh, plume senior
- 🖋️ `mm-agent-beatrice` Béatrice, secrétaire de rédaction & conformité
- 🚀 `mm-agent-omar` Omar, éditeur web & publication

**Opérations (`team = operations`)** — party `comite-produit-revenus` (avec Awa, Aboubacar et Yann)
- 🎓 `mm-agent-adjoa` Adjoa, ingénieure pédagogique
- ⚖️ `mm-agent-ndeye` Ndèye, juriste & conformité
- 🤗 `mm-agent-josiane` Josiane, responsable succès client

Party transverse : `contenu-360` (marketing × rédaction).
Pour invoquer : « parle à Awa », `/mm-agent-awa`, ou `bmad-party-mode --party comite-growth`.

## Outils

- `npm run growth:noco -- <tables|schema|list|stats|create|update> …` : NocoDB, simulation par défaut, table `Config` interdite, statut `validé` réservé à l'humain.
- `npm run blog:lint -- content/blog/<slug>.md` : contrôle de charte du corps des articles.
- `npm run blog:publish -- content/blog/<slug>.md [--apply]` : dépôt en brouillon Firestore ; Max publie dans l'admin.

## Entretien

- Ordre d'autorité : code et tests > catalogues i18n > PRD le plus récent > CDC > cette base > anciennes skills Paperclip et `skills/soc-*` (périmées depuis le CDC du 14/09/2026).
- Quand une offre, un prix, une règle de voix ou l'état d'un canal change : corriger le fichier concerné **et** `00-essentiel.md` dans le même commit.
- Les fichiers 01 à 05 et 09 ont été extraits le 29/10/2026 d'un dossier sourcé `fichier:ligne` : les numéros de ligne dériveront ; le chemin reste le bon point d'entrée.

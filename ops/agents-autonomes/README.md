# Agents BMad autonomes sur le VPS

Quatorze tâches tournent seules sur le VPS (`158.220.124.185`), à heure fixe, avec ton abonnement Claude Max. Les agents **rédigent, mesurent et proposent**. Ils ne publient rien, n'envoient rien à un client ou un prospect, et ne dépensent rien. Tu valides chaque post sur Telegram comme aujourd'hui, puis n8n publie (WF-SOCIAL-05).

## Le calendrier (heure de Dakar)

| Quand | Qui | Ce qui est produit | Ce que tu reçois sur Telegram |
|---|---|---|---|
| **Chaque jour 07:30** | 🖋️ Béatrice | Relit les cartes `prêt_à_valider` (prix, promesses, formations, sources, registre) | **Rien si tout va bien.** Une alerte par carte à problème, sinon |
| **Chaque jour 08:00** | 💌 Serge | Ne travaille que **5 jours avant une lettre** (`calendrier-lettres.txt` : 26/11, 17/12, 14/01, 11/02) : rédige la lettre et envoie l'**épreuve** (`mode: "test"`) | Les autres jours : rien. À J-5 : « épreuve envoyée » (le réel reste ton geste) |
| **Lundi 07:00** | 🔎 Thierry | Dossier de veille sourcé de la semaine W+2 + posts **Flash du lundi** et **Nouveau sur…** en `rédigé` | 3 lignes |
| **Lundi 09:00** | 🤗 Josiane | Synthèse anonymisée des questions posées à Rysmo + entrées de FAQ à ajouter | 4 lignes |
| **Lundi 10:00** | 🤝 Ibrahima | Demandes de la semaine classées chaud/tiède/froid, brouillon de réponse pour chacune, devis à relancer | 4 lignes, sans données personnelles |
| **Lundi 11:30** | 💡 Fatou | **8 à 12 idées de posts** pour la semaine W+2 (celle que le lot de mercredi écrira), sourcées (Rysmo, Search Console, veille, nos posts, demandes, actu, calendrier), notées et sans doublon, dans NocoDB `Idees_Posts` | une carte récapitulative puis **une carte par idée** : ✅ Retenir / ⏳ Plus tard / ❌ Non — le lot de mercredi part de ce que tu retiens |
| **Mardi 08:00** | 🚀 Omar | Indexation Google des articles récents + leurs posts de diffusion en `rédigé` | 3 lignes |
| **Mercredi 08:00** | 📣 Mariam + 🎨 Salimata | Le reste du lot W+2 (8-10 posts + 7 stories au total, Thierry compris), `Gabarit` et `Slides_JSON`, en `rédigé`, puis le rendu. Rien si la semaine est déjà couverte | 3 lignes, puis les cartes ✅/❌ au fil du rendu |
| **Jeudi 08:00** (semaines paires) | 🗞️ Aminata → Thierry → Rokia → Cheikh → Béatrice → Omar | L'article du jeudi suivant, `blog-lint` sans erreur, déposé en **brouillon** Firestore avec sa couverture | « brouillon id=… », puis (≤ 30 min) la carte « article à valider » : couverture, résumé, article complet en pièce jointe, ✅ Publier / ❌ Refuser |
| **Jeudi 08:00** | 🎓 Adjoa | 5 leçons vides des formations publiées, rédigées en brouillon dans `content/lecons/…` (57 leçons vides au 04/11) | 3 lignes |
| **Jeudi 10:00** | 🤝 Ibrahima | 10 commerces de Dakar ou d'Abidjan sans fiche Google (ou avec une fiche faible) + message « Fais le test Google Maps » ; la 1re semaine du mois, 3 à 5 pistes de partenariat | 4 lignes. Aucun contact n'est pris |
| **Vendredi 10:00** | 🎯 Koffi | Le post de la semaine à sponsoriser (budget FCFA, durée, ciblage) ; la 1re semaine du mois, le plan pub de l'offre du mois | 4 lignes. Rien n'est lancé |
| **Le 1er, 08:00** | 🧭 Awa | Revue du mois écoulé + plan du mois `_bmad-output/growth/plans/AAAA-MM.md` (lu ensuite par Thierry, Mariam, la rédaction, Serge, Koffi) | 6 lignes, dont « décisions pour Max » |
| **Le 2, 08:00** | 🧩 Rokia | Bilan Search Console du mois + 5 articles à optimiser | 4 lignes |
| **Le 3, 08:00** | ⚖️ Ndèye | Contrôle de conformité des posts, articles et lettre du mois | 4 lignes |
| **Le 4, 08:00** | 💹 Aboubacar | Ventes du mois face au plan, renouvellements du Club à J-30, alertes prix et taux `EUR_USD` | 5 lignes |
| **Le 25, 09:00** | 💡 Fatou | **4 à 6 axes** du mois suivant (fils rouges éducatifs, 3 idées d'exemple chacun) et les temps forts sourcés de Dakar, Abidjan, Cotonou, diaspora | une carte par axe : ✅ / ⏳ / ❌ — Awa en tire le plan du 1er |
| *(à la main)* | 📈 Yann | Bilan de la semaine (publié NocoDB vérifié chez Meta) : pas de minuterie, ton choix du 04/11 | — |

Un seul agent tourne à la fois. Si deux tâches tombent à la même heure (jeudi 08:00), la seconde attend son tour (90 minutes au plus). Une exécution manquée parce que le VPS était éteint **n'est pas rattrapée** : tu la lances à la main.

Les fichiers produits sont gardés d'un passage à l'autre (**état partagé**, `/home/maxmorrys/agents/etat/`) : le plan d'Awa, la veille de Thierry, les leçons d'Adjoa et les lettres de Serge sont relus par les tâches suivantes. Ils sont aussi archivés à chaque passage (`/home/maxmorrys/agents/sorties/`).

## Décisions par boutons (04/11/2026)

Quand une mission a besoin d'un **choix** de ta part, elle ne te le demande plus en prose : elle t'envoie une carte Telegram avec les réponses en boutons, et relit ton clic **au passage suivant**. Rien ne part de ton clic tout seul.

| Qui | La question | Les boutons |
|---|---|---|
| 🎯 Koffi (vendredi) | « Booster ce post ? » | 5 000 F · 3 j / 10 000 F · 5 j / Non (budgets ajustés à sa proposition) — tu lances toi-même dans Meta |
| 🤝 Ibrahima (lundi) | « Que fait-on de cette demande ? » (3 demandes chaudes au plus, prénom + initiale) | Je réponds / Rappelle-moi demain / Ignorer |
| 🗞️ Aminata (article) | « Sujet du prochain article ? » | 3 sujets |
| 🧭 Awa (le 1er) | les arbitrages du plan du mois (3 au plus) | 2 à 4 options |
| 🎓 Adjoa (jeudi) | « Lot de leçons : valider ou retoucher ? » | Valider le lot / À retoucher / Plus tard |
| *(routeur)* après chaque ❌ sur un post, une story ou un article | « Pourquoi ? » | Trop business · Pas assez éducatif · Trop long · Visuel raté · Erreur de fait · Autre — Mariam et Aminata les relisent avant de produire |

Répondre en texte à une carte y ajoute un commentaire. Outil : `/opt/mm-agents/bin/mm-decision.mjs` (= `scripts/growth/decision.mjs`, table NocoDB `Decisions`) ; détails dans `docs/growth-kb/06-outillage-n8n.md` § Décisions par boutons. Les cartes sans réponse ne bloquent rien ; `node scripts/growth/decision.mjs expirer` les range.

## Garde-fous

- Jamais `validé`, `en_publication` ni `publié`. Aucune publication, aucun envoi réel, aucun message à un prospect, aucune campagne publicitaire, aucune dépense, aucun prix modifié. C'est écrit dans chaque mission, et les outils permis l'imposent.
- **Liste fermée d'outils** par tâche (`--permission-mode dontAsk`). Lecture du dépôt. Écriture dans `_bmad-output/growth/` (plus `content/blog/` pour l'article, `content/lecons/` pour Adjoa et `_bmad-output/commercial/` pour Ibrahima). `nocodb.mjs` permet la lecture et le `create`, jamais l'`update`. `blog-publish.mjs` est réservé à l'article et ne fait que des brouillons (`--update` est interdit). Pas de `git`, `curl`, `rm`, `sudo` ni `node -e`. Les réglages locaux suivis du dépôt (`.claude/settings.local.json`) sont ignorés (`--setting-sources project`).
- **Secrets hors de portée de l'agent.** Telegram, Meta et le jeton du webhook restent dans `Config`. Ils sont lus par les outils de `/opt/mm-agents/bin/` (propriété de root, l'agent ne peut pas les modifier) et n'apparaissent ni dans les journaux ni dans les arguments de commande. L'agent ne peut lire ni `/etc`, ni `~/.claude`, ni `~/.ssh`.
- **Firestore en lecture seule, collection par collection.** `mm-firestore.mjs` n'ouvre à chaque tâche que ses collections : `blog` pour la rédaction, `formations` pour Adjoa, les conversations Rysmo **anonymisées** pour Josiane, les demandes et devis pour Ibrahima, et les ventes **sans donnée personnelle** pour Aboubacar.
- **Données personnelles.** Les demandes et la prospection vont dans `_bmad-output/commercial/`, que git ignore. Ces fichiers restent sur le VPS, sans jamais entrer dans le dépôt ni passer par Telegram.
- **Copie jetable** du dépôt (`/home/maxmorrys/agents/maxmorrys.me`), remise à `origin/<branche>` avant chaque passage. La clé GitHub est en lecture seule : rien ne peut être poussé.
- 45 minutes au plus par passage, nombre de tours plafonné.

## Installer : 3 commandes (+ les secrets facultatifs)

**1. Sur ton Mac, depuis le dépôt — envoyer le dossier**
```bash
scp -i ~/.ssh/maxmorrys_vps -r ops/agents-autonomes root@158.220.124.185:/root/
```

**2. Sur le VPS — installer**
```bash
ssh -i ~/.ssh/maxmorrys_vps root@158.220.124.185 'bash /root/agents-autonomes/install.sh'
```
Le script crée la clé de lecture, **affiche la commande de l'étape 3**, puis attend (15 min au plus) que GitHub l'accepte. Ensuite il clone la copie, range les secrets, écrit `/etc/mm-agents/env`, installe les unités, active les 15 minuteries et fait un essai à blanc de chaque tâche. Branche suivie par défaut : `refonte/sous-domaines` (`main` ne contient pas encore les skills `mm-agent-*` ni `scripts/growth/`). Pour en changer : `bash install.sh --branch main`.

**3. Sur ton Mac, dans un autre terminal pendant que l'étape 2 attend — autoriser la clé**
```bash
ssh -i ~/.ssh/maxmorrys_vps root@158.220.124.185 cat /home/maxmorrys/.ssh/mm_agents_deploy.pub > /tmp/vps-agents-bmad.pub && gh repo deploy-key add /tmp/vps-agents-bmad.pub --repo Rysmo77/maxmorrys --title vps-agents-bmad
```
Clé en lecture seule (pas de `--allow-write`). Si l'étape 2 a abandonné entre-temps, relance-la : le script est idempotent.

### Secrets — ce que `install.sh` range dans `/etc/mm-agents/` (propriétaire `maxmorrys`, mode 600)

| Fichier | Sert à | D'où il vient | Que faire |
|---|---|---|---|
| `gsc-sa.json` | Search Console (Omar, Rokia) | `/opt/maxmorrys-stack/gsc-sa.json`, déjà sur le VPS | rien : copié automatiquement. ⚠️ L'inspection d'URL exige que ce compte soit **utilisateur complet** de la propriété `sc-domain:maxmorrys.me` (à vérifier dans Search Console › Paramètres › Utilisateurs) |
| `firebase-sa.json` | Firestore en lecture (rédaction, Omar, Rokia, Ndèye, Adjoa, Josiane, Ibrahima, Aboubacar) et dépôt du brouillon d'article | **ton Mac** : `max-morrys-28f5d199939f.json` à la racine du dépôt | avant l'étape 2 : `ssh -i ~/.ssh/maxmorrys_vps root@158.220.124.185 mkdir -p /root/agents-autonomes/secrets && scp -i ~/.ssh/maxmorrys_vps max-morrys-28f5d199939f.json root@158.220.124.185:/root/agents-autonomes/secrets/firebase-sa.json` (le dossier `secrets/` est ignoré par git ; `install.sh` efface la source après copie) |
| `marketing.key` | épreuve de la lettre (Serge), en-tête `X-Marketing-Key` | **n'existe pas encore** : la route `/marketing/campagne` attend `MARKETING_API_KEY` dans le Worker, ainsi que `MARKETING_TEST_TO` | `openssl rand -hex 32 > /tmp/marketing.key` ; `cd worker/apps/api && npx wrangler secret put MARKETING_API_KEY < /tmp/marketing.key` ; `npx wrangler secret put MARKETING_TEST_TO` (ton adresse) ; puis `ssh -i ~/.ssh/maxmorrys_vps root@158.220.124.185 mkdir -p /root/agents-autonomes/secrets && scp -i ~/.ssh/maxmorrys_vps /tmp/marketing.key root@158.220.124.185:/root/agents-autonomes/secrets/marketing.key && rm /tmp/marketing.key` et relance l'étape 2 |

Sans un de ces fichiers, rien ne casse. L'outil concerné répond « secret absent » (code 3), la mission fait ce qu'elle peut et te le dit dans son message. Par exemple, l'article est écrit mais pas déposé, ou la lettre est prête mais l'épreuve n'est pas partie. Le contexte de chaque passage indique les secrets présents. Le jeton Claude (`/etc/paperclip/maxmorrys.env`), NocoDB et render-card sont déjà sur le VPS.

## Au quotidien

```bash
# (sur le VPS, en root)
systemctl start mm-agent@lot-social.service            # lancer une tâche à la main
systemctl start mm-agent@article-force.service         # article ou lettre hors de leur calendrier
systemctl list-timers 'mm-agent-*'                     # prochains passages
sudo -u maxmorrys bash -c 'set -a; . /etc/mm-agents/env; set +a; /opt/mm-agents/bin/run-agent.sh veille --dry-run'   # essai à blanc
```

**Couper**, au choix (le passage prévu est sauté et Telegram te le dit en une ligne, sauf la relecture quotidienne) :
- sur le VPS : `touch /opt/mm-agents/PAUSE` (reprendre : `rm /opt/mm-agents/PAUSE`) ;
- sans terminal, dans NocoDB : table `Config`, ajoute `Cle = AGENTS_ENABLED`, `Valeur = false` (reprendre : `true`, ou supprimer la ligne).

Couper une seule tâche : `systemctl disable --now mm-agent-<tâche>.timer`.

**Lire les journaux**
```bash
journalctl -u 'mm-agent@*' --since today
ls -t /var/log/mm-agents/ | head          # par passage : un .log (déroulé) et un .json (sortie brute de claude)
ls /home/maxmorrys/agents/sorties/         # fichiers produits, archivés à chaque passage
```
**Récupérer les productions sur le Mac** (pour les relire ou les commiter, sauf `_bmad-output/commercial/`, qui contient des données personnelles) :
```bash
scp -i ~/.ssh/maxmorrys_vps -r root@158.220.124.185:/home/maxmorrys/agents/etat/ ./etat-vps/
```
Les sessions restent consultables : `sudo -u maxmorrys claude --resume`, depuis `/home/maxmorrys/agents/maxmorrys.me`.

**Désinstaller** : `bash /root/agents-autonomes/uninstall.sh`. Avec `--purge`, il retire aussi la copie, l'état, la clé et les journaux, et rappelle comment retirer la clé côté GitHub.

## Coût

Aucun crédit d'API : les agents utilisent ton **abonnement Claude Max**, par le jeton `CLAUDE_CODE_OAUTH_TOKEN` déjà posé pour Paperclip. Ce quota est **partagé avec tes sessions Claude Code**. En ordre de grandeur, une semaine compte 7 relectures courtes et 8 à 9 passages de 15 à 45 minutes ; s'y ajoutent 4 passages mensuels. Les lundis et les jeudis sont les journées chargées. Si tu travailles beaucoup à ces heures-là, déplace une minuterie : modifie `OnCalendar=` dans `systemd/mm-agent-<tâche>.timer`, puis relance `install.sh`. Seul coût hors abonnement : la photo de couverture de l'article (Workers AI, une génération par article).

## Modifier

- **Une mission** (`missions/<tâche>.md`) ou **le calendrier des lettres** : pousse la modification sur la branche suivie, le passage suivant la lit dans la copie remise à jour. Tant que rien n'est poussé, c'est la copie installée dans `/opt/mm-agents/` qui sert.
- **Le lanceur, les outils, les minuteries** (`run-agent.sh`, `lib.sh`, `outils/`, `systemd/`) : relance `install.sh`. C'est voulu : un passage ne peut pas modifier ses propres garde-fous.
- **Une nouvelle tâche** : un fichier `missions/<tâche>.md`, une ligne dans la table des tâches de `run-agent.sh` (agent, tours, écriture, outils) et une minuterie `systemd/mm-agent-<tâche>.timer`.

## Fichiers

| Fichier | Rôle |
|---|---|
| `run-agent.sh` | le lanceur : porte de calendrier, interrupteur, verrou, copie à jour et état restauré, mission, `claude -p` borné, archive, Telegram |
| `lib.sh` | lecture de `Config` et envoi Telegram, sans exposer les jetons |
| `missions/*.md` | les 17 consignes (16 programmées + `bilan`) |
| `calendrier-lettres.txt` | dates d'envoi des lettres : Serge travaille à J-5 |
| `outils/mm-rendu` | déclenche WF-SOCIAL-04 (`mm-run-visuel`) |
| `outils/qa-lot.mjs` | contrôle mécanique d'un lot (longueurs, emojis, hashtags, statuts, gabarits, cadence) ; marche aussi sur le Mac |
| `outils/mm-firestore.mjs` | Firestore en lecture, collections permises par tâche, anonymisation |
| `outils/mm-gsc.mjs` | Search Console : inspection d'URL, pages, requêtes |
| `outils/mm-meta-verif.mjs` | Meta en lecture : ce que NocoDB dit publié est-il en ligne, avec quelles mesures |
| `outils/mm-lettre-epreuve.mjs` | épreuve de la lettre ; refuse le mode `reel` |
| `outils/mm-idees.mjs` | idées de posts de Fatou : `sync` (clics de Max → `Statut`), `lier`, `retenues`, `utiliser <Id> --post <PostId>` ; seul chemin qui change le statut d'une idée |
| `outils/mm-decision.mjs` | cartes de décision par boutons (lien vers `scripts/growth/decision.mjs`) : `ask`, `liste`, `lire` ; le jeton Telegram reste dans `Config` |
| `systemd/` | `mm-agent@.service` + 17 minuteries |
| `install.sh`, `uninstall.sh` | installation et retrait |

`scripts/growth/nayo.mjs` sait aussi rendre en local sur le VPS (`NAYO_RENDER_LOCAL=1`, posé dans `/etc/mm-agents/env`), ce dont l'article a besoin pour sa couverture. Sur le Mac, rien ne change : il passe toujours par SSH.

## Pas automatisés (choix du 04/11/2026)

Yann (bilan hebdomadaire : sa mission reste disponible à la main) et Landry (application mobile). Koffi, Ibrahima et Aboubacar ne tournent que dans les tâches ci-dessus.

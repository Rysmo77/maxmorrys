# Mission autonome — bilan social de la semaine (Yann 📈)

Tâche **manuelle** (aucune minuterie : choix de Max du 04/11/2026 — `systemctl start mm-agent@bilan.service`). Tu fais le bilan de la semaine en cours (« SEMAINE DU BILAN » du contexte ci-dessus, arrêtée à l'heure d'exécution) et tu regardes la file des deux semaines à venir. Tu es **Yann**, analytics & insights : tu mesures, tu ne corriges pas.

## ⛔ Garde-fous (non négociables)

1. **Lecture seule** sur NocoDB : aucun `create`, aucun `update`, aucun changement de statut — même pour corriger un `publié` faux. Tu le signales, Max décide.
2. Jamais `validé` ni `publié` ; **aucune publication**, aucun e-mail, aucun message WhatsApp, **aucune dépense**.
3. Tu ne lis jamais la table `Config` ni un fichier de secrets ; tu n'affiches aucun jeton. L'accès Meta passe **uniquement** par `/opt/mm-agents/bin/mm-meta-verif.mjs` (lecture Graph API, jeton gardé dans l'outil).
4. Pas de `git`, rien d'écrit hors de `_bmad-output/growth/bilans/`.
5. Petits effectifs : ne conclus pas sur 3 posts ; donne un niveau de confiance. Ce qui n'est pas mesuré est dit « non mesuré », jamais estimé.

## Matière (lecture)

- `.claude/skills/mm-agent-yann/references/verification-publie.md`, `analyse-contenus.md`, `tableau-kpi.md`
- `docs/growth-kb/06-outillage-n8n.md` (circuit d'un post, ⚠️ « `publié` ne prouve pas la mise en ligne »), `12-rubriques-editoriales.md` (cadence : 8 à 10 posts + 3 stories au plus par semaine, sans Reel)
- Les KPI du plan : `_bmad-output/growth/2026-10-29-plan-editorial-nov-jan.md` § 1 (tableau « KPI simples »)
- Le bilan précédent s'il existe : `_bmad-output/growth/bilans/` (pour la tendance)

## Démarche

1. **Ce qui devait sortir cette semaine** :
   `node scripts/growth/nocodb.mjs list contenus --fields Id,Titre,Status,Reseau,Format_Post,Serie,Offre,Cible,Date_Publication_Prevue,Blotato_PostSubmissionID,Blotato_PublicUrl,Erreurs --limit 1000`
   puis garde les lignes datées de la semaine du bilan.
2. **Vérification chez Meta** : `node /opt/mm-agents/bin/mm-meta-verif.mjs --depuis <lundi> --jusqu <aujourd'hui>`.
   Classe chaque post `publié` : en ligne · introuvable · sans id · non vérifiable (story expirée, réseau hors Meta). Reporte réactions, commentaires, partages, enregistrements et portée **seulement si l'API les donne**. Liste aussi `hors_nocodb` (posts vus chez Meta que NocoDB ne connaît pas — un identifiant FB peut avoir la forme `page_post` : rapproche par date avant de conclure).
3. **Échecs** : lignes `échec` de la semaine avec leur motif (`Erreurs`), et lignes `validé` dont la date est passée sans publication.
4. **Cartes en attente** : `prêt_à_valider` (combien, dont combien à date dépassée), `image_needed`, `rédigé` sans visuel depuis plus de 24 h.
5. **File des 2 semaines à venir**, semaine par semaine : posts et stories par statut (`validé`, `prêt_à_valider`, `rédigé`, `image_needed`), comparés à la cadence 8-10 + 7. Signale tout jour sans story et toute semaine sous 8 posts `validé` ou en voie de l'être.
6. **Lecture** (3 constats au plus, avec niveau de confiance) : séries / formats / créneaux qui ressortent, ce qui ne peut pas encore se conclure.

## Livrable

Écris `_bmad-output/growth/bilans/AAAA-MM-JJ-bilan.md` (chemin exact dans le contexte) :
1. **En bref** (5 lignes) ; 2. **Publié : NocoDB vs Meta** (tableau Id · réseau · format · date · verdict · permalien · mesures) ; 3. **Échecs** ; 4. **En attente de Max** ; 5. **File à venir** (tableau par semaine × statut) ; 6. **Constats** ; 7. **Méthode et trous de mesure** (ce que l'API n'a pas donné, et pourquoi).

## Message final (= ton dernier message, envoyé tel quel sur Telegram à Max)

Au plus **8 lignes**, sans markdown, chiffres d'abord :
- `Bilan Sxx : N/M posts réellement en ligne chez Meta (NocoDB en dit P publiés)` ;
- meilleur post de la semaine si une mesure existe (1 ligne), sinon « mesures indisponibles » ;
- échecs (nombre + cause principale) ;
- en attente de Max : X cartes à valider (dont Y en retard) ;
- file : semaine 1 = a posts / b stories prêts, semaine 2 = c / d → « OK » ou « à compléter » ;
- dernière ligne : `Rapport : _bmad-output/growth/bilans/AAAA-MM-JJ-bilan.md`.

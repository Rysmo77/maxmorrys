# 🧭 Audit de la machine marketing — Awa — 29/10/2026 (soir)

> ⚠️ **Dépassé sur l'e-mail (29/10/2026, plus tard)** : Max a retenu l'« option 2 » —
> transactionnel par Cloudflare, **marketing par Brevo**. Ne PAS supprimer `BREVO_API_KEY`
> (recommandation du §« actions » ci-dessous, désormais fausse) ; la question écrite à
> Cloudflare devient sans objet. Référence à jour : `../08-emailing.md` (ex-`08-emailing-cloudflare.md`).

Demandé par Max le 29/10/2026 : « lancer son audit de la machine ». Capacité AM, **lecture seule** : GET sur l'API n8n, lectures NocoDB (`scripts/growth/nocodb.mjs`, table `Config` non lue : l'outil l'interdit aux agents et je m'y suis tenue), `docker ps`, `systemctl`, `paperclipai agent list` (lecture), `wrangler deployments list` / `secret list` (noms seulement), `curl` sur la production. Aucune mutation. Relevés faits entre 16:15 et 16:40 UTC.

Étiquettes : **[vérifié]** = relevé ce soir de mes mains · **[audit du matin]** = sourcé dans `2026-10-29-n8n-marketing.md`, pas revérifié (exigerait de lire les secrets de `Config`) · **[hypothèse]**.

---

## La décision

**On publie d'abord sur Facebook et Instagram, et rien d'autre, le dimanche 2 novembre à 12:00 UTC (post Id 143). La lettre, elle, ne part pas avant le 13 novembre, et pas sans une réponse écrite de Cloudflare.**

Trois raisons :

1. **La machine est réparée, mais rien ne sort tant que Meta ne publie pas.** n8n, NocoDB, le rendu des visuels et la boucle Telegram sont sains [vérifié]. Le seul verrou du premier post, c'est le jeton Meta. Et ce jeton, il n'y a que toi qui peux le générer (15 minutes, guide prêt).
2. **Ton attention reste le goulot.** 28 cartes Telegram vont arriver d'ici demain midi, alors que la boucle Telegram n'a enregistré aucun clic en 14 jours. Je ne te demande pas 28 clics : je te demande **une séance de validation en lot** avec Mariam, après la pose du jeton.
3. **La lettre a trois trous, et chacun suffit à la bloquer.** La route d'envoi n'est pas déployée (HTTP 404 en production). L'usage marketing est contraire à la politique de Cloudflare. Et le dernier article du blog date du 4 juin. Envoyer une première lettre qui pointe vers un article vieux de cinq mois serait un mauvais premier contact.

Je coupe **X, LinkedIn, TikTok, YouTube et WhatsApp** pour ce cycle. Aucun ne compte un seul contenu dans la file, et deux n'ont même pas de jeton. On les rouvrira quand FB et IG auront tenu trois semaines de publication réelle.

---

## 1. La photo, en trois colonnes

| ✅ Ce qui tourne | ⏸ Prêt mais bloqué | ❌ Ce qui manque |
|---|---|---|
| **n8n 2.28.6 épinglé**, conteneur redémarré à 16:12 UTC, **14 workflows actifs**, la liste attendue [vérifié] | **Lot S45-S46** : 28 posts `rédigé` (FB et IG, publications prévues du 02/11 au 15/11), données complètes (`Texte`, `Slides_JSON`, `Visual_Strategy`) [vérifié]. Le rendu commence à 18:00 UTC | **Jeton Meta d'utilisateur système** : l'accès aux données du jeton actuel a expiré le 26/09 [audit du matin]. Aucune publication FB/IG n'est possible sans lui |
| **WF-SOCIAL-04** : `executeOnce` sur les lectures, `limit` à 6. Le passage de 16:00 a lu 0 ligne, et c'est normal : le lot a été créé à 16:03:47 [vérifié] | **WF-SOCIAL-05** : publie seulement si la plateforme renvoie un id réel. Il tourne toutes les 15 min, à vide puisque la file `validé` est vide [vérifié]. Jamais testé en réel | **Surveillance des `échec` et des `image_needed`** : ni WF-SOCIAL-05 ni WF-HEALTH n'alertent sur ces statuts (voir §3) |
| **render-card** (systemd sur le VPS) : `/health` répond 200 [vérifié] | **WF-SOCIAL-07** (cartes Telegram) : `executeOnce` posé sur « Lire à valider », donc le doublon est corrigé dans la structure [vérifié]. La preuve en conditions réelles tombera à 18:10 UTC | **Un article de blog récent** : les 46 articles du flux `rss.xml` datent tous d'avant le 04/06 [vérifié]. WF-09 bâtirait la lettre sur un article de juin |
| **WF-HEALTH** actif, cron à 9 h (heure de Dakar). Testé 3 fois par la CLI, sans aucun passage planifié pour l'instant : le premier aura lieu le 30/10 [vérifié] | **Lettre** : WF-09 produit un aperçu Telegram correct (exécution 20682 en succès) [vérifié]. Ensuite, rien : la route `POST /marketing/campagne` **n'est pas en production** (404 avec et sans clé) [vérifié] | **Réponse écrite de Cloudflare** sur l'envoi d'une lettre à faible volume avec consentement explicite (`08-emailing-cloudflare.md` §0) |
| **WF-07** (veille) : le nouveau circuit passe (exécution 20680, un seul appel Gemini, 5 idées). Prochain passage le lundi 02/11 à 5 h [vérifié] | **Retrait de Brevo** : il n'existe que dans l'arbre de travail, non commité. Le Worker en service (version `4094a6eb`, déployée le 29/10 à 14:59) contient encore le code Brevo, et le secret `BREVO_API_KEY` est posé [vérifié] | **Secrets `MARKETING_API_KEY` et `MARKETING_TEST_TO`** : absents de la liste des secrets du Worker [vérifié] |
| **WF-ERR** : chaque exception part bien sur Telegram (encore ce matin à 08:00, WF-09 en 503) [vérifié] | **Paperclip** : les 7 agents sont `paused`, le dernier réveil date d'aujourd'hui 09:30 (Designer). Budget du mois : 0 $ dépensé sur 50 $ [vérifié] | **Comptage de l'audience de la lettre** : inconnu. Il faut le `audiencePrevue` du mode test, qui n'est pas déployé |
| **Sauvegardes** : dump à 03:30 vers R2, dernier OK le 29/10 [vérifié]. **gsc-pull** : premier passage planifié le 30/10 à 07:15 (Dakar) [vérifié] | **Clé Gemini gratuite** : elle ne bloque plus le social (les agents rédigent, render-card dessine). Elle ne touche plus que WF-07 et WF-09 | **`N8N_ENCRYPTION_KEY` hors du VPS** : toujours dans le seul `/opt/maxmorrys-stack/.env`, non sauvegardé hors site [vérifié : `.env` n'a pas bougé depuis le 06/08] |

### Les « verts à vide » encore en place

| Workflow | Fait | Surveillé ? | Verdict |
|---|---|---|---|
| WF-SOCIAL-03 | lit `planifié` (0 ligne) 7 fois par jour, toujours en succès [vérifié : passages de 07:00 à 15:00 aujourd'hui] | non | **à couper** : la rédaction est passée aux agents, et ce workflow n'a plus d'entrée |
| WF-SOCIAL-05, garde `PUBLISH_ENABLED` | si la valeur n'est pas `true`, le workflow laisse le post en `validé` **sans rien dire** | oui, indirectement : la règle des 72 h de WF-HEALTH | acceptable |
| WF-SOCIAL-05, échec rattrapé | un refus de Meta passe la ligne en `échec`, sans exception, donc **sans WF-ERR ni Telegram** | **non** | **P0** : c'est exactement ce qui se passera le 02/11 si le jeton n'est pas posé |
| WF-SOCIAL-04, rendu raté | la ligne passe en `image_needed` | **non** : WF-HEALTH ne lit que `publié`, `validé` et `prêt_à_valider` | **P0** pour ce soir : un post bloqué ne se verrait pas |
| WF-SOCIAL-03/04/05/07 à vide | succès sans ligne traitée | oui : WF-HEALTH (file affamée) | réglé |

### Points de vigilance du soir (pas des défauts)

- **Les 29 anciens `prêt_à_valider` ont été passés en `rejeté` aujourd'hui à 16:03** [vérifié : 54 `rejeté`, 0 `prêt_à_valider`]. La règle (c) de WF-HEALTH ne sonnera donc plus. En revanche, les règles (a) « rien de publié depuis 72 h » et (b) « moins de 7 jours de `validé` » sonneront **chaque matin jusqu'au premier post**. C'est attendu ; ne t'y habitue pas.
- **Calendrier de rendu** : 6 posts par passage à 18:00 et 20:00 UTC aujourd'hui, puis à 08:00, 10:00 et 12:00 demain. Les 28 seront prêts le **30/10 vers 12:00 UTC** [hypothèse : aucun rendu raté].
- **Fenêtre de publication** : WF-SOCIAL-05 n'a pas de borne basse (`date − 15 min ≤ maintenant`). Un post validé après sa date part au passage suivant. Si tu valides en retard, on ne perd donc aucun post, mais il sort hors de son créneau.

---

## 2. L'état réel des canaux

| Canal | État ce soir | Dernier post réel | Ce qui empêche |
|---|---|---|---|
| Instagram | ❌ | 10/08/2026 [audit du matin] | jeton : accès aux données expiré |
| Facebook | ❌ | 20/07/2026 [audit du matin] | idem |
| X | ⛔ coupé ce cycle | 09/07 [audit du matin] | décision : aucun contenu X dans la file |
| LinkedIn, TikTok, YouTube | ⛔ coupés | — | pas de jeton, YouTube pas implémenté |
| WhatsApp Business | ⛔ plus tard | jamais | arrivera avec le jeton système Meta (même guide) |
| E-mail transactionnel | ✅ binding Cloudflare | en service | ⚠️ voir le risque Brevo au §4 |
| E-mail marketing (lettre) | ❌ | jamais | route non déployée, secrets absents, politique Cloudflare |
| Telegram (validation) | ✅ technique / ❌ humain | — | 0 clic en 14 jours ; WF-TG-ROUTER n'a aucune exécution dans la fenêtre de rétention [vérifié] |

**Rappel** : un `publié` dans NocoDB ne vaut preuve qu'à partir des posts passés par le nouveau WF-SOCIAL-05, qui écrit l'id et le permalien. Les 79 `publié` historiques restent douteux.

---

## 3. Le chemin critique

### Vers le premier post publié (cible : Id 143, Facebook, 02/11 12:00 UTC)

1. **Ce soir, 18:00-18:10 UTC** : premier passage de rendu, puis premières cartes Telegram. *Contrôle* : 6 lignes en `prêt_à_valider` avec `Visuels_URLs` rempli, aucune en `image_needed`, et **une seule** carte par post sur Telegram. Si une carte arrive en double, la correction du doublon a échoué et on arrête la notification.
2. **Au plus tard le 31/10** : Max crée l'utilisateur système Meta et transmet le jeton (`guide-meta-utilisateur-systeme.md`, environ 15 min).
3. **Le 31/10** : pose du jeton dans `Config` (`META_TOKEN`), puis vérification en GET (`debug_token` : `is_valid`, aucune expiration d'accès). Session Claude Code, avec le feu vert de Max.
4. **Avant le 01/11** : WF-HEALTH, ou WF-SOCIAL-05 lui-même, alerte sur toute ligne en `échec` ou en `image_needed`.
5. **Le 01/11** : séance de validation en lot avec Mariam (30 min). Le passage en `validé` se fait par `--human-approved "Max, <date>, en session"`. On ne valide **pas** avant l'étape 3.
6. **Le 02/11 à 12:00 UTC** : WF-SOCIAL-05 publie l'Id 143. *Preuve exigée* : le permalien dans `Blotato_PublicUrl`, ouvert à la main sur la page Facebook. Le soir même, à 19:00, l'Id 156 teste Instagram.

Si l'étape 2 glisse, rien n'est perdu : on décale la validation, et les posts sortiront en rattrapage. Ce qu'il ne faut pas faire, c'est valider sans jeton : les lignes partiraient en `échec` sans bruit.

### Vers la première lettre (cible : 13/11 au plus tôt)

1. **Commit puis déploiement du Worker** : retrait de Brevo et route `/marketing/campagne`, avec pose des secrets `MARKETING_API_KEY` et `MARKETING_TEST_TO`, puis suppression de `BREVO_API_KEY`. Ensuite, test de fumée en mode test (`08-emailing-cloudflare.md` §5), qui donne enfin `audiencePrevue`.
2. **Demande écrite à Cloudflare** (support ou formulaire *Limits*) : lettre à faible volume, consentement explicite, désinscription en un clic. Serge rédige, Max envoie. Dans le même temps, on prépare `lettre.maxmorrys.me` pour isoler la réputation d'envoi.
3. **Un article neuf publié** : Aminata le pilote, Omar le met en ligne. Il devient l'article principal de WF-09.
4. **Revue de conformité** par Ndèye : consentement, retrait, mentions.
5. **Décision d'ouverture** le 13/11 :
   - si Cloudflare répond oui, ouverture à faible volume, 300 envois par jour au plus ;
   - si la réponse est non ou ne vient pas, branchement d'un relais tiers derrière `sendEmail` (point d'envoi unique). L'interrupteur reste fermé tant que ce n'est pas fait.

Je ne rouvre pas l'envoi marketing sur `mail.maxmorrys.me` sans cette réponse. Une suspension du compte couperait aussi les factures et les rappels du Club, et ce risque n'est pas négociable.

---

## 4. Risques résiduels

| Risque | Gravité | État vérifié |
|---|---|---|
| **Le Worker en production appelle encore Brevo** pour le certificat, l'accusé de demande et le cycle de vie (`HEAD` : `envoyerModele` de `brevo-send`), avec `BREVO_API_KEY` posé. Brevo n'a jamais été mis en service : ces courriers ne partent peut-être pas aujourd'hui | **haute** (client) | code `HEAD` et liste des secrets [vérifié] ; échec effectif [hypothèse, à contrôler dans les journaux du Worker] |
| Échecs de publication silencieux (`échec` et `image_needed` hors surveillance) | haute | §1 [vérifié] |
| `N8N_ENCRYPTION_KEY` présente seulement sur le VPS : si le VPS est perdu, les dumps R2 de n8n ne valent rien pour les credentials | haute | [vérifié] |
| Secrets en clair dans NocoDB `Config` (Meta, X, Telegram ; 40 clés) | moyenne | [audit du matin] ; à faire tourner après la pose du jeton système |
| `.env.local` : **deux** `N8N_API_KEY` (la ligne 20, `export`, est refusée) **et deux** `N8N_URL`, dont la ligne 19 vise `eyonemedical.app.n8n.cloud`, l'instance d'une autre société. Un script qui lit la première occurrence part au mauvais endroit | moyenne | [vérifié, noms seulement] |
| `backups/` n'est pas ignoré par git : `backups/n8n-corrections-20261029/` est non suivi, à un `git add .` d'un commit | moyenne | [vérifié]. Je tranche : **on l'ignore**. La copie versionnée, c'est `n8n/live/`, qui passe le scan de secrets |
| Clé Gemini gratuite (503 « high demand ») | basse pour le social, moyenne pour la veille et la lettre | WF-09 encore en erreur ce matin à 08:00 [vérifié] |
| Aucun test de restauration des dumps | moyenne | [vérifié : rien dans les journaux] |
| Alertes WF-HEALTH quotidiennes jusqu'au premier post, d'où une fatigue d'alerte | basse | prévisible |

---

## 5. Coûts

| Poste | Coût | Statut |
|---|---|---|
| n8n, NocoDB, render-card, Paperclip (VPS Contabo partagé avec Khanouss, Steps et Eyone : 47 Go de RAM, 10 Go utilisés, disque à 33 %) | quasi nul à la marge | [vérifié pour la charge] ; prix du VPS non relevé |
| Paperclip « Maxmorrys Growth » | **0 $ dépensé ce mois-ci** sur un budget de 50 $. Le quota Claude Max ne se consomme plus depuis la pause d'aujourd'hui | [vérifié] |
| Cloudflare Workers Paid | abonnement actif ; 3 000 e-mails inclus par mois, puis 0,35 $ les 1 000 | [`08-emailing-cloudflare.md`] |
| Gemini | gratuit, donc instable. Passer au palier payant ne vaut que pour WF-07 et WF-09 | décision P2 |
| Meta, Telegram, GSC | gratuits | — |

Rien à couper côté facture. Le vrai coût, c'est **ton temps de validation**, et le plan ci-dessous le plafonne à une séance par quinzaine.

---

## 6. Le plan

| Pri. | Action | Propriétaire | Échéance |
|---|---|---|---|
| **P0** | Contrôler le premier rendu (18:00 UTC) et les premières cartes Telegram (18:10) : 6 `prêt_à_valider`, `Visuels_URLs` rempli, 0 `image_needed`, aucune carte en double. Contrôler les 28 rendus le lendemain midi | `mm-agent-mariam` (triage de la file) | 29/10 18:30 UTC, puis 30/10 13:00 UTC |
| **P0** | Créer l'utilisateur système Meta et transmettre le jeton | **Max** | 31/10 |
| **P0** | Poser le jeton dans `Config`, vérifier `debug_token` en GET, faire tourner l'ancien jeton | Max (session Claude Code, avec son feu vert) | 31/10 |
| **P0** | Alerte sur `échec` et `image_needed` : nœud Telegram dans WF-SOCIAL-05 sur `échec`, et ajout des deux statuts à WF-HEALTH | Max (session n8n, avec son feu vert) | 01/11 |
| **P0** | Séance de validation en lot S45-S46 (30 min), puis passage en `validé` avec `--human-approved` | **Max** + `mm-agent-mariam` | 01/11 |
| **P0** | Contrôle du premier post (Id 143, puis Id 156 sur IG) : permalien ouvert sur la plateforme | `mm-agent-yann` | 02/11 au soir |
| **P0** | Contrôler dans les journaux du Worker si le certificat et l'accusé de demande échouent par Brevo. Dans tous les cas, commiter et déployer le retrait de Brevo | Max (déploiement) | 01/11 |
| **P1** | Poser les secrets `MARKETING_API_KEY` et `MARKETING_TEST_TO`, faire le test de fumée en mode test, relever `audiencePrevue`, supprimer `BREVO_API_KEY` | Max, puis `mm-agent-serge` pour la lecture de l'audience | 05/11 |
| **P1** | Demande écrite à Cloudflare + préparation de `lettre.maxmorrys.me` | `mm-agent-serge` (rédige), Max (envoie) | rédaction 31/10, envoi 03/11 |
| **P1** | Publier un article neuf, qui servira de tête de la première lettre | `mm-agent-aminata` → `mm-agent-omar` | 10/11 |
| **P1** | Revue de conformité de la lettre (consentement, retrait, mentions) | `mm-agent-ndeye` | 12/11 |
| **P1** | Décision d'ouverture de la lettre (Cloudflare ou relais tiers) | Awa recommande, **Max** décide | 13/11 |
| **P1** | Copier `N8N_ENCRYPTION_KEY` dans le gestionnaire de mots de passe | **Max** | 03/11 |
| **P1** | Lot S47-S48 écrit en `rédigé` avant que la file `validé` passe sous 7 jours | `mm-agent-mariam` | 09/11 |
| **P1** | Désactiver WF-SOCIAL-03 (vert à vide, plus aucune entrée) | Max (feu vert n8n) | 05/11 |
| **P2** | Nettoyer `.env.local` : supprimer les lignes 19-20 (`N8N_URL` Eyone Cloud et ancienne `N8N_API_KEY`) | **Max** | 05/11 |
| **P2** | Ajouter `backups/` à `.gitignore` | Max (session Claude Code) | 05/11 |
| **P2** | Sortir les secrets de `Config` vers les credentials n8n, puis faire tourner X et Telegram | Max (session n8n) | 15/11 |
| **P2** | Test de restauration d'un dump R2 (n8n et NocoDB) sur une base jetable | Max (session VPS) | 20/11 |
| **P2** | Clé Gemini payante (MAX-14), seulement si WF-07 et WF-09 restent utiles après la première lettre | Awa recommande, Max décide | 20/11 |
| **P2** | WF-HEALTH : une seule alerte « rien publié » par 72 h, au lieu d'une chaque jour | Max (session n8n) | 15/11 |
| **P2** | Renommer WF-SOCIAL-04 (le nom parle encore de « Gemini 2.5 Flash Image ») | Max (session n8n) | 15/11 |
| **P2** | Réouverture de X, LinkedIn et WhatsApp, sur preuve de 3 semaines de publication FB/IG | Awa | revue du 23/11 |

**Indicateur de sortie de cet audit** : un post Facebook et un post Instagram visibles en ligne le 02/11, avec leurs permaliens dans NocoDB. Sans ces deux preuves, je ne lance aucun autre chantier marketing.

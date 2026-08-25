# Workflows n8n — stratégie de contenu 2026 S2

Ces quatre exports appliquent `docs/STRATEGIE_COMMUNICATION_2026.md` au moteur de contenu.
Ils sont **générés**, pas écrits à la main :

```bash
python3 scripts/n8n-patch-strategy-2026.py
```

Le script lit la base **live** (`n8n/live/`, figée par `python3 scripts/n8n-snapshot-live.py`
depuis l'API n8n), remplace le code ou le prompt des nœuds concernés, **ajoute les 28 nœuds des menus de choix**, recâble le routeur, purge
les métadonnées serveur, et écrit le résultat ici. Les credentials sont recopiés depuis les nœuds
existants du même type — un nœud fabriqué sans credentials s'importe sans bruit et échoue à la
première exécution.

Pour modifier la stratégie, on édite le script — jamais ces JSON.

La logique des menus (toggle, quotas, rendu du clavier) vit dans **`lib/picker.js`**, inlinée dans
les nœuds Code au moment de la génération et couverte par `tests/unit/telegram-picker.test.ts` —
un seul et même fichier, pour qu'il ne puisse pas diverger.
`tests/unit/n8n-workflows.test.ts` contrôle les fichiers générés (syntaxe de chaque nœud Code,
intégrité du graphe, clés de Config, grille conforme au calendrier).

---

## Ce qui change

| Workflow | Nœud | Changement |
|---|---|---|
| **WF-THEMES** | `THEMES — Build prompt` | Le prompt du vendredi injecte le **fil rouge du mois**, décrit les **deux pistes** (apprenants / commerçants) et exige au moins un thème RADAR **daté**. La liste d'exemples de tendances codée en dur disparaît. Fuseau passé de `Africa/Lagos` à `Africa/Dakar`. |
| **WF-TG-ROUTER** | `TH — Décliner (build)` | Nouvelle `GRID` : **21 créneaux** (14 posts + 7 stories quotidiennes à 12h) au lieu de 14. **Zéro vidéo, zéro TikTok.** 6 carrousels. Chaque créneau porte sa **série** et sa **cible**. Fuseau `Africa/Dakar`. |
| **WF-TG-ROUTER** | `TH — Parse posts` | Écrit les trois nouveaux champs `Serie`, `Offre`, `Cible` et les valide contre leurs listes. L'offre est **déterministe** là où la stratégie l'impose (mercredi Facebook = toujours `Agence`, rappel du samedi = alternance plateforme / agence). |
| **WF-SOCIAL-03** | `Gemini Pro — Rédiger textes` | TikTok retiré. Ajout des règles **carrousel**, **story** et **post document LinkedIn**, du bloc **piste B** avec sa table de traduction et son ordre de démonstration, et de l'interdiction d'inventer un montant. |
| **WF-SOCIAL-04** | `Build — URL publique` | Nouveau choix de gabarit : `story` → **`ask`**, `carrousel` → **`slide`**, le reste → **`poster`** (le style retenu par le board). Carte d'accent alignée sur le skill. **Le fond image n'est plus demandé** pour ces trois gabarits. Depuis le 2026-08-20, la charge porte aussi **`body`, `cta` et `options`** : la créa dit enfin ce que dit la légende. |
| **WF-SOCIAL-03** | `Gemini Pro — Rédiger textes` | **`=` en tête du prompt** (correctif 2026-08-20) et sortie étendue à **`Slides`** : le rédacteur écrit aussi le texte imprimé sur la créa. |
| **WF-SOCIAL-04** | `Parse — Cartes` | Remplace `Parse — Stratégie visuelle` : découpe `Slides_JSON` en une créa par slide, sans appeler de modèle. |
| **WF-SOCIAL-04** | *4 nœuds retirés* | `Gemini Pro — Stratégie V3` et la branche image (`HTTP — Gemini 3.1 Flash Image`, `Decode`, `R2 — Upload image`), orpheline depuis le 2026-07-09. |
| **WF-SOCIAL-04** | `Collect — URLs par contenu` | Un post à qui il manque une créa part en **`image_needed`**, plus en validation : Instagram refuse un post sans média. |
| **WF-TG-ROUTER** | `Parse — Update` | Décode les nouveaux callbacks `pick:tool:i` / `done:tool:0` / `pick:trend:i` / `done:trend:0`, et fait voyager l'état des deux menus avec chaque clic. |
| **WF-TG-ROUTER** | `Airtable — Lire Config (NocoDB)` | **Correctif** : le `options.where` ne lisait que 6 clés — `THEMES_CURRENT` en était absente, donc le thème cliqué n'atteignait jamais l'expansion. La migration NocoDB a repris le filtre verbatim, le bug a survécu. Passe à 12 clés. |
| **WF-TG-ROUTER** | `TH — Créer posts` | Les 5 nouveaux champs ajoutés au mapper explicite. NocoDB n'a pas de `typecast` : un champ absent du mapper n'est pas écrit, en silence. |
| **WF-TG-ROUTER** | *28 nœuds ajoutés* | Les deux menus de choix : `PK — Outils récents (NocoDB)` → `PK — Outils (build)` → Gemini → parse → stockage → envoi ; la branche `IF toggle` générique ; la branche `IF done` et le menu des tendances. |
| **WF-PICKS-RELANCE** | *nouveau workflow* | Samedi 10h et dimanche 9h : détecte une semaine non générée, repère où la chaîne s'est arrêtée, et relance sur Telegram. **Ne choisit jamais à la place du board.** |

---

## Avant d'importer — trois prérequis

1. **Créer les quatre champs dans NocoDB** (base « Max-Morrys » `ph7ugup4mggzj2y`, table `Contenus`
   `m3wim4coagaoot7`). ⚠️ **NocoDB rejette un champ inconnu et toute valeur hors options d'un
   SingleSelect** — il ne les ignore pas en silence comme Airtable. Tant qu'ils n'existent pas avec
   TOUTES leurs options, le nœud d'écriture échoue :
   - `Serie` (singleSelect) : `RADAR` · `ATELIER` · `PREUVE` · `COULISSES` · `CERCLE` · `OFFRE`
   - `Offre` (singleSelect) : `Formations` · `Club Digitos` · `Rysmo` · `Agence` · `Accompagnement` · `Non-produit`
   - `Cible` (singleSelect) : `Apprenants` · `Commerçants` · `Mixte`
   - `Outil` (**texte libre — surtout pas un SingleSelect**) : l'outil traité par un contenu ATELIER.
     Un SingleSelect rejetterait tout outil inconnu, ce qui referme la liste ouverte qu'on veut.
2. **Vérifier que le moteur de rendu répond** — sinon `ask` et `slide` n'existent pas côté rendu.
   ⚠️ La Cloud Function `renderSocialCard` a été **supprimée le 2026-08-13** avec le passage du
   projet Firebase au plan Spark : `firebase deploy --only functions:renderSocialCard` n'a plus
   d'objet. Le moteur vit désormais sur le VPS (`render-card.service`, `services/render-card/`),
   et la clé Config `RENDER_CARD_URL` doit pointer sur `http://172.18.0.1:8787/renderSocialCard`
   — la passerelle docker, car le service n'écoute que la boucle locale et n8n tourne en conteneur
   (pont `render-card-bridge.service`).
   ```bash
   ssh maxmorrys-vps 'curl -s http://127.0.0.1:8787/health'          # {"ok":true,"storage":true}
   ssh maxmorrys-vps 'docker exec maxmorrys-n8n wget -qO- http://172.18.0.1:8787/health'
   ```
3. **Rafraîchir la base live avant de générer.** `python3 scripts/n8n-snapshot-live.py` refige
   `n8n/live/` depuis l'instance. Sans ça, l'import écraserait les changements faits en ligne
   depuis le dernier snapshot.
   ⚠️ **Leçon apprise** : la première version de ces patchs était bâtie sur
   `backups/n8n-cutover-20260709/`, antérieur à la **migration Airtable → NocoDB du 2026-08-06**.
   Les importer aurait ramené quatre workflows sur Airtable — donc sur la copie gelée de rollback,
   que plus personne ne lit. **Toujours partir du live.**

---

## Importer

L'import et l'activation restent **manuels**. L'API n8n `PUT /workflows/{id}` n'accepte que
`name`, `nodes`, `connections`, `settings` et `staticData`, et l'activation par un agent est bloquée
par le classifieur d'auto-approbation — ce qui est cohérent avec la règle « rien ne part sans le board ».

Sur `https://n8n.maxmorrys.me`, pour chaque fichier : **Workflows → … → Import from File**, puis
comparer les nœuds modifiés avant d'enregistrer.

**Ordre d'import** — `WF-TG-ROUTER` en dernier : c'est lui qui porte les menus, et il ne sert à
rien tant que les champs NocoDB et les gabarits de créas ne sont pas en place.
`WF-PICKS-RELANCE` est un **nouveau** workflow : il s'importe puis s'active à part, et rien ne
dépend de lui.

⚠️ **Re-vérifier les credentials après import** : un import peut détacher les credentials
(NocoDB, Gemini, Telegram, R2). Aucun ne doit rester vide.

---

## Vérifier, sans rien publier

1. Déclencher **WF-THEMES** à la main → 4 thèmes arrivent sur Telegram, dans le fil rouge du mois.
2. **Cliquer un thème** → le menu 🧰 **des outils** doit arriver, et les outils doivent coller au
   thème. Contrôler qu'au moins deux sortent des incontournables.
3. **Cocher / décocher plusieurs fois** → le message se met à jour à chaque clic, les ✅ suivent.
   - « Terminé » **sans rien cocher** → refusé, avec une alerte.
   - **4ᵉ outil** → refusé (« Maximum 3 »), la sélection ne bouge pas.
4. **Valider** → le menu 📡 **des tendances** arrive. Chaque tendance doit porter **une date** et
   une source. Cocher 1 ou 2, valider.
5. **21 lignes** doivent apparaître dans `Contenus`, avec :
   - `Serie`, `Offre`, `Cible` renseignés sur chacune ;
   - **les 4 lignes ATELIER portent bien les outils cochés** dans `Outil`, et un `Brief` ;
   - **les 2 lignes RADAR portent la tendance** dans `Brief`, avec sa date ;
   - **`Brief` commence par « Thème de la semaine : « … » » avec le thème réellement cliqué** —
     c'est le contrôle du correctif du filtre Config. ⚠️ Ne pas le chercher dans `Thematique` :
     ce champ est un SingleSelect à liste fermée, et `TH — Créer posts` replie sur
     « Contenu de la semaine » toute valeur hors options. Le thème hebdo vit donc dans `Brief` ;
   - **aucune ligne** `Reseau=tiktok`, aucun `Format_Post` en `reel`/`short`/`live` ;
   - 7 lignes `story` à 12h, une par jour ; le créneau du mercredi sur Facebook en `Offre=Agence`.
6. Laisser tourner **WF-SOCIAL-03** puis **WF-SOCIAL-04**. Les lignes doivent arriver à
   `Status=prêt_à_valider` avec `Visuels_URLs` rempli.
7. Contrôler à l'œil : les contenus `Cible=Commerçants` ne doivent contenir **aucun terme
   technique**, et **aucun contenu ne doit citer un montant**.
8. **Rejeter (❌) le lot.** Rien ne doit jamais passer à `validé` sans un clic humain.
9. **Le filet de sécurité** : vider `TOOLS_PICKED` et supprimer les lignes de la semaine, puis
   déclencher `WF-PICKS-RELANCE` à la main → un message doit dire « il manque la validation des
   outils ».

---

## Ce qui n'est pas encore fait

- ~~`WF-SOCIAL-04` génère toujours une image en amont~~ — **fait le 2026-08-20**, sur décision du
  board : les quatre nœuds sont retirés et le texte des créas vient du rédacteur. C'est ce qui
  garantit que le visuel et la légende racontent la même chose : une seule génération les produit.
- **Le fuseau passe de `Africa/Lagos` à `Africa/Dakar`**, ce que déclare déjà `paperclip/org.json`.
  Concrètement, **tout décale d'une heure** vers l'avant. C'est voulu (l'audience est à Dakar), mais
  c'est un changement visible : à annoncer plutôt qu'à subir.
- **Seuls Facebook et Instagram publient automatiquement.** LinkedIn n'a aucun token, X est à court
  de crédits. Les 4 créneaux LinkedIn et le thread X sont produits et validés, puis publiés à la
  main. Recette du token LinkedIn : `GUIDE_TOKENS_RESEAUX_SOCIAUX.md` §5.

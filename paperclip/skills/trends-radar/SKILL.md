# Skill — RADAR tendances & ATELIER outils

Deux séries éditoriales, un même principe : **on ne récite pas, on source**.

## Le rituel du vendredi — c'est le board qui tranche

Depuis le 2026-08-06, ni les outils ni les tendances de la semaine ne sont choisis par la flotte.
Le vendredi 17h, un enchaînement de trois écrans arrive sur Telegram :

1. **4 thèmes** proposés → le board en clique un ;
2. **🧰 7 outils** proposés *en fonction du thème* → le board en coche **1 à 3**, puis « Terminé » ;
3. **📡 5 tendances** datées → le board en coche **1 à 2**, puis « Terminé » ;
4. → les 21 contenus sont créés, **avec l'outil et la tendance imposés créneau par créneau**.

Le rôle de ce skill n'est donc plus de décider, mais de **proposer bien** : des outils réellement
pertinents et variés, des tendances réellement datées. Le board fait le tri.

Quotas : **1 à 3 outils** (4 créneaux ATELIER par semaine) · **1 à 2 tendances** (2 créneaux RADAR).

Ce skill remplace la liste d'exemples de tendances qui était codée en dur dans le prompt de
WF-THEMES. Une liste figée vieillit sans prévenir : les posts continuent de sortir, simplement de
moins en moins actuels. Une procédure, elle, se met à jour toute seule.

---

## Partie 1 — RADAR : sourcer les tendances

### La procédure (Ivan, routine mardi & vendredi 8h)

1. **Lire le signal réel.** Table `SEO` de **NocoDB**, alimentée chaque jour par
   le pull Google Search Console sur `sc-domain:maxmorrys.me`. Repérer les requêtes en **hausse
   d'impressions**. C'est ce que le public cherche vraiment, pas ce qu'on croit qu'il cherche.
2. **Lire ce qui a déjà été dit.** Les 25 derniers `Titre` de la table `Contenus`
   (`m3wim4coagaoot7`). Interdiction de répéter un sujet déjà traité.
3. **Compléter par une veille externe**, et **dater chaque tendance**.
4. **Écrire 3 à 5 angles** dans `Calendrier_Editorial`. Chaque angle porte **quatre éléments
   obligatoires** :
   - la tendance **et sa date** ;
   - ce qu'elle change pour la **piste A** (apprenants) ;
   - ce qu'elle change pour la **piste B** (commerçants) ;
   - un **niveau de confiance** : `confirmé` · `émergent` · `spéculatif`.

### Le garde-fou

> **Une tendance non datée et non sourcée ne devient pas un post.**

C'est la seule chose qui sépare une réflexion d'un perroquet. Si on ne peut pas dire **quand** et
**où** la chose s'est produite, il n'y a rien à dire. En cas de doute : `spéculatif`, et on l'annonce
comme tel dans le contenu — une hypothèse assumée vaut mieux qu'une certitude inventée.

### Familles de veille (des directions, pas une liste de sujets)

| Famille | Ce qu'on surveille |
|---|---|
| **Recherche & découverte** | Comment les gens trouvent : moteurs, IA conversationnelles, cartes, réseaux |
| **IA générative & agents** | Ce qui devient réellement utilisable pour un solo ou une TPE |
| **Formats & algorithmes** | Ce que les plateformes récompensent en ce moment |
| **Commerce conversationnel & paiement mobile** | WhatsApp, catalogues, Wave/Orange Money — spécifique AO |
| **Écosystème local** | Financement, réglementation, infrastructure, connectivité en Afrique de l'Ouest |
| **Le métier lui-même** | Ce qui change pour un marketeur, un CM, un formateur |

*Ces familles sont stables. Les sujets qu'elles produisent changent chaque mois — c'est le principe.*

### La variante signature — « La Note »

On note publiquement une pratique, un outil, un secteur, sur des **critères annoncés à l'avance**.
Exemple : « Je note la présence Google de cinq secteurs à Dakar : voici ma grille, voici les
résultats. » C'est de l'autorité analytique, et c'est un aimant à commentaires.

> **Red line** : on note une pratique, un secteur, une catégorie — **jamais un commerce nommé pour
> le dévaloriser**. Ce sont des prospects, et le marché est petit.

### Structure d'un contenu RADAR

*Le fait daté → pourquoi tout le monde en parle → ce que ça change vraiment pour la piste A →
ce que ça change vraiment pour la piste B → ce que je ferais à ta place cette semaine.*

Le créneau principal est le **thread X du vendredi 17h** (5-10 tweets autonomes), plus un post
LinkedIn dans la semaine.

---

## Partie 2 — ATELIER : les outils

### ⚠️ La liste des outils n'est PAS fermée

C'est la règle qui prime sur tout le reste de cette partie. **Tout outil réellement pertinent est
recevable** — y compris celui qui n'existait pas le mois dernier, celui que personne n'a encore
couvert en français, celui qui vient de sortir.

Le tableau ci-dessous n'est **pas un catalogue** : ce sont des **directions**, exactement comme les
familles de veille de la partie 1. S'y enfermer reproduirait le défaut qu'on vient de corriger sur
le RADAR — une liste figée qui vieillit sans que personne ne le remarque.

**Contrainte de fraîcheur** : sur les propositions faites au board chaque semaine, **au moins deux
doivent sortir des incontournables** (Canva, CapCut, n8n, WhatsApp Business, fiche Google). C'est ce
qui empêche la série de se refermer sur les cinq mêmes noms.

### Les directions (pas un catalogue)

| Direction | Exemples d'outils | Angle piste A (apprenants) | Angle piste B (commerçants) |
|---|---|---|---|
| **Design** | Canva, Figma, générateurs de visuels… | « Fais tes visuels sans designer » | « Ta vitrine a l'air pro en 20 minutes » |
| **Vidéo / montage** | CapCut, outils de sous-titrage, IA vidéo… | « Monte ton Short en 10 minutes » | « Filme ton produit correctement avec ton téléphone » |
| **Automatisation** | n8n, agents IA, connecteurs… | « Automatise ton calendrier de contenu » | ⚠️ voir la red line |
| **IA** | Prompts, assistants conversationnels, IA image, IA de rédaction… | « Utilise l'IA sans perdre ton style » | « Réponds plus vite à tes clients » |
| **Rédaction** | Hooks, structure, CTA, réécriture, relecture assistée… | « Écris des posts qu'on lit jusqu'au bout » | « Décris tes produits pour qu'on les achète » |
| **Organisation** | Notion, tableurs, gestionnaires de tâches… | « Tiens un calendrier que tu suis vraiment » | « Sais où en est chaque commande » |
| **Recherche / veille** | Moteurs conversationnels, alertes, outils de veille… | « Trouve l'info en 10 minutes » | « Surveille ce que font tes concurrents » |
| **Stratégie** | Positionnement, calendrier, tunnel, mesure, UTM | « Passe de posts isolés à un vrai système » | « Sache enfin ce que ça te rapporte » |
| **Visibilité** | Fiche Google, avis, Maps, référencement local | « Capte la recherche locale » | « Apparais quand on cherche ton métier » |
| **Conversation** | WhatsApp Business, catalogue, réponses rapides, diffusion | « Vends en conversation » | « Organise tes commandes WhatsApp » |

### Anti-répétition — le mécanisme qui garde la série vivante

Chaque contenu ATELIER publié inscrit son outil dans le champ **`Outil`** de la table `Contenus`
(texte libre — surtout pas un `singleSelect`, qui rejetterait tout outil inconnu et refermerait la
porte). Le workflow relit les **80 dernières lignes ATELIER** avant de proposer, et interdit au
modèle de reproposer ces outils-là.

Bénéfice secondaire : on saura enfin **quels outils performent**, et lesquels ne méritent pas qu'on
y revienne.

### La règle de format

**Un outil. Un réglage. Un gain chiffré.**

Jamais « 15 astuces Canva ». Toujours « le réglage Canva qui te fait gagner 20 minutes par visuel ».
Un contenu qui promet quinze choses n'en délivre aucune.

Structure : *le problème en une phrase → l'outil → la manipulation exacte, étape par étape →
le gain chiffré → « essaie ce soir et dis-moi ».*

Format privilégié : **carrousel** (5-8 slides, une manipulation par slide). C'est le format le plus
sauvegardé, donc le plus rentable dans la durée.

### Red line de l'ATELIER automatisation

> **On enseigne le principe, jamais le livrable.** Les workflows n8n et les gabarits Paperclip ne
> sont jamais montrés, exportés, ni décrits assez précisément pour être reproduits par un client.
> Les livrer supprime la marge et fabrique un concurrent.
>
> - **Piste A (apprenants)** : le mot « n8n » est autorisé, la logique d'automatisation est un sujet
>   de formation légitime — on peut expliquer *comment ça marche*.
> - **Piste B (commerçants)** : le mot « n8n » est **proscrit**. Vocabulaire imposé : « tes
>   publications préparées et programmées, tu valides d'un message ». L'option payante s'appelle
>   « Automatisation sur mesure » (skill `agency-offer`).

---

## Ce que le board reçoit, et sous quelle forme

Les propositions doivent être **cliquables** : un nom court, un angle en 4 à 7 mots. Le message
Telegram affiche `nom — angle`, et le bouton ne porte qu'un numéro.

- **Outil** : `{nom, angle, piste, gain}` — `angle` = la manipulation précise, `gain` = ce qu'elle
  fait gagner, chiffré si possible.
- **Tendance** : `{titre, date, source, confiance, angle}` — **`date` et `source` sont obligatoires**.
  Une tendance sans date ne se propose pas ; le board ne peut pas arbitrer sur du vent.

## Où puiser quand la veille est sèche

`docs/STRATEGIE_COMMUNICATION_2026.md` → **Annexe A**, 70 sujets prêts à programmer, répartis par
série et par piste. C'est un filet de sécurité, pas la source principale : un ATELIER tiré de
l'annexe reste bon, un RADAR tiré de l'annexe doit **quand même** être redaté et resourcé avant
d'être publié.

## Outils et limites

- **Lecture seule** sur GSC et sur les tables NocoDB `SEO` et `Contenus`.
- Aucune interaction sortante, aucune publication (skill `approval-protocol`).
- Les angles sont écrits dans `Calendrier_Editorial` ; c'est la CMO qui arbitre ce qui entre dans
  la semaine.

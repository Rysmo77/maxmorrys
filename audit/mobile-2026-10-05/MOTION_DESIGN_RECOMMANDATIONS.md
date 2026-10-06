# Motion design — recommandations pour Rysmo

> Complément de [`AUDIT_UI_UX_MOBILE_COMPLET.md`](AUDIT_UI_UX_MOBILE_COMPLET.md), § 6. Source de vérité du mouvement : `DS_Final/brand/motion.css` et les planches `DS_Final/guidelines/planche-mouvement.html`, `planche-micro-interactions.html`, `planche-moments.html`, `planche-transitions.html`. Implémentation de référence : `mobile/ds/mouvement.ts`, `mobile/ds/Pressoir.tsx`.

## 1. Principe directeur

> « Quatre durées, deux courbes, et rien d'autre. » — « Deux moments. La retenue est le sujet. »

La sensation premium ne vient pas de la quantité d'animation mais de **trois propriétés invisibles** :
1. **Chaque geste est visiblement reçu** en moins de 120 ms (enfoncement, haptique).
2. **Chaque résultat est confirmé là où est le doigt** (pas dans un coin, pas dans une boîte système).
3. **Rien ne bouge sans raison**, et tout ce qui bouge le fait avec la même courbe pour la même intention.

## 2. Le vocabulaire

| Jeton | Durée | Courbe | Ce que ça dit | Propriétés | Où |
|---|---:|---|---|---|---|
| `tap` | 120 ms | `ease` (.2,.7,.2,1) | « j'ai senti ton doigt » | `scale` .975 (.94 ronds/pilules) | tout ce qui se touche |
| `ui` | 220 ms | `ease` | « l'état a changé » | `opacity`, `translateX`, `scale` | interrupteur, pilule, segment, radio, quota, erreur, confirmation |
| `enter` | 380 ms | `ease-out` (.16,1,.3,1) | « ceci vient d'arriver » | `translateY 16→0` + `opacity` ; `scale .94→1` pour un objet-héros | entrée d'élément, cascade 70 ms (max 8) |
| `scene` | 700 ms | `ease-out` | « la page se met en place » | titre sous masque (90 ms/ligne), barre de progression | **deux usages seulement** |

**Règles non négociables** : pilote natif uniquement (`transform`, `opacity`) ; « réduire les animations » ramène toutes les durées à 0, câblé une seule fois ; appareil modeste = dérive du maillage figée.

## 3. Correctifs du socle existant (lot du 05/10/2026)

| # | Défaut | Correctif | Effort |
|---|---|---|---|
| M-FIX-1 | Préférence « réduire » lue au premier rendu : le premier écran joue sa cascade | Appeler la lecture au chargement de `ds/mouvement.ts` ; exposer `mouvementReduit()` déjà résolu | S |
| M-FIX-2 | Transitions de pile non coupées sous « réduire » | `animation: reduit ? 'none' : screenAnimation` dans les deux `Stack` | S |
| M-FIX-3 | Pilules lues deux fois par les lecteurs d'écran | Couche décorative en `importantForAccessibility="no-hide-descendants"` / `accessibilityElementsHidden` ; libellé porté par le `Pressoir` | S |
| M-FIX-4 | Objets-héros (tuiles d'icône, cadenas, coche) entrent en `+16 px` au lieu de `scale .94→1` | Paramètre `echelle` dans `enCascade` pour les éléments marqués `heros` | S |
| M-FIX-5 | Contenu qui change sans remonter (accueil) : aucune transition | `key` sur le bloc variable pour rejouer `Revele`/`LigneDeTitre` | S |
| M-FIX-6 | Appareil modeste = RAM ≤ 2 Go seulement | RAM ≤ 3 Go **ou** ≤ 4 cœurs (`Device.supportedCpuArchitectures`/`deviceYearClass`) ; sur ces appareils, cascade réduite à un simple fondu | S |
| M-FIX-7 | Maillage rendu dans chaque écran : il glisse avec la page | Remonter `Mesh` à la racine, pile transparente ; le maillage devient le repère de continuité (kit) | M |
| M-FIX-8 | Brillance du certificat : 2 400 ms de traversée, rejouée à chaque session | 1 320 ms de traversée + 1 080 ms de pause ; mémoire persistée par code | S |
| M-FIX-9 | ~1 s de mouvement cumulé à l'arrivée d'un écran | Plafonner la cascade à 6 éléments ; titre et cascade démarrent ensemble (pas l'un après l'autre) | S |

## 4. Transitions entre écrans

| Transition | Durée | Mouvement | Ce qui ne bouge pas | État |
|---|---:|---|---|---|
| Entrer dans un détail | 260 ms | le détail entre de la droite (`translateX 42%→0`) ; la liste recule de 22 % et passe à 0,5 | le maillage | ❌ (pousser natif seulement) |
| Revenir | 260 ms | symétrique exact ; **la position de défilement de la liste est conservée** | le maillage | ⚠️ |
| Changer de territoire | 500 ms | fondu croisé des deux maillages, contenu qui glisse en parallèle | — | ❌ |
| Ouvrir une feuille | 300 ms | `translateY 100%→0` (`ease-out`), voile 0→30 %, poignée | la page derrière | ❌ |
| Fermer une feuille | 220 ms | `translateY 0→100%` (`ease`), voile 30→0 % ; suit le geste de glissement | — | ❌ |
| Changer d'onglet | 180 ms | fondu croisé, **aucune translation** ; icône active à la couleur du territoire en 220 ms | — | ✅ fondu / ❌ couleur |
| Onglets du Club | 180 ms | même règle que les onglets principaux | — | ❌ (glissé latéral) |
| Valider une action | 120 ms puis rien | enfoncement, puis l'état change **sur place** | l'écran | ⚠️ (souvent une `Alert`) |

## 5. Micro-interactions

Chaque micro-interaction répond à une question que la personne se pose au moment du geste. Sans question, pas d'animation.

| Geste | Question | Réponse animée | Durées | Haptique |
|---|---|---|---|---|
| Cocher une leçon | « C'est enregistré ? Qu'est-ce que ça change ? » | pastille 0,6→1 ; barre du programme qui avance ; « Leçon suivante » qui entre en `rv-s` | 220 / 380 / 380 ms | succès |
| Hors réseau, cocher | « Ça partira ? » | pastille + petite horloge ; à l'envoi, horloge → coche (fondu croisé) | 220 ms | succès léger à l'envoi |
| Publier au Club | « C'est parti ? » | bouton enfoncé, feuille qui se ferme, **le message entre en tête du fil** (c'est la confirmation) | 120 / 220 / 380 ms | succès |
| Réserver une session | « J'ai ma place ? » | libellé → « Place réservée ✓ » en ton `ok` (deux couches en fondu), 1,4 s, puis « Me désinscrire » discret | 220 ms, retour 1 400 ms | succès |
| Copier un code / une réponse IA | « C'est copié ? » | libellé → « Copié » + coche, fondu 220 ms, retour à 1,4 s ; **pas de toast** | 220 / 1 400 ms | succès léger |
| Filtrer (pilule) | « Qu'est-ce qui a changé ? » | la pilule active **glisse** vers sa place ; la liste fait un fondu (jamais un glissé latéral : on n'a pas changé de page) | 220 / 180 ms | sélection |
| Segmented | idem | pastille en `translateX` | 220 ms | sélection |
| Interrupteur | « C'est activé ? » | curseur qui glisse, fond qui passe au **dégradé** du kit (couche en fondu) | 220 ms | sélection |
| Envoyer une question IA | « Ça compte dans mon quota ? » | le segment se **réserve** (opacité 0,5) à l'envoi, s'allume à la réponse, revient en cas d'échec | 220 ms | léger à l'envoi |
| Erreur de champ | « Qu'est-ce qui ne va pas ? » | bordure `stop` (couche en fondu) + message sous le champ ; **aucune secousse** | 220 ms | erreur |
| Champ correct (SUPPRIMER, référence de devis) | « C'est bon ? » | bordure `ok` + coche | 220 ms | — |
| Garder une leçon | « Elle est sur mon téléphone ? » | icône téléchargement → coche ; tag « Sur ce téléphone · 12 Ko » en `rv-s` | 220 / 380 ms | succès |
| Retirer une leçon | « Je peux annuler ? » | la ligne passe à 0,5 avec « Annuler » pendant 4 s, puis s'efface | 220 ms | — |
| Débloquer un membre | « C'est fait ? » | « Débloqué » en `ok` 1,4 s, puis la ligne s'efface | 220 ms | succès |
| Tirer pour rafraîchir | « Ça recharge ? » | indicateur natif à la teinte du territoire ; le contenu **reste affiché** pendant la relecture | natif | sélection au déclenchement |
| Série quotidienne | « Je l'ai gardée ? » | une seule pulsation `scale 1→1,06→1` du compteur, **pas de confettis** | 220 ms | — |

## 6. États dynamiques

| État | Recommandation | Animation |
|---|---|---|
| Chargement | squelette **à la forme exacte** du contenu ; pulsation partagée `opacity .55↔1` (une seule valeur animée par écran, natif) ; une seule annonce « Chargement de … » | boucle 1 200 ms `inOut(sin)`, figée sous « réduire » |
| Squelette → contenu | fondu croisé, **pas** de démontage sec | 220 ms |
| Contenu en relecture (cache) | garder l'ancien contenu affiché, discret « relevé il y a 3 min » | — |
| Vide | glyphe en `rv-s`, phrase qui dit quoi faire, une action | 380 ms |
| Erreur / panne | dire ce qui n'a pas marché, ce qui est gardé, et « Réessayer » | fondu 220 ms ; haptique erreur une fois |
| Hors ligne | bandeau qui **entre** (`rv` 380 ms) et s'annonce ; état indéterminé distinct (« Vérification du réseau… ») | 380 / 220 ms |
| Succès | **sur place** : libellé, coche, ou l'élément créé qui apparaît | 220 / 380 ms |
| Attente de règlement | moment nº1 : anneaux 2,6 s, décalage 1,3 s, arrêtés à l'abandon | existant |
| Certificat émis | moment nº2 : brillance, 2 passages, **jamais rejouée** | M-FIX-8 |

<a id="onde"></a>

## 7. L'« onde de réflexion » du répétiteur IA

### 7.1 Pourquoi, et pourquoi pas n'importe quelle onde

Aujourd'hui, rien ne bouge pendant jusqu'à **20 secondes** entre l'envoi d'une question et la réponse. C'est le principal trou de sensation premium du produit, et l'IA est son différenciateur.

Une icône « style vague » est une bonne idée **à trois conditions** :
1. **Elle ne s'anime que pendant que l'IA réfléchit.** Une onde animée en permanence serait une troisième boucle sans attente derrière, contraire au kit (« la retenue est le sujet »). C'est aussi ce qui lui donne du sens : quand elle bouge, il se passe quelque chose.
2. **Elle est violette, jamais bleue.** Une onde bleue évoque **Wave**, le portefeuille mobile dominant à Dakar — donc un paiement. Le violet (`mmViolet`) est la teinte du territoire *transforme*, celui du répétiteur.
3. **Elle a 3 barres, pas 16.** L'app dessine déjà une onde dense de 16 barres (`MediaCard`) pour dire « ça s'écoute ». Trois barres disent « ça réfléchit », pas « ça parle ».

### 7.2 Le glyphe

```
 ▂ █ ▅        au repos (statique)        pendant la génération (animé)
 ▕ ▕ ▕        scaleY 0,5 / 1 / 0,67      scaleY 0,4 ↔ 1, déphasage 180 ms
```

| Propriété | Valeur |
|---|---|
| Barres | 3 × (3 × 12 px), rayon 1,5 px, écart 2,5 px, boîte 14 × 14 |
| Couleur | `mmViolet` (clair) ; en sombre, encre `mmVioletT` ou violet fixe — **pas** le pastel nuit (contraste) |
| Repos | `scaleY` 0,5 / 1 / 0,67, **immobile**, `transformOrigin: 'center'` |
| Animation | `scaleY` de 0,4 à 1 et retour, période **1 250 ms** (le rythme du `blink` du kit), déphasage **180 ms** entre barres |
| Courbe | `ease` (.2,.7,.2,1) en aller-retour — ou une seule valeur linéaire 0→1 et des `interpolate` décalés (recommandé) |
| Moteur | **un seul `Animated.Value`**, `Animated.loop(timing 0→1, 1250 ms, linear, useNativeDriver: true)` ; chaque barre = `interpolate` avec un décalage de k × 0,144 du cycle |
| Fin | retour à la pose de repos en 220 ms `ease` |
| Garde-fou | la boucle s'arrête avec la requête, au plus tard à 20 s (délai d'appel) ; jamais de boucle orpheline |

### 7.3 Où elle vit

| Emplacement | Comportement |
|---|---|
| **Fil de discussion** (principal) | une bulle du tuteur contenant le glyphe animé + « {tuteur} réfléchit… » en `textMuted`. Apparaît seulement si l'attente dépasse **220 ms** (pas de clignotement sur une réponse rapide). Entrée `rv` 380 ms. Quand la réponse arrive : la bulle s'efface (220 ms) et la réponse entre (`rv` 380 ms) **à la même place**. |
| **En-tête du répétiteur** | le glyphe **au repos** à gauche du nom du tuteur : c'est la signature visuelle du répétiteur. Il ne s'anime **que** si la bulle du fil est hors champ (fil remonté), avec un sous-titre « écrit… » en fondu 220 ms. Jamais deux ondes animées en même temps. |
| **Barre d'onglets** | jamais animé ; icône `chat` conservée. Au plus, un point statique si une réponse arrive pendant qu'un autre onglet est ouvert. |
| **Espace (carte du répétiteur)** | glyphe au repos à côté de « Pose ta question à {tuteur} » : cohérence d'identité. |

### 7.4 Accessibilité et préférences

- **Réduire les animations** : glyphe figé en pose active (1 / 1 / 1) + texte « {tuteur} écrit… ». Aucune boucle.
- **Lecteurs d'écran** : la bulle porte `accessibilityLabel="{tuteur} écrit une réponse"` et `accessibilityLiveRegion="polite"` (Android) ; à l'arrivée de la réponse, `AccessibilityInfo.announceForAccessibility("{tuteur} a répondu")`.
- **Appareil modeste** : l'animation est conservée (3 vues, transform, pilote natif : coût négligeable).
- **Haptique** : impact léger à l'envoi ; rien à la réponse (la réponse se lit, elle ne se « ressent » pas).

### 7.5 Ce qui accompagne l'onde

| Élément | Recommandation |
|---|---|
| Placeholder pendant l'attente | « {tuteur} te répond… » (aujourd'hui : « Plus de question aujourd'hui », faux) |
| Défilement | `scrollToEnd` à l'envoi et à la réponse (animé, sauf « réduire ») |
| Réponse | mise en forme (titres, listes, gras, liens internes) via le parseur de leçons ; **aucun prix, aucun « achat »** (canal `app` côté serveur) |
| Copier | appui long sur une bulle → « Copier » ; confirmation « Copié » 1,4 s |
| Premier usage | bulle d'accueil + 3 suggestions en pilules qui remplissent le champ, entrée en cascade 70 ms |
| Quota | segment réservé à l'envoi (0,5), allumé à la réponse (1), 220 ms ; au-delà de 10 par jour, barre continue en `scaleX` |

## 8. Moments à ne pas créer

| Tentation | Pourquoi non |
|---|---|
| Confettis en fin de formation | le certificat porte déjà le moment ; deux célébrations s'annulent |
| Secousse sur erreur | ajoute du stress, ne dit pas ce qui est faux |
| Toast flottant | apparaît là où la personne ne regarde pas |
| Compteur qui défile | un nombre vérifié s'affiche, il ne se met pas en scène |
| Pulsation de la cloche | troisième moment, sans attente réelle |
| Onde de l'IA animée en permanence | boucle sans attente ; perd son sens |
| Lottie décoratives | poids, coût sur appareil modeste, décor sans intention |

## 9. Budget de performance

| Règle | Seuil |
|---|---|
| Valeurs animées simultanées à l'arrivée d'un écran | ≤ 12 |
| Boucles actives | maillage de l'écran **au premier plan** seulement + au plus un indicateur d'attente |
| Animations hors pilote natif | 0 (garde : `mobile-mouvement.test.ts`) |
| Mouvement cumulé à l'arrivée | ≤ 800 ms avant que l'écran soit utilisable (les gestes ne sont jamais bloqués par une animation) |
| Profilage | à mesurer sur TECNO / itel réel (rendu GPU, images perdues) avant chaque lot de mouvement |

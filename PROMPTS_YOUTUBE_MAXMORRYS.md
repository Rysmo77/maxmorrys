# Bibliothèque de prompts YouTube — Max-Morrys

> Bibliothèque de prompts « prêts à l'emploi » (optimisés ChatGPT) pour générer des **scripts vidéo détaillés** (A-Roll / B-Roll / transitions / textes à l'écran), **hybrides** (long-form + Shorts), variés (pédagogie + divertissement + animation de communauté), dont l'audio alimente aussi le **podcast**.
>
> Positionnement : Max-Morrys Eyoum (Dakar) — leader d'influence et expert pédagogue du marketing digital, SEO et IA en Afrique de l'Ouest francophone. Ton « sans blabla », tutoiement, résultats mesurables, touches locales légères.

---

## Comment utiliser cette bibliothèque

1. **Toujours commencer par coller le `PROMPT MAÎTRE`** (persona + format) en début de conversation ChatGPT. Il « installe » Max-Morrys et le format de script.
2. Ensuite, coller **un prompt spécialisé** (P1 à P8) selon le type de vidéo voulu, en remplissant les `{variables}`.
3. Pour trouver des idées : utiliser **P0 — Idéation**.
4. Pour découper en Shorts : **P9 — Déclinaison Shorts**.
5. Pour le packaging (titre, miniature, description) : **P10 — Métadonnées & miniature**.

Convention des variables : tout ce qui est entre `{accolades}` est à remplacer. Tout le reste est fixe.

---

## 🎛️ PROMPT MAÎTRE (à coller en premier, une seule fois par conversation)

```
# RÔLE
Tu es Max-Morrys Eyoum, créateur de contenu et expert en marketing digital basé à Dakar. Tu es LE youtubeur de référence en marketing digital, SEO et intelligence artificielle pour l'Afrique de l'Ouest francophone (Sénégal, Côte d'Ivoire, Cameroun) et la diaspora. Tu es à la fois pédagogue, stratège et créateur tendance. Ta mission : aider les entrepreneurs, créateurs et PME à transformer leurs idées en business rentables grâce au digital, "sans blabla".

# TON IDENTITÉ & TA CRÉDIBILITÉ (à utiliser avec parcimonie, jamais te vanter)
- Tu t'es presque auto-formé au marketing digital depuis 2021. Ta force = passion authentique + apprentissage constant.
- Résultats réels que tu peux citer comme preuves : +1 790 % de trafic web et +8 000 abonnés organiques en 18 mois pour une organisation que tu as accompagnée ; plusieurs plateformes web et workflows IA en production.
- Tu vis à Dakar, à la croisée du marketing, de l'IA, du produit web et des partenariats à impact.

# TON STYLE (NON NÉGOCIABLE)
- Français standard, TUTOIEMENT systématique ("tu", "ta", "tes"). Parle comme à un ami entrepreneur.
- Direct, SANS BLABLA : du concret, des exemples réels, zéro jargon inutile, zéro théorie abstraite.
- Phrases courtes et punchy. Langage oral, énergique, mais professionnel.
- Toujours orienté ACTION : chaque idée se termine par "la prochaine étape concrète".
- Valorise les résultats MESURABLES ("4x plus de visiteurs", "en 3 mois", "+1790%").
- TOUCHES LOCALES LÉGÈRES (à doser, ~1 à 3 par vidéo, sans forcer) : références à Dakar/Abidjan/Douala, Wave & Orange Money, mobile money, PME et boutiques locales, WhatsApp Business, marché local, réalités de l'entrepreneur africain. PAS de patois ni de créole : français standard accessible à toute la francophonie + diaspora.
- Tu animes une COMMUNAUTÉ : tu interpelles, tu poses des questions, tu crées de l'engagement, tu n'es pas qu'un prof.

# CONTRAINTE AUDIO / PODCAST
L'audio de chaque vidéo est republié en podcast. Donc le texte A-Roll (ce que tu dis) doit être COMPRÉHENSIBLE À L'OREILLE SEULE, sans dépendre des visuels. Quand tu montres quelque chose à l'écran, dis-le aussi à voix haute.

# FORMAT DE SORTIE OBLIGATOIRE
Quand je te demande un script vidéo, réponds EXACTEMENT dans cette structure, en français :

═══════════════════════════════════
🎯 TITRE (3 options cliquables, < 60 caractères)
1. ...
2. ...
3. ...

🧲 ACCROCHE / HOOK (0–15 s) — la première phrase doit donner envie de rester. Donne le texte EXACT à dire.

⏱️ DURÉE CIBLE : {indiquée par la demande}

📦 PROMESSE DE LA VIDÉO (1 phrase) : ce que le spectateur saura faire à la fin.

───────────────────────────────────
DÉCOUPAGE EN SCÈNES
Pour CHAQUE scène, utilise ce gabarit :

▶️ SCÈNE [n] — [titre court de la scène] ([timecode approx.])
🎙️ A-ROLL (face caméra) : [le texte EXACT, mot pour mot, que Max dit face caméra]
🎥 B-ROLL : [plans de coupe / captures d'écran / visuels à filmer ou insérer pour illustrer]
🔤 TEXTE À L'ÉCRAN : [titre/incrustation qui apparaît + à quel moment de la scène]
✂️ TRANSITION → [type de transition vers la scène suivante : cut sec, zoom punch-in, swipe, fondu, whip pan, J-cut audio...]

(Répète pour toutes les scènes : Hook → Intro → corps en 3 à 6 blocs → récap → CTA.)

───────────────────────────────────
📣 CTA (appel à l'action) : formulation exacte, naturelle, non agressive (ex : commenter, s'abonner, télécharger la ressource, rejoindre le Club des Digitos, s'inscrire à une formation — choisis le plus pertinent, UN SEUL principal).

✂️ DÉCLINAISONS SHORTS (2 à 3) : pour chaque Short, indique le segment du script à réutiliser, le hook vertical (< 3 s) et le texte à l'écran.

🎧 NOTE PODCAST : 1–2 phrases d'adaptation pour la version audio (intro parlée, ou précision à ajouter à l'oral car un visuel manque).

🖼️ IDÉE MINIATURE : visuel + 3 à 4 mots max du texte de miniature.
═══════════════════════════════════

# RÈGLES DE QUALITÉ
- Hook = la chose la plus importante. Promesse claire + tension/curiosité dans les 5 premières secondes. Jamais "Salut c'est Max, aujourd'hui on va parler de...".
- Rythme : une idée par scène, pas de remplissage. Coupe tout ce qui n'apporte rien.
- Donne des exemples CHIFFRÉS et des cas concrets adaptés à l'Afrique francophone.
- Insère au moins 1 "pattern interrupt" (changement de plan, question directe, stat choc) toutes les 30–40 s.
- N'invente pas de faux chiffres : si tu as besoin d'un chiffre d'exemple, présente-le comme un exemple ("imagine une boutique à Dakar qui...").

Quand tu as compris, réponds juste : "Prêt. Donne-moi le sujet de la vidéo." et attends ma demande.
```

---

## P0 — IDÉATION (générer des idées calibrées tendance)

```
En tant que Max-Morrys, propose-moi {20} idées de vidéos YouTube sur le thème : {ex : "l'IA pour les entrepreneurs"}.

Contraintes :
- Adaptées à l'Afrique de l'Ouest francophone (entrepreneurs, créateurs, PME).
- Mix de formats : pédagogie (tutos), divertissement, opinion/débat, étude de cas, storytelling, animation de communauté.
- Surfe sur les tendances ACTUELLES (IA, automatisation, side business, mobile money, e-commerce local).
- Chaque idée doit avoir un fort potentiel de clic.

Pour chaque idée, donne sous forme de tableau :
| # | Titre cliquable (<60 car.) | Type de contenu | Angle/Hook en 1 phrase | Pourquoi ça peut exploser |

Termine par : les 3 idées que tu tournerais EN PREMIER et pourquoi.
```

---

## P1 — TUTO ACTIONNABLE (pédagogie / autorité)

```
Écris-moi le script complet d'une vidéo TUTORIEL au format de sortie obligatoire.

- Sujet : {ex : "configurer une fiche Google Business Profile qui ramène des clients"}
- Promesse : à la fin, le spectateur sait {résultat concret}.
- Durée cible : {12 à 18 min}.
- Niveau audience : {débutant / intermédiaire}.
- Étapes à couvrir si tu en as : {liste optionnelle, sinon propose la meilleure méthode}.

Exigences spécifiques :
- Structure en étapes numérotées claires (Étape 1, 2, 3...).
- Pour chaque étape, le B-Roll doit montrer une capture d'écran ou démonstration concrète.
- Inclure 1 erreur fréquente à éviter + 1 astuce de pro (touche locale si pertinent).
- CTA : proposer une ressource gratuite ou la formation Max-Morrys correspondante.
```

---

## P2 — DÉCRYPTAGE DE TENDANCE / ACTU (réactivité / viralité)

```
Écris-moi le script complet d'une vidéo de DÉCRYPTAGE D'ACTUALITÉ au format de sortie obligatoire.

- Tendance / actu à décrypter : {ex : "le nouveau modèle d'IA X / cette fonctionnalité / cette news marketing"}
- Angle de Max-Morrys : {ton avis / pourquoi ça change tout pour l'entrepreneur africain}.
- Durée cible : {8 à 12 min}.

Exigences :
- Hook qui crée l'urgence ("Si tu fais du business en ligne, ce truc va te concerner").
- Explique la tendance SIMPLEMENT (vulgarise pour un débutant).
- 3 implications concrètes pour un entrepreneur/créateur en Afrique francophone.
- 1 prédiction ou prise de position assumée de Max pour générer du débat en commentaire.
- B-Roll : captures de l'actu, démos, exemples.
- CTA : "Dis-moi en commentaire ce que tu en penses".
```

---

## P3 — ÉTUDE DE CAS CHIFFRÉE (preuve / autorité)

```
Écris-moi le script complet d'une vidéo ÉTUDE DE CAS au format de sortie obligatoire.

- Cas : {ex : "comment passer de 0 à X clients avec le SEO local" OU un cas réel Max-Morrys}.
- Résultat principal mis en avant : {ex : "+1790% de trafic" — ou un exemple présenté comme tel}.
- Durée cible : {10 à 15 min}.

Exigences :
- Structure narrative : Situation de départ → Problème → Stratégie étape par étape → Résultats chiffrés → Leçons reproductibles.
- Chaque chiffre annoncé doit être appuyé par un B-Roll (graphique, dashboard, capture).
- Rendre la méthode REPRODUCTIBLE : le spectateur doit pouvoir l'appliquer à sa propre boutique/PME.
- Touche locale : ancrer le cas dans un contexte africain (boutique Dakar, PME, e-commerce WhatsApp...).
- CTA : ressource ou formation pour appliquer la méthode.
```

---

## P4 — STORYTELLING / PARCOURS (connexion / personal brand)

```
Écris-moi le script complet d'une vidéo STORYTELLING / INSPIRANTE au format de sortie obligatoire.

- Histoire : {ex : "comment j'ai découvert le marketing digital en 2021 et changé de vie" / "mes 3 plus grosses erreurs de débutant"}.
- Leçon centrale que le spectateur doit retenir : {message}.
- Durée cible : {8 à 14 min}.

Exigences :
- Ton intime, authentique, vulnérable mais inspirant. Max se livre.
- Structure : moment fort d'ouverture → contexte → péripéties/échecs → déclic → ce que ça t'apprend, à toi spectateur.
- B-Roll : photos d'archives, plans d'ambiance Dakar, lifestyle créateur, vieux écrans/projets.
- Connecter l'histoire perso à l'audience : "si tu débutes aujourd'hui, voilà ce que je ferais à ta place".
- CTA doux : s'abonner pour suivre l'aventure / rejoindre la communauté.
```

---

## P5 — OPINION CLIVANTE / DÉBAT (engagement communauté)

```
Écris-moi le script complet d'une vidéo OPINION / COUP DE GUEULE au format de sortie obligatoire.

- Prise de position : {ex : "Arrête de payer de la pub avant d'avoir fait ÇA" / "90% des formations marketing en Afrique te mentent"}.
- Durée cible : {6 à 10 min}.

Exigences :
- Hook polarisant mais défendable (jamais gratuit, toujours étayé).
- Argumentation en 3 points avec preuves/exemples.
- Anticiper l'objection principale et y répondre.
- Nuance finale pour rester crédible et pro.
- Volontairement conçu pour générer des commentaires et du débat.
- CTA : "Team d'accord ou team pas d'accord ? Commentaire."
```

---

## P6 — FORMAT LISTE / OUTILS (forte cliquabilité)

```
Écris-moi le script complet d'une vidéo FORMAT LISTE au format de sortie obligatoire.

- Sujet : {ex : "7 outils IA gratuits pour booster ta PME" / "5 erreurs SEO qui te coûtent des clients"}.
- Nombre d'éléments : {5 à 10}.
- Durée cible : {8 à 12 min}.

Exigences :
- Hook qui annonce la valeur ("le n°{X} est celui que personne n'utilise").
- Chaque élément = une mini-scène : nom + à quoi ça sert + démo B-Roll + cas d'usage local concret.
- Garder le meilleur/le plus surprenant pour la fin pour la rétention.
- Texte à l'écran : numéro + nom de l'outil/erreur en gros à chaque transition.
- Transitions rythmées (cut sec / punch-in) entre chaque élément.
- CTA : ressource récapitulative téléchargeable.
```

---

## P7 — Q&A / RÉACTION COMMUNAUTÉ (animation de communauté)

```
Écris-moi le script complet d'une vidéo Q&A / RÉACTION au format de sortie obligatoire.

- Format : {ex : "je réponds à vos questions marketing" / "je réagis à VOS business / sites / pages Instagram"}.
- Questions ou éléments à traiter : {colle ici les questions/cas, ou demande-m'en des exemples typiques}.
- Durée cible : {10 à 15 min}.

Exigences :
- Ambiance conviviale, proximité, on parle à la communauté ("Les Digitos").
- Pour chaque question/cas : reformuler → répondre cash → 1 conseil actionnable.
- Valoriser les membres (mentionner pseudo/ville façon "Awa à Abidjan demande...").
- B-Roll : captures des questions/sites concernés, réactions face cam.
- CTA : "Pose ta question en commentaire pour la prochaine vidéo / rejoins le Club des Digitos."
```

---

## P8 — CHALLENGE / SÉRIE (rétention & divertissement)

```
Écris-moi le script complet d'une vidéo CHALLENGE / EXPÉRIENCE au format de sortie obligatoire.

- Challenge : {ex : "j'ai lancé une boutique en ligne en 24h avec 0 FCFA de pub" / "j'ai testé 5 IA pour écrire mes posts pendant 7 jours"}.
- Durée cible : {10 à 16 min}.

Exigences :
- Hook = enjeu + tension ("est-ce que c'est possible ? On va voir").
- Structure narrative type vlog : règles du challenge → étapes/jour par jour → rebondissements → résultat final chiffré → verdict honnête.
- Beaucoup de B-Roll d'action et d'ambiance, rythme dynamique.
- Suspense maintenu jusqu'au résultat (ne pas spoiler le verdict avant la fin).
- Ouvre la porte à un format série (épisode suivant).
- CTA : "Tu veux que je teste quoi ensuite ? Commentaire."
```

---

## P9 — DÉCLINAISON SHORTS (à partir d'un script long)

```
À partir du script vidéo ci-dessous, génère {3} Shorts verticaux (< 60 s) prêts à tourner/monter.

[COLLE ICI LE SCRIPT LONG]

Pour chaque Short :
- 🎯 Angle / titre du Short
- 🧲 Hook (< 3 s) : texte EXACT, doit stopper le scroll
- 🎙️ A-ROLL : texte condensé à dire (script mot pour mot, ~120-150 mots max)
- 🔤 TEXTE À L'ÉCRAN : sous-titres clés / mots punch à incruster
- 🎥 B-ROLL : visuels verticaux suggérés
- 📣 CTA final (1 phrase) + redirection vers la vidéo longue
- #️⃣ 3 à 5 hashtags pertinents (mix global + local Afrique francophone)
```

---

## P10 — MÉTADONNÉES & MINIATURE (packaging)

```
En tant que Max-Morrys, optimise le packaging YouTube de cette vidéo : {titre ou sujet, + colle le script si tu veux}.

Donne :
1. 🎯 5 titres A/B testables (< 60 car.), classés du plus fort au plus sûr, avec pour chacun le levier psychologique utilisé (curiosité, peur de rater, bénéfice, chiffre, contre-intuitif).
2. 🖼️ 3 concepts de miniature : visuel décrit + texte (3-4 mots max) + émotion du visage.
3. 📝 Description YouTube optimisée SEO : 2 premières lignes accrocheuses, résumé, timestamps (chapitrage), liens (formations/Club/newsletter), puis bloc mots-clés.
4. #️⃣ 8-12 hashtags (mix marketing digital global + Afrique francophone).
5. 📌 1 commentaire épinglé à poster pour lancer l'engagement.
```

---

## 🗓️ Calendrier de contenu mensuel (1 vidéo / semaine)

**Principe** : 1 vidéo long-form par semaine, chacune déclinée en **2–3 Shorts** (via P9). Chaque semaine a une **mission différente** (autorité, viralité, preuve, communauté) pour faire grandir la chaîne sur tous les leviers à la fois — pas seulement la pédagogie.

### Rotation hebdomadaire (mois de 4 semaines)

| Semaine | Pilier | Type de vidéo | Prompt | Objectif |
|---|---|---|---|---|
| **S1** | 🎓 Pédagogie / SEO | Tuto actionnable | **P1** | Capter la recherche, asseoir l'autorité, contenu evergreen |
| **S2** | 🔥 Tendance | Décryptage actu / IA | **P2** | Vues rapides, surfer sur l'actu, rester « top of mind » |
| **S3** | 📊 Preuve | Étude de cas **(P3)** ⇄ Liste/outils **(P6)** *(alterner 1 mois sur 2)* | **P3 / P6** | Crédibilité + fort taux de clic |
| **S4** | 💬 Communauté | Q&A/réaction **(P7)** ⇄ Opinion/débat **(P5)** *(alterner)* | **P7 / P5** | Engagement, fidélisation, commentaires |

### Semaine bonus (les mois à 5 semaines, ≈4×/an)

| Semaine | Pilier | Type de vidéo | Prompt | Objectif |
|---|---|---|---|---|
| **S5** | 🎬 Divertissement / Wild card | Challenge/série **(P8)** ⇄ Storytelling **(P4)** | **P8 / P4** | Variété, connexion émotionnelle, viralité |

> Astuce : si un mois n'a que 4 semaines, glisse un Storytelling (P4) ou un Challenge (P8) à la place d'une étude de cas tous les 2–3 mois pour garder du divertissement dans le mix.

### Thème mensuel (pilier éditorial)

Chaque mois, choisis **un fil rouge** : les 4 vidéos tournent autour, sous des angles différents. Ça crée des séries cohérentes, facilite les playlists et le SEO.

| Mois | Thème | Exemple de déclinaison sur les 4 semaines |
|---|---|---|
| Mois 1 | **L'IA pour ton business** | S1 Tuto « automatiser tes posts avec l'IA » · S2 Décryptage « le nouvel outil IA du moment » · S3 Liste « 7 IA gratuites pour ta PME » · S4 Débat « l'IA va-t-elle remplacer les marketeurs ? » |
| Mois 2 | **Trouver des clients (SEO & local)** | S1 Tuto « fiche Google Business qui ramène des clients » · S2 Décryptage « ce que Google a changé » · S3 Étude de cas « +1790% de trafic, la méthode » · S4 Q&A « je réponds à vos questions SEO » |
| Mois 3 | **Personal branding & contenu** | S1 Tuto « construire ton autorité sur LinkedIn » · S2 Décryptage « le format qui cartonne en ce moment » · S3 Liste « 5 erreurs qui tuent ta marque perso » · S4 Storytelling « comment j'ai bâti la mienne depuis Dakar » |

### Calendrier de publication type (semaine)

Pour la régularité (clé de l'algo), garde **un créneau fixe** chaque semaine :

- **🎥 Vidéo longue** : **samedi 19h–20h (heure de Dakar)** — fort temps de visionnage le week-end.
- **✂️ Shorts** (tirés de la vidéo via P9) : **lundi / mercredi / vendredi**, en milieu/fin de journée — ils ramènent du trafic vers la vidéo longue.
- **📣 Engagement** : réponds aux commentaires dans les 2h après la publi (boost l'algo + nourrit la communauté « Les Digitos »).
- **🎧 Podcast** : republie l'audio de la vidéo longue **en début de semaine suivante** (lundi), une fois la vidéo bien lancée.

### Routine de production (workflow conseillé)

1. **Début de mois** : lance **P0 — Idéation** avec le thème du mois → choisis tes 4 sujets.
2. **Par vidéo** : colle le **PROMPT MAÎTRE** puis le prompt du type de la semaine (P1–P8) → script complet.
3. **Après tournage/montage** : passe le script dans **P9** (Shorts) puis **P10** (titre, miniature, description, hashtags).
4. **Batch** : tourne idéalement 2 à 4 vidéos d'avance pour ne jamais rater une semaine.

---

## 📆 Calendrier de PROMPTS — Cadence de production (Juillet → Décembre 2026)

> ⚙️ Ce n'est **pas** un calendrier de contenu, c'est un **calendrier de prompts** : il te dit **quel prompt entrer et quand** pour produire la vidéo de la semaine ET en tirer Shorts + podcast. Périmètre : YouTube long-form + Shorts + podcast (prompts P0–P10). Publication vidéo : **samedi 19h (Dakar)**.

### 1) Cadence MENSUELLE — à lancer 1×/mois

| Quand | Prompt à entrer | Ce que tu obtiens |
|---|---|---|
| Dernier dimanche du mois précédent | **PROMPT MAÎTRE** + **P0 — Idéation** (thème du mois) | 20 idées → tu choisis/valides les 4-5 sujets du mois (à reporter dans la grille du bloc 3) |
| Dernier jour du mois | *(bilan, optionnel)* `Analyse mes 4 dernières vidéos (titres, durées, sujets) : qu'est-ce qui a le mieux marché et quel angle creuser le mois prochain ?` | Pistes d'optimisation |

### 2) Cadence HEBDOMADAIRE jour par jour — le MOTEUR, répété chaque semaine

Chaque semaine, en parallèle : tu **produis** la vidéo de samedi prochain **et** tu **distribues** les dérivés de la vidéo de samedi dernier.

| Jour | Prompt à entrer / Action | Sortie | Publication du jour |
|---|---|---|---|
| **LUNDI** | **PROMPT MAÎTRE** + le **prompt-script de la semaine** (bloc 3, P1–P8 + sujet) | Script vidéo complet (A-Roll/B-Roll/transitions/titres) | 🎧 Republie l'audio de samedi dernier → **podcast** (suis la NOTE PODCAST du script) |
| **MARDI** | **P9 — Déclinaison Shorts** (colle le script du lundi) | 2-3 scripts Shorts | — |
| **MERCREDI** | **P10 — Métadonnées & miniature** (colle le script) | Titres A/B, miniature, description SEO, hashtags, commentaire épinglé | ✂️ Short #1 (de samedi dernier) |
| **JEUDI** | *(tournage + montage — aucun prompt)* | Vidéo montée | — |
| **VENDREDI** | *(programmation dans YouTube — aucun prompt)* | Vidéo programmée samedi 19h | ✂️ Short #2 |
| **SAMEDI** | *(rien à générer)* | — | 🎥 **Vidéo longue 19h** + colle le commentaire épinglé (P10) |
| **DIMANCHE** | *(réponds aux commentaires)* | Engagement | ✂️ Short #3 |

> ⚠️ Semaine 1 (démarrage) : tu n'as pas encore de « samedi dernier » → ignore les lignes podcast/Shorts cette première semaine.

### 3) GRILLE 6 MOIS — le prompt-script à lancer chaque LUNDI

> Chaque lundi, colle le **PROMPT MAÎTRE** puis le prompt ci-dessous. Les prompts dérivés (P9 mardi, P10 mercredi) sont **identiques chaque semaine** → voir bloc 2. Thème = 1 fil rouge/mois.

#### 🟦 JUILLET — thème : L'IA pour ton business
| Semaine (sam.) | Prompt-script à lancer le LUNDI |
|---|---|
| 04/07 | `P1 — Sujet : "automatiser 1 mois de contenu réseaux sociaux avec l'IA" ; durée 12-14 min ; niveau débutant.` |
| 11/07 | `P2 — Tendance : "la montée des agents IA" ; angle : ce que ça change pour une PME africaine ; durée 9-11 min.` |
| 18/07 | `P6 — Sujet : "7 outils IA gratuits pour une PME" ; 7 éléments ; durée 9-11 min.` |
| 25/07 | `P5 — Prise de position : "l'IA ne te remplacera pas, mais celui qui la maîtrise oui" ; durée 7-9 min.` |

#### 🟩 AOÛT — thème : Trouver des clients (SEO & visibilité locale)
| Semaine (sam.) | Prompt-script à lancer le LUNDI |
|---|---|
| 01/08 | `P1 — Sujet : "configurer une fiche Google Business Profile qui ramène des clients" ; durée 12-15 min ; niveau débutant.` |
| 08/08 | `P2 — Tendance : "les changements SEO/Google de 2026 (IA dans la recherche)" ; angle : comment s'adapter ; durée 9-11 min.` |
| 15/08 | `P3 — Cas : "passer de presque 0 à +1790% de trafic organique" ; résultat : +1790% ; durée 12-15 min.` |
| 22/08 | `P7 — Format : "je réponds à vos questions SEO" ; demande 6-8 questions typiques de débutants ; durée 10-15 min.` |
| 29/08 | `P8 — Challenge : "améliorer le référencement d'un site de zéro en 7 jours" ; durée 10-14 min.` |

#### 🟨 SEPTEMBRE — thème : Personal branding & création de contenu
| Semaine (sam.) | Prompt-script à lancer le LUNDI |
|---|---|
| 05/09 | `P1 — Sujet : "construire ton autorité et trouver des clients sur LinkedIn" ; durée 12-15 min ; niveau intermédiaire.` |
| 12/09 | `P2 — Tendance : "le format de contenu qui performe le plus en ce moment" ; angle : comment l'adapter à ta niche ; durée 8-10 min.` |
| 19/09 | `P6 — Sujet : "5 erreurs qui tuent ta marque personnelle" ; 5 éléments ; durée 8-10 min.` |
| 26/09 | `P4 — Histoire : "comment j'ai construit ma marque personnelle depuis Dakar" ; leçon : tout le monde peut commencer ; durée 8-12 min.` |

#### 🟧 OCTOBRE — thème : Vendre en ligne (e-commerce & tunnel de vente)
| Semaine (sam.) | Prompt-script à lancer le LUNDI |
|---|---|
| 03/10 | `P1 — Sujet : "créer un tunnel de vente simple qui convertit" ; durée 13-16 min ; niveau intermédiaire.` |
| 10/10 | `P2 — Tendance : "le social commerce + mobile money en Afrique" ; angle : opportunité pour les petites boutiques ; durée 9-11 min.` |
| 17/10 | `P3 — Cas : "comment une boutique qui vend sur WhatsApp a multiplié ses ventes" ; durée 12-15 min.` |
| 24/10 | `P7 — Format : "je réagis à vos pages de vente / sites e-commerce" ; demande 4-5 cas types ; durée 10-15 min.` |
| 31/10 | `P8 — Challenge : "vendre un produit en 48h sans budget publicitaire" ; durée 10-14 min.` |

#### 🟥 NOVEMBRE — thème : Growth & publicité (acquisition)
| Semaine (sam.) | Prompt-script à lancer le LUNDI |
|---|---|
| 07/11 | `P1 — Sujet : "lancer ta première publicité Facebook/Instagram sans gaspiller ton budget" ; durée 13-16 min ; niveau débutant.` |
| 14/11 | `P2 — Tendance : "Black Friday" ; angle : la stratégie gagnante pour une PME africaine ; durée 8-10 min.` |
| 21/11 | `P6 — Sujet : "7 leviers de croissance gratuits avant de payer de la pub" ; 7 éléments ; durée 9-11 min.` |
| 28/11 | `P5 — Prise de position : "payer de la pub trop tôt = gaspiller son argent" ; durée 7-9 min.` |

#### 🟪 DÉCEMBRE — thème : Bilan, stratégie & préparer 2027
| Semaine (sam.) | Prompt-script à lancer le LUNDI |
|---|---|
| 05/12 | `P1 — Sujet : "faire le bilan marketing de ton année avec un template simple" ; durée 10-14 min.` |
| 12/12 | `P2 — Tendance : "les tendances marketing et IA pour 2027" ; angle : ce qu'il faut préparer dès maintenant ; durée 9-12 min.` |
| 19/12 | `P4 — Histoire : "mon bilan personnel de l'année, mes échecs et mes leçons" ; leçon : la constance paye ; durée 8-12 min.` |
| 26/12 | `P7 — Format : "je t'aide à fixer tes objectifs digitaux 2027" ; demande 5-6 objectifs/questions types ; durée 10-15 min.` |

> **Récap** : chaque lundi tu lances 1 prompt-script (grille) → mardi P9 → mercredi P10. Sur 6 mois : 26 cycles = 26 vidéos + ~65 Shorts + 26 podcasts. Thèmes interchangeables si tu lances une formation un mois donné.

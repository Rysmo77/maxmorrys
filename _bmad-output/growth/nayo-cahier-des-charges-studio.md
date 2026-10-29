# NAYO — Ce qu'il faut ajouter au studio pour produire des créas sociales de niveau agence

**Contexte.** Le 29/10/2026, Max-Morrys a produit dans NAYO (prod, org `org_fd1f9099-e7e2-402c-8a65-d6423281b3dc`, entité `ent_cda5e3e7-d064-4959-9140-85d97c942c70`, kit `kit_6b21a4f1-01a8-492f-ad8d-2503b89aca1a-v2`, projet `proj_b9954106-bd3f-4a34-b511-353c42ed029e`) le visuel d'une offre, à comparer avec la même créa sortie de render-card, un moteur interne (Satori + resvg, code `/opt/render-card/src/ds.ts` sur le VPS Max-Morrys).

- Visuel cible (render-card, « direction A ») : `rendercard-A-4x5.png` / `rendercard-A-9x16.png`
- Visuel NAYO : `nayo-A-4x5.png` / `nayo-A-9x16.png`

**Objectif :** que NAYO produise ce niveau de visuel (ou mieux) en moins de 10 secondes, à partir de données structurées et d'une charte, sans retouche manuelle, et par API.

---

## P0 — Défauts bloquants constatés en production (29/10/2026)

| # | Défaut | Critère d'acceptation |
|---|---|---|
| 1 | **Export PNG en erreur 500** (export payant et brouillon gratuit) | Export PNG/PDF 4:5, 1:1, 9:16, 16:9 et A4 qui répond 200, testé en e2e sur la prod |
| 2 | **Un export refusé est facturé** : la déclinaison est débitée avant la barrière qualité (0,20 crédit), et un export en 500 aussi (0,10). Aucun remboursement | Débit uniquement si l'export réussit ; remboursement automatique sinon ; ligne de crédit « remboursé » visible |
| 3 | **Le compteur de crédits ne suit pas la consommation** : solde affiché 1,5 après 0,84 consommé | `GET /api/v1/billing/credits` reflète chaque débit et remboursement en temps réel |
| 4 | **Police importée (actif `font`, OFL) non rendue** : Schibsted Grotesk importée, déclarée dans la typographie de la charte, mais le texte sort en Inter | Toute police importée et référencée dans la charte est embarquée par le moteur SVG et l'export ; test : glyphe distinctif mesuré à l'export |
| 5 | **La recomposition 9:16 écrase les retouches du 4:5** (logo, formes, mentions perdus) | Les éléments ajoutés à la main se propagent à toutes les déclinaisons (ou sont proposés pour chaque format) ; une retouche par format n'écrase jamais les autres |
| 6 | **Titres rognés sans alerte** : un titre déborde de son cadre et la barrière qualité ne le voit pas | Détection du débordement (mesure du texte réel) = défaut bloquant + ajustement automatique de la taille dans une plage min/max |
| 7 | **Mentions obligatoires cherchées mot pour mot** : une mention saisie comme règle (« Prix agence : HT, TVA 18 % en sus ») bloque tout export | Distinguer « mention littérale à afficher » et « règle à respecter » dans la charte ; message d'erreur qui dit quelle mention manque et où l'ajouter |

---

## P1 — Le moteur de rendu : ce que la direction A utilise et que NAYO n'a pas

### 1. Une palette par territoire, pas cinq rôles fixes
La marque a **5 territoires** (forme bleu #0057BC, informe orange #F38B0A, transforme violet #6C23DD, digitalise turquoise #02AC9C, agence corail #FF6E7F). Chacun a :
- une couleur d'aplat, une **couleur de texte sûre** (ex. turquoise → #00695E, orange → #8A4B00) quand la teinte ne passe pas le contraste sur blanc ;
- un **maillage** : 3 lobes de couleur flous, aux positions et opacités définies, recouverts d'un voile de lisibilité (blanc de 42 % à 90 % en dégradé vertical ; variante nuit).

**À ajouter :** dans la charte, des « territoires » nommés (couleur, couleur de texte sûre, lobes du maillage, variante nuit), en plus des 5 rôles actuels ; le choix du territoire par créa ; une règle de contraste qui **remplace automatiquement** une couleur interdite en texte par sa variante sûre (au lieu de seulement alerter).

### 2. Des composants de marque réutilisables
La direction A est un assemblage de composants qu'on retrouve sur toutes les créas :
- **Lockup** : logo sur pastille blanche arrondie + nom de marque en Fraunces 900, en haut à gauche ; **sourcil de territoire** en haut à droite (mono, capitales, interlettrage large).
- **Carte en verre** : panneau translucide (dégradé à deux arrêts de la teinte du territoire, liseré intérieur clair, ombre douce teintée, rayon 30 px).
- **Titre à surlignage** : Fraunces 900, plusieurs lignes, et un fragment marqué (`[apparais]`) dans la couleur de texte sûre du territoire.
- **Bloc prix** : grands chiffres en JetBrains Mono, séparateur de milliers en espace fine insécable, unité (« HT ») en petit, alignée sur la ligne de base ; note sous le prix en mono capitales.
- **Liste à coches** : icône coche de la couleur du territoire, 3 points maximum.
- **Ligne de paiement** : filet + mono capitales (« ACOMPTE 60 % · WAVE, ORANGE MONEY OU CARTE »).
- **Bouton pilule** : encre pleine, point de couleur du territoire, ombre teintée.
- **Pied** : domaine en mono capitales.

**À ajouter :** une bibliothèque de **composants de marque** paramétrables (dans la charte : `signatureComponents` existe, mais avec 5 types seulement : `contact_band`, `footer`, `price_badge`, `legal_mentions`, `logo_placement`). Il manque au moins : lockup, sourcil, carte en verre, titre à surlignage, bloc prix, liste à coches, bouton pilule, ligne de source, pagination de carrousel.

### 3. Des familles de mise en page pilotées par les données
render-card a **8 familles + 1** (chacune en 4:5, 1:1 et 9:16, en clair et en nuit) :

| Famille | Données d'entrée |
|---|---|
| `affiche` | sourcil, titre (avec `[surlignage]`), sous-titre, CTA |
| `etapes` | titre, 3 à 5 étapes numérotées |
| `question` | question, 2 à 4 options A–D en pilules, consigne (« une lettre en commentaire ») |
| `chiffre` | grand nombre, phrase, **source obligatoire** (ligne « SOURCE · … ») |
| `avant_apres` | deux colonnes (avant : tirets gris ; après : coches) |
| `citation` | citation (guillemets français géants), auteur, contexte — fond nuit |
| `coulisses` | titre, texte, photo facultative — fond nuit |
| `offre` | nom de l'offre, prix, unité, note, 3 points, paiement, CTA |
| `slide` (carrousel) | couverture + slides numérotées « 1/7 », dernière slide « Sauvegarde pour plus tard » |

**À ajouter :** des **modèles déterministes** (sans LLM) qui prennent un JSON structuré et produisent la créa, avec un réglage `fidèle` qui interdit à la direction artistique de sortir de la charte. Aujourd'hui, en mode mock, les directions proposées sont génériques (trois fonds nuit, vocabulaire d'église, aucune couleur de territoire), même avec une charte publiée.

### 4. Typographie française et mise en page fine
- Espaces insécables automatiques avant `? ! : ;` et à l'intérieur des guillemets « », séparateur de milliers en espace fine ;
- pas de mot seul en fin de titre (veuves), coupures de ligne équilibrées ;
- taille de titre ajustée automatiquement à la boîte (plage min/max), avec mesure réelle du texte ;
- zones de sécurité des stories (≥ 11 % en haut, ≥ 14 % en bas ; idéalement 250 px libres en haut, comme Meta le recommande).

### 5. Recomposition multi-format fidèle
Chaque famille connaît sa grille en 4:5, 1:1 et 9:16. La déclinaison **recompose** (elle ne recadre pas) **et conserve** tous les composants et mentions. Pour un carrousel : rendu de toutes les slides en un appel, cohérence couleur et typo entre slides.

---

## P1 — L'API : pouvoir produire sans ouvrir le studio

Aujourd'hui une clé d'API ne porte que `projects:read` et `insights:read`, et `/api/public/v1/` n'expose que `GET projects`.

| Endpoint à ouvrir (clé d'API, scope `designs:write`) | Rôle |
|---|---|
| `POST /api/public/v1/renders` | `{ entityId, family, territoire, format[], theme: clair\|nuit, data: {...} }` → PNG (URL R2) en **synchrone** (< 10 s) ou job |
| `GET /api/public/v1/jobs/:id` | statut + URLs des exports |
| `POST /api/public/v1/estimate` | coût en crédits **avant** l'opération, accessible par clé |
| `GET /api/public/v1/templates` / `styles` | familles et variantes disponibles pour l'entité |
| Webhook `render.completed` | pour les intégrations (n8n) |

Exigences : idempotence (`Idempotency-Key`), limite de débit, scopes séparés (`designs:write` ne donne pas `billing`), création de clé possible pour un compte de service, sans MFA interactive, par un owner déjà authentifié avec MFA.

---

## P2 — Le studio : pour les posts phares

- Partir d'une **famille** et d'un **territoire** au lieu d'un brief libre, avec les données pré-remplies depuis le post ;
- la retouche sur un format se propage aux autres formats (ou propose de le faire) ;
- l'aperçu côte à côte 4:5, 1:1 et 9:16 ;
- un historique de versions avec comparaison (`/api/v1/designs/compare` existe déjà) ;
- la validation par le décideur sur mobile (déjà prévue), avec les boutons ✅/❌ ;
- l'import d'une photo réelle sans régénération du visage (déjà une force de NAYO : la garder).

---

## Critère de réussite global

À partir de ce JSON, NAYO doit produire en 4:5 **et** en 9:16 un visuel au moins équivalent à `rendercard-A-4x5.png`, en un seul appel d'API, sans retouche, en moins de 10 secondes, pour moins de 0,1 crédit :

```json
{
  "entityId": "ent_cda5e3e7-d064-4959-9140-85d97c942c70",
  "family": "offre",
  "territoire": "digitalise",
  "theme": "clair",
  "format": ["4:5", "9:16"],
  "data": {
    "eyebrow": "Pack Présence Locale",
    "title": "Tape ton métier et ton quartier sur Google Maps. Tu [apparais] ?",
    "prix": "250 000 F", "prixUnite": "HT",
    "prixNote": "Prix de lancement · TVA 18 % en plus",
    "points": ["Ta fiche Google Maps, complète", "Boutons WhatsApp et appel", "Ton catalogue en ligne"],
    "paiement": "Acompte 60 % · Wave, Orange Money ou carte",
    "cta": "Ton pack en 3 questions"
  }
}
```

Référence d'implémentation disponible : `/opt/render-card/src/ds.ts` (≈ 580 lignes, Satori + resvg) sur le VPS Max-Morrys. Il fait déjà tout ce qui est décrit au § P1 « moteur de rendu », mais sans studio, sans charte éditable et sans facturation.

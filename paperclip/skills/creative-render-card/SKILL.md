# Skill — Créas par compositing (fond IA + texte HTML via renderSocialCard)

Objectif : des créas **dignes d'un graphic designer pro**, belles et 100 % conformes à la charte (skill `maxmorrys-brand`), au moindre coût et **sans les erreurs des créas full-IA**.

## Règle d'or (non négociable)
**L'IA ne génère JAMAIS de texte.** Elle produit uniquement l'**image de fond** (scène, ambiance, texture) — pas un mot, pas un logo. **Le HTML pose ensuite TOUT le texte** (titre, sous-titre, CTA, logo, monogramme) par-dessus, net et charté. On **composite** les deux → visuel pro + typo parfaite. **Jamais** publier une image de fond IA brute ni une capture brute.

## ⭐ Direction retenue par le board (2026-08-01) = POSTER typographique
Le style **`poster`** est le **défaut** : aplats de couleur sur fond bleu profond, très grande typo,
pastille de pilier, disque géométrique d'accent. **Sans courbe signature, sans photo.**
Ne pas revenir aux dégradés flous + courbe (l'ancien look, rejeté).

## Étape 1 — générer le fond (IA text-free) : WF-SOCIAL-04 — *optionnel*
Génération d'image via Gemini **`gemini-2.5-flash-image-preview`** (modèle validé ; ⚠ ne PAS utiliser `gemini-3-*` / `gemini-3.1-*-image` = cassés). Prompt **en anglais**, décris la **scène/lumière/ambiance**, **aucun texte** à afficher. Récupère l'URL de l'image de fond.

> **Les gabarits `poster`, `slide`, `stat`, `checklist`, `versus`, `ask` n'ont pas besoin de fond.**
> Ils se rendent en **mode marque** (aplat + typo). C'est plus rapide, moins cher, et ça ne rate
> jamais. Réserve la génération de fond aux cas où une vraie image ajoute quelque chose
> (`panel`, `quote`, `tip`, `promo`).

## Étape 2 — composer le texte : `renderSocialCard`
`POST $RENDER_CARD_URL` avec l'en-tête **`X-Render-Key: $RENDER_KEY`** et un corps JSON :
```json
{
  "template": "poster | slide | stat | checklist | versus | ask | testimonial | panel | quote | tip | promo",
  "format": "1:1 | 4:5 | 9:16",
  "title": "…",
  "eyebrow": "<Pilier ou Série>",
  "highlight": "<mot-clé du titre à surligner>",
  "accent": "turquoise | violet | orange | corail | vert | brand",
  "curve": false,
  "backgroundUrl": "<url du fond IA — seulement pour panel/quote/tip/promo>"
}
```
Réponse : l'**URL du PNG final** (Firebase Storage `social-cards/`, publique). **C'est cette URL qui part en publication** (à ranger dans `Visuels_URLs`), jamais le fond.

## Les gabarits

| Gabarit | Quand l'utiliser | Champs qui comptent |
|---|---|---|
| **`poster`** | **Défaut.** Tout post simple | `title`, `eyebrow`, `highlight`, `accent` |
| **`slide`** | **Les carrousels.** Une slide = un appel | `slideIndex`, `slideTotal`, `slideRole` (`cover`/`body`/`outro`), `title`, `body` |
| **`stat`** | PREUVE — un grand chiffre | `stat` (le nombre), `statLabel`, `body` (contexte) |
| **`checklist`** | ATELIER — une marche à suivre | `items[]` (3 à 6), `title`, `eyebrow` (nom de l'outil) |
| **`versus`** | PREUVE, RADAR — avant/après, mythe/réalité | `leftTitle`, `leftItems[]`, `rightTitle`, `rightItems[]` |
| **`ask`** | **Les stories.** Question, sondage | `title`, `body`, `options[]` (sondage), `format` **doit** être `9:16` |
| **`testimonial`** | CERCLE, OFFRE — preuve sociale | `title` (la citation), `authorName`, `authorRole` |
| **`panel`** | Couverture magazine : photo en haut, panneau bleu en bas | `backgroundUrl`, `title` |
| **`quote` / `tip` / `promo`** | Carte texte sur fond photo ou dégradé | `backgroundUrl`, `title`, `body`, `cta` |

### Carrousels — comment enchaîner les slides
Un carrousel = **plusieurs appels `slide`**, une URL par slide, rangées dans l'ordre dans
`Visuels_URLs` (tableau JSON).
- Slide 1 : `slideRole: "cover"` — **la promesse en ≤ 7 mots**. C'est 80 % de la performance.
- Slides 2 à n-1 : `slideRole: "body"` — **une seule idée par slide**.
- Slide n : `slideRole: "outro"` — récapitulatif + un seul CTA.
- Instagram : 5 à 8 slides. LinkedIn (post document) : 8 à 12, ton plus sobre, aucun emoji.

### Stories — les zones de sécurité
L'interface Instagram recouvre le haut et le bas de l'écran (photo de profil, barre de réponse).
Le gabarit **`ask`** réserve automatiquement **~250 px en haut et ~310 px en bas** sur 1920 px.
**N'utilise jamais `poster` en 9:16 pour une story** : le texte sortirait sous l'interface.

## Formats par `Format_Post`
`story` → `9:16` · `carrousel` / `post` → `4:5` · `community_post` / `thread` → `1:1`

## Accent = couleur du Pilier (mapping CANONIQUE, « poster-safe » sur fond bleu profond)
`Éducation`→`turquoise` · `Inspiration`→`violet` · `Produit`→`orange` · `Autorité`→`corail` ·
`Communauté`→`vert` · `Autre`→`orange`.

Palette : bleu profond `#072B49`, bleu principal `#0074C5`, orange `#ED9516` (en touche, jamais en
aplat dominant). **3-4 couleurs max par visuel.** Titres Merriweather, corps Inter, monogramme
appliqués par le service.

## Garde-fous
- Jamais publier directement : la créa finale part vers l'agent diffuseur (Zara/Flora) **puis l'approbation Telegram** (skill `approval-protocol`).
- Vérifier lisibilité mobile, palette (accent en touche), monogramme présent, **un seul CTA**.
- Sur un carrousel : vérifier que la **cover tient seule** et que la dernière slide porte le CTA.
- Le service est en `europe-west1` (`renderSocialCard`). En cas d'échec de rendu, alerter Oscar (Ops).
- ⚠️ Les fonds photo passent par `backgroundUrl` ; `renderSocialCard` les télécharge avec un
  User-Agent navigateur (correctif 2026-08-01) — sans quoi la carte retombe silencieusement en
  mode marque.

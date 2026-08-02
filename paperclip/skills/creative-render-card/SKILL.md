# Skill — Créas par compositing (fond IA + texte HTML via renderSocialCard)

Objectif : des créas **dignes d'un graphic designer pro**, belles et 100 % conformes à la charte (skill `maxmorrys-brand`), au moindre coût et **sans les erreurs des créas full-IA**.

## Règle d'or (non négociable)
**L'IA ne génère JAMAIS de texte.** Elle produit uniquement l'**image de fond** (scène, ambiance, texture) — pas un mot, pas un logo. **Le HTML pose ensuite TOUT le texte** (titre, sous-titre, CTA, logo, monogramme) par-dessus, net et charté. On **composite** les deux → visuel pro + typo parfaite. **Jamais** publier une image de fond IA brute ni une capture brute.

## Étape 1 — générer le fond (IA text-free) : WF-SOCIAL-04
Génération d'image via Gemini **`gemini-2.5-flash-image-preview`** (modèle validé ; ⚠ ne PAS utiliser `gemini-3-*` / `gemini-3.1-*-image` = cassés). Prompt **en anglais**, décris la **scène/lumière/ambiance**, **aucun texte** à afficher. Récupère l'URL de l'image de fond.

## Étape 2 — composer le texte : `renderSocialCard`
`POST $RENDER_CARD_URL` avec l'en-tête **`X-Render-Key: $RENDER_KEY`** et un corps JSON :
```json
{
  "template": "quote | tip | promo",
  "format": "1:1 | 4:5 | 9:16",
  "bgImageUrl": "<url du fond IA (étape 1)>",
  "data": { "title": "…", "subtitle": "…", "cta": "…", "pilier": "Formations|Contenus|Communauté|IA|Accompagnement" }
}
```
- **Templates** : `quote` (citation/insight), `tip` (astuce/éducatif), `promo` (mise en avant formation/Club).
- **Formats** : `1:1` (feed carré), `4:5` (feed portrait), `9:16` (story/short/Reel).
- La palette (bleu profond `#072B49`, bleu `#0074C5`, orange `#ED9516`), les **titres Merriweather** + corps Inter, et le **monogramme** sont appliqués par le service ; l'**accent** est mappé au `pilier`.
- Réponse : l'**URL du PNG final** (Firebase Storage `social-cards/`, publique). **C'est cette URL qui part en publication** (à ranger dans `Visuels_URLs`), jamais le fond.

## Garde-fous
- Jamais publier directement : la créa finale part vers l'agent diffuseur (Zara/Flora) **puis l'approbation Telegram** (skill `approval-protocol`).
- Vérifier lisibilité mobile, palette (accent en touche), monogramme présent, un seul CTA.
- Le service est en `europe-west1` (`renderSocialCard`). En cas d'échec de rendu, alerter Oscar (Ops).

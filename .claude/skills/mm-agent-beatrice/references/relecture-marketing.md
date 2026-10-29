# Relecture d'une copie marketing

**Réussite :** la copie (post, carrousel, e-mail, message WhatsApp, texte de page) est conforme avant de partir en validation chez Max.

## Démarche
1. Identifier la piste et le public : registre tu / vous (`03-charte-voix.md`, table « Concrètement »).
2. Règles du canal. **Pour Facebook et Instagram, vérifier la conformité à `{project-root}/docs/growth-kb/10-community-management.md`** (il fait autorité et prime sur `04`), en rejouant son contrôle §8 :
   - accroche d'une ligne (≤ 110 caractères), lignes courtes et aérées, une seule action qui provoque un signal fort (commentaire, enregistrement, partage) ;
   - longueur de `Texte` : FB post 40-90 mots (120 pour un ATELIER très concret), IG post 30-80, IG carrousel 20-60, OFFRE 35-70, CERCLE 15-40 ;
   - 1 à 3 emojis (jamais un par ligne) dans la légende (compter avec `/\p{Extended_Pictographic}/gu`), aucun dans les visuels ni `Slides_JSON` ;
   - hashtags dans le champ `Hashtags` seulement : IG 4-6, FB 2-3, sans accent ; aucun `#` dans `Texte` ;
   - IG sans URL (« lien dans ma bio ») ; FB au plus un lien UTM, en fin de texte ;
   - voix CM : aucun « · » ni « ; » en liste, pas de « en sus », « offre », « solution », « n'hésitez pas ». Un post qui sonne « page de site » est renvoyé à la réécriture.
   Pour les autres canaux (`04-taxonomie-reseaux-qa.md`) : longueur, emojis (aucun sur le web et les slides), hashtags, un seul CTA, UTM au bon format.
3. Interdits de `00-essentiel.md` et prix vérifiés dans le code.
4. Pour une ligne NocoDB : champs `Pilier`, `Serie`, `Offre`, `Cible` aux valeurs exactes ; `Status` jamais au-delà de `prêt_à_valider`.
5. Pour une copie destinée à l'i18n du site : aucune date écrite, crochets des titres conservés, pas de phrase de plus de 60 caractères en double (`npm run proof:check`, tests unitaires).

## Livrable
Retour dans la conversation ou fichier `relecture.md` à côté du lot (`_bmad-output/growth/…`).

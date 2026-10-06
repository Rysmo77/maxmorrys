/**
 * Le canal d'où vient la question — le site, ou l'application Rysmo.
 *
 * L'application NE VEND RIEN (App Store 3.1.1, Play « Payments ») : aucun prix, aucun
 * achat, aucun lien qui mène à un paiement. Le prompt du site, lui, recommande une
 * formation payante « (X FCFA) … pour l'achat ». Les deux canaux partagent tout le
 * reste ; ce module tient UNIQUEMENT ce qui diffère.
 *
 * La barrière est double. Le prompt interdit, et la réponse est nettoyée après coup :
 * un modèle de langage ne tient pas une interdiction à 100 %, et un seul prix cité
 * dans l'application suffit à un refus en revue.
 */
export type Canal = 'web' | 'app';

export function lireCanal(v: unknown): Canal {
  return v === 'app' ? 'app' : 'web';
}

/** La hiérarchie de recommandation, par canal. */
export function reglesDeRecommandation(canal: Canal): string[] {
  if (canal === 'app') {
    return [
      "Tu réponds DANS L'APPLICATION MOBILE. Elle ne vend rien. Règles absolues :",
      '- Ne cite JAMAIS un prix, un montant, une devise (FCFA, €, $), une promotion ou une remise.',
      "- N'emploie jamais les mots « acheter », « achat », « payer », « paiement », « payant », « gratuit », « offre », « abonnement ».",
      "- N'invite jamais à s'inscrire, à souscrire ou à passer par le site pour obtenir un contenu.",
      '',
      'Quand tu recommandes un contenu :',
      "1. Si l'utilisateur suit déjà une formation qui couvre le sujet → renvoie-le dedans",
      '   (« Ta formation [Titre](/formations/slug) traite exactement ça »).',
      '2. Sinon, un article, un podcast ou une vidéo pertinent du catalogue.',
      '3. Une formation non suivie peut être NOMMÉE comme ressource, sans rien dire de son accès.',
      '',
      "Ne révèle jamais le contenu intégral d'une formation que l'utilisateur ne suit pas :",
      "donne un aperçu pédagogique, puis la prochaine étape concrète.",
    ];
  }
  return [
    'Quand tu recommandes un contenu, respecte cette hiérarchie :',
    "1. Si l'utilisateur a déjà acheté une formation qui couvre le sujet → renvoie-le dedans",
    '   (« Tu as déjà la formation X qui traite exactement ça : /formations/slug »)',
    '2. Sinon, contenu GRATUIT pertinent en premier (article, podcast, vidéo)',
    '3. Puis, si la question mérite un approfondissement structuré, suggère la formation',
    '   payante qui correspond (« Pour creuser ce sujet de façon structurée, la formation',
    '   "Titre" (X FCFA) le couvre en profondeur : /formations/slug »)',
    '',
    "Ne révèle JAMAIS le contenu intégral d'une formation payante à un utilisateur non-inscrit :",
    'donne un aperçu pédagogique, puis renvoie vers /formations/slug pour l\'achat.',
  ];
}

/**
 * Le catalogue sans prix ni mention payant/gratuit. Le modèle ne peut pas citer un
 * montant qu'on ne lui a pas donné.
 */
export function catalogueSansPrix(texte: string): string {
  return texte
    .replace(/ · (?:\d[\d\s.,]*\s?FCFA|gratuit) →/g, ' →')
    .replace(/\s*\((?:cours )?payants?\/gratuits?[^)]*\)/gi, '')
    .replace(/\s*\(gratuit(?:e|es|s)?(?:,[^)]*)?\)/gi, '')
    .replace(/\s*\(gratuits? — [^)]*\)/gi, '')
    .replace(/formations déjà achetées par cette personne/g, 'formations que cette personne suit');
}

const MONTANT = /\s*\(?\s*(?:\d[\d\s.,]*\s?(?:FCFA|F CFA|XOF|CFA|€|euros?|\$|USD))\s*\)?/gi;

/**
 * Le second filet : tout montant qui aurait échappé au prompt est retiré de la réponse.
 * La phrase perd un chiffre ; elle ne perd pas son sens.
 */
export function retirerLesPrix(reponse: string): string {
  return reponse.replace(MONTANT, '').replace(/[ \t]{2,}/g, ' ').replace(/ ([,.;:!?])/g, '$1');
}

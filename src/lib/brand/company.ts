/**
 * Identité corporate et coordonnées — SOURCE UNIQUE DE VÉRITÉ.
 *
 * Aucune de ces valeurs ne doit être dupliquée dans un composant. Le pied de page,
 * les pages légales, le JSON-LD et `components/seo/seo-config.ts` lisent toutes ce fichier.
 *
 * Source des données corporate : avis d'immatriculation délivré par le Ministère de
 * l'Économie, du Plan et de la Coopération (République du Sénégal), immatriculation
 * du 11/04/2022. Miroir de `My-onoma/apps/web/src/lib/brand/company.ts`.
 *
 * ⚠️ En cas de divergence sur une donnée corporate, c'est le dépôt My-onoma qui fait
 * foi : il porte les pièces. Voir `docs/BRAND-ARCHITECTURE.md`.
 *
 * Tout champ non confirmé reste `null` et n'est pas rendu : rien n'est inventé, et aucune
 * mention « à compléter » n'apparaît en façade.
 */

export interface LegalEntity {
  name: string;
  legalForm: string;
  /** Registre du Commerce et du Crédit Mobilier. */
  rccm: string | null;
  /** Numéro d'Identification National des Entreprises et Associations. */
  ninea: string | null;
  /** Capital social, libellé complet avec devise. */
  capital: string | null;
  /** Adresse du siège, hors ville et pays. */
  registeredAddress: string | null;
  city: string;
  country: string;
  /** Code ISO 3166-1 alpha-2, pour les données structurées. */
  countryCode: string;
  /** Adresse de contact corporate — distincte du contact de la plateforme. */
  email: string;
  /** Téléphone au format international, sans séparateur. */
  phone: string | null;
  /** Dates issues de l'avis d'immatriculation (ISO). */
  incorporatedAt: string;
  registeredAt: string;
}

/**
 * MY ONOMA SARL — société opératrice de la marque Max-Morrys.
 *
 * ⚠️ L'activité principale immatriculée est « Activités de soutien aux entreprises N.C.A. »,
 * qui ne recouvre ni l'édition de logiciels ni l'exploitation de plateformes. Elle n'est
 * volontairement pas exposée ici : le site ne doit jamais affirmer que ses activités
 * logicielles sont couvertes par l'objet social. Voir `docs/LEGAL-TODO.md §5`.
 */
export const legalEntity: LegalEntity = {
  name: 'MY ONOMA',
  legalForm: 'Société à Responsabilité Limitée (SARL)',
  rccm: 'SN DKR 2022 B 11134',
  ninea: '009319501',
  capital: '100 000 FCFA',
  registeredAddress: 'Quartier Ouakam, Cité Batrain, Lot 384',
  city: 'Dakar',
  country: 'Sénégal',
  countryCode: 'SN',
  email: 'contact@myonoma.com',
  phone: '+221776041985',
  incorporatedAt: '2022-04-06',
  registeredAt: '2022-04-11',
};

/** Raison sociale complète, telle qu'elle doit apparaître en pied de page et aux mentions légales. */
export const legalName = `${legalEntity.name} SARL`;

/** Site corporate. Déjà publié en pied de page avant ce module — repris ici, pas inventé. */
export const corporateUrl = 'https://myonoma.com';

/**
 * Positionnement de la marque personnelle. Volontairement court : c'est ce qui doit
 * permettre de comprendre Max-Morrys en moins de vingt secondes.
 *
 * `pillars` n'est pas traduit — c'est l'architecture de marque, pas de la copie.
 */
export const positioning = {
  name: 'Max-Morrys',
  disciplines: ['Marketing', 'Product', 'Technology', 'AI'] as const,
  tracks: ['LEARN', 'WORK WITH ME'] as const,
} as const;

/**
 * Coordonnées de la plateforme maxmorrys.me — distinctes du contact corporate.
 *
 * ⚠️ Les documents légaux (les fichiers `legal.json` de chaque langue) publient
 * `contact@maxmorrys.me`,
 * alors que le site affiche `hello@maxmorrys.me`. Les deux existent réellement ; l'arbitrage
 * est une décision ouverte, consignée dans `docs/LEGAL-TODO.md §3`. Aucune des deux n'a été
 * supprimée en attendant.
 */
export const contact = {
  email: 'hello@maxmorrys.me',
  /** Format wa.me : indicatif sans « + » ni séparateur. */
  phoneRaw: '221776041985',
  /** Format des données structurées et des liens `tel:`. */
  phoneE164: '+221776041985',
  /** Format lisible à l'écran. */
  phoneDisplay: '+221 77 604 19 85',
  city: 'Dakar',
  country: 'Sénégal',
} as const;

/** Profils sociaux publics, vérifiés. Alimente `sameAs` du JSON-LD. */
export const socialLinks = [
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/max-morrys-eyoum/' },
  { name: 'Facebook', url: 'https://www.facebook.com/maxmorrys.me/' },
  { name: 'Instagram', url: 'https://www.instagram.com/maxmorrys.me' },
  { name: 'YouTube', url: 'https://www.youtube.com/@maxmorrys-me' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@maxmorrys.me' },
  { name: 'X', url: 'https://x.com/max_morrys' },
] as const;

/**
 * LA PLATEFORME D'ÉCOUTE DU PODCAST — `null` tant qu'il n'y en a pas.
 *
 * Le podcast s'écoute sur le site et se distribue par `/podcast.xml`. Aucun show n'est publié
 * sous un flux à nous chez un diffuseur : le dépôt ne contient AUCUNE URL de show, et en
 * deviner une serait exactement ce que la page À propos reproche au reste du web.
 *
 * ⚠️ C'EST LA SEULE PORTE, ET C'EST TOUT SON INTÉRÊT. Le fait était écrit en toutes lettres à
 * DEUX endroits — l'emplacement déclaré « Liens à confirmer » de `/a-propos` et la phrase sous
 * les rangées de `/podcast-et-videos` — donc dans quatre fichiers avec l'anglais. Le jour de la
 * publication, l'un des deux aveux aurait survécu à l'autre. Les deux surfaces lisent
 * maintenant cette valeur : y poser `{ name, url }` fait apparaître la ligne d'écoute et la
 * troisième rangée du kit, l'ajoute à `sameAs`, et retire les deux aveux d'un seul geste.
 *
 * `name` est l'étiquette ET l'initiale de la pastille sur `/a-propos` : écrire « Spotify »,
 * pas « Podcast Spotify ».
 *
 * ⚠️ Cette constante n'existe PAS dans le miroir corporate `My-onoma` : le podcast appartient
 * à la plateforme, pas à la société. Ne pas la remonter là-bas au nom de l'alignement.
 */
export const podcastPlatform: { name: string; url: string } | null = null;

/**
 * OÙ ON PEUT ME TROUVER — les profils sociaux, PLUS la plateforme d'écoute quand elle existe.
 *
 * Distinct de `socialLinks`, et ça n'est pas une redondance : le pied de page rend `socialLinks`
 * par une table d'icônes indexée par NOM (`Footer.tsx`), où un nom absent ne rendrait pas un
 * icône vide — il ferait planter la rangée. Les surfaces qui affichent un nom et une URL
 * (panneau « Où me trouver », `sameAs` du JSON-LD) lisent celle-ci.
 */
export const publicProfiles: readonly { name: string; url: string }[] =
  podcastPlatform ? [...socialLinks, podcastPlatform] : socialLinks;

/**
 * Formate un téléphone international pour l'affichage : +221 77 604 19 85.
 * Retourne la valeur brute si elle ne fait pas douze chiffres.
 */
export function formatPhone(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 12) return raw;
  return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
}

/**
 * Adresse du siège sur une ligne, en omettant les champs absents.
 * Utilisée par les mentions légales et le JSON-LD `PostalAddress`.
 */
export function formatRegisteredAddress(): string {
  return [legalEntity.registeredAddress, legalEntity.city, legalEntity.country]
    .filter(Boolean)
    .join(' — ');
}

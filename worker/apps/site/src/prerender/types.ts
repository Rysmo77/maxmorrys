export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface PageMeta {
  title: string;
  description: string;
  ogType: string;
  ogImage: string;
  /**
   * Texte alternatif de l'image de partage.
   *
   * Il manquait entièrement à la sortie vue par les robots : le `SEOHead` du client en pose
   * un, mais aucun crawler social n'exécute React. Facebook et LinkedIn le lisent pour les
   * lecteurs d'écran, et c'est le seul texte que voit quelqu'un dont l'image ne charge pas —
   * un cas courant sur les forfaits d'ici.
   */
  ogImageAlt?: string;
  /**
   * Dimensions RÉELLES de `ogImage`, quand elles sont connues.
   *
   * ⚠️ Ne jamais y remettre une constante. Les 1200×630 codés en dur décrivaient une image
   * qui n'existe pas : l'image par défaut fait 1500×1000, les pochettes de podcast 640×640,
   * les vignettes YouTube 1280×720. Facebook dimensionne la carte d'après ces nombres AVANT
   * de télécharger l'image, puis recadre ce qu'il reçoit — le haut et le bas de l'image par
   * défaut partaient donc à la coupe sur chaque partage.
   */
  ogImageWidth?: number;
  ogImageHeight?: number;
  canonical: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  h1?: string;
  bodyText?: string;
  publishedAt?: string;
  modifiedAt?: string;
  noIndex?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  // i18n
  lang?: 'fr' | 'en';
  /** Alternates hreflang absolus (toujours en FR canonique pour altFr). */
  altFr?: string;
  altEn?: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface PageMeta {
  title: string;
  description: string;
  ogType: string;
  ogImage: string;
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

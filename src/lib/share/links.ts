import { SITE_URL } from '../../components/seo/seo-config';

/**
 * LES LIENS DE PARTAGE, SÉPARÉS DU COMPOSANT QUI LES AFFICHE.
 *
 * Ce dépôt teste de la logique pure — il n'a pas de rendu React en test. Une URL d'intention
 * mal encodée ne se voit pourtant qu'à l'usage : le titre part dans une chaîne de requête, et
 * une apostrophe, une esperluette ou un « ? » non encodés coupent l'URL en deux. Le lien
 * s'ouvre quand même, sur un partage vide ou tronqué, sans erreur.
 *
 * D'où ce module : les fonctions qui fabriquent les adresses vivent ici et sont vérifiées par
 * `tests/unit/share-links.test.ts` ; `ShareButtons` ne fait plus que les afficher.
 */

export type ShareNetwork = 'whatsapp' | 'facebook' | 'linkedin' | 'twitter';

/**
 * Rend une adresse absolue.
 *
 * Les réseaux refusent un chemin relatif — ils partageraient leur propre domaine. `SITE_URL`
 * est le domaine public canonique, indépendamment de l'hôte servi : c'est la même règle que
 * pour les `canonical` du pré-rendu, et pour la même raison (le site répond aussi sur
 * l'origine Firebase).
 */
export function toAbsoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

/**
 * L'adresse d'intention d'un réseau.
 *
 * Chaque paramètre est encodé séparément. WhatsApp reçoit titre ET lien dans un seul champ
 * `text`, parce que son intention n'a pas de champ d'URL distinct : le message part tel quel
 * dans la conversation, et l'aperçu Open Graph se construit à partir du lien qu'il contient.
 */
export function shareLink(network: ShareNetwork, url: string, title: string): string {
  const absolute = toAbsoluteUrl(url);
  const u = encodeURIComponent(absolute);

  switch (network) {
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(`${title} ${absolute}`)}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case 'twitter':
      return `https://twitter.com/intent/tweet?url=${u}&text=${encodeURIComponent(title)}`;
  }
}

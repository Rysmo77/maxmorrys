import type { Firestore } from '@mm/firestore-rest';

import { SITE_NAME, SITE_URL } from '../constants';
import { asText } from '../seo/values';
import { enPath } from './segments';
import type { PageMeta } from './types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * UN CERTIFICAT PARTAGÉ S'AFFICHAIT COMME LA PAGE D'ACCUEIL DU SITE.
 *
 * `/certificat/:code` n'était ni dans `PRERENDER_EXACT` ni dans `PRERENDER_PREFIXES` :
 * `resolveRoute` rendait `origin`, l'hébergement servait `index.html` tel quel, et les
 * robots sociaux — qui n'exécutent pas React — lisaient les balises figées du gabarit :
 *
 *     og:title  « Max-Morrys — Maîtrise le digital »
 *     og:image  .../Je-te-forme/2252.jpg
 *
 * Le défaut n'était donc PAS « pas d'aperçu ». C'était le MAUVAIS aperçu, et personne ne
 * pouvait le voir : le `noIndex` posé par `SEOHead` ne les atteint pas non plus, et rien
 * dans le produit ne rend ce que les robots reçoivent.
 *
 * Or le partage EST la fonction de cette page. Le certificat existe pour être montré — sur
 * LinkedIn, à un employeur — et il se montrait sous le titre d'une page de vente.
 *
 * ── CE QUI EST PERSONNALISÉ, ET CE QUI NE PEUT PAS L'ÊTRE ─────────────────────
 *
 * Le TITRE et la DESCRIPTION le sont : ils viennent de `certificate_lookups`, que les
 * règles ouvrent en lecture à quiconque possède le code (`allow read: if true`) — c'est le
 * miroir public, sans UID, créé exactement pour ça.
 *
 * L'IMAGE ne peut pas l'être. Les cartes sont rendues AU BUILD (`scripts/og-cards.mjs`), et
 * un certificat n'existe pas à ce moment-là ; rendre à la demande demanderait plusieurs
 * mégaoctets de WebAssembly sur le chemin de chaque page vue, ce que l'en-tête de ce script
 * a explicitement refusé. On sert donc UNE carte, générique, qui dit « certificat » — ce qui
 * est déjà toute la différence avec une photo de page d'accueil.
 *
 * ⚠️ `ogImage` EST POSÉ EXPLICITEMENT, ET C'EST CE QUI LE FAIT SURVIVRE. `withShareImage`
 * court-circuite sur `noIndex` et retombe sur la photo par défaut — mais seulement si
 * `ogImage` vaut encore `DEFAULT_OG_IMAGE`. En le posant ici, la carte passe, sans qu'il y
 * ait rien à changer à `withShareImage`.
 *
 * ⚠️ `noIndex` RESTE VRAI. Un certificat nominatif n'a pas à entrer dans un index de
 * recherche : il se partage par lien, il ne se trouve pas. Les deux ne sont pas la même
 * chose, et c'est justement leur confusion qui rendait le défaut invisible.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** La carte générique des certificats, rendue au build. */
const OG_CERTIFICAT = `${SITE_URL}/og/certificat.png`;
/** Dimensions réelles du fichier produit par `scripts/og-cards.mjs`. Jamais une constante décorative. */
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

const T = {
  fr: {
    eyebrow: 'Certificat',
    title: (formation: string) => `Certificat — ${formation}`,
    description: (titulaire: string, date: string) =>
      `Délivré à ${titulaire} le ${date}. Vérifiable par son code sur ${SITE_URL}/verifier.`,
    sansDate: (titulaire: string) =>
      `Délivré à ${titulaire}. Vérifiable par son code sur ${SITE_URL}/verifier.`,
    alt: (formation: string) => `Certificat de la formation ${formation}`,
  },
  en: {
    eyebrow: 'Certificate',
    title: (formation: string) => `Certificate — ${formation}`,
    description: (titulaire: string, date: string) =>
      `Issued to ${titulaire} on ${date}. Verifiable by its code at ${SITE_URL}/en/verify.`,
    sansDate: (titulaire: string) =>
      `Issued to ${titulaire}. Verifiable by its code at ${SITE_URL}/en/verify.`,
    alt: (formation: string) => `Certificate for the course ${formation}`,
  },
} as const;

/** La date, dans la convention de chaque langue. Vide si elle est absente ou illisible. */
function dateLisible(iso: string | undefined, lang: 'fr' | 'en'): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const j = d.getUTCDate();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const a = d.getUTCFullYear();
  return lang === 'fr' ? `${j}/${m}/${a}` : `${m}/${j}/${a}`;
}

/**
 * Les métadonnées d'un certificat, ou `null` si le code ne correspond à rien.
 *
 * `null` fait retomber l'appelant sur `unknownRouteMeta` — un `noindex` générique, ce qui est
 * exactement ce qu'il faut pour un code inventé : ni page, ni indice qu'un autre code
 * existerait.
 *
 * ⚠️ UN `get` PAR IDENTIFIANT, JAMAIS UNE REQUÊTE. Le miroir est indexé PAR LE CODE, et
 * c'est ce qui rend la lecture publique acceptable : on ne peut pas lister, seulement
 * demander un code qu'on possède déjà.
 */
export async function getCertificateMeta(
  db: Firestore,
  code: string,
  lang: 'fr' | 'en',
): Promise<PageMeta | null> {
  const snapshot = await db.get(`certificate_lookups/${code}`);
  if (!snapshot) return null;

  const formation = asText(snapshot.data.formationTitle);
  const titulaire = asText(snapshot.data.holderName);
  if (!formation || !titulaire) return null;

  const t = T[lang];
  const date = dateLisible(asText(snapshot.data.issuedAt), lang);
  const chemin = `/certificat/${code}`;

  return {
    title: `${t.title(formation)} | ${SITE_NAME}`,
    description: date ? t.description(titulaire, date) : t.sansDate(titulaire),
    ogType: 'website',
    ogImage: OG_CERTIFICAT,
    ogImageAlt: t.alt(formation),
    ogImageWidth: OG_WIDTH,
    ogImageHeight: OG_HEIGHT,
    /* Un certificat nominatif se partage, il ne se cherche pas. */
    noIndex: true,
    canonical: `${SITE_URL}${chemin}`,
    lang,
    altFr: `${SITE_URL}${chemin}`,
    altEn: `${SITE_URL}${enPath(chemin)}`,
    h1: t.title(formation),
    bodyText: date ? t.description(titulaire, date) : t.sansDate(titulaire),
  };
}

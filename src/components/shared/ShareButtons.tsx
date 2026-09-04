import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@ds';
import { FacebookIcon, LinkedInIcon, WhatsAppIcon, XIcon } from './SocialIcons';
import { shareLink, toAbsoluteUrl, type ShareNetwork } from '../../lib/share/links';
import { trackShare } from '../../lib/tracking';
import { cn } from '../../lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PARTAGER — le débouché de tout le travail de pré-rendu.
 *
 * Le site produit des aperçus Open Graph pour chaque page ; encore faut-il que quelqu'un
 * colle le lien quelque part. Jusqu'ici les boutons n'existaient QUE sur les articles, avec
 * LinkedIn, X et la copie du lien — et pas WhatsApp, sur un marché où c'est le canal
 * dominant. Les formations, les podcasts, les vidéos et les questions de la FAQ n'en avaient
 * aucun.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * L'ORDRE DES RÉSEAUX EST UNE DÉCISION, PAS UN ALPHABET.
 *
 * WhatsApp d'abord : c'est là que circulent les liens ici, de personne à personne. Facebook
 * ensuite, LinkedIn et X pour la diffusion publique. Les quatre correspondent à des comptes
 * qui existent réellement (`lib/brand`) ; Telegram n'y figure pas et n'est donc pas proposé —
 * sur mobile, la feuille de partage native l'offre de toute façon, avec tout ce que la
 * personne a réellement installé.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI LA DÉTECTION DU PARTAGE NATIF PASSE PAR UN EFFET.
 *
 * `navigator.share` n'existe pas au premier rendu côté serveur — et ces pages sont
 * PRÉ-RENDUES par le Worker. Tester la capacité pendant le rendu ferait diverger le HTML
 * servi du HTML monté. L'état part donc à `false` et ne bascule qu'après montage : le bouton
 * natif apparaît sur mobile, la rangée reste correcte partout ailleurs.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface ShareButtonsProps {
  /** Chemin de la page (`/blog/mon-article`) ou URL absolue. */
  url: string;
  /** Titre partagé — sert de texte au message WhatsApp et au tweet. */
  title: string;
  /** Type de contenu, pour l'analytique (`article`, `formation`, `podcast`…). */
  contentType: string;
  /** Identifiant du contenu, pour l'analytique. */
  contentId: string;
  /** Étiquette visible au-dessus de la rangée. Absente par défaut. */
  label?: string;
  className?: string;
}

interface Network {
  key: ShareNetwork;
  label: string;
  Glyph: (props: { className?: string }) => JSX.Element;
}

/*
 * L'ordre est la décision ; les adresses vivent dans `lib/share/links.ts`, où elles sont
 * testées — une URL d'intention mal encodée s'ouvre quand même, sur un partage vide.
 */
const NETWORKS: Network[] = [
  { key: 'whatsapp', label: 'WhatsApp', Glyph: WhatsAppIcon },
  { key: 'facebook', label: 'Facebook', Glyph: FacebookIcon },
  { key: 'linkedin', label: 'LinkedIn', Glyph: LinkedInIcon },
  { key: 'twitter', label: 'X', Glyph: XIcon },
];

export default function ShareButtons({
  url,
  title,
  contentType,
  contentId,
  label,
  className,
}: ShareButtonsProps) {
  const { t } = useTranslation('shared');
  const [copied, setCopied] = useState(false);
  const [canShareNatively, setCanShareNatively] = useState(false);

  useEffect(() => {
    setCanShareNatively(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  const absolute = toAbsoluteUrl(url);

  const button =
    'w-10 h-10 rounded-m border border-[color:var(--line)] flex items-center justify-center ' +
    'text-ink-2 transition hover:text-ink hover:border-[color:var(--ink-3)] ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      trackShare('copy_link', contentType, contentId);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Le presse-papiers peut être refusé (contexte non sécurisé, permission). Le silence
      // est correct ici : les autres boutons restent utilisables.
    }
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ title, url: absolute });
      trackShare('native', contentType, contentId);
    } catch {
      // Une annulation lève aussi : il n'y a rien à signaler à la personne qui a annulé.
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {label && <span className="text-sm text-ink-2 mr-1">{label}</span>}

      {canShareNatively && (
        /*
          Sur mobile, la feuille native bat toujours notre rangée : elle propose les
          applications réellement installées, dans l'ordre d'usage de la personne.
        */
        <button
          type="button"
          className={button}
          onClick={handleNativeShare}
          aria-label={t('share.native')}
        >
          <Icon name="share" size={16} />
        </button>
      )}

      {NETWORKS.map(({ key, label: name, Glyph }) => (
        <a
          key={key}
          className={button}
          href={shareLink(key, absolute, title)}
          target="_blank"
          rel="noreferrer"
          aria-label={t('share.on', { network: name })}
          onClick={() => trackShare(key, contentType, contentId)}
        >
          <Glyph className="h-4 w-4" />
        </a>
      ))}

      <button
        type="button"
        className={button}
        onClick={handleCopy}
        aria-label={copied ? t('share.copied') : t('share.copy')}
      >
        <Icon name={copied ? 'check' : 'copy'} size={16} />
      </button>
    </div>
  );
}

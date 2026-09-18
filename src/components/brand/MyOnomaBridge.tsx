import { useTranslation } from 'react-i18next';
import { Button, GlassPanel } from '@ds';
import { corporateUrl, legalEntity, legalName } from '../../lib/brand';

/**
 * LE PONT VERS MY ONOMA — CDC du 14/09/2026, §5.1.
 *
 * Le cahier des charges est formel sur le NOMBRE : « Ne pas multiplier les passerelles.
 * Trois liens clairs valent mieux que douze renvois qui donnent l'impression d'un montage
 * confus. » Les trois emplacements sont l'accueil, `/conception`, et le pied de page — ce
 * dernier portait déjà sa mention de rattachement avant ce composant (`Footer`, ligne
 * « opéré par »), et n'a donc pas à le rendre.
 *
 * D'où un composant unique, à deux variantes, plutôt qu'une phrase recopiée : un renvoi
 * écrit trois fois à la main, c'est trois formulations qui divergent le jour où l'une
 * change. Et il n'existe qu'un seul chemin vers l'URL — `corporateUrl` de `lib/brand`,
 * miroir du dépôt My-onoma, jamais une adresse retapée.
 *
 * CE QUE CE PONT NE FAIT PAS : vendre. Max-Morrys ne propose plus de direction marketing,
 * de stratégie de marque ni d'acquisition — c'est l'objectif O3 du CDC, et la recette le
 * vérifie. On renvoie, on ne décrit pas l'offre de l'autre.
 */

interface MyOnomaBridgeProps {
  /** `line` : une phrase et un lien (accueil). `panel` : le bloc de `/conception`. */
  variant: 'line' | 'panel';
  className?: string;
}

export default function MyOnomaBridge({ variant, className }: MyOnomaBridgeProps) {
  const { t } = useTranslation('shared');
  /*
   * LE NOM NE S'ÉCRIT PLUS DANS LE CATALOGUE, IL S'INTERPOLE.
   *
   * Trois casses cohabitaient à l'écran — « MY ONOMA SARL », « MY ONOMA », « My Onoma » —
   * parce que sept des neuf mentions étaient tapées à la main dans les JSON. Le code fait
   * foi : `legalEntity.name` en prose, `legalName` quand la phrase désigne la partie
   * contractante. Une casse interpolée ne peut plus dériver d'un catalogue à l'autre.
   */
  const company = legalEntity.name;

  if (variant === 'line') {
    return (
      <p className={['m-0 text-body-sm text-ink-2', className].filter(Boolean).join(' ')}>
        {t('myonoma.line')}{' '}
        <a
          href={corporateUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('myonoma.ctaAria', { company })}
          className="font-medium text-ink underline underline-offset-2"
        >
          {legalName}
        </a>
      </p>
    );
  }

  // `padding` est une prop de la primitive : elle l'écrit en style en ligne, où aucune
  // classe Tailwind ne la battrait.
  return (
    <GlassPanel padding={28} as="aside" className={className}>
      <p className="m-0 text-heading-sub font-black tracking-tight text-ink">
        {t('myonoma.panelTitle')}
      </p>
      <p className="mt-2 mb-5 text-body-sm text-ink-2">{t('myonoma.panelBody', { company })}</p>
      <Button
        tone="ghost"
        href={corporateUrl}
        target="_blank"
        aria-label={t('myonoma.ctaAria', { company })}
      >
        {t('myonoma.cta', { company })}
      </Button>
    </GlassPanel>
  );
}

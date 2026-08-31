import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Field, GlassPanel } from '@ds';
import { SiteDisplay, SiteEyebrow } from '../site';

/**
 * LA PREUVE PAR LA RECHERCHE — la seule démonstration de la page, et elle est vraie.
 *
 * Le système interdit les notes en étoiles, les nombres d'inscrits et les témoignages :
 * six interdits absolus, parce qu'aucun n'est vérifiable par la personne qui le lit. Cet
 * encart tient l'inverse. Il ne raconte rien : il ouvre Google Maps sur le métier et la
 * ville que le commerçant vient de taper, et le laisse constater lui-même qui apparaît
 * avant lui. La démonstration se passe hors du site, dans un outil qui n'est pas le nôtre
 * — c'est ce qui la rend impossible à truquer.
 *
 * D'où sa place : APRÈS les prix. Elle ne sert pas à convaincre d'entrer, mais à expliquer
 * ce qu'on achète à quelqu'un qui regarde déjà les montants.
 */
export default function MapsProof() {
  const { t } = useTranslation('presence');
  const [trade, setTrade] = useState('');
  const [area, setArea] = useState('');

  const canSearch = trade.trim().length > 1;

  const openMaps = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSearch) return;
    const query = [trade.trim(), area.trim()].filter(Boolean).join(' ');
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <GlassPanel level="flat" padding={26}>
      <SiteEyebrow style={{ margin: 0 }}>{t('proof.note')}</SiteEyebrow>
      <SiteDisplay as="h2" lines={[t('proof.title')]} size={26} style={{ marginTop: '8px' }} />
      <p className="mm-prose mt-3 text-meta leading-[1.6] text-ink-2">{t('proof.text')}</p>

      <form onSubmit={openMaps} className="mt-4 grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Field
          id="maps-trade"
          label={t('proof.tradeLabel')}
          value={trade}
          onChange={setTrade}
          placeholder={t('proof.tradePlaceholder')}
          autoComplete="off"
          style={{ marginTop: 0 }}
        />
        <Field
          id="maps-area"
          label={t('proof.areaLabel')}
          value={area}
          onChange={setArea}
          placeholder={t('proof.areaPlaceholder')}
          autoComplete="off"
          style={{ marginTop: 0 }}
        />
        <Button type="submit" tone="digitalise" fullWidth={false} disabled={!canSearch}>
          {t('proof.cta')}
        </Button>
      </form>
    </GlassPanel>
  );
}

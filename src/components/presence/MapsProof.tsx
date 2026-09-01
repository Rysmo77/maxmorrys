import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Field, GlassPanel } from '@ds';
import { SiteEyebrow } from '../site';

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
 * ── POURQUOI IL A QUITTÉ LE CINQUIÈME ÉCRAN ──────────────────────────────────────────
 * Il vivait après la grille de prix, et ce commentaire défendait ce placement : « elle ne
 * sert pas à convaincre d'entrer, mais à expliquer ce qu'on achète à quelqu'un qui regarde
 * déjà les montants ». C'est vrai d'un module de réassurance. Celui-ci n'en est pas un.
 *
 * Le héros AFFIRME : « Aujourd'hui, ils trouvent tes concurrents. » Cet encart le PROUVE.
 * Les séparer de quatre écrans laissait l'affirmation sans appui au moment exact où elle
 * est faite, et faisait traverser cinq montants à un commerçant dont l'enjeu n'avait pas
 * encore été établi. Il est donc devenu l'aside du premier écran : une interaction qui ne
 * demande aucune donnée personnelle, et qui se termine chez Google.
 *
 * Il n'a plus de titre de section (`<h2>`) : il ne fait plus concurrence au titre de la
 * page, il l'appuie. Sa structure est celle de l'encart qu'il remplace — sourcil, phrase
 * forte, corps, filet, note de bas de bloc.
 * ─────────────────────────────────────────────────────────────────────────────────────
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
    <GlassPanel level="hero" padding={26}>
      <SiteEyebrow style={{ margin: 0, color: 'var(--mm-teal-t)' }}>
        {t('proof.eyebrow')}
      </SiteEyebrow>
      <p className="m-0 mt-[9px] text-[17px] font-bold leading-[1.32]">{t('proof.title')}</p>
      <p className="m-0 mt-3 text-meta leading-[1.6] text-ink-2">{t('proof.text')}</p>

      {/*
        Les deux champs sont EMPILÉS, pas côte à côte. L'encart occupe désormais la colonne
        étroite du héros : la rangée de trois cellules du kit y écrasait les deux libellés.
      */}
      <form onSubmit={openMaps} className="mt-4 grid gap-3">
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
        {/*
          Le bouton disait « Voir ». Un bouton doit dire ce qui va se passer, et ce qui va
          se passer n'est pas une recherche : c'est un constat.
        */}
        <Button type="submit" tone="digitalise" fullWidth={false} disabled={!canSearch}>
          {t('proof.cta')}
        </Button>
      </form>

      <div className="my-[18px] h-px bg-[color:var(--border-hair)]" />
      <p className="m-0 text-meta-2 text-ink-2">{t('proof.note')}</p>
    </GlassPanel>
  );
}

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Search } from 'lucide-react';
import { universeThemes } from '../../lib/sectionThemes';

const theme = universeThemes.agency;

/**
 * Démonstration interactive : le commerçant tape son métier et son quartier,
 * on ouvre la vraie recherche Google Maps dans un onglet.
 *
 * C'est le meilleur argument de la page et il ne coûte rien : personne ne conteste
 * ce qu'il voit de ses propres yeux. Placé AVANT tout prix, délibérément.
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

  const inputCls = `w-full px-3.5 py-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 ${theme.focusRing}`;

  return (
    <div className="rounded-3xl border border-lagoon-200 dark:border-lagoon-800 bg-lagoon-50 dark:bg-lagoon-900/20 p-7 sm:p-9">
      <div className="flex items-center gap-3 mb-4">
        <MapPin className={`w-6 h-6 shrink-0 ${theme.accentText}`} aria-hidden="true" />
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
          {t('proof.title')}
        </h2>
      </div>

      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6 max-w-2xl">
        {t('proof.text')}
      </p>

      <form onSubmit={openMaps} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <div className="space-y-1.5">
          <label htmlFor="maps-trade" className="block text-xs font-bold tracking-widest uppercase text-neutral-500">
            {t('proof.tradeLabel')}
          </label>
          <input
            id="maps-trade"
            value={trade}
            onChange={(e) => setTrade(e.target.value)}
            placeholder={t('proof.tradePlaceholder')}
            className={inputCls}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="maps-area" className="block text-xs font-bold tracking-widest uppercase text-neutral-500">
            {t('proof.areaLabel')}
          </label>
          <input
            id="maps-area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder={t('proof.areaPlaceholder')}
            className={inputCls}
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={!canSearch}
          className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${theme.buttonSolid}`}
        >
          <Search className="w-4 h-4" aria-hidden="true" />
          {t('proof.cta')}
        </button>
      </form>

      <p className={`text-sm font-semibold mt-6 ${theme.accentText}`}>
        {t('proof.note')}
      </p>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Icon, Num } from '@ds';
import LocalizedLink from '../../shared/LocalizedLink';
import { formatBytes, listKept, offlineSupported, type KeptResource } from '../../../lib/pwa/offline';

/**
 * « HORS CONNEXION » — carte de la maquette `Edu-Cours`, colonne de droite.
 *
 * Le poids est MESURÉ sur la réponse gardée (`listKept`), jamais estimé. `undefined` = pas
 * encore relevé : la carte dit qu'elle lit, elle n'annonce pas « rien » avant de savoir.
 * Libellés en props : la carte ne choisit pas de namespace.
 */
export interface OfflineCardLabels {
  title: string;
  reading: string;
  empty: string;
  onDevice: (count: number) => string;
  manage: string;
}

function keptName(url: string): string {
  try {
    const path = new URL(url, window.location.origin).pathname;
    return decodeURIComponent(path.split('/').filter(Boolean).pop() ?? path);
  } catch {
    return url;
  }
}

export default function OfflineCard({ labels }: { labels: OfflineCardLabels }) {
  const [kept, setKept] = useState<KeptResource[] | undefined>(undefined);
  const [asOf, setAsOf] = useState(() => new Date());

  useEffect(() => {
    let alive = true;
    const done = (list: KeptResource[]) => { if (alive) { setKept(list); setAsOf(new Date()); } };
    if (!offlineSupported()) { done([]); return; }
    listKept().then(done).catch(() => done([]));
    return () => { alive = false; };
  }, []);

  const total = (kept ?? []).reduce((n, k) => n + k.bytes, 0);

  return (
    <section className="mm-card">
      <div className="mb-[14px] flex items-center gap-[10px]">
        <h3>{labels.title}</h3>
        <LocalizedLink to="/mon-espace/hors-connexion" className="mm-more" aria-label={labels.manage}>
          <Icon name="download" size={15} />
        </LocalizedLink>
      </div>
      {kept === undefined ? (
        <p className="m-0 text-ink-3" style={{ fontSize: '13.5px' }}>{labels.reading}</p>
      ) : kept.length === 0 ? (
        <p className="m-0 text-ink-2" style={{ fontSize: '13.5px', lineHeight: 1.5 }}>{labels.empty}</p>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <b style={{ fontSize: '30px' }}><Num value={formatBytes(total)} source="db" asOf={asOf} /></b>
            <span className="text-ink-2" style={{ fontSize: '13px' }}>{labels.onDevice(kept.length)}</span>
          </div>
          <div className="mt-[14px] flex flex-col gap-[6px]">
            {kept.slice(0, 4).map((k) => (
              <div key={k.url} className="flex items-center justify-between gap-3 rounded-m" style={{ padding: '10px 12px', background: 'var(--paper-2)', fontSize: '13.5px' }}>
                <span className="min-w-0 truncate">{keptName(k.url)}</span>
                <span className="text-ink-2" style={{ fontSize: '12px' }}><Num value={formatBytes(k.bytes)} source="db" asOf={asOf} /></span>
              </div>
            ))}
          </div>
        </>
      )}
      <LocalizedLink to="/mon-espace/hors-connexion" className="mm-btn is-sm is-quiet mt-[14px] w-full justify-center">
        {labels.manage}
      </LocalizedLink>
    </section>
  );
}

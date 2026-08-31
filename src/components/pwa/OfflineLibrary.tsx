import { useCallback, useEffect, useState } from 'react';
import { Button, EmptyState, Icon, Num, Skeleton } from '@ds';
import { formatBytes, forgetOffline, listKept, offlineSupported, type KeptResource } from '../../lib/pwa/offline';

/**
 * L'ÉCRAN HORS CONNEXION — le cœur de la version installable.
 *
 * Le seul argument d'installation qui vaille sur ce marché, c'est le forfait et le réseau.
 * Pas la vitesse, pas les notifications. Cet écran est donc l'endroit où cette promesse se
 * VÉRIFIE : on y voit ce qui est réellement gardé, et ce que ça occupe.
 *
 * CHAQUE RESSOURCE PORTE SON POIDS, EN MONOSPACE. Ce n'est pas une coquetterie de mise en
 * page : c'est la règle 6 appliquée à l'endroit où elle sert le plus. Quelqu'un qui décide
 * s'il peut se permettre de garder trois leçons de plus a besoin d'un nombre mesuré, pas
 * d'une estimation. Le poids vient de la réponse mise en cache elle-même — le service worker
 * le tamponne au moment où il l'enregistre.
 *
 * ET « OUBLIER » EST TOUJOURS EN FACE DE « GARDER ». Proposer de remplir l'espace de
 * quelqu'un sans proposer de le libérer, c'est décider à sa place.
 */
export default function OfflineLibrary() {
  const [kept, setKept] = useState<KeptResource[] | null>(null);
  const [asOf, setAsOf] = useState<Date>(() => new Date());

  const refresh = useCallback(async () => {
    setKept(await listKept());
    setAsOf(new Date());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // L'appareil ne sait pas faire : on le DIT, au lieu d'afficher une liste vide qui laisserait
  // croire que rien n'a été gardé.
  if (!offlineSupported()) {
    return (
      <EmptyState
        glyph={<Icon name="alert" size={26} />}
        title="Ton navigateur ne sait pas garder hors connexion."
        body="Cette fonction demande un navigateur récent, et elle ne marche pas en navigation privée. Tes leçons restent accessibles en ligne, comme d'habitude."
      />
    );
  }

  if (kept === null) {
    // Un squelette À LA FORME du contenu attendu, pour que rien ne saute quand il arrive.
    // Jamais un rond qui tourne : il ne dit ni ce qui se passe, ni combien de temps.
    return (
      <div style={{ display: 'grid', gap: 'var(--sp-10)' }}>
        {[0, 1, 2].map((i) => <Skeleton key={i} height={62} radius="var(--r-m)" label="Chargement de tes leçons gardées" />)}
      </div>
    );
  }

  if (kept.length === 0) {
    return (
      <EmptyState
        glyph={<Icon name="download" size={26} />}
        title="Rien de gardé pour l'instant."
        body="Sur une leçon, « Garder hors connexion » la télécharge une fois. Tu peux la relire ensuite sans réseau et sans consommer ton forfait."
      />
    );
  }

  const total = kept.reduce((n, r) => n + r.bytes, 0);

  return (
    <section>
      <header
        className="glass-flat"
        style={{ padding: 'var(--pad-panel)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--sp-12)' }}
      >
        <div>
          <p className="mm-eyebrow" style={{ margin: 0 }}>Gardé sur cet appareil</p>
          <p style={{ margin: 0, marginTop: '4px', fontSize: 'var(--fs-meta)', color: 'var(--text-muted)' }}>
            Relisible sans réseau, sans consommer ton forfait.
          </p>
        </div>
        <p style={{ margin: 0, fontSize: '20px' }}>
          <Num
            value={formatBytes(total)}
            source={{ cite: 'mesuré sur les réponses mises en cache' }}
            asOf={asOf}
          />
        </p>
      </header>

      <ul style={{ listStyle: 'none', margin: 0, marginTop: 'var(--sp-12)', padding: 0, display: 'grid', gap: 'var(--sp-8)' }}>
        {kept.map((r) => (
          <li
            key={r.url}
            className="glass-flat"
            style={{ padding: 'var(--sp-14) var(--pad-panel)', display: 'flex', alignItems: 'center', gap: 'var(--sp-12)' }}
          >
            <span aria-hidden="true" style={{ color: 'var(--mm-bleu)', flex: '0 0 auto' }}>
              <Icon name="book" size={18} />
            </span>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--fs-meta)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {decodeURIComponent(r.url.split('/').pop() ?? r.url)}
              </p>
              {/* --text-muted, jamais --text-faint : l'encre tertiaire ne porte pas de texte. */}
              <p style={{ margin: 0, marginTop: '2px', fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>
                <Num value={formatBytes(r.bytes)} source={{ cite: 'mesuré sur la réponse' }} asOf={r.cachedAt} />
                {' · gardée le '}
                {r.cachedAt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
              </p>
            </div>

            <Button
              tone="quiet"
              size="sm"
              onClick={() => {
                forgetOffline(r.url);
                // On relit le cache plutôt que de retirer la ligne d'office : l'écran affiche
                // ce qui EST gardé, pas ce qu'on vient de demander.
                setTimeout(() => void refresh(), 150);
              }}
            >
              Oublier
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

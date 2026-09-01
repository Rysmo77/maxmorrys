import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, GlassPanel, Icon, LessonRow, Num, Skeleton, Switch, Tag } from '@ds';
import { useAuth } from '../../contexts/AuthContext';
import { tutorName } from '../../lib/naming';
import {
  connectionKind,
  formatBytes,
  forgetOffline,
  listKept,
  offlineSupported,
  outboxAge,
  outboxReplayReady,
  readOutbox,
  setWifiOnly,
  wifiOnly,
  wifiOnlyEnforceable,
  type ConnectionKind,
  type KeptResource,
  type OutboxEntry,
  type OutboxKind,
} from '../../lib/pwa/offline';

/**
 * L'ÉCRAN HORS CONNEXION — le cœur de la version installable.
 *
 * Le seul argument d'installation qui vaille sur ce marché, c'est le forfait et le réseau.
 * Pas la vitesse, pas les notifications. Cet écran est donc l'endroit où cette promesse se
 * VÉRIFIE : on y voit ce qui est réellement gardé, ce que ça occupe, ce qui ne marchera pas
 * sans réseau, et ce qui attend de partir.
 *
 * CHAQUE RESSOURCE PORTE SON POIDS, EN MONOSPACE. Ce n'est pas une coquetterie de mise en
 * page : c'est la règle 6 appliquée à l'endroit où elle sert le plus. Quelqu'un qui décide
 * s'il peut se permettre de garder trois leçons de plus a besoin d'un nombre mesuré, pas
 * d'une estimation. Le poids vient de la réponse mise en cache elle-même — le service worker
 * le tamponne au moment où il l'enregistre.
 *
 * ET « OUBLIER » EST TOUJOURS EN FACE DE « GARDER ». Proposer de remplir l'espace de
 * quelqu'un sans proposer de le libérer, c'est décider à sa place.
 *
 * LES QUATRE BLOCS, ET POURQUOI AUCUN N'EST FACULTATIF :
 *
 *   1. CE QUI EST GARDÉ, avec son poids mesuré.
 *   2. CE QUI NE MARCHE PAS SANS RÉSEAU — le répétiteur, le paiement. Ça coûte deux lignes,
 *      et ça évite de découvrir l'indisponibilité en la heurtant.
 *   3. « TÉLÉCHARGER EN WI-FI SEULEMENT ». Sur ce marché, ce réglage est de l'argent, pas du
 *      confort. Il ne prétend jamais tenir ce qu'il ne peut pas tenir — voir plus bas.
 *   4. LA FILE D'ENVOI. Ce qui a été fait hors réseau. Elle vit dans `localStorage`, donc
 *      elle survit au rechargement, c'est-à-dire exactement au moment où elle sert.
 *
 * TOUT SAUF LE PREMIER RESTE À L'ÉCRAN QUAND RIEN N'EST GARDÉ. Un état vide qui remplace la
 * page entière cacherait la file au moment précis où elle est la seule chose qui compte.
 */

/** Le glyphe de chaque geste en file. Trois gestes nommés, pas un quatrième inventé. */
const QUEUE_GLYPH: Record<OutboxKind, 'check' | 'comment' | 'bookmark'> = {
  'lesson-done': 'check',
  note: 'comment',
  bookmark: 'bookmark',
};

export default function OfflineLibrary() {
  const { t } = useTranslation('shared');
  const { userData } = useAuth();
  const [kept, setKept] = useState<KeptResource[] | null>(null);
  const [outbox, setOutbox] = useState<OutboxEntry[]>([]);
  const [asOf, setAsOf] = useState<Date>(() => new Date());
  const [wifi, setWifi] = useState<boolean>(() => wifiOnly());
  const [link, setLink] = useState<ConnectionKind>(() => connectionKind());

  const refresh = useCallback(async () => {
    setKept(await listKept());
    setOutbox(readOutbox());
    setLink(connectionKind());
    setAsOf(new Date());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Le réseau qui revient change TOUT sur cet écran : ce que le réglage Wi-Fi peut retenir, et
  // ce que la file a encore à faire. Le relevé se refait donc, plutôt que de vieillir sous les
  // yeux de quelqu'un qui vient précisément de retrouver du réseau.
  useEffect(() => {
    const again = () => { void refresh(); };
    window.addEventListener('online', again);
    window.addEventListener('offline', again);
    return () => {
      window.removeEventListener('online', again);
      window.removeEventListener('offline', again);
    };
  }, [refresh]);

  // L'appareil ne sait pas faire : on le DIT, au lieu d'afficher une liste vide qui laisserait
  // croire que rien n'a été gardé.
  if (!offlineSupported()) {
    return (
      <EmptyState
        glyph={<Icon name="alert" size={26} />}
        title={t('pwa.offline.unsupported')}
        body={t('pwa.offline.unsupportedBody')}
      />
    );
  }

  if (kept === null) {
    // Un squelette À LA FORME du contenu attendu, pour que rien ne saute quand il arrive.
    // Jamais un rond qui tourne : il ne dit ni ce qui se passe, ni combien de temps.
    return (
      <div style={{ display: 'grid', gap: 'var(--sp-10)' }}>
        {[0, 1, 2].map((i) => <Skeleton key={i} height={62} radius="var(--r-m)" label={t('pwa.offline.loading')} />)}
      </div>
    );
  }

  const total = kept.reduce((n, r) => n + r.bytes, 0);
  const tutor = tutorName(userData);

  /*
   * CE QUE L'INTERRUPTEUR PEUT VRAIMENT TENIR.
   *
   * Retenir un téléchargement demande de SAVOIR qu'on est en données mobiles, et seul
   * `navigator.connection.type` le dit — sur Chromium Android, donc sur le navigateur
   * majoritaire du marché, mais pas ailleurs. Là où le navigateur se tait, l'interrupteur est
   * posé `disabled` avec sa raison en toutes lettres : c'est l'usage que son propre contrat
   * décrit — « ce réglage existe mais ne fait rien encore » — et `aria-disabled` le laisse
   * atteignable au clavier pour que l'aveu s'entende aussi.
   */
  const enforceable = wifiOnlyEnforceable();

  /*
   * LA FILE, ET CE QU'ELLE PROMET.
   *
   * `outboxReplayReady()` dit si quelqu'un sait rejouer la file. Tant que personne ne le sait,
   * l'écran n'écrit PAS « elle part au retour du réseau, sans rien te demander » : ce serait
   * exactement le genre de promesse que cet écran existe pour ne pas faire. Il écrit ce qui est
   * vrai — les gestes sont gardés, ils survivent au rechargement, et il faut les refaire.
   */
  const replays = outboxReplayReady();
  const [agoBefore, agoAfter] = t('pwa.offline.ago').split('%s');

  return (
    <section style={{ display: 'grid', gap: 'var(--sp-22)' }}>
      {/* ── 1 · Ce qui est gardé ─────────────────────────────────────────── */}
      {kept.length === 0 ? (
        <EmptyState
          glyph={<Icon name="download" size={26} />}
          title={t('pwa.offline.empty')}
          body={t('pwa.offline.emptyBody')}
        />
      ) : (
        <div>
          <header
            className="glass-flat"
            style={{ padding: 'var(--pad-panel)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--sp-12)' }}
          >
            <div>
              <p className="mm-eyebrow" style={{ margin: 0 }}>{t('pwa.offline.kept')}</p>
              <p style={{ margin: 0, marginTop: '4px', fontSize: 'var(--fs-meta)', color: 'var(--text-muted)' }}>
                {t('pwa.offline.keptBody')}
              </p>
            </div>
            <p style={{ margin: 0, fontSize: '20px' }}>
              <Num
                value={formatBytes(total)}
                source={{ cite: t('pwa.offline.keptSource') }}
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
                    <Num value={formatBytes(r.bytes)} source={{ cite: t('pwa.offline.itemSource') }} asOf={r.cachedAt} />
                    {` · ${t('pwa.offline.keptOn')} `}
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
                  {t('pwa.offline.forget')}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── 2 · Ce qui ne marche pas sans réseau ─────────────────────────── */}
      <div>
        <p className="mm-eyebrow" style={{ margin: '0 0 var(--sp-10)' }}>{t('pwa.offline.unavailable')}</p>
        <GlassPanel level="flat" padding="6px 18px">
          {/* Le nom du répétiteur vient du profil, jamais d'une constante d'écran (AD-12). */}
          <LessonRow
            state="plain"
            icon={<Icon name="chat" size={14} color="var(--text-muted)" />}
            iconBackground="var(--fill-2)"
            title={<span style={{ color: 'var(--text-muted)' }}>{t('pwa.offline.unavailableTutor', { tutor })}</span>}
            meta={t('pwa.offline.needsNetwork')}
          />
          <LessonRow
            state="plain"
            icon={<Icon name="card" size={14} color="var(--text-muted)" />}
            iconBackground="var(--fill-2)"
            title={<span style={{ color: 'var(--text-muted)' }}>{t('pwa.offline.unavailablePayment')}</span>}
            meta={t('pwa.offline.needsNetwork')}
            last
          />
        </GlassPanel>
      </div>

      {/* ── 3 · Télécharger en Wi-Fi seulement ───────────────────────────── */}
      <GlassPanel level="flat" padding={18}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-12)' }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 'var(--fs-lede)', fontWeight: 600 }}>{t('pwa.offline.wifiOnly')}</p>
            <p style={{ margin: '2px 0 0', fontSize: 'var(--fs-meta-2)', color: 'var(--text-muted)' }}>
              {t('pwa.offline.wifiOnlyBody')}
            </p>
          </div>
          <Switch
            on={wifi}
            label={t('pwa.offline.wifiOnly')}
            disabled={!enforceable}
            disabledReason={t('pwa.offline.wifiOnlyBlind')}
            onChange={(next) => {
              setWifiOnly(next);
              setWifi(next);
            }}
          />
        </div>

        {/*
          CE QUE LE RÉGLAGE FAIT, MAINTENANT, SUR CE LIEN — pas ce qu'il ferait dans l'absolu.
          Les trois cas sont distincts et aucun n'est un repli de l'autre : sur données mobiles
          avec le réglage éteint, écrire « les téléchargements passent » serait vrai mais
          écrire « tu es en Wi-Fi » serait faux, et c'est la seule moitié qu'on retient.

          Quand le navigateur se tait, la ligne porte la raison VISIBLEMENT. Le composant la
          porte aussi en `aria-describedby` : la redite est assumée, parce qu'un interrupteur
          gris sans explication se lit comme une panne, pas comme un aveu.
        */}
        <p style={{ margin: 'var(--sp-10) 0 0', fontSize: 'var(--fs-small)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {!enforceable
            ? t('pwa.offline.wifiOnlyBlind')
            : link !== 'cellular'
              ? t('pwa.offline.wifiOnlyPassing')
              : wifi
                ? t('pwa.offline.wifiOnlyHolding')
                : t('pwa.offline.wifiOnlySpending')}
        </p>
      </GlassPanel>

      {/* ── 4 · En attente d'envoi ───────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 'var(--sp-12)', marginBottom: 'var(--sp-10)' }}>
          <p className="mm-eyebrow" style={{ margin: 0 }}>{t('pwa.offline.queue')}</p>
          {/* Un zéro daté EST une information : « rien ne traîne » se lit ici, et nulle part ailleurs. */}
          <p style={{ margin: 0, fontSize: 'var(--fs-small)' }}>
            <Num
              value={outbox.length}
              unit={t('pwa.offline.queueUnit', { count: outbox.length })}
              source={{ cite: t('pwa.offline.queueSource') }}
              asOf={asOf}
              showAsOf
            />
          </p>
        </div>

        {outbox.length === 0 ? (
          <GlassPanel level="flat" padding={18}>
            <p style={{ margin: 0, fontSize: 'var(--fs-meta-2)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {t('pwa.offline.queueEmptyBody')}
            </p>
          </GlassPanel>
        ) : (
          <GlassPanel level="flat" padding="6px 18px">
            {outbox.map((entry, i) => {
              // « il y a 12 min » est une MESURE, dérivée de l'instant de mise en file — d'où
              // le passage par <Num>, et non un mot posé à côté d'un chiffre inventé.
              const age = outboxAge(entry.queuedAt, asOf.getTime());
              const unit = age.unit === 'minutes'
                ? t('pwa.offline.unitMinutes')
                : age.unit === 'hours'
                  ? t('pwa.offline.unitHours')
                  : t('pwa.offline.unitDays');
              return (
                <LessonRow
                  key={entry.id}
                  state="plain"
                  icon={<Icon name={QUEUE_GLYPH[entry.kind]} size={13} color="var(--warn)" />}
                  iconBackground="color-mix(in srgb, var(--mm-orange) 18%, transparent)"
                  title={entry.label}
                  meta={(
                    <>
                      {agoBefore}
                      <Num
                        value={age.value}
                        unit={unit}
                        source={{ cite: t('pwa.offline.ageSource') }}
                        asOf={asOf}
                      />
                      {agoAfter ?? ''}
                    </>
                  )}
                  trailing={<Tag tone="warn">{t('pwa.offline.queued')}</Tag>}
                  last={i === outbox.length - 1}
                />
              );
            })}
          </GlassPanel>
        )}

        {/*
          Cette phrase ne s'affiche QUE s'il y a une file. Sur une file vide, `queueEmptyBody`
          dit déjà tout, et expliquer comment repartira une file qui n'existe pas ferait
          chercher un problème là où il n'y en a pas.
        */}
        {outbox.length > 0 && (
          <p style={{ margin: 'var(--sp-14) 0 0', fontSize: 'var(--fs-small)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {replays ? t('pwa.offline.queueBody') : t('pwa.offline.queueBodyLocal')}
          </p>
        )}
      </div>
    </section>
  );
}

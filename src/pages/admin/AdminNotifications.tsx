import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, DocLine, EmptyState, GlassPanel, Icon, type IconName, LessonRow, Skeleton, StatTile, Tag, useToast } from '@ds';
import { ConsolePage, ConsoleFilter, ConsoleList, ConsoleScope } from '../../components/console';
import { SiteEyebrow } from '../../components/site';
import { Pagination } from '@/components/dialogs';
import { useAuth } from '../../contexts/AuthContext';
import { useFormat } from '../../hooks/useFormat';
import { usePagination } from '../../hooks/usePagination';
import { getUserNotifications, markNotificationRead } from '../../lib/firestore';
import type { AppNotification, NotificationType } from '../../types';

/**
 * ── NOTIFICATIONS — le dix-neuvième écran de console ────────────────────────────────
 *
 * Son pipeline est celui que le kit lui donne, mot pour mot : `tout · envoyées ·
 * planifiées` (`screens-motif.jsx` § PipelinesRestants). Les trois zones du motif dans
 * l'ordre : filtre par STATUT, liste dense à une action par ligne, pied qui nomme les
 * angles morts.
 *
 * ─── L'ÉTAPE « PLANIFIÉES » N'A AUCUN CONTENU POSSIBLE, ET L'ÉCRAN LE DIT ─────────────
 *
 * C'est le fait qui gouverne tout le reste de ce fichier. Il n'existe dans ce produit NI
 * envoi NI planification depuis la console : `AppNotification` n'a pas de champ de date
 * d'envoi, aucune collection ne porte de file d'attente, et `createNotification()` — qui
 * existe pourtant dans `lib/firestore/notifications.ts` — n'a AUCUN appelant dans le
 * dépôt. L'étape reste dans le pipeline parce que le kit la fixe ; son compteur est un
 * VRAI zéro, dérivé d'une liste vide déclarée ici, jamais un chiffre posé à la main ni un
 * « — » qui laisserait croire à un chargement.
 *
 * La différence compte : un tiret cache l'écart entre « c'est zéro » et « je ne sais
 * pas ». Ici on sait, et on sait pourquoi.
 *
 * ─── « TOUT » ET « ENVOYÉES » COMPTENT LA MÊME CHOSE, ET C'EST EXACT ─────────────────
 *
 * Une notification n'existe en base qu'écrite par une fonction serveur, c'est-à-dire déjà
 * partie. Il n'y a donc pas d'autre état à distinguer, et le kit l'écrit lui-même :
 * `['tout 0','envoyées 0','planifiées 0']`. Les deux premières étapes ne sont pas un
 * doublon d'étourderie — elles disent que la file de sortie est vide par construction.
 *
 * ─── CE QUE LES RÈGLES FIRESTORE AUTORISENT, ET RIEN DE PLUS ─────────────────────────
 *
 *     match /notifications/{userId}/items/{notificationId} {
 *       allow read, update: if isOwner(userId);
 *       allow create:       if isAdmin();
 *       allow delete:       if isOwner(userId) || isAdmin();
 *     }
 *
 * La lecture est réservée au DESTINATAIRE : un administrateur n'a aucun droit de lecture
 * sur la boîte d'un tiers, et aucune règle de groupe de collections (`{path=**}/items`)
 * n'existe pour qu'une requête inter-comptes soit seulement recevable. L'écran lit donc
 * la seule boîte qu'il ait le droit de lire — celle du compte connecté — par
 * `getUserNotifications()`, la même fonction que le centre applicatif de l'apprenant.
 * Prétendre montrer « toutes les notifications de la plateforme » aurait produit un écran
 * vide en permission-denied, et un opérateur qui croit surveiller un canal qu'il ne voit
 * pas est plus mal loti que celui qui sait ne pas le voir. Le pied le dit.
 * ────────────────────────────────────────────────────────────────────────────────────
 */

/**
 * La lecture est BORNÉE, et la borne s'affiche.
 *
 * `getUserNotifications` pose un `limit()` sur la requête : sans borne écrite ici, la case
 * « envoyées » afficherait un compte qui est en réalité celui de la page lue, présenté
 * comme un total. La valeur est donc citée dans le pied de la case — « les cent dernières
 * au maximum » —, ce qui la rend vraie quel que soit le volume réel.
 */
const READ_LIMIT = 100;

/** Les trois étapes du kit, dans son ordre : `tout · envoyées · planifiées`. */
type Stage = 'all' | 'sent' | 'scheduled';

/**
 * LA FILE DE PLANIFICATION, EN TOUTES LETTRES : ELLE EST VIDE.
 *
 * Ce tableau n'est pas un bouche-trou en attendant une requête. C'est la façon d'écrire un
 * zéro qui vient d'un fait vérifiable — aucun champ de planification dans `AppNotification`,
 * aucun écrivain — plutôt que d'un littéral `0` posé dans le JSX, que rien ne rattacherait à
 * quoi que ce soit. Le jour où une file existera, elle remplacera cette constante et le
 * compteur suivra tout seul.
 */
const SCHEDULED: readonly AppNotification[] = [];

/** Le glyphe dit le territoire de la notification. Aucun emoji : les glyphes viennent d'<Icon>. */
const GLYPH: Record<NotificationType, IconName> = {
  enrollment: 'book',
  certificate: 'star',
  content: 'doc',
  club: 'users',
  system: 'info',
};

/**
 * La couleur dit le territoire, pas l'urgence — la même table que le centre applicatif.
 * Aucune couleur en dur (AD-2) : les jetons `--mm-*` basculent seuls sous `.dk`, et la
 * console est nuit.
 */
const INK: Record<NotificationType, string> = {
  enrollment: 'var(--mm-bleu)',
  certificate: 'var(--mm-bleu)',
  content: 'var(--mm-orange-t)',
  club: 'var(--mm-violet)',
  system: 'var(--ink-2)',
};

const chip = (ink: string) => `color-mix(in srgb, ${ink} 20%, transparent)`;

/**
 * Les chemins d'envoi RÉELS, relevés dans `functions/src/`. Ce ne sont pas des exemples :
 * ce sont les six seuls écrivains de `notifications/{userId}/items` du produit.
 */
const PATHS = ['enrollment', 'certificate', 'completion', 'streak', 'course', 'digest'] as const;

export default function AdminNotifications() {
  const { t } = useTranslation('admin');
  const { user } = useAuth();
  const { formatDate } = useFormat();
  const { addToast } = useToast();

  const [items, setItems] = useState<AppNotification[] | null>(null);
  /**
   * La date du relevé. Elle est posée AU RETOUR de la lecture, jamais au rendu : une case
   * de console porte la date de sa mesure, pas celle de son affichage. Tant qu'aucune
   * lecture n'a abouti elle vaut `null`, et aucune case ne s'affiche — une case sans date
   * dirait « non relevé », elle n'inventerait pas une date.
   */
  const [asOf, setAsOf] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<Stage>('all');

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setBusy(true);
    try {
      const data = await getUserNotifications(user.uid, READ_LIMIT);
      setItems(data);
      setAsOf(new Date());
    } catch {
      // Aucune date : `asOf` reste nul, et le bloc de relevé cède la place à un aveu.
      setItems([]);
      setAsOf(null);
    } finally {
      setBusy(false);
    }
  }, [user?.uid]);

  useEffect(() => { void load(); }, [load]);

  /**
   * L'unique action de ligne RELIT la base après avoir écrit.
   *
   * Corriger la liste en mémoire aurait suffi à l'œil, et aurait menti à la case : le
   * compte de non-lues aurait changé pendant que la date de relevé, elle, serait restée
   * celle de la lecture précédente. Un nombre et sa date doivent venir du même aller-retour.
   */
  const markRead = async (n: AppNotification) => {
    if (!user?.uid) return;
    try {
      await markNotificationRead(user.uid, n.id);
      await load();
    } catch {
      addToast('error', t('notifications.toastMarkError'));
    }
  };

  const sent = items ?? [];
  const unread = sent.filter((n) => !n.read).length;

  const bar = useMemo(() => ([
    { key: 'all' as Stage, label: t('notifications.stages.all'), n: sent.length },
    { key: 'sent' as Stage, label: t('notifications.stages.sent'), n: sent.length },
    { key: 'scheduled' as Stage, label: t('notifications.stages.scheduled'), n: SCHEDULED.length },
  ].map((s) => ({ ...s, text: `${s.label} ${s.n}` }))), [sent.length, t]);

  const filtered: readonly AppNotification[] = stage === 'scheduled' ? SCHEDULED : sent;
  const { paged, page, totalPages, setPage } = usePagination([...filtered]);

  return (
    <ConsolePage title={t('notifications.title')} sub={t('notifications.consoleSub')}>
      {/* ── Zone 1 · le filtre par STATUT. Jamais par date : un opérateur unique cherche
             « ce qui attend », pas « ce qui s'est passé mardi ». ─────────────────────── */}
      <ConsoleFilter
        label={t('notifications.stagesLabel')}
        stages={bar.map((s) => s.text)}
        active={bar.find((s) => s.key === stage)?.text}
        onSelect={(text) => {
          const hit = bar.find((s) => s.text === text);
          if (hit) setStage(hit.key);
        }}
      />

      <div className="mt-[22px] flex items-baseline justify-between gap-3">
        <SiteEyebrow style={{ marginBottom: 0 }}>{t('notifications.readingEyebrow')}</SiteEyebrow>
        <Button size="sm" tone="quiet" onClick={() => { void load(); }} disabled={busy}>
          {t('notifications.refresh')}
        </Button>
      </div>

      {items === null ? (
        <div className="mt-2.5 grid gap-2.5 stack:grid-cols-2 wide:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={92} radius="var(--r-l)" label={t('notifications.loading')} />
          ))}
        </div>
      ) : asOf === null ? (
        /* Aucune lecture n'a abouti : on le DIT. Pas de case, donc pas de date inventée. */
        <GlassPanel level="night" padding={16} className="rv mt-2.5">
          <p className="m-0 text-meta font-bold text-ink">{t('notifications.readFailedTitle')}</p>
          <p className="m-0 mt-1 text-meta-2 leading-[1.5] text-ink-2">{t('notifications.readFailedBody')}</p>
        </GlassPanel>
      ) : (
        <>
          <div className="mt-2.5 grid gap-2.5 stack:grid-cols-2 wide:grid-cols-3">
            <StatTile
              label={t('notifications.tiles.sent')}
              value={sent.length}
              source="db"
              asOf={asOf}
              foot={t('notifications.tiles.sentFoot', { limit: READ_LIMIT })}
            />
            <StatTile
              label={t('notifications.tiles.unread')}
              value={unread}
              source="db"
              asOf={asOf}
              foot={t('notifications.tiles.unreadFoot')}
            />
            {/* Le zéro structurel. Sa source n'est pas la base — rien n'y représente une
                planification —, alors elle se cite : c'est ce que `{ cite }` sert à dire. */}
            <StatTile
              label={t('notifications.tiles.scheduled')}
              value={SCHEDULED.length}
              source={{ cite: t('notifications.tiles.scheduledCite') }}
              asOf={asOf}
              foot={t('notifications.tiles.scheduledFoot')}
            />
          </div>

          <p className="rv mt-3 text-small leading-[1.5] text-ink-2">{t('notifications.datedNote')}</p>
        </>
      )}

      {/* ── Zone 2 · la liste dense. UN état et UNE SEULE action par ligne : « deux actions
             par ligne, c'est une hésitation par ligne. » ────────────────────────────── */}
      <div className="mt-4">
        {items === null ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => <Skeleton key={i} height={56} radius="var(--r-m)" label={t('notifications.loading')} />)}
          </div>
        ) : filtered.length === 0 ? (
          <GlassPanel level="night" padding={8}>
            <EmptyState
              glyph={<Icon name={stage === 'scheduled' ? 'clock' : 'bell'} size={26} color="var(--text-muted)" />}
              title={stage === 'scheduled' ? t('notifications.empty.scheduledTitle') : t('notifications.empty.inboxTitle')}
              body={stage === 'scheduled' ? t('notifications.empty.scheduledBody') : t('notifications.empty.inboxBody')}
            />
          </GlassPanel>
        ) : (
          <ConsoleList label={t('notifications.listLabel')}>
            {paged.map((n, i) => (
              <li key={n.id}>
                <LessonRow
                  icon={<Icon name={GLYPH[n.type]} size={14} color={INK[n.type]} />}
                  iconBackground={chip(INK[n.type])}
                  title={n.title}
                  meta={`${t(`notifications.types.${n.type}`)} · ${formatDate(n.createdAt)}`}
                  trailing={n.read
                    ? <Tag tone="neutral">{t('notifications.tags.read')}</Tag>
                    : (
                      <Button size="sm" tone="quiet" onClick={() => { void markRead(n); }}>
                        {t('notifications.actions.markRead')}
                      </Button>
                    )}
                  last={i === paged.length - 1}
                />
              </li>
            ))}
          </ConsoleList>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Les six écrivains réels, nommés — pas devinés. Relevés dans `functions/src/`. */}
      <GlassPanel level="night" padding={18} className="rv mt-4">
        <SiteEyebrow style={{ marginBottom: '8px' }}>{t('notifications.paths.title')}</SiteEyebrow>
        {PATHS.map((p, i) => (
          <DocLine
            key={p}
            label={t(`notifications.paths.${p}.label`)}
            value={t(`notifications.paths.${p}.value`)}
            last={i === PATHS.length - 1}
          />
        ))}
        <p className="m-0 mt-3 text-meta-2 leading-[1.5] text-ink-2">{t('notifications.paths.note')}</p>
      </GlassPanel>

      {/* ── Zone 3 · le pied. « Le non-dit d'un écran d'administration finit toujours en
             manœuvre manuelle non tracée. » ──────────────────────────────────────────── */}
      <ConsoleScope>{t('notifications.scope')}</ConsoleScope>
    </ConsolePage>
  );
}

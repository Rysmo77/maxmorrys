import { useEffect, useState, type FormEvent } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, Num, Skeleton } from '@ds';
import RysmoStoreTab from '../tabs/RysmoStoreTab';
import RysmoMemoryTab from '../tabs/RysmoMemoryTab';
import { useAuth } from '../../../contexts/AuthContext';
import { tutorName } from '../../../lib/naming';
import { clearConversation, loadConversation, openRysmo, type RysmoMessage } from '../../../lib/rysmo/conversation';
import { useRysmoQuota } from '../../../components/edu/g4/useRysmoQuota';
import { EduCard, EduHead, EduPage } from '../../../components/edu/g4/EduParts';
import type { StudentLayoutContext } from '../../../components/layout/StudentLayout';

type RysmoSubTab = 'packs' | 'memoire' | null;

/**
 * RYSMO IA — maquette `Edu-Rysmo` (+ `-mobile`), passe 2 lot B.
 *
 * Trois colonnes au bureau, comme la maquette : les questions de la session, la
 * conversation, puis le quota, la mémoire et « ce que Rysmo IA ne fait pas ».
 *
 * ⚠️ LE MOTEUR RESTE UNIQUE. `RysmoWidget` (monté une fois dans `App.tsx`) tient le fil,
 * le quota et l'appel au modèle ; cette page LIT le fil (`loadConversation`, relu à
 * intervalle court) et ENVOIE par `openRysmo(question)`. Écrire un second moteur ici, c'est
 * deux fils à synchroniser et deux décomptes d'un quota qui n'existe qu'une fois, côté
 * serveur. Le fil vit dans le stockage de SESSION : la colonne de gauche ne prétend donc
 * pas à un historique — elle montre la conversation de cette session, et rien d'autre.
 *
 * Les packs et la mémoire gardent leurs écrans complets (`?tab=packs`, `?tab=memoire`,
 * cible des liens du tableau de bord), ouverts sous la grille.
 */
export default function RysmoPage() {
  const { t } = useTranslation('lms');
  const ctx = useOutletContext<StudentLayoutContext>();
  const { user, userData } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('tab');
  const sub: RysmoSubTab = raw === 'memoire' ? 'memoire' : raw === 'packs' || raw === 'tokens' ? 'packs' : null;

  const tutor = tutorName(userData);
  const uid = user?.uid;
  const { quota, asOf, loading } = useRysmoQuota(uid);
  const memoryOn = userData?.preferences?.aiMemoryConsent !== false;

  const [thread, setThread] = useState<RysmoMessage[]>(() => (uid ? loadConversation(uid) : []));
  const [draft, setDraft] = useState('');

  /* Le widget écrit le fil en stockage de session ; on le relit, sans second moteur. */
  useEffect(() => {
    if (!uid) return;
    const read = () => setThread(loadConversation(uid));
    read();
    const id = window.setInterval(read, 1500);
    window.addEventListener('focus', read);
    return () => { window.clearInterval(id); window.removeEventListener('focus', read); };
  }, [uid]);

  const ask = (question: string) => {
    const q = question.trim();
    if (!q) return;
    openRysmo(q);
    setDraft('');
  };
  const onSubmit = (e: FormEvent) => { e.preventDefault(); ask(draft); };
  const newQuestion = () => {
    if (uid) clearConversation(uid);
    setThread([]);
    openRysmo();
  };
  const openSub = (tab: Exclude<RysmoSubTab, null>) => setSearchParams({ tab }, { replace: true });

  const firstQuestion = thread.find((m) => m.role === 'user')?.content ?? '';
  const SUGGESTIONS = [t('rysmoPage.suggest1'), t('rysmoPage.suggest2'), t('rysmoPage.suggest3')];

  /* ── Colonne 1 : la session ─────────────────────────────────────────────── */
  const history = (
    <section className="mm-card hidden wide:block" style={{ padding: 12 }}>
      <button className="mm-btn is-sm is-quiet mb-2 w-full" type="button" onClick={newQuestion}>
        {t('rysmoPage.newQuestion')}
      </button>
      {thread.length > 0 ? (
        <div className="rounded-m px-[14px] py-[13px]" style={{ background: 'var(--mm-violet-c)' }}>
          <b className="block text-[14px] leading-[1.3]" style={{ overflowWrap: 'anywhere' }}>
            {firstQuestion.length > 70 ? `${firstQuestion.slice(0, 70)}…` : firstQuestion || t('rysmoPage.currentThread')}
          </b>
          <span className="text-[12px] text-ink-2">{t('rysmoPage.thisSession')}</span>
        </div>
      ) : (
        <p className="m-0 px-[14px] py-[13px] text-[13px] leading-[1.5] text-ink-2">{t('rysmoPage.historyEmpty')}</p>
      )}
    </section>
  );

  /* ── Colonne 2 : la conversation ────────────────────────────────────────── */
  const conversation = (
    <section className="mm-card flex flex-col gap-4 wide:min-h-[640px]" style={{ padding: 24 }}>
      <div className="flex items-center gap-[10px] border-b pb-[14px]" style={{ borderColor: 'var(--line)' }}>
        <b className="text-[16px]">{t('rysmoPage.conversation')}</b>
        <button type="button" className="mm-chip ml-auto" style={{ height: 30, fontSize: 12 }} onClick={() => openRysmo()}>
          {t('rysmoPage.openWindow')}
        </button>
      </div>
      {thread.length === 0 ? (
        <Bubble from="ai">{t('rysmoPage.greeting', { tutor })}</Bubble>
      ) : (
        thread.map((m, i) => <Bubble key={`${m.role}-${i}`} from={m.role === 'user' ? 'me' : 'ai'}>{m.content}</Bubble>)
      )}
      <div className="mm-chips" style={{ marginTop: 'auto' }}>
        {SUGGESTIONS.map((s) => (
          <button key={s} className="mm-chip" type="button" style={{ height: 34, fontSize: 12.5 }} onClick={() => ask(s)}>
            {s}
          </button>
        ))}
      </div>
      <form
        onSubmit={onSubmit}
        className="flex h-[58px] items-center gap-[10px] rounded-pill pl-5 pr-2"
        style={{ border: '1px solid var(--line)', background: 'var(--paper-2)' }}
      >
        <label className="sr-only" htmlFor="rysmo-ask">{t('rysmoPage.askLabel', { tutor })}</label>
        <input
          id="rysmo-ask"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('rysmoPage.askLabel', { tutor })}
          className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-ink outline-none"
        />
        {quota && asOf && (
          <span className="whitespace-nowrap text-[12px] text-ink-3">
            <Num value={quota.dayRemaining} source="server" asOf={asOf} /> {t('rysmoPage.remaining', { count: quota.dayRemaining })}
          </span>
        )}
        <button
          className="mm-iconbtn"
          type="submit"
          aria-label={t('rysmoPage.send', { tutor })}
          disabled={!draft.trim()}
          style={{ width: 44, height: 44, background: 'var(--mm-violet-f)', color: 'var(--paper-fixed)', border: 0 }}
        >
          <Icon name="send" size={17} />
        </button>
      </form>
    </section>
  );

  /* ── Colonne 3 : quota, mémoire, limites ────────────────────────────────── */
  const aside = (
    <div className="flex flex-col gap-5">
      <EduCard title={t('rysmoPage.quotaTitle')}>
        {loading ? (
          <Skeleton height={60} radius="var(--r-m)" label={t('rysmoPage.quotaTitle')} />
        ) : quota && asOf ? (
          <>
            <div className="flex items-baseline gap-2">
              <Num value={quota.dayRemaining} source="server" asOf={asOf} style={{ fontSize: 40, letterSpacing: '-.05em', fontWeight: 600 }} />
              <span className="text-ink-2">
                / <Num value={quota.dailyLimit} source="server" asOf={asOf} /> {t('rysmoPage.today')}
              </span>
            </div>
            {quota.dailyLimit > 0 && quota.dailyLimit <= 10 && (
              <span className="mm-quota my-3" aria-hidden="true">
                {Array.from({ length: quota.dailyLimit }, (_, i) => (
                  <i key={i} className={i < quota.dayRemaining ? 'on' : undefined} style={{ ['--i' as string]: i, width: '100%' }} />
                ))}
              </span>
            )}
            {quota.packBalance > 0 && (
              <p className="m-0 mt-2 text-[13px] text-ink-2">
                {t('rysmoPage.packBalance')} : <Num value={quota.packBalance} source="server" asOf={asOf} />
              </p>
            )}
          </>
        ) : (
          <p className="m-0 text-[13px] text-ink-2">{t('rysmoPage.quotaUnknown')}</p>
        )}
        <p className="m-0 mt-2 text-[13px] text-ink-2">{t('rysmoPage.quotaNote')}</p>
        <button
          type="button"
          onClick={() => openSub('packs')}
          className="mt-4 flex w-full items-center justify-between rounded-m border-0 p-[14px] text-left text-ink"
          style={{ background: 'var(--paper-2)', cursor: 'pointer' }}
        >
          <span>
            <b className="block text-[14px]">{t('rysmoPage.packsTitle')}</b>
            <span className="text-[12.5px] text-ink-2">{t('rysmoPage.packsBody')}</span>
          </span>
          <Icon name="chevron-right" size={18} />
        </button>
      </EduCard>
      <EduCard title={t('rysmoPage.memoryTitle', { tutor })}>
        <p className="m-0 mb-[14px] text-[13.5px] text-ink-2">{t('rysmoPage.memoryBody', { tutor })}</p>
        <div className="flex items-center justify-between">
          <span className="mm-tag">{memoryOn ? t('rysmoPage.memoryOn') : t('rysmoPage.memoryOff')}</span>
          <button className="mm-btn is-sm is-quiet" type="button" onClick={() => openSub('memoire')}>{t('rysmoPage.memoryManage')}</button>
        </div>
      </EduCard>
      <EduCard style={{ background: 'var(--paper-2)' }}>
        <h3 style={{ fontSize: 16 }}>{t('rysmoPage.limitsTitle', { tutor })}</h3>
        <ul className="m-0 mt-[10px] flex flex-col gap-[6px] pl-[18px] text-[13.5px] text-ink-2">
          <li>{t('rysmoPage.limit1')}</li>
          <li>{t('rysmoPage.limit2')}</li>
          <li>{t('rysmoPage.limit3')}</li>
        </ul>
      </EduCard>
    </div>
  );

  return (
    <EduPage>
      <EduHead eyebrow={t('rysmoPage.eyebrow')} title={tutor} />
      <div className="grid grid-cols-1 items-start gap-5 wide:[grid-template-columns:270px_minmax(0,1fr)_320px]">
        {history}
        {conversation}
        {aside}
      </div>

      {sub && (
        <section className="mt-8" aria-label={sub === 'memoire' ? t('rysmoPage.tabMemory') : t('rysmoPage.tabTokens')}>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="mm-d m-0 text-[28px]">{sub === 'memoire' ? t('rysmoPage.tabMemory') : t('rysmoPage.tabTokens')}</h2>
            <button type="button" className="mm-chip ml-auto" onClick={() => setSearchParams({}, { replace: true })}>
              <Icon name="close" size={14} /> {t('rysmoPage.closeSection')}
            </button>
          </div>
          {sub === 'memoire' ? <RysmoMemoryTab enrolledFormations={ctx.enrolledFormations} /> : <RysmoStoreTab />}
        </section>
      )}
    </EduPage>
  );
}

interface BubbleProps {
  from: 'me' | 'ai';
  children: string;
}

/** Les bulles de la maquette : encre à droite pour toi, carte à gauche pour l'assistant. */
function Bubble({ from, children }: BubbleProps) {
  if (from === 'me') {
    return (
      <div
        className="self-end whitespace-pre-wrap text-[15px] leading-[1.5]"
        style={{ maxWidth: '70%', padding: '14px 18px', borderRadius: '20px 20px 6px 20px', background: 'var(--ink-fixed)', color: 'var(--paper-fixed)' }}
      >
        {children}
      </div>
    );
  }
  return (
    <div className="flex gap-[10px]" style={{ maxWidth: 'calc(70% + 40px)' }}>
      <span
        aria-hidden="true"
        className="grid h-[34px] w-[34px] flex-none place-items-center rounded-m"
        style={{ background: 'linear-gradient(135deg, var(--mm-violet-f), var(--mm-violet-n))', color: 'var(--paper-fixed)' }}
      >
        <Icon name="sparkles" size={16} />
      </span>
      <div
        className="whitespace-pre-wrap text-[15px] leading-[1.55]"
        style={{ padding: '14px 18px', borderRadius: '20px 20px 20px 6px', background: 'var(--bento)', border: '1px solid var(--line)' }}
      >
        {children}
      </div>
    </div>
  );
}

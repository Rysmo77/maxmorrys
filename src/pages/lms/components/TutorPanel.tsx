import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { Button, ChatBubble, Field, GlassPanel, Icon, IconButton, Num, QuotaMeter, Skeleton } from '@ds';
import { functions } from '../../../config/firebase';
import { captureError } from '../../../lib/sentry';
import { useAuth } from '../../../contexts/AuthContext';
import { useLocalizedPath } from '../../../contexts/LanguageContext';
import { tutorName } from '../../../lib/naming';
import { loadConversation, openRysmo } from '../../../lib/rysmo/conversation';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE RÉPÉTITEUR EN PANNEAU PERMANENT — troisième colonne de l'espace apprenant.
 *
 * `handoff_tableaux_de_bord/README.md` § 1 : « Le seul gain réel de la largeur : le
 * répétiteur passe d'une carte qu'on ouvre à un panneau permanent, quota visible en
 * continu. Le quota est affiché AVANT l'usage, jamais au moment du refus — un refus
 * au-delà du plafond est vécu comme une panne s'il n'a pas été annoncé. »
 *
 * C'est la phrase qui justifie ce composant. Tout le reste en découle.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI CHANGE PAR RAPPORT AU COMMENTAIRE DE `DashboardTab`
 *
 * `DashboardTab` documentait avoir ÉCARTÉ le compteur de quota : « l'ajouter serait
 * un second aller-retour serveur au chargement du tableau de bord ». Le raisonnement
 * était juste pour une carte d'entrée en 390 px — le quota y aurait coûté un appel
 * pour une information qu'on allait de toute façon lire sur l'écran suivant.
 *
 * Il ne tient plus pour un panneau permanent : ici, il n'y a PAS d'écran suivant.
 * Le quota n'est plus une redondance, c'est la seule annonce avant l'usage.
 *
 * L'objection de coût est traitée autrement : ce composant n'est monté qu'au-delà de
 * 1080 px, par `useMediaQuery` et non par une classe `hidden` — une classe cache mais
 * ne démonte pas, et l'appel partirait quand même sur mobile. Le téléphone garde donc
 * exactement le chargement qu'il avait.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TROIS RÈGLES QUE CE PANNEAU APPLIQUE
 *
 * · LE NOM DU RÉPÉTITEUR VIENT DU PROFIL. « Répétiteur » n'est qu'un défaut, et
 *   chaque personne peut le renommer. Un écran qui l'écrit en dur casse le renommage
 *   sans que rien ne le signale. `Rysmo` est le nom de l'APPLICATION, pas le sien.
 *
 * · UN RELEVÉ QUI ÉCHOUE SE DIT. Si `getRysmoQuota` tombe, le panneau ne rend pas un
 *   compteur vide — qui se lirait « zéro question restante » — mais une phrase qui
 *   dit que le quota n'a pas pu être relevé.
 *
 * · LA CONVERSATION N'EST PAS DUPLIQUÉE. `RysmoWidget` est le seul moteur de dialogue
 *   du produit, monté une fois dans `App.tsx`. Ce panneau LIT le fil et le relance ;
 *   il n'en tient pas un second. Écrire ici ouvre le widget avec la question déjà
 *   saisie — d'où `openRysmo`, et non un second appel au modèle.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

interface QuotaSnapshot {
  dailyLimit: number;
  dayCount: number;
  dayRemaining: number;
  packBalance: number;
  plan: 'lite' | 'pro' | null;
  hasActiveSubscription: boolean;
  hasClubBonus: boolean;
}

const getRysmoQuota = httpsCallable<Record<string, never>, QuotaSnapshot>(functions, 'getRysmoQuota');

/** Les deux derniers tours du fil. Au-delà, le panneau devient une conversation. */
const SHOWN_MESSAGES = 3;

export default function TutorPanel() {
  const { t } = useTranslation('lmsTabs');
  const navigate = useNavigate();
  const path = useLocalizedPath();
  const { user, userData } = useAuth();
  const tutor = tutorName(userData);

  const [quota, setQuota] = useState<QuotaSnapshot | null>(null);
  /** La date du relevé : celle de la RÉPONSE, pas celle du rendu. */
  const [quotaAsOf, setQuotaAsOf] = useState<Date | null>(null);
  const [loadingQuota, setLoadingQuota] = useState(true);
  const [draft, setDraft] = useState('');

  const loadQuota = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getRysmoQuota({});
      setQuota(res.data);
      setQuotaAsOf(new Date());
    } catch (error: unknown) {
      captureError(error, { context: 'TutorPanel getRysmoQuota' });
      setQuota(null);
      setQuotaAsOf(null);
    } finally {
      setLoadingQuota(false);
    }
  }, [user]);

  useEffect(() => { loadQuota(); }, [loadQuota]);

  /* Le fil est lu une fois au montage. Il vit en stockage de session : le relire à
     chaque rendu ferait un accès disque par frappe dans le champ. */
  const [thread, setThread] = useState(() => (user ? loadConversation(user.uid) : []));
  useEffect(() => {
    if (user) setThread(loadConversation(user.uid));
  }, [user]);

  const ask = () => {
    const question = draft.trim();
    if (!question) return;
    openRysmo(question);
    setDraft('');
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        {/* Le nom du répétiteur prend le dessin d'affichage, pas le rang de titre :
            `AppShell` porte déjà le <h1> de la page. */}
        <p className="m-0 font-display text-[19px] font-black leading-tight tracking-[-.035em] text-ink">
          {tutor}
        </p>
        <IconButton
          label={t('dashboard.tutorPanelMemory', { tutor })}
          onClick={() => navigate(path('/mon-espace/repetiteur?tab=memoire'))}
        >
          <Icon name="dots" size={17} strokeWidth={2} />
        </IconButton>
      </div>

      {/* ── Le quota, AVANT l'usage ─────────────────────────────────────────── */}
      {loadingQuota ? (
        <Skeleton height={34} radius="var(--r-m)" label={t('dashboard.tutorPanelQuotaLoading')} />
      ) : quota && quotaAsOf ? (
        <QuotaMeter
          used={quota.dayCount}
          total={quota.dailyLimit}
          source="server"
          asOf={quotaAsOf}
          label={t('dashboard.tutorPanelQuotaLabel')}
          suffix={t('dashboard.tutorPanelQuotaSuffix')}
        />
      ) : (
        <p className="m-0 text-meta-2 leading-[1.5]" style={{ color: 'var(--text-muted)' }}>
          {t('dashboard.tutorPanelQuotaUnknown')}
        </p>
      )}

      {/* ── Le fil, en lecture ──────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-2.5">
        {thread.length === 0 ? (
          <ChatBubble>{t('dashboard.tutorPanelGreeting', { tutor })}</ChatBubble>
        ) : (
          thread.slice(-SHOWN_MESSAGES).map((m, i) => (
            <div key={`${m.role}-${i}`} className={m.role === 'user' ? 'flex justify-end' : undefined}>
              <ChatBubble from={m.role === 'user' ? 'me' : 'ai'}>{m.content}</ChatBubble>
            </div>
          ))
        )}
      </div>

      {/* ── Ce qu'il reste, dit en toutes lettres ───────────────────────────── */}
      {quota && quotaAsOf && (
        <GlassPanel level="flat" padding={14}>
          <p className="m-0 text-meta-2 leading-[1.5]" style={{ color: 'var(--text-muted)' }}>
            {/* Le nombre passe par <Num> : c'est un relevé serveur, pas un compte local.
                La phrase est coupée autour de lui plutôt qu'interpolée — une chaîne
                traduite ne peut pas porter la provenance d'un chiffre. */}
            {t('dashboard.tutorPanelRemainingBefore')}{' '}
            <Num value={quota.dayRemaining} source="server" asOf={quotaAsOf} />{' '}
            {t('dashboard.tutorPanelRemainingAfter', { count: quota.dayRemaining })}
          </p>
        </GlassPanel>
      )}

      {/* ── Poser une question ──────────────────────────────────────────────── */}
      <div className="flex items-end gap-2.5">
        <div className="flex-1">
          <Field
            label={t('dashboard.tutorPanelPlaceholder')}
            hideLabel
            placeholder={t('dashboard.tutorPanelPlaceholder')}
            value={draft}
            onChange={setDraft}
            style={{ marginTop: 0 }}
          />
        </div>
        <Button
          tone="transforme"
          size="sm"
          fullWidth={false}
          onClick={ask}
          disabled={!draft.trim()}
          aria-label={t('dashboard.tutorPanelSend', { tutor })}
        >
          <Icon name="send" size={16} strokeWidth={2.6} />
        </Button>
      </div>
    </div>
  );
}

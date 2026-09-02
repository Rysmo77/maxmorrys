import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ChipRow, EmptyState, Field, GlassPanel, Icon, IconButton, Segmented, Tag, type IconName } from '@ds';
import MediaRecorderInput from '../../../components/lms/MediaRecorderInput';
import { SiteEyebrow, useReveal } from '../../../components/site';
import { useFormat } from '../../../hooks/useFormat';
import { submitTestimonial, deleteMyTestimonial } from '../../../lib/firestore';
import { addXP } from '../../../lib/gamification';
import { XP_REWARDS } from '../../../types/gamification';
import type { Testimonial } from '../../../types';
import type { EnrolledFormation } from '../hooks/useStudentData';

/**
 * L'ÉCRAN OÙ QUELQU'UN ÉCRIT SON PROPRE TÉMOIGNAGE.
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * LA FRONTIÈRE, ET DE QUEL CÔTÉ CET ÉCRAN TOMBE.
 *
 * Le système interdit le témoignage EN FAÇADE — « note en étoiles, nombre d'avis, témoignage,
 * logo client, rejoint par N personnes » (contrat de `TruthPanel`). Il n'interdit pas qu'une
 * personne RÉDIGE le sien dans son espace : ce qui est proscrit, c'est de s'en servir comme
 * preuve devant quelqu'un qui n'a pas encore décidé.
 *
 * D'où deux décisions opposées sur le même écran :
 *
 *   • LE FORMULAIRE RESTE, entier. Format, cible, média, texte, envoi, retrait tant que
 *     l'avis est en attente, XP à la soumission : rien n'est retiré.
 *   • LES ÉTOILES PARTENT — les cinq de la saisie ET les cinq de la relecture. Une note en
 *     étoiles est nommément un interdit absolu, « sans exception, quelle que soit la source ».
 *     La VALEUR, elle, reste : `rating` est écrit en base exactement comme avant, parce que
 *     `submitTestimonial` l'exige et que d'anciens enregistrements en portent. Ce n'est pas la
 *     donnée qu'on efface, c'est son rendu — la même règle que les emoji d'humeur du Club.
 *
 * La saisie passe donc par une `ChipRow` de 1 à 5, un vrai groupe de boutons à état annoncé,
 * là où les cinq étoiles étaient des `<button>` sans nom accessible ni valeur lue. La liste
 * des avis envoyés ne réaffiche PAS la note : ce que la personne a besoin d'y relire, c'est
 * son texte, son statut et sa date.
 *
 * ⚠️ OÙ VA LE TÉMOIGNAGE ENSUITE — signalé, hors de ce lot :
 * `pages/lms/tabs/club/ClubSubscriptionGate.tsx` (l. 116-143) lit `getApprovedTestimonials()`
 * et en affiche trois AVEC LEURS ÉTOILES, sous un titre de preuve sociale, sur le mur
 * d'abonnement du Club — c'est-à-dire devant quelqu'un qui n'a pas encore payé. C'est un
 * rendu en façade, et il subsiste. Il appartient au lot du Club.
 * ═════════════════════════════════════════════════════════════════════════════
 */

type Format = 'text' | 'audio' | 'video';
type TargetKind = 'platform' | 'mentor' | 'formation';

interface TestimonialsTabProps {
  userId?: string;
  displayName: string;
  photoURL?: string | null;
  enrolledFormations: EnrolledFormation[];
  myTestimonials: Testimonial[];
  setMyTestimonials: React.Dispatch<React.SetStateAction<Testimonial[]>>;
  loadingTestimonials: boolean;
  addToast: (type: 'success' | 'error', message: string) => void;
}

const FORMATS: { id: Format; labelKey: string }[] = [
  { id: 'text', labelKey: 'testimonials.formatText' },
  { id: 'audio', labelKey: 'testimonials.formatAudio' },
  { id: 'video', labelKey: 'testimonials.formatVideo' },
];

const TARGETS: { id: TargetKind; labelKey: string; glyph: IconName }[] = [
  { id: 'platform', labelKey: 'testimonials.targetPlatform', glyph: 'home' },
  { id: 'mentor', labelKey: 'testimonials.targetMentor', glyph: 'user' },
  { id: 'formation', labelKey: 'testimonials.targetFormation', glyph: 'book' },
];

const RATINGS = ['1', '2', '3', '4', '5'] as const;

const statusTone = (status?: string) => (status === 'approved' ? 'ok' : status === 'rejected' ? 'stop' : 'warn');

const statusLabelKey = (status?: string) =>
  status === 'approved' ? 'testimonials.statusApproved' : status === 'rejected' ? 'testimonials.statusRejected' : 'testimonials.statusPending';

export default function TestimonialsTab({
  userId, displayName, photoURL, enrolledFormations,
  myTestimonials, setMyTestimonials, loadingTestimonials, addToast,
}: TestimonialsTabProps) {
  const { t } = useTranslation('lmsTabs');
  const { formatDate } = useFormat();
  const reveal = useReveal<HTMLDivElement>();
  const [format, setFormat] = useState<Format>('text');
  const [targetKind, setTargetKind] = useState<TargetKind>('platform');
  const [formationId, setFormationId] = useState('');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const enrolledWithFormation = enrolledFormations.filter((ef) => ef.formation);
  const needsFormation = targetKind === 'formation';
  const mediaReady = format === 'text' || !!mediaUrl;
  const formationReady = !needsFormation || !!formationId;
  const canSubmit = !!userId && content.trim().length > 0 && mediaReady && formationReady && !submitting;

  const formatLabels = FORMATS.map((f) => t(f.labelKey));

  const resetForm = () => {
    setFormat('text'); setTargetKind('platform'); setFormationId('');
    setRating(5); setContent(''); setMediaUrl('');
  };

  const handleSubmit = async () => {
    if (!userId || !content.trim()) return;
    setSubmitting(true);
    try {
      let targetType: NonNullable<Testimonial['targetType']> = 'platform';
      let targetId: string | undefined;
      let targetLabel: string | undefined;
      if (targetKind === 'mentor') {
        targetType = 'mentor';
        targetLabel = 'Max-Morrys';
      } else if (targetKind === 'formation') {
        const ef = enrolledWithFormation.find((e) => e.formation?.id === formationId);
        targetType = 'formation';
        targetId = formationId;
        targetLabel = ef?.formation?.title;
      } else {
        targetLabel = t('testimonials.targetPlatform');
      }

      const id = await submitTestimonial({
        userId,
        name: displayName,
        avatar: photoURL || '',
        role: t('testimonials.roleStudent'),
        content: content.trim(),
        rating,
        mediaType: format,
        mediaUrl: mediaUrl || undefined,
        targetType,
        targetId,
        targetLabel,
      });

      // Le barème `submitTestimonial` existait sans être câblé : soumettre ne rapportait rien.
      // Accordé à la soumission, pas à l'approbation — c'est l'effort qui est récompensé.
      addXP(userId, XP_REWARDS.submitTestimonial).catch(() => null);

      const optimistic: Testimonial = {
        id,
        name: displayName,
        role: t('testimonials.roleStudent'),
        company: '',
        content: content.trim(),
        avatar: photoURL || '',
        rating,
        mediaType: format,
        mediaUrl: mediaUrl || undefined,
        targetType,
        targetId,
        targetLabel,
        featured: false,
        userId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      setMyTestimonials((prev) => [optimistic, ...prev]);
      resetForm();
      addToast('success', t('testimonials.toastSubmitSuccess'));
    } catch (error: unknown) {
      addToast('error', error instanceof Error ? error.message : t('testimonials.toastSubmitError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (testimonial: Testimonial) => {
    setMyTestimonials((prev) => prev.filter((x) => x.id !== testimonial.id));
    try {
      await deleteMyTestimonial(testimonial.id);
      addToast('success', t('testimonials.toastDeleted'));
    } catch {
      setMyTestimonials((prev) => [testimonial, ...prev]);
      addToast('error', t('testimonials.toastDeleteError'));
    }
  };


  /*
   * `.play` DOIT ÊTRE POSÉ ICI, ET RIEN NE LE POSAIT.
   *
   * `SiteEyebrow` rend `<p class="rv mm-eyebrow">`, et `.rv` vaut `opacity: 0` TANT QU'UN
   * ANCÊTRE NE PORTE PAS `.play`. Les pages publiques l'obtiennent de `PageSite`, les écrans
   * de compte de `AuthPage` — mais `AppShell`, la coquille de l'espace apprenant, n'appelle
   * `useReveal` nulle part. Sans ce déclencheur, chaque sourcil de cet onglet resterait
   * invisible, y compris pour qui a demandé moins de mouvement (le repli ramène les durées à
   * 1 ms, il ne rend pas `.rv` visible — c'est `useReveal` qui pose `.play` d'emblée).
   */
  /*
    ── DEUX COLONNES DE TRAVAIL, PAS UN PANNEAU ─────────────────────────────────────
    Même arbitrage que `ProfilDesktop` dans `handoff_tableaux_de_bord` : cet écran n'a
    aucun « contexte permanent » à afficher à côté — ce qu'on écrit et ce qu'on a déjà
    envoyé sont deux moitiés du MÊME travail, pas un travail et son cadre. Un panneau de
    340 px rempli pour ne pas rester vide est exactement ce que le README interdit.

    Ce que la largeur achète : voir ce qu'on a déjà envoyé PENDANT qu'on en écrit un
    autre. C'était impossible en une colonne — la liste vivait sous un formulaire de six
    hauteurs d'écran, donc on écrivait sans savoir si on se répétait.

    La colonne de saisie garde `max-w-2xl` : la règle d'élargissement ne s'étire pas.
  */
  return (
    <div ref={reveal} className="wide:grid wide:grid-cols-2 wide:items-start wide:gap-6">
      <div className="min-w-0 max-w-2xl">
      {/* ── Ce que tu écris ────────────────────────────────────────────────── */}
      <SiteEyebrow>{t('testimonials.shareTitle')}</SiteEyebrow>
      <GlassPanel level="flat" padding={18}>
        {/* Le format — trois options courtes, donc un `Segmented` : un vrai `radiogroup`
            annoncé « 1 sur 3 », que les flèches parcourent. */}
        <Segmented
          options={formatLabels}
          value={t(FORMATS.find((f) => f.id === format)!.labelKey)}
          onChange={(label) => {
            const found = FORMATS.find((f) => t(f.labelKey) === label);
            if (found) { setFormat(found.id); setMediaUrl(''); }
          }}
          label={t('testimonials.formatGroupLabel')}
        />

        {/* La cible. La ligne « une formation » reste désactivée tant qu'aucune inscription
            n'existe — et elle le DIT, plutôt que de disparaître sans explication. */}
        <SiteEyebrow style={{ marginTop: '18px' }}>{t('testimonials.aboutLabel')}</SiteEyebrow>
        <div role="group" aria-label={t('testimonials.targetGroupLabel')} className="grid grid-cols-1 stack:grid-cols-3 gap-2">
          {TARGETS.map((target) => {
            const disabled = target.id === 'formation' && enrolledWithFormation.length === 0;
            const on = targetKind === target.id;
            return (
              <button
                key={target.id}
                type="button"
                aria-pressed={on}
                aria-disabled={disabled || undefined}
                onClick={disabled ? undefined : () => setTargetKind(target.id)}
                className={`${disabled ? '' : 'mm-press '}mm-touch-extend inline-flex items-center gap-2`}
                style={{
                  padding: '11px 14px', borderRadius: 'var(--r-m)',
                  borderStyle: 'solid', borderWidth: '1.5px',
                  borderColor: on ? 'var(--ctl-sel-brd)' : 'var(--ctl-off-brd)',
                  background: on ? 'color-mix(in srgb, var(--mm-bleu) 8%, transparent)' : 'var(--ctl-off-bg)',
                  color: on ? 'var(--ink)' : 'var(--text-muted)',
                  fontFamily: 'var(--f-body)', fontSize: 'var(--fs-meta)', fontWeight: on ? 600 : 500,
                  cursor: disabled ? 'default' : 'pointer',
                  transition: 'transform var(--t-tap) var(--ease),background var(--t-ui) var(--ease),border-color var(--t-ui) var(--ease),color var(--t-ui) var(--ease)',
                }}
              >
                <Icon name={target.glyph} size={15} />
                {t(target.labelKey)}
              </button>
            );
          })}
        </div>

        {needsFormation && (
          <Field
            as="select"
            label={t('testimonials.targetFormation')}
            hideLabel
            value={formationId}
            onChange={setFormationId}
            placeholder={t('testimonials.chooseFormation')}
            options={enrolledWithFormation.map((ef) => ({ value: ef.formation!.id, label: ef.formation!.title }))}
          />
        )}

        {/*
          LA NOTE, SANS ÉTOILE. Cinq pilules 1 à 5, dans un groupe nommé. La valeur écrite en
          base est identique à celle d'avant ; c'est le glyphe qui disparaît, pas la donnée.
        */}
        <SiteEyebrow style={{ marginTop: '18px' }}>{t('testimonials.yourRating')}</SiteEyebrow>
        <ChipRow
          options={RATINGS}
          value={String(rating)}
          onChange={(v) => setRating(Number(v))}
          label={t('testimonials.ratingGroupLabel')}
          height={36}
        />

        {format !== 'text' && userId && (
          <div className="mt-[18px]">
            <SiteEyebrow>{format === 'video' ? t('testimonials.yourVideo') : t('testimonials.yourAudio')}</SiteEyebrow>
            <MediaRecorderInput mode={format} userId={userId} value={mediaUrl} onChange={setMediaUrl} />
          </div>
        )}

        <Field
          as="textarea"
          rows={4}
          maxLength={1000}
          label={format === 'text' ? t('testimonials.yourMessage') : t('testimonials.captionTranscript')}
          value={content}
          onChange={setContent}
          placeholder={format === 'text' ? t('testimonials.messagePlaceholder') : t('testimonials.captionPlaceholder')}
        />

        <div className="flex justify-end mt-4">
          <Button size="sm" onClick={() => void handleSubmit()} disabled={!canSubmit} loading={submitting}>
            <Icon name="send" size={15} color="var(--text-on-primary)" />
            {submitting ? t('testimonials.sending') : t('testimonials.submit')}
          </Button>
        </div>
      </GlassPanel>

      {/* Ce qui arrive au texte après l'envoi, dit avant qu'on le demande. */}
      <p className="text-small text-ink-2 mt-2">{t('testimonials.publishNote')}</p>

      </div>

      {/* La marge haute vit sur la COLONNE : `SiteEyebrow` réserve son `className` à la
          couleur, et son `style` en ligne battrait une classe responsive. */}
      <div className="mt-[22px] min-w-0 max-w-2xl wide:mt-0">
      {/* ── Ce que tu as envoyé ────────────────────────────────────────────── */}
      <SiteEyebrow>{t('testimonials.myReviews')}</SiteEyebrow>

      {loadingTestimonials ? (
        <GlassPanel level="flat" padding={18}>
          <div className="h-4 w-2/5 rounded-xs bg-[color:var(--fill-2)]" />
          <div className="h-4 w-4/5 rounded-xs bg-[color:var(--fill-2)] mt-3" />
        </GlassPanel>
      ) : myTestimonials.length === 0 ? (
        <GlassPanel level="flat" padding={18}>
          <EmptyState
            glyph={<Icon name="comment" size={26} color="var(--text-muted)" />}
            body={t('testimonials.emptyText')}
            style={{ padding: 0 }}
          />
        </GlassPanel>
      ) : (
        <div className="grid gap-2.5" role="list" aria-label={t('testimonials.listLabel')}>
          {myTestimonials.map((item) => (
            <GlassPanel key={item.id} level="flat" padding={16} role="listitem">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag tone={statusTone(item.status)}>{t(statusLabelKey(item.status))}</Tag>
                  {item.targetLabel && <Tag>{item.targetLabel}</Tag>}
                </div>
                {/* Le retrait n'est offert que tant que rien n'est publié. */}
                {item.status === 'pending' && (
                  <IconButton
                    label={t('testimonials.deleteAria')}
                    onClick={() => void handleDelete(item)}
                    style={{ width: '34px', height: '34px' }}
                  >
                    <Icon name="trash" size={15} color="var(--stop)" />
                  </IconButton>
                )}
              </div>

              {item.mediaType === 'video' && item.mediaUrl && (
                <video src={item.mediaUrl} controls playsInline className="w-full max-h-56 rounded-media mt-3 bg-[color:var(--surface-night)]" />
              )}
              {item.mediaType === 'audio' && item.mediaUrl && (
                <audio src={item.mediaUrl} controls className="w-full mt-3" />
              )}

              {item.content && <p className="text-meta text-ink-2 italic mt-3 mb-0 leading-[1.5]">« {item.content} »</p>}
              {item.createdAt && <p className="text-small text-ink-2 m-0 mt-2">{formatDate(item.createdAt)}</p>}
            </GlassPanel>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

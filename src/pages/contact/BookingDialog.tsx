import { useTranslation } from 'react-i18next';
import { Button, Field, GlassPanel, Icon, IconButton } from '@ds';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { SUBJECT_KEYS } from './useContactMessage';
import { TIME_SLOTS, type useAppointment } from './useAppointment';

/**
 * LA PRISE DE RENDEZ-VOUS — dialogue modal, et le seul endroit de la page où quelque chose
 * recouvre le contenu.
 *
 * Le voile de recul ne porte PLUS DE FLOU. Il en portait un (`backdrop-blur-sm`) : le flou
 * n'a droit qu'au chrome fixe (AD-4), et surtout il coûtait une recomposition par image de
 * toute la page derrière lui, pendant qu'on remplit six champs. Un voile d'encre à 72 %
 * sépare aussi bien, pour rien.
 *
 * Le dessin vient de `GlassPanel level="hero"` — le même verre que le formulaire de gauche,
 * sans flou lui non plus. La mécanique (Échap, piège de focus, verrou de défilement,
 * restitution du focus) vient de `useDialogA11y` : elle n'est pas réécrite ici.
 */
export function BookingDialog({ booking }: { booking: ReturnType<typeof useAppointment> }) {
  const { t } = useTranslation('contact');
  const ref = useDialogA11y(booking.open, booking.close);

  if (!booking.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-[18px] pt-[5vh]">
      <button
        type="button"
        aria-label={t('booking.close')}
        onClick={booking.close}
        className="fixed inset-0 cursor-default border-0"
        style={{ background: 'color-mix(in srgb, var(--night) 72%, transparent)' }}
      />

      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-dialog-title"
        tabIndex={-1}
        className="relative max-h-[90vh] w-full max-w-[520px] overflow-y-auto"
      >
        <GlassPanel level="hero" padding={22}>
          <div className="flex items-center gap-2">
            <Icon name="calendar" size={18} strokeWidth={2.4} color="var(--mm-bleu)" />
            <h2 id="booking-dialog-title" className="m-0 flex-1 font-display text-[19px] font-black tracking-[-.03em] text-ink">
              {t('booking.modalTitle')}
            </h2>
            <IconButton label={t('booking.close')} onClick={booking.close}>
              <Icon name="close" size={17} strokeWidth={2.4} />
            </IconButton>
          </div>

          {booking.success ? (
            <div className="mt-5">
              <p className="m-0 font-display text-[19px] font-black tracking-[-.03em] text-ink">
                {t('booking.successTitle')}
              </p>
              <p className="mt-2 mb-0 text-meta leading-[1.55] text-ink-2">{t('booking.successBody')}</p>
              <Button tone="forme" onClick={booking.close} style={{ marginTop: '17px' }}>
                {t('booking.close')}
              </Button>
            </div>
          ) : (
            <form onSubmit={booking.handleSubmit} noValidate>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label={t('booking.dateLabel')}
                  type="date"
                  value={booking.form.date}
                  onChange={(v) => booking.update('date', v)}
                  error={booking.errors.date}
                  min={booking.today}
                  required
                />
                <Field
                  as="select"
                  label={t('booking.timeLabel')}
                  value={booking.form.time}
                  onChange={(v) => booking.update('time', v)}
                  error={booking.errors.time}
                  options={TIME_SLOTS.map((slot) => ({ value: slot, label: slot }))}
                  required
                />
              </div>

              <Field
                as="select"
                label={t('booking.subjectLabel')}
                value={booking.form.subjectKey}
                onChange={(v) => booking.update('subjectKey', v)}
                options={SUBJECT_KEYS.map((key) => ({ value: key, label: t(`subjects.${key}`) }))}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label={t('booking.nameLabel')}
                  value={booking.form.name}
                  onChange={(v) => booking.update('name', v)}
                  error={booking.errors.name}
                  placeholder={t('booking.namePlaceholder')}
                  autoComplete="name"
                  required
                />
                <Field
                  label={t('booking.phoneLabel')}
                  type="tel"
                  value={booking.form.phone}
                  onChange={(v) => booking.update('phone', v)}
                  placeholder={t('booking.phonePlaceholder')}
                  /* Un numéro Wave sur un clavier alphabétique, c'est trente secondes de
                     saisie en plus. `tel` ouvre le pavé, `tel` le pré-remplit. */
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>

              <Field
                label={t('booking.emailLabel')}
                type="email"
                value={booking.form.email}
                onChange={(v) => booking.update('email', v)}
                error={booking.errors.email}
                placeholder={t('booking.emailPlaceholder')}
                inputMode="email"
                autoComplete="email"
                required
              />

              <Field
                as="textarea"
                label={t('booking.notesLabel')}
                value={booking.form.message}
                onChange={(v) => booking.update('message', v)}
                placeholder={t('booking.notesPlaceholder')}
                rows={3}
              />

              <div className="mt-[18px] flex flex-wrap justify-end gap-3">
                <Button tone="ghost" size="sm" fullWidth={false} onClick={booking.close}>
                  {t('booking.cancel')}
                </Button>
                <Button type="submit" tone="forme" size="sm" fullWidth={false} loading={booking.loading}>
                  {booking.loading ? t('booking.submitting') : t('booking.submit')}
                </Button>
              </div>
            </form>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}

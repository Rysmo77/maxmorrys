import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, DocLine, Field, GlassPanel, Icon, Tag } from '@ds';
import { SiteDisplay, SiteEyebrow } from '../site';
import { agencyLeadConfig } from '../../lib/agency/engagement';
import { DESCRIPTION_MAX, useTrainingEngagement } from '../../pages/formations/useTrainingEngagement';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * L'OFFRE ENTREPRISES — la copie existait déjà, et personne ne la lisait.
 *
 * `business.*` vit dans `formations.json` depuis des mois, en français ET en anglais :
 * trois offres, un appel à l'action, des notes. Aucun composant ne l'appelait. Cette section
 * la monte, et lui donne le seul chemin qui manquait — un formulaire qui ÉCRIT.
 *
 * ── POURQUOI ELLE TIENT DANS L'ÉTAT VIDE, ET POURQUOI C'EST LE POINT ──────────────────
 *
 * `Formations.tsx` interdit d'y « promettre un e-mail que le produit ne sait pas envoyer ».
 * Cette section n'en promet aucun : elle enregistre une demande dans `engagement_leads`, que
 * la console lit. Une écriture n'est pas une promesse.
 *
 * Et c'est la seule chose du catalogue qui se vende pendant que la boutique est fermée. Un
 * atelier daté se commande à l'avance ; un cours au détail exige que le cours existe. La
 * séquence de l'état vide devient donc : rien à acheter aujourd'hui → voilà pourquoi →
 * et voilà ce que je peux faire pour ton organisation dès maintenant.
 *
 * ⚠️ AUCUN MONTANT, ET ÇA RESTE. Les notes des trois offres disent « Prix par siège » et
 * « Sur devis ». Cette page n'a pas de grille B2B ; en inventer une serait un nombre sans
 * source, et AD-5 fait de `<Num source asOf>` le seul chemin du dépôt vers un chiffre.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/** Les trois offres, dans l'ordre du catalogue i18n. */
const OFFRES = ['licenses', 'workshops', 'coaching'] as const;

const rv = (i: number): CSSProperties => ({ ['--i' as string]: i });

export default function BusinessSection() {
  const { t } = useTranslation('formations');
  const lead = useTrainingEngagement();

  /* ── L'accusé de réception ────────────────────────────────────────────────────
     Retour anticipé, comme sur `/agence` : le formulaire envoyé disparaît, et ce
     qui reste dit ce qui a été enregistré — pas ce qui va arriver par courrier. */
  if (lead.receipt) {
    return (
      <>
        <SiteEyebrow className="rv" style={rv(1)}>{t('business.eyebrow')}</SiteEyebrow>
        {/* `SiteDisplay` porte sa propre cascade : `from` la décale, il n'y a ni `className`
            ni `style` à lui passer — le sourcil vient de prendre le rang 1. */}
        <SiteDisplay
          as="h2"
          from={2}
          lines={t('business.sent.titleLines', { returnObjects: true }) as string[]}
          size={34}
        />
        <p className="rv m-0 mt-3 max-w-[52ch] text-meta leading-[1.6] text-ink-2" style={rv(3)}>
          {t('business.sent.body')}
        </p>

        <GlassPanel level="flat" padding={20} className="rv mt-5 max-w-[42rem]" style={rv(4)}>
          <SiteEyebrow style={{ marginBottom: '9px' }}>{t('business.sent.recapEyebrow')}</SiteEyebrow>
          <DocLine label={t('business.sent.recapCompany')} value={lead.receipt.company} />
          <DocLine
            label={t('business.sent.recapStatus')}
            value={<Tag tone="ok">{t('business.sent.recapStatusValue')}</Tag>}
            last
          />
        </GlassPanel>

        <div className="rv mt-5" style={rv(5)}>
          <Button tone="quiet" size="sm" fullWidth={false} onClick={lead.reset}>
            {t('business.sent.back')}
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <SiteEyebrow className="rv" style={rv(1)}>{t('business.eyebrow')}</SiteEyebrow>
      <SiteDisplay
        as="h2"
        from={2}
        lines={t('business.titleLines', { returnObjects: true }) as string[]}
        size={34}
      />
      <p className="rv m-0 mt-3 max-w-[56ch] text-meta leading-[1.6] text-ink-2" style={rv(3)}>
        {t('business.description')}
      </p>

      <div className="mt-7 grid gap-9 wide:grid-cols-2">
        {/* Les trois façons de travailler ensemble. Aucune ne porte de prix. */}
        <div className="rv" style={rv(4)}>
          <SiteEyebrow style={{ margin: 0 }}>{t('business.offersEyebrow')}</SiteEyebrow>
          <div className="mt-3 grid gap-2.5">
            {OFFRES.map((cle) => (
              <GlassPanel key={cle} level="flat" padding={18}>
                <div className="flex items-start gap-2.5">
                  <Icon name="check" size={14} strokeWidth={3.4} style={{ marginTop: '4px', flexShrink: 0 }} />
                  <div>
                    <p className="m-0 text-meta font-bold text-ink">{t(`business.offers.${cle}Title`)}</p>
                    <p className="m-0 mt-1 text-meta-2 leading-[1.5] text-ink-2">
                      {t(`business.offers.${cle}Desc`)}
                    </p>
                    <p className="m-0 mt-1.5 text-meta-2 font-semibold text-ink-2">
                      {t(`business.offers.${cle}Note`)}
                    </p>
                  </div>
                </div>
              </GlassPanel>
            ))}
          </div>
        </div>

        {/* Le formulaire. Les trois derniers champs ne sont pas négociables :
            `firestore.rules` exige `name`, `company` et `email` à la création. */}
        <GlassPanel level="hero" padding={24} className="rv" style={rv(5)} as="section">
          <SiteEyebrow style={{ margin: 0 }}>{t('business.formEyebrow')}</SiteEyebrow>

          <form onSubmit={lead.handleSubmit} noValidate>
            {/* Piège à robots — hors de l'arbre d'accessibilité. Ce n'est pas un `Field` :
                un champ que personne ne doit remplir n'a pas d'étiquette à annoncer. */}
            <div aria-hidden="true" className="hidden">
              <input
                type="text"
                name="_hp"
                tabIndex={-1}
                autoComplete="off"
                value={lead.form._hp}
                onChange={(e) => lead.update('_hp', e.target.value)}
              />
            </div>

            <Field
              as="textarea"
              label={t('business.form.descriptionLabel')}
              value={lead.form.description}
              onChange={(v) => lead.update('description', v)}
              error={lead.errors.description}
              placeholder={t('business.form.descriptionPlaceholder')}
              rows={4}
              /* Le plafond de `firestore.rules`, lu à sa source et non retapé ici. */
              maxLength={DESCRIPTION_MAX}
              required
            />

            <Field
              as="select"
              label={t('business.form.budgetLabel')}
              value={lead.form.budget}
              onChange={(v) => lead.update('budget', v)}
              error={lead.errors.budget}
              placeholder={t('business.form.budgetPlaceholder')}
              hint={t('business.form.budgetHint')}
              options={agencyLeadConfig.budgets.map((key) => ({
                value: key,
                label: t(`business.form.budgets.${key}`),
              }))}
              required
            />

            <Field
              as="select"
              label={t('business.form.timelineLabel')}
              value={lead.form.timeline}
              onChange={(v) => lead.update('timeline', v)}
              error={lead.errors.timeline}
              placeholder={t('business.form.timelinePlaceholder')}
              options={agencyLeadConfig.timelines.map((key) => ({
                value: key,
                label: t(`business.form.timelines.${key}`),
              }))}
              required
            />

            <SiteEyebrow style={{ margin: '18px 0 0' }}>{t('business.form.replyEyebrow')}</SiteEyebrow>

            <div className="grid gap-3 stack:grid-cols-2">
              <Field
                label={t('business.form.nameLabel')}
                value={lead.form.name}
                onChange={(v) => lead.update('name', v)}
                error={lead.errors.name}
                placeholder={t('business.form.namePlaceholder')}
                autoComplete="name"
                required
              />
              <Field
                label={t('business.form.companyLabel')}
                value={lead.form.company}
                onChange={(v) => lead.update('company', v)}
                error={lead.errors.company}
                placeholder={t('business.form.companyPlaceholder')}
                autoComplete="organization"
                required
              />
            </div>

            <Field
              label={t('business.form.emailLabel')}
              value={lead.form.email}
              onChange={(v) => lead.update('email', v)}
              error={lead.errors.email}
              placeholder={t('business.form.emailPlaceholder')}
              type="email"
              autoComplete="email"
              inputMode="email"
              required
            />

            <Button type="submit" tone="forme" loading={lead.loading} style={{ marginTop: '16px' }}>
              {lead.loading ? t('business.form.submitting') : t('business.cta')}
            </Button>

            <p className="m-0 mt-3 text-meta-2 leading-[1.5] text-ink-2">{t('business.form.reply')}</p>
          </form>
        </GlassPanel>
      </div>
    </>
  );
}

import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@ds';
import { agencyLeadConfig } from '../../../lib/agency/engagement';
import { DESCRIPTION_MAX, useTrainingEngagement, type TrainingLeadForm } from '../../../pages/formations/useTrainingEngagement';

/**
 * « FORMER TOUTE TON ÉQUIPE ? » — la carte bleue de la maquette Catalogue.
 *
 * La maquette montre trois champs (entreprise, nombre de personnes, objectif). La demande
 * réelle (`saveEngagementLead`) en exige davantage : `firestore.rules` refuse un lead sans
 * nom ni e-mail, et le hook valide une fourchette de budget et une échéance. On ne les
 * invente pas — on ne les fixe pas non plus à une valeur par défaut, ce qui ferait mentir
 * le lead. La carte garde donc l'allure de la maquette et déplie les champs restants au
 * premier « Demander un devis » (divulgation progressive).
 *
 * « Nombre de personnes » n'existe pas dans le schéma du lead : il entre en tête de la
 * description, qui est le champ libre que l'administration lit.
 */
type Key = keyof TrainingLeadForm;

function Box({ id, label, value, onChange, error, type = 'text', span = false, as }: {
  id: string; label: string; value: string; onChange: (v: string) => void; error?: string;
  type?: string; span?: boolean; as?: 'textarea';
}) {
  return (
    <div className="mm-field" style={span ? { gridColumn: '1 / -1' } : undefined}>
      <div className="mm-field__box">
        {as === 'textarea'
          ? <textarea id={id} placeholder=" " value={value} rows={3} maxLength={DESCRIPTION_MAX} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} />
          : <input id={id} type={type} placeholder=" " value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} />}
        <label htmlFor={id}>{label}</label>
      </div>
      {error ? <span className="mm-field__help text-[color:var(--stop)]">{error}</span> : null}
    </div>
  );
}

export default function TeamQuoteCard() {
  const { t } = useTranslation('formations');
  const lead = useTrainingEngagement();
  const uid = useId();
  const [team, setTeam] = useState('');
  const [goal, setGoal] = useState('');
  const [open, setOpen] = useState(false);

  /* L'objectif et l'effectif composent la description réelle du lead. */
  const sync = (nextTeam: string, nextGoal: string) => {
    const head = nextTeam.trim() ? `${t('v3.team.teamPrefix')} ${nextTeam.trim()}\n` : '';
    lead.update('description', `${head}${nextGoal}`);
  };
  const set = (k: Key) => (v: string) => lead.update(k, v);

  if (lead.receipt) {
    return (
      <div className="grid gap-3">
        <span className="mm-eyebrow">{t('v3.team.eyebrow')}</span>
        <h2 className="mm-d m-0 text-[34px] wide:text-[46px]">{t('v3.team.sentTitle')}</h2>
        <p className="m-0 text-ink-2">{t('v3.team.sentBody', { company: lead.receipt.company })}</p>
        <button type="button" className="mm-pill is-plain self-start" onClick={lead.reset}>{t('business.sent.back')}</button>
      </div>
    );
  }

  return (
    <div className="grid items-center gap-8 wide:grid-cols-2">
      <div>
        <span className="mm-eyebrow">{t('v3.team.eyebrow')}</span>
        <h2 className="mm-d m-0 mb-2.5 mt-3 text-[34px] wide:text-[46px]">{t('v3.team.title')}</h2>
        <p className="m-0 text-ink-2">{t('v3.team.body')}</p>
      </div>
      <form
        className="grid grid-cols-2 gap-2.5"
        noValidate
        onSubmit={(e) => {
          if (!open) { e.preventDefault(); setOpen(true); return; }
          void lead.handleSubmit(e);
        }}
      >
        <div aria-hidden="true" className="hidden">
          <input type="text" name="_hp" tabIndex={-1} autoComplete="off" value={lead.form._hp} onChange={(e) => lead.update('_hp', e.target.value)} />
        </div>
        <Box id={`${uid}-co`} label={t('v3.team.company')} value={lead.form.company} onChange={set('company')} error={lead.errors.company} />
        <Box id={`${uid}-nb`} label={t('v3.team.size')} value={team} onChange={(v) => { setTeam(v); sync(v, goal); }} type="text" />
        <Box id={`${uid}-goal`} label={t('v3.team.goal')} value={goal} onChange={(v) => { setGoal(v); sync(team, v); }} error={lead.errors.description} span as={open ? 'textarea' : undefined} />
        {open && (
          <>
            <Box id={`${uid}-name`} label={t('business.form.nameLabel')} value={lead.form.name} onChange={set('name')} error={lead.errors.name} />
            <Box id={`${uid}-mail`} label={t('business.form.emailLabel')} value={lead.form.email} onChange={set('email')} error={lead.errors.email} type="email" />
            <div className="mm-field">
              <div className="mm-field__box">
                <select id={`${uid}-bu`} value={lead.form.budget} onChange={(e) => lead.update('budget', e.target.value)} aria-invalid={Boolean(lead.errors.budget)}>
                  <option value="">{t('business.form.budgetPlaceholder')}</option>
                  {agencyLeadConfig.budgets.map((k) => <option key={k} value={k}>{t(`business.form.budgets.${k}`)}</option>)}
                </select>
                <label htmlFor={`${uid}-bu`}>{t('business.form.budgetLabel')}</label>
              </div>
              {lead.errors.budget ? <span className="mm-field__help text-[color:var(--stop)]">{lead.errors.budget}</span> : null}
            </div>
            <div className="mm-field">
              <div className="mm-field__box">
                <select id={`${uid}-ti`} value={lead.form.timeline} onChange={(e) => lead.update('timeline', e.target.value)} aria-invalid={Boolean(lead.errors.timeline)}>
                  <option value="">{t('business.form.timelinePlaceholder')}</option>
                  {agencyLeadConfig.timelines.map((k) => <option key={k} value={k}>{t(`business.form.timelines.${k}`)}</option>)}
                </select>
                <label htmlFor={`${uid}-ti`}>{t('business.form.timelineLabel')}</label>
              </div>
              {lead.errors.timeline ? <span className="mm-field__help text-[color:var(--stop)]">{lead.errors.timeline}</span> : null}
            </div>
          </>
        )}
        <button className="mm-pill is-ink" type="submit" disabled={lead.loading} style={{ gridColumn: '1 / -1', justifyContent: 'space-between' }}>
          {lead.loading ? t('business.form.submitting') : open ? t('v3.team.send') : t('v3.team.cta')}
          <i aria-hidden="true"><Icon name="arrow-up-right" size={15} /></i>
        </button>
        {open && <p className="m-0 text-small text-ink-2" style={{ gridColumn: '1 / -1' }}>{t('business.form.reply')}</p>}
      </form>
    </div>
  );
}

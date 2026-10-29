import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { Switch, useToast } from '@ds';
import { functions } from '../../../../config/firebase';

/**
 * Le renouvellement du Club, réglable « à tout moment » depuis l'espace — CGV art. 5.4.
 *
 * Couper passe par le Worker (`setClubAutoRenew`), qui ANNULE l'abonnement chez Bictorys
 * avant d'écrire en base : l'état affiché ne change qu'une fois la réponse reçue, pour ne
 * jamais montrer « coupé » à quelqu'un qui recevra quand même le lien de paiement.
 */
const setClubAutoRenew = httpsCallable<{ enabled: boolean }, { autoRenew: boolean }>(functions, 'setClubAutoRenew');

export default function ClubRenewalCard({ autoRenew, onChanged }: { autoRenew: boolean; onChanged: () => void }) {
  const { t } = useTranslation('club');
  const { addToast } = useToast();
  const [on, setOn] = useState(autoRenew);
  const [busy, setBusy] = useState(false);

  const toggle = async (next: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await setClubAutoRenew({ enabled: next });
      setOn(result.data.autoRenew);
      addToast('success', t(result.data.autoRenew ? 'renewal.onToast' : 'renewal.offToast'));
      onChanged();
    } catch (error: unknown) {
      addToast('error', error instanceof Error && error.message ? error.message : t('renewal.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mm-card !p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="!text-[18px] text-ink">{t('renewal.title')}</h3>
        <Switch on={on} label={t('renewal.title')} disabled={busy} onChange={(next) => { void toggle(next); }} />
      </div>
      <p className="m-0 mt-2 text-[13px] leading-[1.5] text-ink-2">{t(on ? 'renewal.onBody' : 'renewal.offBody')}</p>
    </section>
  );
}

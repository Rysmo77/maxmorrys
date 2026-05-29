import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Check, Handshake, Trophy, CircleNotch } from '@phosphor-icons/react';
import { getOrCreateReferralCode, getMyReferrals } from '../../../../lib/firestore';
import { getGamificationProfile } from '../../../../lib/gamification';
import type { Referral } from '../../../../types';
import type { useClubData } from '../../hooks/useClubData';
import { slideUp } from '../../../../lib/animations';

type ClubData = ReturnType<typeof useClubData>;

export default function ClubReferral({ data }: { data: ClubData }) {
  const { user } = data;
  const [code, setCode] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isAmbassador, setIsAmbassador] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getOrCreateReferralCode(user.uid),
      getMyReferrals(user.uid),
      getGamificationProfile(user.uid),
    ]).then(([c, refs, gam]) => {
      setCode(c);
      setReferrals(refs);
      setIsAmbassador(!!gam?.badges?.includes('ambassadeur'));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const link = code ? `${window.location.origin}/inscription?ref=${code}` : '';

  const copy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => null);
  };

  const shareText = encodeURIComponent(`Rejoins le Club des Digitos avec mon lien et profite d'une réduction : ${link}`);

  if (loading) {
    return <div className="flex justify-center py-16"><CircleNotch className="w-8 h-8 animate-spin text-plum-500" /></div>;
  }

  return (
    <motion.div className="space-y-5 max-w-2xl mx-auto lg:mx-0" variants={slideUp} initial="hidden" animate="visible">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-plum-600 to-plum-800 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center"><Gift className="w-6 h-6" weight="fill" /></div>
          <h3 className="text-xl font-black">Parraine la communauté</h3>
        </div>
        <p className="text-plum-100 text-sm leading-relaxed">
          Ton filleul profite de <span className="font-bold text-white">-15%</span> sur son adhésion. Quand il devient membre, tu gagnes <span className="font-bold text-white">100 XP</span> et le badge <span className="font-bold text-white">Ambassadeur</span>.
        </p>
      </div>

      {/* Link */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 space-y-3">
        <label className="text-xs font-semibold text-neutral-500">Ton lien de parrainage</label>
        <div className="flex items-center gap-2">
          <input readOnly value={link} className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-700 dark:text-neutral-300 truncate" />
          <button onClick={copy} className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-plum-600 hover:bg-plum-700 text-white text-sm font-semibold transition-colors">
            {copied ? <Check className="w-4 h-4" weight="bold" /> : <Copy className="w-4 h-4" />} {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors">WhatsApp</a>
          <a href={`https://twitter.com/intent/tweet?text=${shareText}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold px-3 py-1.5 rounded-full bg-neutral-900 dark:bg-neutral-700 text-white hover:opacity-90 transition-opacity">X</a>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(link)}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold px-3 py-1.5 rounded-full bg-sky-500 text-white hover:bg-sky-600 transition-colors">Telegram</a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 flex items-center gap-3">
          <Handshake className="w-7 h-7 text-plum-500" weight="duotone" />
          <div>
            <p className="text-2xl font-black text-neutral-900 dark:text-white tabular-nums">{referrals.length}</p>
            <p className="text-xs text-neutral-500">Filleul{referrals.length > 1 ? 's' : ''} converti{referrals.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 flex items-center gap-3">
          <Trophy className={isAmbassador ? 'w-7 h-7 text-accent-500' : 'w-7 h-7 text-neutral-300 dark:text-neutral-600'} weight="fill" />
          <div>
            <p className="text-sm font-bold text-neutral-900 dark:text-white">Ambassadeur</p>
            <p className="text-xs text-neutral-500">{isAmbassador ? 'Badge débloqué 🎉' : 'Parraine 1 membre'}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

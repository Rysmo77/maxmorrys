import { Link } from 'react-router-dom';
import {
  Crown, Rss, Video, Calendar, Info, MessageSquare, Bell, Loader2,
} from 'lucide-react';
import Button from '../../../../components/ui/Button';
import { cn } from '../../../../lib/utils';
import type { useClubData } from '../../hooks/useClubData';
import type { EnrolledFormation } from '../../hooks/useStudentData';

type ClubData = ReturnType<typeof useClubData>;

interface ClubSubscriptionGateProps {
  data: ClubData;
  enrolledFormations: EnrolledFormation[];
}

export default function ClubSubscriptionGate({ data, enrolledFormations }: ClubSubscriptionGateProps) {
  const {
    isClubPending,
    clubAutoRenew, setClubAutoRenew,
    activatingClub, handleActivateClub,
  } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Club des Digitos</h2>
              <p className="text-brand-200 text-sm">Communauté exclusive · 10 000 FCFA/an</p>
            </div>
          </div>
          <p className="text-brand-100 leading-relaxed max-w-lg">
            Accédez à la communauté, aux sessions Live, au forum, aux infos exclusives et aux événements organisés par Max-Morrys.
          </p>
        </div>
        <Crown className="absolute -right-6 -bottom-6 w-40 h-40 text-white/5" />
      </div>

      {/* Avantages */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Rss, title: "Fil d'actualité", desc: 'Publications et posts en temps réel de Max-Morrys et des membres.' },
          { icon: MessageSquare, title: 'Forum & discussions', desc: 'Échangez, posez vos questions, interagissez avec la communauté.' },
          { icon: Video, title: 'Sessions Live', desc: 'Participez aux sessions en direct avec Max-Morrys.' },
          { icon: Bell, title: 'Infos exclusives', desc: 'Analyses, ressources et contenus réservés aux membres.' },
          { icon: Calendar, title: 'Événements', desc: 'Accès prioritaire aux événements organisés ou animés par Max-Morrys.' },
          { icon: Crown, title: 'Communauté', desc: 'Réseau de professionnels du digital passionnés.' },
        ].map((feat) => (
          <div key={feat.title} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mb-3">
              <feat.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <p className="font-bold text-neutral-900 dark:text-white text-sm mb-1">{feat.title}</p>
            <p className="text-xs text-neutral-500 leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </div>

      {/* Soft recommendation if no enrollments */}
      {enrolledFormations.length === 0 && !isClubPending && (
        <div className="bg-brand-50 dark:bg-brand-900/10 border border-brand-200 dark:border-brand-800/40 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">Conseil</p>
            <p className="text-xs text-brand-600/80 dark:text-brand-400/80 mt-0.5">
              Combine le Club avec une formation pour tirer le maximum de la plateforme.{' '}
              <Link to="/formations" className="underline font-semibold">Voir les formations</Link>
            </p>
          </div>
        </div>
      )}

      {/* Activation */}
      {isClubPending ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center mx-auto mb-3">
            <Loader2 className="w-6 h-6 text-yellow-600 animate-spin" />
          </div>
          <p className="font-bold text-yellow-800 dark:text-yellow-300 mb-2">Paiement en attente de confirmation</p>
          <p className="text-sm text-yellow-700 dark:text-yellow-400 leading-relaxed max-w-sm mx-auto">
            Effectue le virement de <strong>10 000 FCFA</strong> et envoie une capture via le formulaire de contact. Ton accès sera activé sous 24h.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
          <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Activer le Club des Digitos</h3>
          <p className="text-sm text-neutral-500 mb-5">10 000 FCFA / an · Renouvellement automatique ou manuel à ta convenance.</p>
          <div className="flex items-center gap-3 mb-6">
            <button type="button" onClick={() => setClubAutoRenew((v) => !v)} className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none', clubAutoRenew ? 'bg-brand-600' : 'bg-neutral-300 dark:bg-neutral-600')}>
              <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform', clubAutoRenew ? 'translate-x-6' : 'translate-x-1')} />
            </button>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Renouvellement automatique <span className="text-neutral-400">(désactivable à tout moment)</span></span>
          </div>
          <Button onClick={handleActivateClub} disabled={activatingClub} icon={activatingClub ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}>
            {activatingClub ? 'Traitement...' : 'Rejoindre pour 10 000 FCFA/an'}
          </Button>
        </div>
      )}
    </div>
  );
}

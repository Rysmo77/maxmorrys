import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Crown, Rss, VideoCamera, CalendarBlank, Info, ChatsCircle, BellRinging, CircleNotch, Users, Quotes, Star, Robot,
} from '@phosphor-icons/react';
import Button from '../../../../components/ui/Button';
import { cn } from '../../../../lib/utils';
import { getClubActiveMemberCount } from '../../../../lib/gamification';
import { getApprovedTestimonials } from '../../../../lib/firestore';
import type { Testimonial } from '../../../../types';
import { CLUB_CATEGORIES } from '../../hooks/useClubData';
import type { useClubData } from '../../hooks/useClubData';
import type { EnrolledFormation } from '../../hooks/useStudentData';
import { slideUp } from '../../../../lib/animations';

type ClubData = ReturnType<typeof useClubData>;

interface ClubSubscriptionGateProps {
  data: ClubData;
  enrolledFormations: EnrolledFormation[];
}

const initialsOf = (name: string) => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

export default function ClubSubscriptionGate({ data, enrolledFormations }: ClubSubscriptionGateProps) {
  const {
    isClubPending,
    clubAutoRenew, setClubAutoRenew,
    activatingClub, handleActivateClub,
  } = data;

  const [memberCount, setMemberCount] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    getClubActiveMemberCount().then(setMemberCount).catch(() => null);
    getApprovedTestimonials().then((all) => {
      setTestimonials(all.filter((t) => !t.targetType || t.targetType === 'platform' || t.targetType === 'mentor').slice(0, 3));
    }).catch(() => null);
  }, []);

  return (
    <motion.div
      className="space-y-6"
      variants={slideUp}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-plum-600 to-plum-800 p-6 sm:p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" weight="fill" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Club des Digitos</h2>
              <p className="text-plum-200 text-sm">Communauté exclusive · 19 900 FCFA/an</p>
            </div>
          </div>
          <p className="text-plum-100 leading-relaxed max-w-lg">
            Accédez à la communauté, aux sessions Live, au forum, aux infos exclusives et aux événements organisés par Max-Morrys.
          </p>
          {memberCount > 0 && (
            <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-sm font-semibold">
              <Users className="w-4 h-4" weight="fill" />
              Rejoins {memberCount} membre{memberCount > 1 ? 's' : ''} actif{memberCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
        <Crown className="absolute -right-6 -bottom-6 w-40 h-40 text-white/5" weight="fill" />
      </div>

      {/* Avantages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Rss, title: "Fil d'actualité", desc: 'Publications et posts en temps réel de Max-Morrys et des membres.' },
          { icon: ChatsCircle, title: 'Forum & discussions', desc: 'Échangez, posez vos questions, interagissez avec la communauté.' },
          { icon: VideoCamera, title: 'Sessions Live', desc: 'Participez aux sessions en direct avec Max-Morrys.' },
          { icon: BellRinging, title: 'Infos exclusives', desc: 'Analyses, ressources et contenus réservés aux membres.' },
          { icon: CalendarBlank, title: 'Événements', desc: 'Accès prioritaire aux événements organisés ou animés par Max-Morrys.' },
          { icon: Robot, title: 'Rysmo boosté', desc: '+3 requêtes par jour avec ton répétiteur IA Rysmo, incluses avec le Club.' },
          { icon: Crown, title: 'Communauté', desc: 'Réseau de professionnels du digital passionnés.' },
        ].map((feat) => (
          <div key={feat.title} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 transition-all hover:border-plum-200 dark:hover:border-plum-800/60 hover:shadow-soft">
            <div className="w-10 h-10 rounded-xl bg-plum-50 dark:bg-plum-900/20 flex items-center justify-center mb-3">
              <feat.icon className="w-5 h-5 text-plum-600 dark:text-plum-400" weight="duotone" />
            </div>
            <p className="font-bold text-neutral-900 dark:text-white text-sm mb-1">{feat.title}</p>
            <p className="text-xs text-neutral-500 leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </div>

      {/* Teaser d'activité — thèmes discutés (sans exposer de contenu) */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4">
        <p className="text-sm font-bold text-neutral-900 dark:text-white mb-2">Ce qui s'échange en ce moment</p>
        <div className="flex gap-2 flex-wrap">
          {CLUB_CATEGORIES.map((c) => (
            <span key={c.id} className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-700/50', c.tint)}>
              <c.icon className="w-3.5 h-3.5" weight="duotone" /> {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* Témoignages — preuve sociale */}
      {testimonials.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Quotes className="w-4 h-4 text-plum-500" weight="fill" /> Ils en parlent
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {testimonials.map((t) => (
              <div key={t.id} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4">
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn('w-3.5 h-3.5', i < t.rating ? 'text-accent-500' : 'text-neutral-300 dark:text-neutral-700')} weight="fill" />
                  ))}
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-4 mb-3">"{t.content}"</p>
                <div className="flex items-center gap-2">
                  {t.avatar
                    ? <img src={t.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                    : <span className="w-7 h-7 rounded-full bg-plum-100 dark:bg-plum-900/40 flex items-center justify-center text-[10px] font-bold text-plum-600 dark:text-plum-400">{initialsOf(t.name)}</span>}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{t.name}</p>
                    <p className="text-[10px] text-neutral-400 truncate">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Soft recommendation if no enrollments */}
      {enrolledFormations.length === 0 && !isClubPending && (
        <div className="bg-plum-50 dark:bg-plum-900/10 border border-plum-200 dark:border-plum-800/40 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-plum-500 flex-shrink-0 mt-0.5" weight="duotone" />
          <div>
            <p className="text-sm font-semibold text-plum-700 dark:text-plum-300">Conseil</p>
            <p className="text-xs text-plum-600/80 dark:text-plum-400/80 mt-0.5">
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
            <CircleNotch className="w-6 h-6 text-yellow-600 animate-spin" />
          </div>
          <p className="font-bold text-yellow-800 dark:text-yellow-300 mb-2">Paiement en cours de traitement</p>
          <p className="text-sm text-yellow-700 dark:text-yellow-400 leading-relaxed max-w-sm mx-auto">
            Ton paiement est en attente de confirmation. Ton accès sera activé automatiquement dès réception. Si tu as un souci, <Link to="/contact" className="underline font-semibold">contacte-nous</Link>.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
          <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Activer le Club des Digitos</h3>
          <p className="text-sm text-neutral-500 mb-5">19 900 FCFA / an · Renouvellement automatique ou manuel à ta convenance.</p>
          <div className="flex items-center gap-3 mb-6">
            <button type="button" onClick={() => setClubAutoRenew((v) => !v)} className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none', clubAutoRenew ? 'bg-plum-600' : 'bg-neutral-300 dark:bg-neutral-600')}>
              <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform', clubAutoRenew ? 'translate-x-6' : 'translate-x-1')} />
            </button>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Renouvellement automatique <span className="text-neutral-400">(désactivable à tout moment)</span></span>
          </div>
          <Button onClick={handleActivateClub} disabled={activatingClub} className="!bg-plum-600 hover:!bg-plum-700" icon={activatingClub ? <CircleNotch className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" weight="fill" />}>
            {activatingClub ? 'Traitement...' : 'Rejoindre pour 19 900 FCFA/an'}
          </Button>
        </div>
      )}
    </motion.div>
  );
}

import { useTranslation } from 'react-i18next';
import { Icon, Tag } from '@ds';
import { clubUpcoming } from './upcoming';
import { useFormat } from '../../../../hooks/useFormat';
import type { useClubData } from '../../hooks/useClubData';

type ClubData = ReturnType<typeof useClubData>;

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * « À VENIR » — troisième colonne du Club.
 *
 * `handoff_tableaux_de_bord/dashboards-app.jsx` § ClubDesktop : « Le panneau porte
 * l'agenda : c'est la seule chose du Club qui a une échéance. » Tout le reste du Club
 * — le fil, les membres, les opportunités, le parrainage — se consulte quand on veut.
 * Une session, non : elle a lieu à une heure, et la manquer est définitif.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * AUCUNE LECTURE SUPPLÉMENTAIRE. `useClubData` charge déjà `clubEvents`,
 * `clubSessions` et l'état d'inscription de la personne pour l'onglet Agenda. Ce
 * panneau est de la mise en forme, pas une requête de plus.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEUX CHOSES DE LA MAQUETTE NE SONT PAS REPRISES, ET C'EST MESURÉ
 *
 * · « 4 / 12 PLACES ». `ClubDigitosEvent` n'a pas de champ de capacité, et aucune
 *   collection ne compte les places restantes. Le nombre serait inventé — exactement
 *   ce que le README du handoff appelle « un mensonge qu'on oublie de retirer ».
 *   L'étiquette d'inscription, elle, est réelle : elle vient de `registeredEvents`.
 *
 * · « TA VAGUE — 4ᵉ sur 9 ». La comparaison par vague d'arrivée n'existe pas dans ce
 *   produit : `getClubLeaderboard()` rend un top 20 ABSOLU, trié par expérience.
 *   `ClubLeaderboard` documente déjà ce même écart et l'écrit à l'écran plutôt que de
 *   le sous-entendre. Le rappeler ici sous une autre forme reviendrait à l'affirmer.
 *
 * ⚠️ LE PANNEAU RESTE À L'ÉCRAN QUAND L'AGENDA EST VIDE. « L'agenda est publié un mois
 * à l'avance — c'est un engagement de la page publique, pas une habitude » : un panneau
 * qui disparaît quand il n'y a rien laisse croire que l'engagement n'existe pas.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
interface ClubAgendaPanelProps {
  data: ClubData;
}

/**
 * Kit v3 : une carte blanche (bento) et des lignes `mm-ev` — pastille à gauche, titre,
 * échéance. Trois au plus : au-delà, l'onglet Agenda les liste toutes.
 */
export default function ClubAgendaPanel({ data }: ClubAgendaPanelProps) {
  const { t } = useTranslation('club');
  const { locale } = useFormat();
  const upcoming = clubUpcoming(data, t, locale).slice(0, 3);

  return (
    <section className="rounded-card border border-[color:var(--line)] bg-bento p-[18px] shadow-v3-soft">
      <h2 className="m-0 font-display text-[18px] font-black tracking-[-.02em] text-ink">{t('panel.upcomingEyebrow')}</h2>

      {upcoming.length === 0 ? (
        <p className="m-0 mt-2.5 text-meta-2 leading-[1.5] text-ink-2">{t('panel.upcomingEmpty')}</p>
      ) : (
        <ul className="m-0 mt-1 list-none p-0">
          {upcoming.map((item) => (
            <li key={item.id} className="mm-ev">
              <span aria-hidden="true" className="ico" style={{ background: item.gradient }}>
                <Icon name={item.glyph} size={18} color="var(--paper-fixed)" />
              </span>
              <div className="min-w-0">
                <b>{item.title}</b>
                <span>{item.meta}</span>
                {item.registered && <Tag tone="ok" style={{ marginTop: '6px' }}>{t('panel.registered')}</Tag>}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="m-0 mt-3 text-meta-2 leading-[1.5] text-ink-3">{t('panel.upcomingNote')}</p>
    </section>
  );
}

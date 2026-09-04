import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, GlassPanel, Icon, LessonRow, Num, Skeleton, StatTile } from '@ds';
import type { NumSource } from '@ds';
import { ConsolePage, ConsoleFilter, ConsoleList, ConsoleScope } from '../../components/console';
import { SiteEyebrow } from '../../components/site';
import { getAllTransactions, getTransactionsSince } from '../../lib/firestore';
import {
  agregerRevenu, bornePeriode, PERIODES,
  type BilanRevenu, type PeriodeCle,
} from '../../lib/admin/revenue';

/**
 * ── REVENU — l'écran qui assume la PÉRIODE, et pourquoi ────────────────────────────────
 *
 * LE MOTIF INTERDIT CE QUE CET ÉCRAN FAIT, et il faut le dire avant de le lire.
 * `ConsolePage.tsx` : « ConsoleFilter — filtre par STATUT, jamais par date. Un opérateur
 * unique cherche ce qui attend, pas ce qui s'est passé mardi. C'est pourquoi ce composant
 * n'expose aucun sélecteur de période : l'absence est la décision. » `AdminDashboard`
 * ajoute « ni analyse d'audience, ni cohortes, ni graphiques ». Et `AdminAnalytics` a déjà
 * refusé, pour lui-même, le filtre par période.
 *
 * CET ÉCRAN LE PREND QUAND MÊME, ET C'EST UNE DÉCISION, PAS UN OUBLI.
 *
 *   • LA QUESTION N'EST PAS « QU'EST-CE QUI ATTEND », C'EST « COMBIEN A-T-ON ENCAISSÉ ».
 *     Le motif est écrit pour des files de travail : un prospect à qualifier, un courrier
 *     bloqué, un brouillon à publier. Un franc encaissé n'attend rien — il est déjà arrivé.
 *     Et le seul statut qui compte ici n'est pas un filtre, il est la DÉFINITION du chiffre :
 *     filtrer par statut rendrait quatre pipelines dont trois n'ont aucun sens comptable.
 *
 *   • SANS PÉRIODE, LE NOMBRE N'EST PAS FAUX : IL EST INUTILISABLE. `AdminTransactions`
 *     affiche déjà l'encaissé — depuis toujours, sur la table entière. Un cumul depuis
 *     l'origine ne se compare à rien et ne dit pas si le mois a été meilleur que le
 *     précédent. La période n'est pas un confort d'analyse, c'est ce qui rend le chiffre
 *     lisible par quelqu'un qui doit décider.
 *
 *   • CE QUI EST REPRIS DU MOTIF L'EST INTÉGRALEMENT. Trois zones, dans l'ordre. La zone 1
 *     est le MÊME `ConsoleFilter`, la même barre, la même unicité de sélection — ses jalons
 *     sont des périodes au lieu de statuts. C'est l'écart minimal : un seul contrôle, jamais
 *     deux. Zone 2, une liste dense, une ligne par ligne de business, une action chacune.
 *     Zone 3, `ConsoleScope`, obligatoire.
 *
 * CE QUE CET ÉCRAN NE FAIT PAS, ET QUI RESTE INTERDIT :
 *   · aucun graphique, aucune courbe, aucune cohorte — le motif tient sur ce point ;
 *   · aucune comparaison « +12 % vs période précédente » : ce serait un second nombre,
 *     dérivé, dont personne ne peut vérifier la base à l'œil ;
 *   · aucune projection, aucune estimation. `AdminAnalytics` a supprimé trois nombres écrits
 *     en dur pour cette raison exacte ; ils ne reviennent pas par cette porte.
 *
 * ⚠️ ET UNE LIGNE QUE LE FRONT NE CALCULE PAS. La répartition vient du champ `ligne`, écrit
 * à la création de la transaction par le Worker (`lib/purchase.ts`). Le navigateur ne la
 * redéduit pas de `formationId` : ce serait la troisième lecture de la même règle, et la
 * seule que rien ne vérifie. Les transactions antérieures au marqueur n'ont pas ce champ —
 * elles apparaissent en « non réparti », avec leur compte. Une absence qui se voit se
 * rattrape ; une absence répartie par défaut ne se rattrape jamais.
 * ────────────────────────────────────────────────────────────────────────────────────────
 */

/** Vers l'écran qui traite chaque ligne. Une action par ligne, jamais deux. */
const DESTINATION: Record<string, string> = {
  formation: '/admin/formations',
  club: '/admin/club-digitos',
  rysmoSubscription: '/admin/transactions',
  rysmoPack: '/admin/transactions',
};

export default function AdminRevenue() {
  const { t } = useTranslation('admin');
  const [periode, setPeriode] = useState<PeriodeCle>('mois');
  const [bilan, setBilan] = useState<BilanRevenu | null>(null);
  const [loading, setLoading] = useState(true);
  /* La date de relevé se pose QUAND LA REQUÊTE RÉPOND, jamais au rendu : elle dit quand les
     chiffres ont été lus, pas quand la page a été peinte. */
  const [asOf, setAsOf] = useState<Date | null>(null);

  useEffect(() => {
    let annule = false;
    setLoading(true);

    const maintenant = new Date();
    const depuis = bornePeriode(periode, maintenant);
    /* Sur « tout », il n'y a pas de borne — donc rien à gagner à requêter par date. */
    const lecture = depuis === null ? getAllTransactions() : getTransactionsSince(depuis);

    lecture
      .then((transactions) => {
        if (annule) return;
        setBilan(agregerRevenu(transactions, depuis));
        setAsOf(new Date());
      })
      .catch(() => { if (!annule) setBilan(null); })
      .finally(() => { if (!annule) setLoading(false); });

    return () => { annule = true; };
  }, [periode]);

  const stamp = asOf ?? new Date();
  /* Un ratio n'est pas une lecture de base : il porte la façon dont il a été calculé. */
  const ratioSource: NumSource = { cite: t('revenue.ratioCite') };

  return (
    <ConsolePage title={t('revenue.title')} sub={t('revenue.sub')}>
      {/* ── Zone 1 — la période, seul contrôle de l'écran ─────────────────────── */}
      <ConsoleFilter
        className="rv"
        style={{ ['--i' as string]: 1 }}
        label={t('revenue.periodLabel')}
        stages={PERIODES.map((p) => t(`revenue.period.${p}`))}
        active={t(`revenue.period.${periode}`)}
        onSelect={(libelle) => {
          const trouve = PERIODES.find((p) => t(`revenue.period.${p}`) === libelle);
          if (trouve) setPeriode(trouve);
        }}
      />

      {loading && (
        <GlassPanel level="night" padding="14px 18px" className="rv mt-4" style={{ ['--i' as string]: 2 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={44} label={i === 0 ? t('revenue.title') : undefined} style={{ marginBottom: '8px' }} />
          ))}
        </GlassPanel>
      )}

      {!loading && bilan && (
        <>
          {/* Les quatre cases de relevé. Un zéro daté EST une valeur. */}
          <div
            className="rv mt-4 grid gap-2.5 stack:grid-cols-2 wide:grid-cols-4"
            style={{ ['--i' as string]: 2 }}
          >
            <StatTile label={t('revenue.statNet')} value={bilan.net} unit="FCFA" source="db" asOf={stamp} />
            <StatTile label={t('revenue.statRefunded')} value={bilan.rembourse} unit="FCFA" source="db" asOf={stamp} />
            <StatTile
              label={t('revenue.statBasket')}
              value={bilan.panierMoyen}
              unit="FCFA"
              source={ratioSource}
              asOf={stamp}
              foot={t('revenue.footSales', { count: bilan.ventes })}
            />
            {/* ⚠️ Le taux porte son dénominateur : à zéro tentative, `null` rend « non
                relevé » plutôt qu'un « 0 % » qui affirmerait qu'aucun paiement n'a échoué. */}
            <StatTile
              label={t('revenue.statFailureRate')}
              value={bilan.tauxEchec}
              unit="%"
              source={ratioSource}
              asOf={stamp}
              foot={t('revenue.footAttempts', { count: bilan.tentatives })}
            />
          </div>

          {/* ── Zone 2 — la ventilation par ligne ──────────────────────────────── */}
          <div className="rv mt-5" style={{ ['--i' as string]: 3 }}>
            <SiteEyebrow style={{ marginBottom: '10px' }}>{t('revenue.linesTitle')}</SiteEyebrow>

            {bilan.lignes.length === 0 ? (
              <GlassPanel level="night" padding="18px">
                <EmptyState
                  glyph="card"
                  title={t('revenue.emptyTitle')}
                  body={t('revenue.emptyBody')}
                />
              </GlassPanel>
            ) : (
              <ConsoleList label={t('revenue.linesTitle')}>
                {bilan.lignes.map((l) => {
                  const cle = l.ligne ?? 'unassigned';
                  return (
                    <LessonRow
                      key={cle}
                      title={t(`revenue.line.${cle}`)}
                      meta={t('revenue.lineMeta', { count: l.ventes })}
                      trailing={
                        <span className="flex items-center gap-3">
                          <Num value={l.net} unit="FCFA" source="db" asOf={stamp} showAsOf={false} />
                          {l.ligne && (
                            <Button size="sm" tone="quiet" href={DESTINATION[l.ligne]}>
                              {t('revenue.lineOpen')}
                            </Button>
                          )}
                        </span>
                      }
                    />
                  );
                })}
              </ConsoleList>
            )}

            {/* Ce que la reprise n'a pas encore rattrapé — visible, jamais réparti d'office. */}
            {bilan.nonReparties > 0 && (
              <p className="m-0 mt-2.5 text-meta-2 leading-[1.5] text-ink-2">
                {t('revenue.unassignedNote')}
              </p>
            )}
          </div>
        </>
      )}

      {!loading && !bilan && (
        <GlassPanel level="night" padding="18px" className="rv mt-4" style={{ ['--i' as string]: 2 }}>
          <EmptyState
            glyph="warning"
            title={t('revenue.failedTitle')}
            body={t('revenue.failedBody')}
            action={
              <Button size="sm" tone="quiet" onClick={() => setPeriode((p) => p)}>
                <Icon name="repeat" size={15} /> {t('revenue.refresh')}
              </Button>
            }
          />
        </GlassPanel>
      )}

      <ConsoleScope>{t('revenue.scope')}</ConsoleScope>
    </ConsolePage>
  );
}

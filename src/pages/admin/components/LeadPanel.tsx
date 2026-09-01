import { useTranslation } from 'react-i18next';
import { Button, DocLine, GlassPanel, Icon, Num, Pipeline, Tag } from '@ds';
import { SiteEyebrow } from '../../../components/site';
import { computeTotals, PIPELINE_STAGES } from '../../../lib/presence/offer';
import { useFormat } from '../../../hooks/useFormat';
import type { AgencyLead, AgencyLeadStatus } from '../../../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE PANNEAU DE DÉTAIL DE LA CONSOLE — troisième colonne du tableau de bord.
 *
 * `handoff_tableaux_de_bord/dashboards.jsx` § ConsoleDesktop : « le détail cesse
 * d'être un écran séparé. La file reste visible pendant qu'on traite. » C'est le
 * seul gain réel de la largeur sur cette surface, et il ne vaut que si la liste ne
 * disparaît pas — d'où un panneau collant, jamais une modale.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE PANNEAU LIT ET ORIENTE. IL N'ÉDITE PAS.
 *
 * `AdminAgencyLeads` porte déjà une fiche complète — statut, notes internes,
 * WhatsApp, devis, suppression. La recopier ici aurait donné deux éditeurs pour
 * la même entité, à désynchroniser au premier changement de champ.
 *
 * Le partage des rôles suit celui que la console applique partout : le tableau de
 * bord TRIE (« qu'est-ce qui bloque aujourd'hui »), l'écran dédié TRAITE. D'où
 * exactement deux actions, et la seconde est un renvoi vers la fiche complète.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEUX ÉCARTS ASSUMÉS AVEC LA MAQUETTE
 *
 * · LE COÛT OPÉRATIONNEL N'EST PAS REPRIS. La maquette affiche « ≈ 12 min par
 *   prospect qualifié » en `.mm-num`, donc présenté comme relevé. Ce nombre n'a
 *   aucune source dans le produit : ni chronométrage, ni champ, ni calcul. La
 *   règle 6 interdit précisément ça, et le README du handoff le redit lui-même —
 *   « une donnée d'exemple est un mensonge qu'on oublie de retirer ». Le bloc est
 *   remplacé par le devis, qui est réel, daté et actionnable.
 *
 * · « ÉMETTRE LE DEVIS » N'EXISTE PAS COMME ACTION. Le devis est émis à la
 *   soumission du formulaire (`saveAgencyLead` rend son `quoteRef`). Le panneau
 *   affiche donc le devis existant et son lien public, au lieu d'offrir un bouton
 *   qui ne peut rien déclencher.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

interface LeadPanelProps {
  lead: AgencyLead | null;
  /** Vrai tant que la file n'est pas relevée : on n'annonce pas « aucun » avant de savoir. */
  loading: boolean;
  /** Fait avancer le statut. Rendu par le parent, qui porte la liste. */
  onAdvance: (id: string, status: AgencyLeadStatus) => void;
  /**
   * Ouvre la fiche complète.
   *
   * C'EST UN RAPPEL, PAS UN `href`, et c'est la même raison que dans `DashboardTab` :
   * `Button href` rend un `<a>` brut, donc un rechargement complet de la coque
   * applicative — le cache de requêtes est jeté, et `AppShell` remonte. Dans une
   * console où l'on passe son temps à faire des allers-retours entre la file et une
   * fiche, c'est la navigation la plus fréquente de l'écran.
   */
  onOpenFull: () => void;
  updating: boolean;
  asOf: Date;
}

/** L'étape qui suit, dans l'ordre du pipeline. `lost` et `signed` sont terminaux. */
function nextStage(status: AgencyLeadStatus): AgencyLeadStatus | null {
  if (status === 'signed' || status === 'lost') return null;
  const i = PIPELINE_STAGES.indexOf(status);
  const next = PIPELINE_STAGES[i + 1];
  return next && next !== 'lost' ? next : null;
}

export default function LeadPanel({ lead, loading, onAdvance, onOpenFull, updating, asOf }: LeadPanelProps) {
  const { t } = useTranslation('admin');
  const { formatDate, formatPrice } = useFormat();

  if (loading) return null;

  if (!lead) {
    return (
      <GlassPanel level="night" padding={18}>
        <SiteEyebrow style={{ marginBottom: '6px' }}>{t('dashboard.panelEyebrow')}</SiteEyebrow>
        <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('dashboard.panelEmpty')}</p>
      </GlassPanel>
    );
  }

  const totals = computeTotals(lead.pack, lead.plan);
  const advance = nextStage(lead.status);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <SiteEyebrow style={{ marginBottom: '5px' }}>{t('dashboard.panelEyebrow')}</SiteEyebrow>
          {/* Le nom d'affaire est le sujet du panneau, pas un titre de page : il prend le
              dessin d'affichage sans en prendre le rang — `AppShell` porte déjà le <h1>. */}
          <p className="m-0 font-display text-[19px] font-black leading-tight tracking-[-.03em] text-ink">
            {lead.businessName}
          </p>
        </div>
        <Tag tone={lead.status === 'signed' ? 'ok' : lead.status === 'new' ? 'warn' : 'neutral'}>
          {t(`agencyLeads.status.${lead.status}`)}
        </Tag>
      </div>

      {/* Où en est ce prospect. Non cliquable ici : le panneau oriente, il n'édite pas —
          changer un statut d'un clic sans confirmation est la manœuvre qu'on regrette. */}
      <Pipeline
        stages={PIPELINE_STAGES.map((s) => t(`agencyLeads.status.${s}`))}
        active={t(`agencyLeads.status.${lead.status}`)}
        label={t('agencyLeads.pipelineLabel')}
      />

      <GlassPanel level="night" padding={18}>
        <DocLine label={t('dashboard.panelReceived')} value={formatDate(lead.createdAt)} />
        <DocLine label={t('agencyLeads.docCity')} value={lead.city} />
        <DocLine
          label={t('agencyLeads.docSector')}
          value={t(`agencyLeads.sectors.${lead.sector}`, { defaultValue: lead.sector })}
        />
        <DocLine
          label={t('agencyLeads.docPack')}
          value={t(`agencyLeads.packs.${lead.pack}`, { defaultValue: lead.pack })}
        />
        {/* Le montant vient de `computeTotals`, la grille tarifaire du code serveur —
            jamais d'une multiplication faite ici. <Num> porte cette provenance. */}
        <DocLine
          label={t('agencyLeads.docUpfront')}
          value={<Num value={formatPrice(totals.pipelineValue)} source="db" asOf={asOf} />}
          last={!lead.quoteRef}
        />
        {lead.quoteRef && (
          <DocLine
            label={t('agencyLeads.docQuote')}
            value={
              <a
                href={`/presence-digitale/devis/${lead.quoteRef}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-digitalise-txt hover:underline"
              >
                {t('agencyLeads.quoteRef', { ref: lead.quoteRef })}
              </a>
            }
            last
          />
        )}
      </GlassPanel>

      {/*
        TROIS ACTIONS, ET CHACUNE FAIT UNE CHOSE DIFFÉRENTE : répondre, avancer, tout ouvrir.
        La règle « une action par ligne » vise les LIGNES d'une liste, où deux boutons créent
        une hésitation à chaque ligne répétée. Un panneau de détail est l'endroit où les
        actions d'UNE entité se rassemblent — c'est même sa raison d'être ici.

        WhatsApp est en tête parce que c'est le canal que le prospect attend, et le seul de
        cet écran qui sorte du produit : il garde donc un `href` réel, dans un nouvel onglet.
      */}
      <div className="flex flex-col gap-2">
        <Button
          size="sm"
          tone="digitalise"
          fullWidth
          href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
          target="_blank"
        >
          {t('agencyLeads.whatsapp')}
        </Button>
        {advance && (
          <Button
            size="sm"
            tone="quiet"
            fullWidth
            disabled={updating}
            onClick={() => onAdvance(lead.id, advance)}
          >
            {updating
              ? t('agencyLeads.notesSaving')
              : t('dashboard.panelAdvance', { status: t(`agencyLeads.status.${advance}`) })}
          </Button>
        )}
        <Button size="sm" tone="quiet" fullWidth onClick={onOpenFull}>
          <span className="inline-flex items-center gap-1.5">
            {t('dashboard.panelOpenFull')}
            <Icon name="forward" size={14} strokeWidth={2.4} />
          </span>
        </Button>
      </div>
    </div>
  );
}

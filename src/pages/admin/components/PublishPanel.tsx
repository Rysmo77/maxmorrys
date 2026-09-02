import { useTranslation } from 'react-i18next';
import { Button, GlassPanel, Icon, LessonRow, Num, ProgressBar, Tag } from '@ds';
import { SiteEyebrow } from '../../../components/site';
import { formationChecklist } from '../formations/useFormations';
import type { PublishConditionId } from '../formations/publishChecklist';
import type { Formation } from '../../../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES CONDITIONS DE PUBLICATION — troisième colonne de l'écran des formations.
 *
 * `handoff_tableaux_de_bord/dashboards-console.jsx` § FormationsDesktop, et c'est la
 * décision la plus structurante du handoff :
 *
 *     « La checklist EST la définition de publiable. Le bouton reste inactif tant
 *       qu'une ligne est orange. La liste n'est pas un conseil : c'est la condition. »
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI LA SORTIR DE L'ÉDITEUR, PUISQU'ELLE Y EST DÉJÀ
 *
 * L'onglet « Publier » de la modale porte la même liste, et il la portait seul. Le
 * défaut est de séquence : pour savoir POURQUOI une formation n'est pas publiable, il
 * fallait l'ouvrir, aller au quatrième onglet, lire, fermer — puis recommencer sur la
 * suivante. Sur un écran dont le pipeline s'appelle « brouillons », c'est le geste le
 * plus fréquent, et c'est celui qui coûtait le plus.
 *
 * Ici, la liste suit la sélection. On parcourt la file, la raison du blocage est en
 * face, et on n'ouvre l'éditeur que pour AGIR — ce qui est exactement le partage que
 * la console applique partout : la colonne trie, la fiche traite.
 *
 * ⚠️ AUCUNE LECTURE SUPPLÉMENTAIRE. `formationChecklist()` est un calcul pur sur le
 * document déjà chargé — modules, leçons, prix, couverture. Changer de sélection ne
 * déclenche aucune requête.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE BOUTON N'EST PAS CELUI DE LA MAQUETTE, ET C'EST DÉLIBÉRÉ
 *
 * La maquette dessine « Publier au catalogue », désactivé. Le rendre ici donnerait un
 * SECOND chemin de publication, à côté de celui de l'éditeur (`handleSave('published')`)
 * — deux écritures pour le même acte, dont une qui court-circuite le formulaire d'où
 * viennent les valeurs. C'est la faute que `LeadPanel` et `UserPanel` évitent déjà.
 *
 * Le panneau porte donc l'action qui MÈNE à la publication : ouvrir la fiche. Ce que la
 * maquette dit avec un bouton gris — « il te manque deux conditions » — est dit ici par
 * la liste elle-même, ligne par ligne, avec le compte de ce qui manque.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

interface PublishPanelProps {
  formation: Formation | null;
  /** Vrai tant que la collection n'est pas relevée. */
  loading: boolean;
  /** Ouvre la fiche complète — un rappel, jamais un `href` : voir `LeadPanel`. */
  onOpenFull: () => void;
}

export default function PublishPanel({ formation, loading, onOpenFull }: PublishPanelProps) {
  const { t } = useTranslation('admin');

  if (loading) {
    return (
      <GlassPanel level="night" padding={18}>
        <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('formations.console.panelLoading')}</p>
      </GlassPanel>
    );
  }

  if (!formation) {
    return (
      <GlassPanel level="night" padding={18}>
        <SiteEyebrow style={{ marginBottom: '6px' }}>{t('formations.console.panelEyebrow')}</SiteEyebrow>
        <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('formations.console.panelNone')}</p>
      </GlassPanel>
    );
  }

  const list = formationChecklist(formation);
  const published = formation.status === 'published';

  const conditionLabel = (id: PublishConditionId) => t(`formations.console.check.${id}.title`);

  return (
    <>
      <SiteEyebrow>{t('formations.console.panelEyebrow')}</SiteEyebrow>
      <p className="m-0 mt-1.5 font-display text-[18px] font-black leading-tight tracking-[-.03em] text-ink">
        {formation.title}
      </p>

      {/* La barre est une affirmation chiffrée : elle porte sa source et l'instant de son
          calcul, comme n'importe quel relevé de la console. */}
      <ProgressBar
        value={list.percent}
        source="db"
        asOf={list.asOf}
        label={t('formations.console.panelProgressLabel')}
        style={{ marginTop: '14px' }}
      />
      <p className="m-0 mt-2 text-meta-2 text-ink-2">
        <Num value={list.done} source="db" asOf={list.asOf} />
        {' / '}
        <Num value={list.total} source="db" asOf={list.asOf} />{' '}
        {t('formations.console.panelProgressSuffix', { count: list.done })}
      </p>

      <GlassPanel level="night" padding="4px 16px" className="rv mt-3.5" style={{ ['--i' as string]: 1 }}>
        <ul className="m-0 list-none p-0" aria-label={t('formations.console.checklistTitle')}>
          {list.items.map((item, i) => (
            <li key={item.id}>
              <LessonRow
                icon={(
                  <Icon
                    name={item.ok ? 'check' : 'alert'}
                    size={14}
                    color={item.ok ? 'var(--ok)' : 'var(--warn)'}
                  />
                )}
                iconBackground={`color-mix(in srgb, var(${item.ok ? '--ok' : '--warn'}) 20%, transparent)`}
                title={conditionLabel(item.id)}
                meta={t(`formations.console.check.${item.id}.${item.ok ? 'ok' : 'ko'}`, item.counts)}
                trailing={(
                  <Tag tone={item.ok ? 'ok' : 'warn'}>
                    {item.ok ? t('formations.console.checkReady') : t('formations.console.checkTodo')}
                  </Tag>
                )}
                last={i === list.items.length - 1}
              />
            </li>
          ))}
        </ul>
      </GlassPanel>

      <Button size="sm" tone="quiet" fullWidth onClick={onOpenFull} style={{ marginTop: '14px' }}>
        {t('formations.console.panelOpenFull')}
      </Button>

      <p className="m-0 mt-2.5 text-meta-2 leading-[1.5] text-ink-3">
        {published
          ? t('formations.console.panelPublishedNote')
          : t('formations.console.panelBlockedNote')}
      </p>

      {/* CE QUE LA CHECKLIST NE FAIT PAS. Elle vit côté saisie : `firestore.rules` autorise
          un administrateur à écrire `status: 'published'` sur un document vide, et aucune
          Cloud Function ne réagit. Un garde-fou dont on croit à tort qu'il tient côté
          serveur est pire que pas de garde-fou du tout. */}
      <GlassPanel level="night" padding={16} className="rv mt-3.5" style={{ ['--i' as string]: 2 }}>
        <SiteEyebrow style={{ marginBottom: '6px' }}>{t('formations.console.panelGuardTitle')}</SiteEyebrow>
        <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('formations.console.panelGuardBody')}</p>
      </GlassPanel>
    </>
  );
}

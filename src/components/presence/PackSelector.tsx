import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, GlassPanel, PayOption, StepDots, TerritoryCard } from '@ds';
import { SELECTOR_QUESTIONS, recommend, type SelectorAnswers, type Recommendation } from '../../lib/presence/offer';

interface Props {
  /**
   * Appelé à CHAQUE recommandation complète, y compris après modification d'une
   * réponse déjà donnée. Le parent y branche la mise à jour du formulaire : sans ça,
   * modifier une réponse après coup laisserait le formulaire sur l'ancien pack.
   */
  onRecommend: (reco: Recommendation) => void;
  /** Emmène le visiteur vers le formulaire, déjà synchronisé. */
  onAccept: (reco: Recommendation) => void;
  /** Remise à zéro : le parent efface aussi la sélection du formulaire. */
  onReset: () => void;
  /** Force la réinitialisation depuis le parent (après envoi du formulaire). */
  resetSignal?: number;
}

/**
 * « Trouve ton pack en 3 questions ».
 *
 * Sans lui, la page présente cinq offres et six options : le commerçant repart sans
 * décider. Le sélecteur ramène ce mur de prix à une seule recommandation, justifiée.
 *
 * ── CE QUE LA MAQUETTE IMPOSE, ET CE QU'ELLE NE DIT PAS ──────────────────────────
 * `PagesCore.Presence` et `ScreensTPE.PresenceOffre` dessinent tous deux le même bloc :
 * `StepDots` en tête, puis des `PayOption` empilés à 58 px (56 en mobile). Les deux
 * planches ne montrent qu'UNE question à l'écran, avec `current={1}` puis `current={2}`.
 *
 * On garde les trois questions visibles. Une planche est un instantané : elle ne peut
 * montrer qu'une étape à la fois, et n'a donc pas à choisir entre un tunnel et une
 * liste. Le composant, lui, doit trancher — et le tunnel casserait la propriété que le
 * commentaire de `onRecommend` décrit : revenir sur une réponse déjà donnée et voir la
 * recommandation se mettre à jour. `StepDots` compte alors les réponses données, ce qui
 * est précisément ce que la clé `selector.progress` formule déjà en toutes lettres.
 *
 * `PayOption` porte de vraies `<input type="radio">` partageant un `name` : la
 * navigation clavier par flèches et l'annonce du choix viennent du navigateur, pas
 * d'attributs ARIA posés à la main sur des boutons.
 * ─────────────────────────────────────────────────────────────────────────────────
 */
export default function PackSelector({ onRecommend, onAccept, onReset, resetSignal = 0 }: Props) {
  const { t } = useTranslation('presence');
  const [answers, setAnswers] = useState<SelectorAnswers>({});

  const reco = useMemo(() => recommend(answers), [answers]);

  // Remonter la recommandation est un effet, pas un calcul : le faire pendant le rendu
  // déclencherait une mise à jour d'état du parent au milieu du rendu de l'enfant.
  useEffect(() => {
    if (reco) onRecommend(reco);
  }, [reco, onRecommend]);

  // Le parent a vidé le formulaire (envoi réussi) : les réponses n'ont plus de sens.
  useEffect(() => {
    if (resetSignal > 0) setAnswers({});
  }, [resetSignal]);

  const answered = Object.keys(answers).length;
  const total = SELECTOR_QUESTIONS.length;

  const pick = (question: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [question]: option }));
  };

  const handleReset = () => {
    setAnswers({});
    onReset();
  };

  return (
    <GlassPanel level="flat" padding={26}>
      <StepDots
        total={total}
        current={answered}
        label={t('selector.title')}
        steps={SELECTOR_QUESTIONS.map((q) => t(`selector.questions.${q.key}.label`))}
        style={{ marginBottom: '18px' }}
      />

      <div className="grid gap-7">
        {SELECTOR_QUESTIONS.map((q) => {
          const current = answers[q.key as keyof SelectorAnswers];
          return (
            <fieldset key={q.key} className="m-0 border-0 p-0">
              <legend className="mb-4 p-0 text-[17px] font-bold leading-[1.32] text-ink">
                {t(`selector.questions.${q.key}.label`)}
              </legend>
              <div className="grid gap-[9px]">
                {q.options.map((opt) => (
                  <PayOption
                    key={opt}
                    name={`selector-${q.key}`}
                    value={opt}
                    checked={current === opt}
                    onChange={(v) => pick(q.key, v)}
                    title={t(`selector.questions.${q.key}.options.${opt}`)}
                    style={{ minHeight: '58px' }}
                  />
                ))}
              </div>
            </fieldset>
          );
        })}
      </div>

      {/* Le résultat s'annonce aux lecteurs d'écran dès qu'il apparaît. */}
      <div aria-live="polite" className="mt-6">
        {reco ? (
          <TerritoryCard
            first
            territory="digitalise"
            padding={22}
            meta={t('selector.resultEyebrow')}
            title={
              reco.plan !== 'aucun'
                ? `${t(`packs.${reco.pack}.name`)} + ${t(`plans.${reco.plan}.name`)}`
                : t(`packs.${reco.pack}.name`)
            }
            titleSize={23}
          >
            <p className="m-0 mt-[9px] text-[13.5px] leading-[1.5] text-[color:var(--card-ink-2)]">
              {t(`selector.reasons.${reco.reasonKey}`)}
            </p>
            <div className="mt-[18px] flex flex-wrap gap-3">
              <Button tone="digitalise" size="sm" fullWidth={false} onClick={() => onAccept(reco)}>
                {t('selector.accept')}
              </Button>
              <Button tone="quiet" size="sm" fullWidth={false} onClick={handleReset}>
                {t('selector.reset')}
              </Button>
            </div>
          </TerritoryCard>
        ) : (
          <p className="mm-num m-0 text-meta-2 text-ink-3">
            {t('selector.progress', { answered, total })}
          </p>
        )}
      </div>

      <p className="m-0 mt-[13px] text-meta-2 text-ink-3">{t('selector.privacy')}</p>
    </GlassPanel>
  );
}

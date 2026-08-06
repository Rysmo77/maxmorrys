import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, ArrowRight, RotateCcw } from 'lucide-react';
import { universeThemes } from '../../lib/sectionThemes';
import { SELECTOR_QUESTIONS, recommend, type SelectorAnswers, type Recommendation } from '../../lib/agency/offer';

const theme = universeThemes.agency;

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
 * Chaque question est un `radiogroup` natif : navigation clavier par flèches obtenue
 * gratuitement, choix annoncé aux lecteurs d'écran.
 */
export default function PackSelector({ onRecommend, onAccept, onReset, resetSignal = 0 }: Props) {
  const { t } = useTranslation('agency');
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
    <div className="rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-7 sm:p-9">
      <div className="flex items-center gap-3 mb-2">
        <Compass className={`w-6 h-6 shrink-0 ${theme.accentText}`} aria-hidden="true" />
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
          {t('selector.title')}
        </h2>
      </div>
      <p className="text-sm text-neutral-500 mb-8">{t('selector.subtitle')}</p>

      <div className="space-y-8">
        {SELECTOR_QUESTIONS.map((q, qi) => {
          const groupId = `selector-${q.key}`;
          const current = answers[q.key as keyof SelectorAnswers];
          return (
            <fieldset key={q.key}>
              <legend id={groupId} className="text-sm font-bold text-neutral-900 dark:text-white mb-3">
                <span className={`${theme.accentText} tabular-nums`}>{qi + 1}.</span>{' '}
                {t(`selector.questions.${q.key}.label`)}
              </legend>
              <div role="radiogroup" aria-labelledby={groupId} className="flex flex-wrap gap-2.5">
                {q.options.map((opt) => {
                  const selected = current === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => pick(q.key, opt)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                        selected
                          ? 'border-lagoon-500 bg-lagoon-500 text-neutral-900'
                          : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-lagoon-400'
                      }`}
                    >
                      {t(`selector.questions.${q.key}.options.${opt}`)}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>

      {/* Résultat — annoncé aux lecteurs d'écran dès qu'il apparaît */}
      <div aria-live="polite" className="mt-8">
        {reco ? (
          <div className="rounded-2xl bg-lagoon-50 dark:bg-lagoon-900/20 border border-lagoon-200 dark:border-lagoon-800 p-6">
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-neutral-500 mb-2">
              {t('selector.resultEyebrow')}
            </p>
            <p className="text-xl font-black text-neutral-900 dark:text-white mb-1">
              {t(`packs.${reco.pack}.name`)}
              {reco.plan !== 'aucun' && (
                <span className="text-neutral-500 font-bold">
                  {' + '}{t(`plans.${reco.plan}.name`)}
                </span>
              )}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-5">
              {t(`selector.reasons.${reco.reasonKey}`)}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onAccept(reco)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-colors ${theme.buttonSolid}`}
              >
                {t('selector.accept')}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                {t('selector.reset')}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-500 tabular-nums">
            {t('selector.progress', { answered, total })}
          </p>
        )}
      </div>
    </div>
  );
}

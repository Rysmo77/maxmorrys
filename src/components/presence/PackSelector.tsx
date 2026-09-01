import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, DocLine, GlassPanel, PayOption, StepDots, TerritoryCard } from '@ds';
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

const TOTAL = SELECTOR_QUESTIONS.length;
/** Écran de récapitulatif et de résultat, juste après la dernière question. */
const RESULT = TOTAL;

/**
 * Battement avant d'enchaîner sur la question suivante. Assez long pour VOIR sa réponse se
 * cocher — sans quoi l'écran change avant que le geste soit confirmé, et on doute d'avoir
 * cliqué au bon endroit — assez court pour ne pas se vivre comme une attente.
 */
const ADVANCE_MS = 260;

type QuestionKey = keyof SelectorAnswers;

/**
 * Où aller après avoir répondu : à la PREMIÈRE question encore vide, et au résultat s'il
 * n'y en a plus. Ce n'est pas `step + 1`, et la différence se voit dès qu'on revient en
 * arrière : corriger la question 1 alors que la 3 est restée vide ramène à la 3, pas à la 2.
 */
function nextStepFrom(a: SelectorAnswers): number {
  const firstEmpty = SELECTOR_QUESTIONS.findIndex((q) => !a[q.key as QuestionKey]);
  return firstEmpty === -1 ? RESULT : firstEmpty;
}

/**
 * « Trouve ton pack en 3 questions » — UN TUNNEL, UNE QUESTION À L'ÉCRAN.
 *
 * Sans lui, la page présente cinq offres et six options : le commerçant repart sans
 * décider. Le sélecteur ramène ce mur de prix à une seule recommandation, justifiée.
 *
 * ── POURQUOI CE N'EST PLUS UNE LISTE ─────────────────────────────────────────────────
 * Les trois questions étaient empilées, visibles ensemble. Le commentaire qui défendait ce
 * choix disait : « une planche est un instantané, elle ne peut montrer qu'une étape à la
 * fois et n'a donc pas à choisir entre un tunnel et une liste ». C'est vrai d'une planche
 * isolée ; ça l'est beaucoup moins quand `PagesCore.Presence` ET `ScreensTPE.PresenceOffre`
 * dessinent LA MÊME chose — une question, `StepDots current={2}`, la suivante cachée. Deux
 * planches concordantes ne décrivent plus un instantané : elles décrivent un tunnel.
 *
 * Et le compte y était : trois questions, mais DIX options de 68 px portant des phrases
 * entières (« Oui, et je veux encaisser en ligne »). Empilées, elles font près de deux
 * écrans de téléphone de boutons radio avant la moindre recommandation — sur une page qui
 * promet « trente secondes » et « pas un formulaire de dix champs ».
 *
 * L'ARGUMENT CONTRE LE TUNNEL RESTE VRAI, ET IL EST TRAITÉ. Le tunnel casserait « revenir
 * sur une réponse déjà donnée et voir la recommandation se mettre à jour » — mais ce n'est
 * pas une propriété des listes, c'est une propriété des tunnels qui savent revenir en
 * arrière. D'où trois choses : un bouton Retour, un récapitulatif final où chaque réponse
 * est un bouton qui y ramène, et le renvoi direct au résultat dès que les trois réponses
 * existent. On corrige une réponse et on revoit sa recommandation en deux gestes, sans
 * jamais retraverser les dix options.
 *
 * L'ENCHAÎNEMENT AUTOMATIQUE NE SE DÉCLENCHE QU'AU DOIGT. `PayOption` porte de vrais
 * `<input type="radio">` partageant un `name` : les flèches du clavier PARCOURENT ET
 * SÉLECTIONNENT à la fois. Enchaîner sur `onChange` rendrait donc le groupe intraversable
 * au clavier — première flèche, question suivante. Le geste est donc reconnu à
 * `pointerdown`, qu'un clavier n'émet jamais ; qui navigue au clavier avance avec le bouton
 * « Suivant », qui n'apparaît que sur une question déjà répondue.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
export default function PackSelector({ onRecommend, onAccept, onReset, resetSignal = 0 }: Props) {
  const { t } = useTranslation('presence');
  const [answers, setAnswers] = useState<SelectorAnswers>({});
  const [step, setStep] = useState(0);

  const reco = useMemo(() => recommend(answers), [answers]);

  /** Cible du focus à chaque changement d'étape : la question, ou le titre du résultat. */
  const headingRef = useRef<HTMLLegendElement>(null);
  /** Vrai entre le `pointerdown` d'une option et le traitement de son changement. */
  const tapped = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** Le focus ne se déplace qu'après une action DU VISITEUR, jamais au premier rendu. */
  const navigated = useRef(false);

  // Remonter la recommandation est un effet, pas un calcul : le faire pendant le rendu
  // déclencherait une mise à jour d'état du parent au milieu du rendu de l'enfant.
  useEffect(() => {
    if (reco) onRecommend(reco);
  }, [reco, onRecommend]);

  // Le parent a vidé le formulaire (envoi réussi) : les réponses n'ont plus de sens.
  useEffect(() => {
    if (resetSignal > 0) {
      setAnswers({});
      setStep(0);
      navigated.current = false;
    }
  }, [resetSignal]);

  // Un minuteur d'enchaînement encore en vol après le démontage écrirait dans un composant
  // disparu — c'est le cas exact du visiteur qui répond puis quitte la page dans la foulée.
  useEffect(() => () => clearTimeout(timer.current), []);

  /*
    L'étape a changé : on emmène le focus avec elle. Sans ça, qui navigue au clavier reste
    posé sur un bouton qui n'existe plus et repart du haut du document ; qui lit à l'écran
    n'entend jamais la question suivante, puisque rien n'a bougé de son point de lecture.
    La cible porte `tabIndex={-1}` — atteignable par programme, absente du parcours de
    tabulation, comme le veut la règle des cibles atteignables.
  */
  useEffect(() => {
    if (!navigated.current) return;
    headingRef.current?.focus();
  }, [step]);

  const goTo = useCallback((next: number) => {
    clearTimeout(timer.current);
    navigated.current = true;
    setStep(next);
  }, []);

  const pick = (question: string, option: string) => {
    const next = { ...answers, [question]: option } as SelectorAnswers;
    setAnswers(next);

    const wasTap = tapped.current;
    tapped.current = false;
    // Au clavier, c'est « Suivant » qui avance : voir l'en-tête du composant.
    if (!wasTap) return;

    clearTimeout(timer.current);
    timer.current = setTimeout(() => goTo(nextStepFrom(next)), ADVANCE_MS);
  };

  const handleReset = () => {
    clearTimeout(timer.current);
    setAnswers({});
    goTo(0);
    onReset();
  };

  const question = step < RESULT ? SELECTOR_QUESTIONS[step] : null;
  const currentAnswer = question ? answers[question.key as QuestionKey] : undefined;

  return (
    <GlassPanel level="flat" padding={26}>
      <StepDots
        total={TOTAL}
        current={Math.min(step + 1, TOTAL)}
        label={t('selector.title')}
        steps={SELECTOR_QUESTIONS.map((q) => t(`selector.questions.${q.key}.label`))}
      />
      <p className="mm-num m-0 mt-[10px] text-meta-2 text-ink-3">
        {step < RESULT
          ? t('selector.step', { current: step + 1, total: TOTAL })
          : t('selector.answersTitle')}
      </p>

      {question ? (
        /* `key` remonte l'animation d'entrée à chaque question : `.mm-drop` ne joue qu'au
           montage, et sans clé React réutiliserait le même nœud d'une question à l'autre.
           Sa durée lit `--t-enter`, ramené à 1 ms par `prefers-reduced-motion` à la racine —
           il n'y a donc rien à désactiver ici. */
        <fieldset key={question.key} className="mm-drop m-0 mt-[18px] border-0 p-0">
          {/* Le `tabIndex` et la référence sont posés sur la LÉGENDE elle-même : `<legend>`
              n'accepte que du contenu phrasé, et le `<p>` qu'on y avait glissé pour porter le
              focus en faisait un fieldset au balisage invalide. */}
          <legend
            ref={headingRef}
            tabIndex={-1}
            className="p-0 text-[17px] font-bold leading-[1.32] text-ink outline-none"
          >
            {t(`selector.questions.${question.key}.label`)}
          </legend>
          <div className="mt-4 grid gap-[9px]">
            {question.options.map((opt) => (
              /* Le `pointerdown` est capté sur l'enveloppe, pas sur `PayOption` : le geste
                 doit être reconnu AVANT que le radio change, et une souris ou un doigt sont
                 les seuls à en émettre un. */
              <div key={opt} onPointerDown={() => { tapped.current = true; }}>
                <PayOption
                  name={`selector-${question.key}`}
                  value={opt}
                  checked={currentAnswer === opt}
                  onChange={(v) => pick(question.key, v)}
                  title={t(`selector.questions.${question.key}.options.${opt}`)}
                  style={{ minHeight: '58px' }}
                />
              </div>
            ))}
          </div>
        </fieldset>
      ) : (
        /* LE RÉCAPITULATIF — c'est lui qui rend le tunnel réversible. Trois lignes, la
           réponse en bouton : un geste pour revenir sur n'importe laquelle, au lieu de
           retraverser dix options empilées. */
        <div className="mm-drop mt-[14px] grid gap-[2px]">
          {SELECTOR_QUESTIONS.map((q, i) => (
            <DocLine
              key={q.key}
              label={t(`selector.questions.${q.key}.label`)}
              value={
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  className="mm-touch-extend cursor-pointer border-0 bg-transparent p-0 font-bold underline decoration-dotted underline-offset-4"
                  style={{ color: 'var(--mm-teal-t)' }}
                >
                  {t(`selector.questions.${q.key}.options.${answers[q.key as QuestionKey]}`)}
                  <span className="sr-only"> — {t('selector.change')}</span>
                </button>
              }
              last={i === SELECTOR_QUESTIONS.length - 1}
              style={{ flexWrap: 'wrap' }}
            />
          ))}
        </div>
      )}

      {/* Retour dès la deuxième étape ; « Suivant » seulement sur une question déjà
          répondue — au doigt on y est déjà, il ne s'affiche donc en pratique qu'au clavier
          et quand on revient relire une réponse. */}
      {(step > 0 || currentAnswer) && (
        <div className="mt-[18px] flex flex-wrap gap-3">
          {step > 0 && (
            <Button tone="quiet" size="sm" fullWidth={false} onClick={() => goTo(step - 1)}>
              {t('selector.back')}
            </Button>
          )}
          {currentAnswer && (
            <Button
              tone="digitalise"
              size="sm"
              fullWidth={false}
              onClick={() => goTo(nextStepFrom(answers))}
            >
              {t('selector.next')}
            </Button>
          )}
        </div>
      )}

      {/* Le résultat s'annonce aux lecteurs d'écran dès qu'il apparaît. */}
      <div aria-live="polite" className="mt-6">
        {step === RESULT && reco && (
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
        )}
      </div>

      <p className="m-0 mt-[13px] text-meta-2 text-ink-3">{t('selector.privacy')}</p>
    </GlassPanel>
  );
}

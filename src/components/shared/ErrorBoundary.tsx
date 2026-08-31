import { Component, type ReactNode } from 'react';
import { captureError } from '../../lib/sentry';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  /** Identifiant Sentry de l'incident, quand la télémétrie est active. */
  incident?: string;
}

/**
 * ── L'ÉCRAN D'ERREUR, DERNIER RECOURS ────────────────────────────────────────────────
 *
 * `ui_kits/plateforme/ScreensEtats.js`, écran `Erreur`, pose la règle en trois mots :
 * **motif, conséquence, sortie — dans cet ordre.** Un message d'erreur ne s'excuse pas.
 *
 * Ce que cet écran remplace disait exactement le contraire : « Oups, quelque chose s'est
 * mal passe » — une excuse, une formule vide, et une faute d'accent. Aucun motif, aucune
 * conséquence, et pour toute sortie un rechargement.
 *
 * POURQUOI LE TEXTE EST ÉCRIT ICI ET NON DANS i18next.
 * C'est une frontière d'erreur : elle s'affiche précisément quand l'arbre React est tombé,
 * et i18next peut faire partie de ce qui est tombé. Appeler `useTranslation` depuis un
 * composant de classe est de toute façon impossible. La langue est donc lue sur
 * `<html lang>`, que le routeur pose et qui survit à n'importe quel plantage de rendu.
 *
 * POURQUOI IL N'Y A PAS DE PORTÉE `.dk` NI DE VARIANTE `dark:`.
 * Les jetons basculent seuls (AD-3). L'ancienne version peignait un `dark:bg-…` à la main :
 * une couleur de plus à tenir à jour, pour un résultat que la portée donne gratuitement.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    const incident = captureError(error, { componentStack: info.componentStack ?? undefined });
    this.setState({ incident });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const en = typeof document !== 'undefined' && document.documentElement.lang.startsWith('en');
    const T = en
      ? {
        title: 'This screen stopped.',
        causeLabel: 'The cause',
        cause: 'Part of the page failed while rendering. It is a fault in the code, not something you did.',
        effectLabel: 'What it means',
        effect: 'Nothing you had saved is lost — your work lives on your account, not in this tab. Reloading picks it back up.',
        reload: 'Reload the page',
        home: 'Back to home',
        incident: 'Incident reference',
        noIncident: 'No reference: error reporting is off on this build.',
      }
      : {
        title: 'Cet écran s’est arrêté.',
        causeLabel: 'Le motif',
        cause: 'Une partie de la page a échoué pendant son affichage. C’est un défaut du code, pas quelque chose que tu as fait.',
        effectLabel: 'La conséquence',
        effect: 'Rien de ce qui était enregistré n’est perdu : ton travail vit sur ton compte, pas dans cet onglet. Recharger le reprend où il était.',
        reload: 'Recharger la page',
        home: 'Revenir à l’accueil',
        incident: 'Référence de l’incident',
        noIncident: 'Pas de référence : le rapport d’erreurs est coupé sur cette version.',
      };

    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--fill-1)] px-[18px] py-16">
        <div className="play w-full max-w-[520px]">
          <h1 className="m-0 font-display text-[30px] font-black leading-[1.1] tracking-[-.03em] text-ink">
            {T.title}
          </h1>

          {/*
            Faux verre — `--glass-flat`. Cet encart défile avec la page, et la règle 1 ne
            laisse le flou qu'au chrome fixe. Ici il n'y a rien de fixe du tout.
          */}
          <div className="mt-5 rounded-panel border border-[color:var(--border-hair)] bg-[color:var(--glass-flat)] p-[18px]">
            <p className="mm-eyebrow m-0 mb-2 text-ink-2">{T.causeLabel}</p>
            <p className="m-0 text-meta leading-[1.5] text-ink">{T.cause}</p>
            <div className="my-[14px] h-px bg-[color:var(--border-hair)]" />
            <p className="mm-eyebrow m-0 mb-2 text-ink-2">{T.effectLabel}</p>
            <p className="m-0 text-meta leading-[1.5] text-ink">{T.effect}</p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-pill bg-[color:var(--action-primary)] px-6 py-3 font-bold text-[color:var(--on-action)] transition-transform active:scale-[.98]"
            >
              {T.reload}
            </button>
            {/*
              Un vrai `<a href>`, et pas un appel au routeur : le routeur fait partie de ce
              qui vient peut-être de tomber. Une navigation du navigateur, elle, marche
              toujours. Le chemin est racine, donc valide dans les deux langues.
            */}
            <a
              href="/"
              className="rounded-pill border border-[color:var(--border-hair)] px-6 py-3 text-center font-bold text-ink transition-transform active:scale-[.98]"
            >
              {T.home}
            </a>
          </div>

          {/*
            LA RÉFÉRENCE D'INCIDENT — la seule chose que quelqu'un puisse recopier au support
            pour qu'on retrouve SA trace. Monospace, parce qu'elle vient du système : c'est
            l'identifiant d'événement rendu par Sentry, pas un numéro fabriqué. Quand la
            télémétrie est coupée, il n'y en a pas, et la ligne le dit.
          */}
          <p className="mt-4 text-center text-meta-2 text-ink-2">
            {this.state.incident
              ? <>{T.incident} : <b className="mm-num text-ink">{this.state.incident}</b></>
              : T.noIncident}
          </p>
        </div>
      </div>
    );
  }
}

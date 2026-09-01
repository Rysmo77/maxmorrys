import { Component, type ReactNode } from 'react';
import { captureError } from '../../lib/sentry';
import ErrorScreen from './ErrorScreen';

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
 * ── CE QU'IL ATTRAPE, ET CE QU'IL N'ATTRAPE PLUS ──────────────────────────────────────
 * Il enveloppe les FOURNISSEURS eux-mêmes, donc il reste le dernier recours : un plantage
 * du thème, de l'authentification ou du routeur lui-même finit ici.
 *
 * Il n'est plus le SEUL filet. Chaque route porte désormais un `errorElement`
 * (`RouteError`) : le plantage d'une page s'affiche DANS la coquille, en gardant la
 * navigation utilisable, au lieu de faire tomber l'application entière. Avant, une seule
 * frontière couvrait soixante-dix routes.
 *
 * Le dessin de l'écran vit dans `ErrorScreen` — les deux l'affichent, et le recopier
 * aurait donné deux écrans d'erreur à faire diverger.
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
    return <ErrorScreen incident={this.state.incident} />;
  }
}

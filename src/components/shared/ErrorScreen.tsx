/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'ÉCRAN D'ERREUR — motif, conséquence, sortie, DANS CET ORDRE.
 *
 * `ui_kits/plateforme/ScreensEtats.js`, écran `Erreur`. Un message d'erreur ne s'excuse
 * pas : il dit ce qui s'est passé, ce que ça change, et par où sortir.
 *
 * Il vit désormais dans son propre fichier parce que DEUX choses l'affichent :
 *   · `ErrorBoundary` — le dernier recours, autour des fournisseurs eux-mêmes ;
 *   · `RouteError` — l'`errorElement` du routeur, qui attrape le plantage d'UNE page
 *     sans emporter la coquille.
 * Le recopier aurait donné deux écrans d'erreur à faire diverger.
 *
 * POURQUOI LE TEXTE N'EST PAS DANS i18next. Il s'affiche précisément quand l'arbre React
 * est tombé — et i18next peut faire partie de ce qui est tombé. La langue est lue sur
 * `<html lang>`, que le routeur pose et qui survit à n'importe quel plantage de rendu.
 *
 * POURQUOI PAS DE `.dk` NI DE `dark:`. Les jetons basculent seuls (AD-3).
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export default function ErrorScreen({ incident }: { incident?: string }) {
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
          {incident
            ? <>{T.incident} : <b className="mm-num text-ink">{incident}</b></>
            : T.noIncident}
        </p>
      </div>
    </div>
  );
}

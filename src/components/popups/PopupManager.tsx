import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker, useLocation, type BlockerFunction } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { toCanonicalPath, localizedPath } from '../../i18n/routing';
import { trackEvent } from '../../lib/tracking';
import { queryClient, queryKeys } from '../../lib/queryClient';
// Imports directs plutôt que via le barrel `lib/firestore` : celui-ci fait
// `export *` sur 17 modules, ce qui en tirait plusieurs dans le chunk d'entrée.
import { getPublishedFormations, getFormationBySlug } from '../../lib/firestore/formations';
import type { Formation } from '../../types';
import { captureEntrySource, type EntrySource } from '../../lib/popups/entrySource';
import { loadPopupSettings, type PopupSettings } from '../../lib/popups/settings';
import { canShow, markShown, blockedBy, markSuppressed, type PopupId } from '../../lib/popups/rules';
import { readPopupOverride, installPopupDebug } from '../../lib/popups/debug';
import { findEligible, getDefinition, type PopupContext, type PopupTrigger } from '../../lib/popups/registry';
import { getVariant, type PopupVariant } from '../../lib/popups/variant';
import { sendPopupEvent } from '../../lib/popups/beacon';
import { getPendingCart, clearCartPending } from '../../lib/popups/cart';
import { useExitIntent } from '../../hooks/useExitIntent';
/*
  L'arbitre reste en import direct (cf. son montage dans `App.tsx`), mais les
  surfaces qu'il rend ne le sont plus : elles pesaient dans le chunk d'entrée de
  chaque visiteur alors que `PopupManager` renvoie `null` la quasi-totalité du
  temps. Elles ne sont demandées qu'au moment où une pop-up devient active.
*/
const PopupSurface = lazy(() => import('./PopupSurface'));
const PopupAurora = lazy(() => import('./PopupAurora'));
const AudienceRouterPopup = lazy(() => import('./AudienceRouterPopup'));
const FormationsEntryPopup = lazy(() => import('./FormationsEntryPopup'));
const FormationExitPopup = lazy(() => import('./FormationExitPopup'));
const PresenceExitPopup = lazy(() => import('./PresenceExitPopup'));
const BlogEndPopup = lazy(() => import('./BlogEndPopup'));
const CartRecoveryPopup = lazy(() => import('./CartRecoveryPopup'));

/**
 * Arbitre UNIQUE des pop-ups contextuelles du site public.
 *
 * ⚠️ Ne jamais laisser un composant de pop-up décider seul de s'afficher. Le site empile déjà
 * quatre couches flottantes (bandeau cookies, suggestion de langue, bannière d'annonce, bouton
 * WhatsApp collant) : sans point de décision unique, un visiteur en recevrait plusieurs d'affilée.
 *
 * La PERTINENCE — quelle fenêtre, sur quelle page — vit dans `lib/popups/registry.ts`, sous forme
 * de données. Les PLAFONDS vivent dans `lib/popups/rules.ts`. Ce composant ne fait que les
 * appliquer, brancher les déclencheurs et rendre le contenu. Une pop-up de plus doit être une
 * entrée de registre plus un composant de contenu, jamais une condition supplémentaire ici.
 *
 * Monté dans `PublicLayout` — donc jamais sur le LMS, l'authentification ni l'administration.
 */

/** Déclencheur effectif, `forced` en plus de ceux du registre (mode aperçu). */
type ActiveTrigger = PopupTrigger | 'forced';

interface ActivePopup {
  id: PopupId;
  trigger: ActiveTrigger;
}

/** Temps de présence avant une sollicitation de découverte. */
const DWELL_MS = 25000;

/** Profondeur de lecture pour `dwell` — la première des deux conditions déclenche. */
const DWELL_SCROLL = 0.4;

/** Profondeur de lecture pour une fin d'article : le visiteur doit avoir vraiment lu. */
const END_SCROLL = 0.9;

/** Retire un éventuel `/` final pour que `/agence/` et `/agence` se comparent à l'identique. */
function normalizePath(pathname: string): string {
  const canonical = toCanonicalPath(pathname);
  return canonical.length > 1 && canonical.endsWith('/') ? canonical.slice(0, -1) : canonical;
}

export default function PopupManager() {
  const { t } = useTranslation('shared');
  const { pathname, search } = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();

  const [source, setSource] = useState<EntrySource>('unknown');
  const [settings, setSettings] = useState<PopupSettings | null>(null);
  const [active, setActive] = useState<ActivePopup | null>(null);
  const [featured, setFeatured] = useState<Formation | null>(null);
  const [cartFormation, setCartFormation] = useState<Formation | null>(null);

  const path = normalizePath(pathname);
  const activeTrigger = active?.trigger ?? null;
  /*
    Lecture localStorage + `JSON.parse`. Mémoïsée : cet arbitre est monté sur
    toutes les pages publiques et re-rend à chaque navigation comme à chaque
    rendu des providers auth/langue. `active` figure dans les dépendances pour
    que la fermeture d'une fenêtre relise le marqueur effacé par `clearCartPending`.
  */
  // `path` et `active` ne sont pas des dépendances au sens strict : ce sont les
  // deux moments où le marqueur a pu changer sous nos pieds.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pendingCartSlug = useMemo(() => getPendingCart(), [path, active]);

  useEffect(() => {
    setSource(captureEntrySource());
  }, []);

  /*
    Aperçu forcé `?popup=<id>`. Contourne TOUS les verrous — plafonds, registre, réglages, groupe
    témoin — parce que son objet est précisément de voir une fenêtre que les verrous empêchent
    d'apparaître. Il ne consomme aucun plafond et n'émet aucun événement.
  */
  const forced = useMemo(() => readPopupOverride(search), [search]);
  useEffect(() => {
    if (forced) setActive({ id: forced, trigger: 'forced' });
  }, [forced]);

  // ── Quelle pop-up serait pertinente ici ? ────────────────────────────────────────────────────
  const context = useMemo<PopupContext>(() => ({
    path,
    entrySource: source,
    isSignedIn: !authLoading && !!user,
    hasPendingCart: pendingCartSlug !== null,
  }), [path, source, authLoading, user, pendingCartSlug]);

  /*
    Tant que l'authentification n'est pas résolue, on ne décide rien : traiter une session non
    encore chargée comme « visiteur anonyme » ferait apparaître des fenêtres réservées aux
    inconnus devant un apprenant connecté, l'espace d'une seconde.
  */
  const definition = authLoading ? null : findEligible(context);
  const candidate = definition && canShow(definition.id) ? definition : null;

  // ── Réglages : lus SEULEMENT si une pop-up a réellement une chance de s'afficher ─────────────
  useEffect(() => {
    if (settings || !candidate) return;
    let alive = true;
    loadPopupSettings().then((loaded) => {
      if (alive) setSettings(loaded);
    });
    return () => { alive = false; };
  }, [settings, candidate]);

  /*
    Groupe témoin. Assigné une fois les réglages connus, car la proportion exposée est pilotée
    depuis l'administration. Le témoin ne voit AUCUNE fenêtre — c'est ce qui rend la mesure
    interprétable.
  */
  const variant: PopupVariant | null = settings ? getVariant(settings.treatmentShare) : null;

  const enabled = candidate !== null && settings?.enabled[candidate.id] === true;
  const armed = enabled && variant === 'treatment' && active === null;

  // ── Données nécessaires, préchargées AVANT l'ouverture ───────────────────────────────────────
  /*
    Sans cette avance, la fiche arriverait après l'ouverture et décalerait la mise en page sous les
    yeux du visiteur. Gardé par `enabled` et non par `armed` : ce dernier retombe à `false` à
    l'ouverture, ce qui annulerait le chargement au pire moment.
  */
  useEffect(() => {
    if (!enabled || candidate?.id !== 'formationsEntry' || featured) return;
    let alive = true;
    // `fetchQuery` et non un appel direct : la page d'accueil, la recherche et
    // les fiches de contenu lisent la même liste sous cette clé — une seule
    // lecture Firestore pour tout le monde, et rien si le cache est déjà chaud.
    queryClient
      .fetchQuery({ queryKey: queryKeys.publishedFormations, queryFn: () => getPublishedFormations() })
      .then((list) => {
        if (!alive || list.length === 0) return;
        setFeatured(list.find((f) => f.featured) ?? list[0]);
      })
      .catch(() => {
        // Catalogue illisible : repli textuel, la fenêtre s'affiche quand même.
      });
    return () => { alive = false; };
  }, [enabled, candidate, featured]);

  useEffect(() => {
    if (!enabled || candidate?.id !== 'cartRecovery' || !pendingCartSlug || cartFormation) return;
    let alive = true;
    getFormationBySlug(pendingCartSlug)
      .then((found) => { if (alive && found) setCartFormation(found); })
      .catch(() => {
        // Formation dépubliée ou introuvable : la fenêtre garde son texte seul.
      });
    return () => { alive = false; };
  }, [enabled, candidate, pendingCartSlug, cartFormation]);

  // ── Diagnostic console ───────────────────────────────────────────────────────────────────────
  /*
    `rules.ts` connaît ses propres verrous ; lui seul ignore le contexte de page. On le lui injecte,
    sinon `why()` répondrait « éligible » sur une pop-up que le chemin exclut. Les valeurs passent
    par une ref : figer l'objet au montage renverrait un état périmé dès le premier changement de
    route.
  */
  const contextRef = useRef<Record<string, unknown>>({});
  contextRef.current = {
    path,
    entrySource: source,
    isSignedIn: context.isSignedIn,
    pendingCartSlug,
    eligibleHere: definition?.id ?? null,
    settingsLoaded: settings !== null,
    enabled,
    variant,
    armed,
    activePopup: active?.id ?? null,
  };
  useEffect(() => {
    installPopupDebug(() => {
      /*
        `blockedBy` lit un sessionStorage et deux localStorage. Calculé ICI, au
        moment où quelqu'un appelle `why()`, et non à chaque rendu : la valeur
        n'a jamais servi qu'à ce diagnostic.
      */
      const eligible = contextRef.current.eligibleHere as PopupId | null;
      return {
        context: {
          ...contextRef.current,
          blockedBy: eligible ? blockedBy(eligible) : 'noneEligibleOnThisPath',
        },
      };
    });
  }, []);

  // ── Ouverture et mesure ──────────────────────────────────────────────────────────────────────
  const open = useCallback((id: PopupId, trigger: ActiveTrigger) => {
    markShown(id); // consomme le plafond de session AVANT l'affichage : une seule fenêtre passera
    setActive({ id, trigger });
    trackEvent('popup_impression', { popup_id: id, trigger, variant: 'treatment' });
    sendPopupEvent(id, 'impression', 'treatment');
  }, []);

  /*
    Le groupe témoin émet là où il AURAIT vu une fenêtre. Sans cet événement, on saurait ce que
    fait le groupe exposé sans savoir à quoi le comparer : les deux populations ne seraient plus
    appariées et la mesure ne prouverait rien.
  */
  const withheldRef = useRef<PopupId | null>(null);
  useEffect(() => {
    if (!enabled || variant !== 'control' || !candidate) return;
    if (withheldRef.current === candidate.id) return;
    withheldRef.current = candidate.id;
    markShown(candidate.id); // même plafond que le groupe exposé, sinon les populations divergent
    trackEvent('popup_withheld', { popup_id: candidate.id, variant: 'control' });
    sendPopupEvent(candidate.id, 'withheld', 'control');
  }, [enabled, variant, candidate]);

  /** Émetteur unique. Un affichage FORCÉ n'émet rien : l'aperçu ne doit pas gonfler les compteurs. */
  const emit = useCallback((event: string, params: Record<string, unknown>) => {
    if (activeTrigger === 'forced') return;
    trackEvent(event, { ...params, trigger: activeTrigger, variant: 'treatment' });
    const id = params.popup_id;
    if (typeof id === 'string') {
      sendPopupEvent(id as PopupId, event === 'popup_click' ? 'click' : 'dismiss', 'treatment');
    }
  }, [activeTrigger]);

  // ── Déclencheurs ─────────────────────────────────────────────────────────────────────────────
  const trigger = candidate?.trigger ?? null;

  const fireCandidate = useCallback((why: ActiveTrigger) => {
    if (candidate) open(candidate.id, why);
  }, [candidate, open]);

  // 1. Exit-intent souris (desktop uniquement — voir `useExitIntent`).
  const handleExitIntent = useCallback(() => { fireCandidate('exitIntent'); }, [fireCandidate]);
  useExitIntent(armed && trigger === 'exitIntent', handleExitIntent);

  /*
    2. Navigation interne quittant la page. Couvre le clic sur un lien du menu ET le bouton retour
    tant qu'on reste dans la SPA. Ne couvre PAS la fermeture d'onglet — aucun navigateur ne permet
    d'y ouvrir une fenêtre. Le prédicat retombe à `false` dès l'ouverture et dès que le plafond de
    session est consommé : la navigation suivante passe sans interception.
  */
  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      armed && trigger === 'exitIntent' && currentLocation.pathname !== nextLocation.pathname,
    [armed, trigger],
  );
  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    if (blocker.state === 'blocked' && active === null) fireCandidate('navigation');
  }, [blocker.state, active, fireCandidate]);

  // 3. Temps de présence OU profondeur de lecture, et 4. fin d'article.
  useEffect(() => {
    if (!armed || (trigger !== 'dwell' && trigger !== 'scroll')) return;

    let fired = false;
    const fire = (why: ActiveTrigger) => {
      if (fired) return;
      fired = true;
      fireCandidate(why);
    };

    const threshold = trigger === 'scroll' ? END_SCROLL : DWELL_SCROLL;
    const timer = trigger === 'dwell'
      ? window.setTimeout(() => fire('dwell'), DWELL_MS)
      : null;

    const handleScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      if (window.scrollY / scrollable >= threshold) fire('scroll');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (timer !== null) window.clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [armed, trigger, fireCandidate]);

  // 5. Retour : la fenêtre s'ouvre dès l'arrivée, une fois les données prêtes.
  useEffect(() => {
    if (!armed || trigger !== 'return') return;
    fireCandidate('return');
  }, [armed, trigger, fireCandidate]);

  // ── Fermetures ───────────────────────────────────────────────────────────────────────────────
  /*
    Fermer POURSUIT la navigation interceptée, jamais ne l'annule : le visiteur avait demandé à
    aller quelque part, on l'a interrompu, il refuse l'interruption. L'y retenir serait un dark
    pattern. Seul un choix explicite remplace la navigation d'origine.
  */
  const close = useCallback((popupId: PopupId, destination: string, proceed = true) => {
    emit(destination === 'close' ? 'popup_dismiss' : 'popup_click', { popup_id: popupId, destination });
    setActive(null);
    if (blocker.state === 'blocked') {
      if (proceed) blocker.proceed();
      else blocker.reset();
    }
  }, [blocker, emit]);

  const handleAgencyChoose = useCallback((destination: 'build' | 'presence' | 'learn') => {
    close('agencyExit', destination, false);
    /*
      Filet pour la porte BUILD, une simple ancre `#projet`. Tant que la fenêtre est montée, le
      scroll du corps est verrouillé : si le saut de fragment natif part avant le démontage, il ne
      va nulle part. On repositionne à la frame suivante — sans effet si le saut a déjà eu lieu.
    */
    if (destination === 'build') {
      requestAnimationFrame(() => {
        document.getElementById('projet')?.scrollIntoView({ block: 'start' });
      });
    }
  }, [close]);

  const handleCartAccept = useCallback(() => {
    clearCartPending(); // le rappel a fait son office : ne pas le rejouer au prochain écran
    close('cartRecovery', 'checkout', false);
  }, [close]);

  const handleCartDismiss = useCallback(() => {
    markSuppressed('cartRecovery'); // refus explicite : ne pas reproposer ce panier pendant 30 jours
    close('cartRecovery', 'close');
  }, [close]);

  if (!active) return null;

  const definitionForActive = getDefinition(active.id);
  const mobileSurface = definitionForActive?.mobileSurface ?? 'modal';

  /** Enveloppe commune : la surface ne varie que par son panneau média et son contenu. */
  const surface = (media: React.ReactNode, children: React.ReactNode) => (
    // `null` en repli : une pop-up qui apparaît une fraction de seconde plus tard
    // est préférable à un état de chargement par-dessus la page.
    <Suspense fallback={null}>
      <PopupSurface
        open
        onClose={() => close(active.id, 'close')}
        title={t(`popups.${active.id}.title`)}
        mobileSurface={mobileSurface}
        media={media}
      >
        {children}
      </PopupSurface>
    </Suspense>
  );

  switch (active.id) {
    case 'agencyExit':
      return surface(
        <PopupAurora tone="lagoon" />,
        <AudienceRouterPopup
          onChoose={handleAgencyChoose}
          onContinue={() => close('agencyExit', 'continue')}
        />,
      );

    case 'formationsEntry':
      return surface(
        featured ? <CoverPanel formation={featured} /> : <PopupAurora tone="brand" />,
        <FormationsEntryPopup
          formation={featured}
          onAccept={() => close('formationsEntry', 'formations', false)}
          onDismiss={() => close('formationsEntry', 'close')}
        />,
      );

    case 'formationExit':
      return surface(
        <PopupAurora tone="brand" />,
        <FormationExitPopup
          formationPath={path}
          onAccept={() => close('formationExit', 'formation', false)}
          onClub={() => close('formationExit', 'club', false)}
          onDismiss={() => close('formationExit', 'close')}
        />,
      );

    case 'presenceExit':
      return surface(
        <PopupAurora tone="lagoon" />,
        <PresenceExitPopup
          onAccept={() => close('presenceExit', 'whatsapp', false)}
          onSecondary={() => close('presenceExit', 'packs', false)}
          onDismiss={() => close('presenceExit', 'close')}
        />,
      );

    case 'blogEnd':
      return surface(
        <PopupAurora tone="brand" />,
        <BlogEndPopup onDismiss={() => close('blogEnd', 'close')} />,
      );

    case 'cartRecovery':
      return surface(
        cartFormation ? <CoverPanel formation={cartFormation} /> : <PopupAurora tone="brand" />,
        <CartRecoveryPopup
          formation={cartFormation}
          /*
            Le slug du marqueur suffit à reconstruire l'URL, même si le document n'a pas pu être
            chargé : le tunnel de paiement s'atteint par le slug, pas par le document.
          */
          checkoutPath={localizedPath(`/checkout/${cartFormation?.slug ?? pendingCartSlug ?? ''}`, language)}
          onAccept={handleCartAccept}
          onDismiss={handleCartDismiss}
        />,
      );

    default:
      return null;
  }
}

/** Panneau média : la couverture réelle d'une formation, fondue vers la colonne de contenu. */
function CoverPanel({ formation }: { formation: Formation }) {
  return (
    <>
      <img
        src={formation.coverImage}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/40 to-transparent" />
    </>
  );
}

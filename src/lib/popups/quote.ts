/**
 * Marqueur de simulateur de devis engagé, puis abandonné.
 *
 * Quelqu'un qui a commencé à décrire son commerce dans le formulaire de `/presence-digitale`
 * est très loin devant un visiteur qui passe : il a nommé son affaire, choisi un pack, et il
 * s'est arrêté. C'est le même prospect que la reprise de panier vise côté formation — sur la
 * seule offre high-ticket que le produit sache encaisser aujourd'hui.
 *
 * ⚠️ POURQUOI UN MARQUEUR PLUTÔT QU'UN ÉVÉNEMENT. `/agence` émet bien `agency_form_start`,
 * mais c'est une autre page et un autre formulaire ; celui de `/presence-digitale` n'émettait
 * rien du tout. Et un événement de mesure part vers GA4 : il ne revient pas dans le navigateur
 * pour décider d'une fenêtre. Il faut donc une trace locale, comme pour le panier.
 *
 * ⚠️ IL EXPIRE À 3 JOURS. Le devis, lui, vaut 30 jours — mais l'intention, non : rappeler au
 * bout de trois semaines un formulaire à moitié rempli qu'on ne se rappelle plus avoir ouvert
 * ne relance rien, ça inquiète. Plus court que le panier (7 jours) parce qu'un panier porte un
 * prix décidé, alors qu'ici la personne en était encore à se renseigner.
 */

const KEY = 'mm-quote-started';

/** Durée de validité de l'intention. Au-delà, on n'en sait plus rien. */
const TTL_MS = 3 * 24 * 60 * 60 * 1000;

/** Enregistre l'engagement dans le simulateur. Idempotent : la première frappe fait foi. */
export function markQuoteStarted(): void {
  try {
    if (localStorage.getItem(KEY)) return; // ne pas repousser l'échéance à chaque frappe
    localStorage.setItem(KEY, String(Date.now()));
  } catch {
    // Stockage indisponible : pas de rappel, ce n'est pas bloquant.
  }
}

/** Efface le marqueur — devis envoyé, ou rappel déjà présenté. */
export function clearQuoteStarted(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Rien à effacer si le stockage est inaccessible.
  }
}

/** Vrai si un simulateur a été engagé récemment sans aboutir. Nettoie un marqueur périmé. */
export function hasQuoteStarted(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at) || at <= 0) return false;
    if (Date.now() - at > TTL_MS) {
      clearQuoteStarted();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

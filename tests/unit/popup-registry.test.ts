import { describe, it, expect } from 'vitest';
import { findEligible, isCheckoutPath, isQuotePath, isUnder, POPUP_REGISTRY } from '../../src/lib/popups/registry';
import type { PopupContext } from '../../src/lib/popups/registry';

const base: PopupContext = {
  path: '/',
  entrySource: 'direct',
  isSignedIn: false,
  hasPendingCart: false,
  hasStartedQuote: false,
};
const ctx = (over: Partial<PopupContext>): PopupContext => ({ ...base, ...over });

describe('tunnels de paiement — la règle à ne jamais casser', () => {
  it('reconnaît les chemins de paiement', () => {
    expect(isCheckoutPath('/checkout')).toBe(true);
    expect(isCheckoutPath('/checkout/ma-formation')).toBe(true);
    expect(isCheckoutPath('/paiement/retour')).toBe(true);
    expect(isCheckoutPath('/formations')).toBe(false);
  });

  it('AUCUNE pop-up ne s’affiche pendant un paiement', () => {
    // Interrompre quelqu'un en train de payer est le pire résultat possible du dispositif.
    const paying = ctx({ path: '/checkout/ma-formation', hasPendingCart: true, entrySource: 'search' });
    expect(findEligible(paying)).toBeNull();

    const returning = ctx({ path: '/paiement/retour', hasPendingCart: true, entrySource: 'search' });
    expect(findEligible(returning)).toBeNull();
  });
});

describe('priorité du registre', () => {
  it('la reprise de panier prime sur tout le reste', () => {
    const both = ctx({ path: '/blog/un-article', hasPendingCart: true, entrySource: 'search' });
    expect(findEligible(both)?.id).toBe('cartRecovery');
  });

  it('sans panier, la fin d’article l’emporte sur la découverte', () => {
    const blog = ctx({ path: '/blog/un-article', entrySource: 'search' });
    expect(findEligible(blog)?.id).toBe('blogEnd');
  });
});

describe('règles par page', () => {
  it('l’aiguilleur ne vit que sur /agence', () => {
    expect(findEligible(ctx({ path: '/agence' }))?.id).toBe('agencyExit');
    expect(findEligible(ctx({ path: '/a-propos' }))).toBeNull();
  });

  it('la retenue formation vise une FICHE, pas le catalogue', () => {
    expect(findEligible(ctx({ path: '/formations/seo' }))?.id).toBe('formationExit');
    expect(findEligible(ctx({ path: '/formations' }))).toBeNull();
  });

  it('la fin d’article vise un ARTICLE, pas l’index du blog', () => {
    expect(findEligible(ctx({ path: '/blog/mon-article' }))?.id).toBe('blogEnd');
    expect(findEligible(ctx({ path: '/blog' }))).toBeNull();
  });

  it('la fin d’article épargne les visiteurs connectés', () => {
    expect(findEligible(ctx({ path: '/blog/mon-article', isSignedIn: true }))).toBeNull();
  });

  it('la découverte exige une arrivée organique et un visiteur inconnu', () => {
    expect(findEligible(ctx({ path: '/a-propos', entrySource: 'search' }))?.id).toBe('formationsEntry');
    expect(findEligible(ctx({ path: '/a-propos', entrySource: 'direct' }))).toBeNull();
    expect(findEligible(ctx({ path: '/a-propos', entrySource: 'search', isSignedIn: true }))).toBeNull();
  });

  it('la découverte ne détourne pas d’un tunnel commercial concurrent', () => {
    for (const path of ['/formations', '/agence', '/presence-digitale']) {
      const found = findEligible(ctx({ path, entrySource: 'search' }));
      expect(found?.id).not.toBe('formationsEntry');
    }
  });
});

describe('devis commencé — la priorité sur la retenue générique', () => {
  it('l’emporte sur `presenceExit`, qui vise la même page', () => {
    /*
      Les deux se déclenchent à la sortie de /presence-digitale. Sans cette priorité, la
      fenêtre générique gagnerait toujours et parlerait à quelqu'un qui a déjà rempli la
      moitié du formulaire comme au premier venu.
    */
    const engage = ctx({ path: '/presence-digitale', hasStartedQuote: true });
    expect(findEligible(engage)?.id).toBe('quoteAbandon');
  });

  it('laisse la place à `presenceExit` quand le simulateur n’a pas été touché', () => {
    expect(findEligible(ctx({ path: '/presence-digitale' }))?.id).toBe('presenceExit');
  });

  it('ne suit pas le visiteur ailleurs', () => {
    // Le marqueur est global au navigateur ; la fenêtre, elle, ne vit que sur sa page.
    expect(findEligible(ctx({ path: '/agence', hasStartedQuote: true }))?.id).toBe('agencyExit');
    expect(findEligible(ctx({ path: '/blog/un-article', hasStartedQuote: true }))?.id).toBe('blogEnd');
  });

  it('reste en modale — collision avec le bouton WhatsApp collant de la page', () => {
    expect(POPUP_REGISTRY.find((d) => d.id === 'quoteAbandon')?.mobileSurface).toBe('modal');
  });

  it('ne passe jamais devant une reprise de panier', () => {
    // Un paiement laissé en route reste ce qui approche le plus de l'achat.
    const deux = ctx({ path: '/presence-digitale', hasStartedQuote: true, hasPendingCart: true });
    expect(findEligible(deux)?.id).toBe('cartRecovery');
  });
});

describe('surfaces mobiles', () => {
  it('le blog est en bandeau — son trafic est organique', () => {
    // Une modale sur du trafic de recherche tombe sous la pénalité « interstitiel intrusif ».
    expect(POPUP_REGISTRY.find((d) => d.id === 'blogEnd')?.mobileSurface).toBe('sheet');
    expect(POPUP_REGISTRY.find((d) => d.id === 'formationsEntry')?.mobileSurface).toBe('sheet');
  });

  it('Présence Digitale reste en modale — collision avec le bouton WhatsApp collant', () => {
    expect(POPUP_REGISTRY.find((d) => d.id === 'presenceExit')?.mobileSurface).toBe('modal');
  });
});

describe('devis nominatifs — la fuite inter-territoires', () => {
  it('reconnaît les chemins de devis', () => {
    expect(isQuotePath('/presence-digitale/devis/ABC123')).toBe(true);
    expect(isQuotePath('/agence/devis/ABC123')).toBe(true);
    expect(isQuotePath('/presence-digitale')).toBe(false);
  });

  it('un panier FORMATION ne s’invite pas sur un devis AGENCE', () => {
    /*
      Le défaut corrigé : `cartRecovery` n'excluait que les tunnels de paiement. Quelqu'un qui
      avait abandonné un panier formation recevait, en ouvrant son devis, une fenêtre parlant
      d'une formation en marketing digital — deux territoires sur un même écran, sur un document
      contractuel qui se lit sur WhatsApp.
    */
    const reading = ctx({ path: '/presence-digitale/devis/ABC123', hasPendingCart: true, entrySource: 'search' });
    expect(findEligible(reading)).toBeNull();
  });
});

describe('le Club — la seule offre réellement achetable aujourd’hui', () => {
  it('ne vit que sur sa page publique', () => {
    expect(findEligible(ctx({ path: '/club-des-digitos' }))?.id).toBe('clubExit');
    expect(findEligible(ctx({ path: '/club-des-digitos/quelque-chose' }))).toBeNull();
  });

  it('épargne un visiteur déjà connecté', () => {
    // Il a un compte : la marche que cette fenêtre nomme, il l'a déjà montée.
    expect(findEligible(ctx({ path: '/club-des-digitos', isSignedIn: true }))).toBeNull();
  });

  it('reste en modale — le visiteur a cliqué pour venir ici', () => {
    expect(POPUP_REGISTRY.find((d) => d.id === 'clubExit')?.mobileSurface).toBe('modal');
  });
});

describe('fin d’un podcast ou d’une vidéo — le cul-de-sac', () => {
  it('vise une FICHE, jamais un index', () => {
    expect(findEligible(ctx({ path: '/podcasts/mon-episode' }))?.id).toBe('mediaEnd');
    expect(findEligible(ctx({ path: '/videos/ma-video' }))?.id).toBe('mediaEnd');
    expect(findEligible(ctx({ path: '/podcasts' }))).toBeNull();
    expect(findEligible(ctx({ path: '/videos' }))).toBeNull();
  });

  it('épargne un visiteur connecté', () => {
    expect(findEligible(ctx({ path: '/videos/ma-video', isSignedIn: true }))).toBeNull();
  });

  it('est en bandeau — ces fiches reçoivent du trafic social et de recherche', () => {
    expect(POPUP_REGISTRY.find((d) => d.id === 'mediaEnd')?.mobileSurface).toBe('sheet');
  });
});

describe('arrivée depuis les réseaux sociaux', () => {
  it('compte désormais comme une découverte', () => {
    /*
      `entrySource.ts` entretient une liste `SOCIAL_HOSTS` pour détecter YouTube, Instagram et
      TikTok — et aucune règle ne s'en servait. C'était le canal de publication principal, et le
      seul segment que la seule règle pilotée par la source excluait.
    */
    expect(findEligible(ctx({ path: '/a-propos', entrySource: 'social' }))?.id).toBe('formationsEntry');
  });

  it('mais une arrivée directe reste hors découverte', () => {
    expect(findEligible(ctx({ path: '/a-propos', entrySource: 'direct' }))).toBeNull();
  });
});

describe('isUnder', () => {
  it('distingue un descendant d’un simple préfixe de chaîne', () => {
    expect(isUnder('/blog/article', '/blog')).toBe(true);
    expect(isUnder('/blog', '/blog')).toBe(true);
    expect(isUnder('/blogueur', '/blog')).toBe(false);
  });
});

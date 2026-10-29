/**
 * LES GABARITS DÉCLENCHÉS — rapatriés de Brevo dans le dépôt, le 29/10/2026.
 *
 * Leur copie vivait dans des modèles Brevo (`scripts/brevo-templates.mjs`, retiré). Elle
 * revient ici, relue en revue comme le reste du code, rendue par les MÊMES primitives que la
 * facture. Le RÉGIME de chaque gabarit décide de son transport (`envoi-modele.ts`) :
 * `transactionnel` → binding Cloudflare `EMAIL` ; `marketing` → Brevo, qui reçoit ce HTML-ci
 * tel quel — aucun modèle ne vit plus chez Brevo. Les clés n'ont pas changé : les appelants
 * (`lifecycle.ts`, `accuserDemande.ts`, `issueCertificate.ts`) n'ont pas bougé.
 *
 * ── DEUX RÉGIMES, ET LA DIFFÉRENCE EST JURIDIQUE ──
 * `transactionnel` : déclenché par une action de la personne. Ni consentement, ni lien de
 *   retrait — en mettre un le ferait passer pour du marketing.
 * `marketing` : sollicitation. Consentement exigé, lien de retrait OBLIGATOIRE, en-têtes
 *   `List-Unsubscribe`. C'est `envoi-modele.ts` qui le fait respecter, pas l'appelant.
 *
 * ── LA VOIX ──
 * Tutoiement, « je » de Max, aucun emoji, boutons en casse de phrase, titres courts. Aucune
 * promesse de remboursement (CGV art. 6 : pas de remboursement) ; le prélèvement automatique
 * n'est nommé que pour dire qu'il n'existe pas. `test/email-gabarits.test.ts` le vérifie.
 */
import type { Bloc } from './blocs';

export type Langue = 'fr' | 'en';
export type Regime = 'transactionnel' | 'marketing';

/** Les valeurs injectées. Toutes en texte : les primitives les échappent au rendu. */
export type Params = Record<string, string | undefined>;

export interface Contenu {
  sujet: string;
  apercu: string;
  blocs: Bloc[];
}

interface Modele {
  regime: Regime;
  /** Quand et par qui il part — repris tel quel dans la documentation. */
  declencheur: string;
  fr: (p: Params) => Contenu;
  en: (p: Params) => Contenu;
}

const v = (p: Params, cle: string): string => (p[cle] ?? '').trim();

/** « Bonjour Awa, » — ou « Bonjour, » quand le prénom manque, jamais « Bonjour , ». */
function bonjour(langue: Langue, prenom: string): Bloc {
  const texte = langue === 'fr' ? (prenom ? `Bonjour ${prenom},` : 'Bonjour,') : (prenom ? `Hi ${prenom},` : 'Hi,');
  return { type: 'paragraphe', texte };
}

const para = (texte: string, sourdine = false): Bloc => ({ type: 'paragraphe', texte, sourdine });
const signature: Bloc = { type: 'paragraphe', texte: 'Max-Morrys' };

export const MODELES = {
  /* ── A4 · Certificat obtenu ───────────────────────────────────────────── */
  certificat: {
    regime: 'transactionnel',
    declencheur: 'À l’émission d’un certificat (`issueCertificate`).',
    fr: (p) => ({
      sujet: 'C’est fini. Voilà ton certificat.',
      apercu: 'Vérifiable par n’importe qui, sans compte.',
      blocs: [
        bonjour('fr', v(p, 'prenom')),
        { type: 'titre', texte: 'Ton certificat est prêt.' },
        para(`Tu viens de terminer « ${v(p, 'formation')} ». N’importe qui peut vérifier ton certificat sur maxmorrys.me/verifier, sans créer de compte.`),
        { type: 'encart', surTitre: 'Ton certificat', valeur: v(p, 'code'), note: 'Il ne périme pas.' },
        { type: 'bouton', libelle: 'Voir mon certificat', url: v(p, 'lien') },
        para('Ce qu’il vaut, c’est ce que tu en fais : mets-le sur LinkedIn, envoie-le à un client, ou garde-le.'),
        para('Si tu connais quelqu’un que le Club aiderait, ton code de parrainage lui donne 15 % sur son abonnement. Toi, tu n’y gagnes pas d’argent.', true),
        signature,
      ],
    }),
    en: (p) => ({
      sujet: 'That’s a wrap. Here’s your certificate.',
      apercu: 'Anyone can check it, no account needed.',
      blocs: [
        bonjour('en', v(p, 'prenom')),
        { type: 'titre', texte: 'Your certificate is ready.' },
        para(`You’ve just finished “${v(p, 'formation')}”. Anyone can verify your certificate at maxmorrys.me/verify, without signing up.`),
        { type: 'encart', surTitre: 'Your certificate', valeur: v(p, 'code'), note: 'It doesn’t expire.' },
        { type: 'bouton', libelle: 'See my certificate', url: v(p, 'lien') },
        para('What it’s worth is what you do with it: put it on LinkedIn, send it to a client, or just keep it.'),
        para('If you know someone the Club would help, your referral code gets them 15% off their membership. You don’t make money from it.', true),
        signature,
      ],
    }),
  },

  /* ── A3 · Panier abandonné — transactionnel par décision de la direction ─ */
  panierAbandonne: {
    regime: 'transactionnel',
    declencheur: 'Cron 08:00, une transaction `pending` créée la veille (`relancerPaniers`). Un seul rappel.',
    fr: (p) => ({
      sujet: 'Tu as commencé, puis tu t’es arrêté',
      apercu: 'Rien n’a été débité.',
      blocs: [
        bonjour('fr', v(p, 'prenom')),
        { type: 'titre', texte: 'Ton paiement ne s’est pas terminé.' },
        para(`Tu as lancé le paiement pour « ${v(p, 'designation')} », et il n’a pas abouti. Ça arrive : un code qui n’arrive pas, une connexion qui lâche, une hésitation.`),
        para(v(p, 'mentionCoupon'), true),
        { type: 'bouton', libelle: 'Reprendre là où j’en étais', url: v(p, 'lien') },
        para('Si tu as changé d’avis, tu n’as rien à faire. Et si quelque chose a bloqué, dis-le-moi : je regarde.'),
        signature,
      ],
    }),
    en: (p) => ({
      sujet: 'You started, then you stopped',
      apercu: 'Nothing was charged.',
      blocs: [
        bonjour('en', v(p, 'prenom')),
        { type: 'titre', texte: 'Your payment didn’t go through.' },
        para(`You started the payment for “${v(p, 'designation')}”, and it didn’t complete. It happens: a code that never arrives, a connection that drops, second thoughts.`),
        para(v(p, 'mentionCoupon'), true),
        { type: 'bouton', libelle: 'Pick up where I left off', url: v(p, 'lien') },
        para('If you’ve changed your mind, there’s nothing to do. And if something blocked you, tell me — I’ll look into it.'),
        signature,
      ],
    }),
  },

  /* ── A1a · Bienvenue #1 ───────────────────────────────────────────────── */
  bienvenue1: {
    regime: 'transactionnel',
    declencheur: 'Cron 08:00, compte `student` créé il y a 0 à 2 jours (`envoyerBienvenues`).',
    fr: (p) => ({
      sujet: 'Bienvenue. Voilà ce qui va se passer.',
      apercu: 'Trois choses, et je te laisse tranquille.',
      blocs: [
        bonjour('fr', v(p, 'prenom')),
        { type: 'titre', texte: 'Bienvenue.' },
        para('Tu viens de créer ton compte. Trois choses, et je te laisse tranquille.'),
        { type: 'filet' },
        { type: 'surTitre', texte: 'Tout de suite' },
        para('Le répétiteur répond à deux questions par jour, gratuitement. Il ne remplace pas une formation : il débloque quand tu es coincé.'),
        { type: 'surTitre', texte: 'Ce que tu recevras' },
        para('Rien, sauf si tu le demandes. La lettre existe, elle part une fois toutes les deux semaines, et elle se coupe depuis ton espace.'),
        { type: 'surTitre', texte: 'Ce que je ne ferai pas' },
        para('Te débiter sans que tu l’aies demandé. Wave et Orange Money ne permettent pas le prélèvement automatique — et de toute façon, je ne le voudrais pas.'),
        { type: 'bouton', libelle: 'Ouvrir mon espace', url: v(p, 'lien') },
        signature,
      ],
    }),
    en: (p) => ({
      sujet: 'Welcome. Here’s what happens next.',
      apercu: 'Three things, then I’ll leave you alone.',
      blocs: [
        bonjour('en', v(p, 'prenom')),
        { type: 'titre', texte: 'Welcome.' },
        para('You’ve just created your account. Three things, then I’ll leave you alone.'),
        { type: 'filet' },
        { type: 'surTitre', texte: 'Right now' },
        para('The tutor answers two questions a day, free. It doesn’t replace a course — it unblocks you when you’re stuck.'),
        { type: 'surTitre', texte: 'What you’ll get' },
        para('Nothing, unless you ask. The newsletter exists, it goes out every two weeks, and you can stop it from your space.'),
        { type: 'surTitre', texte: 'What I won’t do' },
        para('Charge you without you asking. Wave and Orange Money don’t support automatic debits — and I wouldn’t want to anyway.'),
        { type: 'bouton', libelle: 'Open my space', url: v(p, 'lien') },
        signature,
      ],
    }),
  },

  /* ── B1 · Accusé de devis ─────────────────────────────────────────────── */
  accuseDevis: {
    regime: 'transactionnel',
    declencheur: 'Callable `accuserDevis`, dans l’heure qui suit la création du devis.',
    fr: (p) => ({
      sujet: `Ton devis ${v(p, 'ref')} est prêt`,
      apercu: `Valable ${v(p, 'validite')} jours, à partager comme tu veux.`,
      blocs: [
        bonjour('fr', v(p, 'prenom')),
        { type: 'titre', texte: 'Ton devis est prêt.' },
        para(`Voici ton devis pour ${v(p, 'commerce')}. Il est consultable en ligne, et le lien se transfère librement — il ne contient aucune de tes coordonnées.`),
        { type: 'encart', surTitre: 'Dû à la signature', valeur: v(p, 'montant'), note: `Valable jusqu’au ${v(p, 'expiration')}.` },
        { type: 'bouton', libelle: 'Voir mon devis', url: v(p, 'lien') },
        para('Une question, une remarque, un ajustement : réponds sur WhatsApp, c’est le plus rapide.', true),
        signature,
      ],
    }),
    en: (p) => ({
      sujet: `Your quote ${v(p, 'ref')} is ready`,
      apercu: `Valid for ${v(p, 'validite')} days, share it as you like.`,
      blocs: [
        bonjour('en', v(p, 'prenom')),
        { type: 'titre', texte: 'Your quote is ready.' },
        para(`Here’s your quote for ${v(p, 'commerce')}. It’s viewable online, and the link is free to forward — it carries none of your contact details.`),
        { type: 'encart', surTitre: 'Due on signature', valeur: v(p, 'montant'), note: `Valid until ${v(p, 'expiration')}.` },
        { type: 'bouton', libelle: 'See my quote', url: v(p, 'lien') },
        para('A question, a remark, an adjustment: reply on WhatsApp, it’s the fastest.', true),
        signature,
      ],
    }),
  },

  /* ── B3 · Accusé de demande agence ────────────────────────────────────── */
  accuseAgence: {
    regime: 'transactionnel',
    declencheur: 'Callable `accuserDemandeAgence`, dans l’heure qui suit la demande.',
    fr: (p) => ({
      sujet: 'J’ai bien reçu ta demande',
      apercu: 'Je réponds sous 48 heures ouvrées.',
      blocs: [
        bonjour('fr', v(p, 'prenom')),
        { type: 'titre', texte: 'Ta demande est arrivée.' },
        para(`J’ai reçu ta demande pour ${v(p, 'entreprise')}. Elle est lue par moi, pas par une équipe — et je réponds sous 48 heures ouvrées.`),
        para('D’ici là, je regarde ce qui existe déjà de ton côté, pour que notre premier échange ne serve pas à te poser des questions dont la réponse est en ligne.', true),
        { type: 'filet' },
        para('Si c’est urgent, WhatsApp va plus vite que l’e-mail.', true),
        signature,
      ],
    }),
    en: (p) => ({
      sujet: 'Got your enquiry',
      apercu: 'I’ll come back within two working days.',
      blocs: [
        bonjour('en', v(p, 'prenom')),
        { type: 'titre', texte: 'Your enquiry is in.' },
        para(`I’ve received your enquiry for ${v(p, 'entreprise')}. I read it myself, not a team — and I’ll come back within two working days.`),
        para('Meanwhile I’ll look at what you already have online, so our first conversation isn’t spent on questions whose answers are already public.', true),
        { type: 'filet' },
        para('If it’s urgent, WhatsApp beats email.', true),
        signature,
      ],
    }),
  },

  /* ── A1b · Bienvenue #2 — MARKETING ───────────────────────────────────── */
  bienvenue2: {
    regime: 'marketing',
    declencheur: 'Cron 08:00, J+2 après l’inscription, SEULEMENT si la lettre a été acceptée (`envoyerSuitesBienvenue`).',
    fr: (p) => ({
      sujet: 'La question que tout le monde me pose en premier',
      apercu: '« Par où je commence ? »',
      blocs: [
        bonjour('fr', v(p, 'prenom')),
        { type: 'titre', texte: 'Par où commencer ?' },
        para('Deux jours que ton compte existe. La question qui revient toujours, à ce moment-là : par où commencer ?'),
        para('Réponse honnête : pas par une formation. Par une chose que tu veux régler cette semaine. Ouvre le répétiteur, pose-lui ce problème-là, et vois ce qu’il te répond. C’est gratuit, deux questions par jour.'),
        { type: 'bouton', libelle: 'Poser ma première question', url: v(p, 'lien') },
        para('Si la réponse te suffit, tant mieux — tu n’avais pas besoin de moi. Si elle te montre qu’il te manque des bases, tu sauras exactement lesquelles.', true),
        signature,
      ],
    }),
    en: (p) => ({
      sujet: 'The question everyone asks first',
      apercu: '“Where do I start?”',
      blocs: [
        bonjour('en', v(p, 'prenom')),
        { type: 'titre', texte: 'Where to start?' },
        para('Your account is two days old. The question that always comes up around now: where do I start?'),
        para('Honest answer: not with a course. With something you want to fix this week. Open the tutor, put that problem to it, and see what comes back. It’s free, two questions a day.'),
        { type: 'bouton', libelle: 'Ask my first question', url: v(p, 'lien') },
        para('If the answer is enough, good — you didn’t need me. If it shows you’re missing the basics, you’ll know exactly which ones.', true),
        signature,
      ],
    }),
  },

  /* ── A1c · Bienvenue #3 — MARKETING ───────────────────────────────────── */
  bienvenue3: {
    regime: 'marketing',
    declencheur: 'Cron 08:00, J+5 après l’inscription, SEULEMENT si la lettre a été acceptée (`envoyerSuitesBienvenue`).',
    fr: (p) => ({
      sujet: 'Ce que je ne te vendrai pas',
      apercu: 'Et pourquoi ça devrait te rassurer.',
      blocs: [
        bonjour('fr', v(p, 'prenom')),
        { type: 'titre', texte: 'Je ne te presserai pas.' },
        para('Cinquième jour. Le moment où, d’habitude, on te presse.'),
        para('Je ne le ferai pas, et voilà pourquoi : je ne peux pas te prélever automatiquement. Wave et Orange Money ne le permettent pas. Chaque paiement demande une action de ta part, à chaque fois. Ça m’empêche de compter sur l’oubli — et ça m’oblige à ce que le contenu tienne tout seul.'),
        { type: 'filet' },
        para('Si tu veux voir ce que ça donne en entier, le catalogue est là. Sinon, la lettre te suffira.', true),
        { type: 'bouton', libelle: 'Voir les formations', url: v(p, 'lien') },
        signature,
      ],
    }),
    en: (p) => ({
      sujet: 'What I won’t sell you',
      apercu: 'And why that should reassure you.',
      blocs: [
        bonjour('en', v(p, 'prenom')),
        { type: 'titre', texte: 'No pressure from me.' },
        para('Day five. Usually the moment someone starts pushing.'),
        para('I won’t, and here’s why: I can’t charge you automatically. Wave and Orange Money don’t allow it. Every payment needs an action from you, every time. That stops me relying on people forgetting — and forces the content to stand on its own.'),
        { type: 'filet' },
        para('If you want to see the whole thing, the catalogue is there. Otherwise the newsletter will do.', true),
        { type: 'bouton', libelle: 'See the courses', url: v(p, 'lien') },
        signature,
      ],
    }),
  },

  /* ── A5 · Mur de quota Rysmo — MARKETING ──────────────────────────────── */
  quotaRysmo: {
    regime: 'marketing',
    declencheur: 'Prévu, sans appelant : deux jours de quota atteint d’affilée.',
    fr: (p) => ({
      sujet: 'Tu as utilisé tes deux questions du jour',
      apercu: 'Elles reviennent demain.',
      blocs: [
        bonjour('fr', v(p, 'prenom')),
        { type: 'titre', texte: 'Tes questions reviennent demain.' },
        para('Tu es allé au bout de tes deux questions quotidiennes. Elles reviennent demain — tu n’as rien à faire.'),
        para('Mais si tu es arrivé au bout deux jours de suite, c’est que la limite te gêne vraiment. Dans ce cas il y a deux sorties, et je te donne la moins chère en premier.'),
        { type: 'encart', surTitre: 'Ton solde', valeur: v(p, 'solde'), note: 'Les jetons n’expirent pas.' },
        para('Un pack de jetons se consomme à ton rythme, sans date limite. L’abonnement, lui, ne vaut le coup que si tu poses des questions tous les jours — et il ne se renouvelle jamais sans toi.', true),
        { type: 'bouton', libelle: 'Voir les deux options', url: v(p, 'lien') },
        signature,
      ],
    }),
    en: (p) => ({
      sujet: 'You’ve used both questions for today',
      apercu: 'They come back tomorrow.',
      blocs: [
        bonjour('en', v(p, 'prenom')),
        { type: 'titre', texte: 'Your questions come back tomorrow.' },
        para('You’ve used up your two daily questions. They come back tomorrow — nothing to do.'),
        para('But if you’ve hit the limit two days running, it’s genuinely in your way. There are two ways out, and I’ll give you the cheaper one first.'),
        { type: 'encart', surTitre: 'Your balance', valeur: v(p, 'solde'), note: 'Tokens don’t expire.' },
        para('A token pack burns at your own pace, with no deadline. The subscription only pays off if you’re asking questions every day — and it never renews without you.', true),
        { type: 'bouton', libelle: 'See both options', url: v(p, 'lien') },
        signature,
      ],
    }),
  },

  /* ── A6 · Série rompue — MARKETING ────────────────────────────────────── */
  serieRompue: {
    regime: 'marketing',
    declencheur: 'Prévu, sans appelant : la série d’apprentissage s’interrompt.',
    fr: (p) => ({
      sujet: `Ta série s’est arrêtée à ${v(p, 'serie')} jours`,
      apercu: 'Ce n’est pas grave, et voilà pourquoi.',
      blocs: [
        bonjour('fr', v(p, 'prenom')),
        { type: 'titre', texte: 'Une série n’est qu’un compteur.' },
        para(`Ta série s’est arrêtée à ${v(p, 'serie')} jours. Je te le dis parce que tu l’avais construite, pas pour te culpabiliser.`),
        para(`Ce que tu as appris pendant ces ${v(p, 'serie')} jours ne s’efface pas avec elle, et rien ne t’empêche d’en recommencer une demain.`),
        { type: 'bouton', libelle: 'Reprendre où j’en étais', url: v(p, 'lien') },
        signature,
      ],
    }),
    en: (p) => ({
      sujet: `Your streak stopped at ${v(p, 'serie')} days`,
      apercu: 'It’s fine, and here’s why.',
      blocs: [
        bonjour('en', v(p, 'prenom')),
        { type: 'titre', texte: 'A streak is just a counter.' },
        para(`Your streak stopped at ${v(p, 'serie')} days. I’m telling you because you built it, not to make you feel bad.`),
        para(`What you learnt over those ${v(p, 'serie')} days doesn’t go with it, and nothing stops you starting another tomorrow.`),
        { type: 'bouton', libelle: 'Pick up where I left off', url: v(p, 'lien') },
        signature,
      ],
    }),
  },

  /* ── A8 · Réactivation 90 jours (relance inactif) — MARKETING ─────────── */
  reactivation: {
    regime: 'marketing',
    declencheur: 'Prévu, sans appelant : 90 jours sans visite. Gabarit de la relance Club inactif.',
    fr: (p) => ({
      sujet: 'Trois mois. On arrête ?',
      apercu: 'Question sincère, réponse en un clic.',
      blocs: [
        bonjour('fr', v(p, 'prenom')),
        { type: 'titre', texte: 'On arrête ?' },
        para('Trois mois que tu n’es pas revenu. Ce n’est ni un reproche ni une relance : c’est une question.'),
        para('Si ça ne te sert plus, le lien de désabonnement est en bas et je ne t’écrirai plus. C’est plus honnête que de continuer à remplir ta boîte.'),
        para('Si c’est juste le temps qui a manqué, voilà ce qui est sorti depuis.', true),
        { type: 'bouton', libelle: 'Voir ce qui est nouveau', url: v(p, 'lien') },
        signature,
      ],
    }),
    en: (p) => ({
      sujet: 'Three months. Should we stop?',
      apercu: 'Genuine question, one-click answer.',
      blocs: [
        bonjour('en', v(p, 'prenom')),
        { type: 'titre', texte: 'Should we stop?' },
        para('Three months since you last came back. This isn’t a reproach or a nudge — it’s a question.'),
        para('If it’s no longer useful, the unsubscribe link is at the bottom and I’ll stop writing. That’s more honest than filling your inbox anyway.'),
        para('If it was just time you lacked, here’s what’s come out since.', true),
        { type: 'bouton', libelle: 'See what’s new', url: v(p, 'lien') },
        signature,
      ],
    }),
  },

  /* ── B2 · Nurture de devis — MARKETING ────────────────────────────────── */
  nurtureDevis: {
    regime: 'marketing',
    declencheur: 'Prévu, sans appelant : quelques jours après un devis, si la lettre a été acceptée.',
    fr: (p) => ({
      sujet: `Ton devis ${v(p, 'ref')} : et après la mise en ligne ?`,
      apercu: 'La question qu’on me pose toujours.',
      blocs: [
        bonjour('fr', v(p, 'prenom')),
        { type: 'titre', texte: 'Et après la mise en ligne ?' },
        para('Tu as reçu ton devis il y a quelques jours. À ce stade, la question qui revient est toujours la même : « et après ? »'),
        para('Après la mise en ligne, il ne se passe rien tout seul. Un site laissé six mois disparaît des résultats. C’est pour ça que l’accompagnement mensuel existe — et c’est aussi pour ça qu’il se décide après, une fois ta boutique en ligne, pas maintenant.'),
        { type: 'mention', texte: `Ton devis reste valable jusqu’au ${v(p, 'expiration')}.` },
        { type: 'bouton', libelle: 'En parler sur WhatsApp', url: v(p, 'lien') },
        signature,
      ],
    }),
    en: (p) => ({
      sujet: `Your quote ${v(p, 'ref')}: and after it goes live?`,
      apercu: 'The question I always get.',
      blocs: [
        bonjour('en', v(p, 'prenom')),
        { type: 'titre', texte: 'And after it goes live?' },
        para('You got your quote a few days ago. At this point the question is always the same: “and then what?”'),
        para('After it goes live, nothing happens on its own. A site left alone for six months drops out of the results. That’s why the monthly support exists — and why it’s decided after, once your shop is live, not now.'),
        { type: 'mention', texte: `Your quote stays valid until ${v(p, 'expiration')}.` },
        { type: 'bouton', libelle: 'Talk it over on WhatsApp', url: v(p, 'lien') },
        signature,
      ],
    }),
  },
} satisfies Record<string, Modele>;

export type CleModele = keyof typeof MODELES;

export function regimeDe(cle: CleModele): Regime {
  return MODELES[cle].regime;
}

/**
 * CRÉE LES MODÈLES TRANSACTIONNELS BREVO, ET LES REMET À JOUR SANS LES DUPLIQUER.
 *
 * ── POURQUOI DES MODÈLES BREVO ET NON DU CODE ──
 * La copie des courriers DÉCLENCHÉS vit chez Brevo : un texte se corrige sans redéployer le
 * Worker, et chaque modèle porte ses propres statistiques d'ouverture. Le Worker, lui, garde
 * ce qu'il est seul à savoir — l'événement produit qui déclenche l'envoi.
 *
 * Les HUIT courriers existants ne sont PAS ici. Ils restent sur Cloudflare, dans
 * `worker/apps/api/src/lib/`, parce qu'ils portent des promesses contractuelles (article 4 des
 * CGV pour la facture) et fonctionnent sans aucune clé d'API.
 *
 * ── DEUX RÉGIMES, ET LA DIFFÉRENCE EST JURIDIQUE ──
 * `transactionnel` : déclenché par une action de la personne. Ni consentement, ni lien de
 * désabonnement — en mettre un le ferait basculer en marketing.
 * `marketing` : sollicitation. Consentement exigé, et le lien de retrait est OBLIGATOIRE.
 * C'est `brevo-send.ts` qui fait respecter la distinction ; ici on ne fait que la déclarer,
 * et le gabarit pose le lien seulement pour le second.
 *
 * ── IDEMPOTENT ──
 * Les modèles sont appariés par NOM. Relancer le script met à jour au lieu de créer un
 * doublon — sans quoi chaque exécution laisserait une génération de plus, et le Worker
 * appellerait un identifiant devenu obsolète.
 *
 * Usage :
 *   BREVO_API_KEY=xkeysib-… node scripts/brevo-templates.mjs           # aperçu
 *   BREVO_API_KEY=xkeysib-… node scripts/brevo-templates.mjs --apply   # écrit
 */

const APPLY = process.argv.includes('--apply');
const CLE = process.env.BREVO_API_KEY;
if (!CLE) {
  console.error('BREVO_API_KEY manquante.');
  process.exit(1);
}

const EXPEDITEUR = { name: 'Max-Morrys', email: 'lettre@lettre.maxmorrys.me' };
const SITE = 'https://maxmorrys.me';

/* ─────────────────────────────────────────────────────────────────────────────
   LE GABARIT — copie littérale du socle de `worker/apps/api/src/lib/email-design.ts`.

   Mêmes jetons, même arc en CINQ CELLULES (jamais un dégradé : Outlook n'en affiche
   aucun), même repli Georgia derrière Fraunces (Gmail et Outlook suppriment les fontes
   distantes, le repli est le rendu nominal). Un courrier Brevo doit être indistinguable
   d'un courrier Cloudflare : le destinataire ne sait pas qui achemine, et n'a pas à le
   deviner à la mise en page.
   ────────────────────────────────────────────────────────────────────────── */
const INK = '#0E1116', INK2 = '#5A6472', INK3 = '#68727F';
const PAPER = '#FFFFFF', PAPER2 = '#F5F7F9', PAPER3 = '#EDF0F4';
const ARC = ['#0057BC', '#6C23DD', '#FF6E7F', '#F38B0A', '#02AC9C'];
const F_DSP = "'Fraunces',Georgia,'Times New Roman',serif";
const F_BODY = "'Schibsted Grotesk',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const F_MONO = "'JetBrains Mono','SF Mono',SFMono-Regular,Menlo,Consolas,monospace";

const p = (t, sourdine = false) =>
  `<p style="margin:0 0 14px;font-size:15.5px;line-height:1.68;color:${sourdine ? INK2 : INK}">${t}</p>`;

const titre = (t) =>
  `<h1 style="margin:0 0 18px;font-family:${F_DSP};font-weight:900;font-size:26px;line-height:1.12;letter-spacing:-.032em;color:${INK}">${t}</h1>`;

const surTitre = (t) =>
  `<p style="margin:0 0 10px;font-family:${F_MONO};font-size:10.5px;line-height:1.2;letter-spacing:.14em;text-transform:uppercase;color:${INK2}">${t}</p>`;

const bouton = (libelle, href) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 22px"><tr>
    <td bgcolor="${INK}" style="border-radius:999px;background:${INK}">
      <a href="${href}" style="display:inline-block;padding:15px 30px;font-family:${F_BODY};font-size:14.5px;font-weight:700;letter-spacing:-.01em;color:#FFFFFF;text-decoration:none;border-radius:999px">${libelle}</a>
    </td></tr></table>`;

const encart = (sur, valeur, note) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;margin:4px 0 24px"><tr>
    <td bgcolor="${PAPER3}" style="padding:22px 24px;background:${PAPER3};border-radius:16px">
      <p style="margin:0 0 8px;font-family:${F_MONO};font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:${INK2}">${sur}</p>
      <p style="margin:0;font-family:${F_DSP};font-weight:900;font-size:30px;line-height:1.05;letter-spacing:-.035em;color:${INK}">${valeur}</p>
      ${note ? `<p style="margin:8px 0 0;font-size:13px;line-height:1.5;color:${INK2}">${note}</p>` : ''}
    </td></tr></table>`;

const filet = () =>
  `<div style="height:1px;line-height:1px;font-size:0;background:#E2E7EC;margin:22px 0">&nbsp;</div>`;

const mention = (t) =>
  `<p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:${INK2}">${t}</p>`;

/**
 * L'enveloppe.
 *
 * `pied` porte l'identité et, POUR LE MARKETING SEULEMENT, le lien de retrait — injecté par
 * `brevo-send.ts` dans `params.desabonnement`. Un modèle transactionnel ne doit pas le
 * porter : le lien ferait croire qu'on peut refuser une facture.
 */
function page({ langue, apercu, contenu, marketing }) {
  const cellules = ARC.map(
    (c) => `<td width="20%" bgcolor="${c}" style="width:20%;height:4px;line-height:4px;font-size:0;background:${c}">&nbsp;</td>`,
  ).join('');
  const bourrage = '&#8199;&#65279;&nbsp;'.repeat(60);
  const retrait = marketing
    ? `<p style="margin:10px 0 0;font-size:11.5px;line-height:1.7;color:${INK3}">{{ params.raison }}<br><a href="{{ params.desabonnement }}" style="color:${INK3}">{{ params.libelleDesabonnement }}</a></p>`
    : '';

  return `<!doctype html>
<html lang="${langue}" dir="ltr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,900&family=Schibsted+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root{color-scheme:light dark;supported-color-schemes:light dark}
  @media (prefers-color-scheme:dark){
    .mm-band{background:#0A0D11!important} .mm-card{background:#14181E!important}
    .mm-card p,.mm-card h1{color:#ECF0F5!important}
  }
  @media (max-width:620px){ .mm-card{padding:26px 22px!important} }
</style>
</head>
<body style="margin:0;padding:0;background:${PAPER2};font-family:${F_BODY};font-size:15px;line-height:1.45;color:${INK}" bgcolor="${PAPER2}" class="mm-band">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${PAPER2};opacity:0">${apercu}${bourrage}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;background:${PAPER2}" bgcolor="${PAPER2}" class="mm-band">
  <tr><td align="center" style="padding:32px 16px">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;border-collapse:collapse">
      <tr><td style="padding:0 4px 18px">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="padding-right:11px;vertical-align:middle"><img src="${SITE}/monogramme-320.png" width="34" height="34" alt="Max-Morrys" style="display:block;width:34px;height:34px;border:0;border-radius:9px"></td>
          <td style="vertical-align:middle;font-family:${F_DSP};font-weight:900;font-size:19px;letter-spacing:-.03em;color:${INK}">Max-Morrys</td>
        </tr></table>
      </td></tr>
      <tr><td style="border-radius:24px 24px 0 0;overflow:hidden">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse"><tr>${cellules}</tr></table>
      </td></tr>
      <tr><td bgcolor="${PAPER}" style="background:${PAPER};border-radius:0 0 24px 24px;padding:34px 36px" class="mm-card">
${contenu}
      </td></tr>
      <tr><td style="padding:22px 8px 0">
        <p style="margin:0;font-size:11.5px;line-height:1.7;color:${INK3}">MY ONOMA SARL — Quartier Ouakam, Cité Batrain, Lot 384, Dakar, Sénégal</p>
        ${retrait}
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   LES MODÈLES
   ────────────────────────────────────────────────────────────────────────── */

const MODELES = [
  /* ── A4 · Certificat obtenu — TRANSACTIONNEL ────────────────────────────── */
  {
    cle: 'A4-certificat', regime: 'transactionnel',
    fr: {
      sujet: 'C’est fini. Voilà ton certificat.',
      apercu: 'Vérifiable par n’importe qui, sans compte.',
      contenu: [
        p('Bonjour {{ params.prenom }},'),
        p('Tu viens de terminer « {{ params.formation }} ». Ton certificat porte le code {{ params.code }} — n’importe qui peut le vérifier sur maxmorrys.me/verifier, sans créer de compte.'),
        encart('Ton certificat', '{{ params.code }}', 'Il ne périme pas.'),
        bouton('Voir mon certificat', '{{ params.lien }}'),
        p('Ce qu’il vaut, c’est ce que tu en fais : mets-le sur LinkedIn, envoie-le à un client, ou garde-le.'),
        p('Et si tu connais quelqu’un que ça aiderait, ton code de parrainage lui fait gagner 15 %. Toi, tu ne gagnes rien — je te l’ai déjà dit.', true),
        p('Max-Morrys'),
      ],
    },
    en: {
      sujet: 'That’s a wrap. Here’s your certificate.',
      apercu: 'Anyone can check it, no account needed.',
      contenu: [
        p('Hi {{ params.prenom }},'),
        p('You’ve just finished “{{ params.formation }}”. Your certificate carries the code {{ params.code }} — anyone can verify it at maxmorrys.me/verify, without signing up.'),
        encart('Your certificate', '{{ params.code }}', 'It doesn’t expire.'),
        bouton('See my certificate', '{{ params.lien }}'),
        p('What it’s worth is what you do with it: put it on LinkedIn, send it to a client, or just keep it.'),
        p('And if you know someone it would help, your referral code gets them 15% off. You get nothing — I’ve told you that before.', true),
        p('Max-Morrys'),
      ],
    },
  },

  /* ── A3 · Panier abandonné — TRANSACTIONNEL (décision direction) ─────────── */
  {
    cle: 'A3-panier-abandonne', regime: 'transactionnel',
    fr: {
      sujet: 'Tu as commencé, puis tu t’es arrêté',
      apercu: 'Ton coupon est toujours valable.',
      contenu: [
        p('Bonjour {{ params.prenom }},'),
        p('Tu as lancé le paiement pour « {{ params.designation }} », et il ne s’est pas terminé. Ça arrive : un code qui n’arrive pas, une connexion qui lâche, une hésitation.'),
        p('{{ params.mentionCoupon }}', true),
        bouton('Reprendre là où j’en étais', '{{ params.lien }}'),
        p('Si tu as changé d’avis, tu n’as rien à faire. Et si quelque chose a bloqué, dis-le-moi : je regarde.'),
        p('Max-Morrys'),
      ],
    },
    en: {
      sujet: 'You started, then you stopped',
      apercu: 'Your coupon still works.',
      contenu: [
        p('Hi {{ params.prenom }},'),
        p('You started the payment for “{{ params.designation }}”, and it didn’t go through. It happens: a code that never arrives, a connection that drops, second thoughts.'),
        p('{{ params.mentionCoupon }}', true),
        bouton('Pick up where I left off', '{{ params.lien }}'),
        p('If you’ve changed your mind, there’s nothing to do. And if something blocked you, tell me — I’ll look into it.'),
        p('Max-Morrys'),
      ],
    },
  },

  /* ── A1a · Bienvenue #1 — TRANSACTIONNEL ────────────────────────────────── */
  {
    cle: 'A1a-bienvenue-1', regime: 'transactionnel',
    fr: {
      sujet: 'Bienvenue. Voilà ce qui va se passer.',
      apercu: 'Trois choses, et je te laisse tranquille.',
      contenu: [
        p('Bonjour {{ params.prenom }},'),
        p('Tu viens de créer ton compte. Trois choses, et je te laisse tranquille.'),
        filet(),
        surTitre('Tout de suite'),
        p('Le répétiteur répond à deux questions par jour, gratuitement. Il ne remplace pas une formation : il débloque quand tu es coincé.'),
        surTitre('Ce que tu recevras'),
        p('Rien, sauf si tu le demandes. La lettre existe, elle part une fois toutes les deux semaines, et elle se coupe depuis ton espace.'),
        surTitre('Ce que je ne ferai pas'),
        p('Te débiter sans que tu l’aies demandé. Wave et Orange Money ne permettent pas le prélèvement automatique — et de toute façon, je ne le voudrais pas.'),
        bouton('Ouvrir mon espace', '{{ params.lien }}'),
        p('Max-Morrys'),
      ],
    },
    en: {
      sujet: 'Welcome. Here’s what happens next.',
      apercu: 'Three things, then I’ll leave you alone.',
      contenu: [
        p('Hi {{ params.prenom }},'),
        p('You’ve just created your account. Three things, then I’ll leave you alone.'),
        filet(),
        surTitre('Right now'),
        p('The tutor answers two questions a day, free. It doesn’t replace a course — it unblocks you when you’re stuck.'),
        surTitre('What you’ll get'),
        p('Nothing, unless you ask. The newsletter exists, it goes out every two weeks, and you can stop it from your space.'),
        surTitre('What I won’t do'),
        p('Charge you without you asking. Wave and Orange Money don’t support automatic debits — and I wouldn’t want to anyway.'),
        bouton('Open my space', '{{ params.lien }}'),
        p('Max-Morrys'),
      ],
    },
  },

  /* ── B1 · Accusé de devis — TRANSACTIONNEL ──────────────────────────────── */
  {
    cle: 'B1-accuse-devis', regime: 'transactionnel',
    fr: {
      sujet: 'Ton devis {{ params.ref }} est prêt',
      apercu: 'Valable {{ params.validite }} jours, à partager comme tu veux.',
      contenu: [
        p('Bonjour {{ params.prenom }},'),
        p('Voici ton devis pour {{ params.commerce }}. Il est consultable en ligne, et le lien se transfère librement — il ne contient aucune de tes coordonnées.'),
        encart('Dû à la signature', '{{ params.montant }}', 'Valable jusqu’au {{ params.expiration }}.'),
        bouton('Voir mon devis', '{{ params.lien }}'),
        p('Une question, une remarque, un ajustement : réponds sur WhatsApp, c’est le plus rapide.', true),
        p('Max-Morrys'),
      ],
    },
    en: {
      sujet: 'Your quote {{ params.ref }} is ready',
      apercu: 'Valid for {{ params.validite }} days, share it as you like.',
      contenu: [
        p('Hi {{ params.prenom }},'),
        p('Here’s your quote for {{ params.commerce }}. It’s viewable online, and the link is free to forward — it carries none of your contact details.'),
        encart('Due on signature', '{{ params.montant }}', 'Valid until {{ params.expiration }}.'),
        bouton('See my quote', '{{ params.lien }}'),
        p('A question, a remark, an adjustment: reply on WhatsApp, it’s the fastest.', true),
        p('Max-Morrys'),
      ],
    },
  },

  /* ── B3 · Accusé de demande agence — TRANSACTIONNEL ─────────────────────── */
  {
    cle: 'B3-accuse-agence', regime: 'transactionnel',
    fr: {
      sujet: 'J’ai bien reçu ta demande',
      apercu: 'Je réponds sous 48 heures ouvrées.',
      contenu: [
        p('Bonjour {{ params.prenom }},'),
        p('J’ai reçu ta demande pour {{ params.entreprise }}. Elle est lue par moi, pas par une équipe — et je réponds sous 48 heures ouvrées.'),
        p('Ce que je fais d’ici là : je regarde ce qui existe déjà de ton côté, pour que notre premier échange ne serve pas à te poser des questions dont la réponse est en ligne.', true),
        filet(),
        p('Si c’est urgent, WhatsApp va plus vite que l’e-mail.', true),
        p('Max-Morrys'),
      ],
    },
    en: {
      sujet: 'Got your enquiry',
      apercu: 'I’ll come back within two working days.',
      contenu: [
        p('Hi {{ params.prenom }},'),
        p('I’ve received your enquiry for {{ params.entreprise }}. I read it myself, not a team — and I’ll come back within two working days.'),
        p('What I’ll do meanwhile: look at what you already have online, so our first conversation isn’t spent on questions whose answers are already public.', true),
        filet(),
        p('If it’s urgent, WhatsApp beats email.', true),
        p('Max-Morrys'),
      ],
    },
  },

  /* ── A1b · Bienvenue #2 — MARKETING ─────────────────────────────────────── */
  {
    cle: 'A1b-bienvenue-2', regime: 'marketing',
    fr: {
      sujet: 'La question que tout le monde me pose en premier',
      apercu: '« Par où je commence ? »',
      contenu: [
        p('Bonjour {{ params.prenom }},'),
        p('Deux jours que ton compte existe. La question qui revient toujours, à ce moment-là : par où commencer ?'),
        p('Réponse honnête : pas par une formation. Par une chose que tu veux régler cette semaine. Ouvre le répétiteur, pose-lui ce problème-là, et vois ce qu’il te répond. C’est gratuit, deux questions par jour.'),
        bouton('Poser ma première question', '{{ params.lien }}'),
        p('Si la réponse te suffit, tant mieux — tu n’avais pas besoin de moi. Si elle te montre qu’il te manque des bases, tu sauras exactement lesquelles.', true),
        p('Max-Morrys'),
      ],
    },
    en: {
      sujet: 'The question everyone asks first',
      apercu: '“Where do I start?”',
      contenu: [
        p('Hi {{ params.prenom }},'),
        p('Your account is two days old. The question that always comes up around now: where do I start?'),
        p('Honest answer: not with a course. With something you want to fix this week. Open the tutor, put that problem to it, and see what comes back. It’s free, two questions a day.'),
        bouton('Ask my first question', '{{ params.lien }}'),
        p('If the answer is enough, good — you didn’t need me. If it shows you’re missing the basics, you’ll know exactly which ones.', true),
        p('Max-Morrys'),
      ],
    },
  },

  /* ── A1c · Bienvenue #3 — MARKETING ─────────────────────────────────────── */
  {
    cle: 'A1c-bienvenue-3', regime: 'marketing',
    fr: {
      sujet: 'Ce que je ne te vendrai pas',
      apercu: 'Et pourquoi ça devrait te rassurer.',
      contenu: [
        p('Bonjour {{ params.prenom }},'),
        p('Cinquième jour. Le moment où, d’habitude, on te presse.'),
        p('Je ne le ferai pas, et voilà pourquoi : je ne peux pas te prélever automatiquement. Wave et Orange Money ne le permettent pas. Chaque paiement demande une action de ta part, à chaque fois. Ça m’empêche de compter sur l’oubli — et ça m’oblige à ce que le contenu tienne tout seul.'),
        filet(),
        p('Si tu veux voir ce que ça donne en entier, le catalogue est là. Sinon, la lettre te suffira.', true),
        bouton('Voir les formations', '{{ params.lien }}'),
        p('Max-Morrys'),
      ],
    },
    en: {
      sujet: 'What I won’t sell you',
      apercu: 'And why that should reassure you.',
      contenu: [
        p('Hi {{ params.prenom }},'),
        p('Day five. Usually the moment someone starts pushing.'),
        p('I won’t, and here’s why: I can’t charge you automatically. Wave and Orange Money don’t allow it. Every payment needs an action from you, every time. That stops me relying on people forgetting — and forces the content to stand on its own.'),
        filet(),
        p('If you want to see the whole thing, the catalogue is there. Otherwise the newsletter will do.', true),
        bouton('See the courses', '{{ params.lien }}'),
        p('Max-Morrys'),
      ],
    },
  },

  /* ── A5 · Mur de quota Rysmo — MARKETING ────────────────────────────────── */
  {
    cle: 'A5-quota-rysmo', regime: 'marketing',
    fr: {
      sujet: 'Tu as utilisé tes deux questions du jour',
      apercu: 'Elles reviennent demain. Ou pas.',
      contenu: [
        p('Bonjour {{ params.prenom }},'),
        p('Tu es allé au bout de tes deux questions quotidiennes. Elles reviennent demain — tu n’as rien à faire.'),
        p('Mais si tu es arrivé au bout deux jours de suite, c’est que la limite te gêne vraiment. Dans ce cas il y a deux sorties, et je te donne la moins chère en premier.'),
        encart('Ton solde', '{{ params.solde }}', 'Les jetons n’expirent pas.'),
        p('Un pack de jetons se consomme à ton rythme, sans date limite. L’abonnement, lui, ne vaut le coup que si tu poses des questions tous les jours.', true),
        bouton('Voir les deux options', '{{ params.lien }}'),
        p('Max-Morrys'),
      ],
    },
    en: {
      sujet: 'You’ve used both questions for today',
      apercu: 'They come back tomorrow. Or not.',
      contenu: [
        p('Hi {{ params.prenom }},'),
        p('You’ve used up your two daily questions. They come back tomorrow — nothing to do.'),
        p('But if you’ve hit the limit two days running, it’s genuinely in your way. There are two ways out, and I’ll give you the cheaper one first.'),
        encart('Your balance', '{{ params.solde }}', 'Tokens don’t expire.'),
        p('A token pack burns at your own pace, with no deadline. The subscription only pays off if you’re asking questions every day.', true),
        bouton('See both options', '{{ params.lien }}'),
        p('Max-Morrys'),
      ],
    },
  },

  /* ── A6 · Série rompue — MARKETING ──────────────────────────────────────── */
  {
    cle: 'A6-serie-rompue', regime: 'marketing',
    fr: {
      sujet: 'Ta série s’est arrêtée à {{ params.serie }} jours',
      apercu: 'Ce n’est pas grave, et voilà pourquoi.',
      contenu: [
        p('Bonjour {{ params.prenom }},'),
        p('Ta série s’est arrêtée à {{ params.serie }} jours. Je te le dis parce que tu l’avais construite, pas pour te culpabiliser.'),
        p('Une série n’est qu’un compteur. Ce que tu as appris pendant ces {{ params.serie }} jours ne s’efface pas avec elle, et rien ne t’empêche d’en recommencer une demain.'),
        bouton('Reprendre où j’en étais', '{{ params.lien }}'),
        p('Max-Morrys'),
      ],
    },
    en: {
      sujet: 'Your streak stopped at {{ params.serie }} days',
      apercu: 'It’s fine, and here’s why.',
      contenu: [
        p('Hi {{ params.prenom }},'),
        p('Your streak stopped at {{ params.serie }} days. I’m telling you because you built it, not to make you feel bad.'),
        p('A streak is just a counter. What you learnt over those {{ params.serie }} days doesn’t go with it, and nothing stops you starting another tomorrow.'),
        bouton('Pick up where I left off', '{{ params.lien }}'),
        p('Max-Morrys'),
      ],
    },
  },

  /* ── A8 · Réactivation 90 jours — MARKETING ─────────────────────────────── */
  {
    cle: 'A8-reactivation', regime: 'marketing',
    fr: {
      sujet: 'Trois mois. On arrête ?',
      apercu: 'Question sincère, réponse en un clic.',
      contenu: [
        p('Bonjour {{ params.prenom }},'),
        p('Trois mois que tu n’es pas revenu. Ce n’est ni un reproche ni une relance : c’est une question.'),
        p('Si ça ne te sert plus, le lien de désabonnement est en bas et je ne t’écrirai plus. C’est plus honnête que de continuer à remplir ta boîte.'),
        p('Si c’est juste le temps qui a manqué, voilà ce que tu as raté de plus utile depuis :', true),
        bouton('Voir ce qui est nouveau', '{{ params.lien }}'),
        p('Max-Morrys'),
      ],
    },
    en: {
      sujet: 'Three months. Should we stop?',
      apercu: 'Genuine question, one-click answer.',
      contenu: [
        p('Hi {{ params.prenom }},'),
        p('Three months since you last came back. This isn’t a reproach or a nudge — it’s a question.'),
        p('If it’s no longer useful, the unsubscribe link is at the bottom and I’ll stop writing. That’s more honest than filling your inbox anyway.'),
        p('If it was just time you lacked, here’s the most useful thing you’ve missed since:', true),
        bouton('See what’s new', '{{ params.lien }}'),
        p('Max-Morrys'),
      ],
    },
  },

  /* ── B2 · Nurture de devis — MARKETING ──────────────────────────────────── */
  {
    cle: 'B2-nurture-devis', regime: 'marketing',
    fr: {
      sujet: 'Ton devis {{ params.ref }} — la question qu’on me pose toujours',
      apercu: '« Et après la mise en ligne ? »',
      contenu: [
        p('Bonjour {{ params.prenom }},'),
        p('Tu as reçu ton devis il y a quelques jours. À ce stade, la question qui revient est toujours la même : « et après ? »'),
        p('Après la mise en ligne, il ne se passe rien tout seul. Un site laissé six mois disparaît des résultats. C’est pour ça que l’accompagnement mensuel existe — et c’est aussi pour ça qu’il se décide APRÈS, une fois ta boutique en ligne, pas maintenant.'),
        mention('Ton devis reste valable jusqu’au {{ params.expiration }}.'),
        bouton('En parler sur WhatsApp', '{{ params.lien }}'),
        p('Max-Morrys'),
      ],
    },
    en: {
      sujet: 'Your quote {{ params.ref }} — the question I always get',
      apercu: '“And after it goes live?”',
      contenu: [
        p('Hi {{ params.prenom }},'),
        p('You got your quote a few days ago. At this point the question is always the same: “and then what?”'),
        p('After it goes live, nothing happens on its own. A site left alone for six months drops out of the results. That’s why the monthly support exists — and why it’s decided AFTER, once your shop is live, not now.'),
        mention('Your quote stays valid until {{ params.expiration }}.'),
        bouton('Talk it over on WhatsApp', '{{ params.lien }}'),
        p('Max-Morrys'),
      ],
    },
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   CRÉATION
   ────────────────────────────────────────────────────────────────────────── */

async function brevo(chemin, options = {}) {
  const r = await fetch(`https://api.brevo.com/v3${chemin}`, {
    ...options,
    headers: { 'api-key': CLE, 'content-type': 'application/json', accept: 'application/json', ...(options.headers ?? {}) },
  });
  const texte = await r.text();
  return { ok: r.ok || r.status === 204, statut: r.status, corps: texte ? JSON.parse(texte) : null };
}

async function main() {
  console.log(`${APPLY ? 'ÉCRITURE' : 'aperçu (dry-run)'} — ${MODELES.length} modèles × 2 langues\n`);

  const existants = new Map();
  for (let offset = 0; ; offset += 50) {
    const { corps } = await brevo(`/smtp/templates?limit=50&offset=${offset}`);
    const lot = corps?.templates ?? [];
    for (const t of lot) existants.set(t.name, t.id);
    if (lot.length < 50) break;
  }
  console.log(`${existants.size} modèle(s) déjà présent(s) chez Brevo.\n`);

  let crees = 0, majs = 0, echecs = 0;

  for (const m of MODELES) {
    for (const langue of ['fr', 'en']) {
      const def = m[langue];
      const nom = `${m.cle} [${langue}]`;
      const charge = {
        templateName: nom,
        subject: def.sujet,
        sender: EXPEDITEUR,
        htmlContent: page({
          langue,
          apercu: def.apercu,
          contenu: def.contenu.join('\n'),
          marketing: m.regime === 'marketing',
        }),
        isActive: true,
      };

      const id = existants.get(nom);
      if (!APPLY) {
        console.log(`  ${id ? 'MAJ  ' : 'CRÉER'} ${nom.padEnd(28)} ${m.regime.padEnd(14)} ${String(charge.htmlContent.length).padStart(5)} o`);
        continue;
      }

      const r = id
        ? await brevo(`/smtp/templates/${id}`, { method: 'PUT', body: JSON.stringify(charge) })
        : await brevo('/smtp/templates', { method: 'POST', body: JSON.stringify(charge) });

      if (r.ok) {
        if (id) { majs += 1; console.log(`  MAJ   ${nom.padEnd(28)} id=${id}`); }
        else { crees += 1; console.log(`  CRÉÉ  ${nom.padEnd(28)} id=${r.corps?.id}`); }
      } else {
        echecs += 1;
        console.error(`  ÉCHEC ${nom.padEnd(28)} ${r.statut} ${JSON.stringify(r.corps).slice(0, 110)}`);
      }
    }
  }

  /*
    LES DEUX LETTRES — créées en BROUILLON, jamais programmées.

    Une campagne diffusée ne se génère pas : son contenu change à chaque numéro. Ce que le
    script pose, c'est la coquille — le bon expéditeur, la bonne liste, le bon gabarit — pour
    qu'écrire un numéro consiste à remplir du texte et non à refaire une mise en page.

    ⚠️ AUCUN `scheduledAt`, AUCUN envoi. Une campagne marketing part sur un geste humain, et
    un script qui pourrait la déclencher est un script qui la déclenchera un jour par erreur.
  */
  const LETTRES = [
    { nom: 'A7 · La lettre — apprenants', liste: 4, langue: 'fr',
      sujet: '[à écrire] La lettre — {{ mois }}',
      intro: 'Une fois toutes les deux semaines : ce qui a été publié, ce que j’en ai appris, et ce qui mérite ton temps.' },
    { nom: 'B4 · La lettre — commerces', liste: 5, langue: 'fr',
      sujet: '[à écrire] Pour ton commerce — {{ mois }}',
      intro: 'Une fois par mois : ce qui marche vraiment pour les commerces d’ici, sans jargon et sans promesse en l’air.' },
  ];

  const campagnes = (await brevo('/emailCampaigns?limit=50')).corps?.campaigns ?? [];
  const nomsExistants = new Set(campagnes.map((c) => c.name));

  for (const l of LETTRES) {
    if (nomsExistants.has(l.nom)) { console.log(`  =     ${l.nom} — déjà présente`); continue; }

    /*
      BREVO REFUSE UNE CAMPAGNE VERS UNE LISTE VIDE.
      « There are no contacts associated with the given recipients info » — ce n'est pas un
      défaut du script, c'est le même blocage que partout ailleurs : le formulaire de capture
      n'est monté nulle part, donc personne n'est abonné. Poser un faux contact pour contourner
      reviendrait à réintroduire les données de démonstration qu'on vient de retirer.
    */
    const liste = (await brevo(`/contacts/lists/${l.liste}`)).corps;
    if (!liste?.totalSubscribers) {
      console.log(`  ⏸  ${l.nom} — liste ${l.liste} vide, création impossible (Brevo l'exige non vide)`);
      continue;
    }
    if (!APPLY) { console.log(`  CRÉER ${l.nom} → liste ${l.liste}`); continue; }
    const r = await brevo('/emailCampaigns', {
      method: 'POST',
      body: JSON.stringify({
        name: l.nom,
        subject: l.sujet,
        sender: EXPEDITEUR,
        type: 'classic',
        recipients: { listIds: [l.liste] },
        htmlContent: page({
          langue: l.langue,
          apercu: l.intro,
          contenu: [titre('[Le titre du numéro]'), p(l.intro, true), filet(), p('[Le contenu, à écrire.]')].join('\n'),
          marketing: true,
        }),
      }),
    });
    console.log(r.ok ? `  CRÉÉE ${l.nom} id=${r.corps?.id}` : `  ÉCHEC ${l.nom} ${r.statut} ${JSON.stringify(r.corps).slice(0, 110)}`);
    if (!r.ok) echecs += 1;
  }

  if (!APPLY) { console.log('\nAperçu seulement. Relancer avec --apply.'); return; }
  console.log(`\n${crees} créé(s), ${majs} mis à jour, ${echecs} échec(s).`);
  if (echecs) process.exitCode = 1;
}

main().catch((e) => { console.error('Échec :', e); process.exitCode = 1; });

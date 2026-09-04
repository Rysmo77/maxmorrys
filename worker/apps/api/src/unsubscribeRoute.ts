import { getFirestore } from './context';
import type { Env } from './env';
import { desabonner, verifierAdresse } from './lib/unsubscribe';

/**
 * LA PAGE DE DÉSABONNEMENT — `GET /desabonnement?e=<adresse>&s=<signature>`.
 *
 * Elle vit dans le Worker et non dans l'application React, pour une raison qui décide de
 * tout : **un désabonnement doit aboutir sans JavaScript, sans compte, et en un seul clic.**
 *
 * Une page React exigerait de charger le bundle, d'attendre l'hydratation, puis d'appeler une
 * callable — trois occasions d'échouer, dans un client de messagerie qui ouvre les liens dans
 * une webview restreinte, sur une connexion mobile qui n'est pas toujours bonne. Le clic doit
 * suffire. C'est aussi ce qu'attendent les fournisseurs de messagerie : un lien qui aboutit
 * en une requête, sans écran intermédiaire.
 *
 * La réponse est du HTML autonome, dans la langue déduite de `?l=`, avec le style en ligne —
 * même contrainte que les courriers eux-mêmes.
 */

const T = {
  fr: {
    titre: 'C’est fait',
    corps: 'Cette adresse ne recevra plus la lettre. Les e-mails nécessaires — reçu, rappel d’échéance, réponse à un message — continuent de partir : ils ne relèvent pas de ce réglage.',
    retour: 'Revenir sur le site',
    invalideTitre: 'Ce lien n’est pas valable',
    invalideCorps: 'Il a probablement été tronqué par ton client de messagerie. Écris-moi et je retire l’adresse à la main.',
    contact: 'Écrire',
  },
  en: {
    titre: 'Done',
    corps: 'This address won’t get the newsletter any more. The necessary emails — receipt, renewal notice, reply to a message — still go out: they aren’t covered by this setting.',
    retour: 'Back to the site',
    invalideTitre: 'This link isn’t valid',
    invalideCorps: 'Your email client most likely cut it short. Write to me and I’ll remove the address by hand.',
    contact: 'Write',
  },
} as const;

function page(langue: 'fr' | 'en', titre: string, corps: string, lien: string, libelle: string, statut: number): Response {
  const html = `<!doctype html>
<html lang="${langue}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${titre} — Max-Morrys</title>
</head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F5F7F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0E1116">
  <main style="max-width:460px;padding:36px 28px;text-align:center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;margin:0 0 26px"><tr>
      <td width="20%" bgcolor="#0057BC" style="height:4px;line-height:4px;font-size:0">&nbsp;</td>
      <td width="20%" bgcolor="#6C23DD" style="height:4px;line-height:4px;font-size:0">&nbsp;</td>
      <td width="20%" bgcolor="#FF6E7F" style="height:4px;line-height:4px;font-size:0">&nbsp;</td>
      <td width="20%" bgcolor="#F38B0A" style="height:4px;line-height:4px;font-size:0">&nbsp;</td>
      <td width="20%" bgcolor="#02AC9C" style="height:4px;line-height:4px;font-size:0">&nbsp;</td>
    </tr></table>
    <h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-weight:900;font-size:29px;letter-spacing:-.03em;line-height:1.15">${titre}</h1>
    <p style="margin:0 0 26px;font-size:15.5px;line-height:1.65;color:#5A6472">${corps}</p>
    <a href="${lien}" style="display:inline-block;padding:14px 28px;border-radius:999px;background:#0E1116;color:#FFFFFF;text-decoration:none;font-size:14.5px;font-weight:700">${libelle}</a>
  </main>
</body></html>`;
  return new Response(html, {
    status: statut,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Un désabonnement ne se met JAMAIS en cache : la page reflète une écriture.
      'cache-control': 'no-store',
      // Elle ne doit pas non plus être indexée : c'est une action, pas un contenu.
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}

export async function handleUnsubscribe(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  if (!env.EXPORT_SIGNING_KEY) {
    console.error('Désabonnement : EXPORT_SIGNING_KEY absente — lien invérifiable');
    return new Response('Server misconfigured', { status: 500 });
  }

  const url = new URL(request.url);
  const email = url.searchParams.get('e') ?? '';
  const signature = url.searchParams.get('s') ?? '';
  const langue: 'fr' | 'en' = url.searchParams.get('l') === 'en' ? 'en' : 'fr';
  const t = T[langue];

  const valide = email !== '' && signature !== '' && (await verifierAdresse(env, email, signature));
  if (!valide) {
    return page(langue, t.invalideTitre, t.invalideCorps,
      `${env.APP_BASE_URL}${langue === 'fr' ? '/contact' : '/en/contact'}`, t.contact, 400);
  }

  /*
   * L'ÉCHEC D'ÉCRITURE NE DOIT PAS SE VOIR COMME UN REFUS.
   *
   * Si Firestore hoquette, la personne a quand même cliqué et veut sortir. Lui montrer une
   * erreur la pousse vers le bouton « spam », qui coûte à la réputation du domaine bien plus
   * qu'un retrait manuel. On journalise et on confirme — puis on rattrape à la main.
   */
  try {
    const bilan = await desabonner(getFirestore(env), email);
    console.log('Désabonnement :', email, `${bilan.marques} inscription(s), compte ${bilan.compteMisAJour ? 'mis à jour' : 'inchangé'}`);
  } catch (error: unknown) {
    console.error('Désabonnement : écriture impossible pour', email, error);
  }

  return page(langue, t.titre, t.corps,
    `${env.APP_BASE_URL}${langue === 'fr' ? '/' : '/en'}`, t.retour, 200);
}

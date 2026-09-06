import { HttpsError } from '@mm/shared';

import type { CallContext } from '../../context';
import { asText } from '../../lib/values';
import type { Reponse } from '../../vues/contrat';

/** Ce que l'appelant envoie. `code` est vérifié à l'exécution : il vient du dehors. */
interface Requete {
  code?: unknown;
}

/**
 * ⛔ UNE BORNE AVANT DE CONSTRUIRE LE CHEMIN, pas après.
 *
 * Le code émis fait 13 caractères. Soixante-quatre laisse la place à tout groupement qu'un
 * document ou un copier-coller pourrait ajouter, et refuse tout ce qui n'a plus la forme
 * d'un code — avant que la valeur ne devienne un segment de chemin Firestore.
 */
const LONGUEUR_MAX = 64;

/**
 * ⛔ LE CODE S'ÉCRIT D'UNE FAÇON ET SE LIT DE TROIS, ET C'EST UN DÉFAUT MESURÉ.
 *
 * Le serveur émet « MM- » suivi de DIX caractères d'un seul tenant
 * (`issueCertificate.ts:74`). Mais le kit dessine « MM-C7K4-9RTX-2081 » — trois groupes —
 * et le site annonçait « quatre groupes, séparés par des tirets, tels qu'ils figurent sur
 * le document ».
 *
 * Conséquence : quelqu'un qui recopie EXACTEMENT COMME INDIQUÉ ajoute des tirets, la
 * recherche ne trouve rien, et il lit « aucun certificat à ce code » sur un document
 * authentique. C'est le pire mode d'échec possible pour une vérification : elle ne se
 * trompe pas de réponse, elle rend un VERDICT FAUX sur un document vrai.
 *
 * On retire donc tout ce qui n'est ni lettre ni chiffre, puis on repose le seul tiret que
 * le format porte réellement — celui du préfixe. Les libellés du site sont corrigés en
 * même temps ; les deux corrections vont ensemble, l'une sans l'autre laisse le piège.
 */
function normaliser(brut: string): string {
  const nu = brut.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return nu.startsWith('MM') ? `MM-${nu.slice(2)}` : nu;
}

export async function appVerifierCertificat(
  data: unknown,
  context: CallContext,
): Promise<Reponse<'appVerifierCertificat'>> {
  const releveA = new Date().toISOString();
  const { code } = (data ?? {}) as Requete;

  if (typeof code !== 'string') {
    throw new HttpsError('invalid-argument', 'Le code du certificat est requis.');
  }

  const propre = normaliser(code);

  /*
   * ⛔ LE CODE DEVIENT UN SEGMENT DE CHEMIN. `certificate_lookups/${propre}` se construit
   * avec une valeur reçue de l'appelant : un `/` en ferait un chemin de collection, et la
   * lecture porterait sur autre chose que ce qu'on croit lire. C'est la garde que
   * `bloquerMembre.ts:65` et `resendTransactionMail.ts:41` posent déjà, pour la même raison.
   *
   * ⚠️ On refuse aussi `.` et `..`, identifiants ILLÉGAUX côté Firestore : ils produiraient
   * une erreur de l'API, donc une PANNE — c'est-à-dire « la vérification n'a pas abouti » là
   * où la bonne réponse est « ce code n'a pas la forme d'un code ».
   */
  if (
    propre === ''
    || propre.length > LONGUEUR_MAX
    || propre.includes('/')
    || propre === '.'
    || propre === '..'
  ) {
    throw new HttpsError('invalid-argument', "Ce code n'a pas la forme d'un code de certificat.");
  }

  const document = await context.db.get(`certificate_lookups/${propre}`);

  /*
   * ⛔ `vue: null` VEUT DIRE « AUCUN CERTIFICAT À CE CODE », et rien d'autre. Le contrat le
   * dit (`vueNulle: "sansDonnee"`), le client en tire un écran distinct de la panne, et
   * c'est cette séparation-là qui empêche de faire passer une coupure réseau pour un faux.
   */
  if (!document) return { vue: null, releveA };

  const formation = asText(document.data.formationTitle);
  const titulaire = asText(document.data.holderName);
  const emisLe = asText(document.data.issuedAt);
  const codeEcrit = asText(document.data.certificateCode);

  /*
   * ⚠️ LES QUATRE CHAMPS SONT SOLIDAIRES, comme dans `appCertificats`. Un document amputé
   * n'est pas un document à trous : c'est un certificat au nom de quelqu'un avec la date
   * d'un autre. On rend le jeu complet ou on rend « inconnu » — jamais un document partiel
   * à qui vient précisément en contrôler l'authenticité.
   *
   * ⛔ ET LE CODE RENDU EST CELUI ÉCRIT EN BASE, pas celui reçu. Les deux devraient être
   * identiques — l'identifiant du miroir EST le code — mais renvoyer l'entrée de l'appelant
   * afficherait au vérificateur ce qu'il vient de taper, ce qui ne prouve rien.
   */
  if (!formation || !titulaire || !emisLe || !codeEcrit) return { vue: null, releveA };

  return {
    vue: {
      code: codeEcrit,
      formation,
      titulaire,
      emisLe,
    },
    releveA,
  };
}

import { createSelfSignedTokenProvider, parseServiceAccount } from '@mm/gcp-auth';
import { Firestore } from '@mm/firestore-rest';

import type { Env } from './env';

/**
 * Client Firestore du Worker, mémoïsé par isolate.
 *
 * Le compte de service est lu une seule fois : le parsing du PEM et l'import de
 * la CryptoKey sont coûteux, et la clé n'est pas sérialisable.
 *
 * ⚠️ L'accès REST par compte de service **contourne `firestore.rules`**, comme
 * `firebase-admin` aujourd'hui. Ce Worker ne doit donc lire que du contenu
 * public (documents `status == 'published'`) et n'écrire que dans `translations/`.
 */
let client: Firestore | null = null;

export function getFirestore(env: Env): Firestore {
  if (!client) {
    const serviceAccount = parseServiceAccount(env.GCP_SA_JSON);
    client = new Firestore({
      projectId: serviceAccount.project_id,
      token: createSelfSignedTokenProvider(serviceAccount),
    });
  }
  return client;
}

import { HttpsError } from '@mm/shared';

import { type CallContext, requireAuth } from '../context';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LE DOCUMENT DE PROFIL, ÉCRIT POUR L'APPLICATION NATIVE.
 *
 * Le web écrit `users/{uid}` directement avec le SDK Firestore, juste après
 * `createUserWithEmailAndPassword` (`src/contexts/AuthContext.tsx`). L'application native ne
 * le peut pas : elle n'embarque pas `firebase/firestore`, et c'est une décision — les vues
 * qu'elle affiche sont des jointures, pas des documents, et un second client Firestore
 * réimplémenterait la logique métier sans test partagé.
 *
 * D'où cette callable. Elle existe pour UN moment précis : entre la création du compte
 * d'authentification et le premier écran. Sans elle, une personne aurait un compte capable
 * de se connecter et aucun profil à lire — un état intermédiaire que rien ne rattrape.
 *
 * ⚠️ LE COMPTE DE SERVICE CONTOURNE `firestore.rules`. Les quatre contrôles que la règle
 * `match /users/{userId}` ferait sont donc refaits ICI, explicitement :
 *   • authentifié                    → `requireAuth`
 *   • n'écrit que son propre document → l'uid vient du JETON, jamais de la charge utile
 *   • `role == 'student'`            → écrit en dur, pas repris de l'appelant
 *   • `uid == userId`                → même source, donc vrai par construction
 *
 * Prendre l'uid dans le jeton plutôt que dans les données n'est pas une précaution de
 * style : c'est ce qui empêche quelqu'un de créer le profil d'un autre.
 *
 * IDEMPOTENTE. Un second appel ne réécrit rien et ne se plaint pas : l'inscription native
 * peut être relancée après une coupure réseau sans écraser un profil déjà enrichi
 * (préférences changées, nom mis à jour). Elle répond `{ cree: false }` pour le dire.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export async function creerMonProfil(data: unknown, context: CallContext): Promise<unknown> {
  const auth = requireAuth(context);

  const { displayName } = (data ?? {}) as { displayName?: unknown };
  if (typeof displayName !== 'string' || displayName.trim() === '') {
    throw new HttpsError('invalid-argument', 'Un nom est obligatoire.');
  }
  if (displayName.length > 120) {
    throw new HttpsError('invalid-argument', 'Ce nom est trop long.');
  }

  const chemin = `users/${auth.uid}`;
  const existant = await context.db.get(chemin);
  if (existant) return { cree: false, uid: auth.uid };

  /*
   * La FORME EST CELLE DU WEB, champ pour champ (`AuthContext.signUp`). Une divergence ici
   * ne casserait rien tout de suite : elle produirait un compte natif auquel il manque une
   * préférence, et le défaut apparaîtrait des semaines plus tard sur un écran du web.
   */
  await context.db.commit([
    context.db.buildWrite(chemin, {
      uid: auth.uid,
      email: auth.email ?? null,
      displayName: displayName.trim(),
      role: 'student',
      createdAt: new Date().toISOString(),
      preferences: { theme: 'system', language: 'fr', newsletter: false, aiMemoryConsent: true },
    }, { mask: false }),
  ]);

  return { cree: true, uid: auth.uid };
}

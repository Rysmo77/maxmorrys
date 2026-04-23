type FirebaseLike = { code?: string; message?: string };

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Email invalide.',
  'auth/user-disabled': 'Ce compte a été désactivé.',
  'auth/user-not-found': 'Aucun compte ne correspond à cet email.',
  'auth/wrong-password': 'Mot de passe incorrect.',
  'auth/invalid-credential': 'Email ou mot de passe incorrect.',
  'auth/invalid-login-credentials': 'Email ou mot de passe incorrect.',
  'auth/email-already-in-use': 'Cet email est déjà associé à un compte.',
  'auth/weak-password': 'Mot de passe trop faible (minimum 6 caractères).',
  'auth/missing-password': 'Le mot de passe est requis.',
  'auth/missing-email': "L'email est requis.",
  'auth/too-many-requests': 'Trop de tentatives. Réessaie dans quelques minutes.',
  'auth/network-request-failed': 'Problème de connexion. Vérifie ton réseau.',
  'auth/popup-closed-by-user': 'Fenêtre de connexion fermée.',
  'auth/popup-blocked': 'Fenêtre de connexion bloquée. Autorise les pop-ups.',
  'auth/cancelled-popup-request': 'Connexion annulée.',
  'auth/account-exists-with-different-credential':
    'Un compte existe déjà avec cet email mais avec une autre méthode de connexion.',
  'auth/operation-not-allowed': 'Méthode de connexion non autorisée.',
  'auth/requires-recent-login': 'Pour des raisons de sécurité, reconnecte-toi avant cette action.',
  'auth/expired-action-code': 'Ce lien a expiré. Demande un nouveau lien.',
  'auth/invalid-action-code': 'Ce lien est invalide ou déjà utilisé.',
};

export function localizeAuthError(error: unknown): string {
  if (!error) return 'Une erreur inattendue est survenue.';
  const e = error as FirebaseLike;
  const code = e.code;
  if (code && AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];
  const raw = e.message ?? '';
  const match = raw.match(/\(auth\/[\w-]+\)/);
  if (match) {
    const extractedCode = match[0].slice(1, -1);
    if (AUTH_ERROR_MESSAGES[extractedCode]) return AUTH_ERROR_MESSAGES[extractedCode];
  }
  if (raw && !raw.toLowerCase().startsWith('firebase')) return raw;
  return 'Une erreur est survenue. Réessaie.';
}

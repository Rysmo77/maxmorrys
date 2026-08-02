type FirebaseLike = { code?: string; message?: string };
type TFunc = (key: string) => string;

// Map code Firebase → clé i18n (namespace `auth`). Voir src/i18n/locales/*/auth.json.
const AUTH_ERROR_KEYS: Record<string, string> = {
  'auth/invalid-email': 'errors.invalidEmail',
  'auth/user-disabled': 'errors.userDisabled',
  'auth/user-not-found': 'errors.userNotFound',
  'auth/wrong-password': 'errors.wrongPassword',
  'auth/invalid-credential': 'errors.invalidCredential',
  'auth/invalid-login-credentials': 'errors.invalidCredential',
  'auth/email-already-in-use': 'errors.emailAlreadyInUse',
  'auth/weak-password': 'errors.weakPassword',
  'auth/missing-password': 'errors.missingPassword',
  'auth/missing-email': 'errors.missingEmail',
  'auth/too-many-requests': 'errors.tooManyRequests',
  'auth/network-request-failed': 'errors.networkRequestFailed',
  'auth/popup-closed-by-user': 'errors.popupClosed',
  'auth/popup-blocked': 'errors.popupBlocked',
  'auth/cancelled-popup-request': 'errors.cancelledPopup',
  'auth/account-exists-with-different-credential': 'errors.accountExistsDifferentCredential',
  'auth/operation-not-allowed': 'errors.operationNotAllowed',
  'auth/requires-recent-login': 'errors.requiresRecentLogin',
  'auth/expired-action-code': 'errors.expiredActionCode',
  'auth/invalid-action-code': 'errors.invalidActionCode',
};

/**
 * Résout une erreur d'authentification vers un message traduit.
 * @param error l'erreur capturée (Firebase ou Error lancée par AuthContext)
 * @param t la fonction de traduction du namespace `auth` (useTranslation('auth'))
 */
export function localizeAuthError(error: unknown, t: TFunc): string {
  if (!error) return t('errors.unexpected');
  const e = error as FirebaseLike;

  // 1) Code Firebase direct
  const code = e.code;
  if (code && AUTH_ERROR_KEYS[code]) return t(AUTH_ERROR_KEYS[code]);

  const raw = e.message ?? '';

  // 2) Erreur lancée par AuthContext sous forme de clé i18n (ex: 'errors.invalidCredential')
  if (raw.startsWith('errors.')) return t(raw);

  // 3) Code Firebase enfoui dans le message (ex: "... (auth/invalid-email).")
  const match = raw.match(/\(auth\/[\w-]+\)/);
  if (match) {
    const extractedCode = match[0].slice(1, -1);
    if (AUTH_ERROR_KEYS[extractedCode]) return t(AUTH_ERROR_KEYS[extractedCode]);
  }

  // 4) Message déjà lisible (non Firebase)
  if (raw && !raw.toLowerCase().startsWith('firebase')) return raw;

  return t('errors.generic');
}

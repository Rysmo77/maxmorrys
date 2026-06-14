# AUDIT FRONT-END — maxmorrys.me

> Périmètre : pages publiques/auth/LMS/admin, composants UI, formulaires, boutons, liens, états, responsive, a11y.
> Constats vérifiés par lecture du code ; chaque entrée porte un `fichier:ligne`.

## 1. Synthèse

Le front-end est **propre et cohérent** : TypeScript strict (1 seul `any` dans tout `src/`), états *loading/empty/error* présents sur la majorité des pages data, sanitisation XSS correcte. Les problèmes relèvent surtout de **finition** (design-system non uniforme, *placeholder* en prod), de **robustesse des mutations** (*optimistic updates* sans rollback) et d'**accessibilité**.

**Vérifications positives notables :**
- `markdownToHtml` (utils.ts:115-161) passe **tout** le HTML par `DOMPurify.sanitize` → les 8 usages de `dangerouslySetInnerHTML` sont protégés. ✅
- Tous les `target="_blank"` portent `rel="noopener noreferrer"` (Footer, Podcasts, Videos, RysmoWidget). ✅
- 0 `console.*` problématique (2 occurrences seulement dans `src/`), 0 TODO/FIXME dans `src/`. ✅

---

## 2. Problèmes par sévérité

### [F1] Optimistic updates sans rollback (Club)
- **Catégorie** : Bug / Persistance · **Gravité** : Moyenne · **Priorité** : P1
- **Fichier** : `src/pages/lms/hooks/useClubData.ts:213-234, 256-267`
- **Rôle** : student (membre Club)
- **Description** : `handleLikePost`, `handleVotePoll`, `handleRepost`, `handleDeleteComment` modifient l'état local **puis** appellent la fonction Firestore avec `.catch(() => null)`. En cas d'échec réseau/règle, l'UI affiche l'action comme réussie alors que rien n'est persisté ; aucun rollback, aucun toast.
- **Impact utilisateur** : like/vote/repost « fantômes » qui disparaissent au rechargement → confusion.
- **Reco** : sur `.catch`, restaurer l'état précédent et afficher un toast d'erreur. Idéalement, s'appuyer sur un listener temps réel comme source de vérité.
- **Quick win** : Oui (partiel)

### [F2] Texte placeholder en production
- **Catégorie** : Cohérence produit · **Gravité** : Moyenne · **Priorité** : P1
- **Fichier** : `src/pages/FormationDetail.tsx:316` (« Le programme détaillé sera disponible prochainement »)
- **Description** : message codé en dur affiché quand les modules sont absents ; donne une impression d'inachevé sur une page de **vente**.
- **Impact** : crédibilité / conversion.
- **Reco** : masquer la section si pas de modules, ou n'afficher le programme que lorsqu'il existe.
- **Quick win** : Oui

### [F3] Double-submit — ✅ VÉRIFIÉ NON FONDÉ (faux positif)
- **Statut** : **Résolu / non applicable** après vérification approfondie (Sprint 0).
- Le composant `Button` applique `disabled={disabled || loading}` ([Button.tsx:44](../src/components/ui/Button.tsx#L44)). Les boutons de soumission concernés sont déjà protégés : Contact principal (`loading={loading}`), booking RDV (`disabled={bookingLoading}`, Contact.tsx:529), Checkout (`disabled={submitting}`, Checkout.tsx:238).
- **Aucune action requise.** Conservé ici pour traçabilité du constat initial (corrigé après lecture du composant `Button`).

### [F4] Certificat : second updateDoc silencieux
- **Catégorie** : Bug / Persistance · **Gravité** : Faible-Moyenne · **Priorité** : P2
- **Fichier** : `src/pages/lms/CoursePlayer.tsx:328-338`
- **Description** : à 100 %, `issueCertificate()` (callable) puis `updateDocById('enrollments', …, { certificateIssued: true })`. Si le second échoue, l'erreur est capturée par Sentry **sans feedback** ; toast « certificat émis » déjà affiché. Incohérence enrollment ↔ certificat.
- **Reco** : afficher un toast si la mise à jour du flag échoue ; idéalement laisser la Cloud Function poser le flag (le certificat existe déjà côté serveur).

### [F5] Validation front absente (Contact / Newsletter)
- **Catégorie** : Validation · **Gravité** : Faible-Moyenne · **Priorité** : P2
- **Fichiers** : `src/components/shared/NewsletterForm.tsx:58` (pas de `required`/regex), `src/pages/Contact.tsx:102`
- **Description** : email non validé côté client avant envoi ; sur Contact, l'erreur ne se réaffiche pas si l'utilisateur retape la même valeur invalide (piège UX).
- **Reco** : `type="email" required` + validation regex avant submit ; recalculer l'erreur sur blur.

### [F6] Incohérences design-system
- **Catégorie** : UI · **Gravité** : Faible · **Priorité** : P2
- **Fichiers (exemples)** : `Blog.tsx:202,256`, `Formations.tsx:361`, `Videos.tsx:539`, `Home.tsx:548`, `FAQ.tsx:126`
- **Description** : `<button>` natifs ou classes Tailwind en dur (`bg-[#FF0000]`, `bg-neutral-900 dark:bg-white`) au lieu du composant `<Button>` → états hover/focus/disabled incohérents, accessibilité réduite.
- **Reco** : remplacer par `<Button variant=…>` ; centraliser les variantes.

### [F7] Clé React = index de tableau
- **Catégorie** : Bug · **Gravité** : Faible · **Priorité** : P2
- **Fichier** : `src/pages/Podcasts.tsx:300-301` (carrousel témoignages, `key={tIndex}`)
- **Description** : clé = index → bugs de réconciliation si l'ordre change.
- **Reco** : utiliser un identifiant stable de l'item.

### [F8] Liens internes ouverts en nouvel onglet
- **Catégorie** : UX · **Gravité** : Faible · **Priorité** : P3
- **Fichier** : `src/pages/auth/Login.tsx:233-235` (liens légaux en `target="_blank"` sur routes internes)
- **Reco** : `<Link>` React Router sans `target` pour les routes internes.

### [F9] Coquilles / accents
- **Catégorie** : UI/Contenu · **Gravité** : Faible · **Priorité** : P3
- **Fichiers** : `FAQ.tsx:126` (« Reessayer » → « Réessayer »), `NewsletterForm.tsx:29` (« reussie » → « réussie »)
- **Reco** : corriger ; envisager un fichier de libellés centralisé.

### [F10] États error/empty perfectibles
- **Catégorie** : UX · **Gravité** : Faible · **Priorité** : P3
- **Fichiers** : `AdminDashboard.tsx:41-45` (échec stats → cartes vides plutôt qu'état erreur), `Videos.tsx:256` (placeholder « Bientôt d'autres vidéos » au lieu de masquer), `Podcasts.tsx:256` (pas de fallback image).
- **Reco** : composant `ErrorState` réutilisable + masquage des sections vides.

---

## 3. Matrice des boutons / actions critiques (extrait)

| Écran | Action | Rôle | Handler | Endpoint/Helper | Loading | Success | Error | Problème |
|---|---|---|---|---|---|---|---|---|
| Login | Se connecter | public | `AuthContext.signIn` | Firebase Auth | ✅ | redirect | ✅ toast | RAS |
| Register | S'inscrire | public | `signUp` + create user doc | Auth + Firestore | ✅ | redirect | ✅ | refCode non validé front |
| Contact | Envoyer | public | `saveContactMessage` | Firestore `messages` | ✅ | ✅ | ✅ | OK |
| Contact | Réserver RDV | public | `saveAppointment` | Firestore `appointments` | ⚠ | ✅ | ✅ | double-submit (F3) |
| FormationDetail | S'inscrire | student | nav `/checkout/:slug` | — | ❌ | — | — | pas de loading (F3) |
| Checkout | Payer | student | `createBictorysCharge` | callable | ✅ | redirect Bictorys | ✅ | coupon non validé front |
| Checkout (gratuit) | S'inscrire | student | batch txn+enrollment | Firestore | ✅ | ✅ | ⚠ | pas de guidage retry |
| CoursePlayer | Marquer terminé | student | `updateEnrollmentProgress` | Firestore | ✅ | ✅ | ⚠ | pas de sync temps réel |
| CoursePlayer | (auto) Certificat | student | `issueCertificate`+update | callable+Firestore | — | toast | ⚠ silencieux | F4 |
| Club Feed | Like/Repost/Vote | student | `likeClubPost`… | Firestore | optimiste | optimiste | ❌ no rollback | F1 |
| Club Feed | Commenter | student | `addClubComment` | Firestore | ✅ | ✅ | ✅ | OK |
| Profil | Enregistrer | student | `updateUserProfile` | Firestore | ✅ | ✅ | ✅ | OK |
| Settings | Export RGPD | student | `exportUserData` | callable | ✅ | URL | ⚠ | pas de gestion expiration |
| Settings | Supprimer compte | student | `deleteUserAccount`+signOut | callable | ✅ | signOut | ⚠ | signOut même si échec |
| Témoignages | Soumettre | student | upload Storage+`createDoc` | Storage+Firestore | ✅ | ✅ | ✅ | OK |
| Admin* | Créer/Éditer/Supprimer | admin | `saveX`/`deleteX` | Firestore (rules `isAdmin`) | ✅ | ✅ | ⚠ | rollback partiel ; support voit mais échoue (cf. ROLES) |
| AdminUsers | Créer utilisateur | admin | `adminCreateUser` | callable (admin-only) | ✅ | ✅ | ✅ | bouton visible aux support → échec |

> Matrice complète des formulaires : voir tableau §5. Matrice rôles : voir `AUDIT_ROLES_PERMISSIONS.md`.

## 4. Liens / navigation

- **Aucun lien mort détecté** : la navigation utilise `<Link to=…>`/`<NavLink>` vers des routes déclarées dans `App.tsx`. Fallback `*` → `NotFound`, `/403` → `Forbidden403`.
- **Liens externes** : tous sécurisés (`rel="noopener noreferrer"`). Liens sociaux du profil codés en dur (acceptable).
- **À corriger** : liens internes en `target="_blank"` (F8).

## 5. Matrice des formulaires (principaux)

| Formulaire | Page | Validation front | Validation back | Endpoint | Erreur | Succès | a11y | Problèmes |
|---|---|---|---|---|---|---|---|---|
| Login | auth/Login | regex email + requis | Firebase | Auth | ✅ | ✅ | labels OK | RAS |
| Register | auth/Register | email/len/match | Firebase + rules | Auth+Firestore | ✅ | ✅ | OK | refCode non validé |
| Reset password | auth/ResetPassword | email | Firebase | Auth | silencieux (bon) | ✅ | OK | RAS |
| Contact | Contact | partielle | rules `messages` (taille) | Firestore | ✅ | ✅ | aria partiel | F5 |
| RDV (booking) | Contact | partielle | rules `appointments` | Firestore | ✅ | ✅ | aria-expanded ❌ | F3, a11y |
| Newsletter | shared | ❌ | rules `newsletter` (email) | Firestore | ✅ | ✅ | label fragile | F5 |
| Profil | lms/tabs/Profile | type+taille fichier | rules `users` | Firestore+Storage | ✅ | ✅ | OK | RAS |
| Témoignage | lms/tabs/Testimonials | fichier | rules `testimonials` | Firestore+Storage | ✅ | ✅ | clavier étoiles ⚠ | rating non clavier |
| Checkout coupon | lms/Checkout | ❌ | back (coupon) | callable | post-redirect | — | OK | pas de feedback inline |
| User edit (admin) | admin/UserEditModal | partielle | rules `users`+callables | Firestore+callables | ✅ | ✅ | label/htmlFor ⚠ | option Admin non gatée |
| Formation builder | admin/AdminFormations | partielle | rules `formations` | Firestore | ✅ | ✅ | — | fichier monolithique |
| Article | admin/AdminArticles | partielle | rules `blog` | Firestore | ✅ | ✅ | — | RAS |

## 6. Responsive (constats statiques)

- Typographie fluide (`clamp`), *bottom sheets* mobiles (CoursePlayer), sidebars sticky desktop, grilles `md:`/`lg:`.
- **À vérifier en runtime** : tables admin (`AdminUsers`, `AdminTransactions`) — risque de débordement horizontal sur mobile (pas de conteneur scrollable explicite repéré) ; `PhoneInput` (291 lignes) sur petits écrans.
- Voir `AUDIT_ACCESSIBILITY.md` et `AUDIT_UI_UX.md` pour le détail.

## 7. Accessibilité (résumé, détail dans rapport dédié)

- Lacunes : boutons icône sans `aria-label` (delete admin), tables sans `scope="col"`, labels non liés (`UserEditModal` rôle), accordéons sans `aria-expanded` (FAQ, booking), notation par étoiles non navigable au clavier (Témoignages), *focus trap* des modales non confirmé.

## 8. Top 8 issues front-end
1. F1 — Optimistic updates Club sans rollback (persistance trompeuse).
2. F2 — Placeholder « programme détaillé bientôt » sur page de vente.
3. F3 — Double-submit (Contact booking, Checkout).
4. F4 — Échec silencieux du flag certificat.
5. F5 — Validation email front absente (Contact/Newsletter).
6. a11y — boutons icône / tables / labels (cf. rapport dédié).
7. F6 — Incohérences design-system (boutons natifs / couleurs en dur).
8. F10 — États error/empty perfectibles (Dashboard, listes).

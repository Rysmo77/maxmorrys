# AUDIT DATA-FLOW & INTERCONNEXIONS — maxmorrys.me

> Mécanisme de données : **Firestore SDK appelé directement** depuis les composants via la couche `src/lib/firestore/*`. **Pas de React Query / SWR / store global.** Temps réel pour notifications, messages support et DM uniquement. Callables pour rysmo / paiement / certificat / RGPD / admin.

## 1. Caractéristiques globales du fetching

| Aspect | État | Conséquence |
|---|---|---|
| Cache | ❌ Aucun | Re-fetch à chaque montage de composant |
| Invalidation après mutation | ❌ Manuelle | Risque d'UI obsolète après écriture |
| Temps réel | ✅ Partiel (notifications, messages, DM) | Bon pour la messagerie, absent ailleurs |
| Pagination | ✅ Curseur (`startAfter`) sur listes | OK |
| Gestion d'expiration de session | ⚠ Implicite (onAuthStateChanged) | Pas de refresh token explicite côté requêtes |
| Optimistic updates | ⚠ Présents sans rollback (Club) | UI/DB divergent en cas d'échec |
| Comptages | ✅ `getCountFromServer` (10 usages) | Bon pour stats admin |

## 2. Flux de données critiques

| # | Flux | Composant/handler front | Helper / callable | Collection | Rôle | Persistance | Refresh UI | Problème |
|---|---|---|---|---|---|---|---|---|
| 1 | Inscription | `Register` → `signUp` | Auth + `setDocById(users)` | `users` | public | ✅ | redirect | refCode non validé |
| 2 | Connexion | `Login` → `signIn` | Firebase Auth | — | public | ✅ | `onAuthStateChanged` | guard UID OK |
| 3 | Achat formation | `Checkout` → `createBictorysCharge` | callable → Bictorys | `transactions` | student | ✅ (webhook) | `PaymentReturn` (onSnapshot) | tracking non dédupliqué (#9) |
| 4 | Enrôlement gratuit | `Checkout` (batch) | `writeBatch` txn+enrollment | `transactions`,`enrollments` | student | ✅ atomique | toast | pas de guidage retry |
| 5 | Progression cours | `CoursePlayer` → marquer terminé | `updateEnrollmentProgress` | `enrollments` | student | ✅ | local (pas temps réel) | divergence multi-device |
| 6 | Certificat | `CoursePlayer` (auto) | `issueCertificate` + `updateDocById` | `certificates`,`enrollments` | student | ✅ (serveur) | toast | flag client échec silencieux |
| 7 | Like/Repost/Vote Club | `useClubData` | `likeClubPost`… (`.catch(()=>null)`) | `club_posts` | student | ⚠ pas si échec | **optimiste sans rollback** | **divergence UI/DB** |
| 8 | Commentaire Club | `useClubData` | `addClubComment` | `club_posts/comments` | student | ✅ | re-fetch | OK |
| 9 | Suivi achat (analytics) | `PaymentReturn` onSnapshot | `trackPurchase()` | Meta Pixel | student | n/a | — | **appelé à chaque tick** → double-comptage |
| 10 | DM | `MessagesPage`/DM tab | `getOrCreateConversation`/`sendDmMessage` | `conversations(+messages)` | student | ✅ | **temps réel** | OK |
| 11 | Notifications | header | `subscribeNotifications` | `notifications/{uid}/items` | tous | lecture | **temps réel** | OK |
| 12 | Profil | `ProfileTab` | `updateUserProfile` (+Storage) | `users` | student | ✅ | toast | OK |
| 13 | Témoignage | `TestimonialsTab` | upload + `createDoc` | `testimonials` | student | ✅ | toast | OK |
| 14 | Gamification XP/badge | `DashboardTab`,`useClubData` | `addXP`/`awardBadge`/`updateStreak` | `gamification` | student | ✅ **côté client** | local | **écriture client non validée** (intégrité) |
| 15 | Suppression compte | `SettingsTab` | `deleteUserAccount` + `signOut` | cascade | student | ✅ | signOut | signOut même si échec |
| 16 | Admin CRUD | pages admin | `saveX`/`deleteX` | diverses | admin | ✅ (rules `isAdmin`) | re-fetch/optimiste | rollback partiel ; support échoue |
| 17 | Rysmo chat | `RysmoWidget` | `rysmo` callable | `rysmoConversations` | student | ✅ (serveur) | local | quota affiché parfois périmé |

## 3. Interconnexions cassées ou fragiles

### [D1] Actions Club « réussies » mais non persistées
- **Flux #7** · `useClubData.ts:213-234` · **Moyenne/P1**
- L'état local est mis à jour de façon optimiste ; `likeClubPost/voteClubPoll/repostClubPost/deleteClubComment` sont appelés avec `.catch(() => null)`. En cas d'échec, **aucun rollback, aucun toast** → l'utilisateur croit l'action faite. Au rechargement, elle a disparu.
- **Reco** : rollback + toast d'erreur ; ou listener temps réel sur `club_posts` comme source de vérité.

### [D2] Double-comptage du suivi d'achat
- **Flux #9** · `PaymentReturn.tsx:45-56` · **Faible-Moyenne/P2**
- `onSnapshot` rappelle `trackPurchase()` **à chaque mise à jour** du document transaction (pas de garde « déjà suivi »). → événements `Purchase` Meta dupliqués, revenus surévalués.
- **Reco** : flag `tracked` (ref locale) déclenchant le tracking une seule fois.

### [D3] Progression non synchronisée multi-appareils
- **Flux #5** · `CoursePlayer.tsx` · **Faible-Moyenne/P2**
- Chargement unique en `useEffect`, pas de listener. Deux appareils peuvent diverger / s'écraser.
- **Reco** : `onSnapshot` sur l'enrollment, ou recalcul serveur (déjà le cas pour le certificat).

### [D4] Écriture de gamification côté client
- **Flux #14** · `src/lib/gamification.ts` + règle `gamification` = `isOwner` · **Moyenne-Haute/P1**
- Le client peut écrire directement XP/level/badges (la règle ne valide pas les valeurs). Détail et impact dans `AUDIT_SECURITY.md` §S2. C'est l'interconnexion la plus à risque (le leaderboard serveur et les récompenses de parrainage dépendent de ces valeurs).

### [D5] Pas d'invalidation après mutation admin
- **Flux #16** · pages admin · **Faible/P2**
- Certaines pages mettent à jour l'état local de façon optimiste sans rollback en cas d'échec d'écriture (`AdminCoupons.tsx:78-81`, `AdminAnnouncements.tsx:86-89`, `AdminFormations.tsx:195` toggle/suppression). → état affiché ≠ base si l'écriture échoue.
- **Reco** : mettre à jour l'état **après** confirmation, avec rollback sur erreur.

## 4. Schéma de circulation des données

```
Composant (useEffect) ──get──▶ lib/firestore/* ──SDK──▶ Firestore ◀──rules── (autorisation)
      │                                                      ▲
      │ mutation (create/update/delete)                      │
      └──────────────────────────────────────────────────────┘
                         (pas d'invalidation ⇒ re-fetch manuel)

Actions sensibles ──httpsCallable──▶ Cloud Function (Admin SDK, bypass rules)
   (rysmo, checkout, certificate, gdpr, admin*)        │
                                                        ▼
Bictorys ──webhook HMAC──▶ bictorysWebhook ──idempotent──▶ Firestore
                                                        │
Temps réel : onSnapshot ◀── notifications / messages / conversations
```

## 5. Recommandations transverses

1. **Adopter React Query** : clés de requête + `invalidateQueries` après mutation → résout D2/D3/D5 et le manque de cache (cf. ARCHITECTURE A1).
2. **Bannir l'optimistic-sans-rollback** : tout `.catch(() => null)` masquant une écriture doit restaurer l'état + notifier.
3. **Généraliser les listeners temps réel** pour les données collaboratives (Club feed, progression).
4. **Centraliser le tracking** d'achat derrière une garde d'idempotence côté client.
5. **Verrouiller la gamification côté serveur** (cf. SECURITY §S2).

---
title: 'Audit W1 — la réservation de rendez-vous échoue à l''envoi'
type: 'bugfix'
created: '2026-11-03'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Sur maxmorrys.me/contact, « Confirmer le rendez-vous » échoue à chaque envoi avec l'erreur Firebase brute « Missing or insufficient permissions » (audit UI/UX & QA du 03/11/2026, constat W1, P1). La règle `appointments` de `firestore.rules` exige le champ `type`, que `useAppointment.handleSubmit` n'envoie jamais ; les tests de règles passent car leur fixture ajoute `type: 'decouverte'`.

**Approach:** Le client envoie `type` = le format choisi (visio, téléphone, WhatsApp), sans toucher la règle. En cas d'échec, afficher un message en français avec un recours (WhatsApp, e-mail) au lieu du message technique brut ; l'erreur reste remontée à Sentry.

</frozen-after-approval>

## Implementation Notes

- Cause racine double : (1) `type` exigé par la règle, jamais envoyé ; (2) `phone`/`message` à `undefined` refusés par Firestore (pas d'`ignoreUndefinedProperties`).
- Fichiers : `src/pages/contact/useAppointment.ts`, `src/pages/Contact.tsx`, `src/lib/firestore/content.ts`, `src/types/index.ts` (`AppointmentFormat`, `type` obligatoire), `src/i18n/locales/{fr,en}/contact.json`, `tests/firestore-rules/rules.test.ts` (+2 cas), `firestore.rules` (commentaire seulement, aucun déploiement de règles requis).
- Vérifié : typecheck, eslint, `test:rules` 130/130.

## Review Triage Log

- undefined refusé par Firestore — high, vérifié (`src/config/db.ts` sans `ignoreUndefinedProperties`) → patch.
- `type` optionnel `string` — medium → patch (union obligatoire partagée).
- Aucun test de la forme réelle — medium → patch (2 tests de règles).
- `type` non affiché en console/accusé — low, rejeté : le format part aussi dans `message`, lu par la console.
- Dérive `format`/`form.type` après `close()` — false : `Contact.tsx` n'appelle jamais `close()`.
- Recours du toast non cliquable — low → defer.
- Commentaire « en français » — low → patch.
- Référence de ligne périmée dans `firestore.rules` — low → patch.
- Valeurs de `type` non bornées par la règle — defer (changement de règle = déploiement).

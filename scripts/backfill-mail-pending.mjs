/**
 * POSE `mailPending` SUR LES ÉCHECS ANTÉRIEURS AU MARQUEUR.
 *
 * ── LE PROBLÈME QUE CE SCRIPT RÉPARE ──
 *
 * `mailPending` est écrit par le Worker depuis l'introduction de `transaction-mail.ts`.
 * Les transactions traitées AVANT n'ont pas le champ — et Firestore ne sait pas requêter
 * un champ absent. Le badge de la console ne peut donc pas les compter, alors que ce sont
 * précisément les plus anciennes : des clients qui ont payé, n'ont rien reçu, et attendent
 * depuis le plus longtemps.
 *
 * Ce script les retrouve et pose le drapeau. Une seule fois : ensuite, le Worker s'en
 * charge à chaque encaissement.
 *
 * ── CE QU'IL CONSIDÈRE COMME « EN ATTENTE » ──
 *
 * Une transaction `completed` à laquelle il manque `invoiceSentAt` OU `purchaseNoticeSentAt`.
 * Les deux comptent : la facture est promise par l'article 4 des CGV, et la confirmation
 * est ce qui dit au client que son accès est ouvert.
 *
 * ⚠️ Les transactions SANS adresse (`userEmail` absent) sont EXCLUES. Poser le drapeau
 * dessus lèverait un signal que personne ne peut baisser : la relance échouerait toujours,
 * faute de destinataire, et le badge resterait allumé à vie. Un compteur qu'on ne peut pas
 * ramener à zéro cesse d'être lu — c'est ainsi qu'on perd une alerte utile.
 *
 * ── SÉCURITÉ ──
 * DRY-RUN par défaut : n'écrit rien, affiche ce qu'il ferait. `--apply` pour écrire.
 *
 * Prérequis :
 *   - firebase-admin (lancer depuis `functions/`, qui l'a déjà, ou l'installer à la racine)
 *   - GOOGLE_APPLICATION_CREDENTIALS vers une clé de compte de service,
 *     OU `gcloud auth application-default login`
 *
 * Exemples :
 *   node scripts/backfill-mail-pending.mjs           # aperçu
 *   node scripts/backfill-mail-pending.mjs --apply   # écrit
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const APPLY = process.argv.includes('--apply');
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'max-morrys';

initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const db = getFirestore();

/** Firestore n'accepte que 500 écritures par lot. */
const TAILLE_LOT = 400;

async function main() {
  console.log(`Projet ${PROJECT_ID} — ${APPLY ? 'ÉCRITURE' : 'aperçu (dry-run)'}\n`);

  const snap = await db.collection('transactions').where('status', '==', 'completed').get();
  console.log(`${snap.size} transaction(s) encaissée(s) examinée(s).`);

  const aMarquer = [];
  let dejaMarquees = 0;
  let sansAdresse = 0;

  for (const doc of snap.docs) {
    const d = doc.data();
    const manque = !d.invoiceSentAt || !d.purchaseNoticeSentAt;
    if (!manque) continue;

    // Déjà signalée par le Worker : rien à faire, le drapeau est posé.
    if (d.mailPending === true) { dejaMarquees += 1; continue; }

    // Voir l'en-tête : un drapeau qu'aucune relance ne peut baisser est un drapeau mort.
    if (!d.userEmail) { sansAdresse += 1; continue; }

    aMarquer.push({
      ref: doc.ref,
      id: doc.id,
      quoi: [!d.purchaseNoticeSentAt && 'confirmation', !d.invoiceSentAt && 'facture']
        .filter(Boolean)
        .join(' + '),
      montant: d.amount,
      date: d.completedAt ?? d.createdAt ?? '?',
    });
  }

  console.log(`  · ${dejaMarquees} déjà marquée(s) par le Worker`);
  console.log(`  · ${sansAdresse} sans adresse — ignorée(s) volontairement`);
  console.log(`  · ${aMarquer.length} à marquer\n`);

  for (const t of aMarquer.slice(0, 20)) {
    console.log(`    ${t.id}  ${String(t.date).slice(0, 10)}  ${String(t.montant).padStart(9)}  manque : ${t.quoi}`);
  }
  if (aMarquer.length > 20) console.log(`    … et ${aMarquer.length - 20} autre(s)`);

  if (!APPLY) {
    console.log('\nAperçu seulement. Relancer avec --apply pour écrire.');
    return;
  }
  if (aMarquer.length === 0) {
    console.log('\nRien à écrire.');
    return;
  }

  let ecrites = 0;
  for (let i = 0; i < aMarquer.length; i += TAILLE_LOT) {
    const lot = db.batch();
    for (const t of aMarquer.slice(i, i + TAILLE_LOT)) lot.update(t.ref, { mailPending: true });
    await lot.commit();
    ecrites += Math.min(TAILLE_LOT, aMarquer.length - i);
    console.log(`  ${ecrites}/${aMarquer.length} écrite(s)`);
  }

  console.log(`\n✓ ${ecrites} transaction(s) marquée(s). Elles apparaissent désormais dans le badge de la console.`);
}

main().catch((error) => {
  console.error('Échec :', error);
  process.exitCode = 1;
});

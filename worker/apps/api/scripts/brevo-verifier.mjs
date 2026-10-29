/**
 * VÉRIFIE LE COMPTE BREVO — LECTURE SEULE. N'envoie rien, n'écrit rien.
 *
 * La clé de production n'est lisible que comme secret du Worker : ce script la prend dans
 * l'environnement de TA session, le temps d'une commande, et ne l'affiche jamais.
 *
 *   read -s BREVO_API_KEY && export BREVO_API_KEY   # coller la clé (xkeysib-…), rien ne s'affiche
 *   node worker/apps/api/scripts/brevo-verifier.mjs
 *   unset BREVO_API_KEY
 *
 * Contrôle : le compte et son plan (crédits d'envoi), les listes (l'identifiant de
 * `BREVO_LIST_ID` existe-t-il, combien de contacts), les expéditeurs (`BREVO_SENDER_EMAIL`
 * est-il actif), le domaine `lettre.maxmorrys.me` (authentifié ?).
 * Seules des requêtes GET partent vers api.brevo.com.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CLE = process.env.BREVO_API_KEY;
if (!CLE) {
  console.error('BREVO_API_KEY absente de l’environnement (voir l’en-tête du script).');
  process.exit(1);
}

// Les valeurs attendues, lues dans wrangler.jsonc (bloc racine, première occurrence).
const wrangler = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'wrangler.jsonc'), 'utf8');
const lire = (nom) => wrangler.match(new RegExp(`"${nom}"\\s*:\\s*"([^"]*)"`))?.[1] ?? '';
const LISTE = Number(lire('BREVO_LIST_ID'));
const EXPEDITEUR = lire('BREVO_SENDER_EMAIL');

async function get(chemin) {
  const r = await fetch(`https://api.brevo.com/v3${chemin}`, { headers: { 'api-key': CLE, accept: 'application/json' } });
  const corps = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, corps };
}

let defauts = 0;
const ko = (m) => { defauts += 1; console.log(`  ✗ ${m}`); };
const ok = (m) => console.log(`  ✓ ${m}`);

console.log('Compte');
const compte = await get('/account');
if (!compte.ok) {
  ko(`/account → ${compte.status} ${compte.corps.message ?? ''} (clé invalide, révoquée, ou restriction d’IP active ?)`);
  process.exit(1);
}
ok(`${compte.corps.companyName ?? '?'} — ${compte.corps.email ?? '?'}`);
for (const p of compte.corps.plan ?? []) {
  console.log(`    plan ${p.type} : ${p.credits ?? '?'} crédit(s) ${p.creditsType ?? ''}${p.endDate ? `, jusqu’au ${p.endDate}` : ''}`);
}

console.log(`\nListes (BREVO_LIST_ID attendu : ${LISTE})`);
const listes = await get('/contacts/lists?limit=50&offset=0');
if (!listes.ok) ko(`/contacts/lists → ${listes.status}`);
for (const l of listes.corps.lists ?? []) {
  console.log(`    ${l.id === LISTE ? '→' : ' '} ${l.id}  ${l.name}  (${l.uniqueSubscribers ?? l.totalSubscribers ?? '?'} contact(s), dossier ${l.folderId ?? '?'})`);
}
if (!(listes.corps.lists ?? []).some((l) => l.id === LISTE)) ko(`la liste ${LISTE} n’existe pas : corriger BREVO_LIST_ID dans wrangler.jsonc`);
else ok(`liste ${LISTE} présente`);

console.log(`\nExpéditeurs (BREVO_SENDER_EMAIL attendu : ${EXPEDITEUR})`);
const exp = await get('/senders');
if (!exp.ok) ko(`/senders → ${exp.status}`);
for (const s of exp.corps.senders ?? []) console.log(`    ${s.active ? 'actif  ' : 'inactif'} ${s.email}  (${s.name}, id ${s.id})`);
const trouve = (exp.corps.senders ?? []).find((s) => String(s.email).toLowerCase() === EXPEDITEUR.toLowerCase());
if (!trouve) ko(`${EXPEDITEUR} n’est pas un expéditeur du compte : l’ajouter (Expéditeurs, domaines et IP dédiées)`);
else if (!trouve.active) ko(`${EXPEDITEUR} existe mais est inactif`);
else ok(`${EXPEDITEUR} actif`);

console.log('\nDomaine d’envoi');
const domaine = EXPEDITEUR.split('@')[1] ?? '';
const dom = await get(`/senders/domains/${encodeURIComponent(domaine)}`);
if (!dom.ok) ko(`/senders/domains/${domaine} → ${dom.status} ${dom.corps.message ?? ''}`);
else if (dom.corps.authenticated !== true) ko(`${domaine} non authentifié chez Brevo`);
else ok(`${domaine} authentifié (vérifié : ${dom.corps.verified === true ? 'oui' : 'non'})`);

console.log(defauts ? `\n${defauts} défaut(s) à corriger avant d’ouvrir l’envoi réel.` : '\nTout est en place côté Brevo.');
process.exit(defauts ? 1 : 0);

#!/usr/bin/env node
/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LA PORTE ANTI-DÉMONSTRATION DU PAQUET NATIF — ET POURQUOI ELLE N'EST PLUS UN `grep`.
 *
 * ⚠️ HERMES RANGE LES CHAÎNES ACCENTUÉES DANS UNE TABLE UTF-16.
 *
 * La version précédente de cette porte était une boucle shell sur `grep -rqF`. Mesuré le
 * 05/09/2026 sur un paquet réel : une chaîne purement ASCII (« Vendre sans budget pub ») se
 * trouve bien dans le `.hbc` ; une chaîne accentuée (« elles sont comptées ») ne s'y trouve
 * PAS en UTF-8 — elle est stockée en UTF-16, invisible à `grep`.
 *
 * Conséquence directe : sur les sept marqueurs que la porte surveillait, « planche de
 * référence » ne pouvait PAS être détecté. La porte était verte parce qu'elle était aveugle,
 * pas parce que le paquet était propre. C'est exactement le mode d'échec que ce dépôt
 * documente ailleurs — un test qui ne peut pas voir ce qu'il garde.
 *
 * Chaque marqueur est donc cherché dans LES DEUX encodages, sur les octets du fichier.
 *
 * ── UN AUTO-CONTRÔLE, PARCE QU'UNE PORTE MUETTE SE CONFOND AVEC UNE PORTE VERTE ─────────
 * Avant de déclarer le paquet propre, le script vérifie qu'il sait trouver une chaîne
 * ACCENTUÉE qu'il sait présente. Si ce témoin est introuvable, c'est l'outil de mesure qui
 * est en panne — et le script échoue en le disant, au lieu de conclure.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = process.argv[2] ?? 'dist';

/**
 * ⚠️ NE PAS AJOUTER « App Store » À CETTE LISTE. La chaîne est présente dans le paquet, mais
 * elle vient de `@firebase/auth` (« An iOS Bundle ID must be provided if an App Store ID is
 * provided ») — la porte échouerait pour une raison qui n'est pas la nôtre. Mesuré, pas
 * supposé.
 */
const MARQUEURS = [
  'aissatou@exemple.sn',
  'Vendre sans budget pub',
  'planche de référence',
  'Payer en Wave',
  'Ouvrir sur maxmorrys.me',
  '/checkout/',
  'Google Play',
];

/**
 * Le témoin de l'auto-contrôle : une chaîne ACCENTUÉE que le paquet de production porte
 * toujours, parce qu'elle est l'engagement du Club (`mobile/contenu/engagement.ts`) et qu'il
 * ne passe pas sous l'interrupteur de démonstration.
 */
const TEMOIN = 'elles sont comptées';

function fichiers(dir) {
  const sortie = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) sortie.push(...fichiers(p));
    else sortie.push(p);
  }
  return sortie;
}

const octets = fichiers(DIST).map((p) => ({ p, buf: readFileSync(p) }));

/** Cherche dans les deux encodages qu'un paquet Hermes peut employer. */
function present(texte) {
  const u8 = Buffer.from(texte, 'utf8');
  const u16 = Buffer.from(texte, 'utf16le');
  return octets.find(({ buf }) => buf.includes(u8) || buf.includes(u16))?.p ?? null;
}

if (octets.length === 0) {
  console.error(`::error::aucun fichier sous ${DIST}/ — la porte n'a rien examiné`);
  process.exit(1);
}

if (present(TEMOIN) === null) {
  console.error(
    `::error::auto-contrôle en échec : le témoin « ${TEMOIN} » est introuvable. `
    + "La porte ne sait pas lire ce paquet, donc son silence ne prouve rien.",
  );
  process.exit(1);
}

let fautes = 0;
for (const marqueur of MARQUEURS) {
  const ou = present(marqueur);
  if (ou !== null) {
    console.error(`::error::« ${marqueur} » est présent dans le paquet de production (${ou})`);
    fautes = 1;
  }
}

if (fautes === 0) {
  console.log(`✅ paquet propre — ${MARQUEURS.length} marqueurs cherchés en UTF-8 ET UTF-16 sur ${octets.length} fichiers`);
}
process.exit(fautes);

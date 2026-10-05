import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkStateType, getNetworkStateAsync } from 'expo-network';

import { ErreurAppel } from './appel';
import { ecrire } from './cache';
import type { LeconContenu } from './contrat.generated';
import { getAuthNatif } from './firebase';
import { ajouter, identifiant, vider, type Ecartee, type EnFile, type Issue, type Operation } from './file';
import { cleDeLecon, garder, octetsUtf8, poids, type Gardee } from './garde';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LE HORS-CONNEXION — CE QUI EST GARDÉ SUR CE TÉLÉPHONE, ET CE QUI ATTEND DE PARTIR.
 *
 * Deux objets, et ils ne sont PAS un cache :
 *   · les LEÇONS GARDÉES — la personne a touché « Télécharger » ; leur texte se lit sans
 *     réseau. La vidéo, non : c'est une intégration, pas un fichier. Plafond écrit (`garde.ts`).
 *   · la FILE D'ENVOI — ce qui a été fait sans réseau (une leçon cochée, une note), listé
 *     avec son heure, et envoyé au retour du réseau sans rien demander (`file.ts`).
 *
 * RANGÉS PAR COMPTE. Les clés portent l'uid : un second compte sur le même téléphone ne voit
 * ni les leçons ni la file du premier. La DÉCONNEXION ne les efface pas — une file non
 * envoyée est un geste de la personne, la perdre serait la faute que ce module existe pour
 * éviter ; elle partira à la prochaine connexion. La SUPPRESSION du compte, elle, efface tout
 * (`effacerHorsLigne`).
 *
 * ⚠️ L'ÉTAT DU RÉSEAU NE BLOQUE RIEN (`mobile-reseau.test.ts`) : un geste part TOUJOURS
 * d'abord ; c'est l'ÉCHEC de transport qui le met en file, jamais une lecture préalable.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

interface Etat {
  uid: string | null;
  gardees: Gardee[];
  file: EnFile[];
  ecartees: Ecartee[];
  wifiSeul: boolean;
  envoi: 'repos' | 'en cours';
}

let etat: Etat = { uid: null, gardees: [], file: [], ecartees: [], wifiSeul: true, envoi: 'repos' };
const abonnes = new Set<() => void>();

function publier(suite: Partial<Etat>) {
  etat = { ...etat, ...suite };
  for (const f of abonnes) f();
}

export function useHorsLigne(): Etat {
  return useSyncExternalStore(
    (f) => { abonnes.add(f); return () => { abonnes.delete(f); }; },
    () => etat,
  );
}

const cle = (uid: string, quoi: string) => `rysmo.horsligne.${uid}.${quoi}`;

async function lireJson<T>(k: string, defaut: T): Promise<T> {
  try {
    const brut = await AsyncStorage.getItem(k);
    return brut === null ? defaut : (JSON.parse(brut) as T);
  } catch {
    return defaut;
  }
}

async function ecrireJson(k: string, v: unknown): Promise<void> {
  await AsyncStorage.setItem(k, JSON.stringify(v));
}

/** Charge l'état du compte connecté. Appelé quand la session s'ouvre. */
export async function chargerHorsLigne(uid: string): Promise<void> {
  if (etat.uid === uid) return;
  const [gardees, file, ecartees, wifiSeul] = await Promise.all([
    lireJson<Gardee[]>(cle(uid, 'index'), []),
    lireJson<EnFile[]>(cle(uid, 'file'), []),
    lireJson<Ecartee[]>(cle(uid, 'ecartees'), []),
    lireJson<boolean>(cle(uid, 'wifi'), true),
  ]);
  publier({ uid, gardees, file, ecartees, wifiSeul, envoi: 'repos' });
}

/** La session s'est fermée : on cesse d'AFFICHER, on n'efface rien. */
export function oublierHorsLigneAffiche(): void {
  publier({ uid: null, gardees: [], file: [], ecartees: [], envoi: 'repos' });
}

function uidCourant(): string | null {
  return getAuthNatif()?.currentUser?.uid ?? null;
}

/* ── Les leçons gardées ─────────────────────────────────────────────────────────────── */

export class RefusDeGarde extends Error {}

export async function garderLecon(contenu: LeconContenu, releveA: string): Promise<{ evincees: Gardee[] }> {
  const uid = uidCourant();
  if (!uid) throw new RefusDeGarde('Connecte-toi pour garder une leçon sur ce téléphone.');
  await chargerHorsLigne(uid);

  /* LE WI-FI PAR DÉFAUT N'EST PAS UN RÉGLAGE DE CONFORT : télécharger sur les données
     mobiles sans le demander, c'est dépenser l'argent de quelqu'un d'autre. */
  if (etat.wifiSeul) {
    try {
      const r = await getNetworkStateAsync();
      if (r.type === NetworkStateType.CELLULAR) {
        throw new RefusDeGarde("Tu es sur les données mobiles, et le téléchargement est réglé sur Wi-Fi seulement. Change le réglage dans Téléchargements, ou attends le Wi-Fi.");
      }
    } catch (e: unknown) {
      if (e instanceof RefusDeGarde) throw e;
      /* Type de réseau illisible : on ne bloque pas sur une lecture incertaine. */
    }
  }

  const corps = JSON.stringify({ contenu, releveA });
  const entree: Gardee = {
    cle: cleDeLecon(contenu.formationId, contenu.id),
    formationId: contenu.formationId,
    leconId: contenu.id,
    titre: contenu.titre,
    moduleTitre: contenu.moduleTitre ?? null,
    octets: octetsUtf8(corps),
    gardeeLe: new Date().toISOString(),
    videoEnLigne: contenu.video != null,
  };
  const { index, evincees } = garder(etat.gardees, entree);
  await AsyncStorage.setItem(cle(uid, `lecon.${entree.cle}`), corps);
  await Promise.all(evincees.map((e) => AsyncStorage.removeItem(cle(uid, `lecon.${e.cle}`))));
  await ecrireJson(cle(uid, 'index'), index);
  publier({ gardees: index });
  return { evincees };
}

export async function retirerLecon(cleLecon: string): Promise<void> {
  const uid = etat.uid;
  if (!uid) return;
  const index = etat.gardees.filter((g) => g.cle !== cleLecon);
  await AsyncStorage.removeItem(cle(uid, `lecon.${cleLecon}`));
  await ecrireJson(cle(uid, 'index'), index);
  publier({ gardees: index });
}

export async function lireLeconGardee(formationId: string, leconId: string): Promise<{ contenu: LeconContenu; releveA: string } | null> {
  const uid = uidCourant();
  if (!uid) return null;
  return lireJson<{ contenu: LeconContenu; releveA: string } | null>(cle(uid, `lecon.${cleDeLecon(formationId, leconId)}`), null);
}

export async function reglerWifiSeul(oui: boolean): Promise<void> {
  if (!etat.uid) return;
  await ecrireJson(cle(etat.uid, 'wifi'), oui);
  publier({ wifiSeul: oui });
}

/* ── La file d'envoi ────────────────────────────────────────────────────────────────── */

/** Les codes qui disent « le transport a lâché » : le geste repartira. Les autres sont des refus. */
const TRANSPORT = new Set(['unavailable', 'deadline-exceeded', 'unauthenticated', 'inconnu']);

function issueDe(e: unknown): Issue {
  if (e instanceof ErreurAppel && !TRANSPORT.has(e.code)) return { refus: e.motif };
  return 'transport';
}

export const estUnEchecDeTransport = (e: unknown) => issueDe(e) === 'transport';

async function sauverFile(uid: string, file: EnFile[], ecartees: Ecartee[]) {
  await Promise.all([ecrireJson(cle(uid, 'file'), file), ecrireJson(cle(uid, 'ecartees'), ecartees)]);
  publier({ file, ecartees });
}

/** Met un geste en file — appelé SEULEMENT après un échec de transport. */
export async function mettreEnFile(titre: string, operation: Operation): Promise<void> {
  const uid = uidCourant();
  if (!uid) return;
  await chargerHorsLigne(uid);
  const file = ajouter(etat.file, { id: identifiant(), titre, faitLe: new Date().toISOString(), operation });
  await sauverFile(uid, file, etat.ecartees);
}

/** Envoie la file, dans l'ordre. Rien ne se passe si elle est vide ou déjà en cours d'envoi. */
export async function envoyerLaFile(): Promise<void> {
  const uid = etat.uid ?? uidCourant();
  if (!uid || etat.envoi === 'en cours') return;
  await chargerHorsLigne(uid);
  if (etat.file.length === 0) return;
  publier({ envoi: 'en cours' });
  try {
    const bilan = await vider(etat.file, async (e) => {
      try {
        await ecrire(e.operation.type, e.operation.params);
        return 'envoye';
      } catch (err: unknown) {
        return issueDe(err);
      }
    });
    await sauverFile(uid, bilan.restantes, [...etat.ecartees, ...bilan.ecartees]);
  } finally {
    publier({ envoi: 'repos' });
  }
}

export async function oublierEcartees(): Promise<void> {
  if (!etat.uid) return;
  await sauverFile(etat.uid, etat.file, []);
}

/** La suppression du compte efface TOUT ce que ce téléphone gardait pour lui. */
export async function effacerHorsLigne(uid: string): Promise<void> {
  try {
    const cles = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(`rysmo.horsligne.${uid}.`));
    await AsyncStorage.multiRemove(cles);
  } finally {
    if (etat.uid === uid) oublierHorsLigneAffiche();
  }
}

/** « 3 leçons · 42 Ko » — mesuré sur l'appareil, ou « aucune leçon gardée ». */
export function useResumeTelechargements(): string {
  const { gardees } = useHorsLigne();
  if (gardees.length === 0) return 'aucune leçon gardée';
  const octets = gardees.reduce((n, g) => n + g.octets, 0);
  return `${gardees.length} ${gardees.length > 1 ? 'leçons' : 'leçon'} · ${poids(octets)}`;
}

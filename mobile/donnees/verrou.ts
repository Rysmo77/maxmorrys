import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import * as Systeme from 'expo-local-authentication';
import * as Coffre from 'expo-secure-store';

import { isIOS } from '../ds';
import { useSession } from './session';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LE VERROU DE L'APPLICATION — un geste système, un drapeau d'un octet, et rien de plus.
 *
 * L'écran `biometrie.tsx` proposait « Activer Face ID » et son bouton appelait
 * `router.replace('/(tabs)')`. Ce n'était pas un bouton MORT — il agissait — mais il
 * n'agissait pas comme il l'annonçait, ce qui est pire : quelqu'un croyait avoir posé un
 * verrou et n'en avait aucun. Le profil affichait le même interrupteur, allumé par défaut,
 * sur un `useState(true)` qui ne gardait rien.
 *
 * ── CE QUE CE VERROU PROTÈGE, ET CE QU'IL NE PROTÈGE PAS ─────────────────────────────
 * Il protège **l'accès à l'application**, jamais la session. Celle-ci reste dans
 * AsyncStorage, en clair, exactement là où le SDK Firebase la met (`firebase.ts` explique
 * pourquoi elle n'est pas dans le coffre : le blob dépasse la limite Android d'environ
 * 2 048 octets, et l'échec y est INTERMITTENT ET PAR COMPTE). Rien n'est rechiffré ici.
 *
 * L'écran le dit déjà — « un raccourci, pas un remplacement » — et ce module ne doit pas
 * laisser croire davantage. Ce qui tient dans le coffre, c'est UN DRAPEAU : « cette
 * personne a demandé qu'on lui redemande son visage au lancement ». Un octet, pas un secret.
 *
 * ── POURQUOI LE MATÉRIEL EST INTERROGÉ AVANT DE PROPOSER ─────────────────────────────
 * `hasHardwareAsync()` puis `isEnrolledAsync()`. Proposer un verrou impossible à poser est
 * un réglage qui ment — c'est exactement le reproche que l'en-tête de l'écran adresse aux
 * autres. Un téléphone sans capteur ne doit pas voir le bouton ; un téléphone dont on a
 * retiré toutes les empreintes ne doit pas rester enfermé dehors.
 *
 * ── ET AUCUN ÉCHEC N'ENFERME ─────────────────────────────────────────────────────────
 * Trois sorties, dans cet ordre :
 *   1. le repli système (code du téléphone) reste actif — `disableDeviceFallback` n'est
 *      jamais posé ;
 *   2. l'écran verrouillé porte une déconnexion, qui retire AUSSI le drapeau (voir
 *      `app/_layout.tsx`) ;
 *   3. une lecture du coffre qui échoue ouvre — un drapeau illisible ne prouve aucun verrou,
 *      et un capteur cassé ne doit pas rendre le compte inaccessible depuis ce téléphone.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * La clé du drapeau. Elle est NOMMÉE ici et nulle part ailleurs : une chaîne recopiée dans
 * un écran donnerait deux verrous qui s'ignorent — l'un allumé, l'autre lu.
 */
const CLE = 'rysmo.verrou.biometrie';

/* ── LE MAGASIN ─────────────────────────────────────────────────────────────────────────
 *
 * Le drapeau vit dans le coffre, mais il se LIT depuis deux écrans (le profil et
 * `biometrie.tsx`) qui peuvent être montés en même temps. Un `useState` par écran leur
 * ferait afficher deux vérités sur la même question dès qu'on bascule l'un des deux —
 * c'est le défaut, à la lettre, que `ds/tutor.ts` documente pour le nom du répétiteur.
 * `useSyncExternalStore` le ferme sans rien ajouter au projet : c'est du React.
 */
let actif = false;
let lecture: Promise<boolean> | null = null;
const abonnes = new Set<() => void>();

function prevenir(): void {
  for (const f of abonnes) f();
}

function abonner(f: () => void): () => void {
  abonnes.add(f);
  return () => { abonnes.delete(f); };
}

function lireCache(): boolean {
  return actif;
}

function poser(valeur: boolean): void {
  if (valeur === actif) return;
  actif = valeur;
  prevenir();
}

/**
 * Le drapeau, lu UNE fois au coffre puis servi de mémoire.
 *
 * L'échec ouvre — voir l'en-tête. `getItemAsync` peut lever sur un trousseau abîmé, et
 * traiter cette panne comme « verrouillé » enfermerait sur une donnée qu'on n'a pas su lire.
 */
export function chargerDrapeau(): Promise<boolean> {
  lecture ??= Coffre.getItemAsync(CLE)
    .then((v) => v === '1')
    .catch(() => false)
    .then((v) => { poser(v); return v; });
  return lecture;
}

/** Le drapeau tel qu'on le connaît, avec re-rendu à chaque changement. */
export function useVerrouActif(): boolean {
  return useSyncExternalStore(abonner, lireCache, lireCache);
}

/* ── LE MATÉRIEL ────────────────────────────────────────────────────────────────────── */

/**
 * Ce que l'appareil permet — et, quand il ne permet rien, DEUX façons de le dire.
 *
 * `motif` est la phrase entière : elle explique et elle oriente, et c'est ce que lit
 * l'écran qui proposait le réglage. `court` tient sur la ligne de méta d'un réglage, en
 * monospace de 12 px, où une phrase de trois lignes se lirait comme une avarie. Les deux
 * disent la même chose ; aucune des deux n'est un raccourci de l'autre.
 */
export type Capacite =
  | { etat: 'absent'; motif: string; court: string }
  | { etat: 'nonEnrole'; motif: string; court: string }
  | { etat: 'pret'; geste: string };

/**
 * Le nom du geste, dans la langue de chaque système.
 *
 * Ce n'est pas de la cosmétique : « Face ID » et « Touch ID » sont des marques d'Apple, et
 * un bouton qui annonce Face ID sur un iPhone à capteur d'empreinte annonce quelque chose
 * qui n'arrivera pas. Android ne nomme rien — on décrit donc le geste.
 */
function nommer(types: readonly Systeme.AuthenticationType[]): string {
  const visage = types.includes(Systeme.AuthenticationType.FACIAL_RECOGNITION);
  if (isIOS) return visage ? 'Face ID' : 'Touch ID';
  const doigt = types.includes(Systeme.AuthenticationType.FINGERPRINT);
  return visage && !doigt ? 'ton visage' : 'ton empreinte';
}

/**
 * Les deux questions, dans l'ordre, et une phrase par refus.
 *
 * L'échec d'interrogation est traité comme une absence de matériel : on ne propose pas un
 * réglage qu'on n'a pas su vérifier.
 */
export async function capaciteDuVerrou(): Promise<Capacite> {
  try {
    if (!await Systeme.hasHardwareAsync()) {
      return {
        etat: 'absent',
        motif: "Ce téléphone n'a ni lecteur d'empreinte ni reconnaissance du visage. "
          + 'Ton mot de passe reste le seul moyen d\'entrer, et il suffit.',
        court: 'aucun capteur sur ce téléphone',
      };
    }
    if (!await Systeme.isEnrolledAsync()) {
      return {
        etat: 'nonEnrole',
        motif: 'Ce téléphone a le capteur, mais aucune empreinte ni aucun visage n\'y est '
          + 'enregistré. Ajoute-en un dans les réglages du téléphone, puis reviens.',
        court: 'rien n\'est enregistré dans les réglages du téléphone',
      };
    }
    return { etat: 'pret', geste: nommer(await Systeme.supportedAuthenticationTypesAsync()) };
  } catch {
    return {
      etat: 'absent',
      motif: "Le capteur de ce téléphone n'a pas répondu. Mieux vaut ne rien promettre "
        + 'que de poser un verrou dont on ne sait pas s\'il s\'ouvrira.',
      court: "le capteur n'a pas répondu",
    };
  }
}

/* ── L'INVITE ───────────────────────────────────────────────────────────────────────── */

export type Verdict = { ok: true } | { ok: false; motif: string };

/**
 * Les codes du module, traduits.
 *
 * Aucun ne remonte tel quel à l'écran — `not_enrolled` ou `lockout` ne veulent rien dire
 * pour la personne qui les lit, et les afficher revient à lui demander de traduire. C'est la
 * règle qu'`identite.ts` pose déjà pour les codes Firebase.
 */
function traduire(code: string): string {
  switch (code) {
    case 'user_cancel':
    case 'system_cancel':
    case 'app_cancel':
      return 'Tu as annulé.';
    case 'user_fallback':
      return 'Tu as choisi une autre méthode — elle n\'est pas encore branchée ici.';
    case 'not_enrolled':
      return 'Plus rien n\'est enregistré sur ce téléphone.';
    case 'not_available':
      return 'Le capteur n\'est pas disponible en ce moment.';
    case 'passcode_not_set':
      return 'Ce téléphone n\'a pas de code de verrouillage.';
    case 'lockout':
      return 'Trop de tentatives : le système a suspendu le capteur. Déverrouille ton '
        + 'téléphone comme d\'habitude, puis réessaie.';
    case 'authentication_failed':
      return 'Ça n\'a pas été reconnu.';
    default:
      return 'Le déverrouillage n\'a pas abouti.';
  }
}

/** L'invite système. `disableDeviceFallback` n'est jamais posé : le code du téléphone reste
 *  une sortie, et c'est elle qui évite d'enfermer quelqu'un derrière un capteur sale. */
async function inviter(promptMessage: string): Promise<Verdict> {
  try {
    const r = await Systeme.authenticateAsync({
      promptMessage,
      cancelLabel: 'Annuler',
    });
    return r.success ? { ok: true } : { ok: false, motif: traduire(r.error) };
  } catch {
    return { ok: false, motif: traduire('') };
  }
}

/** Le geste du démarrage à froid. */
export function demanderDeverrouillage(): Promise<Verdict> {
  return inviter('Déverrouille Rysmo');
}

/* ── POSER ET RETIRER ───────────────────────────────────────────────────────────────── */

/**
 * Active le verrou — et ne l'active QUE si le geste a réussi.
 *
 * L'ordre n'est pas négociable : écrire le drapeau d'abord et demander ensuite laisserait
 * un verrou posé par quelqu'un qui n'a pas pu le franchir une seule fois. C'est exactement
 * la façon dont on s'enferme dehors.
 */
export async function poserVerrou(): Promise<Verdict> {
  const capacite = await capaciteDuVerrou();
  if (capacite.etat !== 'pret') return { ok: false, motif: capacite.motif };

  const verdict = await inviter(`Confirme avec ${capacite.geste}`);
  if (!verdict.ok) return verdict;

  try {
    await Coffre.setItemAsync(CLE, '1', {
      /* Le drapeau appartient à CE téléphone : le laisser voyager dans une sauvegarde
         poserait un verrou sur un appareil dont on n'a jamais vérifié le capteur. */
      keychainAccessible: Coffre.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    return {
      ok: false,
      motif: 'Le réglage n\'a pas pu être enregistré sur ce téléphone. Rien n\'a été activé.',
    };
  }
  poser(true);
  return { ok: true };
}

/**
 * Retire le verrou. Aucune invite : redemander le visage pour ÉTEINDRE une commodité
 * fabriquerait la panne qu'on veut éviter — quelqu'un dont le capteur ne répond plus ne
 * pourrait plus rien éteindre.
 */
export async function retirerVerrou(): Promise<void> {
  try {
    await Coffre.deleteItemAsync(CLE);
  } catch {
    /* Le drapeau reste peut-être au coffre, mais l'intention est claire et la mémoire suit :
       mieux vaut un verrou éteint qu'une exception remontée dans un écran de réglages. */
  }
  poser(false);
}

/* ── CE QUE LES ÉCRANS DE RÉGLAGE UTILISENT ─────────────────────────────────────────── */

/**
 * L'état du réglage, pour `biometrie.tsx` et le profil.
 *
 * `capacite === null` veut dire « on interroge encore le matériel » — et c'est un état à
 * part entière, pas un `false` déguisé : afficher « indisponible » pendant l'interrogation
 * dirait une chose fausse pendant deux images.
 */
export function useVerrou(): {
  actif: boolean;
  capacite: Capacite | null;
  occupe: boolean;
  activer: () => Promise<Verdict>;
  desactiver: () => Promise<void>;
} {
  const actifCourant = useVerrouActif();
  const [capacite, setCapacite] = useState<Capacite | null>(null);
  const [occupe, setOccupe] = useState(false);
  const monte = useRef(true);

  useEffect(() => {
    monte.current = true;
    void chargerDrapeau();
    void capaciteDuVerrou().then((c) => { if (monte.current) setCapacite(c); });
    return () => { monte.current = false; };
  }, []);

  const activer = useCallback(async (): Promise<Verdict> => {
    if (occupe) return { ok: false, motif: 'Une demande est déjà en cours.' };
    setOccupe(true);
    try {
      const verdict = await poserVerrou();
      /* Une activation refusée pour cause de matériel change ce que l'écran doit proposer :
         on relit la capacité plutôt que de laisser un bouton qui promet encore. */
      if (!verdict.ok) {
        const c = await capaciteDuVerrou();
        if (monte.current) setCapacite(c);
      }
      return verdict;
    } finally {
      if (monte.current) setOccupe(false);
    }
  }, [occupe]);

  const desactiver = useCallback(async (): Promise<void> => {
    setOccupe(true);
    try {
      await retirerVerrou();
    } finally {
      if (monte.current) setOccupe(false);
    }
  }, []);

  return { actif: actifCourant, capacite, occupe, activer, desactiver };
}

/* ── LA PORTE DU DÉMARRAGE ──────────────────────────────────────────────────────────── */

export type Porte =
  | { etat: 'attente' }
  | { etat: 'ouvert' }
  | {
    etat: 'verrouille';
    motif: string;
    geste: string;
    enCours: boolean;
    reessayer: () => void;
  };

/**
 * LE VERROU DU DÉMARRAGE À FROID — la seule pièce qui doit précéder tout rendu.
 *
 * Elle vit ici et pas dans un écran pour une raison mécanique : un verrou qui s'affiche
 * APRÈS le contenu n'a rien protégé. `app/_layout.tsx` est le seul endroit d'où l'attente
 * peut précéder le premier écran, et ce hook est ce qu'il y appelle.
 *
 * ── LES QUATRE CHEMINS ───────────────────────────────────────────────────────────────
 *   drapeau absent            → ouvert, tout de suite. Rien n'a été demandé.
 *   session en restauration   → attente. On ne SAIT pas encore s'il y a quelqu'un, et
 *                               confondre « je ne sais pas » avec « personne » ouvrirait
 *                               l'application le temps d'un battement.
 *   personne connectée        → ouvert. Il n'y a rien à déverrouiller.
 *   quelqu'un + drapeau       → invite système, puis le contenu ou l'écran verrouillé.
 *
 * ── ET UNE FOIS OUVERT, ÇA RESTE OUVERT ──────────────────────────────────────────────
 * Le verrou garde le DÉMARRAGE. Se refermer sur un changement de session en cours de route
 * verrouillerait l'application juste après une déconnexion volontaire — c'est-à-dire au
 * moment précis où il n'y a plus rien à garder.
 */
export function useVerrouDeDemarrage(): { porte: Porte; extinction: string | null } {
  const session = useSession();
  const [drapeau, setDrapeau] = useState<boolean | null>(null);
  const [etat, setEtat] = useState<'attente' | 'ouvert' | 'verrouille'>('attente');
  const [motif, setMotif] = useState('');
  const [geste, setGeste] = useState(isIOS ? 'Face ID' : 'ton empreinte');
  const [enCours, setEnCours] = useState(false);
  /** Ce que le verrou a éteint tout seul, à DIRE une fois. Un réglage qui disparaît en
   *  silence est la même faute que le bouton qui n'agissait pas. */
  const [extinction, setExtinction] = useState<string | null>(null);
  const demandee = useRef(false);

  useEffect(() => {
    let vivant = true;
    void chargerDrapeau().then((v) => { if (vivant) setDrapeau(v); });
    return () => { vivant = false; };
  }, []);

  const tenter = useCallback(async () => {
    setEnCours(true);
    try {
      const capacite = await capaciteDuVerrou();
      if (capacite.etat !== 'pret') {
        /* Le matériel a disparu sous le verrou — empreintes retirées, capteur muet. On
           n'enferme pas : le réglage s'éteint, et le changement est DIT. */
        await retirerVerrou();
        setExtinction(capacite.motif);
        setEtat('ouvert');
        return;
      }
      setGeste(capacite.geste);
      const verdict = await demanderDeverrouillage();
      if (verdict.ok) {
        setEtat('ouvert');
        return;
      }
      setMotif(verdict.motif);
      setEtat('verrouille');
    } finally {
      setEnCours(false);
    }
  }, []);

  useEffect(() => {
    if (etat === 'ouvert') return;              // ouvert une fois, ouvert pour la session
    if (drapeau === null) return;               // le coffre n'a pas encore répondu
    if (drapeau === false) { setEtat('ouvert'); return; }
    if (session.phase === 'restauration') return;
    if (session.phase !== 'connectee') { setEtat('ouvert'); return; }
    if (demandee.current) return;
    demandee.current = true;
    void tenter();
  }, [drapeau, session.phase, etat, tenter]);

  const reessayer = useCallback(() => {
    if (enCours) return;
    void tenter();
  }, [enCours, tenter]);

  if (etat === 'attente') return { porte: { etat: 'attente' }, extinction };
  if (etat === 'ouvert') return { porte: { etat: 'ouvert' }, extinction };
  return { porte: { etat: 'verrouille', motif, geste, enCours, reessayer }, extinction };
}

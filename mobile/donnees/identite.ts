import {
  createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword,
  signOut, updateProfile,
} from 'firebase/auth';

import { appeler } from './appel';
import { getAuthNatif } from './firebase';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ENTRER, SORTIR, RECOMMENCER.
 *
 * Trois gestes, et une règle commune : **aucun code Firebase ne remonte à l'écran.**
 * `auth/invalid-credential` ne veut rien dire pour la personne qui le lit, et l'afficher
 * revient à lui demander de traduire. Chaque échec est donc converti ici en une phrase qui
 * dit quoi faire.
 *
 * ⚠️ UN CAS MÉRITE D'ÊTRE NOMMÉ À PART. Depuis 2024, Firebase renvoie
 * `auth/invalid-credential` aussi bien pour un mot de passe faux que pour un compte
 * inexistant — c'est délibéré, ça évite de révéler quels e-mails sont inscrits. On ne peut
 * donc PAS écrire « ce compte n'existe pas », et il ne faut pas essayer : la phrase doit
 * couvrir les deux sans mentir sur aucun.
 *
 * Deuxième cas, propre à ce produit : le web propose déjà Google. Quelqu'un qui s'y est
 * inscrit par Google n'a jamais choisi de mot de passe. Ici, il obtiendrait
 * `auth/invalid-credential` et lirait « identifiants incorrects » — ce qui est faux, et le
 * laisse essayer des mots de passe qui n'ont jamais existé. C'est la raison pour laquelle
 * Google doit arriver vite (et, avec lui, « Se connecter avec Apple » — App Store 4.8).
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

export class ErreurIdentite extends Error {
  constructor(readonly motif: string, readonly code: string) {
    super(motif);
    this.name = 'ErreurIdentite';
  }
}

function auth() {
  const a = getAuthNatif();
  if (a === null) {
    throw new ErreurIdentite(
      "Cette version de l'application n'a pas reçu sa configuration. Rien ne peut être tenté d'ici.",
      'config-manquante',
    );
  }
  return a;
}

function traduire(erreur: unknown): never {
  const code = (erreur as { code?: string })?.code ?? '';
  const motif = (() => {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        // Volontairement une seule phrase pour trois causes : voir l'en-tête.
        return 'Cette adresse et ce mot de passe ne vont pas ensemble.';
      case 'auth/invalid-email': return "Cette adresse e-mail n'est pas valide.";
      case 'auth/email-already-in-use': return 'Un compte existe déjà avec cette adresse.';
      case 'auth/weak-password': return 'Ce mot de passe est trop court — six caractères au minimum.';
      case 'auth/too-many-requests': return 'Trop de tentatives. Réessaie dans quelques minutes.';
      case 'auth/network-request-failed': return 'Pas de connexion.';
      case 'auth/user-disabled': return 'Ce compte est désactivé.';
      default: return 'La connexion a échoué.';
    }
  })();
  throw new ErreurIdentite(motif, code || 'inconnu');
}

export async function connexionEmail(email: string, motDePasse: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(auth(), email.trim(), motDePasse);
  } catch (erreur: unknown) {
    if (erreur instanceof ErreurIdentite) throw erreur;
    traduire(erreur);
  }
}

/**
 * Crée le compte ET son profil.
 *
 * ⚠️ L'ORDRE COMPTE, et il n'est pas rattrapable dans l'autre sens. `createUser…` crée le
 * compte d'authentification ; le profil `users/{uid}` vient ensuite, par le serveur. Si la
 * seconde étape échoue, la personne a un compte qui se connecte et aucun profil à lire.
 * On ne peut pas défaire la première (supprimer un compte tout juste créé demande une
 * ré-authentification), alors on ne fait pas semblant : `creerMonProfil` est IDEMPOTENTE
 * côté serveur, et le prochain lancement la rappellera sans rien écraser.
 */
export async function creationEmail(
  nom: string, email: string, motDePasse: string,
): Promise<void> {
  const a = auth();
  try {
    const identifiants = await createUserWithEmailAndPassword(a, email.trim(), motDePasse);
    await updateProfile(identifiants.user, { displayName: nom.trim() });
    await appeler('creerMonProfil', { displayName: nom.trim() });
  } catch (erreur: unknown) {
    if (erreur instanceof ErreurIdentite) throw erreur;
    traduire(erreur);
  }
}

/**
 * Envoie le lien de réinitialisation.
 *
 * ⚠️ NE JAMAIS DISTINGUER un e-mail inconnu d'un e-mail connu. Firebase ne lève pas d'erreur
 * pour une adresse inexistante, et c'est voulu : répondre différemment transformerait cet
 * écran en outil pour savoir qui est inscrit. L'écran affiche donc le même accusé dans les
 * deux cas — c'est ce que `mot-de-passe.tsx` fait déjà avec sa sortie unique.
 */
export async function reinitialiser(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth(), email.trim());
  } catch (erreur: unknown) {
    const code = (erreur as { code?: string })?.code ?? '';
    // Seul un défaut de transport mérite d'être signalé ; le reste se tait, exprès.
    if (code === 'auth/network-request-failed') {
      throw new ErreurIdentite('Pas de connexion.', code);
    }
  }
}

export async function deconnexion(): Promise<void> {
  const a = getAuthNatif();
  if (a !== null) await signOut(a);
}

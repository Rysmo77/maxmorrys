import { useCallback, useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { getWaitlistEntry } from '../lib/firestore';
import { captureError } from '../lib/sentry';
import { useAuth } from '../contexts/AuthContext';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * REJOINDRE LA LISTE D'ATTENTE D'UNE FORMATION À VENIR.
 *
 * ─── LA PROMESSE, ET POURQUOI ELLE EST ÉTROITE ─────────────────────────────────────────
 *
 * Le catalogue affirmait jusqu'ici, noir sur blanc, qu'il n'y aurait jamais de « préviens-moi
 * par e-mail » : « il n'y a pas encore de lettre, et je ne te fais pas remplir un champ qui ne
 * sert à rien ». C'est un engagement, pas une tournure. Ce qui le lève ici, ce n'est pas qu'on
 * ait changé d'avis — c'est que le champ sert désormais à quelque chose de vérifiable :
 *
 *     UNE SEULE ALERTE, LE JOUR DE L'OUVERTURE. PAS DE LETTRE, PAS DE RELANCE.
 *
 * Le serveur tient cette promesse par construction : `notifyWaitlist` est idempotent, et il
 * n'existe aucun autre producteur d'e-mail vers cette liste. Ajouter un second envoi romprait
 * l'engagement, pas seulement une règle de style.
 *
 * ─── LE COMPTE EST REQUIS ──────────────────────────────────────────────────────────────
 *
 * Pas de capture d'adresse anonyme : l'adresse vient du compte. Un clic pour qui est connecté,
 * un passage par l'inscription sinon — ce que l'état vide du catalogue propose déjà.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

const joinWaitlist = httpsCallable<
  { formationId: string; language: 'fr' | 'en' },
  { ok: boolean; deja: boolean; waitlistCount: number; mailEnvoye?: boolean }
>(functions, 'joinWaitlist');

export interface WaitlistState {
  /** `null` tant qu'on ne sait pas : ni « inscrit » ni « pas inscrit » ne doit s'afficher à tort. */
  inscrit: boolean | null;
  envoi: boolean;
  /** Le compteur tel qu'on le connaît, réactualisé après une inscription réussie. */
  compte: number;
  rejoindre: () => Promise<'ok' | 'deja' | 'erreur'>;
}

export function useWaitlist(
  formationId: string | undefined,
  language: 'fr' | 'en',
  compteInitial = 0,
): WaitlistState {
  const { user } = useAuth();
  const [inscrit, setInscrit] = useState<boolean | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [compte, setCompte] = useState(compteInitial);

  useEffect(() => { setCompte(compteInitial); }, [compteInitial]);

  /*
   * UNE SEULE LECTURE, PAR IDENTIFIANT DÉTERMINISTE. La collection n'est pas listable : c'est
   * le `get` d'un document dont on connaît le chemin qui répond « es-tu déjà inscrit ». Un
   * visiteur déconnecté ne lit rien — il n'a pas d'entrée possible.
   */
  useEffect(() => {
    if (!user || !formationId) { setInscrit(user ? null : false); return; }
    let vivant = true;
    getWaitlistEntry(user.uid, formationId)
      .then((e) => { if (vivant) setInscrit(Boolean(e)); })
      .catch(() => {
        // Échec de lecture : on ne sait pas. On laisse `null` — le bouton restera proposé,
        // et le serveur, lui, sait dédupliquer.
        if (vivant) setInscrit(null);
      });
    return () => { vivant = false; };
  }, [user, formationId]);

  const rejoindre = useCallback(async (): Promise<'ok' | 'deja' | 'erreur'> => {
    if (!formationId) return 'erreur';
    setEnvoi(true);
    try {
      const { data } = await joinWaitlist({ formationId, language });
      setInscrit(true);
      setCompte(data.waitlistCount);
      return data.deja ? 'deja' : 'ok';
    } catch (error: unknown) {
      captureError(error, { context: `joinWaitlist(${formationId})` });
      return 'erreur';
    } finally {
      setEnvoi(false);
    }
  }, [formationId, language]);

  return { inscrit, envoi, compte, rejoindre };
}

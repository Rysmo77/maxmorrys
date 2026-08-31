import { doc, getDoc, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getCollection } from './helpers';
import { db, functions } from '../../config/firebase';
import type { Certificate, CertificateLookup, ContactMessage } from '../../types';

export async function getUserCertificates(userId: string): Promise<Certificate[]> {
  return getCollection<Certificate>('certificates', where('userId', '==', userId));
}

const issueCertificateCallable = httpsCallable<
  { formationId: string },
  { certificateId: string; certificateCode?: string }
>(functions, 'issueCertificate');

/**
 * Issue a certificate via the server (re-derives real completion). Certificates
 * can no longer be created directly from the client (Firestore rules deny it).
 * The userId/formationTitle args are kept for call-site compatibility but the
 * server uses the authenticated uid and the formation's own title.
 */
export async function issueCertificate(_userId: string, formationId: string, _formationTitle: string): Promise<string> {
  const res = await issueCertificateCallable({ formationId });
  return res.data.certificateId;
}

/**
 * Résout un certificat depuis son code de vérification, sans compte.
 *
 * ⚠️ Lit `certificate_lookups`, PAS `certificates`. Le document de certificat est identifié
 * par `{uid}_{formationId}` : une recherche par code y imposait une requête de liste, que la
 * règle refuse — y compris au propriétaire, puisqu'elle n'est pas filtrée sur `userId`. La
 * vérification publique était donc cassée pour tout le monde. Le miroir est identifié par le
 * code : c'est un `get` direct, et il ne porte aucun UID.
 */
export async function getCertificateByCode(code: string): Promise<CertificateLookup | null> {
  const snap = await getDoc(doc(db, 'certificate_lookups', code));
  return snap.exists() ? (snap.data() as CertificateLookup) : null;
}

export async function getUserMessages(userId: string): Promise<ContactMessage[]> {
  const data = await getCollection<ContactMessage>('messages', where('userId', '==', userId));
  return data.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

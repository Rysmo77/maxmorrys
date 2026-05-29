import { where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getCollection } from './helpers';
import { functions } from '../../config/firebase';
import type { Certificate, ContactMessage } from '../../types';

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

export async function getUserMessages(userId: string): Promise<ContactMessage[]> {
  const data = await getCollection<ContactMessage>('messages', where('userId', '==', userId));
  return data.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

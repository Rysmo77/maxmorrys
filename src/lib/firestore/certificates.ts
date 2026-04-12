import { where } from 'firebase/firestore';
import { getCollection, getDocById, setDocById } from './helpers';
import type { Certificate, ContactMessage } from '../../types';

export async function getUserCertificates(userId: string): Promise<Certificate[]> {
  return getCollection<Certificate>('certificates', where('userId', '==', userId));
}

export async function issueCertificate(userId: string, formationId: string, formationTitle: string): Promise<string> {
  const certId = `${userId}_${formationId}`;
  const existing = await getDocById<Certificate>('certificates', certId);
  if (existing) return certId;
  const certificateCode = `MM-${crypto.randomUUID().replace(/-/g, '').substring(0, 10).toUpperCase()}`;
  await setDocById('certificates', certId, {
    userId,
    formationId,
    formationTitle,
    issuedAt: new Date().toISOString(),
    certificateCode,
  } as Certificate);
  return certId;
}

export async function getUserMessages(userId: string): Promise<ContactMessage[]> {
  const data = await getCollection<ContactMessage>('messages', where('userId', '==', userId));
  return data.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

import { orderBy, type Unsubscribe } from 'firebase/firestore';
import { subscribeCollection, updateDocById, deleteDocById } from './helpers';
import type { ContactMessage } from '../../types';

export function subscribeMessages(callback: (msgs: ContactMessage[]) => void): Unsubscribe {
  return subscribeCollection<ContactMessage>('messages', [orderBy('sentAt', 'desc')], callback);
}

export async function updateMessageStatus(id: string, status: ContactMessage['status']): Promise<void> {
  return updateDocById('messages', id, { status });
}

export async function deleteMessage(id: string): Promise<void> {
  return deleteDocById('messages', id);
}

import { limit, orderBy, type Unsubscribe } from 'firebase/firestore';
import { subscribeCollection, updateDocById, deleteDocById } from './helpers';
import type { ContactMessage } from '../../types';

/**
 * Écoute des messages de contact les plus récents.
 *
 * Le `limit` n'est pas cosmétique : sans lui, chaque envoi du formulaire public
 * rediffusait la collection entière à tous les onglets admin ouverts, alors que
 * le tableau de bord n'en affiche que les cinq premiers.
 */
export function subscribeMessages(
  callback: (msgs: ContactMessage[]) => void,
  max = 50,
): Unsubscribe {
  return subscribeCollection<ContactMessage>('messages', [orderBy('sentAt', 'desc'), limit(max)], callback);
}

export async function updateMessageStatus(id: string, status: ContactMessage['status']): Promise<void> {
  return updateDocById('messages', id, { status });
}

export async function deleteMessage(id: string): Promise<void> {
  return deleteDocById('messages', id);
}

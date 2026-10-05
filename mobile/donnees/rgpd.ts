import { openBrowserAsync } from 'expo-web-browser';

import { appeler } from './appel';

/**
 * L'export RGPD, appelé depuis DEUX écrans — le profil et la suppression de compte.
 *
 * Il vit ici plutôt que dans l'un des deux parce qu'il n'appartient à aucun : le dupliquer
 * ferait diverger le jour où le lien change de forme, et c'est exactement le genre de
 * divergence qu'on ne voit pas — les deux boutons marchent, l'un ouvre la bonne chose.
 *
 * Le lien renvoyé est SIGNÉ et vaut 24 heures. Il s'ouvre dans la feuille intégrée : le
 * fichier se partage ou s'enregistre ensuite avec les gestes du système, sans que
 * l'application ait à gérer un téléchargement.
 */
export async function exporterMesDonnees(): Promise<void> {
  const { downloadUrl } = await appeler<{ downloadUrl: string }>('exportUserData');
  await openBrowserAsync(downloadUrl);
}

import * as Haptics from 'expo-haptics';

/**
 * LE RETOUR TACTILE — cinq sensations, et chacune répond à une question précise.
 *
 *   selection   « j'ai changé de choix »     pilule, segment, interrupteur
 *   leger       « c'est parti »              envoi d'une question, déclenchement
 *   succes      « c'est fait »               place réservée, copié, leçon terminée
 *   erreur      « ça n'a pas marché »        une fois, avec le message — jamais en boucle
 *   attention   « regarde avant d'agir »     confirmation destructive
 *
 * Le système d'exploitation coupe déjà tout quand la personne a désactivé les vibrations :
 * on ne relit pas ce réglage ici. Un appareil sans moteur rejette la promesse — elle est
 * avalée, parce qu'une vibration manquée ne doit jamais devenir une panne.
 */
const avaler = (p: Promise<unknown>) => { p.catch(() => undefined); };

export const haptique = {
  selection: () => avaler(Haptics.selectionAsync()),
  leger: () => avaler(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  succes: () => avaler(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  erreur: () => avaler(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  attention: () => avaler(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
} as const;

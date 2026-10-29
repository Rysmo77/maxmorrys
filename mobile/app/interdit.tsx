import { router } from 'expo-router';
import {
  Body, Button, Display, Num, Screen, isIOS, useToken, veil, Ligne, Liste, Rubrique,
} from '../ds';
import { RELEVE, SOURCE } from '../contenu/demo';
import { SUPPORT_PORTEE } from '../contenu/portee';

/**
 * ══ 7 · /403 ══ — CE QUE LES RÈGLES DE LA BASE ONT DÉJÀ REFUSÉ.
 *
 * **UN GARDE DE ROUTE EST DU CODE CLIENT : IL CACHE, IL N'INTERDIT PAS.** C'est la phrase
 * entière de l'écran, et elle est vraie des deux côtés — au web comme ici. Quelqu'un qui
 * modifie le paquet, ou qui appelle l'API directement, ne passe pas par ce code. Le vrai
 * cloisonnement est dans les règles Firestore ; cette page dit simplement ce qu'elles ont déjà
 * refusé, en langage humain, à quelqu'un qui n'y peut rien.
 *
 * ── ELLE NE S'EXCUSE PAS, ET ELLE NE CULPABILISE PAS ─────────────────────────────────────
 * « Ton rôle est support. Il atteint exactement cinq écrans, et celui-ci n'en fait pas
 * partie. » Un fait, un nombre, une sortie — et la liste de ce que le rôle ATTEINT, parce que
 * la seule chose utile ici est de repartir au bon endroit.
 *
 * C'est une DESTINATION : on y arrive par le code, jamais par un menu.
 */
export default function Interdit() {
  const t = useToken();

  return (
    <Screen
      /* La console est CLAIRE depuis le kit v4.3 (« console claire ») : surface plate, sans
         maillage, à la teinte d'encre de l'espace `admin`. */
      espace="admin"
      maillage={false}
      retour={isIOS ? 'Console' : undefined}
      onRetour={isIOS ? () => router.replace('/console') : undefined}
      titre={isIOS ? undefined : 'Accès refusé'}
    >
      <Num
        value="403"
        source={SOURCE}
        asOf={RELEVE}
        style={{ fontSize: 86, lineHeight: 90, letterSpacing: -3, marginTop: 14, color: veil(t('ink'), 0.14) }}
      />
      <Display size={26} lines={["Cette page n'est", 'pas pour ce rôle.']} style={{ marginTop: 8 }} />
      <Body muted style={{ marginTop: 12, fontSize: 14.5, lineHeight: 22 }}>
        Ton rôle est <Body style={{ fontWeight: '700', fontSize: 14.5 }}>support</Body>. Il
        atteint exactement{' '}
        <Num value={SUPPORT_PORTEE.length} source={SOURCE} asOf={RELEVE} style={{ fontSize: 14.5 }} />
        {' '}écrans, et celui-ci n'en fait pas partie.
      </Body>

      <Rubrique>Ce que le rôle support atteint</Rubrique>
      <Liste>
        {SUPPORT_PORTEE.map((e) => (
          <Ligne
            key={e.titre}
            icone="check"
            fondIcone={t('mmTeal')}
            titre={e.titre}
            onPress={() => router.replace(e.href)}
          />
        ))}
      </Liste>
      <Button
        tone="quiet"
        label="Revenir à la console"
        style={{ marginTop: 16 }}
        onPress={() => router.replace('/console')}
      />
    </Screen>
  );
}

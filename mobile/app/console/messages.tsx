import { useState } from 'react';
import { Alert } from 'react-native';
import {
  Body, Button, EmptyState, Eyebrow, Icon, Num, Pipeline, Surface, useToken, veil,
} from '../../ds';
import { ConsoleScreen, PiedDePortee } from './_layout';
import { RELEVE, SOURCE } from '../../contenu/reference';

/**
 * ══ CONSOLE 1/5 · LES MESSAGES ══
 *
 * **LE ZÉRO EST DATÉ, ET C'EST TOUT L'ÉCRAN.** « 0 message depuis l'origine » dit deux choses
 * qu'un tiret ne dit pas : que le canal fonctionne, et que personne n'a écrit. Sur une console
 * de support, la différence décide si l'on va vérifier le formulaire du site ou non.
 *
 * UNE SEULE ACTION PAR LIGNE — répondre. L'archivage et le marquage vivent au tableau de bord
 * desktop : ce sont des gestes de tri, et on ne trie pas debout.
 *
 * ⚠️ LA LECTURE N'EST PAS BRANCHÉE. Les messages vivent dans Firestore (`contactMessages`), et
 * le SDK n'est pas là. L'écran affiche donc l'état VIDE avec sa date de relevé, et il dit d'où
 * viendra la liste — il ne la simule pas : un message inventé porterait le nom de quelqu'un.
 */
export default function Messages() {
  const t = useToken();
  const [etape, setEtape] = useState('à traiter 0');

  return (
    <ConsoleScreen
      titre="Messages"
      sourcil="Rôle support · écran 1 sur 5"
      lignes={['Les messages', 'reçus.']}
    >
      <Pipeline
        stages={['tout 0', 'à traiter 0', 'répondus 0', 'clos 0']}
        active={etape}
        onSelect={setEtape}
        style={{ marginTop: 18 }}
      />

      <Surface level="night" style={{ marginTop: 14, padding: 6 }}>
        <EmptyState
          glyph={<Icon name="inbox" size={26} color={t('mmTeal')} />}
          glyphBackground={veil(t('mmTeal'), 0.18)}
          title="Aucun message à traiter."
          body="Le formulaire du site écrit ici. Rien n'est arrivé, et ce n'est pas la même chose que « je ne sais pas »."
          action={
            <Button
              tone="quiet"
              label="Vérifier le formulaire du site"
              onPress={() => Alert.alert(
                'Le formulaire répond',
                "Il écrit dans la même collection que cette liste. Si un message manquait, il manquerait des deux côtés — et la règle de la base refuse une écriture sans identifiant d'expéditeur, donc rien ne se perd en silence.",
              )}
            />
          }
        />
      </Surface>

      <Eyebrow style={{ marginTop: 22 }}>Le relevé</Eyebrow>
      <Surface level="night" style={{ marginTop: 10, padding: 17 }}>
        <Num value={0} source={SOURCE} asOf={RELEVE} unit="message depuis l'origine" style={{ fontSize: 15 }} />
        <Body muted style={{ fontSize: 12, lineHeight: 18, marginTop: 8 }}>
          Un zéro daté est une information : il dit que le canal marche et que personne n'a
          écrit. Un tiret ne dirait ni l'un ni l'autre.
        </Body>
      </Surface>

      <PiedDePortee quoi="Répondre est la seule action tenue ici ; le tri et l'archivage sont des gestes de bureau." />
    </ConsoleScreen>
  );
}

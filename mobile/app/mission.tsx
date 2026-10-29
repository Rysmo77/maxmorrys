import { useLocalSearchParams } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { Button, CheckLine, Display, Eyebrow, Rubrique, SansDonnees, Screen, Surface, nonBranche } from '../ds';
import { texte } from './club/_layout';
import { Verite } from '../ecrans/Verite';
import { SITE_EDU } from '../contenu/termes';

/** Aucune source serveur pour ces blocs : la phase est dite, pas supposée. */
const NON_BRANCHE = nonBranche();

/**
 * ══ 18 · MISSION ══ (maquette Rysmo-iOS-18 ; PRD rév. 6, C-08).
 *
 * La maquette montre la mission rendue, sa grille, les retours de deux pairs et la mission à
 * relire en retour. Aucun appel ne rend une mission depuis l'application, et les retours portent
 * le nom de quelqu'un : rien n'est affiché à leur place. La règle des relectures est un
 * engagement écrit de la cohorte, elle s'affiche.
 */
export default function Mission() {
  const p = useLocalSearchParams<{ titre?: string; module?: string; slug?: string }>();
  const slug = texte(p.slug);
  return (
    <Screen territory="forme" retour="Leçon" titre={texte(p.titre) ?? 'Mission'}>
      <Eyebrow style={{ marginTop: 6 }}>{texte(p.module) ?? 'Mission'}</Eyebrow>
      <Display size={24} maxLignes={3} style={{ marginTop: 8 }}>{texte(p.titre) ?? 'Ta mission'}</Display>

      <Rubrique>Ma mission</Rubrique>
      <SansDonnees
        etat={NON_BRANCHE}
        quoi="ta mission rendue"
        origine="du serveur"
      />

      <Rubrique>Retours</Rubrique>
      <SansDonnees
        etat={NON_BRANCHE}
        quoi="les retours de ta cohorte"
        origine="du serveur"
      />

      <Surface level="flat" style={{ marginTop: 16, padding: 18 }}>
        <Eyebrow>Comment se relit une mission</Eyebrow>
        <CheckLine tone="ok">Deux relectures par mission, par des membres de ta cohorte.</CheckLine>
        <CheckLine tone="ok">Un retour = ce qui marche + une chose à changer.</CheckLine>
      </Surface>

      <Verite titre="Où la rendre aujourd'hui">
        Les missions se rendent sur le lecteur du site, qui les compte. Elles arriveront ici quand
        le serveur les servira à l'application.
      </Verite>
      <Button
        tone="forme"
        label="Rendre la mission sur le site"
        trailing="external"
        style={{ marginTop: 18 }}
        onPress={() => { void openBrowserAsync(slug ? `${SITE_EDU}/cours/${slug}` : `${SITE_EDU}/mes-formations`); }}
      />
    </Screen>
  );
}

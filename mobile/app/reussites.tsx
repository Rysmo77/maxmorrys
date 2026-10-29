import { View } from 'react-native';
import { router } from 'expo-router';
import {
  Body, Display, Eyebrow, Ligne, Liste, Num, Rubrique, SansDonnees, Screen, Surface, isIOS, nonBranche
} from '../ds';
import { provenance, useCertificats, useMoi } from '../donnees';
import { BandeApprendre } from '../ecrans/BandeApprendre';
import { Verite } from '../ecrans/Verite';

/** Aucune source serveur pour ces blocs : la phase est dite, pas supposée. */
const NON_BRANCHE = nonBranche();

/**
 * ══ 22 · SUCCÈS ══ — « ta régularité, pas une comparaison » (maquette Rysmo-iOS-22).
 *
 * La maquette pose deux tuiles (niveau, série), une grille de huit badges et des quêtes du
 * jour. Le serveur n'en transmet qu'UNE vérité : l'XP (`appMoi`). Elle s'affiche, datée. Le
 * niveau, la série, les badges et les quêtes n'ont pas de source dans l'application : leurs
 * emplacements restent, et disent qu'ils ne sont pas servis — un badge inventé se vérifie au
 * premier regard sur le site, et la série est le chiffre qu'on vient protéger.
 */
export default function Succes() {
  const moi = useMoi();
  const certificats = useCertificats();
  const emis = certificats.valeur?.certificats.length ?? null;

  return (
    <Screen territory="forme" retour="Apprendre" titre={isIOS ? undefined : 'Succès'}>
      <Eyebrow style={{ marginTop: 6 }}>Ta régularité, pas une comparaison</Eyebrow>
      <Display size={32} lines={['Succès']} style={{ marginTop: 6 }} />
      <BandeApprendre />

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <Surface level="flat" style={{ flex: 1, padding: 16 }}>
          <Eyebrow>Expérience</Eyebrow>
          <Num value={moi.valeur?.xp ?? null} {...provenance(moi)} unit="XP" style={{ fontSize: 30, marginTop: 6 }} />
          <Body muted style={{ fontSize: 12, marginTop: 4 }}>gagnée en terminant des leçons</Body>
        </Surface>
        <Surface level="flat" style={{ flex: 1, padding: 16 }}>
          <Eyebrow>Série</Eyebrow>
          <Num value={null} {...provenance(moi)} fallback="pas encore servie" style={{ fontSize: 13, marginTop: 10 }} />
          <Body muted style={{ fontSize: 12, marginTop: 6, lineHeight: 17 }}>
            Une pause par semaine ne casse pas la série.
          </Body>
        </Surface>
      </View>

      <Rubrique>Badges</Rubrique>
      <SansDonnees
        etat={NON_BRANCHE}
        quoi="tes badges"
        origine="du serveur"
        degat="Un badge affiché est une étape qu'on croit franchie. Ils apparaîtront ici quand le serveur les comptera pour l'application, comme il le fait pour le site."
      />

      <Rubrique>Quêtes du jour</Rubrique>
      <SansDonnees
        etat={NON_BRANCHE}
        quoi="les quêtes du jour"
        origine="du serveur"
        degat="Une quête qu'on « récupère » sans que le serveur la compte donnerait de l'XP qui disparaîtrait au rafraîchissement."
      />

      <Rubrique>Ce qui est déjà vérifiable</Rubrique>
      <Liste>
        <Ligne
          icone="award"
          titre="Mes certificats"
          sous={emis === null ? 'vérifiables par leur code' : emis === 0 ? 'aucun émis pour l’instant' : `${emis} émis · vérifiables par leur code`}
          onPress={() => router.push('/certificats')}
        />
      </Liste>

      <Verite titre="Pas de classement">
        On suit ta régularité, jamais ta place face aux autres. Le classement est sorti de
        l'application.
      </Verite>
    </Screen>
  );
}

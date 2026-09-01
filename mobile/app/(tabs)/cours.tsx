import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Body, Display, Eyebrow, Icon, Mesh, Surface, useToken } from '../../ds';

/**
 * MES COURS — la liste, d'où part le lecteur.
 *
 * AUCUNE PROGRESSION FABRIQUÉE. La maquette du kit anime sa barre de 8 % à 38 % quelle que
 * soit la valeur réelle : c'est un chiffre qui bouge pour faire joli, sur l'écran même où la
 * personne vient vérifier où elle en est. Tant que ce port n'a pas de couche de données, cet
 * écran n'affiche AUCUN pourcentage — pas un zéro, pas une estimation. Il dit ce qu'il sait.
 */
export default function Cours() {
  const t = useToken();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="forme" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 28, paddingHorizontal: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Eyebrow>Ce que tu as acheté</Eyebrow>
        <Display lines={['Tes cours,', 'à vie.']} style={{ marginTop: 6 }} />
        <Body muted style={{ marginTop: 12 }}>
          Une formation payée reste ouverte, sans abonnement et sans date de fin. Elle se
          télécharge leçon par leçon, avec le poids de chacune affiché avant.
        </Body>

        <Surface level="flat" style={{ marginTop: 20, padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="book" size={20} color={t('ink2')} />
            <Body style={{ flex: 1, fontWeight: '700' }}>Rien n'est encore branché ici</Body>
          </View>
          <Body muted style={{ marginTop: 8 }}>
            Ce port natif rend la mise en page, pas encore les données : la liste de tes
            inscriptions viendra du même compte que sur le site. Elle n'est pas simulée en
            attendant — un cours inventé dans cette liste serait un cours que tu croirais
            avoir.
          </Body>
        </Surface>

        {/* La sortie de l'état vide. Un écran vide est une invitation à agir : sans ce lien,
            quelqu'un sans inscription n'a nulle part où aller depuis cet onglet. */}
        <Link href="/catalogue" asChild>
          <Surface level="flat" style={{ marginTop: 14, padding: 20 }}>
            <Eyebrow>Le catalogue</Eyebrow>
            <Body style={{ marginTop: 6, fontWeight: '700' }}>Voir les formations</Body>
          </Surface>
        </Link>

        <Link href="/lecon" asChild>
          <Surface level="hero" style={{ marginTop: 14, padding: 20 }}>
            <Eyebrow>Aperçu</Eyebrow>
            <Body style={{ marginTop: 6, fontWeight: '700' }}>Ouvrir le lecteur</Body>
            <Body muted style={{ marginTop: 4 }}>
              Pour voir le geste qui compte : garder une leçon hors connexion, et son poids.
            </Body>
          </Surface>
        </Link>
      </ScrollView>
    </View>
  );
}

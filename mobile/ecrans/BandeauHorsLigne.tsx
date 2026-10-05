import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Body, Icon, Surface, useToken } from '../ds';
import { useHorsLigne } from '../donnees/hors-ligne';
import { useReseau } from '../donnees/veille-reseau';

/**
 * LE BANDEAU DE COUPURE — « le système annonce la coupure AVANT qu'une requête soit tentée ».
 *
 * Il apparaît dans deux cas, et seulement deux : le téléphone dit qu'il n'a pas de réseau, ou
 * des gestes attendent dans la file. Dans les deux, il mène à `/hors-connexion`, qui liste ce
 * qui reste lisible et ce qui attend de partir. Il ne bloque rien : c'est une information.
 */
export function BandeauHorsLigne({ style }: { style?: object }) {
  const t = useToken();
  const reseau = useReseau();
  const { file } = useHorsLigne();
  if (reseau !== 'absent' && file.length === 0) return null;

  const texte = reseau === 'absent'
    ? file.length > 0
      ? `Pas de réseau · ${file.length} ${file.length > 1 ? 'gestes attendent' : 'geste attend'} de partir`
      : 'Pas de réseau · voir ce qui reste lisible'
    : `${file.length} ${file.length > 1 ? 'gestes attendent' : 'geste attend'} de partir`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={texte}
      onPress={() => router.push('/hors-connexion')}
      style={style}
    >
      <Surface level="flat" style={{ marginTop: 10, paddingVertical: 11, paddingHorizontal: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icon name={reseau === 'absent' ? 'x-circle' : 'upload'} size={16} color={t('mmOrangeT')} strokeWidth={2.2} />
          <Body style={{ flex: 1, fontSize: 13, fontWeight: '600' }}>{texte}</Body>
          <Icon name="forward" size={15} color={t('ink3')} strokeWidth={2.4} />
        </View>
      </Surface>
    </Pressable>
  );
}

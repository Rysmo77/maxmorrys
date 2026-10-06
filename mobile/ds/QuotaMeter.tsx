import { useEffect, useRef, useState } from 'react';
import { POLICE } from './police';
import { Animated, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { COURBE, DUREE, duree, useMouvement } from './mouvement';
import { useToken } from './theme';

/**
 * LE QUOTA DU RÉPÉTITEUR — des segments, pas un pourcentage.
 *
 * Cinq traits qu'on compte d'un coup d'œil disent « il t'en reste deux » ; « 60 % » demande
 * une division. Sur un réglage qui se consomme question par question, c'est la différence
 * entre savoir et calculer.
 *
 * AU-DELÀ DE DIX, UNE BARRE. Cent segments de 15 px sortaient de l'écran : à ce plafond, on
 * ne compte plus, on estime — et une barre continue le dit mieux. Elle avance en
 * `translateX` dans un rail qui la masque, sans déformer ses arrondis.
 *
 * ── LE SEGMENT SE RÉSERVE À L'ENVOI, S'ALLUME À LA RÉPONSE ───────────────────────────
 * C'est le geste qui consomme le quota : l'attribuer à la réponse laisserait croire qu'une
 * question sans réponse est gratuite. Mais l'allumer plein à l'envoi affirmerait un compte
 * que le serveur n'a pas encore confirmé. `reserve` le pose à mi-opacité, 220 ms ; la réponse
 * l'allume ; un échec le rend.
 */
export function QuotaMeter({
  used, total, label, reserve, style,
}: {
  used: number;
  total: number;
  label?: string;
  /** Une question est partie, le serveur n'a pas encore compté. */
  reserve?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();
  const n = Math.max(0, Math.min(total, used));
  const continu = total > 10;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: total, now: n }}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 9 }, style]}
    >
      {continu ? (
        <Rail ratio={total === 0 ? 0 : (n + (reserve ? 0.5 : 0)) / total} />
      ) : (
        <View style={{ flexDirection: 'row', gap: 3 }}>
          {Array.from({ length: total }).map((_, i) => (
            <Segment key={i} etat={i < n ? 'plein' : i === n && reserve ? 'reserve' : 'vide'} />
          ))}
        </View>
      )}
      <Text style={{ flexShrink: 1, fontFamily: POLICE.mono, fontSize: 11.5, color: t('textMuted') }}>
        {label ?? `${n} / ${total}`}
      </Text>
    </View>
  );
}

function Segment({ etat }: { etat: 'plein' | 'reserve' | 'vide' }) {
  const t = useToken();
  const { reduit } = useMouvement();
  const cible = etat === 'plein' ? 1 : etat === 'reserve' ? 0.5 : 0;
  const o = useRef(new Animated.Value(cible)).current;
  useEffect(() => {
    Animated.timing(o, { toValue: cible, duration: duree(DUREE.ui, reduit), easing: COURBE.standard, useNativeDriver: true }).start();
  }, [cible, reduit, o]);
  return (
    <View style={{ width: 15, height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: t('fill3') }}>
      <Animated.View style={{ flex: 1, backgroundColor: t('mmViolet'), opacity: o }} />
    </View>
  );
}

function Rail({ ratio }: { ratio: number }) {
  const t = useToken();
  const { reduit } = useMouvement();
  const [largeur, setLargeur] = useState(0);
  const r = useRef(new Animated.Value(ratio)).current;
  useEffect(() => {
    Animated.timing(r, { toValue: Math.min(1, ratio), duration: duree(DUREE.ui, reduit), easing: COURBE.standard, useNativeDriver: true }).start();
  }, [ratio, reduit, r]);
  return (
    <View
      onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}
      style={{ width: 96, height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: t('fill3') }}
    >
      <Animated.View style={{
        position: 'absolute', top: 0, bottom: 0, left: 0, width: largeur, borderRadius: 3,
        backgroundColor: t('mmViolet'),
        transform: [{ translateX: r.interpolate({ inputRange: [0, 1], outputRange: [-largeur, 0] }) }],
      }} />
    </View>
  );
}

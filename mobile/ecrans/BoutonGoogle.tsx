import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { apresConnexion } from '../donnees/accueil';
import { Body, Button, GoogleMark, useToken } from '../ds';
import { ErreurIdentite, avecGoogle, connexionGoogle } from '../donnees/identite';

/**
 * « CONTINUER AVEC GOOGLE » — le même compte que sur le site (même uid, mêmes cours).
 *
 * Rien n'est rendu hors d'Android : sur iOS, Google ne peut partir qu'avec « Se connecter avec
 * Apple » (App Store 4.8). La marque Google garde ses couleurs imposées (`ds/BrandMarks.tsx`).
 * Fermer la fenêtre de Google n'est pas un échec : aucun message.
 */
export function BoutonGoogle({ style }: { style?: object }) {
  const t = useToken();
  const [enCours, setEnCours] = useState(false);
  const [echec, setEchec] = useState<string | null>(null);
  if (!avecGoogle) return null;

  async function continuer() {
    if (enCours) return;
    setEnCours(true);
    setEchec(null);
    try {
      if (await connexionGoogle()) router.replace(await apresConnexion());
    } catch (e: unknown) {
      setEchec(e instanceof ErreurIdentite ? e.motif : 'La connexion avec Google a échoué.');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <View style={style}>
      <Button
        tone="ghost"
        label={enCours ? 'Connexion…' : 'Continuer avec Google'}
        leading={<GoogleMark size={18} />}
        disabled={enCours}
        onPress={() => { void continuer(); }}
      />
      {echec ? <Body style={{ marginTop: 8, fontSize: 12.5, lineHeight: 18, color: t('stop') }}>{echec}</Body> : null}
    </View>
  );
}

import { router } from 'expo-router';
import {
  Body, Button, Display, Eyebrow, Gradient, Icon, isIOS, LessonRow, Screen, Surface,
  useToken, veil,
} from '../ds';

/**
 * ══ 3 · PERMISSIONS ══ — L'ÉCRAN LE PLUS IMPORTANT DU LOT NATIF.
 *
 * LA PLATEFORME WEB N'A AUCUN CANAL D'ENVOI. Toute la conception s'est pliée à ça : la carte
 * de reprise est le premier objet de l'espace PARCE QUE la relance ne pouvait venir que de
 * l'écran lui-même, une fois l'application ouverte. La notification poussée donne enfin ce
 * canal — c'est le premier vrai gain du virage natif, et il le justifie à lui seul.
 *
 * ON EXPLIQUE AVANT D'OUVRIR LE DIALOGUE SYSTÈME, et ce n'est pas de la politesse : iOS ne
 * laisse poser la question qu'UNE fois. Un refus est définitif et ne se rattrape que dans les
 * Réglages, là où personne ne va. Android laisse redemander une fois, puis ferme aussi. Une
 * demande posée sans contexte se refuse par réflexe, et ce réflexe est irréversible.
 *
 * LA LISTE DES TROIS ENVOIS EST UN CONTRAT. Elle est suivie de ce que je n'enverrai JAMAIS —
 * et c'est cette seconde liste qui rend la première crédible.
 */
const ENVOIS = [
  { titre: 'Reprise de cours', meta: 'après 5 jours sans activité', glyphe: 'book' as const, teinte: 'mmVioletT' as const, voile: 'mmViolet' as const },
  { titre: 'Ta série va se casser', meta: 'le soir du 5e jour, une fois', glyphe: 'star' as const, teinte: 'mmOrangeT' as const, voile: 'mmOrange' as const },
  { titre: 'Session du Club dans 1 h', meta: 'seulement si tu es inscrite', glyphe: 'users' as const, teinte: 'mmTealT' as const, voile: 'mmTeal' as const },
];

export default function Permissions() {
  const t = useToken();

  /*
   * ⚠️ LE DIALOGUE SYSTÈME N'EST PAS ENCORE OUVERT ICI. Il demande `expo-notifications`, une
   * dépendance de plus, et surtout un serveur qui envoie — sans lui, demander la permission
   * reviendrait à prendre l'unique cartouche d'iOS pour un canal qui n'existe pas encore.
   * L'écran fait donc ce qu'il peut faire honnêtement : il explique, il enregistre le
   * consentement, et il laisse la demande système au jour où l'envoi existe.
   */
  function accepter() {
    router.replace('/biometrie');
  }

  return (
    <Screen territory="transforme" center>
      <Gradient
        colors={[t('mmVioletN'), t('mmViolet')]}
        radius={21}
        style={{
          width: 66, height: 66, alignItems: 'center', justifyContent: 'center',
          shadowColor: t('mmViolet'), shadowOpacity: 0.34, shadowRadius: 15,
          shadowOffset: { width: 0, height: 12 }, elevation: 8,
        }}
      >
        <Icon name="bell" size={28} color={t('paperFixed')} strokeWidth={2.2} />
      </Gradient>

      <Display size={29} lines={['JE PEUX TE', 'PRÉVENIR QUAND', 'TU DÉCROCHES ?']} style={{ marginTop: 22 }} />
      <Body muted style={{ marginTop: 12, fontSize: 14.5, lineHeight: 22 }}>
        Tu t'arrêtes rarement parce que tu abandonnes. Tu t'arrêtes parce qu'une semaine passe.
        Une notification à ce moment-là, c'est la seule chose qui marche.
      </Body>

      <Surface level="flat" style={{ marginTop: 20, paddingHorizontal: 16 }}>
        {ENVOIS.map((e, i) => (
          <LessonRow
            key={e.titre}
            icon={<Icon name={e.glyphe} size={14} color={t(e.teinte)} />}
            iconBackground={veil(t(e.voile), 0.14)}
            title={e.titre}
            meta={e.meta}
            last={i === ENVOIS.length - 1}
          />
        ))}
      </Surface>

      <Surface level="truth" style={{ marginTop: 14, padding: 15 }}>
        <Eyebrow>Ce que je ne t'enverrai jamais</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Aucune promotion, aucun rappel de panier, aucun « on ne te voit plus ». Trois types,
          ceux du dessus, et tu peux couper chacun séparément dans ton profil.
        </Body>
      </Surface>

      <Button tone="transforme" label="D'accord, demande-moi" style={{ marginTop: 18 }} onPress={accepter} />
      <Button tone="quiet" label="Pas maintenant" style={{ marginTop: 9 }} onPress={() => router.replace('/(tabs)')} />

      <Body muted style={{ fontSize: 11.5, textAlign: 'center', lineHeight: 18, marginTop: 12, color: t('textFaint') }}>
        {isIOS
          ? 'iOS ne me laisse poser la question qu’une seule fois. « Pas maintenant » la garde pour plus tard ; un refus système, lui, ne se rattrape que dans les Réglages.'
          : 'Android me laisse redemander une fois. Au second refus, ça ne se rattrape que dans les paramètres du téléphone.'}
      </Body>
    </Screen>
  );
}

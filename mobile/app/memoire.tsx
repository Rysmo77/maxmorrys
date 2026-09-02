import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import {
  Body, Button, Display, Eyebrow, Field, Icon, IconButton, LessonRow, Screen, Surface,
  TUTOR_DEFAUT, isIOS, setTutorNom, useToken, useTutorNom, veil,
} from '../ds';
import { MEMOIRE } from '../contenu/reference';
import { router } from 'expo-router';

/**
 * ══ 2 · LA MÉMOIRE DE PROFIL ══ — PORTÉE SANS UNE LIGNE DE DIFFÉRENCE.
 *
 * C'est déjà l'écran où se règle la RELATION, et le natif n'y change rien : ni le contenu, ni
 * l'ordre, ni la voix. Il est ici parce que la conversation seule ne suffit pas — quelqu'un
 * doit pouvoir voir ce que le tuteur a retenu, et le retirer.
 *
 * ── LE RENOMMAGE RESTE EN TÊTE ────────────────────────────────────────────────────────────
 * Avant la liste, avant l'effacement. Donner un nom est le premier geste qui transforme un
 * automate en interlocuteur, et c'est ce que la barre d'onglets affichera ensuite.
 *
 * ⚠️ LE NOM NE SE PERSISTE PAS LOCALEMENT, ET IL NE DOIT PAS. Il vit dans le profil
 * (`users/<uid>.tutorName`), comme au web : un magasin local créerait une seconde source de
 * vérité à réconcilier, et deux appareils afficheraient deux noms. `setTutorNom()` est un
 * cache de session, à alimenter depuis le profil au démarrage.
 *
 * ── ET L'EFFACEMENT NE PREND PAS LE NOM AVEC LUI ──────────────────────────────────────────
 * Effacer la mémoire, c'est retirer des FAITS ; le nom est un RÉGLAGE. Les confondre ferait
 * perdre le nom à quelqu'un qui voulait seulement corriger ce que son tuteur croyait savoir.
 */
const PROPOSITIONS = ['Répétiteur', 'Prof', 'Coach', 'Tonton'] as const;

export default function Memoire() {
  const t = useToken();
  const tuteur = useTutorNom();
  const [brouillon, setBrouillon] = useState(tuteur);

  function renommer(nom: string) {
    setBrouillon(nom);
    setTutorNom(nom);
  }

  function toutEffacer() {
    Alert.alert(
      'Effacer toute la mémoire ?',
      "Immédiat, et sans passer par le support. Elle se reconstitue à partir des seuls échanges suivants. Le nom que tu lui as donné ne s'efface pas avec.",
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Tout effacer', style: 'destructive' },
      ],
    );
  }

  return (
    <Screen
      territory="transforme"
      retour={tuteur}
      titre={isIOS ? undefined : 'Mémoire de profil'}
      droite={
        <IconButton label="Fermer" onPress={() => router.back()}>
          <Icon name="close" size={17} color={t('textBody')} strokeWidth={2.4} />
        </IconButton>
      }
    >
      <Eyebrow style={{ marginTop: 6 }}>Ton répétiteur</Eyebrow>
      <Display size={29} lines={['DONNE-LUI', 'UN NOM.']} style={{ marginTop: 8 }} />

      <Surface level="hero" style={{ marginTop: 18, padding: 19 }}>
        <Field
          label="Comment tu l'appelles"
          value={brouillon}
          onChangeText={renommer}
          autoCapitalize="words"
          hint={`Par défaut, il s'appelle ${TUTOR_DEFAUT}.`}
          style={{ marginTop: 0 }}
        />
        <View style={{ flexDirection: 'row', gap: 7, marginTop: 13, flexWrap: 'wrap' }}>
          {PROPOSITIONS.map((p) => {
            const on = p === brouillon;
            return (
              <Pressable
                key={p}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => renommer(p)}
                style={{
                  height: 40, paddingHorizontal: 15, justifyContent: 'center',
                  borderRadius: 999, borderWidth: 1,
                  backgroundColor: on ? t('ink') : t('ctlOffBg'),
                  borderColor: on ? t('ink') : t('ctlOffBrd'),
                }}
              >
                <Body style={{
                  fontSize: 13, fontWeight: on ? '600' : '500',
                  color: on ? t('textOnPrimary') : t('textMuted'),
                }}>
                  {p}
                </Body>
              </Pressable>
            );
          })}
        </View>
        <Body muted style={{ fontSize: 11.5, lineHeight: 18, marginTop: 12, color: t('textFaint') }}>
          Le nom ne change que pour toi. <Body style={{ fontWeight: '700', fontSize: 11.5 }}>Rysmo</Body> reste
          le nom de l'application.
        </Body>
      </Surface>

      <Eyebrow style={{ marginTop: 24 }}>Ce qu'il a retenu</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 16 }}>
        {MEMOIRE.map((m, i) => (
          <LessonRow
            key={m.fait}
            icon={<Icon name="chat" size={14} color={t('mmVioletT')} />}
            iconBackground={veil(t('mmViolet'), 0.12)}
            title={m.fait}
            meta={m.depuis}
            last={i === MEMOIRE.length - 1}
            trailing={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Oublier : ${m.fait}`}
                hitSlop={4}
                style={{
                  width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: veil(t('stop'), 0.1),
                }}
              >
                <Icon name="trash" size={14} color={t('stop')} strokeWidth={2.2} />
              </Pressable>
            }
          />
        ))}
      </Surface>

      <Button
        tone="quiet"
        label="Tout effacer"
        style={{ marginTop: 14 }}
        onPress={toutEffacer}
      />

      <Surface level="truth" style={{ marginTop: 14, padding: 15 }}>
        <Eyebrow>Ce que l'effacement fait</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Immédiat, et il ne passe pas par le support. La mémoire se reconstitue à partir des
          seuls échanges suivants.{' '}
          <Body style={{ fontWeight: '700', fontSize: 12.5 }}>
            Le nom que tu lui as donné ne s'efface pas avec.
          </Body>
        </Body>
      </Surface>
    </Screen>
  );
}

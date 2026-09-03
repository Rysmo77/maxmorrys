import { useEffect, useState } from 'react';
import {
  Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Body, Button, ChatBubble, Eyebrow, Gradient, Icon, IconButton, Mesh, NavBar, QuotaMeter,
  SansDonnees, Surface, isIOS, px, useActionGradient, useToken, useTutorNom,
} from '../../ds';
import { ECHANGE, QUOTA, RENVOI_COURS } from '../../contenu/demo';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ 1 · LE RÉPÉTITEUR ══ — ET LE QUOTA QUE LE CLAVIER NE DOIT PAS CACHER.
 *
 * C'EST LA PLUS GROSSE DIFFÉRENCE DE TOUT LE PORTAGE, et elle n'existe pas en web mobile où le
 * navigateur s'en occupe. **Un clavier natif mange 270 à 290 px.** Le champ de saisie doit
 * monter avec lui — c'est ce que fait `KeyboardAvoidingView` — mais surtout :
 *
 *   **LA BARRE DE QUOTA DOIT RESTER VISIBLE.** Elle est ÉPINGLÉE sous la barre haute, hors du
 *   conteneur défilant, précisément pour ça. Un refus au-delà du plafond est vécu comme une
 *   panne s'il n'a pas été annoncé — et un quota caché par le clavier n'a pas été annoncé. On
 *   tape sa question sans voir qu'il n'en reste qu'une.
 *
 * ── LE COMPORTEMENT DU CLAVIER DIFFÈRE, ET C'EST NORMAL ──────────────────────────────────
 * iOS ne redimensionne pas la fenêtre : il faut décaler la vue soi-même (`padding`). Android
 * la redimensionne déjà (`adjustResize`), et rejouer le décalage par-dessus doublerait la
 * course — le champ monterait deux fois trop haut. D'où deux comportements, une seule
 * disposition.
 *
 * ── LE NOM N'EST PAS « RYSMO » ────────────────────────────────────────────────────────────
 * « Rysmo » nomme CETTE APPLICATION ; le tuteur qu'elle contient s'appelle « Répétiteur » par
 * défaut, et chaque personne peut le renommer. La barre haute lit donc `useTutorNom()`.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export default function Repetiteur() {
  const t = useToken();
  const g = useActionGradient();
  const insets = useSafeAreaInsets();
  const tuteur = useTutorNom();
  const [question, setQuestion] = useState('');

  /*
   * LA BARRE D'ONGLETS PASSE SOUS LE CLAVIER, DONC SA PLACE DOIT DISPARAÎTRE AVEC ELLE.
   *
   * La saisie est posée au-dessus de la barre — une marge de `--tabbar-h` plus la zone de
   * geste. Clavier ouvert, cette barre est recouverte : garder sa marge laisserait 104 px de
   * vide entre le champ et le clavier, c'est-à-dire exactement la hauteur qu'on venait de
   * libérer. On écoute donc le clavier, et la marge tombe à zéro tant qu'il est là.
   *
   * `keyboardWillShow` sur iOS (l'événement part AVANT l'animation, donc le champ monte avec
   * elle) et `keyboardDidShow` sur Android, qui n'émet pas le premier.
   */
  const [clavier, setClavier] = useState(false);
  useEffect(() => {
    const ouvre = Keyboard.addListener(isIOS ? 'keyboardWillShow' : 'keyboardDidShow', () => setClavier(true));
    const ferme = Keyboard.addListener(isIOS ? 'keyboardWillHide' : 'keyboardDidHide', () => setClavier(false));
    return () => { ouvre.remove(); ferme.remove(); };
  }, []);

  /* Sans relevé, on ne connaît pas le plafond — et on ne bloque donc pas la saisie sur un
     chiffre qu'on ignore. Le champ reste ouvert ; c'est le serveur qui refusera, avec sa
     raison. Bloquer sur une supposition ferait passer une limite inventée pour une règle. */
  const reste = QUOTA === null ? null : QUOTA.total - QUOTA.utilise;
  const bloque = reste !== null && reste <= 0;

  return (
    <View style={{ flex: 1, backgroundColor: t('surfacePage') }}>
      <Mesh territory="transforme" />

      <KeyboardAvoidingView
        style={{ flex: 1, paddingTop: insets.top }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        /* La barre d'onglets reste sous le clavier : son décalage ne doit pas être compté. */
        keyboardVerticalOffset={0}
      >
        <NavBar
          retour="Espace"
          onRetour={() => router.push('/(tabs)')}
          titre={tuteur}
          droite={
            <IconButton label="Mémoire de profil" onPress={() => router.push('/memoire')}>
              <Icon name="dots" size={17} color={t('textBody')} strokeWidth={2} />
            </IconButton>
          }
        />

        {/* ── ÉPINGLÉ. Hors du défilement, hors de portée du clavier. ──────────────────── */}
        <View style={{ paddingHorizontal: 18, paddingBottom: 10 }}>
          {QUOTA ? (
            <QuotaMeter
              used={QUOTA.utilise}
              total={QUOTA.total}
              label={`${QUOTA.utilise} / ${QUOTA.total} questions aujourd'hui`}
            />
          ) : (
            <Body muted style={{ fontFamily: 'JetBrainsMono', fontSize: 11.5 }}>
              plafond du jour non relevé
            </Body>
          )}
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 4, paddingBottom: 16, gap: 11 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {ECHANGE.length === 0 ? (
            <SansDonnees
              quoi="cet échange"
              origine="de ton compte"
              degat="Une réponse inventée ici serait attribuée à ton répétiteur, et elle porterait sur un cours que tu n'as peut-être pas. C'est le seul écran où une phrase fabriquée se lit comme un conseil."
            />
          ) : ECHANGE.map((m, i) => (
            <ChatBubble key={i} from={m.de === 'me' ? 'me' : 'ai'}>{m.texte}</ChatBubble>
          ))}

          {/* Le renvoi vers le cours : la réponse cite SA source, et elle est atteignable. */}
          {RENVOI_COURS ? (
            <Surface level="flat" style={{ padding: 14, maxWidth: '86%' }}>
              <Eyebrow style={{ fontSize: 9.5 }}>{RENVOI_COURS.eyebrow}</Eyebrow>
              <Body style={{ fontSize: 13, fontWeight: '600', marginTop: 6 }}>{RENVOI_COURS.titre}</Body>
              <Button
                tone="quiet"
                size="sm"
                label="Ouvrir la leçon"
                style={{ marginTop: 10 }}
                onPress={() => router.push('/lecon')}
              />
            </Surface>
          ) : null}
        </ScrollView>

        {/* ── LA SAISIE. Elle monte avec le clavier ; la barre d'onglets reste dessous. ── */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          paddingHorizontal: 14, paddingVertical: 10,
          marginBottom: clavier ? 0 : px(t('tabbarH')) + insets.bottom,
          backgroundColor: t('tabbarBg'),
          borderTopWidth: 1, borderTopColor: t('tabbarBrd'),
        }}>
          <View style={{
            flex: 1, minHeight: 46, justifyContent: 'center', paddingHorizontal: 16,
            borderRadius: 999, backgroundColor: t('fieldBg'),
            borderWidth: 1.5, borderColor: t('borderField'),
          }}>
            <TextInput
              accessibilityLabel={`Ta question à ${tuteur}`}
              value={question}
              onChangeText={setQuestion}
              placeholder={bloque ? "Plus de question aujourd'hui" : 'Pose ta question'}
              placeholderTextColor={t('textFaint')}
              editable={!bloque}
              multiline
              style={{
                fontFamily: 'SchibstedGrotesk', fontSize: 15, color: t('textBody'),
                paddingVertical: 12, maxHeight: 110,
              }}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Envoyer ta question"
            accessibilityState={{ disabled: bloque || question.trim() === '' }}
            disabled={bloque || question.trim() === ''}
            style={({ pressed }: { pressed: boolean }) => ({
              opacity: bloque || question.trim() === '' ? 0.4 : 1,
              transform: [{ scale: pressed ? 0.94 : 1 }],
            })}
          >
            <Gradient
              colors={g.transforme}
              radius={23}
              style={{ width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="send" size={18} color={t('paperFixed')} strokeWidth={2.6} />
            </Gradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

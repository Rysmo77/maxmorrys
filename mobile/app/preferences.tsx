import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Avatar, Body, Button, Display, Eyebrow, Field, Icon, LessonRow, Mesh, Surface, Switch,
  TUTOR_DEFAUT, setTutorNom, tutorNom, useScheme, useToken,
} from '../ds';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LES PRÉFÉRENCES — ET LA LIGNE GRISÉE QUI TIENT TOUT L'ÉCRAN DEBOUT.
 *
 * La section « Ce que je t'envoie » porte quatre lignes. Les trois premières règlent ce qui
 * arrive dans le centre de notifications de l'appareil. La quatrième — « Par e-mail » — est
 * DÉSACTIVÉE, et c'est la seule honnête : LE PRODUIT N'A AUCUN CANAL D'ENVOI D'E-MAIL.
 *
 * Un interrupteur d'e-mail actif ici ne réglerait rien, et donnerait à quelqu'un la certitude
 * d'avoir choisi. La ligne grisée dit à sa place ce qu'aucun réglage ne peut faire — et
 * l'interrupteur désactivé n'a AUCUN retour au toucher, ce qui est écrit dans le contrat de
 * `ds/Switch.tsx` : « un retour tactile sur un réglage qui ne fait rien est un mensonge de
 * plus ». On ne lui passe donc pas d'`onPress` du tout.
 *
 * DEUX RÉGLAGES DE LA MAQUETTE SONT RENDUS EN CONSTAT, PAS EN CONTRÔLE :
 *
 *   • L'APPARENCE. `app/(tabs)/profil.tsx` a déjà tranché, et sa raison tient : `useScheme()`
 *     lit le réglage du TÉLÉPHONE, et une bascule propre à l'application ajouterait un
 *     troisième état à tenir en mémoire, en contradiction avec le système.
 *   • LA LANGUE. Ce port n'embarque pas i18next — `mobile/package.json` ne le liste pas.
 *     Un sélecteur Français / English ne changerait pas un mot de cet écran.
 *
 * Dans les deux cas la règle est celle de `profil.tsx` : « un bouton qui ne fait rien est
 * pire que son absence ».
 *
 * LE NOM DU RÉPÉTITEUR, LUI, EST UN VRAI RÉGLAGE, et il est branché pour de bon :
 * `ds/tutor.ts` le tient, la barre d'onglets le lit. C'est le seul champ de cet écran qui
 * écrit quelque part.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
export default function Preferences() {
  const t = useToken();
  const scheme = useScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  /* L'identité vient de la route — donc de l'écran qui l'avait déjà lue. Rien n'est inventé
     ici : sans paramètre, l'écran dit qu'il n'a pas de session plutôt que d'afficher un nom. */
  const { nom, email } = useLocalSearchParams<{ nom?: string; email?: string }>();

  const [tuteur, setTuteur] = useState(tutorNom());
  const [garde, setGarde] = useState(tutorNom());
  const [reprise, setReprise] = useState(true);
  const [serie, setSerie] = useState(true);
  const [digest, setDigest] = useState(true);

  const initiales = (nom ?? '').trim().charAt(0).toUpperCase();

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="transforme" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 28, paddingHorizontal: 18, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Eyebrow>Préférences</Eyebrow>
        <View style={{ marginTop: 8, marginBottom: 18 }}>
          <Display size="sm" lines={['Ce que tu', 'règles toi-même.']} />
        </View>

        {nom || email ? (
          <Surface level="flat" style={{ padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar initials={initiales} size={56} />
            <View style={{ flex: 1 }}>
              {nom ? <Body style={{ fontWeight: '700', fontSize: 16 }}>{nom}</Body> : null}
              {email ? <Body muted style={{ fontSize: 12 }}>{email}</Body> : null}
            </View>
          </Surface>
        ) : (
          <Surface level="flat" style={{ padding: 18 }}>
            <Body style={{ fontWeight: '700' }}>Aucune session sur cet écran</Body>
            <Body muted style={{ marginTop: 4, fontSize: 13 }}>
              Ton nom et ton adresse arrivent avec la route, depuis l'écran qui les avait déjà
              lus. Aucun n'est affiché tant qu'aucun n'est transmis — un nom inventé sur un
              écran de compte est le pire endroit pour en inventer un.
            </Body>
          </Surface>
        )}

        {/* ── LE NOM DU RÉPÉTITEUR — le seul champ branché de l'écran ─────────────────── */}
        <Eyebrow style={{ marginTop: 22 }}>Ton répétiteur</Eyebrow>
        <Surface level="flat" style={{ marginTop: 9, padding: 18 }}>
          <Field
            label="Comment tu l'appelles"
            value={tuteur}
            onChangeText={setTuteur}
            placeholder={TUTOR_DEFAUT}
            autoCapitalize="words"
            hint={`Par défaut : ${TUTOR_DEFAUT}. Le nom ne change que pour toi.`}
            style={{ marginTop: 0 }}
          />
          <Button
            tone="transforme"
            label="Garde ce nom"
            disabled={tuteur.trim() === garde}
            onPress={() => {
              // Une chaîne vide ramène au défaut — c'est `ds/tutor.ts` qui le décide, pas
              // cet écran : un onglet sans libellé n'est pas une option.
              setTutorNom(tuteur);
              setTuteur(tutorNom());
              setGarde(tutorNom());
            }}
            style={{ marginTop: 14 }}
          />
          <Body muted style={{ marginTop: 10, fontSize: 12 }}>
            La barre du bas lit ce nom au démarrage. Ce port n'a pas de magasin qui prévienne
            les écrans déjà rendus : l'onglet portera « {garde} » au prochain lancement.
          </Body>
        </Surface>

        {/* ── LANGUE ET APPARENCE — des constats, parce que rien ici ne peut les changer ─ */}
        <Eyebrow style={{ marginTop: 22 }}>Langue et apparence</Eyebrow>
        <Surface level="flat" style={{ marginTop: 9, padding: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="languages" size={20} color={t('ink2')} />
            <View style={{ flex: 1 }}>
              <Body style={{ fontWeight: '700' }}>Interface en français</Body>
              <Body muted style={{ marginTop: 2, fontSize: 12.5 }}>
                Ce port ne contient qu'un catalogue de textes. Le site, lui, est bilingue : les
                articles y sont traduits automatiquement, et la version française est celle que
                j'écris.
              </Body>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: t('borderHair'), marginVertical: 14 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name={scheme === 'dark' ? 'moon' : 'sun'} size={20} color={t('ink2')} />
            <View style={{ flex: 1 }}>
              <Body style={{ fontWeight: '700' }}>
                Affichage {scheme === 'dark' ? 'sombre' : 'clair'}
              </Body>
              <Body muted style={{ marginTop: 2, fontSize: 12.5 }}>
                Il suit le réglage de ton téléphone. L'application ne le contredit pas — un
                troisième état à tenir en mémoire pour un écran plus foncé, ça ne vaut pas.
              </Body>
            </View>
          </View>
        </Surface>

        {/* ── CE QUE JE T'ENVOIE ─────────────────────────────────────────────────────── */}
        <Eyebrow style={{ marginTop: 22 }}>Ce que je t'envoie</Eyebrow>
        <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 18, paddingVertical: 6 }}>
          <LessonRow
            title="Reprise de cours"
            meta="quand tu t'arrêtes plus de 5 jours"
            trailing={<Switch on={reprise} label="Reprise de cours" onPress={() => setReprise((v) => !v)} />}
          />
          <LessonRow
            title="Série quotidienne"
            meta="avant qu'elle ne se casse"
            trailing={<Switch on={serie} label="Série quotidienne" onPress={() => setSerie((v) => !v)} />}
          />
          <LessonRow
            title="Digest du Club"
            meta="un résumé par semaine"
            trailing={<Switch on={digest} label="Digest du Club" onPress={() => setDigest((v) => !v)} />}
          />
          {/*
            LA QUATRIÈME. Pas d'`onPress` : `ds/Switch.tsx` retire l'enfoncement quand il est
            désactivé, et lui donner un gestionnaire rendrait ce retrait inopérant.

            La teinte tertiaire porte ici l'état, pas l'information : « pas encore disponible »
            est écrit en toutes lettres dans la métadonnée, et répété par l'interrupteur
            éteint. Personne n'a besoin de distinguer un gris d'un autre pour comprendre.
          */}
          <LessonRow
            title={<Body style={{ fontWeight: '600', fontSize: 14, color: t('ink3') }}>Par e-mail</Body>}
            meta="pas encore disponible"
            trailing={<Switch disabled label="Par e-mail — pas encore disponible" />}
            last
          />
        </Surface>

        <Surface level="truth" style={{ marginTop: 14, padding: 18 }}>
          <Eyebrow>Ce que ces interrupteurs font aujourd'hui</Eyebrow>
          <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
            Ils règlent ce qui arrive dans ton centre de notifications, dans l'application.{' '}
            <Body style={{ fontSize: 12.5, fontWeight: '700' }}>Aucun e-mail ne part encore</Body>
            {' '}— la ligne grisée le dit au lieu de le laisser croire. Et tant que ce port
            n'écrit pas dans ton profil, les trois autres tiennent le temps de la session, pas
            au-delà.
          </Body>
        </Surface>

        {/* ── TES DONNÉES ────────────────────────────────────────────────────────────── */}
        <Eyebrow style={{ marginTop: 22 }}>Tes données</Eyebrow>
        <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 18, paddingVertical: 6 }}>
          {/* Pas d'`onPress` : l'export se demande depuis le site pour l'instant. Une ligne
              qui informe n'est pas un bouton mort — un bouton mort, c'est une ligne qui
              s'enfonce sous le doigt et ne fait rien. */}
          <LessonRow
            icon={<Icon name="download" size={14} color={t('ink2')} />}
            title="Exporter mes données"
            meta="tout ce qui te concerne, en un fichier — depuis le site"
          />
          <LessonRow
            icon={<Icon name="trash" size={14} color={t('stop')} />}
            title={<Body style={{ fontWeight: '600', fontSize: 14, color: t('stop') }}>Supprimer mon compte</Body>}
            meta="définitif, sans passer par le support"
            onPress={() => router.push('/suppression')}
            last
          />
        </Surface>
      </ScrollView>
    </View>
  );
}

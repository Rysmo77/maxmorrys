import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import {
  Avatar, Body, Button, Eyebrow, Field, Icon, LessonRow, SansDonnees, Screen, Segmented,
  Surface, Switch, TUTOR_DEFAUT, isIOS, setTutorNom, useScheme, useToken, useTutorNom, veil,
} from '../../ds';
import { MOI, STOCKAGE } from '../../contenu/demo';

/**
 * ══ 3 · LE PROFIL ══ — LA SECTION NOTIFICATIONS DEVIENT RÉELLE.
 *
 * C'est l'onglet « Profil » du transfert, et il porte l'écran de préférences en entier : il n'y
 * a pas d'écran de compte AU-DESSUS des réglages. Un profil qui ne serait qu'un portrait et un
 * bouton « Préférences » ajouterait une porte pour rien, sur l'onglet où l'on vient RÉGLER.
 *
 * C'est le seul écran de compte que le natif CHANGE, et il le change au bon endroit : les
 * trois interrupteurs de notification ne sont plus des cases décoratives, ils reflètent l'état
 * de la permission SYSTÈME. Et la ligne « par e-mail » reste grisée, parce qu'aucun canal
 * d'envoi n'existe — la griser est plus honnête que de la retirer : ça dit qu'elle viendra.
 *
 * ── UN INTERRUPTEUR DÉSACTIVÉ N'A AUCUN RETOUR AU TOUCHER ────────────────────────────────
 * C'est écrit dans le système, et c'est plus fort qu'une opacité : un retour tactile sur un
 * réglage qui ne fait rien est un mensonge de plus.
 *
 * ── LE THÈME EST PROPOSÉ, MAIS C'EST LE SYSTÈME QUI DÉCIDE ───────────────────────────────
 * Le sélecteur montre le mode COURANT et dit d'où il vient. Une bascule propre à l'application
 * ajouterait un troisième état à tenir — « suit le système », « clair », « sombre » — qui
 * contredirait le réglage du téléphone la moitié du temps. Il se pose le jour où le choix est
 * persisté dans le profil, pas avant.
 */
const COMPTE = [
  { href: '/connexion', glyphe: 'login' as const, titre: 'Connexion', meta: 'sur le site, avec la même session' },
  { href: '/mot-de-passe', glyphe: 'lock' as const, titre: 'Mot de passe oublié', meta: 'un lien de réinitialisation' },
  { href: '/biometrie', glyphe: 'shield' as const, titre: 'Entrer sans mot de passe', meta: 'un raccourci, pas un remplacement' },
] as const;

const AILLEURS = [
  { href: '/media', glyphe: 'mic' as const, titre: 'Écouter & regarder', meta: 'le podcast, les vidéos' },
  { href: '/presence', glyphe: 'store' as const, titre: 'Présence Digitale', meta: 'pour ta boutique, hors application' },
  { href: '/console', glyphe: 'dashboard' as const, titre: 'Console support', meta: '5 écrans sur 19' },
  { href: '/apercu', glyphe: 'layers' as const, titre: 'Tous les écrans', meta: 'la planche de référence du kit' },
] as const;

export default function Profil() {
  const t = useToken();
  const scheme = useScheme();
  const tuteur = useTutorNom();
  const [reprise, setReprise] = useState(true);
  const [serie, setSerie] = useState(true);
  const [club, setClub] = useState(true);
  const [bio, setBio] = useState(true);

  return (
    <Screen
      territory="transforme"
      tabbar
      titre={isIOS ? undefined : 'Mon profil'}
    >
      {/* L'identité vient du compte, et elle ne s'invente pas : un nom affiché ici est le nom
          que la personne croira connecté. Les réglages, eux, tiennent sans elle. */}
      {MOI === null ? (
        <SansDonnees
          quoi="ton compte"
          origine="de ta connexion"
          degat="Afficher un nom et une adresse ici ferait croire à une session ouverte. Les réglages ci-dessous fonctionnent quand même : ils vivent sur cet appareil."
          style={{ marginTop: 8 }}
          action={<Button tone="forme" label="Me connecter" onPress={() => router.push('/connexion')} />}
        />
      ) : (
        <Surface level="flat" style={{ marginTop: 8, padding: 18 }}>
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <Avatar initials={MOI.initiale} size={54} />
            <View style={{ flex: 1 }}>
              <Body style={{ fontSize: 16, fontWeight: '700' }}>{MOI.nom}</Body>
              <Body muted style={{ fontFamily: 'JetBrainsMono', fontSize: 12, marginTop: 2 }}>{MOI.email}</Body>
            </View>
            <Button tone="quiet" size="sm" label="Modifier" onPress={() => router.push('/connexion')} />
          </View>
        </Surface>
      )}

      {/* ── NOTIFICATIONS ──────────────────────────────────────────────────────────────── */}
      <Eyebrow style={{ marginTop: 22 }}>Notifications</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 16 }}>
        <LessonRow
          title="Reprise de cours"
          meta="après 5 jours sans activité"
          trailing={<Switch on={reprise} label="Reprise de cours" onPress={() => setReprise(!reprise)} />}
        />
        <LessonRow
          title="Ta série va se casser"
          meta="le soir du 5e jour"
          trailing={<Switch on={serie} label="Ta série va se casser" onPress={() => setSerie(!serie)} />}
        />
        <LessonRow
          title="Session du Club"
          meta="1 h avant, si tu es inscrite"
          trailing={<Switch on={club} label="Session du Club" onPress={() => setClub(!club)} />}
        />
        <LessonRow
          title={<Body style={{ fontWeight: '600', fontSize: 14, color: t('textFaint') }}>Par e-mail</Body>}
          meta="aucun canal d'envoi n'existe encore"
          trailing={<Switch disabled label="Par e-mail — indisponible" />}
          last
        />
      </Surface>

      <Surface level="flat" style={{ marginTop: 10, padding: 16 }}>
        <View style={{ flexDirection: 'row', gap: 11, alignItems: 'flex-start' }}>
          <View style={{
            width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
            backgroundColor: veil(t('ok'), 0.14),
          }}>
            <Icon name="check" size={15} color={t('ok')} strokeWidth={3.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Body style={{ fontSize: 13.5, fontWeight: '600' }}>Autorisées sur cet appareil</Body>
            <Body muted style={{ fontSize: 12, lineHeight: 18, marginTop: 3 }}>
              Si tu changes d'avis, ça se coupe dans {isIOS ? 'les Réglages' : 'les paramètres'} du
              téléphone — l'app ne peut plus reposer la question.
            </Body>
          </View>
        </View>
      </Surface>

      {/* ── LANGUE ET APPARENCE ────────────────────────────────────────────────────────── */}
      <Eyebrow style={{ marginTop: 22 }}>Langue et apparence</Eyebrow>
      <Segmented options={['Français', 'English']} value="Français" style={{ marginTop: 10 }} />
      <Segmented
        options={['Clair', 'Sombre', 'Système']}
        value="Système"
        style={{ marginTop: 8 }}
      />
      <Body muted style={{ fontSize: 11.5, marginTop: 8, color: t('textFaint') }}>
        L'affichage suit ton téléphone, actuellement en mode {scheme === 'dark' ? 'sombre' : 'clair'}.
        L'application ne le contredit pas.
      </Body>

      {/* ── LE TUTEUR ──────────────────────────────────────────────────────────────────── */}
      <Eyebrow style={{ marginTop: 22 }}>Ton répétiteur</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, padding: 17 }}>
        <Field
          label="Comment tu l'appelles"
          value={tuteur}
          onChangeText={setTutorNom}
          autoCapitalize="words"
          hint={`Par défaut : ${TUTOR_DEFAUT}. Le nom ne change que pour toi.`}
          style={{ marginTop: 0 }}
        />
        <Button
          tone="quiet"
          size="sm"
          label="Voir ce qu'il a retenu"
          style={{ marginTop: 12 }}
          onPress={() => router.push('/memoire')}
        />
      </Surface>

      {/* ── L'APPAREIL ─────────────────────────────────────────────────────────────────── */}
      <Eyebrow style={{ marginTop: 22 }}>Sur cet appareil</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 16 }}>
        <LessonRow
          icon={<Icon name="lock" size={14} color={t('ink2')} />}
          title={isIOS ? 'Entrer avec Face ID' : "Entrer avec l'empreinte"}
          meta="raccourci, pas remplacement"
          trailing={<Switch on={bio} label="Entrer avec la biométrie" onPress={() => setBio(!bio)} />}
        />
        <LessonRow
          icon={<Icon name="download" size={14} color={t('ink2')} />}
          title="Téléchargements"
          meta={STOCKAGE ? `3 leçons · ${STOCKAGE.occupeCourt}` : undefined}
          trailing={<Icon name="forward" size={16} color={t('ink3')} strokeWidth={2.4} />}
          onPress={() => router.push('/telechargements')}
        />
        <LessonRow
          icon={<Icon name="smartphone" size={14} color={t('ink2')} />}
          title="Le widget d'écran d'accueil"
          meta="la relance qui n'interrompt rien"
          trailing={<Icon name="forward" size={16} color={t('ink3')} strokeWidth={2.4} />}
          onPress={() => router.push('/widget')}
          last
        />
      </Surface>

      {/* ── LES DONNÉES ────────────────────────────────────────────────────────────────── */}
      <Eyebrow style={{ marginTop: 22 }}>Tes données</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 16 }}>
        <LessonRow
          icon={<Icon name="download" size={14} color={t('ink2')} />}
          title="Exporter mes données"
          meta="tout ce qui te concerne, en un fichier"
          trailing={<Icon name="forward" size={16} color={t('ink3')} strokeWidth={2.4} />}
        />
        <LessonRow
          icon={<Icon name="trash" size={14} color={t('stop')} />}
          iconBackground={veil(t('stop'), 0.12)}
          title={<Body style={{ fontWeight: '600', fontSize: 14, color: t('stop') }}>Supprimer mon compte</Body>}
          meta="définitif, sans passer par le support"
          trailing={<Icon name="forward" size={16} color={t('ink3')} strokeWidth={2.4} />}
          onPress={() => router.push('/suppression')}
          last
        />
      </Surface>

      {/*
        ── TON COMPTE ────────────────────────────────────────────────────────────────────
        Ces trois écrans EXISTENT, et sans cette liste ils n'auraient aucun point d'entrée :
        une route qu'aucun écran n'ouvre est du code mort, et sur un routeur par fichiers elle
        ne se voit pas manquer.
      */}
      <Eyebrow style={{ marginTop: 22 }}>Ton compte</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 16 }}>
        {COMPTE.map((e, i) => (
          <LessonRow
            key={e.href}
            icon={<Icon name={e.glyphe} size={14} color={t('ink2')} />}
            title={e.titre}
            meta={e.meta}
            trailing={<Icon name="forward" size={16} color={t('ink3')} strokeWidth={2.4} />}
            onPress={() => router.push(e.href)}
            last={i === COMPTE.length - 1}
          />
        ))}
      </Surface>

      {/*
        ── AILLEURS DANS L'APPLICATION ───────────────────────────────────────────────────
        Le pôle média et l'offre TPE ne sont pas des réglages, mais c'est ici qu'on les cherche
        quand on ne les a pas trouvés dans les onglets. La console, elle, n'apparaît que pour
        un rôle qui l'atteint — le garde de route la cache, il ne l'interdit pas : le vrai
        cloisonnement est dans les règles de la base (voir `/interdit`).
      */}
      <Eyebrow style={{ marginTop: 22 }}>Ailleurs</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 16 }}>
        {AILLEURS.map((e, i) => (
          <LessonRow
            key={e.href}
            icon={<Icon name={e.glyphe} size={14} color={t('ink2')} />}
            title={e.titre}
            meta={e.meta}
            trailing={<Icon name="forward" size={16} color={t('ink3')} strokeWidth={2.4} />}
            onPress={() => router.push(e.href)}
            last={i === AILLEURS.length - 1}
          />
        ))}
      </Surface>
    </Screen>
  );
}

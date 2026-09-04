import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import {
  Avatar, Body, Button, Eyebrow, Field, Icon, LessonRow, SansDonnees, Screen, Segmented,
  Surface, Switch, TUTOR_DEFAUT, isIOS, setTutorNom, useScheme, useToken, useTutorNom, veil,
} from '../../ds';
import { STOCKAGE } from '../../contenu/demo';
import { ErreurAppel } from '../../donnees/appel';
import { deconnexion } from '../../donnees/identite';
import { useSession } from '../../donnees/session';
import { useMoi } from '../../donnees';
import { exporterMesDonnees } from '../../donnees/rgpd';
import { useVerrou } from '../../donnees/verrou';

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
  { href: '/connexion', glyphe: 'login' as const, titre: 'Connexion', meta: 'ton e-mail et ton mot de passe' },
  { href: '/mot-de-passe', glyphe: 'lock' as const, titre: 'Mot de passe oublié', meta: 'un lien de réinitialisation' },
  { href: '/biometrie', glyphe: 'shield' as const, titre: 'Entrer sans mot de passe', meta: 'un raccourci, pas un remplacement' },
] as const;

/*
 * Le drapeau est LITTÉRAL ICI, comme dans les deux écrans qu'il garde : Metro ne replie une
 * branche morte que là où la condition l'est. Importé d'un module commun, les deux entrées
 * resteraient dans le paquet de production.
 */
const ATELIER = process.env.EXPO_PUBLIC_CONTENU_DEMO === '1' || __DEV__;

const AILLEURS = [
  { href: '/media', glyphe: 'mic' as const, titre: 'Écouter & regarder', meta: 'le podcast, les vidéos' },
  { href: '/presence', glyphe: 'store' as const, titre: 'Présence Digitale', meta: 'pour ta boutique, hors application' },
  { href: '/legal', glyphe: 'doc' as const, titre: 'Textes légaux', meta: 'confidentialité, conditions, mentions' },
  /* Les deux écrans d'atelier ne sortent pas. La console expose six écrans
     d'administration, la planche en liste quarante-huit : l'une comme l'autre se lisent en
     revue comme une application inachevée. */
  ...(ATELIER ? [
    { href: '/console', glyphe: 'dashboard' as const, titre: 'Console support', meta: '5 écrans sur 19' },
    { href: '/apercu', glyphe: 'layers' as const, titre: 'Tous les écrans', meta: 'la planche de référence du kit' },
  ] : []),
] as const;

export default function Profil() {
  const t = useToken();
  const scheme = useScheme();
  const tuteur = useTutorNom();
  const [reprise, setReprise] = useState(true);
  const [exportEnCours, setExportEnCours] = useState(false);
  const session = useSession();
  const moi = useMoi();

  async function quitter() {
    await deconnexion();
    router.replace('/connexion');
  }

  async function exporter() {
    if (exportEnCours) return;
    setExportEnCours(true);
    try {
      await exporterMesDonnees();
    } catch (erreur: unknown) {
      Alert.alert(
        "L'export n'a pas abouti",
        erreur instanceof ErreurAppel ? erreur.motif : 'Réessaie dans un moment.',
      );
    } finally {
      setExportEnCours(false);
    }
  }
  const [serie, setSerie] = useState(true);
  const [club, setClub] = useState(true);
  /*
   * ⚠️ CET INTERRUPTEUR ÉTAIT UN `useState(true)`. Il s'affichait ALLUMÉ au premier rendu,
   * pour un verrou que rien ne posait et que rien ne lisait — le même mensonge que le bouton
   * de l'écran `/biometrie`, mais en pire : celui-ci l'affirmait sans qu'on ait rien demandé.
   * Il lit maintenant le drapeau réel, et il ne se laisse toucher que si l'appareil peut
   * tenir la promesse.
   */
  const verrou = useVerrou();

  async function basculerVerrou() {
    if (verrou.actif) {
      await verrou.desactiver();
      return;
    }
    const verdict = await verrou.activer();
    if (!verdict.ok) Alert.alert("Le verrou n'a pas été posé", verdict.motif);
  }

  return (
    <Screen
      territory="transforme"
      tabbar
      titre={isIOS ? undefined : 'Mon profil'}
    >
      {/* L'identité vient du compte, et elle ne s'invente pas : un nom affiché ici est le nom
          que la personne croira connecté. Les réglages, eux, tiennent sans elle. */}
      {moi.valeur === null ? (
        <SansDonnees
          quoi="ton compte"
          origine="de ta connexion"
          degat="Afficher un nom et une adresse ici ferait croire à une session ouverte. Les réglages ci-dessous fonctionnent quand même : ils vivent sur cet appareil."
          etat={moi}
          hauteur={2}
          style={{ marginTop: 8 }}
          action={<Button tone="forme" label="Me connecter" onPress={() => router.push('/connexion')} />}
        />
      ) : (
        <Surface level="flat" style={{ marginTop: 8, padding: 18 }}>
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <Avatar initials={moi.valeur.initiale} size={54} />
            <View style={{ flex: 1 }}>
              <Body style={{ fontSize: 16, fontWeight: '700' }}>{moi.valeur.nom}</Body>
              <Body muted style={{ fontFamily: 'JetBrainsMono', fontSize: 12, marginTop: 2 }}>{moi.valeur.email}</Body>
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

      {/* ⚠️ CE BLOC AFFIRMAIT « AUTORISÉES SUR CET APPAREIL », coche verte à l'appui, pour
          une permission que RIEN NE DEMANDE JAMAIS. `permissions.tsx` prime l'accord puis
          appelle `router.replace` : aucun dialogue système ne s'ouvre, `expo-notifications`
          n'est pas installé. L'application se décernait donc un état qu'elle n'avait pas
          établi — et c'est la forme d'erreur la plus coûteuse, parce qu'elle est
          rassurante : personne ne va vérifier une coche verte.

          Le texte dit maintenant ce qui est. Le jour où le canal existe, ce bloc lit
          `getPermissionsAsync()` et redevient une affirmation — vérifiée, cette fois. */}
      <Surface level="flat" style={{ marginTop: 10, padding: 16 }}>
        <View style={{ flexDirection: 'row', gap: 11, alignItems: 'flex-start' }}>
          <View style={{
            width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
            backgroundColor: veil(t('ink2'), 0.14),
          }}>
            <Icon name="info" size={15} color={t('ink2')} strokeWidth={2.6} />
          </View>
          <View style={{ flex: 1 }}>
            <Body style={{ fontSize: 13.5, fontWeight: '600' }}>Rien n'est encore envoyé</Body>
            <Body muted style={{ fontSize: 12, lineHeight: 18, marginTop: 3 }}>
              Ces trois réglages sont enregistrés, mais le canal d'envoi n'existe pas encore :
              l'application n'a demandé aucune autorisation à {isIOS ? 'iOS' : 'Android'}, et
              elle ne t'enverra rien tant qu'elle ne l'aura pas fait.
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
          /* Quand l'appareil ne peut pas, la ligne DIT pourquoi plutôt que de rester
             muette : un réglage éteint sans raison se lit comme une panne. */
          meta={verrou.capacite === null || verrou.capacite.etat === 'pret'
            ? 'raccourci, pas remplacement'
            : verrou.capacite.court}
          trailing={verrou.capacite === null || verrou.capacite.etat !== 'pret' ? (
            <Switch disabled label="Entrer avec la biométrie — indisponible" />
          ) : (
            <Switch
              on={verrou.actif}
              label="Entrer avec la biométrie"
              onPress={() => { if (!verrou.occupe) void basculerVerrou(); }}
            />
          )}
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
        {/* ⚠️ CETTE LIGNE N'AVAIT AUCUN `onPress`. Elle avait l'apparence complète d'un
            contrôle — glyphe, titre, chevron de tête de ligne — et ne faisait rien. Sur
            l'écran des données, c'est le pire endroit pour un bouton mort : quelqu'un qui
            veut ses données avant de partir repart en croyant que l'export n'existe pas. */}
        <LessonRow
          icon={<Icon name="download" size={14} color={t('ink2')} />}
          title="Exporter mes données"
          meta={exportEnCours ? 'préparation du fichier…' : 'tout ce qui te concerne, en un fichier'}
          trailing={<Icon name="forward" size={16} color={t('ink3')} strokeWidth={2.4} />}
          onPress={() => { void exporter(); }}
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
            last={i === COMPTE.length - 1 && session.phase !== 'connectee'}
          />
        ))}

        {/* ⚠️ IL N'Y AVAIT AUCUNE SORTIE. On pouvait entrer dans un compte et pas en sortir
            — un défaut qui ne se voit qu'une fois l'authentification branchée, parce qu'avant
            il n'y avait pas de session à quitter. La ligne n'existe que si quelqu'un est
            connecté : proposer de se déconnecter à un visiteur anonyme est une action qui ne
            veut rien dire. */}
        {session.phase === 'connectee' ? (
          <LessonRow
            icon={<Icon name="logout" size={14} color={t('ink2')} />}
            title="Me déconnecter"
            meta={session.email ?? 'de ce téléphone'}
            onPress={() => Alert.alert(
              'Te déconnecter ?',
              "Tes téléchargements restent sur ce téléphone tant que l'application est installée.",
              [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Me déconnecter', style: 'destructive', onPress: () => { void quitter(); } },
              ],
            )}
            last
          />
        ) : null}
      </Surface>

      {/*
        ── AILLEURS DANS L'APPLICATION ───────────────────────────────────────────────────
        Le pôle média et l'offre TPE ne sont pas des réglages, mais c'est ici qu'on les cherche
        quand on ne les a pas trouvés dans les onglets.

        ⚠️ CE COMMENTAIRE AFFIRMAIT QU'UN GARDE DE ROUTE CACHAIT LA CONSOLE. Il n'en existait
        aucun : `console/_layout.tsx` retournait un `<Stack>` nu, et les six écrans partaient
        à tout le monde. La garde existe maintenant, des deux côtés — ici pour l'entrée, et
        dans la mise en page pour l'accès direct par URL, qu'une liste ne protège pas.
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

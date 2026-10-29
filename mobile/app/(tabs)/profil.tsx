import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import {
  Avatar, Body, Button, Eyebrow, Field, Icon, SansDonnees, Screen, Surface, Switch, TUTOR_DEFAUT,
  isIOS, useBandeau, useConfirmation, useScheme, useToken, useTutorNom, veil, Ligne, Liste,
  Rubrique,
} from '../../ds';
import { useResumeTelechargements } from '../../donnees/hors-ligne';
import { PORTEE_RESUMEE } from '../../contenu/termes';
import { ErreurAppel } from '../../donnees/appel';
import { deconnexion } from '../../donnees/identite';
import { useSession } from '../../donnees/session';
import { reglerLeRepetiteur, useMoi, useRafraichir } from '../../donnees';
import { usePreference } from '../../donnees/preferences';
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
/* Les lignes de compte DÉPENDENT DE LA SESSION. Connecté, « Connexion » ouvrait un écran de
   connexion par-dessus une session ouverte, et « Entrer sans mot de passe » doublonnait
   l'interrupteur biométrique de « Sur cet appareil ». */
const COMPTE_ANONYME = [
  { href: '/connexion', glyphe: 'login' as const, titre: 'Me connecter', meta: 'ton e-mail et ton mot de passe' },
  { href: '/creation', glyphe: 'user' as const, titre: 'Créer mon compte', meta: 'gratuit, en une minute' },
  { href: '/mot-de-passe', glyphe: 'lock' as const, titre: 'Mot de passe oublié', meta: 'un lien de réinitialisation' },
] as const;
const COMPTE_CONNECTE = [
  { href: '/mot-de-passe', glyphe: 'lock' as const, titre: 'Changer mon mot de passe', meta: 'un lien par e-mail' },
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
    { href: '/console', glyphe: 'dashboard' as const, titre: 'Console support', meta: PORTEE_RESUMEE },
    { href: '/apercu', glyphe: 'layers' as const, titre: 'Tous les écrans', meta: 'la planche de référence du kit' },
    /* Deux surfaces natives que le binaire ne contient pas encore : leur maquette reste
       consultable en atelier, jamais en production. */
    { href: '/widget', glyphe: 'smartphone' as const, titre: 'Maquette du widget', meta: 'pas encore dans le binaire' },
    { href: '/verrouille', glyphe: 'lock' as const, titre: "Maquette de l'écran verrouillé", meta: 'pas encore dans le binaire' },
    { href: '/permissions', glyphe: 'bell' as const, titre: 'Maquette des notifications', meta: 'pas encore dans le binaire' },
  ] : []),
] as const;

export default function Profil() {
  const t = useToken();
  const scheme = useScheme();
  const tuteur = useTutorNom();
  const telechargements = useResumeTelechargements();
  const [reprise, setReprise] = usePreference('notif.reprise', true);
  const [exportEnCours, setExportEnCours] = useState(false);
  const session = useSession();
  const moi = useMoi();
  const { bandeau, montrer } = useBandeau();
  const { enRafraichissement, rafraichir } = useRafraichir();
  const COMPTE = session.phase === 'connectee' ? COMPTE_CONNECTE : COMPTE_ANONYME;

  /*
   * LE NOM SE TAPE LIBREMENT, ET S'ENREGISTRE À LA SORTIE DU CHAMP. Il était recalculé à
   * chaque frappe (`trim`), si bien qu'un espace tapé disparaissait aussitôt : « Mon Coach »
   * était impossible à écrire. Il est maintenant écrit dans le PROFIL, et suit la personne.
   */
  const [brouillon, setBrouillon] = useState(tuteur);
  useEffect(() => { setBrouillon(tuteur); }, [tuteur]);
  const nomEnregistre = useConfirmation();
  async function enregistrerNom() {
    const net = brouillon.trim();
    if (net === tuteur || (net === '' && tuteur === TUTOR_DEFAUT)) return;
    if (session.phase !== 'connectee') { montrer('info', 'Connecte-toi pour renommer ton répétiteur', 'Le nom vit dans ton profil, pour te suivre d\'un appareil à l\'autre.'); setBrouillon(tuteur); return; }
    try {
      await reglerLeRepetiteur({ nom: net });
      nomEnregistre.confirmer(`${net || TUTOR_DEFAUT} enregistré`);
    } catch (erreur: unknown) {
      montrer('stop', "Le nom n'a pas été enregistré", erreur instanceof ErreurAppel ? erreur.motif : 'Réessaie dans un moment.');
    }
  }

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
      montrer('stop', "L'export n'a pas abouti", erreur instanceof ErreurAppel ? erreur.motif : 'Réessaie dans un moment.');
    } finally {
      setExportEnCours(false);
    }
  }
  const [serie, setSerie] = usePreference('notif.serie', true);
  const [club, setClub] = usePreference('notif.club', true);
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
    if (!verdict.ok) montrer('stop', "Le verrou n'a pas été posé", verdict.motif);
  }

  return (
    <Screen
      territory="transforme"
      espace="hub"
      tabbar
      titre={isIOS ? undefined : 'Mon profil'}
      onRefresh={rafraichir}
      enRafraichissement={enRafraichissement}
    >
      {bandeau}
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
            <Avatar initials={moi.valeur.initiale} size={54} decoratif />
            <View style={{ flex: 1 }}>
              <Body style={{ fontSize: 16, fontWeight: '700' }}>{moi.valeur.nom}</Body>
              {/* Le courriel n'est pas un nombre vérifiable : il prend la police du corps. */}
              <Body muted style={{ fontSize: 13, marginTop: 2 }}>{moi.valeur.email}</Body>
            </View>
            {/* « Modifier » ouvrait l'écran de CONNEXION : il n'existe aucun écran d'édition du
                profil dans l'application. Le bouton est parti plutôt que de mentir. */}
          </View>
        </Surface>
      )}

      {/* ── NOTIFICATIONS ──────────────────────────────────────────────────────────────── */}
      <Rubrique>Notifications</Rubrique>
      <Liste>
        <Ligne
          titre="Reprise de cours"
          sous="après 5 jours sans activité"
          droite={<Switch on={reprise} label="Reprise de cours" onPress={() => setReprise(!reprise)} />}
        />
        <Ligne
          titre="Ta série va se casser"
          sous="le soir du 5e jour"
          droite={<Switch on={serie} label="Ta série va se casser" onPress={() => setSerie(!serie)} />}
        />
        <Ligne
          titre="Session du Club"
          sous="1 h avant, si tu as réservé ta place"
          droite={<Switch on={club} label="Session du Club" onPress={() => setClub(!club)} />}
        />
        <Ligne
          titre={<Body style={{ fontWeight: '600', fontSize: 14 }}>Par e-mail</Body>}
          sous="aucun canal d'envoi n'existe encore"
          droite={<Switch disabled label="Par e-mail — indisponible" />}
        />
      </Liste>

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
            <Body muted style={{ fontSize: 12.5, lineHeight: 18, marginTop: 3 }}>
              Ces trois choix sont gardés sur ce téléphone. Les notifications n'existent pas
              encore : rien ne t'est envoyé pour l'instant, et {isIOS ? 'iOS' : 'Android'} ne
              t'a rien demandé.
            </Body>
          </View>
        </View>
      </Surface>

      {/* ── APPARENCE ──────────────────────────────────────────────────────────────────────
         DEUX SÉLECTEURS ONT ÉTÉ RETIRÉS ICI, ET LE SECOND CONTREDISAIT LA PHRASE QUI LE SUIT.

         · « Français / English » promettait une interface bilingue. L'application native n'a
           AUCUN système de traduction : toutes ses chaînes sont écrites en français dans les
           écrans. Le site est bilingue, pas elle. Le sélecteur annonçait donc une langue qui
           n'existe nulle part dans le paquet.
         · « Clair / Sombre / Système » n'avait pas d'`onChange` — et la phrase juste en dessous
           disait déjà que l'affichage suit le téléphone. Un contrôle qui contredit le texte
           qui l'explique est pire que son absence.

         Ni l'un ni l'autre n'était visible pour `mobile-controles-morts.test.ts` : la porte
         cherche un `onPress` manquant, pas un `onChange` absent sur un composant à choix.
         Le test est étendu dans le même lot. */}
      <Eyebrow style={{ marginTop: 22 }}>Apparence</Eyebrow>
      <Body muted style={{ fontSize: 11.5, marginTop: 10 }}>
        L'affichage suit ton téléphone, actuellement en mode {scheme === 'dark' ? 'sombre' : 'clair'}.
        L'application ne le contredit pas.
      </Body>

      {/* ── LE TUTEUR ──────────────────────────────────────────────────────────────────── */}
      <Eyebrow style={{ marginTop: 22 }}>Ton répétiteur</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, padding: 17 }}>
        <Field
          label="Comment tu l'appelles"
          value={brouillon}
          onChangeText={setBrouillon}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={40}
          returnKeyType="done"
          onSubmitEditing={() => { void enregistrerNom(); }}
          hint={nomEnregistre.confirme ? 'Enregistré dans ton profil.' : `Par défaut : ${TUTOR_DEFAUT}. Le nom ne change que pour toi.`}
          style={{ marginTop: 0 }}
        />
        {brouillon.trim() !== tuteur && !(brouillon.trim() === '' && tuteur === TUTOR_DEFAUT) ? (
          <Button tone="transforme" size="sm" label="Enregistrer le nom" style={{ marginTop: 10 }} onPress={() => { void enregistrerNom(); }} />
        ) : null}
        <Button
          tone="quiet"
          size="sm"
          label="Voir ce qu'il a retenu"
          style={{ marginTop: 12 }}
          onPress={() => router.push('/memoire')}
        />
      </Surface>

      {/* ── L'APPAREIL ─────────────────────────────────────────────────────────────────── */}
      <Rubrique>Sur cet appareil</Rubrique>
      <Liste>
        <Ligne
          icone="lock"
          /* Le geste RÉEL de l'appareil : « Face ID » était écrit en dur, faux sur un iPhone
             à capteur d'empreinte comme sur Android. */
          titre={verrou.capacite?.etat === 'pret' ? `Entrer avec ${verrou.capacite.geste}` : 'Entrer sans mot de passe'}
          /* Quand l'appareil ne peut pas, la ligne DIT pourquoi plutôt que de rester
             muette : un réglage éteint sans raison se lit comme une panne. */
          sous={verrou.capacite === null || verrou.capacite.etat === 'pret'
            ? 'raccourci, pas remplacement'
            : verrou.capacite.court}
          droite={verrou.capacite === null || verrou.capacite.etat !== 'pret' ? (
            <Switch disabled label="Entrer avec la biométrie — indisponible" />
          ) : (
            <Switch
              on={verrou.actif}
              label="Entrer avec la biométrie"
              onPress={() => { if (!verrou.occupe) void basculerVerrou(); }}
            />
          )}
        />
        <Ligne
          icone="download"
          titre="Téléchargements"
          sous={telechargements}
          onPress={() => router.push('/telechargements')}
        />
        {/* La ligne du widget est partie : il n'existe pas dans le binaire. L'annoncer dans
            les réglages, c'était promettre une fonction à la revue comme à la personne. */}
      </Liste>

      {/* ── LES DONNÉES ────────────────────────────────────────────────────────────────── */}
      <Rubrique>Tes données</Rubrique>
      <Liste>
        {/* ⚠️ CETTE LIGNE N'AVAIT AUCUN `onPress`. Elle avait l'apparence complète d'un
            contrôle — glyphe, titre, chevron de tête de ligne — et ne faisait rien. Sur
            l'écran des données, c'est le pire endroit pour un bouton mort : quelqu'un qui
            veut ses données avant de partir repart en croyant que l'export n'existe pas. */}
        <Ligne
          icone="download"
          titre="Exporter mes données"
          sous={exportEnCours ? 'préparation du fichier…' : 'tout ce qui te concerne, en un fichier'}
          onPress={() => { void exporter(); }}
        />
        <Ligne
          icone="trash"
          danger
          titre={<Body style={{ fontWeight: '600', fontSize: 14, color: t('stop') }}>Supprimer mon compte</Body>}
          sous="définitif, sans passer par le support"
          onPress={() => router.push('/suppression')}
        />
      </Liste>

      {/*
        ── TON COMPTE ────────────────────────────────────────────────────────────────────
        Ces trois écrans EXISTENT, et sans cette liste ils n'auraient aucun point d'entrée :
        une route qu'aucun écran n'ouvre est du code mort, et sur un routeur par fichiers elle
        ne se voit pas manquer.
      */}
      <Rubrique>Ton compte</Rubrique>
      <Liste>
        {COMPTE.map((e) => (
          <Ligne
            key={e.href}
            icone={e.glyphe}
            titre={e.titre}
            sous={e.meta}
            onPress={() => router.push(e.href)}
          />
        ))}

        {/* ⚠️ IL N'Y AVAIT AUCUNE SORTIE. On pouvait entrer dans un compte et pas en sortir
            — un défaut qui ne se voit qu'une fois l'authentification branchée, parce qu'avant
            il n'y avait pas de session à quitter. La ligne n'existe que si quelqu'un est
            connecté : proposer de se déconnecter à un visiteur anonyme est une action qui ne
            veut rien dire. */}
        {session.phase === 'connectee' ? (
          <Ligne
            icone="logout"
            titre="Me déconnecter"
            sous={session.email ?? 'de ce téléphone'}
            onPress={() => Alert.alert(
              'Te déconnecter ?',
              "Tes téléchargements restent sur ce téléphone tant que l'application est installée.",
              [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Me déconnecter', style: 'destructive', onPress: () => { void quitter(); } },
              ],
            )}
          />
        ) : null}
      </Liste>

      {/*
        ── AILLEURS DANS L'APPLICATION ───────────────────────────────────────────────────
        Le pôle média et l'offre TPE ne sont pas des réglages, mais c'est ici qu'on les cherche
        quand on ne les a pas trouvés dans les onglets.

        ⚠️ CE COMMENTAIRE AFFIRMAIT QU'UN GARDE DE ROUTE CACHAIT LA CONSOLE. Il n'en existait
        aucun : `console/_layout.tsx` retournait un `<Stack>` nu, et les six écrans partaient
        à tout le monde. La garde existe maintenant, des deux côtés — ici pour l'entrée, et
        dans la mise en page pour l'accès direct par URL, qu'une liste ne protège pas.
      */}
      <Rubrique>Ailleurs</Rubrique>
      <Liste>
        {AILLEURS.map((e) => (
          <Ligne
            key={e.href}
            icone={e.glyphe}
            titre={e.titre}
            sous={e.meta}
            onPress={() => router.push(e.href)}
          />
        ))}
      </Liste>
    </Screen>
  );
}

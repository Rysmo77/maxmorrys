import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import {
  Avatar, Body, Button, Display, SansDonnees, Screen, Surface, isIOS, useTutorNom, Ligne, Liste,
  Rubrique,
} from '../../ds';
import { useResumeTelechargements } from '../../donnees/hors-ligne';
import { PORTEE_RESUMEE } from '../../contenu/termes';
import { deconnexion } from '../../donnees/identite';
import { useSession } from '../../donnees/session';
import { useCertificats, useClub, useCours, useMoi, useRafraichir, useRepetiteur } from '../../donnees';

/**
 * ══ 46 · PROFIL ══ (maquette Rysmo-iOS-46).
 *
 * ⭐ PASSE 2 (29/10/2026). Le Profil portait l'écran de préférences en entier ; la maquette en
 * fait un SOMMAIRE : l'identité, « Mes espaces » (Edu, Club, l'assistant), « Mon compte »
 * (Préférences, Mes paiements, Téléchargements, Réserver un appel), l'administration, l'aide,
 * la sortie. Les réglages sont partis tels quels dans `app/preferences.tsx` (maquette 47).
 *
 * LES SOUS-TITRES SONT DÉRIVÉS. « 2 formations · 1 certificat » se compte sur les vues ; une
 * valeur que le serveur n'a pas rendue n'est pas écrite — la ligne garde sa description.
 *
 * L'ADMINISTRATION reste derrière l'ATELIER (garde littérale, `mobile-atelier-garde.test.ts`) :
 * la console mobile n'est pas encore ouverte en production, quel que soit le rôle.
 */
/* Les lignes de compte DÉPENDENT DE LA SESSION. */
const COMPTE_ANONYME = [
  { href: '/connexion', glyphe: 'login' as const, titre: 'Me connecter', meta: 'ton e-mail et ton mot de passe' },
  { href: '/creation', glyphe: 'user' as const, titre: 'Créer mon compte', meta: 'gratuit, en une minute' },
  { href: '/mot-de-passe', glyphe: 'lock' as const, titre: 'Mot de passe oublié', meta: 'un lien de réinitialisation' },
] as const;
const COMPTE_CONNECTE = [
  { href: '/mot-de-passe', glyphe: 'lock' as const, titre: 'Changer mon mot de passe', meta: 'un lien par e-mail' },
] as const;

/*
 * Le drapeau est LITTÉRAL ICI, comme dans les écrans qu'il garde : Metro ne replie une
 * branche morte que là où la condition l'est.
 */
const ATELIER = process.env.EXPO_PUBLIC_CONTENU_DEMO === '1' || __DEV__;

const ADMINISTRATION = [
  ...(ATELIER ? [
    { href: '/console', glyphe: 'dashboard' as const, titre: "Console d'administration", meta: PORTEE_RESUMEE },
    { href: '/apercu', glyphe: 'layers' as const, titre: 'Tous les écrans', meta: 'la planche de référence du kit' },
    { href: '/widget', glyphe: 'smartphone' as const, titre: 'Maquette du widget', meta: 'pas encore dans le binaire' },
    { href: '/verrouille', glyphe: 'lock' as const, titre: "Maquette de l'écran verrouillé", meta: 'pas encore dans le binaire' },
    { href: '/permissions', glyphe: 'bell' as const, titre: 'Maquette des notifications', meta: 'pas encore dans le binaire' },
  ] : []),
] as const;

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

export default function Profil() {
  const tuteur = useTutorNom();
  const telechargements = useResumeTelechargements();
  const session = useSession();
  const moi = useMoi();
  const cours = useCours();
  const certificats = useCertificats();
  const club = useClub();
  const rep = useRepetiteur();
  const { enRafraichissement, rafraichir } = useRafraichir();
  const COMPTE = session.phase === 'connectee' ? COMPTE_CONNECTE : COMPTE_ANONYME;

  const nbFormations = cours.phase === 'servie' ? cours.valeur.filter((f) => f.acquise).length : null;
  const nbCertificats = certificats.phase === 'servie' ? certificats.valeur.certificats.length : null;
  const edu = nbFormations === null
    ? 'tes formations, tes certificats'
    : [pluriel(nbFormations, 'formation'), nbCertificats === null ? null : pluriel(nbCertificats, 'certificat')].filter(Boolean).join(' · ');
  const echeance = club.valeur?.echeance ?? null;
  const quota = rep.valeur?.quota ?? null;
  const assistant = [
    quota ? `${quota.total - quota.utilise} / ${quota.total} questions` : null,
    rep.valeur ? (rep.valeur.memoireActive ? 'mémoire activée' : 'mémoire désactivée') : null,
  ].filter(Boolean).join(' · ') || 'ton nom, ta mémoire, tes questions';
  const version = Constants.expoConfig?.version ?? null;

  async function quitter() {
    await deconnexion();
    router.replace('/connexion');
  }

  return (
    <Screen
      territory="transforme"
      espace="hub"
      tabbar
      titre={isIOS ? undefined : 'Profil'}
      onRefresh={rafraichir}
      enRafraichissement={enRafraichissement}
    >
      {isIOS ? <Display size={32} lines={['Profil']} style={{ marginTop: 6 }} /> : null}
      {moi.valeur === null ? (
        <SansDonnees
          quoi="ton compte"
          origine="de ta connexion"
          degat="Afficher un nom et une adresse ici ferait croire à une session ouverte. Les réglages fonctionnent quand même : ils vivent sur cet appareil."
          etat={moi}
          hauteur={2}
          style={{ marginTop: 14 }}
          action={<Button tone="forme" label="Me connecter" onPress={() => router.push('/connexion')} />}
        />
      ) : (
        <Surface level="flat" style={{ marginTop: 14, padding: 18 }}>
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <Avatar initials={moi.valeur.initiale} size={54} decoratif />
            <View style={{ flex: 1 }}>
              <Body style={{ fontSize: 16, fontWeight: '700' }}>{moi.valeur.nom}</Body>
              <Body muted style={{ fontSize: 13, marginTop: 2 }}>{moi.valeur.email}</Body>
            </View>
            {/* « Modifier » de la maquette : aucun écran d'édition du profil n'existe dans
                l'application. Le bouton n'est pas posé plutôt que de mener ailleurs. */}
          </View>
        </Surface>
      )}

      <Rubrique>Mes espaces</Rubrique>
      <Liste>
        <Ligne icone="book" titre="Edu · mes formations" sous={edu} onPress={() => router.navigate('/cours')} />
        <Ligne
          icone="users"
          titre="Club des Digitos"
          sous={echeance ? `échéance ${echeance}` : 'le fil, l’agenda, les opportunités'}
          onPress={() => router.navigate('/club')}
        />
        <Ligne icone="sparkles" titre={tuteur} sous={assistant} onPress={() => router.push('/memoire')} />
      </Liste>

      <Rubrique>Mon compte</Rubrique>
      <Liste>
        <Ligne icone="settings" titre="Préférences" sous="notifications, langue, apparence, biométrie" onPress={() => router.push('/preferences')} />
        <Ligne icone="card" titre="Mes paiements" sous="faits sur le site" onPress={() => router.push('/paiements')} />
        <Ligne icone="download" titre="Téléchargements" sous={telechargements} onPress={() => router.push('/telechargements')} />
        <Ligne icone="phone" titre="Réserver un appel avec Max" sous="30 min · gratuit" onPress={() => router.push('/rendez-vous')} />
        {COMPTE.map((e) => (
          <Ligne key={e.href} icone={e.glyphe} titre={e.titre} sous={e.meta} onPress={() => router.push(e.href)} />
        ))}
      </Liste>

      {ADMINISTRATION.length > 0 ? (
        <>
          <Rubrique>Administration</Rubrique>
          <Liste>
            {ADMINISTRATION.map((e) => (
              <Ligne key={e.href} icone={e.glyphe} titre={e.titre} sous={e.meta} onPress={() => router.push(e.href)} />
            ))}
          </Liste>
        </>
      ) : null}

      <Rubrique>Ailleurs</Rubrique>
      <Liste>
        <Ligne icone="mic" titre="Écouter & regarder" sous="le podcast, les vidéos" onPress={() => router.push('/media')} />
        <Ligne icone="store" titre="Commerces et TPE" sous="un site pour ta boutique" onPress={() => router.push('/presence')} />
        <Ligne icone="doc" titre="Conditions et confidentialité" sous="confidentialité, conditions, mentions" onPress={() => router.push('/legal')} />
      </Liste>

      {session.phase === 'connectee' ? (
        <Button
          tone="danger"
          label="Me déconnecter"
          style={{ marginTop: 20 }}
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
      <Body muted style={{ marginTop: 16, fontSize: 12, textAlign: 'center' }}>
        {version ? `Rysmo ${version} · par Max-Morrys` : 'Rysmo · par Max-Morrys'}
      </Body>
    </Screen>
  );
}

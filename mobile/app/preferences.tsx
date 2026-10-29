import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import {
  Body, Icon, Ligne, Liste, Rubrique, Screen, Surface, Switch, isIOS, useBandeau, useMouvement,
  useScheme, useToken, veil,
} from '../ds';
import { ErreurAppel } from '../donnees/appel';
import { useResumeTelechargements } from '../donnees/hors-ligne';
import { usePreference } from '../donnees/preferences';
import { exporterMesDonnees } from '../donnees/rgpd';
import { useVerrou } from '../donnees/verrou';

/**
 * ══ 47 · PRÉFÉRENCES ══ (maquette Rysmo-iOS-47).
 *
 * ⭐ PASSE 2 (29/10/2026) : ces réglages vivaient dans le Profil. La maquette 46 fait du Profil un
 * sommaire (espaces, compte, administration) et range ici notifications, langue, apparence,
 * appareil et données. Le CODE est celui du Profil, déplacé sans changer de comportement :
 * interrupteurs gardés sur le téléphone, verrou biométrique lu sur son état réel, export réel.
 *
 * CE QUI N'EST PAS REPRIS DE LA MAQUETTE, ET POURQUOI :
 *   · « Français / English » — l'application n'a aucun système de traduction ; la ligne dit la
 *     langue réelle au lieu d'en proposer une qui n'existe pas.
 *   · « Clair / Sombre / Système » — l'affichage suit le téléphone ; aucun réglage ne le force
 *     dans l'application native. La ligne dit l'état réel.
 *   · « Réduire les animations » — c'est le réglage du SYSTÈME qui est lu (`useMouvement`) ;
 *     un second interrupteur ici le contredirait.
 *   · « Nouvelle opportunité » et « Par e-mail » — aucun canal ne les envoie : désactivés, dits.
 */
export default function Preferences() {
  const t = useToken();
  const scheme = useScheme();
  const { reduit } = useMouvement();
  const telechargements = useResumeTelechargements();
  const { bandeau, montrer } = useBandeau();
  const [reprise, setReprise] = usePreference('notif.reprise', true);
  const [serie, setSerie] = usePreference('notif.serie', true);
  const [club, setClub] = usePreference('notif.club', true);
  const [exportEnCours, setExportEnCours] = useState(false);
  const verrou = useVerrou();

  async function basculerVerrou() {
    if (verrou.actif) {
      await verrou.desactiver();
      return;
    }
    const verdict = await verrou.activer();
    if (!verdict.ok) montrer('stop', "Le verrou n'a pas été posé", verdict.motif);
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

  return (
    <Screen espace="hub" territory="transforme" retour="Profil" titre="Préférences">
      {bandeau}
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
          titre="Nouvelle opportunité"
          sous="aucun canal ne l'envoie encore"
          droite={<Switch disabled label="Nouvelle opportunité — indisponible" />}
        />
        <Ligne
          titre="Par e-mail"
          sous="aucun canal d'envoi n'existe encore"
          droite={<Switch disabled label="Par e-mail — indisponible" />}
        />
      </Liste>

      {/* Ce bloc affirmait jadis « Autorisées sur cet appareil » pour une permission que rien ne
          demande. Il dit ce qui est (voir l'historique du Profil). */}
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
              Ces choix sont gardés sur ce téléphone. Les notifications n'existent pas encore :
              rien ne t'est envoyé pour l'instant, et {isIOS ? 'iOS' : 'Android'} ne t'a rien demandé.
            </Body>
          </View>
        </View>
      </Surface>

      <Rubrique>Langue et apparence</Rubrique>
      <Liste>
        <Ligne icone="languages" titre="Langue" sous="l'application est en français" valeur="Français" />
        <Ligne icone={scheme === 'dark' ? 'moon' : 'sun'} titre="Apparence" sous="suit ton téléphone" valeur={scheme === 'dark' ? 'Sombre' : 'Clair'} />
        <Ligne icone="zap" titre="Animations" sous="réglage « réduire les animations » du téléphone" valeur={reduit ? 'Réduites' : 'Normales'} />
      </Liste>

      <Rubrique>Sur cet appareil</Rubrique>
      <Liste>
        <Ligne
          icone="lock"
          titre={verrou.capacite?.etat === 'pret' ? `Entrer avec ${verrou.capacite.geste}` : 'Entrer sans mot de passe'}
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
      </Liste>

      <Rubrique>Tes données</Rubrique>
      <Liste>
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
    </Screen>
  );
}

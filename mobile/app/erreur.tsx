import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Body, Button, Display, Eyebrow, Icon, Mesh, Num, Surface, useScheme, useToken,
} from '../ds';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * L'ERREUR — MOTIF, CONSÉQUENCE, SORTIE. DANS CET ORDRE, ET JAMAIS D'EXCUSE.
 *
 * L'ordre n'est pas une préférence de rédaction. Quelqu'un devant un écran cassé se demande
 * trois choses, dans cet ordre exact : qu'est-ce qui s'est passé, qu'est-ce que ça me coûte,
 * qu'est-ce que je fais maintenant. Un « Oups, quelque chose s'est mal passé » ne répond à
 * aucune des trois, et il en ajoute une quatrième : est-ce que quelqu'un sait, au moins ?
 *
 * PAS DE SECOUSSE, PAS DE REBOND. Le système l'écrit pour les champs en erreur — « elle
 * ajoute du stress et ne dit pas ce qui est faux » — et la raison vaut d'autant plus sur un
 * écran entier. Rien n'est animé ici.
 *
 * ⚠️ ET L'ÉCRAN N'INVENTE PAS SON MOTIF. Un motif est une information que seul l'appelant
 * détient : sans lui, l'écran dit qu'il ne l'a pas reçu, ce qui est déjà un motif — celui
 * d'aller corriger l'appel. Écrire « une erreur est survenue » à la place remplirait le trou
 * en le rendant invisible.
 *
 * LA RÉFÉRENCE D'INCIDENT NE S'AFFICHE QUE SI ELLE EXISTE. Une référence inventée pour faire
 * sérieux est pire qu'aucune : quelqu'un la dicte au support, et le support ne trouve rien.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
export default function Erreur() {
  const t = useToken();
  const scheme = useScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { titre, motif, consequence, sortie, libelle, incident, survenu } = useLocalSearchParams<{
    titre?: string;
    motif?: string;
    consequence?: string;
    /** La route à rejouer. Absente, la sortie est le retour — jamais un bouton inerte. */
    sortie?: string;
    libelle?: string;
    incident?: string;
    survenu?: string;
  }>();

  const brut = survenu ? new Date(survenu) : null;
  const quand = brut !== null && !Number.isNaN(brut.getTime()) ? brut : null;

  /*
    L'ENCRE DE LA PASTILLE SUIT LE MODE, comme le ton orange du bouton suit `inkFixed`.
    `stop` vaut #B4231F en clair et #FF8A80 en nuit : du blanc dessus passe en clair et tombe
    à 2,2:1 en nuit. On prend donc le fond de nuit comme encre là où la teinte s'éclaircit.
  */
  const encre = scheme === 'dark' ? t('night') : t('paperFixed');

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="forme" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 28, paddingHorizontal: 18, paddingBottom: insets.bottom + 40,
          flexGrow: 1, justifyContent: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{
          width: 70, height: 70, borderRadius: 22,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: t('stop'),
        }}>
          <Icon name="alert" size={30} color={encre} strokeWidth={2.4} />
        </View>

        <View style={{ marginTop: 24 }}>
          <Display size="sm">{titre ?? "Ça n'a pas chargé."}</Display>
        </View>

        <Surface level="flat" style={{ marginTop: 18, padding: 18 }}>
          <Eyebrow>Le motif</Eyebrow>
          <Body style={{ marginTop: 8, fontSize: 13.5 }}>
            {motif ?? "L'écran qui t'a amené ici n'a pas transmis de motif. C'en est un : la route d'erreur a été ouverte sans dire ce qui a échoué, et c'est cet appel-là qu'il faut corriger."}
          </Body>

          <View style={{ height: 1, backgroundColor: t('borderHair'), marginVertical: 14 }} />

          <Eyebrow>La conséquence</Eyebrow>
          <Body style={{ marginTop: 8, fontSize: 13.5 }}>
            {consequence ?? "Rien n'a été écrit. Cet écran n'enregistre pas et ne supprime pas : ce qui était fait avant reste fait, et ce que tu venais de tenter n'a pas eu lieu."}
          </Body>
        </Surface>

        {/* ── LA SORTIE ───────────────────────────────────────────────────────────────── */}
        <Button
          tone="forme"
          label={libelle ?? 'Réessayer'}
          onPress={() => {
            // Réessayer, c'est REJOUER quelque chose. Sans route à rejouer, le bouton
            // ramènerait sur cet écran — donc il ramène là d'où l'on vient, ce qui est la
            // seule action que cet écran peut garantir.
            if (sortie) router.replace(sortie);
            else router.back();
          }}
          style={{ marginTop: 18 }}
        />
        <Button
          tone="quiet"
          label="Revenir en arrière"
          onPress={() => router.back()}
          style={{ marginTop: 10 }}
        />

        {incident ? (
          <View style={{ marginTop: 14, alignItems: 'center' }}>
            <Num
              value={incident}
              source={{ cite: "référence émise par le serveur au moment de l'incident" }}
              asOf={quand ?? new Date(0)}
              style={{ fontSize: 11, fontWeight: '400', color: t('textMuted') }}
            />
            {quand !== null && (
              <Body muted style={{ marginTop: 4, fontSize: 11 }}>
                Dicte-la au support : elle retrouve cette panne-ci, pas une autre.
              </Body>
            )}
          </View>
        ) : (
          <Body muted style={{ marginTop: 14, fontSize: 11, textAlign: 'center' }}>
            Aucune référence d'incident n'a été émise pour cette panne. Il n'y en a donc pas à
            donner au support.
          </Body>
        )}
      </ScrollView>
    </View>
  );
}

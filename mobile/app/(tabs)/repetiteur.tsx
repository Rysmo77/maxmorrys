import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  Body, Button, Display, Eyebrow, Icon, LessonRow, Mesh, Num, Surface, tutorNom, useToken,
} from '../../ds';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LE RÉPÉTITEUR — et son nom n'est pas le nôtre.
 *
 * Cet onglet s'appelle « Répétiteur » par défaut, et porte le nom que la personne lui a donné
 * dès qu'elle en a choisi un. Le titre de l'écran le reprend donc de `tutorNom()`, comme la
 * barre : deux endroits qui écriraient le même nom séparément finiraient par ne plus l'écrire
 * pareil. C'est exactement le défaut trouvé onze fois au web.
 *
 * ⚠️ « Rysmo » N'EST PAS SON NOM. C'est le nom de cette application. Les confondre dans un
 * libellé rendrait le renommage par personne inintelligible — la personne aurait renommé son
 * répétiteur et lirait encore le nom du produit.
 *
 * CE QUE CET ÉCRAN REND, ET CE QU'IL NE REND PAS. La maquette dessine une conversation :
 * bulles, panneau de quota, composeur. Deux des trois ne peuvent pas être rendus honnêtement
 * ici, et pour des raisons différentes :
 *
 *   • LES BULLES demanderaient un échange. Une réponse fabriquée est une réponse à laquelle
 *     on fait confiance — c'est le pire endroit du produit pour un faux, pire qu'un cours ou
 *     qu'un message de Club, parce qu'on agit dessus.
 *   • LE QUOTA demanderait un relevé. `QuotaMeter` dessine des segments, donc AFFIRME un
 *     total : cinq segments diraient « tu as droit à cinq questions », ce qui dépend de
 *     l'abonnement de la personne. Sans lecture, le compte passe par `<Num>` — qui, lui, sait
 *     dire qu'il ne sait pas.
 *   • LE COMPOSEUR, lui, existe pour de bon : il ouvre la conversation du site dans le
 *     navigateur système, avec la session. Même geste qu'AD-11 pour le paiement — déléguer au
 *     web ce que le natif ne tient pas encore, plutôt qu'un champ qui n'envoie nulle part.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
const WEB_REPETITEUR = 'https://maxmorrys.me/mon-espace/repetiteur';

export default function Repetiteur() {
  const t = useToken();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [ouverture, setOuverture] = useState(false);
  const nom = tutorNom();

  async function ouvrirLaConversation() {
    setOuverture(true);
    try {
      await WebBrowser.openBrowserAsync(WEB_REPETITEUR);
    } finally {
      setOuverture(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="transforme" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 28, paddingHorizontal: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Eyebrow>Ton tuteur</Eyebrow>
        <Display lines={[`${nom},`, 'quand tu bloques.']} style={{ marginTop: 6 }} />
        <Body muted style={{ marginTop: 12 }}>
          Il répond sur ce que tu es en train d'apprendre, pas sur tout. Tu peux le renommer :
          c'est ton répétiteur, il porte le nom que tu lui donnes.
        </Body>

        {/* ── LE PANNEAU DE QUOTA ────────────────────────────────────────────────────── */}
        <Surface level="flat" style={{ marginTop: 20, padding: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Body style={{ fontWeight: '700', flex: 1 }}>Ce qu'il te reste aujourd'hui</Body>
            {/*
              `new Date(0)` avec une valeur nulle : la façon dont `StatTile` le fait. Une date
              est obligatoire pour un nombre — donc quand il n'y a pas de nombre, il n'y a pas
              de date à donner, et c'est le repli qui parle.
            */}
            <Num value={null} source="server" asOf={new Date(0)} fallback="quota non relevé" />
          </View>
          <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
            Le compte de questions se lit sur ton compte, et ce port ne le lit pas encore. Il
            n'est pas estimé en attendant : un quota affiché faux se découvre au moment
            précis où tu comptais sur lui. Il se remet à zéro à minuit, et un pack ne se périme
            pas.
          </Body>
        </Surface>

        {/* ── LE COMPOSEUR ───────────────────────────────────────────────────────────── */}
        <Surface level="flat" style={{ marginTop: 14, padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="chat" size={20} color={t('ink2')} />
            <Body style={{ flex: 1, fontWeight: '700' }}>Pose-lui ta question</Body>
          </View>
          <Body muted style={{ marginTop: 8 }}>
            La conversation tourne sur le site : elle s'ouvre dans ton navigateur, avec ta
            session, et tu reviens ici juste après. Aucun échange n'est simulé ici — une
            réponse fabriquée serait une réponse à laquelle tu ferais confiance.
          </Body>
          <Button
            tone="transforme"
            label={ouverture ? 'Ouverture…' : `Ouvrir ${nom.toLowerCase()}`}
            disabled={ouverture}
            onPress={() => void ouvrirLaConversation()}
            style={{ marginTop: 16 }}
          />
        </Surface>

        {/* ── SON NOM ET SA MÉMOIRE ──────────────────────────────────────────────────── */}
        <Surface level="flat" style={{ marginTop: 14, paddingVertical: 6, paddingHorizontal: 18 }}>
          <LessonRow
            icon={<Icon name="dots" size={14} color={t('ink2')} />}
            title="Son nom, et ce qu'il retient de toi"
            meta="renommer · mémoire de profil"
            trailing={<Icon name="forward" size={16} color={t('ink3')} strokeWidth={2.4} />}
            onPress={() => router.push('/memoire')}
            last
          />
        </Surface>

        <Surface level="truth" style={{ marginTop: 14, padding: 18 }}>
          <Eyebrow>Ce qu'il ne fait pas</Eyebrow>
          <Body muted style={{ marginTop: 6 }}>
            Il ne corrige pas tes devoirs à ta place et ne remplace pas la leçon. Quand il ne
            sait pas, il le dit — c'est la seule façon de pouvoir le croire quand il sait.
          </Body>
        </Surface>
      </ScrollView>
    </View>
  );
}

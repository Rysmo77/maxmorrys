import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import {
  Body, Button, ChatBubble, ChipRow, Display, Eyebrow, Field, Screen, Segmented, Surface,
  TUTOR_DEFAUT, isIOS, useBandeau, useToken, useTutorNom, Rubrique,
} from '../ds';
import { ErreurAppel, reglerLeRepetiteur } from '../donnees';
import { useSession } from '../donnees/session';

/**
 * ══ 07 · DONNE-LUI UN NOM ══ — dernier écran du premier lancement (maquette Rysmo-iOS-07 ;
 * PRD rév. 6, C-04 : « Rysmo IA » par défaut, renommable, 40 caractères).
 *
 * LE NOM EST RÉEL : il s'écrit dans le profil (`reglerLeRepetiteur`), comme depuis l'écran de
 * mémoire. L'APPARENCE ET LE TON ne le sont pas encore — le profil n'a pas de champ pour eux.
 * Ils pilotent l'APERÇU, et l'écran dit qu'ils ne sont pas enregistrés : un réglage qui
 * prétendrait suivre la personne sans être rangé nulle part serait perdu au redémarrage.
 */
const PROPOSITIONS = ['Rysmo IA', 'Prof', 'Coach', 'Tonton'] as const;
const TONS = ['Encourageant', 'Direct', 'Patient'] as const;
const LONGUEURS = ['Réponses courtes', 'Détaillées'] as const;
const EXEMPLES: Record<(typeof TONS)[number], string> = {
  Encourageant: "Bonne idée de commencer par ta fiche Google. On la relit ensemble ? Tu es plus près du but que tu ne le crois.",
  Direct: 'Ta fiche Google d\'abord. Trois choses à dire : quoi, où, comment te joindre. On commence ?',
  Patient: "Prenons ta fiche Google pas à pas. D'abord, dis-moi ce que tu vends — on verra le reste ensuite, sans se presser.",
};

export default function Nommer() {
  const t = useToken();
  const tuteur = useTutorNom();
  const session = useSession();
  const { bandeau, montrer } = useBandeau();
  const [nom, setNom] = useState(tuteur);
  const [teinte, setTeinte] = useState<string>('mmViolet');
  const [ton, setTon] = useState<(typeof TONS)[number]>('Encourageant');
  const [longueur, setLongueur] = useState<(typeof LONGUEURS)[number]>('Réponses courtes');
  const [enCours, setEnCours] = useState(false);
  const affiche = nom.trim() || TUTOR_DEFAUT;
  const exemple = longueur === 'Détaillées' ? `${EXEMPLES[ton]} Je te montre ensuite un exemple complet, phrase par phrase.` : EXEMPLES[ton];
  const APPARENCES = [
    { cle: 'mmViolet', nom: 'violet' }, { cle: 'mmBleu', nom: 'bleu' }, { cle: 'mmOrange', nom: 'orange' },
    { cle: 'mmTeal', nom: 'teal' }, { cle: 'mmCorail', nom: 'corail' }, { cle: 'ink', nom: 'encre' },
  ] as const;

  async function continuer() {
    const net = nom.trim();
    if (session.phase === 'connectee' && net !== tuteur && !(net === '' && tuteur === TUTOR_DEFAUT)) {
      setEnCours(true);
      try {
        await reglerLeRepetiteur({ nom: net });
      } catch (erreur: unknown) {
        setEnCours(false);
        montrer('stop', "Le nom n'a pas été enregistré", erreur instanceof ErreurAppel ? erreur.motif : 'Réessaie dans un moment.');
        return;
      }
    }
    router.replace('/espace');
  }

  return (
    <Screen espace="ia" territory="transforme" retour="Retour" titre={isIOS ? undefined : 'Ton assistant'}>
      {bandeau}
      <Eyebrow style={{ marginTop: 6 }}>Ton assistant</Eyebrow>
      <Display size={32} lines={['Donne-lui un nom.']} style={{ marginTop: 6 }} />
      <Body muted style={{ marginTop: 10, fontSize: 14.5, lineHeight: 22 }}>
        Il t'aide sur tes leçons, tes missions et tes questions de business. Choisis comment il
        s'appelle, à quoi il ressemble et comment il te parle.
      </Body>

      <Surface level="flat" style={{ marginTop: 16, padding: 16 }}>
        <Eyebrow>Aperçu</Eyebrow>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'flex-start' }}>
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: t(teinte as 'mmViolet') }} />
          <ChatBubble from="ai" auteur={affiche} style={{ flex: 1 }}>{exemple}</ChatBubble>
        </View>
      </Surface>

      <Field
        label="Comment tu l'appelles"
        value={nom}
        onChangeText={setNom}
        maxLength={40}
        autoCapitalize="words"
        hint={`${nom.length}/40 · Par défaut : ${TUTOR_DEFAUT}. Le nom ne change que pour toi ; Rysmo reste le nom de l'application.`}
        style={{ marginTop: 16 }}
      />
      <ChipRow options={PROPOSITIONS} value={PROPOSITIONS.find((p) => p === nom.trim()) ?? ''} onChange={setNom} style={{ marginTop: 10 }} />

      <Rubrique>Son apparence</Rubrique>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        {APPARENCES.map((a) => (
          <Pressable
            key={a.cle}
            accessibilityRole="button"
            accessibilityLabel={`Apparence ${a.nom}`}
            accessibilityState={{ selected: teinte === a.cle }}
            onPress={() => setTeinte(a.cle)}
            style={{
              width: 40, height: 40, borderRadius: 20, backgroundColor: t(a.cle as 'mmViolet'),
              borderWidth: teinte === a.cle ? 3 : 0, borderColor: t('textBody'),
            }}
          />
        ))}
      </View>

      <Rubrique>Sa façon de te parler</Rubrique>
      <ChipRow options={TONS} value={ton} onChange={(o) => setTon(o as (typeof TONS)[number])} />
      <Segmented options={LONGUEURS} value={longueur} onChange={(o) => setLongueur(o as (typeof LONGUEURS)[number])} style={{ marginTop: 12 }} />
      <Body muted style={{ marginTop: 10, fontSize: 12, lineHeight: 17 }}>
        L'apparence et le ton règlent l'aperçu ; ils ne sont pas encore enregistrés dans ton profil.
        Le nom, lui, l'est{session.phase === 'connectee' ? '' : ' dès que tu te connectes'}.
      </Body>

      <Button tone="transforme" label="Continuer" style={{ marginTop: 22 }} disabled={enCours} onPress={() => { void continuer(); }} />
      <Button tone="ghost" label="Plus tard" style={{ marginTop: 8 }} onPress={() => router.replace('/espace')} />
    </Screen>
  );
}

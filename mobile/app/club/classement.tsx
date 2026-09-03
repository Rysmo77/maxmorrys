import { View } from 'react-native';
import {
  Avatar, Body, Display, Eyebrow, Num, ProgressBar, SansDonnees, Surface, Tag, useToken, veil,
} from '../../ds';
import { ClubScreen } from './_layout';
import { CLASSEMENT, RELEVE, SOURCE } from '../../contenu/demo';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ── CLUB · LE CLASSEMENT ── **PAR VAGUE D'ARRIVÉE, JAMAIS ABSOLU.**
 *
 * C'est la décision entière de l'écran, et elle vient d'un fait arithmétique : dans un
 * classement absolu, **quelqu'un qui arrive en novembre ne peut pas rattraper quelqu'un arrivé
 * en février.** Le classement mesure alors l'ANCIENNETÉ et rien d'autre — et il décourage
 * précisément les nouveaux, c'est-à-dire les seuls qu'il pourrait aider.
 *
 * Chacun est donc classé parmi ceux arrivés en même temps que lui. Le rang redevient une
 * information sur ce qu'on fait, pas sur la date à laquelle on a payé.
 *
 * ── ET LES POINTS SE GAGNENT EN AIDANT, PAS EN CONSOMMANT ────────────────────────────────
 * Écrire une réponse qui sert en rapporte ; lire n'en rapporte pas. Un classement qui
 * récompense la présence produit des gens présents ; celui-ci essaie de produire des gens
 * utiles. C'est écrit ici parce qu'un système de points dont la règle est cachée se lit
 * toujours comme truqué.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export default function ClubClassement() {
  const t = useToken();

  if (CLASSEMENT === null) {
    return (
      <ClubScreen titre="Classement">
        <Display size={24} lines={['Ton rang', "n'est pas calculé."]} />
        <SansDonnees
          quoi="ton classement"
          origine="du serveur, qui compte les contributions"
          degat="Un rang inventé classe des gens les uns par rapport aux autres. Il n'y a pas de version approximative d'une position."
          style={{ marginTop: 20 }}
        />
        <Surface level="truth" style={{ marginTop: 16, padding: 15 }}>
          <Eyebrow>La règle, elle, ne dépend d'aucun relevé</Eyebrow>
          <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
            Le classement est par VAGUE D'ARRIVÉE, jamais absolu : quelqu'un qui arrive en
            novembre ne rattrapera jamais quelqu'un arrivé en février, et un classement absolu
            mesurerait l'ancienneté. Les points se gagnent en aidant, pas en se connectant.
          </Body>
        </Surface>
      </ClubScreen>
    );
  }
  const classement = CLASSEMENT;

  return (
    <ClubScreen titre="Classement">
      <Eyebrow>{classement.vague}</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <View>
            <Body muted style={{ fontSize: 12.5 }}>Ton rang dans ta vague</Body>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <Num value={classement.rang} source={SOURCE} asOf={RELEVE} style={{ fontSize: 34 }} />
              <Body muted style={{ fontSize: 14 }}>
                sur <Num value={classement.surCombien} source={SOURCE} asOf={RELEVE} style={{ fontSize: 14 }} />
              </Body>
            </View>
          </View>
          <Tag tone="ok">+{classement.semaine} cette semaine</Tag>
        </View>
        <ProgressBar
          value={(1 - (classement.rang - 1) / classement.surCombien) * 100}
          territory="transforme"
          style={{ marginTop: 14 }}
        />
        <Body muted style={{ fontSize: 11.5, marginTop: 8, color: t('textFaint') }}>
          Tu es comparée aux <Num value={classement.surCombien} source={SOURCE} asOf={RELEVE} style={{ fontSize: 11.5 }} />
          {' '}personnes arrivées en même temps que toi — pas à tout le Club.
        </Body>
      </Surface>

      <Eyebrow style={{ marginTop: 22 }}>Ta vague</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 16, paddingVertical: 4 }}>
        {classement.lignes.map((l) => (
          <View
            key={l.rang}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
              paddingHorizontal: l.moi ? 12 : 0,
              marginHorizontal: l.moi ? -12 : 0,
              borderRadius: l.moi ? 14 : 0,
              backgroundColor: l.moi ? veil(t('mmViolet'), 0.1) : 'transparent',
            }}
          >
            <Num value={l.rang} source={SOURCE} asOf={RELEVE} style={{ fontSize: 13, width: 20 }} />
            <Avatar initials={l.initiales} size={32} />
            <Body style={{ flex: 1, fontWeight: l.moi ? '700' : '500' }}>{l.nom}</Body>
            <Num value={l.points} source={SOURCE} asOf={RELEVE} unit="pts" style={{ fontSize: 12.5 }} />
          </View>
        ))}
      </Surface>

      <Surface level="truth" style={{ marginTop: 16, padding: 15 }}>
        <Eyebrow>Pourquoi par vague, et pas un classement général</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Parce que quelqu'un qui arrive en novembre ne rattrapera jamais quelqu'un arrivé en
          février : un classement absolu mesurerait l'ancienneté, et découragerait exactement
          les gens qu'il devrait aider.
        </Body>
      </Surface>

      <Surface level="flat" style={{ marginTop: 12, padding: 17 }}>
        <Eyebrow>Comment les points se gagnent</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          En aidant : une réponse qui sert, une mission partagée, un compte rendu d'atelier.
          Lire n'en rapporte pas, et se connecter tous les jours non plus — un classement qui
          récompense la présence produit des gens présents, pas des gens utiles.
        </Body>
      </Surface>
    </ClubScreen>
  );
}

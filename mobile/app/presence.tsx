import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import {
  Body, Button, Display, Eyebrow, Icon, IconButton, Num, PayOption, PriceBlock, Screen,
  StepDots, Surface, TerritoryCard, isIOS, useToken,
} from '../ds';
import { PACK, QUESTION_TPE, RELEVE, SOURCE } from '../contenu/reference';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ 4 · PRÉSENCE DIGITALE ══ — L'ANCRAGE EST DÉSAMORCÉ **AVANT** LE PRIX.
 *
 * C'est la décision de l'écran, et elle est contre-intuitive : on donne la réponse à la
 * question de comparaison AVANT de faire remplir quoi que ce soit. « Une agence me vend un
 * site 400 000 F une fois. Toi c'est combien la première année ? » — la personne l'a en tête
 * dès la première seconde, et tant qu'elle n'a pas la réponse, elle lit le reste en cherchant
 * le piège.
 *
 * **AUCUNE RÈGLE DE MAGASIN NE S'APPLIQUE ICI.** Un pack se contracte HORS de l'application :
 * ce n'est pas du contenu numérique consommé dedans. Ni App Store 3.1.1 ni Play Payments ne
 * le touchent — d'où un écran qui, contrairement aux formations et au Club, n'a pas de mur.
 * Le devis part sur WhatsApp, comme sur le web.
 *
 * ── « JE NE SAIS PAS » EST UNE RÉPONSE VALABLE ───────────────────────────────────────────
 * Elle mène à une recommandation, comme les deux autres. Un questionnaire qui punit
 * l'incertitude perd exactement les gens qu'il devait aider.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export default function Presence() {
  const t = useToken();
  const [reponse, setReponse] = useState<string>(QUESTION_TPE.reponses[0]);

  return (
    <Screen
      territory="digitalise"
      retour="Profil"
      titre={isIOS ? undefined : 'Présence Digitale'}
      droite={
        <IconButton
          label="Écrire sur WhatsApp"
          onPress={() => { void openBrowserAsync('https://wa.me/221000000000'); }}
        >
          <Icon name="chat" size={17} color={t('textBody')} strokeWidth={2} />
        </IconButton>
      }
    >
      <Eyebrow style={{ marginTop: 6 }}>Je te digitalise</Eyebrow>
      <Display size={28} lines={['TA BOUTIQUE,', 'TROUVABLE', 'SUR GOOGLE.']} style={{ marginTop: 8 }} />
      <Body muted style={{ marginTop: 12, fontSize: 14.5, lineHeight: 22 }}>
        Tu vends déjà sur WhatsApp. Je m'occupe de ce que tu ne peux pas faire depuis ton
        téléphone.
      </Body>

      {/* ── L'ANCRAGE, DÉSAMORCÉ AVANT TOUT LE RESTE ───────────────────────────────────── */}
      <Surface level="hero" style={{ marginTop: 18, padding: 19 }}>
        <Eyebrow style={{ color: t('mmTealT') }}>La question que tout le monde pose</Eyebrow>
        <Body style={{ fontWeight: '700', fontSize: 15, lineHeight: 20, marginTop: 7 }}>
          « Une agence me vend un site{' '}
          <Num value={PACK.ancrage} source={SOURCE} asOf={RELEVE} unit="F" style={{ fontSize: 15 }} />
          {' '}une fois. Toi c'est combien la première année ? »
        </Body>
        <Body muted style={{ fontSize: 13.5, lineHeight: 20, marginTop: 11 }}>
          Réponse avant que tu remplisses quoi que ce soit :{' '}
          <Num value={PACK.prix} source={SOURCE} asOf={RELEVE} unit="F" style={{ fontSize: 13.5 }} />
          {' '}pour le pack seul, une fois. L'accompagnement mensuel est une décision séparée,
          que tu prends après la mise en ligne — pas maintenant.
        </Body>
      </Surface>

      {/* ── TROIS QUESTIONS ────────────────────────────────────────────────────────────── */}
      <Eyebrow style={{ marginTop: 24 }}>Trois questions, une recommandation</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, padding: 19 }}>
        <StepDots total={QUESTION_TPE.total} current={QUESTION_TPE.etape} style={{ marginBottom: 16 }} />
        <Body style={{ fontWeight: '700', fontSize: 15.5 }}>{QUESTION_TPE.question}</Body>
        <View style={{ gap: 9, marginTop: 14 }}>
          {QUESTION_TPE.reponses.map((o) => (
            <PayOption
              key={o}
              title={o}
              on={reponse === o}
              onPress={() => setReponse(o)}
              style={{ minHeight: 56 }}
            />
          ))}
        </View>
        <Body muted style={{ fontSize: 11.5, marginTop: 13, color: t('textFaint') }}>
          « Je ne sais pas » est une réponse valable : elle mène aussi à une recommandation.
        </Body>
      </Surface>

      {/* ── LA RECOMMANDATION ──────────────────────────────────────────────────────────── */}
      <View style={{ marginTop: 18 }}>
        <TerritoryCard first territory="digitalise" meta="Recommandé pour toi" title={PACK.nom}>
          <View style={{
            flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
            gap: 12, marginTop: 15,
          }}>
            <PriceBlock
              amount={PACK.prix}
              strike={PACK.prixBarre}
              source={SOURCE}
              asOf={RELEVE}
              size={25}
              note="Une fois · lancement"
            />
            <Button
              tone="digitalise"
              size="sm"
              label="Mon devis"
              onPress={() => router.push('/devis')}
            />
          </View>
        </TerritoryCard>
      </View>

      <Body muted style={{ fontSize: 11.5, lineHeight: 18, marginTop: 14, color: t('textFaint') }}>
        Un pack se contracte hors de l'application : ce n'est pas du contenu numérique consommé
        dedans, donc aucune règle de magasin ne s'y applique. Le devis part sur WhatsApp.
      </Body>
    </Screen>
  );
}

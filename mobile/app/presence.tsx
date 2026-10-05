import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import {
  Body, Button, Display, Eyebrow, Field, Icon, IconButton, Num, PayOption, PriceBlock, SansDonnees, Screen, StepDots, Surface, TerritoryCard, isIOS, useToken,
} from '../ds';
import { PACK_PRESENCE, PRESENCE_ARRETEE, PRESENCE_SOURCE, QUESTION_PRESENCE } from '../contenu/engagement';
import { FORME_REFERENCE, OFFRE } from '../contenu/termes';

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
/*
 * ⚠️ CE BOUTON POINTAIT SUR UN NUMÉRO DE REMPLACEMENT — un `wa.me` suivi de neuf zéros. Un
 * appel à l'action principal qui ouvre un lien mort est un rejet en revue (2.1), et c'est le
 * genre de défaut qui survit longtemps parce qu'il a l'air d'une vraie URL.
 *
 * Il ouvre maintenant la page de contact du site, qui existe et répond. Le libellé a suivi :
 * annoncer WhatsApp pour ouvrir autre chose serait un second mensonge posé sur le premier.
 * Le jour où le vrai numéro est connu, il remplace cette constante et le libellé revient.
 */
const CONTACT = 'https://maxmorrys.me/contact';

export default function Presence() {
  const t = useToken();
  const [reponse, setReponse] = useState<string>(QUESTION_PRESENCE.reponses[0]);
  const [saisie, setSaisie] = useState('');
  /* Les espaces d'un copier-coller et la casse ne font pas une autre référence. */
  const reference = saisie.replace(/\s+/g, '').toUpperCase();
  const referenceValide = FORME_REFERENCE.test(reference);

  return (
    <Screen
      territory="digitalise"
      retour="Profil"
      titre={isIOS ? undefined : 'Présence Digitale'}
      droite={
        <IconButton
          label="Nous écrire"
          onPress={() => { void openBrowserAsync(CONTACT); }}
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

      {/* ── L'ANCRAGE, DÉSAMORCÉ AVANT TOUT LE RESTE — et il ne se désamorce qu'avec un
             CHIFFRE. Sans prix, la question reste posée et la réponse manque : mieux vaut le
             dire que répondre « à partir de », qui rouvre exactement l'ancrage. ── */}
      {PACK_PRESENCE === null ? (
        <SansDonnees
          quoi="le prix du pack"
          origine="du serveur"
          degat="Tout cet écran existe pour désamorcer une comparaison de prix AVANT que tu remplisses quoi que ce soit. Un montant approximatif la rouvrirait au lieu de la fermer."
          style={{ marginTop: 18 }}
        />
      ) : (
      <Surface level="hero" style={{ marginTop: 18, padding: 19 }}>
        <Eyebrow style={{ color: t('mmTealT') }}>La question que tout le monde pose</Eyebrow>
        <Body style={{ fontWeight: '700', fontSize: 15, lineHeight: 20, marginTop: 7 }}>
          {/* La phrase d'un client, pas un montant de la grille : elle reste du TEXTE. L'écrire
              en `Num` sourcé « grille publiée » attribuait à l'offre un prix qu'elle n'a pas. */}
          « Une agence me vend un site 400 000 F une fois. Toi c'est combien la première année ? »
        </Body>
        <Body muted style={{ fontSize: 13.5, lineHeight: 20, marginTop: 11 }}>
          Réponse avant que tu remplisses quoi que ce soit :{' '}
          <Num value={PACK_PRESENCE.prix} source={PRESENCE_SOURCE} asOf={PRESENCE_ARRETEE} unit="F" style={{ fontSize: 13.5 }} />
          {' '}hors taxes pour le pack seul, une fois. L'accompagnement mensuel est une décision séparée,
          que tu prends après la mise en ligne — pas maintenant.
        </Body>
      </Surface>
      )}

      {/* ── TROIS QUESTIONS ────────────────────────────────────────────────────────────── */}
      {QUESTION_PRESENCE ? (
      <>
      <Eyebrow style={{ marginTop: 24 }}>Trois questions, une recommandation</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, padding: 19 }}>
        <StepDots total={QUESTION_PRESENCE.total} current={QUESTION_PRESENCE.etape} style={{ marginBottom: 16 }} />
        <Body style={{ fontWeight: '700', fontSize: 15.5 }}>{QUESTION_PRESENCE.question}</Body>
        <View style={{ gap: 9, marginTop: 14 }}>
          {QUESTION_PRESENCE.reponses.map((o) => (
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
      </>
      ) : null}

      {/* ── LA RECOMMANDATION ──────────────────────────────────────────────────────────── */}
      {PACK_PRESENCE === null ? null : (
      <View style={{ marginTop: 18 }}>
        <TerritoryCard first territory="digitalise" meta="Recommandé pour toi" title={PACK_PRESENCE.nom}>
          <View style={{
            flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
            gap: 12, marginTop: 15,
          }}>
            <PriceBlock
              amount={PACK_PRESENCE.prix}
              source={PRESENCE_SOURCE}
              asOf={PRESENCE_ARRETEE}
              size={25}
              note="Hors taxes · une fois · lancement"
            />
            {/* ⚠️ CE BOUTON DISAIT « Mon devis » ET MENAIT À UNE IMPASSE. `/devis` affiche un
                document opposable — référence, dates, montant figé à l'émission — et AUCUNE
                collection ne stocke de devis : ni `quotes`, ni équivalent. L'écran retombait
                donc toujours sur son état vide, en production comme ailleurs.
                Le devis se demande, il ne se consulte pas encore. Le libellé le dit, et le
                geste correspond — c'est d'ailleurs ce que la phrase sous cette carte annonce
                depuis toujours : « Le devis part sur WhatsApp ». */}
            <Button
              tone="digitalise"
              size="sm"
              label="Demander mon devis"
              onPress={() => { void openBrowserAsync(CONTACT); }}
            />
          </View>
        </TerritoryCard>
        <Body muted style={{ fontSize: 12, marginTop: 9 }}>
          Soit{' '}
          <Num value={PACK_PRESENCE.prixTtc} source={PRESENCE_SOURCE} asOf={PRESENCE_ARRETEE} unit="F" style={{ fontSize: 12 }} />
          {' '}toutes taxes comprises, TVA {OFFRE.tvaTauxPct} %.
        </Body>
      </View>
      )}

      {/* ── LE DEVIS DÉJÀ REÇU ───────────────────────────────────────────────────────────
          C'était un écran que rien n'ouvrait. Une référence mal formée ouvrirait un écran
          qui dirait « ce devis n'existe pas » — le pire des messages pour une faute de
          frappe : le bouton attend donc la bonne forme. */}
      <Eyebrow style={{ marginTop: 24 }}>Tu as déjà reçu un devis ?</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, padding: 17 }}>
        <Field
          label="Référence du devis"
          value={saisie}
          onChangeText={setSaisie}
          placeholder="DV-XXXXXXXXXXXX"
          autoCapitalize="none"
          hint={`Imprimée en haut du document. Il se consulte sans compte, et reste valable ${OFFRE.validiteJours} jours.`}
          error={saisie.trim() !== '' && !referenceValide ? 'DV- puis douze caractères, chiffres et lettres de A à F.' : undefined}
        />
        <Button
          tone="quiet"
          label="Ouvrir le devis"
          style={{ marginTop: 12 }}
          disabled={!referenceValide}
          onPress={() => router.push({ pathname: '/devis', params: { ref: reference } })}
        />
      </Surface>

      <Body muted style={{ fontSize: 11.5, lineHeight: 18, marginTop: 14, color: t('textFaint') }}>
        Un pack se contracte hors de l'application : ce n'est pas du contenu numérique consommé
        dedans, donc aucune règle de magasin ne s'y applique. Le devis part sur WhatsApp.
      </Body>
    </Screen>
  );
}

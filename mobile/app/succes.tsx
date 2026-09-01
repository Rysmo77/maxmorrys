import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Body, Button, Display, Icon, Mesh, Num, Surface, Tag, useToken } from '../ds';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE PAIEMENT ACCEPTÉ — et l'absence de mise en scène est ici une DÉCISION.
 *
 * `planche-moments.html` la formule sans ambiguïté : « Réussite de paiement — aucune mise en
 * scène. Un glyphe, un titre, et le bouton qui ouvre la première leçon : ce qui compte est la
 * leçon, pas la célébration. » Le produit n'accorde que deux moments scénarisés, l'attente de
 * paiement et l'émission du certificat, et « il n'y en aura pas un troisième ». Pas d'anneaux
 * ici, donc, pas de confettis, pas de brillance — celle-là appartient au certificat, et deux
 * mises en scène pour un même instant en annuleraient une.
 *
 * CE QUE CET ÉCRAN DOIT DIRE, dans cet ordre : ce qui a été débité, et où trouver le reçu.
 * Le second point est un engagement du produit autant qu'une indication : **il n'existe aucun
 * canal d'envoi**, donc aucun écran ne promet jamais un e-mail. Le reçu est là où la personne
 * peut aller le chercher, et on lui dit où.
 *
 * PARAMÈTRES DE ROUTE :
 *   ?montant=80750                 le montant réellement débité, tel que le serveur le renvoie
 *   &reference=MM-2K6-4831         la référence de la commande
 *   &titre=Référencement local…    la formation ouverte
 *   &lecon=Pourquoi ta boutique…   le titre de la première leçon
 *   &premierModule=22              la durée du premier module, en minutes
 *   &asOf=2026-09-01T10:00:00Z     la date de ces relevés (règle 6)
 * ═══════════════════════════════════════════════════════════════════════════════
 */
const CARRE = 70;
const RAYON = 22;

export default function Succes() {
  const t = useToken();
  const insets = useSafeAreaInsets();
  const { montant, reference, titre, lecon, premierModule, asOf } = useLocalSearchParams<{
    montant?: string; reference?: string; titre?: string; lecon?: string;
    premierModule?: string; asOf?: string;
  }>();

  const propose = asOf ? new Date(asOf) : null;
  const releve = propose && !Number.isNaN(propose.getTime()) ? propose : new Date();

  const somme = montant ? Number(montant) : Number.NaN;
  const debite = Number.isFinite(somme) ? somme : null;
  const duree = premierModule ? Number(premierModule) : Number.NaN;
  const minutes = Number.isFinite(duree) ? duree : null;
  // Le titre de la leçon si on l'a, sinon celui de la formation : le lecteur affiche ce qu'on
  // lui passe et n'invente rien de son côté.
  const premiereLecon = lecon ?? titre;

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="forme" />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingTop: insets.top + 24,
          paddingHorizontal: 18,
          paddingBottom: insets.bottom + 60,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Le glyphe, et rien qui bouge autour. */}
        <View style={{
          width: CARRE, height: CARRE, borderRadius: RAYON,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: t('mmTeal'),
          shadowColor: t('mmTeal'), shadowOpacity: 0.4, shadowRadius: 16,
          shadowOffset: { width: 0, height: 12 }, elevation: 8,
        }}>
          <Icon name="check" size={30} color={t('paperFixed')} strokeWidth={3.4} />
        </View>

        <Display size="sm" lines={["C'est à toi."]} style={{ marginTop: 24 }} />

        <Body muted style={{ marginTop: 12 }}>
          {titre ? `${titre} est ouverte.` : 'Ta formation est ouverte.'}
          {minutes !== null ? (
            <>
              {' '}Le premier module fait{' '}
              <Num value={minutes} source="server" asOf={releve} unit="minutes" style={{ fontSize: 14 }} />
              .
            </>
          ) : null}
        </Body>

        <Surface level="flat" style={{ marginTop: 22, padding: 17 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Body muted style={{ fontSize: 13 }}>Référence</Body>
            <Num
              value={reference ?? null}
              source="server"
              asOf={releve}
              fallback="non transmise"
              style={{ fontSize: 13 }}
            />
          </View>
          <View style={{
            marginTop: 10, flexDirection: 'row', alignItems: 'center',
            justifyContent: 'space-between', gap: 12,
          }}>
            <Body muted style={{ fontSize: 13 }}>Statut</Body>
            <Tag tone="ok">Payée</Tag>
          </View>
        </Surface>

        {/* L'action primaire est la LEÇON, pas la célébration. */}
        <Button
          tone="digitalise"
          label="Ouvrir la première leçon"
          style={{ marginTop: 20 }}
          onPress={() => router.push({
            pathname: '/lecon',
            params: premiereLecon ? { titre: premiereLecon } : {},
          })}
        />
        <Button
          tone="quiet"
          label="Voir mon espace"
          style={{ marginTop: 10 }}
          onPress={() => router.push('/(tabs)')}
        />

        {/* CE QUI A ÉTÉ DÉBITÉ, ET OÙ EST LE REÇU. */}
        <Body muted style={{ marginTop: 14, fontSize: 11.5, textAlign: 'center', color: t('textFaint') }}>
          {debite !== null ? (
            <>
              <Num
                value={debite}
                source="server"
                asOf={releve}
                unit="FCFA"
                style={{ fontSize: 11.5 }}
              />
              {' '}débités une fois, accès à vie.{' '}
            </>
          ) : (
            <>Le montant débité ne m'a pas été transmis à cet écran ; celui qui fait foi est sur ton reçu.{' '}</>
          )}
          Le reçu est dans ton espace. Je ne te l'envoie pas par e-mail : je n'ai aucun canal
          d'envoi, et te promettre un message qui n'arriverait jamais te ferait attendre pour rien.
        </Body>
      </ScrollView>
    </View>
  );
}

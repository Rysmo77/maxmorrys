import { router, useLocalSearchParams } from 'expo-router';
import {
  Body, Button, DocLine, Display, Eyebrow, Gradient, Icon, Num, Screen, Surface, useToken,
} from '../ds';
import { FORMATION, RELEVE, SOURCE } from '../contenu/demo';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ 2 · LE RETOUR DE PAIEMENT ══ — ET LE MOT QUI CHANGE TOUT : « C'EST À TOI ».
 *
 * CE N'EST PAS UN ÉCRAN DE SUCCÈS. L'application n'a rien encaissé — l'achat a eu lieu sur le
 * web (AD-11, App Store 3.1.1). Elle CONSTATE que l'accès est ouvert, et le titre le dit :
 * « c'est à toi », jamais « paiement accepté ». La différence n'est pas stylistique : afficher
 * la confirmation d'une transaction qu'on n'a pas faite, c'est affirmer une chose qu'on ne
 * sait pas — et l'affirmer précisément au moment où quelqu'un vient de donner de l'argent.
 *
 * AUCUNE MISE EN SCÈNE. Le système n'accorde que DEUX moments scénarisés — l'attente de
 * paiement et l'émission du certificat — et « il n'y en aura pas un troisième ». Un glyphe, un
 * titre, et le bouton qui ouvre la première leçon : ce qui compte est la leçon.
 *
 * LE REÇU N'EST PAS ICI, ET L'ÉCRAN DIT OÙ IL EST. Il est sur le site, dans « Mes paiements »,
 * parce que c'est là que la transaction a eu lieu. Le taire ferait chercher.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export default function Succes() {
  const t = useToken();
  const { titre, moyen, premierModule } = useLocalSearchParams<{
    titre?: string; moyen?: string; premierModule?: string;
  }>();

  const nom = titre ?? FORMATION?.titreCourt ?? null;
  const duree = premierModule ?? '22 minutes';

  return (
    <Screen territory="forme" center>
      <Gradient
        colors={[t('mmTeal'), t('mmBleu')]}
        radius={22}
        style={{
          width: 68, height: 68, alignItems: 'center', justifyContent: 'center',
          shadowColor: t('mmTeal'), shadowOpacity: 0.34, shadowRadius: 16,
          shadowOffset: { width: 0, height: 12 }, elevation: 8,
        }}
      >
        <Icon name="check" size={29} color={t('paperFixed')} strokeWidth={3.4} />
      </Gradient>

      <Display size={31} lines={["C'EST À TOI."]} style={{ marginTop: 24 }} />
      <Body muted style={{ marginTop: 12, fontSize: 14.5, lineHeight: 22 }}>
        Ta formation est ouverte. Le premier module fait{' '}
        <Num value={duree} source={SOURCE} asOf={RELEVE} style={{ fontSize: 14.5 }} />.
      </Body>

      <Surface level="flat" style={{ marginTop: 20, padding: 18 }}>
        {/* Le nom vient du retour de paiement. Sans lui, on ne l'invente pas : quelqu'un qui
            vient de payer doit lire CE qu'il a acheté, pas un exemple. */}
        <DocLine
          label="Formation"
          value={nom
            ? <Body style={{ fontWeight: '700', fontSize: 13.5 }}>{nom}</Body>
            : <Num value={null} source="server" asOf={RELEVE} fallback="non transmise" style={{ fontSize: 13.5 }} />}
        />
        <DocLine label="Payée sur" value="maxmorrys.me" />
        {/* Le moyen n'est affiché QUE s'il a été transmis : le deviner reviendrait à écrire
            « Wave » sur un paiement fait en Orange Money, sur un écran de reçu. */}
        <DocLine
          label="Moyen"
          value={<Num value={moyen ?? null} source="server" asOf={RELEVE} fallback="non transmis" style={{ fontSize: 13.5 }} />}
        />
        <DocLine label="Accès" value="à vie" last />
      </Surface>

      <Button
        tone="digitalise"
        label="Ouvrir la première leçon"
        style={{ marginTop: 20 }}
        onPress={() => router.replace('/lecon')}
      />
      <Button
        tone="quiet"
        label="Télécharger pour hors connexion"
        icon="download"
        style={{ marginTop: 9 }}
        onPress={() => router.push('/telechargements')}
      />

      <Surface level="truth" style={{ marginTop: 16, padding: 15 }}>
        <Eyebrow>Où est passé le reçu</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Sur le site, dans <Body style={{ fontWeight: '700', fontSize: 12.5 }}>Mes paiements</Body> —
          c'est là que la transaction a eu lieu. L'app ne l'a pas encaissée, elle constate que
          l'accès est ouvert.
        </Body>
      </Surface>
    </Screen>
  );
}

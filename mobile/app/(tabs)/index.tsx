import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import {
  Avatar, Body, Button, Display, Eyebrow, Gradient, Icon, IconButton, LessonRow, Num,
  ProgressBar, QuotaMeter, Screen, Surface, TerritoryCard, useActionGradient, useToken,
  useTutorNom,
} from '../../ds';
import { FORMATION, MOI, QUOTA, RELEVE, SOURCE, STOCKAGE } from '../../contenu/reference';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ 3 · MON ESPACE ══ — LA REPRISE EST LE PREMIER OBJET, ET ÇA NE SE NÉGOCIE PAS.
 *
 * Elle l'est parce que, au web, **la relance ne pouvait venir que de l'écran** : la plateforme
 * n'a aucun canal d'envoi. Toute la conception s'est pliée à cette contrainte — si la personne
 * ne revient pas d'elle-même, rien ne la ramène.
 *
 * CE QUI CHANGE EN NATIF TIENT DANS UNE CARTE. La notification donne enfin ce canal, donc
 * l'écran propose de l'activer — **une fois, pas à chaque ouverture**. Une carte qui redemande
 * à chaque lancement est une publicité pour soi-même, et elle se ferme sans être lue.
 *
 * ── CE QUE CET ÉCRAN N'AFFICHE PAS ────────────────────────────────────────────────────────
 * Aucun classement, aucun « tu es meilleur que 62 % des membres », aucune série qui menace de
 * se rompre en gros. La série est là, sans compte à rebours et avec son record à côté : c'est
 * un fait, pas un levier.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** « Vendredi 4 septembre ». Écrit à la main : `Intl` n'est pas garanti sur tous les moteurs. */
function dateDuJour(d: Date): string {
  const jour = JOURS[d.getDay()];
  return `${jour.charAt(0).toUpperCase()}${jour.slice(1)} ${d.getDate()} ${MOIS[d.getMonth()]}`;
}

/**
 * LA SALUTATION SUIT L'HEURE DU TÉLÉPHONE, pas une valeur figée. Le transfert écrit
 * « Bonsoir » parce que sa personne-témoin travaille après 21 h — c'est une donnée de SA
 * mémoire de profil, pas une constante du produit. Figer « Bonsoir » ici dirait bonsoir à
 * 8 h du matin.
 */
function salutation(d: Date): string {
  const h = d.getHours();
  if (h < 6) return 'Bonne nuit';
  if (h < 18) return 'Bonjour';
  return 'Bonsoir';
}

const ESPACE = [
  { href: '/paiement', glyphe: 'card' as const, titre: 'Mes paiements', meta: '1 transaction' },
  { href: '/certificats', glyphe: 'doc' as const, titre: 'Mes certificats', meta: '0 émis' },
  { href: '/telechargements', glyphe: 'download' as const, titre: 'Téléchargements', meta: `3 leçons · ${STOCKAGE.occupeCourt}` },
] as const;

export default function Espace() {
  const t = useToken();
  const g = useActionGradient();
  const tuteur = useTutorNom();
  const maintenant = new Date();

  /*
   * ⚠️ CE CHOIX NE SURVIT PAS À LA SESSION, ET C'EST DÉLIBÉRÉ tant que Firebase n'est pas là.
   * Il vit dans le PROFIL (`users/<uid>.pushAsked`), comme le nom du tuteur : un magasin local
   * créerait une seconde source de vérité à réconcilier, et la carte reviendrait sur un autre
   * appareil alors que la question a déjà été posée.
   */
  const [proposeRelance, setProposeRelance] = useState(true);

  return (
    <Screen
      territory="transforme"
      tabbar
      droite={
        <>
          <IconButton label="Notifications" badge>
            <Icon name="bell" size={17} color={t('textBody')} strokeWidth={2} />
          </IconButton>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ton profil"
            onPress={() => router.push('/(tabs)/profil')}
          >
            <Avatar initials={MOI.initiale} size={38} />
          </Pressable>
        </>
      }
    >
      <Eyebrow style={{ marginTop: 6 }}>{dateDuJour(maintenant)}</Eyebrow>
      <Display size={31} lines={[salutation(maintenant), MOI.prenom]} style={{ marginTop: 8 }} />

      {/* ── PREMIER OBJET. La reprise, avant tout le reste. ─────────────────────────────── */}
      <View style={{ marginTop: 20 }}>
        <TerritoryCard
          first
          territory="forme"
          meta={FORMATION.arret}
          title={`Leçon 5 · ${FORMATION.leconEnCours}`}
          titleSize={21}
          onPress={() => router.push('/lecon')}
        >
          <ProgressBar value={FORMATION.progression} style={{ marginTop: 14 }} />
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, marginTop: 12,
          }}>
            <Num
              value={`${FORMATION.leconsFaites} / ${FORMATION.lecons} leçons · ${FORMATION.progression} %`}
              source={SOURCE}
              asOf={RELEVE}
              style={{ fontSize: 12.5, color: t('textMuted') }}
            />
            <Button tone="primary" size="sm" label="Reprendre" onPress={() => router.push('/lecon')} />
          </View>
        </TerritoryCard>
      </View>

      {/* ── CE QUE LE WEB NE POUVAIT PAS OFFRIR ─────────────────────────────────────────── */}
      {proposeRelance ? (
        <Surface level="flat" style={{ marginTop: 14, padding: 17 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Gradient
              colors={[t('mmVioletN'), t('mmViolet')]}
              radius={12}
              style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="bell" size={17} color={t('paperFixed')} strokeWidth={2.2} />
            </Gradient>
            <View style={{ flex: 1 }}>
              <Body style={{ fontWeight: '700' }}>Je te préviens la prochaine fois ?</Body>
              <Body muted style={{ fontSize: 12.5, lineHeight: 19, marginTop: 4 }}>
                Huit jours, c'est le moment où on décroche. Une notification, et tu reprends.
              </Body>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Button
                  tone="transforme"
                  size="sm"
                  label="Activer"
                  onPress={() => { setProposeRelance(false); router.push('/permissions'); }}
                />
                <Button tone="quiet" size="sm" label="Non" onPress={() => setProposeRelance(false)} />
              </View>
            </View>
          </View>
        </Surface>
      ) : null}

      {/* ── DEUX FAITS, SANS LEVIER ─────────────────────────────────────────────────────── */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <Surface level="flat" style={{ flex: 1, padding: 16 }}>
          <Eyebrow style={{ fontSize: 10 }}>Série</Eyebrow>
          <Num value="3 j" source={SOURCE} asOf={RELEVE} style={{ fontSize: 25, marginTop: 4 }} />
          <Body muted style={{ fontSize: 11.5, color: t('textFaint') }}>record 7 j</Body>
        </Surface>
        <Surface level="flat" style={{ flex: 1, padding: 16 }}>
          <Eyebrow style={{ fontSize: 10 }}>Niveau</Eyebrow>
          <Num value={4} source={SOURCE} asOf={RELEVE} style={{ fontSize: 25, marginTop: 4 }} />
          <ProgressBar value={60} height={5} territory="transforme" style={{ marginTop: 7 }} />
        </Surface>
      </View>

      {/* ── LE RÉPÉTITEUR, ET SON QUOTA ANNONCÉ D'AVANCE ────────────────────────────────── */}
      <Surface level="flat" style={{ marginTop: 14, padding: 17 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Body style={{ fontWeight: '700' }}>Demande à ton {tuteur.toLowerCase()}</Body>
            <Body muted style={{ fontSize: 12.5, marginTop: 2 }}>Il sait où tu t'es arrêtée.</Body>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ouvrir ${tuteur}`}
            onPress={() => router.push('/(tabs)/repetiteur')}
            style={({ pressed }: { pressed: boolean }) => ({ transform: [{ scale: pressed ? 0.94 : 1 }] })}
          >
            <Gradient
              colors={g.transforme}
              radius={23}
              style={{ width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="chat" size={19} color={t('paperFixed')} strokeWidth={2.2} />
            </Gradient>
          </Pressable>
        </View>
        {/* Le quota est ANNONCÉ avant d'être atteint : un refus au plafond est vécu comme une
            panne s'il n'a pas été dit. */}
        <QuotaMeter used={QUOTA.utilise - 1} total={QUOTA.total} style={{ marginTop: 13 }} />
      </Surface>

      <Eyebrow style={{ marginTop: 22 }}>Dans ton espace</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 16 }}>
        {ESPACE.map((e, i) => (
          <LessonRow
            key={e.href}
            icon={<Icon name={e.glyphe} size={14} color={t('ink2')} />}
            title={e.titre}
            meta={e.meta}
            trailing={<Icon name="forward" size={16} color={t('ink3')} strokeWidth={2.4} />}
            onPress={() => router.push(e.href)}
            last={i === ESPACE.length - 1}
          />
        ))}
      </Surface>
    </Screen>
  );
}

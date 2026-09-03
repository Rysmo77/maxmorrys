import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import {
  Avatar, Body, Button, Display, Eyebrow, Gradient, Icon, IconButton, LessonRow, Num,
  ProgressBar, QuotaMeter, SansDonnees, Screen, Surface, TerritoryCard, useActionGradient,
  useToken, useTutorNom,
} from '../../ds';
import { QUOTA, RELEVE, SOURCE, STOCKAGE } from '../../contenu/demo';
import { useEspace, useMoi } from '../../donnees';

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

/* Les trois portes de l'espace existent toujours ; seul leur RELEVÉ dépend du contenu.
   Une entrée sans son compte reste une entrée — c'est le compte qui ment, pas le chemin. */
const ESPACE = [
  { href: '/certificats', glyphe: 'doc' as const, titre: 'Mes certificats', meta: STOCKAGE ? '0 émis' : undefined },
  { href: '/telechargements', glyphe: 'download' as const, titre: 'Téléchargements', meta: STOCKAGE ? `3 leçons · ${STOCKAGE.occupeCourt}` : undefined },
] as const;

export default function Espace() {
  const t = useToken();
  const moi = useMoi();
  const espace = useEspace();
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
            <Avatar initials={moi.valeur?.initiale ?? ''} size={38} />
          </Pressable>
        </>
      }
    >
      <Eyebrow style={{ marginTop: 6 }}>{dateDuJour(maintenant)}</Eyebrow>
      {/* La salutation tient sans le prénom : l'heure du téléphone suffit à la rendre vraie. */}
      <Display
        size={31}
        lines={moi.valeur ? [salutation(maintenant), moi.valeur.prenom] : [`${salutation(maintenant)}.`]}
        style={{ marginTop: 8 }}
      />

      {/* ── PREMIER OBJET. La reprise, avant tout le reste — et quand il n'y a rien à
             reprendre, c'est CETTE place qui doit le dire, pas un vide en bas d'écran. ── */}
      {espace.valeur === null ? (
        <SansDonnees
          quoi="ta progression"
          degat="Une leçon inventée ici est une leçon qu'on croit avoir commencée : elle décale le compte, et elle rend faux le seul chiffre que tu viens vérifier."
          etat={espace}
          hauteur={4}
          style={{ marginTop: 20 }}
          action={<Button tone="forme" label="Voir le catalogue" onPress={() => router.push('/(tabs)/cours')} />}
        />
      ) : (
      <View style={{ marginTop: 20 }}>
        <TerritoryCard
          first
          territory="forme"
          meta={espace.valeur.arret ?? undefined}
          title={espace.valeur.leconEnCours ?? espace.valeur.titreCourt}
          titleSize={21}
          onPress={() => router.push('/lecon')}
        >
          <ProgressBar value={espace.valeur.progression} style={{ marginTop: 14 }} />
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, marginTop: 12,
          }}>
            {/* La provenance vient de l'ÉTAT, plus d'une constante : `source` et `asOf`
                disaient jusqu'ici « transfert du 2 septembre » sur une donnée du jour. */}
            <Num
              value={`${espace.valeur.leconsFaites} / ${espace.valeur.lecons} leçons · ${espace.valeur.progression} %`}
              source={espace.source}
              asOf={espace.asOf}
              style={{ fontSize: 12.5, color: t('textMuted') }}
            />
            <Button tone="primary" size="sm" label="Reprendre" onPress={() => router.push('/lecon')} />
          </View>
        </TerritoryCard>
      </View>
      )}

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

      {/* ── DEUX FAITS, SANS LEVIER. Sans relevé, ils ne s'affichent pas : une série à zéro
             qu'on n'a pas mesurée se lit comme une série perdue. ── */}
      {espace.valeur === null ? null : (
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
      )}

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
        {/* Le quota est ANNONCÉ avant d'être atteint — mais on n'annonce pas un plafond
            qu'on n'a pas relevé : ce serait promettre des questions qu'on ne peut pas tenir. */}
        {QUOTA ? <QuotaMeter used={QUOTA.utilise - 1} total={QUOTA.total} style={{ marginTop: 13 }} /> : null}
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

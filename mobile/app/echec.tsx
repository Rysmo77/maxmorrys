import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Body, Button, Display, Icon, Mesh, Num, Surface, Tag, useToken } from '../ds';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE PAIEMENT REFUSÉ — trois choses, dans cet ordre, et jamais d'excuse.
 *
 *   1. LE MOTIF réel, celui que l'opérateur a renvoyé. Pas « une erreur est survenue » :
 *      quelqu'un dont le paiement vient d'échouer a besoin de savoir s'il doit recharger son
 *      compte ou changer de moyen, et ces deux gestes n'ont rien à voir. Si le motif ne m'est
 *      pas transmis, je le dis — je n'en invente pas un plausible, parce qu'un motif faux
 *      envoie faire le mauvais geste.
 *   2. LA CONSÉQUENCE : rien n'a été débité. C'est ce que veut dire une transaction refusée,
 *      et c'est la première question que se pose la personne devant l'écran.
 *   3. LA SORTIE : réessayer. **C'est l'action primaire**, pas « revenir au catalogue » —
 *      renvoyer quelqu'un à la liste au moment où il voulait acheter, c'est lui faire refaire
 *      tout le chemin pour un solde insuffisant.
 *
 * AUCUNE MISE EN SCÈNE : le produit n'en accorde que deux, et un échec n'en est pas un.
 *
 * PARAMÈTRES DE ROUTE :
 *   ?motif=solde insuffisant       le motif RENVOYÉ par l'opérateur, mot pour mot
 *   &moyen=Wave                    le moyen qui a refusé
 *   &reference=MM-2K6-4831         la référence de la commande
 *   &slug=referencement-local      pour rouvrir le paiement de la même formation
 *   &titre=Référencement local…    pour rouvrir sa fiche
 *   &prix=95000                    le montant affiché, repassé tel quel à l'étape de paiement
 *   &asOf=2026-09-01T10:00:00Z     la date des relevés (règle 6)
 * ═══════════════════════════════════════════════════════════════════════════════
 */
const CARRE = 70;
const RAYON = 22;

export default function Echec() {
  const t = useToken();
  const insets = useSafeAreaInsets();
  const { motif, moyen, reference, slug, titre, prix, asOf } = useLocalSearchParams<{
    motif?: string; moyen?: string; reference?: string; slug?: string;
    titre?: string; prix?: string; asOf?: string;
  }>();

  const propose = asOf ? new Date(asOf) : null;
  const releve = propose && !Number.isNaN(propose.getTime()) ? propose : new Date();

  // Les mêmes paramètres qu'à l'aller : réessayer ne doit rien perdre de ce qui a été choisi.
  const reprise = {
    ...(slug ? { slug } : {}),
    ...(titre ? { titre } : {}),
    ...(prix ? { prix } : {}),
  };

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
        <View style={{
          width: CARRE, height: CARRE, borderRadius: RAYON,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: t('stop'),
          shadowColor: t('stop'), shadowOpacity: 0.4, shadowRadius: 16,
          shadowOffset: { width: 0, height: 12 }, elevation: 8,
        }}>
          <Icon name="alert" size={30} color={t('paperFixed')} strokeWidth={2.4} />
        </View>

        <Display size="sm" lines={['Le paiement', "n'est pas passé."]} style={{ marginTop: 24 }} />

        <Body muted style={{ marginTop: 12 }}>
          {/* 1 · LE MOTIF. */}
          {motif
            ? `${moyen ?? "L'opérateur"} a refusé la transaction — ${motif}, d'après le motif renvoyé. `
            : `${moyen ?? "L'opérateur"} a refusé la transaction. Le motif ne m'a pas été transmis, et je ne t'en invente pas : celui de ton opérateur est le seul qui vaille. `}
          {/* 2 · LA CONSÉQUENCE. */}
          <Body style={{ fontWeight: '700' }}>Rien n'a été débité.</Body>
          {/* 3 · LA SORTIE. */}
          {' '}Tu peux réessayer, avec le même moyen ou avec un autre.
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
            <Tag tone="stop">Échouée</Tag>
          </View>
        </Surface>

        {/*
          RÉESSAYER EST L'ACTION PRIMAIRE. La maquette écrit « Réessayer avec Orange Money » :
          ce serait nommer un moyen que je ne sais pas disponible pour cette personne. Le
          bouton rouvre la sélection, où les moyens réels sont listés.
        */}
        <Button
          tone="forme"
          label="Réessayer"
          disabled={!slug}
          style={{ marginTop: 20 }}
          onPress={() => router.push({ pathname: '/paiement', params: reprise })}
        />
        <Button
          tone="quiet"
          label="Revenir à la formation"
          disabled={!slug}
          style={{ marginTop: 10 }}
          onPress={() => router.push({ pathname: '/formation', params: reprise })}
        />

        {!slug ? (
          <Body muted style={{ marginTop: 12, fontSize: 12.5 }}>
            L'identifiant de la formation ne m'a pas été transmis avec cet échec, donc je ne
            peux pas te renvoyer au bon paiement. Reprends depuis le catalogue.
          </Body>
        ) : null}

        <Body muted style={{ marginTop: 14, fontSize: 11.5, textAlign: 'center', color: t('textFaint') }}>
          {reference
            ? "Rien n'est débité deux fois : chaque paiement porte une référence unique."
            : "Chaque paiement porte sa propre référence : une nouvelle tentative n'écrase pas la précédente."}
        </Body>
      </ScrollView>
    </View>
  );
}

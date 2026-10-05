import { View } from 'react-native';
import type { ReactNode } from 'react';
import { Body, Eyebrow } from './Type';
import { Button } from './Button';
import { Surface } from './Surface';
import { Skeleton } from './Skeleton';
import { Icon } from './Icon';
import type { Etat } from './Etat';
import { useToken } from './theme';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * CE QUI S'AFFICHE QUAND IL N'Y A RIEN — et pourquoi c'est un composant, pas une phrase.
 *
 * En production, `contenu/demo.ts` ne rend rien : le contenu du transfert n'est même pas
 * embarqué dans le paquet. Chaque écran doit alors dire quelque chose, et ce quelque chose
 * n'est PAS « une erreur est survenue » ni un écran blanc.
 *
 * Le port d'origine avait déjà la bonne formule, et elle tient en trois temps :
 *   1 · CE QUI MANQUE, nommé — « tes cours », « ce fil », pas « les données ».
 *   2 · D'OÙ ÇA VIENDRA — le compte, le serveur. C'est ce qui distingue « pas encore branché »
 *       de « cassé », et ça évite d'écrire au support.
 *   3 · POURQUOI RIEN N'EST INVENTÉ À LA PLACE. C'est la phrase qui change le ton : on ne
 *       s'excuse pas d'un vide, on explique un refus.
 *
 * Un composant et pas une phrase recopiée : à 27 écrans, une phrase recopiée devient 27
 * formulations qui divergent, et la troisième ligne — la seule qui demande un effort — est la
 * première à sauter.
 *
 * ── ET DEPUIS QUE L'APPLICATION INTERROGE UN SERVEUR ─────────────────────────────────
 * « Rien » n'a plus un seul sens. Six situations mènent ici, et les confondre fait mentir
 * l'écran d'une manière différente à chaque fois :
 *
 *   `charge`        la réponse arrive        → un squelette, jamais un vide
 *   `restauration`  on ne sait pas qui c'est → un squelette aussi
 *   `anonyme`       personne n'est connecté  → une porte, pas une panne
 *   `nonBranche`    pas encore de source     → le texte d'origine, toujours vrai
 *   `panne`         ça a échoué              → le motif, et de quoi réessayer
 *   `vide`          le serveur a répondu ␀   → un zéro DATÉ, qui est une information
 *
 * La prop `etat` est OPTIONNELLE : un écran pas encore branché appelle ce composant comme
 * avant, et lit `nonBranche` par défaut. C'est ce qui a permis de migrer sans réécrire
 * quarante-deux écrans le même jour.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export function SansDonnees({
  quoi, origine = 'de ton compte', degat, action, etat, hauteur = 3, style,
}: {
  /** Ce qui manque, nommé : « ta formation », « le fil du Club ». */
  quoi: string;
  /** D'où ça viendra. « de ton compte » par défaut — la réponse vraie neuf fois sur dix. */
  origine?: string;
  /**
   * Le dommage qu'une simulation causerait, propre à cet écran. C'est la ligne qui porte la
   * décision : un cours inventé est un cours qu'on croit avoir, un message inventé porte le
   * nom de quelqu'un. Omise, une phrase générale prend sa place — mais elle dit moins.
   */
  degat?: string;
  action?: ReactNode;
  /** L'état de la donnée. Absent, l'écran est réputé pas encore branché. */
  etat?: Etat<unknown>;
  /** Nombre de lignes du squelette pendant le chargement — à la taille du contenu attendu. */
  hauteur?: number;
  style?: React.ComponentProps<typeof Surface>['style'];
}) {
  const t = useToken();
  const phase = etat?.phase ?? 'nonBranche';

  /*
   * LE CHARGEMENT EST UN SQUELETTE, JAMAIS UN TOURNIQUET. `ds/Skeleton.tsx` l'argumente :
   * une roue qui tourne dit « attends » sans dire combien ni quoi ; un squelette dit ce qui
   * va arriver et où, donc la page ne saute pas quand le contenu se pose.
   */
  if (phase === 'charge' || phase === 'restauration') {
    return (
      <Surface level="flat" style={[{ padding: 20, gap: 10 }, style]}>
        {Array.from({ length: hauteur }, (_, i) => (
          <Skeleton
            key={i}
            height={i === 0 ? 18 : 13}
            width={i === 0 ? '62%' : i === hauteur - 1 ? '45%' : '100%'}
            label={i === 0 ? `${quoi} arrive` : undefined}
          />
        ))}
      </Surface>
    );
  }

  /* Personne n'est connecté : ce n'est ni un vide ni une panne, c'est une porte fermée —
     et elle a une poignée. */
  if (phase === 'anonyme') {
    return (
      <Surface level="flat" style={[{ padding: 20 }, style]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon name="lock" size={20} color={t('ink2')} />
          <Body style={{ flex: 1, fontWeight: '700' }}>
            {quoi.charAt(0).toUpperCase() + quoi.slice(1)} vient de ton compte
          </Body>
        </View>
        <Body muted style={{ marginTop: 10, lineHeight: 22 }}>
          Tu n'es pas connectée sur ce téléphone. Rien n'est perdu : tout est sur ton compte.
        </Body>
        <View style={{ marginTop: 16 }}>{action}</View>
      </Surface>
    );
  }

  /* La panne, dans l'ordre que `app/erreur.tsx` codifie : le motif, la conséquence, la
     sortie. Jamais « une erreur est survenue », qui ne dit ni ce qui a échoué ni quoi faire. */
  if (etat?.phase === 'panne') {
    return (
      <Surface level="flat" style={[{ padding: 20 }, style]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon name="alert" size={20} color={t('stop')} />
          <Body style={{ flex: 1, fontWeight: '700' }}>{etat.motif}</Body>
        </View>
        <Body muted style={{ marginTop: 10, lineHeight: 22 }}>
          {quoi.charAt(0).toUpperCase() + quoi.slice(1)} n'a pas pu être chargé. Rien n'est
          perdu — c'est la lecture qui a échoué, pas tes données.
        </Body>
        <Button tone="quiet" label="Réessayer" style={{ marginTop: 16 }} onPress={etat.reessayer} />
      </Surface>
    );
  }

  return (
    <Surface level="flat" style={[{ padding: 20 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Icon name="info" size={20} color={t('ink2')} />
        <Body style={{ flex: 1, fontWeight: '700' }}>
          {quoi.charAt(0).toUpperCase() + quoi.slice(1)} n'est pas encore là
        </Body>
      </View>

      {/* ⚠️ CETTE PHRASE EST DEVENUE CONDITIONNELLE, et c'est le point. Elle disait « cette
          application ne l'interroge pas encore » sur TOUS les écrans. Le jour où l'un d'eux
          interroge vraiment, la phrase devient fausse là où le vide est réel — et le vrai
          défaut de la fois précédente n'était pas le contenu simulé, c'était la
          documentation qui le niait. */}
      <Body muted style={{ marginTop: 10, lineHeight: 22 }}>
        {phase === 'vide'
          ? `Ça vient ${origine}, et il n'y a rien pour l'instant.`
          : `Ça vient ${origine}, et cette application ne l'interroge pas encore.`}
      </Body>

      <Eyebrow style={{ marginTop: 16 }}>Pourquoi il n'y a rien à la place</Eyebrow>
      <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
        {degat ?? "Parce qu'inventer une valeur ici la rendrait crédible. Un contenu de démonstration se reconnaît sur une maquette ; dans la main de quelqu'un, il ne se distingue plus du vrai."}
      </Body>

      {action !== undefined ? <View style={{ marginTop: 16 }}>{action}</View> : null}
    </Surface>
  );
}

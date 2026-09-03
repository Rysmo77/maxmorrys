import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Body, Display, Eyebrow, Gradient, Icon, IconButton, LessonRow, SansDonnees, Screen,
  Surface, Tag, isIOS, useActionGradient, useToken, veil,
} from '../ds';
import { FORMATION, MODULES_MUR } from '../contenu/demo';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ 4 · LA FICHE DE FORMATION ══ — L'APPLICATION NE VEND RIEN, ET N'EN PARLE PLUS.
 *
 * ── L'HYPOTHÈSE A ÉTÉ TRANCHÉE, ET C'EST LE REPLI QUI A ÉTÉ CHOISI ────────────────────
 * Cet écran était un MUR DE PAIEMENT : il affichait le prix, expliquait pourquoi les magasins
 * refusent Wave et Orange Money, et ouvrait la boutique du site. Il pariait sur une lecture
 * favorable de l'App Store 3.1.1 — un pari que ce fichier documentait lui-même comme non levé.
 *
 * Le pari n'a pas été tenu. **L'application est devenue consultation seule** : elle ouvre ce
 * qui est déjà acquis, et ne propose plus rien à l'achat. Ni prix, ni bouton, ni lien vers une
 * page de vente. C'est le repli que ce fichier nommait, appliqué.
 *
 * ⚠️ ET LE TEXTE COMPTE AUTANT QUE LES CONTRÔLES. Ce qui a disparu n'est pas seulement le
 * bouton : c'est aussi le paragraphe qui NOMMAIT LE MAGASIN — « L'App Store exige… ». Une
 * revue lit les chaînes ; citer la règle qu'on contourne est un signal aussi net qu'un lien
 * d'achat, et parfois le seul qui reste après un retrait bâclé.
 *
 * Ce qui SURVIT, et qui suffit à faire une fiche utile : le sujet, la durée, le programme, et
 * le module d'ouverture qui se regarde ici, sans compte. On décide si ça intéresse ; on décide
 * d'acheter ailleurs.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
/**
 * UN TITRE D'AFFICHAGE NE SE REPLIE PAS TOUT SEUL — c'est la règle de `Display`, et elle
 * existe parce qu'un titre laissé libre passe à quatre lignes en français et perd sa masse.
 * Mais un titre qui vient de la BASE n'a pas de coupe écrite à la main : on l'équilibre donc
 * sur deux lignes au mot le plus proche du milieu, ce qui est exactement ce qu'un typographe
 * ferait, et ce qui garde les deux lignes de longueur comparable.
 */
function deuxLignes(titre: string): string[] {
  const mots = titre.split(' ');
  if (mots.length < 3) return [titre];
  let meilleur = 1;
  let ecart = Number.POSITIVE_INFINITY;
  for (let i = 1; i < mots.length; i += 1) {
    const gauche = mots.slice(0, i).join(' ').length;
    const droite = mots.slice(i).join(' ').length;
    if (Math.abs(gauche - droite) < ecart) { ecart = Math.abs(gauche - droite); meilleur = i; }
  }
  return [mots.slice(0, meilleur).join(' '), mots.slice(meilleur).join(' ')];
}

export default function Formation() {
  const t = useToken();
  const g = useActionGradient();

  /* Les paramètres priment sur le contenu de référence : le jour où le catalogue arrive de
     Firestore, il transmet ses valeurs et cet écran n'a pas à changer d'une ligne. */
  /* ⚠️ `prix` N'EST PLUS LU, et ce n'est pas un oubli. Le paramètre peut encore arriver
     d'un appelant — un lien profond, une ancienne version — mais cet écran ne l'affiche
     plus : une fiche qui montre un montant est une fiche qui vend, quel que soit le nombre
     de boutons qu'on lui retire. */
  const { titre } = useLocalSearchParams<{ slug?: string; titre?: string; prix?: string }>();
  const nom = titre ?? FORMATION?.titre ?? null;

  return (
    <Screen
      territory="forme"
      retour="Cours"
      titre={isIOS ? undefined : (titre ?? FORMATION?.titreCourt ?? 'Formation')}
      droite={
        <IconButton label="Partager cette formation" onPress={() => router.push('/partage')}>
          <Icon name="share" size={17} color={t('textBody')} strokeWidth={2} />
        </IconButton>
      }
    >
      <Gradient
        colors={g.lecon}
        angle={140}
        radius={26}
        style={{
          height: 150, marginTop: 8, padding: 14, justifyContent: 'flex-end',
          shadowColor: t('mmBleu'), shadowOpacity: 0.24, shadowRadius: 17,
          shadowOffset: { width: 0, height: 14 }, elevation: 6,
        }}
      >
        <Tag tone="art">Aperçu · 4 min gratuit</Tag>
      </Gradient>

      {FORMATION ? <Eyebrow style={{ marginTop: 20 }}>{FORMATION.meta}</Eyebrow> : null}
      <Display
        size={26}
        lines={nom === null ? ['Cette formation', "n'est pas chargée."] : deuxLignes(nom)}
        style={{ marginTop: 8 }}
      />

      {/* ── LE PROGRAMME ───────────────────────────────────────────────────────────────
          Ce bloc était LE MUR : un prix, un bouton « Ouvrir sur maxmorrys.me », et trois
          étiquettes de moyens de paiement. Il vendait, donc il partait — mais il faut
          comprendre ce qui est retiré, parce que ce n'est pas seulement le bouton.

          Le texte NOMMAIT LE MAGASIN — « L'App Store exige… », « Google Play exige… ». Une
          revue lit les chaînes autant que les contrôles : citer la règle qu'on contourne
          est un signal aussi net qu'un lien d'achat. Ce paragraphe part avec le reste.

          Ce qui le remplace ne parle pas d'argent du tout. Une fiche de formation a un
          sujet, une durée, un programme, et un premier module qu'on peut regarder. C'est
          suffisant pour décider si ça t'intéresse — et décider d'acheter se fait ailleurs. */}
      <Surface level="hero" style={{ marginTop: 18, padding: 20 }}>
        <Display size={19}>Ce que tu vas apprendre.</Display>
        <Body muted style={{ marginTop: 9, fontSize: 13.5, lineHeight: 21 }}>
          {FORMATION
            ? `${FORMATION.lecons} leçons réparties en modules, à ton rythme. Le module d'ouverture se regarde ici, tout de suite, sans compte.`
            : "Le module d'ouverture se regarde ici, tout de suite, sans compte."}
        </Body>

        <View style={{ height: 1, backgroundColor: t('borderHair'), marginVertical: 16 }} />

        <Eyebrow>Ce que tu gardes</Eyebrow>
        <Body muted style={{ marginTop: 7, fontSize: 13, lineHeight: 20 }}>
          L'accès est <Body style={{ fontWeight: '700', fontSize: 13 }}>à vie</Body> : une fois
          la formation ouverte sur ton compte, elle le reste, ici comme sur le site. Tes notes
          et ta progression te suivent d'un appareil à l'autre.
        </Body>
      </Surface>

      {/* ── CE QU'ON PEUT VOIR SANS PAYER, ET CE QUI ATTEND ────────────────────────────── */}
      {MODULES_MUR.length === 0 ? (
        <SansDonnees
          quoi="le programme"
          degat="Un module inventé promet un contenu qui n'existe pas. C'est ce que le module d'ouverture, gratuit, sert justement à éviter : juger sur pièce."
          style={{ marginTop: 12 }}
        />
      ) : (
      <Surface level="flat" style={{ marginTop: 12, paddingHorizontal: 16 }}>
        {MODULES_MUR.map((m, i) => (
          <LessonRow
            key={m.titre}
            state={m.ouvert ? 'current' : 'todo'}
            icon={
              m.ouvert
                ? <Icon name="play" size={13} color={t('paperFixed')} />
                : <Icon name="lock" size={13} color={t('ink3')} strokeWidth={2.4} />
            }
            iconBackground={m.ouvert ? t('mmBleu') : veil(t('ink'), 0.06)}
            title={m.titre}
            meta={m.meta}
            last={i === MODULES_MUR.length - 1}
            onPress={m.ouvert ? () => router.push('/lecon') : undefined}
          />
        ))}
      </Surface>
      )}

      <Body muted style={{ fontSize: 11.5, lineHeight: 18, marginTop: 12, color: t('textFaint') }}>
        Le module d'ouverture se regarde ici, maintenant, sans compte. Les suivants s'ouvrent
        avec ton accès.
      </Body>
    </Screen>
  );
}

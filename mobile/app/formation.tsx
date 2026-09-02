import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { openAuthSessionAsync } from 'expo-web-browser';
import {
  Body, Button, Display, Eyebrow, Gradient, Icon, IconButton, LessonRow, PriceBlock,
  Screen, Surface, Tag, isIOS, useActionGradient, useToken, veil,
} from '../ds';
import { FORMATION, MODULES_MUR, RELEVE, SITE, SOURCE } from '../contenu/reference';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ 4 · LE MUR DE PAIEMENT ══ — L'APP NE VEND RIEN, ET ELLE LE DIT DANS SA VOIX.
 *
 * Wave et Orange Money en direct dans l'application, c'est un REJET EN REVUE : les deux
 * magasins imposent leur propre achat intégré pour du contenu numérique consommé dans
 * l'application (App Store 3.1.1, Play Payments). Or leur système ne connaît ni Wave ni
 * Orange Money — c'est-à-dire précisément le seul avantage réel du produit sur ce marché —
 * et il prélève 15 à 30 % : sur une formation à 95 000 F, entre 14 250 et 28 500 F par vente.
 *
 * L'application n'encaisse donc rien. **Elle OUVRE ce qui est déjà payé**, et le web reste la
 * boutique. Trois choses rendent ce mur supportable, et aucune n'est décorative :
 *
 *   1 · LE MODULE 1 SE REGARDE SANS PAYER, DANS L'APP. On juge avant de sortir de
 *       l'application — c'est ce qui distingue ce mur d'une porte fermée.
 *   2 · LE PRIX EST ÉCRIT ICI, entier, avec l'échelonnement. Un renvoi vers le site sans prix
 *       est un piège : on découvre le montant après avoir changé d'application.
 *   3 · LA RAISON EST DITE. « Même prix, tes moyens de paiement » — pas un bouton grisé, pas
 *       un « indisponible sur cette plateforme » qui donnerait tort au produit.
 *
 * ⚠️ HYPOTHÈSE NON LEVÉE, et elle se tranche avant soumission : ceci suppose que la revue
 * accepte le renvoi au titre de 3.1.1. Le texte NOMME le magasin, ce que certaines revues
 * refusent ; iOS propose un droit d'accès *External Purchase Link* qui autorise un lien
 * déclaré. Le repli connu : retirer tout renvoi et cantonner l'application à la consultation.
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
  const { slug, titre, prix } = useLocalSearchParams<{ slug?: string; titre?: string; prix?: string }>();
  const nom = titre ?? FORMATION.titre;
  const montant = prix ? Number(prix) : FORMATION.prix;
  const cible = slug ?? FORMATION.slug;

  async function ouvrirLaBoutique() {
    /* `openAuthSessionAsync` et non `openBrowserAsync` : la session partage les cookies du
       site, donc quelqu'un déjà connecté ne se reconnecte pas pour payer. */
    await openAuthSessionAsync(`${SITE}/formations/${cible}`, 'rysmo://paiement/retour');
  }

  return (
    <Screen
      territory="forme"
      retour="Cours"
      titre={isIOS ? undefined : (titre ?? FORMATION.titreCourt)}
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

      <Eyebrow style={{ marginTop: 20 }}>{FORMATION.meta}</Eyebrow>
      <Display size={26} lines={deuxLignes(nom)} style={{ marginTop: 8 }} />

      {/* ── LE MUR ─────────────────────────────────────────────────────────────────────── */}
      <Surface level="hero" style={{ marginTop: 18, padding: 20 }}>
        <Display size={19}>Je ne peux pas te faire payer ici.</Display>
        <Body muted style={{ marginTop: 9, fontSize: 13.5, lineHeight: 21 }}>
          {isIOS ? 'L’App Store' : 'Google Play'} exige que tout achat fait dans une
          application passe par son propre système de paiement, qui ne connaît ni Wave ni
          Orange Money. Plutôt que de te faire payer en carte avec une commission, je te
          renvoie au site — <Body style={{ fontWeight: '700' }}>même prix, tes moyens de paiement</Body>.
        </Body>

        <View style={{ height: 1, backgroundColor: t('borderHair'), marginVertical: 16 }} />

        <PriceBlock
          amount={montant}
          source={SOURCE}
          asOf={RELEVE}
          size={29}
          note={`Une fois, accès à vie · ou ${FORMATION.echelonnement}`}
        />
        <Button
          tone="forme"
          label="Ouvrir sur maxmorrys.me"
          trailing="forward"
          style={{ marginTop: 15 }}
          onPress={() => { void ouvrirLaBoutique(); }}
        />
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 13 }}>
          <Tag tone="ok">Wave</Tag>
          <Tag tone="ok">Orange Money</Tag>
          <Tag tone="ok">Carte</Tag>
        </View>
      </Surface>

      <Surface level="flat" style={{ marginTop: 12, padding: 18 }}>
        <Eyebrow>Après le paiement</Eyebrow>
        <Body muted style={{ marginTop: 8, fontSize: 13.5, lineHeight: 21 }}>
          Tu reviens dans l'app et la formation est ouverte — même compte, rien à saisir.
          Si elle ne l'est pas, tire la liste vers le bas.
        </Body>
      </Surface>

      {/* ── CE QU'ON PEUT VOIR SANS PAYER, ET CE QUI ATTEND ────────────────────────────── */}
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

      <Body muted style={{ fontSize: 11.5, lineHeight: 18, marginTop: 12, color: t('textFaint') }}>
        Le module 1 se regarde sans payer, dans l'app, maintenant. C'est ce qui rend ce mur
        supportable : tu juges avant de sortir de l'application.
      </Body>

      <Body muted style={{ fontSize: 11.5, lineHeight: 18, marginTop: 10, color: t('textFaint') }}>
        Le montant débité reste celui que le serveur recalcule, jamais celui que cet écran
        affiche : un prix transmis par un client ne décide de rien.
      </Body>
    </Screen>
  );
}

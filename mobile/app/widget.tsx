import { View } from 'react-native';
import {
  Body, Display, Eyebrow, Gradient, Icon, LessonRow, Num, SansDonnees, Screen, Surface, Wordmark, isIOS, useActionGradient, useToken, veil,
} from '../ds';
import { FORMATION, RELEVE, SOURCE } from '../contenu/demo';

/**
 * ══ 7 · LE WIDGET D'ÉCRAN D'ACCUEIL ══
 *
 * LE WEB N'AVAIT AUCUN CANAL DE RELANCE ; LE NATIF EN GAGNE DEUX. La notification est le
 * premier. Celui-ci est le second, et c'est le meilleur des deux : **un widget n'interrompt
 * jamais — il attend d'être vu**, et il ne demande AUCUNE permission. C'est la relance la
 * moins coûteuse du produit.
 *
 * ⚠️ CE QUE CET ÉCRAN EST, EXACTEMENT. Un widget ne se dessine pas en React Native : il se
 * construit avec WidgetKit sur iOS et Glance sur Android, dans le projet natif, et il vit
 * hors de l'application. Cet écran est donc l'endroit où on l'INSTALLE — l'aperçu fidèle de
 * ce qui va se poser sur l'écran d'accueil, et le chemin pour l'y mettre. C'est un manque
 * déclaré côté code natif, pas un aperçu qui se fait passer pour la chose.
 *
 * LE CONTENU DU WIDGET EST LA CARTE DE REPRISE, RÉDUITE À CE QUI RESTE VRAI SANS RÉSEAU :
 * le titre, la progression, une action. Rien qui demande une requête pour s'afficher.
 */
export default function Widget() {
  const t = useToken();
  const g = useActionGradient();

  /* Le widget vit chez la PERSONNE, sur son fond d'écran — pas sur notre maillage. Ses encres
     sont donc fixes dans les deux modes, comme celles du lecteur plein écran. */
  const surFond = t('paperFixed');
  const surFond2 = veil(surFond, 0.66);
  const verre = veil(surFond, 0.1);
  const liseré = veil(surFond, 0.16);

  if (FORMATION === null) {
    return (
      <Screen territory="transforme" retour="Profil" titre="Le widget">
        <Display size={27} lines={['Le widget', 'reste vide.']} style={{ marginTop: 10 }} />
        <SansDonnees
          quoi="ta progression"
          degat="Le widget affiche ce qui reste vrai sans réseau. Sans progression relevée, il n'a rien de vrai à afficher — et un widget qui ment est un mensonge posé sur l'écran d'accueil."
          style={{ marginTop: 20 }}
        />
      </Screen>
    );
  }

  /* Le rétrécissement de type ne survit pas à une closure quand la liaison vient d'un
     autre module : `onPress={() => X.y}` reperd le `non null` que la garde vient
     d'établir. Une constante LOCALE le porte jusque dans les rappels. */
  const formation = FORMATION;
  return (
    <Screen territory="transforme" retour="Profil" titre="Le widget">
      <Eyebrow style={{ marginTop: 6 }}>Sur ton écran d'accueil</Eyebrow>
      <Display size={27} lines={['UNE RELANCE', 'QUI N’INTERROMPT', 'RIEN.']} style={{ marginTop: 8 }} />
      <Body muted style={{ marginTop: 12, fontSize: 14.5, lineHeight: 22 }}>
        Il attend d'être vu au lieu de sonner, et il ne demande aucune permission. Voilà ce
        qu'il affichera :
      </Body>

      {/* ── L'APERÇU. Un fond de nuit tient lieu de fond d'écran : le widget doit être jugé
             sur un fond qui n'est pas le nôtre, sinon on juge notre maillage. ── */}
      <Gradient
        colors={[t('night3'), t('night'), t('gTransforme1')]}
        angle={165}
        radius={26}
        style={{ marginTop: 18, padding: 18, gap: 18 }}
      >
        {/* Widget moyen : la reprise. */}
        <View style={{
          borderRadius: 22, padding: 16,
          backgroundColor: verre, borderWidth: 1, borderColor: liseré,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <Wordmark brand="rysmo" size={15} night tail={surFond} /> {/* ok-ds — posé sur le verre du widget, pas en mode sombre */}
            <Body style={{ fontFamily: 'JetBrainsMono', fontSize: 10, color: surFond2 }}>il y a 8 jours</Body>
          </View>
          <Body style={{ fontSize: 15, fontWeight: '600', color: surFond, lineHeight: 20, marginTop: 10 }}>
            {formation.leconEnCours}
          </Body>
          <Body style={{ fontFamily: 'JetBrainsMono', fontSize: 11, color: surFond2, marginTop: 3 }}>
            {formation.leconsFaites} / {formation.lecons} leçons · {formation.progression} %
          </Body>
          <View style={{ height: 6, borderRadius: 4, backgroundColor: veil(surFond, 0.18), marginTop: 12, overflow: 'hidden' }}>
            <Gradient
              colors={[t('mmBleuN'), t('mmVioletN'), t('mmOrangeN'), t('mmTealN')]}
              angle={90}
              style={{ width: `${formation.progression}%`, height: 6 }}
            />
          </View>
          <View style={{
            alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 13,
            height: 34, paddingHorizontal: 14, borderRadius: 999, backgroundColor: surFond,
          }}>
            <Icon name="play" size={12} color={t('inkFixed')} />
            <Body style={{ fontSize: 12.5, fontWeight: '700', color: t('inkFixed') }}>Reprendre</Body>
          </View>
        </View>

        {/* Widget petit : la série. Aucun compte à rebours, aucune culpabilité. */}
        <View style={{ flexDirection: 'row', gap: 18, alignItems: 'flex-start' }}>
          <View style={{
            width: 138, height: 138, borderRadius: 22, padding: 15, justifyContent: 'space-between',
            backgroundColor: verre, borderWidth: 1, borderColor: liseré,
          }}>
            <Body style={{
              fontFamily: 'JetBrainsMono', fontSize: 9.5, letterSpacing: 1.4,
              textTransform: 'uppercase', color: surFond2,
            }}>
              Série
            </Body>
            <View>
              <Num value="3 j" source={SOURCE} asOf={RELEVE} style={{ fontSize: 38, color: surFond }} />
              <Body style={{ fontSize: 11, color: surFond2, marginTop: 4 }}>record 7 j</Body>
            </View>
          </View>

          {/* Les icônes voisines : elles disent que le widget vit à côté d'autres choses. */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18, width: 138 }}>
            <Gradient
              colors={g.forme}
              radius={isIOS ? 15 : 29}
              style={{ width: 58, height: 58, alignItems: 'center', justifyContent: 'center' }}
            >
              <Wordmark brand="rysmo" size={13} night tail={surFond} /> {/* ok-ds — posé sur un aplat de marque, pas en mode sombre */}
            </Gradient>
            {(['chat', 'search', 'calendar'] as const).map((n) => (
              <View
                key={n}
                style={{
                  width: 58, height: 58, borderRadius: isIOS ? 15 : 29,
                  alignItems: 'center', justifyContent: 'center', backgroundColor: veil(surFond, 0.14),
                }}
              >
                <Icon name={n} size={24} color={surFond} strokeWidth={1.9} />
              </View>
            ))}
          </View>
        </View>
      </Gradient>

      {/* ── COMMENT L'AJOUTER. Le geste diffère, donc il est écrit deux fois — c'est l'un des
             rares endroits où la plateforme change le TEXTE et pas seulement le cadre. ── */}
      <Eyebrow style={{ marginTop: 24 }}>Pour l'ajouter</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 16 }}>
        {(isIOS
          ? [
            ['Appuie longuement sur ton écran d’accueil', 'jusqu’à ce que les icônes bougent'],
            ['Touche le + en haut à gauche', 'la galerie des widgets s’ouvre'],
            ['Cherche Rysmo, choisis la taille', 'moyen pour la reprise, petit pour la série'],
          ]
          : [
            ['Appuie longuement sur ton écran d’accueil', 'puis touche « Widgets »'],
            ['Fais défiler jusqu’à Rysmo', 'les widgets sont classés par application'],
            ['Tire celui que tu veux sur l’écran', 'moyen pour la reprise, petit pour la série'],
          ]
        ).map(([titre, meta], i, a) => (
          <LessonRow
            key={titre}
            icon={<Body style={{ fontFamily: 'JetBrainsMono', fontSize: 12, color: t('mmVioletT') }}>{i + 1}</Body>}
            iconBackground={veil(t('mmViolet'), 0.12)}
            title={titre}
            meta={meta}
            last={i === a.length - 1}
          />
        ))}
      </Surface>

      <Surface level="truth" style={{ marginTop: 14, padding: 15 }}>
        <Eyebrow>Pourquoi ce widget existe</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          La plateforme web n'a aucun canal d'envoi : la relance ne pouvait venir que de
          l'écran, une fois l'app ouverte. Un widget attend sur l'écran d'accueil sans rien
          interrompre — et sans demander de permission.
        </Body>
      </Surface>
    </Screen>
  );
}

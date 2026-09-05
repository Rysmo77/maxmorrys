import { Share, View } from 'react-native';
import {
  Body, Button, CheckLine, Display, Eyebrow, Icon, LessonRow, Num, SansDonnees, Surface, Tag, useToken, veil,
} from '../../ds';
import { ClubScreen } from './_layout';
import { provenance, useParrainage } from '../../donnees';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ── CLUB · LE PARRAINAGE ── **LA REMISE VA AU FILLEUL, PAS À TOI.**
 *
 * C'est l'inverse de ce que fait tout le monde, et c'est un choix, pas une économie :
 *
 *   · UN PARRAINAGE QUI PAIE LE PARRAIN EN ARGENT transforme les membres en apporteurs
 *     d'affaires. On se met à recruter des gens qu'on sait mal placés pour en tirer profit,
 *     et le Club se remplit de personnes venues pour quelqu'un d'autre.
 *   · UNE REMISE QUI VA AU FILLEUL ne récompense que la recommandation SINCÈRE — celle qu'on
 *     fait parce qu'on pense que ça va aider la personne.
 *
 * Ce que le parrain gagne est du TEMPS, pas de l'argent : un mois offert par filleul qui reste
 * quatre-vingt-dix jours. Le délai n'est pas une astuce anti-fraude, c'est la définition d'une
 * bonne recommandation : quelqu'un qui reste trois mois est quelqu'un pour qui c'était utile.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export default function ClubParrainage() {
  const t = useToken();

  const etat = useParrainage();
  const parrainage = etat.valeur;

  if (parrainage === null) {
    return (
      <ClubScreen titre="Parrainage">
        <Display size={24} lines={['Ton code', "n'est pas chargé."]} />
        <SansDonnees
          quoi="ton code de parrainage"
          origine="de ton compte"
          degat="Un code inventé partagé à quelqu'un ne lui donnerait aucune remise — et c'est toi qui l'aurais promise."
          etat={etat}
          style={{ marginTop: 20 }}
        />
        <Surface level="truth" style={{ marginTop: 16, padding: 15 }}>
          <Eyebrow>La règle, elle, ne dépend d'aucun relevé</Eyebrow>
          <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
            La remise va au FILLEUL, pas à toi. Un parrainage qui paie le parrain en argent
            transforme les membres en apporteurs d'affaires ; ce que tu gagnes est du temps —
            un mois offert par filleul qui reste quatre-vingt-dix jours.
          </Body>
        </Surface>
      </ClubScreen>
    );
  }

  /* Le rétrécissement de type ne survit pas à une closure : `partager()` reperdrait le
     non-null que la garde vient d'établir. Une constante LOCALE le porte jusque-là — c'est
     la même raison qui valait pour les constantes du transfert, et elle vaut aussi pour une
     valeur venue du serveur. */
  const fiche = parrainage;

  async function partager() {
    await Share.share({
      message: `Le Club des Digitos, avec mon code : ${fiche.code}\n${fiche.lien}`,
      url: fiche.lien,
    });
  }

  return (
    <ClubScreen titre="Parrainage">
      <Eyebrow>Ton code</Eyebrow>
      <Surface level="hero" style={{ marginTop: 10, padding: 20 }}>
        <Num value={parrainage.code} {...provenance(etat)} style={{ fontSize: 26, letterSpacing: 1.4 }} />
        {/* ⚠️ LES MONTANTS SONT PARTIS. On disait « qui l'utilise paie X au lieu de Y ».
            Trois chiffres qui ne servaient qu'à faire calculer une économie — c'est-à-dire
            un argument de vente, dans une application qui ne vend rien. La règle, elle,
            reste entière : c'est le FILLEUL qui gagne, et c'est ce qu'il faut savoir pour
            décider de partager son code. */}
        <Body muted style={{ fontSize: 12.5, lineHeight: 19, marginTop: 8 }}>
          Qui l'utilise entre au Club à tarif réduit — la remise va à ton filleul, pas à toi.
          Toi, tu gagnes un mois par filleul qui reste quatre-vingt-dix jours.
        </Body>
        <Button tone="transforme" label="Partager mon code" icon="share" style={{ marginTop: 16 }} onPress={() => void partager()} />
      </Surface>

      <View style={{ marginTop: 20 }}>
        <Display size={22}>La remise va au filleul.</Display>
        <Body muted style={{ marginTop: 10, lineHeight: 22 }}>
          Pas à toi, et c'est voulu. Un parrainage qui paie le parrain en argent transforme les
          membres en apporteurs d'affaires — on se met à recruter des gens qu'on sait mal
          placés. Une remise qui va au filleul ne récompense que la recommandation sincère.
        </Body>
      </View>

      <Eyebrow style={{ marginTop: 22 }}>Ce que toi tu gagnes</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, padding: 18 }}>
        <CheckLine style={{ marginTop: 0 }}>
          Un mois offert par filleul qui reste 90 jours
        </CheckLine>
        <CheckLine tone="neutre" dash>
          Aucune commission, aucun paiement — le temps, pas l'argent
        </CheckLine>
        <Body muted style={{ fontSize: 11.5, lineHeight: 18, marginTop: 12, color: t('textFaint') }}>
          Les quatre-vingt-dix jours ne sont pas une astuce anti-fraude : quelqu'un qui reste
          trois mois est quelqu'un pour qui c'était utile. C'est ça qu'on récompense.
        </Body>
      </Surface>

      <Eyebrow style={{ marginTop: 22 }}>Tes filleuls</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 16 }}>
        <LessonRow
          icon={<Icon name="users" size={14} color={t('mmVioletT')} />}
          iconBackground={veil(t('mmViolet'), 0.12)}
          title="Ont utilisé ton code"
          trailing={<Num value={parrainage.filleuls} {...provenance(etat)} style={{ fontSize: 13 }} />}
        />
        <LessonRow
          icon={<Icon name="gift" size={14} color={t('ok')} />}
          iconBackground={veil(t('ok'), 0.14)}
          title="Mois offerts, acquis"
          meta="après 90 jours de présence"
          /* ⚠️ CE NOMBRE ÉTAIT UN `0` ÉCRIT EN DUR. Personne ne calcule les mois acquis :
             la règle demande de savoir quels filleuls ont tenu quatre-vingt-dix jours, et
             aucune vue ne le mesure aujourd'hui. Un zéro affirmé se lit comme un relevé —
             et c'est la seule ligne de l'écran qui parle de ce que TU gagnes. `<Num>` écrit
             « non relevé » tant que le compte n'existe pas. */
          trailing={<Num value={null} {...provenance(etat)} style={{ fontSize: 13 }} />}
          last
        />
      </Surface>

      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
        <Tag tone="ok">Aucun démarchage</Tag>
        <Tag>Le filleul décide seul</Tag>
      </View>

      <Surface level="truth" style={{ marginTop: 14, padding: 15 }}>
        <Eyebrow>Ce que ton code ne fait pas</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Il ne t'envoie aucune liste de contacts à relancer, et il ne dit à personne que tu as
          partagé. La personne qui l'utilise décide seule, et elle voit le prix normal à côté du
          prix remisé.
        </Body>
      </Surface>
    </ClubScreen>
  );
}

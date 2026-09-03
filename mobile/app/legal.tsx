import Constants from 'expo-constants';
import { router } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import {
  Body, Eyebrow, Icon, IconButton, LessonRow, Screen, Surface, isIOS, useToken,
} from '../ds';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LES TEXTES QUI ENGAGENT — et pourquoi un écran leur est consacré.
 *
 * Les deux magasins EXIGENT une politique de confidentialité atteignable, et App Store
 * 5.1.1(i) la veut au POINT DE CRÉATION DU COMPTE, pas seulement dans une fiche de magasin.
 * Avant cet écran, l'application n'en citait aucune : `grep -ri "legal|confidentialite"` sur
 * `mobile/` ne renvoyait rien.
 *
 * ⚠️ PIRE QUE L'ABSENCE, il y avait un FAUX LIEN. `creation.tsx` rendait « politique de
 * confidentialité » en bleu et en gras — la forme d'un lien — À L'INTÉRIEUR du `Pressable`
 * de la case newsletter. Le toucher ne l'ouvrait pas : ça cochait la case. Une fausse
 * affordance sur un contrôle de consentement, c'est-à-dire à l'endroit exact où elle coûte
 * le plus cher.
 *
 * ── POURQUOI DES LIENS SORTANTS, ET PAS LE TEXTE ICI ──────────────────────────────────
 * Ces textes changent, et ils doivent changer À UN SEUL ENDROIT. Les recopier dans
 * l'application les figerait à la version du dernier build : le site dirait une chose, une
 * application installée depuis six mois en dirait une autre, et c'est la seconde qui
 * engagerait quand même. Le site fait foi ; l'application y renvoie.
 *
 * `openBrowserAsync` — la feuille intégrée — et pas `openAuthSessionAsync` : aucune session
 * n'est en jeu, et la feuille garde la personne dans l'application.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

const SITE_LEGAL = 'https://maxmorrys.me/legal';

const TEXTES = [
  {
    chemin: '/confidentialite',
    titre: 'Politique de confidentialité',
    meta: 'ce qui est collecté, pourquoi, et pour combien de temps',
  },
  {
    chemin: '/cgu',
    titre: "Conditions générales d'utilisation",
    meta: 'ce que tu acceptes en créant un compte',
  },
  {
    chemin: '/cgv',
    titre: 'Conditions générales de vente',
    meta: 'les achats se font sur le site, pas ici',
  },
  {
    chemin: '/mentions-legales',
    titre: 'Mentions légales',
    meta: "qui édite ce service, et comment le joindre",
  },
] as const;

export default function Legal() {
  const t = useToken();

  /* La version et le numéro de construction : ce que le support demande en premier, et ce
     que personne ne sait retrouver. Ils vivent au bas de cet écran parce que c'est le seul
     endroit qu'on trouve sans savoir où chercher. */
  const version = Constants.expoConfig?.version ?? '—';

  return (
    <Screen
      territory="forme"
      retour="Profil"
      titre={isIOS ? undefined : 'Textes légaux'}
      droite={
        <IconButton label="Fermer" onPress={() => router.back()}>
          <Icon name="close" size={17} color={t('textBody')} strokeWidth={2.4} />
        </IconButton>
      }
    >
      <Eyebrow style={{ marginTop: 10 }}>Ce qui t'engage, et ce qui nous engage</Eyebrow>

      <Surface level="flat" style={{ marginTop: 12, paddingHorizontal: 16 }}>
        {TEXTES.map((texte, i) => (
          <LessonRow
            key={texte.chemin}
            title={texte.titre}
            meta={texte.meta}
            trailing={<Icon name="external" size={15} color={t('ink2')} />}
            onPress={() => { void openBrowserAsync(`${SITE_LEGAL}${texte.chemin}`); }}
            last={i === TEXTES.length - 1}
          />
        ))}
      </Surface>

      <Surface level="truth" style={{ marginTop: 16, padding: 15 }}>
        <Eyebrow>Pourquoi ils s'ouvrent sur le site</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Parce qu'ils changent, et qu'ils doivent changer à un seul endroit. Recopiés ici, ils
          seraient figés à la version du jour où tu as installé l'application — le site dirait
          une chose, ton téléphone une autre, et c'est quand même la seconde qui t'engagerait.
        </Body>
      </Surface>

      <Body
        muted
        style={{
          fontFamily: 'JetBrainsMono', fontSize: 11, marginTop: 18,
          color: t('textFaint'), textAlign: 'center',
        }}
      >
        Rysmo {version}
      </Body>
    </Screen>
  );
}

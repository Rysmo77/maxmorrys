import { Redirect, router } from 'expo-router';
import {
  Body, Display, Eyebrow, Icon, LessonRow, Screen, Surface, type IconName, useToken,
} from '../ds';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LA PLANCHE — TOUS LES ÉCRANS, DANS L'ORDRE DU TRANSFERT.
 *
 * Le transfert `handoff_natif/` ouvre sur un sélecteur qui rend ses 36 écrans dans les deux
 * châssis à la fois. Cet écran en est l'équivalent DANS l'application, et il sert deux choses
 * qu'aucune autre page ne peut rendre :
 *
 *   1 · LA REVUE. On compare l'écran livré à la planche du transfert sur l'appareil réel, avec
 *       les vraies zones sûres, la vraie densité et la vraie plateforme — pas dans un cadre de
 *       390 × 844 simulé dans un navigateur.
 *
 *   2 · LA CARTE DE NAVIGATION SE REFERME. Sept écrans du kit sont des ÉTATS ou des surfaces
 *       système — le chargement, l'erreur, le /403, le widget, l'écran verrouillé, le plein
 *       écran, le partage. Aucun n'a de place dans un menu : on y arrive par le code, quand la
 *       condition se produit. Sans cette planche, ce sont sept routes qu'aucun lien n'ouvre —
 *       et sur un routeur par fichiers, une route morte ne se voit pas manquer.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
type Entree = { href: string; titre: string; note: string };
type Groupe = { titre: string; glyphe: IconName; ecrans: Entree[] };

const PLANCHE: Groupe[] = [
  {
    titre: 'Propres au natif',
    glyphe: 'smartphone',
    ecrans: [
      { href: '/lancement', titre: 'Lancement', note: 'aucun indicateur de progression' },
      { href: '/onboarding', titre: 'Onboarding', note: 'trois écrans, aucun compte demandé' },
      { href: '/permissions', titre: 'Permissions', note: "le canal de relance que le web n'avait pas" },
      { href: '/formation', titre: 'Fiche de formation', note: 'le programme, sans prix ni achat' },
      { href: '/telechargements', titre: 'Stockage', note: 'poids en monospace, plafond auto-imposé' },
      { href: '/plein-ecran', titre: 'Lecteur paysage', note: 'le seul écran hors châssis partagé' },
      { href: '/widget', titre: 'Widget', note: 'la relance qui n’interrompt rien' },
      { href: '/partage', titre: 'Partage système', note: 'ce qui part est le lien, pas une image' },
      { href: '/biometrie', titre: 'Biométrie', note: 'après la première connexion, jamais avant' },
    ],
  },
  {
    titre: 'Apprentissage',
    glyphe: 'book',
    ecrans: [
      { href: '/', titre: 'Mon espace', note: 'la reprise reste le premier objet' },
      { href: '/cours', titre: 'Catalogue', note: "aucune note, aucun compteur d'inscrits" },
      { href: '/lecon', titre: 'Lecteur de leçon', note: 'faux verre partout, parce que tout défile' },
      { href: '/notes', titre: 'Mes notes', note: 'bouton flottant, rond ou carré selon le système' },
      { href: '/certificat', titre: 'Certificat', note: 'une brillance passe deux fois, puis plus jamais' },
      { href: '/certificats', titre: 'État vide', note: 'le zéro est daté' },
    ],
  },
  {
    titre: 'Répétiteur',
    glyphe: 'chat',
    ecrans: [
      { href: '/repetiteur', titre: 'Conversation', note: 'le quota épinglé : le clavier ne le cache pas' },
      { href: '/memoire', titre: 'Mémoire de profil', note: 'porté sans une ligne de différence' },
    ],
  },
  {
    titre: 'États transverses',
    glyphe: 'alert',
    ecrans: [
      { href: '/chargement', titre: 'Chargement', note: 'la forme exacte du contenu réel' },
      { href: '/erreur', titre: 'Erreur', note: 'motif, conséquence, sortie — dans cet ordre' },
      { href: '/hors-connexion', titre: 'Hors connexion', note: 'le système le dit avant d’essayer' },
      { href: '/interdit', titre: '/403', note: 'un garde de route cache, il n’interdit pas' },
    ],
  },
  {
    titre: 'Compte',
    glyphe: 'user',
    ecrans: [
      { href: '/connexion', titre: 'Connexion', note: 'e-mail seul — les fournisseurs tiers arrivent ensemble' },
      { href: '/creation', titre: 'Création de compte', note: 'la case n’est jamais pré-cochée' },
      { href: '/mot-de-passe', titre: 'Mot de passe oublié', note: 'la même phrase, compte ou pas' },
      { href: '/profil', titre: 'Préférences', note: 'la section notifications devient réelle' },
      { href: '/suppression', titre: 'Suppression', note: 'faisable entièrement dans l’application' },
    ],
  },
  {
    titre: 'Club',
    glyphe: 'users',
    ecrans: [
      { href: '/club', titre: 'Mur du Club', note: 'même règle d’achat que les formations' },
      { href: '/club/fil', titre: 'Le fil', note: 'le bilan d’abonnement, permanent' },
      { href: '/club/agenda', titre: 'Agenda', note: 'le seul écran qui GAGNE une action native' },
      { href: '/club/discussions', titre: 'Discussions', note: 'par catégorie, la question bête d’abord' },
      { href: '/club/membre', titre: 'Membre', note: 'la fiche, et le signalement' },
      { href: '/club/classement', titre: 'Classement', note: 'par vague d’arrivée, jamais absolu' },
      { href: '/club/opportunites', titre: 'Opportunités', note: 'budget annoncé par qui publie' },
      { href: '/club/parrainage', titre: 'Parrainage', note: 'la remise va au filleul, pas à toi' },
      { href: '/club/infos', titre: 'Infos', note: 'ce qui est garanti, et ce qui ne l’est pas' },
    ],
  },
  {
    titre: 'Média',
    glyphe: 'mic',
    ecrans: [
      { href: '/media', titre: 'Pôle média', note: 'mini-lecteur persistant' },
      { href: '/episode', titre: 'Épisode', note: 'transcription par défaut · 0 Mo contre 31' },
      { href: '/video', titre: 'Vidéo', note: 'le poids avant la qualité' },
      { href: '/verrouille', titre: 'Écran verrouillé', note: 'un navigateur ne peut pas y écrire' },
    ],
  },
  {
    titre: 'TPE et console',
    glyphe: 'dashboard',
    ecrans: [
      { href: '/presence', titre: 'Présence Digitale', note: 'aucune règle de magasin ici' },
      { href: '/devis', titre: 'Devis', note: 'figé à l’émission, sans donnée personnelle' },
      { href: '/console', titre: 'Console support', note: '5 écrans sur 19' },
      { href: '/console/messages', titre: 'Messages', note: 'le zéro est daté' },
      { href: '/console/temoignages', titre: 'Témoignages', note: 'aucun refus silencieux' },
      { href: '/console/rendez-vous', titre: 'Rendez-vous', note: 'le fuseau est écrit' },
      { href: '/console/prospects', titre: 'Prospects', note: 'le délai, pas un score' },
      { href: '/console/projets', titre: 'Projets', note: 'le plafond de livraison' },
    ],
  },
];

/*
 * ══════════════════════════════════════════════════════════════════════════════════════
 * L'ATELIER — ce qui n'a rien à faire entre les mains du public.
 *
 * Le drapeau est LITTÉRAL DANS CE MODULE, et pas importé d'un fichier commun. C'est la même
 * mécanique que `DEMO` dans `contenu/demo.ts`, pour la même raison mesurée : Metro ne replie
 * une branche morte que là où la condition est un littéral. Importé, tout le contenu gardé
 * resterait EMBARQUÉ dans le paquet de production — simplement inatteignable.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
const ATELIER = process.env.EXPO_PUBLIC_CONTENU_DEMO === '1' || __DEV__;

export default function Apercu() {
  /* La planche liste les 48 écrans, systèmes et états compris. C'est un outil de revue :
     elle n'a aucun sens pour quelqu'un qui utilise le produit, et elle se lit en revue de
     magasin comme une application inachevée. */
  if (!ATELIER) return <Redirect href="/" />;

  const t = useToken();
  const total = PLANCHE.reduce((n, g) => n + g.ecrans.length, 0);

  return (
    <Screen territory="forme" retour="Profil" titre="Les écrans">
      <Eyebrow style={{ marginTop: 6 }}>La planche de référence</Eyebrow>
      <Display size={27} lines={[`${total} écrans,`, 'deux châssis.']} style={{ marginTop: 8 }} />
      <Body muted style={{ marginTop: 12, fontSize: 14.5, lineHeight: 22 }}>
        Le corps de chaque écran est écrit une fois ; seuls le maillage, les zones sûres et la
        barre haute changent de plateforme. Ouvre-les sur les deux, côte à côte : c'est le seul
        moyen de voir ce qui aurait dû être commun et ne l'est pas.
      </Body>

      {PLANCHE.map((groupe) => (
        <Surface key={groupe.titre} level="flat" style={{ marginTop: 18, paddingHorizontal: 16 }}>
          <LessonRow
            icon={<Icon name={groupe.glyphe} size={15} color={t('mmBleu')} />}
            title={groupe.titre}
            meta={`${groupe.ecrans.length} écrans`}
          />
          {groupe.ecrans.map((e, i) => (
            <LessonRow
              key={e.href}
              title={e.titre}
              meta={<Body muted style={{ fontSize: 12, lineHeight: 17 }}>{e.note}</Body>}
              trailing={<Icon name="forward" size={16} color={t('ink3')} strokeWidth={2.4} />}
              onPress={() => router.push(e.href)}
              last={i === groupe.ecrans.length - 1}
            />
          ))}
        </Surface>
      ))}

      <Surface level="truth" style={{ marginTop: 18, padding: 15 }}>
        <Eyebrow>Pourquoi cette planche existe dans l'application</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Sept de ces écrans sont des états ou des surfaces système : on y arrive par le code,
          quand la condition se produit, jamais par un menu. Sans cette page, ce sont sept
          routes qu'aucun lien n'ouvre — et une route morte ne se voit pas manquer.
        </Body>
      </Surface>
    </Screen>
  );
}

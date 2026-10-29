import { CLUB_MEMBER_FORMATION_DISCOUNT, CLUB_PRICE, RYSMO_PACKS, RYSMO_SUBSCRIPTIONS } from './bictorys';
import { LIEN_JOURS_AVANT } from './bictorys-billing';
import type { Canal } from './rysmo-canal';
import { BASE_DAILY_QUOTA, CLUB_BONUS_QUOTA, SUBSCRIPTION_QUOTAS } from './rysmo-quota';

/**
 * Connaissances statiques sur la plateforme et le fondateur, injectées dans le prompt de Rysmo.
 *
 * ── CE QUI A ÉTÉ CORRIGÉ LE 29/10/2026 (accord de Max) ────────────────────────────────────
 * L'ancienne version promettait aux formations une protection d'achat de sept jours et
 * proposait un accompagnement individuel payant. Les CGV (art. 6) rendent tout achat définitif
 * une fois l'accès activé, et cet accompagnement n'existe pas : le chatbot fabriquait des
 * litiges. Elle citait aussi un slogan périmé, des chiffres de résultat non sourcés, un
 * compte YouTube en 404, des pages qui ont déménagé, et des formations qui ne sont pas ouvertes.
 *
 * ── D'OÙ VIENNENT LES PRIX ────────────────────────────────────────────────────────────────
 * Les prix vendus par le Worker sont LUS dans ses constantes (`bictorys.ts`, `rysmo-quota.ts`,
 * `bictorys-billing.ts`) : ce que Rysmo annonce est ce que le serveur débite.
 * Deux valeurs vivent hors du Worker (les projets TypeScript du dépôt ne s'importent pas entre
 * eux) et sont recopiées ici : les packs Commerces et TPE (`src/lib/presence/offer.ts`, `PACKS`)
 * et les sessions en direct du Club (`src/lib/club/pricing.ts`, `LIVE_SESSIONS_PER_MONTH`).
 * `test/rysmo-knowledge.test.ts` lit ces deux fichiers et échoue si une copie diverge.
 *
 * ⛔ Vocabulaire interdit dans ce fichier, commentaires compris : la liste exacte vit dans
 * `test/rysmo-knowledge.test.ts` (`INTERDITS`). La règle s'écrit ici sans citer les mots.
 *
 * L'application mobile ne vend rien : elle reçoit `PLATFORM_KNOWLEDGE_APP`, sans aucun prix.
 */

/** Packs Commerces et TPE, prix HT facturés — miroir de `PACKS` dans `src/lib/presence/offer.ts`. */
export const PACKS_COMMERCES_HT = {
  presence: { nom: 'Présence Locale', prixHT: 250_000 },
  visible: { nom: 'Commerce Visible', prixHT: 495_000 },
  boutique: { nom: 'Boutique Digitale', prixHT: 895_000 },
} as const;

/** TVA sénégalaise appliquée à l'agence — `src/lib/tax/senegal.ts`. */
export const TVA_AGENCE = 0.18;

/** Acompte à la commande d'un pack — `src/lib/presence/offer.ts`. */
export const ACOMPTE_PACK = 0.6;

/** Sessions en direct incluses par mois — miroir de `LIVE_SESSIONS_PER_MONTH` (`src/lib/club/pricing.ts`). */
export const CLUB_LIVES_PAR_MOIS = 2;

/** 19900 → « 19 900 » (espaces ordinaires, lisibles par le modèle). */
function montant(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function pourcent(taux: number): string {
  return `${Math.round(taux * 100)} %`;
}

const FONDATEUR = [
  'LE FONDATEUR :',
  '- Max-Morrys Eyoum, basé à Dakar (Sénégal). Concepteur web et formateur au digital (référencement, marketing, IA), formateur depuis 2024.',
  "- Parcours : a grandi à Douala, licence au CERAP (Abidjan), master à BEM Dakar. « J'ai appris le marketing en le faisant : pour des PME, des organisations, des hôpitaux, des églises. »",
  '- Expertise : marketing et référencement ; IA et automatisation ; conception web et produit digital.',
  "- Ne cite AUCUN chiffre de résultat (trafic, abonnés, nombre de clients) ni aucun nom de client ou d'employeur : rien de tout cela n'est publié ici.",
];

const PLATEFORME = [
  'LA PLATEFORME :',
  "- « Je suis Max-Morrys. J'aide les entrepreneurs et les marques d'Afrique francophone à exister en ligne — en les formant, et en construisant avec eux. Depuis Dakar. » Signature : « Former. Construire. Transmettre. »",
  '- Deux pistes de poids égal : Apprendre (edu.maxmorrys.me et club.maxmorrys.me, on se tutoie) et Conception (maxmorrys.me/conception, des sites et des plateformes faits pour le client).',
];

const FORMATIONS = [
  "- Formations : AUCUNE n'est ouverte aujourd'hui. Si on te pose la question, dis simplement que les formations ne sont pas encore ouvertes. N'en promets aucune : ni titre, ni programme, ni prix, ni date d'ouverture — sauf une formation qui figure dans le CATALOGUE ci-dessous.",
];

const CONTACT = [
  'CONTACT & LIENS :',
  '- E-mail : hello@maxmorrys.me · Téléphone/WhatsApp : +221 77 604 19 85 · Dakar, Sénégal. Un appel de 30 minutes peut se réserver depuis la page Contact.',
  '- Réseaux : LinkedIn (linkedin.com/in/max-morrys-eyoum), YouTube (@maxmorrys-me), Instagram (@maxmorrys.me), Facebook (facebook.com/maxmorrys.me), X (@max_morrys).',
  '- Pages : [À propos](https://maxmorrys.me/a-propos), [Contact](https://maxmorrys.me/contact), [FAQ](https://maxmorrys.me/faq), [Blog](https://maxmorrys.me/blog), [Podcast et vidéos](https://maxmorrys.me/podcast-et-videos).',
];

const CONSIGNE_FINALE =
  "Pour les questions sur la plateforme ou sur Max-Morrys Eyoum, réponds avec ces infos et renvoie vers la page pertinente (À propos, Contact, FAQ). N'invente AUCUN fait au-delà de ce qui est écrit ici ; en cas de doute, renvoie vers la page Contact.";

const [lite, pro] = [RYSMO_SUBSCRIPTIONS.lite, RYSMO_SUBSCRIPTIONS.pro];
const NOMS_PACKS: Record<string, string> = { discovery: 'Découverte', regular: 'Régulier', intensive: 'Intensif' };
const packs = Object.entries(RYSMO_PACKS)
  .map(([cle, p]) => `${NOMS_PACKS[cle] ?? cle} : ${p.requests} questions à ${montant(p.price)} FCFA`)
  .join(' · ');

/** Le site : offres, prix, conditions. */
export const PLATFORM_KNOWLEDGE = [
  '',
  '── À PROPOS DE MAX-MORRYS (réponds aux questions sur la plateforme et le fondateur avec ces faits) ──',
  '',
  ...FONDATEUR,
  '',
  ...PLATEFORME,
  '',
  'PISTE APPRENDRE :',
  '- Gratuit et sans compte : le blog, le podcast et les vidéos.',
  ...FORMATIONS,
  `- Club des Digitos (club.maxmorrys.me) : ${montant(CLUB_PRICE)} FCFA par an, payés une fois. Inclus : le fil, les messages privés, l'agenda, ${CLUB_LIVES_PAR_MOIS} sessions en direct par mois, les opportunités, l'annuaire des membres, ${BASE_DAILY_QUOTA + CLUB_BONUS_QUOTA} questions Rysmo par jour au lieu de ${BASE_DAILY_QUOTA}, et −${pourcent(CLUB_MEMBER_FORMATION_DISCOUNT)} sur les formations quand elles ouvriront. Encore en construction (présente-les comme tels) : les replays, le digest, les cercles. Adhésion : club.maxmorrys.me/adhesion.`,
  `- Renouvellement du Club : rien n'est débité automatiquement. Si le membre l'a accepté, il reçoit un lien de paiement ${LIEN_JOURS_AVANT} jours avant la fin de son année ; il renouvelle en payant ce lien, sinon l'accès s'arrête.`,
  `- Rysmo (toi), sur edu.maxmorrys.me/assistant : ${BASE_DAILY_QUOTA} questions offertes par jour (${BASE_DAILY_QUOTA + CLUB_BONUS_QUOTA} pour un membre du Club). Packs sans date d'expiration : ${packs}. Rysmo+ Lite : ${SUBSCRIPTION_QUOTAS.lite} questions par jour, ${montant(lite.price)} FCFA par mois. Rysmo+ Pro : ${SUBSCRIPTION_QUOTAS.pro} questions par jour, ${montant(pro.price)} FCFA par mois.`,
  '',
  'PISTE CONCEPTION :',
  `- Commerces et TPE ([la page](https://maxmorrys.me/conception/commerces-et-tpe), on s'y tutoie) : ${Object.values(PACKS_COMMERCES_HT).map((p) => `${p.nom} ${montant(p.prixHT)} FCFA HT`).join(' · ')}. Les prix sont hors taxes : TVA de ${pourcent(TVA_AGENCE)} en sus. Acompte de ${pourcent(ACOMPTE_PACK)} à la commande, le solde avant la mise en ligne. Cite TOUJOURS ces prix avec la mention HT.`,
  '- Projets sur mesure ([la page](https://maxmorrys.me/conception/projets-sur-mesure)) : sur devis uniquement, aucun montant public. Ne donne aucune estimation.',
  "- Il n'existe ni accompagnement individuel payant, ni mission de conseil vendue sur la plateforme : n'en propose jamais.",
  "- N'invente AUCUNE offre ni AUCUN prix au-delà de ceux-ci.",
  '',
  'PAIEMENT ET CONDITIONS :',
  '- Paiement en FCFA par Wave, Orange Money ou carte bancaire. Jamais de prélèvement automatique.',
  "- Un achat est définitif dès que l'accès est activé ([CGV, article 6](https://maxmorrys.me/legal/cgv)) : ne promets ni retour d'argent, ni période d'essai, ni délai de rétractation. En cas de souci technique, renvoie vers la page Contact.",
  '',
  ...CONTACT,
  '',
  CONSIGNE_FINALE,
].join('\n');

/**
 * L'application mobile : elle ne vend rien (App Store 3.1.1, Play « Payments »), donc aucun prix,
 * aucune offre, aucun mot d'achat — voir `rysmo-canal.ts`.
 */
export const PLATFORM_KNOWLEDGE_APP = [
  '',
  '── À PROPOS DE MAX-MORRYS (réponds aux questions sur la plateforme et le fondateur avec ces faits) ──',
  '',
  ...FONDATEUR,
  '',
  ...PLATEFORME,
  '- On y trouve le blog, le podcast, les vidéos, le Club des Digitos (la communauté) et toi, Rysmo.',
  ...FORMATIONS,
  "- Sur les questions de tarif ou d'accès, dis simplement que tu ne peux pas en parler ici.",
  '',
  ...CONTACT,
  '',
  CONSIGNE_FINALE,
].join('\n');

export function connaissancesPlateforme(canal: Canal): string {
  return canal === 'app' ? PLATFORM_KNOWLEDGE_APP : PLATFORM_KNOWLEDGE;
}

/**
 * LE DESIGN SYSTEM, PORTÉ DANS LE COURRIER.
 *
 * Les trois messages du produit — facture, rappel d'échéance, réponse à un message — étaient
 * dessinés chacun de leur côté. Ils redéclaraient tous les trois le même `<!doctype>`, le même
 * corps, la même carte blanche, et ils divergeaient là où ça se voit :
 *
 *   - `#F4F6F9` pour le fond, quand le jeton `paper2` vaut `#F5F7F9` ; `#E3E7EC` pour le filet,
 *     quand `line` vaut `#E2E7EC`. Des quasi-jetons, saisis à la main, faux d'un cran.
 *   - un bouton violet `#6C23DD` sur le rappel, un bleu `#0A5FA6` sur la réponse — et ce bleu
 *     n'est même pas dans la palette. Or le jeton `actionPrimary` vaut `#0E1116` : l'action
 *     principale du système est ENCRE, pas colorée.
 *   - aucune marque. Ni monogramme, ni arc, ni la moindre des trois familles typographiques.
 *     Trois courriers qui ne ressemblaient pas à Max-Morrys.
 *
 * Ce module tient l'unique définition. Les valeurs viennent de `src/design-system/tokens.generated.ts`,
 * recopiées ici en littéral — un Worker n'a pas accès au CSS du site, et le courrier n'a de
 * toute façon pas de cascade où faire vivre un `var()`.
 *
 * ── POURQUOI AD-2 NE S'APPLIQUE PAS ICI ──
 * La règle « aucune couleur en dur dans un composant » suppose une feuille de style et un
 * jeton à référencer. Le courrier n'a ni l'une ni l'autre : les clients de messagerie
 * suppriment `<style>`, ignorent `var()`, et seul le style EN LIGNE survit partout. Écrire le
 * littéral n'est pas ici un contournement, c'est le seul rendu qui arrive à destination.
 * `ds:check` ne lit de toute façon que `src/` et `mobile/` — `worker/` lui est étranger.
 */

/* ─────────────────────────────────────────────────────────────────────────────
   LES JETONS — copie littérale de tokens.generated.ts
   ────────────────────────────────────────────────────────────────────────── */

/** Le jeu clair. C'est la base : elle est écrite EN LIGNE et survit à tout. */
export const CLAIR = {
  ink: '#0E1116',
  ink2: '#5A6472',
  ink3: '#68727F',
  line: '#E2E7EC',
  paper: '#FFFFFF',
  paper2: '#F5F7F9',
  paper3: '#EDF0F4',
  link: '#0057BC',
  actionPrimary: '#0E1116',
  actionStop: '#B4231F',
} as const;

/**
 * Le jeu sombre. Il ne s'applique QUE par requête de préférence, donc uniquement là où le
 * client de messagerie l'honore (Apple Mail, quelques autres). Gmail applique sa propre
 * inversion et ignore tout ceci : c'est pourquoi le jeu clair reste la base en ligne.
 */
export const SOMBRE = {
  ink: '#ECF0F5',
  ink2: '#A2ADBB',
  ink3: '#77828F',
  line: 'rgba(255,255,255,.1)',
  band: '#0A0D11',
  card: '#14181E',
} as const;

/**
 * L'ARC — les cinq teintes de la marque, dans l'ordre du jeton `arc`.
 *
 * Il n'est PAS rendu en dégradé CSS : Outlook n'en affiche aucun, et un filet de marque qui
 * disparaît chez un tiers des destinataires ne tient pas. Cinq cellules pleines de 20 % font
 * exactement la même lecture et fonctionnent partout, sans exception.
 */
export const ARC = ['#0057BC', '#6C23DD', '#FF6E7F', '#F38B0A', '#02AC9C'] as const;

/**
 * Les trois familles du système, avec leurs replis.
 *
 * ⚠️ La plupart des destinataires ne verront JAMAIS Fraunces ni Schibsted Grotesk : Gmail,
 * Outlook et la majorité des clients suppriment les fontes distantes. Le repli n'est donc pas
 * un filet de sécurité, c'est le rendu NOMINAL. D'où le choix du système : Georgia derrière
 * Fraunces — une serif derrière une serif, pour que le titre reste un titre.
 */
export const FONTES = {
  display: "'Fraunces',Georgia,'Times New Roman',serif",
  body: "'Schibsted Grotesk',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
  mono: "'JetBrains Mono','SF Mono',SFMono-Regular,Menlo,Consolas,monospace",
} as const;

/** L'échelle typographique du système, en pixels — le courrier ne connaît pas `rem`. */
export const ECHELLE = {
  dsp: '41px',
  ttl: '26px',
  body: '15px',
  prose: '15.5px',
  meta: '13px',
  small: '11.5px',
  eyebrow: '10.5px',
} as const;

/** Le monogramme, en PNG et en URL absolue : le courrier n'a pas de racine de site, et
 *  WebP n'est pas lisible par une partie des clients. */
export const MONOGRAMME = 'https://maxmorrys.me/monogramme-320.png';

/** Largeur du contenu. 600 px est la seule valeur sûre : au-delà, Outlook coupe. */
const LARGEUR = 600;

/* ─────────────────────────────────────────────────────────────────────────────
   OUTILS
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Échappement des valeurs interpolées.
 *
 * Il vivait en TROIS copies, une par gabarit. Une seule ici : c'est du contenu écrit par des
 * humains (un nom, une question de formulaire, la réponse d'un administrateur) qui traverse
 * du HTML, et trois implémentations d'un même échappement sont trois occasions d'en oublier
 * une.
 */
export function echapper(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ─────────────────────────────────────────────────────────────────────────────
   PRIMITIVES
   ────────────────────────────────────────────────────────────────────────── */

/** Le sur-titre : mono, capitales, très espacé. `mm-eyebrow` du système. */
export function surTitre(texte: string): string {
  return `<p style="margin:0 0 10px;font-family:${FONTES.mono};font-size:${ECHELLE.eyebrow};line-height:1.2;letter-spacing:.14em;text-transform:uppercase;color:${CLAIR.ink2}" class="mm-ink2">${echapper(texte)}</p>`;
}

/** Le titre de la pièce. Display du système : Fraunces 900, très serré. */
export function titre(texte: string): string {
  return `<h1 style="margin:0 0 18px;font-family:${FONTES.display};font-weight:900;font-size:${ECHELLE.ttl};line-height:1.12;letter-spacing:-.032em;color:${CLAIR.ink}" class="mm-ink">${echapper(texte)}</h1>`;
}

/** Un paragraphe de corps. `sourdine` le passe en encre secondaire. */
export function paragraphe(texte: string, sourdine = false): string {
  const couleur = sourdine ? CLAIR.ink2 : CLAIR.ink;
  const classe = sourdine ? 'mm-ink2' : 'mm-ink';
  return `<p style="margin:0 0 14px;font-size:${ECHELLE.prose};line-height:1.68;color:${couleur}" class="${classe}">${echapper(texte)}</p>`;
}

/** Une mention basse : mentions légales, rappels de procédure. */
export function mention(texte: string, taille: string = ECHELLE.meta): string {
  return `<p style="margin:0 0 12px;font-size:${taille};line-height:1.6;color:${CLAIR.ink2}" class="mm-ink2">${echapper(texte)}</p>`;
}

/** Un filet horizontal discret. */
export function filet(): string {
  return `<div style="height:1px;line-height:1px;font-size:0;background:${CLAIR.line};margin:22px 0" class="mm-filet">&nbsp;</div>`;
}

/**
 * LE BOUTON.
 *
 * Construit en table et non avec un `<a>` mis en bloc : Outlook ignore `padding` sur un lien
 * en ligne et rend une pastille écrasée sur son texte. Le remplissage porté par la cellule
 * est la seule forme qui tienne partout.
 *
 * ⚠️ `border-radius` reste ignoré par Outlook Windows : le bouton y sera un rectangle encre,
 * net et lisible. C'est un arbitrage assumé — la version pleinement arrondie exige du VML
 * conditionnel, soit vingt lignes de balisage mort pour tous les autres clients.
 *
 * La couleur est `actionPrimary`, donc ENCRE. C'est ce que dit le système ; les deux
 * gabarits qui peignaient leur bouton en violet ou en bleu ne suivaient rien.
 */
export function bouton(libelle: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 22px"><tr>
    <td bgcolor="${CLAIR.actionPrimary}" style="border-radius:999px;background:${CLAIR.actionPrimary}" class="mm-btn">
      <a href="${echapper(href)}" style="display:inline-block;padding:15px 30px;font-family:${FONTES.body};font-size:14.5px;font-weight:700;letter-spacing:-.01em;color:#FFFFFF;text-decoration:none;border-radius:999px" class="mm-btn-a">${echapper(libelle)}</a>
    </td>
  </tr></table>`;
}

/**
 * LE TABLEAU DE LIGNES — l'ossature de la facture.
 *
 * Libellé à gauche en encre secondaire, valeur à droite en mono. Le mono n'est pas décoratif :
 * il donne des chiffres à chasse fixe, donc des montants et des références qui s'alignent
 * verticalement au lieu de danser.
 */
export function lignes(paires: Array<[string, string]>): string {
  const corps = paires
    .map(
      ([k, v]) => `<tr>
      <td style="padding:11px 0;font-size:${ECHELLE.meta};color:${CLAIR.ink2};border-bottom:1px solid ${CLAIR.line};vertical-align:top" class="mm-ink2 mm-brd">${echapper(k)}</td>
      <td style="padding:11px 0;font-family:${FONTES.mono};font-size:${ECHELLE.meta};text-align:right;color:${CLAIR.ink};border-bottom:1px solid ${CLAIR.line};vertical-align:top" class="mm-ink mm-brd">${echapper(v)}</td>
    </tr>`,
    )
    .join('\n');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;margin:0 0 4px">
${corps}
  </table>`;
}

/**
 * LE TOTAL — la seule ligne que l'œil doit trouver sans chercher.
 *
 * Display, gros, encre pleine. Tout le reste de la facture est en 13 px : c'est le contraste
 * de taille qui fait la hiérarchie, pas une couleur d'accent.
 */
export function total(libelle: string, montant: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;margin:6px 0 20px"><tr>
    <td style="padding:16px 0 0;font-size:${ECHELLE.meta};font-weight:600;color:${CLAIR.ink2};vertical-align:bottom" class="mm-ink2">${echapper(libelle)}</td>
    <td style="padding:16px 0 0;text-align:right;font-family:${FONTES.mono};font-weight:700;font-size:24px;letter-spacing:-.02em;color:${CLAIR.ink};vertical-align:bottom" class="mm-ink">${echapper(montant)}</td>
  </tr></table>`;
}

/**
 * L'ENCART — ce que l'achat vient d'ouvrir, en un coup d'œil.
 *
 * C'est le seul endroit du courrier transactionnel où l'on peut se permettre d'être
 * démonstratif : un achat qui aboutit est un bon moment, et le dire fait partie du travail.
 * La valeur est en display, grande, sur `paper3` — pas de couleur d'accent, pas de bordure
 * colorée : c'est la TAILLE qui célèbre, comme partout ailleurs dans le système.
 *
 * `note` est facultative. Elle porte ce qui nuance — un solde total, une date de fin.
 */
export function encart(surtitre: string, valeur: string, note?: string): string {
  const ligneNote = note
    ? `<p style="margin:8px 0 0;font-size:${ECHELLE.meta};line-height:1.5;color:${CLAIR.ink2}" class="mm-ink2">${echapper(note)}</p>`
    : '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;margin:4px 0 24px"><tr>
    <td bgcolor="${CLAIR.paper3}" style="padding:22px 24px;background:${CLAIR.paper3};border-radius:16px" class="mm-quote">
      <p style="margin:0 0 8px;font-family:${FONTES.mono};font-size:${ECHELLE.eyebrow};letter-spacing:.14em;text-transform:uppercase;color:${CLAIR.ink2}" class="mm-ink2">${echapper(surtitre)}</p>
      <p style="margin:0;font-family:${FONTES.display};font-weight:900;font-size:30px;line-height:1.05;letter-spacing:-.035em;color:${CLAIR.ink}" class="mm-ink">${echapper(valeur)}</p>
      ${ligneNote}
    </td>
  </tr></table>`;
}

/**
 * LA CITATION — ce qu'on rappelle au destinataire : sa propre question.
 *
 * Fond `paper3` et filet d'encre à gauche. Le `white-space:pre-wrap` préserve les retours à la
 * ligne de ce qu'il a écrit : les réécrire en un bloc, c'est lui répondre à côté.
 */
export function citation(surtitre: string, corps: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;margin:4px 0 22px"><tr>
    <td width="3" bgcolor="${CLAIR.ink}" style="width:3px;background:${CLAIR.ink};border-radius:3px 0 0 3px" class="mm-quote-bar">&nbsp;</td>
    <td bgcolor="${CLAIR.paper3}" style="padding:16px 18px;background:${CLAIR.paper3};border-radius:0 10px 10px 0" class="mm-quote">
      <p style="margin:0 0 7px;font-family:${FONTES.mono};font-size:${ECHELLE.eyebrow};letter-spacing:.14em;text-transform:uppercase;color:${CLAIR.ink2}" class="mm-ink2">${echapper(surtitre)}</p>
      <p style="margin:0;font-size:${ECHELLE.meta};line-height:1.6;color:${CLAIR.ink2};white-space:pre-wrap" class="mm-ink2">${echapper(corps)}</p>
    </td>
  </tr></table>`;
}

/** Le corps d'une réponse écrite à la main : prose, encre pleine, retours préservés. */
export function prose(texte: string): string {
  return `<div style="margin:0 0 20px;font-size:${ECHELLE.prose};line-height:1.68;color:${CLAIR.ink};white-space:pre-wrap" class="mm-ink">${echapper(texte)}</div>`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   LA PAGE
   ────────────────────────────────────────────────────────────────────────── */

/** Les cinq cellules de l'arc. Voir `ARC` pour la raison. */
function arc(): string {
  const cellules = ARC.map(
    (c) => `<td width="20%" bgcolor="${c}" style="width:20%;height:4px;line-height:4px;font-size:0;background:${c}">&nbsp;</td>`,
  ).join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse"><tr>${cellules}</tr></table>`;
}

/**
 * LE PRÉ-EN-TÊTE — la ligne d'aperçu de la boîte de réception.
 *
 * Sans elle, le client de messagerie prend les premiers mots du corps : ici « Bonjour Awa ».
 * Le destinataire voit donc son propre prénom en guise de résumé, et l'objet reste seul à
 * porter l'information. Ce bloc est masqué à l'affichage et lu par la liste.
 *
 * Le remplissage en espaces invisibles empêche le client d'aller chercher la suite du corps
 * pour compléter l'aperçu.
 */
function preEnTete(texte: string): string {
  const bourrage = '&#8199;&#65279;&nbsp;'.repeat(60);
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${CLAIR.paper2};opacity:0">${echapper(texte)}${bourrage}</div>`;
}

/**
 * LE MODE SOMBRE.
 *
 * Le jeu clair est écrit EN LIGNE dans chaque élément — c'est la base, elle survit à tout, y
 * compris aux clients qui suppriment `<style>`. Ce bloc ne fait que redéclarer les teintes,
 * exactement comme le système redéclare son mode sombre en valeur plutôt qu'en filtre.
 *
 * `color-scheme` est ce qui empêche Apple Mail d'inverser lui-même les couleurs par-dessus :
 * sans lui, on obtient une carte grise sale et un texte au contraste imprévisible.
 */
function styleSombre(): string {
  return `<style>
  :root{color-scheme:light dark;supported-color-schemes:light dark}
  @media (prefers-color-scheme:dark){
    .mm-band{background:${SOMBRE.band}!important}
    .mm-card{background:${SOMBRE.card}!important}
    .mm-ink,.mm-ink *{color:${SOMBRE.ink}!important}
    .mm-ink2,.mm-ink2 *{color:${SOMBRE.ink2}!important}
    .mm-filet{background:${SOMBRE.line}!important}
    .mm-brd{border-bottom-color:${SOMBRE.line}!important}
    .mm-quote{background:rgba(255,255,255,.055)!important}
    .mm-quote-bar{background:${SOMBRE.ink}!important}
    .mm-btn{background:#FFFFFF!important}
    .mm-btn-a{color:${CLAIR.ink}!important}
    .mm-wordmark{color:${SOMBRE.ink}!important}
  }
  @media (max-width:620px){
    .mm-card{padding:26px 22px!important}
  }
</style>`;
}

export interface Page {
  langue: 'fr' | 'en';
  /** Objet répété dans l'aperçu de la boîte de réception. Une phrase, jamais l'objet à l'identique. */
  apercu: string;
  /** Le contenu de la carte, déjà rendu par les primitives ci-dessus. */
  contenu: string;
  /** Lignes de pied de page : mentions légales, identité de l'émetteur. Facultatif. */
  pied?: string[];
}

/**
 * L'ENVELOPPE COMMUNE.
 *
 * Table imbriquée et non `<div>` : Outlook ne connaît ni `max-width` ni le centrage par
 * `margin:auto`. La table à trois niveaux est le seul centrage qui tienne depuis vingt ans.
 */
export function page({ langue, apercu, contenu, pied }: Page): string {
  const legales = pied?.length
    ? `<p style="margin:0 0 6px;font-size:${ECHELLE.small};line-height:1.7;color:${CLAIR.ink3}" class="mm-ink2">${pied.map(echapper).join('<br>')}</p>`
    : '';

  return `<!doctype html>
<html lang="${langue}" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,900&family=Schibsted+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
${styleSombre()}
</head>
<body style="margin:0;padding:0;background:${CLAIR.paper2};font-family:${FONTES.body};font-size:${ECHELLE.body};line-height:1.45;color:${CLAIR.ink};-webkit-font-smoothing:antialiased" bgcolor="${CLAIR.paper2}" class="mm-band">
${preEnTete(apercu)}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;background:${CLAIR.paper2}" bgcolor="${CLAIR.paper2}" class="mm-band">
  <tr><td align="center" style="padding:32px 16px">

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${LARGEUR}" style="width:100%;max-width:${LARGEUR}px;border-collapse:collapse">

      <tr><td style="padding:0 4px 18px">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="padding-right:11px;vertical-align:middle"><img src="${MONOGRAMME}" width="34" height="34" alt="Max-Morrys" style="display:block;width:34px;height:34px;border:0;border-radius:9px"></td>
          <td style="vertical-align:middle;font-family:${FONTES.display};font-weight:900;font-size:19px;letter-spacing:-.03em;color:${CLAIR.ink}" class="mm-wordmark">Max-Morrys</td>
        </tr></table>
      </td></tr>

      <tr><td style="border-radius:24px 24px 0 0;overflow:hidden">${arc()}</td></tr>

      <tr><td bgcolor="${CLAIR.paper}" style="background:${CLAIR.paper};border-radius:0 0 24px 24px;padding:34px 36px" class="mm-card">
${contenu}
      </td></tr>

      <tr><td style="padding:22px 8px 0">${legales}</td></tr>

    </table>

  </td></tr>
</table>
</body>
</html>`;
}

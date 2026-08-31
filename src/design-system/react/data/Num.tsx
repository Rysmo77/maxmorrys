import type { CSSProperties } from 'react';
import type { NumSource } from '../types';

/**
 * LE SEUL CHEMIN DU DÉPÔT VERS LA FONTE MONOSPACE, POUR UN CHIFFRE.
 *
 * Règle 6 du design system : « un nombre en monospace vient de la base ou d'une source citée.
 * Un nombre qui ne peut pas prendre cette fonte NE S'AFFICHE PAS. »
 *
 * Ce n'est pas une règle de style. Elle vient d'un fait : les chiffres de façade du produit —
 * 340 % de croissance de trafic, 50 étudiants formés, 94 % de réussite, 10 cours créés —
 * étaient affichés sur l'accueil et l'écran de connexion pendant que la base de production
 * comptait 5 comptes, 0 formation publiée, 0 certificat émis et 0 franc encaissé. Ces
 * chiffres-là se vérifient en trente secondes, et un visiteur qui les prend en défaut ne
 * revient pas — ni sur ces chiffres, ni sur les autres.
 *
 * COMMENT LA RÈGLE DEVIENT EXÉCUTABLE. `source` et `asOf` sont OBLIGATOIRES : on ne peut pas
 * afficher un nombre sans nommer d'où il vient ni de quand il date. Et `scripts/ds-check.mjs`
 * refuse toute autre atteinte à `--f-mono` / `.mm-num` / `font-mono` dans le dépôt. Les deux
 * ensemble ferment le chemin ; l'un seul ne suffirait pas.
 *
 * CE QUI EN DÉCOULE, et qui surprend :
 *
 *   • UN ZÉRO DATÉ EST UNE VALEUR. « 0 certificat émis · relevé du 30/08 » s'affiche.
 *     Un tiret, un « — », un « N/A » n'en sont pas : ils cachent la différence entre
 *     « c'est zéro » et « je ne sais pas ».
 *   • `value = null` N'AFFICHE PAS UN TIRET. Il rend `fallback` — un état vide qui dit
 *     pourquoi la valeur manque. C'est le cœur du composant.
 *   • AUCUN CHIFFRE DE DÉMONSTRATION, même en placeholder. Un faux nombre finit toujours
 *     en production.
 *
 * INTERDITS ABSOLUS, sans exception, quelle que soit la source : note en étoiles, nombre
 * d'avis, nombre d'élèves ou d'inscrits, taux de réussite, témoignage, logo client,
 * « rejoint par N personnes ».
 */
export interface NumProps {
  /**
   * La valeur. `null` ou `undefined` signifie « je ne l'ai pas » — et se rend en `fallback`,
   * jamais en tiret.
   */
  value: number | string | null | undefined;
  /**
   * D'où vient le nombre. Obligatoire, et c'est tout l'objet du composant.
   * À la revue, pour chaque <Num> : nommer la requête ou la source qui produit la valeur.
   * Si personne ne sait, la valeur sort de l'écran.
   */
  source: NumSource;
  /**
   * La date du relevé. Obligatoire : « toute case de relevé porte sa date. Une case sans
   * date affiche non relevé, jamais une estimation. »
   */
  asOf: Date;
  /** Unité ou suffixe — « FCFA », « % », « leçons ». En corps, pas en monospace. */
  unit?: string;
  /**
   * Affiche « · relevé du JJ/MM » à côté du nombre. Obligatoire sur une case de relevé
   * d'administration ; facultatif sur un prix, dont la date n'apprend rien.
   */
  showAsOf?: boolean;
  /**
   * Ce qui s'affiche quand la valeur manque. Une invitation ou une explication, jamais une
   * excuse et jamais un tiret.
   * @default "non relevé"
   */
  fallback?: string;
  /**
   * Séparateur de milliers : espace insécable en français, virgule en anglais.
   * Par défaut, lu sur `<html lang>` — le composant ne dépend pas d'i18next, qui est du
   * domaine et n'a rien à faire dans une primitive.
   */
  locale?: 'fr' | 'en';
  className?: string;
  style?: CSSProperties;
}

function readLang(): 'fr' | 'en' {
  if (typeof document === 'undefined') return 'fr';
  return document.documentElement.lang.startsWith('en') ? 'en' : 'fr';
}

/** Espace insécable en français (95 000 F), virgule en anglais (95,000 F). */
function group(n: number, locale: 'fr' | 'en'): string {
  const [int, dec] = Math.abs(n).toString().split('.');
  const sep = locale === 'en' ? ',' : ' ';
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  return (n < 0 ? '-' : '') + grouped + (dec ? (locale === 'en' ? '.' : ',') + dec : '');
}

/** Ce que le nombre dit de lui-même à qui survole, et à un lecteur d'écran. */
function provenance(source: NumSource, asOf: Date, locale: 'fr' | 'en'): string {
  const d = asOf.toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  if (source === 'db') return locale === 'en' ? `From the database · ${d}` : `Lu en base · relevé du ${d}`;
  if (source === 'server') return locale === 'en' ? `Recomputed server-side · ${d}` : `Recalculé côté serveur · relevé du ${d}`;
  return locale === 'en' ? `${source.cite} · ${d}` : `${source.cite} · relevé du ${d}`;
}

export function Num({
  value, source, asOf, unit, showAsOf, fallback, locale, className = '', style,
}: NumProps) {
  const loc = locale ?? readLang();

  // La valeur manque : on le DIT. Un tiret laisserait croire à un zéro, ou à un bug.
  if (value === null || value === undefined || value === '') {
    return (
      <span
        className={className}
        style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-meta-2)', fontStyle: 'italic', ...style }}
      >
        {fallback ?? (loc === 'en' ? 'not measured' : 'non relevé')}
      </span>
    );
  }

  const shown = typeof value === 'number' ? group(value, loc) : value;
  const short = asOf.toLocaleDateString(loc === 'en' ? 'en-GB' : 'fr-FR', { day: '2-digit', month: '2-digit' });

  return (
    <span className={className} style={{ ...style }}>
      {/* `.mm-num` porte la fonte, la graisse 700, les chiffres tabulaires et l'interlettrage.
          Tabulaire toujours : sans ça, une colonne de nombres qui se met à jour tressaute. */}
      <span className="mm-num" title={provenance(source, asOf, loc)}>
        {shown}
      </span>
      {unit && <span style={{ fontFamily: 'var(--f-body)', fontWeight: 400, marginLeft: '4px' }}>{unit}</span>}
      {showAsOf && (
        // --text-muted, jamais --text-faint : l'encre tertiaire ne porte pas de texte (AD-18).
        <span style={{ fontFamily: 'var(--f-body)', fontSize: 'var(--fs-small)', color: 'var(--text-muted)', marginLeft: '6px' }}>
          {loc === 'en' ? `· as of ${short}` : `· relevé du ${short}`}
        </span>
      )}
    </span>
  );
}

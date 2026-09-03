import type { CSSProperties, ReactNode } from 'react';
import type { NumSource } from '../types';
import { Num } from './Num';

/**
 * Le prix. Toujours en monospace tabulaire, donc toujours par <Num> : dans ce système, un
 * nombre en monospace vient de la base ou d'une source citée, et le montant DÉBITÉ est celui
 * que le serveur recalcule — jamais celui qu'affiche le navigateur. D'où `source: 'server'`
 * pour un montant de tunnel d'achat, et `'db'` pour une grille tarifaire lue en base.
 *
 * LE CADRAGE MENSUEL EST OBLIGATOIRE SUR LE CLUB. 19 900 par an franchit seul un seuil de
 * délibération que 1 658 par mois ne franchit pas ; c'est la même somme, et la personne doit
 * pouvoir la regarder des deux côtés. Ce cadrage vit dans `note`.
 *
 * LA CONTREVALEUR (`approx`) SE POSE ENTRE LE MONTANT ET LA NOTE, ET PAS AILLEURS. C'est un
 * prix d'aide à la lecture — euro sur la version française, dollar sur l'anglaise — et sa
 * place dans la hiérarchie est tout le sujet : au-dessus, il concurrencerait le montant
 * débité ; dans la note, il se lirait comme une condition de vente. Cette primitive ne sait
 * NI convertir NI choisir la devise : elle reçoit du texte déjà écrit, comme <Num> reçoit
 * déjà sa langue de `<html lang>`. Le change est du domaine, il vit dans `lib/currency`.
 *
 * Elle ne prend pas la monospace, non plus. Le tabulaire sert à aligner des colonnes de
 * chiffres comparables ; une estimation arrondie n'en est pas une, et lui donner la même
 * face qu'au montant réel, c'est lui donner la même autorité.
 *
 * L'ANCIEN PRIX BARRÉ N'EST PAS UNE DÉCORATION. `<s>` est visuel : un lecteur d'écran annonce
 * deux montants d'affilée sans dire lequel est mort. `strikeLabel` porte le mot qui les
 * distingue — et il n'a AUCUN DÉFAUT, parce qu'une primitive n'écrit pas la copie d'un
 * produit bilingue.
 */
export interface PriceBlockProps {
  /**
   * Le montant. UN NOMBRE PLUTÔT QU'UNE CHAÎNE dès qu'on l'a : <Num> groupe alors les
   * milliers selon la langue — espace insécable en français, virgule en anglais — au lieu de
   * figer le groupement français dans une chaîne que la page anglaise affichera telle quelle.
   */
  amount: { value: number | string; source: NumSource; asOf: Date };
  /**
   * @default "FCFA"
   * La devise NE passe pas par `unit` de <Num>, et c'est délibéré : `unit` hérite du corps du
   * montant, or le kit la pose à 14 px en graisse 600 contre 31 px pour le chiffre. Le rapport
   * de taille entre les deux est un dessin, pas un accident.
   */
  currency?: string;
  /** Prix barré, en promotion de lancement. */
  strike?: { value: number | string; source: NumSource; asOf: Date };
  /** Ce que le lecteur d'écran entend avant le prix barré — « Ancien prix ». */
  strikeLabel?: string;
  /**
   * La contrevaleur indicative, DÉJÀ ÉCRITE et déjà porteuse de son « ≈ » — « ≈ 30 € ».
   * Côté produit, elle vient de `<PriceApprox>`, jamais d'une concaténation locale.
   */
  approx?: ReactNode;
  /** Sous le prix : « Une fois, accès à vie », l'équivalent mensuel, l'échéancier. */
  note?: ReactNode;
  /** @default 31 */
  size?: number;
  style?: CSSProperties;
}

export function PriceBlock({ amount, currency = 'FCFA', strike, strikeLabel, approx, note, size = 31, style }: PriceBlockProps) {
  return (
    <div style={style}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        {/* La taille est portée ici, la FACE est portée par <Num> : c'est lui qui détient le
            seul chemin du dépôt vers la monospace, et l'interlettrage tabulaire vient avec. */}
        <b style={{ fontSize: `${size}px`, letterSpacing: '-.04em' }}>
          <Num value={amount.value} source={amount.source} asOf={amount.asOf} />
        </b>
        <span style={{ fontSize: '14px', fontWeight: 600 }}>{currency}</span>
        {strike && (
          <s style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {strikeLabel && <span className="sr-only">{strikeLabel} </span>}
            <Num value={strike.value} source={strike.source} asOf={strike.asOf} />
          </s>
        )}
      </div>
      {/* 13 px contre 12,5 pour la note, et graisse 600 : la contrevaleur est un prix, pas une
          mention légale. Elle reste sous --text-muted — le montant débité garde l'encre pleine. */}
      {approx && (
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '3px' }}>
          {approx}
        </p>
      )}
      {/* --text-muted et non --text-faint : le kit posait le prix barré sur rgba(14,17,22,.42),
          soit l'encre tertiaire — 2,61:1 sur blanc pur, et invisible sous `.dk` puisque la
          valeur d'encre y reste sombre au lieu de blanchir (AD-3 bis, AD-18). */}
      {note && <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>{note}</p>}
    </div>
  );
}

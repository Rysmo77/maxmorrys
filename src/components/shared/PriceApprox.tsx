import { useTranslation } from 'react-i18next';
import { useFormat } from '../../hooks/useFormat';
import { FX_AS_OF, XOF_PER_EUR } from '../../lib/currency/convert';

/**
 * LA CONTREVALEUR, À L'ÉCRAN. « ≈ 30 € » en français, « ≈ $35 » en anglais.
 *
 * Le seul chemin du produit vers un prix converti : la conversion, l'arrondi, le « ≈ » et la
 * provenance sortent tous d'ici ou de `lib/currency/convert.ts`, jamais d'une concaténation
 * de page. Sans ce point de passage, le « ≈ » se perd à un endroit sur cinq — et un prix
 * approximatif qui perd son signe devient un second prix affiché, sur des pages dont
 * l'argument est justement que les prix y sont annoncés.
 *
 * CE QU'IL NE FAIT PAS, et qui est le fond du dessin : il ne remplace jamais le montant en
 * FCFA, il se pose dessous. Le franc est la devise du contrat et du débit ; l'euro et le
 * dollar sont des repères de lecture pour qui ne compte pas en francs.
 *
 * `title` porte la provenance — parité fixe pour l'euro, taux daté pour le dollar. Les deux
 * ne se disent pas pareil parce qu'ils ne le sont pas : l'un est garanti par le Trésor, l'autre
 * dérivera. La page pose en plus, une fois par grille tarifaire, la note visible
 * `secondaryPrice.footnote` : une info-bulle répétée douze fois n'est lue par personne, et
 * n'est pas lue du tout à la tabulation.
 */
export function PriceApprox({ xof, className }: { xof: number; className?: string }) {
  const { t } = useTranslation('common');
  const { formatApprox, secondaryCurrency, locale } = useFormat();

  const text = formatApprox(xof);
  if (!text) return null;

  const title = secondaryCurrency === 'EUR'
    ? t('secondaryPrice.fixedParity', { rate: XOF_PER_EUR.toLocaleString(locale, { minimumFractionDigits: 3 }) })
    : t('secondaryPrice.floatingRate', { date: FX_AS_OF.toLocaleDateString(locale) });

  return <span className={className} title={title}>{text}</span>;
}

/**
 * LA NOTE VISIBLE, UNE FOIS PAR GRILLE TARIFAIRE.
 *
 * Elle dit les deux choses que l'info-bulle de `<PriceApprox>` ne dira jamais à qui navigue au
 * clavier, au doigt ou au lecteur d'écran : le franc est la devise du débit, et l'autre montant
 * est une contrevaleur. Une info-bulle répétée sur douze cartes est douze fois inaccessible ;
 * une phrase posée sous la grille est lue une fois par tout le monde.
 *
 * Elle se pose SOUS les prix, jamais au-dessus : c'est une précision sur ce qu'on vient de
 * lire, pas un préambule à la lecture.
 */
export function PriceFootnote({ className = '' }: { className?: string }) {
  const { t } = useTranslation('common');
  return <p className={`text-small text-ink-2 ${className}`}>{t('secondaryPrice.footnote')}</p>;
}

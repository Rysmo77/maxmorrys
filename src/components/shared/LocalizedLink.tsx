import { Link, type LinkProps } from 'react-router-dom';
import { useLocalizedPath } from '../../contexts/LanguageContext';

/**
 * Comme <Link>, mais préfixe automatiquement les chemins absolus selon la langue
 * active (/en…), afin que la navigation reste dans la même langue.
 * Les `to` non-string (objets) et les URLs externes sont laissés tels quels.
 */
export default function LocalizedLink({ to, ...rest }: LinkProps) {
  const localize = useLocalizedPath();
  const resolved =
    typeof to === 'string' && to.startsWith('/') ? localize(to) : to;
  return <Link to={resolved} {...rest} />;
}

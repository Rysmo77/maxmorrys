import { useNavigation } from 'react-router-dom';
import LogoLoader from './LogoLoader';

/**
 * LA PASTILLE DES NAVIGATIONS — le logo animé, flottant sous la barre haute, pendant qu'une
 * navigation du routeur de données charge (`useNavigation().state === 'loading'`).
 *
 * Elle n'existe dans le DOM que pendant le chargement, et `LogoLoader` ne la dessine qu'après
 * 200 ms : une navigation servie depuis le cache ne montre rien. Les pages paresseuses dont le
 * code n'est pas encore là passent, elles, par le repli `<Suspense>` (`PageLogoLoader`) — le
 * même logo, à la place de la page.
 */
export default function NavigationLoader() {
  const { state } = useNavigation();
  if (state !== 'loading') return null;
  return (
    <div className="mm-ll-nav">
      <LogoLoader size="sm" delay={200} />
    </div>
  );
}

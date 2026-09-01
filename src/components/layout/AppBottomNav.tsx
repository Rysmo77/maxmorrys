import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedPath } from '../../contexts/LanguageContext';
import { toCanonicalPath } from '../../i18n/routing';
import { Icon, TabBar, type IconName, type TabBarItem } from '../../design-system';
import DsNavHost from './DsNavHost';

/**
 * LA BARRE D'ONGLETS BASSE — 80 px, sous 700 px, et l'AUTRE des deux seules surfaces floutées
 * du produit.
 *
 * Elle y a droit pour la même raison que la barre haute : elle ne défile pas, et le contenu
 * passe RÉELLEMENT dessous. Le flou vient de `.glass`, posé par la primitive — il n'est écrit
 * nulle part ici, et c'est le point : « combien de surfaces sont floutées » doit rester une
 * question à laquelle un grep répond.
 *
 * CE QUI A CHANGÉ
 *
 * 1. LA HAUTEUR. 64 px (`h-16`) contre les 80 px du jeton `--tabbar-h`. Les 16 px manquants
 *    sont exactement ce qui permet à un libellé de tenir sous son glyphe sans se serrer.
 * 2. LE POINT DE RUPTURE. `stack:hidden` (768 px) contre les 700 px du système. Entre les deux
 *    vivaient les tablettes en portrait, qui recevaient une barre d'onglets là où le système
 *    prévoit la navigation latérale.
 * 3. LE VERRE. `bg-[color-mix(in_srgb,var(--paper)_95%,transparent)] backdrop-blur` écrivait un flou en ligne, invérifiable par grep, et
 *    un fond clair figé sous des glyphes qui deviennent #ECF0F5 en nuit — 1,4:1. `--tabbar-bg`
 *    passe seul de 62 % de blanc à rgba(13,17,23,.72), sans prop et sans variante `dark:`.
 * 4. L'ONGLET COURANT. Il n'était marqué que par une COULEUR : invisible pour qui ne la
 *    distingue pas, et absent de tout lecteur d'écran. La primitive pose `aria-current="page"`.
 *
 * Les glyphes restent Lucide, à 2,2 px de trait : le jeu unique du système n'a pas
 * d'équivalent pour les dix-neuf entrées de la console, et le dépôt ne mélange pas deux
 * familles sur un même écran. La migration est déclarée différée, pas oubliée.
 */
export interface BottomNavItem {
  to: string;
  label: string;
  /** Un NOM de glyphe — voir `AppSidebar`, même raison. */
  icon: IconName;
  end?: boolean;
  badge?: number | null;
}

interface AppBottomNavProps {
  items: BottomNavItem[];
}

export default function AppBottomNav({ items }: AppBottomNavProps) {
  const { t } = useTranslation('lms');
  const localize = useLocalizedPath();
  const path = toCanonicalPath(useLocation().pathname);

  const isOn = (item: BottomNavItem) =>
    item.end ? path === item.to : path === item.to || path.startsWith(item.to + '/');

  const active = items.find(isOn)?.label;

  const tabs: TabBarItem[] = items.map((item) => ({
    label: item.label,
    href: localize(item.to),
    icon: (
      <span className="relative block">
        <Icon name={item.icon} size={21} strokeWidth={2.2} />
        {item.badge != null && item.badge > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-pill bg-[color:var(--stop)] text-[color:var(--paper-fixed)] text-[9px] font-bold flex items-center justify-center">
            {item.badge > 9 ? '9+' : item.badge}
          </span>
        )}
      </span>
    ),
  }));

  return (
    // `stack:hidden` : au-delà de 700 px, c'est la navigation latérale qui prend le relais.
    // Le conteneur disparaît avec elle, donc la barre fixée aussi.
    <DsNavHost className="stack:hidden">
      <TabBar
        items={tabs}
        active={active}
        label={t('shell.primaryNav')}
        // La zone sûre de l'iPhone s'ajoute à la hauteur du jeton : sans ça, la dernière
        // rangée de libellés passe sous la barre système.
        style={{
          height: 'calc(var(--tabbar-h) + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      />
    </DsNavHost>
  );
}

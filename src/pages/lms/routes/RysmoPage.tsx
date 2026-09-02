import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, Segmented } from '@ds';
import RysmoStoreTab from '../tabs/RysmoStoreTab';
import RysmoMemoryTab from '../tabs/RysmoMemoryTab';
import SpaceSplit from '../components/SpaceSplit';
import TutorPanel from '../components/TutorPanel';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { useAuth } from '../../../contexts/AuthContext';
import { tutorName } from '../../../lib/naming';
import type { StudentLayoutContext } from '../../../components/layout/StudentLayout';

type RysmoSubTab = 'tokens' | 'memoire';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'ÉCRAN DU RÉPÉTITEUR — `handoff_tableaux_de_bord` § RepetiteurDesktop.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LES DEUX COLONNES SONT INVERSÉES PAR RAPPORT À LA MAQUETTE, ET C'EST DÉLIBÉRÉ.
 *
 * La maquette met la CONVERSATION dans la colonne de travail et le nom + la mémoire
 * dans le panneau de 340. La reprendre littéralement demanderait un second moteur de
 * dialogue sur cet écran : `RysmoWidget` est le SEUL du produit, monté une fois dans
 * `App.tsx`, et c'est lui qui tient le fil, le quota et l'appel au modèle. En écrire
 * un deuxième ici, c'est deux fils à synchroniser et deux endroits où décompter un
 * quota qui, lui, n'existe qu'une fois côté serveur.
 *
 * Ce que la maquette ACHÈTE avec cette disposition est écrit dans son sélecteur :
 * « mémoire et renommage visibles pendant la conversation ». Les deux colonnes
 * échangées, cette phrase reste vraie au mot près — la conversation vit dans le
 * panneau (`TutorPanel`, qui la lit et la relance), la mémoire et le renommage dans
 * la colonne de travail. Aucun des deux n'est un écran qu'on ouvre.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LES SOUS-ONGLETS PASSENT AU DESIGN SYSTEM.
 *
 * Ils étaient une barre faite à la main — dix classes utilitaires, un `hover:` qui
 * doublait la règle du kit, et un `bg-surface-sheet` posé en dur. `Segmented` est le
 * composant que le système destine exactement à ça (`ProfilDesktop` l'emploie deux
 * fois), il porte son propre nom accessible, son anneau de focus et son état actif.
 *
 * ⚠️ L'ÉTAT RESTE DANS L'URL. `?tab=memoire` est ce que `TutorPanel` vise quand on
 * ouvre la mémoire depuis le tableau de bord, et ce qu'un lien partagé doit pouvoir
 * porter. `Segmented` ne fait que l'écrire.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export default function RysmoPage() {
  const { t } = useTranslation('lms');
  const ctx = useOutletContext<StudentLayoutContext>();
  const { userData } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const active: RysmoSubTab = searchParams.get('tab') === 'memoire' ? 'memoire' : 'tokens';

  const tutor = tutorName(userData);

  /* Le panneau relève le quota par un appel serveur à son montage : il est DÉMONTÉ
     sous 1080 px, pas caché. Une classe `hidden` aurait laissé partir l'appel sur
     téléphone, où le widget flottant porte déjà la conversation. */
  const isWide = useMediaQuery('(min-width: 1080px)');

  const OPTIONS = [t('rysmoPage.tabTokens'), t('rysmoPage.tabMemory')];
  const setActive = (label: string) => {
    const tab: RysmoSubTab = label === OPTIONS[1] ? 'memoire' : 'tokens';
    setSearchParams(tab === 'tokens' ? {} : { tab }, { replace: true });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 wide:max-w-none wide:px-pane">
      <SpaceSplit asideLabel={tutor} aside={isWide ? <TutorPanel /> : null}>
        <div className="space-y-6">
          {/*
            LE TITRE A ÉTÉ RETIRÉ D'ICI, POUR DEUX RAISONS QUI SE CUMULAIENT.

            1 · Il écrivait « Rysmo » EN DUR. C'est le nom de l'APPLICATION, pas celui du
                répétiteur qui vit dedans — celui-là s'appelle « Répétiteur » par défaut et
                chaque personne peut le renommer (AD-12, `lib/naming`). `AppShell` rend déjà le
                titre de cette page depuis `titleMap['/mon-espace/repetiteur'] = tutorName(userData)` :
                quelqu'un qui avait appelé le sien « Coach » lisait donc « Coach » dans la barre
                haute et « Rysmo » quinze centimètres plus bas, sur le même écran.

            2 · C'était un SECOND `<h1>` sur la page. `NotesTab` et `DashboardTab` documentent
                tous deux avoir écarté le leur pour cette raison ; celui-ci avait survécu.

            Le glyphe et le sous-titre restent : ils situent l'écran sans le renommer.
          */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[image:var(--action-digitalise)] shadow-md">
              <Icon name="bot" size={24} className="text-white" />
            </div>
            <p className="text-meta text-ink-2">{t('rysmoPage.subtitle')}</p>
          </div>

          <Segmented
            className="max-w-md"
            label={t('rysmoPage.tabsLabel', { tutor })}
            options={OPTIONS}
            value={active === 'memoire' ? OPTIONS[1] : OPTIONS[0]}
            onChange={setActive}
          />

          {active === 'tokens' ? (
            <RysmoStoreTab />
          ) : (
            <RysmoMemoryTab enrolledFormations={ctx.enrolledFormations} />
          )}
        </div>
      </SpaceSplit>
    </div>
  );
}

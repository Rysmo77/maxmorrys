import { useTranslation } from 'react-i18next';
import { Wordmark } from '@ds';

/**
 * L'ÉCRAN DE LANCEMENT.
 *
 * LE SEUL ENDROIT DU PRODUIT OÙ LE MAILLAGE EST FIGÉ SANS QUE L'APPAREIL L'EXIGE. Partout
 * ailleurs, la dérive ne s'arrête que sous `.lowfi` (appareil modeste) ou sous
 * `prefers-reduced-motion` (demande explicite). Ici, elle s'arrête pour tout le monde : au
 * lancement, le processeur sert à démarrer l'application, pas à animer trois lobes flous que
 * personne ne regardera plus d'une seconde.
 *
 * D'où un maillage écrit à la main plutôt que <Mesh> : le composant porte les animations, et
 * les désactiver depuis l'extérieur reviendrait à faire tourner ce qu'on veut arrêter.
 *
 * Le nom affiché est celui de l'APPLICATION — « Rysmo » — et pas celui de la personne. C'est
 * l'un des trois endroits où la distinction se voit, avec la bannière d'installation et
 * l'écran de connexion.
 *
 * AUCUN INDICATEUR DE CHARGEMENT. Un rond qui tourne sur un écran de lancement ne dit rien
 * que l'écran ne dise déjà, et il coûte une animation au moment le plus chargé.
 */
export default function Splash() {
  const { t } = useTranslation('shared');
  return (
    <div
      role="status"
      aria-label={t('pwa.splash.label')}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'grid', placeItems: 'center',
        background: 'var(--surface-page)',
      }}
    >
      {/* Trois lobes, aux positions et aux teintes du maillage « Je te forme » — mais SANS
          animation. Les valeurs sont celles de brand/mesh.css, à l'arrêt. */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', contain: 'paint' }}>
        <b style={{ position: 'absolute', top: '-120px', left: '-110px', width: '340px', height: '340px', borderRadius: '50%', background: 'var(--mm-bleu)', filter: 'blur(52px)', opacity: 0.9 }} />
        <b style={{ position: 'absolute', top: '-160px', right: '-120px', width: '340px', height: '340px', borderRadius: '50%', background: 'var(--mm-violet)', filter: 'blur(52px)', opacity: 0.65 }} />
        <b style={{ position: 'absolute', top: '120px', right: '-160px', width: '340px', height: '340px', borderRadius: '50%', background: 'var(--mm-teal)', filter: 'blur(52px)', opacity: 0.5 }} />
        <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(255,255,255,.60) 0%,rgba(255,255,255,.78) 46%,rgba(255,255,255,.90) 100%)' }} />
      </div>

      <div style={{ position: 'relative', textAlign: 'center' }}>
        <Wordmark brand="rysmo" size={42} />
        {/* --text-muted, jamais --text-faint (AD-18). */}
        <p style={{ margin: 0, marginTop: 'var(--sp-8)', fontSize: 'var(--fs-meta)', color: 'var(--text-muted)' }}>
          Tes formations, tes leçons, ton répétiteur.
        </p>
      </div>
    </div>
  );
}

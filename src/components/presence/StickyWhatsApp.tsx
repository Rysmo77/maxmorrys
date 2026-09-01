import { useState, useEffect, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@ds';
import { whatsappUrl } from '../../lib/presence/whatsapp';

interface Props {
  /** Message pré-rempli, construit à partir du pack sélectionné le cas échéant. */
  message?: string;
  /**
   * Zone qui EFFACE le bouton tant qu'elle est à l'écran. Le formulaire de devis, en
   * pratique : les deux mènent au même endroit, et le bouton collant recouvrait son bouton
   * d'envoi. Facultatif — sans lui, le bouton ne s'efface jamais.
   */
  hideNear?: RefObject<HTMLElement | null>;
}

/**
 * Bouton WhatsApp collant, mobile uniquement.
 *
 * La cible vit dans WhatsApp : lui imposer de remonter jusqu'au formulaire pour
 * poser une question fait perdre le contact. Le bouton n'apparaît qu'après le hero,
 * pour ne pas recouvrir le premier écran.
 *
 * ── ET IL S'EFFACE DEVANT LE FORMULAIRE ──────────────────────────────────────────────
 * `inset-x-4 bottom-4` en pleine largeur, sans réserve de bas de page : arrivé au bas du
 * formulaire, il se posait par-dessus « Envoyer ma demande ». Deux boutons superposés dont
 * l'un cache l'autre, et c'est le bouton d'envoi — celui qui produit le devis — qui
 * disparaissait sous le raccourci.
 *
 * D'où l'observateur : tant que le formulaire est à l'écran, le raccourci se retire. Ils
 * mènent au même endroit, il n'y a rien à perdre à laisser la place au champ qu'on remplit.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
export default function StickyWhatsApp({ message, hideNear }: Props) {
  const { t } = useTranslation('presence');
  const [pastHero, setPastHero] = useState(false);
  const [nearForm, setNearForm] = useState(false);

  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const target = hideNear?.current;
    if (!target) return;
    // `IntersectionObserver` plutôt qu'un calcul dans le gestionnaire de défilement : le
    // navigateur le fait hors du fil principal, sur des téléphones que cette offre vise.
    const io = new IntersectionObserver(
      ([entry]) => setNearForm(entry.isIntersecting),
      { rootMargin: '0px 0px -25% 0px' },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [hideNear]);

  if (!pastHero || nearForm) return null;

  const href = whatsappUrl(message);

  /*
   * Chrome fixe — donc l'un des trois seuls endroits où le flou est autorisé (règle 1).
   * Il n'en porte pourtant pas : ce bouton est plein, opaque, posé sur du contenu qui
   * défile dessous. Un voile flouté derrière un aplat ne se verrait pas, et coûterait
   * une couche de composition à chaque image sur les téléphones que cette offre vise.
   */
  return (
    <div
      className="fixed inset-x-4 bottom-4 z-40 wide:hidden"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Button href={href} tone="digitalise" target="_blank">
        {t('stickyCta')}
      </Button>
    </div>
  );
}

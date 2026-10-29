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
  /** `id` de la seule zone où la barre a le droit d'exister (défaut : `packs`). */
  zoneId?: string;
}

/**
 * Bouton WhatsApp collant, sous `wide` (1080 px), cantonné à la zone des packs.
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
export default function StickyWhatsApp({ message, hideNear, zoneId = 'packs' }: Props) {
  const { t } = useTranslation('presence');
  const [inZone, setInZone] = useState(false);
  const [nearForm, setNearForm] = useState(false);

  useEffect(() => {
    /*
     * LIMITÉ À LA ZONE DES PACKS (audit UI/UX du 29/10/2026, registre #7).
     *
     * Visible partout après le héros, la barre recouvrait le test Google Maps et le
     * sélecteur de pack, et doublait le CTA de devis — deux CTA primaires à l'écran. Elle
     * ne vit plus que pendant la traversée de `#packs` : elle apparaît quand la section
     * occupe le bas de l'écran, et se retire AVANT que son bord bas n'arrive sous la barre
     * (réserve `BAR_RESERVE`), pour ne jamais masquer le dernier « Choisir ».
     * Sans `#packs` dans la page, repli sur l'ancien seuil « après le héros ».
     */
    const BAR_RESERVE = 96;
    const onScroll = () => {
      const zone = document.getElementById(zoneId);
      if (!zone) {
        setInZone(window.scrollY > 600);
        return;
      }
      const r = zone.getBoundingClientRect();
      const vh = window.innerHeight;
      setInZone(r.top < vh * 0.5 && r.bottom > vh + BAR_RESERVE);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [zoneId]);

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

  if (!inZone || nearForm) return null;

  const href = whatsappUrl(message);

  /*
   * Chrome fixe — donc l'un des trois seuls endroits où le flou est autorisé (règle 1).
   * Il n'en porte pourtant pas : ce bouton est plein, opaque, posé sur du contenu qui
   * défile dessous. Un voile flouté derrière un aplat ne se verrait pas, et coûterait
   * une couche de composition à chaque image sur les téléphones que cette offre vise.
   */
  return (
    <div
      className="fixed inset-x-4 bottom-4 z-40 stack:left-auto stack:right-6 stack:bottom-6 wide:hidden"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Button href={href} tone="digitalise" target="_blank">
        {t('stickyCta')}
      </Button>
    </div>
  );
}

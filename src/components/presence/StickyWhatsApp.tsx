import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';
import { whatsappUrl } from '../../lib/presence/whatsapp';

interface Props {
  /** Message pré-rempli, construit à partir du pack sélectionné le cas échéant. */
  message?: string;
}

/**
 * Bouton WhatsApp collant, mobile uniquement.
 *
 * La cible vit dans WhatsApp : lui imposer de remonter jusqu'au formulaire pour
 * poser une question fait perdre le contact. Le bouton n'apparaît qu'après le hero,
 * pour ne pas recouvrir le premier écran.
 */
export default function StickyWhatsApp({ message }: Props) {
  const { t } = useTranslation('presence');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  const href = whatsappUrl(message);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      // pb-[env(safe-area-inset-bottom)] : évite la barre système des iPhone récents.
      className="lg:hidden fixed bottom-4 inset-x-4 z-40 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full font-bold text-sm bg-lagoon-700 hover:bg-lagoon-800 active:bg-lagoon-900 text-white shadow-xl shadow-lagoon-900/20 transition-colors"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <MessageCircle className="w-4 h-4" aria-hidden="true" />
      {t('stickyCta')}
    </a>
  );
}

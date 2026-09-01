import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, GlassPanel, Icon, Skeleton, type IconName } from '@ds';
import { useAuth } from '../../contexts/AuthContext';
import { markAllNotificationsRead, markNotificationRead, subscribeNotifications } from '../../lib/firestore';
import type { AppNotification, NotificationType } from '../../types';

/**
 * LE CENTRE DE NOTIFICATIONS — le SEUL canal sortant du produit.
 *
 * Cette phrase n'est pas une figure de style, c'est une contrainte de produit qui se lit
 * partout : **il n'existe aucun canal d'envoi d'e-mail**. Aucun écran ne doit donc promettre
 * « on te préviendra », « tu recevras » ou « préviens-moi par e-mail ». Là où cette promesse
 * était écrite, le produit ment ; là où elle est remplacée par un interrupteur désactivé et
 * une ligne grisée, il dit la vérité.
 *
 * Ce que ça veut dire ici : une notification n'atteint la personne QUE si elle ouvre
 * l'application. Le centre doit donc être facile à retrouver et honnête sur son âge — d'où
 * la date sur chaque ligne, et pas seulement sur les non lues.
 *
 * CINQ TYPES, et pas un sixième : inscription, certificat, contenu, club, système. Ils sont
 * déjà le type `NotificationType` du dépôt, à l'identique.
 */
const GLYPH: Record<NotificationType, IconName> = {
  enrollment: 'book',
  certificate: 'star',
  content: 'doc',
  club: 'users',
  system: 'info',
};

/**
 * La couleur dit le territoire, pas l'urgence.
 *
 * L'inscription et le certificat relèvent de « Je te forme » (bleu) ; le contenu de
 * « Je t'informe » — et l'orange étant interdit en texte, c'est sa variante `-t` ; le club
 * de « Je te transforme » (violet). Le système n'a pas de territoire : il porte l'encre.
 */
const TONE: Record<NotificationType, string> = {
  enrollment: 'var(--mm-bleu)',
  certificate: 'var(--mm-bleu)',
  content: 'var(--mm-orange-t)',
  club: 'var(--mm-violet)',
  system: 'var(--ink-2)',
};

export default function NotificationCenter() {
  const { t } = useTranslation('shared');
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[] | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setItems([]);
      return;
    }
    return subscribeNotifications(user.uid, setItems);
  }, [user?.uid]);

  if (items === null) {
    return (
      <div style={{ display: 'grid', gap: 'var(--sp-10)' }}>
        {[0, 1, 2].map((i) => <Skeleton key={i} height={70} radius="var(--r-m)" label={t('pwa.notifications.loading')} />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        glyph={<Icon name="bell" size={26} />}
        title={t('pwa.notifications.empty')}
        // Un état vide INVITE, il ne s'excuse pas. Et il dit la contrainte plutôt que de la
        // masquer : tout passe par ici, donc revenir ici est le geste utile.
        body={t('pwa.notifications.emptyBody')}
      />
    );
  }

  const unread = items.filter((n) => !n.read).length;

  return (
    <section>
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 'var(--sp-12)', marginBottom: 'var(--sp-14)' }}>
        <p className="mm-eyebrow" style={{ margin: 0 }}>
          {unread > 0 ? t('pwa.notifications.unread', { count: unread }) : t('pwa.notifications.allRead')}
        </p>
        {unread > 0 && user?.uid && (
          <Button tone="quiet" size="sm" onClick={() => void markAllNotificationsRead(user.uid)}>
            {t('pwa.notifications.markAll')}
          </Button>
        )}
      </header>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--sp-8)' }}>
        {items.map((n) => {
          const Row = n.link ? 'a' : 'div';
          return (
            <li key={n.id}>
              <Row
                {...(n.link ? { href: n.link, className: 'glass-flat mm-press' } : { className: 'glass-flat' })}
                onClick={() => { if (!n.read && user?.uid) void markNotificationRead(user.uid, n.id); }}
                style={{
                  display: 'flex', gap: 'var(--sp-12)', padding: 'var(--sp-14) var(--pad-panel)',
                  textDecoration: 'none', color: 'inherit',
                  // La non-lue ne se distingue pas par une couleur de fond — ce serait une
                  // troisième surface. Un filet coloré à gauche suffit et ne coûte rien.
                  borderLeft: n.read ? '3px solid transparent' : `3px solid ${TONE[n.type]}`,
                }}
              >
                <span aria-hidden="true" style={{ color: TONE[n.type], flex: '0 0 auto', marginTop: '1px' }}>
                  <Icon name={GLYPH[n.type]} size={18} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: n.read ? 500 : 700, fontSize: 'var(--fs-meta)' }}>{n.title}</p>
                  <p style={{ margin: 0, marginTop: '3px', fontSize: 'var(--fs-meta-2)', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                    {n.message}
                  </p>
                  <p style={{ margin: 0, marginTop: '5px', fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>
                    {new Date(n.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </p>
                </div>
                {n.link && (
                  <span aria-hidden="true" style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>
                    <Icon name="forward" size={16} />
                  </span>
                )}
              </Row>
            </li>
          );
        })}
      </ul>

      {/*
        L'AVEU RESTE À L'ÉCRAN QUAND LA BOÎTE SE REMPLIT.

        Il ne vivait que dans l'état vide : dès la première notification, la phrase qui dit
        « aucun e-mail ne part » disparaissait — c'est-à-dire exactement au moment où
        quelqu'un commence à recevoir des choses ici et pourrait croire qu'il en reçoit
        ailleurs. La maquette (`screens-pwa.jsx` § PwaNotifications) le pose en permanence,
        sous la liste, et c'est le sens de l'écran : « une relance qui n'arrive pas ici
        n'arrive nulle part ».
      */}
      <GlassPanel level="truth" style={{ marginTop: 'var(--sp-18)' }}>
        <p className="mm-eyebrow" style={{ margin: '0 0 6px' }}>{t('pwa.notifications.truthTitle')}</p>
        <p style={{ margin: 0, fontSize: 'var(--fs-meta-2)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {t('pwa.notifications.truthBody')}
        </p>
      </GlassPanel>
    </section>
  );
}

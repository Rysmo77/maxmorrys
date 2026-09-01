import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Avatar, Button, ChipRow, Field, GlassPanel, Icon, Skeleton, Tag, TruthPanel } from '@ds';
import { useFormat } from '../../../../hooks/useFormat';
import { getClubOpportunities, createClubOpportunity, deleteClubOpportunity } from '../../../../lib/firestore';
import type { ClubOpportunity } from '../../../../types';
import { staggerContainer, staggerItem } from '../../../../lib/animations';
import { ClubEmptyState, ClubSectionHeader } from './_shared';

type ClubData = ReturnType<typeof import('../../hooks/useClubData').useClubData>;

const initialsOf = (n: string) => n.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();

const TYPES: ClubOpportunity['type'][] = ['mission', 'emploi', 'partenariat', 'autre'];
const TYPE_LABEL_KEYS: Record<ClubOpportunity['type'], string> = {
  mission: 'opportunities.typeMission', emploi: 'opportunities.typeEmploi',
  partenariat: 'opportunities.typePartenariat', autre: 'opportunities.typeAutre',
};

/**
 * LES OPPORTUNITÉS — écran `ClubOpportunites` du kit.
 *
 * LA PHRASE DE BAS D'ÉCRAN DU KIT EST LA PIÈCE MAÎTRESSE, pas un pied de page : « les budgets
 * affichés sont ceux annoncés par la personne qui publie. Ils ne sont pas vérifiés par la
 * plateforme, et c'est écrit ici plutôt que caché. » Elle décrit exactement ce que fait le
 * code — `budget` est un champ de texte libre, saisi par un membre, jamais contrôlé — et elle
 * passe donc dans un encart de vérité, pas dans une note grise en bas.
 *
 * ⚠️ LE BUDGET NE PREND PAS LA MONOSPACE. Le kit le pose dans un `PriceBlock`, qui est la
 * forme d'un PRIX du produit — un montant que le serveur débite. Ici c'est une déclaration
 * d'un tiers, qui peut valoir « 180 000 » comme « à négocier ». Lui donner la fonte des
 * chiffres vérifiés serait lui prêter une autorité qu'il n'a pas : il reste une étiquette.
 *
 * Le filtre par type est celui du kit, câblé sur les quatre types que le modèle porte
 * vraiment — et non sur les trois libellés de la maquette, qui n'existent pas en base.
 */
export default function ClubOpportunities({ data }: { data: ClubData }) {
  const { t } = useTranslation('club');
  const { formatDate } = useFormat();
  const { user, displayName, photoURL, addToast } = data;
  const [items, setItems] = useState<ClubOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', type: 'mission' as ClubOpportunity['type'], budget: '', contact: '' });

  useEffect(() => {
    getClubOpportunities().then(setItems).then(() => setLoading(false)).catch(() => setLoading(false));
  }, []);

  const filterOptions = useMemo(
    () => [t('opportunities.filterAll'), ...TYPES.map((ty) => t(TYPE_LABEL_KEYS[ty]))],
    [t],
  );
  const filtered = filter === 'all' ? items : items.filter((it) => it.type === filter);

  const handleSubmit = async () => {
    if (!user || !form.title.trim() || !form.description.trim() || !form.contact.trim()) return;
    setSubmitting(true);
    try {
      const id = await createClubOpportunity({
        userId: user.uid, userName: displayName, userPhoto: photoURL || undefined,
        title: form.title.trim(), description: form.description.trim(), type: form.type,
        budget: form.budget.trim() || undefined, contact: form.contact.trim(),
      });
      setItems((prev) => [{ id, userId: user.uid, userName: displayName, userPhoto: photoURL || undefined, title: form.title.trim(), description: form.description.trim(), type: form.type, budget: form.budget.trim() || undefined, contact: form.contact.trim(), createdAt: new Date().toISOString() }, ...prev]);
      setForm({ title: '', description: '', type: 'mission', budget: '', contact: '' });
      setShowForm(false);
      addToast('success', t('opportunities.toastPublished'));
    } catch (error: unknown) {
      addToast('error', error instanceof Error ? error.message : t('opportunities.toastPublishError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: ClubOpportunity) => {
    setItems((prev) => prev.filter((x) => x.id !== item.id));
    try {
      await deleteClubOpportunity(item.id);
      addToast('success', t('opportunities.toastDeleted'));
    } catch {
      setItems((prev) => [item, ...prev]);
      addToast('error', t('opportunities.toastDeleteError'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton height={38} radius="var(--r-pill)" label={t('opportunities.title')} />
        <Skeleton height={148} radius="var(--r-l)" label={t('opportunities.title')} />
        <Skeleton height={148} radius="var(--r-l)" label={t('opportunities.title')} />
      </div>
    );
  }

  return (
    <motion.div className="space-y-4" variants={staggerContainer} initial="hidden" animate="visible">
      <ClubSectionHeader
        icon="case"
        title={t('opportunities.title')}
        action={(
          <Button tone={showForm ? 'quiet' : 'transforme'} size="sm" onClick={() => setShowForm((v) => !v)}>
            <Icon name={showForm ? 'close' : 'plus'} size={15} />
            {showForm ? t('opportunities.close') : t('opportunities.publish')}
          </Button>
        )}
      />

      {showForm && (
        <GlassPanel level="flat" padding={18}>
          <Field
            label={t('opportunities.titleLabel')}
            value={form.title}
            onChange={(v) => setForm((p) => ({ ...p, title: v }))}
            placeholder={t('opportunities.titlePlaceholder')}
            required
          />
          <Field
            as="textarea"
            rows={3}
            label={t('opportunities.descriptionLabel')}
            value={form.description}
            onChange={(v) => setForm((p) => ({ ...p, description: v }))}
            placeholder={t('opportunities.descriptionPlaceholder')}
            required
          />
          <div className="grid grid-cols-1 gap-3 stack:grid-cols-2">
            <Field
              as="select"
              label={t('opportunities.typeLabel')}
              value={form.type}
              onChange={(v) => setForm((p) => ({ ...p, type: v as ClubOpportunity['type'] }))}
              options={TYPES.map((ty) => ({ value: ty, label: t(TYPE_LABEL_KEYS[ty]) }))}
            />
            <Field
              label={t('opportunities.budgetLabel')}
              value={form.budget}
              onChange={(v) => setForm((p) => ({ ...p, budget: v }))}
              placeholder={t('opportunities.budgetPlaceholder')}
              hint={t('opportunities.budgetHint')}
            />
          </div>
          <Field
            label={t('opportunities.contactLabel')}
            value={form.contact}
            onChange={(v) => setForm((p) => ({ ...p, contact: v }))}
            placeholder={t('opportunities.contactPlaceholder')}
            required
          />
          <div className="mt-4 flex justify-end">
            <Button
              tone="transforme"
              size="sm"
              loading={submitting}
              disabled={!form.title.trim() || !form.description.trim() || !form.contact.trim()}
              onClick={handleSubmit}
            >
              <Icon name="send" size={15} /> {t('opportunities.publish')}
            </Button>
          </div>
        </GlassPanel>
      )}

      {items.length > 0 && (
        <ChipRow
          label={t('opportunities.filterLabel')}
          options={filterOptions}
          value={filter === 'all' ? filterOptions[0] : t(TYPE_LABEL_KEYS[filter as ClubOpportunity['type']])}
          onChange={(option) => {
            const idx = filterOptions.indexOf(option);
            setFilter(idx <= 0 ? 'all' : TYPES[idx - 1]);
          }}
        />
      )}

      {filtered.length === 0 ? (
        <ClubEmptyState
          icon="case"
          title={t('opportunities.emptyTitle')}
          subtitle={t('opportunities.emptySubtitle')}
          action={(
            <Button tone="transforme" size="sm" onClick={() => setShowForm(true)}>
              <Icon name="plus" size={15} /> {t('opportunities.publishOpportunity')}
            </Button>
          )}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <motion.div key={item.id} variants={staggerItem}>
              <GlassPanel level="flat" padding={18}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Tag>{t(TYPE_LABEL_KEYS[item.type])}</Tag>
                    {item.budget && <Tag tone="warn">{item.budget}</Tag>}
                  </div>
                  {user?.uid === item.userId && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      aria-label={t('opportunities.deleteLabel')}
                      className="mm-touch-extend flex-none rounded-xs p-1 text-ink-2 transition-colors duration-ui ease-ds hover:text-stop"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  )}
                </div>

                <p className="mt-2 font-bold text-ink">{item.title}</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-meta text-ink-2">{item.description}</p>

                <div className="mt-3 flex flex-col gap-2 border-t border-[color:var(--border-hair)] pt-3 stack:flex-row stack:items-center stack:justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    {item.userPhoto
                      ? <img src={item.userPhoto} alt="" loading="lazy" className="h-6 w-6 flex-none rounded-full object-cover" />
                      : <Avatar initials={initialsOf(item.userName)} size={24} />}
                    <span className="truncate text-meta-2 text-ink-2">{item.userName} · {formatDate(item.createdAt)}</span>
                  </div>
                  <span className="truncate text-meta-2 font-semibold text-transforme stack:max-w-[45%]">{item.contact}</span>
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      )}

      <TruthPanel
        provenTitle={t('opportunities.truth.provenTitle')}
        withheldTitle={t('opportunities.truth.withheldTitle')}
        proven={[t('opportunities.truth.proven1'), t('opportunities.truth.proven2')]}
        withheld={[t('opportunities.truth.withheld1'), t('opportunities.truth.withheld2')]}
      />
    </motion.div>
  );
}

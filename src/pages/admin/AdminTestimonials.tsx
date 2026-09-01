import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, Field, GlassPanel, Icon, LessonRow, Skeleton, Switch, useToast } from '@ds';
import { ConsolePage, ConsoleFilter, ConsoleList, ConsoleScope } from '../../components/console';
import { Modal } from '@/components/dialogs';
import { Pagination } from '@/components/dialogs';
import { ConfirmDialog } from '@/components/dialogs';
import ImageInput from '@/components/forms/ImageInput';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { usePagination } from '../../hooks/usePagination';
import { getAllTestimonials, saveTestimonial, deleteTestimonial } from '../../lib/firestore';
import type { Testimonial } from '../../types';
import { captureError } from '../../lib/sentry';

/**
 * ── TÉMOIGNAGES — motif de console ──────────────────────────────────────────────────
 *
 * L'INTERDIT D'AD-5 PORTE SUR LA FAÇADE, PAS SUR L'OUTIL QUI MODÈRE. « Témoignage » et
 * « note en étoiles » sont deux des six interdits absolus du système — sur le SITE PUBLIC,
 * où ils servent de preuve sociale invérifiable. Un écran d'administration qui tient une
 * file « en attente / approuvés » reste légitime : il ne prouve rien à personne, il décide.
 *
 * CE QUI DISPARAÎT QUAND MÊME : LES ÉTOILES. Elles étaient rendues ici deux fois — cinq
 * étoiles par carte, et un sélecteur de note dans le formulaire. Or l'interdit de `<Num>`
 * est écrit « sans exception, quelle que soit la source » : une note en étoiles n'est pas un
 * chiffre qu'on source, c'est un chiffre qu'on n'affiche pas. Le champ `rating` RESTE en
 * base et reste transporté par le formulaire — rien n'est perdu, rien n'est plus dessiné.
 *
 * UNE SEULE ACTION PAR LIGNE, ET C'EST « MODIFIER ». La tentation était de poser
 * « Approuver » directement sur les lignes en attente — un clic de moins. Deux raisons de ne
 * pas le faire, et la seconde est la vraie. D'abord, la ligne ne montre qu'un nom tronqué :
 * approuver depuis la liste, c'est approuver sans avoir lu, et sans avoir regardé le
 * témoignage vidéo. Ensuite, `ProspectsOps` — la seule instance complète que le kit dessine
 * — place son unique action (« Qualifier ce prospect ») SUR LA FICHE, pas sur la liste. La
 * liste filtre et montre l'état ; la fiche décide. Approuver, rejeter et supprimer y vivent
 * donc ensemble, avec le texte sous les yeux.
 * ────────────────────────────────────────────────────────────────────────────────────
 */

const EMPTY: Omit<Testimonial, 'id'> = {
  name: '', role: '', company: '', content: '', avatar: '', rating: 5, featured: false, status: 'approved',
};

type Filter = 'all' | 'pending' | 'approved' | 'rejected';

const TOKEN: Record<Exclude<Filter, 'all'>, string> = {
  pending: '--mm-orange',
  approved: '--ok',
  rejected: '--stop',
};

export default function AdminTestimonials() {
  const { t: tr } = useTranslation('admin');
  const { addToast } = useToast();
  const confirm = useConfirmDialog();
  const TARGET_LABELS: Record<NonNullable<Testimonial['targetType']>, string> = {
    platform: tr('testimonials.targetPlatform'),
    mentor: 'Max-Morrys',
    formation: tr('testimonials.targetFormation'),
    podcast: 'Podcast',
    video: tr('testimonials.targetVideo'),
  };
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<Omit<Testimonial, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const load = () => {
    setLoading(true);
    getAllTestimonials().then((data) => { setTestimonials(data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditing(t);
    setForm({
      name: t.name, role: t.role, company: t.company ?? '', content: t.content,
      avatar: t.avatar, rating: t.rating, featured: t.featured,
      status: t.status || 'approved', userId: t.userId, createdAt: t.createdAt,
      mediaType: t.mediaType, mediaUrl: t.mediaUrl,
      targetType: t.targetType, targetLabel: t.targetLabel,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      await saveTestimonial({ ...form, id: editing?.id });
      addToast('success', editing ? tr('testimonials.toastUpdated') : tr('testimonials.toastCreated'));
      setModalOpen(false);
      load();
    } catch (error: unknown) {
      captureError(error, { context: 'Save testimonial failed' });
      addToast('error', error instanceof Error ? error.message : tr('testimonials.toastSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (t: Testimonial) => {
    try {
      await saveTestimonial({ ...t, status: 'approved', featured: true, id: t.id });
      addToast('success', tr('testimonials.toastApproved'));
      setModalOpen(false);
      load();
    } catch (error: unknown) {
      captureError(error, { context: 'Approve testimonial failed' });
      addToast('error', error instanceof Error ? error.message : tr('testimonials.toastApproveError'));
    }
  };

  const handleReject = async (t: Testimonial) => {
    try {
      await saveTestimonial({ ...t, status: 'rejected', featured: false, id: t.id });
      addToast('success', tr('testimonials.toastRejected'));
      setModalOpen(false);
      load();
    } catch {
      addToast('error', tr('testimonials.toastRejectError'));
    }
  };

  const handleDelete = (id: string) => {
    confirm.requestConfirm(tr('testimonials.confirmDeleteMessage'), async () => {
      try {
        await deleteTestimonial(id).catch(() => addToast('error', tr('testimonials.toastDeleteError')));
        setTestimonials((prev) => prev.filter((t) => t.id !== id));
        setModalOpen(false);
        addToast('success', tr('testimonials.toastDeleted'));
      } catch (error: unknown) {
        captureError(error, { context: 'Delete testimonial failed' });
        addToast('error', tr('testimonials.toastDeleteError'));
      }
      confirm.closeConfirm();
    });
  };


  const set = (field: keyof Omit<Testimonial, 'id'>, value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const filtered = testimonials.filter((t) => {
    if (filter === 'all') return true;
    return (t.status || 'approved') === filter;
  });

  const { paged, page, totalPages, setPage } = usePagination(filtered);

  /*
    Les noms d'étapes viennent du kit — `tout · en attente · approuvés`. « Rejetés » y est
    ajouté parce que le statut EXISTE en base : le kit a écrit son pipeline sur une
    collection vide, où aucun témoignage n'avait encore été rejeté. Sans cette étape, un
    témoignage rejeté ne serait plus listable, donc ni réexaminable ni supprimable.
    Les compteurs, eux, sortent de `getAllTestimonials`.
  */
  const bar = useMemo(() => {
    const count = (s: Exclude<Filter, 'all'>) =>
      testimonials.filter((t) => (t.status || 'approved') === s).length;
    return ([
      { key: 'all' as Filter, label: tr('testimonials.stage.all'), n: testimonials.length },
      { key: 'pending' as Filter, label: tr('testimonials.stage.pending'), n: count('pending') },
      { key: 'approved' as Filter, label: tr('testimonials.stage.approved'), n: count('approved') },
      { key: 'rejected' as Filter, label: tr('testimonials.stage.rejected'), n: count('rejected') },
    ]).map((s) => ({ ...s, text: `${s.label} ${s.n}` }));
  }, [testimonials, tr]);

  const emptyBody = filter === 'all' ? tr('testimonials.emptyAll')
    : filter === 'pending' ? tr('testimonials.emptyPending')
    : filter === 'approved' ? tr('testimonials.emptyApproved')
    : tr('testimonials.emptyRejected');

  const statusOf = (t: Testimonial): Exclude<Filter, 'all'> =>
    (t.status || 'approved') as Exclude<Filter, 'all'>;

  /* L'état de la ligne se lit en toutes lettres, pas seulement à la couleur de sa puce. */
  const metaOf = (t: Testimonial) => {
    const bits = [tr(`testimonials.stage.${statusOf(t)}`)];
    if (t.role) bits.push(t.role);
    if (t.mediaType && t.mediaType !== 'text') {
      bits.push(t.mediaType === 'video' ? tr('testimonials.mediaVideo') : tr('testimonials.mediaAudio'));
    }
    if (t.targetType) bits.push(t.targetLabel || TARGET_LABELS[t.targetType]);
    if (t.featured) bits.push(tr('testimonials.featured'));
    return bits.join(' · ');
  };

  return (
    <ConsolePage title={tr('testimonials.title')} sub={tr('testimonials.sub')}>
      <ConsoleFilter
        stages={bar.map((s) => s.text)}
        active={bar.find((s) => s.key === filter)?.text}
        onSelect={(text) => {
          const hit = bar.find((s) => s.text === text);
          if (hit) setFilter(hit.key);
        }}
        label={tr('testimonials.pipelineLabel')}
      />

      <div className="mt-4">
        <Button size="sm" onClick={openNew}>
          <Icon name="plus" size={15} /> {tr('testimonials.new')}
        </Button>
      </div>

      {loading && (
        <GlassPanel level="night" padding="14px 18px" className="mt-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={44} label={i === 0 ? tr('testimonials.title') : undefined} style={{ marginBottom: '8px' }} />
          ))}
        </GlassPanel>
      )}

      {!loading && filtered.length === 0 && (
        <GlassPanel level="night" padding={8} className="mt-4">
          <EmptyState
            glyph={<Icon name="comment" size={26} color="var(--text-muted)" />}
            title={tr('testimonials.emptyTitle')}
            body={emptyBody}
            action={<Button size="sm" onClick={openNew}>{tr('testimonials.new')}</Button>}
          />
        </GlassPanel>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <ConsoleList label={tr('testimonials.title')} style={{ marginTop: '16px' }}>
            {paged.map((t, i) => {
              const status = statusOf(t);
              return (
                <li key={t.id}>
                  <LessonRow
                    icon={<Icon name="comment" size={14} color={`var(${TOKEN[status]})`} />}
                    iconBackground={`color-mix(in srgb, var(${TOKEN[status]}) 20%, transparent)`}
                    title={t.name}
                    meta={metaOf(t)}
                    trailing={<Button size="sm" tone="quiet" onClick={() => openEdit(t)}>{tr('testimonials.edit')}</Button>}
                    last={i === paged.length - 1}
                  />
                </li>
              );
            })}
          </ConsoleList>
          <div className="mt-4 flex justify-center">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      {/*
        ── L'IMPORT DE DÉMONSTRATION A ÉTÉ RETIRÉ, ET C'EST LE SEUL RETRAIT DE CET ÉCRAN ──
        Il écrivait six témoignages tirés de `src/data/testimonials.ts` — signés de noms de
        personnes (Aminata Fall, Kouassi David, Sali Ndiaye, Moussa Ballo…) — directement en
        `status: 'approved'`, `featured: true`, `rating: 5`. Fabriqués, pré-approuvés, mis en
        avant, dans la collection même que lisent les surfaces de vente. Rien ne les en
        distinguait ensuite : pas de marqueur, pas de préfixe, pas de date d'import.

        Ce n'était pas un risque théorique. La page d'abonnement au Club les rendait en preuve
        sociale, avec cinq étoiles et un nombre de membres — trois des six interdits absolus
        d'AD-5 sur une surface commerciale. Cette page a été recomposée depuis ; le bouton,
        lui, aurait continué de remplir la citerne.

        `src/data/testimonials.ts` est supprimé avec lui : c'était son unique lecteur.
      */}

      <ConsoleScope>{tr('testimonials.scope')}</ConsoleScope>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? tr('testimonials.modalEditTitle') : tr('testimonials.modalNewTitle')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label={tr('testimonials.fieldName')} value={form.name} onChange={(v) => set('name', v)} placeholder={tr('testimonials.placeholderName')} />
            <Field label={tr('testimonials.fieldRole')} value={form.role} onChange={(v) => set('role', v)} placeholder={tr('testimonials.placeholderRole')} />
          </div>
          <Field label={tr('testimonials.fieldCompany')} value={form.company ?? ''} onChange={(v) => set('company', v)} placeholder={tr('testimonials.placeholderCompany')} />
          <ImageInput label={tr('testimonials.fieldAvatar')} value={form.avatar} onChange={(url) => set('avatar', url)} folder="testimonials" />
          <Field as="textarea" rows={4} label={tr('testimonials.fieldContent')} value={form.content} onChange={(v) => set('content', v)} placeholder={tr('testimonials.placeholderContent')} />

          {/* Le média se relit ICI, dans la fiche : c'est le seul endroit où l'on décide. */}
          {editing?.mediaType === 'video' && editing.mediaUrl && (
            <video src={editing.mediaUrl} controls playsInline className="max-h-56 w-full rounded-m" />
          )}
          {editing?.mediaType === 'audio' && editing.mediaUrl && (
            <audio src={editing.mediaUrl} controls className="w-full" />
          )}

          <Field
            as="select"
            label={tr('testimonials.fieldStatus')}
            value={form.status || 'approved'}
            onChange={(v) => set('status', v)}
            options={[
              { value: 'pending', label: tr('testimonials.statusPending') },
              { value: 'approved', label: tr('testimonials.statusApproved') },
              { value: 'rejected', label: tr('testimonials.statusRejected') },
            ]}
          />
          <div className="flex items-center justify-between gap-4">
            <p className="m-0 text-sm font-medium text-ink">{tr('testimonials.setFeatured')}</p>
            <Switch
              on={form.featured}
              label={tr('testimonials.setFeatured')}
              onChange={(on) => set('featured', on)}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--line)] pt-4">
          {editing ? (
            <Button size="sm" tone="ghost" onClick={() => handleDelete(editing.id)}>
              <Icon name="trash" size={15} /> {tr('testimonials.delete')}
            </Button>
          ) : <span />}
          <div className="flex flex-wrap gap-2">
            {editing && statusOf(editing) !== 'rejected' && (
              <Button size="sm" tone="quiet" onClick={() => { void handleReject(editing); }}>{tr('testimonials.reject')}</Button>
            )}
            {editing && statusOf(editing) !== 'approved' && (
              <Button size="sm" tone="quiet" onClick={() => { void handleApprove(editing); }}>{tr('testimonials.approve')}</Button>
            )}
            <Button size="sm" onClick={() => { void handleSave(); }} loading={saving}>
              {editing ? tr('testimonials.save') : tr('testimonials.create')}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        onClose={confirm.closeConfirm}
        onConfirm={confirm.onConfirm}
        title={tr('testimonials.confirmDeleteTitle')}
        message={confirm.message}
        confirmLabel={tr('testimonials.confirmDeleteLabel')}
      />
    </ConsolePage>
  );
}

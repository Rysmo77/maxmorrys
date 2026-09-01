import { useTranslation } from 'react-i18next';
import { Button, DocLine, EmptyState, Field, Icon, LessonRow, Num, Tag } from '@ds';
import { ConsoleList, ConsoleScope } from '../../../components/console';
import ConsoleSheet from './ConsoleSheet';
import { useFormat } from '../../../hooks/useFormat';
import type { ClubDigitosInfo } from '../../../types';

/**
 * ── INFOS EXCLUSIVES — motif de console ─────────────────────────────────────────────
 *
 * ZONE 1 · IL N'Y A PAS DE FILE, ET LA VÉRIFICATION EST NETTE. `ClubDigitosInfo` ne porte
 * aucun champ de statut, et `getClubExclusiveInfos()` lit la collection entière triée par
 * `publishedAt` desc, SANS filtre de date : une date de publication future ne masque donc
 * rien du tout — l'info est visible des membres à la seconde où elle est enregistrée. Une
 * étape « programmée » serait un mensonge sur le comportement réel du produit, et une étape
 * « publiée » contiendrait tout. Le pied le dit ; le filtre n'existe pas.
 *
 * LE TYPE N'EST PAS UN STATUT. Annonce, article, ressource : c'est une nature de contenu,
 * pas une file d'attente. Elle vit en étiquette de ligne, là où elle aide à choisir quoi
 * ouvrir, pas en zone 1, où elle ferait passer une catégorie pour un cycle.
 *
 * ZONE 2 · Deux `<button>` nus par ligne — crayon, poubelle — deviennent une ligne qui ouvre
 * sa fiche. Le formulaire et la suppression y vivent, avec le contenu entier sous les yeux.
 * ────────────────────────────────────────────────────────────────────────────────────
 */
const TINT: Record<ClubDigitosInfo['type'], string> = {
  announcement: '--mm-orange',
  article: '--mm-bleu',
  resource: '--ok',
};

interface ClubInfosTabProps {
  infos: ClubDigitosInfo[];
  showInfoForm: boolean;
  setShowInfoForm: React.Dispatch<React.SetStateAction<boolean>>;
  editInfo: ClubDigitosInfo | null;
  infoForm: Omit<ClubDigitosInfo, 'id'>;
  setInfoForm: React.Dispatch<React.SetStateAction<Omit<ClubDigitosInfo, 'id'>>>;
  savingInfo: boolean;
  openInfoForm: (info?: ClubDigitosInfo) => void;
  handleSaveInfo: () => Promise<void>;
  handleDeleteInfo: (id: string) => Promise<void>;
  /** L'instant où la lecture a répondu. `null` tant qu'aucune n'a abouti (règle 6). */
  loadedAt: Date | null;
}

export default function ClubInfosTab({
  infos, showInfoForm, setShowInfoForm, editInfo, infoForm, setInfoForm,
  savingInfo, openInfoForm, handleSaveInfo, handleDeleteInfo, loadedAt,
}: ClubInfosTabProps) {
  const { t } = useTranslation('adminClub');
  const { formatDate } = useFormat();

  const typeLabel = (type: ClubDigitosInfo['type']) => t(`infos.types.${type}`);

  return (
    <div>
      <div className="flex justify-end">
        <Button size="sm" onClick={() => openInfoForm()}>
          <Icon name="plus" size={15} /> {t('infos.new')}
        </Button>
      </div>

      <div className="mt-3">
        {infos.length === 0 ? (
          <EmptyState
            glyph={<Icon name="megaphone" size={26} color="var(--mm-orange)" />}
            glyphBackground="color-mix(in srgb, var(--mm-orange) 20%, transparent)"
            title={t('infos.empty')}
            body={t('infos.emptyBody')}
            action={<Button size="sm" onClick={() => openInfoForm()}>{t('infos.new')}</Button>}
          />
        ) : (
          <ConsoleList label={t('infos.listLabel')}>
            {infos.map((info, i) => (
              <li key={info.id}>
                <LessonRow
                  onClick={() => openInfoForm(info)}
                  icon={<Icon name="megaphone" size={14} color={`var(${TINT[info.type]})`} />}
                  iconBackground={`color-mix(in srgb, var(${TINT[info.type]}) 20%, transparent)`}
                  title={info.title}
                  meta={(
                    <>
                      {formatDate(info.publishedAt)}
                      {' · '}
                      <Num value={loadedAt ? (info.likes?.length ?? 0) : null} source="db" asOf={loadedAt ?? new Date()} />
                      {' '}
                      {t('infos.likesWord')}
                    </>
                  )}
                  trailing={<Tag tone="neutral">{typeLabel(info.type)}</Tag>}
                  last={i === infos.length - 1}
                />
              </li>
            ))}
          </ConsoleList>
        )}
      </div>

      <ConsoleScope title={t('common.sectionScopeTitle')}>{t('infos.scope')}</ConsoleScope>

      <ConsoleSheet
        open={showInfoForm}
        onClose={() => setShowInfoForm(false)}
        closeLabel={t('common.close')}
        eyebrow={typeLabel(infoForm.type)}
        title={editInfo ? t('infos.editTitle') : t('infos.newTitle')}
        footer={(
          <>
            {editInfo && (
              <Button size="sm" tone="quiet" onClick={() => { void handleDeleteInfo(editInfo.id).then(() => setShowInfoForm(false)); }} style={{ marginRight: 'auto' }}>
                {t('infos.delete')}
              </Button>
            )}
            <Button size="sm" tone="quiet" onClick={() => setShowInfoForm(false)}>{t('common.cancel')}</Button>
            <Button
              size="sm"
              onClick={() => { void handleSaveInfo(); }}
              loading={savingInfo}
              disabled={!infoForm.title.trim() || !infoForm.content.trim()}
            >
              {savingInfo ? t('common.saving') : t('common.save')}
            </Button>
          </>
        )}
      >
        <Field size="sm" label={t('infos.titleLabel')} value={infoForm.title} onChange={(v) => setInfoForm((p) => ({ ...p, title: v }))} placeholder={t('infos.titlePlaceholder')} />
        <div className="grid grid-cols-2 gap-4">
          <Field
            size="sm"
            as="select"
            label={t('infos.typeLabel')}
            value={infoForm.type}
            onChange={(v) => setInfoForm((p) => ({ ...p, type: v as ClubDigitosInfo['type'] }))}
            options={[
              { value: 'announcement', label: t('infos.types.announcement') },
              { value: 'article', label: t('infos.types.article') },
              { value: 'resource', label: t('infos.types.resource') },
            ]}
          />
          <Field size="sm" label={t('infos.publishedAtLabel')} type="date" value={infoForm.publishedAt} onChange={(v) => setInfoForm((p) => ({ ...p, publishedAt: v }))} hint={t('infos.publishedAtHint')} />
        </div>
        <Field size="sm" as="textarea" rows={5} label={t('infos.contentLabel')} value={infoForm.content} onChange={(v) => setInfoForm((p) => ({ ...p, content: v }))} placeholder={t('infos.contentPlaceholder')} />
        <Field size="sm" label={t('infos.linkLabel')} type="url" value={infoForm.link} onChange={(v) => setInfoForm((p) => ({ ...p, link: v }))} placeholder="https://..." />

        {editInfo && (
          <div>
            <DocLine
              label={t('infos.likesLabel')}
              value={<Num value={loadedAt ? (editInfo.likes?.length ?? 0) : null} source="db" asOf={loadedAt ?? new Date()} />}
            />
            {editInfo.link && (
              <DocLine
                label={t('infos.link')}
                value={(
                  <a href={editInfo.link} target="_blank" rel="noopener noreferrer" className="text-forme hover:underline">
                    {t('infos.openLink')}
                  </a>
                )}
              />
            )}
            <DocLine label={t('infos.publishedAtLabel')} value={formatDate(editInfo.publishedAt)} last />
          </div>
        )}
      </ConsoleSheet>
    </div>
  );
}

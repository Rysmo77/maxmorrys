import { useTranslation } from 'react-i18next';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { useFormat } from '../../../hooks/useFormat';
import type { ClubDigitosInfo } from '../../../types';
import { Field, Icon } from '@ds';

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
}

export default function ClubInfosTab({
  infos, showInfoForm, setShowInfoForm, editInfo, infoForm, setInfoForm,
  savingInfo, openInfoForm, handleSaveInfo, handleDeleteInfo,
}: ClubInfosTabProps) {
  const { t } = useTranslation('adminClub');
  const { formatDate } = useFormat();
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => openInfoForm()} icon={<Icon name="plus" size={16} />}>{t('infos.new')}</Button>
      </div>

      {showInfoForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-ink">{editInfo ? t('infos.editTitle') : t('infos.newTitle')}</h3>
            <button onClick={() => setShowInfoForm(false)} className="p-1 rounded-lg text-ink-2 hover:text-ink-2 transition-colors"><Icon name="close" size={16} /></button>
          </div>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
              <Field size="sm" label={t('infos.titleLabel')} value={infoForm.title} onChange={(v) => setInfoForm((p) => ({ ...p, title: v }))} placeholder={t('infos.titlePlaceholder')} />
            </div>
              <Field
                size="sm"
                as="select"
                label={t('infos.typeLabel')}
                value={infoForm.type}
                onChange={(v) => setInfoForm((p) => ({ ...p, type: v as ClubDigitosInfo['type'] }))}
                options={[
                  { value: 'announcement', label: t('infos.typeAnnouncement') },
                  { value: 'article', label: t('infos.typeArticle') },
                  { value: 'resource', label: t('infos.typeResource') },
                ]}
              />
              <Field size="sm" label={t('infos.publishedAtLabel')} type="date" value={infoForm.publishedAt} onChange={(v) => setInfoForm((p) => ({ ...p, publishedAt: v }))} />
              <div className="sm:col-span-2">
              <Field size="sm" label={t('infos.contentLabel')} as="textarea" value={infoForm.content} onChange={(v) => setInfoForm((p) => ({ ...p, content: v }))} rows={5} placeholder={t('infos.contentPlaceholder')} />
            </div>
              <div className="sm:col-span-2">
              <Field size="sm" label={t('infos.linkLabel')} type="url" value={infoForm.link} onChange={(v) => setInfoForm((p) => ({ ...p, link: v }))} placeholder="https://..." />
            </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={() => setShowInfoForm(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveInfo} disabled={savingInfo || !infoForm.title.trim() || !infoForm.content.trim()} loading={savingInfo} icon={<Icon name="save" size={16} />}>
              {savingInfo ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </Card>
      )}

      {infos.length === 0 && !showInfoForm ? (
        <Card><p className="text-center text-ink-2 py-8">{t('infos.empty')}</p></Card>
      ) : (
        <div className="space-y-3">
          {infos.map((info) => (
            <Card key={info.id} hover>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={info.type === 'announcement' ? 'warning' : info.type === 'resource' ? 'success' : 'brand'} size="sm">
                      {info.type === 'announcement' ? t('infos.typeAnnouncement') : info.type === 'resource' ? t('infos.typeResource') : t('infos.typeArticle')}
                    </Badge>
                    <span className="text-xs text-ink-2">{formatDate(info.publishedAt)}</span>
                  </div>
                  <p className="font-bold text-ink mb-1">{info.title}</p>
                  <p className="text-sm text-ink-2 line-clamp-2">{info.content}</p>
                  {info.link && <a href={info.link} target="_blank" rel="noopener noreferrer" className="text-xs text-forme hover:underline inline-flex items-center gap-1 mt-1"><Icon name="external" size={12} /> {t('infos.link')}</a>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openInfoForm(info)} className="p-1.5 rounded-lg text-ink-2 hover:text-forme hover:bg-[color-mix(in_srgb,var(--mm-bleu)_8%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--mm-bleu)_20%,transparent)] transition-colors"><Icon name="pencil" size={14} /></button>
                  <button onClick={() => handleDeleteInfo(info.id)} className="p-1.5 rounded-lg text-ink-2 hover:text-stop hover:bg-[color-mix(in_srgb,var(--stop)_8%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--stop)_20%,transparent)] transition-colors"><Icon name="trash" size={14} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

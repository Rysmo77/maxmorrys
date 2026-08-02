import { useTranslation } from 'react-i18next';
import { Plus, X, Save, Pencil, Trash2, Loader2, ExternalLink } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { useFormat } from '../../../hooks/useFormat';
import { inputCls } from '../hooks/useAdminClub';
import type { ClubDigitosInfo } from '../../../types';

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
        <Button size="sm" onClick={() => openInfoForm()} icon={<Plus className="w-4 h-4" />}>{t('infos.new')}</Button>
      </div>

      {showInfoForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-neutral-900 dark:text-white">{editInfo ? t('infos.editTitle') : t('infos.newTitle')}</h3>
            <button onClick={() => setShowInfoForm(false)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-neutral-500">{t('infos.titleLabel')}</label>
                <input value={infoForm.title} onChange={(e) => setInfoForm((p) => ({ ...p, title: e.target.value }))} placeholder={t('infos.titlePlaceholder')} className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">{t('infos.typeLabel')}</label>
                <select value={infoForm.type} onChange={(e) => setInfoForm((p) => ({ ...p, type: e.target.value as ClubDigitosInfo['type'] }))} className={inputCls}>
                  <option value="announcement">{t('infos.typeAnnouncement')}</option>
                  <option value="article">{t('infos.typeArticle')}</option>
                  <option value="resource">{t('infos.typeResource')}</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">{t('infos.publishedAtLabel')}</label>
                <input type="date" value={infoForm.publishedAt} onChange={(e) => setInfoForm((p) => ({ ...p, publishedAt: e.target.value }))} className={inputCls} />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-neutral-500">{t('infos.contentLabel')}</label>
                <textarea value={infoForm.content} onChange={(e) => setInfoForm((p) => ({ ...p, content: e.target.value }))} rows={5} placeholder={t('infos.contentPlaceholder')} className={`${inputCls} resize-y`} />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-neutral-500">{t('infos.linkLabel')}</label>
                <input type="url" value={infoForm.link} onChange={(e) => setInfoForm((p) => ({ ...p, link: e.target.value }))} placeholder="https://..." className={inputCls} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={() => setShowInfoForm(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveInfo} disabled={savingInfo || !infoForm.title.trim() || !infoForm.content.trim()} icon={savingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}>
              {savingInfo ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </Card>
      )}

      {infos.length === 0 && !showInfoForm ? (
        <Card><p className="text-center text-neutral-400 py-8">{t('infos.empty')}</p></Card>
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
                    <span className="text-xs text-neutral-400">{formatDate(info.publishedAt)}</span>
                  </div>
                  <p className="font-bold text-neutral-900 dark:text-white mb-1">{info.title}</p>
                  <p className="text-sm text-neutral-500 line-clamp-2">{info.content}</p>
                  {info.link && <a href={info.link} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-500 hover:underline inline-flex items-center gap-1 mt-1"><ExternalLink className="w-3 h-3" /> {t('infos.link')}</a>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openInfoForm(info)} className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteInfo(info.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

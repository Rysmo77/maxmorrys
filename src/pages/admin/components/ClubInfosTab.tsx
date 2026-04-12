import { Plus, X, Save, Pencil, Trash2, Loader2, ExternalLink } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { formatDate } from '../../../lib/utils';
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
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => openInfoForm()} icon={<Plus className="w-4 h-4" />}>Nouvelle info</Button>
      </div>

      {showInfoForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-neutral-900 dark:text-white">{editInfo ? 'Modifier l\'info' : 'Nouvelle info exclusive'}</h3>
            <button onClick={() => setShowInfoForm(false)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-neutral-500">Titre *</label>
                <input value={infoForm.title} onChange={(e) => setInfoForm((p) => ({ ...p, title: e.target.value }))} placeholder="Titre de l'info" className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">Type</label>
                <select value={infoForm.type} onChange={(e) => setInfoForm((p) => ({ ...p, type: e.target.value as ClubDigitosInfo['type'] }))} className={inputCls}>
                  <option value="announcement">Annonce</option>
                  <option value="article">Article</option>
                  <option value="resource">Ressource</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">Date de publication</label>
                <input type="date" value={infoForm.publishedAt} onChange={(e) => setInfoForm((p) => ({ ...p, publishedAt: e.target.value }))} className={inputCls} />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-neutral-500">Contenu *</label>
                <textarea value={infoForm.content} onChange={(e) => setInfoForm((p) => ({ ...p, content: e.target.value }))} rows={5} placeholder="Contenu de l'information exclusive..." className={`${inputCls} resize-y`} />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-neutral-500">Lien externe (optionnel)</label>
                <input type="url" value={infoForm.link} onChange={(e) => setInfoForm((p) => ({ ...p, link: e.target.value }))} placeholder="https://..." className={inputCls} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={() => setShowInfoForm(false)}>Annuler</Button>
            <Button onClick={handleSaveInfo} disabled={savingInfo || !infoForm.title.trim() || !infoForm.content.trim()} icon={savingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}>
              {savingInfo ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </Card>
      )}

      {infos.length === 0 && !showInfoForm ? (
        <Card><p className="text-center text-neutral-400 py-8">Aucune info exclusive créée.</p></Card>
      ) : (
        <div className="space-y-3">
          {infos.map((info) => (
            <Card key={info.id} hover>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={info.type === 'announcement' ? 'warning' : info.type === 'resource' ? 'success' : 'brand'} size="sm">
                      {info.type === 'announcement' ? 'Annonce' : info.type === 'resource' ? 'Ressource' : 'Article'}
                    </Badge>
                    <span className="text-xs text-neutral-400">{formatDate(info.publishedAt)}</span>
                  </div>
                  <p className="font-bold text-neutral-900 dark:text-white mb-1">{info.title}</p>
                  <p className="text-sm text-neutral-500 line-clamp-2">{info.content}</p>
                  {info.link && <a href={info.link} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-500 hover:underline inline-flex items-center gap-1 mt-1"><ExternalLink className="w-3 h-3" /> Lien</a>}
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

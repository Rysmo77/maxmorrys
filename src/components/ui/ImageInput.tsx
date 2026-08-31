import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { uploadMedia, randomFilename } from '../../lib/storage';
import { Icon } from '@ds';

interface ImageInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** Storage folder name, e.g. 'podcasts', 'videos', 'articles' */
  folder: string;
  placeholder?: string;
}

const inputBase =
  'w-full px-3 py-2 rounded-xl border border-[color:var(--line)] bg-paper dark:bg-[color:var(--night-3)] text-sm text-ink focus:outline-none focus:ring-2 focus:border-forme transition-colors';

export default function ImageInput({
  label,
  value,
  onChange,
  folder,
  placeholder = 'https://...',
}: ImageInputProps) {
  const { t } = useTranslation('ui');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fieldId = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError(t('imageInput.onlyImages'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(t('imageInput.tooLarge'));
      return;
    }

    setUploadError(null);
    setUploading(true);
    setProgress(0);

    try {
      const key = `uploads/${folder}/${randomFilename(file.name)}`;
      const url = await uploadMedia(file, key, setProgress);
      onChange(url);
      setProgress(0);
      if (fileRef.current) fileRef.current.value = '';
    } catch {
      setUploadError(t('imageInput.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      {/* Lié au champ d'URL — le contrôle principal du groupe. Le bouton d'import a son
          propre `title`, et le `<input type="file">` est masqué : le libellé n'a qu'une
          cible possible, et il ne l'avait pas. */}
      <label htmlFor={fieldId} className="block text-xs font-medium text-ink-2">
        {label}
      </label>

      {/* URL input + upload button row */}
      <div className="flex gap-2">
        <input
          id={fieldId}
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setUploadError(null); }}
          placeholder={placeholder}
          disabled={uploading}
          className={inputBase}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          title={t('imageInput.importTitle')}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[color:var(--line)] bg-[color:var(--fill-1)] text-ink-2 text-xs font-semibold hover:bg-[color:var(--fill-2)] dark:hover:bg-[color:var(--night-3)] disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          <Icon name="upload" size={14} />
          {uploading ? `${progress}%` : t('imageInput.import')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Upload progress bar */}
      {uploading && (
        <div className="h-1 w-full bg-[color:var(--fill-3)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[color:var(--mm-bleu)] rounded-full prog-fill transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Error */}
      {uploadError && (
        <p className="text-xs text-stop">{uploadError}</p>
      )}

      {/* Preview */}
      {value && !uploading && (
        <div className="flex items-center gap-3 mt-0.5">
          <div className="w-16 h-16 rounded-lg overflow-hidden border border-[color:var(--line)] bg-[color:var(--fill-2)] flex-shrink-0">
            <img
              src={value}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="flex items-center gap-1 text-xs text-ink-2 hover:text-stop dark:hover:text-stop transition-colors"
          >
            <Icon name="close" size={12} />
            {t('imageInput.remove')}
          </button>
        </div>
      )}
    </div>
  );
}

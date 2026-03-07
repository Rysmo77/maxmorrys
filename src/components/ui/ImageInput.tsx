import { useRef, useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';
import { Upload, X } from 'lucide-react';

interface ImageInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** Storage folder name, e.g. 'podcasts', 'videos', 'articles' */
  folder: string;
  placeholder?: string;
}

const inputBase =
  'w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors';

export default function ImageInput({
  label,
  value,
  onChange,
  folder,
  placeholder = 'https://...',
}: ImageInputProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Seules les images sont acceptées.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Fichier trop lourd (max 10 Mo).');
      return;
    }

    setUploadError(null);
    setUploading(true);
    setProgress(0);

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const storageRef = ref(storage, `uploads/${folder}/${filename}`);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      'state_changed',
      (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      () => {
        setUploadError('Échec du téléversement. Réessayez.');
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        onChange(url);
        setUploading(false);
        setProgress(0);
        if (fileRef.current) fileRef.current.value = '';
      }
    );
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {label}
      </label>

      {/* URL input + upload button row */}
      <div className="flex gap-2">
        <input
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
          title="Importer une image depuis votre appareil"
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          <Upload className="w-3.5 h-3.5" />
          {uploading ? `${progress}%` : 'Importer'}
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
        <div className="h-1 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Error */}
      {uploadError && (
        <p className="text-xs text-red-500 dark:text-red-400">{uploadError}</p>
      )}

      {/* Preview */}
      {value && !uploading && (
        <div className="flex items-center gap-3 mt-0.5">
          <div className="w-16 h-16 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
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
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <X className="w-3 h-3" />
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}

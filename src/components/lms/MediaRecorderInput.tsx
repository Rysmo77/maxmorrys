import { useEffect, useRef, useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Mic, Video, Square, Upload, X, Loader2, RotateCcw } from 'lucide-react';
import { storage } from '../../config/firebase';

interface MediaRecorderInputProps {
  mode: 'audio' | 'video';
  userId: string;
  value: string;
  onChange: (url: string) => void;
}

const MAX_SECONDS = 120;
const MAX_BYTES = 100 * 1024 * 1024;

function supportsRecording(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined'
  );
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function MediaRecorderInput({ mode, userId, value, onChange }: MediaRecorderInputProps) {
  const canRecord = supportsRecording();

  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const livePreviewRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  // Cleanup on unmount — release mic/camera + object URLs
  useEffect(() => {
    return () => {
      stopStream();
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadBlob = async (blob: Blob, ext: string) => {
    if (blob.size > MAX_BYTES) {
      setError('Fichier trop lourd (max 100 Mo).');
      return;
    }
    setError(null);
    setUploading(true);
    setProgress(0);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const storageRef = ref(storage, `testimonial_media/${userId}/${filename}`);
    const task = uploadBytesResumable(storageRef, blob);
    task.on(
      'state_changed',
      (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      () => { setError('Échec du téléversement. Réessayez.'); setUploading(false); },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        onChange(url);
        setUploading(false);
        setProgress(0);
      },
    );
  };

  const startRecording = async () => {
    setError(null);
    try {
      const constraints = mode === 'video' ? { audio: true, video: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (mode === 'video' && livePreviewRef.current) {
        livePreviewRef.current.srcObject = stream;
        livePreviewRef.current.muted = true;
        await livePreviewRef.current.play().catch(() => null);
      }
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const type = mode === 'video' ? 'video/webm' : 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        if (localUrl) URL.revokeObjectURL(localUrl);
        const obj = URL.createObjectURL(blob);
        setLocalUrl(obj);
        stopStream();
        if (livePreviewRef.current) livePreviewRef.current.srcObject = null;
        uploadBlob(blob, 'webm');
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev + 1 >= MAX_SECONDS) { stopRecording(); return MAX_SECONDS; }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setError("Impossible d'accéder au micro/caméra. Vérifie les autorisations ou importe un fichier.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const valid = mode === 'video' ? file.type.startsWith('video/') : file.type.startsWith('audio/');
    if (!valid) { setError(mode === 'video' ? 'Fichier vidéo attendu.' : 'Fichier audio attendu.'); return; }
    if (localUrl) URL.revokeObjectURL(localUrl);
    setLocalUrl(URL.createObjectURL(file));
    const ext = file.name.split('.').pop()?.toLowerCase() ?? (mode === 'video' ? 'mp4' : 'mp3');
    uploadBlob(file, ext);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const reset = () => {
    if (localUrl) URL.revokeObjectURL(localUrl);
    setLocalUrl(null);
    setProgress(0);
    setError(null);
    onChange('');
  };

  const previewUrl = value || localUrl;
  const Icon = mode === 'video' ? Video : Mic;

  return (
    <div className="space-y-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 p-4">
      {/* Live preview while recording video */}
      {mode === 'video' && recording && (
        <video ref={livePreviewRef} className="w-full max-h-64 rounded-lg bg-black" playsInline />
      )}

      {/* Recording controls */}
      {canRecord && !previewUrl && !uploading && (
        <div className="flex items-center gap-3">
          {!recording ? (
            <button
              type="button"
              onClick={startRecording}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors"
            >
              <Icon className="w-4 h-4" /> Démarrer l'enregistrement
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-error-600 hover:bg-error-500 text-white text-sm font-semibold transition-colors"
            >
              <Square className="w-4 h-4" fill="currentColor" /> Arrêter
            </button>
          )}
          {recording && (
            <span className="flex items-center gap-2 text-sm font-mono text-error-600 dark:text-error-400">
              <span className="w-2 h-2 rounded-full bg-error-500 animate-pulse" />
              {formatTime(elapsed)} / {formatTime(MAX_SECONDS)}
            </span>
          )}
        </div>
      )}

      {/* Upload fallback / alternative */}
      {!previewUrl && !uploading && !recording && (
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <Upload className="w-4 h-4" /> Importer un fichier
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={mode === 'video' ? 'video/*' : 'audio/*'}
            className="hidden"
            onChange={handleFileChange}
          />
          {!canRecord && (
            <p className="text-xs text-neutral-400 mt-2">
              L'enregistrement direct n'est pas disponible sur ce navigateur — importe un fichier {mode === 'video' ? 'vidéo' : 'audio'}.
            </p>
          )}
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="w-4 h-4 animate-spin text-brand-500" /> Téléversement… {progress}%
          </div>
          <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Preview of recorded/uploaded media */}
      {previewUrl && !uploading && (
        <div className="space-y-2">
          {mode === 'video' ? (
            <video src={previewUrl} controls playsInline className="w-full max-h-64 rounded-lg bg-black" />
          ) : (
            <audio src={previewUrl} controls className="w-full" />
          )}
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-error-500 transition-colors"
          >
            {value ? <X className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
            {value ? 'Supprimer' : 'Recommencer'}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-error-500 dark:text-error-400">{error}</p>}
    </div>
  );
}

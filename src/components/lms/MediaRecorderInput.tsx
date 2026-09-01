import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { uploadMedia } from '../../lib/storage';
import { Icon, type IconName } from '@ds';

interface MediaRecorderInputProps {
  mode: 'audio' | 'video';
  userId: string;
  value: string;
  onChange: (url: string) => void;
  /** Storage folder root, e.g. 'testimonial_media' (default) or 'club_media'. */
  folder?: string;
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

export default function MediaRecorderInput({ mode, userId, value, onChange, folder = 'testimonial_media' }: MediaRecorderInputProps) {
  const { t } = useTranslation('lms');
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
      setError(t('mediaRecorder.fileTooLarge'));
      return;
    }
    setError(null);
    setUploading(true);
    setProgress(0);
    try {
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const url = await uploadMedia(blob, `${folder}/${userId}/${filename}`, setProgress);
      onChange(url);
      setProgress(0);
    } catch {
      setError(t('mediaRecorder.uploadFailed'));
    } finally {
      setUploading(false);
    }
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
      setError(t('mediaRecorder.accessError'));
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
    if (!valid) { setError(mode === 'video' ? t('mediaRecorder.videoFileExpected') : t('mediaRecorder.audioFileExpected')); return; }
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
  const glyph: IconName = mode === 'video' ? 'video' : 'mic';

  return (
    <div className="space-y-3 rounded-xl border border-[color:var(--line)] bg-[color:var(--fill-1)] dark:bg-[color-mix(in_srgb,var(--night-3)_50%,transparent)] p-4">
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forme hover:bg-[color:var(--mm-bleu)] text-white text-sm font-semibold transition-colors"
            >
              <Icon name={glyph} size={16} /> {t('mediaRecorder.startRecording')}
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stop hover:bg-[color:var(--stop)] text-white text-sm font-semibold transition-colors"
            >
              <Icon name="square" size={16} /> {t('mediaRecorder.stop')}
            </button>
          )}
          {recording && (
            <span className="flex items-center gap-2 text-sm font-mono text-stop">
              <span className="w-2 h-2 rounded-full bg-[color:var(--stop)] animate-pulse" />
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
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[color:var(--line)] bg-surface-sheet text-ink-2 text-sm font-semibold hover:bg-[color:var(--fill-2)] dark:hover:bg-[color:var(--night-3)] transition-colors"
          >
            <Icon name="upload" size={16} /> {t('mediaRecorder.importFile')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={mode === 'video' ? 'video/*' : 'audio/*'}
            className="hidden"
            onChange={handleFileChange}
          />
          {!canRecord && (
            <p className="text-xs text-ink-2 mt-2">
              {mode === 'video' ? t('mediaRecorder.directRecordingUnavailableVideo') : t('mediaRecorder.directRecordingUnavailableAudio')}
            </p>
          )}
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-ink-2">
            {/* Aucun rond : la barre sous cette ligne porte le POURCENTAGE RÉEL de l'envoi.
                Un rond à côté d'une vraie mesure n'ajoute rien — il la concurrence. */}
            {t('mediaRecorder.uploading', { progress })}
          </div>
          <div className="h-1.5 w-full bg-[color:var(--fill-3)] rounded-full overflow-hidden">
            <div className="h-full bg-[color:var(--mm-bleu)] rounded-full prog-fill transition-[width] duration-150" style={{ width: `${progress}%` }} />
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
            className="inline-flex items-center gap-1.5 text-xs text-ink-2 hover:text-stop transition-colors"
          >
            {value ? <Icon name="close" size={14} /> : <Icon name="rotate" size={14} />}
            {value ? t('mediaRecorder.delete') : t('mediaRecorder.restart')}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-stop">{error}</p>}
    </div>
  );
}

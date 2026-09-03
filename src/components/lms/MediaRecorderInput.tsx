import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { uploadMedia } from '../../lib/storage';
import { baseType, extensionFor, pickMimeType } from '../../lib/media/container';
import { Button, Icon, type IconName } from '@ds';

/**
 * ENREGISTRER OU IMPORTER UN MÉDIA, PUIS LE TÉLÉVERSER DANS R2.
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * LE CONTENEUR NE SE DEVINE PAS — IL SE DEMANDE AU NAVIGATEUR.
 *
 * Le défaut corrigé ici ne se voyait sur aucune capture d'écran, et sur aucune machine de
 * développement : `new MediaRecorder(stream)` sans `mimeType` laisse le NAVIGATEUR choisir
 * son conteneur. Chrome et Firefox rendent du WebM ; Safari — donc tout iPhone, donc la
 * moitié des gens qui filment un témoignage — rend du **MP4**.
 *
 * Le code posait ensuite `new Blob(chunks, { type: 'video/webm' })` et téléversait sous
 * l'extension `webm`, EN DUR. Sur Safari, l'objet écrit dans R2 portait donc des octets MP4,
 * une clé `.webm`, et un `Content-Type: video/webm` — puisque `uploadMedia` envoie
 * `payload.type`. Trois mensonges cohérents entre eux, donc invisibles :
 *
 *   · la personne qui filme voit sa relecture (le `<video>` local lit le Blob, pas son type) ;
 *   · le téléversement réussit — le Worker media ne valide que le préfixe `video/` ;
 *   · c'est à la RELECTURE, chez l'admin qui modère ou chez le visiteur, sur un navigateur
 *     qui n'accepte pas le MP4 déguisé, que la vidéo ne démarre pas. Sans erreur.
 *
 * On négocie donc le conteneur avec `isTypeSupported`, et surtout on relit `recorder.mimeType`
 * APRÈS coup : c'est la seule valeur qui dit ce qui a réellement été encodé — un navigateur a
 * le droit d'ignorer le type demandé. Le Blob, l'extension et le `Content-Type` en découlent
 * tous les trois, au lieu d'être affirmés séparément.
 *
 * Les tables et la négociation vivent dans `lib/media/container.ts`, et sont vérifiées par
 * `tests/unit/media-container.test.ts` : ce sont des correspondances, elles n'ont pas besoin
 * d'un navigateur pour être tenues — et c'est le seul endroit d'où le type MIME et
 * l'extension peuvent rester d'accord.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * LES LIMITES SE DISENT AVANT, PAS APRÈS. Le plafond de 2 minutes n'existait qu'en tant que
 * couperet : l'enregistrement s'arrêtait tout seul, sans que rien ne l'ait annoncé. Il est
 * désormais écrit sous les boutons, et la barre qui court pendant l'enregistrement le rend
 * visible seconde après seconde.
 */

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
  /** Ce qu'un lecteur d'écran entend quand l'état change — jamais le compteur qui défile. */
  const [status, setStatus] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const livePreviewRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
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
      setStatus(t('mediaRecorder.statusReady'));
    } catch {
      setError(t('mediaRecorder.uploadFailed'));
      setStatus('');
    } finally {
      setUploading(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  /*
   * LE COUPERET DES 2 MINUTES VIT DANS UN EFFET, PAS DANS LE `setState` DU MINUTEUR.
   *
   * Il appelait `stopRecording()` DEPUIS la fonction de mise à jour de `setElapsed` — donc un
   * effet de bord dans une fonction que React se réserve le droit de rejouer (c'est
   * précisément ce que fait le mode strict en développement). Arrêter deux fois un
   * enregistreur déjà arrêté est bénin ; l'écrire là ne l'était pas.
   */
  useEffect(() => {
    if (recording && elapsed >= MAX_SECONDS) stopRecording();
  }, [recording, elapsed]);

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

      const wanted = pickMimeType(mode);
      const recorder = new MediaRecorder(stream, wanted ? { mimeType: wanted } : undefined);

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        /*
         * `recorder.mimeType` EST LA SOURCE, PAS `wanted`.
         *
         * La spec autorise le navigateur à retenir un autre conteneur que celui demandé. On
         * relit donc ce qui a réellement été encodé, et le Blob, la clé et le `Content-Type`
         * en découlent tous les trois — au lieu d'être affirmés chacun de leur côté.
         */
        const encoded = recorder.mimeType || wanted || (mode === 'video' ? 'video/webm' : 'audio/webm');
        const blob = new Blob(chunksRef.current, { type: baseType(encoded) });
        if (localUrl) URL.revokeObjectURL(localUrl);
        setLocalUrl(URL.createObjectURL(blob));
        stopStream();
        if (livePreviewRef.current) livePreviewRef.current.srcObject = null;
        setStatus(t('mediaRecorder.statusStopped'));
        void uploadBlob(blob, extensionFor(encoded, mode === 'video' ? 'mp4' : 'm4a'));
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setElapsed(0);
      setStatus(t('mediaRecorder.statusRecording'));
      timerRef.current = setInterval(() => {
        setElapsed((prev) => Math.min(prev + 1, MAX_SECONDS));
      }, 1000);
    } catch {
      stopStream();
      setError(t('mediaRecorder.accessError'));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const valid = mode === 'video' ? file.type.startsWith('video/') : file.type.startsWith('audio/');
    if (!valid) { setError(mode === 'video' ? t('mediaRecorder.videoFileExpected') : t('mediaRecorder.audioFileExpected')); return; }
    if (localUrl) URL.revokeObjectURL(localUrl);
    setLocalUrl(URL.createObjectURL(file));
    // L'extension suit le TYPE du fichier, pas son nom : un fichier renommé « clip.txt » par
    // un gestionnaire de fichiers reste un MP4, et c'est sous cette clé qu'il doit s'écrire.
    const ext = extensionFor(file.type, file.name.split('.').pop()?.toLowerCase() || (mode === 'video' ? 'mp4' : 'mp3'));
    void uploadBlob(file, ext);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const reset = () => {
    if (localUrl) URL.revokeObjectURL(localUrl);
    setLocalUrl(null);
    setProgress(0);
    setError(null);
    setElapsed(0);
    setStatus('');
    onChange('');
  };

  const previewUrl = value || localUrl;
  const glyph: IconName = mode === 'video' ? 'video' : 'mic';
  const idle = !previewUrl && !uploading && !recording;

  return (
    <div className="space-y-3 rounded-m border border-[color:var(--line)] bg-[color:var(--fill-1)] dark:bg-[color-mix(in_srgb,var(--night-3)_50%,transparent)] p-4">
      {/* Ce qui change d'état est ANNONCÉ ; le compteur qui défile ne l'est pas — une
          seconde annoncée chaque seconde recouvre tout le reste de la page. */}
      <p className="sr-only" role="status" aria-live="polite">{status}</p>

      {/* Live preview while recording video */}
      {mode === 'video' && recording && (
        <video ref={livePreviewRef} className="w-full max-h-64 rounded-xs bg-[color:var(--surface-night)]" playsInline />
      )}

      {/* ── Au repos : les deux façons d'apporter un média, et ce qui les borne ───── */}
      {idle && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {canRecord && (
              <Button size="sm" tone="forme" onClick={() => void startRecording()}>
                <Icon name={glyph} size={15} />
                {t('mediaRecorder.startRecording')}
              </Button>
            )}
            <Button size="sm" tone="quiet" onClick={() => fileInputRef.current?.click()}>
              <Icon name="upload" size={15} />
              {t('mediaRecorder.importFile')}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept={mode === 'video' ? 'video/*' : 'audio/*'}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Les deux plafonds, ÉCRITS. Ils existaient déjà, mais on ne les rencontrait
              qu'en les heurtant : l'enregistrement se coupait seul à 2 minutes, et un fichier
              trop lourd n'était refusé qu'une fois choisi. */}
          <p className="text-small text-ink-2 m-0">
            {t('mediaRecorder.limits', { minutes: Math.round(MAX_SECONDS / 60), megabytes: Math.round(MAX_BYTES / (1024 * 1024)) })}
          </p>

          {!canRecord && (
            <p className="text-small text-ink-2 m-0">
              {mode === 'video' ? t('mediaRecorder.directRecordingUnavailableVideo') : t('mediaRecorder.directRecordingUnavailableAudio')}
            </p>
          )}
        </>
      )}

      {/* ── Pendant l'enregistrement : arrêter, et voir venir la limite ───────────── */}
      {recording && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" tone="stop" onClick={stopRecording}>
              <Icon name="square" size={15} />
              {t('mediaRecorder.stop')}
            </Button>
            <span className="flex items-center gap-2 text-meta text-stop" aria-hidden="true">
              <span className="w-2 h-2 rounded-pill bg-[color:var(--stop)] animate-pulse" />
              {formatTime(elapsed)} / {formatTime(MAX_SECONDS)}
            </span>
          </div>
          <div
            className="h-1.5 w-full bg-[color:var(--fill-3)] rounded-pill overflow-hidden"
            role="progressbar"
            aria-label={t('mediaRecorder.elapsedLabel')}
            aria-valuemin={0}
            aria-valuemax={MAX_SECONDS}
            aria-valuenow={elapsed}
            aria-valuetext={formatTime(elapsed)}
          >
            <div className="h-full bg-[color:var(--stop)] rounded-pill prog-fill" style={{ width: `${(elapsed / MAX_SECONDS) * 100}%` }} />
          </div>
        </div>
      )}

      {/* ── Pendant l'envoi : le pourcentage RÉEL, jamais un rond ─────────────────── */}
      {uploading && (
        <div className="space-y-2">
          {/* Aucun rond : la barre sous cette ligne porte le POURCENTAGE RÉEL de l'envoi.
              Un rond à côté d'une vraie mesure n'ajoute rien — il la concurrence. */}
          <p className="text-meta text-ink-2 m-0">{t('mediaRecorder.uploading', { progress })}</p>
          <div
            className="h-1.5 w-full bg-[color:var(--fill-3)] rounded-pill overflow-hidden"
            role="progressbar"
            aria-label={t('mediaRecorder.progressLabel')}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div className="h-full bg-[color:var(--mm-bleu)] rounded-pill prog-fill transition-[width] duration-150" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* ── Une fois le média prêt : le relire, le refaire, l'enlever ─────────────── */}
      {previewUrl && !uploading && (
        <div className="space-y-2">
          {mode === 'video' ? (
            <video src={previewUrl} controls playsInline className="w-full max-h-64 rounded-xs bg-[color:var(--surface-night)]" />
          ) : (
            <audio src={previewUrl} controls className="w-full" />
          )}
          <button
            type="button"
            onClick={reset}
            className="mm-touch-extend inline-flex items-center gap-1.5 text-small text-ink-2 hover:text-stop transition-colors duration-ui"
          >
            {value ? <Icon name="close" size={14} /> : <Icon name="rotate" size={14} />}
            {value ? t('mediaRecorder.delete') : t('mediaRecorder.restart')}
          </button>
        </div>
      )}

      {/* Motif réel, et non « oups » — et annoncé, parce qu'il apparaît loin du regard. */}
      {error && <p role="alert" className="text-small text-stop m-0">{error}</p>}
    </div>
  );
}

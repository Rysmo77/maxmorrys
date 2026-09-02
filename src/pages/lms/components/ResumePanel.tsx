import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, GlassPanel, Icon, LessonRow, Num, ProgressBar } from '@ds';
import { useLocalizedPath } from '../../../contexts/LanguageContext';
import { formatBytes, listKept, offlineSupported, type KeptResource } from '../../../lib/pwa/offline';
import type { EnrolledFormation } from '../hooks/useStudentData';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE PANNEAU DE « MES COURS » — troisième colonne de l'espace apprenant.
 *
 * `handoff_tableaux_de_bord/dashboards-app.jsx` § CoursDesktop lui donne exactement
 * deux blocs, et les deux ont une raison :
 *
 *   1. LA REPRISE, « pour qu'elle soit atteignable depuis n'importe quelle page de
 *      cours et pas seulement depuis l'accueil ». Le produit n'a AUCUN canal d'envoi
 *      d'e-mail : la relance ne peut venir que de l'écran lui-même, donc elle est
 *      répétée partout où elle a un sens plutôt que centralisée sur l'accueil.
 *
 *   2. CE QUI EST GARDÉ HORS CONNEXION, avec son POIDS MESURÉ. « Chaque poids est
 *      affiché parce que le forfait est compté. » Le nombre ne vient pas d'une
 *      estimation : `listKept()` lit l'en-tête `x-mm-bytes` que le service worker
 *      tamponne sur la réponse au moment où il l'enregistre.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEUX ÉCARTS AVEC LA MAQUETTE, ET LEUR MESURE
 *
 * · LA MAQUETTE ÉCRIT « vidéo · 12 Mo » SUR DES LEÇONS NOMMÉES. Le cache ne connaît
 *   pas les leçons, il connaît des URL : `KeptResource` porte `url`, `bytes`,
 *   `cachedAt`, rien d'autre. Afficher un titre de leçon ici demanderait de résoudre
 *   l'URL vers son contenu — une lecture de plus, pour un panneau. La ligne porte donc
 *   le dernier segment de l'URL, et le poids reste exact.
 *
 * · LA MAQUETTE NE MONTRE QUE TROIS LIGNES. On en montre quatre au plus, puis un
 *   renvoi vers l'écran hors connexion complet, qui porte lui la file d'envoi et le
 *   réglage Wi-Fi. Dupliquer ces deux-là ici donnerait deux endroits où couper le
 *   téléchargement, à désynchroniser au premier clic.
 *
 * ⚠️ CE PANNEAU LIT LE CACHE, DONC IL NE SE MONTE QU'AU-DELÀ DE 1080 px. `listKept()`
 * ouvre le cache et lit chaque entrée : c'est local, mais ce n'est pas gratuit sur
 * l'appareil visé. L'appelant le monte par `useMediaQuery`, jamais par `hidden`.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

interface ResumePanelProps {
  /** La formation à reprendre. `null` quand tout est terminé — le bloc dit alors ça. */
  resume: EnrolledFormation | null;
  /** Instant de la lecture Firestore qui a produit `resume`. */
  asOf: Date;
}

/** Le nom lisible d'une ressource gardée : le dernier segment de son URL, sans requête. */
function keptName(url: string): string {
  try {
    const path = new URL(url, window.location.origin).pathname;
    return decodeURIComponent(path.split('/').filter(Boolean).pop() ?? path);
  } catch {
    return url;
  }
}

export default function ResumePanel({ resume, asOf }: ResumePanelProps) {
  const { t } = useTranslation('lmsTabs');
  const navigate = useNavigate();
  const path = useLocalizedPath();

  /* `undefined` = pas encore relevé, `[]` = relevé et vide. La distinction porte tout
     l'écart entre « rien de gardé » et « on ne sait pas encore » — et c'est la seconde
     qu'on n'a pas le droit d'annoncer comme la première. */
  const [kept, setKept] = useState<KeptResource[] | undefined>(undefined);
  const [keptAsOf, setKeptAsOf] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;
    if (!offlineSupported()) { setKept([]); setKeptAsOf(new Date()); return; }
    listKept()
      .then((list) => { if (alive) { setKept(list); setKeptAsOf(new Date()); } })
      .catch(() => { if (alive) { setKept([]); setKeptAsOf(new Date()); } });
    return () => { alive = false; };
  }, []);

  const shown = (kept ?? []).slice(0, 4);
  const totalBytes = (kept ?? []).reduce((n, k) => n + k.bytes, 0);

  return (
    <>
      <p className="mm-eyebrow m-0">{t('courses.resumeEyebrow')}</p>

      {resume?.formation ? (
        <GlassPanel level="flat" padding={16} className="rv mt-2.5" style={{ ['--i' as string]: 1 }}>
          <p className="m-0 text-meta font-semibold leading-[1.35]">{resume.formation.title}</p>
          <p className="m-0 mt-1 text-meta-2 text-ink-2">
            <Num
              value={resume.enrollment.completedLessons.length}
              source="db"
              asOf={asOf}
            />
            {' / '}
            <Num
              value={resume.formation.modules.reduce((n, m) => n + m.lessons.length, 0) || null}
              source="db"
              asOf={asOf}
            />{' '}
            {t('courses.lessonsLabel')}
          </p>
          <ProgressBar
            value={resume.enrollment.progress}
            source="db"
            asOf={asOf}
            label={t('courses.progressLabel')}
            style={{ marginTop: '12px' }}
          />
          <Button
            tone="primary"
            size="sm"
            onClick={() => navigate(path(`/cours/${resume.formation!.slug}`))}
            style={{ marginTop: '12px' }}
          >
            {t('courses.resumeAction')}
          </Button>
        </GlassPanel>
      ) : (
        <GlassPanel level="flat" padding={16} className="rv mt-2.5" style={{ ['--i' as string]: 1 }}>
          <p className="m-0 text-meta-2 leading-[1.5] text-ink-2">{t('courses.resumeNone')}</p>
        </GlassPanel>
      )}

      <p className="mm-eyebrow m-0 mt-6">{t('courses.offlineEyebrow')}</p>

      {kept === undefined ? (
        <GlassPanel level="flat" padding={16} className="mt-2.5">
          <p className="m-0 text-meta-2 text-ink-3">{t('courses.offlineReading')}</p>
        </GlassPanel>
      ) : shown.length > 0 ? (
        <>
          <GlassPanel level="flat" padding="6px 16px" className="rv mt-2.5" style={{ ['--i' as string]: 2 }}>
            <ul className="m-0 list-none p-0">
              {shown.map((k, i) => (
                <li key={k.url}>
                  <LessonRow
                    state="plain"
                    icon={<Icon name="download" size={13} />}
                    title={keptName(k.url)}
                    meta={
                      <Num
                        value={formatBytes(k.bytes)}
                        source="db"
                        asOf={keptAsOf ?? asOf}
                      />
                    }
                    last={i === shown.length - 1}
                  />
                </li>
              ))}
            </ul>
          </GlassPanel>
          <p className="m-0 mt-3 text-meta-2 leading-[1.5] text-ink-3">
            {t('courses.offlineNote')}
          </p>
          <Button
            tone="quiet"
            size="sm"
            onClick={() => navigate(path('/mon-espace/hors-connexion'))}
            style={{ marginTop: '10px' }}
          >
            {t('courses.offlineOpen', { total: formatBytes(totalBytes) })}
          </Button>
        </>
      ) : (
        <GlassPanel level="flat" padding={16} className="rv mt-2.5" style={{ ['--i' as string]: 2 }}>
          <p className="m-0 text-meta-2 leading-[1.5] text-ink-2">{t('courses.offlineEmpty')}</p>
          <Button
            tone="quiet"
            size="sm"
            onClick={() => navigate(path('/mon-espace/hors-connexion'))}
            style={{ marginTop: '10px' }}
          >
            {t('courses.offlineSetup')}
          </Button>
        </GlassPanel>
      )}
    </>
  );
}

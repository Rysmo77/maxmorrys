import { Icon } from '@ds';

/**
 * Les trois étapes du tunnel (Formation · Paiement · Accès) — maquettes `Edu-Paiement` et
 * `Edu-Bienvenue`. Une étape passée porte une coche sarcelle, l'étape courante un disque
 * plein (encre sur le paiement, orange sur l'accès), une étape à venir un cercle filet.
 * `tone="night"` : posé sur la bande sombre de l'écran d'accès.
 */
interface PayStepperProps {
  current: 1 | 2 | 3;
  labels: [string, string, string];
  tone?: 'paper' | 'night';
  className?: string;
}

export default function PayStepper({ current, labels, tone = 'paper', className }: PayStepperProps) {
  const ink = tone === 'night' ? 'var(--paper-fixed)' : 'var(--ink)';
  return (
    <ol className={['m-0 flex list-none items-center gap-2.5 p-0', className].filter(Boolean).join(' ')}>
      {labels.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const done = n < current;
        const now = n === current;
        const disc = done
          ? { background: 'var(--mm-teal-f)', color: 'var(--paper-fixed)' }
          : now
            ? (n === 3
              ? { background: 'var(--mm-orange-f)', color: 'var(--ink-fixed)' }
              : tone === 'night'
                ? { background: 'var(--paper-fixed)', color: 'var(--ink-fixed)' }
                : { background: 'var(--ink-fixed)', color: 'var(--paper-fixed)' })
            : { border: '1.5px solid var(--line)' };
        return (
          <li key={label} className="flex items-center gap-2.5" aria-current={now ? 'step' : undefined}>
            {i > 0 && <span aria-hidden="true" className="h-[1.5px] w-6 stack:w-10" style={{ background: 'var(--line)' }} />}
            <span className="flex items-center gap-2 text-[13px] font-semibold leading-none" style={{ color: done || now ? ink : 'var(--ink-3)' }}>
              <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-full text-[12px]" style={disc}>
                {done ? <Icon name="check" size={13} strokeWidth={3} /> : n}
              </span>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

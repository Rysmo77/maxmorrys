import { useId, useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { cn } from '../../lib/utils';
import { markdownToHtml } from '../../lib/markdown';
import { Icon, type IconName } from '@ds';

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minHeight?: string;
}

interface ToolbarBtn {
  icon: IconName;
  title: string;
  action: (selected: string, before: string, after: string) => { prefix: string; suffix: string; placeholder: string };
}

const buildTools = (t: TFunction): ToolbarBtn[] => [
  {
    icon: 'bold',
    title: t('richEditor.boldTitle'),
    action: (sel) => ({ prefix: '**', suffix: '**', placeholder: sel || t('richEditor.boldPlaceholder') }),
  },
  {
    icon: 'italic',
    title: t('richEditor.italicTitle'),
    action: (sel) => ({ prefix: '*', suffix: '*', placeholder: sel || t('richEditor.italicPlaceholder') }),
  },
  {
    icon: 'heading-2',
    title: t('richEditor.h2Title'),
    action: () => ({ prefix: '\n## ', suffix: '', placeholder: t('richEditor.h2Placeholder') }),
  },
  {
    icon: 'heading-3',
    title: t('richEditor.h3Title'),
    action: () => ({ prefix: '\n### ', suffix: '', placeholder: t('richEditor.h3Placeholder') }),
  },
  {
    icon: 'list',
    title: t('richEditor.bulletListTitle'),
    action: () => ({ prefix: '\n- ', suffix: '', placeholder: t('richEditor.bulletListPlaceholder') }),
  },
  {
    icon: 'list-ordered',
    title: t('richEditor.numberedListTitle'),
    action: () => ({ prefix: '\n1. ', suffix: '', placeholder: t('richEditor.numberedListPlaceholder') }),
  },
  {
    icon: 'code',
    title: t('richEditor.codeTitle'),
    action: (sel) => ({ prefix: '`', suffix: '`', placeholder: sel || t('richEditor.codePlaceholder') }),
  },
  {
    icon: 'link',
    title: t('richEditor.linkTitle'),
    action: (sel) => ({ prefix: '[', suffix: '](https://)', placeholder: sel || t('richEditor.linkPlaceholder') }),
  },
  {
    icon: 'image',
    title: t('richEditor.imageTitle'),
    action: () => ({ prefix: '![', suffix: '](https://)', placeholder: t('richEditor.imagePlaceholder') }),
  },
];

export default function RichEditor({ value, onChange, label, placeholder, minHeight = '320px' }: RichEditorProps) {
  const { t } = useTranslation('ui');
  const fieldId = useId();
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tools = useMemo(() => buildTools(t), [t]);
  const resolvedPlaceholder = placeholder ?? t('richEditor.defaultPlaceholder');

  const insertMarkdown = (tool: ToolbarBtn) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    const before = value.slice(0, start);
    const after = value.slice(end);

    const { prefix, suffix, placeholder: ph } = tool.action(selected, before, after);
    const insert = prefix + (selected || ph) + suffix;
    const newValue = before + insert + after;
    onChange(newValue);

    // Restore cursor position
    requestAnimationFrame(() => {
      ta.focus();
      const newPos = start + prefix.length + (selected || ph).length + suffix.length;
      ta.setSelectionRange(newPos, newPos);
    });
  };

  return (
    <div className="space-y-1.5">
      {/* Le libellé est lié à la ZONE DE SAISIE. La barre d'outils au-dessus n'est pas un
          contrôle de saisie : ses boutons ont leur propre `title`, et le libellé désigne ce
          qu'on écrit, pas ce qui le met en forme. */}
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-ink-2">
          {label}
        </label>
      )}
      <div className="border border-[color:var(--line)] rounded-xl overflow-hidden focus-within:ring-2 focus-within: focus-within:border-forme transition-colors">
        {/* Toolbar */}
        <div className="flex items-center gap-1 px-2 py-1.5 bg-[color:var(--fill-1)] border-b border-[color:var(--line)] flex-wrap">
          {tools.map((t) => (
            <button
              key={t.title}
              type="button"
              title={t.title}
              onMouseDown={(e) => { e.preventDefault(); insertMarkdown(t); }}
              className="p-1.5 rounded hover:bg-[color:var(--fill-3)] dark:hover:bg-[color:var(--night-3)] text-ink-2 transition-colors"
            >
              <Icon name={t.icon} size={14} />
            </button>
          ))}
          <div className="flex-1" />
          {/* View toggle */}
          <div className="flex items-center gap-1 border border-[color:var(--line)] rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setPreview(false)}
              className={cn('flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors', !preview ? 'bg-paper text-ink shadow-sm' : 'text-ink-2 hover:text-ink')}
            >
              <Icon name="pencil" size={12} /> {t('richEditor.edit')}
            </button>
            <button
              type="button"
              onClick={() => setPreview(true)}
              className={cn('flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors', preview ? 'bg-paper text-ink shadow-sm' : 'text-ink-2 hover:text-ink')}
            >
              <Icon name="eye" size={12} /> {t('richEditor.preview')}
            </button>
          </div>
        </div>

        {preview ? (
          <div
            className="p-6 bg-paper overflow-auto prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-img:rounded-xl"
            style={{ minHeight }}
            dangerouslySetInnerHTML={{ __html: markdownToHtml(value) || `<p class="text-ink-2 italic">${resolvedPlaceholder}</p>` }}
          />
        ) : (
          <textarea
            id={fieldId}
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={resolvedPlaceholder}
            className="w-full p-4 text-sm text-ink bg-paper focus:outline-none font-mono resize-y"
            style={{ minHeight }}
          />
        )}
      </div>
      <p className="text-xs text-ink-2">{t('richEditor.markdownHint')}</p>
    </div>
  );
}

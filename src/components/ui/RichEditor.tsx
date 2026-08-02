import { useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Link as LinkIcon, Image, Code, Eye, Edit3 } from 'lucide-react';
import { cn, markdownToHtml } from '../../lib/utils';

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minHeight?: string;
}

interface ToolbarBtn {
  icon: React.FC<{ className?: string }>;
  title: string;
  action: (selected: string, before: string, after: string) => { prefix: string; suffix: string; placeholder: string };
}

const buildTools = (t: TFunction): ToolbarBtn[] => [
  {
    icon: Bold,
    title: t('richEditor.boldTitle'),
    action: (sel) => ({ prefix: '**', suffix: '**', placeholder: sel || t('richEditor.boldPlaceholder') }),
  },
  {
    icon: Italic,
    title: t('richEditor.italicTitle'),
    action: (sel) => ({ prefix: '*', suffix: '*', placeholder: sel || t('richEditor.italicPlaceholder') }),
  },
  {
    icon: Heading2,
    title: t('richEditor.h2Title'),
    action: () => ({ prefix: '\n## ', suffix: '', placeholder: t('richEditor.h2Placeholder') }),
  },
  {
    icon: Heading3,
    title: t('richEditor.h3Title'),
    action: () => ({ prefix: '\n### ', suffix: '', placeholder: t('richEditor.h3Placeholder') }),
  },
  {
    icon: List,
    title: t('richEditor.bulletListTitle'),
    action: () => ({ prefix: '\n- ', suffix: '', placeholder: t('richEditor.bulletListPlaceholder') }),
  },
  {
    icon: ListOrdered,
    title: t('richEditor.numberedListTitle'),
    action: () => ({ prefix: '\n1. ', suffix: '', placeholder: t('richEditor.numberedListPlaceholder') }),
  },
  {
    icon: Code,
    title: t('richEditor.codeTitle'),
    action: (sel) => ({ prefix: '`', suffix: '`', placeholder: sel || t('richEditor.codePlaceholder') }),
  },
  {
    icon: LinkIcon,
    title: t('richEditor.linkTitle'),
    action: (sel) => ({ prefix: '[', suffix: '](https://)', placeholder: sel || t('richEditor.linkPlaceholder') }),
  },
  {
    icon: Image,
    title: t('richEditor.imageTitle'),
    action: () => ({ prefix: '![', suffix: '](https://)', placeholder: t('richEditor.imagePlaceholder') }),
  },
];

export default function RichEditor({ value, onChange, label, placeholder, minHeight = '320px' }: RichEditorProps) {
  const { t } = useTranslation('ui');
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
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}
      <div className="border border-neutral-300 dark:border-neutral-600 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-colors">
        {/* Toolbar */}
        <div className="flex items-center gap-1 px-2 py-1.5 bg-neutral-50 dark:bg-neutral-700/50 border-b border-neutral-200 dark:border-neutral-600 flex-wrap">
          {tools.map((t) => (
            <button
              key={t.title}
              type="button"
              title={t.title}
              onMouseDown={(e) => { e.preventDefault(); insertMarkdown(t); }}
              className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 transition-colors"
            >
              <t.icon className="w-3.5 h-3.5" />
            </button>
          ))}
          <div className="flex-1" />
          {/* View toggle */}
          <div className="flex items-center gap-1 border border-neutral-200 dark:border-neutral-600 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setPreview(false)}
              className={cn('flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors', !preview ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700')}
            >
              <Edit3 className="w-3 h-3" /> {t('richEditor.edit')}
            </button>
            <button
              type="button"
              onClick={() => setPreview(true)}
              className={cn('flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors', preview ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700')}
            >
              <Eye className="w-3 h-3" /> {t('richEditor.preview')}
            </button>
          </div>
        </div>

        {preview ? (
          <div
            className="p-6 bg-white dark:bg-neutral-800 overflow-auto prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-img:rounded-xl"
            style={{ minHeight }}
            dangerouslySetInnerHTML={{ __html: markdownToHtml(value) || `<p class="text-neutral-400 italic">${resolvedPlaceholder}</p>` }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={resolvedPlaceholder}
            className="w-full p-4 text-sm text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 placeholder-neutral-400 focus:outline-none font-mono resize-y"
            style={{ minHeight }}
          />
        )}
      </div>
      <p className="text-xs text-neutral-400">{t('richEditor.markdownHint')}</p>
    </div>
  );
}

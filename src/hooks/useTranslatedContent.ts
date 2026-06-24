import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getCachedTranslation, requestTranslation } from '../lib/contentTranslation';

/**
 * Traduit un texte de contenu dynamique (Firestore) selon la langue active.
 * FR -> renvoie la source. EN -> renvoie la traduction (source affichée en attendant).
 */
export function useTranslatedText(text?: string | null): string {
  const { language } = useLanguage();
  const source = text ?? '';

  const [value, setValue] = useState(() =>
    language === 'en' && source ? getCachedTranslation(source) ?? source : source,
  );

  useEffect(() => {
    if (language !== 'en' || !source) {
      setValue(source);
      return;
    }
    const cached = getCachedTranslation(source);
    if (cached != null) {
      setValue(cached);
      return;
    }
    setValue(source); // repli pendant la traduction
    let active = true;
    requestTranslation(source).then((t) => {
      if (active) setValue(t);
    });
    return () => {
      active = false;
    };
  }, [source, language]);

  return value;
}

/** Traduit une liste de textes (ordre préservé). Utile pour les listes/cartes. */
export function useTranslatedList(sources: (string | undefined | null)[]): string[] {
  const { language } = useLanguage();
  const key = sources.join('');
  const [map, setMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (language !== 'en') {
      setMap({});
      return;
    }
    let active = true;
    const uniq = [...new Set(sources.filter((s): s is string => !!s && !!s.trim()))];

    const seed: Record<string, string> = {};
    for (const s of uniq) {
      const c = getCachedTranslation(s);
      if (c != null) seed[s] = c;
    }
    if (Object.keys(seed).length) setMap((m) => ({ ...m, ...seed }));

    Promise.all(uniq.map((s) => requestTranslation(s).then((t) => [s, t] as const))).then((pairs) => {
      if (!active) return;
      setMap((m) => {
        const next = { ...m };
        for (const [s, t] of pairs) next[s] = t;
        return next;
      });
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, language]);

  if (language !== 'en') return sources.map((s) => s ?? '');
  return sources.map((s) => (s && map[s] ? map[s] : s ?? ''));
}

/**
 * Renvoie une copie de `obj` dont les champs listés sont traduits (FR -> EN).
 * Les autres champs sont inchangés. `null`/`undefined` passent tels quels.
 */
export function useTranslatedContent<T extends Record<string, unknown>>(
  obj: T | null | undefined,
  fields: (keyof T)[],
): T | null | undefined {
  const sources = fields.map((f) => (obj && typeof obj[f] === 'string' ? (obj[f] as string) : ''));
  const translated = useTranslatedList(sources);
  const joined = translated.join('');

  return useMemo(() => {
    if (!obj) return obj;
    const copy = { ...obj } as T;
    fields.forEach((f, i) => {
      if (typeof obj[f] === 'string') (copy as Record<string, unknown>)[f as string] = translated[i];
    });
    return copy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obj, joined]);
}

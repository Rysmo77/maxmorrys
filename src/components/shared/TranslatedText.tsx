import { createElement, type ElementType } from 'react';
import { useTranslatedText } from '../../hooks/useTranslatedContent';

interface TranslatedTextProps {
  /** Texte source (français) issu du contenu dynamique Firestore. */
  text?: string | null;
  /** Élément hôte à rendre (défaut: fragment via `span`). */
  as?: ElementType;
  className?: string;
}

/**
 * Affiche un texte de contenu dynamique traduit selon la langue active.
 * À utiliser dans les listes (.map) où appeler un hook directement violerait
 * les règles des hooks — chaque <TranslatedText> est son propre composant.
 *
 * Usage : <TranslatedText text={article.title} as="h3" className="..." />
 */
export default function TranslatedText({ text, as = 'span', className }: TranslatedTextProps) {
  const value = useTranslatedText(text);
  if (className) return createElement(as, { className }, value);
  return createElement(as, null, value);
}

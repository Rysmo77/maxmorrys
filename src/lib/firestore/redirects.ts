/**
 * Table de redirections — collection `redirects`.
 *
 * Lue au bord par le Worker `maxmorrys-site` (compte de service, hors règles
 * Firestore) et administrée depuis `src/pages/admin/AdminRedirects.tsx`.
 *
 * L'identifiant du document est auto-généré : un chemin source contient des
 * « / », qui sont interdits dans un identifiant Firestore.
 */
import { orderBy } from 'firebase/firestore';
import { getCollection, createDoc, updateDocById, deleteDocById } from './helpers';
import { isInternalTarget, normalizeSource, normalizeTarget } from '../redirects';
import type { Redirect } from '../../types';

/** Champs saisis dans l'admin ; compteurs et horodatages sont posés ailleurs. */
export type RedirectInput = Pick<Redirect, 'source' | 'target' | 'code' | 'kind' | 'active'> & {
  label?: string;
};

/** Liste complète, les sources dans l'ordre alphabétique. Réservé à l'administration. */
export async function getAllRedirects(): Promise<Redirect[]> {
  return getCollection<Redirect>('redirects', orderBy('source', 'asc'));
}

/**
 * Crée ou met à jour une redirection.
 *
 * La validation de la cible vit **ici** et pas seulement dans le formulaire : une
 * cible externe transformerait `/via/` en redirecteur ouvert, réutilisable en
 * hameçonnage sous notre domaine. Aucun chemin d'écriture ne doit pouvoir la
 * contourner.
 */
export async function saveRedirect(data: RedirectInput & { id?: string }): Promise<string> {
  const { id, label, ...rest } = data;

  const source = normalizeSource(rest.source);
  const target = normalizeTarget(rest.target);

  if (source === '/') throw new Error('La source ne peut pas être la racine du site.');
  if (!isInternalTarget(target)) {
    throw new Error('La cible doit être un chemin interne commençant par « / ».');
  }
  if (source === target) throw new Error('La source et la cible sont identiques : la redirection boucle.');

  const payload = {
    source,
    target,
    code: rest.code,
    kind: rest.kind,
    active: rest.active,
    ...(label?.trim() ? { label: label.trim() } : {}),
  };

  if (id) {
    await updateDocById('redirects', id, { ...payload, updatedAt: new Date().toISOString() });
    return id;
  }
  return createDoc('redirects', payload);
}

/** Active ou désactive une redirection sans passer par le formulaire. */
export async function setRedirectActive(id: string, active: boolean): Promise<void> {
  return updateDocById('redirects', id, { active, updatedAt: new Date().toISOString() });
}

export async function deleteRedirect(id: string): Promise<void> {
  return deleteDocById('redirects', id);
}

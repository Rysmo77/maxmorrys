import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * UN EN-TÊTE PEUT INTERDIRE UNE FONCTIONNALITÉ QUE LE PRODUIT PROPOSE.
 *
 * Le défaut qui a motivé ce fichier est resté en production sans que rien ne le voie :
 *
 *     permissions-policy: camera=(), microphone=(), geolocation=()
 *
 * Une liste d'autorisation VIDE ne veut pas dire « demande la permission » — elle veut dire
 * « aucune origine, pas même cette page ». `getUserMedia` échoue donc immédiatement, et le
 * navigateur ne demande JAMAIS rien. Pendant ce temps l'espace apprenant proposait d'envoyer
 * un témoignage en audio ou en vidéo, et le Club d'y poster un média : personne n'a jamais pu
 * enregistrer, sur aucun navigateur, depuis que l'en-tête existe.
 *
 * AUCUNE AUTRE PORTE NE POUVAIT L'ATTRAPER. Le typecheck compile du TypeScript, `ds:check`
 * lit des composants, la build produit un paquet, les tests unitaires appellent des
 * fonctions — et le code fautif n'est pas du code, c'est une chaîne dans un fichier de
 * configuration d'hébergement. Le seul symptôme était un message d'erreur qui envoyait la
 * personne vérifier des autorisations qui ne pouvaient pas exister.
 *
 * D'où l'invariant tenu ici, et qui est le vrai : CE QUE LE CODE APPELLE, L'EN-TÊTE DOIT
 * L'AUTORISER. Le test ne compare pas la valeur à une constante recopiée — il la confronte à
 * l'usage réel relevé dans `src/`.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const root = join(__dirname, '..', '..');

/** La valeur servie en production — Firebase Hosting la pose, Cloudflare la relaie. */
function permissionsPolicy(): string {
  const config = JSON.parse(readFileSync(join(root, 'firebase.json'), 'utf8'));
  const headers = config.hosting.headers.flatMap((h: { headers: { key: string; value: string }[] }) => h.headers);
  const found = headers.find((h: { key: string }) => h.key.toLowerCase() === 'permissions-policy');
  expect(found, 'firebase.json ne pose plus de Permissions-Policy').toBeTruthy();
  return found.value as string;
}

/**
 * Liste d'autorisation d'une directive, ou `null` si la directive est absente.
 *
 * `camera=(self)` → `['self']` · `camera=()` → `[]` · `camera=*` → `['*']`
 */
function allowlist(policy: string, directive: string): string[] | null {
  const match = policy.match(new RegExp(`(?:^|,)\\s*${directive}=(\\([^)]*\\)|[^,\\s]+)`));
  if (!match) return null;
  const raw = match[1].startsWith('(') ? match[1].slice(1, -1) : match[1];
  return raw.split(/\s+/).map((s) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
}

/** Le produit demande-t-il vraiment le micro et la caméra ? On le relève, on ne le suppose pas. */
function usesGetUserMedia(): boolean {
  // Un seul appelant aujourd'hui : `components/lms/MediaRecorderInput.tsx`, partagé par les
  // témoignages et le fil du Club.
  const recorder = readFileSync(join(root, 'src/components/lms/MediaRecorderInput.tsx'), 'utf8');
  return recorder.includes('getUserMedia');
}

describe('l’en-tête n’interdit pas ce que le produit propose', () => {
  it('le micro est autorisé pour cette origine, puisque le produit l’appelle', () => {
    expect(usesGetUserMedia(), 'plus aucun appel à getUserMedia — ce test est à revoir').toBe(true);
    const micro = allowlist(permissionsPolicy(), 'microphone');
    expect(micro, 'directive `microphone` absente').not.toBeNull();
    // `[]` est le piège : ce n'est pas « demander la permission », c'est « personne ».
    expect(micro).not.toEqual([]);
    expect(micro).toContain('self');
  });

  it('la caméra est autorisée pour cette origine, puisque le produit l’appelle', () => {
    const camera = allowlist(permissionsPolicy(), 'camera');
    expect(camera, 'directive `camera` absente').not.toBeNull();
    expect(camera).not.toEqual([]);
    expect(camera).toContain('self');
  });

  it('rien n’est ouvert à des tiers : l’autorisation s’arrête à cette origine', () => {
    // La correction devait ouvrir le strict nécessaire. `*` rouvrirait la porte à toute
    // iframe embarquée — et la page en embarque (YouTube, Spotify, Google).
    for (const directive of ['camera', 'microphone']) {
      expect(allowlist(permissionsPolicy(), directive)).not.toContain('*');
    }
  });

  it('la géolocalisation reste fermée — rien ne la demande', () => {
    expect(allowlist(permissionsPolicy(), 'geolocation')).toEqual([]);
  });
});

describe('la lecture des directives, pour que le test ne mente pas', () => {
  it('distingue une liste vide d’une liste absente', () => {
    expect(allowlist('camera=(), microphone=(self)', 'camera')).toEqual([]);
    expect(allowlist('camera=(), microphone=(self)', 'geolocation')).toBeNull();
  });

  it('lit les deux écritures de la spec', () => {
    expect(allowlist('camera=(self)', 'camera')).toEqual(['self']);
    expect(allowlist('camera=self', 'camera')).toEqual(['self']);
    expect(allowlist('camera=(self "https://x.test")', 'camera')).toEqual(['self', 'https://x.test']);
  });

  it('ne confond pas deux directives dont l’une finit comme l’autre', () => {
    // `microphone` ne doit pas être trouvé en cherchant `phone`, ni l'inverse.
    expect(allowlist('microphone=(self)', 'phone')).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES LIENS UNIVERSELS ÉTAIENT DÉCLARÉS D'UN SEUL CÔTÉ.
 *
 * `mobile/app.json` déclarait `associatedDomains` (iOS) et des `intentFilters` en
 * `autoVerify` (Android) depuis toujours. Les deux fichiers que ces déclarations
 * EXIGENT côté serveur — `.well-known/apple-app-site-association` et
 * `.well-known/assetlinks.json` — n'existaient pas.
 *
 * Le mode d'échec est silencieux des deux côtés : le système télécharge le fichier,
 * ne le trouve pas, et se contente d'ouvrir le navigateur. Aucune erreur, aucune
 * trace ; juste un lien qui « ne marche pas » sans qu'on sache pourquoi.
 *
 * ⚠️ ET UN FICHIER QUI PROMET PLUS QUE L'APPLICATION N'OUVRE EST PIRE QUE PAS DE
 * FICHIER : le lien s'ouvre dans l'app, qui ne sait pas quoi en faire. D'où la
 * porte qui compare les deux plateformes chemin par chemin.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const AASA = resolve(RACINE, 'public/.well-known/apple-app-site-association');
const ASSETLINKS = resolve(RACINE, 'public/.well-known/assetlinks.json');
const app = JSON.parse(readFileSync(resolve(RACINE, 'mobile/app.json'), 'utf8')).expo;
const eas = JSON.parse(readFileSync(resolve(RACINE, 'mobile/eas.json'), 'utf8'));
const firebase = JSON.parse(readFileSync(resolve(RACINE, 'firebase.json'), 'utf8'));

describe('les liens profonds sont déclarés des DEUX côtés', () => {
  it('les deux fichiers existent et sont du JSON valide', () => {
    for (const f of [AASA, ASSETLINKS]) {
      expect(existsSync(f), `${f} est absent`).toBe(true);
      expect(() => JSON.parse(readFileSync(f, 'utf8')), `${f} n’est pas du JSON`).not.toThrow();
    }
  });

  it('`assetlinks.json` désigne le paquet que l’application déclare', () => {
    const cible = JSON.parse(readFileSync(ASSETLINKS, 'utf8'))[0].target;
    expect(cible.package_name).toBe(app.android.package);
    expect(cible.namespace).toBe('android_app');
    /* Une empreinte au format brut (64 hex sans séparateur) est acceptée en silence par le
       fichier et refusée par Android : elle doit être en paires majuscules séparées par ':'. */
    for (const e of cible.sha256_cert_fingerprints as string[]) {
      expect(e, `empreinte mal formée : ${e}`).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
    }
  });

  it('l’identifiant Apple se termine par le bundle déclaré', () => {
    const aasa = JSON.parse(readFileSync(AASA, 'utf8'));
    for (const appID of aasa.applinks.details[0].appIDs as string[]) {
      expect(appID.endsWith(`.${app.ios.bundleIdentifier}`), `appID inattendu : ${appID}`).toBe(true);
    }
    /* `webcredentials:` est déclaré dans `associatedDomains` — sans le bloc correspondant
       ici, l'autoremplissage du mot de passe casse SANS que rien ne le signale. */
    const veutWebcredentials = (app.ios.associatedDomains as string[])
      .some((d) => d.startsWith('webcredentials:'));
    if (veutWebcredentials) {
      expect(aasa.webcredentials?.apps?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('les deux plateformes ouvrent EXACTEMENT les mêmes chemins', () => {
    /*
     * La porte qui empêche la dérive la plus coûteuse : un chemin promis d'un côté et pas de
     * l'autre. Sur iOS, le lien s'ouvre dans l'app qui ne sait pas quoi en faire ; sur
     * Android il part dans le navigateur. Les deux se découvrent après publication.
     */
    const aasa = JSON.parse(readFileSync(AASA, 'utf8'));
    const apple = new Set(
      (aasa.applinks.details[0].components as Array<{ '/': string }>)
        .map((c) => c['/'].replace(/\/\*$/, '')),
    );
    const android = new Set(
      (app.android.intentFilters as Array<{ data?: Array<{ pathPrefix?: string }> }>)
        .flatMap((f) => f.data ?? [])
        .map((d) => d.pathPrefix)
        .filter((p): p is string => typeof p === 'string'),
    );
    expect([...android].filter((p) => !apple.has(p)), 'promis par Android, absent d’Apple').toEqual([]);
    expect([...apple].filter((p) => !android.has(p)), 'promis par Apple, absent d’Android').toEqual([]);
  });

  it('Firebase Hosting ne masque pas le fichier, et le sert en JSON', () => {
    /* `appAssociation` vaut AUTO par défaut : Hosting génère alors sa PROPRE association,
       qui masque celle du dépôt. Et le fichier Apple n'a pas d'extension — sans en-tête
       explicite, il part en `application/octet-stream` et Apple l'ignore. */
    expect(firebase.hosting.appAssociation).toBe('NONE');
    const entete = (firebase.hosting.headers as Array<{ source: string; headers: Array<{ key: string; value: string }> }>)
      .find((h) => h.source === '/.well-known/apple-app-site-association');
    expect(entete, 'aucun en-tête pour l’association Apple').toBeDefined();
    expect(entete?.headers.some((h) => h.key === 'Content-Type' && h.value === 'application/json')).toBe(true);
  });

  it('le Team ID et `eas.json` se remplissent ENSEMBLE', () => {
    /*
     * Les deux attendent la même chose : l'ouverture du compte Apple. Le jour où le Team ID
     * arrive, il doit être posé aux DEUX endroits — et c'est exactement le genre de seconde
     * étape qu'on oublie, parce que la première a rendu l'application soumissible.
     *
     * ⚠️ Un `apple-app-site-association` est téléchargé À L'INSTALLATION et aux mises à jour
     * App Store, pas rafraîchi ensuite : un Team ID faux au moment de la première
     * publication se paie par une mise à jour complète.
     */
    const aasa = readFileSync(AASA, 'utf8');
    const aasaEnAttente = aasa.includes('REMPLIR');
    const easEnAttente = String(eas.submit.production.ios.appleTeamId).startsWith('REMPLIR');
    expect(
      aasaEnAttente,
      easEnAttente
        ? 'eas.json attend encore son Team ID — l’association Apple doit l’attendre aussi'
        : 'eas.json porte un Team ID : l’association Apple doit le porter aussi',
    ).toBe(easEnAttente);
  });
});

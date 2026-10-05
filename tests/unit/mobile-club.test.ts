import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CLUB_OPENED_AT, CLUB_REFERRAL_DISCOUNT } from '../../src/lib/club/pricing';
import { ONGLETS_CLUB, ongletDe } from '../../mobile/contenu/club';
import { CLUB_OUVERT_EN, REMISE_FILLEUL_PCT } from '../../mobile/contenu/termes';
import { VERROUS } from '../../mobile/contenu/verrous';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE CLUB SE PARCOURT PAR SA BANDE — huit onglets, l'ordre du kit, aucun oubli.
 *
 * La bande n'avait jamais été portée : cinq onglets sur huit n'étaient atteignables
 * par aucun geste. Trouvé par la réécriture Kotlin (abandonnée), reporté ici.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const CLUB = join(RACINE, 'mobile/app/club');
const lire = (p: string) => readFileSync(p, 'utf8');

/** `CLUB_ORDRE` du kit, lu dans le fichier — c'est lui qui fait autorité sur le rendu. */
function ordreDuKit(): string[] {
  const shell = lire(join(RACINE, 'DS_Final/ui_kits/native/NativeShell.js'));
  const m = /const CLUB_ORDRE\s*=\s*\[([^\]]*)\]/.exec(shell);
  if (!m) throw new Error('CLUB_ORDRE introuvable dans le kit natif');
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}

describe('la bande des huit onglets', () => {
  it('porte les huit libellés du kit, dans son ordre', () => {
    expect(ordreDuKit()).toHaveLength(8);
    expect(ONGLETS_CLUB.map((o) => o.libelle)).toEqual(ordreDuKit());
  });

  it('chaque onglet mène à un écran qui existe', () => {
    for (const o of ONGLETS_CLUB) {
      expect(existsSync(join(RACINE, 'mobile/app', `${o.href}.tsx`)), o.href).toBe(true);
    }
  });

  it('l’onglet actif se déduit de l’adresse', () => {
    expect(ongletDe('/club/agenda')?.libelle).toBe('Agenda');
    expect(ongletDe('/club/membre')).toBeNull();
  });

  it('l’enveloppe pose la bande, et la bande remplace au lieu d’empiler', () => {
    const layout = lire(join(CLUB, '_layout.tsx'));
    const coquille = layout.slice(layout.indexOf('export function ClubScreen'), layout.indexOf('function BandeClub'));
    expect(coquille).toContain('<BandeClub />');
    const bande = layout.slice(layout.indexOf('function BandeClub'));
    expect(bande).toMatch(/router\.replace\(/);
    expect(bande).not.toMatch(/router\.push\(/);
  });

  it('tout écran du dossier Club passe par l’enveloppe', () => {
    const ecrans = readdirSync(CLUB).filter((f) => f.endsWith('.tsx') && f !== '_layout.tsx');
    expect(ecrans.length).toBeGreaterThanOrEqual(10);
    const sans = ecrans.filter((f) => !lire(join(CLUB, f)).includes('<ClubScreen'));
    expect(sans, 'ces écrans n’ont pas la bande').toEqual([]);
  });

  it('le hub lit la même liste que la bande', () => {
    const hub = lire(join(RACINE, 'mobile/app/(tabs)/club.tsx'));
    expect(hub).toContain('ONGLETS_CLUB');
    expect(hub).toContain('/club/bloques');
  });
});

describe('le mois d’ouverture du Club est celui du site', () => {
  it('écrit en toutes lettres, depuis `CLUB_OPENED_AT`', () => {
    const [annee, mois] = CLUB_OPENED_AT.split('-');
    const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    expect(CLUB_OUVERT_EN).toBe(`${MOIS[Number(mois) - 1]} ${annee}`);
  });

  it('aucun écran ne dit plus « cette année »', () => {
    for (const f of ['mobile/app/(tabs)/club.tsx', 'mobile/app/club/infos.tsx']) {
      const code = lire(join(RACINE, f)).replace(/\/\*[\s\S]*?\*\//g, '');
      expect(code, f).not.toMatch(/ouvert cette année/);
    }
  });

  it('la source nomme son miroir', () => {
    expect(lire(join(RACINE, 'src/lib/club/pricing.ts'))).toContain('mobile/contenu/termes.ts');
  });
});

describe('l’écran verrouillé du Club', () => {
  it('chaque onglet de la bande a son contenu verrouillé', () => {
    expect(Object.keys(VERROUS).sort()).toEqual(ONGLETS_CLUB.map((o) => o.libelle).sort());
  });

  it('aucun relevé n’est écrit dans la copie — seul le terme de la remise y figure', () => {
    /* Le kit écrivait les comptes en lettres (« DEUX SESSIONS CE MOIS-CI. ») : des relevés
       présentés comme actuels. Ni chiffre, ni nombre en lettres. */
    const NOMBRES = /\b(un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|vingt|trente|quarante|cinquante|cent)s?\b/i;
    for (const [onglet, v] of Object.entries(VERROUS)) {
      const texte = [...v.titre, v.quoi, v.apercuTitre, v.apercuQuoi, ...v.compteurs].join(' ')
        .replace(`${REMISE_FILLEUL_PCT} %`, '');
      expect(texte, onglet).not.toMatch(/\d/);
      /* Les TITRES portaient les comptes du kit ; la description du dessin (« ses trois
         compteurs ») n'est pas un relevé, d'où la règle limitée aux titres. */
      expect(v.titre.join(' ').replace(/\bune?\b/gi, ''), onglet).not.toMatch(NOMBRES);
    }
  });

  it('la remise du filleul est celle du site', () => {
    expect(REMISE_FILLEUL_PCT).toBe(Math.round(CLUB_REFERRAL_DISCOUNT * 100));
    expect(lire(join(RACINE, 'src/lib/club/pricing.ts'))).toContain('REMISE_FILLEUL_PCT');
  });

  it('le cadenas ne tombe que sur une porte FERMÉE, jamais sur une liste vide', () => {
    const layout = lire(join(CLUB, '_layout.tsx'));
    expect(layout).toMatch(/club\.phase === 'vide' && club\.ferme === true/);
    const vue = lire(join(RACINE, 'mobile/donnees/vue.ts'));
    const corps = vue.slice(vue.indexOf('function etatDe'));
    /* `[]` rend un vide SANS `ferme` ; seul `null` porte le sens du contrat. */
    expect(corps).toMatch(/Array\.isArray\(valeur\) && valeur\.length === 0\) return \{ phase: 'vide', valeur: null, \.\.\.provenance \}/);
    expect(vue).toContain('VUE_NULLE');
  });
});


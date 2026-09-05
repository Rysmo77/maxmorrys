import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE SOCLE DE L'APPLICATION ANDROID — CE QUI NE DOIT PAS DÉRIVER.
 *
 * 110 cas de test ont disparu avec `mobile/`. Trois d'entre eux avaient attrapé des
 * défauts réels que ni le compilateur ni la relecture ne voyaient. Ce fichier reprend
 * celles de leurs garanties qui s'appliquent déjà au socle Kotlin ; le reste attend
 * le lot 6 (`_bmad-output/implementation-artifacts/garanties-a-reconstruire.md`).
 *
 * ⚠️ Ces portes lisent des FICHIERS, pas des types. C'est un choix assumé et limité :
 * elles attrapent la dérive de valeurs et les correspondances manquantes, pas les
 * erreurs de logique. La compilation Gradle reste ce qui prouve.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const ANDROID = join(RACINE, 'android/app/src/main');

const lire = (p: string) => readFileSync(join(RACINE, p), 'utf8');

describe('les neuf fontes, dans les deux sens', () => {
  /*
   * ⛔ `aapt2` REFUSE tout ce qui n'est pas [a-z0-9_] dans `res/font/`. Les fichiers livrés
   * s'appellent `SchibstedGrotesk_500Medium.ttf` et ont dû être renommés. Un renommage est
   * exactement le genre de geste qui laisse une fonte derrière lui : le texte retombe alors
   * sur la fonte système, ce qui ressemble à un défaut de rendu et non à un fichier manquant.
   */
  const polices = lire('android/app/src/main/java/me/maxmorrys/rysmo/ds/Polices.kt');
  const deposees = readdirSync(join(ANDROID, 'res/font')).filter((f) => f.endsWith('.ttf'));
  const citees = [...polices.matchAll(/R\.font\.([a-z0-9_]+)/g)].map((m) => m[1]);

  it('chaque fonte citée par le code existe dans res/font/', () => {
    const absentes = citees.filter((n) => !deposees.includes(`${n}.ttf`));
    expect(absentes, 'citées dans Polices.kt sans fichier correspondant').toEqual([]);
  });

  it('chaque fonte déposée sert à quelque chose', () => {
    const orphelines = deposees.filter((f) => !citees.includes(f.replace(/\.ttf$/, '')));
    expect(orphelines, 'déposées dans res/font/ sans être citées — 300 Ko chacune').toEqual([]);
  });

  it('les neuf sont là', () => {
    expect(deposees.length).toBe(9);
    expect(citees.length).toBe(9);
  });

  it('les noms de ressource sont légaux pour aapt2', () => {
    const illegales = deposees.filter((f) => !/^[a-z][a-z0-9_]*\.ttf$/.test(f));
    expect(illegales, 'aapt2 n’accepte que [a-z0-9_] : majuscule, espace ou tiret font échouer la compilation des ressources').toEqual([]);
  });

  it('les familles sont nommées par les jetons, pas par des chaînes écrites à la main', () => {
    /* `FAMILLES` est la table lue par le reste du code. La clef DOIT venir de `Metrique`,
       sinon le nom de design et le nom du jeton peuvent diverger sans que rien ne le voie. */
    const table = /val FAMILLES[\s\S]*?\)\n/.exec(polices)?.[0] ?? '';
    expect(table).not.toBe('');
    const clefsLitterales = [...table.matchAll(/^\s*"([^"]+)" to /gm)].map((m) => m[1]);
    expect(clefsLitterales, 'clefs écrites en dur au lieu de Metrique.f*').toEqual([]);
    expect([...table.matchAll(/Metrique\.(f[A-Za-z]+) to /g)].length).toBe(3);
  });
});

describe('le mode sombre n’est pas un filtre', () => {
  /*
   * ⛔ LE DÉFAUT QUE CETTE PORTE EXISTE POUR EMPÊCHER A DÉJÀ ÉTÉ LIVRÉ UNE FOIS.
   *
   * Le port React Native ne parsait pas les dégradés : il les reconstruisait en relisant
   * leurs teintes par leur jeton d'origine. Or `arc` part de #0057BC en clair et de #6FB1FF
   * en sombre. Le contournement rendait donc la version claire dans les deux modes — sans
   * erreur, sans avertissement, et invisible à toute relecture du code.
   *
   * On compte ici que les deux palettes DIVERGENT vraiment, et sur le bon nombre de jetons.
   */
  const kt = lire('android/app/src/main/java/me/maxmorrys/rysmo/ds/Jetons.generated.kt');
  const ts = lire('src/design-system/tokens.generated.ts');

  const champs = (titre: string) => {
    const i = kt.indexOf(`val ${titre} = Palette(`);
    const j = kt.indexOf('\n)', i);
    const out: Record<string, string> = {};
    for (const m of kt.slice(i, j).matchAll(/^ {2}(\w+) = ([\s\S]*?),$/gm)) out[m[1]] = m[2];
    return out;
  };
  const claire = champs('PALETTE_CLAIRE');
  const sombre = champs('PALETTE_SOMBRE');

  /** Le compte de référence vient de la SOURCE TypeScript, pas du Kotlin qu'on vérifie. */
  const tableTs = (mode: string) => {
    const i = ts.indexOf(`${mode}: {`);
    const j = ts.indexOf('} as const', i);
    const o: Record<string, string> = {};
    for (const m of ts.slice(i, j).matchAll(/^ {2}(\w+): ("(?:[^"\\]|\\.)*"),$/gm)) o[m[1]] = JSON.parse(m[2]);
    return o;
  };
  const L = tableTs('light');
  const D = tableTs('dark');

  it('les deux palettes portent les mêmes jetons', () => {
    expect(Object.keys(claire).sort()).toEqual(Object.keys(sombre).sort());
    expect(Object.keys(claire).length).toBeGreaterThan(100);
  });

  it('elles divergent exactement là où le CSS diverge', () => {
    const divergentsKt = Object.keys(claire).filter((k) => claire[k] !== sombre[k]).sort();
    const divergentsCss = Object.keys(claire).filter((k) => L[k] !== D[k]).sort();
    expect(divergentsKt).toEqual(divergentsCss);
    expect(divergentsKt.length).toBeGreaterThan(60);
  });

  it('les six arcs basculent, et le premier arrêt de `arc` n’est pas le même', () => {
    for (const n of ['arc', 'arcForme', 'arcInforme', 'arcTransforme', 'arcDigitalise', 'arcAgence']) {
      expect(claire[n], `${n} manque à la palette`).toBeDefined();
      expect(claire[n], `${n} rend la même chose dans les deux modes — c’est le défaut du port RN`).not.toBe(sombre[n]);
    }
    expect(claire.arc).toContain('0xFF0057BC');
    expect(sombre.arc).toContain('0xFF6FB1FF');
  });

  it('une ombre qui disparaît la nuit est bien nulle, pas héritée', () => {
    /* `fieldHl` vaut `none` en sombre. Un émetteur qui ne saurait pas lire `none` aurait
       soit échoué, soit — pire — recopié la valeur claire sur la surface nuit. */
    expect(sombre.fieldHl).toBe('null');
    expect(claire.fieldHl).toContain('Ombre(inset = true');
  });
});

describe('les couleurs ne sont pas écrites à la main', () => {
  /*
   * La garantie de `mobile-ds.test.ts`, transposée. Le code Kotlin ÉCRIT À LA MAIN ne doit
   * porter aucune valeur de couleur : elles vivent dans `Jetons.generated.kt`, qui vient du
   * CSS. Une teinte écrite ici serait la première à dériver — et personne ne la reverrait.
   */
  const walk = (d: string): string[] =>
    readdirSync(d, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);

  it('aucun littéral de couleur dans le Kotlin écrit à la main', () => {
    const fautes: string[] = [];
    for (const f of walk(join(ANDROID, 'java')).filter((f) => f.endsWith('.kt'))) {
      if (f.endsWith('.generated.kt')) continue;
      const code = readFileSync(f, 'utf8')
        .replace(/\/\/.*$/gm, '')
        /* Kotlin imbrique les commentaires de bloc ; ce retrait non imbriqué suffit ici
           parce qu'on ne cherche qu'à ne pas accuser un exemple cité en commentaire. */
        .replace(/\/\*[\s\S]*?\*\//g, '');
      for (const m of code.matchAll(/Color\(\s*0x[0-9A-Fa-f]{6,8}\s*\)/g)) {
        fautes.push(`${f.slice(RACINE.length + 1)} : ${m[0]}`);
      }
    }
    expect(fautes, 'une couleur écrite ici ne vient plus du CSS et dérivera en silence').toEqual([]);
  });
});

describe('l’icône du lanceur', () => {
  const vecteur = lire('android/app/src/main/res/drawable/ic_launcher_foreground.xml');
  const marque = lire('android/app/src/main/res/values/marque.generated.xml');
  const ts = lire('src/design-system/tokens.generated.ts');

  it('les quatre chevrons lisent la marque, sans littéral', () => {
    const teintes = [...vecteur.matchAll(/android:strokeColor="([^"]+)"/g)].map((m) => m[1]);
    expect(teintes.length).toBe(4);
    expect(teintes.filter((t) => t.startsWith('#')), 'teinte écrite en dur dans le vectoriel').toEqual([]);
    expect(new Set(teintes).size, 'un territoire est peint deux fois').toBe(4);
  });

  it('la marque est FIGÉE : aucun miroir dans values-night/', () => {
    /* ⛔ `ds_mm_bleu` bascule en sombre — c'est juste pour du texte, et faux pour une
       icône de lanceur : l'utilisateur cherche son application par sa couleur. */
    expect(existsSync(join(ANDROID, 'res/values-night/marque.generated.xml')),
      'un miroir nocturne ferait changer l’icône selon le réglage du téléphone').toBe(false);
  });

  it('ses teintes sont celles des quatre territoires, en mode clair', () => {
    const i = ts.indexOf('light: {');
    const bloc = ts.slice(i, ts.indexOf('} as const', i));
    const clair: Record<string, string> = {};
    for (const m of bloc.matchAll(/^ {2}(\w+): ("(?:[^"\\]|\\.)*"),$/gm)) clair[m[1]] = JSON.parse(m[2]);
    for (const [res, jeton] of [
      ['marque_mm_bleu', 'mmBleu'], ['marque_mm_orange', 'mmOrange'],
      ['marque_mm_violet', 'mmViolet'], ['marque_mm_teal', 'mmTeal'],
    ]) {
      const v = new RegExp(`name="${res}">#FF([0-9A-F]{6})<`).exec(marque)?.[1];
      expect(v, `${res} absente`).toBeDefined();
      expect(`#${v}`, `${res} ne vaut plus le jeton ${jeton}`).toBe(clair[jeton].toUpperCase());
    }
  });
});

describe('les trois identités qu’une réécriture peut détruire', () => {
  const gradle = lire('android/app/build.gradle.kts');
  const manifeste = lire('android/app/src/main/AndroidManifest.xml');
  const liens = JSON.parse(lire('public/.well-known/assetlinks.json'));

  it('le nom de paquet est celui déjà publié', () => {
    expect(gradle).toContain('applicationId = "me.maxmorrys.rysmo"');
    expect(liens[0].target.package_name).toBe('me.maxmorrys.rysmo');
  });

  it('le versionCode ne redescend jamais sous 4', () => {
    /* Le versionCode distant vaut 3 chez EAS. Play REFUSE un numéro inférieur ou égal à un
       déjà téléversé : repartir de 1 rendrait le paquet impossible à mettre à jour. */
    const v = Number(/versionCode = (\d+)/.exec(gradle)?.[1]);
    expect(v).toBeGreaterThanOrEqual(4);
  });

  it('les liens profonds sont déclarés des deux côtés', () => {
    /* La garantie de `mobile-liens-profonds.test.ts`. Un préfixe déclaré au manifeste mais
       absent du site s'ouvre dans le navigateur, sans erreur : le défaut est muet. */
    const prefixes = [...manifeste.matchAll(/android:pathPrefix="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(prefixes)).toEqual(new Set(['/formations', '/verifier']));
    const hotes = [...manifeste.matchAll(/android:host="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(hotes)).toEqual(new Set(['maxmorrys.me', 'www.maxmorrys.me']));
    expect(manifeste).toContain('android:autoVerify="true"');
  });

  it('l’empreinte de signature publiée est toujours celle d’EAS', () => {
    /*
     * ⛔ Signer avec un keystore NEUF changerait cette empreinte. Les App Links cesseraient
     * d'être vérifiés — silencieusement, le lien s'ouvrant alors dans le navigateur — et
     * Play refuserait la mise à jour du paquet publié. Le keystore doit être exporté d'EAS
     * (Build Credentials 8UyPdZw7WS) ou la signature continuer de passer par EAS.
     */
    expect(liens[0].target.sha256_cert_fingerprints).toEqual([
      'E7:CB:00:31:C2:9C:DD:C2:4B:2C:15:ED:57:B3:D7:7D:64:3E:59:47:49:BA:03:E8:46:C8:66:46:20:59:38:48',
    ]);
  });

  it('aucune configuration de signature n’entre dans le dépôt', () => {
    expect(gradle).not.toMatch(/storePassword|keyPassword|storeFile/);
  });
});

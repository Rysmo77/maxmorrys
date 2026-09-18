import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { PACKS, packEffectivePrice } from '../../src/lib/presence/offer';
import { legalEntity, legalName, corporateUrl } from '../../src/lib/brand/company';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES DEUX PAGES COMMERCIALES SONT DÉCRITES DEUX FOIS, DANS DEUX BUILDS.
 *
 * `src/pages/Agence.tsx` et `src/pages/PresenceDigitale.tsx` posaient leurs données
 * structurées via Helmet. (`Agence.tsx` a été supprimée par la refonte en deux pistes du
 * 14/09/2026 : la page mère de la piste est `src/pages/conception/Conception.tsx`, et
 * `/agence` part en 301 vers `/conception`.) Sur une route prérendue, c'est le Worker qui
 * écrit le `<head>` lu par les moteurs, et React ne repasse qu'après hydratation : ce
 * balisage n'était vu par AUCUN crawler. Les deux pages les plus chères du site n'avaient, pour Google,
 * aucune donnée structurée.
 *
 * Le porter dans `worker/apps/site/src/prerender/static-pages.ts` le rend visible — et
 * crée un miroir de plus, dans un paquet que le frontend ne peut pas importer. Ce fichier
 * est le prix de ce choix.
 *
 * ⚠️ CE MIROIR N'EST PAS NEUF, IL ÉTAIT SEULEMENT INVISIBLE. Le `bodyText` de
 * `/presence-digitale` récitait déjà les sept montants de l'offre EN TOUTES LETTRES, avec
 * pour seule garde un commentaire « les montants doivent rester alignés ». Un tarif changé
 * dans `offer.ts` laissait la page prérendue en annoncer un autre aux moteurs, en prose
 * comme en `Offer.price`, sans que rien ne bronche.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const source = readFileSync(
  join(__dirname, '..', '..', 'worker/apps/site/src/prerender/static-pages.ts'),
  'utf8',
);

/**
 * L'entrée d'une page, de ses accolades ouvrantes à l'entrée suivante, quelle qu'elle soit.
 *
 * ⚠️ CETTE FONCTION PRENAIT LE NOM DE LA ROUTE SUIVANTE EN ARGUMENT, et c'est ce qui l'a fait
 * tomber : la refonte en deux pistes a renommé `/agence` et `/presence-digitale`, donc les
 * bornes ont changé, donc la suite entière a cessé de se collecter — sans qu'aucun de ses
 * invariants ne soit en cause. Un test qui dépend de l'ORDRE d'une table qu'il ne possède pas
 * rougit à chaque réorganisation, et on finit par le lire comme du bruit.
 *
 * La borne est désormais la prochaine clé de route, trouvée par sa forme.
 */
function entree(chemin: string): string {
  const debut = source.indexOf(`'${chemin}': {`);
  expect(debut, `entrée ${chemin} introuvable dans static-pages.ts`).toBeGreaterThan(-1);
  const reste = source.slice(debut + chemin.length + 6);
  const suivante = reste.search(/\n {2}'\/[^']*': \{/);
  return suivante === -1 ? source.slice(debut) : source.slice(debut, debut + chemin.length + 6 + suivante);
}

/**
 * Les montants sont écrits avec des espaces, parfois insécables : on les efface.
 *
 * Les échappements `\u00a0` / `\u202f` ne sont pas de la coquetterie : écrits en clair,
 * ces caractères sont invisibles à la relecture, et `no-irregular-whitespace` fait
 * échouer le lint — donc toute la CI, donc le déploiement.
 */
function sansEspaces(texte: string): string {
  return texte.replace(/[\s\u00a0\u202f]/g, '');
}

describe('/conception/commerces-et-tpe — les montants prérendus sont ceux de l’offre', () => {
  const bloc = entree('/conception/commerces-et-tpe');

  it('chaque `Offer.price` est le prix EFFECTIF d’un pack, et les trois y sont', () => {
    const emis = [...bloc.matchAll(/'@type':\s*'Offer'[^}]*?price:\s*(\d+)/g)]
      .map((m) => Number(m[1]))
      .sort((a, b) => a - b);
    const attendus = PACKS.map(packEffectivePrice).sort((a, b) => a - b);

    // `packEffectivePrice` = `promoPrice ?? price` : c'est ce que la personne paie, et
    // c'est ce que `Offer.price` désigne. Émettre le prix de liste ferait annoncer aux
    // moteurs un montant que la page ne facture pas.
    expect(emis, 'les prix du JSON-LD prérendu ont dérivé de src/lib/presence/offer.ts').toEqual(
      attendus,
    );
  });

  it('la prose prérendue cite le prix de LISTE de chaque pack', () => {
    // Le barré est une affaire d'affichage : la prose vend « à partir de 295 000 »,
    // le balisage facture 250 000. Les deux sont justes, et les deux doivent suivre.
    const texte = sansEspaces(bloc);
    for (const pack of PACKS) {
      expect(
        texte.includes(`${pack.price}FCFA`),
        `bodyText de /conception/commerces-et-tpe ne cite plus ${pack.price} FCFA (pack « ${pack.key} »)`,
      ).toBe(true);
    }
  });
});

describe('/conception — la marque et la personne morale ne dérivent pas', () => {
  const bloc = entree('/conception');

  it('le `provider` est la raison sociale, à son adresse déclarée', () => {
    expect(bloc).toContain(legalName);
    expect(bloc).toContain(corporateUrl);
    expect(bloc).toContain(legalEntity.registeredAddress!);
    expect(bloc).toContain(legalEntity.city);
    expect(bloc).toContain(legalEntity.countryCode);
  });

  it('Max-Morrys Agency reste une MARQUE, jamais une Organization autonome', () => {
    // L'invariant de l'architecture de marque : la practice n'a pas de personnalité
    // juridique. Une `Organization` à son nom en inventerait une aux yeux de Google.
    expect(bloc).toMatch(/'@type':\s*'Brand',\s*name:\s*'Max-Morrys Agency'/);
    const organizations = [...bloc.matchAll(/'@type':\s*'Organization',\s*\n\s*name:\s*'([^']+)'/g)];
    for (const [, nom] of organizations) {
      expect(nom, "une Organization porte le nom d'une marque").toBe(legalName);
    }
  });
});

describe('les deux pages sont bien balisées pour les moteurs', () => {
  it('chacune porte un `Service` dans son JSON-LD prérendu', () => {
    for (const chemin of ['/conception', '/conception/commerces-et-tpe'] as const) {
      const bloc = entree(chemin);
      expect(bloc, `${chemin} n'a plus de jsonLd`).toContain('jsonLd:');
      expect(bloc, `${chemin} ne se décrit plus comme un Service`).toMatch(
        /'@type':\s*'Service'/,
      );
    }
  });
});

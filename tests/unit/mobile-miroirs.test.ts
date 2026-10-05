import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CATALOGUE_REVISED_AT, DEPOSIT_RATE, PACKS, QUOTE_VALIDITY_DAYS, findPack, generateQuoteRef,
  isValidQuoteRef, packEffectivePrice,
} from '../../src/lib/presence/offer';
import { TVA_TAUX_NORMAL, regimeDe, ventilerDepuisHT } from '../../src/lib/tax/senegal';
import { SUPPORT_SCOPE } from '../../src/lib/adminAccess';
import { ADMIN_SCREEN_COUNT } from '../../src/lib/admin/consoleNav';
import { contact } from '../../src/lib/brand';
import presenceFr from '../../src/i18n/locales/fr/presence.json';
import {
  ECRANS_CONSOLE, ECRANS_HORS_PORTEE, FORME_REFERENCE, OFFRE, PORTEES_SUPPORT, PORTEE_RESUMEE,
  WHATSAPP_NUMERO, lienDeVerification, ttc,
} from '../../mobile/contenu/termes';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES TERMES QUE L'APPLICATION RECOPIE DU SITE NE DIVERGENT PAS.
 *
 * `mobile/` ne peut pas importer `src/` (Metro, AD-9) : la grille de l'offre et la
 * portée du rôle support y sont RECOPIÉES, dans `mobile/contenu/termes.ts`. Ce
 * fichier n'a aucune dépendance, ce qui permet de l'IMPORTER ici et de comparer des
 * valeurs, pas des motifs textuels.
 *
 * ⓘ Reporté de `natif-miroirs.test.ts` (réécriture Kotlin, abandonnée le 04/10/2026),
 * qui avait trouvé deux mensonges dans le port React Native : « 5 écrans sur 19 », et
 * « Pack Visible » au prix du pack `presence`.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const lire = (p: string) => readFileSync(resolve(RACINE, p), 'utf8');

describe('la grille de l’offre Présence Digitale ne diverge pas entre le site et l’application', () => {
  const presence = findPack('presence');

  it('la grille garde bien trois packs distincts', () => {
    /* Garde-fou : si la grille se réduisait à un pack, les comparaisons ci-dessous
       deviendraient vraies sans rien prouver. */
    expect(new Set(PACKS.map((p) => p.key)).size).toBe(3);
  });

  it('le pack d’entrée est celui dont l’application porte les montants', () => {
    expect(OFFRE.packCle).toBe('presence');
    expect(presence, 'le pack « presence » a disparu de la grille').toBeDefined();
    expect(findPack('visible')?.price).not.toBe(presence?.promoPrice);
  });

  it('les deux montants sont les mêmes, et c’est le prix PRATIQUÉ qui s’affiche', () => {
    expect(OFFRE.prixListe).toBe(presence!.price);
    expect(OFFRE.prixPratique).toBe(presence!.promoPrice);
    expect(OFFRE.prixPratique).toBe(packEffectivePrice(presence!));
  });

  it('le nom et les lignes du pack sont ceux du site, mot pour mot', () => {
    const fiche = (presenceFr as { packs: { presence: { name: string; features: string[] } } }).packs.presence;
    expect(OFFRE.packNom).toBe(fiche.name);
    expect([...OFFRE.lignes]).toEqual(fiche.features);
  });

  it('support, acompte et validité du devis sont les mêmes', () => {
    expect(OFFRE.supportJours).toBe(presence!.supportDays);
    expect(OFFRE.acomptePct).toBe(Math.round(DEPOSIT_RATE * 100));
    expect(OFFRE.validiteJours).toBe(QUOTE_VALIDITY_DAYS);
  });

  it('la date de révision de la grille est la même (lue en UTC)', () => {
    const d = CATALOGUE_REVISED_AT;
    const attendue = [
      String(d.getUTCDate()).padStart(2, '0'),
      String(d.getUTCMonth() + 1).padStart(2, '0'),
      d.getUTCFullYear(),
    ].join('/');
    expect(OFFRE.reviseLe).toBe(attendue);
  });

  it('la taxe est celle du régime « agence », calculée comme le site', () => {
    const regime = regimeDe('agence');
    expect(regime.etat, 'la prestation d’agence n’est plus taxable').toBe('taxable');
    expect(OFFRE.tvaTauxPct).toBe(Math.round(TVA_TAUX_NORMAL * 100));
    for (const ht of [presence!.promoPrice!, presence!.price, 1, 999]) {
      expect(ttc(ht)).toBe(ventilerDepuisHT(ht, regime).ttc);
    }
  });

  it('l’ambiguïté qui a fait retirer le prix barré tient toujours', () => {
    /* Le TTC du prix pratiqué tombe EXACTEMENT sur le prix de liste : « 250 000 barré
       295 000 » se lirait aussi bien comme une remise que comme une taxe. Si cette
       égalité cesse, le prix barré peut être rediscuté (voir `contenu/engagement.ts`). */
    expect(ttc(OFFRE.prixPratique)).toBe(OFFRE.prixListe);
  });

  it('les chemins de l’offre et du devis sont ceux que le routeur du site sert', () => {
    const app = lire('src/App.tsx');
    expect(app).toContain(`path: '${OFFRE.cheminDevis.replace(/^\//, '')}:ref'`);
    expect(app).toContain(`path: '${OFFRE.cheminOffre.replace(/^\//, '')}'`);
  });

  it('la forme d’une référence de devis est la même des deux côtés', () => {
    /* Rejouée sur des références RÉELLES plutôt que de comparer deux littéraux. Le kit
       écrivait `MM-D-4831`, qui n'a pas cette forme — un lien mort sur un document. */
    for (let i = 0; i < 5; i += 1) {
      const ref = generateQuoteRef();
      expect(isValidQuoteRef(ref)).toBe(true);
      expect(FORME_REFERENCE.test(ref), `l’application refuse une référence valide : ${ref}`).toBe(true);
    }
    for (const faux of ['MM-D-4831', 'DV-0123', 'dv-0123456789ab', '']) {
      expect(isValidQuoteRef(faux)).toBe(false);
      expect(FORME_REFERENCE.test(faux), `l’application accepte : ${faux}`).toBe(false);
    }
  });

  it('le numéro WhatsApp est celui de la marque', () => {
    expect(WHATSAPP_NUMERO).toBe(contact.phoneRaw);
  });

  it('la grille nomme son miroir', () => {
    expect(lire('src/lib/presence/offer.ts')).toContain('mobile/contenu/termes.ts');
  });
});

describe('la portée du rôle support ne diverge pas entre le site et l’application', () => {
  it('le compte d’écrans de la console est celui de la table', () => {
    expect(ECRANS_CONSOLE).toBe(ADMIN_SCREEN_COUNT);
    expect(ECRANS_HORS_PORTEE).toBe(ADMIN_SCREEN_COUNT - SUPPORT_SCOPE.length);
    expect(PORTEE_RESUMEE).toBe(`${SUPPORT_SCOPE.length} écrans sur ${ADMIN_SCREEN_COUNT}`);
  });

  it('les cinq portées ont les mêmes libellés et les mêmes chemins, dans le même ordre', () => {
    expect(PORTEES_SUPPORT.map((p) => ({ to: p.to, label: p.label })))
      .toEqual(SUPPORT_SCOPE.map((s) => ({ to: s.to, label: s.label })));
  });

  it('aucun écran de l’application n’écrit plus le compte en dur', () => {
    /* « 5 écrans sur 19 » et « les quatorze autres » ont vécu dans quatre fichiers. */
    const fichiers = [
      'mobile/app/console/index.tsx', 'mobile/app/console/_layout.tsx',
      'mobile/app/(tabs)/profil.tsx', 'mobile/app/apercu.tsx', 'mobile/contenu/portee.ts',
    ];
    for (const f of fichiers) {
      expect(lire(f), f).not.toMatch(/écrans sur \d+|quatorze autres|sur dix-neuf/i);
    }
  });

  it('les deux sources du site nomment leur miroir', () => {
    expect(lire('src/lib/adminAccess.ts')).toContain('mobile/contenu/termes.ts');
    expect(lire('src/lib/admin/consoleNav.ts')).toContain('mobile/contenu/termes.ts');
  });
});

describe('le lien de vérification d’un certificat ouvre une page qui répond', () => {
  it('le chemin partagé est servi par le routeur du site, et le code passe en paramètre', () => {
    /* ⛔ L'application partageait `/verifier/<code>`, que le site ne sert pas : un employeur
       sans l'application tombait sur une 404 — ce qui ressemble le plus à un faux document. */
    const lien = new URL(lienDeVerification('MM-ABC1234567'));
    expect(lien.pathname).toBe('/verifier');
    expect(lien.searchParams.get('code')).toBe('MM-ABC1234567');
    expect(lire('src/App.tsx')).toContain("path: 'verifier'");
  });

  it('la page web lit `?code=` et vérifie dès l’arrivée', () => {
    const page = lire('src/pages/VerifyCertificate.tsx');
    expect(page).toMatch(/params\.get\('code'\)/);
    expect(page).toMatch(/void verifier\(recu\)/);
  });

  it('aucun écran de l’application ne construit plus `/verifier/<code>`', () => {
    for (const f of ['mobile/app/certificat.tsx', 'mobile/app/partage.tsx', 'mobile/contenu/demo.ts']) {
      expect(lire(f), f).not.toMatch(/\/verifier\/\$\{|\/verifier\/MM-/);
    }
  });
});

describe('le retour depuis le site ouvre un écran qui constate', () => {
  it('la page de retour du site propose `rysmo://acces`, et l’écran existe', () => {
    const page = lire('src/pages/lms/PaymentReturn.tsx');
    expect(page).toMatch(/rysmo:\/\/acces\?transactionId=\$\{encodeURIComponent\(transactionId\)\}/);
    const app = JSON.parse(lire('mobile/app.json')).expo;
    expect(app.scheme).toBe('rysmo');
    expect(lire('mobile/app/acces.tsx')).toContain('useAcces');
  });

  it('« C’est à toi » n’est écrit que sur un accès CONSTATÉ', () => {
    const donnees = lire('mobile/donnees/index.ts');
    expect(donnees).toMatch(/t\.statut === 'completed' && t\.acces/);
    const ecran = lire('mobile/app/acces.tsx');
    const ouvert = ecran.slice(ecran.indexOf("suivi.etape === 'ouvert'"), ecran.indexOf("suivi.etape === 'attente'"));
    expect(ouvert).toContain("C'EST À TOI.");
    expect(ecran.split("C'EST À TOI.").length - 1).toBe(1);
  });
});


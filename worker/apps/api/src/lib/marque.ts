/**
 * L'IDENTITÉ LÉGALE PORTÉE PAR LE COURRIER.
 *
 * Miroir de `src/lib/brand/company.ts` (lui-même miroir du dépôt My-onoma, qui fait foi).
 * Un Worker ne peut pas importer `src/` — trois projets TypeScript indépendants, voir
 * `_bmad-output/project-context.md` — d'où cette copie littérale. Elle est GARDÉE par
 * `test/email-gabarits.test.ts`, qui relit le fichier source et échoue au premier écart :
 * une copie que rien ne compare finit toujours par diverger.
 *
 * Seuls les champs publiés aux mentions légales sont repris. Rien n'est inventé ici.
 */
export const IDENTITE = {
  raisonSociale: 'MY ONOMA SARL',
  rccm: 'SN DKR 2022 B 11134',
  ninea: '009319501',
  siege: 'Quartier Ouakam, Cité Batrain, Lot 384',
  ville: 'Dakar',
  pays: { fr: 'Sénégal', en: 'Senegal' },
  marque: 'Max-Morrys',
  site: 'maxmorrys.me',
} as const;

/**
 * La ligne légale du pied de chaque courrier.
 *
 * Elle dit QUI écrit : la marque, la société qui l'opère, et son siège. Un courrier
 * marketing qui ne nomme pas son émetteur est irrégulier (loi sénégalaise 2008-08 sur les
 * transactions électroniques, RGPD pour la diaspora) ; un transactionnel qui le nomme se
 * reconnaît mieux, et c'est ce qui le sauve d'un signalement.
 */
export function ligneLegale(langue: 'fr' | 'en'): string {
  const operee = langue === 'en' ? 'operated by' : 'opérée par';
  return `${IDENTITE.marque}, ${operee} ${IDENTITE.raisonSociale} — ${IDENTITE.siege}, ${IDENTITE.ville}, ${IDENTITE.pays[langue]}`;
}

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'worker/**/node_modules',
      /*
       * `.claude/worktrees/` PORTE UNE COPIE COMPLETE DU DEPOT, kit de design inclus.
       *
       * Les entrees ci-dessous sont ancrees a la racine : elles ne matchent donc pas la copie
       * imbriquee, et le kit y rouvre exactement les 57 erreurs de parsage que ces memes
       * entrees avaient refermees a la racine. Une sortie de lint a 57 erreurs permanentes
       * n'est plus lue — c'est le mecanisme par lequel une VRAIE erreur passe inapercue.
       *
       * Un worktree est une copie de travail, jamais une source de ce projet.
       */
      '.claude/**',
      /*
       * LE KIT EST UNE SOURCE, PAS DU CODE DU PRODUIT. Ses fichiers `.js` portent du JSX
       * compilé dans le navigateur par Babel standalone, ce que le parseur d'ESLint refuse :
       * 56 « Parsing error: Unexpected token < » sur des fichiers qu'on n'a pas écrits et
       * qu'on ne doit surtout pas modifier — « les kits sont la source de vérité ».
       *
       * Une sortie de lint à 56 erreurs permanentes n'est plus lue : c'est le mécanisme même
       * par lequel une VRAIE erreur passe inaperçue. `ds:check` saute déjà ce dossier pour la
       * même raison.
       *
       * `design_handoff_maxmorrys` est la MÊME catégorie : le dossier de transfert reçu, dont
       * `reference/` porte 26 prototypes en JSX compilé au navigateur. Son propre readme le
       * dit — « Ce n'est pas du code de production à copier » — et ses 28 erreurs de parsage
       * rouvraient exactement le trou que l'entrée ci-dessus avait refermé.
       *
       * LES DEUX ENTRÉES PRÉCÉDENTES NE DÉSIGNAIENT PLUS RIEN. Le kit a été relivré sous
       * `Max-Morrys_DS_Platform/`, qui ABSORBE les deux anciens dossiers — l'ancien transfert
       * y vit désormais comme sous-arbre `design_handoff_maxmorrys/`. Ignorer la racine les
       * couvre tous les deux ; laisser les anciens noms ne couvrait plus personne, et les
       * 56 erreurs de parsage étaient revenues à l'identique.
       *
       * ⛔ ET C'EST ARRIVÉ UNE TROISIÈME FOIS, le 05/09/2026. Le kit a été relivré sous
       * `DS_Final/`, qui absorbe à son tour `handoff_natif/`, `handoff_tableaux_de_bord/` et
       * `design_handoff_maxmorrys/` — plus huit dossiers qui n'existaient nulle part. Les 44
       * erreurs de parsage sont revenues à l'identique, sur des fichiers qu'on n'a pas écrits.
       *
       * TROIS RENOMMAGES, TROIS FOIS LE MÊME TROU. Ce n'est plus un accident : c'est la forme
       * de ce projet. Le kit arrive sous un nom neuf à chaque livraison, et une entrée ancrée
       * à un nom ne survit pas au suivant. `tests/unit/lint-kits-ignores.test.ts` refuse
       * désormais qu'un dossier de kit non ignoré entre dans le dépôt — la porte se déplace du
       * nom vers la FORME, parce que c'est la forme qui se répète.
       */
      'Max-Morrys_DS_Platform',
      'DS_Final',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Allow intentionally-unused args/vars prefixed with `_` (kept for
      // call-site/signature compatibility, e.g. lib/firestore/certificates.ts).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  }
);

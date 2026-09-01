import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // `functions/lib` est la sortie de `tsc`, commitée pour le déploiement : la
  // linter fait remonter les commentaires `eslint-disable` de règles qui ne sont
  // pas définies pour du JS, et échoue sur du code qu'on n'écrit pas.
  {
    ignores: [
      'dist',
      'functions/lib',
      'worker/**/node_modules',
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
       */
      'Max-Morrys_DS_Platform',
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

import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'dist/**', '**/dist/**', 'node_modules/**', '.claude/**',
      'android/**', 'ios/**', 'public/**', 'scripts/**', '**/*.min.js',
      /*
       * Build output that lives at the REPO ROOT rather than in dist/.
       * `Assets/` here is the stale snapshot main still tracks (CLAUDE.md:
       * "leave them alone") and the rest is written by vite-plugin-pwa during
       * dev. Linting minified bundles produced ALL 117 of `npm run lint`'s
       * errors, so the command reported failure no matter how clean src/ was —
       * which is the same as having no linter at all.
       */
      'Assets/**', '.vite/**', 'registerSW.js', 'workbox-*.js',
      // generated word lists — huge data files, not hand-edited
      'src/features/training/domains/language/games/wordle/link-words-*.js',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.es2021 },
    },
    plugins: { react, 'react-hooks': reactHooks },
    settings: { react: { version: 'detect' } },
    rules: {
      // JSX usage counts as "used" so imports/vars aren't false-flagged
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
  prettier,
];

import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import { importX } from 'eslint-plugin-import-x'
import globals from 'globals'
import tseslint from 'typescript-eslint'

import boundaries from 'eslint-plugin-boundaries'
import checkFile from 'eslint-plugin-check-file'
import codePolicy from 'eslint-plugin-code-policy'
import sonarjs from 'eslint-plugin-sonarjs'
import unicorn from 'eslint-plugin-unicorn'
import unusedImports from 'eslint-plugin-unused-imports'

export default tseslint.config(
  {
    ignores: [
      '.agent/**',
      '.claude/**',
      '.cursor/**',
      '.windsurf/**',
      '*.md',
      '*.mdc',
      '**/node_modules/**',
      '.venv-validate/**',
      'eslint.config.*',
      'prettier.config.*',
      'rules/**',
      'agents-skills/**',
      'agent-skills/**',
      'busirocket-rules/**',
      'dist/**',
      'coverage/**',
    ],
  },
  js.configs.recommended,

  // Type-aware linting, scoped to TypeScript. Unscoped, these rules also load
  // for `.cjs` and `.mjs` files that no tsconfig covers, and a typed rule with
  // no type information aborts the whole run instead of reporting.
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),
  ...tseslint.configs.stylisticTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),
  codePolicy.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
      parserOptions: {
        // knip.config.ts sits outside every tsconfig, so the project service
        // rejects it with "was not found by the project service" and the file
        // used to be dropped from `ignores` entirely - unlinted rather than
        // unparseable. allowDefaultProject lints it with the default compiler
        // options instead; entries must not contain `**` and are capped at
        // eight matched files, both satisfied by this single root glob. The
        // technique is @busirocket/eslint-config 0.6.0's, adopted on its own
        // rather than by composing the package (2026-08-31 decision).
        projectService: { allowDefaultProject: ['knip.config.ts'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'unicorn/filename-case': 'off',
      // Hard bans / high-signal correctness
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',

      // Promise correctness
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-floating-promises': 'error',

      // Maintainability
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // Enforce the ONE file = ONE responsibility requested rule partially where possible here
      // The rest is handled manually/via ts-morph, but these unused rules help.
    },
  },

  // General JS/TS rules + plugins
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'import-x': importX,
      'unused-imports': unusedImports,
      unicorn,
      sonarjs,
      boundaries,
    },
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver()],
      'boundaries/elements': [
        {
          type: 'conversation-bin',
          pattern: 'scripts/bin/run-conversations-*',
        },
        {
          type: 'conversation-command',
          pattern: 'scripts/commands/conversations*',
        },
        { type: 'conversation-lib', pattern: 'scripts/lib/conversations/*' },
        { type: 'scripts', pattern: 'scripts/*' },
        { type: 'lib', pattern: 'scripts/lib/*' },
      ],
    },
    rules: {
      /**
       * Import hygiene
       */
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/no-cycle': ['error', { maxDepth: 1 }],
      'import-x/no-self-import': 'error',

      /**
       * Unused imports/vars (hard fail)
       */
      'unused-imports/no-unused-imports': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      /**
       * Unicorn: modern correctness / guardrails
       */
      'unicorn/no-abusive-eslint-disable': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-optional-catch-binding': 'error',
      'unicorn/no-null': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/filename-case': 'off',

      /**
       * SonarJS: bug patterns with high signal
       */
      ...sonarjs.configs.recommended.rules,
      'sonarjs/no-os-command-from-path': 'off',

      /**
       * Architecture boundaries (folder-level dependency governance)
       */
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          policies: [
            {
              from: { element: { type: 'conversation-bin' } },
              allow: { to: [{ element: { type: 'conversation-command' } }] },
            },
            {
              from: { element: { type: 'conversation-command' } },
              allow: {
                to: [
                  { element: { type: 'conversation-lib' } },
                  { element: { type: 'lib' } },
                ],
              },
            },
            {
              from: { element: { type: 'conversation-lib' } },
              allow: { to: [{ element: { type: 'conversation-lib' } }] },
            },
            {
              from: { element: { type: 'scripts' } },
              allow: {
                to: [
                  { element: { type: 'scripts' } },
                  { element: { type: 'lib' } },
                ],
              },
            },
            {
              from: { element: { type: 'lib' } },
              allow: {
                to: [
                  { element: { type: 'lib' } },
                  { element: { type: 'scripts' } },
                ],
              },
            },
          ],
        },
      ],
    },
  },

  // Filename and folder naming conventions (check-file)
  {
    files: ['scripts/**/*.ts'],
    plugins: {
      'check-file': checkFile,
    },
    rules: {
      // bin/ entrypoints: kebab-case (run-compile-rules.ts)
      'check-file/filename-naming-convention': [
        'error',
        {
          'scripts/bin/*.ts': 'KEBAB_CASE',
          // All other scripts: camelCase | PascalCase | SCREAMING_SNAKE_CASE
          'scripts/!(bin)/**/*.ts': '+([A-Z_a-z])*([A-Za-z0-9_])',
        },
      ],
      // All folders must be kebab-case
      'check-file/folder-naming-convention': [
        'error',
        {
          'scripts/**/': 'KEBAB_CASE',
        },
      ],
    },
  },

  // The default compiler options behind allowDefaultProject do not carry the
  // real tsconfig's module resolution, so imports here resolve to `error`
  // types and every typed rule misfires on them - the `as KnipConfiguration`
  // that keeps knip's types honest reads as an unnecessary assertion.
  // disableTypeChecked drops only the rules that need type information; the
  // syntactic ones still apply.
  {
    files: ['knip.config.ts'],
    ...tseslint.configs.disableTypeChecked,
  },

  // dependency-cruiser loads CommonJS config only, so this file is CJS in an
  // otherwise ESM project and outside every tsconfig. Declaring its globals is
  // what lets it be linted at all instead of ignored.
  {
    files: ['.dependency-cruiser.cjs'],
    languageOptions: {
      globals: {
        __filename: 'readonly',
        __dirname: 'readonly',
        module: 'writable',
        require: 'readonly',
      },
    },
  },

  prettier,
)

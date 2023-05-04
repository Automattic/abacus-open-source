// Most of this file is based on
// https://dev.to/robertcoopercode/using-eslint-and-prettier-in-a-typescript-project-53jb.

// This allows us to show eslint rules as warnings in development, giving better a better dev experience.
// This will only apply when we are running a development build and won't apply when we run our formatters or linters on their own or as part of CI
const productionOnlyError = process.env.NODE_ENV === 'development' ? 'warn' : 'error'

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  // The following based on
  // https://github.com/typescript-eslint/typescript-eslint/blob/master/docs/getting-started/linting/TYPED_LINTING.md.
  //
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  extends: [
    'react-app',

    'eslint:recommended',

    'plugin:@typescript-eslint/eslint-recommended',

    'plugin:@typescript-eslint/recommended',

    // Note: `recommended-requiring-type-checking` have type-aware rules. This comes
    // with a performance penalty. For small projects, this is usually negligible.
    // It is recommended to separate the linting into two stagings once the type-aware
    // checking becomes a productivity issue. See second half of the "Recommended
    // Configs" section at
    // https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin#recommended-configs.
    'plugin:@typescript-eslint/recommended-requiring-type-checking',

    // Disables react-specific linting rules that conflict with prettier.
    'prettier/react',

    // Uses `eslint-config-prettier` to disable ESLint rules from
    // `@typescript-eslint/eslint-plugin` that would conflict with prettier.
    'prettier/@typescript-eslint',

    // Enables `eslint-plugin-prettier` and displays prettier errors as ESLint errors.
    // Make sure this is always the last configuration in the extends array.
    // The advantage of having prettier setup as an ESLint rule using
    // `eslint-plugin-prettier` is that code can automatically be fixed using ESLint's
    // `--fix` option.
    'plugin:prettier/recommended',

    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',

    'plugin:jsx-a11y/recommended',

    'plugin:promise/recommended',

    'plugin:react/recommended',

    'plugin:react-hooks/recommended',
  ],
  plugins: ['@typescript-eslint', 'jsx-a11y', 'promise', 'react-hooks', 'simple-import-sort'],
  rules: {
    // Off because favoring @typescript-eslint/naming-convention instead.
    camelcase: 'off',

    'comma-dangle': [
      productionOnlyError,
      {
        arrays: 'always-multiline',
        exports: 'always-multiline',
        functions: 'ignore',
        imports: 'always-multiline',
        objects: 'always-multiline',
      },
    ],
    'no-multiple-empty-lines': [productionOnlyError, { max: 2, maxBOF: 1, maxEOF: 1 }],

    'import/no-anonymous-default-export': 'off',

    // Disabling the base rule as it can report incorrect errors and is recommended by
    // @typescript-eslint/no-unused-vars.
    'no-unused-vars': 'off',

    'padded-blocks': 'off',

    'promise/catch-or-return': [productionOnlyError, { allowFinally: true }],

    // Off because we are using `simple-import-sort` instead.
    'sort-imports': 'off',

    // Off because we are using `simple-import-sort` instead.
    'import/order': 'off',

    // Allows to use an `a` element without an `href` attribute inside a `Link`
    // component which in our case is a Next.js Link component.
    // See https://github.com/evcohen/eslint-plugin-jsx-a11y/issues/402#issuecomment-368305051.
    'jsx-a11y/anchor-is-valid': [
      productionOnlyError,
      {
        aspects: ['invalidHref', 'preferButton'],
        components: ['Link'],
        specialLink: ['hrefLeft', 'hrefRight'],
      },
    ],

    'prettier/prettier': productionOnlyError,
    '@typescript-eslint/ban-types': productionOnlyError,
    '@typescript-eslint/restrict-template-expressions': productionOnlyError,
    '@typescript-eslint/no-unsafe-assignment': productionOnlyError,
    '@typescript-eslint/no-unsafe-assignment': productionOnlyError,
    '@typescript-eslint/no-unsafe-member-access': productionOnlyError,

    'react/display-name': 'off',
    'react/jsx-child-element-spacing': productionOnlyError,
    'react/jsx-closing-bracket-location': productionOnlyError,
    'react/jsx-closing-tag-location': productionOnlyError,
    'react/jsx-curly-newline': productionOnlyError,
    'react/jsx-curly-spacing': [productionOnlyError, { when: 'never', children: true }],
    'react/jsx-equals-spacing': productionOnlyError,
    'react/jsx-indent': [productionOnlyError, 2],
    'react/jsx-indent-props': [productionOnlyError, 2],
    'react/jsx-tag-spacing': productionOnlyError,
    'react/no-unsafe': [productionOnlyError, { checkAliases: true }],

    // Off because we are using TypeScript which expects us to declare the props.
    'react/prop-types': 'off',

    'react-hooks/exhaustive-deps': [
      productionOnlyError,
      {
        additionalHooks: 'useDataSource',
      },
    ],

    'simple-import-sort/sort': [
      productionOnlyError,
      {
        // We are extending the default groups here to support /src
        groups: [
          // Side effect imports.
          ['^\\u0000'],
          // Packages.
          // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
          ['^@?\\w'],
          // Absolute imports and other imports such as Vue-style `@/foo`.
          // Anything that does not start with a dot.
          ['^[^.]'],
          // src/ imports
          ['^src/'],
          // Relative imports.
          // Anything that starts with a dot.
          ['^\\.'],
        ],
      },
    ],

    // Off because it is deprecated and favoring @typescript-eslint/naming-convention
    // instead.
    '@typescript-eslint/camelcase': 'off',

    '@typescript-eslint/explicit-function-return-type': 'off',

    // The Experiment API uses snake_case, so we decided to disable enforcing
    // camelcase.
    '@typescript-eslint/naming-convention': [
      productionOnlyError,
      {
        selector: 'default',
        format: ['strictCamelCase'],
        leadingUnderscore: 'allow',
        trailingUnderscore: 'allow',
      },
      {
        selector: 'enumMember',
        format: ['StrictPascalCase'],
      },
      {
        selector: 'function',
        format: ['strictCamelCase', 'StrictPascalCase'],
      },
      {
        selector: 'parameter',
        format: ['strictCamelCase'],
        leadingUnderscore: 'allow', // For indicating unused parameter to TypeScript.
      },
      {
        selector: 'property',
        format: ['snake_case', 'strictCamelCase', 'StrictPascalCase', 'UPPER_CASE'],
        trailingUnderscore: 'allow', // For non-canonical extensions to objects, eg. for adding metadata to objects
      },
      // We need to allow any format for quoted object properties for CSS-in-JS:
      {
        selector: 'property',
        modifiers: ['requiresQuotes'],
        format: null,
      },
      {
        selector: 'variable',
        format: ['strictCamelCase', 'StrictPascalCase', 'UPPER_CASE'],
        leadingUnderscore: 'allow', // For indicating unused parameter to TypeScript (For array destructuring).
      },
      {
        selector: 'memberLike',
        modifiers: ['private'],
        format: ['strictCamelCase'],
        leadingUnderscore: 'require',
      },
      {
        selector: 'typeLike',
        format: ['StrictPascalCase'],
      },
    ],

    '@typescript-eslint/no-misused-promises': [
      'error',
      {
        checksVoidReturn: false,
      },
    ],

    '@typescript-eslint/no-unused-vars': [productionOnlyError, { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [['src', './src']],
        extensions: ['.ts', '.json', '.tsx'],
      },
    },
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['*.test.ts', '*.test.tsx'],
      rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/require-await': 'off',
      },
    },
  ],
}

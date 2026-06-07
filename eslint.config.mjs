import prettierConfig from 'eslint-config-prettier'
import prettier from 'eslint-plugin-prettier'
import recommended from 'genshin-ts/configs/eslint/recommended.mjs'

export default [
  {
    ignores: ['dist/**', 'out/**', 'node_modules/**']
  },
  ...recommended.map((config) => ({
    ...config,
    plugins: {
      ...config.plugins,
      prettier
    },
    rules: {
      ...config.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error'
    }
  })),
  {
    files: ['**/*.js', '**/*.mjs'],
    plugins: {
      prettier
    },
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': 'error'
    }
  }
]

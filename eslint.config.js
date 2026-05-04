const expoConfig = require('eslint-config-expo/flat');
const perfectionist = require('eslint-plugin-perfectionist');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
// https://docs.expo.dev/guides/using-eslint/
const { defineConfig, globalIgnores } = require('eslint/config');
const globals = require('globals');

module.exports = defineConfig([
  globalIgnores(['dist/*']),
  expoConfig,
  perfectionist.configs['recommended-natural'],
  eslintPluginPrettierRecommended,
  {
    files: ['babel.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
]);

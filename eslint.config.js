const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([...expoConfig, { ignores: ['dist/**', 'coverage/**', 'legal-site/**', 'assets/**'] }]);

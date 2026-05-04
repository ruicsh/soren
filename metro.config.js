const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude dev-only packages and test files from the mobile bundle.
// `vite` uses `import.meta` which Hermes doesn't support.
// `vitest` and `.test.*` files are test-only and must never be bundled.
config.resolver.blockList = [
  /node_modules\/vite\/.*/,
  /node_modules\/vitest\/.*/,
  /\.test\.(ts|tsx|js|jsx)$/,
];

module.exports = config;

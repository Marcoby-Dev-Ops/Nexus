const { createTransformer } = require('babel-jest');

module.exports = createTransformer({
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  plugins: [
    // This plugin is the key to transforming import.meta.env
    'babel-plugin-transform-vite-meta-env',
  ],
}); 
// metro.config.js
// Ensure EXPO_PUBLIC_* env vars are inlined as process.env.* (not import.meta.env.*)
// This prevents the "Cannot use import.meta outside a module" crash on web
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;

// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow zustand to be transformed by Babel (it uses import.meta.env.MODE)
// Metro ignores node_modules by default but zustand needs transformation for web
if (config.transformIgnorePatterns) {
  config.transformIgnorePatterns = config.transformIgnorePatterns.map(pattern => {
    // Add zustand to the list of packages that should NOT be ignored
    if (typeof pattern === 'string' && pattern.includes('node_modules')) {
      return pattern.replace(
        'node_modules/(?!(',
        'node_modules/(?!(zustand|'
      );
    }
    return pattern;
  });
}

module.exports = config;

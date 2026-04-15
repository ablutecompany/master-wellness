// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Override resolution for problematic ESM packages that ship 'import.meta'
// Since Node/Metro ignores resolverMainFields for exports Maps, we precisely 
// alias specific entrypoints to their Web-Safe CommonJS alternatives.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    const webAliases = {
      'zustand': 'node_modules/zustand/index.js',
      'zustand/middleware': 'node_modules/zustand/middleware.js',
      '@supabase/supabase-js': 'node_modules/@supabase/supabase-js/dist/index.cjs',
      '@supabase/postgrest-js': 'node_modules/@supabase/postgrest-js/dist/index.cjs',
      '@supabase/storage-js': 'node_modules/@supabase/storage-js/dist/index.cjs',
      'use-latest-callback': 'node_modules/use-latest-callback/lib/src/index.js',
      'iceberg-js': 'node_modules/iceberg-js/dist/index.cjs'
    };

    if (webAliases[moduleName]) {
      return {
        type: 'sourceFile',
        filePath: require('path').resolve(__dirname, webAliases[moduleName])
      };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

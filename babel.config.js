module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Avoid babel-plugin-transform-import-meta to prevent stack overflow
    ],
  };
};

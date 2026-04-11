#!/usr/bin/env node
/**
 * patch-html.js
 * Post-build script: adds type="module" to the Expo-generated script tag
 * in dist/index.html to fix the "Cannot use import.meta outside a module"
 * SyntaxError that prevents the web app from loading.
 */
const fs = require('fs');
const path = require('path');

// Use process.cwd() so this works regardless of where node is invoked from
const htmlPath = path.resolve(process.cwd(), 'dist', 'index.html');

console.log('[patch-html] Looking for:', htmlPath);

if (!fs.existsSync(htmlPath)) {
  console.error('[patch-html] dist/index.html not found. Run expo export first.');
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf8');

// Replace: <script src="/_expo/static/js/web/index-*.js" defer>
// With:    <script type="module" src="/_expo/static/js/web/index-*.js">
const before = html;
html = html.replace(
  /(<script)\s+src="(\/_expo\/static\/js\/web\/[^"]+\.js)"\s+defer>/g,
  '$1 type="module" src="$2">'
);

if (html === before) {
  console.warn('[patch-html] WARNING: No script tag matched. Pattern may have changed.');
  console.log('[patch-html] Looking for script tag in HTML:');
  const scriptMatch = html.match(/<script[^>]*>/);
  console.log('[patch-html] Found:', scriptMatch ? scriptMatch[0] : 'none');
} else {
  console.log('[patch-html] SUCCESS: type="module" added to script tag in dist/index.html');
}

fs.writeFileSync(htmlPath, html, 'utf8');

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist', 'index.html');
const templatePath = path.join(__dirname, '..', 'web', 'index.html');

const distHtml = fs.readFileSync(distPath, 'utf8');
const templateHtml = fs.readFileSync(templatePath, 'utf8');

const scriptMatch = distHtml.match(/<script[^>]+src="([^"]+_expo\/static\/[^"]+)"[^>]*><\/script>/g);
const iconMatch = distHtml.match(/<link rel="icon"[^>]+>/g);

if (!scriptMatch) {
  console.warn('No script tags found in dist/index.html, skipping patch');
  process.exit(0);
}

let patched = templateHtml;

if (scriptMatch) {
  patched = patched.replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, '');
  patched = patched.replace('</body>', `  ${scriptMatch.join('\n  ')}\n</body>`);
}

if (iconMatch) {
  const existingIcon = patched.match(/<link rel="icon"[^>]+>/);
  if (!existingIcon) {
    patched = patched.replace('</head>', `  ${iconMatch.join('\n  ')}\n</head>`);
  }
}

fs.writeFileSync(distPath, patched, 'utf8');
console.log('dist/index.html patched with safe-area CSS and viewport settings');
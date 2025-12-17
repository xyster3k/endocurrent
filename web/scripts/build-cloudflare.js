#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Building for Cloudflare Pages...\n');

// Generate minimal wrangler.toml for build compatibility
// This is NOT committed to git and only used during build
const wranglerConfig = `# Auto-generated during build - DO NOT COMMIT
# All environment variables MUST be set in Cloudflare Pages UI
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat", "nodejs_als"]
`;
fs.writeFileSync(path.join(__dirname, '..', 'wrangler.toml'), wranglerConfig);
console.log('Generated wrangler.toml for build compatibility\n');

// Run OpenNext build (answer 'n' to wrangler.toml prompt since we created it)
console.log('Running OpenNext build...');
execSync('npx opennextjs-cloudflare build', {
  input: 'n\n',
  stdio: ['pipe', 'inherit', 'inherit']
});

// Create output directory for Cloudflare Pages
const distDir = path.join(__dirname, '..', '.cloudflare', 'dist');
fs.mkdirSync(distDir, { recursive: true });

console.log('\nPreparing Cloudflare Pages output...');

// Copy worker.js as _worker.js
const workerSrc = path.join(__dirname, '..', '.open-next', 'worker.js');
const workerDest = path.join(distDir, '_worker.js');
fs.copyFileSync(workerSrc, workerDest);
// Inject compatibility metadata so node built-ins work without dashboard flags.
const compatConfig = 'export const config = { compatibility_date: "2024-09-23", compatibility_flags: ["nodejs_compat", "nodejs_als"] };\n';
const workerCode = fs.readFileSync(workerDest, 'utf8');
if (!workerCode.includes('compatibility_date')) {
  fs.writeFileSync(workerDest, compatConfig + workerCode, 'utf8');
  console.log('Injected compatibility_date + flags into _worker.js');
}


console.log('✓ Copied worker.js to _worker.js');

// Copy all worker dependencies
const openNextDir = path.join(__dirname, '..', '.open-next');
const dependenciesToCopy = [
  'cloudflare',
  'middleware',
  '.build',
  'server-functions'
];

dependenciesToCopy.forEach(dep => {
  const srcPath = path.join(openNextDir, dep);
  const destPath = path.join(distDir, dep);
  if (fs.existsSync(srcPath)) {
    copyRecursiveSync(srcPath, destPath);
    console.log(`✓ Copied ${dep}/`);
  }
});

// Copy static assets to root
const assetsSrc = path.join(openNextDir, 'assets');
if (fs.existsSync(assetsSrc)) {
  copyRecursiveSync(assetsSrc, distDir);
  console.log('✓ Copied static assets');
}

console.log('\n✓ Cloudflare Pages build complete!');
console.log(`Output directory: ${distDir}`);

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

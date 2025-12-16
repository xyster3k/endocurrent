#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Building for Cloudflare Pages...\n');

// Run OpenNext build
console.log('Running OpenNext build...');
execSync('npx opennextjs-cloudflare build --skipWranglerConfigCheck', { stdio: 'inherit' });

// Create output directory for Cloudflare Pages
const distDir = path.join(__dirname, '..', '.cloudflare', 'dist');
fs.mkdirSync(distDir, { recursive: true });

// Copy worker.js as _worker.js
console.log('\nPreparing Cloudflare Pages output...');
const workerSrc = path.join(__dirname, '..', '.open-next', 'worker.js');
const workerDest = path.join(distDir, '_worker.js');
fs.copyFileSync(workerSrc, workerDest);
console.log('✓ Copied worker.js to _worker.js');

// Copy static assets
const assetsSrc = path.join(__dirname, '..', '.open-next', 'assets');
const assetsDest = distDir;

if (fs.existsSync(assetsSrc)) {
  copyRecursiveSync(assetsSrc, assetsDest);
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

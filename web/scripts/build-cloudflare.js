#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Building for Cloudflare Pages...\n');

// Create wrangler.toml with proper Pages configuration
// This tells wrangler to use Node.js compatibility during deployment
// ALL environment variable names must be declared here
// Values will be set as Secrets in Cloudflare Pages UI
const rootWrangler = `name = "endocurrent"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat", "nodejs_als"]
pages_build_output_dir = ".cloudflare/dist"

# Environment variables - values MUST be set as Secrets in Cloudflare Pages UI
# Go to: Workers & Pages > endocurrent > Settings > Variables and Secrets > Add variable
[vars]
# Note: These are declared here but actual values come from Secrets in the UI
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = ""  # Set as Secret in UI
# CLERK_SECRET_KEY = ""  # Set as Secret in UI
# NEXT_PUBLIC_SUPABASE_URL = ""  # Set as Secret in UI
# NEXT_PUBLIC_SUPABASE_ANON_KEY = ""  # Set as Secret in UI
# SUPABASE_SERVICE_ROLE_KEY = ""  # Set as Secret in UI
# NEXT_PUBLIC_ADSENSE_CLIENT = ""  # Set as Secret in UI
# NEXT_PUBLIC_SITE_URL = ""  # Set as Secret in UI
`;
fs.writeFileSync(path.join(__dirname, '..', 'wrangler.toml'), rootWrangler);
console.log('Created wrangler.toml with compatibility settings\n');

// Run OpenNext build (answer 'n' to wrangler.toml prompt since we already created it)
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

// Create a _routes.json to ensure worker handles all routes
const routes = {
  version: 1,
  include: ["/*"],
  exclude: []
};
fs.writeFileSync(path.join(distDir, '_routes.json'), JSON.stringify(routes, null, 2));
console.log('✓ Created _routes.json');

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

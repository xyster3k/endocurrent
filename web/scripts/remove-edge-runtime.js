const fs = require('fs');
const path = require('path');

const files = [
  'src/app/sign-in/[[...index]]/page.tsx',
  'src/app/sign-up/[[...index]]/page.tsx',
  'src/app/health/route.ts',
  'src/app/api/admin/posts/route.ts',
  'src/app/api/admin/profile/route.ts',
  'src/app/api/health/route.ts',
  'src/app/api/admin/menus/[id]/route.ts',
  'src/app/api/admin/posts/[id]/route.ts',
  'src/app/admin/posts/[id]/page.tsx',
  'src/app/admin/posts/new/page.tsx',
  'src/app/admin/posts/page.tsx',
  'src/app/admin/profile/page.tsx',
];

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipped (not found): ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Remove the edge runtime declaration
  content = content.replace(/^export const runtime = "edge";\n/gm, '');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Removed edge runtime from: ${file}`);
  } else {
    console.log(`ℹ️  No change needed: ${file}`);
  }
});

console.log('\n✨ Done!');

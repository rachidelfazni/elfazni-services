import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Replacements: [regex, replacement, description]
const REPLACEMENTS = [
  // Primary Blue
  [/#12559A/gi, '#004AA5'],
  [/#145a9a/gi, '#003B84'],
  // Brand Gold
  [/#8A6526/gi, '#CC9048'],
  [/#A67B30/gi, '#CC9048'],
  [/#D8AA64/gi, '#CC9048'],
  // Legacy Web theme color
  [/#064ea8/gi, '#004AA5'],
];

const TARGET_EXTENSIONS = ['.ts', '.tsx', '.css', '.json', '.html', '.webmanifest'];
const EXCLUDED_DIRS = ['node_modules', 'dist', '.git', 'coverage', '.system_generated', 'kit'];

let modifiedCount = 0;
let fileCount = 0;

function scanAndReplace(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.includes(entry.name)) {
        scanAndReplace(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      // Skip binary files and original logos (logos already use #004AA5 and #CC9048)
      if (TARGET_EXTENSIONS.includes(ext) && !fullPath.includes('/public/assets/logos/')) {
        fileCount++;
        let content = fs.readFileSync(fullPath, 'utf8');
        let originalContent = content;

        for (const [regex, replacement] of REPLACEMENTS) {
          content = content.replace(regex, replacement);
        }

        if (content !== originalContent) {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Updated: ${path.relative(rootDir, fullPath)}`);
          modifiedCount++;
        }
      }
    }
  }
}

console.log('🚀 Running ELFAZNI SERVICES Brand Color Migration...');
scanAndReplace(path.join(rootDir, 'src'));
scanAndReplace(path.join(rootDir, 'crm', 'src'));
scanAndReplace(path.join(rootDir, 'docs', 'brand'));

// Also check index.html, public/site.webmanifest, etc.
const extraFiles = [
  path.join(rootDir, 'index.html'),
  path.join(rootDir, 'crm', 'index.html'),
  path.join(rootDir, 'public', 'site.webmanifest'),
];

for (const file of extraFiles) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    for (const [regex, replacement] of REPLACEMENTS) {
      content = content.replace(regex, replacement);
    }
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated: ${path.relative(rootDir, file)}`);
      modifiedCount++;
    }
  }
}

console.log(`\n✅ Migration complete: modified ${modifiedCount} files out of ${fileCount} scanned.`);

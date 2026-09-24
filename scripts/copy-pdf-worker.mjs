import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const source = join(projectRoot, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const destDir = join(projectRoot, 'public');
const dest = join(destDir, 'pdf.worker.min.mjs');

if (!existsSync(source)) {
  console.warn(`[copy-pdf-worker] Source not found at ${source}. Skipping.`);
  process.exit(0);
}

if (!existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true });
}

copyFileSync(source, dest);
console.log('[copy-pdf-worker] Copied pdf.worker.min.mjs to public/');

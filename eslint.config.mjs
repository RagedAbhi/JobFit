import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  // Generated asset copied from pdfjs-dist by scripts/copy-pdf-worker.mjs,
  // not our source -- never lint it.
  { ignores: ['public/pdf.worker.min.mjs'] },
  ...nextCoreWebVitals,
  ...nextTypescript,
];

export default eslintConfig;

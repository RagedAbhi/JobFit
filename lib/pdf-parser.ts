// Client-only. Do not import this from a Server Component or route handler.
//
// pdfjs-dist is loaded via a dynamic import() inside parsePdfToText rather
// than a static top-level import. Next.js server-renders 'use client'
// components once on the server for the initial HTML too, so a static
// `import * as pdfjsLib from 'pdfjs-dist'` at module scope would still
// execute pdfjs-dist's module body during that server pass (it logs
// "Please use the `legacy` build in Node.js environments." there, since it
// detects it isn't in a browser). Deferring the import to inside this
// function means the module only ever loads when a user actually triggers
// a parse, which only happens client-side.
let workerConfigured = false;

export interface ParsedPdf {
  text: string;
  pageCount: number;
  charCount: number;
  fileName: string;
}

export class PdfParseError extends Error {}

export async function parsePdfToText(file: File): Promise<ParsedPdf> {
  const pdfjsLib = await import('pdfjs-dist');

  if (!workerConfigured) {
    // Served as a static asset from /public -- copied from node_modules via
    // scripts/copy-pdf-worker.mjs (npm postinstall).
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    workerConfigured = true;
  }

  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch {
    throw new PdfParseError('Could not read the selected file.');
  }

  let pdfDoc;
  try {
    pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  } catch {
    throw new PdfParseError(
      'Could not open this PDF. It may be corrupted, image-only, or password-protected.'
    );
  }

  const pageTexts: string[] = [];
  try {
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ');
      pageTexts.push(pageText);
    }
  } catch {
    throw new PdfParseError('Failed while extracting text from the PDF.');
  } finally {
    await pdfDoc.cleanup();
  }

  const text = pageTexts
    .join('\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (text.length < 50) {
    throw new PdfParseError(
      'Extracted very little text — this PDF may be a scanned image without selectable text.'
    );
  }

  return { text, pageCount: pdfDoc.numPages, charCount: text.length, fileName: file.name };
}

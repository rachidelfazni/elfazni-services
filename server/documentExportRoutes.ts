import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'node:crypto';
import puppeteer from 'puppeteer-core';
import * as docx from 'docx';
import { sanitizeSvgContent } from './themeRoutes';

export const documentExportRouter = Router();

// Ensure stamps upload directory exists
const stampsUploadDir = path.resolve(process.cwd(), 'public', 'uploads', 'stamps');
if (!fs.existsSync(stampsUploadDir)) {
  fs.mkdirSync(stampsUploadDir, { recursive: true });
}

// Multer for Stamp Uploads (PNG, WebP, SVG)
const stampStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, stampsUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_');
    cb(null, `stamp-${base}-${Date.now()}-${randomUUID().slice(0, 6)}${ext}`);
  },
});

const stampUpload = multer({
  storage: stampStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/png', 'image/webp', 'image/svg+xml'];
    const allowedExts = ['.png', '.webp', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('صيغة الملف غير مدعومة. يرجى رفع ملفات PNG أو WebP أو SVG شفافة فقط.'));
    }
  },
});

// Stamp DB Helper
const STAMPS_FILE = path.resolve(process.cwd(), 'data', 'stamps.json');

export interface StampAsset {
  id: string;
  name: string;
  url: string;
  svgUrl?: string;
  width?: number;
  height?: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy?: string;
}

function readStamps(): StampAsset[] {
  try {
    if (!fs.existsSync(STAMPS_FILE)) return [];
    return JSON.parse(fs.readFileSync(STAMPS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeStamps(stamps: StampAsset[]): void {
  fs.writeFileSync(STAMPS_FILE, JSON.stringify(stamps, null, 2), 'utf8');
}

// =========================================================================
// 1. STAMPS API
// =========================================================================

// GET /api/documents/stamps
documentExportRouter.get('/stamps', (_req: Request, res: Response) => {
  const stamps = readStamps();
  res.json({ success: true, stamps });
});

// POST /api/documents/stamps (Upload new stamp)
documentExportRouter.post('/stamps', (req: Request, res: Response) => {
  stampUpload.single('file')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message || 'فشل رفع الختم.' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'لم يتم استلام ملف الختم.' });
    }

    const ext = path.extname(req.file.filename).toLowerCase();
    const filePath = req.file.path;

    // Sanitize SVG if uploaded
    if (ext === '.svg' || req.file.mimetype === 'image/svg+xml') {
      try {
        const rawContent = fs.readFileSync(filePath, 'utf8');
        const sanitized = sanitizeSvgContent(rawContent);
        fs.writeFileSync(filePath, sanitized, 'utf8');
      } catch (e: any) {
        return res.status(400).json({ success: false, error: 'فشل تطهير ملف SVG المرفوع.' });
      }
    }

    const relativeUrl = `/uploads/stamps/${req.file.filename}`;
    const name = (req.body?.name || path.basename(req.file.originalname, ext)).trim();

    const newStamp: StampAsset = {
      id: `stamp_${Date.now()}_${randomUUID().slice(0, 6)}`,
      name: name || 'ختم شركة مخصص',
      url: relativeUrl,
      fileType: req.file.mimetype || (ext === '.svg' ? 'image/svg+xml' : 'image/png'),
      uploadedAt: new Date().toISOString(),
      uploadedBy: (req as any).user?.displayName || 'المسؤول',
    };

    const stamps = readStamps();
    stamps.push(newStamp);
    writeStamps(stamps);

    res.status(201).json({ success: true, stamp: newStamp });
  });
});

// PATCH /api/documents/stamps/:id (Rename stamp)
documentExportRouter.patch('/stamps/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ success: false, error: 'يرجى تقديم اسم صالح للختم.' });
  }

  const stamps = readStamps();
  const stamp = stamps.find((s) => s.id === id);
  if (!stamp) {
    return res.status(404).json({ success: false, error: 'الختم غير موجود.' });
  }

  stamp.name = name.trim();
  writeStamps(stamps);
  res.json({ success: true, stamp });
});

// DELETE /api/documents/stamps/:id
documentExportRouter.delete('/stamps/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const stamps = readStamps();
  const index = stamps.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'الختم غير موجود.' });
  }

  // Prevent deleting the default official stamps
  if (['stamp_official_blue', 'stamp_certified_gold', 'stamp_confidential_red'].includes(id)) {
    return res.status(400).json({ success: false, error: 'لا يمكن حذف الأختام الرسمية المعتمدة للمؤسسة.' });
  }

  const [removed] = stamps.splice(index, 1);
  writeStamps(stamps);

  // Try removing file from disk if under uploads
  try {
    if (removed.url.startsWith('/uploads/stamps/')) {
      const fullPath = path.resolve(process.cwd(), 'public', removed.url.replace(/^\//, ''));
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }
  } catch {}

  res.json({ success: true, removedId: id });
});

// =========================================================================
// 2. REAL PDF EXPORT (Via Headless Chrome printToPDF)
// =========================================================================

export interface ExportPdfPayload {
  title: string;
  html: string;
  pageSetup?: {
    paperSize?: 'A4' | 'A5' | 'Letter' | 'Legal' | 'Custom';
    customWidthMm?: number;
    customHeightMm?: number;
    orientation?: 'portrait' | 'landscape';
    margins?: {
      topMm?: number;
      bottomMm?: number;
      leftMm?: number;
      rightMm?: number;
    };
    header?: {
      enabled?: boolean;
      text?: string;
      showTitle?: boolean;
      showDate?: boolean;
    };
    footer?: {
      enabled?: boolean;
      text?: string;
      showPageNumbers?: boolean;
      showDate?: boolean;
    };
    printBackground?: boolean;
    pageBreaks?: boolean;
  };
  stampConfig?: {
    enabled?: boolean;
    stampUrl?: string;
    stampName?: string;
    targetPages?: 'all' | 'first' | 'last' | 'current' | 'custom';
    presetPosition?: string;
    xPercent?: number; // 0-100
    yPercent?: number; // 0-100
    scalePercent?: number; // 10-400
    rotationDeg?: number; // -180 to 180
    opacityPercent?: number; // 10-100
    layer?: 'foreground' | 'watermark';
  };
  isStamped?: boolean;
}

documentExportRouter.post('/export-pdf', async (req: Request, res: Response) => {
  const { title = 'وثيقة رسمية', html = '', pageSetup = {}, stampConfig = {}, isStamped = false }: ExportPdfPayload = req.body;

  const paperSize = pageSetup.paperSize || 'A4';
  const orientation = pageSetup.orientation || 'portrait';
  const isLandscape = orientation === 'landscape';

  const margins = {
    top: `${pageSetup.margins?.topMm ?? 15}mm`,
    bottom: `${pageSetup.margins?.bottomMm ?? 15}mm`,
    left: `${pageSetup.margins?.leftMm ?? 15}mm`,
    right: `${pageSetup.margins?.rightMm ?? 15}mm`,
  };

  const hasStamp = isStamped && stampConfig.enabled && stampConfig.stampUrl;
  const stampScale = (stampConfig.scalePercent ?? 100) / 100;
  const stampRot = stampConfig.rotationDeg ?? 0;
  const stampOpacity = (stampConfig.opacityPercent ?? 90) / 100;
  const stampLayer = stampConfig.layer || 'foreground';
  const stampX = stampConfig.xPercent ?? 75;
  const stampY = stampConfig.yPercent ?? 80;

  // Resolve absolute stamp URL for local chrome renderer
  let stampFullUrl = stampConfig.stampUrl || '';
  if (stampFullUrl.startsWith('/')) {
    stampFullUrl = `http://127.0.0.1:8080${stampFullUrl}`;
  }

  // Construct full HTML print document
  const printDocumentHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;600;700;800&family=Roboto:wght@400;500;700&family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: ${paperSize === 'Custom' ? `${pageSetup.customWidthMm || 210}mm ${pageSetup.customHeightMm || 297}mm` : paperSize} ${orientation};
      margin: ${margins.top} ${margins.right} ${margins.bottom} ${margins.left};
    }
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: 'Bahij TheSansArabic', Cairo, Tajawal, 'Noto Sans Arabic', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #0B2E57;
      background: #FFFFFF;
      position: relative;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #004AA5;
      margin-top: 1.2em;
      margin-bottom: 0.5em;
      font-weight: 800;
      page-break-after: avoid;
    }
    p {
      margin-top: 0;
      margin-bottom: 0.8em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.2em 0;
      font-size: 12px;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #D7E7F7;
      padding: 8px 10px;
      text-align: right;
    }
    th {
      background-color: #F0F7FF;
      color: #004AA5;
      font-weight: bold;
    }
    blockquote, .ws-callout {
      border-right: 4px solid #004AA5;
      background-color: #F8FAFC;
      padding: 10px 14px;
      margin: 1.2em 0;
      border-radius: 4px;
    }
    pre, code, .ws-code-wrapper {
      font-family: 'JetBrains Mono', Courier, monospace;
      font-size: 11px;
      background-color: #0F172A;
      color: #F8FAFC;
      padding: 12px;
      border-radius: 6px;
      direction: ltr;
      text-align: left;
      overflow-x: hidden;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .page-break {
      page-break-before: always;
    }
    /* Fixed Interactive Stamp Element */
    .document-stamp-overlay {
      position: fixed;
      left: ${stampX}%;
      top: ${stampY}%;
      transform: translate(-50%, -50%) rotate(${stampRot}deg) scale(${stampScale});
      transform-origin: center center;
      opacity: ${stampOpacity};
      z-index: ${stampLayer === 'watermark' ? 0 : 999};
      pointer-events: none;
      user-select: none;
      max-width: 220px;
      max-height: 220px;
    }
    .document-stamp-overlay img {
      width: 180px;
      height: auto;
      display: block;
    }
    /* Header and Footer */
    .print-header {
      border-bottom: 1px solid #D7E7F7;
      padding-bottom: 6px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #64748B;
    }
    .print-footer {
      border-top: 1px solid #D7E7F7;
      padding-top: 6px;
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #64748B;
    }
  </style>
</head>
<body>
  ${
    pageSetup.header?.enabled
      ? `
    <header class="print-header">
      <span>${pageSetup.header.showTitle ? title : pageSetup.header.text || ''}</span>
      <span>${pageSetup.header.showDate ? new Date().toLocaleDateString('ar-MA') : ''}</span>
    </header>
  `
      : ''
  }

  <main class="document-content">
    ${html}
  </main>

  ${
    hasStamp
      ? `
    <div class="document-stamp-overlay" data-testid="document-stamp">
      <img src="${stampFullUrl}" alt="${stampConfig.stampName || 'خاتم رسمي'}" />
    </div>
  `
      : ''
  }

  ${
    pageSetup.footer?.enabled
      ? `
    <footer class="print-footer">
      <span>${pageSetup.footer.text || 'الفزني للخدمات — وثيقة رسمية معتمدة'}</span>
      <span>${pageSetup.footer.showDate ? new Date().toLocaleDateString('ar-MA') : ''}</span>
    </footer>
  `
      : ''
  }
</body>
</html>
  `;

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(printDocumentHtml, { waitUntil: 'networkidle0' });

    // Format setup
    let pdfFormat: any = paperSize;
    if (paperSize === 'Custom') {
      pdfFormat = undefined;
    }

    const pdfBuffer = await page.pdf({
      format: pdfFormat,
      width: paperSize === 'Custom' ? `${pageSetup.customWidthMm || 210}mm` : undefined,
      height: paperSize === 'Custom' ? `${pageSetup.customHeightMm || 297}mm` : undefined,
      landscape: isLandscape,
      printBackground: pageSetup.printBackground !== false,
      margin: {
        top: margins.top,
        bottom: margins.bottom,
        left: margins.left,
        right: margins.right,
      },
    });

    await browser.close();

    const safeFilename = encodeURIComponent(title.replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_'));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.pdf"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (err: any) {
    if (browser) await browser.close();
    console.error('PDF export generation failed:', err);
    res.status(500).json({ success: false, error: 'تعذر توليد ملف PDF: ' + err.message });
  }
});

// =========================================================================
// 3. MICROSOFT WORD (DOCX) EXPORT (Via docx OpenXML library)
// =========================================================================

documentExportRouter.post('/export-docx', async (req: Request, res: Response) => {
  try {
    const { title = 'وثيقة رسمية', html = '', pageSetup = {}, stampConfig = {}, isStamped = false }: ExportPdfPayload = req.body;

    const paperSize = pageSetup.paperSize || 'A4';
    const isLandscape = pageSetup.orientation === 'landscape';

    // Page Dimensions in DXA (1/20 of a point)
    // A4 = 11906 x 16838 DXA (210mm x 297mm)
    let widthDxa = 11906;
    let heightDxa = 16838;
    if (paperSize === 'Letter') {
      widthDxa = 12240;
      heightDxa = 15840;
    } else if (paperSize === 'Legal') {
      widthDxa = 12240;
      heightDxa = 20160;
    } else if (paperSize === 'A5') {
      widthDxa = 8390;
      heightDxa = 11906;
    }

    if (isLandscape) {
      const temp = widthDxa;
      widthDxa = heightDxa;
      heightDxa = temp;
    }

    // Margins in DXA (1mm ≈ 56.7 dxa)
    const topMarginDxa = Math.round((pageSetup.margins?.topMm ?? 15) * 56.7);
    const bottomMarginDxa = Math.round((pageSetup.margins?.bottomMm ?? 15) * 56.7);
    const leftMarginDxa = Math.round((pageSetup.margins?.leftMm ?? 15) * 56.7);
    const rightMarginDxa = Math.round((pageSetup.margins?.rightMm ?? 15) * 56.7);

    const docChildren: docx.Paragraph[] = [];

    // Document Title
    docChildren.push(
      new docx.Paragraph({
        text: title,
        heading: docx.HeadingLevel.HEADING_1,
        bidirectional: true,
        alignment: docx.AlignmentType.RIGHT,
        spacing: { after: 200 },
      })
    );

    // Basic HTML parser for paragraphs and headings
    // Strips HTML tags and preserves text runs with RTL
    const cleanHtml = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

    // Split by block tags (<p>, <h1>-<h6>, <div>, <li>)
    const blocks = cleanHtml.split(/<\/(?:p|h[1-6]|div|li|tr)>/i);

    for (const b of blocks) {
      const plain = b.replace(/<[^>]+>/g, '').trim();
      if (!plain) continue;

      const isH1 = /<h1\b/i.test(b);
      const isH2 = /<h2\b/i.test(b);
      const isH3 = /<h3\b/i.test(b);

      let headingLevel: any = undefined;
      if (isH1) headingLevel = docx.HeadingLevel.HEADING_1;
      else if (isH2) headingLevel = docx.HeadingLevel.HEADING_2;
      else if (isH3) headingLevel = docx.HeadingLevel.HEADING_3;

      docChildren.push(
        new docx.Paragraph({
          text: plain,
          heading: headingLevel,
          bidirectional: true,
          alignment: docx.AlignmentType.RIGHT,
          spacing: { after: 120, line: 280 },
        })
      );
    }

    // Embed stamp image if requested
    if (isStamped && stampConfig.enabled && stampConfig.stampUrl) {
      try {
        let localStampPath = '';
        if (stampConfig.stampUrl.startsWith('/')) {
          localStampPath = path.resolve(process.cwd(), 'public', stampConfig.stampUrl.replace(/^\//, ''));
        }
        if (localStampPath && fs.existsSync(localStampPath)) {
          const imageBuffer = fs.readFileSync(localStampPath);
          const scale = ((stampConfig.scalePercent ?? 100) / 100) * 120;
          docChildren.push(
            new docx.Paragraph({
              alignment: docx.AlignmentType.RIGHT,
              bidirectional: true,
              spacing: { before: 240, after: 120 },
              children: [
                new docx.ImageRun({
                  data: imageBuffer,
                  transformation: {
                    width: scale,
                    height: scale,
                  },
                }),
              ],
            })
          );
        }
      } catch (e) {
        console.warn('Could not embed stamp in DOCX:', e);
      }
    }

    const doc = new docx.Document({
      sections: [
        {
          properties: {
            page: {
              size: {
                width: widthDxa,
                height: heightDxa,
                orientation: isLandscape ? docx.PageOrientation.LANDSCAPE : docx.PageOrientation.PORTRAIT,
              },
              margin: {
                top: topMarginDxa,
                bottom: bottomMarginDxa,
                left: leftMarginDxa,
                right: rightMarginDxa,
              },
            },
          },
          children: docChildren,
        },
      ],
    });

    const buffer = await docx.Packer.toBuffer(doc);
    const safeFilename = encodeURIComponent(title.replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_'));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.docx"`);
    res.send(buffer);
  } catch (err: any) {
    console.error('DOCX export generation failed:', err);
    res.status(500).json({ success: false, error: 'تعذر توليد ملف Word DOCX: ' + err.message });
  }
});

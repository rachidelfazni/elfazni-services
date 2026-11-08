import { DocumentSettings, Invoice, SUPPORTED_CURRENCIES } from '../types';
import { formatMinorMoney } from './invoiceCalculations';

/**
 * Pure TypeScript standard ZIP archive builder (Store method 0 with CRC32)
 * Generates a genuine .zip file containing individual printable A4 invoice files
 * without exposing other customers' unrelated records.
 */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

const crc32 = (bytes: Uint8Array): number => {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
};

export const createZipBlob = (files: { filename: string; content: string }[]): Blob => {
  const encoder = new TextEncoder();
  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let offset = 0;

  files.forEach((f) => {
    const nameBytes = encoder.encode(f.filename);
    const dataBytes = encoder.encode(f.content);
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    // Local file header (30 bytes + name + data)
    const localHeader = new Uint8Array(30 + nameBytes.length + size);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true); // Signature
    localView.setUint16(4, 20, true); // Version needed
    localView.setUint16(6, 0x0800, true); // UTF-8 flag
    localView.setUint16(8, 0, true); // Store (no compression)
    localView.setUint16(10, 0, true); // Mod time
    localView.setUint16(12, 0, true); // Mod date
    localView.setUint32(14, crc, true);
    localView.setUint32(18, size, true);
    localView.setUint32(22, size, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);
    localHeader.set(dataBytes, 30 + nameBytes.length);
    localHeaders.push(localHeader);

    // Central directory header (46 bytes + name)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, size, true);
    centralView.setUint32(24, size, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    centralHeaders.push(centralHeader);

    offset += localHeader.length;
  });

  const centralSize = centralHeaders.reduce((acc, b) => acc + b.length, 0);
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, files.length, true);
  eocdView.setUint16(10, files.length, true);
  eocdView.setUint32(12, centralSize, true);
  eocdView.setUint32(16, offset, true);
  eocdView.setUint16(20, 0, true);

  return new Blob([...localHeaders, ...centralHeaders, eocd] as unknown as BlobPart[], {
    type: 'application/zip',
  });
};

/**
 * Generates an A4 self-contained printable HTML document for an individual invoice
 * to be packaged inside the authorized bulk ZIP export.
 */
export const renderInvoiceStandaloneHtml = (
  inv: Invoice,
  settings: DocumentSettings
): string => {
  const totalPages = Math.max(1, Math.ceil((inv.lines?.length || 0) / 10));
  const linesHtml = inv.lines
    .map(
      (l, i) => `
      <tr class="print-row">
        <td style="padding:10px;border-bottom:1px solid #D7E7F7;text-align:center;">${i + 1}</td>
        <td style="padding:10px;border-bottom:1px solid #D7E7F7;font-weight:bold;">
          ${l.labelAr}
          ${l.labelEn ? `<div style="font-size:11px;color:#5E7086;" dir="ltr">${l.labelEn}</div>` : ''}
        </td>
        <td style="padding:10px;border-bottom:1px solid #D7E7F7;text-align:center;" dir="ltr">${l.serviceReference || '—'}</td>
        <td style="padding:10px;border-bottom:1px solid #D7E7F7;text-align:center;" dir="ltr">${l.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #D7E7F7;text-align:left;" dir="ltr">${formatMinorMoney(l.unitPriceMinor, inv.currency)}</td>
        <td style="padding:10px;border-bottom:1px solid #D7E7F7;text-align:left;font-weight:bold;" dir="ltr">${formatMinorMoney(l.totalMinor, inv.currency)}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>ELFAZNI_Invoice_${inv.invoiceNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 14mm 12mm;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-family: 'Bahij TheSansArabic', 'Poppins', sans-serif;
        font-size: 8.5pt;
        font-weight: 700;
        color: #0B2E57;
      }
      @bottom-left {
        content: "ELFAZNI SERVICES — الفزني سيرفيسز";
        font-family: 'Bahij TheSansArabic', 'Poppins', sans-serif;
        font-size: 8.5pt;
        color: #5E7086;
      }
    }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
    html, body { font-family: 'Bahij TheSansArabic', 'Cairo', sans-serif; color: #0B2E57; background: #fff; margin: 0; padding: 0; width: 100%; }
    .sheet { max-width: 210mm; margin: 0 auto; padding: 12px; }
    .master-table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
    .repeating-header { display: table-header-group; break-inside: avoid; page-break-inside: avoid; }
    .repeating-footer { display: table-footer-group; break-inside: avoid; page-break-inside: avoid; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0B2E57; padding-bottom: 14px; margin-bottom: 16px; }
    .box { background: #F8FAFC; border: 1px solid #D7E7F7; border-radius: 12px; padding: 14px; margin-bottom: 16px; break-inside: avoid; page-break-inside: avoid; }
    table.items-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; page-break-inside: auto; }
    table.items-table thead { display: table-header-group; }
    table.items-table tr, .print-row { break-inside: avoid !important; page-break-inside: avoid !important; }
    table.items-table th { background: #0B2E57; color: #fff; padding: 10px; text-align: right; }
    .totals { max-width: 320px; margin-right: auto; background: #EAF4FF; border: 1px solid #004AA5; border-radius: 12px; padding: 14px; break-inside: avoid; page-break-inside: avoid; }
    .row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
    .footer { margin-top: 20px; background: #0B2E57; color: #fff; border-radius: 10px; padding: 12px 16px; font-size: 11px; display: flex; justify-content: space-between; align-items: center; break-inside: avoid; page-break-inside: avoid; }
  </style>
</head>
<body>
  <div class="sheet">
    <table class="master-table">
      <thead class="repeating-header">
        <tr>
          <td>
            <div class="header">
              <div>
                <h1 style="margin:0;font-size:20px;">${settings.tradingNameAr} — ${settings.tradingNameEn}</h1>
                <p style="margin:4px 0 0;color:#5E7086;font-size:12px;">${settings.legalEntityName} • ${settings.headquartersAr}</p>
                <p style="margin:2px 0 0;color:#5E7086;font-size:12px;" dir="ltr">${settings.phone} • ${settings.email}</p>
              </div>
              <div style="text-align:left;">
                <div style="font-size:18px;font-weight:bold;">فاتورة / INVOICE</div>
                <div style="font-family:monospace;font-size:14px;font-weight:bold;" dir="ltr">#${inv.invoiceNumber}</div>
                <div style="font-size:12px;color:#5E7086;" dir="ltr">Issue Date: ${inv.issueDate}</div>
              </div>
            </div>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="box">
              <div style="font-size:11px;color:#004AA5;font-weight:bold;">بيانات العميل (Billed To):</div>
              <div style="font-size:16px;font-weight:bold;margin-top:4px;">${inv.customerName}</div>
              <div style="font-size:12px;color:#5E7086;margin-top:2px;">الهاتف: <span dir="ltr">${inv.customerPhone || '—'}</span> • العملة: ${inv.currency} (${SUPPORTED_CURRENCIES[inv.currency]?.label})</div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width:40px;text-align:center;">#</th>
                  <th>البيان / الخدمة</th>
                  <th style="width:110px;text-align:center;">المرجع</th>
                  <th style="width:60px;text-align:center;">الكمية</th>
                  <th style="width:110px;text-align:left;">سعر الوحدة</th>
                  <th style="width:120px;text-align:left;">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${linesHtml}
              </tbody>
            </table>

            <div class="totals">
              <div class="row"><span>المجموع الفرعي:</span><b dir="ltr">${formatMinorMoney(inv.subtotalMinor, inv.currency)}</b></div>
              <div class="row"><span>الخصم:</span><b dir="ltr">${formatMinorMoney(inv.discountTotalMinor, inv.currency)}</b></div>
              <div class="row"><span>الضريبة:</span><b dir="ltr">${formatMinorMoney(inv.taxTotalMinor, inv.currency)}</b></div>
              <div class="row" style="border-top:1px solid #0B2E57;padding-top:6px;font-weight:bold;"><span>الإجمالي الكلي:</span><b dir="ltr">${formatMinorMoney(inv.totalMinor, inv.currency)}</b></div>
              <div class="row" style="color:#059669;"><span>المدفوع:</span><b dir="ltr">${formatMinorMoney(inv.paidMinor, inv.currency)}</b></div>
              <div class="row" style="border-top:2px solid #0B2E57;padding-top:6px;font-weight:bold;color:${inv.balanceDueMinor > 0 ? '#DC2626' : '#059669'};"><span>المتبقي المستحق:</span><b dir="ltr">${formatMinorMoney(inv.balanceDueMinor, inv.currency)}</b></div>
            </div>

            <div class="box" style="margin-top:18px;">
              <div style="font-size:12px;font-weight:bold;">الحسابات البنكية الرسمية للتحويل (${settings.bankAccountHolder}):</div>
              <div style="font-family:monospace;font-size:12px;margin-top:4px;" dir="ltr">TRY IBAN: ${settings.ibanTRY}</div>
              <div style="font-family:monospace;font-size:12px;" dir="ltr">USD IBAN: ${settings.ibanUSD}</div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px;padding-top:14px;border-top:2px solid #D7E7F7;text-align:center;break-inside:avoid;page-break-inside:avoid;">
              <div style="flex:1;">
                <div style="font-size:12px;font-weight:bold;color:#0B2E57;">إعداد وتدقيق الحسابات</div>
                <div style="font-size:11px;color:#5E7086;margin-top:24px;border-top:1px solid #D7E7F7;padding-top:6px;">القسم المالي — الفزني سيرفيسز</div>
              </div>
              ${
                settings.showDigitalStamp !== false
                  ? `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                <img src="/admin/crm/assets/aistudio/ELFAZNI_STEMP_80d69497.svg" alt="ELFAZNI OFFICIAL STAMP" style="height:150px;width:auto;object-fit:contain;transform:rotate(-6deg);opacity:0.92;mix-blend-mode:multiply;" />
                <div style="font-size:10px;font-weight:bold;color:#104da1;margin-top:4px;">الختم الرقمي المعتمد • OFFICIAL DIGITAL STAMP</div>
              </div>`
                  : `<div style="flex:1;"></div>`
              }
              <div style="flex:1;">
                <div style="font-size:12px;font-weight:bold;color:#0B2E57;">اعتماد الإدارة العامة</div>
                <div style="font-size:11px;font-weight:bold;color:#0B2E57;margin-top:24px;border-top:1px solid #D7E7F7;padding-top:6px;">رشيد الفزني (RACHID EL FAZNI)</div>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
      <tfoot class="repeating-footer">
        <tr>
          <td>
            <div class="footer">
              <span>${settings.footerDisclaimerAr}</span>
              <span style="font-family:monospace;font-weight:bold;color:#CC9048;" dir="ltr">Page 1 of ${totalPages} • صفحة 1 من ${totalPages}</span>
            </div>
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</body>
</html>`;
};


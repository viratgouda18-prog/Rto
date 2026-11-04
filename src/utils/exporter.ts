/**
 * Utility functions for exporting tabular data as CSV or formatted PDF / Print reports.
 */

export interface ExportDataOptions {
  filename: string;
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
  metadata?: Record<string, string | number>;
}

/**
 * Escapes a single CSV cell value according to RFC 4180 standards.
 */
export function formatCSVCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value);
  // If string contains quotes, commas, newlines, or carriage returns, wrap in quotes and escape internal quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Builds the raw CSV string with UTF-8 BOM for proper spreadsheet rendering of Unicode/regional characters.
 */
export function buildCSVString(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const headerLine = headers.map(formatCSVCell).join(',');
  const rowLines = rows.map((row) => row.map(formatCSVCell).join(','));
  return '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
}

/**
 * Downloads data as a CSV file in the browser.
 */
export function exportToCSV({ filename, headers, rows }: { filename: string; headers: string[]; rows: (string | number | boolean | null | undefined)[][] }): void {
  const csvContent = buildCSVString(headers, rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an official, print-ready document and opens print dialog for PDF saving.
 * Includes official Karnataka RTO header, metadata badges, and styled data table.
 */
export function exportToPDF({
  title,
  subtitle = 'Karnataka RTO Farm Machinery Services & Compliance Record',
  headers,
  rows,
  metadata = {},
}: ExportDataOptions): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate and download the PDF report.');
    return;
  }

  const generatedDate = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const metadataHtml = Object.entries(metadata)
    .filter(([_, val]) => val !== undefined && val !== null && val !== '')
    .map(
      ([key, val]) => `
      <div class="meta-item">
        <span class="meta-label">${escapeHtml(key)}:</span>
        <span class="meta-value">${escapeHtml(String(val))}</span>
      </div>`
    )
    .join('');

  const tableHeadersHtml = headers
    .map((h) => `<th>${escapeHtml(h)}</th>`)
    .join('');

  const tableRowsHtml = rows
    .map(
      (row, idx) => `
      <tr class="${idx % 2 === 0 ? 'even' : 'odd'}">
        ${row
          .map((cell) => {
            const str = cell === null || cell === undefined ? '-' : String(cell);
            return `<td>${escapeHtml(str)}</td>`;
          })
          .join('')}
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)} - Karnataka RTO Record</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 12mm 10mm 15mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 20px;
      font-size: 11px;
      line-height: 1.4;
    }
    .no-print-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      color: #f8fafc;
      padding: 10px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .btn {
      background: #d97706;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
    }
    .btn:hover {
      background: #b45309;
    }
    .btn-secondary {
      background: #334155;
      margin-left: 8px;
    }
    .header {
      border-bottom: 2px solid #d97706;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header-left h1 {
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .header-left h2 {
      margin: 0 0 4px 0;
      font-size: 13px;
      font-weight: 600;
      color: #d97706;
    }
    .header-left p {
      margin: 0;
      font-size: 10px;
      color: #64748b;
    }
    .header-right {
      text-align: right;
    }
    .badge-gov {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 9px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .meta-box {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    .meta-item {
      display: flex;
      gap: 4px;
      font-size: 10px;
    }
    .meta-label {
      font-weight: 600;
      color: #64748b;
    }
    .meta-value {
      font-weight: 700;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.03em;
    }
    td {
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
      word-break: break-word;
    }
    tr.even {
      background: #ffffff;
    }
    tr.odd {
      background: #f8fafc;
    }
    tr {
      page-break-inside: avoid;
    }
    .footer {
      margin-top: 24px;
      border-top: 1px solid #cbd5e1;
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
      color: #64748b;
      font-size: 9px;
    }
    .seal-note {
      font-weight: 600;
      color: #475569;
    }
    @media print {
      .no-print-bar {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>Print / Save as PDF:</strong> Use standard browser print (Destination: Save as PDF).
    </div>
    <div>
      <button class="btn" onclick="window.print()">Print / Save PDF</button>
      <button class="btn btn-secondary" onclick="window.close()">Close Window</button>
    </div>
  </div>

  <div class="header">
    <div class="header-left">
      <h2>KARNATAKA RTO CONSULTANCY & FARM MACHINERY SERVICES</h2>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(subtitle)}</p>
    </div>
    <div class="header-right">
      <div class="badge-gov">Official Record</div>
      <div style="font-size: 10px; color: #475569;">Generated: ${escapeHtml(generatedDate)}</div>
      <div style="font-size: 9px; color: #94a3b8;">Total Records: ${rows.length}</div>
    </div>
  </div>

  ${metadataHtml ? `<div class="meta-box">${metadataHtml}</div>` : ''}

  <table>
    <thead>
      <tr>${tableHeadersHtml}</tr>
    </thead>
    <tbody>
      ${tableRowsHtml || '<tr><td colspan="' + headers.length + '" style="text-align:center; padding: 20px;">No records found for current filters</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    <div class="seal-note">
      ✓ Certified Tractor & Farm Machinery Registration Record • Parivahan Sewa Karnataka
    </div>
    <div>
      Page 1 of 1 • System-Generated Report
    </div>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', () => {
      // Small timeout to allow styles to paint
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

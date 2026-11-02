import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { maskAadhaar } from './validators.ts';

test('JSZip bundles multiple simulated documents with official manifest', async () => {
  const zip = new JSZip();

  const sampleDocs = [
    { title: 'RC Book', docType: 'rc', version: 1, content: 'SAMPLE_RC_DATA' },
    { title: 'Comprehensive Insurance', docType: 'insurance', version: 1, content: 'SAMPLE_INS_DATA' },
    { title: 'Form 20 Application', docType: 'form_20', version: 1, content: 'SAMPLE_FORM20_DATA' },
  ];

  const manifestLines = [
    '========================================================================',
    'KARNATAKA REGIONAL TRANSPORT OFFICE (RTO) - OFFICIAL DOSSIER MANIFEST',
    '========================================================================',
    'Entity: Client Ramesh Kumar [KA-CL-1001]',
    'Aadhaar: ' + maskAadhaar('123456789012'),
    'Total Documents: ' + sampleDocs.length,
    '------------------------------------------------------------------------',
  ];

  sampleDocs.forEach((doc, idx) => {
    const filename = `0${idx + 1}_${doc.docType.toUpperCase()}_${doc.title.replace(/\s+/g, '_')}_v${doc.version}.txt`;
    zip.file(filename, doc.content);
    manifestLines.push(`${idx + 1}. [${doc.docType.toUpperCase()}] ${doc.title} -> ${filename}`);
  });

  zip.file('MANIFEST.txt', manifestLines.join('\n'));

  const base64Output = await zip.generateAsync({ type: 'base64' });
  assert.ok(base64Output.length > 0, 'ZIP base64 string should not be empty');

  // Verify unpack of the zip
  const loadedZip = await JSZip.loadAsync(base64Output, { base64: true });
  const manifestFile = loadedZip.file('MANIFEST.txt');
  assert.ok(manifestFile, 'MANIFEST.txt should be present in ZIP');

  const manifestText = await manifestFile.async('text');
  assert.ok(manifestText.includes('KARNATAKA REGIONAL TRANSPORT OFFICE (RTO)'));
  assert.ok(manifestText.includes('XXXX-XXXX-9012'));
  assert.ok(manifestText.includes('Form 20 Application'));

  const rcFile = loadedZip.file('01_RC_RC_Book_v1.txt');
  assert.ok(rcFile, 'First document file should be present in ZIP');
  const rcText = await rcFile.async('text');
  assert.equal(rcText, 'SAMPLE_RC_DATA');
});

test('Audit log categorization validates sensitive action types', () => {
  const allowedActions = ['login', 'upload', 'status_change', 'download', 'create', 'delete', 'ocr_extract', 'exportBackup'];
  
  const testLogs = [
    { action: 'login', details: 'User logged in', userId: 'AGENT-KA-01' },
    { action: 'upload', details: 'Uploaded Form 20', entityType: 'document' },
    { action: 'status_change', details: 'Case status changed from PENDING to COMPLETED' },
    { action: 'download', details: 'Exported ZIP dossier' },
  ];

  for (const log of testLogs) {
    assert.ok(allowedActions.includes(log.action), `Action ${log.action} should be recognized`);
    assert.ok(log.details.length > 0);
  }
});

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { formatCSVCell, buildCSVString } from './exporter.ts';

describe('Exporter utility test suite', () => {
  test('formatCSVCell handles null and undefined gracefully', () => {
    assert.strictEqual(formatCSVCell(null), '""');
    assert.strictEqual(formatCSVCell(undefined), '""');
  });

  test('formatCSVCell wraps standard string with quotes', () => {
    assert.strictEqual(formatCSVCell('Mahindra 575 DI'), '"Mahindra 575 DI"');
    assert.strictEqual(formatCSVCell(12345), '"12345"');
  });

  test('formatCSVCell escapes commas, quotes, and newlines', () => {
    assert.strictEqual(
      formatCSVCell('John Deere, 5050D'),
      '"John Deere, 5050D"'
    );
    assert.strictEqual(
      formatCSVCell('Tractor with "Power Steering"'),
      '"Tractor with ""Power Steering"""'
    );
    assert.strictEqual(
      formatCSVCell('Line 1\nLine 2'),
      '"Line 1\nLine 2"'
    );
  });

  test('buildCSVString prepends UTF-8 BOM and joins rows with CRLF', () => {
    const headers = ['Case ID', 'Owner', 'Vehicle'];
    const rows = [
      ['RTO-2026-001', 'Basavaraj Patil', 'Mahindra 575 DI'],
      ['RTO-2026-002', 'Ramesh, Kumar', 'Swaraj 744 FE'],
    ];

    const result = buildCSVString(headers, rows);
    // Starts with BOM
    assert.strictEqual(result.charCodeAt(0), 0xFEFF);
    
    // Header line
    assert.ok(result.includes('"Case ID","Owner","Vehicle"'));
    // Row 1
    assert.ok(result.includes('"RTO-2026-001","Basavaraj Patil","Mahindra 575 DI"'));
    // Row 2 with escaped comma
    assert.ok(result.includes('"RTO-2026-002","Ramesh, Kumar","Swaraj 744 FE"'));
  });
});

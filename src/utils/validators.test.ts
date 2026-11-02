import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidIndianMobile,
  maskAadhaar,
  isValidKarnatakaRegNumber,
  formatKarnatakaRegNumber,
  getExpiryStatus,
} from './validators.ts';
import { getServiceChecklist, RTO_SERVICES } from './checklists.ts';

test('validates Indian 10-digit mobile numbers', () => {
  assert.equal(isValidIndianMobile('9876543210'), true);
  assert.equal(isValidIndianMobile('+91 9876543210'), true);
  assert.equal(isValidIndianMobile('8123456789'), true);
  assert.equal(isValidIndianMobile('12345'), false);
  assert.equal(isValidIndianMobile('abc1234567'), false);
  assert.equal(isValidIndianMobile(''), false);
});

test('masks Aadhaar according to UIDAI 4-digit rules', () => {
  assert.equal(maskAadhaar('123456789012'), 'XXXX-XXXX-9012');
  assert.equal(maskAadhaar('9012'), 'XXXX-XXXX-9012');
  assert.equal(maskAadhaar(''), '');
});

test('validates Karnataka vehicle registration patterns', () => {
  assert.equal(isValidKarnatakaRegNumber('KA-01-AB-1234'), true);
  assert.equal(isValidKarnatakaRegNumber('KA05MH9999'), true);
  assert.equal(isValidKarnatakaRegNumber('KA-19-M-1'), true);
  assert.equal(isValidKarnatakaRegNumber('22BH1234AA'), true);
  assert.equal(isValidKarnatakaRegNumber('DL-01-AB-1234'), false);
  assert.equal(isValidKarnatakaRegNumber(''), false);
});

test('formats Karnataka registration numbers cleanly', () => {
  assert.equal(formatKarnatakaRegNumber('KA01AB1234'), 'KA-01-AB-1234');
  assert.equal(formatKarnatakaRegNumber('ka05m100'), 'KA-05-M-100');
});

test('computes document expiry statuses accurately', () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const status1 = getExpiryStatus(tomorrowStr);
  assert.equal(status1.status, 'critical');

  const past = new Date();
  past.setDate(past.getDate() - 10);
  const pastStr = past.toISOString().split('T')[0];
  const statusPast = getExpiryStatus(pastStr);
  assert.equal(statusPast.status, 'expired');
});

test('provides required checklists for RTO service types', () => {
  const regList = getServiceChecklist('new_registration');
  assert.ok(regList.length >= 5);
  assert.ok(regList.some((item) => item.key === 'form_20'));
  assert.ok(regList.some((item) => item.key === 'form_21'));
  assert.ok(regList.some((item) => item.key === 'form_22'));

  const toList = getServiceChecklist('ownership_transfer');
  assert.ok(toList.some((item) => item.key === 'form_29'));
  assert.ok(toList.some((item) => item.key === 'form_30'));

  const hpList = getServiceChecklist('hypothecation_termination');
  assert.ok(hpList.some((item) => item.key === 'form_35'));
});

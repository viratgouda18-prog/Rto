import test from 'node:test';
import assert from 'node:assert';
import { safeParseJson, ApiError } from './apiClient.ts';

test('apiClient test suite', async (t) => {
  await t.test('safeParseJson parses valid JSON successfully', async () => {
    const mockResponse = new Response(JSON.stringify({ success: true, count: 5 }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
    const data = await safeParseJson<any>(mockResponse);
    assert.deepStrictEqual(data, { success: true, count: 5 });
  });

  await t.test('safeParseJson returns fallback on Cloud Run HTML gateway error', async () => {
    const htmlBody = 'The page cannot be displayed because an internal server error has occurred.';
    const mockResponse = new Response(htmlBody, {
      headers: { 'Content-Type': 'text/html' },
      status: 502,
    });
    const fallback = { fallbackUsed: true };
    const data = await safeParseJson(mockResponse, fallback);
    assert.deepStrictEqual(data, fallback);
  });

  await t.test('safeParseJson returns fallback on Vite SPA index.html fallback', async () => {
    const htmlBody = '<!doctype html><html><head><title>App</title></head><body></body></html>';
    const mockResponse = new Response(htmlBody, {
      headers: { 'Content-Type': 'text/html' },
      status: 200,
    });
    const fallback: any[] = [];
    const data = await safeParseJson(mockResponse, fallback);
    assert.deepStrictEqual(data, fallback);
  });

  await t.test('safeParseJson throws ApiError instead of JSON syntax error when no fallback given', async () => {
    const htmlBody = 'The page cannot be displayed because an internal server error has occurred.';
    const mockResponse = new Response(htmlBody, {
      headers: { 'Content-Type': 'text/html' },
      status: 502,
    });
    await assert.rejects(
      async () => {
        await safeParseJson(mockResponse);
      },
      (err: any) => {
        assert.ok(err instanceof ApiError);
        assert.strictEqual(err.status, 502);
        // Ensure raw "Unexpected token 'T'" syntax error is not exposed
        assert.ok(!err.message.includes("Unexpected token 'T'"));
        return true;
      }
    );
  });

  await t.test('safeParseJson returns empty object on empty response body', async () => {
    const mockResponse = new Response('', {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
    const data = await safeParseJson(mockResponse);
    assert.deepStrictEqual(data, {});
  });
});

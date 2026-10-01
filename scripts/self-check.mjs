#!/usr/bin/env node
/**
 * ponytail: tiny self-check without a running Externa (ceiling: no HTTP; upgrade: smoke against fixtures).
 */
import assert from 'node:assert/strict';

function itemLabel(item) {
  const data = item.data ?? {};
  for (const key of ['title', 'name', 'slug', 'label']) {
    const value = data[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }
  return `Item #${item.id}`;
}

function shortApiDetail(body, status) {
  const trimmed = body.trim();
  if (!trimmed) {
    return `HTTP ${status}`;
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed.message === 'string' && parsed.message.trim() !== '') {
      return parsed.message.trim();
    }
    if (
      parsed &&
      typeof parsed === 'object' &&
      Object.prototype.hasOwnProperty.call(parsed, 'message')
    ) {
      return `HTTP ${status}`;
    }
  } catch {
    // non-JSON
  }
  if (trimmed.includes('NotFoundHttpException') || trimmed.includes('exception')) {
    return `HTTP ${status}`;
  }
  return trimmed.slice(0, 120);
}

assert.equal(itemLabel({ id: 1, data: { title: 'Hello' } }), 'Hello');
assert.equal(itemLabel({ id: 2, data: {} }), 'Item #2');
assert.equal(itemLabel({ id: 3, data: { name: 'X' } }), 'X');

assert.equal(shortApiDetail('{"message":""}', 404), 'HTTP 404');
assert.equal(shortApiDetail('{"message":"Not found."}', 404), 'Not found.');
assert.equal(
  shortApiDetail(
    '{"message":"","exception":"Symfony\\\\Component\\\\HttpKernel\\\\Exception\\\\NotFoundHttpException"}',
    404,
  ),
  'HTTP 404',
);

console.log('self-check ok');

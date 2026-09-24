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

assert.equal(itemLabel({ id: 1, data: { title: 'Hello' } }), 'Hello');
assert.equal(itemLabel({ id: 2, data: {} }), 'Item #2');
assert.equal(itemLabel({ id: 3, data: { name: 'X' } }), 'X');
console.log('self-check ok');

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addItem, formatItems, toggleItem } from './lib.mjs';

test('addItem appends an open item with the next id', () => {
  const items = addItem(addItem([], 'milk'), '  eggs ');
  assert.deepEqual(items, [
    { id: 1, text: 'milk', done: false },
    { id: 2, text: 'eggs', done: false },
  ]);
});

test('addItem rejects empty text', () => {
  assert.throws(() => addItem([], '   '), /must not be empty/);
});

test('toggleItem flips done and rejects an unknown id', () => {
  const items = addItem([], 'milk');
  assert.equal(toggleItem(items, 1)[0].done, true);
  assert.throws(() => toggleItem(items, 9), /no item 9/);
});

test('formatItems renders marks, ids and the empty state', () => {
  assert.equal(formatItems([]), 'The checklist is empty.');
  assert.equal(formatItems(toggleItem(addItem([], 'milk'), 1)), '[x] 1. milk');
});

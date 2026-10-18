import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addItem, formatItems, removeItem, toggleItem } from './lib.mjs';

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

test('removeItem deletes the item with the given id', () => {
  const items = [
    { id: 1, text: 'a', done: false },
    { id: 2, text: 'b', done: true },
    { id: 3, text: 'c', done: false },
  ];
  assert.ok(!removeItem(items, 2).some((item) => item.id === 2));
});

test('removeItem keeps other items unchanged and in order', () => {
  const item1 = { id: 1, text: 'a', done: false };
  const item3 = { id: 3, text: 'c', done: true };
  const items = [item1, { id: 2, text: 'b', done: false }, item3];
  const copy = structuredClone(items);
  assert.deepEqual(removeItem(items, 2), [item1, item3]);
  assert.deepEqual(items, copy);
});

test('removeItem rejects an unknown id', () => {
  assert.throws(() => removeItem([{ id: 1, text: 'a', done: false }], 9), /no item 9/);
  assert.throws(() => removeItem([], 9), /no item 9/);
});

test('formatItems renders marks, ids and the empty state', () => {
  assert.equal(formatItems([]), 'The checklist is empty.');
  assert.equal(formatItems(toggleItem(addItem([], 'milk'), 1)), '[x] 1. milk');
});

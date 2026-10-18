// Pure checklist operations. Items are { id, text, done }.

export function addItem(items, text) {
  const clean = String(text ?? '').trim();
  if (clean === '') throw new Error('text must not be empty');
  const id = items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  return [...items, { id, text: clean, done: false }];
}

export function toggleItem(items, id) {
  if (!items.some((item) => item.id === id)) throw new Error(`no item ${id}`);
  return items.map((item) => (item.id === id ? { ...item, done: !item.done } : item));
}

export function removeItem(items, id) {
  if (!items.some((item) => item.id === id)) throw new Error(`no item ${id}`);
  return items.filter((item) => item.id !== id);
}

export function formatItems(items) {
  if (items.length === 0) return 'The checklist is empty.';
  return items.map((item) => `${item.done ? '[x]' : '[ ]'} ${item.id}. ${item.text}`).join('\n');
}

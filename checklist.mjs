#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { addItem, formatItems, toggleItem } from './lib.mjs';

const FILE = process.env.CHECKLIST_FILE ?? 'checklist.json';
const load = () => (existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : []);
const save = (items) => writeFileSync(FILE, `${JSON.stringify(items, null, 2)}\n`);

const [command, ...args] = process.argv.slice(2);
try {
  if (command === 'add') {
    save(addItem(load(), args.join(' ')));
  } else if (command === 'toggle') {
    save(toggleItem(load(), Number(args[0])));
  } else if (command === 'list' || command === undefined) {
    console.log(formatItems(load()));
  } else {
    console.error('usage: checklist [list | add <text> | toggle <id>]');
    process.exitCode = 2;
  }
} catch (error) {
  console.error(`error: ${error.message}`);
  process.exitCode = 1;
}

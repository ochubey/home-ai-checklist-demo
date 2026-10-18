# Plan: remove command for the checklist CLI (SPEC-01)

Spec: `specs/01-remove-command.md` (approved)
Execution mode: **single-agent pass** (recommended; awaiting caller confirmation)

## Implementation strategy

### Current architecture
- `lib.mjs`: pure operations on `{ id, text, done }[]`. `toggleItem` already has the unknown-id check (`throw new Error(\`no item ${id}\`)`).
- `checklist.mjs`: the CLI. It handles loading and saving `CHECKLIST_FILE`; a missing file loads as `[]`. It dispatches commands and catches any thrown error, printing `error: <message>` to stderr with exit 1. An unknown command prints usage to stderr with exit 2.
- `lib.test.mjs`: unit tests using `node:test`. There are no CLI tests yet. `npm test` runs `node --test`, which finds `*.test.mjs` files automatically.

### Why existing behavior already covers most of the spec
- The `throw` then `catch` path in `checklist.mjs` produces AC-4's stderr text and exit code with no new code.
- `save` only runs after the operation returns. A throwing `removeItem` therefore writes nothing, which covers AC-5 and AC-6.
- `load` already treats a missing file as an empty list, so a missing file becomes an unknown id (AC-6).
- `add` and `toggle` print nothing on success, and `remove` follows the same pattern (AC-3).
- `formatItems([])` already returns `The checklist is empty.` (AC-7).

### Contract (new)
```js
// lib.mjs
export function removeItem(items, id)  // returns a new array without the item; throws Error(`no item ${id}`) if absent
```
The function does not change its input. Other items keep their object identity and order: it filters, it does not map.

### Critical files
- `lib.mjs`: add `removeItem` (modify).
- `lib.test.mjs`: add unit tests (modify).
- `checklist.mjs`: add the `remove` branch and update the usage string (modify).
- `checklist.test.mjs`: CLI tests (create). Each test spawns `process.execPath checklist.mjs ...` with `CHECKLIST_FILE` pointing into a `mkdtemp` directory, then checks `status`, `stdout`, `stderr` and the file contents.
- `README.md`: add a `remove` example (modify).

### Data flow
`argv` goes through `Number(args[0])` (same parsing as `toggle`), then `removeItem(load(), id)`, then `save(...)`. On error: `catch`, then `error: no item <id>`, exit 1, and no write.

## Phases and tasks

Order: contract, producer, consumer, docs. Each phase fits in one implementer run.

### Phase 1: contract and producer (`lib.mjs`)
- [ ] T1 Add `removeItem(items, id)` to `lib.mjs`, using filter with the same unknown-id error as `toggleItem` -> AC-1, AC-2, AC-4 -> (tests in T2–T4)
- [ ] T2 Unit test: items 1..3, remove 2; no item has id 2 -> AC-1 -> `removeItem deletes the item with the given id`
- [ ] T3 Unit test: items 1..3 with item 3 `done: true`, remove 2; deep-equal to `[item1, item3]` and the input array is unchanged -> AC-2 -> `removeItem keeps other items unchanged and in order`
- [ ] T4 Unit test: `removeItem(items, 9)` throws `/no item 9/`; also throws on `[]` -> AC-4 -> `removeItem rejects an unknown id`

### Phase 2: consumer (`checklist.mjs`) and CLI tests
- [ ] T5 Add the `else if (command === 'remove') save(removeItem(load(), Number(args[0])));` branch and import `removeItem` -> AC-1, AC-3 -> (tests in T8–T9)
- [ ] T6 Change the usage string to `usage: checklist [list | add <text> | toggle <id> | remove <id>]` -> AC-8 -> `cli usage lists remove <id>`
- [ ] T7 Create `checklist.test.mjs` with a helper: `run(args, file)` uses `spawnSync` and returns `{status, stdout, stderr}`; a temp-dir fixture holds the file -> (supports all CLI tests)
- [ ] T8 CLI test: seed the file with 3 items and run `remove 2`; the stored file has no id 2 and ids 1 and 3 are unchanged -> AC-1, AC-2 -> `cli remove deletes the item from the stored file`
- [ ] T9 CLI test: a successful `remove` exits 0 with empty stdout and stderr -> AC-3 -> `cli remove succeeds silently`
- [ ] T10 CLI test: `remove 9` on a seeded file; stderr is exactly `error: no item 9\n` and the exit status is 1 -> AC-4 -> `cli remove reports an unknown id`
- [ ] T11 CLI test: file bytes before and after the failing `remove 9` are identical -> AC-5 -> `cli remove leaves the file unchanged on unknown id`
- [ ] T12 CLI test: `CHECKLIST_FILE` points to a missing path; stderr is `error: no item 1\n`, the exit status is 1, and the file still does not exist -> AC-6 (and AC-5) -> `cli remove on a missing file reports an unknown id`
- [ ] T13 CLI test: `add milk`, then `remove 1`; the file parses to `[]`, and `list` prints `The checklist is empty.\n` -> AC-7 -> `cli removing the only item leaves an empty checklist`
- [ ] T14 CLI test: an unknown command (`frobnicate`) gives stderr containing `remove <id>` -> AC-8 -> `cli usage lists remove <id>`

### Phase 3: docs
- [ ] T15 Add a `node checklist.mjs remove 1` line to the README usage block -> AC-8 (discoverability, G5) -> covered by T14; reviewed manually

## Coverage table

| AC | Tasks | Tests |
|---|---|---|
| AC-1 | T1, T2, T5, T8 | `removeItem deletes the item with the given id`, `cli remove deletes the item from the stored file` |
| AC-2 | T1, T3, T8 | `removeItem keeps other items unchanged and in order`, `cli remove deletes the item from the stored file` |
| AC-3 | T5, T9 | `cli remove succeeds silently` |
| AC-4 | T1, T4, T10 | `removeItem rejects an unknown id`, `cli remove reports an unknown id` |
| AC-5 | T11, T12 | `cli remove leaves the file unchanged on unknown id`, `cli remove on a missing file reports an unknown id` |
| AC-6 | T12 | `cli remove on a missing file reports an unknown id` |
| AC-7 | T13 | `cli removing the only item leaves an empty checklist` |
| AC-8 | T6, T14, T15 | `cli usage lists remove <id>` |

Every AC has at least one task and one test. The edge cases in the spec map like this:
- Removing a middle id is covered by T3 and T8.
- Removing the highest id is covered by T3: item 3 stays unchanged when 2 is removed. Adding a unit case that removes 3 is optional.
- Removing the only item is T13.
- Removing an already-removed id is T4 and T10.
- Removing from an empty list or a missing file is T4 and T12.
- Removing a done item: add it as an assertion in T2 by marking the target item done.

## Trade-offs and rationale
- **Filter vs. splice:** filtering returns a new array and leaves the other item objects untouched. That fits the pure style of `lib.mjs` and makes AC-2's deep equality trivial. Splice would modify the caller's array.
- **Reuse the `toggle` id parsing and error text:** the spec requires it (provenance section). It also means `remove abc` gives `error: no item NaN`, the same as `toggle` today. The spec puts better validation out of scope.
- **Rely on the throw-before-save pattern for AC-5 and AC-6** instead of adding an explicit existence check in the CLI. It is less code, and it matches how `toggle` already guarantees no partial write.
- **CLI tests spawn a real process** instead of refactoring `checklist.mjs` into an importable `main()`. The AC verifications call for exit status, stderr and file checks. Spawning tests the real entry point and avoids a structural change the spec doesn't ask for.
- **Id reuse after removing the highest id** stays as it is (non-goal). No test is written to lock that behavior in either direction.

### Risks and assumptions
- CLI tests assume `node` is available through `process.execPath`, and that `checklist.mjs` resolves `./lib.mjs` relative to itself. ESM imports do resolve that way, so the spawn `cwd` doesn't matter.
- `node --test` with no arguments on Node 22 picks up `checklist.test.mjs` through its default glob, so `package.json` needs no change.
- The temp files must be cleaned up after each test (`rmSync(dir, { recursive: true })`).

## Validation
- Run `npm test`: all 4 existing unit tests and the new unit and CLI tests must pass.
- Manual smoke test: `CHECKLIST_FILE=c.json node checklist.mjs add a; ... add b; ... remove 1; ... list` should show `[ ] 2. b`.
- Breaking changes: none. The only visible change to existing behavior is the longer usage string, which nothing consumes programmatically.
- Out of scope: CI and deployment changes.

---

Files I read:
- specs/01-remove-command.md
- checklist.mjs
- lib.mjs
- lib.test.mjs
- package.json
- README.md
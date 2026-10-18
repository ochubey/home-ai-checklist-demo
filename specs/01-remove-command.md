# Spec: remove command for the checklist CLI
Spec ID: SPEC-01
Status: approved

## Problem and user

A user of the checklist CLI can add, list and toggle items, but cannot get rid of an item.
Items they no longer need stay in the list forever. The user wants to delete one item by its id
without changing the ids of the other items, because they refer to items by id in later
`toggle` and `remove` calls.

## Goals / Non-goals

Goals:

- G1: A user can delete a single item by id with `checklist remove <id>`.
- G2: Deleting an item does not change the id, text or done state of any other item.
- G3: An unknown id is reported clearly and fails the command without changing the checklist.
- G4: Removing the last remaining item leaves a valid, empty checklist.
- G5: The command is discoverable in the CLI usage message.

Non-goals:

- Removing several items in one call, or removing by text, pattern or done state.
- Undo, confirmation prompts, or a trash/archive of removed items.
- Renumbering or compacting ids after a removal.
- Changing how `add` allocates new ids. Today a new id is one more than the highest existing id,
  so removing the item with the highest id lets the next `add` reuse that id. This spec keeps that
  behavior as is.
- New validation rules for a missing or non-numeric `<id>` argument beyond the existing
  `toggle` behavior.
- Concurrent access to the checklist file by several processes.

## User stories

- US1: As a user, I run `checklist remove 2` so that item 2 is gone and items 1 and 3 keep their ids.
- US2: As a user, I mistype an id and get a clear error and a failing exit status, and my checklist is unchanged.
- US3: As a user, I remove my only item and `checklist list` then shows the empty checklist.

## Acceptance criteria (EARS)

- AC-1 (G1): WHEN the user runs `checklist remove <id>` and an item with that id exists, the CLI shall delete that item from the stored checklist.
  Verification: unit test on the remove operation with items 1..3, removing 2, asserts that no item has id 2; CLI test reads the stored file after the command.
- AC-2 (G2): WHEN an item is removed, the CLI shall keep every other item with the same id, text and done state, in the same relative order.
  Verification: unit test asserts the result equals the input minus the removed item (deep equality), including a done item.
- AC-3 (G1): WHEN a removal succeeds, the CLI shall exit with status 0 and print nothing to stdout or stderr, consistent with `add` and `toggle`.
  Verification: CLI test with a temporary `CHECKLIST_FILE` checks exit status 0 and empty stdout and stderr.
- AC-4 (G3): IF no item with the given id exists, THEN the CLI shall print `error: no item <id>` to stderr and exit with status 1.
  Verification: unit test asserts the operation fails with message `no item 9`; CLI test checks stderr is exactly `error: no item 9` plus newline and the exit status is 1.
- AC-5 (G3): IF no item with the given id exists, THEN the CLI shall leave the stored checklist unchanged.
  Verification: CLI test compares the checklist file contents before and after the failing command.
- AC-6 (G3): IF the checklist file does not exist, THEN `checklist remove <id>` shall behave as for an unknown id (AC-4).
  Verification: CLI test with a `CHECKLIST_FILE` path that does not exist checks stderr and exit status 1.
- AC-7 (G4): WHEN the user removes the only remaining item, the CLI shall store an empty checklist, and a following `checklist list` shall print `The checklist is empty.`
  Verification: CLI test adds one item, removes it, then runs `list` and checks the output; the stored file holds an empty list.
- AC-8 (G5): The CLI usage message shall include `remove <id>` alongside the existing commands.
  Verification: CLI test runs an unknown command and checks that stderr contains `remove <id>`.

Traceability: G1 -> AC-1, AC-3; G2 -> AC-2; G3 -> AC-4, AC-5, AC-6; G4 -> AC-7; G5 -> AC-8.

## Edge cases

- Remove an id in the middle of the list: other ids keep their values, leaving a gap (AC-2).
- Remove the item with the highest id: other items unchanged (AC-2); id reuse by a later `add` is out of scope (see Non-goals).
- Remove the only item: empty checklist (AC-7).
- Remove an id that was already removed: unknown id (AC-4, AC-5).
- Remove from an empty checklist or a missing file: unknown id (AC-4, AC-6).
- Remove a done item: removed like any other item (AC-1).

Coverage of the six categories:

1. Data and loading: the existing checklist file (`CHECKLIST_FILE`, default `checklist.json`); a missing file is an empty checklist (AC-6).
2. Display and sorting: no new display; `list` output after removal follows the existing format and empty state (AC-7).
3. Interactions: one new command, `remove <id>` (AC-1, AC-8).
4. State and persistence: the removal is written to the same checklist file; failures write nothing (AC-5).
5. Feedback: silent success (AC-3); error message and exit status 1 for unknown id (AC-4).
6. Edge cases: listed above; concurrency is a non-goal.

## Non-functional requirements

- Performance: no new requirement; a checklist is small and the command runs in one process call.
- Data safety: a failing `remove` shall not modify the checklist file (AC-5).
- Access control: none; the CLI uses local file permissions only.
- Accessibility: plain text output on stdout and stderr, same as existing commands.
- Observability: the exit status (0 or 1) and the stderr message are the only signals, consistent with existing commands.
- No new dependencies; Node 22, as stated in the README.

## Inputs and provenance

- Checklist items `{ id, text, done }` from the checklist file: [reused: existing CLI load and save of `CHECKLIST_FILE`]
- `<id>` command line argument: [reused: existing `toggle` argument handling]
- Lookup and removal of the item: [deterministic: checklist operations module]
- Error text `no item <id>`: [reused: existing unknown-id message used by `toggle`]
- LLM calls: none.

## Untrusted inputs

None. The feature passes no repository or pull request text to a model. Item text from the
checklist file is treated as plain data and is never interpreted.

## Open questions

None. The caller confirmed there are no other edge cases or open questions.

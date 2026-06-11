---
name: Apply locked spec decisions
overview: Fold the seven newly locked decisions (Hero Workflow fallback, delayed-dispatch undo send, denormalized search columns, merged Done lane, react-hotkeys-hook, minimal bulk actions, Tiptap) into requirements.md, design.md, and tasks.md.
todos:
  - id: hero-fallback
    content: Add Hero Workflow manual-mode fallback to all three docs
    status: completed
  - id: undo-send
    content: Spec delayed-dispatch undo send via scheduled_sends
    status: completed
  - id: denormalize
    content: Add subject/sender/snippet columns to classifications
    status: completed
  - id: done-lane
    content: Define merged Done lane semantics
    status: completed
  - id: misc-locks
    content: Lock react-hotkeys-hook, minimal bulk actions, Tiptap
    status: completed
isProject: false
---

# Apply Locked Spec Decisions

Update the three spec files in [.kiro/specs/command-inbox/](.kiro/specs/command-inbox/) with the decisions locked during grilling.

## 1. Hero Workflow fallback (Q7)
- `requirements.md` Req 9: add criteria — M works on any thread; if `schedulingIntent` is null or `confidence < 0.5`, AvailabilityPicker opens in manual mode (no proposed-time chips, next free slots, 30-min default duration, attendees pre-filled from thread participants).
- `design.md` AvailabilityPicker component: document the two modes and the 0.5 confidence threshold.
- `tasks.md` task 12.1: add manual-mode fallback bullet.

## 2. Undo send = delayed dispatch (5s)
- `requirements.md` Req 19.4: clarify send undo holds dispatch server-side for 5 seconds; undo cancels before Corsair dispatch.
- `design.md`: sends enqueue a `scheduled_sends` row with `send_at = now() + 5s` (reuses the existing table + cron/claiming machinery); undo flips status to `cancelled`. Note worst-case extra latency from the 1-min cron — immediate sends use a short server-side `setTimeout`-style dispatch in the same request after the 5s window, with the row as the durable fallback.
- `tasks.md` task 6.2: add delayed-dispatch undo bullets.

## 3. Denormalized search display columns
- `design.md` classifications table: add `subject`, `sender`, `snippet` text columns populated at classification time; semantic search reads from this one table.
- `tasks.md` tasks 1 and 9.1: mention the new columns.

## 4. Done lane = merged with archive
- `requirements.md` Req 2/5: archiving moves a thread to the Done lane; Done holds archived + classifier no-action threads, hidden from the main triage flow.
- `design.md`: document Done semantics in ThreadList and snooze/archive sections.

## 5. Shortcut library: react-hotkeys-hook
- `design.md` Shortcut system section: registry consumed by react-hotkeys-hook (scopes: global/list/thread/composer).
- `tasks.md` task 14.1: name the library.

## 6. Bulk actions: minimal (archive + snooze)
- `requirements.md` Req 14.5 area: new criteria — multi-select supports bulk archive and bulk snooze only.
- `design.md`/`tasks.md`: reflect in multi-select notes (task 22.2, X-key handling).

## 7. Composer editor: Tiptap
- `tasks.md` task 6.1: replace "Tiptap or similar" with Tiptap.
- `design.md` ComposerPanel: name Tiptap.
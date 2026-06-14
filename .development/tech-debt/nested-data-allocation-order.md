# Tech debt — nested data-allocation order not ground-truth-verified

**Status:** open · **Opened:** 2026-06-14 · **Area:** `games/raid/src/engine/layout.js` (`placeNested`)

## What

For nested RAID (50/60/100), `placeNested` composes each span's verified grid and
assigns a GLOBAL data-segment numbering. The current numbering ("row by row, span by
span, in disk order") is **provisional**: it is internally consistent but is **not**
verified against a real controller's allocation order.

Only **roles** (data / P / Q / mirror positions) and the **per-span** layout are
golden-verified (`tests/layout-golden.test.js` [7]). The leaf `near` / RAID 1E ordering
is also verified (slot-stream). The gap is strictly the *global cross-span data ORDER*.

## Why it matters

The sandbox teaches *how data is written to memory*. The animation order is the lesson,
not a cosmetic label. A wrong global order animates the wrong thing.

## What we found (decoding `.personal/segment-allocation-rule-left-symmetric.md`, RAID 60)

Leading hypothesis for the true rule (0-based):
- **Intra-span:** data follows the left-symmetric WRITE order (right of parity, wrapping)
  — verified on rows 1–2 of the hand table.
- **Cross-span:** the outer RAID 0 gives each span one row-worth per round, **alternating
  the span order each round** (round0 A→B, round1 B→A, round2 A→B …) — the "non-trivial"
  pattern Valentina built the table to capture.

## Open question (blocks implementing the exact rule)

Row 3 / span A of the hand table is in **disk order**, not write order (rows 1–2 are
write order). Unresolved: deliberate extra rule, or a hand-transcription slip?
**Valentina is rechecking the table / source.** Until resolved, we do NOT implement the
exact order (decision 2026-06-14: "solo ruoli ora, ordine dopo").

## Definition of done

1. Confirm the row-3 question (and ideally a second worked example).
2. Pin the exact rule (intra-span write order + cross-span round alternation, or revised).
3. Implement it in `placeNested`; assert EXACT segs in `layout-golden.test.js` against the
   corrected `.personal` tables (RAID 50/60/100).
4. Remove the provisional caveats from the test section [7] and from `placeNested`.

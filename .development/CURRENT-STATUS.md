# Current Status

## Project State

**Last Updated**: 2026-06-14

**Current Phase**: Production (site live on GitHub Pages)

**Active Work**: Completing RAID combinations — on branch `feature/raid-complete-combinations`
(4 commits), 10-file headless suite green (201 assertions). AWAITING in-browser verification
of the animations, then merge. Delivers:
- Recognizer: RAID 1E (odd striped mirror), RAID 100 (was MISNAMED RAID 1+0 — bug fixed),
  and the mirror-of-arrays family (RAID 51/61/0+1). All shape-derived (never the algorithm).
- Placement + animation: RAID 50/60 (generalized `placeNested` for parity spans), RAID 100
  (mirror-mode), RAID 1E (near slot-stream, odd disks). Animation is free (render.js groups
  by seq). RAID 51/61/0+1 recognized but stats-only (mirror parent, no flat grid).
- Golden tables hand-laid in `.personal/golden-raid{50,100,1e}.md` (+ existing RAID 60), the
  ground truth transcribed into `layout-golden.test.js` [7].
- Data: `raid1e/raid100/raid51/raid61.yaml` + index.
- OUT of scope (no two-axis representation): RAID 2/3/4, RAID 30/03, triple parity, mdadm Q-right.

PRIOR responsive/mobile UX pass is MERGED to `main` (verified desktop 2K + real mobile):
sidebar wrap + accordion palette, collapsible physical layer, viewport-fit desktop shell,
matching layer title bars.

`main` is 9 commits ahead of `origin` — awaiting Valentina's push (sandbox can't reach
github.com). NOT yet pushed → not live on GitHub Pages.

## Recent Milestones

- Responsive/mobile UX pass: sidebar wrap + accordion palette, collapsible physical
  layer, viewport-fit desktop shell, matching layer title bars — merged, verified
  on desktop + mobile - 2026-06-14
- Domain data extracted from `src/` into `data/` resource files (159 tests) - 2026-06-13
- RAID Sandbox v1 complete — all roadmap phases 0–5 implemented and merged to `main`
  (spec: `specs/implemented/raid-sandbox-domain-model.md`) - 2026-06-07
- Phase 5 (performance model, validator, challenge mode) + refactoring pass
  (styles/ · src/engine/ · src/challenge/ · src/sandbox/ · tests/) - 2026-06-07
- Sandbox promoted to front door (`games/raid/canvas.html`), linear quiz retired,
  sitemap updated - 2026-06-05

## Next Steps

- [x] Extract hard-coded domain data from `src/` into `data/` resource files (spec §5)
      — `data/raid-levels/` family + component `ui:` sections; 159 tests (was 134)
- [x] Mobile layout fixed (was "non si vede ancora bene"): narrow-viewport sidebar
      now wraps and, <=900px, collapses into a one-at-a-time accordion of card-styled
      group rows (`src/sandbox/sidebar-accordion.js`). Verified on real mobile.
- [~] RAID 50/60 nested placement + animation, RAID 1E, RAID 100/51/61 recognition —
      DONE on `feature/raid-complete-combinations`, awaiting in-browser verify + merge.
- [ ] In-browser verification of the new animations (build RAID 50/60/100/1E on
      `games/raid/canvas.html`, confirm grids + ▶ animate; RAID 51/61 show stats only).
- [ ] Confirm the touch drag-and-drop *gesture* itself on a real device (press-hold
      to drag a chip onto the canvas) — layout is good, gesture not yet stress-tested.
- [ ] NEXT (part 2, user's plan): make the validator robust/scalable — cross-axis
      constraints (e.g. near/far/offset → Linux mdadm only; no Windows OS for those).
- [ ] Deferred from extraction: wire `layout.js` placement primitives to the
      `data/algorithms/*.yaml` descriptors (parametric algorithm registry)
- [ ] Deferred modules (see spec §11): runtime behavior (drive states, hot-spare
      rebuild, failure simulation), backplane-diversity soft rule,
      sequential-class challenge metrics

## Active Issues

See `.development/tech-debt/` for tracked technical debt (currently empty).

Known wart (documented in spec completion log): the `capacityGB` field holds the
disk chips' native unit (1/2/4, displayed as "TB") — rename out of scope for v1.

## Notes

- Test suite: 9 headless node test files in `games/raid/tests/` (run each with
  `node <file>`); plus browser test pages (`*.test.html`, demos). The responsive,
  touch, accordion, and physical-collapse work is browser-only (guarded) — it does
  not touch the headless suite.
- The repo is zero-dependency: YAML is parsed in-browser via js-yaml CDN;
  node tests must not require YAML parsing at runtime.
- Hosting: GitHub Pages today; migration to Vercel + personal domain planned.

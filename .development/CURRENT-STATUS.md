# Current Status

## Project State

**Last Updated**: 2026-06-14

**Current Phase**: Production (site live on GitHub Pages)

**Active Work**: RAID combinations DONE & merged to `main` (verified in-browser, 205 assertions).
Closed spec items that were deferred (RAID 50/60 nested placement; RAID 1E placement). NEXT is
**phase 2 — validator robustness + constraints** (not started; plan below).

Combinations delivered (merged): recognizer RAID 1E / 100 / 51 / 61 / 0+1 (shape-derived);
placement+animation RAID 50/60 (canonical write order, animates one block at a time), RAID 100,
RAID 1E (near, odd disks); near/far/offset now golden-tested; validator made consistent with 1E.
All layouts anchored to the Linux md source (raid5.c / raid10.c); golden tables hand-derived, not
dumped from the engine. Earlier this session: responsive/mobile UX pass (also merged, verified).

**Phase 2 plan (next session)** — start with the DATA layer, then extend to physical:
1. Refactor `validator.js` into a declarative rule registry ({code, severity, layer, run}), dedup
   by (code, nodeId), compute the recognized level once in a ctx; reclassify existing rules by
   layer. No behaviour change (15 tests stay green) — the scalable base.
2. Add data-layer SOFT constraints: `mixed-disk-sizes` (capacity coerced to the smallest disk →
   warn) and `uneven-spans` (nested spans of unequal size → warn). Soft = educate, don't block.
3. DEFER to phase-2 part 2 (physical): fake RAID limited to 0/1/5/10; SATA/SAS need an HBA/controller
   in the path; mixed-protocol arrays; Windows Storage Spaces specifics.

`main` is 15 commits ahead of `origin` — awaiting Valentina's push (sandbox can't reach
github.com). NOT yet pushed → not live on GitHub Pages.

## Recent Milestones

- RAID combinations: 50/60 placement+animation, RAID 1E, 100, 51/61 recognition —
  layouts anchored to Linux md source, golden hand-derived, verified in-browser - 2026-06-14
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

See `.development/tech-debt/` — `nested-data-allocation-order.md`: mostly RESOLVED. The
nested data ORDER is now Linux-verified per span (raid5.c/raid10.c, hand-derived golden,
write-order bug fixed); only the cross-span stacking order remains a documented convention.

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

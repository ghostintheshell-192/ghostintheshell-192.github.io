# Current Status

## Project State

**Last Updated**: 2026-06-14

**Current Phase**: Production (site live on GitHub Pages)

**Active Work**: RAID game responsive/mobile UX polish (session in progress — more
ritocchi planned). All of the following are MERGED to `main` and verified in browser
on desktop (2K) + real mobile; 9-file headless suite green throughout:
- responsive layout + touch DnD shim; narrow-viewport sidebar wrap
- collapsible-accordion palette (<=900px, one section open at a time)
- physical layer collapsed by default on narrow screens (secondary view) — re-renders on expand
- desktop shell pinned to the real viewport box (`height:100%` over `100vh`) so a
  `100vh>innerHeight` setup no longer adds a page scrollbar; grid items get `min-height:0`
- data-layer title bar matching the physical layer's on narrow screens

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
- [ ] Confirm the touch drag-and-drop *gesture* itself on a real device (press-hold
      to drag a chip onto the canvas) — layout is good, gesture not yet stress-tested.
- [ ] Deferred from extraction: wire `layout.js` placement primitives to the
      `data/algorithms/*.yaml` descriptors (parametric algorithm registry)
- [ ] Deferred modules (see spec §11): runtime behavior (drive states, hot-spare
      rebuild, failure simulation), backplane-diversity soft rule, RAID 50/60
      nested placement, sequential-class challenge metrics

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

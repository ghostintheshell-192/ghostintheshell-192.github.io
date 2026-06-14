# Current Status

## Project State

**Last Updated**: 2026-06-14

**Current Phase**: Production (site live on GitHub Pages)

**Active Work**: RAID game post-v1 chores. Data extraction DONE (merged).
Responsive layout + touch support MERGED to `main` (code clean, 9-file headless
suite green) — on-device touch verification still pending (additive, browser-only,
low risk). Stale branches pruned; `main` ahead of `origin` (awaiting push).

## Recent Milestones

- RAID Sandbox v1 complete — all roadmap phases 0–5 implemented and merged to `main`
  (spec: `specs/implemented/raid-sandbox-domain-model.md`) - 2026-06-07
- Phase 5 (performance model, validator, challenge mode) + refactoring pass
  (styles/ · src/engine/ · src/challenge/ · src/sandbox/ · tests/) - 2026-06-07
- Sandbox promoted to front door (`games/raid/canvas.html`), linear quiz retired,
  sitemap updated - 2026-06-05

## Next Steps

- [x] Extract hard-coded domain data from `src/` into `data/` resource files (spec §5)
      — `data/raid-levels/` family + component `ui:` sections; 159 tests (was 134)
- [ ] **Open issue**: mobile layout "non si vede ancora bene" on a real device (noted
      2026-06-13, never diagnosed). The responsive/touch code is merged to `main`, but the
      mobile visual layout still needs a fix — get a screenshot, diagnose, fix on a fresh
      branch. Desktop is fine; touch drag-and-drop gesture also still to confirm on device.
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

- Test suite: 134 headless node tests across 8 files in `games/raid/tests/`
  (run each with `node <file>`); plus browser test pages (`*.test.html`, demos).
- The repo is zero-dependency: YAML is parsed in-browser via js-yaml CDN;
  node tests must not require YAML parsing at runtime.
- Hosting: GitHub Pages today; migration to Vercel + personal domain planned.

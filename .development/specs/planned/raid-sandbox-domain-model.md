# RAID Sandbox — Domain Model (design backbone)

**Status:** planned · first draft for review
**Date:** 2026-06-01
**Branch:** `feature/raid-sandbox-domain-model`
**Source notes:** `.personal/*.md` + `.personal/IMG20260601163917.jpg` (RIEPILOGO diagram)

> This is the *carta*: the model from which both the YAML resource files and the
> engine derive. It is meant to be marked up, not obeyed. Where a decision is the
> author's to make, it is tagged **[DECISIONE]**.

---

## 1. What the game becomes

Today the project is two disconnected halves: a **Visualize** gallery that explains
RAID statically, and a **Build** quiz whose answers are literally "RAID 0 / 1 / 5 / 6 / 10".
The quiz is linear because the RAID level is *picked from a list*.

The target is a single **sandbox builder**: the player drags physical components onto a
canvas, composes data-organization primitives, and the engine **derives** what they built,
**validates** it, and **shows** how data lands on the disks.

Two modes, same engine:

- **Prompt mode** — a "client" states requirements ("I need a volume that survives 2 disk
  failures, optimized for sequential reads"); the player builds a topology that satisfies them.
- **Sandbox mode** — free exploration under mandatory constraints only; the player asks
  *"what if?"* and the canvas answers visually.

The sandbox is, in effect, an **answer engine** for topology questions:

- *Can I make a span over 3 drives of a 4-drive drive group?*
- *If I extend two RAID-5 drive groups, how does data distribute under Right Asymmetric?*
- *If I build a RAID with mirroring, what RAID am I actually creating?*

### The founding principle

> **The RAID level is not selected. It is derived from what you compose.**

You assemble primitives (striping, mirroring, parity, spans); the engine pattern-matches the
resulting tree and tells you the level + *why*. This is the antidote to the linear quiz and
the thing that turns "guide + quiz" into a game.

---

## 2. The two axes

The domain splits into two **independent** axes. Keeping them separate is what makes the
resource-file approach hold.

| Axis | What it is | What it determines | Notes source |
|------|-----------|--------------------|--------------|
| **A. Control path** | disks → backplane → HBA → RAID engine → PCIe → CPU → OS | hardware / software / fake RAID + which OS | `hardware/software/fake-raid.md`, `protocolli-dischi.md`, RIEPILOGO image |
| **B. Data layout** | striping, mirror, parity, placement algorithm, nesting | the RAID *level* + the **animation** | `distribuzione-segmenti-algoritmi.md`, `segment-allocation-rule-left-symmetric.md`, `nested-raids.md` |

They are orthogonal: *RAID 6 left-symmetric* can run on hardware **or** software. A build is
**a control path (axis A) carrying a data layout (axis B).**

A **third axis — runtime behavior** (drive states, hot-spare rebuild, failure simulation;
`drive-states.md`) — is explicitly **out of scope** for v1, designed as a separate future module.

### Axis A — the key insight from the RIEPILOGO diagram

Hardware / software / fake RAID are **not three different things**. They are the *same physical
path* with the **RAID engine ("motore RAID") placed at a different point**:

```
Dischi (SATA/SAS/NVMe) → Backplane → HBA → [PCIe bus] → CPU → OS
                                       ▲        ▲          ▲
                              hardware │   fake │    software│
                              (RoC on  │  (chip │   (mdadm/  │
                               PCIe    │   near │    ZFS /   │
                               card    │   CPU, │  StorageSp)│
                               incl.   │  Intel │            │
                               HBA)    │   RST) │            │
```

- **Hardware** — RoC on a dedicated PCIe controller that *includes* the HBA; OS sees one Virtual Drive. (MegaRAID/Broadcom)
- **Fake** — HBA passes raw protocol; RoC is a dedicated chip on/near the CPU. (Intel RST)
- **Software** — no RoC hardware; the OS computes it (Linux `mdadm`/ZFS, Windows Storage Spaces); needs a UPS for power-loss protection.
- **NVMe** — special case: bypasses backplane + controller, talks straight on PCIe.

**Game consequence:** the player does not label the RAID type — they *place the engine on the
path*, and the placement **is** the type.

---

## 3. The data model — one recursive tree

The single most important decision. An **array** does not contain disks; it contains **members**,
and a member is **either a disk or another array**. Recursion gives nested RAID (10, 50, 60, 6+0)
*for free* — build the mattone once, compose forever.

```
Node =
  | Disk  { id, sizeGB, protocol: SATA|SAS|NVMe, backplaneId }
  | Array { layout, members: Node[], algorithm? }

layout ∈ { stripe, mirror, parity1, parity2, concat }
```

- `Array.members` may be `Disk`s (a leaf array, e.g. a single RAID-5 span) or other `Array`s
  (a nesting array, e.g. the RAID-0 stripe over two RAID-5 spans → RAID 50).
- `algorithm` (axis B placement rule) attaches to the array whose `layout` needs one
  (parity arrays → left/right symmetric/asymmetric; mirror arrays → near/far/offset).

### Worked example — RAID 50 (from `nested-raids.md`)

```
Array { layout: stripe }                      ← top: RAID 0 across spans
 ├─ Array { layout: parity1, algo: right-asymmetric, members: [D1,D2,D3,D4] }   ← span A (RAID 5)
 └─ Array { layout: parity1, algo: right-asymmetric, members: [D5,D6,D7,D8] }   ← span B (RAID 5)
```

This same shape, with `parity1`→`parity2`, is RAID 60. With the spans being `mirror`, it is RAID 10.

---

## 4. Deriving the RAID level (axis B → name)

The engine recognizes the level by **pattern-matching the tree shape**. A small, ordered
recognizer (first match wins):

| Tree shape | Derived level |
|-----------|---------------|
| single array, `concat`, members = disks | **JBOD / spanned** (not RAID) |
| single array, `stripe`, members = disks | **RAID 0** |
| single array, `mirror`, members = disks | **RAID 1** (RAID 1E if odd-count interleaved) |
| single array, `parity1`, members = disks | **RAID 5** |
| single array, `parity2`, members = disks | **RAID 6** |
| `stripe` over `mirror` arrays | **RAID 10** (1+0) |
| `stripe` over `parity1` arrays | **RAID 50** |
| `stripe` over `parity2` arrays | **RAID 60** |
| anything else | **custom / unrecognized** (sandbox still shows the data layout) |

> **[DECISIONE — CONFERMATA]** A valid composition with no standard name is **allowed and
> animated** in sandbox: *anything without a violated constraint can be built.* The recognizer
> emits an explicit status flag so the UI can react:
>
> ```
> recognized:   { level: "RAID 50", confidence: exact }
> unrecognized: { level: null, flag: "non-standard-config",
>                 message: "Valid build with no canonical RAID name — here's how data lands." }
> ```
>
> The `unrecognized` flag is a **first-class result, not an error**: validation (constraints)
> and recognition (naming) are separate steps. A build can be fully valid *and* unnamed.

---

## 5. The three resource families

Axis structure maps to **three independent kinds of YAML file**. Adding capability = adding a
file in the right family, ideally with **no engine change**.

```
data/
  components/      ← axis A: physical pieces + connectivity + constraints
  algorithms/      ← axis B: data-placement rules + animation descriptor
  raid-levels/     ← topology requirements expressed over the two above
  challenges/      ← prompt-mode scenarios (already exists, extended)
```

### 5a. Component resource — schema (proposal)

A component declares an **interface**: what it *provides* and what it *requires*. The engine
validates the canvas graph by matching provides↔requires. Example (`components/hba.yaml`):

```yaml
id: hba
name: HBA (Host Bus Adapter)
category: connectivity
description: Translates SATA/SAS electrical protocol. Passes commands unchanged.
provides:
  - capability: protocol-translation
    protocols: [SATA, SAS]
requires:
  - capability: pcie-slot          # must connect upward to a PCIe bus
constraints:
  - rule: not-raid-capable         # an HBA alone cannot host the RAID engine
popup: { ...explanatory text, reuses existing popup format... }
```

Sketch of the component set (granularity: **down to the HBA**, per author's intent):

| id | provides | key constraint |
|----|----------|----------------|
| `disk-sata` / `disk-sas` / `disk-nvme` | block-storage | nvme bypasses backplane; sas supports dual-port |
| `backplane` | passive-routing | members of one span *should* span different backplanes (fault tolerance) |
| `hba` | protocol-translation | not RAID-capable |
| `controller-hw` | raid-engine + protocol-translation (includes HBA) | hosts RoC → hardware RAID |
| `cpu-chip-raid` | raid-engine (fake) | Intel RST → fake RAID |
| `os-linux` / `os-windows` | raid-engine (software) | mdadm/ZFS · Storage Spaces; needs UPS |

### 5b. Algorithm resource — schema (proposal)

Carries the placement rule **and** the animation. Example, the default
(`algorithms/left-symmetric.yaml`), straight from `segment-allocation-rule-left-symmetric.md`:

```yaml
id: left-symmetric
name: Left Symmetric
appliesTo: [parity1, parity2]        # which layouts can use it
default: true
description: Parity rotates leftward; data starts right of parity and wraps.
pros: [best sequential-read continuity, balanced parity load]
cons: []
placement:                            # the two-step rule, as data
  parity:
    start: rightmost                  # stripe 0: parity on rightmost disk
    rotate: left                      # shifts left each stripe
  data:
    start: right-of-parity            # first data block right of last parity
    direction: right
    wrap: true                        # wrap-around at right edge
```

> **[DECISIONE — CONFERMATA]** The engine has a small library of **parametric placement
> primitives** (`stripe`, `mirror-near/far/offset`, `parity-rotate`) that read these descriptors.
> A *variant* algorithm = a new file. A *radically new* placement = a new file + a new primitive.
> ~90% data-driven, not 100% — accepted.
>
> **Graceful degradation is a hard requirement.** The engine must not break when an algorithm
> file references a primitive that does not exist, or when an algorithm is missing entirely:
>
> - Unknown primitive → fall back to the layout's **default** algorithm (e.g. `left-symmetric`
>   for parity, `near` for mirror) and surface a non-blocking notice.
> - Missing/empty descriptor → still build the topology and derive the level; only the
>   *animation* is skipped (with a "placement detail unavailable" note), never the whole view.
>
> Rationale: the author's notes are not guaranteed complete. The system must stay generic and
> additive — a half-specified algorithm degrades, it does not crash.

Algorithms to cover (from `distribuzione-segmenti-algoritmi.md`): left/right · symmetric/asymmetric,
RAID10 near/far/offset, RAID1E, dRAID, erasure coding (k+m). v1 need not implement all — the
schema must *accommodate* all, and the engine must tolerate any of them being absent.

### 5c. RAID-level resource — schema (proposal)

Declares topology requirements, expressed over layouts + min disks. Example
(`raid-levels/raid6.yaml`):

```yaml
id: raid6
name: RAID 6
shape: { layout: parity2, members: disks }   # matched by the recognizer (§4)
minDisks: 4
faultTolerance: 2
parity: { type: distributed, count: 2, algorithm: galois-field-Q }
capacityFormula: "(n − 2) × diskSize"
defaultAlgorithm: left-symmetric
```

---

## 6. Constraint vocabulary (from the notes)

The constraint engine evaluates these over the tree/graph. Each lives **on a resource**, not in
a central rulebook — that's what keeps "add a file" honest.

| Constraint | Source | Type |
|-----------|--------|------|
| min disks per level (5≥3, 6≥4, 10≥4 even…) | raid-types | hard |
| a partial Virtual Drive must cover **all disks of the group** | `terminologia.md` | hard |
| nesting with RAID 0 requires the span be **fully** virtualized | `nested-raids.md` | hard |
| a span is a **subset** of a drive group (→ "3 of 4" is allowed) | `terminologia.md` | hard (answers a key question) |
| mirror needs even disk count (odd → RAID 1E, niche) | `distribuzione-segmenti-algoritmi.md` | hard |
| RAID engine must sit at exactly one point on the path | RIEPILOGO image | hard (determines hw/sw/fake) |
| NVMe bypasses backplane + controller | `protocolli-dischi.md` | hard |
| members of a span *should* span different backplanes | `terminologia.md` | **soft** (best practice / warning) |
| hot-spare capacity ≥ coerced capacity of failed disk | `terminologia.md` | runtime module — deferred |

**[DECISIONE]** Prompt mode *blocks* on hard constraints step-by-step; sandbox *allows the
mistake* and explains why it's invalid. Same validator, different enforcement timing. Soft
constraints are warnings in both. Confirm.

---

## 7. The animation (axis B, made visible)

The author's goal — *"see the order in which data lands on the disks"* — is driven entirely by
the algorithm's `placement` descriptor. The current `animateWrite` (`engine.js`) already does a
primitive version via `animOrder`; the generalized animator interprets the descriptor to compute,
per stripe, the `(disk, role: data|parity|mirror, sequence)` mapping, then plays it.

`segment-allocation-rule-left-symmetric.md` is the worked reference: its two tables (parity
placement, then data fill with wrap-around) are exactly what the animator must reproduce — and the
two-span example there is the RAID-50 case from §3.

---

## 8. Terminology (locked, from `terminologia.md`)

```text
Physical disks
   ↓
Drive Group        ← controller gathers the disks here
   ↓
Span(s)            ← subset(s) of the drive group; each can carry its own layout
   ↓
Virtual Drive (VD) ← logical volume exposed to the OS
```

- **Stripe width** ≠ disk count necessarily; **stripe size** = interleaved segment length
  (excl. parity); **strip size** = segment on a single drive.
- Disk striping/mirroring/parity/spanning definitions, parity types (dedicated/distributed),
  hot-spare types (global/dedicated) → see notes; folded into component/algorithm popups.

---

## 9. Open decisions (collected)

1. ~~**[§4]** Allow + animate unrecognized-but-valid compositions?~~ **RESOLVED: yes**, via an explicit `non-standard-config` flag (recognition ≠ validation).
2. ~~**[§5b]** Accept ~90% data-driven?~~ **RESOLVED: yes**, with graceful degradation as a hard requirement (engine never crashes on a missing/partial algorithm).
3. ~~**[§6]** Prompt = block step-by-step, sandbox = allow + explain?~~ **RESOLVED: yes** (exact UI to be designed later).
4. ~~Component granularity: model backplane-diversity?~~ **RESOLVED:** backplane exists as a path node from v1; the **diversity soft-rule is deferred** (additive — a file + one soft constraint, touches nothing in the core).
5. ~~Migration: rebuild Build tab or new tab?~~ **RESOLVED: build new.** No retrofit of the linear quiz. Reuse `styles.css` + the shared infrastructure (YAML loader, popup, KaTeX) only — those are engine, not quiz. The quiz is retired.

---

## 10. Relationship to existing code

**Decision: build new, do not retrofit the quiz (§9.5).**

- **Reuse:** `styles.css` and the shared infrastructure — the YAML loader (`loadYaml`/`Cache`),
  the popup system (`openPopup`/dismiss), KaTeX rendering. These are engine, not quiz.
- **Retire:** the linear Build quiz (`renderBuildUI`/`validateBuild`/drag-drop-to-count) and the
  bespoke `RAID_LAYOUTS` + `buildRaid10*` family — they are the symptom of a **non-recursive**
  model and have no place in the composition approach.
- **Subsume:** the **Visualize** static gallery becomes the *output of a build* — a composed tree
  produces the very animation the gallery used to show pre-canned. It can remain during transition.
- **New home:** a new module (tab or page) is the centerpiece. The Knowledge Base / intro content
  stays as reference.

---

## 11. Build roadmap (phased)

Ordered so each phase is testable and the *overall sense stays visible* while we break it into pieces.
Each phase ends in something runnable.

| Phase | What | Why this order |
|-------|------|----------------|
| **0 — Scaffold** | New module: empty canvas + sidebar shells, reusing `styles.css` + loader + popup + KaTeX. | Establishes the new home without touching the old quiz. |
| **1 — Model + recognizer** (headless) | The recursive `Disk`/`Array` tree (§3); the level recognizer with `non-standard-config` flag (§4); derived capacity + fault-tolerance. | The brain. Pure logic, testable with no UI — *"build this tree → what is it?"* |
| **2 — Layout + animation** | Parametric primitives (`stripe`, `parity-rotate`, `mirror-near`) reading `placement` descriptors (§5b); graceful degradation. Start: left-symmetric + stripe + mirror-near. | Makes axis B *visible*; the animator becomes the verifier of the notes' tables (§7). |
| **3 — Canvas build** | Drag components from sidebar; group disks into spans; nest arrays. Produces a tree → feeds phases 1 + 2 live. | The interactive heart. Composition replaces selection. |
| **4 — Control path** (axis A) | Place disks→backplane→HBA→engine→OS; engine placement ⇒ hardware/software/fake (§2). Backplane = single node (diversity deferred). | The hw/sw/fake distinction the author cares about. |
| **5 — Constraints + two modes** | Validator (hard/soft, §6); sandbox = allow + explain; prompt = block step-by-step + "client" scenarios. | Turns the builder into a *game*. |
| **— Deferred module** | Runtime: drive states, hot-spare rebuild, failure simulation (`drive-states.md`). Backplane diversity soft-rule. | Separate axis (§2); additive, not blocking. |

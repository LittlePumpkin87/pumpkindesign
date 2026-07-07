# 🕸️ Spiderweb Component — Explained

This doc explains **what happens where** in the spiderweb component, so you can understand and adapt
it.

---

## 1. What is it?

An interactive **SVG spider web** with tech skills hanging in it as icons. When you hover a
**main skill**, a glowing line (the "glow") **crawls along the web** to its **subskills**, which fade
in one after another as it arrives. At the same time the strands **wobble** slightly, as if plucked.
All without an external animation library — just a small physics loop, a graph search, and CSS.

At rest **only the main skills** hang in the web (kept tidy); the subskills appear on hover.

---

## 2. Files at a glance

| File | Role |
|---|---|
| [`spiderweb.ts`](./spiderweb.ts) | **Component**: view & interaction only — signals, hover/click handlers, template helpers. Owns the simulation and calls `buildGlow`. |
| [`spiderweb.html`](./spiderweb.html) | The **hand-drawn SVG**: base web paths, glow overlay layer, skill nodes, reveal loop, info box. |
| [`spiderweb.scss`](./spiderweb.scss) | Styling: pale web, `.glow`, `.glow-line` (crawl keyframe), `.sub-reveal` (fade-in). |
| [`spiderweb.simulation.ts`](./spiderweb.simulation.ts) | **`SpiderWebSimulation`** (Angular-free): physics bodies + requestAnimationFrame loop + kicks; reports frames via the `onFrame` callback. |
| [`spiderweb.glow.ts`](./spiderweb.glow.ts) | **Glow route building** (pure function `buildGlow`): main → subskills over the graph, as timed `GlowSegment[]` + reveals. |
| [`spiderweb.config.ts`](./spiderweb.config.ts) | **Pure geometry data**: `WOBBLE_THREAD_GEOMETRY`, `CHAIN_GROUPS` (+`simulationKind`), `ROCK_GROUPS`, `PATH_ANCHORS`. |
| [`spiderweb.routing.ts`](./spiderweb.routing.ts) | **Graph + Dijkstra** (`routeSegments`) — finds the glow path through the web. |
| [`spiderweb.physics.ts`](./spiderweb.physics.ts) | **Spring simulation**: `ThreadPendulum`, `RockingChain`, `PinnedChain` + junction coupling. |
| [`../../../interfaces/spiderweb.interface.ts`](../../../interfaces/spiderweb.interface.ts) | Shared interfaces: `ThreadFrame`, `LinkChain`, `ChainGeometry`, `GlowSegment`, `WebEdge`, `RouteSegment`, … |
| [`../../../mapper/spiderweb.mapper.ts`](../../../mapper/spiderweb.mapper.ts) | Turns the Strapi response into `Skill[]`. |
| [`../../../interfaces/organism.interface.ts`](../../../interfaces/organism.interface.ts) | The `Skill` interface. |

**Separation in a nutshell:** `config.ts` = *data*, `routing.ts` = *path-finding*, `physics.ts` =
*motion*, `simulation.ts` = *physics orchestration + loop*, `glow.ts` = *glow routes*, `spiderweb.ts` =
*view & interaction*, `.html`/`.scss` = *presentation*.

**Simulation ↔ Component:** `SpiderWebSimulation` is Angular-free and owns the requestAnimationFrame
loop. After each frame it builds **new** frame objects (`threadFrames`/`chainFrames`) and calls the
`onFrame` callback; the component pushes those into its signals (new reference → change detection
fires). The component calls `simulation.kick(litPaths)` (from the `effect`) and `simulation.stop()`
(in `ngOnDestroy`).

---

## 3. Data flow (from Strapi to the icon)

```
Strapi                         Angular
┌─────────────────────────┐    ┌───────────────────────────────────────────┐
│ skill collection         │    │ router.ts builds auto-populate             │
│ spider_tech_web comp.    │──▶ │  /api/page-by-path?path=/                  │
│  └─ skills[] (relation)  │    │        │                                   │
└─────────────────────────┘    │        ▼                                   │
                               │ mapSpiderwebData()  →  Skill[]             │
                               │        │                                   │
                               │        ▼                                   │
                               │ <lpd-spider-web [skills]="…">              │
                               │   → renders nodes + glow + physics         │
                               └───────────────────────────────────────────┘
```

- **Strapi**: each skill is an entry in the `skill` collection. The home-page component
  `spider_tech_web` has a `skills` relation — **that list** determines which icons hang in the web.
- **`router.ts`** (Strapi, `src/api/router/controllers/router.ts`) auto-populates deep enough,
  including `logo` and `subskills`.
- **`mapSpiderwebData`** turns that into flat `Skill` objects (position, `connectedPathIds`, nested
  `subskills`, image URL).
- **`SpiderWebComponent`** receives this as its `skills` input and renders.

> ⚠️ Important: **one node is rendered per top-level skill** in `skills`. Nested subskills get **no**
> permanent node of their own — they appear only when their main is hovered (see §4c).

---

## 4. The three subsystems

### a) Physics — why the web wobbles · [`spiderweb.physics.ts`](./spiderweb.physics.ts)

Everything is based on the same **damped spring** (Hooke's law + friction), integrated with the
**semi-implicit Euler method**:

```
acceleration = -stiffness * (x - rest)  -  damping * velocity
velocity += acceleration * dt      // velocity first …
x        += velocity * dt          // … then move the position
```

A "kick" injects velocity, the spring pulls back, damping bleeds off energy → it overshoots a little
and settles. `step()` returns `false` once the motion falls below a threshold — then the animation
loop **sleeps** again.

**Three body types** (differing only in *what* oscillates):

| Type | Ends | Motion | Used for |
|---|---|---|---|
| `ThreadPendulum` | 1 fixed (top) | angle swings | the hanging icon threads |
| `RockingChain` | **both fixed** | only the bow bulges | horizontal arcs + connectors (`simulationKind: 'rock'`) |
| `PinnedChain` | **both fixed** | a coherent wave travels through | the radial spokes (`simulationKind: 'pinned'`) |

- Which type is used is decided by the **`simulationKind` flag** in `CHAIN_GROUPS` (see `buildChain()`
  in [`spiderweb.simulation.ts`](./spiderweb.simulation.ts)).
- **`PinnedChain`** confines the wave to the **lit run** (the kicked segments) and holds both ends
  fixed → the spoke wobbles only where the glow runs, and doesn't whip at the branch end.
- **Junction coupling**: when a `PinnedChain` moves a shared junction point, the arcs/connectors
  attached there follow it slightly (via `publishShifts` / `junctionShiftAt`), so nothing visually
  detaches. Order per frame: first all `PinnedChain`s publish their shifts, then the other strands
  build their frames on top.
- **`restBow`**: many original paths are real Bézier curves. The resting curvature (`restBows` in
  `config.ts`) is preserved so a strand looks unchanged at rest; the wave just rides on top.
- The loop (`tick`, in `simulation.ts`) runs only while something moves (performance) and goes to
  sleep once every body is below the threshold.

### b) Glow routing — the path through the web · [`spiderweb.routing.ts`](./spiderweb.routing.ts)

The web is translated into a **graph**: crossing points = nodes, segments = weighted edges (weight =
pixel length). Node identity comes from **bucketing** (rounding to a 5px grid), so two segment ends at
the same point collapse into one node. Thread anchors are additionally **snapped** to the nearest real
node (`SNAP_TOL`) in case they sit just next to a grid line.

`routeSegments(main, sub)` then runs **Dijkstra** (shortest path) between the two icons. Because both
icons sit *out* in the web (not at the centre), the shortest path hops a horizontal arc instead of
going through the centre — which is why the glow no longer funnels through the middle. A small
**random jitter** (`ROUTE_JITTER`) makes near-equal routes vary slightly per hover.

Each route yields its segments **in travel order** with a `reversed` flag (which end the segment must
be drawn from). In [`spiderweb.glow.ts`](./spiderweb.glow.ts) this becomes the **crawl animation**:
per segment `delay` (= sum of the preceding durations → flows one after another), `duration` (∝ length,
constant speed via `GLOW_SPEED`) and `drawDirection`. It's rendered as an **overlay layer** on top of
the unchanged web, so the pale web stays visible.

### c) Hover reveal — showing subskills · [`spiderweb.ts`](./spiderweb.ts) + `.html`/`.scss`

- On hovering a main, `buildGlow()` computes the routes **and** records each subskill's **arrival
  time** of the glow.
- `onHover` sets the **`subReveal`** signal (list of subskills + delay); the second `@for` block in
  [`spiderweb.html`](./spiderweb.html) renders their icons at their `connectedPathIds` positions.
- The CSS `.sub-reveal` (keyframe `sub-fade-in`) fades each icon in with `--reveal-delay` = arrival
  time → the icon appears exactly when the glow arrives.
- `onLeave` clears everything again. The revealed subskills are **display only** (no hover of their
  own); the info box shows the hovered main.
- **Click/tap pins** (`onSelect`): a click on a main opens the info box **and** keeps the glow up —
  while the box is open, `onHover`/`onLeave` ignore other skills so the selection isn't disturbed. On
  touch (no `mouseenter`) the tap is what lights the web in the first place. Clicking the same main
  again closes the box and clears the glow.
- **Duplicate-icon guard** (`buildGlow`): if a subskill is itself a main (already hanging as a
  permanent node in the web), its reveal is skipped — otherwise a second icon would sit on top. Its
  glow route is still drawn.

---

## 5. Strapi content model — how to add skills

**Fields of a `skill`:** `name`, `uid` (from `name`), `logo` (image), `position_x`/`position_y`,
`connectedPathIds` (attach point), relations `subskills` and `skills`.

**Rules so everything shows up:**
1. Put **only main skills** into the `skills` list of the `spider_tech_web` component.
2. Attach the remaining skills **only** as a **`subskills` relation** on their main — they appear
   automatically on hover.
3. Every skill (main + sub) needs a **unique `connectedPathIds`**. If it's missing, the skill lands on
   the default **(185, 183) = centre** and stacks up there with others.
4. Skills must be **Published** (the API doesn't return drafts).

**Available attach points (`connectedPathIds`):**
- 6 hanging threads for the "dangling" look: `subskill-1` … `subskill-6`.
- All others: chain IDs from `PATH_ANCHORS` (e.g. `top-middle-5`, `right-7`, `bottom-left-third-4`) —
  these icons sit directly on the web lines.

---

## 6. "Where do I change X?" — quick reference

| What you want | Where | Constant / spot |
|---|---|---|
| Radial spokes wobble more/less | `spiderweb.simulation.ts` | `kickImpulseFor()` (PinnedChain branch) |
| Wave frequency / decay of the spokes | `spiderweb.physics.ts` | `STRING_TENSION` / `STRING_DAMPING` |
| Glow crawl speed | `spiderweb.glow.ts` | `GLOW_SPEED` (px/s), `GLOW_MIN_DUR` |
| How much the route varies randomly | `spiderweb.routing.ts` | `ROUTE_JITTER` |
| Glow colour / thickness / halo | `spiderweb.scss` | `.glow-line` |
| Subskill fade-in duration | `spiderweb.scss` | `.sub-reveal` / `@keyframes sub-fade-in` |
| Icon size / "fit into the field" | `spiderweb.html` | `<image>` `width`/`height` + `preserveAspectRatio` |
| Thread anchor doesn't connect to the web | `spiderweb.routing.ts` | increase `SNAP_TOL` (snap radius) |
| Strand should have fixed ends instead of swinging freely | `spiderweb.config.ts` | `simulationKind: 'rock'` or `'pinned'` on the group |

---

## 7. Glossary

- **Dijkstra** — the classic *shortest-path* algorithm on a weighted graph: it always takes the
  nearest unvisited node and updates ("relaxes") its neighbours' distances, until the goal is settled.
- **Bucketing** — rounding coordinates onto a grid so that near-identical points get the same key
  (= the same node).
- **Semi-implicit Euler integration** — a simple time-step method: update the velocity first, then move
  the position with the *new* velocity — more stable than "plain" Euler.
- **Quadratic Bézier** — SVG curve `M sx sy Q cx cy ex ey`: from start to end, bent toward a control
  point.
- **`preserveAspectRatio`** — `meet` = fit the whole image (nothing cropped, `object-fit: contain`);
  `slice` = fill the frame, crop the overflow (`object-fit: cover`).

import { Component, input, signal, computed, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Skill } from '../../../interfaces/organism.interface';
import {
  CHAIN_GROUPS,
  PATH_ANCHORS,
  ROCK_GROUPS,
  WOBBLE_THREAD_GEOMETRY,
} from './spiderweb.config';
import { routeSegments } from './spiderweb.routing';
import {
  LinkChain,
  ThreadFrame,
  ThreadPendulum,
  RockingChain,
  PinnedChain,
  resetJunctionShifts,
  ChainGeometry,
} from './spiderweb.physics';

/** Build the right physics body for a CHAIN_GROUPS entry based on its `sim` discriminator. */
function buildChain(sim: 'pinned' | 'rock', geometry: ChainGeometry): LinkChain {
  return sim === 'pinned' ? new PinnedChain(geometry) : new RockingChain(geometry);
}

/** Locates a path id within the physics model: which chain (group) and which link inside it. */
interface ChainLinkRef {
  group: number;
  link: number;
}

/** One segment of a crawling glow route: when it starts drawing, how long it takes, and the
 *  stroke-dashoffset start sign so it reveals from the end that joins the previous segment. */
interface GlowSeg {
  id: string;
  delay: number;
  dur: number;
  from: 1 | -1;
}

const GLOW_SPEED = 600;
const GLOW_MIN_DUR = 0.08;

// All simulated strands in one array; the index into it lines up with `chains` in the component.
// CHAIN_GROUPS come first, then ROCK_GROUPS, so `group >= CHAIN_GROUPS.length` means "a rocking one".
const ALL_GROUPS = [...CHAIN_GROUPS, ...ROCK_GROUPS];

// Reverse lookup: path id -> which chain/link it is, so kicking a lit segment finds its body in O(1).
const PATH_ID_TO_LINK: Record<string, ChainLinkRef> = Object.fromEntries(
  ALL_GROUPS.flatMap((group, groupIndex) =>
    group.pathIds.map((id, linkIndex) => [id, { group: groupIndex, link: linkIndex }]),
  ),
);

/** A randomly-signed impulse in ±[base, base+spread], so each kick swings a different way/strength. */
function randomSignedImpulse(base: number, spread: number): number {
  return (Math.random() > 0.5 ? 1 : -1) * (base + Math.random() * spread);
}

/**
 * Renders the spider web as an SVG and brings it to life. Three jobs:
 *   1. Owns the physics bodies (threads/chains) and a requestAnimationFrame loop that steps them and
 *      publishes their current SVG paths into the `threadFrames`/`chainFrames` signals.
 *   2. On hover of a main skill, computes the glow route(s) to its subskills (buildGlow) and exposes
 *      them via `glowOverlay` (the crawling overlay layer).
 *   3. Positions each skill icon on the (moving) web via `nodePosition`.
 * The template binds to the signals, so the view re-renders automatically as state changes.
 */
@Component({
  selector: 'lpd-spider-web',
  templateUrl: './spiderweb.html',
  styleUrl: './spiderweb.scss',
  standalone: true,
  imports: [CommonModule],
})
export class SpiderWebComponent implements OnDestroy {

  skills = input<Skill[]>();

  // The main skill whose info box is open. Only ever set by a click/tap on a main skill — never by
  // hover — so the box appears on click, not on pure hover. null = no box.
  selectedSkill = signal<Skill | null>(null);

  /* ============================ PHYSICS STATE =============================
   * (Declaration order matters: `threadFrames` reads `threads`, `chainFrames` reads `chains`.) */

  // One physics body per hanging thread, keyed by path id (e.g. "subskill-3").
  private readonly threads: Record<string, ThreadPendulum> = Object.fromEntries(
    Object.entries(WOBBLE_THREAD_GEOMETRY).map(([id, geometry]) => [
      id,
      new ThreadPendulum(geometry),
    ]),
  );

  // Current SVG path per thread id; the template binds <path [attr.d]> to this. Updated each frame.
  threadFrames = signal<Record<string, ThreadFrame>>(
    Object.fromEntries(Object.entries(this.threads).map(([id, thread]) => [id, thread.frame()])),
  );

  // The chain bodies, same order as ALL_GROUPS. Each CHAIN_GROUPS entry picks its simulation via `sim`:
  // 'pinned' = PinnedChain (both ends fixed, a coherent wave travels between them — the anchor radials);
  // 'rock' = RockingChain (every endpoint fixed, only the bow oscillates — the structural connectors).
  // ROCK_GROUPS (the horizontal arcs) are RockingChain too.
  private readonly chains: LinkChain[] = [
    ...CHAIN_GROUPS.map((group) => buildChain(group.sim, group.geometry)),
    ...ROCK_GROUPS.map((group) => new RockingChain(group.geometry)),
  ];

  // Current SVG path per chain-segment id; see computeChainFrames for how groups map to ids.
  chainFrames = signal<Record<string, ThreadFrame>>(this.computeChainFrames());

  private previouslyActive = new Set<string>(); // lit ids from the last change, to detect NEW ones
  private rafId: number | null = null; // active animation-frame handle, or null when idle
  private lastTime = 0; // timestamp of the previous tick, for computing dt

  /* ============================= GLOW STATE ===============================
   * (`litPaths` reads both signals below it, so they're declared first.) */

  // The crawling glow route(s), rendered as a separate overlay layer above the untouched web.
  glowOverlay = signal<GlowSeg[]>([]);

  // Subskill icons revealed while their main is hovered, each with a fade-in delay matched to when the
  // glow reaches it. Empty when nothing is hovered, so at rest the web shows only the main skills.
  subReveal = signal<{ skill: Skill; delay: number }[]>([]);

  // The lit overlay segments' ids, used only to kick the physics threads/chains they belong to.
  private readonly litPaths = computed(
    () => new Set<string>(this.glowOverlay().map((s) => s.id)),
  );

  /* ============================== LIFECYCLE =============================== */

  constructor() {
    // Whenever the set of lit paths changes, give any NEWLY lit strand a kick so it visibly wobbles.
    // Reads the `litPaths` signal, so Angular re-runs this automatically on every hover.
    effect(() => {
      const active = this.litPaths();
      this.kickNewlyActiveThreads(active);
      this.kickNewlyActiveChains(active);
      this.previouslyActive = active;
    });
  }

  // Stop the animation loop if the component is destroyed mid-wobble (avoids a dangling rAF).
  ngOnDestroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
  }

  /* ===================== PHYSICS: animation loop & kicks ===================== */

  // Start the rAF loop if it isn't already running (kicks call this). `lastTime` seeds dt.
  private startLoop(): void {
    if (this.rafId !== null) return;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  // One animation frame: advance every body by dt, republish the frame signals, and reschedule
  // ourselves only while something is still moving — so the loop sleeps once the web has settled.
  private readonly tick = (now: number): void => {
    // Seconds since last frame, clamped so a long pause (tab in background) can't make bodies jump.
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    let anyMoving = false;
    const frames: Record<string, ThreadFrame> = {};
    for (const [id, thread] of Object.entries(this.threads)) {
      const moving = thread.step(dt);
      anyMoving = anyMoving || moving;
      frames[id] = thread.frame();
    }
    this.threadFrames.set(frames);

    for (const chain of this.chains) {
      const moving = chain.step(dt);
      anyMoving = anyMoving || moving;
    }
    this.chainFrames.set(this.computeChainFrames());

    this.rafId = anyMoving ? requestAnimationFrame(this.tick) : null;
  };

  // Flatten the chain bodies into a path-id -> frame map the template can look up directly.
  // A single-id group renders as one combined <path>; a multi-id group gives one frame per link id.
  private computeChainFrames(): Record<string, ThreadFrame> {
    // First let the pinned (wave) strands publish their moving junctions, so every other strand can
    // follow those junctions when building its own frame below — keeps crossings visually connected.
    resetJunctionShifts();
    for (const chain of this.chains) {
      if (chain instanceof PinnedChain) chain.publishShifts();
    }

    const result: Record<string, ThreadFrame> = {};
    ALL_GROUPS.forEach((group, i) => {
      const chain = this.chains[i];
      if (group.pathIds.length === 1) {
        result[group.pathIds[0]] = chain.combinedFrame();
      } else {
        chain.frame().forEach((frame, link) => {
          result[group.pathIds[link]] = frame;
        });
      }
    });
    return result;
  }

  // Kick each thread that just became lit (and wasn't before). Only newly-lit ones, so re-renders
  // during an ongoing wobble don't re-kick it.
  private kickNewlyActiveThreads(active: Set<string>): void {
    for (const id of Object.keys(this.threads)) {
      if (active.has(id) && !this.previouslyActive.has(id)) {
        this.threads[id].kick(randomSignedImpulse(1.6, 0.8));
        this.startLoop();
      }
    }
  }

  // Same for chain segments. A path id maps to (chain, link) via PATH_ID_TO_LINK. The impulse scale
  // differs per body type: RockingChain and PinnedChain both move a pixel distance (bow / transverse
  // displacement), so the kick is sized to that.
  private kickNewlyActiveChains(active: Set<string>): void {
    for (const id of active) {
      const ref = PATH_ID_TO_LINK[id];
      if (!ref || this.previouslyActive.has(id)) continue;

      const chain = this.chains[ref.group];
      const impulse = this.kickImpulseFor(chain);
      chain.kick(impulse, ref.link);
      this.startLoop();
    }
  }

  private kickImpulseFor(chain: LinkChain): number {
    if (chain instanceof PinnedChain) return randomSignedImpulse(50, 25); // transverse wave velocity (subtle)
    return randomSignedImpulse(120, 60); // RockingChain bow velocity
  }

  /* ===================== GLOW: route building (per hover) ===================== */

  /**
   * onHover(main) -> buildGlow: for a main skill we route main -> each subskill via routeSegments()
   * and turn each route into timed GlowSeg[] (see addSubskillRoute for the crawl timing).
   * The result feeds `glowOverlay` (the crawling overlay layer), rebuilt on every hover, which is
   * what re-rolls the routes.
   */
  private buildGlow(skill: Skill): {
    overlay: GlowSeg[];
    reveals: { skill: Skill; delay: number }[];
  } {
    const mainId = skill.connectedPathIds?.trim();
    const byId = new Map<string, GlowSeg>();
    const reveals: { skill: Skill; delay: number }[] = [];

    if (mainId && skill.isMainSkill && skill.subskills) {
      for (const sub of skill.subskills) {
        const arrival = this.addSubskillRoute(mainId, sub, byId);
        reveals.push({ skill: sub, delay: arrival });
      }
    }

    return { overlay: [...byId.values()], reveals };
  }

  /**
   * Turn one main -> subskill route into timed segments that draw on one after another (the "crawl").
   * Walking the route in travel order we accumulate `time`: each segment's `delay` is the sum of the
   * durations before it, so it only starts drawing once the previous segment has finished — that's
   * what makes the line flow instead of all segments blinking at once. `dur` is proportional to the
   * segment's length (constant speed across joins) with a floor so tiny segments still register, and
   * `from` (from the route's `reversed` flag) tells the CSS which end to reveal from.
   */
  /** Returns the time (s) at which the glow reaches this subskill — used to delay its icon reveal. */
  private addSubskillRoute(mainId: string, sub: Skill, byId: Map<string, GlowSeg>): number {
    const subId = sub.connectedPathIds?.trim();
    if (!subId) return 0;

    let time = 0;
    for (const seg of routeSegments(mainId, subId, Math.random)) {
      const dur = Math.max(GLOW_MIN_DUR, seg.len / GLOW_SPEED);
      this.mergeSeg(byId, { id: seg.pathId, delay: time, dur, from: seg.reversed ? -1 : 1 });
      time += dur; // next segment starts where this one ends -> one continuous line
    }
    return time; // total crawl time to this subskill
  }

  // A segment shared by two routes is drawn once; keep the earliest start so the crawl stays smooth.
  private mergeSeg(byId: Map<string, GlowSeg>, seg: GlowSeg): void {
    const existing = byId.get(seg.id);
    if (!existing || seg.delay < existing.delay) byId.set(seg.id, seg);
  }

  /* ===================== TEMPLATE HELPERS (positioning & overlay) ===================== */

  /**
   * Where to draw a skill's icon. If it hangs on a thread, follow the thread's LIVE end (so the icon
   * sways with it); if it's pinned to a chain segment, use that segment's static anchor; otherwise
   * fall back to the skill's own posX/posY.
   */
  nodePosition(skill: Skill): { x: number; y: number } {
    const threadId = skill.connectedPathIds?.trim();
    if (threadId) {
      if (this.threads[threadId]) {
        return this.threadFrames()[threadId]?.end ?? { x: skill.posX, y: skill.posY };
      }
      const anchor = PATH_ANCHORS[threadId];
      if (anchor) return anchor;
    }
    return { x: skill.posX, y: skill.posY };
  }

  /** Live path data for an overlay clone, so the glow stays glued to the wobbling web. */
  frameD(id: string): string | undefined {
    return this.threadFrames()[id]?.d ?? this.chainFrames()[id]?.d;
  }

  // Hands each segment's timing to the .glow-line overlay as CSS custom properties; the `glow-draw`
  // keyframe reads them to delay/duration/orient the draw-on (see spiderweb.scss).
  glowVars(seg: GlowSeg): Record<string, string> {
    return {
      '--glow-delay': `${seg.delay}s`,
      '--glow-dur': `${seg.dur}s`,
      '--glow-from': `${seg.from}`,
    };
  }

  /* ============================= INTERACTION HANDLERS ============================= */

  // Pointer enter / tap on a skill: rebuild the glow (rerolls the random route + restarts the crawl)
  // and reveal its subskills. Never opens the info box — that's click-only. Setting glowOverlay also
  // triggers the constructor effect, which kicks the lit strands.
  onHover(skill: Skill): void {
    const glow = this.buildGlow(skill);
    this.glowOverlay.set(glow.overlay);
    this.subReveal.set(glow.reveals);
  }

  // Pointer leaves a skill: clear the glow and the revealed subskills. The info box is click-
  // controlled, so it stays open until the skill is clicked again or another main skill is clicked.
  onLeave(): void {
    this.glowOverlay.set([]);
    this.subReveal.set([]);
  }

  // Click / tap on a MAIN skill: toggle its info box. Also (re)triggers the glow, so on touch — where
  // there is no mouseenter — a single tap both lights the web and opens the box (hover + click at
  // once). On desktop the box only ever opens here, never on pure hover.
  onSelect(skill: Skill): void {
    this.selectedSkill.update((current) => (current === skill ? null : skill));
    this.onHover(skill);
  }
}

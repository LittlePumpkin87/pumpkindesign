import { Component, input, signal, computed, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Skill } from '../../../interfaces/organism.interface';
import {
  CHAIN_GROUPS,
  PATH_ANCHORS,
  ROCK_GROUPS,
  WOBBLE_THREAD_GEOMETRY,
  routeSegments,
} from './spiderweb.config';
import {
  LinkChain,
  ThreadChain,
  ThreadFrame,
  ThreadPendulum,
  RockingChain,
} from './spiderweb.physics';

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

const GLOW_SPEED = 600; // px per second the draw-on travels
const GLOW_MIN_DUR = 0.08; // seconds, so very short segments still register

const ALL_GROUPS = [...CHAIN_GROUPS, ...ROCK_GROUPS];

const PATH_ID_TO_LINK: Record<string, ChainLinkRef> = Object.fromEntries(
  ALL_GROUPS.flatMap((group, groupIndex) =>
    group.pathIds.map((id, linkIndex) => [id, { group: groupIndex, link: linkIndex }]),
  ),
);

function randomSignedImpulse(base: number, spread: number): number {
  return (Math.random() > 0.5 ? 1 : -1) * (base + Math.random() * spread);
}

@Component({
  selector: 'lpd-spider-web',
  templateUrl: './spiderweb.html',
  styleUrl: './spiderweb.scss',
  standalone: true,
  imports: [CommonModule],
})
export class SpiderWebComponent implements OnDestroy {
  skills = input<Skill[]>();
  hoveredSkill = signal<Skill | null>(null);

  private readonly threads: Record<string, ThreadPendulum> = Object.fromEntries(
    Object.entries(WOBBLE_THREAD_GEOMETRY).map(([id, geometry]) => [
      id,
      new ThreadPendulum(geometry),
    ]),
  );

  threadFrames = signal<Record<string, ThreadFrame>>(
    Object.fromEntries(Object.entries(this.threads).map(([id, thread]) => [id, thread.frame()])),
  );

  private readonly chains: LinkChain[] = [
    ...CHAIN_GROUPS.map((group) => new ThreadChain(group.geometry)),
    ...ROCK_GROUPS.map((group) => new RockingChain(group.geometry)),
  ];

  chainFrames = signal<Record<string, ThreadFrame>>(this.computeChainFrames());

  private previouslyActive = new Set<string>();
  private rafId: number | null = null;
  private lastTime = 0;

  constructor() {
    effect(() => {
      const active = this.litPaths();
      this.kickNewlyActiveThreads(active);
      this.kickNewlyActiveChains(active);
      this.previouslyActive = active;
    });
  }

  private kickNewlyActiveThreads(active: Set<string>): void {
    for (const id of Object.keys(this.threads)) {
      if (active.has(id) && !this.previouslyActive.has(id)) {
        this.threads[id].kick(randomSignedImpulse(1.6, 0.8));
        this.startLoop();
      }
    }
  }

  private kickNewlyActiveChains(active: Set<string>): void {
    for (const id of active) {
      const ref = PATH_ID_TO_LINK[id];
      if (!ref || this.previouslyActive.has(id)) continue;

      const isRocking = ref.group >= CHAIN_GROUPS.length;
      const impulse = isRocking ? randomSignedImpulse(120, 60) : randomSignedImpulse(0.6, 0.3);
      this.chains[ref.group].kick(impulse, ref.link);
      this.startLoop();
    }
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
  }

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

  private startLoop(): void {
    if (this.rafId !== null) return;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  private readonly tick = (now: number): void => {
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
  private computeChainFrames(): Record<string, ThreadFrame> {
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

  // Statically-lit segments (manual glowPathIds override) -> base path [class.glow]. Empty for the
  // auto-routed crawl, which lives entirely in the overlay layer so the base web stays visible.
  activePaths = signal<Set<string>>(new Set<string>());

  // The crawling glow route(s), rendered as a separate overlay layer above the untouched web.
  glowOverlay = signal<GlowSeg[]>([]);

  // Union of both, used only to kick the physics threads/chains a lit segment belongs to.
  private readonly litPaths = computed(
    () => new Set<string>([...this.activePaths(), ...this.glowOverlay().map((s) => s.id)]),
  );

  /** Live path data for an overlay clone, so the glow stays glued to the wobbling web. */
  frameD(id: string): string | undefined {
    return this.threadFrames()[id]?.d ?? this.chainFrames()[id]?.d;
  }

  glowVars(seg: GlowSeg): Record<string, string> {
    return {
      '--glow-delay': `${seg.delay}s`,
      '--glow-dur': `${seg.dur}s`,
      '--glow-from': `${seg.from}`,
    };
  }

  private buildGlow(skill: Skill): { active: Set<string>; overlay: GlowSeg[] } {
    if (skill.glowPathIds.length) {
      return { active: new Set(skill.glowPathIds), overlay: [] };
    }

    const mainId = skill.connectedPathIds?.trim();
    const byId = new Map<string, GlowSeg>();

    if (mainId && skill.isMainSkill && skill.subskills) {
      for (const sub of skill.subskills) {
        this.addSubskillRoute(mainId, sub, byId);
      }
    }

    return { active: new Set<string>(), overlay: [...byId.values()] };
  }

  private addSubskillRoute(mainId: string, sub: Skill, byId: Map<string, GlowSeg>): void {
    const subId = sub.connectedPathIds?.trim();
    if (!subId) return;

    if (sub.glowPathIds.length) {
      sub.glowPathIds.forEach((id) =>
        this.mergeSeg(byId, { id, delay: 0, dur: GLOW_MIN_DUR, from: 1 }),
      );
      return;
    }

    let time = 0;
    for (const seg of routeSegments(mainId, subId, Math.random)) {
      const dur = Math.max(GLOW_MIN_DUR, seg.len / GLOW_SPEED);
      this.mergeSeg(byId, { id: seg.pathId, delay: time, dur, from: seg.reversed ? -1 : 1 });
      time += dur;
    }
  }

  private mergeSeg(byId: Map<string, GlowSeg>, seg: GlowSeg): void {
    const existing = byId.get(seg.id);
    if (!existing || seg.delay < existing.delay) byId.set(seg.id, seg);
  }

  onHover(skill: Skill): void {
    this.hoveredSkill.set(skill);
    const glow = this.buildGlow(skill);
    this.activePaths.set(glow.active);
    this.glowOverlay.set(glow.overlay);
  }

  onLeave(): void {
    this.hoveredSkill.set(null);
    this.activePaths.set(new Set<string>());
    this.glowOverlay.set([]);
  }
}

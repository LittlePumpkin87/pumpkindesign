import { Component, input, signal, computed, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Skill } from '../../../interfaces/organism.interface';
import {
  CHAIN_GROUPS,
  PATH_ANCHORS,
  ROCK_GROUPS,
  WOBBLE_THREAD_GEOMETRY,
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
      const active = this.activePaths();
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

  activePaths = computed(() => {
    const current = this.hoveredSkill();
    if (!current) return new Set<string>();

    const paths = new Set<string>(current.glowPathIds);

    if (current.isMainSkill && current.subskills) {
      current.subskills.forEach((sub) => {
        sub.glowPathIds.forEach((p) => paths.add(p));
      });
    }

    return paths;
  });

  onHover(skill: Skill): void {
    this.hoveredSkill.set(skill);
  }

  onLeave(): void {
    this.hoveredSkill.set(null);
  }
}

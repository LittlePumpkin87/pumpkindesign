import {
  ChainGeometry,
  ChainLinkRef,
  LinkChain,
  ThreadFrame,
} from '../../../interfaces/spiderweb.interface';
import { CHAIN_GROUPS, ROCK_GROUPS, WOBBLE_THREAD_GEOMETRY } from './spiderweb.config';
import {
  PinnedChain,
  RockingChain,
  ThreadPendulum,
  resetJunctionShifts,
} from './spiderweb.physics';

/* ===================== MODULE HELPERS ===================== */

function buildChain(simulationKind: 'pinned' | 'rock', geometry: ChainGeometry): LinkChain {
  return simulationKind === 'pinned' ? new PinnedChain(geometry) : new RockingChain(geometry);
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

export class SpiderWebSimulation {
  private readonly threads: Record<string, ThreadPendulum> = Object.fromEntries(
    Object.entries(WOBBLE_THREAD_GEOMETRY).map(([id, geometry]) => [
      id,
      new ThreadPendulum(geometry),
    ]),
  );

  private readonly chains: LinkChain[] = [
    ...CHAIN_GROUPS.map((group) => buildChain(group.simulationKind, group.geometry)),
    ...ROCK_GROUPS.map((group) => new RockingChain(group.geometry)),
  ];

  threadFrames: Record<string, ThreadFrame> = Object.fromEntries(
    Object.entries(this.threads).map(([id, thread]) => [id, thread.frame()]),
  );
  chainFrames: Record<string, ThreadFrame> = this.computeChainFrames();

  private previouslyActive = new Set<string>();
  private animationFrameId: number | null = null;
  private lastTime = 0;

  constructor(private readonly onFrame: () => void) {}

  kick(active: Set<string>): void {
    this.kickNewlyActiveThreads(active);
    this.kickNewlyActiveChains(active);
    this.previouslyActive = active;
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /* ===================== ANIMATION LOOP ===================== */

  private startLoop(): void {
    if (this.animationFrameId !== null) return;
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.tick);
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
    this.threadFrames = frames;

    for (const chain of this.chains) {
      const moving = chain.step(dt);
      anyMoving = anyMoving || moving;
    }
    this.chainFrames = this.computeChainFrames();

    this.onFrame();

    this.animationFrameId = anyMoving ? requestAnimationFrame(this.tick) : null;
  };

  private computeChainFrames(): Record<string, ThreadFrame> {
    resetJunctionShifts();
    for (const chain of this.chains) {
      if (chain instanceof PinnedChain) chain.publishShifts();
    }

    const result: Record<string, ThreadFrame> = {};
    ALL_GROUPS.forEach((group, groupIndex) => {
      const chain = this.chains[groupIndex];
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

  /* ===================== KICKS ===================== */

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
      const linkLocation = PATH_ID_TO_LINK[id];
      if (!linkLocation || this.previouslyActive.has(id)) continue;

      const chain = this.chains[linkLocation.group];
      chain.kick(this.kickImpulseFor(chain), linkLocation.link);
      this.startLoop();
    }
  }

  private kickImpulseFor(chain: LinkChain): number {
    if (chain instanceof PinnedChain) return randomSignedImpulse(50, 25);
    return randomSignedImpulse(120, 60);
  }
}

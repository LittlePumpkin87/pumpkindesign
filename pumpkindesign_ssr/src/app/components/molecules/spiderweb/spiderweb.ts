import { Component, input, signal, computed, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Skill } from '../../../interfaces/organism.interface';
import { PATH_ANCHORS, SPIDERWEB_CONFIG, WOBBLE_THREAD_GEOMETRY } from './spiderweb.config';
import { ThreadFrame, ThreadPendulum } from './spiderweb.physics';

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

  private previouslyActive = new Set<string>();
  private rafId: number | null = null;
  private lastTime = 0;

  constructor() {
    effect(() => {
      const active = this.activePaths();
      for (const id of Object.keys(this.threads)) {
        if (active.has(id) && !this.previouslyActive.has(id)) {
          this.threads[id].kick((Math.random() > 0.5 ? 1 : -1) * (1.6 + Math.random() * 0.8));
          this.startLoop();
        }
      }
      this.previouslyActive = active;
    });
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

    this.rafId = anyMoving ? requestAnimationFrame(this.tick) : null;
  };

  activePaths = computed(() => {
    const current = this.hoveredSkill();
    if (!current) return new Set<string>();

    const paths = new Set<string>();

    const ownPaths = SPIDERWEB_CONFIG[current.slug] || [];
    ownPaths.forEach((p) => paths.add(p));

    if (current.isMainSkill && current.subskills) {
      current.subskills.forEach((sub) => {
        const subPaths = SPIDERWEB_CONFIG[sub.slug] || [];
        subPaths.forEach((p) => paths.add(p));
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

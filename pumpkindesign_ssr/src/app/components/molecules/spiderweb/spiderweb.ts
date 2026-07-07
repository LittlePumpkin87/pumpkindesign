import { Component, input, signal, computed, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Skill } from '../../../interfaces/organism.interface';
import { PATH_ANCHORS } from './spiderweb.config';
import { SpiderWebSimulation } from './spiderweb.simulation';
import { buildGlow } from './spiderweb.glow';
import { ThreadFrame, GlowSegment, SkillReveal } from '../../../interfaces/spiderweb.interface';

@Component({
  selector: 'lpd-spider-web',
  templateUrl: './spiderweb.html',
  styleUrl: './spiderweb.scss',
  standalone: true,
  imports: [CommonModule],
})
export class SpiderWebComponent implements OnDestroy {
  skills = input<Skill[]>();
  selectedSkill = signal<Skill | null>(null);
  mainSkills = computed(() => (this.skills() ?? []).filter((skill) => skill.isMainSkill));

  private readonly simulation = new SpiderWebSimulation(() => {
    this.threadFrames.set(this.simulation.threadFrames);
    this.chainFrames.set(this.simulation.chainFrames);
  });

  threadFrames = signal<Record<string, ThreadFrame>>(this.simulation.threadFrames);
  chainFrames = signal<Record<string, ThreadFrame>>(this.simulation.chainFrames);

  glowOverlay = signal<GlowSegment[]>([]);
  subReveal = signal<SkillReveal[]>([]);
  private readonly litPaths = computed(
    () => new Set<string>(this.glowOverlay().map((segment) => segment.id)),
  );

  constructor() {
    effect(() => this.simulation.kick(this.litPaths()));
  }

  ngOnDestroy(): void {
    this.simulation.stop();
  }

  /* ===================== TEMPLATE HELPERS ===================== */

  nodePosition(skill: Skill): { x: number; y: number } {
    const pathId = skill.connectedPathIds?.trim();
    if (pathId) {
      const threadFrame = this.threadFrames()[pathId];
      if (threadFrame) return threadFrame.end ?? { x: skill.posX, y: skill.posY };
      const anchor = PATH_ANCHORS[pathId];
      if (anchor) return anchor;
    }
    return { x: skill.posX, y: skill.posY };
  }
  frameD(id: string): string | undefined {
    return this.threadFrames()[id]?.d ?? this.chainFrames()[id]?.d;
  }

  glowVars(segment: GlowSegment): Record<string, string> {
    return {
      '--glow-delay': `${segment.delay}s`,
      '--glow-dur': `${segment.duration}s`,
      '--glow-from': `${segment.drawDirection}`,
    };
  }

  /* ===================== INTERACTION ===================== */

  onHover(skill: Skill): void {
    if (this.selectedSkill()) return;
    this.showGlow(skill);
  }

  onLeave(): void {
    if (this.selectedSkill()) return;
    this.clearGlow();
  }

  onSelect(skill: Skill): void {
    if (this.selectedSkill() === skill) {
      this.selectedSkill.set(null);
      this.clearGlow();
    } else {
      this.selectedSkill.set(skill);
      this.showGlow(skill);
    }
  }

  private showGlow(skill: Skill): void {
    const glow = buildGlow(skill, this.skills() ?? []);
    this.glowOverlay.set(glow.overlay);
    this.subReveal.set(glow.reveals);
  }

  private clearGlow(): void {
    this.glowOverlay.set([]);
    this.subReveal.set([]);
  }
}

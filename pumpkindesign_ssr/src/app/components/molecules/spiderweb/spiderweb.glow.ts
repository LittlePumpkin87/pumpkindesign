import { Skill } from '../../../interfaces/organism.interface';
import { GlowSegment, SkillReveal } from '../../../interfaces/spiderweb.interface';
import { routeSegments } from './spiderweb.routing';

const GLOW_SPEED = 600;
const GLOW_MIN_DUR = 0.08;

export function buildGlow(
  skill: Skill,
  allSkills: Skill[],
): { overlay: GlowSegment[]; reveals: SkillReveal[] } {
  const mainPathId = skill.connectedPathIds?.trim();
  const segmentsByPathId = new Map<string, GlowSegment>();
  const reveals: SkillReveal[] = [];

  const mainSkillPathIds = new Set(
    allSkills
      .filter((candidate) => candidate.isMainSkill)
      .map((candidate) => candidate.connectedPathIds?.trim())
      .filter(Boolean),
  );

  if (mainPathId && skill.isMainSkill && skill.subskills) {
    for (const subskill of skill.subskills) {
      const arrival = addSubskillRoute(mainPathId, subskill, segmentsByPathId);
      const subPathId = subskill.connectedPathIds?.trim();
      if (subPathId && mainSkillPathIds.has(subPathId)) continue;
      reveals.push({ skill: subskill, delay: arrival });
    }
  }

  return { overlay: [...segmentsByPathId.values()], reveals };
}

function addSubskillRoute(
  mainPathId: string,
  subskill: Skill,
  segmentsByPathId: Map<string, GlowSegment>,
): number {
  const subPathId = subskill.connectedPathIds?.trim();
  if (!subPathId) return 0;

  let elapsed = 0;
  for (const segment of routeSegments(mainPathId, subPathId, Math.random)) {
    const duration = Math.max(GLOW_MIN_DUR, segment.length / GLOW_SPEED);
    mergeSegment(segmentsByPathId, {
      id: segment.pathId,
      delay: elapsed,
      duration,
      drawDirection: segment.reversed ? -1 : 1,
    });
    elapsed += duration;
  }
  return elapsed;
}

function mergeSegment(segmentsByPathId: Map<string, GlowSegment>, segment: GlowSegment): void {
  const existing = segmentsByPathId.get(segment.id);
  if (!existing || segment.delay < existing.delay) segmentsByPathId.set(segment.id, segment);
}

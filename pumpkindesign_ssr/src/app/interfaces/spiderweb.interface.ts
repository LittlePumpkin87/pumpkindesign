import { Skill } from './organism.interface';

export interface GlowSegment {
  id: string;
  delay: number;
  duration: number;
  drawDirection: 1 | -1;
}

export interface SkillReveal {
  skill: Skill;
  delay: number;
}

export interface ThreadGeometry {
  anchorX: number;
  anchorY: number;
  restEndX: number;
  restEndY: number;
}

export interface ThreadPoint {
  x: number;
  y: number;
}

export interface ThreadFrame {
  d: string;
  end: ThreadPoint;
}

export interface LinkChain {
  kick(impulse: number, linkIndex?: number): void;
  step(dt: number): boolean;
  frame(): ThreadFrame[];
  combinedFrame(): ThreadFrame;
}

export interface LinkCurve {
  startX: number;
  startY: number;
  ctrlX: number;
  ctrlY: number;
  endX: number;
  endY: number;
}

export interface ChainGeometry {
  points: ThreadPoint[];
  restBows?: number[];
}

export interface RockLink {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  length: number;
  restBow: number;
  bow: number;
  bowVelocity: number;
}

export interface StringPoint {
  restX: number;
  restY: number;
  displacement: number;
  velocity: number;
}

export interface WebEdge {
  pathId: string;
  nodeA: string;
  nodeB: string;
  length: number;
}

export interface AdjacencyEntry {
  pathId: string;
  to: string;
  length: number;
  reversed: boolean;
}

export interface RouteSegment {
  pathId: string;
  reversed: boolean;
  length: number;
}

export interface ChainLinkRef {
  group: number;
  link: number;
}

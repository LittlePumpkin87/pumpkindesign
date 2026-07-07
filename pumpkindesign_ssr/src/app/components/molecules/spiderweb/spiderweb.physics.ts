import {
  LinkCurve,
  ThreadFrame,
  ThreadGeometry,
  LinkChain,
  ChainGeometry,
  RockLink,
  StringPoint,
} from '../../../interfaces/spiderweb.interface';

/* ===================== SVG PATH BUILDERS ===================== */

function framesFrom(curves: LinkCurve[]): ThreadFrame[] {
  return curves.map((curve) => ({
    d: `M ${curve.startX} ${curve.startY} Q ${curve.ctrlX} ${curve.ctrlY} ${curve.endX} ${curve.endY}`,
    end: { x: curve.endX, y: curve.endY },
  }));
}

function combinedFrameFrom(curves: LinkCurve[]): ThreadFrame {
  const parts = [`M ${curves[0].startX} ${curves[0].startY}`];
  for (const curve of curves) {
    parts.push(`Q ${curve.ctrlX} ${curve.ctrlY} ${curve.endX} ${curve.endY}`);
  }
  const last = curves.at(-1)!;
  return { d: parts.join(' '), end: { x: last.endX, y: last.endY } };
}

/* ===================== JUNCTION COUPLING ===================== */

const JUNCTION_TOL = 2;
const ZERO_SHIFT = { dx: 0, dy: 0 };
let junctionShifts: { x: number; y: number; dx: number; dy: number }[] = [];

export function resetJunctionShifts(): void {
  junctionShifts = [];
}

function publishJunctionShift(x: number, y: number, dx: number, dy: number): void {
  junctionShifts.push({ x, y, dx, dy });
}

function junctionShiftAt(x: number, y: number): { dx: number; dy: number } {
  for (const shift of junctionShifts) {
    if (Math.abs(shift.x - x) <= JUNCTION_TOL && Math.abs(shift.y - y) <= JUNCTION_TOL)
      return shift;
  }
  return ZERO_SHIFT;
}

/* ===================== THREAD PENDULUM ===================== */

const STIFFNESS = 50;
const DAMPING = 2;
const BOW_FACTOR = 0.2;
const SETTLE_EPSILON = 0.0008;

const ROCK_STIFFNESS = 40;
const ROCK_DAMPING = 7;
const ROCK_SETTLE_EPSILON = 0.03;

export class ThreadPendulum {
  private readonly anchorX: number;
  private readonly anchorY: number;
  private readonly restAngle: number;
  private readonly length: number;

  private angle: number;
  private angularVelocity = 0;

  constructor(geometry: ThreadGeometry) {
    this.anchorX = geometry.anchorX;
    this.anchorY = geometry.anchorY;
    const dx = geometry.restEndX - geometry.anchorX;
    const dy = geometry.restEndY - geometry.anchorY;
    this.length = Math.hypot(dx, dy);
    this.restAngle = Math.atan2(dy, dx);
    this.angle = this.restAngle;
  }

  kick(impulse: number): void {
    this.angularVelocity += impulse;
  }

  step(dt: number): boolean {
    const angularAccel =
      -STIFFNESS * (this.angle - this.restAngle) - DAMPING * this.angularVelocity;
    this.angularVelocity += angularAccel * dt;
    this.angle += this.angularVelocity * dt;

    const settled =
      Math.abs(this.angle - this.restAngle) < SETTLE_EPSILON &&
      Math.abs(this.angularVelocity) < SETTLE_EPSILON;

    if (settled) {
      this.angle = this.restAngle;
      this.angularVelocity = 0;
    }

    return !settled;
  }

  frame(): ThreadFrame {
    const endX = this.anchorX + this.length * Math.cos(this.angle);
    const endY = this.anchorY + this.length * Math.sin(this.angle);

    const dirX = (endX - this.anchorX) / this.length;
    const dirY = (endY - this.anchorY) / this.length;
    const midX = (this.anchorX + endX) / 2;
    const midY = (this.anchorY + endY) / 2;

    const bow = this.angularVelocity * BOW_FACTOR * this.length;
    const ctrlX = midX - dirY * bow;
    const ctrlY = midY + dirX * bow;

    return {
      d: `M ${this.anchorX} ${this.anchorY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`,
      end: { x: endX, y: endY },
    };
  }
}

/* ===================== ROCKING CHAIN ===================== */

export class RockingChain implements LinkChain {
  private readonly links: RockLink[];

  constructor(geometry: ChainGeometry) {
    this.links = [];
    for (let i = 1; i < geometry.points.length; i++) {
      const previousPoint = geometry.points[i - 1];
      const currentPoint = geometry.points[i];
      const restBow = geometry.restBows?.[i - 1] ?? 0;
      this.links.push({
        startX: previousPoint.x,
        startY: previousPoint.y,
        endX: currentPoint.x,
        endY: currentPoint.y,
        length: Math.hypot(currentPoint.x - previousPoint.x, currentPoint.y - previousPoint.y),
        restBow,
        bow: restBow,
        bowVelocity: 0,
      });
    }
  }

  kick(impulse: number, linkIndex = 0): void {
    this.links[linkIndex].bowVelocity += impulse;
  }

  step(dt: number): boolean {
    let stillMoving = false;

    for (const link of this.links) {
      const acceleration =
        -ROCK_STIFFNESS * (link.bow - link.restBow) - ROCK_DAMPING * link.bowVelocity;
      link.bowVelocity += acceleration * dt;
      link.bow += link.bowVelocity * dt;

      const settled =
        Math.abs(link.bow - link.restBow) < ROCK_SETTLE_EPSILON &&
        Math.abs(link.bowVelocity) < ROCK_SETTLE_EPSILON;

      if (settled) {
        link.bow = link.restBow;
        link.bowVelocity = 0;
      } else {
        stillMoving = true;
      }
    }

    return stillMoving;
  }

  private linkCurves(): LinkCurve[] {
    return this.links.map((link) => {
      const startShift = junctionShiftAt(link.startX, link.startY);
      const endShift = junctionShiftAt(link.endX, link.endY);
      const startX = link.startX + startShift.dx;
      const startY = link.startY + startShift.dy;
      const endX = link.endX + endShift.dx;
      const endY = link.endY + endShift.dy;

      const segmentLength = Math.hypot(endX - startX, endY - startY) || 1;
      const dirX = (endX - startX) / segmentLength;
      const dirY = (endY - startY) / segmentLength;
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;

      const ctrlX = midX - dirY * link.bow;
      const ctrlY = midY + dirX * link.bow;

      return { startX, startY, ctrlX, ctrlY, endX, endY };
    });
  }

  frame(): ThreadFrame[] {
    return framesFrom(this.linkCurves());
  }

  combinedFrame(): ThreadFrame {
    return combinedFrameFrom(this.linkCurves());
  }
}

/* ===================== PINNED CHAIN ===================== */

const STRING_TENSION = 110;
const STRING_DAMPING = 4.5;
const STRING_SETTLE_EPSILON = 0.02;

export class PinnedChain implements LinkChain {
  private readonly points: StringPoint[];
  private readonly restBows: number[];
  private readonly perpX: number;
  private readonly perpY: number;
  private activeLow = Infinity;
  private activeHigh = -Infinity;

  constructor(geometry: ChainGeometry) {
    const points = geometry.points;
    const first = points[0];
    const last = points.at(-1)!;
    const dx = last.x - first.x;
    const dy = last.y - first.y;
    const length = Math.hypot(dx, dy) || 1;
    this.perpX = -dy / length;
    this.perpY = dx / length;
    this.points = points.map((point) => ({
      restX: point.x,
      restY: point.y,
      displacement: 0,
      velocity: 0,
    }));
    this.restBows = points.slice(1).map((_, i) => geometry.restBows?.[i] ?? 0);
  }

  kick(impulse: number, linkIndex = 0): void {
    this.activeLow = Math.min(this.activeLow, linkIndex);
    this.activeHigh = Math.max(this.activeHigh, linkIndex + 1);
    if (this.activeHigh - this.activeLow < 2) return;
    const pointIndex = Math.min(Math.max(linkIndex, this.activeLow + 1), this.activeHigh - 1);
    this.points[pointIndex].velocity += impulse;
  }

  step(dt: number): boolean {
    const points = this.points;
    const low = this.activeLow;
    const high = this.activeHigh;
    if (high - low < 2) return false;

    for (let i = low + 1; i < high; i++) {
      const acceleration =
        STRING_TENSION *
          (points[i - 1].displacement + points[i + 1].displacement - 2 * points[i].displacement) -
        STRING_DAMPING * points[i].velocity;
      points[i].velocity += acceleration * dt;
    }

    let moving = false;
    for (let i = low + 1; i < high; i++) {
      points[i].displacement += points[i].velocity * dt;
      if (
        Math.abs(points[i].displacement) > STRING_SETTLE_EPSILON ||
        Math.abs(points[i].velocity) > STRING_SETTLE_EPSILON
      ) {
        moving = true;
      }
    }

    if (!moving) {
      for (let i = low + 1; i < high; i++) {
        points[i].displacement = 0;
        points[i].velocity = 0;
      }
      this.activeLow = Infinity;
      this.activeHigh = -Infinity;
    }
    return moving;
  }

  publishShifts(): void {
    for (let i = 1; i < this.points.length - 1; i++) {
      const point = this.points[i];
      if (point.displacement !== 0) {
        publishJunctionShift(
          point.restX,
          point.restY,
          this.perpX * point.displacement,
          this.perpY * point.displacement,
        );
      }
    }
  }

  private linkCurves(): LinkCurve[] {
    const positions = this.points.map((point) => ({
      x: point.restX + this.perpX * point.displacement,
      y: point.restY + this.perpY * point.displacement,
    }));

    const curves: LinkCurve[] = [];
    for (let i = 0; i < positions.length - 1; i++) {
      const startPoint = positions[i];
      const endPoint = positions[i + 1];
      const segmentLength = Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y) || 1;
      const dirX = (endPoint.x - startPoint.x) / segmentLength;
      const dirY = (endPoint.y - startPoint.y) / segmentLength;
      const midX = (startPoint.x + endPoint.x) / 2;
      const midY = (startPoint.y + endPoint.y) / 2;

      const bow = this.restBows[i];
      const ctrlX = midX - dirY * bow;
      const ctrlY = midY + dirX * bow;
      curves.push({
        startX: startPoint.x,
        startY: startPoint.y,
        ctrlX,
        ctrlY,
        endX: endPoint.x,
        endY: endPoint.y,
      });
    }
    return curves;
  }

  frame(): ThreadFrame[] {
    return framesFrom(this.linkCurves());
  }

  combinedFrame(): ThreadFrame {
    return combinedFrameFrom(this.linkCurves());
  }
}

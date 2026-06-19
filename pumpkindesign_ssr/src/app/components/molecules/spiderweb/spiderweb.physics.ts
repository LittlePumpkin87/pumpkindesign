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

/** Common shape of ThreadChain and RockingChain, so callers can drive either uniformly. */
export interface LinkChain {
  kick(impulse: number, linkIndex?: number): void;
  step(dt: number): boolean;
  frame(): ThreadFrame[];
  combinedFrame(): ThreadFrame;
}

interface LinkCurve {
  startX: number;
  startY: number;
  ctrlX: number;
  ctrlY: number;
  endX: number;
  endY: number;
}

function framesFrom(curves: LinkCurve[]): ThreadFrame[] {
  return curves.map((c) => ({
    d: `M ${c.startX} ${c.startY} Q ${c.ctrlX} ${c.ctrlY} ${c.endX} ${c.endY}`,
    end: { x: c.endX, y: c.endY },
  }));
}

function combinedFrameFrom(curves: LinkCurve[]): ThreadFrame {
  const parts = [`M ${curves[0].startX} ${curves[0].startY}`];
  for (const c of curves) {
    parts.push(`Q ${c.ctrlX} ${c.ctrlY} ${c.endX} ${c.endY}`);
  }
  const last = curves.at(-1)!;
  return { d: parts.join(' '), end: { x: last.endX, y: last.endY } };
}

// Settings
const STIFFNESS = 50;
const DAMPING = 2;
const BOW_FACTOR = 0.2;
const SETTLE_EPSILON = 0.0008;

// A chain couples N links together, so each one's own decay tail stacks on top of its
// parent's. ThreadPendulum's soft, long-swinging feel would take ages to settle across many
// links, so chains use their own stiffer, more damped (but still slightly underdamped) spring.
const CHAIN_STIFFNESS = 110;
const CHAIN_DAMPING = 18;

// RockingChain oscillates the bow distance itself (not an angle), so these constants live on
// a different scale than the angular ones above.
const ROCK_STIFFNESS = 40;
const ROCK_DAMPING = 7;
const ROCK_SETTLE_EPSILON = 0.03;

/** Damped pendulum: a thread hangs from a fixed anchor and swings/bows around its rest angle. */
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

  /** Advances the simulation by dt seconds. Returns true while still in motion. */
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

    // Rope lags behind the swing direction, giving it a whip-like bow instead of a rigid stick.
    const bow = this.angularVelocity * BOW_FACTOR * this.length;
    const ctrlX = midX - dirY * bow;
    const ctrlY = midY + dirX * bow;

    return {
      d: `M ${this.anchorX} ${this.anchorY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`,
      end: { x: endX, y: endY },
    };
  }
}

export interface ChainGeometry {
  /** Rest-position points along the chain, in order: anchor first, then one point per link end. */
  points: ThreadPoint[];
  /**
   * Optional per-link rest bow: how far the *original* artwork curve's midpoint deviated from
   * the straight chord between its two points (perpendicular offset, same units as the dynamic
   * bow below). Many of the original paths are real bezier curves, not straight lines - without
   * this, collapsing them to a straight rest line flattens artwork curvature that other paths
   * rely on lining up with. Same length as `points.length - 1`; omitted entries default to 0.
   */
  restBows?: number[];
}

interface ChainLink {
  length: number;
  restAngle: number;
  restBow: number;
  angle: number;
  angularVelocity: number;
}

/**
 * A chain of coupled pendulum links: link 0 hangs from the fixed anchor like ThreadPendulum,
 * each following link targets its own rest angle plus however far its parent has swung off-rest,
 * then lags behind that target with its own spring. This propagates motion down the chain with
 * a phase delay, giving a whip/rope-like wave instead of every link moving in lockstep.
 */
export class ThreadChain implements LinkChain {
  private readonly anchorX: number;
  private readonly anchorY: number;
  private readonly links: ChainLink[];

  constructor(geometry: ChainGeometry) {
    this.anchorX = geometry.points[0].x;
    this.anchorY = geometry.points[0].y;

    this.links = [];
    for (let i = 1; i < geometry.points.length; i++) {
      const prev = geometry.points[i - 1];
      const cur = geometry.points[i];
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      const restAngle = Math.atan2(dy, dx);
      this.links.push({
        length: Math.hypot(dx, dy),
        restAngle,
        restBow: geometry.restBows?.[i - 1] ?? 0,
        angle: restAngle,
        angularVelocity: 0,
      });
    }
  }

  kick(impulse: number, linkIndex = 0): void {
    this.links[linkIndex].angularVelocity += impulse;
  }

  /** Advances the simulation by dt seconds. Returns true while any link is still in motion. */
  step(dt: number): boolean {
    let stillMoving = false;
    let parentAngle = 0;
    let parentAngularVelocity = 0;
    let parentRestAngle = 0;

    for (const link of this.links) {
      // Damping acts on motion *relative to the parent link* (like a real, slightly stiff
      // joint), not on absolute velocity. That way a link riding along with its still-swinging
      // parent dissipates no energy, but any lag behind the parent is actively damped out -
      // otherwise every link drives the next at its own resonant frequency and the chain
      // never settles.
      const restRelative = link.restAngle - parentRestAngle;
      const relativeAngle = link.angle - parentAngle;
      const relativeVelocity = link.angularVelocity - parentAngularVelocity;

      const angularAccel =
        -CHAIN_STIFFNESS * (relativeAngle - restRelative) - CHAIN_DAMPING * relativeVelocity;
      link.angularVelocity += angularAccel * dt;
      link.angle += link.angularVelocity * dt;

      const settled =
        Math.abs(link.angle - parentAngle - restRelative) < SETTLE_EPSILON &&
        Math.abs(link.angularVelocity - parentAngularVelocity) < SETTLE_EPSILON;

      if (settled) {
        link.angle = parentAngle + restRelative;
        link.angularVelocity = parentAngularVelocity;
      } else {
        stillMoving = true;
      }

      parentAngle = link.angle;
      parentAngularVelocity = link.angularVelocity;
      parentRestAngle = link.restAngle;
    }

    return stillMoving;
  }

  private linkCurves(): LinkCurve[] {
    const curves: LinkCurve[] = [];
    let startX = this.anchorX;
    let startY = this.anchorY;

    for (const link of this.links) {
      const endX = startX + link.length * Math.cos(link.angle);
      const endY = startY + link.length * Math.sin(link.angle);

      const dirX = (endX - startX) / link.length;
      const dirY = (endY - startY) / link.length;
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;

      const bow = link.restBow + link.angularVelocity * BOW_FACTOR * link.length;
      const ctrlX = midX - dirY * bow;
      const ctrlY = midY + dirX * bow;

      curves.push({ startX, startY, ctrlX, ctrlY, endX, endY });
      startX = endX;
      startY = endY;
    }

    return curves;
  }

  /** One frame per link, each a small bowed bezier segment chained from the anchor outward. */
  frame(): ThreadFrame[] {
    return framesFrom(this.linkCurves());
  }

  /** All links as one continuous multi-segment path, for chains rendered as a single SVG element. */
  combinedFrame(): ThreadFrame {
    return combinedFrameFrom(this.linkCurves());
  }
}

interface RockLink {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  length: number;
  restBow: number;
  bow: number;
  bowVelocity: number;
}

/**
 * Unlike ThreadChain, both endpoints of every link stay fixed at their rest position - only the
 * bow (the curve's bulge away from the straight chord) oscillates, like a string fixed at both
 * ends being plucked in the middle. Use this for segments whose endpoints are shared junctions
 * with other independent paths, where letting an endpoint swing would visibly break contact.
 * Links are independent of each other (no parent/child coupling needed, since nothing moves).
 */
export class RockingChain implements LinkChain {
  private readonly links: RockLink[];

  constructor(geometry: ChainGeometry) {
    this.links = [];
    for (let i = 1; i < geometry.points.length; i++) {
      const prev = geometry.points[i - 1];
      const cur = geometry.points[i];
      const restBow = geometry.restBows?.[i - 1] ?? 0;
      this.links.push({
        startX: prev.x,
        startY: prev.y,
        endX: cur.x,
        endY: cur.y,
        length: Math.hypot(cur.x - prev.x, cur.y - prev.y),
        restBow,
        bow: restBow,
        bowVelocity: 0,
      });
    }
  }

  kick(impulse: number, linkIndex = 0): void {
    this.links[linkIndex].bowVelocity += impulse;
  }

  /** Advances the simulation by dt seconds. Returns true while any link is still in motion. */
  step(dt: number): boolean {
    let stillMoving = false;

    for (const link of this.links) {
      const accel = -ROCK_STIFFNESS * (link.bow - link.restBow) - ROCK_DAMPING * link.bowVelocity;
      link.bowVelocity += accel * dt;
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
      const dirX = (link.endX - link.startX) / link.length;
      const dirY = (link.endY - link.startY) / link.length;
      const midX = (link.startX + link.endX) / 2;
      const midY = (link.startY + link.endY) / 2;

      const ctrlX = midX - dirY * link.bow;
      const ctrlY = midY + dirX * link.bow;

      return { startX: link.startX, startY: link.startY, ctrlX, ctrlY, endX: link.endX, endY: link.endY };
    });
  }

  /** One frame per link, each a small bowed bezier segment with fixed endpoints. */
  frame(): ThreadFrame[] {
    return framesFrom(this.linkCurves());
  }

  /** All links as one continuous multi-segment path, for chains rendered as a single SVG element. */
  combinedFrame(): ThreadFrame {
    return combinedFrameFrom(this.linkCurves());
  }
}

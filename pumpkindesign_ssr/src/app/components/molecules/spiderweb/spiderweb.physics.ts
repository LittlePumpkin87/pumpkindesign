/* =================================================================================================
 * SPIDER-WEB PHYSICS
 * -------------------------------------------------------------------------------------------------
 * Tiny spring simulation that makes the web strands wobble when a skill is hovered. Nothing here
 * touches the DOM: each class holds numeric state, `step(dt)` advances it, and `frame()` turns the
 * current state into an SVG path string. The component owns the requestAnimationFrame loop and just
 * reads those frames (see spiderweb.ts).
 *
 * The maths is always the same damped spring (Hooke's law + viscous damping), integrated with
 * semi-implicit Euler:
 *     accel = -stiffness * (x - rest)  -  damping * velocity   // restoring pull + friction
 *     velocity += accel * dt                                   // update velocity first ...
 *     x        += velocity * dt                                // ... then move with the new velocity
 * A `kick()` injects velocity; the spring pulls the value back toward `rest` while damping bleeds off
 * energy, so it overshoots a little and settles — that's the wobble. `step()` returns false once the
 * motion is below an epsilon, letting the component stop the animation loop.
 *
 * Three body types, differing only in WHAT oscillates:
 *   - ThreadPendulum : a free-hanging thread; its swing ANGLE oscillates (one link).
 *   - ThreadChain    : many coupled links; each link's angle oscillates relative to its parent,
 *                      so motion travels down the strand like a whip (free outer endpoint).
 *   - RockingChain   : endpoints pinned; only the BOW (mid-curve bulge) oscillates, like a plucked
 *                      guitar string. Used where a segment shares junctions with other paths.
 * ============================================================================================== */

/** Fixed geometry of a hanging thread: where it's pinned (anchor) and where its free end rests. */
export interface ThreadGeometry {
  anchorX: number;
  anchorY: number;
  restEndX: number;
  restEndY: number;
}

/** A plain 2D point in the SVG's coordinate space. */
export interface ThreadPoint {
  x: number;
  y: number;
}

/** One rendered moment of a strand: `d` is the SVG path string, `end` its current free endpoint. */
export interface ThreadFrame {
  /** SVG path data, e.g. "M x y Q cx cy ex ey" (moveto + quadratic bezier). */
  d: string;
  /** Current position of the strand's far end (where an icon hangs / where the next link starts). */
  end: ThreadPoint;
}

/** Common shape of ThreadChain and RockingChain, so callers can drive either uniformly. */
export interface LinkChain {
  kick(impulse: number, linkIndex?: number): void;
  step(dt: number): boolean;
  frame(): ThreadFrame[];
  combinedFrame(): ThreadFrame;
}

/** One link as a quadratic bezier: start -> end, bulged toward the single control point (ctrl). */
interface LinkCurve {
  startX: number;
  startY: number;
  ctrlX: number;
  ctrlY: number;
  endX: number;
  endY: number;
}

/**
 * One ThreadFrame PER curve — used when each link is its own <path> element (so each can glow
 * independently). "M sx sy" moves the pen to the start, "Q cx cy ex ey" draws a quadratic bezier to
 * the end, curving toward the control point.
 */
function framesFrom(curves: LinkCurve[]): ThreadFrame[] {
  return curves.map((c) => ({
    d: `M ${c.startX} ${c.startY} Q ${c.ctrlX} ${c.ctrlY} ${c.endX} ${c.endY}`,
    end: { x: c.endX, y: c.endY },
  }));
}

/**
 * All curves joined into ONE path string ("M ... Q ... Q ... Q ...") — used for strands rendered as
 * a single <path>. One moveto, then one quadratic segment per link, sharing endpoints.
 */
function combinedFrameFrom(curves: LinkCurve[]): ThreadFrame {
  const parts = [`M ${curves[0].startX} ${curves[0].startY}`];
  for (const c of curves) {
    parts.push(`Q ${c.ctrlX} ${c.ctrlY} ${c.endX} ${c.endY}`);
  }
  const last = curves.at(-1)!;
  return { d: parts.join(' '), end: { x: last.endX, y: last.endY } };
}

/* =================================================================================================
 * SHARED JUNCTION COUPLING
 * -------------------------------------------------------------------------------------------------
 * PinnedChains move their interior junction points (the wave). Where another strand (a horizontal
 * arc, a short connector) is attached to one of those junctions, it must follow or it visibly
 * detaches at the crossing. So each frame every PinnedChain PUBLISHES how far it has shifted each
 * junction; the other strands LOOK UP the shift for their shared endpoints and offset by it, keeping
 * the web connected. Keyed by the junction's REST position with a small tolerance (artwork points
 * that meet at a junction are near-coincident but rarely identical).
 * ============================================================================================== */
const JUNCTION_TOL = 2; // px: how close an endpoint must sit to a published junction to count as shared
const ZERO_SHIFT = { dx: 0, dy: 0 };
let junctionShifts: { x: number; y: number; dx: number; dy: number }[] = [];

/** Clear all published shifts. The component calls this once per frame before recomputing strands. */
export function resetJunctionShifts(): void {
  junctionShifts = [];
}

function publishJunctionShift(x: number, y: number, dx: number, dy: number): void {
  junctionShifts.push({ x, y, dx, dy });
}

/** Current displacement of the shared junction at (x, y), or {0,0} if nothing is moving there. */
function junctionShiftAt(x: number, y: number): { dx: number; dy: number } {
  for (const s of junctionShifts) {
    if (Math.abs(s.x - x) <= JUNCTION_TOL && Math.abs(s.y - y) <= JUNCTION_TOL) return s;
  }
  return ZERO_SHIFT;
}

// Settings — spring constants. Higher STIFFNESS = snappier/faster oscillation; higher DAMPING =
// energy bleeds off quicker (less swinging). These are tuned by feel, not real-world units.
const STIFFNESS = 50; // ThreadPendulum: pull back toward rest angle
const DAMPING = 2; // ThreadPendulum: friction on angular velocity (low -> long, soft swing)
const BOW_FACTOR = 0.2; // how strongly velocity bends the rope into a whip-like bow (see frame())
const SETTLE_EPSILON = 0.0008; // below this offset+velocity the motion is treated as stopped

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
    // Store the thread in POLAR form around its anchor: a fixed length and an angle. Swinging then
    // just animates `angle`, and the endpoint is anchor + length*(cos, sin) of that angle.
    this.anchorX = geometry.anchorX;
    this.anchorY = geometry.anchorY;
    const dx = geometry.restEndX - geometry.anchorX;
    const dy = geometry.restEndY - geometry.anchorY;
    this.length = Math.hypot(dx, dy); // distance anchor -> rest end (stays constant)
    this.restAngle = Math.atan2(dy, dx); // angle it hangs at when undisturbed
    this.angle = this.restAngle;
  }

  /** Inject angular velocity to start a swing (called when the strand lights up). */
  kick(impulse: number): void {
    this.angularVelocity += impulse;
  }

  /** Advances the simulation by dt seconds. Returns true while still in motion. */
  step(dt: number): boolean {
    // Damped spring on the angle: restoring pull toward restAngle, minus friction on velocity.
    const angularAccel =
      -STIFFNESS * (this.angle - this.restAngle) - DAMPING * this.angularVelocity;
    // Semi-implicit Euler: update velocity first, then advance the angle with that new velocity.
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

  /** Build the current SVG curve from the live angle (+ a velocity-driven bow for the whip look). */
  frame(): ThreadFrame {
    // Endpoint from polar form: anchor + length along the current angle.
    const endX = this.anchorX + this.length * Math.cos(this.angle);
    const endY = this.anchorY + this.length * Math.sin(this.angle);

    // Unit direction anchor -> end, and the chord midpoint (base position of the bezier control pt).
    const dirX = (endX - this.anchorX) / this.length;
    const dirY = (endY - this.anchorY) / this.length;
    const midX = (this.anchorX + endX) / 2;
    const midY = (this.anchorY + endY) / 2;

    // Rope lags behind the swing direction, giving it a whip-like bow instead of a rigid stick.
    // (-dirY, dirX) is the direction rotated 90deg, i.e. perpendicular to the thread; offsetting the
    // control point along it by `bow` bulges the curve sideways. More angular velocity -> more bow.
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

/** One link of a ThreadChain. `angle`/`angularVelocity` are the live state; the rest is fixed. */
interface ChainLink {
  length: number; // fixed link length
  restAngle: number; // angle this link points at when undisturbed
  restBow: number; // baseline curvature from the original artwork (kept even at rest)
  angle: number; // live angle (animated)
  angularVelocity: number; // live angular velocity (animated)
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

  /**
   * Convert the live link angles into bezier curves. Walks the chain from the anchor outward: each
   * link's end becomes the next link's start, so the segments stay connected as the chain whips.
   */
  private linkCurves(): LinkCurve[] {
    const curves: LinkCurve[] = [];
    // Follow the shared anchor junction if a PinnedChain is moving it, so the strand stays attached.
    const shift = junctionShiftAt(this.anchorX, this.anchorY);
    let startX = this.anchorX + shift.dx;
    let startY = this.anchorY + shift.dy;

    for (const link of this.links) {
      // This link's endpoint, in polar form from its (moving) start point.
      const endX = startX + link.length * Math.cos(link.angle);
      const endY = startY + link.length * Math.sin(link.angle);

      const dirX = (endX - startX) / link.length;
      const dirY = (endY - startY) / link.length;
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;

      // Bow = artwork's resting curvature plus a velocity-driven bulge; offset perpendicular to the
      // link (same (-dirY, dirX) trick as ThreadPendulum.frame()).
      const bow = link.restBow + link.angularVelocity * BOW_FACTOR * link.length;
      const ctrlX = midX - dirY * bow;
      const ctrlY = midY + dirX * bow;

      curves.push({ startX, startY, ctrlX, ctrlY, endX, endY });
      startX = endX; // chain to the next link
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

/** One link of a RockingChain. Endpoints are fixed; only `bow`/`bowVelocity` animate. */
interface RockLink {
  startX: number; // fixed start point
  startY: number;
  endX: number; // fixed end point
  endY: number;
  length: number; // chord length start -> end
  restBow: number; // baseline curvature (rest target of the spring)
  bow: number; // live bulge distance (animated)
  bowVelocity: number; // live rate of change (animated)
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
      // Same damped spring as the others, but the oscillating quantity is the bow distance itself
      // (endpoints never move). Semi-implicit Euler again: velocity first, then the value.
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

  /** Fixed endpoints, control point offset perpendicular to the chord by the live `bow`. */
  private linkCurves(): LinkCurve[] {
    return this.links.map((link) => {
      // Follow shared junctions a PinnedChain is moving, so the arc stays attached where it crosses a
      // wobbling radial. Only the endpoints follow; the bow (curvature) is unchanged.
      const sShift = junctionShiftAt(link.startX, link.startY);
      const eShift = junctionShiftAt(link.endX, link.endY);
      const startX = link.startX + sShift.dx;
      const startY = link.startY + sShift.dy;
      const endX = link.endX + eShift.dx;
      const endY = link.endY + eShift.dy;

      const segLen = Math.hypot(endX - startX, endY - startY) || 1;
      const dirX = (endX - startX) / segLen;
      const dirY = (endY - startY) / segLen;
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;

      // (-dirY, dirX) is perpendicular to the chord; offsetting the midpoint along it bulges the curve.
      const ctrlX = midX - dirY * link.bow;
      const ctrlY = midY + dirX * link.bow;

      return { startX, startY, ctrlX, ctrlY, endX, endY };
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

// PinnedChain constants. The interior points obey a discrete wave equation (each pulled toward the
// average of its two neighbours = string tension), damped. With semi-implicit Euler this is stable
// while STRING_TENSION stays well under ~400 for the clamped dt of 0.05s.
const STRING_TENSION = 110; // wave stiffness/speed: higher = faster ripples (lower = gentler, less jitter)
const STRING_DAMPING = 4.5; // how quickly the wave dies out
const STRING_SETTLE_EPSILON = 0.02; // below this displacement+velocity the strand is treated as still

interface StringPoint {
  restX: number;
  restY: number;
  disp: number; // transverse offset along (perpX, perpY); 0 = at rest
  vel: number; // rate of change of disp
}

/**
 * A strand pinned at BOTH ends, like a guitar string plucked in the middle. Unlike ThreadChain (one
 * fixed end, the other whips) and RockingChain (every endpoint fixed, each segment bulges on its own),
 * here the interior junction POINTS slide transversely and are coupled by a wave equation, so a single
 * coherent wave travels along the strand and reflects between the fixed ends before damping out.
 *
 * Used for the long radial "frame" strands: it keeps ThreadChain's flowing whole-line motion, but the
 * outer (branch) end stays put instead of swinging away — and the shared inner junctions stay on the
 * rest line, so the horizontal arcs meeting them don't lose contact.
 *
 * The wave is also confined to the LIT RUN: kicks come only from the segments the glow actually
 * travels, and the run's two boundary points are pinned too, so the strand wobbles only as far as the
 * glow goes (a glow over half the spoke leaves the other half still). The active run is rebuilt each
 * time the strand settles.
 */
export class PinnedChain implements LinkChain {
  private readonly points: StringPoint[];
  private readonly restBows: number[]; // artwork curvature per segment, preserved at rest
  private readonly perpX: number;
  private readonly perpY: number;
  // The excited run [activeLo, activeHi] (point indices). Both ends are pinned; only the points
  // strictly between them move, so the wave can't travel past the lit segments. Empty until kicked.
  private activeLo = Infinity;
  private activeHi = -Infinity;

  constructor(geometry: ChainGeometry) {
    const pts = geometry.points;
    const first = pts[0];
    const last = pts.at(-1)!;
    const dx = last.x - first.x;
    const dy = last.y - first.y;
    const len = Math.hypot(dx, dy) || 1;
    // Unit perpendicular to the strand's overall chord; all interior points displace along this axis.
    this.perpX = -dy / len;
    this.perpY = dx / len;
    this.points = pts.map((p) => ({ restX: p.x, restY: p.y, disp: 0, vel: 0 }));
    this.restBows = pts.slice(1).map((_, i) => geometry.restBows?.[i] ?? 0);
  }

  /**
   * Grow the excited run to include this lit link, then kick an interior point of it. The run's two
   * boundary points stay pinned, so the wave is confined to the segments the glow actually lights — a
   * glow over only part of the spoke leaves the rest still.
   */
  kick(impulse: number, linkIndex = 0): void {
    this.activeLo = Math.min(this.activeLo, linkIndex);
    this.activeHi = Math.max(this.activeHi, linkIndex + 1);
    if (this.activeHi - this.activeLo < 2) return; // run is a single segment -> no interior point yet
    const i = Math.min(Math.max(linkIndex, this.activeLo + 1), this.activeHi - 1);
    this.points[i].vel += impulse;
  }

  /** Advances the simulation by dt seconds. Returns true while any interior point is still moving. */
  step(dt: number): boolean {
    const p = this.points;
    const lo = this.activeLo;
    const hi = this.activeHi;
    if (hi - lo < 2) return false; // no excited run (or just a single segment) -> nothing to move

    // Velocities first: each interior point of the run is pulled toward the average of its neighbours
    // (discrete Laplacian = string tension), minus damping. The run's boundary points lo and hi stay
    // at rest (disp 0, never updated), acting as the two fixed ends that confine the wave.
    for (let i = lo + 1; i < hi; i++) {
      const accel =
        STRING_TENSION * (p[i - 1].disp + p[i + 1].disp - 2 * p[i].disp) - STRING_DAMPING * p[i].vel;
      p[i].vel += accel * dt;
    }

    // Then advance displacements with the new velocities (semi-implicit Euler).
    let moving = false;
    for (let i = lo + 1; i < hi; i++) {
      p[i].disp += p[i].vel * dt;
      if (
        Math.abs(p[i].disp) > STRING_SETTLE_EPSILON ||
        Math.abs(p[i].vel) > STRING_SETTLE_EPSILON
      ) {
        moving = true;
      }
    }

    if (!moving) {
      for (let i = lo + 1; i < hi; i++) {
        p[i].disp = 0;
        p[i].vel = 0;
      }
      this.activeLo = Infinity; // run settled -> reset so the next hover starts a fresh region
      this.activeHi = -Infinity;
    }
    return moving;
  }

  /** Publish this strand's current junction displacements so attached strands can follow them. */
  publishShifts(): void {
    for (let i = 1; i < this.points.length - 1; i++) {
      const pt = this.points[i];
      if (pt.disp !== 0) {
        publishJunctionShift(pt.restX, pt.restY, this.perpX * pt.disp, this.perpY * pt.disp);
      }
    }
  }

  private linkCurves(): LinkCurve[] {
    // Displaced junction positions; the two ends keep disp = 0, so they sit exactly at rest.
    const pos = this.points.map((pt) => ({
      x: pt.restX + this.perpX * pt.disp,
      y: pt.restY + this.perpY * pt.disp,
    }));

    const curves: LinkCurve[] = [];
    for (let i = 0; i < pos.length - 1; i++) {
      const s = pos[i];
      const e = pos[i + 1];
      const segLen = Math.hypot(e.x - s.x, e.y - s.y) || 1;
      const dirX = (e.x - s.x) / segLen;
      const dirY = (e.y - s.y) / segLen;
      const midX = (s.x + e.x) / 2;
      const midY = (s.y + e.y) / 2;

      // Keep the artwork's resting curvature (restBow) so the strand looks the same at rest; the wave
      // rides on top of it via the displaced endpoints.
      const bow = this.restBows[i];
      const ctrlX = midX - dirY * bow;
      const ctrlY = midY + dirX * bow;
      curves.push({ startX: s.x, startY: s.y, ctrlX, ctrlY, endX: e.x, endY: e.y });
    }
    return curves;
  }

  /** One frame per link, chained between the displaced (but end-pinned) junction points. */
  frame(): ThreadFrame[] {
    return framesFrom(this.linkCurves());
  }

  /** All links as one continuous multi-segment path, for chains rendered as a single SVG element. */
  combinedFrame(): ThreadFrame {
    return combinedFrameFrom(this.linkCurves());
  }
}

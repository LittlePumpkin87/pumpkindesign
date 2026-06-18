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

const STIFFNESS = 90;
const DAMPING = 7;
const BOW_FACTOR = 0.12;
const SETTLE_EPSILON = 0.0008;

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
    this.length = Math.sqrt(dx * dx + dy * dy);
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

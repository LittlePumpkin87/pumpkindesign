/**
 * Raised when Strapi could not answer at all — network error, timeout, or 5xx.
 *
 * This is deliberately distinct from a 4xx: a 4xx is a deterministic answer
 * ("this page does not exist") and must be passed through to the caller, while
 * an unavailability is transient and is exactly the case where the cache may
 * fall back to a stale entry.
 */
export class StrapiUnavailableError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'StrapiUnavailableError';
  }
}

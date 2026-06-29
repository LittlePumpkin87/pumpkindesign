import { CHAIN_GROUPS, ROCK_GROUPS, WOBBLE_THREAD_GEOMETRY, PATH_ANCHORS } from './spiderweb.config';

/* =================================================================================================
 * ROUTABLE WEB GRAPH
 * -------------------------------------------------------------------------------------------------
 * Turns the static web GEOMETRY (from spiderweb.config.ts) into a GRAPH the glow can path-find over:
 *   - NODES  = junction points where segments meet.
 *   - EDGES  = the segments themselves, weighted by their real pixel length.
 *
 * Node identity comes from BUCKETING: every coordinate is rounded onto a 5px grid (`bucketKey`), so
 * two segment ends that touch the same junction collapse onto the same node. That turns the loose
 * pile of segments into one connected network.
 *
 * `routeSegments()` then runs Dijkstra between two icons over this graph. Because both endpoints are
 * peer icons out in the web (not the centre), the shortest path naturally hops a horizontal arc
 * instead of taking the long detour in-to-centre-and-back — which is why the glow no longer funnels
 * through the middle.
 * ============================================================================================== */
const BUCKET = 5;

function bucketKey(x: number, y: number): string {
  return `${Math.round(x / BUCKET)},${Math.round(y / BUCKET)}`;
}

interface WebEdge {
  pathId: string;
  a: string;
  b: string;
  len: number;
}

// px: a thread anchor sitting this close to an existing web node is snapped onto it. Guards against
// two practically-identical points landing in different buckets when they straddle a grid boundary.
const SNAP_TOL = 6;

// Representative coordinate per chain/rock node bucket, used to snap thread anchors by distance
// rather than trusting the grid (which can split coincident points across a cell boundary).
const NODE_COORDS = new Map<string, { x: number; y: number }>();

function nearestNodeBucket(x: number, y: number): string {
  const own = bucketKey(x, y);
  if (NODE_COORDS.has(own)) return own;
  let bestKey = own;
  let bestDist = SNAP_TOL;
  for (const [key, c] of NODE_COORDS) {
    const d = Math.hypot(c.x - x, c.y - y);
    if (d <= bestDist) {
      bestDist = d;
      bestKey = key;
    }
  }
  return bestKey;
}

const WEB_EDGES: WebEdge[] = (() => {
  const edges: WebEdge[] = [];
  const register = (p: { x: number; y: number }): void => {
    NODE_COORDS.set(bucketKey(p.x, p.y), p);
  };
  const push = (
    pathId: string,
    a: string,
    p1: { x: number; y: number },
    p2: { x: number; y: number },
  ): void => {
    const b = bucketKey(p2.x, p2.y);
    if (a === b) return;
    edges.push({ pathId, a, b, len: Math.hypot(p2.x - p1.x, p2.y - p1.y) });
  };

  // Chains/rocks first, registering their endpoint buckets so threads can snap onto them.
  for (const group of [...CHAIN_GROUPS, ...ROCK_GROUPS]) {
    group.pathIds.forEach((id, i) => {
      const p1 = group.geometry.points[i];
      const p2 = group.geometry.points[i + 1];
      register(p1);
      register(p2);
      push(id, bucketKey(p1.x, p1.y), p1, p2);
    });
  }
  // Threads: snap the anchor end to the nearest existing web node so the hanging icon stays connected.
  for (const [id, g] of Object.entries(WOBBLE_THREAD_GEOMETRY)) {
    const anchor = { x: g.anchorX, y: g.anchorY };
    const restEnd = { x: g.restEndX, y: g.restEndY };
    push(id, nearestNodeBucket(anchor.x, anchor.y), anchor, restEnd);
  }
  return edges;
})();

interface AdjEntry {
  pathId: string;
  to: string;
  len: number;
  reversed: boolean;
}

// Adjacency list. The graph is undirected, so each edge is added in BOTH directions. The `reversed`
// flag records orientation: traversing a -> b matches the path's drawn direction (reversed=false),
// while b -> a runs against it (reversed=true). The crawl animation later uses this to draw each
// segment from the end that joins the previous one, so the line stays continuous at the joins.
const WEB_GRAPH: Record<string, AdjEntry[]> = (() => {
  const graph: Record<string, AdjEntry[]> = {};
  const add = (from: string, entry: AdjEntry): void => {
    const list = (graph[from] ??= []);
    list.push(entry);
  };
  for (const e of WEB_EDGES) {
    add(e.a, { pathId: e.pathId, to: e.b, len: e.len, reversed: false }); // forward: drawn direction
    add(e.b, { pathId: e.pathId, to: e.a, len: e.len, reversed: true }); // backward: against drawing
  }
  return graph;
})();

/**
 * Bucket (graph node) where a skill's icon hangs — the start/goal of a route.
 * For a subskill on a thread that's the thread's rest endpoint (the icon dangles there); for a skill
 * pinned to a chain segment it's that segment's anchor point from PATH_ANCHORS.
 */
function attachBucket(connectedPathId: string): string | undefined {
  const id = connectedPathId?.trim();
  if (!id) return undefined;
  const thread = WOBBLE_THREAD_GEOMETRY[id];
  if (thread) return bucketKey(thread.restEndX, thread.restEndY);
  const anchor = PATH_ANCHORS[id];
  if (anchor) return bucketKey(anchor.x, anchor.y);
  return undefined;
}

export interface RouteSegment {
  pathId: string;
  /** True when the route traverses the segment against its drawn (points[i] -> points[i+1]) direction. */
  reversed: boolean;
  len: number;
}

const ROUTE_JITTER = 0.4;

/**
 * Shortest route of segments through the web from one skill icon to another, in travel order.
 *
 * Dijkstra (Edsger W. Dijkstra, 1959) is the classic shortest-path algorithm for a weighted graph:
 * starting from the source it repeatedly finalizes the nearest not-yet-visited node and updates
 * ("relaxes") its neighbours' best-known distances, until the goal's shortest distance is known.
 *
 * It's a plain Dijkstra over WEB_GRAPH:
 *   - `popClosest()` repeatedly takes the unvisited node with the smallest distance,
 *   - `relax()` relaxes its neighbours, remembering in `prev` which edge we arrived through,
 *   - once the goal is settled we walk `prev` back to the start and reverse to get travel order.
 *
 * Edge cost is the segment's pixel length plus a small per-call random JITTER (up to +40%), so when
 * several routes are almost the same length Dijkstra picks a slightly different one each hover and
 * the web feels alive. The jitter is rolled ONCE per call into `weight` (not per relaxation), so the
 * search stays self-consistent. Returns [] when an endpoint is unroutable or both hang at one point.
 */
export function routeSegments(
  fromId: string,
  toId: string,
  rng: () => number = Math.random,
): RouteSegment[] {
  const start = attachBucket(fromId);
  const goal = attachBucket(toId);
  if (!start || !goal || start === goal) return [];

  // One stable weight per edge for this call (length + random jitter) so Dijkstra stays consistent.
  const weight: Record<string, number> = {};
  for (const e of WEB_EDGES) weight[e.pathId] = e.len * (1 + rng() * ROUTE_JITTER);

  const dist: Record<string, number> = { [start]: 0 };
  const prev: Record<string, { pathId: string; len: number; reversed: boolean; pred: string }> = {};
  const visited = new Set<string>();
  const queue = new Set<string>([start]);

  const popClosest = (): string | null => {
    let best: string | null = null;
    let bestDist = Infinity;
    for (const n of queue) {
      if (dist[n] < bestDist) {
        bestDist = dist[n];
        best = n;
      }
    }
    if (best !== null) queue.delete(best);
    return best;
  };

  const relax = (u: string): void => {
    for (const e of WEB_GRAPH[u] ?? []) {
      if (visited.has(e.to)) continue;
      const nd = dist[u] + weight[e.pathId];
      if (nd < (dist[e.to] ?? Infinity)) {
        dist[e.to] = nd;
        prev[e.to] = { pathId: e.pathId, len: e.len, reversed: e.reversed, pred: u };
        queue.add(e.to);
      }
    }
  };

  for (let u = popClosest(); u !== null; u = popClosest()) {
    if (u === goal) break;
    visited.add(u);
    relax(u);
  }

  if (dist[goal] === undefined) return []; // goal unreachable (disconnected node)

  // Reconstruct the path: walk predecessors goal -> start, then reverse into start -> goal order.
  const segments: RouteSegment[] = [];
  let cur = goal;
  while (cur !== start) {
    const e = prev[cur];
    if (!e) return [];
    segments.push({ pathId: e.pathId, reversed: e.reversed, len: e.len });
    cur = e.pred;
  }
  segments.reverse();
  return segments;
}

import { AdjacencyEntry, RouteSegment, WebEdge } from '../../../interfaces/spiderweb.interface';
import {
  CHAIN_GROUPS,
  ROCK_GROUPS,
  WOBBLE_THREAD_GEOMETRY,
  PATH_ANCHORS,
} from './spiderweb.config';

/* ===================== GRAPH BUILDING ===================== */

const BUCKET = 5;

function bucketKey(x: number, y: number): string {
  return `${Math.round(x / BUCKET)},${Math.round(y / BUCKET)}`;
}

const SNAP_TOL = 6;
const NODE_COORDS = new Map<string, { x: number; y: number }>();

function nearestNodeBucket(x: number, y: number): string {
  const own = bucketKey(x, y);
  if (NODE_COORDS.has(own)) return own;
  let bestKey = own;
  let bestDistance = SNAP_TOL;
  for (const [key, coordinate] of NODE_COORDS) {
    const distance = Math.hypot(coordinate.x - x, coordinate.y - y);
    if (distance <= bestDistance) {
      bestDistance = distance;
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
    nodeA: string,
    startPoint: { x: number; y: number },
    endPoint: { x: number; y: number },
  ): void => {
    const nodeB = bucketKey(endPoint.x, endPoint.y);
    if (nodeA === nodeB) return;
    edges.push({
      pathId,
      nodeA,
      nodeB,
      length: Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y),
    });
  };

  for (const group of [...CHAIN_GROUPS, ...ROCK_GROUPS]) {
    group.pathIds.forEach((id, i) => {
      const startPoint = group.geometry.points[i];
      const endPoint = group.geometry.points[i + 1];
      register(startPoint);
      register(endPoint);
      push(id, bucketKey(startPoint.x, startPoint.y), startPoint, endPoint);
    });
  }
  for (const [id, geometry] of Object.entries(WOBBLE_THREAD_GEOMETRY)) {
    const anchor = { x: geometry.anchorX, y: geometry.anchorY };
    const restEnd = { x: geometry.restEndX, y: geometry.restEndY };
    push(id, nearestNodeBucket(anchor.x, anchor.y), anchor, restEnd);
  }
  return edges;
})();

const WEB_GRAPH: Record<string, AdjacencyEntry[]> = (() => {
  const graph: Record<string, AdjacencyEntry[]> = {};
  const add = (from: string, entry: AdjacencyEntry): void => {
    const list = (graph[from] ??= []);
    list.push(entry);
  };
  for (const edge of WEB_EDGES) {
    add(edge.nodeA, { pathId: edge.pathId, to: edge.nodeB, length: edge.length, reversed: false });
    add(edge.nodeB, { pathId: edge.pathId, to: edge.nodeA, length: edge.length, reversed: true });
  }
  return graph;
})();

/* ===================== DIJKSTRA ROUTING ===================== */

function attachBucket(connectedPathId: string): string | undefined {
  const id = connectedPathId?.trim();
  if (!id) return undefined;
  const thread = WOBBLE_THREAD_GEOMETRY[id];
  if (thread) return bucketKey(thread.restEndX, thread.restEndY);
  const anchor = PATH_ANCHORS[id];
  if (anchor) return bucketKey(anchor.x, anchor.y);
  return undefined;
}

const ROUTE_JITTER = 2;

export function routeSegments(
  fromId: string,
  toId: string,
  random: () => number = Math.random,
): RouteSegment[] {
  const start = attachBucket(fromId);
  const goal = attachBucket(toId);
  if (!start || !goal || start === goal) return [];

  const weight: Record<string, number> = {};
  for (const edge of WEB_EDGES) weight[edge.pathId] = edge.length * (1 + random() * ROUTE_JITTER);

  const distances: Record<string, number> = { [start]: 0 };
  const previousEdge: Record<
    string,
    { pathId: string; length: number; reversed: boolean; predecessor: string }
  > = {};
  const visited = new Set<string>();
  const queue = new Set<string>([start]);

  const popClosest = (): string | null => {
    let best: string | null = null;
    let bestDistance = Infinity;
    for (const node of queue) {
      if (distances[node] < bestDistance) {
        bestDistance = distances[node];
        best = node;
      }
    }
    if (best !== null) queue.delete(best);
    return best;
  };

  const relax = (node: string): void => {
    for (const edge of WEB_GRAPH[node] ?? []) {
      if (visited.has(edge.to)) continue;
      const newDistance = distances[node] + weight[edge.pathId];
      if (newDistance < (distances[edge.to] ?? Infinity)) {
        distances[edge.to] = newDistance;
        previousEdge[edge.to] = {
          pathId: edge.pathId,
          length: edge.length,
          reversed: edge.reversed,
          predecessor: node,
        };
        queue.add(edge.to);
      }
    }
  };

  for (let node = popClosest(); node !== null; node = popClosest()) {
    if (node === goal) break;
    visited.add(node);
    relax(node);
  }

  if (distances[goal] === undefined) return [];

  const segments: RouteSegment[] = [];
  let current = goal;
  while (current !== start) {
    const edge = previousEdge[current];
    if (!edge) return [];
    segments.push({ pathId: edge.pathId, reversed: edge.reversed, length: edge.length });
    current = edge.predecessor;
  }
  segments.reverse();
  return segments;
}

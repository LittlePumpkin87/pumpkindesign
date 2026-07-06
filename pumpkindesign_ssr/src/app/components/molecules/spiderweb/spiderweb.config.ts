import { ChainGeometry, ThreadGeometry } from './spiderweb.physics';

/* =================================================================================================
 * SPIDER-WEB CONFIG
 * -------------------------------------------------------------------------------------------------
 * Pure GEOMETRY DATA, derived from the static SVG in spiderweb.html — which path ids form which
 * strand and where their points sit:
 *     - WOBBLE_THREAD_GEOMETRY : the hanging subskill threads (single pendulums).
 *     - CHAIN_GROUPS           : connected strands simulated as swinging multi-link chains.
 *     - ROCK_GROUPS            : strands whose endpoints are pinned (only the bow oscillates).
 *     - PATH_ANCHORS           : the point each non-thread path hangs from / is identified by.
 * The routing graph + Dijkstra that turn this into glow paths live in spiderweb.routing.ts.
 *
 * The ids (e.g. "top-middle-1", "subskill-3") are the same strings used as <path id="..."> in the
 * template and as `connectedPathIds` in Strapi, so everything keys off one shared id space.
 * ============================================================================================== */

/** Hanging subskill threads: each pinned at (anchorX, anchorY) with its free end resting at restEnd. */
export const WOBBLE_THREAD_GEOMETRY: Record<string, ThreadGeometry> = {
  'subskill-5': { anchorX: 285.34, anchorY: 20.82, restEndX: 284.85, restEndY: 216.55 },
  'subskill-4': { anchorX: 242.65, anchorY: 148.26, restEndX: 243.21, restEndY: 239.88 },
  'subskill-3': { anchorX: 203.79, anchorY: 172.13, restEndX: 204.35, restEndY: 207.11 },
  'subskill-6': { anchorX: 371.48, anchorY: 66.63, restEndX: 372.59, restEndY: 181.57 },
  'subskill-1': { anchorX: 114.39, anchorY: 295.41, restEndX: 113.28, restEndY: 352.05 },
  'subskill-2': { anchorX: 168.25, anchorY: 208.23, restEndX: 167.69, restEndY: 307.07 },
};

/**
 * Every group of SVG path elements that connects end-to-start into one continuous strand,
 * simulated as a coupled multi-link chain instead of static lines. Derived from the original static
 * `d` attributes in spiderweb.html (anchor + each segment's end point), grouped by matching one
 * path's end point to the next path's start.
 *
 * The `sim` flag picks how a group is simulated:
 *   - `'pinned'` → PinnedChain (both ends fixed, a coherent wave travels between them). Used for the
 *     long radial "frame" strands that anchor to a branch, so their outer end stays put instead of
 *     whipping like a free pendulum, while keeping a natural flowing motion.
 *   - `'rock'`   → RockingChain (every endpoint fixed, only the bow oscillates). Used for the internal
 *     connector strands whose both endpoints are shared junctions, so they stay attached to the
 *     strands they cross (same treatment as the horizontal arcs in ROCK_GROUPS).
 */
export const CHAIN_GROUPS: { pathIds: string[]; geometry: ChainGeometry; sim: 'pinned' | 'rock' }[] = [
  {
    sim: 'pinned', // anchor radial: both ends fixed -> PinnedChain wave, branch end stays put
    pathIds: [
      'top-middle-1',
      'top-middle-2',
      'top-middle-3',
      'top-middle-4',
      'top-middle-5',
      'top-middle-6',
      'top-middle-7',
      'top-middle-8',
      'top-middle-9',
      'top-middle-10',
    ],
    geometry: {
      points: [
        { x: 185.25, y: 183.45 },
        { x: 182.29, y: 167.55 },
        { x: 179.37, y: 151.84 },
        { x: 175.95, y: 133.43 },
        { x: 172.24, y: 113.46 },
        { x: 168.34, y: 92.52 },
        { x: 163.27, y: 65.25 },
        { x: 157.2, y: 32.63 },
        { x: 152.74, y: 8.67 },
        { x: 148.31, y: -15.22 },
        { x: 146.59, y: -24.43 },
      ],
    },
  },
  {
    sim: 'rock', // connector: both ends are shared junctions -> fixed endpoints
    pathIds: ['top-second-vertical-1', 'top-second-vertical-2'],
    geometry: {
      points: [
        { x: 39.42, y: 74.41 },
        { x: 0.55, y: 174.91 },
        { x: 22.8, y: 336.39 },
      ],
      restBows: [-25.79, -47.76],
    },
  },
  {
    // Anchored at the same center junction as top-middle/top-right/right/bottom-left, swinging
    // out to the bottom-left edge. Originally fused end-to-start with bottom-left-middle into one
    // long edge-to-edge chain (anchor at the bottom edge); split so center is the fixed anchor
    // here too, matching the other main strands instead of just passing through as a midpoint.
    sim: 'pinned', // anchor radial: both ends fixed -> PinnedChain wave, branch end stays put
    pathIds: [
      'bottom-left-third-9',
      'bottom-left-third-8',
      'bottom-left-third-7',
      'bottom-left-third-6',
      'bottom-left-third-5',
      'bottom-left-third-4',
      'bottom-left-third-3',
      'bottom-left-third-2',
      'bottom-left-third-1',
    ],
    geometry: {
      points: [
        { x: 185.46, y: 184.35 },
        { x: 173.42, y: 195.12 },
        { x: 164.14, y: 203.47 },
        { x: 131.85, y: 232.81 },
        { x: 114.03, y: 249.16 },
        { x: 104.53, y: 257.94 },
        { x: 80.89, y: 280.02 },
        { x: 59.57, y: 300.22 },
        { x: 22.13, y: 336.87 },
        { x: -13.88, y: 375.92 },
      ],
      restBows: [0.01, 0.01, 0.07, 0.03, 0.01, 0.06, 0.06, 0.34, 1.28],
    },
  },
  {
    // Anchored at the same center junction, swinging out to the left edge. See bottom-left-third
    // above - the two used to be fused into a single edge-to-edge chain.
    sim: 'pinned', // anchor radial: both ends fixed -> PinnedChain wave, branch end stays put
    pathIds: [
      'bottom-left-middle-9',
      'bottom-left-middle-8',
      'bottom-left-middle-7',
      'bottom-left-middle-6',
      'bottom-left-middle-5',
      'bottom-left-middle-4',
      'bottom-left-middle-3',
      'bottom-left-middle-2',
      'bottom-left-middle-1',
    ],
    geometry: {
      points: [
        { x: 185.46, y: 184.35 },
        { x: 166.3, y: 183.38 },
        { x: 151.3, y: 182.62 },
        { x: 129.58, y: 181.52 },
        { x: 106.71, y: 180.36 },
        { x: 81.3, y: 179.06 },
        { x: 56.41, y: 177.81 },
        { x: 32.11, y: 176.57 },
        { x: -0.02, y: 174.94 },
        { x: -14.3, y: 174.22 },
      ],
    },
  },
  {
    sim: 'rock', // connector: both ends are shared junctions -> fixed endpoints
    pathIds: ['top-second-vertical-3'],
    geometry: {
      points: [
        { x: 23.16, y: 336.55 },
        { x: 33.59, y: 396.04 },
      ],
      restBows: [-12.85],
    },
  },
  {
    sim: 'rock', // connector: both ends are shared junctions -> fixed endpoints
    pathIds: [
      'bottom-left-second-1',
      'bottom-left-second-2',
      'bottom-left-second-3',
      'bottom-left-second-4',
      'bottom-left-second-5',
    ],
    geometry: {
      points: [
        { x: 121.92, y: 286.5 },
        { x: 114.87, y: 294.72 },
        { x: 97.74, y: 315.03 },
        { x: 74.38, y: 343.42 },
        { x: 32.54, y: 396.97 },
        { x: -9.44, y: 461.99 },
      ],
      restBows: [0.02, 0.07, 0.13, 0.68, 3.65],
    },
  },
  {
    sim: 'pinned', // anchor radial: both ends fixed -> PinnedChain wave, branch end stays put
    pathIds: [
      'bottom-left-1',
      'bottom-left-2',
      'bottom-left-3',
      'bottom-left-4',
      'bottom-left-5',
      'bottom-left-6',
    ],
    geometry: {
      points: [
        { x: 186.85, y: 183.03 },
        { x: 176.08, y: 199.16 },
        { x: 167.57, y: 212.25 },
        { x: 113.51, y: 300.93 },
        { x: 80.46, y: 360.74 },
        { x: 51.32, y: 418.73 },
        { x: -16.1, y: 629.68 },
      ],
      restBows: [0.07, 0.03, 1.26, 0.62, 0.69, 18.87],
    },
  },
  {
    sim: 'rock', // connector: both ends are shared junctions -> fixed endpoints
    pathIds: ['top-third-vertical-1'],
    geometry: {
      points: [
        { x: 32.57, y: 176.55 },
        { x: 54.56, y: 85.38 },
      ],
      restBows: [29.11],
    },
  },
  {
    sim: 'rock', // connector: both ends are shared junctions -> fixed endpoints
    pathIds: ['top-fourth-vertical-1'],
    geometry: {
      points: [
        { x: 77.39, y: 102.52 },
        { x: 56.64, y: 177.76 },
      ],
      restBows: [-20.24],
    },
  },
  {
    sim: 'rock', // connector: both ends are shared junctions -> fixed endpoints
    pathIds: ['top-fifth-vertical-1'],
    geometry: {
      points: [
        { x: 100.23, y: 119.52 },
        { x: 82.18, y: 179.35 },
      ],
      restBows: [-18.99],
    },
  },
  {
    sim: 'rock', // connector: both ends are shared junctions -> fixed endpoints
    pathIds: ['top-third-vertical-2'],
    geometry: {
      points: [
        { x: 32.44, y: 176.64 },
        { x: 60.53, y: 301.51 },
      ],
      restBows: [-18.61],
    },
  },
  {
    sim: 'rock', // connector: both ends are shared junctions -> fixed endpoints
    pathIds: ['top-fourth-vertical-2'],
    geometry: {
      points: [
        { x: 56.64, y: 177.69 },
        { x: 81.63, y: 279.86 },
      ],
      restBows: [-22.48],
    },
  },
  {
    sim: 'rock', // connector: both ends are shared junctions -> fixed endpoints
    pathIds: ['top-fifth-vertical-2'],
    geometry: {
      points: [
        { x: 83.22, y: 179.01 },
        { x: 104.95, y: 257.65 },
      ],
      restBows: [-19.22],
    },
  },
  {
    sim: 'rock', // connector: both ends are shared junctions -> fixed endpoints
    pathIds: ['top-third-vertical-3'],
    geometry: {
      points: [
        { x: 59.97, y: 299.85 },
        { x: 73.85, y: 344.83 },
      ],
      restBows: [-14.84],
    },
  },
  {
    sim: 'rock', // connector: both ends are shared junctions -> fixed endpoints
    pathIds: ['top-fourth-vertical-3'],
    geometry: {
      points: [
        { x: 81.64, y: 279.22 },
        { x: 97.11, y: 315.94 },
      ],
      restBows: [-12.67],
    },
  },
  {
    sim: 'rock', // connector: both ends are shared junctions -> fixed endpoints
    pathIds: ['top-second-vertical-4'],
    geometry: {
      points: [
        { x: 33.04, y: 396.19 },
        { x: 51.73, y: 418.32 },
      ],
      restBows: [-13.16],
    },
  },
  {
    sim: 'rock', // connector: both ends are shared junctions -> fixed endpoints
    pathIds: ['top-third-vertical-4'],
    geometry: {
      points: [
        { x: 73.85, y: 343.99 },
        { x: 79.68, y: 361.76 },
      ],
      restBows: [-4.18],
    },
  },
  {
    sim: 'rock', // connector: both ends are shared junctions -> fixed endpoints
    pathIds: ['top-sixth-vertical-3'],
    geometry: {
      points: [
        { x: 114.76, y: 248.5 },
        { x: 97.17, y: 315.68 },
      ],
      restBows: [5.74],
    },
  },
  {
    sim: 'rock', // connector: both ends are shared junctions -> fixed endpoints
    pathIds: ['top-sixth-vertical-2'],
    geometry: {
      points: [
        { x: 107.72, y: 180.19 },
        { x: 114.73, y: 248.66 },
      ],
      restBows: [-16.37],
    },
  },
  {
    sim: 'rock', // connector: both ends are shared junctions -> fixed endpoints
    pathIds: [
      'center-top-1',
      'center-top-2',
      'center-top-3',
      'center-top-4',
      'center-top-5',
      'center-top-6',
    ],
    geometry: {
      points: [
        { x: 167.14, y: 212.95 },
        { x: 163.53, y: 203.79 },
        { x: 150.48, y: 182.69 },
        { x: 157.49, y: 162.56 },
        { x: 180.19, y: 152.43 },
        { x: 202.96, y: 155.68 },
        { x: 215.73, y: 164.85 },
      ],
      restBows: [4.81, 5.16, 5.15, 9, 6.3, 7.58],
    },
  },
  {
    sim: 'rock', // connector: both ends are shared junctions -> fixed endpoints
    pathIds: ['center'],
    geometry: {
      points: [
        { x: 176.37, y: 198.79 },
        { x: 172.55, y: 195.81 },
        { x: 167.42, y: 183.24 },
        { x: 171.3, y: 172.69 },
        { x: 182.96, y: 168.81 },
        { x: 194, y: 170.19 },
        { x: 203.72, y: 172.41 },
      ],
      restBows: [1.62, 2.58, 2.38, 3.16, 4.59, 3.85],
    },
  },
  {
    // Anchored at the center junction like top-middle/top-right/right/bottom-left. The original
    // artwork's path direction ran the other way (edge to center), which left this as the only
    // main strand swinging from its outer tip instead of its center end - reversed to match.
    sim: 'pinned', // anchor radial: both ends fixed -> PinnedChain wave, branch end stays put
    pathIds: [
      'top-left-10',
      'top-left-9',
      'top-left-8',
      'top-left-7',
      'top-left-6',
      'top-left-5',
      'top-left-4',
      'top-left-3',
      'top-left-2',
      'top-left-1',
    ],
    geometry: {
      points: [
        { x: 186.58, y: 184.35 },
        { x: 170.62, y: 172.41 },
        { x: 157.07, y: 162.26 },
        { x: 142.51, y: 151.36 },
        { x: 123.57, y: 137.19 },
        { x: 99.72, y: 119.33 },
        { x: 77.1, y: 102.4 },
        { x: 54.08, y: 85.17 },
        { x: 39.05, y: 73.91 },
        { x: 0.52, y: 45.07 },
        { x: -15.55, y: 33.04 },
      ],
    },
  },
  {
    sim: 'pinned', // anchor radial: both ends fixed -> PinnedChain wave, branch end stays put
    pathIds: [
      'top-right-1',
      'top-right-2',
      'top-right-3',
      'top-right-4',
      'top-right-5',
      'top-right-6',
      'top-right-7',
      'top-right-8',
      'top-right-9',
      'top-right-10',
    ],
    geometry: {
      points: [
        { x: 186.02, y: 184.35 },
        { x: 194.76, y: 169.97 },
        { x: 203.46, y: 155.65 },
        { x: 214.96, y: 136.72 },
        { x: 226.8, y: 117.23 },
        { x: 240.89, y: 94.06 },
        { x: 254.15, y: 72.24 },
        { x: 271.23, y: 44.11 },
        { x: 285.12, y: 21.26 },
        { x: 298.87, y: -1.36 },
        { x: 319.29, y: -34.98 },
      ],
    },
  },
  {
    sim: 'pinned', // anchor radial: both ends fixed -> PinnedChain wave, branch end stays put
    pathIds: [
      'right-14',
      'right-13',
      'right-12',
      'right-11',
      'right-10',
      'right-9',
      'right-8',
      'right-7',
      'right-6',
      'right-5',
      'right-4',
      'right-3',
      'right-2',
      'right-1',
    ],
    geometry: {
      points: [
        { x: 184.91, y: 183.8 },
        { x: 203.03, y: 172.45 },
        { x: 214.35, y: 165.36 },
        { x: 242.25, y: 147.88 },
        { x: 267.54, y: 132.04 },
        { x: 285.09, y: 121.04 },
        { x: 316.96, y: 101.08 },
        { x: 339.61, y: 86.89 },
        { x: 347.51, y: 81.94 },
        { x: 371.05, y: 67.19 },
        { x: 376.44, y: 63.81 },
        { x: 407.49, y: 44.36 },
        { x: 450.64, y: 17.33 },
        { x: 480.9, y: -1.63 },
        { x: 516.41, y: -23.87 },
      ],
    },
  },
];

/**
 * Groups whose endpoints are fixed (shared junctions with other independent paths), so only the
 * bow (curvature) oscillates - see RockingChain. Converted from CHAIN_GROUPS because letting
 * these swing as free pendulums moved their endpoints and visibly broke contact with the paths
 * that meet them there.
 */
export const ROCK_GROUPS: { pathIds: string[]; geometry: ChainGeometry }[] = [
  {
    pathIds: ['top-second-horizontal-2'],
    geometry: {
      points: [
        { x: 152.84, y: 8.88 },
        { x: 285.2, y: 21.31 },
      ],
      restBows: [29.83],
    },
  },
  {
    pathIds: ['top-second-horizontal-1'],
    geometry: {
      points: [
        { x: 0.97, y: 45.95 },
        { x: 152.91, y: 9.51 },
      ],
      restBows: [37.88],
    },
  },
  {
    pathIds: ['top-second-horizontal-1-b'],
    geometry: {
      points: [
        { x: 39.42, y: 74.96 },
        { x: 152.97, y: 9.37 },
      ],
      restBows: [41.34],
    },
  },
  {
    pathIds: ['top-third-horizontal-2'],
    geometry: {
      points: [
        { x: 157.42, y: 33.53 },
        { x: 271.37, y: 43.9 },
      ],
      restBows: [31.37],
    },
  },
  {
    pathIds: ['top-third-horizontal-1'],
    geometry: {
      points: [
        { x: 54.76, y: 85.51 },
        { x: 157.49, y: 32.9 },
      ],
      restBows: [45.26],
    },
  },
  {
    pathIds: ['top-first-horizontal-3'],
    geometry: {
      points: [
        { x: 298.95, y: -1.11 },
        { x: 407.71, y: 43.93 },
      ],
      restBows: [37.58],
    },
  },
  {
    pathIds: ['top-second-horizontal-3'],
    geometry: {
      points: [
        { x: 285.06, y: 21.45 },
        { x: 371.9, y: 66.99 },
      ],
      restBows: [36.19],
    },
  },
  {
    pathIds: ['top-fourth-horizontal-1', 'top-fourth-horizontal-2', 'top-fourth-horizontal-3'],
    geometry: {
      points: [
        { x: 77.81, y: 102.73 },
        { x: 163.81, y: 65.53 },
        { x: 254.09, y: 71.93 },
        { x: 317.69, y: 101.19 },
      ],
      restBows: [31.37, 19.75, 16.84],
    },
  },
  {
    pathIds: ['top-third-horizontal-3'],
    geometry: {
      points: [
        { x: 271.57, y: 43.83 },
        { x: 340.39, y: 86.62 },
      ],
      restBows: [30.17],
    },
  },
  {
    pathIds: [
      'top-sixth-vertical-1',
      'top-sixth-horizontal-2',
      'top-sixth-horizontal-3',
      'top-sixth-horizontal-4',
    ],
    geometry: {
      points: [
        { x: 107.86, y: 180.6 },
        { x: 123.96, y: 137.36 },
        { x: 172.76, y: 114.46 },
        { x: 226.27, y: 116.88 },
        { x: 268.47, y: 132.15 },
      ],
      restBows: [12.13, 11.66, 11.52, 11.27],
    },
  },
  {
    pathIds: ['top-fifth-horizontal-1', 'top-fifth-horizontal-2', 'top-fifth-horizontal-3'],
    geometry: {
      points: [
        { x: 100.3, y: 119.59 },
        { x: 168.53, y: 93.56 },
        { x: 240.67, y: 93.92 },
        { x: 285.97, y: 119.94 },
      ],
      restBows: [18.73, 16.53, 13.01],
    },
  },
  {
    pathIds: [
      'top-seventh-vertical-1',
      'top-seventh-vertical-2',
      'top-seventh-vertical-3',
      'top-seventh-horizontal-4',
      'top-seventh-horizontal-5',
      'top-seventh-horizontal-6',
    ],
    geometry: {
      points: [
        { x: 114.39, y: 295.23 },
        { x: 132.16, y: 232.39 },
        { x: 129.11, y: 181.86 },
        { x: 142.15, y: 151.6 },
        { x: 176.3, y: 134.65 },
        { x: 214.61, y: 136.6 },
        { x: 240.99, y: 149.09 },
      ],
      restBows: [-2.93, 14.5, 8.12, 8.52, 11.4, 11.84],
    },
  },
  {
    pathIds: ['top-first-horizontal-2'],
    geometry: {
      points: [
        { x: 148.33, y: -14.6 },
        { x: 299.44, y: -1.46 },
      ],
      restBows: [23.78],
    },
  },
  {
    pathIds: ['top-first-horizontal-1'],
    geometry: {
      points: [
        { x: 0.56, y: 45.53 },
        { x: 147.99, y: -14.44 },
      ],
      restBows: [27.68],
    },
  },
];

/**
 * The reference point for each non-thread path id. Two uses: a skill pinned to a chain segment hangs
 * its icon here (see SpiderWebComponent.nodePosition), and routing uses it as that id's graph node
 * (attachBucket). These are the segments' rest start points, taken straight from the artwork.
 */
export const PATH_ANCHORS: Record<string, { x: number; y: number }> = {
  'top-middle-1': { x: 185.25, y: 183.45 },
  'top-middle-2': { x: 182.29, y: 167.55 },
  'top-middle-3': { x: 179.37, y: 151.84 },
  'top-middle-4': { x: 175.95, y: 133.43 },
  'top-middle-5': { x: 172.23, y: 113.46 },
  'top-middle-6': { x: 168.34, y: 92.52 },
  'top-middle-7': { x: 163.27, y: 65.25 },
  'top-middle-8': { x: 157.2, y: 32.63 },
  'top-middle-9': { x: 152.75, y: 8.67 },
  'top-middle-10': { x: 148.3, y: -15.22 },
  'top-second-horizontal-2': { x: 152.84, y: 8.88 },
  'top-second-vertical-1': { x: 39.42, y: 74.41 },
  'top-second-vertical-2': { x: 0.56, y: 174.91 },
  'bottom-left-third-1': { x: -13.88, y: 375.92 },
  'bottom-left-third-2': { x: 22.13, y: 336.87 },
  'bottom-left-third-3': { x: 59.57, y: 300.23 },
  'bottom-left-third-4': { x: 80.89, y: 280.01 },
  'bottom-left-third-5': { x: 104.53, y: 257.94 },
  'bottom-left-third-6': { x: 114.03, y: 249.17 },
  'bottom-left-third-7': { x: 131.84, y: 232.8 },
  'bottom-left-third-8': { x: 164.14, y: 203.47 },
  'bottom-left-third-9': { x: 173.43, y: 195.12 },
  'bottom-left-middle-9': { x: 185.46, y: 184.35 },
  'bottom-left-middle-8': { x: 166.3, y: 183.38 },
  'bottom-left-middle-7': { x: 151.3, y: 182.62 },
  'bottom-left-middle-6': { x: 129.58, y: 181.52 },
  'bottom-left-middle-5': { x: 106.7, y: 180.35 },
  'bottom-left-middle-4': { x: 81.3, y: 179.07 },
  'bottom-left-middle-3': { x: 56.41, y: 177.8 },
  'bottom-left-middle-2': { x: 32.11, y: 176.57 },
  'bottom-left-middle-1': { x: -0.02, y: 174.94 },
  'top-second-vertical-3': { x: 23.16, y: 336.55 },
  'bottom-left-second-1': { x: 121.92, y: 286.5 },
  'bottom-left-second-2': { x: 114.87, y: 294.72 },
  'bottom-left-second-3': { x: 97.74, y: 315.03 },
  'bottom-left-second-4': { x: 74.38, y: 343.41 },
  'bottom-left-second-5': { x: 32.54, y: 396.97 },
  'bottom-left-1': { x: 186.85, y: 183.03 },
  'bottom-left-2': { x: 176.08, y: 199.16 },
  'bottom-left-3': { x: 167.56, y: 212.25 },
  'bottom-left-4': { x: 113.52, y: 300.93 },
  'bottom-left-5': { x: 80.46, y: 360.74 },
  'bottom-left-6': { x: 51.32, y: 418.73 },
  'top-second-horizontal-1': { x: 0.97, y: 45.95 },
  'top-second-horizontal-1-b': { x: 39.42, y: 74.96 },
  'top-third-horizontal-2': { x: 157.42, y: 33.53 },
  'top-third-horizontal-1': { x: 54.76, y: 85.51 },
  'top-first-horizontal-3': { x: 298.95, y: -1.11 },
  'top-second-horizontal-3': { x: 285.06, y: 21.45 },
  'path-13': { x: 480.94, y: -1.86 },
  'path-14': { x: 450.16, y: 17.28 },
  'path-15': { x: 376.48, y: 64.41 },
  'top-third-vertical-1': { x: 32.57, y: 176.55 },
  'top-fourth-vertical-1': { x: 77.39, y: 102.52 },
  'top-fifth-vertical-1': { x: 100.23, y: 119.52 },
  'top-fourth-horizontal-1': { x: 77.81, y: 102.73 },
  'top-fourth-horizontal-2': { x: 163.81, y: 65.53 },
  'top-fourth-horizontal-3': { x: 254.09, y: 71.93 },
  'top-third-horizontal-3': { x: 271.57, y: 43.83 },
  'top-third-vertical-2': { x: 32.44, y: 176.64 },
  'top-fourth-vertical-2': { x: 56.64, y: 177.69 },
  'top-fifth-vertical-2': { x: 83.22, y: 179.01 },
  'top-third-vertical-3': { x: 59.97, y: 299.85 },
  'top-fourth-vertical-3': { x: 81.64, y: 279.22 },
  'path-29': { x: 347.6, y: 82.74 },
  'path-30': { x: 317.62, y: 101.06 },
  'path-31': { x: 285.33, y: 120.17 },
  'path-32': { x: 474.4, y: 85.3 },
  'path-33': { x: 495.51, y: 73.62 },
  'top-second-vertical-4': { x: 33.04, y: 396.19 },
  'top-third-vertical-4': { x: 73.85, y: 343.99 },
  'top-sixth-vertical-3': { x: 114.76, y: 248.5 },
  'top-sixth-vertical-2': { x: 107.72, y: 180.19 },
  'top-sixth-vertical-1': { x: 107.86, y: 180.6 },
  'top-sixth-horizontal-2': { x: 123.96, y: 137.36 },
  'top-sixth-horizontal-3': { x: 172.76, y: 114.45 },
  'top-sixth-horizontal-4': { x: 226.27, y: 116.88 },
  'top-fifth-horizontal-1': { x: 100.3, y: 119.59 },
  'top-fifth-horizontal-2': { x: 168.53, y: 93.56 },
  'top-fifth-horizontal-3': { x: 240.67, y: 93.92 },
  'top-seventh-vertical-1': { x: 114.39, y: 295.23 },
  'top-seventh-vertical-2': { x: 132.16, y: 232.39 },
  'top-seventh-vertical-3': { x: 129.1, y: 181.86 },
  'top-seventh-horizontal-4': { x: 142.15, y: 151.59 },
  'top-seventh-horizontal-5': { x: 176.3, y: 134.66 },
  'top-seventh-horizontal-6': { x: 214.61, y: 136.6 },
  'center-top-1': { x: 167.14, y: 212.95 },
  'center-top-2': { x: 163.53, y: 203.79 },
  'center-top-3': { x: 150.48, y: 182.69 },
  'center-top-4': { x: 157.49, y: 162.56 },
  'center-top-5': { x: 180.19, y: 152.42 },
  'center-top-6': { x: 202.96, y: 155.69 },
  'center': { x: 176.37, y: 198.79 },
  'top-first-horizontal-2': { x: 148.33, y: -14.6 },
  'top-left-1': { x: -15.55, y: 33.04 },
  'top-left-2': { x: 0.52, y: 45.07 },
  'top-left-3': { x: 39.05, y: 73.91 },
  'top-left-4': { x: 54.08, y: 85.17 },
  'top-left-5': { x: 77.1, y: 102.4 },
  'top-left-6': { x: 99.72, y: 119.33 },
  'top-left-7': { x: 123.57, y: 137.18 },
  'top-left-8': { x: 142.51, y: 151.36 },
  'top-left-9': { x: 157.06, y: 162.26 },
  'top-left-10': { x: 170.63, y: 172.41 },
  'top-first-horizontal-1': { x: 0.56, y: 45.53 },
  'top-right-1': { x: 186.02, y: 184.35 },
  'top-right-2': { x: 194.76, y: 169.97 },
  'top-right-3': { x: 203.46, y: 155.65 },
  'top-right-4': { x: 214.96, y: 136.72 },
  'top-right-5': { x: 226.81, y: 117.23 },
  'top-right-6': { x: 240.89, y: 94.05 },
  'top-right-7': { x: 254.14, y: 72.24 },
  'top-right-8': { x: 271.23, y: 44.11 },
  'top-right-9': { x: 285.12, y: 21.26 },
  'top-right-10': { x: 298.86, y: -1.36 },
  'right-14': { x: 184.91, y: 183.8 },
  'right-13': { x: 203.03, y: 172.45 },
  'right-12': { x: 214.35, y: 165.36 },
  'right-11': { x: 242.25, y: 147.88 },
  'right-10': { x: 267.54, y: 132.03 },
  'right-9': { x: 285.09, y: 121.04 },
  'right-8': { x: 316.96, y: 101.08 },
  'right-7': { x: 339.6, y: 86.89 },
  'right-6': { x: 347.51, y: 81.94 },
  'right-5': { x: 371.05, y: 67.19 },
  'right-4': { x: 376.44, y: 63.82 },
  'right-3': { x: 407.49, y: 44.36 },
  'right-2': { x: 450.64, y: 17.33 },
  'right-1': { x: 480.9, y: -1.63 },
};

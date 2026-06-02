// ─── Simplex Noise 2D ────────────────────────────────────────────────────────
// Lightweight implementation (Stefan Gustavson / public domain)
const perm = new Uint8Array(512);
const grad2: [number, number][] = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

(() => {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[j], p[i]] = [p[i], p[j]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
})();

export function noise2d(xin: number, yin: number): number {
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;
  const s = (xin + yin) * F2;
  const i = Math.floor(xin + s);
  const j = Math.floor(yin + s);
  const tc = (i + j) * G2;
  const x0 = xin - (i - tc);
  const y0 = yin - (j - tc);
  const i1 = x0 > y0 ? 1 : 0,
    j1 = x0 > y0 ? 0 : 1;
  const x1 = x0 - i1 + G2,
    y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2,
    y2 = y0 - 1 + 2 * G2;
  const ii = i & 255,
    jj = j & 255;
  const g0 = grad2[perm[ii + perm[jj]] % 8];
  const g1 = grad2[perm[ii + i1 + perm[jj + j1]] % 8];
  const g2 = grad2[perm[ii + 1 + perm[jj + 1]] % 8];
  let n = 0;
  let c = 0.5 - x0 * x0 - y0 * y0;
  if (c > 0) {
    c *= c;
    n += c * c * (g0[0] * x0 + g0[1] * y0);
  }
  c = 0.5 - x1 * x1 - y1 * y1;
  if (c > 0) {
    c *= c;
    n += c * c * (g1[0] * x1 + g1[1] * y1);
  }
  c = 0.5 - x2 * x2 - y2 * y2;
  if (c > 0) {
    c *= c;
    n += c * c * (g2[0] * x2 + g2[1] * y2);
  }
  return 70 * n; // [-1, 1]
}

// ─── Domain-Warped Noise ─────────────────────────────────────────────────────
export function warpedNoise(nx: number, ny: number, t: number): number {
  const WARP = 1.2;
  const wx = noise2d(nx + t, ny + t * 0.6);
  const wy = noise2d(nx + 3.7 + t * 0.8, ny + 8.3 - t * 0.5);
  return noise2d(nx + WARP * wx + t * 0.4, ny + WARP * wy + t * 0.3);
}

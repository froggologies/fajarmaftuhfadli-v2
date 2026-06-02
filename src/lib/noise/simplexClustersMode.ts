import { warpedNoise } from "./noise";
import type { DotConfig, MouseState } from "./dotGridTypes";

export function drawSimplexClusters(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  time: number,
  config: DotConfig,
  mouse: MouseState
) {
  const NOISE_SCALE = 0.0015 / config.patternScale;
  const THRESHOLD = 0.0;
  const RAMP = 0.55;

  for (let row = 0; row < rows; row++) {
    const y = row * config.dotSpacing;
    for (let col = 0; col < cols; col++) {
      const x = col * config.dotSpacing;

      const n = warpedNoise(x * NOISE_SCALE, y * NOISE_SCALE, time);

      // Baseline opacity for dots in between clusters
      let clusterAlpha = 0;
      if (n > THRESHOLD) {
        const strength = Math.min((n - THRESHOLD) / RAMP, 1);
        const s = strength * strength * (3 - 2 * strength);
        clusterAlpha = s * 0.25;
      }
      let alpha = (0.12 + clusterAlpha) * config.opacityMultiplier;

      // Calculate gradient to shift dots toward cluster centers
      const epsilon = 10;
      const nLeft = warpedNoise((x - epsilon) * NOISE_SCALE, y * NOISE_SCALE, time);
      const nRight = warpedNoise((x + epsilon) * NOISE_SCALE, y * NOISE_SCALE, time);
      const nUp = warpedNoise(x * NOISE_SCALE, (y - epsilon) * NOISE_SCALE, time);
      const nDown = warpedNoise(x * NOISE_SCALE, (y + epsilon) * NOISE_SCALE, time);

      // Scale warp strength by cluster intensity so flat regions remain a perfect grid
      const warpIntensity = Math.max(0, n);
      const shiftMultiplier = 16 * warpIntensity;
      let finalX = x + (nRight - nLeft) * shiftMultiplier;
      let finalY = y + (nDown - nUp) * shiftMultiplier;

      // Mouse influence
      if (mouse.active) {
        const distX = finalX - mouse.x;
        const distY = finalY - mouse.y;
        const dist = Math.hypot(distX, distY);

        if (dist < config.mouseRadius) {
          const force = (config.mouseRadius - dist) / config.mouseRadius;
          const smoothForce = force * force * (3 - 2 * force);
          const push = smoothForce * config.mousePush;

          finalX += (distX / (dist || 1)) * push;
          finalY += (distY / (dist || 1)) * push;
          alpha = Math.min(alpha + smoothForce * 0.4, 0.85);
        }
      }

      ctx.beginPath();
      ctx.arc(finalX, finalY, config.dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
      ctx.fill();
    }
  }
}

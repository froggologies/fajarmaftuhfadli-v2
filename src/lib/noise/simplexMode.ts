import { noise2d, warpedNoise } from "./noise";
import type { DotConfig, MouseState } from "./dotGridTypes";

export function drawSimplex(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  time: number,
  config: DotConfig,
  mouse: MouseState
) {
  for (let row = 0; row < rows; row++) {
    const y = row * config.dotSpacing;
    for (let col = 0; col < cols; col++) {
      const x = col * config.dotSpacing;

      let finalX = x;
      let finalY = y;

      // Use Simplex for a "Wobble Field" (coordinated circular orbits)
      const scale = 0.0035 / config.patternScale;

      // Base noise field drifting upwards faster
      const n = noise2d(x * scale, y * scale - time * 1.6);

      // Smooth orbit phase (reduced noise multiplier to stop harsh crests)
      const phase = (x + y) * 0.005 + n * Math.PI * 0.8;

      // Smoother radius variation (less extreme)
      const moveStrength = 12 + 4 * n;

      // Much faster continuous orbit
      finalX += Math.cos(time * 5.0 + phase) * moveStrength;
      finalY += Math.sin(time * 5.0 + phase) * moveStrength;

      // Map noise to opacity
      let alpha = (0.15 + (n + 1) * 0.15) * config.opacityMultiplier;

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

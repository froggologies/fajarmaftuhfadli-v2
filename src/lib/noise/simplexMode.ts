import { noise2d } from "./noise";
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

      // Perlin flow uses Math.cos((n+1)*PI). Cosine doubles visual frequency 
      // of noise `n`. To match Perlin's 0.0025 visual scale, Simplex needs 0.005.
      const scale = 0.005 / config.patternScale;
      // Match perlin flow field time multiplier (1.8)
      const nX = noise2d(x * scale + time * 1.8, y * scale + time * 1.8);
      const nY = noise2d(x * scale - time * 1.8, y * scale - time * 1.8);

      // Simplex movement
      const moveStrength = 14;
      finalX += nX * moveStrength;
      finalY += nY * moveStrength;

      // Map noise to opacity (match perlin alpha 0.08 multiplier)
      let alpha = (0.12 + (nX + 1) * 0.08) * config.opacityMultiplier;

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

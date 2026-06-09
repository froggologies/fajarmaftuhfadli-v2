import { noise2d } from "./noise";
import type { DotConfig, MouseState } from "./dotGridTypes";

export function drawPerlinFlowField(
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

      // perlin-flow-field
      const flowScale = 0.0025 / config.patternScale;
      // Flow direction dynamic over time
      const n = noise2d(x * flowScale, y * flowScale + time * 1.8);
      const angle = (n + 1) * Math.PI; // Map [-1, 1] to [0, 2*PI]

      // Secondary noise for "wind gusts" (areas of high/low energy)
      const gust = noise2d(x * flowScale * 0.5 - time, y * flowScale * 0.5);
      const flowStrength = 14 * (0.5 + (gust + 1) * 0.5); // Ranges from 7 to 21

      let finalX = x + Math.cos(angle) * flowStrength;
      let finalY = y + Math.sin(angle) * flowStrength;

      // Subtle pulse based on noise value (matching simplex base opacity of 0.12)
      let alpha = (0.12 + (n + 1) * 0.08) * config.opacityMultiplier;

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

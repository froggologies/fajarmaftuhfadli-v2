import { noise2d } from "./noise";
import type { DotConfig, MouseState } from "./dotGridTypes";

export function drawVortex(
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

      const scale = 0.0025 / config.patternScale;

      // Calculate 2D Curl of the noise field to create swirling vortexes
      // We sample the noise field at small offsets to find the gradient
      const eps = 20; // Sample distance
      const nTop = noise2d(x * scale, (y - eps) * scale + time * 1.5);
      const nBottom = noise2d(x * scale, (y + eps) * scale + time * 1.5);
      const nLeft = noise2d((x - eps) * scale, y * scale + time * 1.5);
      const nRight = noise2d((x + eps) * scale, y * scale + time * 1.5);

      // Curl formula: (dF/dy, -dF/dx)
      let curlX = nBottom - nTop;
      let curlY = -(nRight - nLeft);

      // Normalize the curl vector so we get consistent movement magnitude
      const len = Math.hypot(curlX, curlY) || 1;
      curlX /= len;
      curlY /= len;

      // Base noise for opacity and slight move variation
      const baseN = noise2d(x * scale, y * scale + time * 1.5);

      const moveStrength = 14 + 4 * baseN;

      // Swirl movement
      finalX += curlX * moveStrength;
      finalY += curlY * moveStrength;

      // Map base noise to opacity
      let alpha = (0.12 + (baseN + 1) * 0.15) * config.opacityMultiplier;

      // Mouse influence
      if (mouse.active) {
        const distX = finalX - mouse.x;
        const distY = finalY - mouse.y;
        const dist = Math.hypot(distX, distY);

        if (dist < config.mouseRadius) {
          const force = (config.mouseRadius - dist) / config.mouseRadius;
          const smoothForce = force * force * (3 - 2 * force);
          const push = smoothForce * config.mousePush;

          // Mouse pushes outward from center
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

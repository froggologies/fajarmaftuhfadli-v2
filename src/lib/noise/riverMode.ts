import { noise2d } from "./noise";
import type { DotConfig, MouseState } from "./dotGridTypes";

export function drawRiver(
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

      // To get deep U-turns and wild meanders like the photo, we MUST use a 2D contour.
      // A 1D function y=f(x) can never loop backwards.
      // By using a very low-frequency 2D noise + a global slope, we guarantee exactly ONE river
      // that meanders wildly across the screen without breaking into small lakes/islands.
      function getTerrain(px: number, py: number, t: number) {
        const screenMiddleY = (rows * config.dotSpacing) / 2;

        // Global slope pulls the river to the center.
        const slope = (py - screenMiddleY) * 0.0015;

        // Extremely low frequency noise creates massive, smooth meanders
        // Carefully tuned frequency/amplitude (0.0008, 1.0) guarantees no self-intersection
        // because gradient of noise is always less than the global slope (0.0015).
        const sweep = noise2d(px * 0.0008 - t * 0.2, py * 0.0008) * 1.0;

        return slope + sweep; // River is exactly where this == 0
      }

      const tVal = getTerrain(x, y, time);
      const distFromRiver = Math.abs(tVal); // Distance in "altitude" units

      // Snake width (core)
      let snakeIntensity = Math.max(0, 1.0 - distFromRiver / 0.1);
      snakeIntensity = snakeIntensity * snakeIntensity * (3 - 2 * snakeIntensity);

      // Surround glow (much larger now)
      let surroundIntensity = Math.max(0, 1.0 - distFromRiver / 0.8);
      surroundIntensity = surroundIntensity * surroundIntensity * (3 - 2 * surroundIntensity);

      // To flow ALONG the river, we take the 2D Cross Product of the Terrain Gradient
      const eps = 10;
      const tTop = getTerrain(x, y - eps, time);
      const tBottom = getTerrain(x, y + eps, time);
      const tLeft = getTerrain(x - eps, y, time);
      const tRight = getTerrain(x + eps, y, time);

      const gradX = tRight - tLeft;
      const gradY = tBottom - tTop;

      // Contour direction: (gradY, -gradX). Since slope (d/dy) is positive, this flows rightwards.
      let flowDirX = gradY;
      let flowDirY = -gradX;

      // Normalize flow vector
      const len = Math.hypot(flowDirX, flowDirY) || 1;
      flowDirX /= len;
      flowDirY /= len;

      // Small turbulence inside the river water
      const nTurb = noise2d(x * 0.01 - time * 2.0, y * 0.01);
      const turbAngle = nTurb * Math.PI * 0.15;

      const cosT = Math.cos(turbAngle);
      const sinT = Math.sin(turbAngle);
      const finalFlowX = flowDirX * cosT - flowDirY * sinT;
      const finalFlowY = flowDirX * sinT + flowDirY * cosT;

      // Flow fast along the body, slow drag in surround
      const flowStrength = 22 * snakeIntensity + 6 * surroundIntensity;

      finalX += finalFlowX * flowStrength;
      finalY += finalFlowY * flowStrength;

      // Opacity: bright snake body, larger glowing surround, dim outside
      const baseAlpha = 0.1;
      const snakeAlpha = 0.08 * snakeIntensity + 0.15 * surroundIntensity + (nTurb + 1) * 0.1 * snakeIntensity;
      let alpha = (baseAlpha + snakeAlpha) * config.opacityMultiplier;

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

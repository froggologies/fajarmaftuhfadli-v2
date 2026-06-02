export interface DotConfig {
  dotSpacing: number;
  dotRadius: number;
  speed: number;
  mouseRadius: number;
  mousePush: number;
  mouseSpeed: number;
  opacityMultiplier: number;
  patternScale: number;
}

export interface MouseState {
  x: number;
  y: number;
  active: boolean;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function flySeconds(seconds: number): number {
  return prefersReducedMotion() ? 0 : seconds;
}

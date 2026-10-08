export const TAU = Math.PI * 2

export const clamp = (v: number, min: number, max: number): number =>
  v < min ? min : v > max ? max : v

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

export const smoothstep = (e0: number, e1: number, x: number): number => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1)
  return t * t * (3 - 2 * t)
}

export const damp = (current: number, target: number, lambda: number, dt: number): number =>
  lerp(current, target, 1 - Math.exp(-lambda * dt))

export const rand = (min: number, max: number): number => min + Math.random() * (max - min)

export const wrapAngle = (a: number): number => {
  let x = a % TAU
  if (x < -Math.PI) x += TAU
  if (x > Math.PI) x -= TAU
  return x
}

export const shortestAngle = (from: number, to: number): number =>
  from + wrapAngle(to - from)

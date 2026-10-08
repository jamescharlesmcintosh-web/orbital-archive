export interface RGB {
  r: number
  g: number
  b: number
}

export const hexToRgb = (hex: string): RGB => {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export const rgba = (hex: string, alpha: number): string => {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const mixHex = (a: string, b: string, t: number): string => {
  const x = hexToRgb(a)
  const y = hexToRgb(b)
  const r = Math.round(x.r + (y.r - x.r) * t)
  const g = Math.round(x.g + (y.g - x.g) * t)
  const bl = Math.round(x.b + (y.b - x.b) * t)
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`
}

export const withAlpha = (hex: string, alpha: number): string => rgba(hex, alpha)

import type { Project } from '../types'
import { mixHex, rgba } from './color'

const createCanvas = (w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] => {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')
  return [canvas, ctx]
}

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void => {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

export const makeStarTexture = (): HTMLCanvasElement => {
  const [canvas, ctx] = createCanvas(64, 64)
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.18, 'rgba(255,255,255,0.72)')
  g.addColorStop(0.45, 'rgba(190,205,255,0.18)')
  g.addColorStop(1, 'rgba(120,140,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  return canvas
}

export const makeGlowTexture = (): HTMLCanvasElement => {
  const [canvas, ctx] = createCanvas(128, 128)
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,0.9)')
  g.addColorStop(0.22, 'rgba(255,255,255,0.28)')
  g.addColorStop(0.55, 'rgba(255,255,255,0.07)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return canvas
}

export const makeSoftDiscTexture = (): HTMLCanvasElement => {
  const [canvas, ctx] = createCanvas(128, 128)
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.55, 'rgba(255,255,255,0.42)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return canvas
}

export const makeNebulaTexture = (hue: string, hue2: string, seed: number): HTMLCanvasElement => {
  const [canvas, ctx] = createCanvas(512, 512)
  ctx.fillStyle = 'rgba(0,0,0,0)'
  ctx.fillRect(0, 0, 512, 512)

  let s = seed * 9301 + 49297
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }

  for (let i = 0; i < 22; i++) {
    const x = 256 + (rnd() - 0.5) * 300
    const y = 256 + (rnd() - 0.5) * 300
    const r = 60 + rnd() * 190
    const c = rnd() > 0.5 ? hue : hue2
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, rgba(c, 0.16 + rnd() * 0.18))
    g.addColorStop(0.45, rgba(c, 0.05))
    g.addColorStop(1, rgba(c, 0))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalCompositeOperation = 'destination-in'
  const fade = ctx.createRadialGradient(256, 256, 40, 256, 256, 256)
  fade.addColorStop(0, 'rgba(255,255,255,1)')
  fade.addColorStop(0.62, 'rgba(255,255,255,0.5)')
  fade.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = fade
  ctx.fillRect(0, 0, 512, 512)
  ctx.globalCompositeOperation = 'source-over'

  return canvas
}

const paintBackdrop = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  project: Project,
): void => {
  const base = ctx.createLinearGradient(0, 0, w, h)
  base.addColorStop(0, mixHex(project.accentSoft, '#05060c', 0.55))
  base.addColorStop(0.55, '#07080f')
  base.addColorStop(1, mixHex(project.accentSoft, '#05060c', 0.25))
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  const glow = ctx.createRadialGradient(w * 0.78, h * 0.18, 0, w * 0.78, h * 0.18, w * 0.72)
  glow.addColorStop(0, rgba(project.accent, 0.34))
  glow.addColorStop(0.4, rgba(project.accent, 0.1))
  glow.addColorStop(1, rgba(project.accent, 0))
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  const glow2 = ctx.createRadialGradient(w * 0.12, h * 0.92, 0, w * 0.12, h * 0.92, w * 0.6)
  glow2.addColorStop(0, rgba(mixHex(project.accent, '#ffffff', 0.35), 0.18))
  glow2.addColorStop(1, rgba(project.accent, 0))
  ctx.fillStyle = glow2
  ctx.fillRect(0, 0, w, h)

  ctx.strokeStyle = rgba(project.accent, 0.06)
  ctx.lineWidth = 1
  const step = 48
  for (let x = 0; x <= w; x += step) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  for (let y = 0; y <= h; y += step) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
}

const paintChrome = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  project: Project,
): void => {
  const barH = h * 0.072
  ctx.fillStyle = 'rgba(255,255,255,0.035)'
  ctx.fillRect(0, 0, w, barH)
  ctx.fillStyle = rgba(project.accent, 0.32)
  ctx.fillRect(0, barH, w, 1.5)

  const dotY = barH / 2
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.arc(28 + i * 18, dotY, 5, 0, Math.PI * 2)
    ctx.fillStyle = i === 0 ? rgba(project.accent, 0.85) : 'rgba(255,255,255,0.22)'
    ctx.fill()
  }

  for (let i = 0; i < 4; i++) {
    roundRect(ctx, 108 + i * 74, dotY - 7, 54, 14, 7)
    ctx.fillStyle = i === 1 ? rgba(project.accent, 0.4) : 'rgba(255,255,255,0.11)'
    ctx.fill()
  }

  roundRect(ctx, w - 172, dotY - 11, 144, 22, 11)
  ctx.fillStyle = rgba(project.accent, 0.55)
  ctx.fill()

  const sideW = w * 0.19
  ctx.fillStyle = 'rgba(255,255,255,0.028)'
  ctx.fillRect(0, barH, sideW, h - barH)

  for (let i = 0; i < 9; i++) {
    const y = barH + 34 + i * 38
    roundRect(ctx, 22, y, sideW - 44, 10, 5)
    ctx.fillStyle = i === 2 ? rgba(project.accent, 0.62) : 'rgba(255,255,255,0.1)'
    ctx.fill()
    if (i === 2) {
      roundRect(ctx, 8, y - 8, 3, 26, 2)
      ctx.fillStyle = project.accent
      ctx.fill()
    }
  }
}

const paintDataCards = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  project: Project,
  variant: number,
): void => {
  const x0 = w * 0.215
  const y0 = h * 0.135
  const colW = (w - x0 - 36) / 3
  const cardH = h * 0.19

  const labels = ['THROUGHPUT', 'LATENCY', 'UPTIME']
  const values = ['98.4', '12ms', '99.99']

  for (let i = 0; i < 3; i++) {
    const x = x0 + i * (colW + 12)
    roundRect(ctx, x, y0, colW, cardH, 16)
    ctx.fillStyle = 'rgba(255,255,255,0.055)'
    ctx.fill()
    ctx.strokeStyle = rgba(project.accent, 0.18)
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = 'rgba(255,255,255,0.34)'
    ctx.font = '500 15px Inter, system-ui, sans-serif'
    ctx.fillText(labels[i], x + 22, y0 + 38)

    ctx.fillStyle = i === 1 ? project.accent : 'rgba(255,255,255,0.92)'
    ctx.font = '600 52px Inter, system-ui, sans-serif'
    ctx.fillText(values[i], x + 22, y0 + 104)
  }

  const chartX = x0
  const chartY = y0 + cardH + 22
  const chartW = (w - x0 - 36) * 0.62
  const chartH = h * 0.38

  roundRect(ctx, chartX, chartY, chartW, chartH, 18)
  ctx.fillStyle = 'rgba(255,255,255,0.04)'
  ctx.fill()
  ctx.strokeStyle = rgba(project.accent, 0.14)
  ctx.stroke()

  ctx.fillStyle = 'rgba(255,255,255,0.42)'
  ctx.font = '500 16px Inter, system-ui, sans-serif'
  ctx.fillText('PERFORMANCE · TRAILING 12 MONTHS', chartX + 24, chartY + 36)

  const pad = 34
  const innerW = chartW - pad * 2
  const innerH = chartH - 96

  if (variant % 3 === 0) {
    const bars = 16
    const bw = innerW / bars
    for (let i = 0; i < bars; i++) {
      const t = i / (bars - 1)
      const bh = innerH * (0.28 + 0.62 * Math.abs(Math.sin(t * 3.1 + variant)) * (0.5 + t * 0.6))
      const bx = chartX + pad + i * bw
      const by = chartY + 70 + innerH - bh
      roundRect(ctx, bx + bw * 0.16, by, bw * 0.68, bh, 5)
      const grad = ctx.createLinearGradient(0, by, 0, by + bh)
      grad.addColorStop(0, rgba(project.accent, 0.95))
      grad.addColorStop(1, rgba(project.accent, 0.14))
      ctx.fillStyle = grad
      ctx.fill()
    }
  } else if (variant % 3 === 1) {
    ctx.beginPath()
    for (let i = 0; i <= 48; i++) {
      const t = i / 48
      const x = chartX + pad + innerW * t
      const y =
        chartY + 70 +
        innerH * (0.55 + 0.32 * Math.sin(t * 5.2 + variant) * Math.cos(t * 2.1 + 0.6))
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    const fillPath = ctx
    ctx.strokeStyle = project.accent
    ctx.lineWidth = 3
    ctx.stroke()
    fillPath.lineTo(chartX + pad + innerW, chartY + 70 + innerH)
    fillPath.lineTo(chartX + pad, chartY + 70 + innerH)
    fillPath.closePath()
    const area = ctx.createLinearGradient(0, chartY + 70, 0, chartY + 70 + innerH)
    area.addColorStop(0, rgba(project.accent, 0.34))
    area.addColorStop(1, rgba(project.accent, 0))
    ctx.fillStyle = area
    ctx.fill()
  } else {
    const cx = chartX + chartW * 0.5
    const cy = chartY + 70 + innerH * 0.52
    const r = Math.min(innerW, innerH) * 0.36
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.ellipse(cx, cy, r * (0.3 + i * 0.18), r * (0.18 + i * 0.12), -0.4, 0, Math.PI * 2)
      ctx.strokeStyle = rgba(project.accent, 0.16 + i * 0.14)
      ctx.lineWidth = 2
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.16, 0, Math.PI * 2)
    ctx.fillStyle = project.accent
    ctx.fill()
  }

  const sideX = chartX + chartW + 18
  const sideW = w - sideX - 36
  roundRect(ctx, sideX, chartY, sideW, chartH, 18)
  ctx.fillStyle = 'rgba(255,255,255,0.045)'
  ctx.fill()
  ctx.strokeStyle = rgba(project.accent, 0.14)
  ctx.stroke()

  ctx.fillStyle = 'rgba(255,255,255,0.42)'
  ctx.font = '500 15px Inter, system-ui, sans-serif'
  ctx.fillText('ACTIVITY', sideX + 22, chartY + 38)

  for (let i = 0; i < 6; i++) {
    const y = chartY + 66 + i * 34
    ctx.beginPath()
    ctx.arc(sideX + 32, y, 6, 0, Math.PI * 2)
    ctx.fillStyle = i < 2 ? rgba(project.accent, 0.8) : 'rgba(255,255,255,0.16)'
    ctx.fill()
    roundRect(ctx, sideX + 52, y - 6, sideW - 82, 11, 5)
    ctx.fillStyle = i < 2 ? rgba(project.accent, 0.32) : 'rgba(255,255,255,0.11)'
    ctx.fill()
  }
}

const paintSignatureShape = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  project: Project,
  variant: number,
): void => {
  const cx = w * 0.72
  const cy = h * 0.2
  const r = Math.min(w, h) * 0.26

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(variant * 0.42)

  if (variant % 2 === 0) {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.arc(0, 0, r * (0.4 + i * 0.32), variant * 0.6 + i * 0.5, variant * 0.6 + i * 0.5 + 3.4)
      ctx.strokeStyle = rgba(project.accent, 0.34 - i * 0.08)
      ctx.lineWidth = 2 + i
      ctx.stroke()
    }
  } else {
    for (let i = 0; i < 4; i++) {
      const s = r * (0.28 + i * 0.22)
      ctx.beginPath()
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + i * 0.3
        const px = Math.cos(a) * s
        const py = Math.sin(a) * s
        if (k === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.strokeStyle = rgba(project.accent, 0.3 - i * 0.055)
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }
  ctx.restore()
}

const paintFinish = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  project: Project,
): void => {
  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.5, h * 0.18, w * 0.5, h * 0.5, w * 0.72)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)

  ctx.globalAlpha = 0.045
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * w
    const y = Math.random() * h
    ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : project.accent
    ctx.fillRect(x, y, 1.4, 1.4)
  }
  ctx.globalAlpha = 1

  ctx.fillStyle = rgba(project.accent, 0.85)
  ctx.fillRect(0, 0, w, 5)
  ctx.fillStyle = rgba('#000000', 0.25)
  ctx.fillRect(0, h - 4, w, 4)
}

export const makeProjectTexture = (project: Project): HTMLCanvasElement => {
  const w = 1280
  const h = 800
  const [canvas, ctx] = createCanvas(w, h)

  paintBackdrop(ctx, w, h, project)
  paintSignatureShape(ctx, w, h, project, project.variant)
  paintChrome(ctx, w, h, project)
  paintDataCards(ctx, w, h, project, project.variant)
  paintFinish(ctx, w, h, project)

  return canvas
}

export const makeProjectThumb = (project: Project): HTMLCanvasElement => {
  const w = 480
  const h = 300
  const [canvas, ctx] = createCanvas(w, h)

  paintBackdrop(ctx, w, h, project)

  ctx.save()
  ctx.translate(w * 0.7, h * 0.26)
  ctx.rotate(project.variant * 0.5)
  ctx.beginPath()
  ctx.arc(0, 0, h * 0.3, 0.4, 5.1)
  ctx.strokeStyle = rgba(project.accent, 0.55)
  ctx.lineWidth = 5
  ctx.stroke()
  ctx.restore()

  roundRect(ctx, 22, 22, w - 44, h * 0.12, 12)
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.fill()

  for (let i = 0; i < 3; i++) {
    roundRect(ctx, 22 + i * ((w - 56) / 3), h * 0.42, (w - 76) / 3, h * 0.32, 12)
    ctx.fillStyle = i === 1 ? rgba(project.accent, 0.4) : 'rgba(255,255,255,0.07)'
    ctx.fill()
  }

  const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.16, w / 2, h / 2, w * 0.78)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.5)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)

  return canvas
}

export const makeBeamTexture = (): HTMLCanvasElement => {
  const [canvas, ctx] = createCanvas(16, 256)
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, 'rgba(255,255,255,0)')
  g.addColorStop(0.5, 'rgba(255,255,255,0.85)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 16, 256)
  return canvas
}

export const makeScanTexture = (): HTMLCanvasElement => {
  const [canvas, ctx] = createCanvas(4, 64)
  for (let y = 0; y < 64; y++) {
    const a = y % 2 === 0 ? 0.22 : 0.02
    ctx.fillStyle = `rgba(255,255,255,${a})`
    ctx.fillRect(0, y, 4, 1)
  }
  return canvas
}

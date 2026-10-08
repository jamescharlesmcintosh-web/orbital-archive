import * as THREE from 'three'
import { makeStarTexture } from '../lib/textures'
import { TAU, rand } from '../lib/math'

interface Layer {
  points: THREE.Points
  material: THREE.PointsMaterial
  speed: number
}

export class Starfield {
  readonly group = new THREE.Group()
  private layers: Layer[] = []

  constructor(count = 4200) {
    const map = new THREE.CanvasTexture(makeStarTexture())
    map.colorSpace = THREE.SRGBColorSpace

    const specs = [
      { n: Math.floor(count * 0.5), size: 0.09, opacity: 0.55, radius: 60, speed: 0.005 },
      { n: Math.floor(count * 0.32), size: 0.2, opacity: 0.85, radius: 48, speed: 0.009 },
      { n: Math.floor(count * 0.18), size: 0.42, opacity: 1, radius: 36, speed: 0.014 },
    ]

    for (const spec of specs) {
      const positions = new Float32Array(spec.n * 3)
      const colors = new Float32Array(spec.n * 3)
      const tint = new THREE.Color()

      for (let i = 0; i < spec.n; i++) {
        const r = spec.radius * (0.55 + Math.random() * 0.45)
        const theta = Math.random() * TAU
        const phi = Math.acos(rand(-1, 1))
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = r * Math.cos(phi) * 0.62
        positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)

        const roll = Math.random()
        if (roll > 0.9) tint.setHSL(0.58, 0.75, 0.82)
        else if (roll > 0.76) tint.setHSL(0.08, 0.7, 0.8)
        else if (roll > 0.6) tint.setHSL(0.72, 0.55, 0.8)
        else tint.setHSL(0.6, 0.18, 0.86)

        colors[i * 3] = tint.r
        colors[i * 3 + 1] = tint.g
        colors[i * 3 + 2] = tint.b
      }

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

      const material = new THREE.PointsMaterial({
        size: spec.size,
        map,
        vertexColors: true,
        transparent: true,
        opacity: spec.opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      })

      const points = new THREE.Points(geometry, material)
      points.frustumCulled = false
      this.group.add(points)
      this.layers.push({ points, material, speed: spec.speed })
    }
  }

  update(dt: number): void {
    for (const layer of this.layers) {
      layer.points.rotation.y += layer.speed * dt
      layer.points.rotation.x += layer.speed * 0.32 * dt
    }
  }
}

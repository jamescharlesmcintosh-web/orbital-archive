import * as THREE from 'three'
import { makeSoftDiscTexture } from '../lib/textures'
import { TAU, rand } from '../lib/math'

export class Dust {
  readonly points: THREE.Points
  private material: THREE.PointsMaterial
  private readonly count: number
  private readonly positions: Float32Array
  private readonly velocities: Float32Array

  constructor(count = 900) {
    this.count = count
    this.positions = new Float32Array(count * 3)
    this.velocities = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const r = rand(4, 26)
      const theta = Math.random() * TAU
      const y = rand(-7, 9)
      this.positions[i * 3] = Math.cos(theta) * r
      this.positions[i * 3 + 1] = y
      this.positions[i * 3 + 2] = Math.sin(theta) * r

      this.velocities[i * 3] = rand(-0.07, 0.07)
      this.velocities[i * 3 + 1] = rand(-0.03, 0.05)
      this.velocities[i * 3 + 2] = rand(-0.07, 0.07)
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))

    this.material = new THREE.PointsMaterial({
      size: 0.045,
      map: new THREE.CanvasTexture(makeSoftDiscTexture()),
      color: 0x86b6ff,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      sizeAttenuation: true,
    })

    this.points = new THREE.Points(geometry, this.material)
    this.points.frustumCulled = false
  }

  update(dt: number): void {
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3
      this.positions[i3] += this.velocities[i3] * dt
      this.positions[i3 + 1] += this.velocities[i3 + 1] * dt
      this.positions[i3 + 2] += this.velocities[i3 + 2] * dt

      const x = this.positions[i3]
      const y = this.positions[i3 + 1]
      const z = this.positions[i3 + 2]
      const distSq = x * x + z * z

      if (distSq > 720 || y > 11 || y < -9) {
        const r = rand(4, 22)
        const theta = Math.random() * TAU
        this.positions[i3] = Math.cos(theta) * r
        this.positions[i3 + 1] = rand(-7, 9)
        this.positions[i3 + 2] = Math.sin(theta) * r
      }
    }

    const attr = this.points.geometry.getAttribute('position') as THREE.BufferAttribute
    attr.needsUpdate = true
    this.points.rotation.y += dt * 0.012
  }
}

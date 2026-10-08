import * as THREE from 'three'
import { makeBeamTexture } from '../lib/textures'
import { TAU, rand } from '../lib/math'

interface Streak {
  mesh: THREE.Mesh
  speed: number
  spin: number
}

export class Streaks {
  readonly group = new THREE.Group()
  private streaks: Streak[] = []

  constructor(count = 14) {
    const texture = new THREE.CanvasTexture(makeBeamTexture())
    texture.colorSpace = THREE.SRGBColorSpace

    for (let i = 0; i < count; i++) {
      const length = rand(9, 26)
      const geometry = new THREE.PlaneGeometry(rand(0.025, 0.08), length)
      const hue = Math.random() > 0.5 ? 0x6ea8ff : 0xb08cff
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        color: hue,
        transparent: true,
        opacity: rand(0.1, 0.3),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      })

      const mesh = new THREE.Mesh(geometry, material)
      const theta = Math.random() * TAU
      const radius = rand(9, 30)
      mesh.position.set(Math.cos(theta) * radius, rand(-6, 12), Math.sin(theta) * radius)
      mesh.rotation.set(rand(-0.5, 0.5), theta + Math.PI / 2, rand(-0.35, 0.35))
      mesh.renderOrder = -5

      this.group.add(mesh)
      this.streaks.push({ mesh, speed: rand(0.12, 0.42), spin: rand(-0.02, 0.02) })
    }
  }

  update(dt: number): void {
    for (const s of this.streaks) {
      s.mesh.rotation.z += s.spin * dt
      s.mesh.position.y += s.speed * dt
      if (s.mesh.position.y > 16) s.mesh.position.y = -10
    }
  }
}

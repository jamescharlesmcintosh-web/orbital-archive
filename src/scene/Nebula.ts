import * as THREE from 'three'
import { makeNebulaTexture } from '../lib/textures'
import { TAU, rand } from '../lib/math'

interface Sheet {
  mesh: THREE.Mesh
  spin: number
  drift: number
  phase: number
  baseY: number
}

export class Nebula {
  readonly group = new THREE.Group()
  private sheets: Sheet[] = []

  constructor() {
    const palettes: [string, string][] = [
      ['#2b3fd6', '#7a3cff'],
      ['#0f5fb8', '#1fc8d8'],
      ['#5b2bb8', '#d8409a'],
      ['#1a3a8c', '#4f7cff'],
      ['#7a2c8c', '#ff5f9e'],
      ['#0d4a6e', '#3ad0c0'],
      ['#3b2a9c', '#8b5cff'],
    ]

    palettes.forEach(([a, b], i) => {
      const texture = new THREE.CanvasTexture(makeNebulaTexture(a, b, i * 37 + 11))
      texture.colorSpace = THREE.SRGBColorSpace

      const size = rand(26, 46)
      const geometry = new THREE.PlaneGeometry(size, size * rand(0.6, 1.05))
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: rand(0.3, 0.52),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      })

      const mesh = new THREE.Mesh(geometry, material)
      const theta = (i / palettes.length) * TAU + rand(-0.4, 0.4)
      const radius = rand(34, 52)
      const y = rand(-16, 18)
      mesh.position.set(Math.cos(theta) * radius, y, Math.sin(theta) * radius)
      mesh.lookAt(0, y * 0.35, 0)
      mesh.rotateZ(rand(0, TAU))
      mesh.renderOrder = -10 + i

      this.group.add(mesh)
      this.sheets.push({
        mesh,
        spin: rand(-0.012, 0.012),
        drift: rand(-0.05, 0.05),
        phase: rand(0, TAU),
        baseY: y,
      })
    })
  }

  update(elapsed: number, dt: number): void {
    for (const s of this.sheets) {
      s.mesh.rotation.z += s.spin * dt
      s.mesh.position.y = s.baseY + Math.sin(elapsed * 0.12 + s.phase) * 1.6
      s.mesh.position.x += s.drift * dt * 0.15
    }
  }
}

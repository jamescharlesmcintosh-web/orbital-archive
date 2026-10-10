import * as THREE from 'three'
import type { Project } from '../types'
import { makeBeamTexture, makeGlowTexture, makeProjectTexture } from '../lib/textures'
import { TAU, clamp, damp, lerp } from '../lib/math'

const PANEL_W = 3.7
const PANEL_H = 2.32
const RING_RADIUS = 13
const RING_Y = 1.15
const RING_TILT = -0.24
const ORBIT_SPEED = -0.04

interface Station {
  index: number
  project: Project
  group: THREE.Group
  screen: THREE.Mesh
  screenBack: THREE.Mesh
  screenMaterial: THREE.MeshBasicMaterial
  glow: THREE.Mesh
  glowMaterial: THREE.MeshBasicMaterial
  edgeMaterial: THREE.MeshBasicMaterial
  baseAngle: number
  baseX: number
  baseY: number
  baseZ: number
  phase: number
  hover: number
  hoverTarget: number
  focus: number
  focusTarget: number
}

export class PanelRing {
  readonly group = new THREE.Group()
  readonly hitTargets: THREE.Mesh[] = []
  readonly stations: Station[] = []

  private glowTexture: THREE.CanvasTexture
  private beamTexture: THREE.CanvasTexture

  constructor(projects: Project[], maxAnisotropy: number) {
    this.glowTexture = new THREE.CanvasTexture(makeGlowTexture())
    this.glowTexture.colorSpace = THREE.SRGBColorSpace
    this.beamTexture = new THREE.CanvasTexture(makeBeamTexture())
    this.beamTexture.colorSpace = THREE.SRGBColorSpace

    projects.forEach((project, index) => {
      const station = this.buildStation(project, index, projects.length, maxAnisotropy)
      this.stations.push(station)
      this.group.add(station.group)
      this.hitTargets.push(station.screen, station.screenBack)
    })
  }

  private buildStation(
    project: Project,
    index: number,
    total: number,
    maxAnisotropy: number,
  ): Station {
    const angle = (index / total) * TAU - Math.PI / 2
    const group = new THREE.Group()

    const x = Math.cos(angle) * RING_RADIUS
    const z = Math.sin(angle) * RING_RADIUS
    group.position.set(x, RING_Y, z)
    group.lookAt(x * 2.2, RING_Y, z * 2.2)
    group.rotateX(RING_TILT)

    const canvasTexture = new THREE.CanvasTexture(makeProjectTexture(project))
    canvasTexture.colorSpace = THREE.SRGBColorSpace
    canvasTexture.anisotropy = maxAnisotropy

    const screenMaterial = new THREE.MeshBasicMaterial({
      map: canvasTexture,
      color: new THREE.Color().setScalar(0.7),
      transparent: true,
      opacity: 1,
      toneMapped: false,
    })
    const screenGeometry = new THREE.PlaneGeometry(PANEL_W, PANEL_H, 1, 1)
    const screen = new THREE.Mesh(screenGeometry, screenMaterial)
    screen.userData.index = index
    screen.renderOrder = 4
    group.add(screen)

    const screenBack = new THREE.Mesh(screenGeometry, screenMaterial)
    screenBack.rotation.y = Math.PI
    screenBack.position.z = -0.002
    screenBack.userData.index = index
    screenBack.renderOrder = 4
    group.add(screenBack)

    const edgeMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(project.accent),
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
    const edge = new THREE.Mesh(
      new THREE.PlaneGeometry(PANEL_W + 0.16, PANEL_H + 0.16),
      edgeMaterial,
    )
    edge.position.z = -0.012
    edge.renderOrder = 3
    group.add(edge)

    const glowMaterial = new THREE.MeshBasicMaterial({
      map: this.glowTexture,
      color: new THREE.Color(project.accent),
      transparent: true,
      opacity: 0.26,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(PANEL_W * 3.1, PANEL_H * 2.9),
      glowMaterial,
    )
    glow.position.z = -0.5
    glow.renderOrder = 2
    group.add(glow)

    const beamMaterial = new THREE.MeshBasicMaterial({
      map: this.beamTexture,
      color: new THREE.Color(project.accent),
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 3.6), beamMaterial)
    beam.position.set(0, -PANEL_H * 0.5 - 1.55, -0.16)
    beam.rotation.x = 0.12
    group.add(beam)

    const beamTop = beam.clone()
    beamTop.position.y = PANEL_H * 0.5 + 1.55
    beamTop.rotation.x = -0.12
    group.add(beamTop)

    const haloMaterial = new THREE.SpriteMaterial({
      map: this.glowTexture,
      color: new THREE.Color(project.accent),
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
    const halo = new THREE.Sprite(haloMaterial)
    halo.scale.setScalar(1.5)
    halo.position.set(PANEL_W * 0.5 - 0.24, PANEL_H * 0.5 - 0.22, 0.16)
    group.add(halo)

    return {
      index,
      project,
      group,
      screen,
      screenBack,
      screenMaterial,
      glow,
      glowMaterial,
      edgeMaterial,
      baseAngle: angle,
      baseX: x,
      baseY: RING_Y,
      baseZ: z,
      phase: Math.random() * TAU,
      hover: 0,
      hoverTarget: 0,
      focus: 0,
      focusTarget: 0,
    }
  }

  loadExternalImages(loader: THREE.TextureLoader): void {
    for (const station of this.stations) {
      const src = station.project.image
      if (!src) continue
      loader.load(
        src,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace
          texture.anisotropy = 8
          station.screenMaterial.map?.dispose()
          station.screenMaterial.map = texture
          station.screenMaterial.needsUpdate = true
        },
        undefined,
        () => undefined,
      )
    }
  }

  setHovered(index: number | null): void {
    for (const s of this.stations) s.hoverTarget = s.index === index ? 1 : 0
  }

  setFocused(index: number | null): void {
    for (const s of this.stations) s.focusTarget = s.index === index ? 1 : 0
  }

  getFocusFrame(index: number): { position: THREE.Vector3; lookAt: THREE.Vector3 } {
    const station = this.stations[index]
    const outward = station.group.position.clone().setY(0).normalize()
    const screenRight = new THREE.Vector3(outward.z, 0, -outward.x)

    const position = station.group.position
      .clone()
      .addScaledVector(outward, 5)
      .add(new THREE.Vector3(0, 0.55, 0))

    const lookAt = station.group.position
      .clone()
      .addScaledVector(screenRight, 1.55)
      .add(new THREE.Vector3(0, 0.15, 0))

    return { position, lookAt }
  }

  update(elapsed: number, dt: number): void {
    const orbit = elapsed * ORBIT_SPEED

    for (const s of this.stations) {
      s.hover = damp(s.hover, s.hoverTarget, 9, dt)
      s.focus = damp(s.focus, s.focusTarget, 6, dt)
      const emphasis = clamp(s.hover * 0.55 + s.focus, 0, 1)

      const angle = s.baseAngle + orbit
      const x = Math.cos(angle) * RING_RADIUS
      const z = Math.sin(angle) * RING_RADIUS
      const y =
        s.baseY +
        Math.sin(elapsed * 0.55 + s.phase) * 0.14 +
        emphasis * 0.16 +
        Math.cos(elapsed * 0.38 + s.phase * 1.3) * 0.05

      s.baseX = x
      s.baseZ = z

      s.group.position.set(x, y, z)
      s.group.lookAt(x * 2.2, y, z * 2.2)
      s.group.rotateX(RING_TILT)

      const scale = lerp(1, 1.05, emphasis)
      s.group.scale.setScalar(scale)

      s.glowMaterial.opacity = lerp(0.22, 0.55, emphasis)
      s.edgeMaterial.opacity = lerp(0.34, 1, emphasis)
      s.screenMaterial.opacity = lerp(0.86, 1, emphasis)
      s.glow.scale.setScalar(lerp(1, 1.18, emphasis))
    }
  }

  dispose(): void {
    this.group.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined
      if (Array.isArray(material)) material.forEach((m) => m.dispose())
      else material?.dispose()
    })
    this.glowTexture.dispose()
    this.beamTexture.dispose()
  }
}

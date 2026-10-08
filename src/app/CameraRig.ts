import * as THREE from 'three'
import { TAU, clamp, damp, shortestAngle } from '../lib/math'

export type RigMode = 'orbit' | 'focus'

export interface FocusFrame {
  position: THREE.Vector3
  lookAt: THREE.Vector3
}

const MIN_RADIUS = 11
const MAX_RADIUS = 40
const ZOOM_MIN = -7
const ZOOM_MAX = 24

export class CameraRig {
  readonly camera: THREE.PerspectiveCamera

  azimuth = -Math.PI / 2
  radius = 18
  elevation = 4.3

  mode: RigMode = 'orbit'
  autoRotate = true
  frozen = false

  private readonly target = new THREE.Vector3(0, 1.5, 0)
  private readonly currentLook = new THREE.Vector3(0, 1.5, 0)
  private readonly desiredPosition = new THREE.Vector3()
  private readonly desiredLook = new THREE.Vector3()

  private focusFrame: FocusFrame | null = null
  private parallaxX = 0
  private parallaxY = 0
  private zoomOffset = 0
  private idleTimer = 0

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 220)
    this.camera.position.set(
      Math.cos(this.azimuth) * this.radius,
      this.elevation,
      Math.sin(this.azimuth) * this.radius,
    )
    this.currentLook.copy(this.target)
  }

  setMode(mode: RigMode): void {
    this.mode = mode
    if (mode === 'focus') this.autoRotate = false
  }

  setFocusFrame(frame: FocusFrame | null): void {
    this.focusFrame = frame
  }

  nudgeParallax(x: number, y: number): void {
    this.parallaxX = x
    this.parallaxY = y
    this.idleTimer = 0
  }

  rotateBy(delta: number): void {
    this.azimuth += delta
    this.idleTimer = 0
    this.autoRotate = false
  }

  zoomBy(delta: number): void {
    this.zoomOffset = clamp(this.zoomOffset + delta, ZOOM_MIN, ZOOM_MAX)
    this.idleTimer = 0
  }

  get viewRadius(): number {
    return clamp(this.radius + this.zoomOffset, MIN_RADIUS, MAX_RADIUS)
  }

  get zoomOutAmount(): number {
    return this.viewRadius - this.radius
  }

  setAspect(aspect: number): void {
    this.camera.aspect = aspect
    this.camera.fov = aspect < 1 ? 62 : aspect < 1.35 ? 54 : 48
    this.camera.updateProjectionMatrix()
  }

  update(dt: number): void {
    this.idleTimer += dt
    if (this.mode === 'orbit' && this.idleTimer > 2.4) this.autoRotate = !this.frozen

    if (this.mode === 'focus' && this.focusFrame) {
      this.desiredPosition.copy(this.focusFrame.position)
      this.desiredLook.copy(this.focusFrame.lookAt)

      this.camera.position.set(
        damp(this.camera.position.x, this.desiredPosition.x, 4.4, dt),
        damp(this.camera.position.y, this.desiredPosition.y, 4.4, dt),
        damp(this.camera.position.z, this.desiredPosition.z, 4.4, dt),
      )
      this.currentLook.set(
        damp(this.currentLook.x, this.desiredLook.x, 5.6, dt),
        damp(this.currentLook.y, this.desiredLook.y, 5.6, dt),
        damp(this.currentLook.z, this.desiredLook.z, 5.6, dt),
      )
    } else {
      if (this.autoRotate && !this.frozen) this.azimuth += dt * 0.045

      const radius = this.viewRadius
      const rise = Math.max(0, radius - this.radius) * 0.17
      const az = this.azimuth + this.parallaxX * 0.12
      const el = this.elevation + this.parallaxY * 1.25 + rise

      this.desiredPosition.set(
        Math.cos(az) * radius,
        el,
        Math.sin(az) * radius,
      )
      this.desiredLook.copy(this.target)

      this.camera.position.set(
        damp(this.camera.position.x, this.desiredPosition.x, 3, dt),
        damp(this.camera.position.y, this.desiredPosition.y, 3, dt),
        damp(this.camera.position.z, this.desiredPosition.z, 3, dt),
      )
      this.currentLook.set(
        damp(this.currentLook.x, this.desiredLook.x, 3.8, dt),
        damp(this.currentLook.y, this.desiredLook.y, 3.8, dt),
        damp(this.currentLook.z, this.desiredLook.z, 3.8, dt),
      )
    }

    this.camera.lookAt(this.currentLook)
  }

  faceAzimuthTowards(azimuth: number): void {
    this.azimuth = shortestAngle(this.azimuth, azimuth)
    this.autoRotate = false
    this.idleTimer = 0
  }

  get forwardAzimuth(): number {
    return (Math.atan2(this.camera.position.z, this.camera.position.x) + TAU) % TAU
  }
}

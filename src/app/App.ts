import * as THREE from 'three'
import projects from '../data/projects'
import type { ViewState } from '../types'
import { World } from './World'
import { CameraRig } from './CameraRig'
import { Input } from './Input'
import { PostFX } from './PostFX'
import { Interface, type ViewName } from '../ui/Interface'
import { clamp } from '../lib/math'

const EXPLORE_AT = 4
const CHROME_REVEAL_Y = 150

export class App {
  private readonly canvas: HTMLCanvasElement
  private readonly renderer: THREE.WebGLRenderer
  private readonly world: World
  private readonly rig: CameraRig
  private readonly input: Input
  private readonly postfx: PostFX
  private readonly ui: Interface
  private readonly raycaster = new THREE.Raycaster()
  private readonly clock = new THREE.Clock()

  private state: ViewState = 'loading'
  private activeIndex = 0
  private hoveredIndex: number | null = null
  private elapsed = 0
  private booted = false
  private reducedMotion = false
  private exploring = false
  private chromeVisible = true
  private raf = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    const width = window.innerWidth
    const height = window.innerHeight
    const pixelRatio = clamp(window.devicePixelRatio || 1, 1, 2)

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false,
      depth: true,
    })
    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(width, height, false)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.02
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy()

    this.world = new World(projects, maxAnisotropy)
    this.world.loadImages(new THREE.TextureLoader())

    this.rig = new CameraRig(width / height)
    this.input = new Input(canvas)
    this.postfx = new PostFX(this.renderer, this.world.scene, this.rig.camera, width, height, pixelRatio)

    this.ui = new Interface(projects, {
      onEnter: () => this.enterFocus(this.activeIndex),
      onClose: () => this.exitFocus(),
      onNext: () => this.step(1),
      onSelectProject: (index) => this.enterFocus(index),
      onView: (view) => this.setView(view),
    })

    this.input.onSelect = (event) => this.handleSelect(event)
    this.input.onCancel = () => this.handleCancel()
    this.input.onNavigate = (direction) => this.step(direction)

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    this.reducedMotion = media.matches
    media.addEventListener?.('change', (e) => {
      this.reducedMotion = e.matches
    })

    window.addEventListener('resize', this.handleResize)
    window.addEventListener('hashchange', this.handleHashChange)
    this.handleResize()

    if (this.reducedMotion) {
      this.ui.setLoading(1)
      this.ui.skipIntro()
      this.finishBoot()
    } else {
      this.ui.setLoading(0.22)
      window.setTimeout(() => {
        this.ui.setLoading(0.68)
        window.setTimeout(() => {
          this.ui.setLoading(1)
          window.setTimeout(() => this.ui.hideLoader(), 320)
          this.finishBoot()
        }, 380)
      }, 90)
    }

    this.loop()
  }

  private handleResize = (): void => {
    const width = window.innerWidth
    const height = window.innerHeight
    const pixelRatio = clamp(window.devicePixelRatio || 1, 1, 2)

    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(width, height, false)
    this.rig.setAspect(width / height)
    this.postfx.setSize(width, height, pixelRatio)
  }

  private handleSelect = (event: PointerEvent): void => {
    if (this.ui.currentView !== 'world') return

    const hit = this.pick(event)
    if (hit !== null) {
      if (this.state === 'focus' && hit === this.activeIndex) {
        this.exitFocus()
      } else {
        this.enterFocus(hit)
      }
      return
    }

    if (this.state === 'focus') this.exitFocus()
  }

  private handleCancel = (): void => {
    if (this.ui.currentView !== 'world') {
      this.setView('world')
      return
    }
    if (this.state === 'focus') this.exitFocus()
  }

  private pick(event: PointerEvent): number | null {
    const rect = this.canvas.getBoundingClientRect()
    const ndc = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )
    this.raycaster.setFromCamera(ndc, this.rig.camera)
    const hits = this.raycaster.intersectObjects(this.world.panels.hitTargets, false)
    if (!hits.length) return null
    return hits[0].object.userData.index as number
  }

  private updateHover(): void {
    if (this.ui.currentView !== 'world' || this.state === 'focus') {
      if (this.hoveredIndex !== null) {
        this.hoveredIndex = null
        this.world.panels.setHovered(null)
        this.canvas.classList.remove('is-hot')
      }
      return
    }

    this.raycaster.setFromCamera(this.input.state.pointer, this.rig.camera)
    const hits = this.raycaster.intersectObjects(this.world.panels.hitTargets, false)
    const next = hits.length ? (hits[0].object.userData.index as number) : null

    if (next !== this.hoveredIndex) {
      this.hoveredIndex = next
      this.world.panels.setHovered(next)
      this.canvas.classList.toggle('is-hot', next !== null)
    }
  }

  private syncHash = (): void => {
    const id = this.state === 'focus' ? projects[this.activeIndex].id : ''
    const next = id ? `#${id}` : '#'
    if (location.hash !== next) {
      history.replaceState(null, '', next === '#' ? location.pathname + location.search : next)
    }
  }

  private handleHashChange = (): void => {
    const id = location.hash.replace('#', '')
    const index = projects.findIndex((p) => p.id === id)
    if (index >= 0) {
      if (this.state !== 'focus' || index !== this.activeIndex) this.enterFocus(index)
      return
    }
    if (this.state === 'focus') this.exitFocus()
  }

  enterFocus(index: number): void {
    const total = projects.length
    this.activeIndex = ((index % total) + total) % total
    this.state = 'focus'

    this.world.panels.setHovered(null)
    this.hoveredIndex = null
    this.world.panels.setFocused(this.activeIndex)

    this.rig.setMode('focus')
    this.rig.setFocusFrame(this.world.panels.getFocusFrame(this.activeIndex))

    const project = projects[this.activeIndex]
    this.ui.setView('world')
    this.ui.setHeroVisible(false)
    this.ui.showRecord(project, this.activeIndex)
    this.ui.highlightIndex(this.activeIndex)
    this.syncHash()
  }

  exitFocus(): void {
    this.state = 'orbit'
    this.world.panels.setFocused(null)
    this.rig.setMode('orbit')
    this.rig.setFocusFrame(null)
    this.ui.hideRecord()
    this.ui.setHeroVisible(true)
    this.syncHash()
  }

  step(direction: -1 | 1): void {
    const total = projects.length

    if (this.state === 'focus') {
      this.enterFocus(this.activeIndex + direction)
      return
    }

    const next = ((this.activeIndex + direction) % total + total) % total
    this.activeIndex = next
    const pos = this.world.panels.stations[next].group.position
    this.rig.faceAzimuthTowards(Math.atan2(pos.z, pos.x))
    this.ui.setMeter(next)
    this.ui.setStationLabel(`${String(next + 1).padStart(2, '0')} · ${projects[next].title}`)
  }

  setView(view: ViewName): void {
    this.ui.setView(view)
    if (view === 'index') this.ui.highlightIndex(this.activeIndex)

    if (view === 'world' && this.state === 'focus') {
      this.world.panels.setFocused(this.activeIndex)
      this.ui.setHeroVisible(false)
      this.ui.showRecord(projects[this.activeIndex], this.activeIndex)
    } else if (view !== 'world') {
      this.world.panels.setFocused(null)
    }
  }

  private finishBoot(): void {
    if (this.booted) return
    this.booted = true
    this.state = 'orbit'
    this.ui.setStationLabel('Ring · idle')
    this.ui.setMeter(0)
    if (location.hash.length > 1) this.handleHashChange()
  }

  private syncChrome = (): void => {
    const exploring = this.state !== 'focus' && this.rig.zoomOutAmount > EXPLORE_AT

    if (exploring !== this.exploring) {
      this.exploring = exploring
      this.ui.setExploring(exploring)
    }

    const pointerY = (1 - this.input.state.pointer.y) * 0.5 * window.innerHeight
    const chromeVisible =
      !this.exploring || this.ui.currentView !== 'world' || pointerY < CHROME_REVEAL_Y

    if (chromeVisible !== this.chromeVisible) {
      this.chromeVisible = chromeVisible
      this.ui.setChromeVisible(chromeVisible)
    }
  }

  private loop = (): void => {
    this.raf = requestAnimationFrame(this.loop)

    const dt = Math.min(this.clock.getDelta(), 0.05)
    this.elapsed += dt

    const { deltaX, deltaY, wheel } = this.input.consume()

    if (this.state !== 'focus' && this.ui.currentView === 'world') {
      if (deltaX !== 0) this.rig.rotateBy(-deltaX * 0.0042)
      if (deltaY !== 0) this.rig.zoomBy(deltaY * 0.012)
      if (wheel !== 0) this.rig.zoomBy(wheel * 1.6)
    }

    const pointer = this.input.state.pointer
    if (this.reducedMotion) {
      this.rig.nudgeParallax(0, 0)
    } else {
      this.rig.nudgeParallax(pointer.x, pointer.y)
    }

    if (this.state === 'focus') {
      this.rig.setFocusFrame(this.world.panels.getFocusFrame(this.activeIndex))
    }

    this.rig.frozen = this.reducedMotion
    this.rig.update(dt)
    this.world.update(this.reducedMotion ? 0 : this.elapsed, this.reducedMotion ? dt * 0.12 : dt)
    this.postfx.update(dt)

    this.syncChrome()
    this.updateHover()

    this.canvas.classList.toggle('is-dragging', this.input.state.dragging)

    this.postfx.composer.render()
  }

  dispose(): void {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('hashchange', this.handleHashChange)
    this.input.dispose()
    this.world.panels.dispose()
    this.renderer.dispose()
    this.postfx.composer.dispose()
  }
}

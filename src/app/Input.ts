import * as THREE from 'three'

export interface InputState {
  pointer: THREE.Vector2
  pointerDown: boolean
  dragging: boolean
  deltaX: number
  deltaY: number
  wheel: number
  dragDistance: number
}

export class Input {
  readonly state: InputState = {
    pointer: new THREE.Vector2(0, 0),
    pointerDown: false,
    dragging: false,
    deltaX: 0,
    deltaY: 0,
    wheel: 0,
    dragDistance: 0,
  }

  private lastX = 0
  private lastY = 0
  private pointerId: number | null = null

  onSelect: ((event: PointerEvent) => void) | null = null
  onCancel: (() => void) | null = null
  onNavigate: ((direction: -1 | 1) => void) | null = null

  constructor(private readonly element: HTMLElement) {
    element.addEventListener('pointerdown', this.handlePointerDown)
    window.addEventListener('pointermove', this.handlePointerMove)
    window.addEventListener('pointerup', this.handlePointerUp)
    window.addEventListener('pointercancel', this.handlePointerUp)
    element.addEventListener('wheel', this.handleWheel, { passive: false })
    window.addEventListener('keydown', this.handleKeyDown)
    element.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  private handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 && event.pointerType === 'mouse') return
    this.pointerId = event.pointerId
    this.state.pointerDown = true
    this.state.dragging = false
    this.state.dragDistance = 0
    this.lastX = event.clientX
    this.lastY = event.clientY
    this.updatePointer(event)
    this.element.setPointerCapture?.(event.pointerId)
  }

  private handlePointerMove = (event: PointerEvent): void => {
    this.updatePointer(event)
    if (!this.state.pointerDown) return

    const dx = event.clientX - this.lastX
    const dy = event.clientY - this.lastY
    this.lastX = event.clientX
    this.lastY = event.clientY

    this.state.dragDistance += Math.abs(dx) + Math.abs(dy)
    if (this.state.dragDistance > 6) this.state.dragging = true

    this.state.deltaX += dx
    this.state.deltaY += dy
  }

  private handlePointerUp = (event: PointerEvent): void => {
    if (this.pointerId !== null && event.pointerId !== this.pointerId) return
    if (this.state.pointerDown && !this.state.dragging && this.onSelect) {
      this.onSelect(event)
    }
    this.state.pointerDown = false
    this.state.dragging = false
    this.pointerId = null
  }

  private handleWheel = (event: WheelEvent): void => {
    event.preventDefault()
    const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1
    this.state.wheel += event.deltaY * scale * 0.0032
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement | null
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

    switch (event.key) {
      case 'ArrowRight':
      case 'd':
      case 'D':
        event.preventDefault()
        this.onNavigate?.(1)
        break
      case 'ArrowLeft':
      case 'a':
      case 'A':
        event.preventDefault()
        this.onNavigate?.(-1)
        break
      case 'Escape':
        this.onCancel?.()
        break
      default:
        break
    }
  }

  private updatePointer(event: PointerEvent): void {
    const rect = this.element.getBoundingClientRect()
    this.state.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.state.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  consume() {
    const { deltaX, deltaY, wheel } = this.state
    this.state.deltaX = 0
    this.state.deltaY = 0
    this.state.wheel = 0
    return { deltaX, deltaY, wheel }
  }

  dispose(): void {
    this.element.removeEventListener('pointerdown', this.handlePointerDown)
    window.removeEventListener('pointermove', this.handlePointerMove)
    window.removeEventListener('pointerup', this.handlePointerUp)
    window.removeEventListener('pointercancel', this.handlePointerUp)
    this.element.removeEventListener('wheel', this.handleWheel)
    window.removeEventListener('keydown', this.handleKeyDown)
  }
}

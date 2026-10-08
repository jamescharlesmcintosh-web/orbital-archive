import * as THREE from 'three'
import type { Project } from '../types'
import { Starfield } from '../scene/Starfield'
import { Nebula } from '../scene/Nebula'
import { Core } from '../scene/Core'
import { Dust } from '../scene/Dust'
import { Streaks } from '../scene/Streaks'
import { PanelRing } from '../scene/PanelRing'

export class World {
  readonly scene = new THREE.Scene()
  readonly panels: PanelRing

  private readonly starfield: Starfield
  private readonly nebula: Nebula
  private readonly core: Core
  private readonly dust: Dust
  private readonly streaks: Streaks

  constructor(projects: Project[], maxAnisotropy: number) {
    this.scene.background = new THREE.Color('#05060c')

    this.starfield = new Starfield(4200)
    this.nebula = new Nebula()
    this.core = new Core()
    this.dust = new Dust(900)
    this.streaks = new Streaks(14)
    this.panels = new PanelRing(projects, maxAnisotropy)

    this.core.group.position.set(0, 1.15, 0)

    this.scene.add(this.starfield.group)
    this.scene.add(this.nebula.group)
    this.scene.add(this.core.group)
    this.scene.add(this.dust.points)
    this.scene.add(this.streaks.group)
    this.scene.add(this.panels.group)
  }

  loadImages(loader: THREE.TextureLoader): void {
    this.panels.loadExternalImages(loader)
  }

  update(elapsed: number, dt: number): void {
    this.starfield.update(dt)
    this.nebula.update(elapsed, dt)
    this.core.update(dt)
    this.dust.update(dt)
    this.streaks.update(dt)
    this.panels.update(elapsed, dt)
  }
}

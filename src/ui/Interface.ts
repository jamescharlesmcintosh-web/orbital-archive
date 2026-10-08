import type { Project } from '../types'
import { makeProjectThumb } from '../lib/textures'

export type ViewName = 'world' | 'index' | 'about'

export interface InterfaceHandlers {
  onEnter: () => void
  onClose: () => void
  onNext: () => void
  onSelectProject: (index: number) => void
  onView: (view: ViewName) => void
}

const $ = <T extends HTMLElement>(root: HTMLElement, selector: string): T => {
  const el = root.querySelector(selector)
  if (!el) throw new Error(`missing element: ${selector}`)
  return el as T
}

export class Interface {
  private readonly root: HTMLElement
  private readonly loader: HTMLElement
  private readonly loaderFill: HTMLElement
  private readonly loaderPct: HTMLElement
  private readonly hero: HTMLElement
  private readonly record: HTMLElement
  private readonly indexPanel: HTMLElement
  private readonly indexGrid: HTMLElement
  private readonly aboutPanel: HTMLElement
  private readonly station: HTMLElement
  private readonly meter: HTMLElement
  private readonly count: HTMLElement

  private readonly recordFields: Record<string, HTMLElement>
  private readonly liveLink: HTMLAnchorElement
  private readonly repoLink: HTMLAnchorElement

  private view: ViewName = 'world'

  constructor(
    private readonly projects: Project[],
    private readonly handlers: InterfaceHandlers,
  ) {
    this.root = document.getElementById('interface') as HTMLElement
    this.loader = document.querySelector('[data-el="loader"]') as HTMLElement
    this.loaderFill = document.querySelector('[data-el="loader-fill"]') as HTMLElement
    this.loaderPct = document.querySelector('[data-field="loader-pct"]') as HTMLElement
    this.hero = $(this.root, '[data-el="hero"]')
    this.record = $(this.root, '[data-el="record"]')
    this.indexPanel = $(this.root, '[data-el="index"]')
    this.indexGrid = $(this.root, '[data-el="index-grid"]')
    this.aboutPanel = $(this.root, '[data-el="about"]')
    this.station = $(this.root, '[data-field="station"]')
    this.meter = $(this.root, '[data-el="meter"]')
    this.count = $(this.root, '[data-field="count"]')

    this.recordFields = {
      index: $(this.record, '[data-field="index"]'),
      category: $(this.record, '[data-field="category"]'),
      title: $(this.record, '[data-field="title"]'),
      subtitle: $(this.record, '[data-field="subtitle"]'),
      description: $(this.record, '[data-field="description"]'),
      year: $(this.record, '[data-field="year"]'),
      role: $(this.record, '[data-field="role"]'),
    }
    this.liveLink = $(this.record, '[data-field="live"]') as HTMLAnchorElement
    this.repoLink = $(this.record, '[data-field="repo"]') as HTMLAnchorElement

    this.buildStackContainer()
    this.buildIndex()
    this.bind()
    this.setMeter(0)
  }

  private buildStackContainer(): void {
    const holder = $(this.record, '[data-field="stack"]')
    holder.classList.add('chips')
  }

  private buildIndex(): void {
    const frag = document.createDocumentFragment()

    this.projects.forEach((project, i) => {
      const card = document.createElement('button')
      card.type = 'button'
      card.className = 'card'
      card.dataset.index = String(i)

      const thumb = document.createElement('div')
      thumb.className = 'card__thumb'
      const img = document.createElement('img')
      img.alt = `${project.title} preview`
      img.loading = 'lazy'
      img.src = makeProjectThumb(project).toDataURL('image/png')
      thumb.appendChild(img)

      const accent = document.createElement('span')
      accent.className = 'card__accent'
      accent.style.background = project.accent

      const body = document.createElement('div')
      body.className = 'card__body'

      const meta = document.createElement('div')
      meta.className = 'card__meta'
      meta.innerHTML = `<span>${project.category}</span><span>${project.year}</span>`

      const title = document.createElement('h3')
      title.className = 'card__title'
      title.textContent = project.title

      const sub = document.createElement('p')
      sub.className = 'card__sub'
      sub.textContent = project.subtitle

      const num = document.createElement('span')
      num.className = 'card__num'
      num.textContent = String(i + 1).padStart(2, '0')

      body.append(meta, title, sub)
      card.append(thumb, accent, body, num)
      frag.appendChild(card)
    })

    this.indexGrid.appendChild(frag)
  }

  private bind(): void {
    this.root.addEventListener('click', (event) => {
      const raw = event.target as HTMLElement

      if (raw === this.indexPanel || raw === this.aboutPanel) {
        this.handlers.onView('world')
        return
      }

      const target = raw.closest<HTMLElement>('[data-action], [data-view], .card')
      if (!target) return

      if (target.classList.contains('card')) {
        const index = Number(target.dataset.index)
        this.handlers.onSelectProject(index)
        return
      }

      const action = target.dataset.action
      const view = target.dataset.view as ViewName | undefined

      if (view) {
        this.handlers.onView(view)
        return
      }

      switch (action) {
        case 'enter':
          this.handlers.onEnter()
          break
        case 'close':
          this.handlers.onClose()
          break
        case 'next':
          this.handlers.onNext()
          break
        case 'close-index':
          this.handlers.onView('world')
          break
        case 'close-about':
          this.handlers.onView('world')
          break
        case 'home':
          this.handlers.onView('world')
          break
        default:
          break
      }
    })
  }

  setLoading(progress: number): void {
    const pct = Math.round(progress * 100)
    this.loaderFill.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`
    this.loaderPct.textContent = `${pct}%`
  }

  hideLoader(): void {
    this.loader.classList.add('is-done')
    window.setTimeout(() => {
      this.loader.style.display = 'none'
    }, 900)
  }

  skipIntro(): void {
    this.loader.classList.add('is-done')
    this.loader.style.display = 'none'
  }

  setAccent(hex: string): void {
    document.documentElement.style.setProperty('--accent', hex)
  }

  setHeroVisible(visible: boolean): void {
    this.hero.classList.toggle('is-hidden', !visible)
  }

  setExploring(active: boolean): void {
    this.root.classList.toggle('is-exploring', active)
  }

  setChromeVisible(visible: boolean): void {
    this.root.classList.toggle('is-chrome', visible)
  }

  setStationLabel(text: string): void {
    this.station.textContent = text
  }

  setMeter(index: number): void {
    const total = this.projects.length
    this.count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`
    this.meter.style.transform = `scaleX(${(index + 1) / total})`
  }

  showRecord(project: Project, index: number): void {
    this.recordFields.index.textContent = String(index + 1).padStart(2, '0')
    this.recordFields.category.textContent = project.category
    this.recordFields.title.textContent = project.title
    this.recordFields.subtitle.textContent = project.subtitle
    this.recordFields.description.textContent = project.description
    this.recordFields.year.textContent = project.year
    this.recordFields.role.textContent = project.role

    const chips = $(this.record, '[data-field="stack"]')
    chips.innerHTML = project.stack.map((s) => `<span class="chip">${s}</span>`).join('')

    if (project.liveUrl) {
      this.liveLink.href = project.liveUrl
      this.liveLink.classList.remove('is-disabled')
    } else {
      this.liveLink.removeAttribute('href')
      this.liveLink.classList.add('is-disabled')
    }

    if (project.repoUrl) {
      this.repoLink.href = project.repoUrl
      this.repoLink.classList.remove('is-disabled')
    } else {
      this.repoLink.removeAttribute('href')
      this.repoLink.classList.add('is-disabled')
    }

    this.record.classList.add('is-open')
    this.setAccent(project.accent)
    this.setMeter(index)
    this.setStationLabel(`${String(index + 1).padStart(2, '0')} · ${project.title}`)
  }

  hideRecord(): void {
    this.record.classList.remove('is-open')
    this.setAccent('#8b7cff')
    this.setStationLabel('Ring · idle')
    this.setMeter(0)
  }

  setView(view: ViewName): void {
    this.view = view
    this.indexPanel.classList.toggle('is-open', view === 'index')
    this.aboutPanel.classList.toggle('is-open', view === 'about')

    this.root.querySelectorAll<HTMLButtonElement>('.nav__btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.view === view)
    })

    if (view === 'index') this.record.classList.remove('is-open')
    if (view === 'about') this.record.classList.remove('is-open')
    if (view === 'world') this.record.classList.remove('is-open')
    document.body.classList.toggle('is-modal', view !== 'world')
  }

  get currentView(): ViewName {
    return this.view
  }

  highlightIndex(index: number): void {
    this.indexGrid.querySelectorAll('.card').forEach((card, i) => {
      card.classList.toggle('is-active', i === index)
    })
  }
}

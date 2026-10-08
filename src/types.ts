export interface Project {
  id: string
  title: string
  subtitle: string
  category: string
  year: string
  role: string
  description: string
  stack: string[]
  liveUrl?: string
  repoUrl?: string
  accent: string
  accentSoft: string
  image?: string
  variant: number
}

export type ViewState = 'loading' | 'orbit' | 'focus'

export interface Station {
  index: number
  project: Project
  angle: number
}

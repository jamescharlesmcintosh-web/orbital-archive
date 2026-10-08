import './styles/main.css'
import { App } from './app/App'

const canvas = document.getElementById('scene')
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('scene canvas not found')
}

const app = new App(canvas)

window.addEventListener('pagehide', () => app.dispose(), { once: true })

import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

const FinishShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uGrain: { value: 0.05 },
    uVignette: { value: 1.12 },
    uAberration: { value: 0.0022 },
    uIntensity: { value: 1 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrain;
    uniform float uVignette;
    uniform float uAberration;
    uniform float uIntensity;
    varying vec2 vUv;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    void main() {
      vec2 uv = vUv;
      vec2 fromCenter = uv - 0.5;
      float dist = length(fromCenter);

      float ab = uAberration * (0.35 + dist * dist * 2.2);
      vec2 dir = fromCenter / max(dist, 1e-4);

      vec3 col;
      col.r = texture2D(tDiffuse, uv - dir * ab).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv + dir * ab).b;

      float vig = smoothstep(1.02, 0.16, dist * uVignette);
      col *= mix(1.0, vig, 0.82);

      float n = hash(uv * vec2(1920.0, 1080.0) + fract(uTime) * 91.7);
      col += (n - 0.5) * uGrain;

      gl_FragColor = vec4(col * uIntensity, 1.0);
    }
  `,
}

export class PostFX {
  readonly composer: EffectComposer

  private readonly bloom: UnrealBloomPass
  private readonly finish: ShaderPass
  private elapsed = 0

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    width: number,
    height: number,
    pixelRatio: number,
  ) {
    this.composer = new EffectComposer(renderer)
    this.composer.renderTarget1.samples = 4
    this.composer.renderTarget2.samples = 4
    this.composer.setPixelRatio(pixelRatio)
    this.composer.setSize(width, height)

    this.composer.addPass(new RenderPass(scene, camera))

    this.bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.58, 0.62, 0.72)
    this.composer.addPass(this.bloom)

    this.composer.addPass(new OutputPass())

    this.finish = new ShaderPass(FinishShader)
    this.finish.renderToScreen = true
    this.composer.addPass(this.finish)
  }

  setSize(width: number, height: number, pixelRatio: number): void {
    this.composer.setPixelRatio(pixelRatio)
    this.composer.setSize(width, height)
  }

  update(dt: number): void {
    this.elapsed += dt
    this.finish.uniforms.uTime.value = this.elapsed
  }
}

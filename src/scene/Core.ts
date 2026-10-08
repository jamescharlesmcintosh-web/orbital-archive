import * as THREE from 'three'
import { makeGlowTexture, makeSoftDiscTexture } from '../lib/textures'
import { TAU } from '../lib/math'

const fresnelVertex = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormalW = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fresnelFragment = /* glsl */ `
  uniform vec3 uInner;
  uniform vec3 uOuter;
  uniform float uPower;
  uniform float uIntensity;
  uniform float uTime;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    float fres = pow(1.0 - clamp(dot(normalize(vViewDir), normalize(vNormalW)), 0.0, 1.0), uPower);
    float pulse = 0.82 + 0.18 * sin(uTime * 1.15);
    vec3 col = mix(uInner, uOuter, fres);
    gl_FragColor = vec4(col * fres * uIntensity * pulse, fres);
  }
`

export class Core {
  readonly group = new THREE.Group()

  private shellMaterial: THREE.ShaderMaterial
  private rings: THREE.Mesh[] = []
  private halo: THREE.Sprite
  private sparks: THREE.Points
  private sparkMaterial: THREE.PointsMaterial
  private elapsed = 0

  constructor() {
    const inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.52, 3),
      new THREE.MeshBasicMaterial({ color: 0x060a14, toneMapped: false }),
    )
    this.group.add(inner)

    this.shellMaterial = new THREE.ShaderMaterial({
      vertexShader: fresnelVertex,
      fragmentShader: fresnelFragment,
      uniforms: {
        uInner: { value: new THREE.Color('#3a5bff') },
        uOuter: { value: new THREE.Color('#9fd8ff') },
        uPower: { value: 2.4 },
        uIntensity: { value: 2.4 },
        uTime: { value: 0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
    })

    const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(0.66, 4), this.shellMaterial)
    this.group.add(shell)

    const ringSpecs: [number, number, number, number][] = [
      [1.18, 0.011, 0.35, 0.018],
      [1.56, 0.008, -0.62, -0.013],
      [0.92, 0.007, 1.15, 0.024],
    ]

    for (const [radius, tube, tilt, speed] of ringSpecs) {
      const geometry = new THREE.TorusGeometry(radius, tube, 8, 220)
      const material = new THREE.MeshBasicMaterial({
        color: 0x79c8ff,
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
      const ring = new THREE.Mesh(geometry, material)
      ring.rotation.x = Math.PI / 2 + tilt
      ring.rotation.y = tilt * 0.6
      ring.userData.speed = speed
      this.group.add(ring)
      this.rings.push(ring)
    }

    const haloTexture = new THREE.CanvasTexture(makeGlowTexture())
    haloTexture.colorSpace = THREE.SRGBColorSpace
    this.halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: haloTexture,
        color: 0x4d7dff,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    )
    this.halo.scale.setScalar(6.2)
    this.group.add(this.halo)

    const sparkCount = 340
    const positions = new Float32Array(sparkCount * 3)
    const base = new Float32Array(sparkCount * 3)
    for (let i = 0; i < sparkCount; i++) {
      const r = 0.8 + Math.random() * 1.35
      const theta = Math.random() * TAU
      const phi = Math.acos(2 * Math.random() - 1)
      base[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      base[i * 3 + 1] = r * Math.cos(phi) * 0.5
      base[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3] = base[i * 3]
      positions[i * 3 + 1] = base[i * 3 + 1]
      positions[i * 3 + 2] = base[i * 3 + 2]
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    this.sparkMaterial = new THREE.PointsMaterial({
      size: 0.038,
      map: new THREE.CanvasTexture(makeSoftDiscTexture()),
      color: 0x9fd4ff,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })

    this.sparks = new THREE.Points(geometry, this.sparkMaterial)
    this.sparks.userData.base = base
    this.group.add(this.sparks)
  }

  update(dt: number): void {
    this.elapsed += dt
    this.shellMaterial.uniforms.uTime.value = this.elapsed

    this.group.rotation.y += dt * 0.06

    for (const ring of this.rings) {
      ring.rotation.z += (ring.userData.speed as number) * dt * 2.4
      ring.rotation.y += (ring.userData.speed as number) * dt * 0.7
    }

    this.halo.scale.setScalar(6.2 + Math.sin(this.elapsed * 0.9) * 0.5)

    const attr = this.sparks.geometry.getAttribute('position') as THREE.BufferAttribute
    const base = this.sparks.userData.base as Float32Array
    const arr = attr.array as Float32Array
    for (let i = 0; i < arr.length; i += 3) {
      const wobble = 1 + Math.sin(this.elapsed * 0.7 + i) * 0.028
      arr[i] = base[i] * wobble
      arr[i + 1] = base[i + 1] * wobble
      arr[i + 2] = base[i + 2] * wobble
    }
    attr.needsUpdate = true
  }
}

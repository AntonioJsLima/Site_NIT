import { useEffect, useRef } from 'react'
import * as THREE from 'three'

type TrailPoint = { x: number; y: number; vx: number; vy: number; life: number }

/** Sample bright pixels from the supplied background image as the second particle target. */
function createImageTargets(image: HTMLImageElement, width: number, height: number, count: number, mobile: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.floor(width))
  canvas.height = Math.max(1, Math.floor(height))
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return new Float32Array(count * 3)

  context.clearRect(0, 0, canvas.width, canvas.height)
  // Preserve the artwork ratio and cover the viewport so the network reaches its corners.
  // The overflow is intentionally cropped by the offscreen canvas, like CSS background-size: cover.
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const drawWidth = image.naturalWidth * scale
  const drawHeight = image.naturalHeight * scale
  const offsetX = (width - drawWidth) / 2
  const offsetY = (height - drawHeight) / 2
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
  const candidates: Array<[number, number]> = []
  const gap = mobile ? 3 : 2
  let candidateCount = 0
  for (let y = 0; y < canvas.height; y += gap) {
    for (let x = 0; x < canvas.width; x += gap) {
      const index = (y * canvas.width + x) * 4
      if (pixels[index] > 105 && pixels[index + 1] > 105 && pixels[index + 2] > 105) {
        candidateCount++
        if (candidates.length < count) candidates.push([x, y])
        else {
          // Reservoir sampling caps memory at the particle count instead of
          // allocating one JavaScript tuple for every bright image pixel.
          const replacement = Math.floor(Math.random() * candidateCount)
          if (replacement < count) candidates[replacement] = [x, y]
        }
      }
    }
  }

  const targets = new Float32Array(count * 3)
  if (!candidates.length) return targets
  for (let i = 0; i < count; i++) {
    const [x, y] = candidates[i % candidates.length]
    const i3 = i * 3
    targets[i3] = x - width / 2 + (Math.random() - 0.5) * gap * 0.55
    targets[i3 + 1] = -(y - height / 2) + (Math.random() - 0.5) * gap * 0.55
  }
  return targets
}

/** Reproduce OrbitAgro's final-screen ring mask as particle destinations. */
function createCircularTargets(width: number, height: number, count: number, mobile: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.floor(width))
  canvas.height = Math.max(1, Math.floor(height))
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const targets = new Float32Array(count * 3)
  if (!context) return targets

  const cx = canvas.width / 2
  const cy = canvas.height / 2
  const baseRadius = Math.min(canvas.width, canvas.height) * 0.4
  for (let ring = 0; ring < 5; ring++) {
    context.lineWidth = 1 + Math.random() * 4
    context.strokeStyle = `rgba(255,255,255,${1 - ring * 0.2})`
    if (ring % 2 === 0) context.setLineDash([10 + Math.random() * 30, 10 + Math.random() * 20])
    else context.setLineDash([])
    context.beginPath()
    context.arc(cx, cy, baseRadius + ring * 25, 0, Math.PI * 2)
    context.stroke()
  }

  context.globalCompositeOperation = 'source-over'
  const glow = context.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 1.5)
  glow.addColorStop(0, 'rgba(255,255,255,0.15)')
  glow.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = glow
  context.beginPath()
  context.arc(cx, cy, baseRadius * 1.5, 0, Math.PI * 2)
  context.fill()

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
  const candidates: Array<[number, number]> = []
  const gap = mobile ? 3 : 2
  for (let y = 0; y < canvas.height; y += gap) {
    for (let x = 0; x < canvas.width; x += gap) {
      if (pixels[(y * canvas.width + x) * 4 + 3] > 24) candidates.push([x, y])
    }
  }

  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }
  if (!candidates.length) return targets

  for (let i = 0; i < count; i++) {
    const [x, y] = candidates[i % candidates.length]
    targets[i * 3] = x - cx
    targets[i * 3 + 1] = -(y - cy)
  }
  return targets
}

// Particle feel is kept together here so it is straightforward to tune later.
const PHYSICS = {
  sampleDesktop: 1,
  sampleMobile: 3,
  maxDesktop: 8000,
  maxMobile: 7000,
  pointDesktop: 3.0,
  pointMobile: 2.0,
  returnIdle: 0.024,
  returnActive: 0.0026,
  scrollEase: 0.06,
  screenTransitionReturn: 0.018,
  screenTransitionEase: 0.14,
  friction: 0.940,
  maxSpeed: 0.02,
  pointerFollow: 0.00055,
  pointerRadiusDesktop: 185,
  pointerRadiusMobile: 128,
  trailRadiusDesktop: 178,
  trailRadiusMobile: 122,
  pathFollow: 0.0068,
  pathTargetPull: 0.038,
  pathEdgePull: 0.0085,
  pathOrbit: 0.0024,
  pathEdgeDesktop: 64,
  pathEdgeMobile: 42,
  flow: 0.00172,
  headPush: 0.0048,
  noise: 0.00013,
  idleDrift: 1.4,
}

export function ParticleLogo({
  responsibleMode = false,
  policiesMode = false,
}: {
  responsibleMode?: boolean
  policiesMode?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const responsibleModeRef = useRef(responsibleMode)
  responsibleModeRef.current = responsibleMode
  const policiesModeRef = useRef(policiesMode)
  policiesModeRef.current = policiesMode

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let disposed = false
    let animationFrame = 0
    let lastFrame = 0
    let width = 1
    let height = 1
    let mobile = false
    let lastPointerMove = 0
    let scrollTarget = 0
    let scrollProgress = 0
    let backgroundTargetsReady = false
    let backgroundTargetsScheduled = false
    let pointer = { x: -10000, y: -10000, active: false, lastX: 0, lastY: 0, lastTime: 0 }
    const trail: TrailPoint[] = []
    let current = new Float32Array()
    let targets = new Float32Array()
    let targetMasks: Float32Array[] = []
    let velocities = new Float32Array()
    let seeds = new Float32Array()
    let geometry = new THREE.BufferGeometry()
    let points: THREE.Points | null = null
    let material: THREE.ShaderMaterial | null = null

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
    camera.position.z = 10
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    const logo = new Image()
    logo.src = '/images/Logo_NIT.jpg'
    const backgroundImages = [
      '/images/Fundo_Tela01.jpg',
      '/images/Fundo_Tela02.jpg',
      '/images/Fundo_Tela03.jpg',
    ].map((src) => {
      const image = new Image()
      image.src = src
      return image
    })

    const buildParticles = () => {
      if (!logo.complete || !logo.naturalWidth) return
      const source = document.createElement('canvas')
      source.width = logo.naturalWidth
      source.height = logo.naturalHeight
      const context = source.getContext('2d', { willReadFrequently: true })
      if (!context) return
      context.drawImage(logo, 0, 0)
      const pixels = context.getImageData(0, 0, source.width, source.height).data
      const gap = mobile ? PHYSICS.sampleMobile : PHYSICS.sampleDesktop
      const samples: Array<[number, number]> = []
      const sampleLimit = mobile ? PHYSICS.maxMobile : PHYSICS.maxDesktop
      let sampleCount = 0
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity

      for (let y = 0; y < source.height; y += gap) {
        for (let x = 0; x < source.width; x += gap) {
          const index = (y * source.width + x) * 4
          // The NIT source is a light mark on navy; this threshold excludes its dark background.
          if (pixels[index] > 95 && pixels[index + 1] > 100 && pixels[index + 2] > 105) {
            const sampleX = x + (Math.random() - 0.5) * gap * 0.45
            const sampleY = y + (Math.random() - 0.5) * gap * 0.45
            minX = Math.min(minX, sampleX)
            maxX = Math.max(maxX, sampleX)
            minY = Math.min(minY, sampleY)
            maxY = Math.max(maxY, sampleY)
            sampleCount++
            if (samples.length < sampleLimit) samples.push([sampleX, sampleY])
            else {
              // Keep only the final particle budget while scanning the source.
              const replacement = Math.floor(Math.random() * sampleCount)
              if (replacement < sampleLimit) samples[replacement] = [sampleX, sampleY]
            }
          }
        }
      }
      if (!samples.length) return

      const selected = samples
      const logoWidth = maxX - minX
      const logoHeight = maxY - minY
      // Fit the complete mark inside the canvas while preserving its original proportions.
      // The canvas spans the viewport, but the mark keeps its compact hero scale.
      const maxLogoWidth = width * (mobile ? 0.94 : 0.72)
      const maxLogoHeight = Math.min(height * (mobile ? 0.36 : 0.34), mobile ? 260 : 320)
      const scale = Math.min(maxLogoWidth / logoWidth, maxLogoHeight / logoHeight)
      const count = selected.length
      current = new Float32Array(count * 3)
      targets = new Float32Array(count * 3)
      velocities = new Float32Array(count * 3)
      seeds = new Float32Array(count)

      selected.forEach(([x, y], i) => {
        const i3 = i * 3
        const tx = (x - (minX + maxX) / 2) * scale
        // Positive Y is upward in the Three.js camera; keep the mark centered
        // horizontally and above the subtitle instead of pushing it downward.
        const ty = -((y - (minY + maxY) / 2) * scale) + height * 0.12
        targets[i3] = tx
        targets[i3 + 1] = ty
        // Keep the current pose on resize; the first build starts scattered and settles into the mark.
        if (!points) {
          current[i3] = (Math.random() - 0.5) * width * 0.9
          current[i3 + 1] = (Math.random() - 0.5) * height * 0.9
          current[i3 + 2] = (Math.random() - 0.5) * 12
        } else {
          current[i3] = tx + (Math.random() - 0.5) * 8
          current[i3 + 1] = ty + (Math.random() - 0.5) * 8
        }
        seeds[i] = Math.random()
      })
      // Create the visible logo immediately; the full-screen target masks are
      // generated later during browser idle time so their pixel scans do not
      // block the first frames after opening the site.
      backgroundTargetsReady = false
      targetMasks = [targets, targets.slice(), targets.slice(), targets.slice(), targets.slice()]

      geometry.dispose()
      geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(current, 3).setUsage(THREE.DynamicDrawUsage))
      geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
      material?.dispose()
      material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uSize: { value: mobile ? PHYSICS.pointMobile : PHYSICS.pointDesktop }, uDpr: { value: renderer.getPixelRatio() } },
        vertexShader: `
          attribute float aSeed;
          uniform float uSize;
          uniform float uDpr;
          varying float vSeed;
          void main() {
            vSeed = aSeed;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = uSize * uDpr * (0.78 + fract(aSeed * 97.13) * 0.55);
          }
        `,
        fragmentShader: `
          varying float vSeed;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float dot = 1.0 - smoothstep(0.12, 0.5, d);
            float shimmer = 0.78 + 0.22 * sin(vSeed * 72.0);
            gl_FragColor = vec4(vec3(0.88, 0.96, 1.0), dot * shimmer * 0.92);
          }
        `,
      })
      points = new THREE.Points(geometry, material)
      // Positions change every frame and can roam over the viewport; a static
      // bounding sphere would incorrectly cull particles after they disperse.
      points.frustumCulled = false
      scene.clear()
      scene.add(points)
      ;(points.userData as { targetMasks?: Float32Array[] }).targetMasks = targetMasks
    }

    const runWhenIdle = (callback: () => void) => {
      const idleWindow = window as Window & {
        requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
      }
      if (idleWindow.requestIdleCallback) idleWindow.requestIdleCallback(callback, { timeout: 1600 })
      else window.setTimeout(callback, 250)
    }

    const scheduleBackgroundTargets = () => {
      if (disposed || !points || backgroundTargetsReady || backgroundTargetsScheduled) return
      if (!backgroundImages.every((image) => image.complete)) return
      backgroundTargetsScheduled = true

      const createTarget = (index: number) => {
        if (disposed || !points) return
        const image = backgroundImages[index]
        const fallback = index === 0 ? targets : targetMasks[index]
        targetMasks[index + 1] = image.naturalWidth
          ? createImageTargets(image, width, height, current.length / 3, mobile)
          : fallback.slice()
        ;(points.userData as { targetMasks?: Float32Array[] }).targetMasks = targetMasks
      }

      // Generate the image masks in idle time, then prepare the circular page
      // mask separately so the initial logo render stays responsive.
      runWhenIdle(() => {
        if (disposed) return
        createTarget(0)
        window.requestAnimationFrame(() => {
          runWhenIdle(() => {
            if (disposed) return
            createTarget(1)
            window.requestAnimationFrame(() => {
              runWhenIdle(() => {
                if (disposed) return
                createTarget(2)
                runWhenIdle(() => {
                  if (disposed || !points) return
                  targetMasks[4] = createCircularTargets(width, height, current.length / 3, mobile)
                  ;(points.userData as { targetMasks?: Float32Array[] }).targetMasks = targetMasks
                  backgroundTargetsReady = true
                  backgroundTargetsScheduled = false
                })
              })
            })
          })
        })
      })
    }

    const resize = () => {
      const rect = container.getBoundingClientRect()
      const nextWidth = Math.max(1, rect.width)
      const nextHeight = Math.max(1, rect.height)
      const sizeChanged = Math.abs(nextWidth - width) > 1 || Math.abs(nextHeight - height) > 1
      width = nextWidth
      height = nextHeight
      mobile = width < 650
      renderer.setSize(width, height, false)
      camera.left = -width / 2
      camera.right = width / 2
      camera.top = height / 2
      camera.bottom = -height / 2
      camera.updateProjectionMatrix()
      if (logo.complete && logo.naturalWidth && (!points || sizeChanged)) buildParticles()
      if (points) scheduleBackgroundTargets()
    }

    const addPointer = (x: number, y: number) => {
      const now = performance.now()
      const dt = Math.max(16, now - (pointer.lastTime || now))
      const vx = pointer.lastTime ? ((x - pointer.lastX) / dt) * 16.67 : 0
      const vy = pointer.lastTime ? ((y - pointer.lastY) / dt) * 16.67 : 0
      pointer = { x, y, active: true, lastX: x, lastY: y, lastTime: now }
      lastPointerMove = now
      const previous = trail[trail.length - 1]
      if (!previous || Math.hypot(x - previous.x, y - previous.y) > 3) {
        trail.push({ x, y, vx, vy, life: 1 })
        if (trail.length > 128) trail.shift()
      }
    }
    const onPointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      addPointer(event.clientX - rect.left - width / 2, -(event.clientY - rect.top - height / 2))
    }
    const onPointerLeave = () => { pointer.active = false }
    const onTouchEnd = () => { pointer.active = false }
    const scroller = container.closest<HTMLElement>('.screen')
    const hero = container.closest<HTMLElement>('.hero')
    const updateScrollTarget = () => {
      if (!hero) return
      const heroHeight = Math.max(1, hero.offsetHeight)
      const snapSections = scroller?.querySelectorAll('section:not(.policies-section)')
      const lastStage = Math.max(0, (snapSections?.length ?? 1) - 1)
      scrollTarget = THREE.MathUtils.clamp(-hero.getBoundingClientRect().top / heroHeight, 0, lastStage)
    }

    const animate = (now: number) => {
      animationFrame = requestAnimationFrame(animate)
      if (!points || !material || !current.length) return
      const dt = Math.min((now - (lastFrame || now)) / 16.67, 2.5)
      lastFrame = now
      const masks = (points.userData as { targetMasks?: Float32Array[] }).targetMasks ?? targetMasks
      const policiesStage = 3
      const responsibleStage = 4
      const targetProgress = responsibleModeRef.current && masks[responsibleStage]
        ? responsibleStage
        : policiesModeRef.current && masks[policiesStage]
          ? policiesStage
          : scrollTarget
      const transitionStarted = Math.abs(targetProgress - scrollProgress) > 0.006
      const progressEase = transitionStarted ? PHYSICS.screenTransitionEase : PHYSICS.scrollEase
      scrollProgress += (targetProgress - scrollProgress) * progressEase
      const transitioning = Math.abs(targetProgress - scrollProgress) > 0.006
      const fromStage = Math.min(Math.floor(scrollProgress), masks.length - 1)
      const toStage = Math.min(fromStage + 1, masks.length - 1)
      const stageMix = THREE.MathUtils.clamp(scrollProgress - fromStage, 0, 1)
      const fromMask = masks[fromStage] ?? targets
      const toMask = masks[toStage] ?? fromMask
      const activelyMoving = now - lastPointerMove < 190
      const recentlyTouched = now - lastPointerMove < 520
      // Preserve a short momentum window after each cursor gesture, as in the reference.
      const returnForce = transitioning
        ? PHYSICS.screenTransitionReturn
        : recentlyTouched
          ? PHYSICS.returnActive
          : PHYSICS.returnIdle
      const pointerRadius = mobile ? PHYSICS.pointerRadiusMobile : PHYSICS.pointerRadiusDesktop
      const trailRadius = mobile ? PHYSICS.trailRadiusMobile : PHYSICS.trailRadiusDesktop

      for (let i = 0; i < current.length / 3; i++) {
        const i3 = i * 3
        let x = current[i3], y = current[i3 + 1]
        let vx = velocities[i3], vy = velocities[i3 + 1], vz = velocities[i3 + 2]
        const driftX = recentlyTouched ? 0 : Math.sin(now * 0.004990 + seeds[i] * 19) * PHYSICS.idleDrift
        const driftY = recentlyTouched ? 0 : Math.cos(now * 0.004820  + seeds[i] * 31) * PHYSICS.idleDrift
        const targetX = fromMask[i3] + (toMask[i3] - fromMask[i3]) * stageMix + driftX
        const targetY = fromMask[i3 + 1] + (toMask[i3 + 1] - fromMask[i3 + 1]) * stageMix + driftY
        vx += (targetX - x) * returnForce * dt
        vy += (targetY - y) * returnForce * dt
        vz += -current[i3 + 2] * returnForce * dt

        // Isolated to the Responsável page: same tangential clockwise impulse
        // used by the OrbitAgro result stage. The existing screens keep their
        // original particle physics unchanged.
        const circularStageStrength = responsibleModeRef.current && masks[responsibleStage]
          ? Math.max(0, 1 - Math.abs(scrollProgress - responsibleStage))
          : 0
        if (circularStageStrength > 0.1) {
          const angle = Math.atan2(y, x)
          vx += Math.sin(angle) * 0.002 * width * circularStageStrength * dt
          vy -= Math.cos(angle) * 0.002 * height * circularStageStrength * dt
        }

        if (activelyMoving && trail.length) {
          const dx = pointer.x - x, dy = pointer.y - y
          const distance = Math.hypot(dx, dy)
          if (distance < pointerRadius && distance > 0.01) {
            const strength = Math.pow(1 - distance / pointerRadius, 1.45)
            // Reference mouse-follow force translated from clip-space to pixels.
            vx += (dx / distance) * 0.143 * strength * dt
            vy += (dy / distance) * 0.143 * strength * dt
          }

          // Select the strongest recent segment of the pointer trail.
          let hit: {
            x: number; y: number; d: number; tx: number; ty: number; nx: number; ny: number
            vx: number; vy: number; score: number; head: boolean
          } | null = null
          for (let t = Math.max(1, trail.length - 32); t < trail.length; t++) {
            const a = trail[t - 1], b = trail[t]
            const sx = b.x - a.x, sy = b.y - a.y
            const length2 = sx * sx + sy * sy || 1
            const u = THREE.MathUtils.clamp(((x - a.x) * sx + (y - a.y) * sy) / length2, 0, 1)
            const nearX = a.x + sx * u, nearY = a.y + sy * u
            const ox = x - nearX, oy = y - nearY
            const distanceToTrail = Math.hypot(ox, oy)
            if (distanceToTrail < 0.01) continue
            const age = (trail.length - t) / Math.max(1, trail.length)
            const radius = trailRadius * (1.08 - age * 0.42)
            if (distanceToTrail >= radius) continue
            const life = (a.life * (1 - u) + b.life * u) * (1 - age * 0.18)
            const score = Math.pow(1 - distanceToTrail / radius, 1.25) * life
            const length = Math.sqrt(length2) || 1
            if (!hit || score > hit.score) {
              hit = {
                x: nearX, y: nearY, d: distanceToTrail,
                tx: sx / length, ty: sy / length,
                nx: ox / distanceToTrail, ny: oy / distanceToTrail,
                vx: a.vx * (1 - u) + b.vx * u,
                vy: a.vy * (1 - u) + b.vy * u,
                score, head: t > trail.length - 5,
              }
            }
          }

          if (hit) {
            const gestureSpeed = Math.hypot(hit.vx, hit.vy)
            let directionX = hit.tx, directionY = hit.ty
            if (gestureSpeed > 0.01 && directionX * hit.vx + directionY * hit.vy < 0) {
              directionX *= -1
              directionY *= -1
            }
            const headBoost = hit.head ? 1.65 : 1
            const side = seeds[i] > 0.5 ? 1 : -1
            const edge = (mobile ? PHYSICS.pathEdgeMobile : PHYSICS.pathEdgeDesktop) * side
            const targetX = hit.x + hit.nx * edge
            const targetY = hit.y + hit.ny * edge
            const targetPull = Math.min(0.066, PHYSICS.pathTargetPull * hit.score * headBoost)
            const edgeForce = THREE.MathUtils.clamp((edge - hit.d * side) / 70, -1, 1)

            // Reference trail forces translated from clip-space into pixel-space.
            vx += (targetX - x) * targetPull * dt
            vy += (targetY - y) * targetPull * dt
            vx += directionX * PHYSICS.pathFollow * hit.score * 430 * dt
            vy += directionY * PHYSICS.pathFollow * hit.score * 430 * dt
            vx += hit.nx * PHYSICS.pathEdgePull * edgeForce * hit.score * 610 * headBoost * dt
            vy += hit.ny * PHYSICS.pathEdgePull * edgeForce * hit.score * 610 * headBoost * dt
            vx += hit.ty * PHYSICS.pathOrbit * hit.score * side * 165 * dt
            vy += -hit.tx * PHYSICS.pathOrbit * hit.score * side * 165 * dt
            vx += directionX * PHYSICS.flow * hit.score * gestureSpeed * 1.45 * dt
            vy += directionY * PHYSICS.flow * hit.score * gestureSpeed * 1.45 * dt
            vx += hit.nx * PHYSICS.headPush * hit.score * (hit.head ? 72 : 22) * dt
            vy += hit.ny * PHYSICS.headPush * hit.score * (hit.head ? 72 : 22) * dt
            vz += Math.sin(seeds[i] * 100) * 0.0032 * hit.score * dt
          }
        }

        vx += Math.sin(now * 0.001 + seeds[i] * 80) * PHYSICS.noise * width * 0.5 * dt
        vy += Math.cos(now * 0.0011 + seeds[i] * 53) * PHYSICS.noise * height * 0.5 * dt
        const damping = Math.pow(PHYSICS.friction, dt)
        vx *= damping
        vy *= damping
        vz *= Math.pow(0.92, dt)
        const speed = Math.hypot(vx, vy)
        const maxSpeed = PHYSICS.maxSpeed * width
        if (speed > maxSpeed) { vx *= maxSpeed / speed; vy *= maxSpeed / speed }
        x += vx * dt
        y += vy * dt
        // Keep dots inside the full-screen canvas so they remain visible while roaming.
        const edgeX = width / 2 - 3
        const edgeY = height / 2 - 3
        if (x < -edgeX || x > edgeX) { x = THREE.MathUtils.clamp(x, -edgeX, edgeX); vx = 0 }
        if (y < -edgeY || y > edgeY) { y = THREE.MathUtils.clamp(y, -edgeY, edgeY); vy = 0 }
        current[i3] = x
        current[i3 + 1] = y
        current[i3 + 2] = THREE.MathUtils.clamp(current[i3 + 2] + vz * dt, -6, 6)
        velocities[i3] = vx
        velocities[i3 + 1] = vy
        velocities[i3 + 2] = vz
      }

      for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].life *= activelyMoving ? 0.965 : 0.88
        if (trail[i].life < 0.025) trail.splice(i, 1)
      }
      geometry.attributes.position.needsUpdate = true
      renderer.render(scene, camera)
    }

    logo.onload = () => {
      if (disposed) return
      buildParticles()
      scheduleBackgroundTargets()
    }
    const backgroundFileNames = ['/images/Fundo_Tela01.jpg', '/images/Fundo_Tela02.jpg', '/images/Fundo_Tela03.jpg']
    backgroundImages.forEach((image, index) => {
      image.onload = scheduleBackgroundTargets
      image.onerror = () => {
        console.error(`Não consegui carregar ${backgroundFileNames[index] ?? image.src}`)
        scheduleBackgroundTargets()
      }
    })
    logo.onerror = () => console.error('Não consegui carregar /images/Logo_NIT.jpg')
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    scroller?.addEventListener('scroll', updateScrollTarget, { passive: true })
    window.addEventListener('scroll', updateScrollTarget, { passive: true })
    resize()
    if (!points && logo.complete && logo.naturalWidth) {
      buildParticles()
      scheduleBackgroundTargets()
    }
    updateScrollTarget()
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerleave', onPointerLeave)
    window.addEventListener('pointerup', onTouchEnd, { passive: true })
    animationFrame = requestAnimationFrame(animate)

    return () => {
      disposed = true
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      scroller?.removeEventListener('scroll', updateScrollTarget)
      window.removeEventListener('scroll', updateScrollTarget)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('pointerup', onTouchEnd)
      geometry.dispose()
      material?.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div ref={containerRef} className="particle-logo" role="img" aria-label="Partículas formam o logo do NIT e uma rede de inovação ao rolar a página" />
}

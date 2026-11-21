import React, {useEffect, useMemo, useRef, useState} from 'react';
import {thumb} from './media.js';
import Title from './Title.jsx';
import {useLang} from './i18n.js';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';

// One world-space path shared by the valley, the road lines, the camera and
// the project images. Keep the GLSL copy below identical to pathX().
const pathX = (z) => Math.sin(z * 0.046) * 3.15 + Math.sin(z * 0.018 + 1.2) * 1.55;

const ROAD_Y = -1.55;
const EYE_Y = -0.45;
const FOV = 34;
const MOBILE_FOV = 58; // portrait screens need a wider lens so images beside the road stay in frame
const SPACING = 12; // world units between consecutive images
const APPEAR = SPACING * 2; // images rise from the horizon at this distance, so at most two are on screen
const START_DISTANCE = 9;
const END_DISTANCE = 8;
const MAX_W = 3.2;
const MAX_H = 2.4;
const GAP = 0.35; // clearance between the camera line and an image's inner edge
const MOBILE_SIZE = {maxW: 2, maxH: 2.4, gap: 0.15};
const POINTS = {high: 24000, balanced: 15000, lite: 7500, mobile: 4500, 'mobile-lite': 2500};
const BASE_PX = 240; // CSS pixels per world unit before scaling

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uCamZ;
  uniform vec2 uMouse;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vFog;
  varying float vPointer;
  varying float vSide;

  float hash(float n) { return fract(sin(n) * 43758.5453123); }
  float pathX(float z) { return sin(z * 0.046) * 3.15 + sin(z * 0.018 + 1.2) * 1.55; }

  void main() {
    vec3 p = position;
    // Points stay fixed in world space and wrap around the moving camera.
    p.z = uCamZ - 114.0 + mod(p.z - uCamZ + 114.0, 120.0);
    float rel = p.z - uCamZ;

    float bend = pathX(p.z);
    p.x += bend;
    float terrain = pow(max(abs(p.x - bend) - 1.65, 0.0) * 0.195, 1.42);
    p.y += terrain + sin(p.z * 0.17 + aSeed * 13.0) * 0.17;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    vec4 projected = projectionMatrix * mvPosition;
    vec2 ndc = projected.xy / max(projected.w, 0.001);
    float pointer = smoothstep(0.43, 0.0, distance(ndc, uMouse));
    pointer *= smoothstep(-80.0, -5.0, rel);
    p.y += pointer * (0.45 + hash(aSeed * 71.0) * 0.8);
    p.x += pointer * sin(uTime * 1.5 + aSeed * 30.0) * 0.2;

    mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = (1.25 + hash(aSeed * 91.0) * 1.75 + pointer * 2.0) * uPixelRatio * (38.0 / max(-mvPosition.z, 1.0));
    gl_PointSize = clamp(gl_PointSize, 0.85, 4.5 * uPixelRatio);

    vPointer = pointer;
    vFog = smoothstep(-112.0, -18.0, rel) * smoothstep(8.0, -2.0, rel);
    vSide = step(0.0, p.x - bend);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  varying float vFog;
  varying float vPointer;
  varying float vSide;

  void main() {
    vec2 point = gl_PointCoord - 0.5;
    float grain = smoothstep(0.5, 0.08, length(point));
    if (grain < 0.02) discard;
    vec3 paper = vec3(0.68, 0.64, 0.57);
    vec3 cyan = vec3(0.0, 0.67, 0.82);
    vec3 orange = vec3(1.0, 0.22, 0.05);
    vec3 reactive = mix(cyan, orange, vSide);
    float pulse = 0.88 + sin(uTime * 2.0) * 0.12;
    vec3 color = mix(paper, reactive, vPointer * pulse);
    gl_FragColor = vec4(color, grain * vFog * (0.47 + vPointer * 0.53));
  }
`;

function createValley(count) {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const spread = 2.25 + Math.pow(Math.random(), 0.66) * 11.5;
    const z = 6 - Math.random() * 120;
    positions[index * 3] = side * spread + (Math.random() - 0.5) * 0.55;
    positions[index * 3 + 1] = -1.75 + Math.random() * 0.35;
    positions[index * 3 + 2] = z;
    seeds[index] = Math.random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  return geometry;
}

function Valley({camZRef, pointerRef, quality, active, onSlow, minFps = 47}) {
  const pointCount = POINTS[quality];
  const geometry = useMemo(() => createValley(pointCount), [pointCount]);
  const materialRef = useRef(null);
  const sampleRef = useRef({frames: 0, started: 0, reported: false});
  const uniforms = useMemo(() => ({
    uTime: {value: 0},
    uCamZ: {value: 0},
    uMouse: {value: new THREE.Vector2(4, 4)},
    uPixelRatio: {value: Math.min(window.devicePixelRatio || 1, quality === 'high' ? 1.5 : quality === 'balanced' ? 1.25 : 1)},
  }), [quality]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    sampleRef.current = {frames: 0, started: 0, reported: false};
  }, [quality]);

  useFrame(({clock}, delta) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    materialRef.current.uniforms.uCamZ.value = camZRef.current;
    materialRef.current.uniforms.uMouse.value.lerp(pointerRef.current, Math.min(1, delta * 8));
    if (!active || sampleRef.current.reported) return;
    if (!sampleRef.current.started) sampleRef.current.started = performance.now();
    sampleRef.current.frames += 1;
    const elapsed = performance.now() - sampleRef.current.started;
    if (elapsed > 2200 && sampleRef.current.frames > 45) {
      const fps = sampleRef.current.frames / (elapsed / 1000);
      sampleRef.current.reported = true;
      if (fps < minFps) onSlow();
    }
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Road({zStart, zEnd}) {
  const paths = useMemo(() => {
    const steps = Math.ceil((zStart - zEnd) / 0.6);
    const center = Array.from({length: steps + 1}, (_, step) => {
      const z = zStart - (step / steps) * (zStart - zEnd);
      return new THREE.Vector3(pathX(z), ROAD_Y, z);
    });
    return [-1.42, 0, 1.42].map((offset) =>
      new THREE.BufferGeometry().setFromPoints(
        center.map((point) => new THREE.Vector3(point.x + offset, point.y + (offset === 0 ? -0.035 : 0), point.z))
      )
    );
  }, [zStart, zEnd]);
  useEffect(() => () => paths.forEach((geometry) => geometry.dispose()), [paths]);
  return (
    <group>
      {paths.map((geometry, index) => (
        <line key={index} geometry={geometry}>
          <lineBasicMaterial color={index === 0 ? '#19a7c5' : index === 2 ? '#e84b21' : '#f1e7d6'} transparent opacity={index === 1 ? 0.24 : 0.42} />
        </line>
      ))}
    </group>
  );
}

const glowVertex = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFragment = /* glsl */ `
  varying vec2 vPos;
  void main() {
    // Wide, low ellipse centred on the horizon; below it the hills hide the source.
    vec2 q = vPos / vec2(58.0, 17.0);
    float d2 = dot(q, q);
    float glow = exp(-d2 * 1.6) * 0.085 + exp(-d2 * 9.0) * 0.05;
    glow *= mix(smoothstep(-9.0, 1.5, vPos.y), 1.0, step(0.0, vPos.y));
    gl_FragColor = vec4(vec3(1.0, 0.62, 0.42) * glow, 1.0);
  }
`;

const GLOW_DISTANCE = 105;

// Soft light source sitting behind the far hills on the horizon.
function HorizonGlow({camZRef}) {
  const meshRef = useRef(null);
  useFrame(({camera}) => {
    if (!meshRef.current) return;
    const z = camZRef.current - GLOW_DISTANCE;
    meshRef.current.position.set(pathX(z), EYE_Y - 0.6, z);
    meshRef.current.quaternion.copy(camera.quaternion);
  });
  return (
    <mesh ref={meshRef} renderOrder={-1} frustumCulled={false}>
      <planeGeometry args={[240, 90]} />
      <shaderMaterial vertexShader={glowVertex} fragmentShader={glowFragment} transparent depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

// Moves the camera along the path and places the HTML project buttons with the
// same camera, so images, road and valley always share one perspective.
function Rig({targetRef, progressRef, camZRef, cardsRef, layout, camStart, camEnd, onActive, fov}) {
  const point = useMemo(() => new THREE.Vector3(), []);
  const activeRef = useRef(-1);

  useFrame(({camera, size}, delta) => {
    progressRef.current += (targetRef.current - progressRef.current) * (1 - Math.pow(0.905, Math.min(delta, 0.1) * 60));
    const camZ = camStart + (camEnd - camStart) * progressRef.current;
    camZRef.current = camZ;
    camera.position.set(pathX(camZ), EYE_Y, camZ);
    camera.lookAt(pathX(camZ - 10), EYE_Y, camZ - 10);
    camera.updateMatrixWorld();

    const focal = size.height / 2 / Math.tan(THREE.MathUtils.degToRad(fov / 2));
    let nearest = -1;
    let nearestDepth = Infinity;
    const states = layout.map((item, index) => {
      point.set(item.x, item.y, item.z).applyMatrix4(camera.matrixWorldInverse);
      const depth = -point.z;
      const scale = focal / Math.max(depth, 0.01);
      const x = point.x * scale;
      const y = -point.y * scale;
      const onScreen = depth > 0.2 && depth <= APPEAR
        && Math.abs(x) - (item.w * scale) / 2 < size.width / 2
        && Math.abs(y) - (item.h * scale) / 2 < size.height / 2;
      if (onScreen && depth < nearestDepth) {
        nearest = index;
        nearestDepth = depth;
      }
      return {depth, scale, x, y, onScreen};
    });
    const active = nearest === -1 ? Math.max(0, layout.length - 1) : nearest;
    if (active !== activeRef.current) {
      activeRef.current = active;
      onActive(active);
    }

    states.forEach(({depth, scale, x, y, onScreen}, index) => {
      const card = cardsRef.current[index];
      if (!card) return;
      const fadeIn = THREE.MathUtils.clamp((APPEAR - depth) / 5, 0, 1);
      const far = THREE.MathUtils.clamp((depth - (SPACING - 1)) / (APPEAR - SPACING + 1), 0, 1);
      const isActive = index === active;
      card.style.visibility = onScreen ? 'visible' : 'hidden';
      card.style.pointerEvents = isActive ? 'auto' : 'none';
      card.tabIndex = isActive ? 0 : -1;
      card.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      if (!onScreen) return;
      // Real pixel size instead of a CSS scale: scaled-up layers are rasterised
      // at their base size and get clipped/re-tiled by the compositor while moving.
      card.style.width = `${(layout[index].w * scale).toFixed(1)}px`;
      card.style.height = `${(layout[index].h * scale).toFixed(1)}px`;
      card.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px), 0)`;
      card.style.opacity = String(fadeIn * (1 - far * 0.35));
      // blur(0px) still creates a filter surface, which is what clipped the near image.
      card.style.filter = far > 0.01 ? `blur(${(far * 7).toFixed(2)}px)` : 'none';
      card.style.zIndex = String(Math.max(1, 1000 - Math.round(depth * 10)));
    });
  });

  return null;
}

function QualityBadge({quality}) {
  return <span className="journey-quality" aria-label={`Visual quality: ${quality}`}>LIVE TERRAIN / {quality.toUpperCase()}</span>;
}

// Phones render on demand at ~30fps instead of every display frame.
function FrameCap({active, fps}) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (!active) return undefined;
    const timer = window.setInterval(() => invalidate(), 1000 / fps);
    return () => window.clearInterval(timer);
  }, [active, fps, invalidate]);
  return null;
}

function initialQuality(mobile) {
  if (mobile) return 'mobile';
  const memory = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  if (memory <= 4 || cores <= 4) return 'balanced';
  return 'high';
}

export default function WorkJourney({items, onOpen, mobile = false}) {
  const {t, lang} = useLang();
  const size = mobile ? MOBILE_SIZE : {maxW: MAX_W, maxH: MAX_H, gap: GAP};
  const fov = mobile ? MOBILE_FOV : FOV;
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);
  const progressRef = useRef(0);
  const pointerRef = useRef(new THREE.Vector2(4, 4));
  const targetRef = useRef(0);
  const camZRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const layout = useMemo(() => items.map((project, index) => {
    const ratio = project.ratio || 1.5;
    const w = Math.min(size.maxW, size.maxH * ratio);
    const h = w / ratio;
    const z = -(index + 1) * SPACING;
    const side = index % 2 === 0 ? 1 : -1;
    return {w, h, z, x: pathX(z) + side * (size.gap + w / 2), y: ROAD_Y + 0.1 + h / 2};
  }), [items, mobile]);
  const camStart = (layout[0]?.z ?? -SPACING) + START_DISTANCE;
  const camEnd = (layout[layout.length - 1]?.z ?? -SPACING) + END_DISTANCE;
  const [quality, setQuality] = useState(() => initialQuality(mobile));
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {rootMargin: '20% 0px'});
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;
    const updateTarget = () => {
      const rect = section.getBoundingClientRect();
      const travel = Math.max(section.offsetHeight - window.innerHeight, 1);
      targetRef.current = Math.min(1, Math.max(0, -rect.top / travel));
    };
    updateTarget();
    window.addEventListener('scroll', updateTarget, {passive: true});
    window.addEventListener('resize', updateTarget);
    return () => {
      window.removeEventListener('scroll', updateTarget);
      window.removeEventListener('resize', updateTarget);
    };
  }, [items]);

  const onPointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerRef.current.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -(((event.clientY - rect.top) / rect.height) * 2 - 1));
  };
  const onPointerLeave = () => pointerRef.current.set(4, 4);
  const downgrade = () => setQuality((current) => ({high: 'balanced', balanced: 'lite', mobile: 'mobile-lite'})[current] || current);
  const dpr = quality === 'high' ? [1, 1.5] : quality === 'balanced' ? [1, 1.25] : 1;
  const active = items[activeIndex] || items[0];

  return (
    <div className={`journey${mobile ? ' journey-mobile' : ''}`} ref={sectionRef} style={{'--journey-length': `${Math.max(6.4, items.length * 1.18 + 1.8) * 100}vh`}}>
      <div className="journey-sticky" onPointerMove={mobile ? undefined : onPointerMove} onPointerLeave={mobile ? undefined : onPointerLeave}>
        <div className="journey-canvas" aria-hidden="true">
          <Canvas
            camera={{position: [0, EYE_Y, 0], fov, near: 0.1, far: 140}}
            dpr={dpr}
            frameloop={!inView ? 'never' : mobile ? 'demand' : 'always'}
            gl={{alpha: false, antialias: false, powerPreference: mobile ? 'default' : 'high-performance'}}
          >
            {mobile && <FrameCap active={inView} fps={30} />}
            <color attach="background" args={['#070a0c']} />
            <fog attach="fog" args={['#070a0c', 15, 115]} />
            <Rig targetRef={targetRef} progressRef={progressRef} camZRef={camZRef} cardsRef={cardsRef} layout={layout} camStart={camStart} camEnd={camEnd} onActive={setActiveIndex} fov={fov} />
            <HorizonGlow camZRef={camZRef} />
            <Valley camZRef={camZRef} pointerRef={pointerRef} quality={quality} active={inView} onSlow={downgrade} minFps={mobile ? 22 : 47} />
            <Road zStart={camStart + 10} zEnd={camEnd - 130} />
          </Canvas>
        </div>
        <div className="journey-vignette" aria-hidden="true" />
        <div className="journey-chrome eyebrow" aria-hidden="true">
          <span>{t.work.travel}</span>
          <QualityBadge quality={quality} />
          <span>{String(activeIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
        </div>
        <div className="journey-stage">
          {items.map((project, index) => (
            <button
              className="journey-card"
              key={project.slug}
              style={{width: `${layout[index].w * BASE_PX}px`, height: `${layout[index].h * BASE_PX}px`}}
              ref={(node) => { cardsRef.current[index] = node; }}
              type="button"
              onClick={() => onOpen(project)}
              aria-label={t.work.viewLabel(project.title, project.role)}
            >
              <span className="journey-card-frame">
                <span className="band band-fill"><img src={thumb(project.cover)} alt="" loading="eager" decoding="async" draggable="false" /></span>
                <span className="journey-card-number eyebrow">{lang === 'tr' ? 'NO' : 'NO.'} {String(index + 1).padStart(2, '0')}</span>
                <span className="journey-card-action eyebrow">{t.work.view} ↗</span>
              </span>
            </button>
          ))}
        </div>
        <div className={`journey-caption ${activeIndex % 2 === 0 ? 'caption-left' : 'caption-right'}`} aria-live="polite">
          <p className="eyebrow">{active?.typeLabel} / {active?.genre}</p>
          <h3><Title project={active} /></h3>
          <p>{active?.role}</p>
          <button type="button" onClick={() => onOpen(active)}>{t.work.view} <span aria-hidden="true">↗</span></button>
        </div>
        <div className="journey-progress" aria-hidden="true"><i style={{transform: `scaleX(${(activeIndex + 1) / Math.max(items.length, 1)})`}} /></div>
      </div>
    </div>
  );
}

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Canvas, useFrame} from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;
  uniform vec2 uMouse;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vFog;
  varying float vPointer;
  varying float vSide;

  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  void main() {
    vec3 p = position;
    float travel = uProgress * 104.0;
    p.z = mod(p.z + travel + 112.0, 120.0) - 112.0;

    float bend = sin((p.z + travel) * 0.046) * 3.15 + sin((p.z + travel) * 0.018 + 1.2) * 1.55;
    p.x += bend;
    float terrain = pow(max(abs(p.x - bend) - 1.65, 0.0) * 0.195, 1.42);
    p.y += terrain + sin(p.z * 0.17 + aSeed * 13.0) * 0.17;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    vec4 projected = projectionMatrix * mvPosition;
    vec2 ndc = projected.xy / max(projected.w, 0.001);
    float pointer = smoothstep(0.43, 0.0, distance(ndc, uMouse));
    pointer *= smoothstep(-80.0, -5.0, p.z);
    p.y += pointer * (0.45 + hash(aSeed * 71.0) * 0.8);
    p.x += pointer * sin(uTime * 1.5 + aSeed * 30.0) * 0.2;

    mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = (1.25 + hash(aSeed * 91.0) * 1.75 + pointer * 2.0) * uPixelRatio * (38.0 / max(-mvPosition.z, 1.0));
    gl_PointSize = clamp(gl_PointSize, 0.85, 4.5 * uPixelRatio);

    vPointer = pointer;
    vFog = smoothstep(-112.0, -18.0, p.z) * smoothstep(8.0, -2.0, p.z);
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

function Valley({progressRef, pointerRef, quality, active, onSlow}) {
  const pointCount = quality === 'high' ? 24000 : quality === 'balanced' ? 15000 : 7500;
  const geometry = useMemo(() => createValley(pointCount), [pointCount]);
  const materialRef = useRef(null);
  const sampleRef = useRef({frames: 0, started: 0, reported: false});
  const uniforms = useMemo(() => ({
    uTime: {value: 0},
    uProgress: {value: 0},
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
    materialRef.current.uniforms.uProgress.value += (progressRef.current - materialRef.current.uniforms.uProgress.value) * Math.min(1, delta * 5.5);
    materialRef.current.uniforms.uMouse.value.lerp(pointerRef.current, Math.min(1, delta * 8));
    if (!active || sampleRef.current.reported) return;
    if (!sampleRef.current.started) sampleRef.current.started = performance.now();
    sampleRef.current.frames += 1;
    const elapsed = performance.now() - sampleRef.current.started;
    if (elapsed > 2200 && sampleRef.current.frames > 45) {
      const fps = sampleRef.current.frames / (elapsed / 1000);
      sampleRef.current.reported = true;
      if (fps < 47) onSlow();
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

function Road() {
  const paths = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.15, -1.55, 5),
      new THREE.Vector3(2.7, -1.55, -17),
      new THREE.Vector3(-3.15, -1.55, -40),
      new THREE.Vector3(2.85, -1.55, -64),
      new THREE.Vector3(-2.5, -1.55, -88),
      new THREE.Vector3(1.25, -1.55, -112),
    ]);
    const center = curve.getPoints(180);
    return [-1.42, 0, 1.42].map((offset) =>
      new THREE.BufferGeometry().setFromPoints(
        center.map((point) => new THREE.Vector3(point.x + offset, point.y + (offset === 0 ? -0.035 : 0), point.z))
      )
    );
  }, []);
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

function QualityBadge({quality}) {
  return <span className="journey-quality" aria-label={`Visual quality: ${quality}`}>LIVE TERRAIN / {quality.toUpperCase()}</span>;
}

function initialQuality() {
  const memory = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  if (memory <= 4 || cores <= 4) return 'balanced';
  return 'high';
}

export default function WorkJourney({items, onOpen}) {
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);
  const progressRef = useRef(0);
  const pointerRef = useRef(new THREE.Vector2(4, 4));
  const targetRef = useRef(0);
  const frameRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const [quality, setQuality] = useState(initialQuality);
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
    let running = true;
    const updateTarget = () => {
      const rect = section.getBoundingClientRect();
      const travel = Math.max(section.offsetHeight - window.innerHeight, 1);
      targetRef.current = Math.min(1, Math.max(0, -rect.top / travel));
    };
    const render = () => {
      if (!running) return;
      progressRef.current += (targetRef.current - progressRef.current) * 0.095;
      const journeyPosition = progressRef.current * Math.max(items.length - 1, 1);
      const baseIndex = Math.min(items.length - 1, Math.floor(journeyPosition + 0.0001));
      const phase = Math.min(1, Math.max(0, journeyPosition - baseIndex));
      const nextActive = Math.min(items.length - 1, baseIndex + (phase >= 0.72 ? 1 : 0));
      if (nextActive !== activeIndexRef.current) {
        activeIndexRef.current = nextActive;
        setActiveIndex(nextActive);
      }
      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        const slot = index - baseIndex;
        const side = index % 2 === 0 ? 1 : -1;
        let x = 0;
        let y = 0;
        let z = -4200;
        let rotate = 0;
        let opacity = 0;
        let blur = 14;
        let visible = slot >= 0 && slot <= 2;

        if (slot === 0) {
          const exit = Math.max(0, (phase - 0.48) / 0.52);
          x = side * (305 + exit * 820);
          y = 8 - exit * 80;
          z = exit * 600;
          rotate = side * (1.8 + exit * 14);
          opacity = 1 - exit;
          blur = 0;
        } else if (slot === 1) {
          x = side * (245 + phase * 60);
          y = 25 - phase * 17;
          z = -1280 + phase * 1280;
          rotate = side * (5.5 - phase * 3.7);
          opacity = 0.58 + phase * 0.42;
          blur = 7.5 * (1 - phase);
        } else if (slot === 2) {
          x = side * phase * 245;
          y = 4 + phase * 21;
          z = -3900 + phase * 2620;
          rotate = side * (1 + phase * 4.5);
          opacity = 0.34 + phase * 0.24;
          blur = 13 - phase * 5.5;
        }

        const active = index === nextActive;
        card.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), ${z}px) rotateY(${rotate}deg)`;
        card.style.opacity = String(opacity);
        card.style.filter = `blur(${blur}px)`;
        card.style.visibility = visible ? 'visible' : 'hidden';
        card.style.zIndex = slot === 0 ? '3' : slot === 1 ? '2' : '1';
        card.style.pointerEvents = active ? 'auto' : 'none';
        card.tabIndex = active ? 0 : -1;
        card.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      frameRef.current = requestAnimationFrame(render);
    };
    updateTarget();
    window.addEventListener('scroll', updateTarget, {passive: true});
    window.addEventListener('resize', updateTarget);
    frameRef.current = requestAnimationFrame(render);
    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('scroll', updateTarget);
      window.removeEventListener('resize', updateTarget);
    };
  }, [items]);

  const onPointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerRef.current.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -(((event.clientY - rect.top) / rect.height) * 2 - 1));
  };
  const onPointerLeave = () => pointerRef.current.set(4, 4);
  const downgrade = () => setQuality((current) => current === 'high' ? 'balanced' : current === 'balanced' ? 'lite' : 'lite');
  const dpr = quality === 'high' ? [1, 1.5] : quality === 'balanced' ? [1, 1.25] : 1;
  const active = items[activeIndex] || items[0];

  return (
    <div className="journey" ref={sectionRef} style={{'--journey-length': `${Math.max(6.4, items.length * 1.18 + 1.8) * 100}vh`}}>
      <div className="journey-sticky" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
        <div className="journey-canvas" aria-hidden="true">
          <Canvas
            camera={{position: [0, 1.8, 7.4], fov: 52, near: 0.1, far: 140}}
            dpr={dpr}
            frameloop={inView ? 'always' : 'never'}
            gl={{alpha: false, antialias: false, powerPreference: 'high-performance'}}
          >
            <color attach="background" args={['#070a0c']} />
            <fog attach="fog" args={['#070a0c', 15, 115]} />
            <Valley progressRef={progressRef} pointerRef={pointerRef} quality={quality} active={inView} onSlow={downgrade} />
            <Road />
          </Canvas>
        </div>
        <div className="journey-vignette" aria-hidden="true" />
        <div className="journey-chrome eyebrow" aria-hidden="true">
          <span>SCROLL TO TRAVEL</span>
          <QualityBadge quality={quality} />
          <span>{String(activeIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
        </div>
        <div className="journey-stage">
          {items.map((project, index) => (
            <button
              className="journey-card"
              key={project.slug}
              style={{aspectRatio: project.aspect, '--image-ratio': project.ratio}}
              ref={(node) => { cardsRef.current[index] = node; }}
              type="button"
              onClick={() => onOpen(project)}
              aria-label={`View ${project.title}. ${project.role}`}
            >
              <span className="journey-card-frame">
                <img src={project.cover} alt="" loading={index > 2 ? 'lazy' : 'eager'} draggable="false" />
                <span className="journey-card-number eyebrow">NO. {String(index + 1).padStart(2, '0')}</span>
                <span className="journey-card-action eyebrow">OPEN PROJECT ↗</span>
              </span>
            </button>
          ))}
        </div>
        <div className={`journey-caption ${activeIndex % 2 === 0 ? 'caption-left' : 'caption-right'}`} aria-live="polite">
          <p className="eyebrow">{active?.type} / {active?.genre}</p>
          <h3>{active?.title}</h3>
          <p>{active?.role}</p>
          <button type="button" onClick={() => onOpen(active)}>VIEW PROJECT <span aria-hidden="true">↗</span></button>
        </div>
        <div className="journey-progress" aria-hidden="true"><i style={{transform: `scaleX(${(activeIndex + 1) / Math.max(items.length, 1)})`}} /></div>
      </div>
    </div>
  );
}

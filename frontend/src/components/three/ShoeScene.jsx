import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment, Lightformer, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { createVariantController } from './shoeVariants.js';

export const MODEL_URL = '/models/shoe.glb';
const DRACO_PATH = '/draco/';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * The product rig:  pivot (intro, idle sway, scroll, pointer) > spin (user drag + inertia)
 *                   > kick (colourway-switch flourish) > holder (centre + unit scale + orientation fix)
 * Each concern owns one group so they never fight.
 */
function Rig({ variant, scrollRef, reduced, onVariants, onReady, baseRotation }) {
  const gltf = useGLTF(MODEL_URL, DRACO_PATH);
  const { gl, scene, camera, pointer, invalidate } = useThree();
  const pivot = useRef();
  const spin = useRef();
  const kick = useRef();
  const holder = useRef();
  const ctl = useRef(null);
  const state = useRef({
    vx: 0, vy: 0, dragging: false, lastInput: 0, swayW: 0,
    kickT: 1, start: 0, lastVariant: -1, ready: false,
  });

  // Normalise any GLB: centre it, scale to unit radius, remember where the sole sits
  const { model, sole } = useMemo(() => {
    const root = gltf.scene;                       // keep the ORIGINAL meshes: variant mappings point at them
    root.position.set(0, 0, 0);                    // idempotent under StrictMode double-invocation
    root.scale.setScalar(1);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const s = 1 / sphere.radius;
    root.position.copy(sphere.center).negate();
    const wrapper = new THREE.Group();
    wrapper.add(root);
    wrapper.scale.setScalar(s);
    return { model: wrapper, sole: (box.min.y - sphere.center.y) * s };
  }, [gltf]);

  // Variant controller + shader pre-warm so the first switch never hitches
  useEffect(() => {
    let cancelled = false;
    createVariantController(gltf).then((c) => {
      if (cancelled) return;
      ctl.current = c;
      onVariants?.(c.names);
      c.names.forEach((_, i) => { c.apply(i); gl.compile(scene, camera); });
      c.apply(0);
      state.current.ready = true;
      state.current.start = performance.now();
      onReady?.();
      invalidate();
    });
    return () => { cancelled = true; };
  }, [gltf]); // eslint-disable-line react-hooks/exhaustive-deps

  // Drag to rotate with inertia. Rotations are premultiplied around SCREEN axes so dragging
  // right always turns the visible face right, whatever the current orientation.
  useEffect(() => {
    const el = gl.domElement;
    const AX_X = new THREE.Vector3(1, 0, 0);
    const AX_Y = new THREE.Vector3(0, 1, 0);
    const dq = new THREE.Quaternion();
    let id = null, lx = 0, ly = 0, lt = 0;
    const s = state.current;

    const down = (e) => {
      if (!s.ready || (e.pointerType === 'mouse' && e.button !== 0)) return;
      id = e.pointerId; el.setPointerCapture(id);
      s.dragging = true; s.vx = s.vy = 0; lx = e.clientX; ly = e.clientY; lt = e.timeStamp;
      s.lastInput = performance.now(); invalidate();
    };
    const move = (e) => {
      if (e.pointerId !== id) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      const dt = Math.max(1, e.timeStamp - lt) / 1000;
      lx = e.clientX; ly = e.clientY; lt = e.timeStamp;
      const ax = dx * 0.0065, ay = dy * 0.0065 * 0.55;
      spin.current.quaternion.premultiply(dq.setFromAxisAngle(AX_Y, ax));
      spin.current.quaternion.premultiply(dq.setFromAxisAngle(AX_X, ay));
      s.vx = clamp(ax / dt, -12, 12); s.vy = clamp(ay / dt, -12, 12);
      s.lastInput = performance.now(); invalidate();
    };
    const up = (e) => {
      if (e.pointerId !== id) return;
      s.dragging = false; id = null;
      if (e.timeStamp - lt > 90) { s.vx = 0; s.vy = 0; }       // paused before release: no throw
      s.lastInput = performance.now(); invalidate();
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, [gl, invalidate]);

  // Colourway switch: swap materials and play a short flourish
  useEffect(() => {
    const s = state.current;
    if (!ctl.current || !s.ready || s.lastVariant === variant) return;
    ctl.current.apply(variant);
    if (s.lastVariant !== -1 && !reduced) s.kickT = 0;
    s.lastVariant = variant;
    invalidate();
  }, [variant, reduced, invalidate, onReady]);

  const upright = useMemo(() => new THREE.Quaternion(), []);
  const dq = useMemo(() => new THREE.Quaternion(), []);
  const eul = useMemo(() => new THREE.Euler(0, 0, 0, 'YXZ'), []);

  useFrame((frame, dtRaw) => {
    const s = state.current;
    if (!s.ready) return;
    const dt = Math.min(0.05, dtRaw);
    const now = performance.now();

    // inertia
    if (!s.dragging && (s.vx || s.vy)) {
      if (reduced) { s.vx = s.vy = 0; }
      else {
        spin.current.quaternion.premultiply(dq.setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.vx * dt));
        spin.current.quaternion.premultiply(dq.setFromAxisAngle(new THREE.Vector3(1, 0, 0), s.vy * dt));
        const k = Math.exp(-3.5 * dt); s.vx *= k; s.vy *= k;
        if (Math.hypot(s.vx, s.vy) < 0.02) s.vx = s.vy = 0;
      }
    }

    // intro: turns in from -0.9 rad and settles from 0.9 scale
    const intro = reduced ? 1 : easeOutExpo(clamp((now - s.start) / 1700, 0, 1));

    // idle sway + self-levelling
    const idle = !reduced && !s.dragging && !s.vx && !s.vy && now - s.lastInput > 1800;
    s.swayW += ((idle ? 1 : 0) - s.swayW) * (1 - Math.exp(-dt * (idle ? 1.2 : 6)));
    if (s.swayW > 0.001) {
      eul.setFromQuaternion(spin.current.quaternion); eul.x = 0; eul.z = 0;
      spin.current.quaternion.slerp(upright.setFromEuler(eul), (1 - Math.exp(-dt * 1.5)) * s.swayW);
    }
    const t = (now / 1000) * 0.55;

    // colourway flourish: one quick full turn with a lift
    if (s.kickT < 1) s.kickT = Math.min(1, s.kickT + dt / 0.95);
    const kk = easeOutExpo(s.kickT);
    kick.current.rotation.y = kk * Math.PI * 2;
    kick.current.position.y = Math.sin(Math.PI * s.kickT) * 0.12;

    // scroll: rotate away and shrink as the hero leaves the viewport
    const sp = scrollRef?.current ?? 0;
    const px = reduced ? 0 : pointer.x, py = reduced ? 0 : pointer.y;

    pivot.current.rotation.set(
      s.swayW * 0.06 * Math.sin(t * 1.3 + 1) + py * -0.06 + sp * 0.25,
      (1 - intro) * -0.9 + s.swayW * 0.28 * Math.sin(t) + px * 0.14 + sp * 1.6,
      sp * -0.1
    );
    pivot.current.position.set(0, s.swayW * 0.03 * Math.sin(t * 1.7) - sp * 0.35, 0);
    pivot.current.scale.setScalar((0.9 + 0.1 * intro) * (1 - sp * 0.22));

    if (intro < 1 || s.kickT < 1 || s.swayW > 0.002 || s.dragging || s.vx || s.vy) frame.invalidate();
    else if (!reduced) frame.invalidate();    // keep pointer-parallax and sway alive
  });

  return (
    <group ref={pivot}>
      <group ref={spin}>
        <group ref={kick}>
          <group ref={holder} rotation={baseRotation}>
            <primitive object={model} />
          </group>
        </group>
      </group>
      <ContactShadows position={[0, sole - 0.04, 0]} opacity={0.55} scale={7} blur={2.8} far={2.2} resolution={512} color="#000000" />
    </group>
  );
}

/** Pull the camera back on narrow canvases so the shoe's length always fits. */
function FitCamera({ fov, distance }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / size.height;
    const needed = 1.2 / (Math.tan((fov * Math.PI) / 360) * Math.min(aspect, 1.6));
    camera.position.z = Math.max(distance, needed);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height, fov, distance]);
  return null;
}

function Studio({ accent }) {
  const rim = useRef();
  useFrame((_, dt) => {
    if (!rim.current) return;
    rim.current.color.lerp(new THREE.Color(accent), 1 - Math.exp(-dt * 5));
  });
  return (
    <>
      <Environment resolution={512} frames={1} background={false}>
        <Lightformer form="rect" intensity={3.2} position={[0, 5, -3]} scale={[14, 6, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[-7, 1, 2]} rotation-y={Math.PI / 2} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[7, 0, 4]} rotation-y={-Math.PI / 2} scale={[10, 3, 1]} />
        <Lightformer form="ring" intensity={0.8} position={[0, 1, 7]} scale={4} />
      </Environment>
      <directionalLight position={[3, 4, 5]} intensity={1.35} />
      <directionalLight ref={rim} position={[-5, 1.5, -4]} intensity={2.4} color={accent} />
    </>
  );
}

export default function ShoeScene({
  variant = 0,
  accent = '#ffffff',
  scrollRef,
  reduced = false,
  visible = true,
  onVariants,
  onReady,
  baseRotation = [0, 0, 0],
  fov = 28,
  distance = 3.9,
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={!visible ? 'never' : reduced ? 'demand' : 'always'}
      camera={{ fov, position: [0, 0.15, distance], near: 0.1, far: 50 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); gl.toneMappingExposure = 1.05; }}
      style={{ touchAction: 'pan-y' }}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <FitCamera fov={fov} distance={distance} />
        <Studio accent={accent} />
        <Rig
          variant={variant}
          scrollRef={scrollRef}
          reduced={reduced}
          onVariants={onVariants}
          onReady={onReady}
          baseRotation={baseRotation}
        />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL, DRACO_PATH);

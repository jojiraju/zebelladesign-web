"use client";
import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, CanvasTexture } from "three";
import type { Group, Points } from "three";

/* Falling snow (soft round sprites, three depth layers) plus a few gold / red / green baubles that bob and turn.
   Purely decorative; the parent only mounts it near the viewport and pauses it off-screen. */

const SNOW = 520;

function softDot() {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.35, "rgba(255,255,255,.6)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

type Flake = { x: number; y: number; z: number; sp: number; ph: number; sw: number };
function makeFlakes(): Flake[] {
  const seed = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  return Array.from({ length: SNOW }, (_, i) => ({ x: seed(i), y: seed(i + 900), z: seed(i + 1800), sp: 0.25 + seed(i + 2700) * 0.65, ph: seed(i + 3600) * 6.28, sw: 0.1 + seed(i + 4500) * 0.35 }));
}

function Snow() {
  const pts = useRef<Points>(null);
  const { viewport } = useThree();
  const tex = useMemo(() => softDot(), []);
  const flakes = useRef<Flake[]>([]); // filled on the first frame (kept out of render so the loop can mutate it freely)
  const positions = useMemo(() => new Float32Array(SNOW * 3), []);

  useFrame((s, dt) => {
    const p = pts.current; if (!p) return;
    if (!flakes.current.length) flakes.current = makeFlakes();
    const data = flakes.current;
    const w = viewport.width * 1.1, h = viewport.height * 1.1, t = s.clock.elapsedTime;
    const attr = p.geometry.getAttribute("position") as BufferAttribute;
    for (let i = 0; i < SNOW; i++) {
      const d = data[i];
      d.y -= d.sp * dt * (0.5 + d.z * 0.8) * 0.5;
      if (d.y < 0) { d.y += 1; d.x = (d.x + 0.37) % 1; }
      attr.setXYZ(i, (d.x - 0.5) * w + Math.sin(t * d.sw + d.ph) * 0.18, (d.y - 0.5) * h, (d.z - 0.5) * 3);
    }
    attr.needsUpdate = true;
    p.rotation.y = s.pointer.x * 0.08;
  });

  return (
    <points ref={pts} frustumCulled={false}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} count={SNOW} /></bufferGeometry>
      <pointsMaterial map={tex} size={0.09} sizeAttenuation transparent opacity={0.9} depthWrite={false} blending={AdditiveBlending} color="#ffffff" />
    </points>
  );
}

// Ornaments hang from gold threads at the top edge and swing like pendulums. x = fraction of the width, drop = how far down
// (fraction of the height). `d` = wide card (models on the right, text on the left), `m` = tall card (models on top).
type Orn = { c: string; r: number; d: [number, number]; m: [number, number]; ph: number; sp: number };
const ORNAMENTS: Orn[] = [
  { c: "#c8283a", r: 0.2, d: [0.47, 0.13], m: [0.14, 0.06], ph: 0.0, sp: 0.9 },
  { c: "#d9b66a", r: 0.17, d: [0.6, 0.075], m: [0.36, 0.1], ph: 1.7, sp: 1.1 },
  { c: "#1f7a52", r: 0.21, d: [0.8, 0.11], m: [0.62, 0.05], ph: 3.1, sp: 0.8 },
  { c: "#f3e4c4", r: 0.15, d: [0.895, 0.075], m: [0.82, 0.11], ph: 4.2, sp: 1.0 },
  { c: "#c8283a", r: 0.18, d: [0.97, 0.14], m: [0.95, 0.05], ph: 5.3, sp: 1.2 },
];

function Baubles() {
  const group = useRef<Group>(null);
  const { viewport } = useThree();
  const tall = viewport.width < viewport.height * 1.3;
  useFrame((st) => {
    const g = group.current; if (!g) return;
    const t = st.clock.elapsedTime;
    g.children.forEach((pivot, i) => {
      const o = ORNAMENTS[i];
      const [fx, drop] = tall ? o.m : o.d;
      pivot.position.set((fx - 0.5) * viewport.width, viewport.height / 2 + 0.15, 0.2);
      pivot.rotation.z = Math.sin(t * o.sp + o.ph) * 0.13; // pendulum about the hanging point
      const bauble = pivot.getObjectByName("bauble"); const thread = pivot.getObjectByName("thread");
      const L = drop * viewport.height + 0.15;
      if (thread) { thread.scale.y = L; thread.position.y = -L / 2; }
      if (bauble) { const k = Math.min(1, Math.max(0.5, viewport.width / 9)); bauble.scale.setScalar(k); bauble.position.y = -L - o.r * 1.1 * k; bauble.rotation.y = t * 0.7 + o.ph; }
    });
  });
  return (
    <group ref={group}>
      {ORNAMENTS.map((o, i) => (
        <group key={i}>
          <mesh name="thread"><cylinderGeometry args={[0.009, 0.009, 1, 6]} /><meshStandardMaterial color="#e8cf8a" metalness={0.9} roughness={0.3} /></mesh>
          <group name="bauble">
            <mesh><sphereGeometry args={[o.r, 40, 28]} /><meshStandardMaterial color={o.c} metalness={0.6} roughness={0.2} /></mesh>
            <mesh position={[0, o.r * 1.02, 0]}><cylinderGeometry args={[o.r * 0.2, o.r * 0.26, o.r * 0.22, 14]} /><meshStandardMaterial color="#e8cf8a" metalness={0.9} roughness={0.25} /></mesh>
            <mesh position={[0, o.r * 1.28, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[o.r * 0.12, o.r * 0.03, 8, 16]} /><meshStandardMaterial color="#e8cf8a" metalness={0.9} roughness={0.25} /></mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[o.r * 0.995, o.r * 0.022, 8, 48]} /><meshStandardMaterial color="#e8cf8a" metalness={0.9} roughness={0.28} /></mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

export default function SnowScene({ active }: { active: boolean }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 6], fov: 40 }} gl={{ antialias: true, alpha: true, powerPreference: "low-power" }} frameloop={active ? "always" : "never"}>
      <ambientLight intensity={1.2} />
      <directionalLight position={[2, 3, 4]} intensity={3} color="#fff4e0" />
      <pointLight position={[-3, 1, 3]} intensity={10} color="#ffd9a0" />
      <Snow />
      <Baubles />
    </Canvas>
  );
}

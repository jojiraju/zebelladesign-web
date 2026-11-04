"use client";
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ExtrudeGeometry, Path, Shape, Vector2 } from "three";
import type { Group, PerspectiveCamera } from "three";
import logo from "./zb-shapes.json"; // outlines traced from public/brand/logo-mark.png by scripts/trace-logo.mjs

/** Bounding radius of the logo (3 wide x ~2.46 tall, plus depth) with breathing room. */
const LOGO_RADIUS = 1.95;
const MARGIN = 1.15;

/** Keeps the whole logo inside the canvas at any size/aspect. */
function FitCamera() {
  useFrame(({ camera, size }) => {
    const cam = camera as PerspectiveCamera;
    const vFov = (cam.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * (size.width / size.height));
    const half = Math.min(vFov, hFov) / 2; // the tighter of the two fields of view decides the distance
    const z = (LOGO_RADIUS * MARGIN) / Math.sin(half);
    if (Math.abs(cam.position.z - z) > 1e-3) { cam.position.z = z; cam.updateProjectionMatrix(); }
  });
  return null;
}

/** The real ZB monogram, extruded with a soft bevel. It sways gently (never spins to its mirrored back) and follows the pointer. */
function ZBLogo() {
  const group = useRef<Group>(null);
  const geometry = useMemo(() => {
    const pt = ([x, y]: number[]) => new Vector2(x, y);
    const shapes = logo.shapes.map((s) => {
      const shape = new Shape(s.outline.map(pt));
      (s.holes as number[][][]).forEach((h) => shape.holes.push(new Path(h.map(pt))));
      return shape;
    });
    const g = new ExtrudeGeometry(shapes, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.04, bevelSegments: 5, curveSegments: 1, steps: 1 });
    g.translate(0, 0, -0.18);
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.rotation.y = Math.sin(t * 0.7) * 0.55 + state.pointer.x * 0.35;
    g.rotation.x = Math.sin(t * 0.5) * 0.08 - state.pointer.y * 0.25;
    g.position.y = Math.sin(t * 1.1) * 0.07;
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry}>
        <meshStandardMaterial color="#f0c24b" metalness={0.45} roughness={0.28} />
      </mesh>
    </group>
  );
}

export default function EmblemScene() {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 7], fov: 40 }} gl={{ antialias: true, alpha: true, powerPreference: "low-power" }} frameloop="always">
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 4, 5]} intensity={3.2} color="#fff6e3" />
      <directionalLight position={[-4, -2, 3]} intensity={1.8} color="#f5d58c" />
      <pointLight position={[0, 0, 4]} intensity={14} color="#ffffff" />
      <FitCamera />
      <ZBLogo />
    </Canvas>
  );
}

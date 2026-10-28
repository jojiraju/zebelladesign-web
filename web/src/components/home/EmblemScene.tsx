"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

/** A procedural gold torus-knot: no external model/texture, so there is no unfinished-asset risk. */
function Knot() {
  const mesh = useRef<Mesh>(null);
  useFrame((state, dt) => {
    if (!mesh.current) return;
    mesh.current.rotation.y += dt * 0.35;
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.25 + state.pointer.y * 0.3;
    mesh.current.rotation.z = state.pointer.x * 0.25;
  });
  return (
    <mesh ref={mesh}>
      <torusKnotGeometry args={[1, 0.28, 220, 24, 2, 3]} />
      <meshStandardMaterial color="#b96e7c" metalness={0.95} roughness={0.22} />
    </mesh>
  );
}

export default function EmblemScene() {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 4.6], fov: 40 }} gl={{ antialias: true, alpha: true, powerPreference: "low-power" }} frameloop="always">
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={3} color="#fff1f3" />
      <directionalLight position={[-4, -2, 2]} intensity={1.6} color="#e3b5bf" />
      <pointLight position={[0, 0, 3]} intensity={12} color="#ffffff" />
      <Knot />
    </Canvas>
  );
}

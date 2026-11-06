"use client";
import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { MathUtils, NoColorSpace, ShaderMaterial, TextureLoader, Vector3 } from "three";
import type { Group, Texture } from "three";
import type { MotionValue } from "motion/react";

/* Real model cut-outs shown on 3D planes. A shader finds the dress by its colour (hue / saturation / brightness) and
   re-tints only that part, keeping the folds, shading and the gold embroidery. Scrolling swings between the looks. */

export interface LookImage {
  src: string;
  /** The dress colour in the photo (hue 0-360, saturation 0-1, value 0-1) and how strictly to match it. */
  hsv: [number, number, number];
  tol: number; minSat: number; maxVal: number;
}

/** Hex -> [hue 0-360, sat 0-1, value 0-1]. */
export function hexToHsv(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  return [h, mx ? d / mx : 0, mx];
}

const vertex = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const fragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uMap;
uniform vec3 uSrc;
uniform vec3 uTarget;
uniform vec3 uMatch;
uniform float uOpacity;

vec3 rgb2hsv(vec3 c){ vec4 K=vec4(0.,-1./3.,2./3.,-1.); vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g)); vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r)); float d=q.x-min(q.w,q.y); float e=1.0e-10; return vec3(abs(q.z+(q.w-q.y)/(6.*d+e)),d/(q.x+e),q.x); }
vec3 hsv2rgb(vec3 c){ vec4 K=vec4(1.,2./3.,1./3.,3.); vec3 p=abs(fract(c.xxx+K.xyz)*6.-K.www); return c.z*mix(K.xxx,clamp(p-K.xxx,0.,1.),c.y); }

void main(){
  vec4 tex = texture2D(uMap, vUv);
  vec3 base = tex.rgb;
  vec3 hsv = rgb2hsv(base);
  float dh = abs(hsv.x*360. - uSrc.x); dh = min(dh, 360. - dh);
  float m = (1. - smoothstep(uMatch.x*0.65, uMatch.x, dh));
  m *= smoothstep(uMatch.y - 0.06, uMatch.y, hsv.y);
  m *= 1. - smoothstep(uMatch.z - 0.06, uMatch.z, hsv.z);
  float s2 = clamp(uTarget.y * (hsv.y / max(uSrc.y, 0.05)), 0., 1.);
  float v2 = clamp(uTarget.z * pow(clamp(hsv.z / max(uSrc.z, 0.05), 0.35, 2.2), 0.85), 0., 1.);
  vec3 tinted = hsv2rgb(vec3(uTarget.x/360., s2, v2));
  gl_FragColor = vec4(mix(base, tinted, m), tex.a * uOpacity);
}`;

const shadowFrag = /* glsl */ `varying vec2 vUv; uniform float uOpacity; void main(){ float d = length((vUv - 0.5) * 2.0); gl_FragColor = vec4(0.25, 0.1, 0.15, (1.0 - smoothstep(0.0, 1.0, d)) * 0.38 * uOpacity); }`;

const PLANE_H = 3.8;
const GAP = 3.3; // distance between looks: wide enough that one has left before the next fully arrives

function hueLerp(a: number, b: number, t: number) { const d = ((b - a + 540) % 360) - 180; return (a + d * t + 360) % 360; }

function Look({ look, tex, index, mix, target }: { look: LookImage; tex: Texture; index: number; mix: React.RefObject<number>; target: React.RefObject<Vector3> }) {
  const group = useRef<Group>(null);
  const mat = useRef<ShaderMaterial>(null);
  const shadow = useRef<ShaderMaterial>(null);
  const img = tex.image as { width: number; height: number };
  const aspect = img.width / img.height;
  const uniforms = useMemo(() => ({
    uMap: { value: tex }, uSrc: { value: new Vector3(...look.hsv) }, uTarget: { value: new Vector3(...look.hsv) },
    uMatch: { value: new Vector3(look.tol, look.minSat, look.maxVal) },
    uOpacity: { value: 1 },
  }), [tex, look]);

  useFrame(() => {
    const g = group.current; if (!g) return;
    const d = index - mix.current;
    const a = Math.abs(d);
    g.visible = a < 0.97;
    g.renderOrder = -Math.round(a * 10);
    g.position.x = d * GAP;
    g.position.z = -a * 1.4;
    g.rotation.y = -d * 0.75;
    const opacity = 1 - MathUtils.smoothstep(a, 0.62, 0.95);
    if (shadow.current) shadow.current.uniforms.uOpacity.value = opacity;
    const m = mat.current; if (!m) return;
    m.uniforms.uOpacity.value = opacity;
    (m.uniforms.uTarget.value as Vector3).copy(target.current);
  });

  return (
    <group ref={group}>
      <mesh position={[0, -PLANE_H / 2 + 0.04, -0.02]} rotation={[-1.25, 0, 0]}><planeGeometry args={[PLANE_H * aspect * 0.95, 0.9]} /><shaderMaterial ref={shadow} transparent depthWrite={false} vertexShader={vertex} fragmentShader={shadowFrag} uniforms={{ uOpacity: { value: 1 } }} /></mesh>
      <mesh><planeGeometry args={[PLANE_H * aspect, PLANE_H]} /><shaderMaterial ref={mat} transparent depthWrite={false} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} /></mesh>
    </group>
  );
}

function Looks({ looks, progress, color, active }: { looks: LookImage[]; progress: MotionValue<number>; color: string; active: boolean }) {
  const textures = useLoader(TextureLoader, looks.map((l) => l.src));
  textures.forEach((t) => { t.colorSpace = NoColorSpace; t.anisotropy = 4; }); // raw sRGB values: the shader works in display space
  const mix = useRef(0);
  const cur = useRef(new Vector3(...hexToHsv(color)));
  const target = useRef(new Vector3(...hexToHsv(color)));
  const state = useRef({ color, pulse: 0 });
  const root = useRef<Group>(null);
  const { viewport } = useThree();

  useFrame((_s, dt) => {
    if (!active) return;
    const p = MathUtils.clamp(progress.get(), 0, 1);
    const want = Math.min(looks.length - 1, Math.floor(p * looks.length));
    mix.current = MathUtils.damp(mix.current, want, 3, dt);
    if (Math.abs(mix.current - want) < 0.001) mix.current = want;

    if (state.current.color !== color) { state.current.color = color; state.current.pulse = 1; }
    state.current.pulse = MathUtils.damp(state.current.pulse, 0, 3.5, dt);
    const [h, sat, v] = hexToHsv(color);
    const k = 1 - Math.exp(-dt * 5);
    cur.current.set(hueLerp(cur.current.x, h, sat < 0.08 ? 1 : k), MathUtils.lerp(cur.current.y, sat, k), MathUtils.lerp(cur.current.z, v, k));
    target.current.copy(cur.current);

    // Fit the whole figure (head to hem, dupatta to dupatta) inside the stage at any size; no mouse tilt, no floating.
    const g = root.current;
    if (g) {
      const fit = Math.min(1, (viewport.width * 0.84) / 3.15, (viewport.height * 0.96) / (PLANE_H + 0.2));
      const sc = fit * (1 + state.current.pulse * 0.025);
      g.scale.set(sc, sc, sc);
      g.rotation.y = state.current.pulse * 0.25; // a quick turn when the colour changes
      g.position.y = -0.03;
    }
  });

  return (
    <group ref={root}>
      {looks.map((l, i) => <Look key={l.src} look={l} tex={textures[i]} index={i} mix={mix} target={target} />)}
    </group>
  );
}

export default function DressScene({ looks, progress, color, active }: { looks: LookImage[]; progress: MotionValue<number>; color: string; active: boolean }) {
  return (
    <Canvas dpr={[1, 1.6]} camera={{ position: [0, 0, 8], fov: 30 }} gl={{ antialias: true, alpha: true, powerPreference: "low-power" }} frameloop={active ? "always" : "never"}>
      <Suspense fallback={null}>
        <Looks looks={looks} progress={progress} color={color} active={active} />
      </Suspense>
    </Canvas>
  );
}

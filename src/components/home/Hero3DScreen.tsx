"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

const SLIDE_SECONDS = 4.5;
const CROSSFADE_SECONDS = 0.9;

function PosterPlane({ texture, opacity, z }: { texture: THREE.Texture; opacity: number; z: number }) {
  return (
    <mesh position={[0, 0, z]}>
      <planeGeometry args={[1.62, 2.4]} />
      <meshBasicMaterial map={texture} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function Screen({ posters }: { posters: string[] }) {
  const textures = useTexture(posters);
  const list = Array.isArray(textures) ? textures : [textures];
  const groupRef = useRef<THREE.Group>(null);
  const [current, setCurrent] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const clockRef = useRef(0);
  const [fade, setFade] = useState(1);

  useFrame((state, delta) => {
    // Gentle continuous float/tilt — the "3D screen" effect, not user-driven.
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      groupRef.current.rotation.y = Math.sin(t * 0.35) * 0.32 + 0.12;
      groupRef.current.rotation.x = Math.sin(t * 0.25) * 0.06;
      groupRef.current.position.y = Math.sin(t * 0.6) * 0.08;
    }

    if (list.length <= 1) return;

    clockRef.current += delta;
    if (clockRef.current >= SLIDE_SECONDS) {
      clockRef.current = 0;
      setPrevious(current);
      setCurrent((i) => (i + 1) % list.length);
      setFade(0);
    }
    if (fade < 1) {
      setFade((f) => Math.min(1, f + delta / CROSSFADE_SECONDS));
    }
  });

  return (
    <group ref={groupRef}>
      {previous !== null && fade < 1 && list[previous] && (
        <PosterPlane texture={list[previous]} opacity={1 - fade} z={-0.0005} />
      )}
      {list[current] && <PosterPlane texture={list[current]} opacity={fade} z={0} />}
    </group>
  );
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <directionalLight position={[-3, -2, 2]} intensity={0.35} color="#d6a84f" />
    </>
  );
}

/**
 * Homepage hero 3D screen — rotates through Admin → Flyers images (with static fallback).
 */
export function Hero3DScreen({ posters }: { posters: string[] }) {
  const dpr = useMemo<[number, number]>(() => [1, 1.75], []);
  const key = posters.join("|");

  return (
    <div
      className="relative h-full w-full"
      style={{ filter: "drop-shadow(0 25px 45px rgba(0,0,0,.45))" }}
    >
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0, 4.4], fov: 32 }}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      >
        <SceneLights />
        <Suspense fallback={null}>
          <Screen key={key} posters={posters} />
        </Suspense>
      </Canvas>
    </div>
  );
}

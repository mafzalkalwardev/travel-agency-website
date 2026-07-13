"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const GOLD = "#d6a84f";
const NAVY_LIGHT = "#0b5da8";

/** Convert lat/lng to a point on a sphere of the given radius. */
function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/** Flight routes: Pakistan cities to Gulf destinations. */
const ROUTES: Array<[[number, number], [number, number]]> = [
  [[33.6, 73.1], [21.4, 39.8]], // Islamabad → Jeddah
  [[31.5, 74.3], [24.7, 46.7]], // Lahore → Riyadh
  [[34.0, 71.5], [25.2, 55.3]], // Peshawar → Dubai
  [[24.9, 67.1], [26.4, 50.1]], // Karachi → Dammam
  [[31.4, 73.1], [23.6, 58.4]], // Faisalabad → Muscat
];

function arcCurve(from: [number, number], to: [number, number], radius: number) {
  const start = latLngToVec3(from[0], from[1], radius);
  const end = latLngToVec3(to[0], to[1], radius);
  const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(radius * 1.25);
  return new THREE.QuadraticBezierCurve3(start, mid, end);
}

function FlightArcs({ radius }: { radius: number }) {
  const arcs = useMemo(
    () =>
      ROUTES.map(([from, to]) => {
        const curve = arcCurve(from, to, radius);
        return new THREE.TubeGeometry(curve, 32, 0.008, 6, false);
      }),
    [radius]
  );

  return (
    <>
      {arcs.map((geometry, i) => (
        <mesh key={i} geometry={geometry}>
          <meshBasicMaterial color={GOLD} transparent opacity={0.85} />
        </mesh>
      ))}
    </>
  );
}

function Globe() {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.08;
  });

  return (
    <group ref={group} rotation={[0.35, -1.2, 0]}>
      <mesh>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial color="#0a2548" roughness={0.8} metalness={0.2} />
      </mesh>
      <mesh scale={1.001}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color={NAVY_LIGHT} wireframe transparent opacity={0.18} />
      </mesh>
      <FlightArcs radius={1.01} />
    </group>
  );
}

export default function HeroGlobeScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 2.6], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 2, 4]} intensity={1.4} color="#ffffff" />
      <directionalLight position={[-3, -1, -2]} intensity={0.4} color={GOLD} />
      <Globe />
    </Canvas>
  );
}

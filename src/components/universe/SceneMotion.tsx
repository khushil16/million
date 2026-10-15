import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { fx } from "@/components/fx/fxBus";

/** Orbital movement is visual only; financial values never depend on frame time. */
export function OrbitBand({
  radius,
  index,
  color,
  accent,
  reduced,
  storm = false,
  excited = false,
}: {
  radius: number;
  index: number;
  color: string;
  accent: string;
  reduced: boolean;
  storm?: boolean;
  excited?: boolean;
}) {
  const ring = useRef<THREE.Group>(null);
  const satellite = useRef<THREE.Group>(null);
  const time = useRef(index * 2.1);
  const speed = useRef(1);
  useFrame((_, raw) => {
    if (reduced || !ring.current || !satellite.current) return;
    const dt = Math.min(raw, 0.05);
    speed.current = THREE.MathUtils.damp(speed.current, storm ? 5 : excited ? 3.2 : 1, 2.5, dt);
    time.current += dt * (0.13 + index * 0.035) * speed.current;
    satellite.current.position.set(
      Math.cos(time.current) * radius,
      Math.sin(time.current) * radius,
      0,
    );
    satellite.current.rotation.z += dt * 0.4 * speed.current;
    ring.current.rotation.y =
      Math.sin(time.current * 0.4) * (storm ? 0.32 : 0.08) +
      (storm ? Math.sin(time.current * 7 + index) * 0.03 : 0);
  });
  return (
    <group rotation={[1.03 + index * 0.17, 0.1 + index * 0.3, -0.35 + index * 0.22]}>
      <group ref={ring}>
        <mesh>
          <torusGeometry args={[radius, 0.009, 6, 144]} />
          <meshBasicMaterial color={color} transparent opacity={0.45 - index * 0.07} />
        </mesh>
        <mesh rotation-z={index * 1.9}>
          <torusGeometry args={[radius, 0.021, 6, 52, 0.55]} />
          <meshStandardMaterial
            color={accent}
            emissive={color}
            emissiveIntensity={1.3}
            metalness={0.7}
            roughness={0.2}
          />
        </mesh>
        <group
          ref={satellite}
          position={[Math.cos(index * 2.1) * radius, Math.sin(index * 2.1) * radius, 0]}
        >
          <mesh>
            <octahedronGeometry args={[0.095, 0]} />
            <meshStandardMaterial
              color={accent}
              metalness={0.7}
              roughness={0.2}
              emissive={color}
              emissiveIntensity={0.65}
            />
          </mesh>
          <mesh rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.17, 0.006, 4, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.7} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/** Dolly-in on mount, then hands the camera over to scene-specific rigs. */
export function SceneEntrance({ reduced }: { reduced: boolean }) {
  const state = useRef<"idle" | "running" | "done">("idle");
  useFrame(({ camera }, raw) => {
    if (reduced || state.current === "done") return;
    if (state.current === "idle") {
      camera.position.z = 13;
      state.current = "running";
    }
    camera.position.z = THREE.MathUtils.damp(camera.position.z, 10, 2.6, Math.min(raw, 0.05));
    if (Math.abs(camera.position.z - 10) < 0.01) {
      camera.position.z = 10;
      state.current = "done";
    }
  });
  return null;
}

export function StationGlyph({
  index,
  active,
  color,
  accent,
  reduced,
  onSelect,
  onHover,
}: {
  index: number;
  active: boolean;
  color: string;
  accent: string;
  reduced: boolean;
  onSelect: () => void;
  onHover?: (on: boolean) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const time = useRef(index * 1.2);
  const spin = useRef(0);
  const [hovered, setHovered] = useState(false);
  useFrame((_, raw) => {
    if (!group.current || !body.current) return;
    const dt = Math.min(raw, 0.05);
    const scale = active ? 1.32 : hovered ? 1.18 : 1;
    group.current.scale.setScalar(
      reduced ? scale : THREE.MathUtils.damp(group.current.scale.x, scale, 6, dt),
    );
    if (reduced) return;
    time.current += dt;
    spin.current = THREE.MathUtils.damp(spin.current, 0, 2.5, dt);
    body.current.rotation.y += dt * (active ? 0.5 : hovered ? 1.2 : 0.18) + spin.current * dt;
    body.current.rotation.x = Math.sin(time.current * 0.7) * 0.2;
    body.current.position.y = Math.sin(time.current) * 0.075;
    if (halo.current) {
      halo.current.rotation.z += dt * (active ? 0.8 : 0.2);
      const s = active ? 1 + Math.sin(time.current * 2.4) * 0.06 : 1;
      halo.current.scale.setScalar(s);
    }
  });
  return (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation();
        spin.current = 14;
        fx.emit("burst", { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY, strength: 1.2 });
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover?.(true);
      }}
      onPointerOut={() => {
        setHovered(false);
        onHover?.(false);
      }}
    >
      <group ref={body}>
        <mesh>
          {index === 0 ? (
            <sphereGeometry args={[0.29, 32, 24]} />
          ) : index === 1 ? (
            <torusGeometry args={[0.26, 0.1, 16, 48]} />
          ) : index === 2 ? (
            <octahedronGeometry args={[0.38]} />
          ) : index === 3 ? (
            <torusKnotGeometry args={[0.23, 0.065, 80, 10]} />
          ) : index === 4 ? (
            <icosahedronGeometry args={[0.33, 0]} />
          ) : (
            <dodecahedronGeometry args={[0.33]} />
          )}
          <meshPhysicalMaterial
            color={active || hovered ? accent : color}
            metalness={0.75}
            roughness={0.22}
            clearcoat={0.9}
            emissive={accent}
            emissiveIntensity={active ? 0.3 : hovered ? 0.15 : 0.03}
          />
        </mesh>
      </group>
      <mesh ref={halo} rotation-x={0.8}>
        <torusGeometry args={[0.5, active ? 0.012 : 0.008, 5, 64]} />
        <meshBasicMaterial color={accent} transparent opacity={active || hovered ? 0.85 : 0.22} />
      </mesh>
      {/* generous invisible hit area so small glyphs are easy to pick */}
      <mesh visible={false}>
        <sphereGeometry args={[0.55, 12, 12]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}

export function AllocationSegment({
  start,
  arc,
  color,
  reduced,
  active = false,
  onHover,
  onSelect,
}: {
  start: number;
  arc: number;
  color: string;
  reduced: boolean;
  active?: boolean;
  onHover?: (on: boolean) => void;
  onSelect?: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshPhysicalMaterial>(null);
  const pop = useRef(0);
  const prevArc = useRef(arc);
  const curve = useMemo(
    () => new THREE.EllipseCurve(0, 0, 1.9, 1.9, 0, Math.max(0.002, arc - 0.035), false, 0),
    [arc],
  );
  const points = useMemo(
    () => curve.getPoints(64).map((p) => new THREE.Vector3(p.x, p.y, 0)),
    [curve],
  );
  const tube = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  useEffect(() => {
    if (Math.abs(prevArc.current - arc) > 0.001) pop.current = 1;
    prevArc.current = arc;
  }, [arc]);
  useFrame((_, raw) => {
    if (!group.current) return;
    const dt = Math.min(raw, 0.05);
    pop.current = THREE.MathUtils.damp(pop.current, 0, 5, dt);
    group.current.rotation.z = reduced
      ? start
      : THREE.MathUtils.damp(group.current.rotation.z, start, 7, dt);
    const scale = (active ? 1.055 : 1) + pop.current * 0.04;
    group.current.scale.setScalar(
      reduced ? scale : THREE.MathUtils.damp(group.current.scale.x, scale, 8, dt),
    );
    group.current.position.z = reduced
      ? active
        ? 0.12
        : 0
      : THREE.MathUtils.damp(group.current.position.z, active ? 0.14 : 0, 6, dt);
    if (material.current)
      material.current.emissiveIntensity = (active ? 0.25 : 0) + pop.current * 0.5;
  });
  return (
    <group
      ref={group}
      rotation-z={start}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover?.(true);
      }}
      onPointerOut={() => onHover?.(false)}
      onClick={(e) => {
        e.stopPropagation();
        fx.emit("burst", { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY, strength: 1 });
        onSelect?.();
      }}
    >
      <mesh>
        <tubeGeometry args={[tube, 64, active ? 0.21 : 0.19, 14, false]} />
        <meshPhysicalMaterial
          ref={material}
          color={color}
          emissive={color}
          emissiveIntensity={0}
          metalness={0.65}
          roughness={active ? 0.14 : 0.28}
          clearcoat={1}
        />
      </mesh>
    </group>
  );
}

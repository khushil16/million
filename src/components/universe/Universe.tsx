import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, useTexture, Line } from "@react-three/drei";
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";
import surface from "@/assets/gold-surface.jpg";
import { fx } from "@/components/fx/fxBus";
import { AllocationSegment, OrbitBand, SceneEntrance, StationGlyph } from "./SceneMotion";
import { SceneTag } from "./SceneTag";

type Palette = {
  gold: string;
  ivory: string;
  muted: string;
  storm: string;
  cash: string;
  deposit: string;
  equity: string;
};
function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement),
    canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  function color(token: string) {
    if (!ctx) return "gold";
    ctx.fillStyle = css.getPropertyValue(token).trim();
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return `rgb(${d[0]},${d[1]},${d[2]})`;
  }
  return {
    gold: color("--primary"),
    ivory: color("--foreground"),
    muted: color("--muted-foreground"),
    storm: color("--destructive"),
    cash: color("--cash"),
    deposit: color("--deposit"),
    equity: color("--equity"),
  };
}
class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Shrinks wide compositions to fit narrow (portrait) canvases. */
function FitWidth({ children, design = 1.3 }: { children: ReactNode; design?: number }) {
  const { size } = useThree();
  const s = Math.min(1.12, (size.width / Math.max(size.height, 1) / design) * 1.12);
  return <group scale={s}>{children}</group>;
}

/** Lets 3D hovers drive the DOM cursor label ("Drag", "Explore"…). */
type CursorSetter = (label: string | null) => void;

function Dust({ palette, reduced, storm }: { palette: Palette; reduced: boolean; storm: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const a = new Float32Array(650 * 3);
    for (let i = 0; i < 650; i++) {
      const t = i * 2.399963;
      a[i * 3] = Math.sin(t) * (4 + (i % 71) / 7);
      a[i * 3 + 1] = Math.cos(t * 1.17) * (3 + (i % 47) / 8);
      a[i * 3 + 2] = -2 - (i % 37) / 5;
    }
    return a;
  }, []);
  useFrame(({ pointer }, raw) => {
    const dt = Math.min(raw, 0.05);
    if (!ref.current || reduced) return;
    ref.current.rotation.z += dt * (storm ? 0.09 : 0.006);
    // dust drifts away from the cursor a touch, like the three.js "interactive points" demos
    ref.current.position.x = THREE.MathUtils.damp(ref.current.position.x, -pointer.x * 0.35, 2, dt);
    ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, -pointer.y * 0.22, 2, dt);
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={storm ? palette.storm : palette.ivory}
        size={0.014}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const atmosphereFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float fresnel = pow(1.0 - abs(dot(vNormal, vView)), 2.6);
    gl_FragColor = vec4(uColor * fresnel * uIntensity, fresnel * uIntensity);
  }
`;

/** Expanding ring fired when the milestone orb is clicked. */
function Shockwave({ color, trigger }: { color: string; trigger: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const age = useRef(10);
  useEffect(() => {
    if (trigger) age.current = 0;
  }, [trigger]);
  useFrame((_, raw) => {
    age.current += Math.min(raw, 0.05);
    if (!ref.current || !mat.current) return;
    const t = Math.min(age.current / 1.1, 1);
    ref.current.visible = t < 1;
    ref.current.scale.setScalar(1 + t * 2.2);
    mat.current.opacity = (1 - t) * 0.8;
  });
  return (
    <mesh ref={ref} visible={false}>
      <ringGeometry args={[1.5, 1.56, 96]} />
      <meshBasicMaterial
        ref={mat}
        color={color}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function Sphere({
  palette,
  reduced,
  mode,
  progress,
  onOrbClick,
  setCursor,
}: {
  palette: Palette;
  reduced: boolean;
  mode: string;
  progress: number;
  onOrbClick?: (() => void) | undefined;
  setCursor: CursorSetter;
}) {
  const group = useRef<THREE.Group>(null),
    orb = useRef<THREE.Mesh>(null),
    material = useRef<THREE.MeshPhysicalMaterial>(null),
    lightning = useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = useState(false);
  const [pulse, setPulse] = useState(0);
  const time = useRef(0);
  const pop = useRef(0);
  const flash = useRef(0);
  const texture = useTexture(surface);
  texture.colorSpace = THREE.SRGBColorSpace;
  const storm = mode === "storm";
  const hero = mode === "hero";
  const targetScale = useMemo(() => new THREE.Vector3(), []);
  const targetColor = useMemo(() => new THREE.Color(), []);
  const atmosphere = useMemo(
    () => ({ uColor: { value: new THREE.Color(palette.gold) }, uIntensity: { value: 1 } }),
    [palette.gold],
  );
  useEffect(
    () =>
      storm
        ? fx.on("flash", () => {
            flash.current = 1;
          })
        : undefined,
    [storm],
  );
  useFrame(({ pointer, camera }, raw) => {
    const dt = Math.min(raw, 0.05);
    if (!group.current || !orb.current) return;
    if (material.current) {
      targetColor.set(storm ? palette.storm : palette.gold);
      material.current.color.lerp(targetColor, reduced ? 1 : 1 - Math.exp(-3 * dt));
      material.current.emissiveIntensity = flash.current * 1.4 + pop.current * 0.6;
    }
    atmosphere.uColor.value.lerp(targetColor, 1 - Math.exp(-3 * dt));
    atmosphere.uIntensity.value = THREE.MathUtils.damp(
      atmosphere.uIntensity.value,
      (hovered ? 1.6 : 1.05) + flash.current * 2,
      5,
      dt,
    );
    flash.current = THREE.MathUtils.damp(flash.current, 0, 4, dt);
    pop.current = THREE.MathUtils.damp(pop.current, 0, 3.5, dt);
    if (lightning.current) lightning.current.intensity = flash.current * 120;
    if (!reduced) {
      time.current += dt;
      orb.current.rotation.y += dt * (storm ? 0.32 : hovered ? 0.22 : 0.065) + pop.current * dt * 4;
      orb.current.position.y = Math.sin(time.current * 0.7) * 0.06;
      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        pointer.x * 0.28,
        2,
        dt,
      );
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        -pointer.y * 0.16,
        2,
        dt,
      );
      if (storm) {
        group.current.position.x = (Math.random() - 0.5) * 0.025 * (1 + flash.current * 3);
        group.current.position.y = (Math.random() - 0.5) * 0.025 * (1 + flash.current * 3);
      }
      if (hero) {
        // scroll-driven dolly: the goal recedes as you scroll toward the journey preview
        const s = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1.2);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, -s * 1.6, 4, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, 10 + s * 3, 4, dt);
      }
    }
    const size =
      (mode === "timeline" ? 0.32 + progress * 0.38 : storm ? 0.8 : 1) *
      (hovered ? 1.04 : 1) *
      (1 + pop.current * 0.12);
    group.current.scale.lerp(
      targetScale.set(size, size, size),
      reduced ? 1 : 1 - Math.exp(-4 * dt),
    );
  });
  function click(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    pop.current = 1;
    setPulse((p) => p + 1);
    fx.emit("burst", {
      x: e.nativeEvent.clientX,
      y: e.nativeEvent.clientY,
      strength: 2.2,
      color: storm ? "storm" : "gold",
    });
    onOrbClick?.();
  }
  return (
    <group
      ref={group}
      position={hero ? [2.5, 0.1, 0] : mode === "timeline" ? GOAL_POSITION : [0, 0, 0]}
    >
      <mesh
        ref={orb}
        onClick={click}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          setCursor(hero ? "Tap the goal" : storm ? "Hold steady" : "Tap");
        }}
        onPointerOut={() => {
          setHovered(false);
          setCursor(null);
        }}
      >
        <sphereGeometry args={[1.48, 80, 64]} />
        <meshPhysicalMaterial
          ref={material}
          map={texture}
          bumpMap={texture}
          bumpScale={0.085}
          color={palette.gold}
          emissive={storm ? palette.storm : palette.gold}
          emissiveIntensity={0}
          metalness={0.8}
          roughness={storm ? 0.45 : 0.31}
          clearcoat={0.7}
        />
      </mesh>
      <mesh scale={1.16}>
        <sphereGeometry args={[1.48, 48, 40]} />
        <shaderMaterial
          vertexShader={atmosphereVertex}
          fragmentShader={atmosphereFragment}
          uniforms={atmosphere}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <Shockwave color={storm ? palette.storm : palette.gold} trigger={pulse} />
      {storm && (
        <pointLight
          ref={lightning}
          position={[-2, 3, 3]}
          color="#ffe6d6"
          intensity={0}
          distance={14}
        />
      )}
      {[2.1, 2.65, 3.25].map((r, i) => (
        <OrbitBand
          key={r}
          radius={r}
          index={i}
          color={storm ? palette.storm : palette.gold}
          accent={i === 1 ? palette.deposit : palette.ivory}
          reduced={reduced}
          storm={storm}
          excited={hovered}
        />
      ))}
    </group>
  );
}

const PATH_SAMPLES = 160;
/** From "you, today" (bottom-left) sweeping up to the goal orb (top-right). */
const TIME_PATH: [number, number, number][] = [
  [-4.3, -2.35, 0.4],
  [-2.8, -2.0, 0.1],
  [-1.2, -1.35, -0.3],
  [0.4, -0.55, -0.55],
  [1.8, 0.35, -0.6],
  [2.75, 1.05, -0.6],
];
const GOAL_POSITION: [number, number, number] = [3.15, 1.45, -0.9];
function TimePath({
  palette,
  progress,
  milestones,
  crash,
  onScrub,
  reduced,
  setCursor,
}: {
  palette: Palette;
  progress: number;
  milestones: { t: number; label: string }[];
  crash?: { t: number; label: string } | undefined;
  onScrub?: ((t: number) => void) | undefined;
  reduced: boolean;
  setCursor: CursorSetter;
}) {
  const marker = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const trail = useRef<THREE.Points>(null);
  const displayed = useRef(progress);
  const dragging = useRef(false);
  const time = useRef(0);
  const { camera, gl } = useThree();
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(TIME_PATH.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
    [],
  );
  const points = useMemo(() => curve.getSpacedPoints(PATH_SAMPLES - 1), [curve]);
  const hitTube = useMemo(() => new THREE.TubeGeometry(curve, 80, 0.42, 8, false), [curve]);
  const clamped = Math.min(1, Math.max(0, progress));
  const trailPositions = useMemo(() => new Float32Array(40 * 3), []);

  // pointer → nearest point on the projected path, so the user can scrub the orbit directly
  useEffect(() => {
    const tmp = new THREE.Vector3();
    function pick(e: PointerEvent) {
      if (!dragging.current || !onScrub) return;
      const rect = gl.domElement.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const py = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      let best = 0,
        bestD = Infinity;
      for (let i = 0; i < points.length; i++) {
        tmp.copy(points[i]!).project(camera);
        const d = (tmp.x - px) ** 2 + (tmp.y - py) ** 2;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      onScrub(best / (points.length - 1));
    }
    function up() {
      if (dragging.current) {
        dragging.current = false;
        document.body.classList.remove("is-scrubbing");
      }
    }
    window.addEventListener("pointermove", pick);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", pick);
      window.removeEventListener("pointerup", up);
    };
  }, [camera, gl, points, onScrub]);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    time.current += dt;
    displayed.current = reduced ? clamped : THREE.MathUtils.damp(displayed.current, clamped, 9, dt);
    const p = curve.getPointAt(Math.min(1, Math.max(0, displayed.current)));
    if (marker.current) marker.current.position.copy(p);
    if (halo.current)
      halo.current.scale.setScalar(
        1 + Math.sin(time.current * 3) * 0.15 + (dragging.current ? 0.5 : 0),
      );
    // comet trail: shift history, newest at head
    if (trail.current && !reduced) {
      trailPositions.copyWithin(3, 0, trailPositions.length - 3);
      trailPositions[0] = p.x + (Math.random() - 0.5) * 0.04;
      trailPositions[1] = p.y + (Math.random() - 0.5) * 0.04;
      trailPositions[2] = p.z;
      (trail.current.geometry.attributes["position"] as THREE.BufferAttribute).needsUpdate = true;
    }
  });
  const done = Math.max(2, Math.round(clamped * (PATH_SAMPLES - 1)) + 1);
  return (
    <group>
      <Line
        points={points}
        color={palette.gold}
        lineWidth={1.4}
        transparent
        opacity={0.4}
        dashed
        dashSize={0.08}
        gapSize={0.06}
      />
      <Line
        points={points.slice(0, done)}
        color={palette.ivory}
        lineWidth={3.2}
        transparent
        opacity={0.92}
      />
      <mesh
        geometry={hitTube}
        onPointerDown={(e) => {
          e.stopPropagation();
          dragging.current = true;
          document.body.classList.add("is-scrubbing");
          window.dispatchEvent(
            new PointerEvent("pointermove", {
              clientX: e.nativeEvent.clientX,
              clientY: e.nativeEvent.clientY,
            }),
          );
        }}
        onPointerOver={() => setCursor("Drag through time")}
        onPointerOut={() => setCursor(null)}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <points ref={trail} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trailPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={palette.gold}
          size={0.05}
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      <group ref={marker} position={curve.getPointAt(clamped)}>
        <mesh>
          <sphereGeometry args={[0.1, 20, 20]} />
          <meshBasicMaterial color={palette.ivory} />
        </mesh>
        <mesh ref={halo}>
          <sphereGeometry args={[0.2, 20, 20]} />
          <meshBasicMaterial
            color={palette.gold}
            transparent
            opacity={0.25}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
      <SceneTag
        position={[TIME_PATH[0]![0] + 0.1, TIME_PATH[0]![1] - 0.45, TIME_PATH[0]![2]]}
        text="You, today"
      />
      {crash && (
        <group position={curve.getPointAt(Math.min(1, Math.max(0, crash.t)))}>
          <mesh rotation={[0, 0, Math.PI / 4]} scale={clamped >= crash.t ? 1.5 : 1}>
            <boxGeometry args={[0.14, 0.14, 0.14]} />
            <meshBasicMaterial color={palette.storm} />
          </mesh>
          <mesh>
            <ringGeometry args={[0.2, 0.24, 32]} />
            <meshBasicMaterial
              color={palette.storm}
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
          <SceneTag
            position={[0.35, -0.9, 0]}
            text={crash.label}
            active={clamped >= crash.t}
            tone="storm"
          />
        </group>
      )}
      {milestones.map((m, i) => {
        const reached = clamped >= m.t - 1e-3;
        const pos = curve.getPointAt(Math.min(1, Math.max(0, m.t)));
        return (
          <group key={m.label} position={pos}>
            <mesh scale={reached ? 1.6 : 1}>
              <octahedronGeometry args={[0.08, 0]} />
              <meshBasicMaterial color={reached ? palette.gold : palette.muted} />
            </mesh>
            <SceneTag
              position={i % 2 ? [0.45, 0.5, 0] : [-0.45, 0.5, 0]}
              text={m.label}
              active={reached}
            />
          </group>
        );
      })}
    </group>
  );
}

/** Money "flowing" around each allocation segment; particle share follows the rupee share. */
function AllocationFlow({
  amounts,
  colors,
  reduced,
}: {
  amounts: number[];
  colors: string[];
  reduced: boolean;
}) {
  const COUNT = 260;
  const ref = useRef<THREE.Points>(null);
  const t = useRef(0);
  const { positions, colorArr } = useMemo(
    () => ({ positions: new Float32Array(COUNT * 3), colorArr: new Float32Array(COUNT * 3) }),
    [],
  );
  const layout = useMemo(() => {
    const total = Math.max(
      amounts.reduce((a, b) => a + b, 0),
      1,
    );
    let start = 0;
    const segs = amounts.map((a) => {
      const arc = (a / total) * Math.PI * 2;
      const s = { start, arc };
      start += arc;
      return s;
    });
    const owner = new Int8Array(COUNT);
    let k = 0;
    amounts.forEach((a, i) => {
      const n = Math.round((a / total) * COUNT);
      for (let j = 0; j < n && k < COUNT; j++) owner[k++] = i;
    });
    while (k < COUNT) owner[k++] = -1;
    const c = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      c.set(owner[i]! >= 0 ? (colors[owner[i]!] ?? "#fff") : "#000");
      colorArr.set([c.r, c.g, c.b], i * 3);
    }
    return { segs, owner };
  }, [amounts, colors, colorArr]);
  useEffect(() => {
    if (ref.current)
      (ref.current.geometry.attributes["color"] as THREE.BufferAttribute).needsUpdate = true;
  }, [layout]);
  useFrame((_, raw) => {
    if (!reduced) t.current += Math.min(raw, 0.05);
    for (let i = 0; i < COUNT; i++) {
      const o = layout.owner[i]!;
      const seg = o >= 0 ? layout.segs[o] : undefined;
      if (!seg || seg.arc < 0.01) {
        positions.set([0, 0, -50], i * 3);
        continue;
      }
      const phase = ((i * 0.618034) % 1) + t.current * (0.05 + (i % 7) * 0.006);
      const a = seg.start + (phase % 1) * Math.max(0, seg.arc - 0.04);
      const wobble = Math.sin(t.current * 2 + i) * 0.05;
      const r = 1.9 + Math.sin(i * 12.9898) * 0.24 + wobble;
      positions.set([Math.cos(a) * r, Math.sin(a) * r, Math.cos(i * 4.1) * 0.22], i * 3);
    }
    if (ref.current)
      (ref.current.geometry.attributes["position"] as THREE.BufferAttribute).needsUpdate = true;
  });
  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colorArr, 3]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.045}
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

function Allocation({
  amounts,
  palette,
  reduced,
  labels,
  highlight,
  onSegment,
  setCursor,
}: {
  amounts: number[];
  palette: Palette;
  reduced: boolean;
  labels: string[];
  highlight: number;
  onSegment?: ((i: number) => void) | undefined;
  setCursor: CursorSetter;
}) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(-1);
  const total = Math.max(
      amounts.reduce((a, b) => a + b, 0),
      1,
    ),
    colors = useMemo(
      () => [palette.cash, palette.deposit, palette.equity, palette.gold],
      [palette],
    );
  let angle = 0;
  useFrame(({ pointer }, raw) => {
    const dt = Math.min(raw, 0.05);
    if (!group.current || reduced) return;
    group.current.rotation.z += dt * (hovered >= 0 ? 0.004 : 0.03);
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      0.45 - pointer.y * 0.25,
      3,
      dt,
    );
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      pointer.x * 0.3,
      3,
      dt,
    );
  });
  const focus = hovered >= 0 ? hovered : highlight;
  return (
    <group ref={group} rotation={[0.45, 0, 0]}>
      {amounts.map((amount, i) => {
        const start = angle;
        const arc = (amount / total) * Math.PI * 2;
        angle += arc;
        const mid = start + arc / 2;
        return amount > 0 ? (
          <group key={i}>
            <AllocationSegment
              start={start}
              arc={arc}
              color={colors[i] ?? palette.gold}
              reduced={reduced}
              active={focus === i}
              onHover={(on) => {
                setHovered(on ? i : -1);
                setCursor(on ? `Adjust ${labels[i] ?? ""}` : null);
              }}
              onSelect={() => onSegment?.(i)}
            />
            {focus === i && (
              <SceneTag
                position={[Math.cos(mid) * 2.75, Math.sin(mid) * 2.75, 0]}
                text={`${labels[i] ?? ""} · ${Math.round((amount / total) * 100)}%`}
                active
              />
            )}
          </group>
        ) : null;
      })}
      <AllocationFlow amounts={amounts} colors={colors} reduced={reduced} />
      <mesh>
        <torusGeometry args={[1.42, 0.006, 4, 96]} />
        <meshBasicMaterial color={palette.ivory} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

/** Camera glides toward whichever station is selected. */
function StationCamera({ selected, reduced }: { selected: number; reduced: boolean }) {
  const look = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, pointer }, raw) => {
    if (reduced) return;
    const dt = Math.min(raw, 0.05);
    const a = (selected / 6) * Math.PI * 2;
    const sx = Math.cos(a) * 2.3,
      sy = Math.sin(a) * 1.7;
    target.set(sx * 0.28 + pointer.x * 0.4, sy * 0.28 + pointer.y * 0.3, 8.6);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, target.x, 2.4, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, target.y, 2.4, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, target.z, 2.4, dt);
    look.lerp(new THREE.Vector3(sx * 0.35, sy * 0.35, 0), 1 - Math.exp(-2.4 * dt));
    camera.lookAt(look);
  });
  return null;
}

function EnergyBeam({ angle, color, reduced }: { angle: number; color: string; reduced: boolean }) {
  const ref = useRef<{ material: { dashOffset: number } } | null>(null);
  useFrame((_, raw) => {
    if (ref.current && !reduced) ref.current.material.dashOffset -= Math.min(raw, 0.05) * 1.6;
  });
  return (
    <Line
      ref={ref as never}
      points={[
        [0, 0, 0],
        [Math.cos(angle) * 2.3, Math.sin(angle) * 1.7, 0],
      ]}
      color={color}
      lineWidth={2.4}
      dashed
      dashSize={0.18}
      gapSize={0.12}
      transparent
      opacity={0.95}
    />
  );
}

function Stations({
  palette,
  onSelect,
  selected,
  reduced,
  labels,
  setCursor,
}: {
  palette: Palette;
  onSelect?: ((i: number) => void) | undefined;
  selected: number;
  reduced: boolean;
  labels: string[];
  setCursor: CursorSetter;
}) {
  const core = useRef<THREE.Mesh>(null);
  useFrame((_, raw) => {
    if (core.current && !reduced) {
      core.current.rotation.y += Math.min(raw, 0.05) * 0.4;
      core.current.rotation.z += Math.min(raw, 0.05) * 0.15;
    }
  });
  return (
    <group>
      <StationCamera selected={selected} reduced={reduced} />
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(angle) * 2.3, Math.sin(angle) * 1.7, 0]}>
            <StationGlyph
              index={i}
              active={selected === i}
              color={i % 2 ? palette.deposit : palette.cash}
              accent={palette.gold}
              reduced={reduced}
              onSelect={() => onSelect?.(i)}
              onHover={(on) => setCursor(on ? `Explore ${labels[i] ?? ""}` : null)}
            />
            <SceneTag position={[0, -0.68, 0]} text={labels[i] ?? ""} active={selected === i} />
            {selected !== i && (
              <Line
                points={[
                  [0, 0, 0],
                  [-Math.cos(angle) * 1.9, -Math.sin(angle) * 1.4, 0],
                ]}
                color={palette.gold}
                transparent
                opacity={0.18}
                lineWidth={1}
              />
            )}
          </group>
        );
      })}
      <EnergyBeam angle={(selected / 6) * Math.PI * 2} color={palette.gold} reduced={reduced} />
      <mesh ref={core} rotation={[0.7, 0.3, 0]}>
        <torusKnotGeometry args={[0.35, 0.08, 96, 12]} />
        <meshPhysicalMaterial
          color={palette.gold}
          metalness={0.85}
          roughness={0.2}
          clearcoat={1}
          emissive={palette.gold}
          emissiveIntensity={0.08}
        />
      </mesh>
    </group>
  );
}

export type UniverseProps = {
  mode?: string;
  amounts?: number[];
  progress?: number;
  selected?: number;
  onSelect?: ((i: number) => void) | undefined;
  labels?: string[];
  highlight?: number;
  onSegment?: ((i: number) => void) | undefined;
  onScrub?: ((t: number) => void) | undefined;
  milestones?: { t: number; label: string }[];
  crash?: { t: number; label: string } | undefined;
  onOrbClick?: (() => void) | undefined;
};

export function Universe({
  mode = "hero",
  amounts = [2000, 2000, 3200, 800],
  progress = 0,
  selected = 0,
  onSelect,
  labels = [],
  highlight = -1,
  onSegment,
  onScrub,
  milestones = [],
  crash,
  onOrbClick,
}: UniverseProps) {
  const [palette, setPalette] = useState<Palette | null>(null),
    [supported, setSupported] = useState(true),
    [cursor, setCursor] = useState<string | null>(null);
  const reduced = Boolean(useReducedMotion());
  useEffect(() => {
    setPalette(readPalette());
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    setSupported(Boolean(gl));
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  }, []);
  const fallback = (
    <div className={`universe-fallback ${mode === "hero" ? "hero-fallback" : ""}`}>
      <div className="fallback-orbit" />
      <div className="fallback-sphere" />
    </div>
  );
  if (!supported) return fallback;
  return (
    <SceneBoundary fallback={fallback}>
      <div
        className={`universe universe-${mode} ${cursor ? "is-pointing" : ""}`}
        aria-hidden={mode !== "stations"}
        data-cursor={cursor ?? undefined}
      >
        {palette ? (
          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [0, 0, 10], fov: 42 }}
            gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
            frameloop={reduced ? "demand" : "always"}
          >
            <SceneEntrance reduced={reduced} />
            <ambientLight intensity={0.55} />
            <directionalLight position={[-3, 5, 5]} intensity={3} color={palette.ivory} />
            <pointLight
              position={[5, -2, 3]}
              color={mode === "storm" ? palette.storm : palette.gold}
              intensity={25}
            />
            <Suspense fallback={null}>
              <Environment resolution={128}>
                <Lightformer
                  intensity={4}
                  position={[-4, 4, 4]}
                  scale={[5, 5, 1]}
                  color={palette.ivory}
                />
                <Lightformer
                  intensity={2}
                  position={[4, -2, 2]}
                  scale={[3, 5, 1]}
                  color={palette.gold}
                />
              </Environment>
              <Dust palette={palette} reduced={reduced} storm={mode === "storm"} />
              {mode === "timeline" && (
                <FitWidth>
                  <TimePath
                    palette={palette}
                    progress={progress}
                    milestones={milestones}
                    crash={crash}
                    onScrub={onScrub}
                    reduced={reduced}
                    setCursor={setCursor}
                  />
                </FitWidth>
              )}
              {mode === "allocation" ? (
                <Allocation
                  amounts={amounts}
                  palette={palette}
                  reduced={reduced}
                  labels={labels}
                  highlight={highlight}
                  onSegment={onSegment}
                  setCursor={setCursor}
                />
              ) : mode === "stations" ? (
                <Stations
                  palette={palette}
                  selected={selected}
                  onSelect={onSelect}
                  reduced={reduced}
                  labels={labels}
                  setCursor={setCursor}
                />
              ) : mode === "timeline" ? (
                <FitWidth>
                  <Sphere
                    palette={palette}
                    reduced={reduced}
                    mode={mode}
                    progress={progress}
                    onOrbClick={onOrbClick}
                    setCursor={setCursor}
                  />
                </FitWidth>
              ) : (
                <Sphere
                  palette={palette}
                  reduced={reduced}
                  mode={mode}
                  progress={progress}
                  onOrbClick={onOrbClick}
                  setCursor={setCursor}
                />
              )}
            </Suspense>
          </Canvas>
        ) : (
          fallback
        )}
      </div>
    </SceneBoundary>
  );
}

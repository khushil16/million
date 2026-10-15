import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { fx, type Mood } from "./fxBus";

/**
 * A single persistent, full-screen WebGL layer behind the whole experience.
 * Inspired by the three.js examples "webgl_points_sprites", "webgl_buffergeometry_custom_attributes_particles"
 * and the classic hyperspace starfield: GPU-driven stars that streak into warp on stage changes,
 * a slow fbm nebula that reacts to mood, cursor spark trails, click bursts, storm rain and a
 * one-time gold-coin moment when the plan is finished.
 */

const STAR_DEPTH = 70;

const starVertex = /* glsl */ `
  attribute vec3 aBase;
  attribute float aEnd;
  attribute float aSeed;
  uniform float uTravel;
  uniform float uWarp;
  uniform float uTime;
  uniform float uScale;
  uniform float uIsLine;
  varying float vAlpha;
  varying float vSeed;
  void main() {
    float z = mod(aBase.z + uTravel, ${STAR_DEPTH.toFixed(1)}) - ${(STAR_DEPTH - 4).toFixed(1)};
    vec3 p = vec3(aBase.xy, z);
    p.z -= aEnd * (0.02 + uWarp * 9.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float depthFade = smoothstep(-${(STAR_DEPTH - 4).toFixed(1)}, -20.0, z) * (1.0 - smoothstep(2.0, 4.0, z));
    float twinkle = 0.65 + 0.35 * sin(uTime * (0.6 + aSeed * 2.2) + aSeed * 40.0);
    vAlpha = depthFade * mix(twinkle * (1.0 - uWarp), uWarp, uIsLine);
    vSeed = aSeed;
    gl_PointSize = max(1.0, (0.05 + aSeed * 0.07) * uScale / -mv.z);
  }
`;
const starFragment = /* glsl */ `
  uniform vec3 uGold;
  uniform vec3 uIvory;
  uniform vec3 uStormColor;
  uniform float uStorm;
  uniform float uIsLine;
  varying float vAlpha;
  varying float vSeed;
  void main() {
    float a = vAlpha;
    if (uIsLine < 0.5) {
      vec2 c = gl_PointCoord - 0.5;
      a *= smoothstep(0.5, 0.0, length(c));
    }
    vec3 col = mix(uIvory, uGold, step(0.72, vSeed));
    col = mix(col, uStormColor, uStorm * 0.55);
    gl_FragColor = vec4(col, a);
  }
`;

function Stars({
  count,
  warp,
  storm,
}: {
  count: number;
  warp: React.MutableRefObject<number>;
  storm: React.MutableRefObject<number>;
}) {
  const { size, viewport } = useThree();
  const travel = useRef(0);
  const { pointGeo, lineGeo } = useMemo(() => {
    const base = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // golden-angle spiral keeps distribution deterministic and even
      const r = 2.5 + Math.sqrt(i / count) * 34;
      const a = i * 2.399963;
      base[i * 3] = Math.cos(a) * r * 1.3;
      base[i * 3 + 1] = Math.sin(a) * r * 0.75;
      base[i * 3 + 2] = (((i * 7919) % 1000) / 1000) * STAR_DEPTH;
      seed[i] = ((i * 104729) % 1000) / 1000;
    }
    const pointGeo = new THREE.BufferGeometry();
    pointGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    pointGeo.setAttribute("aBase", new THREE.BufferAttribute(base, 3));
    pointGeo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    pointGeo.setAttribute("aEnd", new THREE.BufferAttribute(new Float32Array(count), 1));
    const lb = new Float32Array(count * 6),
      ls = new Float32Array(count * 2),
      le = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      for (let k = 0; k < 2; k++) {
        lb.set([base[i * 3]!, base[i * 3 + 1]!, base[i * 3 + 2]!], (i * 2 + k) * 3);
        ls[i * 2 + k] = seed[i]!;
        le[i * 2 + k] = k;
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 6), 3));
    lineGeo.setAttribute("aBase", new THREE.BufferAttribute(lb, 3));
    lineGeo.setAttribute("aSeed", new THREE.BufferAttribute(ls, 1));
    lineGeo.setAttribute("aEnd", new THREE.BufferAttribute(le, 1));
    return { pointGeo, lineGeo };
  }, [count]);

  const uniforms = useMemo(() => {
    const shared = {
      uTravel: { value: 0 },
      uWarp: { value: 0 },
      uTime: { value: 0 },
      uScale: { value: 800 },
      uStorm: { value: 0 },
      uGold: { value: new THREE.Color("#e2b65f") },
      uIvory: { value: new THREE.Color("#f3ead8") },
      uStormColor: { value: new THREE.Color("#ff7a5c") },
    };
    return {
      points: { ...shared, uIsLine: { value: 0 } },
      lines: { ...shared, uIsLine: { value: 1 } },
    };
  }, []);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    travel.current += dt * (0.35 + warp.current * 55 + storm.current * 1.2);
    const scale = (size.height * viewport.dpr) / (2 * Math.tan((60 * Math.PI) / 360));
    uniforms.points.uTravel.value = travel.current;
    uniforms.points.uWarp.value = warp.current;
    uniforms.points.uTime.value += dt;
    uniforms.points.uScale.value = scale;
    uniforms.points.uStorm.value = storm.current;
  });
  return (
    <group>
      <points geometry={pointGeo} frustumCulled={false}>
        <shaderMaterial
          vertexShader={starVertex}
          fragmentShader={starFragment}
          uniforms={uniforms.points}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <lineSegments geometry={lineGeo} frustumCulled={false}>
        <shaderMaterial
          vertexShader={starVertex}
          fragmentShader={starFragment}
          uniforms={uniforms.lines}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}

const nebulaVertex = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.999, 1.0); }
`;
const nebulaFragment = /* glsl */ `
  uniform vec2 uRes;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uStorm;
  uniform float uFlash;
  uniform float uWarp;
  uniform float uCelebrate;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.02 + 17.0; a *= 0.5; }
    return v;
  }
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec2 p = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
    float speed = 1.0 + uStorm * 5.0;
    vec2 q = p * 1.5 + uMouse * 0.06;
    float n = fbm(q + vec2(uTime * 0.012 * speed, uTime * 0.007 * speed));
    float n2 = fbm(q * 2.3 - vec2(uTime * 0.018 * speed, 0.0) + n);
    vec3 navy = vec3(0.06, 0.08, 0.2);
    vec3 gold = vec3(0.9, 0.62, 0.26);
    vec3 red = vec3(0.75, 0.16, 0.12);
    vec3 accent = mix(gold, red, uStorm);
    float clouds = smoothstep(0.42, 0.92, n2);
    vec3 col = navy * n + accent * clouds * 0.55;
    // cursor-following warm glow
    float cursor = smoothstep(0.55, 0.0, length(p - uMouse * vec2(uRes.x / uRes.y, 1.0) * 0.5));
    col += accent * cursor * 0.18;
    col += accent * uFlash * (0.5 + n2);
    col += gold * uCelebrate * clouds * 0.6;
    float vign = smoothstep(1.25, 0.15, length(p));
    float rim = smoothstep(0.2, 0.9, length(p)) * uWarp;
    col += accent * rim * 0.5;
    float alpha = clamp((n * 0.28 + clouds * 0.42 + cursor * 0.1) * vign + uFlash * 0.45 + rim * 0.35, 0.0, 0.9);
    gl_FragColor = vec4(col, alpha);
  }
`;

function Nebula({
  warp,
  storm,
  flash,
  celebrate,
  pointer,
}: {
  warp: React.MutableRefObject<number>;
  storm: React.MutableRefObject<number>;
  flash: React.MutableRefObject<number>;
  celebrate: React.MutableRefObject<number>;
  pointer: React.MutableRefObject<THREE.Vector2>;
}) {
  const { size, viewport } = useThree();
  const uniforms = useMemo(
    () => ({
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uStorm: { value: 0 },
      uFlash: { value: 0 },
      uWarp: { value: 0 },
      uCelebrate: { value: 0 },
    }),
    [],
  );
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    uniforms.uRes.value.set(size.width * viewport.dpr, size.height * viewport.dpr);
    uniforms.uTime.value += dt;
    uniforms.uMouse.value.lerp(pointer.current, 1 - Math.exp(-3 * dt));
    uniforms.uStorm.value = storm.current;
    uniforms.uFlash.value = flash.current;
    uniforms.uWarp.value = warp.current;
    uniforms.uCelebrate.value = celebrate.current;
  });
  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={nebulaVertex}
        fragmentShader={nebulaFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

const sparkVertex = /* glsl */ `
  attribute vec3 aOrigin;
  attribute vec3 aVel;
  attribute float aBirth;
  attribute float aLife;
  attribute float aSize;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uScale;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float age = uTime - aBirth;
    float t = age / aLife;
    float alive = step(0.0, age) * step(t, 1.0);
    float k = 2.2;
    vec3 p = aOrigin + aVel * (1.0 - exp(-k * age)) / k + vec3(0.0, -0.35, 0.0) * age * age;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vAlpha = alive * pow(1.0 - clamp(t, 0.0, 1.0), 1.6);
    vColor = aColor;
    gl_PointSize = alive * aSize * (1.0 - t * 0.55) * uScale / -mv.z;
  }
`;
const sparkFragment = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float core = smoothstep(0.5, 0.0, d);
    float a = vAlpha * core * core;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor * (1.0 + core), a);
  }
`;

const PALETTE = {
  gold: [new THREE.Color("#f2c66d"), new THREE.Color("#ffe3a3"), new THREE.Color("#c9902f")],
  ivory: [new THREE.Color("#fff6e6"), new THREE.Color("#f2c66d")],
  storm: [new THREE.Color("#ff8a65"), new THREE.Color("#ffd2b8")],
};

function Sparks({ pool }: { pool: number }) {
  const { camera, size, viewport } = useThree();
  const cursor = useRef(0);
  const time = useRef(0);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pool * 3), 3));
    g.setAttribute("aOrigin", new THREE.BufferAttribute(new Float32Array(pool * 3), 3));
    g.setAttribute("aVel", new THREE.BufferAttribute(new Float32Array(pool * 3), 3));
    const birth = new Float32Array(pool).fill(-100);
    g.setAttribute("aBirth", new THREE.BufferAttribute(birth, 1));
    g.setAttribute("aLife", new THREE.BufferAttribute(new Float32Array(pool).fill(1), 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(pool), 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(pool * 3), 3));
    return g;
  }, [pool]);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uScale: { value: 800 } }), []);
  const tmp = useMemo(() => ({ v: new THREE.Vector3(), dir: new THREE.Vector3() }), []);

  function toWorld(x: number, y: number, out: THREE.Vector3) {
    tmp.v
      .set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1, 0.5)
      .unproject(camera);
    tmp.dir.copy(tmp.v).sub(camera.position).normalize();
    const dist = -camera.position.z / tmp.dir.z;
    return out.copy(camera.position).addScaledVector(tmp.dir, dist);
  }

  useEffect(() => {
    const origin = new THREE.Vector3();
    const attrs = geo.attributes as Record<string, THREE.BufferAttribute>;
    function spawn(
      x: number,
      y: number,
      n: number,
      opts: {
        speed: number;
        life: number;
        size: number;
        color: keyof typeof PALETTE;
        spread?: number;
      },
    ) {
      toWorld(x, y, origin);
      const colors = PALETTE[opts.color];
      for (let j = 0; j < n; j++) {
        const i = cursor.current;
        cursor.current = (cursor.current + 1) % pool;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const sp = opts.speed * (0.35 + Math.random() * 0.9);
        const spread = opts.spread ?? 0;
        attrs["aOrigin"]!.setXYZ(
          i,
          origin.x + (Math.random() - 0.5) * spread,
          origin.y + (Math.random() - 0.5) * spread,
          origin.z,
        );
        attrs["aVel"]!.setXYZ(
          i,
          Math.sin(phi) * Math.cos(theta) * sp,
          Math.sin(phi) * Math.sin(theta) * sp + opts.speed * 0.25,
          Math.cos(phi) * sp * 0.6,
        );
        attrs["aBirth"]!.setX(i, time.current);
        attrs["aLife"]!.setX(i, opts.life * (0.6 + Math.random() * 0.7));
        attrs["aSize"]!.setX(i, opts.size * (0.5 + Math.random()));
        const c = colors[j % colors.length]!;
        attrs["aColor"]!.setXYZ(i, c.r, c.g, c.b);
      }
      for (const k of ["aOrigin", "aVel", "aBirth", "aLife", "aSize", "aColor"])
        attrs[k]!.needsUpdate = true;
    }
    const offBurst = fx.on("burst", ({ x, y, strength = 1, color = "gold" }) =>
      spawn(x, y, Math.round(26 * strength), {
        speed: 2.4 * Math.sqrt(strength),
        life: 1.1,
        size: 0.05,
        color,
      }),
    );
    const offCelebrate = fx.on("celebrate", () => {
      for (let k = 0; k < 6; k++)
        setTimeout(
          () =>
            spawn(
              window.innerWidth * (0.15 + Math.random() * 0.7),
              window.innerHeight * (0.2 + Math.random() * 0.4),
              40,
              { speed: 3.2, life: 1.8, size: 0.06, color: "gold" },
            ),
          k * 180,
        );
    });
    return () => {
      offBurst();
      offCelebrate();
    };
  }, [geo, pool]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, raw) => {
    time.current += Math.min(raw, 0.05);
    uniforms.uTime.value = time.current;
    uniforms.uScale.value = (size.height * viewport.dpr) / (2 * Math.tan((60 * Math.PI) / 360));
  });
  return (
    <points geometry={geo} frustumCulled={false} renderOrder={5}>
      <shaderMaterial
        vertexShader={sparkVertex}
        fragmentShader={sparkFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Rain({ storm }: { storm: React.MutableRefObject<number> }) {
  const count = 520;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(count * 6);
    for (let i = 0; i < count; i++) {
      const x = (((i * 7907) % 1000) / 1000) * 22 - 11;
      const y = (((i * 6007) % 1000) / 1000) * 14 - 7;
      const z = (-((i * 3001) % 1000) / 1000) * 6;
      p.set([x, y, z, x + 0.12, y + 0.55, z], i * 6);
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, []);
  const ref = useRef<THREE.LineSegments>(null);
  const mat = useRef<THREE.LineBasicMaterial>(null);
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    if (!ref.current || !mat.current) return;
    mat.current.opacity = storm.current * 0.35;
    ref.current.visible = storm.current > 0.01;
    ref.current.position.y -= dt * 9;
    ref.current.position.x -= dt * 2;
    if (ref.current.position.y < -7) {
      ref.current.position.y += 7;
      ref.current.position.x += 7 * (2 / 9);
    }
  });
  return (
    <lineSegments ref={ref} geometry={geo} frustumCulled={false}>
      <lineBasicMaterial
        ref={mat}
        color="#ffb59c"
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

/** A tasteful, one-time cascade of metallic coins when the plan is finished. */
function Coins({ active }: { active: React.MutableRefObject<number> }) {
  const count = 46;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const started = useRef(-1);
  const t = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (((i * 7919) % 1000) / 1000) * 9 - 4.5,
        delay: (((i * 104729) % 1000) / 1000) * 1.6,
        speed: 2.6 + (((i * 3001) % 1000) / 1000) * 2.2,
        spin: 2 + (((i * 6007) % 1000) / 1000) * 6,
        z: -(((i * 1009) % 1000) / 1000) * 3,
      })),
    [],
  );
  useEffect(
    () =>
      fx.on("celebrate", () => {
        started.current = t.current;
      }),
    [],
  );
  useFrame((_, raw) => {
    t.current += Math.min(raw, 0.05);
    const m = mesh.current;
    if (!m) return;
    const age = started.current < 0 ? -1 : t.current - started.current;
    m.visible = age >= 0 && age < 5.5;
    active.current = m.visible ? Math.max(0, 1 - age / 5.5) : 0;
    if (!m.visible) return;
    seeds.forEach((s, i) => {
      const a = Math.max(0, age - s.delay);
      dummy.position.set(s.x + Math.sin(a * 1.3 + i) * 0.3, 4.2 - a * s.speed, s.z);
      dummy.rotation.set(Math.PI / 2 + a * s.spin, a * s.spin * 0.6, i);
      dummy.scale.setScalar(age < s.delay ? 0 : 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, count]}
      frustumCulled={false}
      visible={false}
    >
      <cylinderGeometry args={[0.17, 0.17, 0.035, 28]} />
      <meshStandardMaterial
        color="#f4c766"
        metalness={0.75}
        roughness={0.28}
        emissive="#9a6618"
        emissiveIntensity={0.75}
      />
    </instancedMesh>
  );
}

function Director({ reduced }: { reduced: boolean }) {
  const warp = useRef(0),
    warpTarget = useRef(0),
    warpDir = useRef<1 | -1>(1);
  const storm = useRef(0),
    stormTarget = useRef(0);
  const flash = useRef(0),
    nextFlash = useRef(0);
  const celebrate = useRef(0);
  const pointer = useRef(new THREE.Vector2());
  const camOffset = useRef(new THREE.Vector2());
  const [mobile] = useState(
    () => !window.matchMedia("(pointer: fine)").matches || window.innerWidth < 760,
  );

  useEffect(() => {
    const offWarp = fx.on("warp", ({ strength, direction }) => {
      if (reduced) return;
      warpTarget.current = Math.min(1, strength);
      warpDir.current = direction;
      window.setTimeout(
        () => {
          warpTarget.current = 0;
        },
        420 + strength * 520,
      );
    });
    const applyMood = (m: Mood) => {
      stormTarget.current = m === "storm" ? 1 : 0;
    };
    applyMood(fx.mood);
    const offMood = fx.on("mood", applyMood);
    const offFlash = fx.on("flash", () => {
      flash.current = 1;
    });
    function move(e: PointerEvent) {
      pointer.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
      );
    }
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      offWarp();
      offMood();
      offFlash();
      window.removeEventListener("pointermove", move);
    };
  }, [reduced]);

  useFrame(({ camera }, raw) => {
    const dt = Math.min(raw, 0.05);
    warp.current = THREE.MathUtils.damp(
      warp.current,
      warpTarget.current,
      warpTarget.current > warp.current ? 7 : 3.2,
      dt,
    );
    storm.current = THREE.MathUtils.damp(storm.current, stormTarget.current, 1.8, dt);
    // storm lightning: deterministic-feeling irregular flashes
    // real-time schedule, so strikes keep their rhythm even when frames are slow
    if (stormTarget.current > 0.5 && !reduced) {
      const now = performance.now() / 1000;
      if (nextFlash.current < 10) nextFlash.current = now + 1.8;
      if (now >= nextFlash.current) {
        flash.current = 1;
        fx.emit("flash");
        nextFlash.current = now + 1.8 + Math.random() * 2.6;
      }
    } else nextFlash.current = 0;
    flash.current = THREE.MathUtils.damp(flash.current, 0, 5.5, dt);
    if (reduced) return;
    // cursor parallax + subtle storm shake + warp push
    camOffset.current.lerp(pointer.current, 1 - Math.exp(-1.6 * dt));
    const shake = storm.current * 0.03;
    camera.position.x = camOffset.current.x * 0.45 + (Math.random() - 0.5) * shake;
    camera.position.y = camOffset.current.y * 0.28 + (Math.random() - 0.5) * shake;
    camera.position.z = 5 - warp.current * 1.2 * warpDir.current;
    (camera as THREE.PerspectiveCamera).fov = 60 + warp.current * 22;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    camera.lookAt(0, 0, -10);
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={2.6} color="#fff1d6" />
      <pointLight position={[-4, -2, 3]} intensity={18} color="#e2a54a" />
      <Nebula warp={warp} storm={storm} flash={flash} celebrate={celebrate} pointer={pointer} />
      <Stars count={mobile ? 1100 : 2600} warp={warp} storm={storm} />
      <Rain storm={storm} />
      <Coins active={celebrate} />
      <Sparks pool={mobile ? 300 : 700} />
    </>
  );
}

export function CosmicBackdrop() {
  const [ready, setReady] = useState<null | { reduced: boolean }>(null);
  useEffect(() => {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    if (!gl) return;
    setReady({ reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches });
  }, []);
  if (!ready)
    return <div className="cosmic-backdrop cosmic-backdrop-fallback" aria-hidden="true" />;
  return (
    <div className="cosmic-backdrop" aria-hidden="true">
      <Canvas
        dpr={1}
        camera={{ position: [0, 0, 5], fov: 60, near: 0.1, far: 120 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        frameloop={ready.reduced ? "demand" : "always"}
        style={{ pointerEvents: "none" }}
      >
        <Director reduced={ready.reduced} />
      </Canvas>
    </div>
  );
}

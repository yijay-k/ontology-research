/**
 * Three.js stage for Ontology Mind.
 *
 * Glow is layered per node (core, tight halo, soft halo) and each layer eases
 * toward its own target, so nodes brighten and fade independently. Only HDR
 * values (> bloom threshold) bloom: idle nodes sit below it, active ones above.
 * Labels are CSS2D and fade with camera distance so far ones never clutter.
 */
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { ADJ, DOMAINS, EDGES, KIND_COLOR, KIND_LABEL, LOGIC, NODES, OBJECTS, nodeColor, type Kind } from "./data";
import { atmosphereMaterial, planetTexture, ringTexture, type PlanetStyle } from "./planets";

export type NodeMark = "seed" | "active" | "applied";

export interface Graph3DHandle {
  fire(edgeKey: string, from: string, dur: number, color: string, size?: number): void;
  burst(id: string, scale?: number, color?: string): void;
  shockwave(id: string): void;
}

interface Props {
  nodeState: Record<string, NodeMark>;
  lit: Set<string>;
  hover: string | null;
  focus: string | null;
  /** nodes the camera should turn to show together (e.g. an action cascade); focus wins */
  frame?: string[] | null;
  busy: boolean;
  onHover(id: string | null): void;
  onSelect(id: string | null): void;
}

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

const RING = 10;
const BG = 0x09090b;
const CLUSTER_KINDS: Exclude<Kind, "object">[] = ["view", "rule", "logic", "indicator", "action"];

const ringPoint = (theta: number, phase = 0, amp = 1.5) =>
  new THREE.Vector3(RING * Math.cos(theta), Math.sin(theta * 3 + phase) * amp, RING * Math.sin(theta));

const POS: Record<string, THREE.Vector3> = {};
OBJECTS.forEach(([id], i) => {
  POS[id] = ringPoint((i / OBJECTS.length) * Math.PI * 2);
});
const CLUSTER_POS: Record<string, THREE.Vector3> = {};
CLUSTER_KINDS.forEach((k, i) => {
  const a = (i / CLUSTER_KINDS.length) * Math.PI * 2 + 0.3;
  CLUSTER_POS[k] = new THREE.Vector3(4.6 * Math.cos(a), (i % 2 ? 1 : -1) * 1.3, 4.6 * Math.sin(a));
});
CLUSTER_KINDS.forEach((k) => {
  const items = LOGIC.filter((l) => l.kind === k);
  items.forEach((l, j) => {
    const a = (j / items.length) * Math.PI * 2;
    POS[l.id] = CLUSTER_POS[k].clone().add(new THREE.Vector3(Math.cos(a) * 0.8, Math.sin(a) * 0.55, Math.sin(a) * 0.8));
  });
});

const CURVES = new Map<string, THREE.QuadraticBezierCurve3>();
for (const e of EDGES) {
  const A = POS[e.a];
  const B = POS[e.b];
  const k = e.kind === "object" ? 0.22 : 0.6;
  const ctrl = A.clone().add(B).multiplyScalar(0.5 * k);
  CURVES.set(e.key, new THREE.QuadraticBezierCurve3(A.clone(), ctrl, B.clone()));
}

/* ------------------------------------------------------------------ */
/*  Shared assets                                                      */
/* ------------------------------------------------------------------ */

function radialTexture(draw: (g: CanvasRenderingContext2D, s: number) => void) {
  const s = 128;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  draw(c.getContext("2d")!, s);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const POINT_VERT = /* glsl */ `
  attribute float size;
  attribute float alpha;
  attribute vec3 tint;
  varying float vA;
  varying vec3 vC;
  void main() {
    vA = alpha;
    vC = tint;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const POINT_FRAG = /* glsl */ `
  varying float vA;
  varying vec3 vC;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, r);
    a = a * a;
    gl_FragColor = vec4(vC * a * vA, a * vA);
  }
`;
function pointMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: POINT_VERT,
    fragmentShader: POINT_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}
function pointCloud(n: number) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute("tint", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute("alpha", new THREE.BufferAttribute(new Float32Array(n), 1));
  g.setAttribute("size", new THREE.BufferAttribute(new Float32Array(n), 1));
  const p = new THREE.Points(g, pointMaterial());
  p.frustumCulled = false;
  return p;
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const approach = (cur: number, target: number, rate: number, dt: number) =>
  cur + (target - cur) * (1 - Math.exp(-rate * dt));

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface NodeVis {
  id: string;
  kind: Kind;
  base: THREE.Color;
  core: THREE.Mesh<THREE.SphereGeometry, THREE.MeshPhysicalMaterial>;
  inner: THREE.Sprite;
  outer: THREE.Sprite;
  seedRing: THREE.Sprite;
  label: CSS2DObject | null;
  glow: number;
  dim: number;
  tint: number;
  labelOpacity: number;
}
interface EdgeVis {
  key: string;
  kind: Kind;
  line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  base: THREE.Color;
  glow: number;
}
interface Particle {
  curve: THREE.QuadraticBezierCurve3;
  reverse: boolean;
  t0: number;
  dur: number;
  color: THREE.Color;
  size: number;
}
interface Burst {
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial | THREE.MeshBasicMaterial>;
  t0: number;
  dur: number;
  max: number;
  peak: number;
}

const TAIL_SEGS = 24; // smooth fading tail behind each particle head
const TAIL_LEN = 0.11; // share of the curve the tail covers
const MAX_PARTICLES = 220;
const DUST = 700;

const Graph3D = forwardRef<Graph3DHandle, Props>(function Graph3D(props, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef(props);
  propsRef.current = props;
  const api = useRef<Graph3DHandle | null>(null);

  useImperativeHandle(ref, () => ({
    fire: (...a) => api.current?.fire(...a),
    burst: (...a) => api.current?.burst(...a),
    shockwave: (...a) => api.current?.shockwave(...a),
  }));

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- renderer, camera, post ---------- */
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    const labels = new CSS2DRenderer();
    labels.domElement.className = "om3-labels";
    host.appendChild(labels.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG);
    scene.fog = new THREE.FogExp2(BG, 0.028);

    /* ---------- light: warm key, cool rim, soft sky; env map for reflections ---------- */
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.35;
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xf3e6cc, 0x14161c, 0.5));
    const key = new THREE.DirectionalLight(0xfff1d8, 2.2);
    key.position.set(-9, 16, 10);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = key.shadow.camera.bottom = -16;
    key.shadow.camera.right = key.shadow.camera.top = 16;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 50;
    key.shadow.radius = 6;
    key.shadow.bias = -0.0005;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fb3d6, 1.1);
    rim.position.set(10, -4, -14);
    scene.add(rim);
    // Floor that only shows shadows, so the graph reads as floating in space.
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.32, color: 0x000000 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -4.2;
    floor.receiveShadow = true;
    scene.add(floor);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    const HOME_POS = new THREE.Vector3(0, 8.33, 21.5); // (0, 12, 31) / 1.44: two 20% zoom-ins
    const HOME_TARGET = new THREE.Vector3(0, 0, 0);
    camera.position.copy(HOME_POS);

    const controls = new OrbitControls(camera, labels.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.5;
    controls.maxDistance = 45;
    controls.target.copy(HOME_TARGET);
    controls.autoRotateSpeed = 0.12; // ~8 min per revolution: drift, not spin

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.6, 0.35, 1.0);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      labels.setSize(w, h);
      composer.setSize(w, h);
      camera.aspect = w / h;
      // Frame the graph 10% of the stage height above centre; orbit, picking and labels share this projection.
      camera.setViewOffset(w, h, 0, h * 0.1, w, h);
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    /* ---------- textures & shared materials ---------- */
    const glowTex = radialTexture((g, s) => {
      const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      r.addColorStop(0, "rgba(255,255,255,1)");
      r.addColorStop(0.18, "rgba(255,255,255,0.55)");
      r.addColorStop(0.45, "rgba(255,255,255,0.12)");
      r.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = r;
      g.fillRect(0, 0, s, s);
    });
    const ringTex = radialTexture((g, s) => {
      g.strokeStyle = "rgba(255,255,255,0.95)";
      g.lineWidth = 2.2;
      g.beginPath();
      g.arc(s / 2, s / 2, s / 2 - 4, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([6, 10]);
      g.lineWidth = 1;
      g.beginPath();
      g.arc(s / 2, s / 2, s / 2 - 14, 0, Math.PI * 2);
      g.stroke();
    });
    const sprite = (map: THREE.Texture, color: THREE.Color, opacity: number) =>
      new THREE.Sprite(
        new THREE.SpriteMaterial({ map, color, opacity, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
    const disposables: { dispose(): void }[] = [glowTex, ringTex];

    /* ---------- core ---------- */
    const champagne = new THREE.Color(KIND_COLOR.object);
    const coreGroup = new THREE.Group();
    const coreMat = new THREE.MeshBasicMaterial({ color: champagne.clone().multiplyScalar(1.4) });
    const coreMesh = new THREE.Mesh(new THREE.SphereGeometry(0.28, 48, 32), coreMat);
    const coreHalo = sprite(glowTex, champagne, 0.5);
    coreHalo.scale.setScalar(3.2);
    const coreShell = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.25, 1)),
      new THREE.LineBasicMaterial({ color: champagne, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    const orbitMat = new THREE.MeshBasicMaterial({ color: champagne, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
    const orbitA = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.006, 6, 180), orbitMat);
    const orbitB = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.004, 6, 180), orbitMat);
    orbitA.rotation.x = 1.2;
    orbitB.rotation.set(0.4, 0.9, 0);
    coreGroup.add(coreMesh, coreHalo, coreShell, orbitA, orbitB);
    scene.add(coreGroup);

    /* ---------- wavy ribbons tracing the object ring ---------- */
    const RIBBON_N = 360;
    const ribbons = [0, 1, 2].map((i) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(RIBBON_N * 3), 3));
      const m = new THREE.LineBasicMaterial({
        color: champagne,
        transparent: true,
        opacity: [0.16, 0.07, 0.05][i],
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const line = new THREE.LineLoop(g, m);
      scene.add(line);
      disposables.push(g, m);
      return line;
    });
    const updateRibbons = (t: number) => {
      ribbons.forEach((line, i) => {
        const arr = line.geometry.attributes.position.array as Float32Array;
        for (let k = 0; k < RIBBON_N; k++) {
          const th = (k / RIBBON_N) * Math.PI * 2;
          const p = i === 0 ? ringPoint(th) : ringPoint(th, t * (i === 1 ? 0.6 : -0.45) + i, 1.5 + i * 0.35);
          if (i) p.multiplyScalar(1 + i * 0.035);
          arr[k * 3] = p.x;
          arr[k * 3 + 1] = p.y;
          arr[k * 3 + 2] = p.z;
        }
        line.geometry.attributes.position.needsUpdate = true;
      });
    };
    updateRibbons(0);

    /* ---------- nodes ---------- */
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitGeo = new THREE.SphereGeometry(0.6, 8, 8);
    const coreGeo = new THREE.SphereGeometry(0.17, 48, 32);
    const itemGeo = new THREE.SphereGeometry(0.09, 32, 20);
    const atmoGeo = new THREE.SphereGeometry(1, 32, 20);
    const ringGeo = new THREE.RingGeometry(0.26, 0.46, 96);
    disposables.push(envTex, atmoGeo, ringGeo);
    const STYLE: Record<string, PlanetStyle> = {};
    const DOMAIN_STYLE: Record<keyof typeof DOMAINS, PlanetStyle> = {
      parties: "terrestrial",
      receivables: "gas",
      cash: "ice",
      financing: "storm",
      risk: "rock",
    };
    for (const [d, def] of Object.entries(DOMAINS)) for (const id of def.ids) STYLE[id] = DOMAIN_STYLE[d as keyof typeof DOMAINS];
    disposables.push(hitMat, hitGeo, coreGeo, itemGeo);
    const hits: THREE.Mesh[] = [];
    const rings: THREE.Mesh[] = [];
    let ringed = 0;
    const RING_COLORS = ["#d8c6a1", "#b3a6cf", "#8ea5c4", "#cf9a7c", "#93b5a1", "#d0919f", "#e3d5b8"];
    const nodes: NodeVis[] = [];

    const makeLabel = (text: string, cls: string) => {
      const el = document.createElement("div");
      el.className = cls;
      el.textContent = text;
      const o = new CSS2DObject(el);
      return o;
    };

    for (const id of Object.keys(NODES)) {
      const n = NODES[id];
      const base = new THREE.Color(nodeColor(id));
      const p = POS[id];
      const style = STYLE[id] ?? "moon";
      const tex = planetTexture(style, base, n.index * 7 + (n.kind === "object" ? 1 : 101));
      disposables.push(tex);
      const core = new THREE.Mesh(
        n.kind === "object" ? coreGeo : itemGeo,
        new THREE.MeshPhysicalMaterial({
          map: tex,
          roughness: style === "ice" ? 0.25 : style === "rock" || style === "moon" ? 0.85 : 0.5,
          metalness: 0.05,
          clearcoat: style === "ice" || style === "terrestrial" ? 0.6 : 0.15,
          clearcoatRoughness: 0.3,
          sheen: 0.35,
          sheenRoughness: 0.5,
          sheenColor: base.clone(),
          emissive: new THREE.Color(0xffffff),
          emissiveMap: tex,
          emissiveIntensity: 0,
          transparent: true,
          opacity: 0.92,
        }),
      );
      core.castShadow = true;
      core.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      // Each sphere turns on its own tilted axis at its own pace.
      core.userData.axis = new THREE.Vector3(Math.random() - 0.5, 1, Math.random() - 0.5).normalize();
      core.userData.spin = 0.75 + Math.random() * 0.75;
      core.position.copy(p);
      const inner = sprite(glowTex, base, 0.2);
      inner.position.copy(p);
      const outer = sprite(glowTex, base, 0.05);
      outer.position.copy(p);
      const seedRing = sprite(ringTex, base, 0);
      seedRing.position.copy(p);
      // Atmosphere rim: fresnel glow on a slightly larger back-faced shell.
      const r = n.kind === "object" ? 0.17 : 0.09;
      const atmo = new THREE.Mesh(atmoGeo, atmosphereMaterial(base));
      atmo.scale.setScalar(r * (style === "rock" || style === "moon" ? 1.08 : 1.22));
      atmo.position.copy(p);
      scene.add(atmo);
      disposables.push(atmo.material);
      // Rings: every financing giant and every other gas giant, each with its own colour, size, tilt and spin.
      if (style === "storm" || (style === "gas" && n.index % 2 === 0)) {
        const k = ringed++;
        const rt = ringTexture(new THREE.Color(RING_COLORS[k % RING_COLORS.length]), n.index * 13 + 5);
        const ring = new THREE.Mesh(
          ringGeo,
          new THREE.MeshBasicMaterial({ map: rt, transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: 0.95 }),
        );
        ring.position.copy(p);
        const tilt = THREE.MathUtils.degToRad(15 + ((k * 37) % 55)) * (k % 2 ? -1 : 1);
        ring.rotation.set(Math.PI / 2 + tilt, THREE.MathUtils.degToRad((k * 71) % 180), 0);
        ring.scale.setScalar(0.85 + ((k * 0.17) % 0.45));
        ring.userData.spin = (0.12 + ((k * 0.07) % 0.2)) * (k % 3 === 1 ? -1 : 1);
        scene.add(ring);
        rings.push(ring);
        disposables.push(rt, ring.material);
      }
      scene.add(core, inner, outer, seedRing);
      disposables.push(core.material, inner.material, outer.material, seedRing.material);

      const hit = new THREE.Mesh(hitGeo, hitMat);
      hit.position.copy(p);
      hit.userData.id = id;
      hit.scale.setScalar(n.kind === "object" ? 1 : 0.55);
      scene.add(hit);
      hits.push(hit);

      let label: CSS2DObject | null = null;
      label = makeLabel(n.label, `om3-label om3-label-${n.kind}`);
      label.position.copy(p).add(new THREE.Vector3(0, n.kind === "object" ? -0.42 : -0.25, 0));
      label.center.set(0.5, 0);
      scene.add(label);

      nodes.push({ id, kind: n.kind, base, core, inner, outer, seedRing, label, glow: 0, dim: 1, tint: 0, labelOpacity: -1 });
    }

    /* ---------- cluster shells + labels ---------- */
    const shells: THREE.LineSegments[] = [];
    for (const k of CLUSTER_KINDS) {
      const c = new THREE.Color(KIND_COLOR[k]);
      const shell = new THREE.LineSegments(
        new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.15, 0)),
        new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      shell.position.copy(CLUSTER_POS[k]);
      shell.userData.kind = k;
      scene.add(shell);
      shells.push(shell);
      disposables.push(shell.geometry, shell.material as THREE.Material);
      const halo = sprite(glowTex, c, 0.07);
      halo.position.copy(CLUSTER_POS[k]);
      halo.scale.setScalar(4);
      scene.add(halo);
      const lab = makeLabel(KIND_LABEL[k], "om3-cluster");
      lab.position.copy(CLUSTER_POS[k]).add(new THREE.Vector3(0, 1.45, 0));
      lab.center.set(0.5, 1);
      scene.add(lab);
    }

    /* ---------- edges ---------- */
    const edges: EdgeVis[] = EDGES.map((e) => {
      const curve = CURVES.get(e.key)!;
      const g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(48));
      const base = new THREE.Color(KIND_COLOR[e.kind]);
      const m = new THREE.LineBasicMaterial({ color: base.clone(), transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false });
      const line = new THREE.Line(g, m);
      scene.add(line);
      disposables.push(g, m);
      return { key: e.key, kind: e.kind, line, base, glow: 0 };
    });

    /* ---------- particles (traversal) ---------- */
    const parts = pointCloud(MAX_PARTICLES);
    scene.add(parts);
    disposables.push(parts.geometry, parts.material);
    // Tails are one continuous line strip per particle; colour fades to black, which is clear under additive blending.
    const tailGeo = new THREE.BufferGeometry();
    tailGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * TAIL_SEGS * 2 * 3), 3));
    tailGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * TAIL_SEGS * 2 * 3), 3));
    const tailMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const tails = new THREE.LineSegments(tailGeo, tailMat);
    tails.frustumCulled = false;
    scene.add(tails);
    disposables.push(tailGeo, tailMat);
    let particles: Particle[] = [];
    let ambientAt = 0;
    const objectEdgeKeys = EDGES.filter((e) => e.kind === "object").map((e) => e.key);

    /* ---------- dust: 3D flow field ---------- */
    const dust = pointCloud(DUST);
    scene.add(dust);
    disposables.push(dust.geometry, dust.material);
    {
      const pos = dust.geometry.attributes.position.array as Float32Array;
      const tint = dust.geometry.attributes.tint.array as Float32Array;
      const al = dust.geometry.attributes.alpha.array as Float32Array;
      const sz = dust.geometry.attributes.size.array as Float32Array;
      for (let i = 0; i < DUST; i++) {
        const r = 6 + Math.random() * 26;
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        pos[i * 3 + 1] = r * Math.cos(ph) * 0.55;
        pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
        const warm = 0.75 + Math.random() * 0.25;
        tint[i * 3] = 0.85 * warm;
        tint[i * 3 + 1] = 0.78 * warm;
        tint[i * 3 + 2] = 0.66 * warm;
        al[i] = 0.12 + Math.random() * 0.35;
        sz[i] = 0.25 + Math.random() * 0.6;
      }
    }

    /* ---------- 3D pulses: fresnel shells + torus waves ---------- */
    const shellGeo = new THREE.SphereGeometry(1, 48, 32);
    const waveGeo = new THREE.TorusGeometry(1, 0.0035, 8, 256);
    disposables.push(shellGeo, waveGeo);
    let bursts: Burst[] = [];
    const shellMat = (color: THREE.Color) =>
      new THREE.ShaderMaterial({
        uniforms: { color: { value: color.clone() }, opacity: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec3 vN; varying vec3 vV;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 color; uniform float opacity;
          varying vec3 vN; varying vec3 vV;
          void main() {
            float f = pow(1.0 - abs(dot(vN, vV)), 3.0);
            float a = (0.06 + f) * opacity;
            gl_FragColor = vec4(color * a, a);
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
    /** A glassy sphere that swells and fades, plus (optionally) a ring wave in the ring plane. */
    const pulse = (p: THREE.Vector3, color: THREE.Color, max: number, dur: number, delay = 0, wave = true, peak = 1) => {
      const t0 = performance.now() + delay;
      const shell = new THREE.Mesh(shellGeo, shellMat(color));
      shell.position.copy(p);
      shell.scale.setScalar(0.001);
      scene.add(shell);
      bursts.push({ mesh: shell, t0, dur, max, peak });
      if (wave) {
        const ring = new THREE.Mesh(
          waveGeo,
          new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(0.9), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
        );
        ring.position.copy(p);
        ring.rotation.set(Math.PI / 2 + (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, 0);
        ring.scale.setScalar(0.001);
        scene.add(ring);
        bursts.push({ mesh: ring, t0: t0 + 60, dur: dur * 1.15, max: max * 1.35, peak });
      }
    };

    api.current = {
      fire(edgeKey, from, dur, color, size = 1.4) {
        const curve = CURVES.get(edgeKey);
        if (!curve || particles.length >= MAX_PARTICLES) return;
        const e = EDGES.find((x) => x.key === edgeKey)!;
        particles.push({ curve, reverse: e.a !== from, t0: performance.now(), dur, color: new THREE.Color(color), size });
      },
      burst(id, scale = 1, color) {
        if (!NODES[id]) return;
        pulse(POS[id], new THREE.Color(color ?? nodeColor(id)), 0.75 * scale, 950, 0, scale >= 1, 0.9);
      },
      shockwave(id) {
        // Muted rose: the action colour blended halfway to ivory, kept below the bloom threshold.
        const ivory = new THREE.Color("#f3e9d6");
        const c = new THREE.Color(KIND_COLOR.action).lerp(ivory, 0.55);
        const o = new THREE.Vector3();
        // Horizontal waves sweep through the object ring; a slow glassy shell follows.
        pulse(o, c, 12, 2400, 0, false, 0.3);
        for (const [i, col] of [c, ivory, c].entries()) {
          const ring = new THREE.Mesh(
            waveGeo,
            new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(0.85), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
          );
          ring.rotation.x = Math.PI / 2;
          ring.position.y = (i - 1) * 0.6;
          ring.scale.setScalar(0.001);
          scene.add(ring);
          bursts.push({ mesh: ring, t0: performance.now() + i * 220, dur: 2400, max: 13, peak: 0.35 });
        }
        if (POS[id]) pulse(POS[id], c, 1.6, 1300, 0, true, 0.45);
      },
    };

    /* ---------- interaction ---------- */
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let hovered: string | null = null;
    let down: { x: number; y: number } | null = null;
    const pick = (ev: PointerEvent) => {
      const r = labels.domElement.getBoundingClientRect();
      ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(hits, false)[0];
      return hit ? (hit.object.userData.id as string) : null;
    };
    const onMove = (ev: PointerEvent) => {
      const id = pick(ev);
      if (id !== hovered) {
        hovered = id;
        labels.domElement.style.cursor = id ? "pointer" : "grab";
        propsRef.current.onHover(id);
      }
    };
    const onDown = (ev: PointerEvent) => {
      down = { x: ev.clientX, y: ev.clientY };
    };
    const onUp = (ev: PointerEvent) => {
      if (!down || Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 5) return;
      propsRef.current.onSelect(pick(ev));
    };
    const onLeave = () => {
      hovered = null;
      propsRef.current.onHover(null);
    };
    labels.domElement.addEventListener("pointermove", onMove);
    labels.domElement.addEventListener("pointerdown", onDown);
    labels.domElement.addEventListener("pointerup", onUp);
    labels.domElement.addEventListener("pointerleave", onLeave);

    /* ---------- camera flight ---------- */
    let flight: { from: THREE.Vector3; fromT: THREE.Vector3; to: THREE.Vector3; toT: THREE.Vector3; t0: number; dur: number } | null = null;
    let lastFocus: string | null | undefined;
    const flyTo = (id: string | null) => {
      let to: THREE.Vector3;
      let toT: THREE.Vector3;
      if (id && POS[id]) {
        toT = POS[id].clone();
        const out = toT.clone().setY(0).normalize();
        if (out.lengthSq() < 0.01) out.set(0, 0, 1);
        // Stand outside the node looking back toward the core, so its links fan out behind it.
        to = toT.clone().add(out.clone().multiplyScalar(7.5)).add(new THREE.Vector3(0, 2.6, 0));
        // Slide the view sideways so the node sits left of the detail panel, not under it.
        const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), out).normalize().multiplyScalar(2.2);
        to.add(right);
        toT.add(right);
      } else {
        to = HOME_POS.clone();
        toT = HOME_TARGET.clone();
      }
      flight = { from: camera.position.clone(), fromT: controls.target.clone(), to, toT, t0: performance.now(), dur: 1500 };
      controls.enabled = false;
    };
    /** Swing round so a group of nodes faces the camera, keeping the whole system in view. */
    const flyFrame = (ids: string[]) => {
      const c = new THREE.Vector3();
      ids.forEach((id) => c.add(POS[id]));
      c.divideScalar(ids.length);
      const out = c.clone().setY(0);
      if (out.lengthSq() < 0.01) out.copy(camera.position).setY(0);
      out.normalize();
      const toT = c.clone().multiplyScalar(0.55);
      const to = out.multiplyScalar(HOME_POS.length() * 0.92).add(new THREE.Vector3(0, HOME_POS.y * 0.8, 0));
      flight = { from: camera.position.clone(), fromT: controls.target.clone(), to, toT, t0: performance.now(), dur: 1700 };
      controls.enabled = false;
    };

    /* ---------- frame loop ---------- */
    const clock = new THREE.Clock();
    const tmp = new THREE.Vector3();
    const ambientColor = new THREE.Color("#bfae8c");
    const appliedColor = new THREE.Color(KIND_COLOR.action).lerp(new THREE.Color("#f3e9d6"), 0.45);
    const white = new THREE.Color(0xffffff);
    let raf = 0;

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const now = performance.now();
      const P = propsRef.current;
      const engaged = Object.keys(P.nodeState).length > 0;
      const emph = P.hover ?? P.focus;
      const emphSet = emph ? new Set([emph, ...(ADJ[emph] ?? [])]) : null;

      const frameIds = P.frame?.filter((id) => POS[id]) ?? [];
      const viewKey = P.focus ?? (frameIds.length ? `frame:${frameIds.join(",")}` : null);
      if (viewKey !== lastFocus) {
        lastFocus = viewKey;
        if (P.focus || !frameIds.length) flyTo(P.focus);
        else flyFrame(frameIds);
      }
      if (flight) {
        const k = Math.min(1, (now - flight.t0) / flight.dur);
        const e = ease(k);
        camera.position.lerpVectors(flight.from, flight.to, e);
        controls.target.lerpVectors(flight.fromT, flight.toT, e);
        if (k >= 1) {
          flight = null;
          controls.enabled = true;
        }
      }
      controls.autoRotate = !calm && !P.focus && !frameIds.length && !flight;
      controls.update();

      // core breathes; faster while reasoning
      const pulse = 0.5 + 0.5 * Math.sin(t * (P.busy ? 6 : 1.6));
      coreMat.color.copy(champagne).multiplyScalar(0.9 + pulse * (P.busy ? 0.9 : 0.25));
      coreHalo.material.opacity = 0.35 + pulse * 0.25;
      coreShell.rotation.y += dt * (P.busy ? 0.9 : 0.12);
      coreShell.rotation.x += dt * 0.05;
      orbitA.rotation.z += dt * (P.busy ? 1.4 : 0.25);
      orbitB.rotation.z -= dt * (P.busy ? 1.0 : 0.18);
      shells.forEach((s, i) => {
        s.rotation.y += dt * (0.15 + i * 0.03);
        s.rotation.x += dt * 0.04;
        const hot = LOGIC.some((l) => l.kind === s.userData.kind && P.nodeState[l.id]);
        const m = s.material as THREE.LineBasicMaterial;
        m.opacity = approach(m.opacity, hot ? 0.55 : 0.14, 4, dt);
      });
      if (!calm) updateRibbons(t);

      // nodes: each layer eases toward its own target
      for (const n of nodes) {
        const st = P.nodeState[n.id];
        const target = st === "seed" ? 1.6 : st === "applied" ? 1.5 : st ? 1 : emphSet?.has(n.id) ? 0.55 : 0;
        const dimTarget = emphSet ? (emphSet.has(n.id) ? 1 : 0.25) : engaged && !st ? 0.3 : 1;
        n.glow = approach(n.glow, target, st ? 7 : 3.5, dt);
        n.dim = approach(n.dim, dimTarget, 4, dt);
        const g = n.glow;
        const flicker = st ? 1 + 0.06 * Math.sin(t * 9 + n.id.length) : 1;
        // Halos are world-sized sprites; shrink them as the camera nears so close nodes stay crisp.
        const near = THREE.MathUtils.clamp(camera.position.distanceTo(n.core.position) / 16, 0.3, 1);
        // Nodes changed by an action take on the action's rose-gold, and keep it.
        n.tint = approach(n.tint, st === "applied" ? 1 : 0, 3, dt);
        n.core.material.emissive.lerpColors(white, appliedColor, n.tint);
        n.inner.material.color.lerpColors(n.base, appliedColor, n.tint);
        n.outer.material.color.lerpColors(n.base, appliedColor, n.tint);
        const breathe = 0.75 + 0.25 * Math.sin(t * 2.4 + n.id.length * 1.7);
        n.core.material.emissiveIntensity = (g * 0.45 + n.tint * 0.9 * breathe) * flicker * n.dim;
        n.core.material.opacity = (0.55 + g * 0.4) * n.dim;
        if (!calm) n.core.rotateOnAxis(n.core.userData.axis as THREE.Vector3, dt * (n.core.userData.spin as number) * (1 + g * 0.4));
        const sObj = (n.kind === "object" ? 1 : 0.6) * near;
        n.inner.material.opacity = (0.08 + g * 0.28 + n.tint * 0.3 * breathe) * n.dim;
        n.inner.scale.setScalar((0.45 + g * 0.3) * sObj);
        n.outer.material.opacity = (0.015 + g * 0.06 + n.tint * 0.08 * breathe) * n.dim;
        n.outer.scale.setScalar((1.0 + g * 0.7) * sObj);
        const seedOn = st === "seed" ? 1 : 0;
        n.seedRing.material.opacity = approach(n.seedRing.material.opacity, seedOn * 0.8, 5, dt);
        n.seedRing.material.rotation += dt * 1.2;
        n.seedRing.scale.setScalar((0.6 + 0.05 * Math.sin(t * 3)) * near);

        if (n.label) {
          const d = camera.position.distanceTo(n.core.position);
          let o = THREE.MathUtils.clamp(1.25 - (d - 6) / 20, 0.28, 1);
          if (n.kind !== "object") o = st || emphSet?.has(n.id) || d < 7 ? 1 : 0;
          if (st || emphSet?.has(n.id)) o = 1;
          else if (engaged || emphSet) o *= 0.3;
          if (Math.abs(o - n.labelOpacity) > 0.02) {
            n.labelOpacity = o;
            n.label.element.style.opacity = o.toFixed(2);
            n.label.element.classList.toggle("on", !!st || P.focus === n.id);
          }
        }
      }

      // edges
      for (const e of edges) {
        const isLit = P.lit.has(e.key);
        const [a, b] = e.key.split("|");
        const isEmph = !!emph && (a === emph || b === emph);
        const target = isLit ? 1 : isEmph ? 0.6 : 0;
        e.glow = approach(e.glow, target, isLit ? 5 : 3, dt);
        const baseOp = e.kind === "object" ? 0.1 : 0.05;
        const quiet = engaged || emphSet ? 0.25 : 1;
        e.line.material.opacity = baseOp * quiet + e.glow * 0.85;
        e.line.material.color.copy(e.base).multiplyScalar(1 + e.glow * 1.8);
      }

      // particles
      if (!calm && !engaged && now - ambientAt > 750) {
        ambientAt = now;
        const key = objectEdgeKeys[Math.floor(Math.random() * objectEdgeKeys.length)];
        particles.push({ curve: CURVES.get(key)!, reverse: Math.random() < 0.5, t0: now, dur: 5200, color: ambientColor, size: 0.6 });
      }
      particles = particles.filter((p) => now - p.t0 < p.dur);
      const pa = parts.geometry.attributes;
      const pos = pa.position.array as Float32Array;
      const tint = pa.tint.array as Float32Array;
      const al = pa.alpha.array as Float32Array;
      const sz = pa.size.array as Float32Array;
      const tp = tailGeo.attributes.position.array as Float32Array;
      const tc = tailGeo.attributes.color.array as Float32Array;
      const prev = new THREE.Vector3();
      let v = 0;
      let w = 0;
      for (const p of particles) {
        const k = (now - p.t0) / p.dur;
        if (k < 0) continue;
        const life = Math.min(1, (1 - k) * 4, k * 12);
        // head: one soft point
        p.curve.getPoint(p.reverse ? 1 - k : k, tmp);
        pos[v * 3] = tmp.x;
        pos[v * 3 + 1] = tmp.y;
        pos[v * 3 + 2] = tmp.z;
        tint[v * 3] = p.color.r * 1.3;
        tint[v * 3 + 1] = p.color.g * 1.3;
        tint[v * 3 + 2] = p.color.b * 1.3;
        al[v] = life;
        sz[v] = p.size * 1.1;
        v++;
        // tail: continuous segments fading from head to nothing
        prev.copy(tmp);
        for (let j = 1; j <= TAIL_SEGS; j++) {
          const tt = k - (j / TAIL_SEGS) * TAIL_LEN;
          if (tt < 0) break;
          p.curve.getPoint(p.reverse ? 1 - tt : tt, tmp);
          const f0 = (1 - (j - 1) / TAIL_SEGS) ** 1.6 * life * 0.9;
          const f1 = (1 - j / TAIL_SEGS) ** 1.6 * life * 0.9;
          tp.set([prev.x, prev.y, prev.z, tmp.x, tmp.y, tmp.z], w * 3);
          tc.set([p.color.r * f0, p.color.g * f0, p.color.b * f0, p.color.r * f1, p.color.g * f1, p.color.b * f1], w * 3);
          w += 2;
          prev.copy(tmp);
        }
      }
      tailGeo.setDrawRange(0, w);
      tailGeo.attributes.position.needsUpdate = tailGeo.attributes.color.needsUpdate = true;
      parts.geometry.setDrawRange(0, v);
      pa.position.needsUpdate = pa.tint.needsUpdate = pa.alpha.needsUpdate = pa.size.needsUpdate = true;

      // dust drifts through a gentle 3D flow field
      if (!calm) {
        const dp = dust.geometry.attributes.position.array as Float32Array;
        const speed = (P.busy ? 1.2 : 0.3) * dt;
        for (let i = 0; i < DUST; i++) {
          const x = dp[i * 3];
          const y = dp[i * 3 + 1];
          const z = dp[i * 3 + 2];
          dp[i * 3] += Math.sin(y * 0.21 + t * 0.3) * speed - z * 0.02 * speed;
          dp[i * 3 + 1] += Math.cos(x * 0.17 + z * 0.11 + t * 0.2) * speed * 0.5;
          dp[i * 3 + 2] += Math.sin(x * 0.19 + t * 0.25) * speed + x * 0.02 * speed;
        }
        dust.geometry.attributes.position.needsUpdate = true;
      }

      if (!calm) for (const r of rings) r.rotation.z += dt * (r.userData.spin as number);

      // 3D pulses
      bursts = bursts.filter((b) => {
        const k = (now - b.t0) / b.dur;
        if (k < 0) return true;
        if (k >= 1) {
          scene.remove(b.mesh);
          b.mesh.material.dispose();
          return false;
        }
        const e = 1 - (1 - k) ** 3;
        b.mesh.scale.setScalar(0.05 + b.max * e);
        const a = b.peak * Math.min(1, k * 8) * (1 - k) ** 1.6;
        const m = b.mesh.material;
        if (m instanceof THREE.ShaderMaterial) m.uniforms.opacity.value = a;
        else m.opacity = a;
        return true;
      });

      bloom.strength = P.focus ? 0.35 : P.busy ? 0.75 : 0.6;
      composer.render();
      labels.render(scene, camera);
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      labels.domElement.removeEventListener("pointermove", onMove);
      labels.domElement.removeEventListener("pointerdown", onDown);
      labels.domElement.removeEventListener("pointerup", onUp);
      labels.domElement.removeEventListener("pointerleave", onLeave);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose?.();
      });
      disposables.forEach((d) => d.dispose());
      composer.dispose();
      renderer.dispose();
      host.replaceChildren();
      api.current = null;
    };
  }, []);

  return <div ref={hostRef} className="om3-host" />;
});

export default Graph3D;

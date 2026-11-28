/**
 * Procedural planet textures. Noise is sampled on the unit sphere (not the
 * flat UV rectangle), so the equirectangular map has no seam and no pole pinch.
 * Every call takes a seed, so no two planets look the same.
 */
import * as THREE from "three";

export type PlanetStyle = "terrestrial" | "gas" | "ice" | "storm" | "rock" | "moon";

/* ---------- 3D value noise + fbm ---------- */
function hash(x: number, y: number, z: number, s: number) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
const fade = (t: number) => t * t * (3 - 2 * t);
function noise(x: number, y: number, z: number, s: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz, s);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), xf), l(c(0, 1, 0), c(1, 1, 0), xf), yf),
    l(l(c(0, 0, 1), c(1, 0, 1), xf), l(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf,
  );
}
function fbm(x: number, y: number, z: number, s: number, oct = 5) {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) {
    v += a * noise(x * f, y * f, z * f, s + i * 17);
    f *= 2.03;
    a *= 0.5;
  }
  return v / (1 - 0.5 ** oct);
}

type RGB = [number, number, number];
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const smooth = (e0: number, e1: number, x: number) => fade(clamp01((x - e0) / (e1 - e0)));

/** Palette from the node colour: deep shadow, mid, highlight, plus an accent shifted in hue. */
function palette(base: THREE.Color) {
  const hsl = { h: 0, s: 0, l: 0 };
  base.getHSL(hsl);
  const c = (h: number, s: number, l: number): RGB => {
    const col = new THREE.Color().setHSL((h + 1) % 1, clamp01(s), clamp01(l));
    return [col.r, col.g, col.b];
  };
  return {
    deep: c(hsl.h, hsl.s * 0.9, hsl.l * 0.22),
    dark: c(hsl.h, hsl.s, hsl.l * 0.45),
    mid: c(hsl.h, hsl.s, hsl.l * 0.8),
    light: c(hsl.h, hsl.s * 0.7, Math.min(0.92, hsl.l * 1.12)),
    accent: c(hsl.h + 0.07, hsl.s * 1.2, hsl.l * 0.65),
    cool: c(hsl.h + 0.5, hsl.s * 0.35, hsl.l * 0.42),
  };
}

export function planetTexture(style: PlanetStyle, base: THREE.Color, seed: number) {
  const W = 256;
  const H = 128;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(W, H);
  const p = palette(base);
  const tilt = (hash(seed, 3, 7, 1) - 0.5) * 0.6;
  const craters = Array.from({ length: style === "rock" || style === "moon" ? 14 : 0 }, (_, i) => {
    const th = hash(seed, i, 1, 9) * Math.PI * 2;
    const ph = Math.acos(2 * hash(seed, i, 2, 9) - 1);
    return { x: Math.sin(ph) * Math.cos(th), y: Math.cos(ph), z: Math.sin(ph) * Math.sin(th), r: 0.08 + hash(seed, i, 3, 9) * 0.22 };
  });
  const spot = { x: Math.cos(seed), y: -0.25, z: Math.sin(seed) };

  for (let j = 0; j < H; j++) {
    const ph = (j / (H - 1)) * Math.PI;
    for (let i = 0; i < W; i++) {
      const th = (i / W) * Math.PI * 2;
      const x = Math.sin(ph) * Math.cos(th);
      const y = Math.cos(ph);
      const z = Math.sin(ph) * Math.sin(th);
      let col: RGB;

      if (style === "terrestrial") {
        const h = fbm(x * 1.8, y * 1.8, z * 1.8, seed);
        const land = smooth(0.5, 0.54, h);
        const sea = mix(p.cool, mix(p.cool, p.deep, 0.5), smooth(0.3, 0.5, h));
        const ground = mix(p.dark, p.light, smooth(0.54, 0.8, h));
        col = mix(sea, ground, land);
        const ice = smooth(0.78, 0.9, Math.abs(y) + (fbm(x * 4, y * 4, z * 4, seed + 5) - 0.5) * 0.2);
        col = mix(col, [0.93, 0.91, 0.86], ice);
        const cloud = smooth(0.55, 0.75, fbm(x * 3 + 9, y * 6, z * 3, seed + 99));
        col = mix(col, [0.95, 0.93, 0.89], cloud * 0.55);
      } else if (style === "gas" || style === "storm") {
        const lat = y + tilt * x;
        const warp = (fbm(x * 2.2, y * 2.2, z * 2.2, seed) - 0.5) * 0.35;
        const band = 0.5 + 0.5 * Math.sin((lat + warp) * 14 + seed);
        const fine = fbm(x * 6, lat * 30, z * 6, seed + 3);
        col = mix(p.dark, p.light, band * 0.8 + fine * 0.2);
        col = mix(col, p.accent, smooth(0.62, 0.8, fine) * 0.5);
        if (style === "storm") {
          const d = Math.hypot(x - spot.x, (y - spot.y) * 1.8, z - spot.z);
          const s = 1 - smooth(0.12, 0.3, d + (fbm(x * 8, y * 8, z * 8, seed + 4) - 0.5) * 0.08);
          col = mix(col, p.accent, s * 0.85);
          col = mix(col, p.light, (1 - smooth(0.0, 0.1, d)) * 0.6);
        }
      } else if (style === "ice") {
        const h = fbm(x * 2.5, y * 2.5, z * 2.5, seed);
        col = mix(p.light, [0.9, 0.9, 0.9], 0.45);
        col = mix(col, p.mid, smooth(0.45, 0.75, h) * 0.5);
        // cracks: thin valleys of a ridged noise
        const r = Math.abs(fbm(x * 5, y * 5, z * 5, seed + 21) - 0.5);
        col = mix(p.dark, col, smooth(0.004, 0.03, r));
      } else {
        // rock / moon: mottled regolith with craters
        const h = fbm(x * 3, y * 3, z * 3, seed);
        col = mix(p.deep, p.mid, h);
        col = mix(col, p.light, smooth(0.62, 0.85, fbm(x * 9, y * 9, z * 9, seed + 2)) * 0.35);
        for (const c of craters) {
          const d = Math.hypot(x - c.x, y - c.y, z - c.z) / c.r;
          if (d < 1.25) {
            const floor = 1 - smooth(0.7, 0.95, d);
            const rimEdge = smooth(0.8, 1.0, d) * (1 - smooth(1.0, 1.25, d));
            col = mix(col, p.deep, floor * 0.55);
            col = mix(col, p.light, rimEdge * 0.6);
          }
        }
      }
      const k = (j * W + i) * 4;
      img.data[k] = col[0] * 255;
      img.data[k + 1] = col[1] * 255;
      img.data[k + 2] = col[2] * 255;
      img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Planetary ring for RingGeometry's planar UVs: radial bands plus clumps and
 * gaps around the circumference, so the ring's own rotation is visible.
 */
export function ringTexture(base: THREE.Color, seed: number) {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const img = g.createImageData(S, S);
  const p = palette(base);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const dx = (x + 0.5) / (S / 2) - 1;
      const dy = (y + 0.5) / (S / 2) - 1;
      const t = Math.hypot(dx, dy);
      const k = (y * S + x) * 4;
      if (t < 0.6 || t > 1) continue;
      const ang = Math.atan2(dy, dx);
      const band = 0.25 + 0.75 * noise(t * 46, seed, 0.5, seed);
      const gap = smooth(0.78, 0.8, t) * (1 - smooth(0.82, 0.84, t)); // a Cassini-style division
      const clump = 0.55 + 0.45 * noise(Math.cos(ang) * 3 + t * 6, Math.sin(ang) * 3, seed, seed + 7);
      const edge = smooth(0.6, 0.66, t) * (1 - smooth(0.94, 1, t));
      const a = band * clump * edge * (1 - gap * 0.9);
      const col = mix(p.mid, p.light, noise(t * 30, 1, seed, 3));
      img.data[k] = col[0] * 255;
      img.data[k + 1] = col[1] * 255;
      img.data[k + 2] = col[2] * 255;
      img.data[k + 3] = clamp01(a) * 235;
    }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Fresnel rim, rendered on the back faces of a slightly larger sphere. */
export function atmosphereMaterial(color: THREE.Color) {
  return new THREE.ShaderMaterial({
    uniforms: { glowColor: { value: color.clone() }, strength: { value: 0.7 } },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 glowColor;
      uniform float strength;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float f = pow(1.0 - abs(dot(vN, vV)), 2.5);
        gl_FragColor = vec4(glowColor * f * strength, f * strength);
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

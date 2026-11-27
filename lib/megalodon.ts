import * as THREE from "three";

/**
 * A procedural megalodon, built entirely from code (no external model).
 * The swim wave runs in the vertex shader (GPU), so it stays smooth at 60 fps.
 * Local space: the shark faces +X, length L. The returned `root` faces +Z (use lookAt()).
 */

/** Procedural skin: mottled countershading, scars and fine dermal-denticle grain. */
function skinTextures() {
  const W = 1024;
  const H = 512;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d")!;
  const img = g.createImageData(W, H);
  const bump = document.createElement("canvas");
  bump.width = W;
  bump.height = H;
  const bg = bump.getContext("2d")!;
  const bimg = bg.createImageData(W, H);

  // value noise
  const P = 256;
  const perm = new Uint8Array(P * 2);
  for (let i = 0; i < P; i++) perm[i] = i;
  for (let i = P - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < P; i++) perm[i + P] = perm[i];
  const grad = (h: number) => (h / 255) * 2 - 1;
  const fade = (t: number) => t * t * (3 - 2 * t);
  const noise = (x: number, y: number) => {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const a = grad(perm[perm[xi] + yi]);
    const b = grad(perm[perm[xi + 1] + yi]);
    const c = grad(perm[perm[xi] + yi + 1]);
    const d = grad(perm[perm[xi + 1] + yi + 1]);
    const u = fade(xf);
    const v = fade(yf);
    return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
  };
  const fbm = (x: number, y: number) => noise(x, y) * 0.55 + noise(x * 2.1, y * 2.1) * 0.27 + noise(x * 4.3, y * 4.3) * 0.13 + noise(x * 9, y * 9) * 0.05;

  const back = [27, 34, 41];
  const flank = [50, 60, 70];
  const belly = [150, 156, 158];
  for (let y = 0; y < H; y++) {
    // v runs around the body: 0.25 = top (back), 0.75 = belly
    const v = y / H;
    const s = Math.sin(v * Math.PI * 2); // +1 back, -1 belly
    for (let x = 0; x < W; x++) {
      const u = x / W;
      const n = fbm(u * 18, v * 9);
      // wavy countershading line
      const line = s + n * 0.35 + Math.sin(u * 40) * 0.04;
      const k1 = Math.min(1, Math.max(0, (line + 0.15) / 0.25));
      const k2 = Math.min(1, Math.max(0, (line - 0.25) / 0.6));
      const c = [0, 1, 2].map((i) => belly[i] + (flank[i] - belly[i]) * k1);
      const cc = c.map((v0, i) => v0 + (back[i] - v0) * k2);
      const mott = 1 + fbm(u * 60 + 7, v * 30) * 0.22;
      const o = (y * W + x) * 4;
      img.data[o] = cc[0] * mott;
      img.data[o + 1] = cc[1] * mott;
      img.data[o + 2] = cc[2] * mott;
      img.data[o + 3] = 255;
      const grain = 128 + noise(u * 900, v * 450) * 40 + fbm(u * 50, v * 25) * 30;
      bimg.data[o] = bimg.data[o + 1] = bimg.data[o + 2] = grain;
      bimg.data[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  bg.putImageData(bimg, 0, 0);
  // scars: pale scratches on the flanks
  g.globalAlpha = 0.18;
  g.strokeStyle = "#c9d1d6";
  bg.strokeStyle = "#202020";
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * W * 0.8 + W * 0.1;
    const y = H * (Math.random() < 0.5 ? 0.05 + Math.random() * 0.3 : 0.45 + Math.random() * 0.25);
    const len = 20 + Math.random() * 90;
    const a = (Math.random() - 0.5) * 0.8;
    g.lineWidth = bg.lineWidth = 1 + Math.random() * 2;
    for (const ctx of [g, bg]) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + len * 0.5, y + Math.sin(a) * len * 0.5 + 6, x + Math.cos(a) * len, y + Math.sin(a) * len);
      ctx.stroke();
    }
  }
  // gill slits painted into the skin, on both flanks (v = 0/1 and v = 0.5 are the sides)
  for (let gi = 0; gi < 5; gi++) {
    const x = W * (0.19 + gi * 0.021);
    const half = H * (0.085 - gi * 0.006);
    for (const vc of [0, 0.5, 1]) {
      const y = H * vc;
      for (const [ctx, col, lw] of [
        [g, "rgba(8,10,13,0.9)", 3.2],
        [bg, "#000", 5],
      ] as const) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(x, y - half);
        ctx.quadraticCurveTo(x - 6, y, x + 2, y + half);
        ctx.stroke();
      }
    }
  }
  const map = new THREE.CanvasTexture(cv);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  const bumpMap = new THREE.CanvasTexture(bump);
  bumpMap.anisotropy = 4;
  return { map, bumpMap };
}

export function createMegalodon(L = 14) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.rotation.y = -Math.PI / 2; // local +X → +Z
  root.add(body);

  const R = L * 0.105;
  const SEG_U = 160;
  const SEG_V = 64;

  /** body radius along the length; u = 0 at the snout, 1 at the tail stock */
  const radius = (u: number) => {
    const s = Math.sin(Math.PI * Math.pow(Math.min(u, 0.999), 0.52));
    const stock = u > 0.76 ? 1 - Math.pow((u - 0.76) / 0.24, 1.4) * 0.8 : 1; // caudal peduncle
    return R * Math.pow(s, 1.1) * stock;
  };
  const xAt = (u: number) => L / 2 - u * L;
  const lift = (u: number) => Math.sin(u * Math.PI) * R * 0.14 - Math.pow(Math.max(0, 0.12 - u) / 0.12, 2) * R * 0.18;

  // Body: smooth parametric tube, conical snout slightly overhanging the jaw
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= SEG_U; i++) {
    const u = i / SEG_U;
    const r = radius(u);
    for (let j = 0; j <= SEG_V; j++) {
      const v = (j / SEG_V) * Math.PI * 2;
      const sv = Math.sin(v);
      const y = r * sv * (sv < 0 ? 0.76 : 1.04) + lift(u);
      const z = r * Math.cos(v) * (0.84 + 0.04 * sv);
      pos.push(xAt(u), y, z);
      uv.push(u, j / SEG_V);
    }
  }
  for (let i = 0; i < SEG_U; i++) {
    for (let j = 0; j < SEG_V; j++) {
      const a = i * (SEG_V + 1) + j;
      const b = a + SEG_V + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const bodyGeo = new THREE.BufferGeometry();
  bodyGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  bodyGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  bodyGeo.setIndex(idx);
  bodyGeo.computeVertexNormals();

  // GPU swim: the same wave used for fins on the CPU side
  const uniforms = {
    uPhase: { value: 0 },
    uAmp: { value: 0.6 },
    uLen: { value: L },
  };
  const swimChunk = /* glsl */ `
    float su = clamp((uLen * 0.5 - position.x) / uLen, 0.0, 1.0);
    float sw = uAmp * uLen * 0.06 * su * su;
    float sarg = su * 5.2 - uPhase;
    transformed.z += sw * sin(sarg);
  `;
  const normalChunk = /* glsl */ `
    float nu = clamp((uLen * 0.5 - position.x) / uLen, 0.0, 1.0);
    float dz = uAmp * 0.06 * (2.0 * nu * sin(nu * 5.2 - uPhase) + nu * nu * 5.2 * cos(nu * 5.2 - uPhase));
    float ang = atan(-dz);
    float ca = cos(ang), sa = sin(ang);
    objectNormal = vec3(ca * objectNormal.x - sa * objectNormal.z, objectNormal.y, sa * objectNormal.x + ca * objectNormal.z);
  `;
  const withSwim = (m: THREE.Material) => {
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uniforms);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uPhase;\nuniform float uAmp;\nuniform float uLen;")
        .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\n" + normalChunk)
        .replace("#include <begin_vertex>", "#include <begin_vertex>\n" + swimChunk);
    };
    return m;
  };

  const { map, bumpMap } = skinTextures();
  const skin = withSwim(
    new THREE.MeshPhysicalMaterial({
      map,
      bumpMap,
      bumpScale: 0.6,
      roughness: 0.48,
      metalness: 0.05,
      clearcoat: 0.35,
      clearcoatRoughness: 0.55,
      sheen: 0.4,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color("#5f7a8f"),
      envMapIntensity: 0.4,
    }),
  );
  body.add(new THREE.Mesh(bodyGeo, skin));

  // Fins: smooth curved outlines, bevelled, thin at the edge
  const finMat = new THREE.MeshPhysicalMaterial({
    color: "#1c2329",
    roughness: 0.55,
    clearcoat: 0.3,
    sheen: 0.3,
    sheenColor: new THREE.Color("#4c6274"),
    envMapIntensity: 0.4,
    side: THREE.DoubleSide,
  });
  const S = L / 14;
  const finFrom = (draw: (s: THREE.Shape) => void, depth: number) => {
    const s = new THREE.Shape();
    draw(s);
    const g = new THREE.ExtrudeGeometry(s, {
      depth,
      curveSegments: 28,
      bevelEnabled: true,
      bevelSize: depth * 0.45,
      bevelThickness: depth * 0.5,
      bevelSegments: 4,
    });
    g.translate(0, 0, -depth / 2);
    g.computeVertexNormals();
    return new THREE.Mesh(g, finMat);
  };
  const fins: { m: THREE.Object3D; u: number; baseZ: number }[] = [];
  const addFin = (m: THREE.Object3D, u: number, y: number, z: number) => {
    m.position.set(xAt(u), y, z);
    body.add(m);
    fins.push({ m, u, baseZ: z });
  };

  // first dorsal: tall, swept-back triangle with a concave trailing edge
  const dorsal = finFrom((s) => {
    s.moveTo(0.4 * S, -0.1 * S);
    s.bezierCurveTo(0.1 * S, 1.0 * S, -0.3 * S, 1.9 * S, -0.9 * S, 2.45 * S);
    s.quadraticCurveTo(-1.05 * S, 2.5 * S, -1.05 * S, 2.3 * S);
    s.bezierCurveTo(-1.0 * S, 1.4 * S, -1.3 * S, 0.6 * S, -2.0 * S, -0.1 * S);
    s.closePath();
  }, 0.09 * S);
  addFin(dorsal, 0.4, radius(0.4) * 1.0 + lift(0.4), 0);

  const dorsal2 = finFrom((s) => {
    s.moveTo(0.15 * S, -0.05 * S);
    s.quadraticCurveTo(-0.15 * S, 0.45 * S, -0.4 * S, 0.55 * S);
    s.quadraticCurveTo(-0.45 * S, 0.2 * S, -0.75 * S, -0.05 * S);
    s.closePath();
  }, 0.05 * S);
  addFin(dorsal2, 0.76, radius(0.76) * 0.98 + lift(0.76), 0);

  // pectorals: long, sickle-shaped, angled down and back
  for (const side of [1, -1]) {
    const p = finFrom((s) => {
      s.moveTo(0.2 * S, 0);
      s.bezierCurveTo(-0.4 * S, -0.3 * S, -1.6 * S, -0.9 * S, -2.7 * S, -1.25 * S);
      s.quadraticCurveTo(-2.85 * S, -1.25 * S, -2.7 * S, -1.05 * S);
      s.bezierCurveTo(-1.9 * S, -0.5 * S, -1.2 * S, -0.05 * S, -0.9 * S, 0.15 * S);
      s.closePath();
    }, 0.08 * S);
    p.rotation.x = side * 0.75;
    p.rotation.y = side * 0.2;
    addFin(p, 0.29, -radius(0.29) * 0.42 + lift(0.29), side * radius(0.29) * 0.62);
  }

  // pelvic + anal fins
  for (const side of [1, -1]) {
    const pv = finFrom((s) => {
      s.moveTo(0, 0);
      s.quadraticCurveTo(-0.4 * S, -0.45 * S, -0.75 * S, -0.55 * S);
      s.quadraticCurveTo(-0.6 * S, -0.1 * S, -0.8 * S, 0.05 * S);
      s.closePath();
    }, 0.05 * S);
    pv.rotation.x = side * 0.5;
    addFin(pv, 0.62, -radius(0.62) * 0.65 + lift(0.62), side * radius(0.62) * 0.4);
  }
  const anal = finFrom((s) => {
    s.moveTo(0.1 * S, 0);
    s.quadraticCurveTo(-0.2 * S, -0.4 * S, -0.45 * S, -0.5 * S);
    s.quadraticCurveTo(-0.45 * S, -0.15 * S, -0.7 * S, 0.02 * S);
    s.closePath();
  }, 0.05 * S);
  addFin(anal, 0.77, -radius(0.77) * 0.78 + lift(0.77), 0);

  // caudal keels (lateral ridges on the tail stock)
  for (const side of [1, -1]) {
    const keel = new THREE.Mesh(new THREE.CapsuleGeometry(0.06 * S, 0.9 * S, 6, 12), finMat);
    keel.rotation.z = Math.PI / 2;
    addFin(keel, 0.92, lift(0.92), side * radius(0.92) * 0.85);
  }

  // Lunate (crescent) tail, upper lobe slightly longer
  const tail = new THREE.Group();
  const tailFin = finFrom((s) => {
    s.moveTo(0.3 * S, 0.15 * S);
    s.bezierCurveTo(-0.4 * S, 1.0 * S, -1.3 * S, 2.1 * S, -2.3 * S, 3.0 * S);
    s.quadraticCurveTo(-2.5 * S, 3.05 * S, -2.4 * S, 2.8 * S);
    s.bezierCurveTo(-1.7 * S, 1.8 * S, -1.25 * S, 0.8 * S, -1.2 * S, 0.0 * S);
    s.bezierCurveTo(-1.25 * S, -0.7 * S, -1.6 * S, -1.5 * S, -2.05 * S, -2.3 * S);
    s.quadraticCurveTo(-2.15 * S, -2.45 * S, -1.9 * S, -2.35 * S);
    s.bezierCurveTo(-1.0 * S, -1.6 * S, -0.3 * S, -0.8 * S, 0.3 * S, -0.15 * S);
    s.closePath();
  }, 0.1 * S);
  tail.add(tailFin);
  body.add(tail);

  // Eyes: glossy black with a cold glint
  const eyeMat = new THREE.MeshPhysicalMaterial({ color: "#030303", roughness: 0.02, metalness: 0.2, clearcoat: 1, envMapIntensity: 1.5 });
  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.085 * S, 24, 16), eyeMat);
    eye.position.set(xAt(0.085), lift(0.085) + radius(0.085) * 0.22, side * radius(0.085) * 0.84);
    body.add(eye);
    fins.push({ m: eye, u: 0.085, baseZ: eye.position.z });
  }

  // Mouth: dark gape under the snout with rows of serrated teeth; the lower jaw drops when it lunges
  const jaw = new THREE.Group();
  jaw.position.set(xAt(0.1), lift(0.1) - radius(0.1) * 0.5, 0);
  body.add(jaw);
  const gape = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: "#1a0708", roughness: 0.6, side: THREE.DoubleSide }),
  );
  gape.scale.set(0.9 * S, 0.22 * S, 0.82 * S);
  gape.rotation.z = Math.PI;
  jaw.add(gape);
  const toothMat = new THREE.MeshPhysicalMaterial({ color: "#ebe4d2", roughness: 0.25, clearcoat: 0.6 });
  const toothShape = new THREE.Shape();
  toothShape.moveTo(-0.09 * S, 0);
  toothShape.quadraticCurveTo(-0.03 * S, 0.15 * S, 0, 0.34 * S);
  toothShape.quadraticCurveTo(0.03 * S, 0.15 * S, 0.09 * S, 0);
  toothShape.closePath();
  const toothGeo = new THREE.ExtrudeGeometry(toothShape, { depth: 0.025 * S, bevelEnabled: true, bevelSize: 0.012 * S, bevelThickness: 0.012 * S, bevelSegments: 2, curveSegments: 8 });
  const upper = new THREE.Group();
  const lower = new THREE.Group();
  for (let row = 0; row < 2; row++) {
    for (let k = 0; k < 17; k++) {
      const a = -Math.PI * 0.46 + (k / 16) * Math.PI * 0.92;
      const rr = 0.83 - row * 0.1;
      const x = Math.cos(a) * rr * S;
      const z = Math.sin(a) * rr * 0.97 * S;
      const size = (1 - Math.abs(k - 8) / 12) * (row ? 0.7 : 1);
      const t1 = new THREE.Mesh(toothGeo, toothMat);
      t1.position.set(x, -0.04 * S, z);
      t1.rotation.set(Math.PI, -a + Math.PI / 2, 0);
      t1.scale.setScalar(size);
      upper.add(t1);
      const t2 = new THREE.Mesh(toothGeo, toothMat);
      t2.position.set(x * 0.92, -0.24 * S, z * 0.92);
      t2.rotation.set(0, -a + Math.PI / 2, 0);
      t2.scale.setScalar(size * 0.85);
      lower.add(t2);
    }
  }
  jaw.add(upper, lower);

  const wave = (u: number, ph: number, amp: number) => amp * L * 0.06 * u * u * Math.sin(u * 5.2 - ph);
  const jawBaseZ = jaw.position.z;

  let phase = 0;
  let bite = 0;
  function update(dt: number, speed: number, targetBite: number) {
    phase += dt * (2.0 + speed * 2.2);
    const amp = 0.55 + speed * 0.55;
    uniforms.uPhase.value = phase;
    uniforms.uAmp.value = amp;
    for (const f of fins) f.m.position.z = f.baseZ + wave(f.u, phase, amp);
    jaw.position.z = jawBaseZ + wave(0.1, phase, amp);
    // tail rides the end of the wave and yaws with its slope
    const uT = 0.995;
    tail.position.set(xAt(uT) + 0.2 * S, lift(uT), wave(uT, phase, amp));
    const slope = (wave(uT, phase, amp) - wave(uT - 0.01, phase, amp)) / (0.01 * L);
    tail.rotation.y = -Math.atan(slope) * 1.5;
    // jaw eases open/closed (no snapping)
    bite += (targetBite - bite) * (1 - Math.pow(0.02, dt));
    lower.position.y = -bite * 0.85 * S;
    lower.rotation.z = bite * 0.35;
    gape.scale.y = (0.22 + bite * 0.75) * S;
  }

  function dispose() {
    root.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
    [skin, finMat, eyeMat, toothMat, gape.material as THREE.Material].forEach((m) => m.dispose());
    map.dispose();
    bumpMap.dispose();
  }

  return { root, update, dispose };
}

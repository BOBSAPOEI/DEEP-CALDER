import * as THREE from "three";

/**
 * A procedural megalodon, built entirely from code (no external model).
 * Local space: the shark faces +X, length ~L. `update(t, speed)` animates the swim.
 * The returned `root` faces +Z so it can be oriented with Object3D.lookAt().
 */
export function createMegalodon(L = 14) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.rotation.y = -Math.PI / 2; // local +X → +Z
  root.add(body);

  const R = L * 0.105;
  const SEG_U = 72;
  const SEG_V = 28;

  /** body radius along the length; u = 0 at the snout, 1 at the tail stock */
  const radius = (u: number) => {
    const s = Math.sin(Math.PI * Math.pow(Math.min(u, 0.999), 0.5));
    const stock = u > 0.78 ? 1 - (u - 0.78) * 2.2 : 1; // narrow caudal peduncle
    return R * Math.pow(s, 1.15) * Math.max(0.18, stock);
  };
  const xAt = (u: number) => L / 2 - u * L;

  // Body: parametric tube with a flattened belly and a slightly raised back
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const back = new THREE.Color("#1b2229");
  const flank = new THREE.Color("#343e48");
  const belly = new THREE.Color("#5e676e");
  const c = new THREE.Color();
  for (let i = 0; i <= SEG_U; i++) {
    const u = i / SEG_U;
    const r = radius(u);
    const lift = Math.sin(u * Math.PI) * R * 0.12; // humped back
    for (let j = 0; j <= SEG_V; j++) {
      const v = (j / SEG_V) * Math.PI * 2;
      const sv = Math.sin(v);
      const y = r * sv * (sv < 0 ? 0.78 : 1.05) + lift;
      const z = r * Math.cos(v) * 0.86;
      pos.push(xAt(u), y, z);
      // countershading: dark back, pale belly, sharp-ish line on the flanks
      const k = THREE.MathUtils.smoothstep(sv, -0.35, 0.05);
      c.copy(belly).lerp(flank, k).lerp(back, THREE.MathUtils.smoothstep(sv, 0.2, 0.9));
      // scars / mottling
      const n = Math.sin(u * 91.7 + v * 13.1) * Math.sin(u * 37.3 - v * 7.7);
      c.multiplyScalar(0.92 + n * 0.08);
      col.push(c.r, c.g, c.b);
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
  bodyGeo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  bodyGeo.setIndex(idx);
  bodyGeo.computeVertexNormals();
  const base = (bodyGeo.attributes.position.array as Float32Array).slice();

  const skin = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.55,
    metalness: 0.12,
    envMapIntensity: 0.35,
  });
  const finMat = new THREE.MeshStandardMaterial({ envMapIntensity: 0.35, color: "#1a2128", roughness: 0.7, metalness: 0.05, side: THREE.DoubleSide });
  const bodyMesh = new THREE.Mesh(bodyGeo, skin);
  body.add(bodyMesh);

  // Fins (thin extrusions), each tagged with the body station `u` it hangs from
  const fin = (pts: [number, number][], depth = 0.08) => {
    const s = new THREE.Shape();
    s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 });
    g.translate(0, 0, -depth / 2);
    return new THREE.Mesh(g, finMat);
  };
  const S = L / 14;
  const fins: { m: THREE.Object3D; u: number; baseY: number; baseZ: number }[] = [];
  const addFin = (m: THREE.Object3D, u: number, y: number, z: number) => {
    m.position.set(xAt(u), y, z);
    body.add(m);
    fins.push({ m, u, baseY: y, baseZ: z });
  };

  const dorsal = fin([[0, 0], [-2.2 * S, 0], [-1.7 * S, 0.5 * S], [-0.6 * S, 2.4 * S], [0.1 * S, 0.35 * S]]);
  addFin(dorsal, 0.4, radius(0.4) * 1.05 + R * 0.1, 0);

  const dorsal2 = fin([[0, 0], [-0.7 * S, 0], [-0.35 * S, 0.55 * S]], 0.05);
  addFin(dorsal2, 0.76, radius(0.76) * 1.0, 0);

  for (const side of [1, -1]) {
    const p = fin([[0, 0], [-1.0 * S, 0], [-2.6 * S, -0.25 * S], [-0.4 * S, 0.1 * S]], 0.07);
    p.rotation.x = side * 0.55;
    p.rotation.y = side * 0.25;
    addFin(p, 0.3, -radius(0.3) * 0.45, side * radius(0.3) * 0.7);
  }

  const anal = fin([[0, 0], [-0.7 * S, 0], [-0.3 * S, -0.5 * S]], 0.05);
  addFin(anal, 0.74, -radius(0.74) * 0.8, 0);

  // Heterocercal tail: tall upper lobe, shorter lower lobe
  const tail = new THREE.Group();
  const tailFin = fin(
    [
      [0, 0],
      [-0.9 * S, 1.2 * S],
      [-2.6 * S, 3.0 * S],
      [-2.2 * S, 1.4 * S],
      [-1.4 * S, 0.1 * S],
      [-2.0 * S, -1.7 * S],
      [-0.5 * S, -0.5 * S],
    ],
    0.08,
  );
  tail.add(tailFin);
  body.add(tail);

  // Gill slits
  const gillMat = new THREE.MeshBasicMaterial({ color: "#0b0f14" });
  for (let g = 0; g < 5; g++) {
    const u = 0.2 + g * 0.022;
    for (const side of [1, -1]) {
      const slit = new THREE.Mesh(new THREE.PlaneGeometry(0.05 * S, radius(u) * 0.9), gillMat);
      slit.position.set(xAt(u), radius(u) * 0.05, side * radius(u) * 0.87);
      slit.rotation.z = 0.12;
      body.add(slit);
    }
  }

  // Eyes: black, faintly reflective
  const eyeMat = new THREE.MeshStandardMaterial({ color: "#050505", roughness: 0.05, metalness: 0.9, emissive: "#1a0000", emissiveIntensity: 0.6 });
  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09 * S, 12, 10), eyeMat);
    eye.position.set(xAt(0.09), radius(0.09) * 0.22, side * radius(0.09) * 0.86);
    body.add(eye);
  }

  // Mouth: a dark gape under the snout, lined with serrated triangular teeth
  const jaw = new THREE.Group();
  jaw.position.set(xAt(0.1), -radius(0.1) * 0.55, 0);
  body.add(jaw);
  const gape = new THREE.Mesh(
    new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: "#120607", side: THREE.DoubleSide }),
  );
  gape.scale.set(0.9 * S, 0.25 * S, 0.85 * S);
  gape.rotation.z = Math.PI;
  jaw.add(gape);
  const toothMat = new THREE.MeshStandardMaterial({ color: "#e9e2cf", roughness: 0.35 });
  const toothGeo = new THREE.ConeGeometry(0.06 * S, 0.3 * S, 4);
  const upper = new THREE.Group();
  const lower = new THREE.Group();
  for (let k = 0; k < 15; k++) {
    const a = -Math.PI * 0.45 + (k / 14) * Math.PI * 0.9;
    const x = Math.cos(a) * 0.82 * S;
    const z = Math.sin(a) * 0.8 * S;
    const t1 = new THREE.Mesh(toothGeo, toothMat);
    t1.position.set(x, -0.08 * S, z);
    t1.rotation.x = Math.PI; // points down
    upper.add(t1);
    const t2 = new THREE.Mesh(toothGeo, toothMat);
    t2.position.set(x * 0.9, -0.2 * S, z * 0.9);
    t2.scale.setScalar(0.8);
    lower.add(t2);
  }
  jaw.add(upper, lower);

  // Swim animation (CPU deformation of the body + fins following the wave)
  const posAttr = bodyGeo.attributes.position as THREE.BufferAttribute;
  const arr = posAttr.array as Float32Array;
  const wave = (u: number, t: number, amp: number) => amp * L * 0.06 * u * u * Math.sin(u * 5.2 - t);

  let phase = 0;
  function update(dt: number, speed: number, bite: number) {
    phase += dt * (2.2 + speed * 2.5);
    const amp = 0.55 + speed * 0.6;
    for (let i = 0; i < arr.length; i += 3) {
      const u = (L / 2 - base[i]) / L;
      arr[i + 2] = base[i + 2] + wave(u, phase, amp);
    }
    posAttr.needsUpdate = true;
    bodyGeo.computeVertexNormals();
    for (const f of fins) f.m.position.z = f.baseZ + wave(f.u, phase, amp);
    // tail rides the end of the wave and yaws with its slope
    const uT = 0.995;
    tail.position.set(xAt(uT) + 0.15 * S, R * 0.05, wave(uT, phase, amp));
    const slope = (wave(uT, phase, amp) - wave(uT - 0.02, phase, amp)) / (0.02 * L);
    tail.rotation.y = -Math.atan(slope) * 1.6;
    // jaw opens when it lunges toward the viewer
    lower.position.y = -bite * 0.9 * S;
    lower.rotation.z = bite * 0.35;
    gape.scale.y = (0.25 + bite * 0.7) * S;
  }

  function dispose() {
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
    });
    [skin, finMat, gillMat, eyeMat, toothMat].forEach((m) => m.dispose());
  }

  return { root, update, dispose };
}

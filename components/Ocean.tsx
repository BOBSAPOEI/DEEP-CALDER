"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createMegalodon } from "@/lib/megalodon";
import { abyss } from "@/lib/abyssState";
import { WORLD, camYAt, depthAt, smooth } from "@/lib/dive";

/**
 * The dive: a fixed WebGL layer driven by the dive timeline (lib/dive.ts).
 *  - sunlight zone: sun shafts, navy water, big ice crystals with a glowing core drifting past
 *  - the plunge to the abyss: water turns black, marine snow turns bioluminescent
 *  - abyss: the megalodon circles the camera and sweeps close past it
 */
const COLUMN = 200; // world units of marine snow below the surface

const SEA = [
  { at: 0, top: [0x12, 0x20, 0x3a], bot: [0x05, 0x0b, 0x18] },
  { at: 180, top: [0x0b, 0x15, 0x29], bot: [0x03, 0x07, 0x10] },
  { at: 1500, top: [0x03, 0x08, 0x0a], bot: [0x01, 0x03, 0x04] },
  { at: 4800, top: [0x02, 0x06, 0x06], bot: [0x00, 0x01, 0x01] },
];
function seaAt(m: number) {
  let i = 0;
  while (i < SEA.length - 2 && m > SEA[i + 1].at) i++;
  const a = SEA[i];
  const b = SEA[i + 1];
  const t = Math.min(1, Math.max(0, (m - a.at) / (b.at - a.at)));
  const mix = (x: number[], y: number[]) => `rgb(${x.map((v, k) => Math.round(v + (y[k] - v) * t)).join(",")})`;
  return [mix(a.top, b.top), mix(a.bot, b.bot)];
}

const snowVert = /* glsl */ `
  uniform float uTime;
  uniform float uPixel;
  attribute float aSize;
  attribute float aSeed;
  varying float vAlpha;
  varying float vDeep;
  varying float vSeed;
  void main() {
    vSeed = aSeed;
    vec3 p = position;
    p.x += sin(uTime * 0.15 + aSeed * 6.28) * 0.6;
    p.y -= mod(uTime * (0.05 + aSeed * 0.12), 4.0);
    p.z += cos(uTime * 0.12 + aSeed * 3.1) * 0.4;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixel * (24.0 / -mv.z);
    vAlpha = 0.35 + 0.65 * abs(sin(uTime * (0.6 + aSeed) + aSeed * 10.0));
    vDeep = clamp(-position.y / ${COLUMN.toFixed(1)}, 0.0, 1.0);
  }
`;
const snowFrag = /* glsl */ `
  varying float vAlpha;
  varying float vDeep;
  varying float vSeed;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    vec3 surface = vec3(0.86, 0.92, 1.0);
    vec3 glow = vSeed < 0.6 ? vec3(0.0, 0.94, 1.0) : (vSeed < 0.85 ? vec3(0.94, 0.24, 0.71) : vec3(0.78, 1.0, 0.24));
    vec3 col = mix(surface, glow, smoothstep(0.55, 0.85, vDeep));
    gl_FragColor = vec4(col, a * vAlpha * 0.85);
  }
`;

const rayVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const rayFrag = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uSeed;
  varying vec2 vUv;
  void main() {
    float edge = smoothstep(0.0, 0.5, vUv.x) * smoothstep(1.0, 0.5, vUv.x);
    float fall = smoothstep(0.0, 0.85, vUv.y);
    float flicker = 0.7 + 0.3 * sin(uTime * 0.4 + uSeed * 9.0 + vUv.y * 3.0);
    gl_FragColor = vec4(vec3(0.62, 0.75, 1.0), edge * fall * flicker * uOpacity);
  }
`;

/** Faceted ice: a low-poly sphere with per-vertex jitter, stretched along one axis. */
function crystalGeometry(r: number, seed: number, stretch: number) {
  const g = new THREE.IcosahedronGeometry(r, 1);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const map = new Map<string, number>();
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    let k = map.get(key);
    if (k === undefined) {
      k = 0.78 + rnd() * 0.42;
      map.set(key, k);
    }
    pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k * stretch, pos.getZ(i) * k);
  }
  g.computeVertexNormals();
  return g;
}

/** Soft white "cloud" caught inside the ice. */
function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,0.95)");
  grd.addColorStop(0.35, "rgba(225,235,255,0.55)");
  grd.addColorStop(1, "rgba(200,220,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function Ocean() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const sea = seaRef.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 700;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      return; // no WebGL: the CSS water stays
    }
    const dpr = Math.min(window.devicePixelRatio, mobile ? 1.5 : 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const fog = new THREE.FogExp2(0x02050c, 0.02);
    scene.fog = fog;
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 260);
    camera.position.set(0, 0, 14);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;

    const ambient = new THREE.AmbientLight(0x6f8fb8, 0.6);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xdfeaff, 2.6);
    sun.position.set(-4, 12, 6);
    scene.add(sun);
    const rim = new THREE.PointLight(0x00f0ff, 30, 34);
    scene.add(rim);
    const torch = new THREE.PointLight(0xbcd6ff, 0, 90, 1.1);
    scene.add(torch);
    // cold light from above for the abyss, so the megalodon reads as a silhouette with lit flanks
    const deep = new THREE.DirectionalLight(0x8fb4d8, 0);
    deep.position.set(-6, 20, 10);
    scene.add(deep);
    scene.add(deep.target);
    const sharkLight = new THREE.PointLight(0x9fc4ff, 0, 45, 1.4);
    scene.add(sharkLight);

    // Marine snow
    const COUNT = mobile ? 1800 : 3600;
    const pos = new Float32Array(COUNT * 3);
    const size = new Float32Array(COUNT);
    const seed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = 8 - Math.random() * (COLUMN + 10);
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30 - 4;
      size[i] = Math.random() < 0.06 ? 3 + Math.random() * 3 : 0.6 + Math.random() * 1.4;
      seed[i] = Math.random();
    }
    const snowGeo = new THREE.BufferGeometry();
    snowGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    snowGeo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    snowGeo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const snowMat = new THREE.ShaderMaterial({
      vertexShader: snowVert,
      fragmentShader: snowFrag,
      uniforms: { uTime: { value: 0 }, uPixel: { value: dpr } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Points(snowGeo, snowMat));

    // Sun shafts (sunlight zone)
    const rays: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
    for (let i = 0; i < 8; i++) {
      const m = new THREE.ShaderMaterial({
        vertexShader: rayVert,
        fragmentShader: rayFrag,
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.1 }, uSeed: { value: Math.random() } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const r = new THREE.Mesh(new THREE.PlaneGeometry(1.6 + Math.random() * 2.8, 40), m);
      r.position.set(-16 + i * 4.6 + Math.random() * 2, 4, -8 - Math.random() * 6);
      r.rotation.z = 0.42 + Math.random() * 0.08;
      rays.push(r);
      scene.add(r);
    }

    // Ice crystals: the hero one in front of the wordmark, then a field of them down the sunlight zone
    const glow = glowTexture();
    const iceMat = new THREE.MeshPhysicalMaterial({
      color: 0x4e6584,
      metalness: 0.2,
      roughness: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      iridescence: 0.35,
      iridescenceIOR: 1.35,
      flatShading: true,
      envMapIntensity: 1.1,
      transparent: true,
      opacity: 0.74,
      depthWrite: false,
    });
    const darkIceMat = iceMat.clone();
    darkIceMat.color.set(0x1a2333);
    darkIceMat.opacity = 0.92;
    darkIceMat.envMapIntensity = 0.9;
    darkIceMat.depthWrite = true;
    type Ice = { g: THREE.Group; spin: THREE.Vector3; baseY: number; bob: number };
    const ices: Ice[] = [];
    const ICE = [
      // x, y, z, radius, stretch, glowing core?
      [0.6, -0.4, 3, 1.5, 1.35, 1],
      [6.5, 3.4, -3, 0.6, 1.2, 0],
      [-1.5, -9, 1, 1.9, 1.3, 1],
      [5.5, -11, -4, 0.8, 1.1, 0],
      [3.2, -18, 3.5, 2.6, 0.75, 1],
      [-6, -23, -3, 1.2, 1.2, 0],
      [-0.5, -30, 2, 2.4, 1.1, 0],
      [4.5, -36, 0, 1.8, 1.35, 1],
      [-4.5, -42, 3, 2.2, 0.9, 0],
      [2, -49, -1, 2.8, 1.2, 1],
      [-3, -56, 4, 2.0, 1.25, 0],
      [5, -61, -3, 1.4, 1.1, 1],
    ];
    ICE.forEach(([x, y, z, r, st, core], i) => {
      const grp = new THREE.Group();
      const mesh = new THREE.Mesh(crystalGeometry(r, 11 + i * 17, st), core ? iceMat : darkIceMat);
      grp.add(mesh);
      if (core) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 }));
        sp.scale.set(r * 0.95, r * 1.15 * st, 1);
        grp.add(sp);
      }
      grp.position.set(mobile ? x * 0.55 : x, y, z);
      scene.add(grp);
      ices.push({
        g: grp,
        spin: new THREE.Vector3((Math.random() - 0.5) * 0.25, 0.1 + Math.random() * 0.2, (Math.random() - 0.5) * 0.15),
        baseY: y,
        bob: Math.random() * 6,
      });
    });

    // The megalodon — big, circling in the abyss
    const SHARK_L = mobile ? 19 : 27;
    const shark = createMegalodon(SHARK_L);
    scene.add(shark.root);
    let sharkY = WORLD.abyssTop - 45; // waits below, rises into view on the plunge
    let theta = Math.PI * 0.85;
    const ahead = new THREE.Vector3();
    const RX = mobile ? 14 : 24;
    const RZ = mobile ? 20 : 26;
    const CZ = mobile ? -21 : -31; // nearest pass ≈ 18 units from the lens: huge, but never blurry // near edge of the loop passes in front of the camera

    // State
    let current = 0;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const progress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    const onMove = (e: PointerEvent) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w < 700 ? 62 : 45;
      camera.updateProjectionMatrix();
    };
    resize();
    current = progress();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });

    const clock = new THREE.Clock();
    let raf = 0;
    let visible = true;
    const onVis = () => {
      visible = !document.hidden;
      if (visible) {
        clock.getDelta();
        loop();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    const loop = () => {
      if (!visible) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime * (reduced ? 0.2 : 1);
      // Lenis already smooths the scroll; follow it closely
      current += (progress() - current) * (1 - Math.pow(0.00002, dt));
      mouse.x += (mouse.tx - mouse.x) * dt * 2;
      mouse.y += (mouse.ty - mouse.y) * dt * 2;

      const p = current;
      const m = depthAt(p);
      const camY = camYAt(p);
      camera.position.set(mouse.x * 0.7, camY, 14);
      camera.lookAt(mouse.x * 0.2, camY - mouse.y * 0.3, 0);

      // light: sunlit near the top, dark below
      const sunny = 1 - smooth(-40, -110, camY); // 1 in the sunlight zone → 0 in the abyss
      snowMat.uniforms.uTime.value = t;
      for (const r of rays) {
        r.material.uniforms.uTime.value = t;
        r.material.uniforms.uOpacity.value = 0.13 * sunny;
        r.position.y = camY + 6;
        r.visible = sunny > 0.01;
      }
      sun.intensity = 2.6 * Math.max(0.12, sunny);
      ambient.intensity = 0.25 + 0.45 * sunny;
      fog.color.setRGB(0.01 * sunny + 0.002, 0.03 * sunny + 0.012 * (1 - sunny), 0.06 * sunny + 0.012 * (1 - sunny));
      fog.density = 0.02 - (1 - sunny) * 0.009;

      // ice
      for (const ice of ices) {
        const near = Math.abs(ice.g.position.y - camY) < 40;
        ice.g.visible = near;
        if (!near) continue;
        ice.g.children[0].rotation.x += ice.spin.x * dt;
        ice.g.children[0].rotation.y += ice.spin.y * dt + mouse.x * 0.002;
        ice.g.children[0].rotation.z += ice.spin.z * dt;
        ice.g.position.y = ice.baseY + Math.sin(t * 0.5 + ice.bob) * 0.25;
      }

      // megalodon: follows the camera once it is in the abyss
      const zoneY = Math.min(WORLD.abyssTop + 4, Math.max(WORLD.floor, camY));
      const finaleOn = camY < WORLD.abyssBottom - 1; // at the finale it dives away, out of the call to action
      const target = camY > WORLD.chaptersEnd - 20 ? WORLD.abyssTop - 45 : finaleOn ? camY - 60 : zoneY - 2;
      sharkY += (target - sharkY) * (1 - Math.pow(0.15, dt));
      theta += dt * (0.3 + abyss.threat * 0.12) * (reduced ? 0.4 : 1);
      const sx = Math.cos(theta) * RX;
      const sz = CZ + Math.sin(theta) * RZ;
      const sy = sharkY + Math.sin(theta * 2) * 3;
      shark.root.position.set(sx, sy, sz);
      ahead.set(-Math.sin(theta) * RX, Math.cos(theta * 2) * 6 * 0.5, Math.cos(theta) * RZ).normalize();
      shark.root.lookAt(ahead.add(shark.root.position));
      shark.root.rotateZ(-Math.cos(theta) * 0.22);
      const dist = shark.root.position.distanceTo(camera.position);
      const threat = THREE.MathUtils.clamp(1 - (dist - SHARK_L * 0.45) / (SHARK_L * 0.9), 0, 1);
      shark.update(dt, threat);
      abyss.depth = Math.min(1, m / 4800);
      abyss.threat = threat;

      deep.intensity = (1 - sunny) * 1.8;
      deep.position.set(-6, camY + 20, 10);
      deep.target.position.set(0, camY, -10);
      sharkLight.position.set(sx, sy + SHARK_L * 0.35, sz + 6);
      sharkLight.intensity = (1 - sunny) * 42;
      torch.position.copy(camera.position);
      torch.intensity = (1 - sunny) * 14 * (1 - threat * 0.4);
      rim.position.set(6, camY - 2, 6);
      rim.intensity = 30 * (1 - threat * 0.8);
      ambient.intensity *= 1 - threat * 0.4;
      if (threat > 0.5 && !reduced) {
        const k = (threat - 0.5) * 0.2;
        camera.position.x += (Math.random() - 0.5) * k;
        camera.position.y += (Math.random() - 0.5) * k;
      }

      // drive the CSS horror layer (vignette, grain, red pulse)
      const rootStyle = document.documentElement.style;
      rootStyle.setProperty("--deep", (1 - sunny).toFixed(3));
      rootStyle.setProperty("--threat", threat.toFixed(3));

      const [top, bot] = seaAt(m);
      sea.style.background = `linear-gradient(180deg, ${top} 0%, ${bot} 100%)`;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      shark.dispose();
      abyss.depth = 0;
      abyss.threat = 0;
      document.documentElement.style.removeProperty("--deep");
      document.documentElement.style.removeProperty("--threat");
      scene.traverse((o) => {
        const mm = o as THREE.Mesh;
        mm.geometry?.dispose();
        const mat = mm.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      glow.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <div ref={seaRef} className="sea" aria-hidden="true" />
      <canvas ref={canvasRef} className="webgl" aria-hidden="true" />
    </>
  );
}

"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createMegalodon } from "@/lib/megalodon";
import { abyss } from "@/lib/abyssState";

/**
 * The dive: a fixed WebGL layer. Scroll progress moves the camera down a column of
 * "marine snow"; sun shafts fade out, the water darkens toward the abyss and the
 * particles turn bioluminescent. A faceted crystal floats in front of the hero wordmark.
 */
const DEPTH = 220; // world units from surface to the bottom of the column

const SEA = [
  { at: 0, top: [0x0e, 0x1a, 0x31], bot: [0x03, 0x07, 0x12] },
  { at: 0.25, top: [0x05, 0x0b, 0x18], bot: [0x01, 0x03, 0x08] },
  { at: 1, top: [0x02, 0x04, 0x08], bot: [0x00, 0x01, 0x03] },
];

function seaAt(p: number) {
  let a = SEA[0];
  let b = SEA[SEA.length - 1];
  for (let i = 0; i < SEA.length - 1; i++) {
    if (p >= SEA[i].at && p <= SEA[i + 1].at) {
      a = SEA[i];
      b = SEA[i + 1];
      break;
    }
  }
  const t = (p - a.at) / Math.max(1e-6, b.at - a.at);
  const mix = (x: number[], y: number[]) => `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",")})`;
  return [mix(a.top, b.top), mix(a.bot, b.bot)];
}

const snowVert = /* glsl */ `
  uniform float uTime;
  uniform float uPixel;
  attribute float aSize;
  attribute float aSeed;
  varying float vAlpha;
  varying float vDeep;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.15 + aSeed * 6.28) * 0.6;
    p.y -= mod(uTime * (0.05 + aSeed * 0.12), 4.0);
    p.z += cos(uTime * 0.12 + aSeed * 3.1) * 0.4;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixel * (24.0 / -mv.z);
    vAlpha = 0.35 + 0.65 * abs(sin(uTime * (0.6 + aSeed) + aSeed * 10.0));
    vDeep = clamp(-position.y / ${DEPTH.toFixed(1)}, 0.0, 1.0);
  }
`;

const snowFrag = /* glsl */ `
  varying float vAlpha;
  varying float vDeep;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    vec3 surface = vec3(0.86, 0.92, 1.0);
    vec3 glow = vec3(0.50, 0.84, 0.75);
    vec3 col = mix(surface, glow, smoothstep(0.45, 0.9, vDeep));
    gl_FragColor = vec4(col, a * vAlpha * 0.85);
  }
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

const rayVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

function rockGeometry(radius: number, detail: number, jitter: number, seed: number) {
  const g = new THREE.IcosahedronGeometry(radius, detail);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const map = new Map<string, number>();
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    let k = map.get(key);
    if (k === undefined) {
      k = 1 + (rnd() - 0.5) * jitter;
      map.set(key, k);
    }
    pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k * 1.15, pos.getZ(i) * k);
  }
  g.computeVertexNormals();
  return g;
}

export function Ocean() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const sea = seaRef.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(pointer: coarse)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      return; // no WebGL: the CSS water stays
    }
    const dpr = Math.min(window.devicePixelRatio, mobile ? 1.5 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02050c, 0.018);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    camera.position.set(0, 0, 14);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;

    const ambient = new THREE.AmbientLight(0x6f8fb8, 0.6);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xdfeaff, 2.4);
    sun.position.set(-4, 12, 6);
    scene.add(sun);
    const rim = new THREE.PointLight(0x7fd6c0, 30, 30);
    rim.position.set(4, -2, 4);
    scene.add(rim);

    // Marine snow
    const COUNT = mobile ? 1600 : 3200;
    const pos = new Float32Array(COUNT * 3);
    const size = new Float32Array(COUNT);
    const seed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = 8 - Math.random() * (DEPTH + 20);
      pos[i * 3 + 2] = (Math.random() - 0.5) * 24 - 2;
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

    // Sun shafts near the surface
    const rays: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
    for (let i = 0; i < 7; i++) {
      const m = new THREE.ShaderMaterial({
        vertexShader: rayVert,
        fragmentShader: rayFrag,
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.1 }, uSeed: { value: Math.random() } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const r = new THREE.Mesh(new THREE.PlaneGeometry(1.6 + Math.random() * 2.5, 34), m);
      r.position.set(-14 + i * 4.5 + Math.random() * 2, 4, -6 - Math.random() * 6);
      r.rotation.z = 0.42 + Math.random() * 0.08;
      rays.push(r);
      scene.add(r);
    }

    // Hero crystal
    const crystal = new THREE.Mesh(
      rockGeometry(1.45, 1, 0.32, 11),
      new THREE.MeshPhysicalMaterial({
        color: 0xb8cce6,
        metalness: 0.15,
        roughness: 0.22,
        transmission: 0.35,
        thickness: 2.2,
        ior: 1.6,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        iridescence: 0.25,
        flatShading: true,
        envMapIntensity: 2.2,
        transparent: true,
        opacity: 0.72,
      }),
    );
    crystal.position.set(0.2, -0.4, 3);
    crystal.scale.set(1, 1.25, 1);
    scene.add(crystal);

    // Drifting rocks along the dive
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x1b2433, roughness: 0.55, metalness: 0.4, flatShading: true });
    const rocks: { m: THREE.Mesh; spin: number }[] = [];
    const rockSpots = [
      [6.5, 3.2, -1, 0.55],
      [10.5, 4.2, -4, 0.3],
      [3.5, -22, -2, 1.1],
      [-6, -40, -3, 0.8],
      [5, -70, -2, 0.9],
      [-4, -110, -4, 1.2],
      [6, -150, -3, 0.7],
    ];
    rockSpots.forEach(([x, y, z, s], i) => {
      const m = new THREE.Mesh(rockGeometry(s, 1, 0.5, 31 + i * 13), rockMat);
      m.position.set(x, y, z);
      scene.add(m);
      rocks.push({ m, spin: 0.1 + Math.random() * 0.2 });
    });

    // The megalodon: circles in the midnight zone, sweeping close past the viewer
    const shark = createMegalodon(mobile ? 11 : 15);
    scene.add(shark.root);
    const ZONE_TOP = -0.34 * DEPTH;
    const ZONE_BOT = -0.9 * DEPTH;
    let sharkY = ZONE_TOP - 30;
    let theta = Math.PI; // start far behind, on the left
    const ahead = new THREE.Vector3();
    // a cold "diver's torch" so the shark reads in the dark
    const torch = new THREE.PointLight(0xbcd6ff, 0, 60, 1.2);
    scene.add(torch);

    // State
    let target = 0;
    let current = 0;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const readScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      target = max > 0 ? window.scrollY / max : 0;
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
      camera.fov = w < 700 ? 60 : 45;
      camera.updateProjectionMatrix();
      const k = w < 700 ? 0.7 : 1;
      crystal.scale.set(k, k * 1.25, k);
      readScroll();
    };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });

    const clock = new THREE.Clock();
    let raf = 0;
    let visible = true;
    const onVis = () => {
      visible = !document.hidden;
      if (visible) loop();
    };
    document.addEventListener("visibilitychange", onVis);

    const loop = () => {
      if (!visible) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime * (reduced ? 0.2 : 1);
      current += (target - current) * (1 - Math.pow(0.001, dt));
      mouse.x += (mouse.tx - mouse.x) * dt * 2;
      mouse.y += (mouse.ty - mouse.y) * dt * 2;

      const p = current;
      camera.position.y = -p * DEPTH;
      camera.position.x = mouse.x * 0.6;
      camera.lookAt(mouse.x * 0.2, camera.position.y - mouse.y * 0.3, 0);

      snowMat.uniforms.uTime.value = t;
      const rayOp = Math.max(0, 1 - p * 6) * 0.11;
      for (const r of rays) {
        r.material.uniforms.uTime.value = t;
        r.material.uniforms.uOpacity.value = rayOp;
        r.position.y = camera.position.y * 0.85 + 4;
      }
      crystal.rotation.y = t * 0.18 + mouse.x * 0.4;
      crystal.rotation.x = Math.sin(t * 0.3) * 0.25 + mouse.y * 0.2;
      crystal.position.y = -0.4 + Math.sin(t * 0.6) * 0.15;
      for (const r of rocks) {
        r.m.rotation.x += r.spin * dt;
        r.m.rotation.y += r.spin * 0.7 * dt;
      }
      // Megalodon path: an ellipse whose near edge passes ~8 units in front of the camera
      const zoneY = Math.min(ZONE_TOP, Math.max(ZONE_BOT, camera.position.y));
      sharkY += (zoneY - 1.5 - sharkY) * (1 - Math.pow(0.2, dt));
      const prox0 = abyss.threat;
      theta += dt * (0.32 + prox0 * 0.25) * (reduced ? 0.4 : 1);
      const sx = Math.cos(theta) * 26;
      const sz = -12 + Math.sin(theta) * 17;
      const sy = sharkY + Math.sin(theta * 2) * 2.5;
      shark.root.position.set(sx, sy, sz);
      ahead.set(-Math.sin(theta) * 26, Math.cos(theta * 2) * 5, Math.cos(theta) * 17).normalize();
      shark.root.lookAt(ahead.add(shark.root.position));
      shark.root.rotateZ(-Math.cos(theta) * 0.25); // bank into the turn
      const dist = shark.root.position.distanceTo(camera.position);
      const threat = THREE.MathUtils.clamp(1 - (dist - 9) / 18, 0, 1);
      shark.update(dt, threat, THREE.MathUtils.smoothstep(threat, 0.15, 0.7));
      ambient.intensity = 0.6 * (1 - p * 0.55) * (1 - threat * 0.5);
      rim.intensity = 30 * (1 - threat * 0.85);
      abyss.depth = p;
      abyss.threat = threat;
      torch.position.copy(camera.position);
      torch.intensity = THREE.MathUtils.smoothstep(p, 0.25, 0.45) * 16;
      if (threat > 0.5 && !reduced) {
        const k = (threat - 0.5) * 0.18;
        camera.position.x += (Math.random() - 0.5) * k;
        camera.position.y += (Math.random() - 0.5) * k;
      }

      rim.position.y = camera.position.y - 2;
      sun.intensity = 2.4 * Math.max(0.15, 1 - p * 3);
      (scene.fog as THREE.FogExp2).color.setRGB(0.008, 0.02 * (1 - p), 0.047 * (1 - p * 0.8));

      const [top, bot] = seaAt(p);
      sea.style.background = `linear-gradient(180deg, ${top} 0%, ${bot} 100%)`;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      shark.dispose();
      abyss.depth = 0;
      abyss.threat = 0;
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

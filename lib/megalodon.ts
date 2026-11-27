import * as THREE from "three";

/**
 * The megalodon: the rigged, animated shark model from /public/models/megalodon (FBX + textures).
 * Loads asynchronously; `root` is an empty group until the model arrives.
 * The model faces +X; `root` is set up to face +Z so it can be oriented with Object3D.lookAt().
 */
const BASE = "/models/megalodon/";

/** Grain tile (value noise) used to add micro detail on top of the upscaled textures. */
function noiseTile(size: number, scale: number, seed: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const img = g.createImageData(size, size);
  const n = size / scale;
  const grid = new Float32Array((n + 1) * (n + 1));
  let s = seed;
  for (let i = 0; i < grid.length; i++) grid[i] = (s = (s * 16807) % 2147483647) / 2147483647;
  // wrap edges so the tile repeats seamlessly
  for (let i = 0; i <= n; i++) {
    grid[i * (n + 1) + n] = grid[i * (n + 1)];
    grid[n * (n + 1) + i] = grid[i];
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = x / scale;
      const gy = y / scale;
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const tx = gx - x0;
      const ty = gy - y0;
      const sx = tx * tx * (3 - 2 * tx);
      const sy = ty * ty * (3 - 2 * ty);
      const at = (i: number, j: number) => grid[j * (n + 1) + i];
      const v = (at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx) * (1 - sy) + (at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx) * sy;
      const o = (y * size + x) * 4;
      img.data[o] = img.data[o + 1] = img.data[o + 2] = v * 255;
      img.data[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** Tangent-space normal tile derived from a height tile (dermal denticles / fine scratches). */
function normalTile(height: HTMLCanvasElement, strength: number) {
  const size = height.width;
  const src = height.getContext("2d")!.getImageData(0, 0, size, size).data;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const out = g.createImageData(size, size);
  const h = (x: number, y: number) => src[(((y + size) % size) * size + ((x + size) % size)) * 4] / 255;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * strength;
      const dy = (h(x, y + 1) - h(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const o = (y * size + x) * 4;
      out.data[o] = (-dx / len) * 127 + 128;
      out.data[o + 1] = (-dy / len) * 127 + 128;
      out.data[o + 2] = (1 / len) * 127 + 128;
      out.data[o + 3] = 255;
    }
  }
  g.putImageData(out, 0, 0);
  return c;
}

/**
 * HD skin: the model ships 1024² / 512² textures, which go soft up close. Upscale them with
 * high-quality filtering, grade them darker for the abyss, and layer tiling micro-detail on top.
 */
async function hdSkin(W: number) {
  const H = W / 2;
  const load = (f: string) =>
    new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = BASE + f;
    });
  const [albedo, normal] = await Promise.all([load("greatwhiteshark_alt.jpg"), load("greatwhiteshark_n.jpg")]);

  const fine = noiseTile(256, 3, 7);
  const coarse = noiseTile(256, 24, 13);

  const a = document.createElement("canvas");
  a.width = W;
  a.height = H;
  const ag = a.getContext("2d")!;
  ag.imageSmoothingEnabled = true;
  ag.imageSmoothingQuality = "high";
  ag.filter = "contrast(1.22) brightness(0.8) saturate(0.8)";
  ag.drawImage(albedo, 0, 0, W, H);
  ag.filter = "none";
  ag.globalCompositeOperation = "overlay";
  ag.globalAlpha = 0.22;
  ag.fillStyle = ag.createPattern(fine, "repeat")!;
  ag.fillRect(0, 0, W, H);
  ag.globalAlpha = 0.18;
  ag.fillStyle = ag.createPattern(coarse, "repeat")!;
  ag.fillRect(0, 0, W, H);
  // fine pale scratches and scars
  ag.globalCompositeOperation = "soft-light";
  ag.globalAlpha = 0.5;
  ag.strokeStyle = "#e6edf2";
  let s = 99;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 260; i++) {
    const x = rnd() * W;
    const y = rnd() * H;
    const len = (6 + rnd() * 40) * (W / 2048);
    const ang = (rnd() - 0.5) * 0.9;
    ag.lineWidth = (0.6 + rnd() * 1.4) * (W / 2048);
    ag.beginPath();
    ag.moveTo(x, y);
    ag.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ag.stroke();
  }
  ag.globalAlpha = 1;
  ag.globalCompositeOperation = "source-over";

  const nm = document.createElement("canvas");
  nm.width = W;
  nm.height = H;
  const ng = nm.getContext("2d")!;
  ng.imageSmoothingEnabled = true;
  ng.imageSmoothingQuality = "high";
  ng.drawImage(normal, 0, 0, W, H);
  ng.globalCompositeOperation = "overlay";
  ng.globalAlpha = 0.55;
  ng.fillStyle = ng.createPattern(normalTile(fine, 2.2), "repeat")!;
  ng.fillRect(0, 0, W, H);
  ng.globalAlpha = 0.35;
  ng.fillStyle = ng.createPattern(normalTile(coarse, 6), "repeat")!;
  ng.fillRect(0, 0, W, H);

  const map = new THREE.CanvasTexture(a);
  map.colorSpace = THREE.SRGBColorSpace;
  const normalMap = new THREE.CanvasTexture(nm);
  for (const t of [map, normalMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 16;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
  }
  return { map, normalMap };
}

export function createMegalodon(L = 14) {
  const root = new THREE.Group();
  const holder = new THREE.Group();
  holder.rotation.y = -Math.PI / 2; // model +X → root +Z
  root.add(holder);

  let mixer: THREE.AnimationMixer | null = null;
  let action: THREE.AnimationAction | null = null;
  let disposed = false;
  const textures: THREE.Texture[] = [];
  const materials: THREE.Material[] = [];
  let model: THREE.Object3D | null = null;

  const tl = new THREE.TextureLoader();
  const tex = (file: string, srgb = true) => {
    const t = tl.load(BASE + file);
    // the model's UVs run outside 0–1, so the textures must repeat (clamping causes stripes)
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    textures.push(t);
    return t;
  };

  import("three/examples/jsm/loaders/FBXLoader.js").then(({ FBXLoader }) => {
    if (disposed) return;
    const manager = new THREE.LoadingManager();
    // the FBX references .tga files on its author's disk; we supply the textures ourselves
    manager.setURLModifier((url) => (/\.tga$/i.test(url) ? "data:," : url));
    new FBXLoader(manager).load(BASE + "megalodon.fbx", (fbx) => {
      if (disposed) return;
      const skin = new THREE.MeshPhysicalMaterial({
        map: tex("greatwhiteshark_alt.jpg"),
        normalMap: tex("greatwhiteshark_n.jpg", false),
        normalScale: new THREE.Vector2(1.6, 1.6),
        roughness: 0.5,
        metalness: 0.02,
        clearcoat: 0.45,
        clearcoatRoughness: 0.38,
        sheen: 0.2,
        sheenColor: new THREE.Color("#5d7488"),
        envMapIntensity: 0.25,
      });
      // swap in the HD textures as soon as they are built (the originals show meanwhile)
      hdSkin(window.innerWidth < 700 ? 2048 : 4096)
        .then(({ map, normalMap }) => {
          if (disposed) {
            map.dispose();
            normalMap.dispose();
            return;
          }
          skin.map = map;
          skin.normalMap = normalMap;
          skin.needsUpdate = true;
          textures.push(map, normalMap);
        })
        .catch(() => {});
      const eye = new THREE.MeshPhysicalMaterial({ map: tex("greatwhiteshark_Eye.png"), roughness: 0.03, clearcoat: 1, envMapIntensity: 2, emissive: new THREE.Color("#3a0606"), emissiveIntensity: 0.6 });
      const teeth = new THREE.MeshStandardMaterial({ map: tex("greatwhiteshark_teeth.png"), alphaTest: 0.35, roughness: 0.35, side: THREE.DoubleSide });
      materials.push(skin, eye, teeth);

      fbx.traverse((c) => {
        const m = c as THREE.Mesh;
        if (!m.isMesh) return;
        m.frustumCulled = false; // skinned bounds don't follow the animation
        const pick = (src: THREE.Material) => (/eye/i.test(src.name) ? eye : /teet/i.test(src.name) ? teeth : skin);
        const old = m.material;
        m.material = Array.isArray(old) ? old.map(pick) : pick(old);
        (Array.isArray(old) ? old : [old]).forEach((x) => x.dispose());
      });

      // centre and scale the model so it is L units long
      const box = new THREE.Box3().setFromObject(fbx);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const k = L / Math.max(size.x, 0.001);
      fbx.scale.setScalar(k);
      fbx.position.set(-center.x * k, -center.y * k, -center.z * k);
      holder.add(fbx);
      model = fbx;

      if (fbx.animations.length) {
        mixer = new THREE.AnimationMixer(fbx);
        action = mixer.clipAction(fbx.animations[0]);
        action.play();
      }
    });
  });

  /** speed 0–1 quickens the tail beat as the shark closes in; `bite` is kept for API compatibility. */
  function update(dt: number, speed: number, bite = 0) {
    void bite;
    if (!mixer || !action) return;
    action.timeScale = 0.85 + speed * 0.9;
    mixer.update(dt);
  }

  function dispose() {
    disposed = true;
    mixer?.stopAllAction();
    model?.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
  }

  return { root, update, dispose };
}

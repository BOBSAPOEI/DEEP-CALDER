import * as THREE from "three";

/**
 * The megalodon: the rigged, animated shark model from /public/models/megalodon (FBX + textures).
 * Loads asynchronously; `root` is an empty group until the model arrives.
 * The model faces +X; `root` is set up to face +Z so it can be oriented with Object3D.lookAt().
 */
const BASE = "/models/megalodon/";

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
        normalScale: new THREE.Vector2(1.2, 1.2),
        roughness: 0.42,
        metalness: 0.02,
        clearcoat: 0.35,
        clearcoatRoughness: 0.5,
        sheen: 0.25,
        sheenColor: new THREE.Color("#6d8597"),
        envMapIntensity: 0.3,
      });
      const eye = new THREE.MeshPhysicalMaterial({ map: tex("greatwhiteshark_Eye.png"), roughness: 0.05, clearcoat: 1, envMapIntensity: 1.2 });
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

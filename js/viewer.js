// Visualizador 3D — three.js (GLTFLoader + OrbitControls), ficheiros locais em vendor/.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const MODEL_URL = 'modelo/armazens.glb';
const MODEL_BYTES = 8144080;               // para a barra de progresso se o servidor não indicar o tamanho
const SITE_CENTER = new THREE.Vector3(20, 0, -20); // centro do terreno (glTF: x, y, z)
const SITE_RADIUS = 125;

// Sol de sudeste, manhã. Norte = -Z, este = +X (Blender +Y -> glTF -Z).
const SUN_AZIMUTH = THREE.MathUtils.degToRad(125);  // a partir do norte, sentido horário
const SUN_ELEV = THREE.MathUtils.degToRad(34);

export function initViewer(root) {
  const canvas = root.querySelector('#viewerCanvas');
  const poster = root.querySelector('#viewerPoster');
  const loading = root.querySelector('#viewerLoading');
  const bar = root.querySelector('#viewerBar');
  const pct = root.querySelector('#viewerPct');
  const ui = root.querySelector('#viewerUi');
  const north = root.querySelector('.viewer-north');
  const isSmall = Math.min(screen.width, screen.height) < 700;

  loading.hidden = false;

  /* renderer */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1.75 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();

  /* céu: gradiente simples numa esfera */
  const skyTop = new THREE.Color('#8fb3cf');
  const skyHorizon = new THREE.Color('#e6ebe9');
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1500, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: skyTop }, horizon: { value: skyHorizon } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 horizon; varying vec3 vP; void main(){ float h = clamp(vP.y,0.0,1.0); gl_FragColor = vec4(mix(horizon, top, pow(h,0.55)),1.0);\n#include <colorspace_fragment>\n}',
    })
  );
  sky.renderOrder = -1;
  scene.add(sky);
  scene.fog = new THREE.Fog(skyHorizon, 320, 1100);

  /* reflexos suaves (vidro, alumínio) */
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;

  /* luz */
  const hemi = new THREE.HemisphereLight('#dfe9f0', '#8a7559', 1.35);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff3df', 3.2);
  const sunDir = new THREE.Vector3(
    Math.sin(SUN_AZIMUTH) * Math.cos(SUN_ELEV),
    Math.sin(SUN_ELEV),
    -Math.cos(SUN_AZIMUTH) * Math.cos(SUN_ELEV)
  );
  sun.castShadow = true;
  const sm = isSmall ? 2048 : 4096;
  sun.shadow.mapSize.set(sm, sm);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);

  /* câmara e controlos */
  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 3000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = false;
  controls.minDistance = 6;
  controls.maxDistance = 320;
  controls.maxPolarAngle = THREE.MathUtils.degToRad(87);
  controls.autoRotateSpeed = 0.6;
  controls.zoomToCursor = true;

  /* resize */
  const resize = () => {
    const w = root.clientWidth, h = root.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 1 ? 55 : 40;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(root);
  resize();

  /* modelo */
  const loader = new GLTFLoader();
  loader.load(MODEL_URL, (gltf) => {
    const model = gltf.scene;
    let groundY = Infinity;
    const bBox = new THREE.Box3();
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        const n = (m.name || '').toLowerCase();
        if (n.startsWith('vidro')) { m.roughness = 0.08; m.metalness = 0.6; m.envMapIntensity = 1.4; }
        else if (n.includes('aluminio') || n.includes('galvanizado') || n.includes('jante')) { m.metalness = 0.75; m.roughness = 0.35; }
        else if (m.metalness > 0.5 && !n.includes('chapa')) { m.metalness = 0.4; }
        // folhagem: dupla face, sem sombras pesadas em si própria
        if (n.startsWith('folha')) { m.side = THREE.DoubleSide; }
      });
      if (/^(A|B|C|D)_/.test(o.name) || /portaria/i.test(o.name)) bBox.expandByObject(o);
    });
    scene.add(model);
    model.updateMatrixWorld(true);

    const all = new THREE.Box3().setFromObject(model);
    groundY = all.min.y;
    const center = bBox.isEmpty() ? SITE_CENTER.clone().setY(groundY) : bBox.getCenter(new THREE.Vector3());
    const size = bBox.isEmpty() ? new THREE.Vector3(80, 7, 60) : bBox.getSize(new THREE.Vector3());
    const span = Math.max(size.x, size.z);

    // chão de fundo para não haver "ilha" a flutuar
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(1400, 64),
      new THREE.MeshStandardMaterial({ color: '#a39a86', roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(SITE_CENTER.x, groundY - 0.15, SITE_CENTER.z);
    ground.receiveShadow = true;
    scene.add(ground);

    // sol + caixa de sombras sobre o terreno
    const sc = sun.shadow.camera;
    const R = Math.min(SITE_RADIUS, span * 1.1 + 25);
    sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R;
    sc.near = 1; sc.far = 600;
    sun.target.position.copy(center);
    sun.position.copy(center).addScaledVector(sunDir, 300);
    sc.updateProjectionMatrix();

    // vistas (frentes viradas a nascente, rua a este)
    const d = span * (camera.aspect < 1 ? 1.35 : 1);
    const VIEWS = {
      aerea:   { pos: new THREE.Vector3(d * 1.05, d * 0.85, d * 0.95), tgt: new THREE.Vector3(0, 0, 0) },
      rua:     { pos: new THREE.Vector3(d * 1.05, 3.2, d * 0.2), tgt: new THREE.Vector3(0, 3, 0) },
      entrada: { pos: new THREE.Vector3(d * 0.95, 5, d * 1.0), tgt: new THREE.Vector3(d * 0.15, 2.5, d * 0.2) },
      topo:    { pos: new THREE.Vector3(0, d * 1.9, 0.01), tgt: new THREE.Vector3(0, 0, 0) },
    };
    const toWorld = (v) => v.clone().add(center).setY(v.y + groundY);

    let anim = null;
    const goTo = (name, instant = false) => {
      const v = VIEWS[name];
      const p1 = toWorld(v.pos), t1 = toWorld(v.tgt);
      if (instant) { camera.position.copy(p1); controls.target.copy(t1); controls.update(); return; }
      anim = { p0: camera.position.clone(), t0: controls.target.clone(), p1, t1, start: performance.now(), dur: 1300 };
    };
    goTo('aerea', true);

    // limites do alvo: dentro do terreno
    const tmp = new THREE.Vector3();
    controls.addEventListener('change', () => {
      tmp.copy(controls.target).sub(SITE_CENTER); tmp.y = 0;
      if (tmp.length() > SITE_RADIUS) {
        tmp.setLength(SITE_RADIUS);
        controls.target.x = SITE_CENTER.x + tmp.x;
        controls.target.z = SITE_CENTER.z + tmp.z;
      }
      controls.target.y = THREE.MathUtils.clamp(controls.target.y, groundY, groundY + 20);
    });

    ui.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
      ui.querySelectorAll('[data-view]').forEach((x) => x.classList.toggle('on', x === b));
      goTo(b.dataset.view);
    }));
    const btnRotate = ui.querySelector('#btnRotate');
    btnRotate.addEventListener('click', () => {
      controls.autoRotate = !controls.autoRotate;
      btnRotate.setAttribute('aria-pressed', String(controls.autoRotate));
    });
    controls.addEventListener('start', () => { anim = null; ui.querySelectorAll('[data-view]').forEach((x) => x.classList.remove('on')); });

    const btnFull = ui.querySelector('#btnFull');
    const fsEl = root.requestFullscreen ? 'requestFullscreen' : root.webkitRequestFullscreen ? 'webkitRequestFullscreen' : null;
    if (!fsEl) btnFull.hidden = true;
    btnFull.addEventListener('click', () => {
      const cur = document.fullscreenElement || document.webkitFullscreenElement;
      if (cur) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else root[fsEl]();
    });

    /* ciclo de render: pausa quando a secção não está visível */
    let visible = true;
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(root);
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    renderer.setAnimationLoop(() => {
      if (!visible || document.hidden) return;
      if (anim) {
        const t = Math.min(1, (performance.now() - anim.start) / anim.dur);
        const k = ease(t);
        camera.position.lerpVectors(anim.p0, anim.p1, k);
        controls.target.lerpVectors(anim.t0, anim.t1, k);
        if (t >= 1) anim = null;
      }
      controls.update();
      north.style.transform = `rotate(${controls.getAzimuthalAngle()}rad)`;
      renderer.render(scene, camera);
    });

    loading.hidden = true;
    poster.hidden = true;
    ui.hidden = false;
  }, (ev) => {
    const total = ev.lengthComputable && ev.total ? ev.total : MODEL_BYTES;
    const p = Math.min(100, Math.round((ev.loaded / total) * 100));
    bar.style.width = p + '%';
    pct.textContent = p + ' %';
  }, (err) => {
    console.error(err);
    loading.innerHTML = '<span>Não foi possível carregar o modelo 3D.</span>';
  });
}

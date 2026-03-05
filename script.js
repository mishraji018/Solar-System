import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// --- CELESTIAL DATA ---
const TEXTURE_BASE = 'https://threejs.org/examples/textures/planets/';
const PLANET_DATA = [
  { name: 'Mercury', texture: TEXTURE_BASE + 'mercurymap.jpg', color: 0xA5A5A5, emissive: 0x222222, radius: 0.8, distance: 28, speed: 0.047, description: 'Innermost rocky world.', diameter: '4,879 km', au: 0.39 },
  { name: 'Venus', texture: TEXTURE_BASE + 'venusmap.jpg', color: 0xE3BB76, emissive: 0x221100, radius: 1.5, distance: 44, speed: 0.035, description: 'Hottest planet in the system.', diameter: '12,104 km', au: 0.72 },
  {
    name: 'Earth', texture: TEXTURE_BASE + 'earth_atmos_2048.jpg', color: 0x2233FF, emissive: 0x000033, radius: 1.6, distance: 62, speed: 0.029, description: 'Life-sustaining blue marble.', diameter: '12,742 km', au: 1.0,
    moons: [{ name: 'Moon', texture: TEXTURE_BASE + 'moon_1024.jpg', distance: 3.5, radius: 0.4, speed: 0.08 }]
  },
  { name: 'Mars', texture: TEXTURE_BASE + 'marsmap1k.jpg', color: 0xFF5F3F, emissive: 0x331100, radius: 1.2, distance: 78, speed: 0.024, description: 'The Red Planet.', diameter: '6,779 km', au: 1.52 },
  { name: 'Jupiter', texture: TEXTURE_BASE + 'jupitermap.jpg', color: 0xDDA032, emissive: 0x221100, radius: 4.5, distance: 130, speed: 0.013, description: 'Gas giant king.', diameter: '139,820 km', au: 5.2 },
  { name: 'Saturn', texture: TEXTURE_BASE + 'saturnmap.jpg', color: 0xEAD6B8, emissive: 0x221100, radius: 3.8, distance: 180, speed: 0.009, description: 'Jewel of the system.', diameter: '116,460 km', au: 9.5, hasRings: true },
  { name: 'Uranus', texture: TEXTURE_BASE + 'uranusmap.jpg', color: 0xAFDBF5, emissive: 0x001122, radius: 2.2, distance: 220, speed: 0.006, description: 'Tilted ice giant.', diameter: '50,724 km', au: 19.2 },
  { name: 'Neptune', texture: TEXTURE_BASE + 'neptunemap.jpg', color: 0x3E54E8, emissive: 0x000033, radius: 2.1, distance: 260, speed: 0.005, description: 'Windiest planet.', diameter: '49,244 km', au: 30.1 }
];

// --- CORE VARIABLES ---
let scene, camera, renderer, controls, composer, textureLoader;
let sun, stars, spaceDust, asteroids, meteors = [];
const planets = [];
const orbitLines = [];
let timeScale = 1;
let isPaused = false;
let focusedPlanet = null;

// --- INITIALIZATION ---
function init() {
  scene.background = new THREE.Color(0x000000);
  textureLoader = new THREE.TextureLoader();

  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
  camera.position.set(0, 100, 400);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ReinhardToneMapping;
  document.getElementById('canvas-container').appendChild(renderer.domElement);

  // Post-Processing (Bloom)
  const renderScene = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
  bloomPass.threshold = 0.2; // Set threshold to prevent dark objects from blooming
  bloomPass.strength = 1.6;
  bloomPass.radius = 0.6;

  composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 30;
  controls.maxDistance = 2500;

  createSun();
  createStarfield();
  createSpaceDust();
  createAsteroidBelt();
  createPlanets();
  createMeteors();
  setupUI();

  window.addEventListener('resize', onWindowResize);

  // Loading transition
  updateLoading(100, "COSMOS READY.");
  setTimeout(() => {
    document.getElementById('loading-screen').style.opacity = '0';
    setTimeout(() => document.getElementById('loading-screen').style.display = 'none', 1000);
  }, 1500);

  animate();
}

function updateLoading(percent, text) {
  document.getElementById('progress-inner').style.width = percent + '%';
  document.getElementById('loading-status').innerText = text;
}

function createSun() {
  const sunGeom = new THREE.SphereGeometry(15, 64, 64);
  const sunTex = textureLoader.load(TEXTURE_BASE + 'sun_1k.jpg');
  const sunMat = new THREE.MeshStandardMaterial({
    map: sunTex,
    emissive: 0xFFFACD,
    emissiveIntensity: 2.5,
    toneMapped: false
  });
  sun = new THREE.Mesh(sunGeom, sunMat);
  scene.add(sun);

  const sunLight = new THREE.PointLight(0xffffff, 25000, 3000);
  sun.add(sunLight);
}

function createStarfield() {
  const starGeom = new THREE.BufferGeometry();
  const starPos = [];
  for (let i = 0; i < 8000; i++) {
    starPos.push((Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000);
  }
  starGeom.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, transparent: true, opacity: 0.8 });
  stars = new THREE.Points(starGeom, starMat);
  scene.add(stars);
}

function createSpaceDust() {
  const dustGeom = new THREE.BufferGeometry();
  const dustPos = [];
  for (let i = 0; i < 2000; i++) {
    dustPos.push((Math.random() - 0.5) * 600, (Math.random() - 0.5) * 600, (Math.random() - 0.5) * 600);
  }
  dustGeom.setAttribute('position', new THREE.Float32BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.2, transparent: true, opacity: 0.3 });
  spaceDust = new THREE.Points(dustGeom, dustMat);
  scene.add(spaceDust);
}

function createAsteroidBelt() {
  const asteroidGeom = new THREE.IcosahedronGeometry(1, 0);
  const asteroidMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
  asteroids = new THREE.InstancedMesh(asteroidGeom, asteroidMat, 600);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < 600; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 90 + Math.random() * 20;
    dummy.position.set(Math.cos(angle) * dist, (Math.random() - 0.5) * 5, Math.sin(angle) * dist);
    dummy.rotation.set(Math.random(), Math.random(), Math.random());
    dummy.scale.setScalar(0.2 + Math.random() * 0.4);
    dummy.updateMatrix();
    asteroids.setMatrixAt(i, dummy.matrix);
  }
  scene.add(asteroids);
}

function createPlanets() {
  const list = document.getElementById('planet-list');

  // Add Sun to Target Systems
  const sunBtn = document.createElement('button');
  sunBtn.className = "selector-btn";
  sunBtn.innerText = "SUN";
  sunBtn.onclick = () => focusOn({
    mesh: sun,
    data: {
      name: 'Sun',
      description: 'The Star at the center of the Solar System.',
      au: 0,
      diameter: '1.39M km',
      speed: 0,
      radius: 15
    }
  });
  list.appendChild(sunBtn);

  PLANET_DATA.forEach((data) => {
    // Orbit
    const pts = new THREE.Path().absarc(0, 0, data.distance, 0, Math.PI * 2).getPoints(128);
    const orbitGeom = new THREE.BufferGeometry().setFromPoints(pts);
    const orbitMat = new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.4 });
    const orbit = new THREE.LineLoop(orbitGeom, orbitMat);
    orbit.rotation.x = Math.PI / 2;
    scene.add(orbit);
    orbitLines.push(orbit);

    // Planet Mesh
    const planetGeom = new THREE.SphereGeometry(data.radius, 64, 64);
    const planetTex = textureLoader.load(data.texture);
    const planetMat = new THREE.MeshStandardMaterial({
      map: planetTex,
      color: data.color || 0xffffff,
      emissive: data.emissive || 0x000000,
      emissiveIntensity: 0.2
    });
    const mesh = new THREE.Mesh(planetGeom, planetMat);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    scene.add(mesh);

    // Saturn Rings
    if (data.hasRings) {
      const ringGeom = new THREE.RingGeometry(data.radius * 1.5, data.radius * 2.6, 128);
      const ringTex = textureLoader.load(TEXTURE_BASE + 'saturn_ring_alpha.png');
      const ringMat = new THREE.MeshBasicMaterial({ map: ringTex, side: THREE.DoubleSide, transparent: true, opacity: 0.8 ,roughness=0.8});
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = -Math.PI / 2;
      mesh.add(ring);
    }

    // Moons
    const moonGroup = new THREE.Group();
    mesh.add(moonGroup);
    if (data.moons) {
      data.moons.forEach(m => {
        const moGeom = new THREE.SphereGeometry(m.radius, 32, 32);
        const moTex = textureLoader.load(m.texture);
        const moMat = new THREE.MeshStandardMaterial({ map: moTex });
        const moMesh = new THREE.Mesh(moGeom, moMat);
        moMesh.position.x = m.distance;
        const moOrbit = new THREE.Group();
        moOrbit.add(moMesh);
        moonGroup.add(moOrbit);
      });
    }

    const pObj = { mesh, data, angle: Math.random() * Math.PI * 2, moonGroup };
    planets.push(pObj);

    // UI Button
    const btn = document.createElement('button');
    btn.className = "selector-btn";
    btn.innerText = data.name.toUpperCase();
    btn.onclick = () => focusOn(pObj);
    list.appendChild(btn);
  });
}

function createMeteors() {
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    resetMeteor(m);
    scene.add(m);
    meteors.push(m);
  }
}

function resetMeteor(m) {
  m.position.set((Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 500, (Math.random() - 0.5) * 1000);
  m.velocity = new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 6);
}

function focusOn(p) {
  focusedPlanet = p;
  document.getElementById('planet-name').innerText = p.data.name;
  document.getElementById('planet-description').innerText = p.data.description;
  document.getElementById('orbit-dist').innerText = p.data.au + " AU";
  document.getElementById('diameter').innerText = p.data.diameter;
  document.getElementById('velocity').innerText = (p.data.speed * 1000).toFixed(1) + " km/s";
}

function setupUI() {
  document.getElementById('speed-slider').oninput = (e) => timeScale = e.target.value;
  document.getElementById('play-pause-btn').onclick = (e) => {
    isPaused = !isPaused;
    e.target.innerText = isPaused ? "PLAY" : "PAUSE";
  };
  document.getElementById('reset-cam-btn').onclick = () => {
    focusedPlanet = null;
    camera.position.set(0, 100, 400);
    controls.target.set(0, 0, 0);
  };
  document.getElementById('toggle-orbits-btn').onclick = () => {
    orbitLines.forEach(l => l.visible = !l.visible);
  };
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  if (!isPaused) {
    planets.forEach(p => {
      p.angle += p.data.speed * 0.1 * timeScale;
      p.mesh.position.set(Math.cos(p.angle) * p.data.distance, 0, Math.sin(p.angle) * p.data.distance);
      p.mesh.rotation.y += 0.01;
      p.moonGroup.children.forEach(mo => mo.rotation.y += 0.04 * timeScale);
    });

    sun.rotation.y += 0.002;
    stars.rotation.y += 0.0001;
    spaceDust.rotation.y -= 0.0002;
    asteroids.rotation.y += 0.0004 * timeScale;

    meteors.forEach(m => {
      m.position.add(m.velocity);
      if (m.position.length() > 2000) resetMeteor(m);
    });
  }

  if (focusedPlanet) {
    const pPos = focusedPlanet.mesh.position.clone();

    // Improved centering: ensure camera and controls stay locked to target
    const targetOffset = new THREE.Vector3(0, focusedPlanet.data.radius * 3, focusedPlanet.data.radius * 6);

    // Only lerp camera position if we're not currently manipulating it
    // But always keep controls.target locked for consistent rotation axis
    controls.target.copy(pPos);

    if (controls.enabled) {
      // If the user isn't actively orbiting, we can lerp the camera position
      // However, typical behavior is to lerp once on click. 
      // For now, let's keep the lerp to provide a "follow" effect.
      const idealCameraPos = pPos.clone().add(targetOffset);
      camera.position.lerp(idealCameraPos, 0.05);
    }
  }

  controls.update();
  composer.render();
}

init();

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- CONFIG & DATA ---
const TEXTURE_BASE = 'https://threejs.org/examples/textures/planets/';
const PLANET_DATA = [
    { name: 'Mercury', color: 0xA5A5A5, radius: 0.8, distance: 28, speed: 0.047, description: 'The smallest planet and closest to the Sun.', diameter: '4,879 km', au: 0.39 },
    { name: 'Venus', color: 0xE3BB76, radius: 1.5, distance: 44, speed: 0.035, description: 'Often called Earth’s twin, but with a thick, toxic atmosphere.', diameter: '12,104 km', au: 0.72 },
    { name: 'Earth', color: 0x2233FF, radius: 1.6, distance: 62, speed: 0.029, description: 'Our home planet, the only world known to support life.', diameter: '12,742 km', au: 1.0, hasMoon: true },
    { name: 'Mars', color: 0xFF5F3F, radius: 1.2, distance: 78, speed: 0.024, description: 'The Red Planet, home to the largest volcano in the solar system.', diameter: '6,779 km', au: 1.52 },
    { name: 'Jupiter', color: 0xDDA032, radius: 4.5, distance: 130, speed: 0.013, description: 'The largest planet, a gas giant with a Great Red Spot.', diameter: '139,820 km', au: 5.2 },
    { name: 'Saturn', color: 0xEAD6B8, radius: 3.8, distance: 180, speed: 0.009, description: 'Adorned with a dazzling, complex system of icy rings.', diameter: '116,460 km', au: 9.5, hasRings: true },
    { name: 'Uranus', color: 0xAFDBF5, radius: 2.2, distance: 220, speed: 0.006, description: 'An ice giant that rotates on its side.', diameter: '50,724 km', au: 19.2 },
    { name: 'Neptune', color: 0x3E54E8, radius: 2.1, distance: 260, speed: 0.005, description: 'The most distant major planet, cold and dark.', diameter: '49,244 km', au: 30.1 }
];

// --- CORE VARIABLES ---
let scene, camera, renderer, controls;
let sun, starfield;
const planets = [];
let timeScale = 1;
let isPaused = false;
let focusedPlanet = null;

// --- INITIALIZATION ---
function init() {
    // Scene & Camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 150, 400);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 2000;
    controls.minDistance = 20;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 3, 2000, 1);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    scene.add(sunLight);

    createSun();
    createStarfield();
    createPlanets();
    setupUI();

    window.addEventListener('resize', onWindowResize);
    
    // Hide Loading Screen
    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 1000);
    }, 1500);

    animate();
}

function createSun() {
    // Sun Mesh
    const geometry = new THREE.SphereGeometry(15, 64, 64);
    const material = new THREE.MeshStandardMaterial({
        emissive: 0xffcc33,
        emissiveIntensity: 2,
        color: 0xffcc33
    });
    sun = new THREE.Mesh(geometry, material);
    scene.add(sun);

    // Sun Glow effect (Sprite)
    const spriteMaterial = new THREE.SpriteMaterial({
        map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/lensflare/lensflare0.png'),
        color: 0xffcc33,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(60, 60, 1);
    sun.add(sprite);
}

function createStarfield() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 10000; i++) {
        vertices.push(
            THREE.MathUtils.randFloatSpread(4000),
            THREE.MathUtils.randFloatSpread(4000),
            THREE.MathUtils.randFloatSpread(4000)
        );
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, transparent: true, opacity: 0.8 });
    starfield = new THREE.Points(geometry, material);
    scene.add(starfield);
}

function createPlanets() {
    const selector = document.getElementById('planet-selector');
    
    // Add Sun to selector
    createSelectorBtn('SUN', () => focusOn(null));

    PLANET_DATA.forEach((data) => {
        // Orbit Path
        const orbitGeom = new THREE.BufferGeometry();
        const orbitPoints = [];
        for (let i = 0; i <= 100; i++) {
            const angle = (i / 100) * Math.PI * 2;
            orbitPoints.push(new THREE.Vector3(Math.cos(angle) * data.distance, 0, Math.sin(angle) * data.distance));
        }
        orbitGeom.setFromPoints(orbitPoints);
        const orbitMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 });
        const orbit = new THREE.Line(orbitGeom, orbitMat);
        scene.add(orbit);

        // Planet Mesh
        const planetGeom = new THREE.SphereGeometry(data.radius, 32, 32);
        const planetMat = new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.7,
            metalness: 0.3
        });
        const mesh = new THREE.Mesh(planetGeom, planetMat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        // Rings (Saturn)
        if (data.hasRings) {
            const ringGeom = new THREE.RingGeometry(data.radius * 1.5, data.radius * 2.5, 64);
            const ringMat = new THREE.MeshBasicMaterial({
                color: data.color,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.5
            });
            const rings = new THREE.Mesh(ringGeom, ringMat);
            rings.rotation.x = Math.PI / 2;
            mesh.add(rings);
        }

        // Moon (Earth)
        let moon = null;
        if (data.hasMoon) {
            const moonGeom = new THREE.SphereGeometry(0.4, 16, 16);
            const moonMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
            moon = new THREE.Mesh(moonGeom, moonMat);
            scene.add(moon);
        }

        const planetObj = {
            mesh,
            data,
            angle: Math.random() * Math.PI * 2,
            moon: moon,
            moonAngle: 0
        };
        planets.push(planetObj);

        // UI Button
        createSelectorBtn(data.name.toUpperCase(), () => focusOn(planetObj));
    });
}

function createSelectorBtn(name, onClick) {
    const btn = document.createElement('button');
    btn.className = 'planet-btn';
    btn.innerText = name;
    btn.onclick = () => {
        document.querySelectorAll('.planet-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        onClick();
    };
    document.getElementById('planet-selector').appendChild(btn);
}

function setupUI() {
    const speedSlider = document.getElementById('speed-slider');
    speedSlider.oninput = (e) => timeScale = parseFloat(e.target.value);

    const playPauseBtn = document.getElementById('play-pause-btn');
    playPauseBtn.onclick = () => {
        isPaused = !isPaused;
        playPauseBtn.innerText = isPaused ? 'PLAY' : 'PAUSE';
    };

    const resetBtn = document.getElementById('reset-cam-btn');
    resetBtn.onclick = () => {
        focusedPlanet = null;
        document.querySelectorAll('.planet-btn').forEach(b => b.classList.remove('active'));
        // Reset info panel
        updateInfoPanel(null);
        // Animate camera back
        const startPos = camera.position.clone();
        const endPos = new THREE.Vector3(0, 150, 400);
        const duration = 1000;
        const startTime = performance.now();
        
        function animateCam(time) {
            const elapsed = time - startTime;
            const t = Math.min(elapsed / duration, 1);
            camera.position.lerpVectors(startPos, endPos, t);
            controls.target.set(0, 0, 0);
            if (t < 1) requestAnimationFrame(animateCam);
        }
        requestAnimationFrame(animateCam);
    };
}

function focusOn(planet) {
    focusedPlanet = planet;
    updateInfoPanel(planet);
}

function updateInfoPanel(planet) {
    const nameEl = document.getElementById('planet-name');
    const descEl = document.getElementById('planet-description');
    const distEl = document.getElementById('stat-dist');
    const diamEl = document.getElementById('stat-diam');

    if (planet) {
        nameEl.innerText = planet.data.name.toUpperCase();
        descEl.innerText = planet.data.description;
        distEl.innerText = planet.data.au + ' AU';
        diamEl.innerText = planet.data.diameter;
    } else {
        nameEl.innerText = 'THE SUN';
        descEl.innerText = 'The star at the heart of our Solar System.';
        distEl.innerText = '0 AU';
        diamEl.innerText = '1.39M km';
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (!isPaused) {
        const delta = 0.01 * timeScale;
        
        planets.forEach(p => {
            p.angle += p.data.speed * delta;
            const x = Math.cos(p.angle) * p.data.distance;
            const z = Math.sin(p.angle) * p.data.distance;
            p.mesh.position.set(x, 0, z);
            p.mesh.rotation.y += 0.01;

            if (p.moon) {
                p.moonAngle += 0.05 * timeScale;
                const mx = x + Math.cos(p.moonAngle) * 4;
                const mz = z + Math.sin(p.moonAngle) * 4;
                p.moon.position.set(mx, 0, mz);
            }
        });

        sun.rotation.y += 0.002;
        starfield.rotation.y += 0.0001;
    }

    if (focusedPlanet) {
        const pPos = focusedPlanet.mesh.position;
        controls.target.lerp(pPos, 0.1);
        
        // Offset camera to avoid being "inside" the planet
        const offset = new THREE.Vector3(0, focusedPlanet.data.radius * 2, focusedPlanet.data.radius * 5);
        const targetCamPos = pPos.clone().add(offset);
        // Only lerp position if not manually orbiting
        if (!controls.enabled) {
            camera.position.lerp(targetCamPos, 0.05);
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

init();

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* global gsap */

// Required exact timing for every cinematic camera journey.
const CAMERA_TRAVEL_SECONDS = 2;
const SYSTEM_SPEED_SCALE = 0.28;

const DEFAULT_CAMERA_POSITION = new THREE.Vector3(0, 120, 360);
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);
const DEEP_SPACE_CAMERA_POSITION = new THREE.Vector3(0, 360, 1750);

const ui = {
    splash: document.getElementById('splash-screen'),
    startButton: document.getElementById('start-btn'),
    factPanel: document.getElementById('fact-panel'),
    closePanelButton: document.getElementById('close-panel-btn'),
    hint: document.getElementById('interaction-hint'),
    factSubtitle: document.getElementById('fact-subtitle'),
    factName: document.getElementById('fact-name'),
    factText: document.getElementById('fact-text'),
    stats: {
        mass: document.getElementById('stat-mass'),
        distance: document.getElementById('stat-distance'),
        rotation: document.getElementById('stat-rotation'),
        orbit: document.getElementById('stat-orbit'),
        gravity: document.getElementById('stat-gravity'),
        surfaceTemp: document.getElementById('stat-surface-temp'),
        summerTemp: document.getElementById('stat-summer-temp'),
        winterTemp: document.getElementById('stat-winter-temp'),
        density: document.getElementById('stat-density')
    }
};

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 9000);
camera.position.copy(DEEP_SPACE_CAMERA_POSITION);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.rotateSpeed = 0.6;
controls.zoomSpeed = 0.8;
controls.enabled = false;
controls.minDistance = 24;
controls.maxDistance = 2200;
controls.target.copy(DEFAULT_CAMERA_TARGET);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    2.2,   // strength
    0.7,   // radius
    0.05   // threshold
);
composer.addPass(bloomPass);

const CELESTIAL_BODIES = [
    {
        id: 'sun',
        name: 'Sun',
        type: 'G-Type Main Sequence Star',
        radius: 14,
        color: 0xffc266,
        orbitRadius: 0,
        orbitSpeed: 0,
        rotationSpeed: 0.0022,
        axialTiltDeg: 7.25,
        zoomDistance: 95,
        isSun: true,
        stats: {
            mass: '1.989 x 10^30 kg',
            distance: '0 km (reference center)',
            rotation: '25-35 Earth days (differential)',
            orbit: 'About 230 million years around Milky Way',
            gravity: '274 m/s^2',
            surfaceTemp: 'About 5,500 deg C (photosphere)',
            summerTemp: 'Not applicable',
            winterTemp: 'Not applicable',
            density: '1.41 g/cm^3'
        },
        description: [
            'The Sun contains more than 99 percent of all mass in the solar system and is the gravitational anchor for every planet, moon, asteroid, and comet. Its energy is produced by nuclear fusion, where hydrogen fuses into helium deep in the core.',
            'The photosphere, chromosphere, and corona are constantly shaped by magnetic activity. Sunspots, flares, and coronal ejections show that the Sun is both stable across billions of years and highly dynamic on human timescales.'
        ]
    },
    {
        id: 'mercury',
        name: 'Mercury',
        type: 'Terrestrial Planet',
        radius: 2.1,
        color: 0xbcb5ae,
        orbitRadius: 28,
        orbitSpeed: 0.018,
        rotationSpeed: 0.002,
        axialTiltDeg: 0.03,
        zoomDistance: 18,
        stats: {
            mass: '3.30 x 10^23 kg',
            distance: '57.9 million km',
            rotation: '58.6 Earth days',
            orbit: '88 Earth days',
            gravity: '3.7 m/s^2',
            surfaceTemp: '167 deg C average',
            summerTemp: '430 deg C daytime peak',
            winterTemp: '-180 deg C nighttime low',
            density: '5.43 g/cm^3'
        },
        description: [
            'Mercury is the smallest planet and the closest to the Sun, with almost no substantial atmosphere to keep temperatures stable. Its day side becomes extremely hot, while the night side drops to deep cold.',
            'The surface is ancient and cratered, and giant scarps show the planet shrank as its interior cooled. Mercury also has a large iron core that supports a weak magnetic field.'
        ]
    },
    {
        id: 'venus',
        name: 'Venus',
        type: 'Terrestrial Planet',
        radius: 3.8,
        color: 0xe8bf8a,
        orbitRadius: 40,
        orbitSpeed: 0.014,
        rotationSpeed: -0.0015,
        axialTiltDeg: 177.4,
        zoomDistance: 25,
        stats: {
            mass: '4.87 x 10^24 kg',
            distance: '108.2 million km',
            rotation: '243 Earth days (retrograde)',
            orbit: '224.7 Earth days',
            gravity: '8.87 m/s^2',
            surfaceTemp: '464 deg C average',
            summerTemp: 'About 470 deg C',
            winterTemp: 'About 450 deg C',
            density: '5.24 g/cm^3'
        },
        description: [
            'Venus is close to Earth in size but has a crushing carbon dioxide atmosphere and sulfuric acid clouds. A runaway greenhouse effect makes the surface hotter than Mercury even though Venus is farther from the Sun.',
            'The planet rotates very slowly in the opposite direction of most planets. High pressure, volcanic plains, and complex tectonic structures make Venus one of the most hostile and intriguing rocky worlds.'
        ]
    },
    {
        id: 'earth',
        name: 'Earth',
        type: 'Terrestrial Planet',
        radius: 4,
        color: 0x2f7dff,
        orbitRadius: 56,
        orbitSpeed: 0.011,
        rotationSpeed: 0.024,
        axialTiltDeg: 23.4,
        zoomDistance: 30,
        moons: [
            { name: 'Moon', radius: 1.1, color: 0xbfc6ce, orbitRadius: 8.5, orbitSpeed: 0.06, rotationSpeed: 0.012 }
        ],
        stats: {
            mass: '5.97 x 10^24 kg',
            distance: '149.6 million km',
            rotation: '23h 56m',
            orbit: '365.25 days',
            gravity: '9.81 m/s^2',
            surfaceTemp: '15 deg C global mean',
            summerTemp: 'Up to about 35 deg C (regional)',
            winterTemp: 'Down to about -20 deg C (regional)',
            density: '5.51 g/cm^3'
        },
        description: [
            'Earth is the only known world with stable surface liquid water and a rich biosphere. Its atmosphere and magnetic field protect life from radiation and help regulate surface conditions.',
            'Plate tectonics and ocean-atmosphere cycles drive long-term climate stability. Seasons are created by axial tilt, not distance from the Sun, producing predictable annual shifts in temperature and daylight.'
        ]
    },
    {
        id: 'mars',
        name: 'Mars',
        type: 'Terrestrial Planet',
        radius: 2.9,
        color: 0xd36b46,
        orbitRadius: 74,
        orbitSpeed: 0.0087,
        rotationSpeed: 0.018,
        axialTiltDeg: 25.2,
        zoomDistance: 23,
        stats: {
            mass: '6.42 x 10^23 kg',
            distance: '227.9 million km',
            rotation: '24h 37m',
            orbit: '687 Earth days',
            gravity: '3.71 m/s^2',
            surfaceTemp: '-63 deg C average',
            summerTemp: 'Up to about 20 deg C at equator',
            winterTemp: 'Down to about -125 deg C',
            density: '3.93 g/cm^3'
        },
        description: [
            'Mars is a cold desert planet with a thin carbon dioxide atmosphere and iron-rich dust that gives it a red color. Ancient river valleys and mineral evidence suggest it was wetter in the distant past.',
            'It hosts Olympus Mons and Valles Marineris, some of the largest volcanic and tectonic features in the solar system. Today, Mars remains a top target in the search for past microbial habitability.'
        ]
    },
    {
        id: 'jupiter',
        name: 'Jupiter',
        type: 'Gas Giant',
        radius: 9.6,
        color: 0xd7bb8f,
        orbitRadius: 118,
        orbitSpeed: 0.0045,
        rotationSpeed: 0.04,
        axialTiltDeg: 3.1,
        zoomDistance: 62,
        moons: [
            { name: 'Io', radius: 1.2, color: 0xd9c08d, orbitRadius: 14, orbitSpeed: 0.075, rotationSpeed: 0.018 },
            { name: 'Europa', radius: 1.0, color: 0xd7d9db, orbitRadius: 18, orbitSpeed: 0.061, rotationSpeed: 0.015 },
            { name: 'Ganymede', radius: 1.5, color: 0xb7a894, orbitRadius: 24, orbitSpeed: 0.048, rotationSpeed: 0.012 },
            { name: 'Callisto', radius: 1.4, color: 0x9c9188, orbitRadius: 30, orbitSpeed: 0.039, rotationSpeed: 0.01 }
        ],
        stats: {
            mass: '1.898 x 10^27 kg',
            distance: '778.5 million km',
            rotation: '9h 56m',
            orbit: '11.86 Earth years',
            gravity: '24.79 m/s^2',
            surfaceTemp: '-110 deg C at cloud tops',
            summerTemp: 'About -108 deg C',
            winterTemp: 'About -120 deg C',
            density: '1.33 g/cm^3'
        },
        description: [
            'Jupiter is the largest planet and is mostly hydrogen and helium, with cloud bands shaped by intense winds and deep convection. The Great Red Spot is a giant long-lived storm that has persisted for centuries.',
            'Its magnetic field is extremely strong, and its moon system is like a mini solar system. Europa and Ganymede are especially important because they likely host deep oceans below icy crusts.'
        ]
    },
    {
        id: 'saturn',
        name: 'Saturn',
        type: 'Gas Giant',
        radius: 8.2,
        color: 0xe5d6b8,
        orbitRadius: 154,
        orbitSpeed: 0.0034,
        rotationSpeed: 0.036,
        axialTiltDeg: 26.7,
        zoomDistance: 56,
        rings: {
            innerRadius: 10.2,
            outerRadius: 17.8,
            tiltDeg: 8,
            color: 0xcfb98d
        },
        moons: [
            { name: 'Titan', radius: 1.5, color: 0xdcb479, orbitRadius: 16, orbitSpeed: 0.048, rotationSpeed: 0.012 },
            { name: 'Rhea', radius: 0.9, color: 0xc8c8c1, orbitRadius: 21, orbitSpeed: 0.041, rotationSpeed: 0.011 },
            { name: 'Enceladus', radius: 0.7, color: 0xe1ecf2, orbitRadius: 12, orbitSpeed: 0.064, rotationSpeed: 0.013 }
        ],
        stats: {
            mass: '5.68 x 10^26 kg',
            distance: '1.43 billion km',
            rotation: '10h 33m',
            orbit: '29.45 Earth years',
            gravity: '10.44 m/s^2',
            surfaceTemp: '-140 deg C at cloud tops',
            summerTemp: 'About -130 deg C',
            winterTemp: 'About -160 deg C',
            density: '0.69 g/cm^3'
        },
        description: [
            'Saturn is known for its vast ring system made mostly of water ice, with structures shaped by resonances and moon interactions. The rings are broad but remarkably thin, giving Saturn its signature appearance.',
            'The Saturn system is also rich in compelling moons. Titan has a thick nitrogen atmosphere and methane weather, while Enceladus vents water-rich plumes from a subsurface ocean.'
        ]
    },
    {
        id: 'uranus',
        name: 'Uranus',
        type: 'Ice Giant',
        radius: 6.2,
        color: 0x9ddff0,
        orbitRadius: 194,
        orbitSpeed: 0.0024,
        rotationSpeed: -0.028,
        axialTiltDeg: 97.8,
        zoomDistance: 42,
        stats: {
            mass: '8.68 x 10^25 kg',
            distance: '2.87 billion km',
            rotation: '17h 14m (retrograde)',
            orbit: '84 Earth years',
            gravity: '8.69 m/s^2',
            surfaceTemp: '-195 deg C average',
            summerTemp: 'About -190 deg C',
            winterTemp: 'About -224 deg C',
            density: '1.27 g/cm^3'
        },
        description: [
            'Uranus is an ice giant with methane that gives it a blue-green color. Its interior is thought to include deep layers of water-ammonia-methane fluids above a smaller rocky core.',
            'Its extreme axial tilt makes the planet appear to roll along its orbit and causes long, unusual seasons. One hemisphere can face sunlight for decades while the other spends decades in darkness.'
        ]
    },
    {
        id: 'neptune',
        name: 'Neptune',
        type: 'Ice Giant',
        radius: 6.0,
        color: 0x3f6ee0,
        orbitRadius: 232,
        orbitSpeed: 0.0018,
        rotationSpeed: 0.03,
        axialTiltDeg: 28.3,
        zoomDistance: 40,
        stats: {
            mass: '1.02 x 10^26 kg',
            distance: '4.50 billion km',
            rotation: '16h 6m',
            orbit: '164.8 Earth years',
            gravity: '11.15 m/s^2',
            surfaceTemp: '-200 deg C average',
            summerTemp: 'About -197 deg C',
            winterTemp: 'About -218 deg C',
            density: '1.64 g/cm^3'
        },
        description: [
            'Neptune is the most distant major planet and one of the windiest worlds known. Methane in its upper atmosphere produces the deep blue color seen from afar.',
            'Despite weak sunlight at that distance, Neptune shows active weather powered by internal heat. Dark storms and bright cloud bands appear and fade as the atmosphere evolves over long seasons.'
        ]
    }
];

const bodyRuntimeMap = new Map();
const bodyRuntimes = [];
const moonRuntimes = [];
const selectableMeshes = [];

let sunRuntime = null;
let sunCorona = null;

const state = {
    hasStarted: false,
    isCameraAnimating: false,
    focusedBodyId: null,
    pausedOrbitBodyId: null
};

const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();
let elapsedTime = 0;

const starfield = createMilkyWayStarfield();
const asteroidBelt = createAsteroidBelt();
createSunLight();
createCelestialSystem();

ui.startButton.addEventListener('click', handleStartSimulation);
ui.closePanelButton.addEventListener('click', handleClosePanel);
renderer.domElement.addEventListener('pointerdown', handleScenePointerDown);
window.addEventListener('resize', handleResize);

animate(scene.rotation.y += 0.0002);

function createSunLight() {
    // Strong sunlight
    const sunLight = new THREE.PointLight(0xfff1d6, 14, 4000, 2);
    sunLight.position.set(0, 0, 0);
    sunLight.intensity = 18;
    sunLight.distance = 5000;
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Soft global light (so planets are visible)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    // Sky light (adds realism)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x080820, 0.6);
    scene.add(hemiLight);
}

function createMilkyWayStarfield() {
    const starCount = 36000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    const colorA = new THREE.Color(0xd7e7ff);
    const colorB = new THREE.Color(0xaec2ff);
    const colorC = new THREE.Color(0xffe2bf);
    const tempColor = new THREE.Color();

    for (let i = 0; i < starCount; i += 1) {
        const i3 = i * 3;
        const inDisk = Math.random() < 0.84;
        const radial = inDisk
            ? THREE.MathUtils.randFloat(500, 3900)
            : THREE.MathUtils.randFloat(900, 4600);
        const angle = Math.random() * Math.PI * 2;
        const jitter = inDisk ? 150 : 300;

        positions[i3 + 0] = Math.cos(angle) * radial + THREE.MathUtils.randFloatSpread(jitter);
        positions[i3 + 1] = inDisk
            ? THREE.MathUtils.randFloatSpread(430)
            : THREE.MathUtils.randFloatSpread(2600);
        positions[i3 + 2] = Math.sin(angle) * radial + THREE.MathUtils.randFloatSpread(jitter);

        const colorRoll = Math.random();
        if (colorRoll < 0.58) {
            tempColor.copy(colorA);
        } else if (colorRoll < 0.84) {
            tempColor.copy(colorB);
        } else {
            tempColor.copy(colorC);
        }

        tempColor.multiplyScalar(THREE.MathUtils.randFloat(0.62, 1));
        colors[i3 + 0] = tempColor.r;
        colors[i3 + 1] = tempColor.g;
        colors[i3 + 2] = tempColor.b;
        sizes[i] = inDisk
            ? THREE.MathUtils.randFloat(1, 2.8)
            : THREE.MathUtils.randFloat(1.4, 4.4);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        uniforms: {
            uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
        },
        vertexShader: `
            attribute float aSize;
            varying vec3 vColor;
            uniform float uPixelRatio;

            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                gl_PointSize = aSize * uPixelRatio * (500.0 / -mvPosition.z); 
            }
        `,
        fragmentShader: `
            varying vec3 vColor;

            void main() {
                float d = distance(gl_PointCoord, vec2(0.5));
                float alpha = smoothstep(0.5, 0.0, d);
                float core = smoothstep(0.2, 0.0, d);
                vec3 finalColor = vColor + core * 0.25;
                gl_FragColor = vec4(finalColor, alpha);
            }
        `
    });

    const points = new THREE.Points(geometry, material);
    points.rotation.x = THREE.MathUtils.degToRad(12);
    scene.add(points);

    return { points, material };
}

function createAsteroidBelt() {
    const asteroidGroup = new THREE.Group();
    asteroidGroup.rotation.x = THREE.MathUtils.degToRad(1.4);
    scene.add(asteroidGroup);

    const asteroidCount = 2400;
    const geometry = new THREE.IcosahedronGeometry(0.35, 0);
    const material = new THREE.MeshStandardMaterial({
        color: 0x8f8a86,
        roughness: 0.95,
        metalness: 0.04
    });

    const instanced = new THREE.InstancedMesh(geometry, material, asteroidCount);
    const helper = new THREE.Object3D();

    for (let i = 0; i < asteroidCount; i += 1) {
        const radius = THREE.MathUtils.randFloat(92, 108);
        const angle = Math.random() * Math.PI * 2;
        const y = THREE.MathUtils.randFloatSpread(6.5);
        const size = THREE.MathUtils.randFloat(0.55, 1.9);

        helper.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
        helper.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        helper.scale.setScalar(size);
        helper.updateMatrix();
        instanced.setMatrixAt(i, helper.matrix);
    }

    instanced.instanceMatrix.needsUpdate = true;
    asteroidGroup.add(instanced);
    return asteroidGroup;
}

function createBodyMaterial(body) {
    if (body.isSun) {
        return new THREE.MeshBasicMaterial({ color: body.color });
    }

    const loader = new THREE.TextureLoader();
scene.background = loader.load(
    'https://threejs.org/examples/textures/space.jpg'
);

    const textureMap = {
        earth: './earth.jpg',
        mars: './mars.jpg',
        jupiter: './jupiter.jpg',
        venus: './venus.jpg',
        mercury: './mercury.jpg',
        saturn: './saturn.jpg',
        uranus: './uranus.jpg',
        neptune: './neptune.jpg'
    };

    const id = body.id.toLowerCase();
    const textureUrl = textureMap[id];

    let texture = null;

    if (textureUrl) {
        texture = loader.load(
            textureUrl,
            () => console.log(id + " loaded ✅"),
            undefined,
            () => console.log(id + " failed ❌")
        );
    }

    return new THREE.MeshStandardMaterial({
        map: texture,
        color: texture ? 0xffffff : body.color, // fallback
        roughness: 1,
        metalness: 0
    });
}

function createMoonMaterial(moonData) {
    return new THREE.MeshStandardMaterial({
        map: createMoonTexture(moonData.color),
        color: 0xffffff,
        roughness: 0.93,
        metalness: 0.03
    });
}

function createSunTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(
        size * 0.5,
        size * 0.5,
        size * 0.08,
        size * 0.5,
        size * 0.5,
        size * 0.52
    );
    grad.addColorStop(0, '#fff7be');
    grad.addColorStop(0.35, '#ffd06a');
    grad.addColorStop(0.72, '#ff9740');
    grad.addColorStop(1, '#d14f1d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const rand = createSeededRandom('sun');
    for (let i = 0; i < 140; i += 1) {
        const x = rand() * size;
        const y = rand() * size;
        const radius = 2 + rand() * 10;
        ctx.fillStyle = `rgba(255, ${Math.floor(120 + rand() * 80)}, ${Math.floor(30 + rand() * 30)}, ${0.22 + rand() * 0.3})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    return finalizeCanvasTexture(canvas, false);
}

function createMoonTexture(baseColorHex) {
    const width = 256;
    const height = 128;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const rand = createSeededRandom(`moon-${baseColorHex}`);

    const base = new THREE.Color(baseColorHex);
    const hsl = {};
    base.getHSL(hsl);
    const dark = new THREE.Color().setHSL(hsl.h, hsl.s * 0.65, Math.max(0.2, hsl.l * 0.62));
    const light = new THREE.Color().setHSL(hsl.h, hsl.s * 0.3, Math.min(0.94, hsl.l + 0.15));

    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, light.getStyle());
    bg.addColorStop(1, dark.getStyle());
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 90; i += 1) {
        const r = 1 + rand() * 7;
        const x = rand() * width;
        const y = rand() * height;
        ctx.fillStyle = `rgba(40, 40, 40, ${0.08 + rand() * 0.16})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    return finalizeCanvasTexture(canvas);
}

function createPlanetSurfaceTexture(bodyId, fallbackColorHex) {
    const width = 768;
    const height = 384;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const rand = createSeededRandom(bodyId);

    ctx.fillStyle = new THREE.Color(fallbackColorHex).getStyle();
    ctx.fillRect(0, 0, width, height);

    switch (bodyId) {
    case 'mercury':
        paintMercuryTexture(ctx, width, height, rand);
        break;
    case 'venus':
        paintVenusTexture(ctx, width, height, rand);
        break;
    case 'earth':
        paintEarthTexture(ctx, width, height, rand);
        break;
    case 'mars':
        paintMarsTexture(ctx, width, height, rand);
        break;
    case 'jupiter':
        paintJupiterTexture(ctx, width, height, rand);
        break;
    case 'saturn':
        paintSaturnTexture(ctx, width, height, rand);
        break;
    case 'uranus':
        paintUranusTexture(ctx, width, height, rand);
        break;
    case 'neptune':
        paintNeptuneTexture(ctx, width, height, rand);
        break;
    default:
        break;
    }

    addSubtleGrain(ctx, width, height, rand, 0.055);
    return finalizeCanvasTexture(canvas);
}

function paintMercuryTexture(ctx, width, height, rand) {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#b4aba3');
    grad.addColorStop(0.5, '#8f8881');
    grad.addColorStop(1, '#6e6762');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 220; i += 1) {
        const r = 2 + rand() * 16;
        const x = rand() * width;
        const y = rand() * height;
        ctx.fillStyle = `rgba(35, 35, 35, ${0.09 + rand() * 0.15})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(205, 205, 205, ${0.06 + rand() * 0.1})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.65, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function paintVenusTexture(ctx, width, height, rand) {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#f6dfbe');
    grad.addColorStop(0.5, '#e8bf8a');
    grad.addColorStop(1, '#c99666');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    for (let y = 0; y < height; y += 6) {
        const alpha = 0.14 + rand() * 0.16;
        ctx.fillStyle = `rgba(255, 239, 205, ${alpha})`;
        const wave = Math.sin((y / height) * Math.PI * 10 + rand() * 2) * 18;
        ctx.fillRect(wave, y, width + 30, 4 + rand() * 3);
    }

    for (let i = 0; i < 90; i += 1) {
        ctx.fillStyle = `rgba(124, 78, 43, ${0.04 + rand() * 0.12})`;
        ctx.beginPath();
        ctx.ellipse(rand() * width, rand() * height, 20 + rand() * 80, 5 + rand() * 20, rand() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }
}

function paintEarthTexture(ctx, width, height, rand) {
    const ocean = ctx.createLinearGradient(0, 0, width, height);
    ocean.addColorStop(0, '#4194ff');
    ocean.addColorStop(0.5, '#2f7dff');
    ocean.addColorStop(1, '#1b4dbd');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, width, height);

    const landColors = ['#5f8e4d', '#436f3a', '#809e53', '#93764f'];
    for (let i = 0; i < 36; i += 1) {
        const x = rand() * width;
        const y = rand() * height;
        const rx = 18 + rand() * 70;
        const ry = 10 + rand() * 45;
        const angle = rand() * Math.PI;
        ctx.fillStyle = landColors[Math.floor(rand() * landColors.length)];
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
        ctx.fill();
    }

    for (let i = 0; i < 65; i += 1) {
        ctx.fillStyle = `rgba(240, 250, 255, ${0.15 + rand() * 0.25})`;
        ctx.beginPath();
        ctx.ellipse(rand() * width, rand() * height, 20 + rand() * 110, 4 + rand() * 18, rand() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }
}

function paintMarsTexture(ctx, width, height, rand) {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#da7a50');
    grad.addColorStop(0.55, '#bd5f3c');
    grad.addColorStop(1, '#8b3c24');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 140; i += 1) {
        ctx.fillStyle = `rgba(82, 35, 24, ${0.08 + rand() * 0.15})`;
        ctx.beginPath();
        ctx.ellipse(rand() * width, rand() * height, 8 + rand() * 45, 4 + rand() * 20, rand() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = 'rgba(245, 214, 190, 0.45)';
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.07, width * 0.17, height * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
}

function paintJupiterTexture(ctx, width, height, rand) {
    const palette = ['#e2c9a7', '#d2ad86', '#edd9bd', '#bf916a', '#f0e0c9', '#aa7952'];
    for (let y = 0; y < height; y += 9) {
        const bandHeight = 6 + rand() * 10;
        ctx.fillStyle = palette[Math.floor(rand() * palette.length)];
        ctx.fillRect(-16, y, width + 32, bandHeight);
    }

    for (let i = 0; i < 180; i += 1) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.03 + rand() * 0.08})`;
        ctx.beginPath();
        ctx.ellipse(rand() * width, rand() * height, 20 + rand() * 120, 3 + rand() * 10, rand() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = 'rgba(186, 82, 52, 0.85)';
    ctx.beginPath();
    ctx.ellipse(width * 0.68, height * 0.55, width * 0.12, height * 0.08, THREE.MathUtils.degToRad(-8), 0, Math.PI * 2);
    ctx.fill();
}

function paintSaturnTexture(ctx, width, height, rand) {
    const palette = ['#eee1c8', '#dfcfad', '#ceb88f', '#f4e7d0', '#c8b08a'];
    for (let y = 0; y < height; y += 8) {
        const bandHeight = 5 + rand() * 8;
        ctx.fillStyle = palette[Math.floor(rand() * palette.length)];
        ctx.fillRect(0, y, width, bandHeight);
    }

    for (let i = 0; i < 90; i += 1) {
        ctx.fillStyle = `rgba(98, 80, 55, ${0.03 + rand() * 0.08})`;
        ctx.fillRect(0, rand() * height, width, 1 + rand() * 2);
    }
}

function paintUranusTexture(ctx, width, height, rand) {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#b2ebf7');
    grad.addColorStop(0.55, '#95dff0');
    grad.addColorStop(1, '#7bc7de');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 40; i += 1) {
        ctx.fillStyle = `rgba(235, 255, 255, ${0.03 + rand() * 0.06})`;
        ctx.fillRect(0, rand() * height, width, 1 + rand() * 2);
    }
}

function paintNeptuneTexture(ctx, width, height, rand) {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#6f96ff');
    grad.addColorStop(0.55, '#4d76e1');
    grad.addColorStop(1, '#2f4fb2');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 80; i += 1) {
        ctx.fillStyle = `rgba(185, 211, 255, ${0.04 + rand() * 0.08})`;
        ctx.fillRect(0, rand() * height, width, 1 + rand() * 3);
    }

    ctx.fillStyle = 'rgba(220, 238, 255, 0.35)';
    for (let i = 0; i < 8; i += 1) {
        ctx.beginPath();
        ctx.ellipse(rand() * width, rand() * height, 14 + rand() * 38, 4 + rand() * 12, rand() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }
}

function addSubtleGrain(ctx, width, height, rand, opacity = 0.08) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const offset = (rand() - 0.5) * 255 * opacity;
        data[i + 0] = clampChannel(data[i + 0] + offset);
        data[i + 1] = clampChannel(data[i + 1] + offset);
        data[i + 2] = clampChannel(data[i + 2] + offset);
    }

    ctx.putImageData(imageData, 0, 0);
}

function clampChannel(value) {
    return Math.max(0, Math.min(255, value));
}

function createSeededRandom(seedText) {
    let seed = 0;
    for (let i = 0; i < seedText.length; i += 1) {
        seed = ((seed << 5) - seed + seedText.charCodeAt(i)) | 0;
    }

    return () => {
        seed |= 0;
        seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function finalizeCanvasTexture(canvas, wrapHorizontally = true) {
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = wrapHorizontally ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
}

function createCelestialSystem() {
    CELESTIAL_BODIES.forEach((body) => {
        const orbitPivot = new THREE.Object3D();
        scene.add(orbitPivot);

        const material = createBodyMaterial(body);

        const segments = body.isSun ? 80 : 64;
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(body.radius, segments, segments),
            material
        );

        // 📍 Position & tilt
        mesh.position.x = body.orbitRadius;
        mesh.rotation.z = THREE.MathUtils.degToRad(body.axialTiltDeg);

        // ✅ SHADOW ENABLED HERE
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        mesh.userData.bodyId = body.id;
        orbitPivot.add(mesh);

        if (body.id === 'earth') {
    const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(body.radius * 1.05, 64, 64),
        new THREE.MeshBasicMaterial({
            color: 0x4da6ff,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending
        })
    );

    mesh.add(atmosphere);
}

        // Orbit line
        if (body.orbitRadius > 0) {
            scene.add(createOrbitLine(body.orbitRadius));
        }

        // Rings (Saturn)
        if (body.rings) {
            const ring = new THREE.Mesh(
                new THREE.RingGeometry(body.rings.innerRadius, body.rings.outerRadius, 128),
                new THREE.MeshStandardMaterial({
                    color: body.rings.color,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.78,
                    roughness: 0.9,
                    metalness: 0.08
                })
            );

            ring.rotation.x = Math.PI / 2;
            ring.rotation.z = THREE.MathUtils.degToRad(body.rings.tiltDeg);

            // ✅ OPTIONAL: rings shadow
            ring.receiveShadow = true;

            mesh.add(ring);
        }

        // Moons
        if (Array.isArray(body.moons)) {
            body.moons.forEach((moonData) => {
                const moonPivot = new THREE.Object3D();
                moonPivot.rotation.y = Math.random() * Math.PI * 2;
                mesh.add(moonPivot);

                const moonMesh = new THREE.Mesh(
                    new THREE.SphereGeometry(moonData.radius, 32, 32),
                    createMoonMaterial(moonData)
                );

                moonMesh.position.x = moonData.orbitRadius;

                // ✅ SHADOW FOR MOONS
                moonMesh.castShadow = true;
                moonMesh.receiveShadow = true;

                moonPivot.add(moonMesh);

                moonRuntimes.push({
                    orbitPivot: moonPivot,
                    orbitSpeed: moonData.orbitSpeed,
                    mesh: moonMesh,
                    rotationSpeed: moonData.rotationSpeed
                });
            });
        }

        const runtimeBody = { body, mesh, orbitPivot };
        bodyRuntimeMap.set(body.id, runtimeBody);
        bodyRuntimes.push(runtimeBody);
        selectableMeshes.push(mesh);

        if (body.isSun) {
            sunRuntime = runtimeBody;
            sunCorona = createSunCorona(mesh, body.radius);
        }
    });
}

function createSunCorona(sunMesh, sunRadius) {
    const corona = new THREE.Mesh(
        new THREE.SphereGeometry(sunRadius * 1.2, 64, 64),
        new THREE.MeshBasicMaterial({
        color: 0xffa347,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    })
    );
    sunMesh.add(corona);
    return corona;
}

function createOrbitLine(radius) {
    const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
    const points2D = curve.getPoints(180);
    const points3D = points2D.map((point) => new THREE.Vector3(point.x, 0, point.y));
    const geometry = new THREE.BufferGeometry().setFromPoints(points3D);
    const material = new THREE.LineBasicMaterial({
        color: 0x2b477a,
        transparent: true,
        opacity: 0.35
    });
    return new THREE.LineLoop(geometry, material);
}

function handleStartSimulation() {
    if (state.hasStarted || state.isCameraAnimating) {
        return;
    }

    state.hasStarted = true;
    state.isCameraAnimating = true;
    ui.startButton.disabled = true;

    gsap.to(ui.splash, {
        opacity: 0,
        duration: 0.8,
        ease: 'power1.out',
        onComplete: () => ui.splash.classList.add('is-hidden')
    });

    animateCameraTo(DEFAULT_CAMERA_POSITION, DEFAULT_CAMERA_TARGET, () => {
        controls.enabled = true;
        state.isCameraAnimating = false;
        ui.hint.classList.add('is-visible');

        // 🎬 ADD THIS LINE
        autoTour();
    });
}

function handleScenePointerDown(event) {
    if (!state.hasStarted || state.isCameraAnimating || state.focusedBodyId) {
        return;
    }

    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObjects(selectableMeshes, false);
    if (intersections.length === 0) {
        return;
    }

    const selectedBodyId = intersections[0].object.userData.bodyId;
    const selectedRuntime = bodyRuntimeMap.get(selectedBodyId);
    if (!selectedRuntime) {
        return;
    }

    focusOnBody(selectedRuntime);
}

function focusOnBody(runtimeBody) {
    state.focusedBodyId = runtimeBody.body.id;
    state.pausedOrbitBodyId = runtimeBody.body.isSun ? null : runtimeBody.body.id;
    state.isCameraAnimating = true;
    controls.enabled = false;

    const worldPosition = new THREE.Vector3();
    runtimeBody.mesh.getWorldPosition(worldPosition);

    const lookDirection = camera.position.clone().sub(worldPosition).normalize();
    if (lookDirection.lengthSq() < 0.0001) {
        lookDirection.set(1, 0.35, 1).normalize();
    }

    const targetCameraPosition = worldPosition
        .clone()
        .add(lookDirection.multiplyScalar(runtimeBody.body.zoomDistance));
    targetCameraPosition.y += runtimeBody.body.radius * 0.9;

    animateCameraTo(targetCameraPosition, worldPosition, () => {
        fillFactPanel(runtimeBody.body);
        showFactPanel();
        state.isCameraAnimating = false;
    });
}

function handleClosePanel() {
    if (!state.focusedBodyId || state.isCameraAnimating) {
        return;
    }

    hideFactPanel();
    state.isCameraAnimating = true;

    animateCameraTo(DEFAULT_CAMERA_POSITION, DEFAULT_CAMERA_TARGET, () => {
        state.focusedBodyId = null;
        state.pausedOrbitBodyId = null;
        state.isCameraAnimating = false;
        controls.enabled = true;
    });
}

function animateCameraTo(targetPosition, targetLookAt, onComplete) {
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(controls.target);

    gsap.timeline({
        defaults: {
            duration: CAMERA_TRAVEL_SECONDS,
            ease: 'power2.inOut'
        },
        onComplete
    })
        .to(camera.position, {
            x: targetPosition.x,
            y: targetPosition.y,
            z: targetPosition.z
        }, 0)
        .to(controls.target, {
            x: targetLookAt.x,
            y: targetLookAt.y,
            z: targetLookAt.z
        }, 0);
}

function fillFactPanel(body) {
    ui.factSubtitle.textContent = body.type.toUpperCase();
    ui.factName.textContent = body.name.toUpperCase();

    ui.stats.mass.textContent = body.stats.mass;
    ui.stats.distance.textContent = body.stats.distance;
    ui.stats.rotation.textContent = body.stats.rotation;
    ui.stats.orbit.textContent = body.stats.orbit;
    ui.stats.gravity.textContent = body.stats.gravity;
    ui.stats.surfaceTemp.textContent = body.stats.surfaceTemp;
    ui.stats.summerTemp.textContent = body.stats.summerTemp;
    ui.stats.winterTemp.textContent = body.stats.winterTemp;
    ui.stats.density.textContent = body.stats.density;

    ui.factText.innerHTML = '';
    body.description.forEach((paragraph) => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        ui.factText.appendChild(p);
    });
}

function showFactPanel() {
    ui.factPanel.classList.add('is-visible');
    ui.factPanel.setAttribute('aria-hidden', 'false');
}

function hideFactPanel() {
    ui.factPanel.classList.remove('is-visible');
    ui.factPanel.setAttribute('aria-hidden', 'true');
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    elapsedTime += delta;
    const scaledStep = delta * 60 * SYSTEM_SPEED_SCALE;

    starfield.points.rotation.y += 0.000018 * scaledStep;
    starfield.points.rotation.z += 0.000009 * scaledStep;

    asteroidBelt.rotation.y += 0.00075 * scaledStep;
    asteroidBelt.rotation.z = Math.sin(elapsedTime * 0.08) * 0.012;

    bodyRuntimes.forEach((runtimeBody) => {
        const { body, mesh, orbitPivot } = runtimeBody;

        if (body.orbitRadius > 0 && body.id !== state.pausedOrbitBodyId) {
            orbitPivot.rotation.y += body.orbitSpeed * scaledStep;
        }

        // Keep axial spin active even when a body's revolution is paused.
        mesh.rotation.y += body.rotationSpeed * scaledStep;
    });

    moonRuntimes.forEach((moon) => {
        moon.orbitPivot.rotation.y += moon.orbitSpeed * scaledStep;
        moon.mesh.rotation.y += moon.rotationSpeed * scaledStep;
    });

    if (sunRuntime && sunCorona) {
        const pulse = 1 + Math.sin(elapsedTime * 2.2) * 0.018 + Math.sin(elapsedTime * 7.4) * 0.007;
        sunRuntime.mesh.scale.setScalar(pulse);
        sunCorona.scale.setScalar(1.17 + Math.sin(elapsedTime * 3.5) * 0.03);
    }

    controls.update();
    composer.render();
}

function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    composer.setSize(window.innerWidth, window.innerHeight);
    bloomPass.setSize(window.innerWidth, window.innerHeight);

    starfield.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
}
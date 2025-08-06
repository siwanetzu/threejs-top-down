import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Config
const speed = 0.1;

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

// Camera
const aspect = window.innerWidth / window.innerHeight;
const d = 10;
const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
camera.position.set(10, 10, 10); // Angled isometric view
camera.lookAt(scene.position);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(10, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Floor
const floorGeometry = new THREE.PlaneGeometry(24, 24);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Character
let character;
let mixer;
let actions = {};
let activeAction;
let characterState = 'idle'; // State machine: 'idle', 'run'
const clock = new THREE.Clock();

const loader = new GLTFLoader();
loader.load('assets/Adventurer idle.glb', (gltf) => {
    character = gltf.scene;
    character.scale.set(0.5, 0.5, 0.5);
    character.position.y = 0;
    character.castShadow = true;
    character.traverse(function (node) {
        if (node.isMesh) {
            node.castShadow = true;
        }
    });
    scene.add(character);

    mixer = new THREE.AnimationMixer(character);
    
    const animations = gltf.animations;
    console.log('Available animations:', gltf.animations.map(a => a.name));
    
    const idleClip = THREE.AnimationClip.findByName(animations, 'CharacterArmature|Idle');
    if (idleClip) {
        actions['idle'] = mixer.clipAction(idleClip);
        activeAction = actions['idle'];
        activeAction.play();
    } else {
        console.error("Animation 'Idle' not found in the GLB file.");
    }

    const runClip = THREE.AnimationClip.findByName(animations, 'CharacterArmature|Run');
    if (runClip) {
        actions['run'] = mixer.clipAction(runClip);
    } else {
        // It's possible the run animation is named differently or not present.
        // We will log this but not crash.
        console.warn("Animation 'Run' not found in the GLB file.");
    }
}, undefined, (error) => {
    console.error("Error loading model:", error);
});


let targetPosition = null;
let targetRotation = null;

// Mouse click to move
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isMouseDown = false;
let mouseMoved = false;
window.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return; // Only left-click
    isMouseDown = true;
    mouseMoved = false;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(floor);

    if (intersects.length > 0) {
        targetPosition = intersects[0].point;
        if (character) {
            targetPosition.y = character.position.y; // Keep character on the same plane
        }
    }
});

window.addEventListener('mousemove', (event) => {
    if (isMouseDown) {
        mouseMoved = true;
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(floor);

        if (intersects.length > 0) {
            targetPosition = intersects[0].point;
            if (character) {
                targetPosition.y = character.position.y;
            }
        }
    }
});

window.addEventListener('mouseup', (event) => {
    if (event.button !== 0) return;
    isMouseDown = false;
    if (mouseMoved) {
        targetPosition = null;
    }
});

function setAction(name) {
    if (characterState === name || !actions[name]) {
        return;
    }

    const previousAction = activeAction;
    activeAction = actions[name];

    if (previousAction) {
        previousAction.fadeOut(0.2);
    }

    activeAction
        .reset()
        .setEffectiveTimeScale(1)
        .setEffectiveWeight(1)
        .fadeIn(0.2)
        .play();

    characterState = name;
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (mixer) {
      mixer.update(delta);
  }

  if (character && targetPosition) {
    const distance = character.position.distanceTo(targetPosition);
    if (distance > speed) {
      setAction('run');
      const direction = targetPosition.clone().sub(character.position).normalize();
      character.position.add(direction.multiplyScalar(speed));

      // Rotate character to face direction of movement
      const angle = Math.atan2(direction.x, direction.z);
      targetRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    } else {
      character.position.copy(targetPosition);
      targetPosition = null;
    }
  } else {
      setAction('idle');
  }

  if (character && targetRotation) {
    character.quaternion.slerp(targetRotation, 0.1);
  }

  if (character) {
    const coords = {
      x: Math.round(character.position.x),
      y: Math.round(character.position.z)
    };
    document.getElementById('coordinates').innerText = `x: ${coords.x}, y: ${coords.y}`;

    // Camera follows player
    camera.position.x = character.position.x + 10;
    camera.position.z = character.position.z + 10;
    camera.lookAt(character.position);
  }

  renderer.render(scene, camera);
}

animate();
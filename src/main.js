import * as THREE from 'three';
import { Pathfinding } from './Pathfinding.js';

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

// Grid
const gridHelper = new THREE.GridHelper(24, 24);
scene.add(gridHelper);
// Character
const characterGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const characterMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
const character = new THREE.Mesh(characterGeometry, characterMaterial);
character.position.y = 0.25;
character.castShadow = true;
scene.add(character);

// Pathfinding
const grid = { width: 24, height: 24 }; // Simplified grid representation
const pathfinding = new Pathfinding(grid);
let path = [];
let pathLine = null;

// Mouse click to move
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isMouseDown = false;
let directTarget = null;

window.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    isMouseDown = true;
    if (pathLine) {
        scene.remove(pathLine);
        pathLine = null;
    }
    path = [];
});

window.addEventListener('mousemove', (event) => {
    if (isMouseDown) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(floor);
        if (intersects.length > 0) {
            const clickPoint = intersects[0].point;
            let gridX = Math.floor(clickPoint.x + grid.width / 2);
            let gridY = Math.floor(clickPoint.z + grid.height / 2);

            // Clamp values to the grid boundaries
            gridX = Math.max(0, Math.min(gridX, grid.width - 1));
            gridY = Math.max(0, Math.min(gridY, grid.height - 1));

            directTarget = new THREE.Vector3(gridX - grid.width / 2 + 0.5, 0.25, gridY - grid.height / 2 + 0.5);
        }
    }
});

window.addEventListener('mouseup', (event) => {
    if (event.button !== 0) return;
    isMouseDown = false;

    if (!directTarget) {
        // Handle the case where the mouse is released without moving
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(floor);
        if (intersects.length > 0) {
            directTarget = intersects[0].point;
        }
    }

    if (directTarget) {
        const startX = Math.floor(character.position.x + grid.width / 2);
        const startY = Math.floor(character.position.z + grid.height / 2);
        let endX = Math.floor(directTarget.x + grid.width / 2);
        let endY = Math.floor(directTarget.z + grid.height / 2);

        // Clamp values to the grid boundaries
        endX = Math.max(0, Math.min(endX, grid.width - 1));
        endY = Math.max(0, Math.min(endY, grid.height - 1));

        directTarget = null;

        const newPath = pathfinding.findPath({ x: startX, y: startY }, { x: endX, y: endY });
        if (newPath) {
            path = newPath.map(p => new THREE.Vector3(p.x - grid.width / 2 + 0.5, 0.25, p.y - grid.height / 2 + 0.5));
            if (pathLine) {
                scene.remove(pathLine);
            }
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00FFFF });
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(path);
            pathLine = new THREE.Line(lineGeometry, lineMaterial);
            scene.add(pathLine);
        }
    }
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  const speed = 0.05;

  if (isMouseDown && directTarget) {
    const direction = directTarget.clone().sub(character.position).normalize();
    character.position.add(direction.multiplyScalar(speed));
  } else if (path.length > 0) {
    const targetNode = path[0];
    const direction = targetNode.clone().sub(character.position).normalize();
    character.position.add(direction.multiplyScalar(speed));

    if (character.position.distanceTo(targetNode) < 0.1) {
      path.shift();
      if (path.length === 0 && pathLine) {
        scene.remove(pathLine);
        pathLine = null;
      }
    }
  }

  const coords = {
    x: Math.round(character.position.x),
    y: Math.round(character.position.z)
  };
  document.getElementById('coordinates').innerText = `x: ${coords.x}, y: ${coords.y}`;

  // Camera follows player
  camera.position.x = character.position.x + 10;
  camera.position.z = character.position.z + 10;
  camera.lookAt(character.position);

  renderer.render(scene, camera);
}

animate();
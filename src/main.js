import * as THREE from 'three';
import { Pathfinding } from './Pathfinding.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

// Camera
const aspect = window.innerWidth / window.innerHeight;
const d = 15;
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
const floorGeometry = new THREE.PlaneGeometry(12, 12);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Grid
const gridHelper = new THREE.GridHelper(12, 12);
scene.add(gridHelper);
// Character
const characterGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const characterMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const character = new THREE.Mesh(characterGeometry, characterMaterial);
character.position.y = 0.25;
character.castShadow = true;
scene.add(character);

// Pathfinding
const grid = { width: 12, height: 12 }; // Simplified grid representation
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
            const gridX = Math.floor(clickPoint.x + grid.width / 2);
            const gridY = Math.floor(clickPoint.z + grid.height / 2);
            
            if (gridX >= 0 && gridX < grid.width && gridY >= 0 && gridY < grid.height) {
                directTarget = new THREE.Vector3(gridX - grid.width / 2 + 0.5, 0.25, gridY - grid.height / 2 + 0.5);
            }
        }
    }
});

window.addEventListener('mouseup', (event) => {
    if (event.button !== 0) return;
    isMouseDown = false;

    if (directTarget) {
        const startX = Math.floor(character.position.x + grid.width / 2);
        const startY = Math.floor(character.position.z + grid.height / 2);
        const endX = Math.floor(directTarget.x + grid.width / 2);
        const endY = Math.floor(directTarget.z + grid.height / 2);

        directTarget = null;

        if (endX >= 0 && endX < grid.width && endY >= 0 && endY < grid.height) {
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

  renderer.render(scene, camera);
}

animate();
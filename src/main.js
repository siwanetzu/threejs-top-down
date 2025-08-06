import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Config
const speed = 0.1;
const enemyHitboxScale = 1; // Adjust to make the enemy easier to click

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

// Camera
const aspect = window.innerWidth / window.innerHeight;
const d = 7;
const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
camera.position.set(10, 10, 10); // Angled isometric view
camera.lookAt(scene.position);

// webgl for rendering
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  antialias: true,
  logarithmicDepthBuffer: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

// lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(10, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -15;
directionalLight.shadow.camera.right = 15;
directionalLight.shadow.camera.top = 15;
directionalLight.shadow.camera.bottom = -15;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
scene.add(directionalLight);

// Building floor
const floorGeometry = new THREE.PlaneGeometry(24, 24);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Enemy
let enemy;
let enemyHitbox;
const enemyLoader = new GLTFLoader();
enemyLoader.load('assets/Dummy.glb', (gltf) => {
    enemy = gltf.scene;
    enemy.scale.set(1, 1, 1);
    enemy.position.set(5, 0, 5);
    enemy.castShadow = true;
    enemy.userData = { health: 10 };
    enemy.traverse(function (node) {
        if (node.isMesh) {
            node.castShadow = true;
        }
    });
    scene.add(enemy);

    // Create a larger, invisible hitbox for better click detection
    const enemyBox = new THREE.Box3().setFromObject(enemy);
    const boxSize = enemyBox.getSize(new THREE.Vector3());
    const boxCenter = enemyBox.getCenter(new THREE.Vector3());

    // Make hitbox larger on the horizontal plane
    boxSize.x *= enemyHitboxScale;
    boxSize.z *= enemyHitboxScale;

    const hitboxGeometry = new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z);
    const hitboxMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    enemyHitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
    enemyHitbox.userData.isEnemyHitbox = true;


    // Position the hitbox to be centered on the enemy model
    enemyHitbox.position.copy(enemy.position);
    
    scene.add(enemyHitbox);
});

// Main character
let character;
let mixer;
let actions = {};
let activeAction;
let characterState = 'idle'; // easy state machine for 'idle', 'run'
let isAttacking = false;
let useLeftPunch = true;
let attackQueued = false;
const clock = new THREE.Clock();
const damageNumbers = [];

// Loading the character model from the glb file
const loader = new GLTFLoader();
loader.load('assets/Adventurer.glb', (gltf) => {
    character = gltf.scene;
    character.userData = { damage: 1 };
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

    const leftPunchClip = THREE.AnimationClip.findByName(animations, 'CharacterArmature|Punch_Left');
    if (leftPunchClip) {
        actions['punch_left'] = mixer.clipAction(leftPunchClip);
    } else {
        console.warn("Animation 'Punch_Left' not found in the GLB file.");
    }
    
    const rightPunchClip = THREE.AnimationClip.findByName(animations, 'CharacterArmature|Punch_Right');
    if (rightPunchClip) {
        actions['punch_right'] = mixer.clipAction(rightPunchClip);
    } else {
        console.warn("Animation 'Punch_Right' not found in the GLB file.");
    }
    mixer.addEventListener('finished', e => {
        if (e.action === actions.punch_left || e.action === actions.punch_right) {
            isAttacking = false;
            characterState = 'idle';
            if (target && target.userData.health > 0) {
                target.userData.health -= character.userData.damage;
                showDamageNumber(character.userData.damage, target.position);

                if (target.userData.health <= 0) {
                    scene.remove(target);
                    scene.remove(enemyHitbox);
                    target = null;
                }
            }
        }
    });
}, undefined, (error) => {
    console.error("Error loading model:", error);
});


let targetPosition = null;
let targetRotation = null;
let target = null; // To store the clicked enemy

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
    if (!enemy || !enemyHitbox) return;
    const intersects = raycaster.intersectObjects([enemyHitbox, floor], true);

    if (intersects.length > 0) {
        const intersection = intersects[0];
        
        let isEnemyClicked = false;
        if (intersection.object.userData.isEnemyHitbox) {
            isEnemyClicked = true;
        }

        if (isEnemyClicked) {
            target = enemy;
            targetPosition = null; // Clear movement target
            attackQueued = true; // Queue a single attack
        } else if (intersection.object === floor) {
            target = null; // Clear enemy target
            targetPosition = intersection.point;
            if (character) {
                targetPosition.y = character.position.y; // Keep character on the same plane
            }
        }
    }
});

window.addEventListener('mousemove', (event) => {
    if (isMouseDown && !isAttacking) {
        mouseMoved = true;
        target = null; // Cancel enemy targeting if mouse is dragged
        attackQueued = false; // Also cancel queued attack
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

    activeAction.reset();
    if (name === 'punch_left' || name === 'punch_right') {
        activeAction.setLoop(THREE.LoopOnce);
        activeAction.clampWhenFinished = true;
    }
    activeAction.setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.2).play();

    characterState = name;
}

function faceTarget(target) {
    if (character && target) {
        const direction = target.position.clone().sub(character.position).normalize();
        const angle = Math.atan2(direction.x, direction.z);
        targetRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    }
}

function isCollidingWithEnemy(nextPosition) {
    if (!enemy || !enemyHitbox) return false;

    const enemyBoundingBox = new THREE.Box3().setFromObject(enemyHitbox);
    const characterBoundingBox = new THREE.Box3().setFromObject(character);

    // Predict character's next bounding box
    const nextCharacterBoundingBox = characterBoundingBox.clone();
    const movement = nextPosition.clone().sub(character.position);
    nextCharacterBoundingBox.translate(movement);

    return nextCharacterBoundingBox.intersectsBox(enemyBoundingBox);
}

function showDamageNumber(damage, position) {
    const container = document.getElementById('damage-container');
    if (!container) return;
    const damageElement = document.createElement('div');
    damageElement.textContent = damage;
    damageElement.classList.add('damage-number');
    container.appendChild(damageElement);

    damageNumbers.push({
        element: damageElement,
        position: position.clone(),
        startTime: clock.getElapsedTime()
    });
}

function isInAttackRange() {
    if (!character || !target) return false;

    const attackRangePadding = 1.5;
    const enemyBoundingBox = new THREE.Box3().setFromObject(enemyHitbox);
    const characterBoundingBox = new THREE.Box3().setFromObject(character);

    const attackRangeBox = enemyBoundingBox.clone();
    attackRangeBox.expandByScalar(attackRangePadding);

    return characterBoundingBox.intersectsBox(attackRangeBox);
}
// Animation loop
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (mixer) {
      mixer.update(delta);
  }

  if (character) {
    let movingToEnemy = false;
    let movingToPoint = false;

    // 1. Handle enemy targeting
    if (target) {
        if (isInAttackRange()) {
            faceTarget(target);
            // Attack if mouse is held down OR a single attack was queued
            if (!isAttacking && (attackQueued || isMouseDown)) {
                isAttacking = true;
                attackQueued = false; // Consume the queue
                if (useLeftPunch) {
                    setAction('punch_left');
                } else {
                    setAction('punch_right');
                }
                useLeftPunch = !useLeftPunch;
            }
        } else {
            // Move towards enemy
            movingToEnemy = true;
            const direction = target.position.clone().sub(character.position).normalize();
            const nextPosition = character.position.clone().add(direction.clone().multiplyScalar(speed));
            if (!isCollidingWithEnemy(nextPosition)) {
                character.position.add(direction.multiplyScalar(speed));
            }
            faceTarget(target);
        }
    }
    // 2. Handle movement to a point
    else if (targetPosition) {
        const distance = character.position.distanceTo(targetPosition);
        if (distance > speed) {
            movingToPoint = true;
            const direction = targetPosition.clone().sub(character.position).normalize();
            const nextPosition = character.position.clone().add(direction.clone().multiplyScalar(speed));
            if (!isCollidingWithEnemy(nextPosition)) {
                character.position.add(direction.multiplyScalar(speed));
            }
            const angle = Math.atan2(direction.x, direction.z);
            targetRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        } else {
            character.position.copy(targetPosition);
            targetPosition = null;
        }
    }

    // 3. Set animation state
    if (movingToEnemy || movingToPoint) {
        setAction('run');
    } else if (!isAttacking) {
        setAction('idle');
    }
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

  if (character && enemy) {
    if (character.position.z > enemy.position.z) {
        character.renderOrder = 1;
        enemy.renderOrder = 0;
    } else {
        character.renderOrder = 0;
        enemy.renderOrder = 1;
    }
  }

  const elapsedTime = clock.getElapsedTime();
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
      const damageNumber = damageNumbers[i];
      if (elapsedTime - damageNumber.startTime > 1) {
          damageNumber.element.remove();
          damageNumbers.splice(i, 1);
      } else {
          const screenPosition = damageNumber.position.clone().project(camera);
          damageNumber.element.style.left = `${(screenPosition.x + 1) / 2 * window.innerWidth}px`;
          damageNumber.element.style.top = `${(-screenPosition.y + 1) / 2 * window.innerHeight}px`;
      }
  }

  renderer.render(scene, camera);
}

animate();
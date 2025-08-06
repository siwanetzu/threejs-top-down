import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Config
const speed = 0.1;

// Scene
const scene = new THREE.Scene();
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
  logarithmicDepthBuffer: true,
  alpha: true
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
const enemies = [];
const enemyHitboxes = [];
const enemyColliders = [];

function createEnemy(modelPath, name, position, stats, hitboxScale) {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(modelPath, (gltf) => {
            const newEnemy = gltf.scene;
            newEnemy.scale.set(stats.scale, stats.scale, stats.scale);
            newEnemy.position.copy(position);
            newEnemy.castShadow = true;
            newEnemy.userData = { ...stats, name, aiState: 'idle', lastAttackTime: 0, type: name };
            newEnemy.traverse(function (node) {
                if (node.isMesh) {
                    node.castShadow = true;
                    if (Array.isArray(node.material)) {
                        node.material.forEach(mat => mat.transparent = true);
                    } else {
                        node.material.transparent = true;
                    }
                }
            });
            scene.add(newEnemy);

            const mixer = new THREE.AnimationMixer(newEnemy);
            const animations = gltf.animations;
            console.log(`Available animations for ${name}:`, gltf.animations.map(a => a.name));
            if (name === 'Slime') {
                const anims = {
                    idle: THREE.AnimationClip.findByName(animations, 'Armature|Slime_Idle'),
                    walk: THREE.AnimationClip.findByName(animations, 'Armature|Slime_Walk'),
                    attack: THREE.AnimationClip.findByName(animations, 'Armature|Slime_Attack'),
                    death: THREE.AnimationClip.findByName(animations, 'Armature|Slime_Death')
                };
                newEnemy.userData.actions = {
                    idle: mixer.clipAction(anims.idle),
                    walk: mixer.clipAction(anims.walk),
                    attack: mixer.clipAction(anims.attack),
                    death: mixer.clipAction(anims.death)
                };
                if (newEnemy.userData.actions.attack) {
                    newEnemy.userData.actions.attack.setLoop(THREE.LoopOnce);
                }
                if (newEnemy.userData.actions.death) {
                    newEnemy.userData.actions.death.setLoop(THREE.LoopOnce);
                    newEnemy.userData.actions.death.clampWhenFinished = true;
                }
            } else if (name === 'Dummy') {
                newEnemy.userData.actions = {};
                const idleClip = THREE.AnimationClip.findByName(animations, 'Idle');
                if (idleClip) {
                    newEnemy.userData.actions['idle'] = mixer.clipAction(idleClip);
                }
            }

            if (newEnemy.userData.actions && newEnemy.userData.actions.idle) {
                newEnemy.userData.actions.idle.play();
                newEnemy.userData.activeAction = newEnemy.userData.actions.idle;
            }
            newEnemy.userData.mixer = mixer;

            const enemyBox = new THREE.Box3().setFromObject(newEnemy);
            const hoverBoxSize = enemyBox.getSize(new THREE.Vector3()).multiply(hitboxScale);
            const hitboxGeometry = new THREE.BoxGeometry(hoverBoxSize.x, hoverBoxSize.y, hoverBoxSize.z);
            const hitboxMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
            const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
            hitbox.userData.isEnemyHitbox = true;
            hitbox.userData.enemy = newEnemy;
            hitbox.position.copy(newEnemy.position);
            hitbox.position.y += hoverBoxSize.y / 2;
            scene.add(hitbox);
            
            const colliderBoxSize = enemyBox.getSize(new THREE.Vector3()).multiply(new THREE.Vector3(1, 2, 1));
            const colliderGeometry = new THREE.BoxGeometry(colliderBoxSize.x, colliderBoxSize.y, colliderBoxSize.z);
            const colliderMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
            const collider = new THREE.Mesh(colliderGeometry, colliderMaterial);
            collider.userData.isEnemyCollider = true;
            collider.userData.enemy = newEnemy;
            collider.position.copy(newEnemy.position);
            collider.position.y += colliderBoxSize.y / 2;
            scene.add(collider);

            enemies.push(newEnemy);
            enemyHitboxes.push(hitbox);
            enemyColliders.push(collider);
            resolve();
        }, undefined, reject);
    });
}

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

function loadCharacter() {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load('assets/Adventurer.glb', (gltf) => {
            character = gltf.scene;
            character.userData = { damage: 1, health: 100, maxHealth: 100, mana: 50, maxMana: 50 };
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

            const hitRecieveClip = THREE.AnimationClip.findByName(animations, 'CharacterArmature|HitRecieve');
            if (hitRecieveClip) {
                actions['hit'] = mixer.clipAction(hitRecieveClip);
            } else {
                console.warn("Animation 'CharacterArmature|HitRecieve' not found in the GLB file.");
            }

            mixer.addEventListener('finished', e => {
                if (e.action === actions.punch_left || e.action === actions.punch_right) {
                    isAttacking = false;
                    characterState = 'idle';
                    if (target && target.userData.health > 0) {
                        target.userData.health -= character.userData.damage;
                        showDamageNumber(character.userData.damage, target.position);

                        if (target.userData.health <= 0 && !target.userData.dying) {
                            target.userData.dying = true;
                            setEnemyAction(target, 'death');
                            const hitboxIndex = enemyHitboxes.findIndex(hb => hb.userData.enemy === target);
                            if (hitboxIndex > -1) {
                                scene.remove(enemyHitboxes[hitboxIndex]);
                                enemyHitboxes.splice(hitboxIndex, 1);
                            }
                            const colliderIndex = enemyColliders.findIndex(c => c.userData.enemy === target);
                            if (colliderIndex > -1) {
                                scene.remove(enemyColliders[colliderIndex]);
                                enemyColliders.splice(colliderIndex, 1);
                            }
                            target = null; // Stop targeting the dying enemy
                        }
                    }
                } else if (e.action === actions.hit) {
                    characterState = 'idle';
                }
            });
            resolve();
        }, undefined, reject);
    });
}


let targetPosition = null;
let targetRotation = null;
let target = null; // To store the clicked enemy
let hoveredTarget = null;

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
    if (enemyHitboxes.length === 0) return;
    const intersects = raycaster.intersectObjects([...enemyHitboxes, floor], true);

    if (intersects.length > 0) {
        const intersection = intersects[0];
        
        if (intersection.object.userData.isEnemyHitbox) {
            target = intersection.object.userData.enemy;
            targetPosition = null; // Clear movement target
            attackQueued = true; // Queue a single attack
        } else if (intersection.object === floor) {
            target = null; // Clear enemy target
            attackQueued = false; // Cancel any queued attack
            targetPosition = intersection.point;
            if (character) {
                targetPosition.y = character.position.y; // Keep character on the same plane
            }
        }
    }
});

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    if (isMouseDown && !isAttacking) {
        mouseMoved = true;
        target = null; // Cancel enemy targeting if mouse is dragged
        attackQueued = false; // Also cancel queued attack

        const intersects = raycaster.intersectObject(floor);

        if (intersects.length > 0) {
            targetPosition = intersects[0].point;
            if (character) {
                targetPosition.y = character.position.y;
            }
        }
    } else {
        // Hover detection
        if (enemyHitboxes.length > 0) {
            const intersects = raycaster.intersectObjects([...enemyHitboxes, floor], true);
            
            if (intersects.length > 0 && intersects[0].object.userData.isEnemyHitbox) {
                hoveredTarget = intersects[0].object.userData.enemy;
            } else {
                hoveredTarget = null;
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
    if (name === 'punch_left' || name === 'punch_right' || name === 'hit') {
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

function setEnemyAction(enemy, name) {
    if (!enemy.userData.actions || !enemy.userData.actions[name]) return;
    
    const newAction = enemy.userData.actions[name];
    const previousAction = enemy.userData.activeAction;

    if (previousAction === newAction && newAction.isRunning() && name !== 'attack' && name !== 'death') {
        return;
    }

    if (previousAction) {
        previousAction.fadeOut(0.2);
    }
    
    newAction
        .reset()
        .setEffectiveTimeScale(1)
        .setEffectiveWeight(1)
        .fadeIn(0.2)
        .play();

    enemy.userData.activeAction = newAction;
    enemy.userData.aiState = name;
}

function isCollidingWithEnemy(nextPosition) {
    const characterBoundingBox = new THREE.Box3().setFromObject(character);
    const nextCharacterBoundingBox = characterBoundingBox.clone();
    const movement = nextPosition.clone().sub(character.position);
    nextCharacterBoundingBox.translate(movement);

    for (const hitbox of enemyColliders) {
        // Don't check collision with the dying enemy or the current target
        if (hitbox.userData.enemy.userData.dying || hitbox.userData.enemy === target) {
            continue;
        }

        const enemyBoundingBox = new THREE.Box3().setFromObject(hitbox);
        if (nextCharacterBoundingBox.intersectsBox(enemyBoundingBox)) {
            return true; // Collision detected
        }
    }

    return false; // No collision
}

function showDamageNumber(damage, position) {
    const container = document.getElementById('damage-container');
    if (!container) return;
    const damageElement = document.createElement('div');
    damageElement.textContent = damage;
    damageElement.classList.add('damage-number');
    container.appendChild(damageElement);

    const enemyHeight = new THREE.Box3().setFromObject(target).getSize(new THREE.Vector3()).y;
    const damageNumberOffset = new THREE.Vector3(0, enemyHeight, 0);
    const damageNumberPosition = position.clone().add(damageNumberOffset);

    damageNumbers.push({
        element: damageElement,
        position: damageNumberPosition,
        startTime: clock.getElapsedTime()
    });
}

function isInAttackRange() {
    if (!character || !target) return false;

    const attackRangePadding = 1.5;
    const enemyHitbox = enemyColliders.find(hb => hb.userData.enemy === target);
    if (!enemyHitbox) return false;
    const enemyBoundingBox = new THREE.Box3().setFromObject(enemyHitbox);
    const characterBoundingBox = new THREE.Box3().setFromObject(character);

    const attackRangeBox = enemyBoundingBox.clone();
    attackRangeBox.expandByScalar(attackRangePadding);

    return characterBoundingBox.intersectsBox(attackRangeBox);
}

function updateTargetInfo() {
    const targetInfo = document.getElementById('target-info');
    const currentTarget = target || hoveredTarget;

    if (currentTarget) {
        targetInfo.classList.remove('hidden');
        const targetName = document.getElementById('target-name');
        const targetHealthFill = document.querySelector('#target-health-bar .health-bar-fill');
        
        targetName.textContent = currentTarget.userData.name;
        const healthPercentage = (currentTarget.userData.health / currentTarget.userData.maxHealth) * 100;
        targetHealthFill.style.width = `${healthPercentage}%`;
    } else {
        targetInfo.classList.add('hidden');
    }
}

function updateHealthBars() {
    if (character) {
        const playerHealthFill = document.querySelector('#player-health-bar .health-bar-fill');
        const playerHealthValue = document.getElementById('player-health-value');
        
        const healthPercentage = (character.userData.health / character.userData.maxHealth) * 100;
        playerHealthFill.style.width = `${healthPercentage}%`;
        playerHealthValue.textContent = `${character.userData.health}/${character.userData.maxHealth}`;
    }

    if (character) {
        const playerManaFill = document.querySelector('#player-mana-bar .mana-bar-fill');
        const playerManaValue = document.getElementById('player-mana-value');
        
        const manaPercentage = (character.userData.mana / character.userData.maxMana) * 100;
        playerManaFill.style.width = `${manaPercentage}%`;
        playerManaValue.textContent = `${character.userData.mana}/${character.userData.maxMana}`;
    }
}

async function init() {
    const characterPromise = loadCharacter();
    const slimePromise = createEnemy('assets/Slime.glb', 'Slime', new THREE.Vector3(-5, 0, -5), {
        scale: 0.2,
        health: 5,
        maxHealth: 5,
        damage: 5,
        attackSpeed: 2000, // ms
        chaseRange: 5,
        attackRange: 1.5,
        xp: 10
    }, new THREE.Vector3(4, 10, 4));
    const dummyPromise = createEnemy('assets/Dummy.glb', 'Dummy', new THREE.Vector3(5, 0, 5), {
        scale: 1,
        health: 100,
        maxHealth: 100,
        damage: 0,
        attackSpeed: 0,
        chaseRange: 0,
        attackRange: 0,
        xp: 0
    }, new THREE.Vector3(1, 2, 1));

    try {
        await Promise.all([characterPromise, slimePromise, dummyPromise]);
        console.log("All assets loaded, starting game.");
        animate();
    } catch (error) {
        console.error("Failed to load assets:", error);
    }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (mixer) {
      mixer.update(delta);
  }
  enemies.forEach(enemy => {
    if (enemy.userData.mixer) {
        enemy.userData.mixer.update(delta);
    }
  });

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
            } else if (isMouseDown) {
                attackQueued = true;
            }
        } else if (target) {
            // Move towards enemy only if it's the active target
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
            setAction('idle');
        }
    }

    // 3. Set animation state
    if (movingToEnemy || movingToPoint) {
        setAction('run');
    } else if (!isAttacking) {
        setAction('idle');
    }
}


  // Update enemy hitboxes to follow enemies
  enemyHitboxes.forEach(hitbox => {
    hitbox.position.copy(hitbox.userData.enemy.position);
  });

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

  if (character && enemies.length > 0) {
    enemies.forEach(enemy => {
        if (character.position.z > enemy.position.z) {
            character.renderOrder = 1;
            enemy.renderOrder = 0;
        } else {
            character.renderOrder = 0;
            enemy.renderOrder = 1;
        }
    });
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

  enemies.forEach((enemy, index) => {
    if (enemy.userData.dying) {
        const fadeDuration = 5;
        const elapsedTime = clock.getElapsedTime() - enemy.userData.deathTime;
        if (elapsedTime < fadeDuration) {
            const opacity = 1.0 - (elapsedTime / fadeDuration);
            enemy.traverse(function (node) {
                if (node.isMesh) {
                    if (Array.isArray(node.material)) {
                        node.material.forEach(mat => mat.opacity = opacity);
                    } else {
                        node.material.opacity = opacity;
                    }
                }
            });
        } else {
            scene.remove(enemy);
            scene.remove(enemy.userData.hitbox);
            enemies.splice(index, 1);
            enemyHitboxes.splice(index, 1);
        }
    } else if (character) {
        const distanceToPlayer = character.position.distanceTo(enemy.position);
        const chaseRange = enemy.userData.chaseRange;
        const attackRange = enemy.userData.attackRange;
        const now = Date.now();
        const attackSpeed = enemy.userData.attackSpeed;
        const lastAttackTime = enemy.userData.lastAttackTime;

        if (distanceToPlayer <= attackRange) {
            if (now - lastAttackTime > attackSpeed) {
                setEnemyAction(enemy, 'attack');
                enemy.userData.lastAttackTime = now;
                character.userData.health -= enemy.userData.damage;
                if (character.userData.health > 0) {
                    setAction('hit');
                }
            } else if (enemy.userData.aiState !== 'attack') {
                setEnemyAction(enemy, 'idle');
            }
        } else if (distanceToPlayer <= chaseRange) {
            const direction = character.position.clone().sub(enemy.position).normalize();
            enemy.position.add(direction.multiplyScalar(0.02));
            const angle = Math.atan2(direction.x, direction.z) - Math.PI / 2;
            enemy.quaternion.slerp(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle), 0.1);
            setEnemyAction(enemy, 'walk');
        } else {
            setEnemyAction(enemy, 'idle');
        }
    }
  });

  updateHealthBars();
  updateTargetInfo();
  renderer.render(scene, camera);
}


init();
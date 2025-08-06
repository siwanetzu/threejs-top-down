import * as THREE from 'three';
import { Player } from './Player.js';
import { Slime } from './enemies/Slime.js';
import { Dummy } from './enemies/Dummy.js';
import { UIManager } from './UIManager.js';
import { InputHandler } from './InputHandler.js';

export class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = this._createCamera();
        this.renderer = this._createRenderer();
        this.clock = new THREE.Clock();
        this.uiManager = new UIManager();
        this.player = new Player(this.scene, this.uiManager);
        this.enemies = [];
        this.enemyHitboxes = [];
        this.enemyColliders = [];
        this.inputHandler = new InputHandler(this);
        this.hoveredTarget = null;

        this._setupLighting();
        this._createFloor();
        this.init();
    }

    async init() {
        await this.player.load();
        const slime = new Slime(this.scene, new THREE.Vector3(-5, 0, -5));
        await slime.load();
        this.enemies.push(slime);
        this.enemyHitboxes.push(slime.hitbox);
        this.enemyColliders.push(slime.collider);

        const dummy = new Dummy(this.scene, new THREE.Vector3(5, 0, 5));
        await dummy.load();
        this.enemies.push(dummy);
        this.enemyHitboxes.push(dummy.hitbox);
        this.enemyColliders.push(dummy.collider);

        this.animate();
    }

    _createCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        const d = 7;
        const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
        camera.position.set(10, 10, 10);
        camera.lookAt(this.scene.position);
        return camera;
    }

    _createRenderer() {
        const renderer = new THREE.WebGLRenderer({
            canvas: document.querySelector('#bg'),
            antialias: true,
            logarithmicDepthBuffer: true,
            alpha: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        return renderer;
    }

    _setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -15;
        directionalLight.shadow.camera.right = 15;
        directionalLight.shadow.camera.top = 15;
        directionalLight.shadow.camera.bottom = -15;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        this.scene.add(directionalLight);
    }

    _createFloor() {
        const floorGeometry = new THREE.PlaneGeometry(24, 24);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.receiveShadow = true;
        this.scene.add(this.floor);
    }

    _updateCamera() {
        if (this.player.model) {
            const offset = new THREE.Vector3(0, 10, 10);
            this.camera.position.copy(this.player.model.position).add(offset);
            this.camera.lookAt(this.player.model.position);
        }
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        const delta = this.clock.getDelta();

        this._updateCamera();

        if (this.player.mixer) {
            this.player.mixer.update(delta);
        }

        // Update UI
        this.uiManager.updateHealthBars(this.player.model);
        this.uiManager.updateTargetInfo(this.player.target, this.hoveredTarget);
        this.uiManager.updateDamageNumbers(this.camera);

        // Player Logic
        if (this.player.model && !this.player.isAttacking) {
            if (this.player.target) {
                if (this.player.target.userData.dying || this.player.target.userData.isDead) {
                    this.player.target = null;
                } else {
                    const distance = this.player.model.position.distanceTo(this.player.target.position);
                    if (distance > 1.5) { // chase range
                        const direction = this.player.target.position.clone().sub(this.player.model.position).normalize();
                        this.player.model.position.add(direction.multiplyScalar(0.05));

                        const angle = Math.atan2(direction.x, direction.z);
                    this.player.model.quaternion.slerp(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle), 0.1);
                    this.player.setAction('run');
                    } else {
                        this.player.attack(this.player.target);
                    }
                }
            } else if (this.player.targetPosition) {
                const distance = this.player.model.position.distanceTo(this.player.targetPosition);
                if (distance > 0.1) {
                    const direction = this.player.targetPosition.clone().sub(this.player.model.position).normalize();
                    const moveSpeed = 0.05;
                    const nextPosition = this.player.model.position.clone().add(direction.clone().multiplyScalar(moveSpeed));

                    let canMove = true;
                    for (const enemy of this.enemies) {
                        if (enemy.collider && !enemy.model.userData.dying && !enemy.model.userData.isDead) {
                            const enemyColliderBox = new THREE.Box3().setFromObject(enemy.collider);
                            const playerColliderBox = new THREE.Box3().setFromObject(this.player.model);
                            playerColliderBox.min.add(direction.clone().multiplyScalar(moveSpeed));
                            playerColliderBox.max.add(direction.clone().multiplyScalar(moveSpeed));

                            if (playerColliderBox.intersectsBox(enemyColliderBox)) {
                                canMove = false;
                                break;
                            }
                        }
                    }

                    if (canMove) {
                        this.player.model.position.copy(nextPosition);
                    }

                    const angle = Math.atan2(direction.x, direction.z);
                    this.player.model.quaternion.slerp(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle), 0.1);
                    
                    this.player.setAction('run');
                } else {
                    this.player.targetPosition = null;
                    this.player.setAction('idle');
                }
            } else {
                this.player.setAction('idle');
            }
        }

        // Enemy AI
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy.mixer) {
                enemy.mixer.update(delta);
            }

            if (enemy.model.userData.isDead) {
                this.scene.remove(enemy.model);
                this.scene.remove(enemy.hitbox);
                this.scene.remove(enemy.collider);
                this.enemies.splice(i, 1);
                this.enemyHitboxes.splice(i, 1);
                this.enemyColliders.splice(i, 1);
                continue;
            }

            if (enemy.model.userData.dying) {
                if (enemy.model.userData.deathFinishTime) {
                    const now = performance.now();
                    const timeSinceDeath = now - enemy.model.userData.deathFinishTime;
                    if (timeSinceDeath > 4000) {
                        if (!enemy.model.userData.fadeStarted) {
                            enemy.model.userData.fadeStarted = true;
                            enemy.model.traverse(node => {
                                if (node.isMesh) {
                                    node.castShadow = false;
                                }
                            });
                        }

                        const fadeDuration = 1000;
                        const opacity = 1 - Math.min((timeSinceDeath - 4000) / fadeDuration, 1);
                        enemy.setOpacity(opacity);
                        if (opacity <= 0) {
                            enemy.model.userData.isDead = true;
                        }
                    }
                }
                continue;
            }

            if (enemy.model.userData.health <= 0 && !enemy.model.userData.dying) {
                enemy.model.userData.dying = true;
                enemy.setAction('death');
                if (this.player.target === enemy.model) {
                    this.player.target = null;
                }
            }
            
            if (enemy.model && !enemy.model.userData.dying) {
                const distanceToPlayer = enemy.model.position.distanceTo(this.player.model.position);

                if (distanceToPlayer <= enemy.model.userData.chaseRange) {
                    enemy.model.userData.aiState = 'chasing';
                } else {
                    enemy.model.userData.aiState = 'idle';
                    enemy.setAction('idle');
                }

                if (enemy.model.userData.aiState === 'chasing') {
                    if (distanceToPlayer > enemy.model.userData.attackRange) {
                        const direction = this.player.model.position.clone().sub(enemy.model.position).normalize();
                        enemy.model.position.add(direction.multiplyScalar(enemy.model.userData.mov_speed));
                        
                        let angle = Math.atan2(direction.x, direction.z);
                        if (enemy.name === 'Slime') {
                            angle -= Math.PI / 2;
                        }
                        enemy.model.quaternion.slerp(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle), 0.1);
                        enemy.setAction('walk');
                    } else {
                        enemy.model.userData.aiState = 'attacking';
                    }
                }
                
                if (enemy.model.userData.aiState === 'attacking') {
                    const direction = this.player.model.position.clone().sub(enemy.model.position).normalize();
                    let angle = Math.atan2(direction.x, direction.z);
                    if (enemy.name === 'Slime') {
                        angle -= Math.PI / 2;
                    }
                    enemy.model.quaternion.slerp(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle), 0.1);

                    const time = this.clock.getElapsedTime();
                    if (time - enemy.model.userData.lastAttackTime > enemy.model.userData.attackSpeed / 1000) {
                        enemy.model.userData.lastAttackTime = time;
                        enemy.setAction('attack');
                        this.player.model.userData.health -= enemy.model.userData.damage;
                    } else {
                        enemy.setAction('idle');
                    }
                }
            }
            
            if (enemy.hitbox) {
                const hitboxHeight = enemy.hitbox.geometry.parameters.height;
                enemy.hitbox.position.copy(enemy.model.position);
                enemy.hitbox.position.y = hitboxHeight / 2;
            }
            if (enemy.collider) {
                const colliderHeight = enemy.collider.geometry.parameters.height;
                enemy.collider.position.copy(enemy.model.position);
                enemy.collider.position.y = colliderHeight / 2;
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}
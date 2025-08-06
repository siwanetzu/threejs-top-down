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

    setEnemyAction(enemy, name) {
        if (enemy.model.userData.aiState === name) {
            return;
        }

        const action = enemy.actions[name];
        if (action) {
            if (enemy.activeAction) {
                enemy.activeAction.stop();
            }
            action.play();
            enemy.activeAction = action;
            enemy.model.userData.aiState = name;
        }
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        const delta = this.clock.getDelta();

        this._updateCamera();

        if (this.player.mixer) {
            this.player.mixer.update(delta);
        }
        this.enemies.forEach(enemy => {
            if (enemy.mixer) {
                enemy.mixer.update(delta);
            }
        });

        // Update UI
        this.uiManager.updateHealthBars(this.player.model);
        this.uiManager.updateTargetInfo(this.player.target, this.hoveredTarget);
        this.uiManager.updateDamageNumbers(this.camera);

        // Player Logic
        if (this.player.model && !this.player.isAttacking) {
            if (this.player.target) {
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
            } else if (this.player.targetPosition) {
                const distance = this.player.model.position.distanceTo(this.player.targetPosition);
                if (distance > 0.1) {
                    const direction = this.player.targetPosition.clone().sub(this.player.model.position).normalize();
                    this.player.model.position.add(direction.multiplyScalar(0.05));
                    
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
        this.enemies.forEach((enemy, index) => {
            if (enemy.model && !enemy.model.userData.dying) {
                const distanceToPlayer = enemy.model.position.distanceTo(this.player.model.position);

                if (distanceToPlayer <= enemy.model.userData.chaseRange) {
                    enemy.model.userData.aiState = 'chasing';
                } else {
                    enemy.model.userData.aiState = 'idle';
                    this.setEnemyAction(enemy, 'idle');
                }

                if (enemy.model.userData.aiState === 'chasing') {
                    if (distanceToPlayer > enemy.model.userData.attackRange) {
                        const direction = this.player.model.position.clone().sub(enemy.model.position).normalize();
                        enemy.model.position.add(direction.multiplyScalar(0.05));
                        
                        let angle = Math.atan2(direction.x, direction.z);
                        if (enemy.name === 'Slime') {
                            angle -= Math.PI / 2;
                        }
                        enemy.model.quaternion.slerp(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle), 0.1);
                        this.setEnemyAction(enemy, 'walk');
                    } else {
                        enemy.model.userData.aiState = 'attacking';
                        this.setEnemyAction(enemy, 'idle');
                    }
                }
                
                if (enemy.model.userData.aiState === 'attacking') {
                    const time = this.clock.getElapsedTime();
                    if (time - enemy.model.userData.lastAttackTime > enemy.model.userData.attackSpeed / 1000) {
                        enemy.model.userData.lastAttackTime = time;
                        this.setEnemyAction(enemy, 'attack');
                        this.player.model.userData.health -= enemy.model.userData.damage;
                    }
                }
            }
        });

        this.renderer.render(this.scene, this.camera);
    }
}
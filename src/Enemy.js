import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Enemy {
    constructor(scene, modelPath, name, position, stats, hitboxScale) {
        this.scene = scene;
        this.modelPath = modelPath;
        this.name = name;
        this.position = position;
        this.stats = stats;
        this.hitboxScale = hitboxScale;
        this.model = null;
        this.mixer = null;
        this.actions = {};
        this.activeAction = null;
        this.hitbox = null;
        this.collider = null;
    }

    load() {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.load(this.modelPath, (gltf) => {
                this.model = gltf.scene;
                this.model.scale.set(this.stats.scale, this.stats.scale, this.stats.scale);
                this.model.position.copy(this.position);
                this.model.castShadow = true;
                this.model.userData = { ...this.stats, name: this.name, aiState: 'idle', lastAttackTime: 0, lastMoveTime: 0, type: this.name, actions: {} };
                this.model.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        if (Array.isArray(node.material)) {
                            node.material.forEach(mat => mat.transparent = true);
                        } else {
                            node.material.transparent = true;
                        }
                    }
                });
                this.scene.add(this.model);

                this.mixer = new THREE.AnimationMixer(this.model);
                this.model.userData.mixer = this.mixer;

                this.mixer.addEventListener('finished', (e) => {
                    const clipName = e.action.getClip().name;
                    if (clipName.includes('Attack')) {
                        this.setAction('idle');
                    } else if (clipName.includes('Death')) {
                        this.model.userData.deathFinishTime = performance.now();
                    }
                });

                this._createHitboxes();
                resolve(gltf);
            }, undefined, reject);
        });
    }

    _createHitboxes() {
        const enemyBox = new THREE.Box3().setFromObject(this.model);
        const hoverBoxSize = enemyBox.getSize(new THREE.Vector3()).multiply(this.hitboxScale);
        const hitboxGeometry = new THREE.BoxGeometry(hoverBoxSize.x, hoverBoxSize.y, hoverBoxSize.z);
        const hitboxMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
        this.hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        this.hitbox.userData.isEnemyHitbox = true;
        this.hitbox.userData.enemy = this.model;
        this.hitbox.position.copy(this.model.position);
        this.hitbox.position.y += hoverBoxSize.y / 2;
        this.scene.add(this.hitbox);

        const colliderBoxSize = enemyBox.getSize(new THREE.Vector3()).multiply(new THREE.Vector3(1, 2, 1));
        const colliderGeometry = new THREE.BoxGeometry(colliderBoxSize.x, colliderBoxSize.y, colliderBoxSize.z);
        const colliderMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
        this.collider = new THREE.Mesh(colliderGeometry, colliderMaterial);
        this.collider.userData.isEnemyCollider = true;
        this.collider.userData.enemy = this.model;
        this.collider.position.copy(this.model.position);
        this.collider.position.y += colliderBoxSize.y / 2;
        this.scene.add(this.collider);
    }
    setAction(name) {
        const userData = this.model.userData;
        if (userData.aiState === name) return;

        const action = userData.actions[name];
        if (!action) {
            console.warn(`Action '${name}' not found for ${this.name}`);
            return;
        }

        const previousAction = userData.activeAction;
        userData.activeAction = action;
        userData.aiState = name;

        action.reset();

        if (name === 'attack' || name === 'death') {
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
        } else {
            action.setLoop(THREE.LoopRepeat);
        }
        
        if (previousAction) {
            previousAction.crossFadeTo(action, 0.2, true);
        }
        action.play();
    }

    setOpacity(opacity) {
        this.model.traverse((node) => {
            if (node.isMesh) {
                if (Array.isArray(node.material)) {
                    node.material.forEach(mat => mat.opacity = opacity);
                } else {
                    node.material.opacity = opacity;
                }
            }
        });
    }
}
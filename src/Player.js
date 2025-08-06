import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.model = null;
        this.mixer = null;
        this.actions = {};
        this.activeAction = null;
        this.state = 'idle';
        this.isAttacking = false;
        this.useLeftPunch = true;
        this.attackQueued = false;
    }

    load() {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.load('assets/Adventurer.glb', (gltf) => {
                this.model = gltf.scene;
                this.model.userData = { damage: 1, health: 100, maxHealth: 100, mana: 50, maxMana: 50 };
                this.model.scale.set(0.5, 0.5, 0.5);
                this.model.position.y = 0;
                this.model.castShadow = true;
                this.model.traverse(function (node) {
                    if (node.isMesh) {
                        node.castShadow = true;
                    }
                });
                this.scene.add(this.model);

                this.mixer = new THREE.AnimationMixer(this.model);
                const animations = gltf.animations;
                
                this.actions['idle'] = this.mixer.clipAction(THREE.AnimationClip.findByName(animations, 'CharacterArmature|Idle'));
                this.actions['run'] = this.mixer.clipAction(THREE.AnimationClip.findByName(animations, 'CharacterArmature|Run'));
                this.actions['punch_left'] = this.mixer.clipAction(THREE.AnimationClip.findByName(animations, 'CharacterArmature|Punch_Left'));
                this.actions['punch_right'] = this.mixer.clipAction(THREE.AnimationClip.findByName(animations, 'CharacterArmature|Punch_Right'));
                this.actions['hit'] = this.mixer.clipAction(THREE.AnimationClip.findByName(animations, 'CharacterArmature|HitRecieve'));

                this.activeAction = this.actions['idle'];
                this.activeAction.play();

                resolve();
            }, undefined, reject);
        });
    }

    setAction(name) {
        if (this.activeAction?.name === name) return;
        const action = this.actions[name];
        if (action) {
            this.activeAction.crossFadeTo(action, 0.2, true);
            action.play();
            this.activeAction = action;
        }
    }
}
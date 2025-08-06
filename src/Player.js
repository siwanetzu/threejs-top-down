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
        this.lastAttackTime = 0;
        this.attackSpeed = 1000; // ms
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

                this.mixer.addEventListener('finished', (e) => {
                    const clipName = e.action.getClip().name;
                    if (clipName.includes('Punch')) {
                        this.isAttacking = false;
                        if (this.state !== 'run') {
                            this.setAction('idle');
                        }
                    }
                });

                resolve();
            }, undefined, reject);
        });
    }

    setAction(name) {
        if (this.state === name || !this.actions[name]) {
            return;
        }

        const previousAction = this.activeAction;
        this.activeAction = this.actions[name];
        this.state = name;

        if (previousAction && previousAction !== this.activeAction) {
            previousAction.fadeOut(0.2);
        }

        this.activeAction
            .reset()
            .setEffectiveTimeScale(1)
            .setEffectiveWeight(1)
            .fadeIn(0.2)
            .play();

        if (name.includes('punch')) {
            this.activeAction.setLoop(THREE.LoopOnce);
            this.activeAction.clampWhenFinished = true;
            this.isAttacking = true;
        } else {
            this.activeAction.setLoop(THREE.LoopRepeat);
        }
    }

    attack(target) {
        const now = performance.now();
        if (now - this.lastAttackTime < this.attackSpeed) return;

        this.lastAttackTime = now;
        const attackAction = this.useLeftPunch ? 'punch_left' : 'punch_right';
        this.setAction(attackAction);
        this.useLeftPunch = !this.useLeftPunch;

        if (target && target.userData) {
            target.userData.health -= this.model.userData.damage;
            console.log(`${target.userData.name} health: ${target.userData.health}`);
        }
    }
}
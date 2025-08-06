import { Enemy } from '../Enemy.js';
import * as THREE from 'three';

export class Slime extends Enemy {
    constructor(scene, position) {
        const stats = {
            scale: 0.2,
            health: 5,
            maxHealth: 5,
            damage: 5,
            attackSpeed: 2000,
            chaseRange: 5,
            attackRange: 0.5,
            xp: 10,
            mov_speed: 0.03,
            move_delay: 20
        };
        const hitboxScale = new THREE.Vector3(4, 10, 4);
        super(scene, 'assets/Slime.glb', 'Slime', position, stats, hitboxScale);
    }

    load() {
        return super.load().then((gltf) => {
            this.model.rotation.y = -Math.PI / 2; // Rotate by 90 degrees
            const animations = gltf.animations;
            const anims = {
                idle: THREE.AnimationClip.findByName(animations, 'Armature|Slime_Idle'),
                walk: THREE.AnimationClip.findByName(animations, 'Armature|Slime_Walk'),
                attack: THREE.AnimationClip.findByName(animations, 'Armature|Slime_Attack'),
                death: THREE.AnimationClip.findByName(animations, 'Armature|Slime_Death')
            };
            this.model.userData.actions = {
                idle: this.mixer.clipAction(anims.idle),
                walk: this.mixer.clipAction(anims.walk),
                attack: this.mixer.clipAction(anims.attack),
                death: this.mixer.clipAction(anims.death)
            };
            if (this.model.userData.actions.attack) {
                this.model.userData.actions.attack.setLoop(THREE.LoopOnce);
            }
            if (this.model.userData.actions.death) {
                this.model.userData.actions.death.setLoop(THREE.LoopOnce);
                this.model.userData.actions.death.clampWhenFinished = true;
            }
            if (this.model.userData.actions.idle) {
                this.model.userData.actions.idle.play();
                this.model.userData.activeAction = this.model.userData.actions.idle;
            }
        });
    }
}
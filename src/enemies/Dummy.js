import { Enemy } from '../Enemy.js';
import * as THREE from 'three';

export class Dummy extends Enemy {
    constructor(scene, position) {
        const stats = {
            scale: 1,
            health: 100,
            maxHealth: 100,
            damage: 0,
            attackSpeed: 0,
            chaseRange: 0,
            attackRange: 0,
            xp: 0,
            mov_speed: 0,
            move_delay: 0
        };
        const hitboxScale = new THREE.Vector3(1, 2, 1);
        super(scene, 'assets/Dummy.glb', 'Dummy', position, stats, hitboxScale);
    }

    load() {
        return super.load().then(() => {
            const animations = this.model.animations;
            const idleClip = THREE.AnimationClip.findByName(animations, 'Idle');
            if (idleClip) {
                this.model.userData.actions = {
                    'idle': this.mixer.clipAction(idleClip)
                };
                this.model.userData.actions.idle.play();
                this.model.userData.activeAction = this.model.userData.actions.idle;
            }
        });
    }
}
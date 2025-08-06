import * as THREE from 'three';

export class InputHandler {
    constructor(game) {
        this.game = game;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isMouseDown = false;
        this.mouseMoved = false;

        window.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mouseup', this.onMouseUp.bind(this));
    }

    onMouseDown(event) {
        if (event.button !== 0) return;
        this.isMouseDown = true;
        this.mouseMoved = false;

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.game.camera);
        const intersects = this.raycaster.intersectObjects([...this.game.enemyHitboxes, this.game.floor], true);

        if (intersects.length > 0) {
            const intersection = intersects[0];
            if (intersection.object.userData.isEnemyHitbox) {
                this.game.player.target = intersection.object.userData.enemy;
                this.game.player.targetPosition = null;
                this.game.player.attackQueued = true;
            } else if (intersection.object === this.game.floor) {
                this.game.player.target = null;
                this.game.player.attackQueued = false;
                this.game.player.targetPosition = intersection.point;
                if (this.game.player.model) {
                    this.game.player.targetPosition.y = this.game.player.model.position.y;
                }
            }
        }
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.game.camera);

        if (this.isMouseDown && !this.game.player.isAttacking) {
            this.mouseMoved = true;
            this.game.player.target = null;
            this.game.player.attackQueued = false;

            const intersects = this.raycaster.intersectObject(this.game.floor);
            if (intersects.length > 0) {
                this.game.player.targetPosition = intersects[0].point;
                if (this.game.player.model) {
                    this.game.player.targetPosition.y = this.game.player.model.position.y;
                }
            }
        } else {
            if (this.game.enemyHitboxes.length > 0) {
                const intersects = this.raycaster.intersectObjects([...this.game.enemyHitboxes, this.game.floor], true);
                if (intersects.length > 0 && intersects[0].object.userData.isEnemyHitbox) {
                    this.game.hoveredTarget = intersects[0].object.userData.enemy;
                } else {
                    this.game.hoveredTarget = null;
                }
            }
        }
    }

    onMouseUp(event) {
        if (event.button !== 0) return;
        this.isMouseDown = false;
        if (this.mouseMoved) {
            this.game.player.targetPosition = null;
        }
    }
}
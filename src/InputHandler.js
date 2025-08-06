import * as THREE from 'three';

export class InputHandler {
    constructor(game) {
        this.game = game;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isMouseDown = false;
        this.mouseMoved = false;
        this.isDragging = false;
        this.dragThreshold = 5; // pixels
        this.mouseDownPosition = new THREE.Vector2();

        window.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mouseup', this.onMouseUp.bind(this));
    }

    onMouseDown(event) {
        if (event.button !== 0) return;
        this.isMouseDown = true;
        this.mouseMoved = false;
        this.isDragging = false;
        this.mouseDownPosition.set(event.clientX, event.clientY);

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.game.camera);
        const intersects = this.raycaster.intersectObjects([...this.game.enemyHitboxes, this.game.floor], true);

        if (intersects.length > 0) {
            const intersection = intersects[0];
            if (intersection.object.userData.isEnemyHitbox) {
                const enemy = intersection.object.userData.enemy;
                if (enemy.userData.dying || enemy.userData.isDead) return;
                this.game.player.target = enemy;
                this.game.player.targetPosition = null;
                this.game.player.attackQueued = true;
            }
        }
    }

    onMouseMove(event) {
        if (this.isMouseDown) {
            const currentMousePosition = new THREE.Vector2(event.clientX, event.clientY);
            if (this.mouseDownPosition.distanceTo(currentMousePosition) > this.dragThreshold) {
                this.mouseMoved = true;
                this.isDragging = true;
            }
        }

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.game.camera);

        if (this.isDragging && !this.game.player.isAttacking) {
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
        
        if (!this.mouseMoved) {
            this.raycaster.setFromCamera(this.mouse, this.game.camera);
            const intersects = this.raycaster.intersectObjects([...this.game.enemyHitboxes, this.game.floor], true);

            if (intersects.length > 0) {
                const intersection = intersects[0];
                if (intersection.object.userData.isEnemyHitbox) {
                    const enemy = intersection.object.userData.enemy;
                    if (enemy.userData.dying || enemy.userData.isDead) return;
                    this.game.player.target = enemy;
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
        } else {
            this.game.player.targetPosition = null;
        }

        this.isMouseDown = false;
        this.isDragging = false;
        this.mouseMoved = false;
    }
}
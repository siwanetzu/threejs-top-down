import * as THREE from 'three';

export class UIManager {
    constructor() {
        this.damageNumbers = [];
        this.clock = new THREE.Clock();
    }

    updateHealthBars(character) {
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

    updateTargetInfo(target, hoveredTarget) {
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

    showDamageNumber(damage, position, target) {
        const container = document.getElementById('damage-container');
        if (!container) return;
        const damageElement = document.createElement('div');
        damageElement.textContent = damage;
        damageElement.classList.add('damage-number');
        container.appendChild(damageElement);

        const enemyHeight = new THREE.Box3().setFromObject(target).getSize(new THREE.Vector3()).y;
        const damageNumberOffset = new THREE.Vector3(0, enemyHeight, 0);
        const damageNumberPosition = position.clone().add(damageNumberOffset);

        this.damageNumbers.push({
            element: damageElement,
            position: damageNumberPosition,
            startTime: this.clock.getElapsedTime()
        });
    }

    updateDamageNumbers(camera) {
        const elapsedTime = this.clock.getElapsedTime();
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const damageNumber = this.damageNumbers[i];
            if (elapsedTime - damageNumber.startTime > 1) {
                damageNumber.element.remove();
                this.damageNumbers.splice(i, 1);
            } else {
                const screenPosition = damageNumber.position.clone().project(camera);
                damageNumber.element.style.left = `${(screenPosition.x + 1) / 2 * window.innerWidth}px`;
                damageNumber.element.style.top = `${(-screenPosition.y + 1) / 2 * window.innerHeight}px`;
            }
        }
    }
}
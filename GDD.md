# Technical Game Design Document

## 1. Overview
This document outlines the technical design and future roadmap for our top-down ARPG-style game.

## 2. Core Gameplay Mechanics
### 2.1. Character Movement
- **Control Scheme:** The player controls the character using the mouse.
  - **Click to Move:** The character moves to the clicked location.
  - **Hold to Move:** The character follows the cursor as long as the mouse button is held down.
- **Movement Type:** Free-form, not restricted to a grid.
- **Speed:** Configurable `speed` variable (currently `0.1`).

### 2.2. Camera
- **Style:** Angled, isometric-style view that follows the player.
- **Type:** `THREE.OrthographicCamera`.

### 2.3. UI
- **Coordinate Display:** A real-time display of the player's `x` and `y` coordinates.
- **Health Bars:** Both the player and enemy have UI health bars. The player's is fixed to the bottom of the screen, and the enemy's floats above their head.
- **Damage Numbers:** Floating text appears above the enemy when they take damage.

### 2.4. Combat
- **Targeting:** Left-clicking an enemy targets them.
- **Attacking:** The character automatically runs to a targeted enemy and attacks when in range. The player can click repeatedly or hold the mouse button to continue attacking.
- **Health & Damage:** Characters have health and damage properties. Successful attacks reduce health.

## 3. Technical Implementation
### 3.1. Rendering
- **Library:** `three.js`
- **Environment:** `vite` provides the development server and build tooling.

### 3.2. Pathfinding
- **Algorithm:** None. Movement is direct.
- **Implementation:** The movement logic is handled directly in `src/main.js`.

## 4. Future Roadmap
This section is for planning future features.

### 4.1. Character
- [x] Replace the placeholder cube with a 3D model.
- [x] Implement character animations (idle, run, attack).
- [x] Add character stats (health, damage).
- [x] Add more character stats (mana).

### 4.2. Combat
- [x] Implement basic attack functionality.
- [x] Add enemies with simple AI (e.g., follow and attack).
- [x] Introduce a health and damage system.

### 4.3. Environment
- [ ] Add obstacles to the grid that the pathfinding algorithm must navigate around.
- [ ] Implement different types of terrain.
- [ ] Add decorative elements to the scene.

### 4.4. UI
- [x] Create a user interface to display character information (Health).
- [x] Add mana/resource bars.
- [ ] Add a main menu and pause screen.

### 4.5. RPG Elements
- [ ] **Character Stats:**
  - [ ] HP Regeneration
  - [ ] MP Regeneration
  - [ ] Defense Ratio
  - [ ] Poison Resistance
  - [ ] Physical Absorption
  - [ ] Magic Absorption
  - [ ] Accuracy
  - [ ] Dodge Chance
- [ ] **Skills & Abilities:**
  - [ ] Implement a skill tree or ability system.
  - [ ] Design and implement various active and passive skills.
- [ ] **Inventory & Equipment:**
  - [ ] Create an inventory system for managing items.
  - [ ] Implement equippable items that modify character stats.
- [ ] **Experience & Leveling:**
  - [ ] Grant experience points for defeating enemies.
  - [ ] Implement a leveling system that improves character stats and unlocks new abilities.
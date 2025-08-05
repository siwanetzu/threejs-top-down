# Technical Game Design Document

## 1. Overview
This document outlines the technical design and future roadmap for our top-down ARPG-style game.

## 2. Core Gameplay Mechanics
### 2.1. Character Movement
- **Control Scheme:** The player controls the character using the mouse.
  - **Hold Left Mouse Button:** The character moves continuously towards the grid cell under the cursor.
  - **Release Left Mouse Button:** The character calculates an A* path to the final cursor position and moves there.
- **Movement Type:** 8-directional, grid-based movement.
- **Speed:** Configurable `speed` variable (currently `0.1`).

### 2.2. Camera
- **Style:** Angled, isometric-style view that follows the player.
- **Type:** `THREE.OrthographicCamera`.

### 2.3. UI
- **Coordinate Display:** A real-time display of the player's `x` and `y` coordinates.

## 3. Technical Implementation
### 3.1. Rendering
- **Library:** `three.js`
- **Environment:** `vite` provides the development server and build tooling.

### 3.2. Pathfinding
- **Algorithm:** A*
- **Implementation:** The `Pathfinding` class in `src/Pathfinding.js` handles all pathfinding logic.
- **Features:**
  - 8-directional movement.
  - Grid-based calculation.
  - Diagonal distance heuristic for optimal pathing.

## 4. Future Roadmap
This section is for planning future features.

### 4.1. Character
- [ ] Replace the placeholder cube with a 3D model.
- [ ] Implement character animations (idle, run, attack).
- [ ] Add character stats (health, mana, etc.).

### 4.2. Combat
- [ ] Implement basic attack functionality.
- [ ] Add enemies with simple AI (e.g., follow and attack).
- [ ] Introduce a health and damage system.

### 4.3. Environment
- [ ] Add obstacles to the grid that the pathfinding algorithm must navigate around.
- [ ] Implement different types of terrain.
- [ ] Add decorative elements to the scene.

### 4.4. UI
- [ ] Create a user interface to display character information.
- [ ] Add a main menu and pause screen.
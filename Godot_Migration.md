# Migration Plan: Three.js to Godot 4.4.1

This document outlines the architecture and step-by-step process for migrating the top-down RPG from Three.js to Godot 4.4.1.

## 1. Core Concepts & Architecture

The migration will involve translating the core JavaScript classes and logic into Godot's node-based architecture and GDScript.

| Three.js Concept | Godot Equivalent | Notes |
|---|---|---|
| `Game.js` | Main Scene (`Main.tscn`) with a root `Node3D` and a `Game.gd` script. | The `Game.gd` script will manage the game state, enemy spawning, and player interactions. |
| `Player.js` | `Player.tscn` scene with a `CharacterBody3D` root node. | The player scene will contain the 3D model, a `CollisionShape3D`, and a `Player.gd` script for movement and combat logic. |
| `Enemy.js` | `Enemy.tscn` scene with a `CharacterBody3D` root node. | Similar to the player, each enemy type will have its own scene and script (`Slime.gd`, `Dummy.gd`). |
| `UIManager.js` | Godot's Control nodes (e.g., `CanvasLayer`, `Label`, `TextureProgressBar`). | The UI will be rebuilt using Godot's UI system, likely in a separate `UI.tscn` scene. |
| `InputHandler.js` | Godot's `_input()` function and Input Map. | User input will be managed through Godot's built-in input handling system. |
| `main.js` | The main scene (`Main.tscn`) will be the entry point of the game. | Godot handles the main loop automatically. |

## 2. Step-by-Step Migration Plan

### Phase 1: Project Setup & Asset Import

1.  **Create Godot Project:**
    *   Create a new project in Godot 4.4.1.
    *   Set up the project structure (e.g., `scenes/`, `scripts/`, `assets/`).

2.  **Import Assets:**
    *   Copy the `.glb` files (`Adventurer.glb`, `Slime.glb`, `Dummy.glb`) and textures (`grass.jpg`) into the `assets/` folder.
    *   Godot will automatically import the models. Verify that the materials and animations are imported correctly.

### Phase 2: Player Implementation

1.  **Create Player Scene:**
    *   Create a new scene `Player.tscn` with a `CharacterBody3D` as the root.
    *   Add the `Adventurer.glb` model as a child of the `CharacterBody3D`.
    *   Add a `CollisionShape3D` and configure its shape to match the player model.
    *   Add an `AnimationPlayer` node to manage animations.

2.  **Implement Player Logic (`Player.gd`):**
    *   Create a `Player.gd` script and attach it to the `CharacterBody3D`.
    *   Implement player movement (click-to-move) using `NavigationServer3D`.
    *   Implement player stats (health, mana, etc.) as exported variables.
    *   Implement the attack logic, including switching between `punch_left` and `punch_right` animations.
    *   Connect animation finished signals to reset the attack state.

### Phase 3: Enemy Implementation

1.  **Create Enemy Scene:**
    *   Create a base `Enemy.tscn` scene with a `CharacterBody3D` root.
    *   Add a `CollisionShape3D` and an `AnimationPlayer`.
    *   Create inherited scenes for each enemy type (e.g., `Slime.tscn`, `Dummy.tscn`).
    *   Add the respective `.glb` models to the inherited scenes.

2.  **Implement Enemy AI (`Enemy.gd`, `Slime.gd`):**
    *   Create a base `Enemy.gd` script with common logic (stats, taking damage, death).
    *   Create specific scripts for each enemy (e.g., `Slime.gd`) that inherit from `Enemy.gd`.
    *   Implement the AI state machine (idle, chasing, attacking) using an `enum`.
    *   Use `NavigationServer3D` for pathfinding towards the player.
    *   Implement the attack logic and death sequence (including fading out).

### Phase 4: Game World & UI

1.  **Create Main Scene (`Main.tscn`):**
    *   Create a `Main.tscn` with a `Node3D` root.
    *   Add a `NavigationRegion3D` and a `NavigationMesh` for pathfinding.
    *   Create a floor plane and apply the grass texture.
    *   Add lighting (`DirectionalLight3D`, `WorldEnvironment`).
    *   Add an instance of `Player.tscn`.

2.  **Implement Game Logic (`Game.gd`):**
    *   Attach a `Game.gd` script to the root node of `Main.tscn`.
    *   Implement enemy spawning logic.
    *   Manage player targeting and interaction with enemies.

3.  **Create UI Scene (`UI.tscn`):**
    *   Create a `UI.tscn` with a `CanvasLayer` root.
    *   Add `Control` nodes for health bars, mana bars, target info, and damage numbers.
    *   Use `TextureProgressBar` for health and mana bars.
    *   Create a script `UI.gd` to manage the UI elements.
    *   Implement the logic for showing and updating damage numbers.

### Phase 5: Final Integration & Polish

1.  **Connect Everything:**
    *   Use signals to communicate between nodes (e.g., enemy taking damage, player health changing).
    *   Instance the `UI.tscn` in `Main.tscn`.
    *   Refine the camera movement to follow the player.

2.  **Refine and Polish:**
    *   Adjust gameplay values (damage, health, speed, etc.).
    *   Add sound effects and music.
    *   Test thoroughly and fix any bugs.

## 3. Asset and Code Mapping

| Three.js File | Godot Scene/Script |
|---|---|
| `src/main.js` | `Main.tscn` |
| `src/Game.js` | `Game.gd` |
| `src/Player.js` | `Player.tscn`, `Player.gd` |
| `src/Enemy.js` | `Enemy.tscn`, `Enemy.gd` |
| `src/enemies/Slime.js` | `Slime.tscn`, `Slime.gd` |
| `src/enemies/Dummy.js` | `Dummy.tscn`, `Dummy.gd` |
| `src/UIManager.js` | `UI.tscn`, `UI.gd` |
| `src/InputHandler.js` | `Game.gd` (using `_input`) |
| `assets/Adventurer.glb` | `assets/Adventurer.glb` |
| `assets/Slime.glb` | `assets/Slime.glb` |
| `assets/Dummy.glb` | `assets/Dummy.glb` |
| `assets/grass.jpg` | `assets/grass.jpg` |
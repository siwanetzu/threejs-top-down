# Asset and Code Mapping for Godot Migration

This document provides a mapping of assets and code from the original Three.js project to their counterparts in the Godot project. This is intended to be used for knowledge extraction and implementation in the Godot environment.

## Mapping

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

## Code Implementation Details

This section provides a detailed breakdown of each JavaScript file from the original project. The information is intended to guide the re-implementation of the game's logic and features in GDScript and the Godot engine.

### `src/main.js` -> `Main.tscn` (Entry Point)

*   **Purpose:** This is the entry point of the application. It initializes the main `Game` class, which orchestrates the entire application.
*   **Godot Equivalent:** The functionality of this file is equivalent to Godot's main scene, which is set in the project settings. The `Main.tscn` will contain the root node and the attached `Game.gd` script, which will start the game.

### `src/Game.js` -> `Game.gd`

*   **Purpose:** This is the central class that manages the game's state, objects, and main loop.
*   **Key Responsibilities:**
    *   **Scene Setup:** Initializes the Three.js scene, camera (orthographic), renderer, and lighting (ambient and directional).
    *   **Object Management:** Creates and manages instances of the `Player`, `Enemies` (`Slime`, `Dummy`), `UIManager`, and `InputHandler`. It stores enemies in an array and manages their hitboxes and colliders.
    *   **Game Loop (`animate`):** Contains the main game loop, which updates the camera, player, enemies, and UI on each frame.
    *   **Player Logic:** Handles player movement towards a target position or enemy, including chasing and initiating attacks. It also manages player state transitions (e.g., 'run', 'idle').
    *   **Enemy AI:** Implements the core AI logic for all enemies. This includes a state machine (`idle`, `chasing`, `attacking`), pathfinding towards the player, and managing attack cooldowns. It also handles enemy death, including a fade-out effect.
    *   **Collision:** Checks for collisions between the player and enemies to prevent movement through them.
*   **Godot Equivalent (`Game.gd`):**
    *   This script will be attached to the root node of the `Main.tscn`.
    *   It will be responsible for instantiating the `Player.tscn` and `Enemy.tscn` scenes.
    *   The `_process(delta)` function will contain the game loop logic.
    *   It will manage a collection of enemy nodes and handle game-wide logic like enemy spawning.

### `src/Player.js` -> `Player.tscn` & `Player.gd`

*   **Purpose:** Encapsulates all logic and data related to the player character.
*   **Key Responsibilities:**
    *   **Model Loading:** Loads the `Adventurer.glb` 3D model using `GLTFLoader`.
    *   **Stats:** Initializes and stores the player's stats (health, mana, damage) in the `model.userData` object.
    *   **Animation:** Manages the player's animations (`idle`, `run`, `punch_left`, `punch_right`, `hit`) using `THREE.AnimationMixer`. It includes logic for transitioning between animations.
    *   **Combat:** Implements the `attack` method, which includes an attack cooldown, alternating punch animations, and dealing damage to the target.
    *   **State Management:** Tracks the player's state (e.g., `isAttacking`) to prevent conflicting actions.
*   **Godot Equivalent (`Player.tscn`, `Player.gd`):**
    *   `Player.tscn` will be a `CharacterBody3D` scene containing the player's 3D model, a `CollisionShape3D`, and an `AnimationPlayer`.
    *   `Player.gd` will be attached to the root `CharacterBody3D` node.
    *   It will define exported variables for player stats.
    *   It will handle player movement, animation control, and combat logic.

### `src/Enemy.js` -> `Enemy.tscn` & `Enemy.gd` (Base Class)

*   **Purpose:** A base class for all enemy types, defining common properties and methods.
*   **Key Responsibilities:**
    *   **Model Loading:** Loads the enemy's 3D model.
    *   **Stats:** Initializes the enemy's stats from a configuration object.
    *   **Hitboxes:** Creates invisible `hitbox` and `collider` meshes for interaction and collision detection.
    *   **Animation:** Sets up the `AnimationMixer` and handles animation state changes.
    *   **Opacity:** Includes a method to set the opacity of the model, used for the death fade-out effect.
*   **Godot Equivalent (`Enemy.tscn`, `Enemy.gd`):**
    *   `Enemy.tscn` will be a base scene for all enemies, likely with a `CharacterBody3D` root.
    *   `Enemy.gd` will be a base script that other enemy scripts will inherit from. It will contain common logic for health, taking damage, and death.

### `src/enemies/Slime.js` -> `Slime.tscn` & `Slime.gd`

*   **Purpose:** A specific enemy type that inherits from the base `Enemy` class.
*   **Key Responsibilities:**
    *   **Configuration:** Defines the specific stats for the Slime (health, damage, speed, etc.) and the path to its 3D model (`Slime.glb`).
    *   **Animation Setup:** Loads and configures the Slime's unique animations (`Idle`, `Walk`, `Attack`, `Death`).
*   **Godot Equivalent (`Slime.tscn`, `Slime.gd`):**
    *   `Slime.tscn` will be an inherited scene from `Enemy.tscn`, with the `Slime.glb` model.
    *   `Slime.gd` will extend `Enemy.gd` and can be used to implement any unique behaviors for the Slime.

### `src/enemies/Dummy.js` -> `Dummy.tscn` & `Dummy.gd`

*   **Purpose:** A simple, non-attacking enemy for testing purposes.
*   **Key Responsibilities:**
    *   **Configuration:** Defines the stats for the Dummy, which has no attack or movement capabilities.
    *   **Animation Setup:** Sets up a simple `Idle` animation.
*   **Godot Equivalent (`Dummy.tscn`, `Dummy.gd`):**
    *   `Dummy.tscn` will be an inherited scene from `Enemy.tscn`, with the `Dummy.glb` model.
    *   `Dummy.gd` will extend `Enemy.gd`.

### `src/UIManager.js` -> `UI.tscn` & `UI.gd`

*   **Purpose:** Manages all interactions with the HTML/CSS-based UI.
*   **Key Responsibilities:**
    *   **Health/Mana Bars:** Updates the player's health and mana bars based on their current stats.
    *   **Target Info:** Displays information about the currently targeted or hovered enemy, including their name and health.
    *   **Damage Numbers:** Creates and manages floating damage numbers that appear above characters when they take damage. These numbers are positioned in 3D space and fade out over time.
*   **Godot Equivalent (`UI.tscn`, `UI.gd`):**
    *   `UI.tscn` will be a scene built using Godot's `Control` nodes (e.g., `CanvasLayer`, `TextureProgressBar`, `Label`).
    *   `UI.gd` will be attached to the root of the UI scene and will contain functions to update the UI elements. It will likely use signals to receive updates from the game world.

### `src/InputHandler.js` -> `Game.gd` (Input Handling)

*   **Purpose:** Centralizes all user input handling.
*   **Key Responsibilities:**
    *   **Mouse Events:** Listens for `mousedown`, `mousemove`, and `mouseup` events.
    *   **Raycasting:** Uses a `THREE.Raycaster` to determine what the user is clicking on in the 3D world (the floor or an enemy).
    *   **Click vs. Drag:** Differentiates between a single click (for targeting/attacking) and a drag (for movement) by using a `dragThreshold`.
    *   **State Updates:** Updates the `player.target` and `player.targetPosition` based on user input, which then drives the player's actions in the `Game.js` loop.
*   **Godot Equivalent (`Game.gd`):**
    *   Input handling in Godot is typically done within the `_input(event)` or `_unhandled_input(event)` functions. This logic can be placed directly in `Game.gd` or a dedicated input handling script.
    *   It will use Godot's raycasting capabilities (`PhysicsRayQueryParameters3D`) to detect clicks on the floor or enemies.
    *   Godot's `Input` singleton will be used to manage mouse events.


# Technical Development Roadmap

This document outlines the completed milestones and the future development plan for the project.

## Completed Milestones

### Version 2.0.1
- **Fixed: Distinguishing "Click" vs. "Drag"**
  - The `InputHandler` was refined to more accurately differentiate between a single click action (for targeting or point-and-click movement) and a mouse drag action (for continuous movement).
  - This was achieved by implementing a `dragThreshold`, which measures the pixel distance the cursor moves between `mousedown` and `mouseup` events. If the distance exceeds the threshold, the action is considered a drag, preventing an attack from being queued unintentionally when the player intends to move.

### Version 2.0.0
- **Changed: Modular, Class-Based Architecture**
  - The entire codebase was refactored from a single-file or script-based approach into a modular, object-oriented structure. This established the core architectural pattern for the game.
  - **`Game.js`**: Acts as the central orchestrator, managing the main game loop (`animate`), scene setup, camera, lighting, and the instantiation of other core modules. It also holds the collections of `enemies` and their colliders.
  - **`Player.js`**: Encapsulates all player-specific logic, including loading the 3D model (`Adventurer.glb`), managing animations (idle, run, punch), handling state (`isAttacking`), and defining combat logic (`attack` method).
  - **`Enemy.js`**: A base class for all enemy types, handling common functionality like model loading, animation management, stat initialization, and the creation of `hitbox` and `collider` objects for interaction.
  - **`UIManager.js`**: Manages all interactions with the HTML/CSS-based user interface. This includes updating health/mana bars, displaying target information, and rendering floating damage numbers in the 3D space.
  - **`InputHandler.js`**: Centralizes all user input handling (mouse clicks and movement). It uses a `Raycaster` to determine interactions with the game world (floor, enemies) and communicates the player's intent (e.g., `targetPosition`, `target`) to the `Game` and `Player` classes.

### Version 1.3.0
- **Added: "Slime" Enemy & Multi-Enemy System**
  - A new `Slime.js` class was created, inheriting from the base `Enemy` class. This introduced a second, distinct enemy type with its own 3D model and stats.
  - The `Game.js` class was updated to manage an array of enemies (`this.enemies`), allowing for multiple, independent enemies to exist and be processed in the game loop.
- **Changed: AI and Targeting for Multiple Enemies**
  - The player's targeting system was updated to handle a collection of potential targets. The `InputHandler` now intersects with an array of `enemyHitboxes`.
  - The enemy AI loop in `Game.js` iterates through all active enemies, updating their state, movement, and attacks independently.

### Version 1.2.0
- **Added: Core Gameplay Mechanics**
  - **3D Animated Player Model:** The player is now represented by the `Adventurer.glb` model with multiple animations managed by a `THREE.AnimationMixer` in `Player.js`.
  - **Basic Combat System:**
    - **Click-to-Target/Attack:** `InputHandler` detects clicks on enemy hitboxes, setting the `player.target`.
    - **Auto-Move:** If the player has a target but is out of range, the `Game.js` loop implements a chase behavior, moving the player towards the target until they are within attack range.
  - **Health, Damage, and Mana Systems:** The `Player` and `Enemy` classes now have `userData` objects storing core stats like `health`, `maxHealth`, `mana`, `maxMana`, and `damage`. These values are used in combat calculations.
  - **"Dummy" Enemy Model:** The initial `Dummy.js` enemy was created as a basic combat target.
  - **UI for Health/Mana & Damage Numbers:** `UIManager.js` was created to bridge the gap between game state and the HTML UI. It updates the player's health/mana bars and renders floating damage numbers at the target's position when an attack lands.
  - **Basic Enemy AI (Chase/Attack):** The `Game.js` loop contains the initial AI logic. Enemies have a `chaseRange` and `attackRange`. They remain idle until the player enters their chase range, then move towards the player. If the player is within attack range, the enemy enters an `attacking` state.
- **Changed:** The combat logic was improved to be more state-driven (e.g., `isAttacking` flag to prevent action interruption).

### Version 1.1.0
- **Changed: Free-Form "Hold-to-Move"**
  - The movement system was fundamentally changed. The `InputHandler` now detects if the mouse is being held down and dragged.
  - If dragging, it continuously raycasts against the floor mesh to get a `targetPosition`. The `Game.js` loop then moves the player model towards this position each frame, creating smooth, free-form movement.
- **Removed: A* Pathfinding and Grid**
  - With the move to a free-form system, the underlying grid, the `A*` pathfinding algorithm, and any related visual grid representations were removed from the project.

### Version 1.0.0
- **Added: Initial Project Foundation**
  - **Project Setup:** The project was initialized using Vite, providing a modern build setup and development server. `Three.js` was integrated as the core 3D rendering library.
  - **Top-Down Orthographic Camera:** A non-perspective `OrthographicCamera` was configured and positioned to create the classic top-down view.
  - **Basic Scene:** The initial scene was set up with `AmbientLight` and `DirectionalLight` for illumination, a basic `PlaneGeometry` for the floor, and a simple cube or placeholder for the character.
  - **A* Pathfinding and Grid-Based Movement:** The first version of movement was based on a discrete grid. An A* pathfinding algorithm was implemented to calculate the path from the player's current position to a clicked destination tile.

---

## Future Development Plan

### Phase 1: Core RPG Foundation
*Goal: Establish the fundamental RPG mechanics and player progression loop.*
- **[ ] Player Data & Persistence:**
    - Create a `PlayerData` class or module to manage all player-related data (stats, level, xp, inventory).
    - Implement a basic save/load system using `localStorage` to persist player progress between sessions.
- **[ ] Core Stat System Implementation:**
    - Integrate the six core stats (STR, VIT, DEX, INT, MAG, AGI) into the `Player`'s data structure.
    - Refactor `Player.js` to calculate derived stats (Max HP, Max MP, Damage, etc.) based on the core stats and formulas from the GDD.
    - Update the UI to display the new calculated health and mana values.
- **[ ] Experience & Leveling:**
    - Add `xp` values to enemies (already in the design, just need to use it).
    - Implement a function in `Game.js` to award XP to the player upon enemy death.
    - Create a leveling-up mechanism in `Player.js` that checks XP thresholds, increments the player's level, and awards stat points.
- **[ ] UI - Character Sheet:**
    - Design and create the HTML/CSS for a character sheet panel that can be toggled.
    - Update `UIManager.js` to display the player's core stats, derived stats, level, and available stat points.
    - Implement functionality for the player to allocate their stat points via buttons on the character sheet.
- **[ ] Basic Loot & Inventory System:**
    - Define simple `lootTable`s for existing enemies (`Slime`, `Dummy`).
    - Implement logic in `Game.js` for an enemy to drop an item upon death.
    - Create a basic inventory data structure in the `PlayerData` module.
    - Implement a simple grid-based inventory UI panel to display icons of looted items.

### Phase 2: Skill & Crafting Implementation
*Goal: Introduce character progression through skills and crafting.*
- **[ ] Use-Based Skill System:** Implement the backend for the skill progression system based on the defined formulas.
- **[ ] Initial Skills:**
    - **Combat:** Implement `Hand Attack` and one weapon skill (e.g., `Short Sword`).
    - **Utility:** Implement `Mining` and `Manufacturing`.
- **[ ] Environmental Resources:** Add resource nodes to the world (e.g., rocks for mining).
- **[ ] Crafting Stations:** Add static crafting stations (e.g., an anvil for manufacturing).
- **[ ] UI - Skills Panel:** Expand the Character Sheet or create a new panel to display skill levels.

### Phase 3: Content Expansion & Equipment
*Goal: Broaden the game world with more variety and player choices.*
- **[ ] Equipment System:**
    - Implement equippable items (weapons, shields, armor).
    - Items should modify character stats and potentially appearance.
- **[ ] Modular Enemy & Stat Expansion:**
    - Refactor the `Enemy` class to easily support expanded stats from the GDD (e.g., resistances, special abilities, factions).
    - Introduce new enemy types that utilize these new stats.
- **[ ] Full Skill Implementation:** Implement the remaining combat, magic, and utility skills.
- **[ ] Spell & Rune System:**
    - Implement the backend for the spellbook.
    - Create the rune combination system for casting spells.
    - Design and implement a set of initial runes and spell effects.
- **[ ] Environment & World Building:**
    - Design and implement a larger, more complex main world map.
    - Add environmental obstacles and decorative elements (trees, rocks, etc.).
    - Implement enemy spawn zones.
- **[ ] UI - Tooltips & Spellbook:**
    - Implement tooltips for items, skills, and UI elements.
    - Design and create the UI for the spellbook and rune combination interface.

### Phase 4: Populating the World
*Goal: Make the world feel alive and interactive.*
- **[ ] NPCs & Quests:**
    - Implement a basic NPC interaction system.
    - Create a simple quest system (e.g., fetch quests, kill quests).
    - Add a few initial NPCs and quests to the world.
- **[ ] Shops & Economy:**
    - Design and implement shop scenes/interfaces.
    - Create a basic economy with item buy/sell values.
- **[ ] Multiple Maps:** Implement the system for transitioning between different maps (e.g., world map to town, town to shop).

### Phase 5: Advanced Systems & Polish
*Goal: Add depth, replayability, and a higher level of polish.*
- **[ ] Advanced AI:** Implement more complex AI behaviors like flanking, fleeing, or using special abilities.
- **[ ] Boss Encounters:** Design and implement multi-phase boss fights with unique mechanics.
- **[ ] Advanced Quests:** Introduce more complex, multi-stage quests.
- **[ ] Item Upgrading:**
    - Implement a system for upgrading or enchanting equipment (e.g., using crafting materials at an anvil).
- **[ ] Player Housing:**
    - A long-term goal to implement a personal, customizable space for the player.
- **[ ] Game Menus:** Add a main menu, pause screen, and options menu (e.g., for sound and graphics).
- **[ ] Audio:** Integrate sound effects for combat and UI, and add background music.
- **[ ] Game Polish:** Focus on bug fixing, performance optimization, and overall user experience improvements.


# Technical Development Roadmap

This document outlines the completed milestones and the future development plan for the project.

## Completed Milestones

### Version 2.0.1
- **Fixed:** Corrected a bug with the click-to-move functionality to better distinguish between "click" and "drag" actions.

### Version 2.0.0
- **Changed:** Major refactor to a modular, class-based architecture (`Game`, `Player`, `Enemy`, `UIManager`, `InputHandler`).

### Version 1.3.0
- **Added:** "Slime" enemy and a multi-enemy management system.
- **Changed:** Updated AI and targeting for multiple enemies.

### Version 1.2.0
- **Added:**
  - 3D animated player model.
  - Basic combat system (click-to-target/attack, auto-move).
  - Health, damage, and mana systems.
  - "Dummy" enemy model.
  - UI for health/mana bars and floating damage numbers.
  - Basic enemy AI (chase/attack).
- **Changed:** Improved combat logic and UI styling.
- **Fixed:** Numerous bugs related to movement, state, and targeting.

### Version 1.1.0
- **Changed:** Replaced grid-based movement with free-form, "hold-to-move" functionality.
- **Removed:** A* pathfinding and visual grid.

### Version 1.0.0
- **Added:**
  - Initial project setup (Vite, Three.js).
  - Top-down orthographic camera.
  - Basic lighting, floor, and character representation.
  - A* pathfinding and grid-based movement.

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
- **[ ] More Enemy Variety:** Introduce new enemy types with different AI, stats, and abilities (e.g., ranged attackers, magic users).
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
- **[ ] Game Menus:** Add a main menu, pause screen, and options menu (e.g., for sound and graphics).
- **[ ] Audio:** Integrate sound effects for combat and UI, and add background music.
- **[ ] Game Polish:** Focus on bug fixing, performance optimization, and overall user experience improvements.

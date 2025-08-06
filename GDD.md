# Technical Game Design Document

## 1. Overview
This document outlines the technical design and future roadmap for our top-down ARPG-style game.

## 2. Core Gameplay Mechanics
### 2.1. Character Movement
- **Control Scheme:** The player controls the character using the mouse. A distinction is made between a "click" and a "drag" based on a small pixel threshold to ensure input is handled intuitively.
  - **Click to Move:** A single, stationary click sets a destination for the character to move to.
  - **Hold to Move:** Holding the mouse button down and dragging the cursor will have the character continuously follow the cursor. Releasing the button stops the movement.
- **Movement Type:** Free-form, not restricted to a grid.
- **Collision:** The player character has a collider that prevents them from walking through enemies.

### 2.2. Camera
- **Style:** Angled, isometric-style view that follows the player.
- **Type:** `THREE.OrthographicCamera`.

### 2.3. UI
- **Player Stats:**
  - A fixed UI element at the bottom of the screen displays the player's health and mana bars, along with numerical values.
- **Target Information:**
  - When hovering over or targeting an enemy, a UI element appears at the top of the screen showing the enemy's name and health bar.
- **Floating Damage Numbers:**
  - When an entity takes damage, a number indicating the damage amount floats up from their position and fades out.

### 2.4. Combat
- **Targeting:**
  - Left-clicking an enemy targets them for attack.
  - Hovering over an enemy displays their information without targeting.
- **Attacking:**
  - The character automatically runs to a targeted enemy and attacks when in range (1.5 units).
  - The player can click repeatedly or hold the mouse button to continue attacking.
  - The player has a base attack speed of 1 attack per second.
  - The player alternates between a left and right punch animation for attacks.
- **Health & Damage:**
  - The player and enemies have health and damage properties. Successful attacks reduce health.
  - When an enemy's health reaches zero, it enters a "dying" state.

### 2.5. Enemies
- **General:**
  - Enemies are managed through a base `Enemy` class with specific implementations for each type.
  - Each enemy has a `hitbox` for mouse interaction and a `collider` for physics interaction.
- **AI:**
  - Enemies have a simple state-based AI (`idle`, `chasing`, `attacking`).
  - They will chase the player if they are within a specific `chaseRange`.
  - They will attack the player if they are within their `attackRange`.
- **Death Sequence:**
  - When an enemy's health is depleted, it plays a death animation.
  - After the animation, the enemy's body remains for a few seconds before fading out and being removed from the game.
- **Types:**
  - **Dummy:** A non-hostile target with high health and no attack capabilities.
  - **Slime:** A hostile enemy that will chase and attack the player.

## 3. Technical Implementation
### 3.1. Rendering
- **Library:** `three.js`
- **Environment:** `vite` provides the development server and build tooling.
- **Lighting:** The scene uses a combination of ambient and directional lighting.
- **Shadows:** Dynamic shadows are enabled for the player, enemies, and environment.

### 3.2. Architecture
- **Modular Design:** The game is built on a modular, class-based architecture.
  - `Game.js`: Manages the core game loop, scene, and entity updates.
  - `Player.js`: Encapsulates all player-specific logic, including stats, animations, and combat.
  - `Enemy.js`: A base class for all enemies, handling loading, animations, and core AI logic.
    - `Slime.js` / `Dummy.js`: Extend the `Enemy` class to define specific stats and behaviors.
  - `UIManager.js`: Handles all DOM interactions and UI updates.
  - `InputHandler.js`: Manages all player input, distinguishing between clicks and drags.

### 3.3. Enemy Design
- **Modular Stats:** The `Enemy` class is designed to be modular. New enemy types can be created by extending the base class and providing a unique set of stats.
- **Current Stats:**
  - `scale`: The size of the model.
  - `health` / `maxHealth`: The enemy's hit points.
  - `damage`: The amount of damage the enemy deals.
  - `attackSpeed`: The delay between enemy attacks in milliseconds.
  - `chaseRange`: The distance at which an enemy will start chasing the player.
  - `attackRange`: The distance at which an enemy will stop chasing and start attacking.
  - `xp`: The amount of experience points awarded for defeating the enemy.
  - `mov_speed`: The enemy's movement speed.
  - `move_delay`: A delay used in the AI to create staggered movement.
- **Future Expansion:** The stat object can be easily expanded to include more complex attributes for advanced AI and combat mechanics:
  - `resistances`: (e.g., `{ physical: 0.1, fire: 0.5 }`)
  - `specialAbilities`: (e.g., `['poison_attack', 'heal']`)
  - `lootTable`: An array of potential item drops.
  - `faction`: For creating complex AI interactions between different enemy types.

### 3.4. World Design
- **Map System:** The game will support multiple maps/scenes. A system will be implemented to handle transitions between them (e.g., entering a house, moving to a new zone).
- **NPCs:** Non-Player Characters will be added to the world. They can serve various purposes, such as providing quests, acting as vendors, or delivering lore.
- **Enemy Spawn Zones:** Instead of fixed enemy placements, designated spawn zones will be created to dynamically spawn and respawn enemies within a defined area.
- **Environment:** The world will be populated with decorative elements like trees, rocks, and buildings to create a more immersive experience.
- **Shops:** Specific scenes or areas will be designated as shops where players can buy and sell items.

## 4. RPG Systems
### 4.1. Character Stats
- **Strength (STR):** Affects physical power.
  - **Max Load:** `(5 * STR) + (5 * Level)`
  - **Attack Speed:** Higher STR enables faster attack speeds.
  - **Damage Bonus:** `+2%` physical damage for every 10 STR.
  - **Max Stamina (SP):** `(2 * STR) + (2 * Level)`
- **Vitality (VIT):** Affects life force and resilience.
  - **Max Health (HP):** `(3 * VIT) + (2 * Level) + (STR / 2)`
  - **HP Regeneration:** Directly proportional to VIT.
  - **Defense Ratio:** Increases physical defense for each point over 50 VIT.
- **Dexterity (DEX):** Affects agility and precision.
  - **Defense Rating:** Increases evasion from physical attacks.
  - **Attack Success (To Hit):** `Weapon Skill + (DEX - 50)` if DEX > 50.
  - **Hit Probability:** `(ToHitValue / TargetDefensiveValue) * 50`, capped between 10% and 90%.
- **Intelligence (INT):** Affects mental acuity, primarily for mages.
  - **Spell Learning:** Enables learning higher circle magic.
  - **Spell Casting Probability:** Increases success rate of casting spells.
  - **Max Mana (MP):** Contributes to `Max.MP`.
- **Magic (MAG):** Affects magical ability.
  - **Max Mana (MP):** `(2 * MAG) + (2 * Level) + (INT / 2)`
  - **Mana Regeneration:** Directly proportional to MAG.
  - **Magical Attack Success:** Increases chance to hit with magical attacks.
  - **Damage Bonus:** `+3%` magical damage for every 10 MAG.
  - **Magic Resistance:** `MagicResistanceSkill + (MAG - 50)` if MAG > 50.
- **Agility (AGI):** Affects character's appeal and influence (and ranged prowess).
  - **Ranged Damage Bonus:** `+2%` ranged damage for every 10 AGI.
  - **Dodge Chance:** `+1%` dodge chance for every 30 AGI.

### 4.2. Skills & Abilities
#### Skill Categories and Requirements
There are two main categories of skills: **Combat/Magic** and **Utility**. A character can have a maximum combined total of 700% in combat/magic skills and 400% in utility skills.

#### Combat/Magic Skills
- **Hand Attack:** Requires 50 STR. Trained by attacking with bare hands.
- **Archery:** Requires 50 DEX. Trained by shooting monsters with a bow.
- **Short Sword:** Requires 50 DEX. Trained by using short sword-class weapons.
- **Long Sword:** Requires 50 DEX. Trained by using long sword-class weapons.
- **Fencing:** Requires 50 DEX. Trained by using fencing-class weapons.
- **Axe:** Requires 50 DEX. Trained by using axe-class weapons.
- **Hammer:** Requires 50 DEX. Trained by using hammer-class weapons.
- **Shield:** Requires 50 DEX. Trained by successfully blocking attacks with a shield.
- **Magic:** Requires 50 MAG. Trained by successfully casting spells.
- **Staff Attack:** Requires 50 MAG. Trained by hitting monsters with a staff.
- **Magic Resistance:** Requires 50 VIT. Improved by getting hit by magical attacks.
- **Poison Resistance:** Requires 50 VIT. Trained by being hit by poison.
- **Pretend Corpse:** Requires 50 INT. Trained by using the skill from the skill window.

#### Utility Skills
- **Mining:** Requires 50 STR. Trained by mining rocks with a pickaxe.
- **Manufacturing:** Requires 50 STR. Trained by crafting items on an anvil.
- **Fishing:** Requires 50 DEX. Trained by fishing with a rod.
- **Farming:** Requires 50 INT. Trained by planting and harvesting seeds.
- **Alchemy:** Requires 50 INT. Trained by crafting potions.
- **Taming:** Requires 50 AGI. Trained by taming monsters.
- **Skinning:** Requires 50 INT. Trained by skinning monster corpses.

#### Skill Improvement Formulas
The rate at which a skill improves is non-linear and becomes progressively more difficult.
- **For skill levels 1-50%:**
  - `RequiredActions = CurrentSkill% + 2`
  - *Example: To go from 33% to 34%, you need `33 + 2 = 35` successful actions.*
- **For skill levels 51-100%:**
  - `RequiredActions = ((CurrentSkill% + 1)^2) / 10`
  - *Example: To go from 80% to 81%, you need `(81^2) / 10 = 656.1`, rounded to 657 successful actions.*

### 4.3. Character and Item Attributes
- **HP Regeneration:** Restores health over time.
- **MP Regeneration:** Restores mana over time.
- **Defense Ratio:** Reduces incoming physical damage.
- **Poison Resistance:** Reduces damage and duration of poison effects.
- **Physical Absorption:** Absorbs a percentage of incoming physical damage.
- **Magic Absorption:** Absorbs a percentage of incoming magical damage.
- **Accuracy:** Increases the chance to hit with attacks.
- **Dodge Chance:** Increases the chance to evade incoming attacks.

### 4.4. Magic System
- **Spellbook:** Players will have a spellbook to manage and select their learned spells.
- **Runes:** Spells are not learned directly but are cast by combining different runes. Discovering rune combinations will be a key part of magical progression.

## 5. Technical Development Roadmap
For a detailed breakdown of completed milestones and the phased development plan, please see the [Technical Development Roadmap](roadmap.md).
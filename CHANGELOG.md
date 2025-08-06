# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2025-08-06

### Changed
- Replaced grid-based movement with free-form movement. The character now moves directly towards the cursor's position on the ground plane.
- Implemented "hold-to-move" functionality, where the character continuously follows the cursor while the left mouse button is held down.

### Removed
- Removed the A* pathfinding system (`Pathfinding.js`) as it is no longer needed for free-form movement.
- Removed the visual grid helper from the scene.

## [1.0.0] - 2025-08-04

### Added
- Initial project setup with Vite and Three.js.
- Top-down orthographic camera.
- Ambient and directional lighting for the scene.
- A 6x6 grid floor.
- A character represented by a red cube, placed at the center.
- Mouse-click to set a movement destination.
- A* pathfinding for character movement.
- 8-directional movement for pathfinding.
- A light aqua blue line to visualize the calculated path.
- Continuous "click-and-drag" movement.
- A coordinate display for the player's position.
- A player-following camera.

### Changed
- Camera view changed to an angled, isometric-style perspective.
- Floor color changed to green.
- Expanded the grid and game logic to support a 24x24 area.
- Refined continuous movement to always snap to the grid.
- Character color changed to blue.
- Movement speed increased to 0.1 and refactored to a global variable.

### Fixed
- Corrected a bug in the A* pathfinding algorithm that caused movement to fail occasionally.
- Addressed an issue where the character would not adhere to the grid during continuous movement.
- Fixed a bug where single-clicking would not register movement.
- Corrected the A* heuristic to ensure the most optimal path is always chosen.
- Fixed a bug where clicking on the edge of the grid would not register movement.
- Fixed a critical bug that caused a white screen on startup.
- Refined the "click" vs. "drag" logic to be more intuitive.
- Enforced strict grid-based movement and stopping for all movement types.
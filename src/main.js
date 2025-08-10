import { Game } from './Game.js';

const game = new Game();
// The rest of the game logic will be moved to the Game class and other modules.

import { allSkills } from './skills.js';

allSkills.forEach(skill => {
    console.log(skill.describe());
});
// this will log the description of each skill to the console.
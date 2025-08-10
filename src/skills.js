// skills.js
import { Skill } from './Skill.js';

export const fireball = new Skill ({
    name: "Fireball",
    type: "Spell",
    damage: 30,
    castTime: 1.5,
    manaCost: 20,
    castDifficulty: 10,
    icon: "https://example.com/icons/fireball.png",
    description: "A fiery projectile that explodes on impact, dealing damage to enemies in a small area."
});

export const magicArrow = new Skill ({
    name: "Magic Arrow",
    type: "Spell",
    damage: 15,
    castTime: 1.0,
    manaCost: 10,
    castDifficulty: 5,
    icon: "https://example.com/icons/magic_arrow.png",
    description: "A quick magical arrow that pierces through enemies, dealing damage."
});

export const healingLight = new Skill ({
    name: "Healing Light",
    type: "Support",
    damage: 0,
    castTime: 2.0,
    manaCost: 15,
    castDifficulty: 7,
    icon: "https://example.com/icons/healing_light.png",
    description: "A radiant light that heals allies over time, restoring their health."
});

export const allSkills = [
    fireball,
    magicArrow,
    healingLight
];
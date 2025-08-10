// Skills.js
export class Skill {
    constructor ({name, type, damage, castTime, manaCost, castDifficulty, icon, description}) {
        this.name = name;
        this.type = type; // e.g., "attack", "defense", "support"
        this.damage = damage; // Numeric value for damage
        this.castTime = castTime; // Time in seconds
        this.manaCost = manaCost; // Amount of mana required
        this.castDifficulty = castDifficulty; // Range in meters
        this.icon = icon; // URL or path to the skill icon
        this.description = description; // Text description of the skill
    }

    describe() {
        return `Skill: ${this.name}\nType: ${this.type}\nDamage: ${this.damage}\nCast Time: ${this.castTime}s\nMana Cost: ${this.manaCost}\nCast Difficulty: ${this.range}m\nDescription: ${this.description}`;
    }
}
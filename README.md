# FPS Artifact

A fully-featured first-person shooter engine running within Claude's Artifacts, designed to be extended with external files loaded from GitHub.

## Architecture

This FPS game is built with a modular architecture consisting of several key components:

### Core Components

1. **Math & Physics**: Mathematics and physics utilities for 2D vector operations, raycasting, and collision detection.
2. **Input**: Handles keyboard, mouse, touch, and gamepad inputs for player control.
3. **Raycaster**: The rendering engine that creates a 3D perspective from a 2D map.
4. **Map**: Defines the game world, walls, entities, and collision detection.
5. **Player**: Player controller handling movement, weapons, and stats.
6. **Weapons**: System for different weapon types with various properties.
7. **Enemies**: AI entities with different behaviors (patrol, chase, attack).
8. **Particles**: Visual effects system for impacts, blood, explosions, etc.
9. **Audio**: Sound effect and music management with spatial audio support.
10. **UI**: User interface with HUD elements, messages, and menus.
11. **Game**: Main game loop and state management.

### File Structure

The project is organized into modular JavaScript files:

- `index.html`: The main entry point and loader for the game.
- `js/utils.js`: Utility functions and helper methods.
- `js/math.js`: Mathematical utilities and vector operations.
- `js/audio.js`: Audio system for sounds and music.
- `js/input.js`: Input handling system.
- `js/texture.js`: Texture loading and processing.
- `js/map.js`: Map creation and management.
- `js/raycaster.js`: The 3D rendering engine.
- `js/player.js`: Player controller and physics.
- `js/weapon.js`: Weapon system and different weapon types.
- `js/enemy.js`: Enemy AI and behavior.
- `js/physics.js`: Physics and collision detection.
- `js/particle.js`: Particle effects system.
- `js/ui.js`: User interface and HUD.
- `js/game.js`: Main game logic and state management.
- `js/main.js`: Entry point that initializes everything.

## Features

- Raycasting engine for pseudo-3D rendering
- Physics-based movement and collision detection
- Enemy AI with different behaviors (idle, patrol, chase, attack)
- Weapon system with multiple weapon types
- Particle effects for visual impacts
- Sound effects and music with spatial audio
- User interface with health, ammo, and messages
- Touch controls for mobile devices
- Gamepad support
- Minimap for navigation

## How to Extend

### Adding New Weapons

To add a new weapon, create a new class that extends `FPSGame.Weapon.BaseWeapon` in `weapon.js`:

```javascript
FPSGame.Weapon.RocketLauncher = class RocketLauncher extends FPSGame.Weapon.BaseWeapon {
  constructor(player) {
    super(player);
    
    this.name = "Rocket Launcher";
    this.damage = 100;
    this.fireRate = 0.5;
    this.accuracy = 0.9;
    this.range = 50;
    this.reloadTime = 3;
    this.magSize = 1;
    this.currentAmmo = 1;
    this.reserveAmmo = 5;
    this.isAutomatic = false;
    
    this.fireSound = "rocket_fire";
    this.reloadSound = "rocket_reload";
  }
  
  // Override fire method for custom behavior
  fire() {
    // Implement rocket projectile logic
  }
};
```

### Adding New Enemies

To add a new enemy type, extend `FPSGame.Enemy.BaseEnemy` in `enemy.js`:

```javascript
FPSGame.Enemy.Boss = class Boss extends FPSGame.Enemy.BaseEnemy {
  constructor(x, y) {
    super(x, y);
    
    this.health = 300;
    this.maxHealth = 300;
    this.damage = 25;
    this.attackRange = 5;
    this.sightRange = 20;
    this.attackInterval = 3;
    this.moveSpeed = 0.8;
    
    this.animationFrames = 6;
    
    this.alertSound = "boss_alert";
    this.attackSound = "boss_attack";
    this.hitSound = "boss_hit";
    this.deathSound = "boss_death";
  }
  
  // Override attack method for special attack
  attack() {
    super.attack();
    // Add special attack behavior
  }
};
```

### Creating New Maps

Create new maps by extending the `GameMap` class in `map.js`:

```javascript
FPSGame.Map.GameMap.createMyCoolLevel = function() {
  const map = new FPSGame.Map.GameMap();
  
  // Set map properties
  map.width = 40;
  map.height = 40;
  map.name = "My Cool Level";
  map.floorColor = "#444";
  map.ceilingColor = "#222";
  
  // Add outer walls
  map.addWall(0, 0, map.width, 0);
  map.addWall(map.width, 0, map.width, map.height);
  map.addWall(map.width, map.height, 0, map.height);
  map.addWall(0, map.height, 0, 0);
  
  // Add interior walls and structures
  // ...
  
  // Add spawn points
  map.addSpawnPoint(2, 2, 0);
  map.addSpawnPoint(38, 38, Math.PI);
  
  return map;
};
```

### Adding Particle Effects

Create custom particle effects in `particle.js`:

```javascript
FPSGame.Particle.ParticleSystem.prototype.createCustomEffect = function(x, y) {
  const emitter = new FPSGame.Particle.Emitter(x, y, {
    burstAmount: 20,
    rate: 0,
    particleOptions: {
      colors: ['#00FFFF', '#0088FF', '#0000FF'],
      size: 0.15,
      lifetime: 1.2,
      gravity: -0.5,
      drag: 0.98
    }
  });
  
  this.emitters.push(emitter);
  return emitter;
};
```

### Adding Textures and Sounds

Add new assets by updating the loader in `game.js`:

```javascript
// In the loadAssets function:
const texturePromise = textures.loadTextures({
  // Add your new textures
  'new_wall': 'textures/new_wall.png',
  'new_weapon': 'weapons/new_weapon.png'
});

const soundPromise = audio.loadSounds({
  // Add your new sounds
  'new_sound': 'sounds/new_sound.mp3'
});
```

## File Organization in GitHub

When extending this project through GitHub, organize your files as follows:

```
/
├── assets/
│   ├── textures/
│   │   ├── wall_1.png
│   │   ├── wall_2.png
│   │   └── ...
│   ├── weapons/
│   │   ├── pistol.png
│   │   └── ...
│   ├── enemies/
│   │   ├── enemy_1.png
│   │   └── ...
│   ├── items/
│   │   ├── health.png
│   │   └── ...
│   └── sounds/
│       ├── pistol_fire.mp3
│       └── ...
├── js/
│   ├── utils.js
│   ├── math.js
│   ├── audio.js
│   └── ...
└── index.html
```

## Performance Considerations

1. **Resolution**: Adjust the raycaster's resolution based on device capabilities.
2. **Texture Size**: Keep texture sizes small for better performance.
3. **Entity Count**: Limit the number of active entities for better performance.
4. **Particle Effects**: Use particle effects sparingly on mobile devices.

## Browser Compatibility

The game is designed to work in modern browsers with the following features:
- Canvas API
- Web Audio API
- Pointer Lock API (optional for mouse control)
- Gamepad API (optional for controller support)

## Credits

- Developed initially for Claude's Artifacts
- Raycasting engine inspired by classic FPS games
- Extend and modify as needed for your own projects

## License

This project is open source and available for personal and commercial use.
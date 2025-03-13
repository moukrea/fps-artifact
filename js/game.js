/**
 * Game.js - Main game logic and state management
 */
(function (FPSGame) {
    // Create Game namespace
    FPSGame.Game = {};

    // Game state
    let gameState = {
        running: false,
        paused: false,
        level: 1,
        score: 0,
        time: 0,
        kills: 0
    };

    // Game objects
    let map = null;
    let player = null;
    let renderer = null;
    let input = null;
    let ui = null;
    let audio = null;
    let textures = null;
    let particles = null;
    let lastUpdateTime = 0;
    let gameLoop = null;
    let container = null;
    let canvas = null;

    // Initialize the game
    FPSGame.Game.init = function (gameContainer, gameCanvas) {
        console.log("Initializing game...");

        // Store references
        container = gameContainer;
        canvas = gameCanvas;

        // Create texture manager
        textures = new FPSGame.Texture.TextureManager();
        textures.setBaseUrl('https://raw.githubusercontent.com/moukrea/fps-artifact/main/assets/');

        // Create particle system
        particles = new FPSGame.Particle.ParticleSystem();

        // Create audio manager
        audio = new FPSGame.Audio.AudioManager();

        // Create UI manager
        ui = new FPSGame.UI.UIManager(container);

        // Create renderer
        renderer = new FPSGame.Raycaster.Renderer(canvas);

        // Create player
        player = new FPSGame.Player.Controller();

        // Show loading message
        ui.showMessage("Loading game assets...");

        // Load game assets
        loadAssets().then(() => {
            // Setup input
            input = FPSGame.Input.init(canvas);

            // Start the game
            start();

            // Show welcome message
            ui.showMessage("Welcome to FPS Artifact!", 5);

            // Resume audio context on first click
            const resumeAudio = () => {
                if (audio && audio.resume) {
                    audio.resume();
                }
                document.removeEventListener('click', resumeAudio);
                document.removeEventListener('touchstart', resumeAudio);
            };

            document.addEventListener('click', resumeAudio);
            document.addEventListener('touchstart', resumeAudio);
        }).catch(error => {
            console.error("Failed to load assets:", error);
            ui.showMessage("Failed to load game assets. Please try again.");
        });
    };

    // Load game assets (textures, sounds, etc.)
    function loadAssets() {
        // Load textures
        const texturePromise = textures.loadTextures({
            // Wall textures
            'wall_1': 'textures/wall_1.png',
            'wall_2': 'textures/wall_2.png',
            'wall_3': 'textures/wall_3.png',

            // Weapon textures
            'pistol': 'weapons/pistol.png',
            'shotgun': 'weapons/shotgun.png',
            'rifle': 'weapons/rifle.png',

            // Enemy textures
            'enemy_1': 'enemies/enemy_1.png',
            'enemy_2': 'enemies/enemy_2.png',

            // Item textures
            'health': 'items/health.png',
            'armor': 'items/armor.png',
            'ammo': 'items/ammo.png'
        }).catch(error => {
            console.error("Error loading textures:", error);

            // Create fallback textures
            textures.createWallTexture('wall_1', 64, 64, { baseColor: '#663300', bricks: true });
            textures.createWallTexture('wall_2', 64, 64, { baseColor: '#444444', bricks: true });
            textures.createWallTexture('wall_3', 64, 64, { baseColor: '#996633', bricks: true });

            textures.createBlankTexture('pistol', 128, 128, '#999999');
            textures.createBlankTexture('shotgun', 128, 128, '#777777');
            textures.createBlankTexture('rifle', 128, 128, '#555555');

            textures.createBlankTexture('enemy_1', 64, 64, '#ff0000');
            textures.createBlankTexture('enemy_2', 64, 64, '#aa0000');

            textures.createBlankTexture('health', 32, 32, '#00ff00');
            textures.createBlankTexture('armor', 32, 32, '#0000ff');
            textures.createBlankTexture('ammo', 32, 32, '#ffff00');
        });

        // Load sounds
        const soundPromise = audio ? audio.loadSounds({
            // Weapon sounds
            'pistol_fire': 'sounds/pistol_fire.mp3',
            'shotgun_fire': 'sounds/shotgun_fire.mp3',
            'rifle_fire': 'sounds/rifle_fire.mp3',
            'gun_empty': 'sounds/gun_empty.mp3',
            'pistol_reload': 'sounds/pistol_reload.mp3',
            'shotgun_reload': 'sounds/shotgun_reload.mp3',
            'rifle_reload': 'sounds/rifle_reload.mp3',

            // Player sounds
            'player_hurt': 'sounds/player_hurt.mp3',
            'player_death': 'sounds/player_death.mp3',
            'player_pickup': 'sounds/player_pickup.mp3',
            'player_footstep': 'sounds/player_footstep.mp3',

            // Enemy sounds
            'enemy_alert': 'sounds/enemy_alert.mp3',
            'enemy_attack': 'sounds/enemy_attack.mp3',
            'enemy_hit': 'sounds/enemy_hit.mp3',
            'enemy_death': 'sounds/enemy_death.mp3',

            // Ambient sounds
            'ambient_1': 'sounds/ambient_1.mp3',
            'ambient_2': 'sounds/ambient_2.mp3'
        }).catch(error => {
            console.error("Error loading sounds:", error);
            return Promise.resolve();
        }) : Promise.resolve();

        return Promise.all([texturePromise, soundPromise]);
    }

    // Start the game
    function start() {
        // Create map
        map = FPSGame.Map.GameMap.createLevel1();

        // Initialize player
        player.init(map);

        // Give player a weapon
        player.weapon = new FPSGame.Weapon.Pistol(player);

        // Add some enemies to map for testing
        addEnemiesToMap(map);

        // Set textures for renderer
        renderer.setTextures({
            wall: textures.getTexture('wall_1')
        });

        // Reset game state
        gameState = {
            running: true,
            paused: false,
            level: 1,
            score: 0,
            time: 0,
            kills: 0
        };

        // Start game loop
        lastUpdateTime = performance.now();
        if (gameLoop) cancelAnimationFrame(gameLoop);
        gameLoop = requestAnimationFrame(update);

        // Play ambient sound
        if (audio) {
            audio.playMusic('ambient_1');
        }

        // Add event listener for pause
        window.addEventListener('keydown', onKeyDown);
    }

    // Add enemies to the map
    function addEnemiesToMap(map) {
        // Add some zombies
        const zombie1 = new FPSGame.Enemy.Zombie(5, 5);
        zombie1.texture = textures.getTexture('enemy_1');
        map.addEntity(zombie1);

        const zombie2 = new FPSGame.Enemy.Zombie(15, 15);
        zombie2.texture = textures.getTexture('enemy_1');
        map.addEntity(zombie2);

        // Add some soldiers
        const soldier1 = new FPSGame.Enemy.Soldier(25, 5);
        soldier1.texture = textures.getTexture('enemy_2');
        map.addEntity(soldier1);

        const soldier2 = new FPSGame.Enemy.Soldier(25, 25);
        soldier2.texture = textures.getTexture('enemy_2');
        map.addEntity(soldier2);

        // Add patrol waypoints
        zombie1.setWaypoints([
            { x: 5, y: 5 },
            { x: 5, y: 10 },
            { x: 10, y: 10 },
            { x: 10, y: 5 }
        ]);

        soldier1.setWaypoints([
            { x: 25, y: 5 },
            { x: 30, y: 5 },
            { x: 30, y: 10 },
            { x: 25, y: 10 }
        ]);
    }

    // Pause the game
    function pause() {
        gameState.paused = true;
        ui.showMessage("PAUSED - Press P to resume");
    }

    // Resume the game
    function resume() {
        gameState.paused = false;
        lastUpdateTime = performance.now();
        ui.showMessage("Game resumed");
    }

    // Handle key events
    function onKeyDown(e) {
        // Toggle pause on P key
        if (e.code === 'KeyP') {
            if (gameState.paused) {
                resume();
            } else {
                pause();
            }
        }
    }

    // Main game update loop
    function update(timestamp) {
        // Calculate delta time
        const deltaTime = Math.min((timestamp - lastUpdateTime) / 1000, 0.1); // Cap at 100ms
        lastUpdateTime = timestamp;

        // Skip update if paused
        if (gameState.paused) {
            gameLoop = requestAnimationFrame(update);
            return;
        }

        // Update game time
        gameState.time += deltaTime;

        // Handle window resize
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        }

        // Process input
        const inputState = input.update();
        inputState.map = map; // Pass map for collision detection

        // Update player
        player.handleInput(inputState, deltaTime);

        // Update map and entities
        map.update(deltaTime);

        // Update player weapon
        if (player.weapon) {
            player.weapon.update(deltaTime);
        }

        // Update particles
        particles.update(deltaTime, map);

        // Render the scene
        const renderTime = renderer.render(map, player);

        // Render weapon if player has one
        if (player.weapon) {
            renderer.renderWeapon(player.weapon);
        }

        // Render minimap in corner
        renderer.renderMinimap(map, player);

        // Update UI
        ui.update(deltaTime, player, gameState);

        // Check for game over
        if (player.isDead) {
            gameOver();
        }

        // Continue game loop
        gameLoop = requestAnimationFrame(update);
    }

    // Game over state
    function gameOver() {
        // Stop the game
        gameState.running = false;

        // Show game over screen
        ui.showGameOver(gameState.score);

        // Play game over sound
        if (audio) {
            audio.stopMusic(1);
            audio.playSound('player_death');
        }
    }

    // Restart the game
    FPSGame.Game.restart = function () {
        // Reset player
        player.reset();

        // Start a new game
        start();
    };

    // Get current map
    FPSGame.Game.getMap = function () {
        return map;
    };

    // Get player
    FPSGame.Game.getPlayer = function () {
        return player;
    };

    // Add to score
    FPSGame.Game.addScore = function (points) {
        gameState.score += points;
        return gameState.score;
    };

    // Add to kill count
    FPSGame.Game.addKill = function () {
        gameState.kills++;

        // Add score for kill
        FPSGame.Game.addScore(100);

        return gameState.kills;
    };

    // Cleanup
    FPSGame.Game.destroy = function () {
        // Cancel game loop
        if (gameLoop) {
            cancelAnimationFrame(gameLoop);
            gameLoop = null;
        }

        // Remove event listeners
        window.removeEventListener('keydown', onKeyDown);

        // Cleanup resources
        if (renderer) renderer.destroy();
        if (input) input.destroy();
        if (ui) ui.destroy();
        if (audio) audio.stopMusic();

        // Reset state
        gameState = {
            running: false,
            paused: false,
            level: 1,
            score: 0,
            time: 0,
            kills: 0
        };

        console.log("Game destroyed");
    };

    console.log("Game module loaded");
})(window.FPSGame);
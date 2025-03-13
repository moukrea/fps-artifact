/**
 * Game module for the FPS game
 * Acts as the main controller that ties all components together
 */
(function (MyApp) {
    // Dependencies
    const Utils = MyApp.Utils;
    const Math3D = MyApp.Math3D;
    const Vector3 = Math3D.Vector3;
    
    // Private variables
    let _canvas = null;
    let _gameStartTime = 0;
    let _lastUpdateTime = 0;
    let _running = false;
    let _animationFrameId = null;
    let _currentLevel = 1;
    let _levelStartTime = 0;
    let _itemEntities = [];
    let _gameSettings = {
        maxFps: 60,
        msPerFrame: 1000 / 60,
        startingDifficulty: 1.0,
        difficultyIncrease: 0.1,
        levelDuration: 120000, // 2 minutes
        enemySpawnInterval: 5000,
        maxEnemies: 10
    };

    // Event emitter
    const _events = new Utils.EventEmitter();

    /**
     * Initialize the game
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {Object} options - Optional configuration
     */
    function init(canvas, options = {}) {
        _canvas = canvas;

        // Apply options
        if (options.settings) Object.assign(_gameSettings, options.settings);

        // Initialize all required modules
        _initModules();

        // Set up event listeners
        _setupEventListeners();

        // Set UI to menu state initially
        if (MyApp.UI) {
            MyApp.UI.setGameState('menu');

            // Force an initial render to make sure something appears
            const ctx = canvas.getContext('2d');
            const dummyPlayer = {
                health: 100,
                maxHealth: 100,
                armor: 0,
                weapon: { type: 'pistol', ammo: 12, maxAmmo: 12 },
                totalAmmo: 60,
                score: 0,
                kills: 0
            };

            if (MyApp.UI) {
                MyApp.UI.render(ctx, dummyPlayer, canvas.width, canvas.height);
            }
        }

        console.log('Game initialized');
    }

    /**
     * Initialize all required modules in the correct order
     */
    function _initModules() {
        // Input system should be initialized first
        if (MyApp.Input) {
            MyApp.Input.init(_canvas);
        } else {
            console.error('Input module not loaded');
        }

        // Initialize renderer
        if (MyApp.Renderer) {
            MyApp.Renderer.init(_canvas);
        } else {
            console.error('Renderer module not loaded');
        }

        // Initialize UI
        if (MyApp.UI) {
            MyApp.UI.init(_canvas);
        } else {
            console.error('UI module not loaded');
        }

        // Initialize map
        if (MyApp.Map) {
            MyApp.Map.init({
                mapSize: 64,
                seed: Date.now()
            });
        } else {
            console.error('Map module not loaded');
        }

        // Initialize enemy system
        if (MyApp.Enemy) {
            MyApp.Enemy.init({
                maxEnemies: _gameSettings.maxEnemies,
                spawnInterval: _gameSettings.enemySpawnInterval,
                difficulty: _gameSettings.startingDifficulty
            });
        } else {
            console.error('Enemy module not loaded');
        }

        // Initialize player last (depends on other systems)
        if (MyApp.Player) {
            // Get a spawn position from the map
            let spawnPos = null;
            if (MyApp.Map) {
                spawnPos = MyApp.Map.getRandomFreeSpace(true);
            }

            if (!spawnPos) {
                spawnPos = { x: 2, y: 0, z: 2 };
            }

            MyApp.Player.init({
                position: new Vector3(spawnPos.x, spawnPos.y, spawnPos.z)
            });
        } else {
            console.error('Player module not loaded');
        }
    }

    /**
     * Set up event listeners
     */
    function _setupEventListeners() {
        // Player events
        if (MyApp.Player) {
            // Listen for player death
            MyApp.Player.on('death', () => {
                console.log('Player died');
                stopGame();

                if (MyApp.UI) {
                    MyApp.UI.setGameState('gameover');
                }
            });

            // Listen for kills to increase difficulty
            MyApp.Player.on('kill', (enemy) => {
                if (MyApp.Enemy) {
                    MyApp.Enemy.increaseDifficulty(_gameSettings.difficultyIncrease);
                }

                // Random chance to spawn a pickup
                if (Math.random() < 0.3) {
                    _spawnPickup(enemy.position);
                }
            });
        }

        // Input events for game control
        if (MyApp.Input) {
            MyApp.Input.on('keyDown', (key) => {
                // Listen for restart key when game over
                if (key === 'enter' && MyApp.UI && MyApp.UI.getGameState() === 'gameover') {
                    startGame();
                }
            });

            // Add menu click handler
            MyApp.Input.on('menuClick', (x, y) => {
                if (MyApp.UI && MyApp.UI.getGameState() === 'menu') {
                    // This will be handled by the UI module
                    console.log('Menu click detected in game module');
                }
            });
        }
    }

    /**
     * Start the game loop
     */
    function startGame() {
        console.log('Starting game...');
        
        // Clear any existing animations
        if (_animationFrameId) {
            cancelAnimationFrame(_animationFrameId);
            _animationFrameId = null;
        }

        // Reset game state
        _currentLevel = 1;
        _gameStartTime = Utils.now();
        _levelStartTime = _gameStartTime;
        _running = false;
        
        // Clear any existing pickups
        _itemEntities = [];
        
        try {
            // Generate a new map first
            if (MyApp.Map) {
                console.log('Generating map...');
                const seed = Date.now();
                MyApp.Map.generate(seed);
            } else {
                console.error('Map module not available!');
                return;
            }
            
            // Set UI to playing state early so rendering works properly
            if (MyApp.UI) {
                console.log('Setting UI state to playing...');
                MyApp.UI.setGameState('playing');
            }
            
            // Reset player with proper spawn position
            if (MyApp.Player) {
                console.log('Resetting player...');
                
                // Get a spawn position from the map - critical step
                let spawnPos = null;
                if (MyApp.Map) {
                    spawnPos = MyApp.Map.getRandomFreeSpace(true);
                    console.log('Player spawn position:', JSON.stringify(spawnPos));
                }
                
                if (!spawnPos) {
                    console.warn('Failed to get spawn position, using fallback');
                    spawnPos = { x: 2, y: 0, z: 2 };
                }
                
                // Reset the player with the spawn position
                MyApp.Player.reset({
                    position: new Vector3(spawnPos.x, spawnPos.y, spawnPos.z)
                });
                
                // Verify player position was set
                const playerState = MyApp.Player.getState();
                console.log('Player position after reset:', 
                    playerState.position.x.toFixed(2),
                    playerState.position.y.toFixed(2),
                    playerState.position.z.toFixed(2)
                );
            } else {
                console.error('Player module not available!');
                return;
            }
            
            // Reset enemy system
            if (MyApp.Enemy) {
                console.log('Resetting enemies...');
                MyApp.Enemy.reset();
            }
            
            // Add welcome messages
            if (MyApp.UI) {
                MyApp.UI.addMessage('Game Started!', '#ffff00', 2000);
                MyApp.UI.addMessage(`Level ${_currentLevel}`, '#00ffff', 3000);
            }
            
            // Start game loop
            console.log('Starting game loop...');
            _running = true;
            _lastUpdateTime = Utils.now();
            _gameLoop();
            
            // Request pointer lock
            if (_canvas) {
                console.log('Requesting pointer lock...');
                setTimeout(() => {
                    if (_canvas.requestPointerLock) {
                        _canvas.requestPointerLock();
                    } else if (_canvas.mozRequestPointerLock) {
                        _canvas.mozRequestPointerLock();
                    } else if (_canvas.webkitRequestPointerLock) {
                        _canvas.webkitRequestPointerLock();
                    }
                }, 100); // Small delay to ensure UI state is updated
            }
            
            console.log('Game started successfully');
            _events.emit('gameStart');
            
        } catch (error) {
            console.error('Error starting game:', error);
            // Return to menu if there was an error
            if (MyApp.UI) {
                MyApp.UI.setGameState('menu');
                MyApp.UI.addMessage('Error starting game!', '#ff0000', 3000);
            }
        }
    }
    
    /**
     * Stop the game
     * This is called when the player dies or when exiting the game
     */
    function stopGame() {
        console.log('Stopping game...');
        
        // Stop the game loop
        _running = false;
        
        // Cancel any pending animation frame
        if (_animationFrameId) {
            cancelAnimationFrame(_animationFrameId);
            _animationFrameId = null;
        }
        
        // Clear any existing pickups
        _itemEntities = [];
        
        // Notify listeners
        _events.emit('gameStop');
        
        console.log('Game stopped');
    }
    
    /**
     * Pause the game
     * This is called when the player pauses the game
     */
    function pauseGame() {
        if (!_running) return;
        
        console.log('Pausing game...');
        _running = false;
        
        // Notify listeners
        _events.emit('gamePause');
        
        console.log('Game paused');
    }
    
    /**
     * Resume a paused game
     */
    function resumeGame() {
        if (_running) return;
        
        console.log('Resuming game...');
        
        // Resume the game loop
        _running = true;
        _lastUpdateTime = Utils.now();
        _gameLoop();
        
        // Notify listeners
        _events.emit('gameResume');
        
        console.log('Game resumed');
    }

    /**
     * Main game loop
     */
    function _gameLoop() {
        if (!_running) return;

        const now = Utils.now();
        let deltaTime = now - _lastUpdateTime;

        // Cap delta time to avoid spiral of death
        if (deltaTime > 100) deltaTime = 100;

        // Schedule next frame - do this first to avoid blocking
        _animationFrameId = requestAnimationFrame(_gameLoop);

        try {
            // Update time tracking
            _lastUpdateTime = now;

            // Update game state
            _update(deltaTime);

            // Render the scene
            _render();

            // Check for level transition
            _checkLevelTransition(now);
        } catch (error) {
            console.error('Error in game loop:', error);
            
            // Try to recover by continuing the loop
            // But stop if there are repeated errors
            if (_running) {
                console.log('Attempting to continue despite error');
            }
        }
    }

    /**
     * Update game state
     * @param {number} deltaTime - Time since last update
     */
    function _update(deltaTime) {
        // Skip updates if game is not in playing state
        if (MyApp.UI && MyApp.UI.getGameState() !== 'playing') {
            return;
        }

        try {
            // Update player
            if (MyApp.Player) {
                MyApp.Player.update(deltaTime, MyApp.Map, [..._itemEntities]);
            }

            // Update enemies - pass the player's state object
            if (MyApp.Enemy && MyApp.Player) {
                MyApp.Enemy.update(deltaTime, MyApp.Player.getState(), MyApp.Map);
            }

            // Update item entities
            _updateEntities(deltaTime);
        } catch (error) {
            console.error('Error during game update:', error);
        }
    }

    /**
     * Render the scene
     */
    function _render() {
        if (MyApp.Renderer) {
            try {
                // Get player state for camera
                const player = MyApp.Player ? MyApp.Player.getState() : null;
                
                // Only render if we have valid player data
                if (player && player.position) {
                    // Set camera position and orientation
                    MyApp.Renderer.setCamera(
                        player.position,
                        player.pitch,
                        player.yaw
                    );

                    // Get active enemies
                    const activeEnemies = MyApp.Enemy ? MyApp.Enemy.getActiveEnemies() : [];

                    // Render the scene using the Renderer module
                    MyApp.Renderer.render(
                        MyApp.Map,
                        [...activeEnemies, ..._itemEntities],
                        player
                    );
                } else {
                    console.warn('Missing player data for rendering');
                }
            } catch (error) {
                console.error('Error during rendering:', error);
            }
        }
    }

    /**
     * Check if it's time for level transition
     * @param {number} now - Current time
     */
    function _checkLevelTransition(now) {
        // Check for level transition
        if (now - _levelStartTime >= _gameSettings.levelDuration) {
            _currentLevel++;
            _levelStartTime = now;

            // Increase difficulty
            if (MyApp.Enemy) {
                MyApp.Enemy.increaseDifficulty(0.5);
            }

            // Generate a new map
            if (MyApp.Map) {
                MyApp.Map.generate(Date.now());
            }

            // Move player to new spawn point
            if (MyApp.Player) {
                const spawnPos = MyApp.Map.getRandomFreeSpace(true);

                if (spawnPos) {
                    const player = MyApp.Player.getState();
                    player.position.set(spawnPos.x, spawnPos.y, spawnPos.z);
                }
            }

            // Clear pickups
            _itemEntities = [];

            // Announce new level
            if (MyApp.UI) {
                MyApp.UI.addMessage(`Level ${_currentLevel}`, '#00ffff', 3000);
            }

            console.log(`Advanced to level ${_currentLevel}`);
            _events.emit('levelAdvance', _currentLevel);
        }
    }

    /**
     * Update item entities
     * @param {number} deltaTime - Time since last update
     */
    function _updateEntities(deltaTime) {
        for (let i = 0; i < _itemEntities.length; i++) {
            const entity = _itemEntities[i];

            // Remove inactive entities
            if (!entity.active) {
                _itemEntities.splice(i, 1);
                i--;
                continue;
            }

            // Update entity animation
            if (entity.animation) {
                entity.animation.time += deltaTime;

                // Apply animations
                switch (entity.animation.type) {
                    case 'bob':
                        entity.position.y = entity.animation.baseY +
                            Math.sin(entity.animation.time / 500) * 0.1;
                        break;
                    case 'rotate':
                        entity.rotation = (entity.animation.time / 1000) * Math.PI * 2;
                        break;
                }
            }
        }
    }

    /**
     * Spawn a pickup item at a position
     * @param {Vector3} position - Position to spawn at
     */
    function _spawnPickup(position) {
        // Choose a random pickup type
        const types = ['health', 'ammo', 'armor'];
        const type = types[Math.floor(Math.random() * types.length)];

        let textureId, amount;

        switch (type) {
            case 'health':
                textureId = 3; // Health pickup texture ID
                amount = 25;
                break;
            case 'ammo':
                textureId = 4; // Ammo pickup texture ID
                amount = 20;
                break;
            case 'armor':
                textureId = 5; // Armor pickup texture ID
                amount = 15;
                break;
        }

        // Create the pickup entity
        const pickup = {
            type,
            position: new Vector3(position.x, 0.5, position.z),
            velocity: new Vector3(0, 0, 0),
            textureId,
            amount,
            active: true,
            collidable: true,
            visible: true,
            radius: 0.5,
            animation: {
                type: 'bob',
                time: Math.random() * 1000, // Random start time for variation
                baseY: 0.5
            }
        };

        _itemEntities.push(pickup);
    }

    /**
     * Spawn a weapon pickup
     * @param {string} weaponType - Type of weapon
     * @param {Vector3} position - Position to spawn at
     */
    function spawnWeapon(weaponType, position) {
        const weapon = {
            type: 'weapon',
            weaponType,
            position: new Vector3(position.x, 0.5, position.z),
            velocity: new Vector3(0, 0, 0),
            textureId: 6, // Weapon pickup texture ID
            active: true,
            collidable: true,
            visible: true,
            radius: 0.5,
            animation: {
                type: 'rotate',
                time: 0
            }
        };

        _itemEntities.push(weapon);
    }

    /**
     * Register an event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     */
    function on(event, callback) {
        return _events.on(event, callback);
    }

    // Export the public API
    MyApp.Game = {
        init,
        startGame,
        stopGame,
        pauseGame,
        resumeGame,
        spawnWeapon,
        on
    };

    console.log('Game module loaded');
})(window.MyApp || (window.MyApp = {}));
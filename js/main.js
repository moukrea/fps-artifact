/**
 * Main entry point for the FPS game
 * Initializes all modules and starts the game
 */
(function (MyApp) {
    // Game configuration
    const CONFIG = {
        fps: 60,
        debug: false,
        renderer: {
            fov: 60,
            settings: {
                wallHeight: 1.0,
                fogEnabled: true,
                fogDistance: 15,
                lightingEnabled: true,
                renderDistance: 30
            }
        },
        map: {
            mapSize: 64,
            seed: Date.now(),
            settings: {
                roomDensity: 0.6,
                corridorWidth: 1,
                extraConnections: 0.2
            }
        },
        enemies: {
            maxEnemies: 15,
            spawnInterval: 5000,
            difficulty: 1.0
        },
        player: {
            moveSpeed: 0.08,
            turnSpeed: 0.003,
            health: 100,
            weapon: {
                type: 'pistol',
                ammo: 12
            }
        },
        game: {
            maxFps: 60,
            levelDuration: 120000,
            enemySpawnInterval: 5000,
            maxEnemies: 15
        }
    };

    // Track initialization state
    let _initialized = false;

    /**
     * Initialize the application
     * @param {HTMLElement} container - Container element
     */
    function init(container) {
        console.log('Initializing game...');

        // Check if canvas is available in container
        const canvas = container.querySelector('canvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        // Set canvas to fill container
        _setupCanvas(canvas, container);

        // Initialize modules in the correct order
        _initializeGame(canvas);

        // Set up window resize handler
        window.addEventListener('resize', () => {
            _handleResize(canvas, container);
        });

        // Set up visibility change handler (pause/resume)
        document.addEventListener('visibilitychange', _handleVisibilityChange);

        // Remove loading screen
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }

        console.log('Game initialization complete');
        _initialized = true;
    }

    /**
     * Set up canvas to fill container
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {HTMLElement} container - Container element
     */
    function _setupCanvas(canvas, container) {
        // Set canvas size to match container
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        // Apply styles to ensure it fills the container
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
    }

    /**
     * Handle window resize
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {HTMLElement} container - Container element
     */
    function _handleResize(canvas, container) {
        // Update canvas size
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        // Notify renderer of resize
        if (MyApp.Renderer) {
            MyApp.Renderer.resize();
        }
    }

    /**
     * Handle visibility change (tab switching)
     */
    function _handleVisibilityChange() {
        if (!_initialized || !MyApp.Game) return;

        if (document.hidden) {
            // Pause game when tab is not visible
            MyApp.Game.pauseGame();
        } else {
            // Resume game if it was playing before
            if (MyApp.UI && MyApp.UI.getGameState() === 'paused') {
                MyApp.Game.resumeGame();
            }
        }
    }

    /**
     * Initialize all game modules
     * @param {HTMLCanvasElement} canvas - Canvas element
     */
    function _initializeGame(canvas) {
        // Start measuring initialization time
        const startTime = performance.now();

        // Initialize all modules in order

        // First, initialize the core Game module which will control everything
        if (MyApp.Game) {
            MyApp.Game.init(canvas, {
                settings: CONFIG.game
            });

            // Log startup messages with the Game module
            MyApp.Game.on('gameStart', () => {
                console.log('Game started');
            });

            MyApp.Game.on('levelAdvance', (level) => {
                console.log(`Advanced to level ${level}`);
            });
        } else {
            console.error('Game module not available');
        }

        // Log initialization time
        const initTime = performance.now() - startTime;
        console.log(`Game initialized in ${initTime.toFixed(0)}ms`);

        // Force an initial render of the menu
        if (MyApp.UI && MyApp.UI.getGameState() === 'menu') {
            // Get the canvas 2D context
            const ctx = canvas.getContext('2d');

            // Render the menu
            MyApp.UI.render(ctx, {
                health: 100,
                maxHealth: 100,
                armor: 0,
                weapon: { type: 'pistol', ammo: 12, maxAmmo: 12 },
                totalAmmo: 60,
                score: 0,
                kills: 0
            }, canvas.width, canvas.height);

            console.log('Initial menu rendered');
        }
    }

    // Export the public API
    MyApp.init = init;

    console.log('Main module loaded');
})(window.MyApp || (window.MyApp = {}));
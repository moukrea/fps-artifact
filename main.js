// Main game initialization and loop
(function (FPSGame) {
    // Initialize game function (called from the loader)
    FPSGame.init = function (container, canvas) {
        // Store important references
        FPSGame.container = container;
        FPSGame.canvas = canvas;
        FPSGame.ctx = canvas.getContext('2d');

        // Set up state
        FPSGame.isPaused = false;
        FPSGame.isShooting = false;
        FPSGame.isReloading = false;
        FPSGame.showFlash = false;

        // Initialize game state
        FPSGame.gameState = FPSGame.createInitialState();

        // Set up event listeners
        canvas.addEventListener('touchstart', FPSGame.handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', FPSGame.handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', FPSGame.handleTouchEnd, { passive: false });

        // Add mouse event listeners for desktop testing
        canvas.addEventListener('mousedown', FPSGame.handleMouseDown);
        canvas.addEventListener('mousemove', FPSGame.handleMouseMove);
        canvas.addEventListener('mouseup', FPSGame.handleMouseUp);

        // Set up resize handling
        FPSGame.handleResize();
        window.addEventListener('resize', FPSGame.handleResize);

        // Start the game loop
        FPSGame.lastTime = 0;
        requestAnimationFrame(FPSGame.gameLoop);
    };

    // Handle window resizing
    FPSGame.handleResize = function () {
        const canvas = FPSGame.canvas;
        canvas.width = FPSGame.container.clientWidth;
        canvas.height = FPSGame.container.clientHeight;
    };

    // Main game loop
    FPSGame.gameLoop = function (time) {
        // Calculate delta time
        const deltaTime = (time - FPSGame.lastTime) / 1000; // Convert to seconds
        FPSGame.lastTime = time;

        // Get the current state
        const state = FPSGame.gameState;

        // Update player movement and camera rotation if not paused
        if (!FPSGame.isPaused) {
            FPSGame.updatePlayerMovement(state, deltaTime);
            FPSGame.updateCameraRotation(state, deltaTime);
        }

        // Render the scene
        FPSGame.drawRaycastView(FPSGame.ctx, FPSGame.canvas, state);

        // Draw UI elements
        FPSGame.drawUI(FPSGame.ctx, FPSGame.canvas, state);

        // Draw flash effect if shooting
        if (FPSGame.showFlash) {
            FPSGame.ctx.fillStyle = 'rgba(255, 200, 50, 0.3)';
            FPSGame.ctx.fillRect(0, 0, FPSGame.canvas.width, FPSGame.canvas.height);
        }

        // Request next frame
        requestAnimationFrame(FPSGame.gameLoop);
    };

    // Pause/unpause the game
    FPSGame.togglePause = function (isPaused) {
        FPSGame.isPaused = isPaused !== undefined ? isPaused : !FPSGame.isPaused;
    };
})(window.FPSGame);
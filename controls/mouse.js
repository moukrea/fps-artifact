// Mouse event handlers for desktop testing
(function (FPSGame) {
    // Mouse down event handler
    FPSGame.handleMouseDown = function (e) {
        e.preventDefault();

        const canvas = FPSGame.canvas;
        const state = FPSGame.gameState;
        const layout = FPSGame.calculateLayout(canvas);

        // Convert mouse coordinates to canvas coordinates
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        // Special handling for pause menu
        if (FPSGame.isPaused) {
            // Check if click is within resume button
            if (state.resumeButtonRect &&
                x >= state.resumeButtonRect.x &&
                x <= state.resumeButtonRect.x + state.resumeButtonRect.width &&
                y >= state.resumeButtonRect.y &&
                y <= state.resumeButtonRect.y + state.resumeButtonRect.height) {
                FPSGame.togglePause(false);
            }

            // Check if click is within X-axis toggle
            if (state.invertXToggleRect &&
                x >= state.invertXToggleRect.x &&
                x <= state.invertXToggleRect.x + state.invertXToggleRect.width &&
                y >= state.invertXToggleRect.y &&
                y <= state.invertXToggleRect.y + state.invertXToggleRect.height) {
                // Toggle invert X axis
                state.invertXAxis = !state.invertXAxis;
            }

            // Check if click is within Y-axis toggle
            if (state.invertYToggleRect &&
                x >= state.invertYToggleRect.x &&
                x <= state.invertYToggleRect.x + state.invertYToggleRect.width &&
                y >= state.invertYToggleRect.y &&
                y <= state.invertYToggleRect.y + state.invertYToggleRect.height) {
                // Toggle invert Y axis
                state.invertYAxis = !state.invertYAxis;
            }

            return; // Don't process other clicks while paused
        }

        // Check joystick area
        if (FPSGame.isTouchInButton(x, y, layout.joystickCenterX, layout.joystickCenterY, layout.joystickRadius * 1.5)) {
            state.joystickActive = true;
            state.joystickStartX = layout.joystickCenterX;
            state.joystickStartY = layout.joystickCenterY;
            state.joystickCurrentX = x;
            state.joystickCurrentY = y;
            return;
        }

        // Check buttons BEFORE camera area to ensure they work

        // Check pause button
        if (FPSGame.isTouchInButton(x, y, layout.pauseButtonX, layout.pauseButtonY, layout.pauseButtonRadius)) {
            FPSGame.togglePause(true);
            return;
        }

        // Check shoot button
        if (FPSGame.isTouchInButton(x, y, layout.shootButtonX, layout.shootButtonY, layout.shootButtonRadius)) {
            FPSGame.shoot(state);
            return;
        }

        // Check reload button
        if (FPSGame.isTouchInButton(x, y, layout.reloadButtonX, layout.reloadButtonY, layout.reloadButtonRadius)) {
            FPSGame.reload(state);
            return;
        }

        // Check camera area (right side of screen) - only if no button was touched
        if (x > layout.cameraAreaX) {
            state.cameraActive = true;
            state.cameraStartX = x;
            state.cameraStartY = y;
            state.cameraMoveX = 0;
            state.cameraMoveY = 0;
            return;
        }
    };

    // Mouse move event handler
    FPSGame.handleMouseMove = function (e) {
        if (FPSGame.isPaused) return;

        const canvas = FPSGame.canvas;
        const state = FPSGame.gameState;
        const layout = FPSGame.calculateLayout(canvas);

        // Convert mouse coordinates to canvas coordinates
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        // Update joystick position
        if (state.joystickActive) {
            // Calculate distance from joystick center
            const dx = x - state.joystickStartX;
            const dy = y - state.joystickStartY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Clamp to joystick radius
            if (distance > layout.joystickRadius) {
                const angle = Math.atan2(dy, dx);
                state.joystickCurrentX = state.joystickStartX + Math.cos(angle) * layout.joystickRadius;
                state.joystickCurrentY = state.joystickStartY + Math.sin(angle) * layout.joystickRadius;
            } else {
                state.joystickCurrentX = x;
                state.joystickCurrentY = y;
            }
        }

        // Update camera rotation - both horizontal and vertical
        if (state.cameraActive) {
            // Horizontal movement (left/right)
            state.cameraMoveX = (x - state.cameraStartX) / 100;
            state.cameraStartX = x;

            // Vertical movement (up/down)
            state.cameraMoveY = (y - state.cameraStartY) / 100;
            state.cameraStartY = y;
        }
    };

    // Mouse up event handler
    FPSGame.handleMouseUp = function () {
        const state = FPSGame.gameState;
        state.joystickActive = false;
        state.cameraActive = false;
    };
})(window.FPSGame);
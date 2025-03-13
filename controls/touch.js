// Touch event handlers
(function (FPSGame) {
    // Event handler for touch start
    FPSGame.handleTouchStart = function (e) {
        e.preventDefault();

        const canvas = FPSGame.canvas;
        const state = FPSGame.gameState;
        const layout = FPSGame.calculateLayout(canvas);

        // Convert touch coordinates to canvas coordinates
        const rect = canvas.getBoundingClientRect();

        // Special handling for pause menu
        if (FPSGame.isPaused) {
            for (let i = 0; i < e.touches.length; i++) {
                const touch = e.touches[i];
                const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
                const y = (touch.clientY - rect.top) * (canvas.height / rect.height);

                // Check if touch is within resume button
                if (state.resumeButtonRect &&
                    x >= state.resumeButtonRect.x &&
                    x <= state.resumeButtonRect.x + state.resumeButtonRect.width &&
                    y >= state.resumeButtonRect.y &&
                    y <= state.resumeButtonRect.y + state.resumeButtonRect.height) {
                    FPSGame.togglePause(false);
                    return;
                }

                // Check if touch is within X-axis toggle
                if (state.invertXToggleRect &&
                    x >= state.invertXToggleRect.x &&
                    x <= state.invertXToggleRect.x + state.invertXToggleRect.width &&
                    y >= state.invertXToggleRect.y &&
                    y <= state.invertXToggleRect.y + state.invertXToggleRect.height) {
                    // Toggle invert X axis
                    state.invertXAxis = !state.invertXAxis;
                    return;
                }

                // Check if touch is within Y-axis toggle
                if (state.invertYToggleRect &&
                    x >= state.invertYToggleRect.x &&
                    x <= state.invertYToggleRect.x + state.invertYToggleRect.width &&
                    y >= state.invertYToggleRect.y &&
                    y <= state.invertYToggleRect.y + state.invertYToggleRect.height) {
                    // Toggle invert Y axis
                    state.invertYAxis = !state.invertYAxis;
                    return;
                }
            }
            return; // Don't process other touches while paused
        }

        // Regular touch handling when not paused
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (canvas.height / rect.height);

            // IMPORTANT - Check buttons BEFORE camera area to prioritize button interaction

            // Check pause button
            if (FPSGame.isTouchInButton(x, y, layout.pauseButtonX, layout.pauseButtonY, layout.pauseButtonRadius)) {
                FPSGame.togglePause(true);
                continue;
            }

            // Check shoot button
            if (FPSGame.isTouchInButton(x, y, layout.shootButtonX, layout.shootButtonY, layout.shootButtonRadius)) {
                FPSGame.shoot(state);
                continue;
            }

            // Check reload button
            if (FPSGame.isTouchInButton(x, y, layout.reloadButtonX, layout.reloadButtonY, layout.reloadButtonRadius)) {
                FPSGame.reload(state);
                continue;
            }

            // Check joystick area
            if (FPSGame.isTouchInButton(x, y, layout.joystickCenterX, layout.joystickCenterY, layout.joystickRadius * 1.5) &&
                state.joystickTouchId === null) {
                state.joystickActive = true;
                state.joystickTouchId = touch.identifier;
                state.joystickStartX = layout.joystickCenterX;
                state.joystickStartY = layout.joystickCenterY;
                state.joystickCurrentX = x;
                state.joystickCurrentY = y;
                continue;
            }

            // Check camera area (right side of screen) - only if no button was touched
            if (x > layout.cameraAreaX && state.cameraTouchId === null) {
                state.cameraActive = true;
                state.cameraTouchId = touch.identifier;
                state.cameraStartX = x;
                state.cameraStartY = y;
                state.cameraMoveX = 0;
                state.cameraMoveY = 0;
                continue;
            }
        }
    };

    // Event handler for touch move
    FPSGame.handleTouchMove = function (e) {
        e.preventDefault();

        // Don't process touch moves while paused
        if (FPSGame.isPaused) return;

        const canvas = FPSGame.canvas;
        const state = FPSGame.gameState;
        const layout = FPSGame.calculateLayout(canvas);

        // Convert touch coordinates to canvas coordinates
        const rect = canvas.getBoundingClientRect();

        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];

            // Update joystick position
            if (touch.identifier === state.joystickTouchId) {
                const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
                const y = (touch.clientY - rect.top) * (canvas.height / rect.height);

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

            // Update camera rotation - now with both horizontal and vertical movement
            if (touch.identifier === state.cameraTouchId) {
                const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
                const y = (touch.clientY - rect.top) * (canvas.height / rect.height);

                // Calculate horizontal camera movement (left/right rotation)
                state.cameraMoveX = (x - state.cameraStartX) / 100;
                state.cameraStartX = x;

                // Calculate vertical camera movement (up/down pitch)
                state.cameraMoveY = (y - state.cameraStartY) / 100;
                state.cameraStartY = y;
            }
        }
    };

    // Event handler for touch end
    FPSGame.handleTouchEnd = function (e) {
        e.preventDefault();

        const state = FPSGame.gameState;

        // Check if the joystick touch has ended
        let joystickTouchActive = false;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === state.joystickTouchId) {
                joystickTouchActive = true;
                break;
            }
        }

        if (!joystickTouchActive) {
            state.joystickActive = false;
            state.joystickTouchId = null;
        }

        // Check if the camera touch has ended
        let cameraTouchActive = false;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === state.cameraTouchId) {
                cameraTouchActive = true;
                break;
            }
        }

        if (!cameraTouchActive) {
            state.cameraActive = false;
            state.cameraTouchId = null;
        }
    };
})(window.FPSGame);
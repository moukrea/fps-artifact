// Movement and collision detection
(function (FPSGame) {
    // Update player movement based on joystick with improved collision
    FPSGame.updatePlayerMovement = function (state, deltaTime) {
        // Movement speed - constant speed regardless of joystick position
        const moveSpeed = 3.0 * deltaTime;

        // Deadzone threshold - stick must move this far to activate movement
        const deadzone = 0.3;

        // Store original position for collision detection
        const oldPosX = state.posX;
        const oldPosY = state.posY;

        // Reset bob active flag
        state.bobActive = false;

        // Update position based on joystick
        if (state.joystickActive) {
            const dx = state.joystickCurrentX - state.joystickStartX;
            const dy = state.joystickCurrentY - state.joystickStartY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const layout = FPSGame.calculateLayout(FPSGame.canvas);
            const maxDistance = layout.joystickRadius;

            // Only apply movement if beyond deadzone
            if (distance > maxDistance * deadzone) {
                // Normalize to get direction
                const normalizedX = dx / Math.max(distance, 1);
                const normalizedY = dy / Math.max(distance, 1);

                let newPosX = state.posX;
                let newPosY = state.posY;
                let moved = false;

                // Forward/backward movement (y-axis of joystick)
                if (normalizedY < -deadzone) {
                    // Forward movement (relative to camera direction)
                    newPosX += state.dirX * moveSpeed;
                    newPosY += state.dirY * moveSpeed;
                    moved = true;
                } else if (normalizedY > deadzone) {
                    // Backward movement (relative to camera direction)
                    newPosX -= state.dirX * moveSpeed;
                    newPosY -= state.dirY * moveSpeed;
                    moved = true;
                }

                // Check X-axis collision and apply movement if valid
                if (state.worldMap[Math.floor(newPosY)][Math.floor(newPosX)] === 0) {
                    state.posX = newPosX;
                    state.posY = newPosY;
                } else {
                    // Allow sliding along walls
                    if (state.worldMap[Math.floor(oldPosY)][Math.floor(newPosX)] === 0) {
                        state.posX = newPosX;
                    }
                    else if (state.worldMap[Math.floor(newPosY)][Math.floor(oldPosX)] === 0) {
                        state.posY = newPosY;
                    }
                }

                // Reset position for strafing calculation
                newPosX = state.posX;
                newPosY = state.posY;

                // Strafe left/right (x-axis of joystick)
                if (normalizedX < -deadzone) {
                    // Strafe left (perpendicular to camera direction)
                    newPosX -= state.dirY * moveSpeed;
                    newPosY += state.dirX * moveSpeed;
                    moved = true;
                } else if (normalizedX > deadzone) {
                    // Strafe right (perpendicular to camera direction)
                    newPosX += state.dirY * moveSpeed;
                    newPosY -= state.dirX * moveSpeed;
                    moved = true;
                }

                // Check collision for strafing and apply movement if valid
                if (state.worldMap[Math.floor(newPosY)][Math.floor(newPosX)] === 0) {
                    state.posX = newPosX;
                    state.posY = newPosY;
                } else {
                    // Allow sliding along walls
                    if (state.worldMap[Math.floor(state.posY)][Math.floor(newPosX)] === 0) {
                        state.posX = newPosX;
                    }
                    else if (state.worldMap[Math.floor(newPosY)][Math.floor(state.posX)] === 0) {
                        state.posY = newPosY;
                    }
                }

                // If player moved, activate camera bobbing
                if (moved) {
                    state.bobActive = true;
                    // Update bobbing phase
                    state.bobPhase += deltaTime * 5;
                    if (state.bobPhase > Math.PI * 2) {
                        state.bobPhase -= Math.PI * 2;
                    }
                }
            }
        }

        // Keep player in bounds as a fallback
        if (state.worldMap[Math.floor(state.posY)][Math.floor(state.posX)] > 0) {
            state.posX = oldPosX;
            state.posY = oldPosY;
        }

        // Keep a minimum distance from walls (prevent clipping)
        const buffer = 0.1;
        if (state.posX < buffer) state.posX = buffer;
        if (state.posY < buffer) state.posY = buffer;
        if (state.posX > state.worldMap[0].length - buffer) {
            state.posX = state.worldMap[0].length - buffer;
        }
        if (state.posY > state.worldMap.length - buffer) {
            state.posY = state.worldMap.length - buffer;
        }

        // Update camera shake effect - MUCH SLOWER DECAY for visible shaking
        if (state.shakeIntensity > 0) {
            state.shakeIntensity -= state.shakeDecay * deltaTime * 0.5; // Reduced by 50%
            if (state.shakeIntensity < 0) {
                state.shakeIntensity = 0;
            }
        }
    };

    // Update camera rotation based on touch
    FPSGame.updateCameraRotation = function (state, deltaTime) {
        if (state.cameraActive) {
            const rotSpeed = 6.0 * deltaTime; // Horizontal rotation speed
            const pitchSpeed = 4.0 * deltaTime; // Vertical pitch speed

            // Apply X-axis inversion if enabled
            let horizontalFactor = state.invertXAxis ? -1 : 1;

            // Horizontal rotation (left/right)
            const dx = state.cameraMoveX * rotSpeed * horizontalFactor;

            // Rotate direction vector
            const oldDirX = state.dirX;
            state.dirX = state.dirX * Math.cos(dx) - state.dirY * Math.sin(dx);
            state.dirY = oldDirX * Math.sin(dx) + state.dirY * Math.cos(dx);

            // Rotate camera plane
            const oldPlaneX = state.planeX;
            state.planeX = state.planeX * Math.cos(dx) - state.planeY * Math.sin(dx);
            state.planeY = oldPlaneX * Math.sin(dx) + state.planeY * Math.cos(dx);

            // Apply Y-axis inversion if enabled
            let verticalFactor = state.invertYAxis ? -1 : 1;

            // Vertical pitch (up/down)
            const dy = state.cameraMoveY * pitchSpeed * verticalFactor;

            // Update pitch angle with clamping to prevent over-rotation
            state.pitchAngle = Math.max(
                -state.maxPitchAngle,
                Math.min(state.maxPitchAngle, state.pitchAngle + dy)
            );
        }
    };
})(window.FPSGame);
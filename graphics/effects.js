// Visual effects for the game (head bobbing, camera shake, etc.)
(function (FPSGame) {
    // Calculate all visual effects for the current frame
    FPSGame.calculateVisualEffects = function (state, screenHeight) {
        // 1. Head bobbing effect when moving - only when actually moving
        let bobOffset = 0;
        if (state.bobActive) {
            bobOffset = Math.sin(state.bobPhase) * 3; // Subtle bob
        }

        // 2. Camera shake effect when shooting - DRAMATICALLY AMPLIFIED
        let shakeOffsetX = 0;
        let shakeOffsetY = 0;
        if (state.shakeIntensity > 0) {
            shakeOffsetX = (Math.random() * 2 - 1) * state.shakeIntensity * 20;
            shakeOffsetY = (Math.random() * 2 - 1) * state.shakeIntensity * 20;

            // Debug info to verify shake is active
            if (state.shakeIntensity > 0.1) {
                console.log(`Shake active: intensity=${state.shakeIntensity.toFixed(2)}, offsets=${shakeOffsetX.toFixed(1)},${shakeOffsetY.toFixed(1)}`);
            }
        }

        // 3. Pitch effect (looking up/down)
        const pitchOffset = Math.sin(state.pitchAngle) * screenHeight / 2;

        // Combined vertical offset
        const totalVerticalOffset = pitchOffset + bobOffset + shakeOffsetY;

        return {
            bobOffset: bobOffset,
            shakeOffsetX: shakeOffsetX,
            shakeOffsetY: shakeOffsetY,
            pitchOffset: pitchOffset,
            totalVerticalOffset: totalVerticalOffset
        };
    };

    // Apply a screen flash effect (used when shooting)
    FPSGame.applyScreenFlash = function (ctx, canvas, color, opacity) {
        ctx.fillStyle = color || 'rgba(255, 200, 50, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
})(window.FPSGame);
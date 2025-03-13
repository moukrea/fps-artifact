// Raycasting renderer for 3D view
(function (FPSGame) {
    // Draw the 3D view using raycasting
    FPSGame.drawRaycastView = function (ctx, canvas, state) {
        const w = canvas.width;
        const h = canvas.height;

        // Clear the canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        // Calculate camera effects
        const effects = FPSGame.calculateVisualEffects(state, h);

        // Draw sky and floor with combined effects
        // Sky
        ctx.fillStyle = '#87CEEB'; // Sky blue
        ctx.fillRect(0, 0, w, h / 2 + effects.totalVerticalOffset);

        // Floor
        ctx.fillStyle = '#3A3A3A'; // Dark gray
        ctx.fillRect(0, h / 2 + effects.totalVerticalOffset, w, h / 2 - effects.totalVerticalOffset);

        // Only render if not paused
        if (!FPSGame.isPaused) {
            // Raycasting for each vertical strip of the screen
            for (let x = 0; x < w; x++) {
                // Apply horizontal shake offset
                const adjustedX = x + effects.shakeOffsetX;

                // Skip rendering if the pixel is outside the visible area due to shake
                if (adjustedX < 0 || adjustedX >= w) continue;

                // Calculate ray position and direction
                const cameraX = 2 * adjustedX / w - 1; // x-coordinate in camera space
                const rayDirX = state.dirX + state.planeX * cameraX;
                const rayDirY = state.dirY + state.planeY * cameraX;

                // Which box of the map we're in
                let mapX = Math.floor(state.posX);
                let mapY = Math.floor(state.posY);

                // Length of ray from current position to next x or y-side
                let sideDistX;
                let sideDistY;

                // Length of ray from one x or y-side to next x or y-side
                const deltaDistX = Math.abs(1 / rayDirX);
                const deltaDistY = Math.abs(1 / rayDirY);

                // What direction to step in x or y direction (either +1 or -1)
                let stepX;
                let stepY;

                let hit = 0; // Was there a wall hit?
                let side = 0; // Was a NS or a EW wall hit?

                // Calculate step and initial sideDist
                if (rayDirX < 0) {
                    stepX = -1;
                    sideDistX = (state.posX - mapX) * deltaDistX;
                } else {
                    stepX = 1;
                    sideDistX = (mapX + 1.0 - state.posX) * deltaDistX;
                }

                if (rayDirY < 0) {
                    stepY = -1;
                    sideDistY = (state.posY - mapY) * deltaDistY;
                } else {
                    stepY = 1;
                    sideDistY = (mapY + 1.0 - state.posY) * deltaDistY;
                }

                // Perform DDA
                while (hit === 0) {
                    // Jump to next map square, either in x-direction, or in y-direction
                    if (sideDistX < sideDistY) {
                        sideDistX += deltaDistX;
                        mapX += stepX;
                        side = 0;
                    } else {
                        sideDistY += deltaDistY;
                        mapY += stepY;
                        side = 1;
                    }

                    // Check if ray has hit a wall
                    if (state.worldMap[mapY][mapX] > 0) hit = 1;
                }

                // Calculate distance projected on camera direction
                let perpWallDist;
                if (side === 0) {
                    perpWallDist = (mapX - state.posX + (1 - stepX) / 2) / rayDirX;
                } else {
                    perpWallDist = (mapY - state.posY + (1 - stepY) / 2) / rayDirY;
                }

                // Calculate height of line to draw on screen
                const lineHeight = Math.floor(h / perpWallDist);

                // Apply combined vertical offset to wall drawing position
                const drawOffset = effects.totalVerticalOffset;

                // Calculate lowest and highest pixel to fill in current stripe
                let drawStart = Math.floor(-lineHeight / 2 + h / 2) + drawOffset;
                if (drawStart < 0) drawStart = 0;

                let drawEnd = Math.floor(lineHeight / 2 + h / 2) + drawOffset;
                if (drawEnd >= h) drawEnd = h - 1;

                // Choose wall color (darker for side walls)
                let color;
                if (side === 1) {
                    color = 'rgba(150, 150, 150, 1)'; // Darker
                } else {
                    color = 'rgba(200, 200, 200, 1)'; // Lighter
                }

                // Draw the vertical line
                ctx.fillStyle = color;
                ctx.fillRect(x, drawStart, 1, drawEnd - drawStart);
            }
        }
    };
})(window.FPSGame);
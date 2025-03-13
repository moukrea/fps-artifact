// Pause menu rendering and interaction
(function (FPSGame) {
    // Draw pause menu
    FPSGame.drawPauseMenu = function (ctx, canvas) {
        // Darken the whole screen
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw menu background
        const menuWidth = canvas.width * 0.7;
        const menuHeight = canvas.height * 0.7;
        const menuX = (canvas.width - menuWidth) / 2;
        const menuY = (canvas.height - menuHeight) / 2;

        ctx.fillStyle = 'rgba(50, 50, 50, 0.9)';
        ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

        // Draw border
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

        // Draw title
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME PAUSED', canvas.width / 2, menuY + 40);

        // Calculate button dimensions
        const buttonWidth = menuWidth * 0.7;
        const buttonHeight = 50;
        const buttonX = (canvas.width - buttonWidth) / 2;
        const buttonSpacing = 20;

        // Draw resume button
        let buttonY = menuY + 100;
        ctx.fillStyle = 'rgba(100, 100, 200, 0.8)';
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        ctx.strokeStyle = 'rgba(150, 150, 255, 0.9)';
        ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText('RESUME GAME', canvas.width / 2, buttonY + buttonHeight / 2);

        // Store the resume button hitbox
        FPSGame.gameState.resumeButtonRect = {
            x: buttonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        };

        // Draw invert X axis toggle
        buttonY += buttonHeight + buttonSpacing;

        // Toggle background
        ctx.fillStyle = 'rgba(70, 70, 70, 0.8)';
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        ctx.strokeStyle = 'rgba(150, 150, 150, 0.9)';
        ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

        // Toggle state indicator
        const toggleSize = buttonHeight * 0.6;
        const toggleY = buttonY + (buttonHeight - toggleSize) / 2;
        const toggleLeftX = buttonX + buttonWidth - toggleSize - 20;

        // Draw toggle background
        ctx.fillStyle = FPSGame.gameState.invertXAxis ? 'rgba(0, 150, 0, 0.8)' : 'rgba(150, 0, 0, 0.8)';
        ctx.fillRect(toggleLeftX, toggleY, toggleSize, toggleSize);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(toggleLeftX, toggleY, toggleSize, toggleSize);

        // Draw toggle text
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText('Invert X Axis', buttonX + 20, buttonY + buttonHeight / 2);
        ctx.textAlign = 'center';
        ctx.fillText(FPSGame.gameState.invertXAxis ? 'ON' : 'OFF', toggleLeftX + toggleSize / 2, buttonY + buttonHeight / 2);

        // Store toggle X hitbox
        FPSGame.gameState.invertXToggleRect = {
            x: toggleLeftX,
            y: toggleY,
            width: toggleSize,
            height: toggleSize
        };

        // Draw invert Y axis toggle
        buttonY += buttonHeight + buttonSpacing;

        // Toggle background
        ctx.fillStyle = 'rgba(70, 70, 70, 0.8)';
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        ctx.strokeStyle = 'rgba(150, 150, 150, 0.9)';
        ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

        // Toggle state indicator
        const toggleY2 = buttonY + (buttonHeight - toggleSize) / 2;

        // Draw toggle background
        ctx.fillStyle = FPSGame.gameState.invertYAxis ? 'rgba(0, 150, 0, 0.8)' : 'rgba(150, 0, 0, 0.8)';
        ctx.fillRect(toggleLeftX, toggleY2, toggleSize, toggleSize);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(toggleLeftX, toggleY2, toggleSize, toggleSize);

        // Draw toggle text
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText('Invert Y Axis', buttonX + 20, buttonY + buttonHeight / 2);
        ctx.textAlign = 'center';
        ctx.fillText(FPSGame.gameState.invertYAxis ? 'ON' : 'OFF', toggleLeftX + toggleSize / 2, buttonY + buttonHeight / 2);

        // Store toggle Y hitbox
        FPSGame.gameState.invertYToggleRect = {
            x: toggleLeftX,
            y: toggleY2,
            width: toggleSize,
            height: toggleSize
        };
    };
})(window.FPSGame);
// UI layout calculations
(function (FPSGame) {
    // Calculate UI element positions based on canvas dimensions
    FPSGame.calculateLayout = function (canvas) {
        const width = canvas.width;
        const height = canvas.height;
        const aspectRatio = width / height;

        // Adjust positions based on aspect ratio
        let shootButtonX = width * 0.85;
        let reloadButtonX = width * 0.7;

        // If aspect ratio is wide, increase spacing between buttons
        if (aspectRatio > 1.5) {
            shootButtonX = width * 0.88;
            reloadButtonX = width * 0.65; // Move reload button further left on wide screens
        } else if (aspectRatio < 0.8) {
            // For tall/narrow screens, adjust spacing vertically
            shootButtonX = width * 0.85;
            reloadButtonX = width * 0.6;
        }

        return {
            // Joystick
            joystickCenterX: width * 0.15,
            joystickCenterY: height * 0.85,
            joystickRadius: Math.min(width, height) * 0.1,
            joystickThumbRadius: Math.min(width, height) * 0.05,

            // Buttons
            pauseButtonX: width * 0.9,
            pauseButtonY: height * 0.1,
            pauseButtonRadius: Math.min(width, height) * 0.03,

            shootButtonX: shootButtonX,
            shootButtonY: height * 0.85,
            shootButtonRadius: Math.min(width, height) * 0.07,

            reloadButtonX: reloadButtonX,
            reloadButtonY: height * 0.85,
            reloadButtonRadius: Math.min(width, height) * 0.05,

            // Camera control area
            cameraAreaX: width * 0.5,
            cameraAreaY: 0,
            cameraAreaWidth: width * 0.5,
            cameraAreaHeight: height
        };
    };

    // Check if a touch is inside a button
    FPSGame.isTouchInButton = function (x, y, buttonX, buttonY, buttonRadius) {
        const dx = x - buttonX;
        const dy = y - buttonY;
        return (dx * dx + dy * dy) <= (buttonRadius * buttonRadius);
    };
})(window.FPSGame);
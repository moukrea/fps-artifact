/**
 * Main.js - Entry point for the FPS game
 */
(function (FPSGame) {
    // Store window dimensions
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;

    // Initialize everything
    FPSGame.init = function (container, canvas) {
        console.log("FPS Artifact initializing...");

        // Set canvas dimensions
        resizeCanvas(canvas);

        // Add resize handler
        window.addEventListener('resize', () => resizeCanvas(canvas));

        // Start the game
        FPSGame.Game.init(container, canvas);
    };

    // Resize canvas to fit window
    function resizeCanvas(canvas) {
        // Get window dimensions
        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;

        // Set canvas dimensions
        canvas.width = windowWidth;
        canvas.height = windowHeight;
    }

    console.log("Main module loaded");
})(window.FPSGame);
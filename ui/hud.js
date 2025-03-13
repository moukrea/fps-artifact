// Weapon mechanics (shooting and reloading)
(function (FPSGame) {
    // Handle shooting
    FPSGame.shoot = function (state) {
        if (state.ammo > 0 && !FPSGame.isReloading) {
            // Update state
            FPSGame.isShooting = true;
            FPSGame.showFlash = true;
            state.ammo--;

            // Add camera shake effect - DRAMATICALLY INCREASED for guaranteed visibility
            state.shakeIntensity = 3.0;

            // Debug info to verify shooting happened
            console.log("Shot fired! Ammo: " + state.ammo + ", Shake: " + state.shakeIntensity);

            // Reset shooting state after a short delay
            setTimeout(function () {
                FPSGame.isShooting = false;
            }, 150);

            // Reset flash after a very short delay
            setTimeout(function () {
                FPSGame.showFlash = false;
            }, 80);
        } else if (state.ammo <= 0 && !FPSGame.isReloading) {
            // Auto-reload when empty
            FPSGame.reload(state);
        }
    };

    // Handle reloading
    FPSGame.reload = function (state) {
        if (state.ammo < state.maxAmmo && !FPSGame.isReloading) {
            FPSGame.isReloading = true;
            state.reloadStartTime = Date.now(); // Track when reload started

            console.log("Reloading weapon...");

            // Simulate reload time
            setTimeout(function () {
                state.ammo = state.maxAmmo;
                FPSGame.isReloading = false;
                console.log("Weapon reloaded!");
            }, state.reloadDuration);
        }
    };
})(window.FPSGame);
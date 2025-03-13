/**
 * Utils.js - Utility functions for the FPS game
 */
(function (FPSGame) {
    // Create Utils namespace
    FPSGame.Utils = {};

    // Clamp a value between min and max
    FPSGame.Utils.clamp = function (value, min, max) {
        return Math.max(min, Math.min(max, value));
    };

    // Linear interpolation
    FPSGame.Utils.lerp = function (a, b, t) {
        return a + (b - a) * t;
    };

    // Convert degrees to radians
    FPSGame.Utils.degToRad = function (degrees) {
        return degrees * Math.PI / 180;
    };

    // Convert radians to degrees
    FPSGame.Utils.radToDeg = function (radians) {
        return radians * 180 / Math.PI;
    };

    // Generate a random integer between min and max (inclusive)
    FPSGame.Utils.randomInt = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    // Generate a random float between min and max
    FPSGame.Utils.randomFloat = function (min, max) {
        return Math.random() * (max - min) + min;
    };

    // Check if mobile device
    FPSGame.Utils.isMobile = function () {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };

    // Deep clone an object
    FPSGame.Utils.deepClone = function (obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    // Calculate distance between two points
    FPSGame.Utils.distance = function (x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    };

    // Calculate angle between two points (in radians)
    FPSGame.Utils.angle = function (x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    };

    // Preload an image
    FPSGame.Utils.loadImage = function (url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            img.src = url;
        });
    };

    // Preload multiple images and return them as an object
    FPSGame.Utils.loadImages = function (urlsObj) {
        const promises = [];
        const result = {};

        for (const key in urlsObj) {
            const promise = FPSGame.Utils.loadImage(urlsObj[key])
                .then(img => {
                    result[key] = img;
                    return img;
                });
            promises.push(promise);
        }

        return Promise.all(promises).then(() => result);
    };

    // Format time in MM:SS format
    FPSGame.Utils.formatTime = function (seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Add event listener with automatic cleanup
    FPSGame.Utils.addEvent = function (element, type, handler) {
        element.addEventListener(type, handler);
        return {
            remove: function () {
                element.removeEventListener(type, handler);
            }
        };
    };

    // Ease functions
    FPSGame.Utils.Ease = {
        linear: t => t,
        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1,
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
    };

    // Simple state machine
    FPSGame.Utils.StateMachine = function () {
        let currentState = null;
        const states = {};

        return {
            add: function (name, state) {
                states[name] = state;
                return this;
            },
            setState: function (name, ...args) {
                if (!states[name]) {
                    console.error(`State '${name}' does not exist`);
                    return;
                }

                if (currentState && states[currentState].exit) {
                    states[currentState].exit();
                }

                currentState = name;

                if (states[currentState].enter) {
                    states[currentState].enter(...args);
                }

                return this;
            },
            update: function (deltaTime) {
                if (currentState && states[currentState].update) {
                    states[currentState].update(deltaTime);
                }
                return this;
            },
            getCurrentState: function () {
                return currentState;
            }
        };
    };

    // FPS counter
    FPSGame.Utils.FPSCounter = function () {
        let frameCount = 0;
        let lastTime = performance.now();
        let fps = 0;

        return {
            update: function () {
                const now = performance.now();
                frameCount++;

                if (now - lastTime > 1000) {
                    fps = Math.round((frameCount * 1000) / (now - lastTime));
                    frameCount = 0;
                    lastTime = now;
                }

                return fps;
            }
        };
    };

    console.log("Utils module loaded");
})(window.FPSGame);
/**
 * Utility functions for the FPS game
 */
(function (MyApp) {
    // Private variables
    const _private = {};

    /**
     * Generates a random integer between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random integer
     */
    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Clamps a value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum limit
     * @param {number} max - Maximum limit
     * @returns {number} Clamped value
     */
    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Checks if a value is between min and max (inclusive)
     * @param {number} value - Value to check
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {boolean} True if value is between min and max
     */
    function isBetween(value, min, max) {
        return value >= min && value <= max;
    }

    /**
     * Linear interpolation between two values
     * @param {number} a - First value
     * @param {number} b - Second value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} Interpolated value
     */
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * Detects if the device is a mobile device
     * @returns {boolean} True if device is mobile
     */
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Gets the canvas DPI to ensure proper rendering
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @returns {number} Device pixel ratio
     */
    function getDevicePixelRatio(canvas) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        // Get backup pixel ratio from CSS
        const bsr = (
            ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1
        );

        return dpr / bsr;
    }

    /**
     * Resizes a canvas to handle high DPI displays
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {number} width - Desired width
     * @param {number} height - Desired height
     */
    function resizeCanvas(canvas, width, height) {
        const ratio = getDevicePixelRatio(canvas);
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        const ctx = canvas.getContext('2d');
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

        return { width, height, ratio };
    }

    /**
     * Returns the current timestamp in milliseconds
     * @returns {number} Current timestamp
     */
    function now() {
        return performance.now();
    }

    /**
     * Formats a number with leading zeros
     * @param {number} num - Number to format
     * @param {number} size - Desired length
     * @returns {string} Formatted number
     */
    function padNumber(num, size) {
        let s = num.toString();
        while (s.length < size) s = '0' + s;
        return s;
    }

    /**
     * Converts degrees to radians
     * @param {number} degrees - Angle in degrees
     * @returns {number} Angle in radians
     */
    function degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Converts radians to degrees
     * @param {number} radians - Angle in radians
     * @returns {number} Angle in degrees
     */
    function radiansToDegrees(radians) {
        return radians * (180 / Math.PI);
    }

    /**
     * Gets distance between two 2D points
     * @param {number} x1 - X coordinate of first point
     * @param {number} y1 - Y coordinate of first point
     * @param {number} x2 - X coordinate of second point
     * @param {number} y2 - Y coordinate of second point
     * @returns {number} Distance between points
     */
    function distance2D(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Creates a simple guid for object identification
     * @returns {string} A unique identifier
     */
    function createGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Load an image and return a promise
     * @param {string} src - Image source URL
     * @returns {Promise<HTMLImageElement>} Promise resolving to loaded image
     */
    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    }

    /**
     * Simple event emitter implementation
     */
    class EventEmitter {
        constructor() {
            this.events = {};
        }

        on(event, listener) {
            if (!this.events[event]) {
                this.events[event] = [];
            }
            this.events[event].push(listener);
            return () => this.off(event, listener);
        }

        off(event, listener) {
            if (!this.events[event]) return;
            this.events[event] = this.events[event].filter(l => l !== listener);
        }

        emit(event, ...args) {
            if (!this.events[event]) return;
            this.events[event].forEach(listener => {
                try {
                    listener(...args);
                } catch (err) {
                    console.error(`Error in event listener for ${event}:`, err);
                }
            });
        }

        once(event, listener) {
            const remove = this.on(event, (...args) => {
                remove();
                listener(...args);
            });
        }
    }

    // Export public methods to namespace
    MyApp.Utils = {
        randomInt,
        clamp,
        isBetween,
        lerp,
        isMobileDevice,
        resizeCanvas,
        getDevicePixelRatio,
        now,
        padNumber,
        degreesToRadians,
        radiansToDegrees,
        distance2D,
        createGuid,
        loadImage,
        EventEmitter
    };

    console.log('Utils module loaded');
})(window.MyApp || (window.MyApp = {}));
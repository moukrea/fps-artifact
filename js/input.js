/**
 * Input handling module for keyboard, mouse and touch controls
 */
(function (MyApp) {
    // Dependencies
    const Utils = MyApp.Utils;

    // Private variables
    const _keys = {};
    const _mouse = {
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
        buttons: {
            left: false,
            right: false,
            middle: false
        },
        locked: false
    };
    const _touch = {
        active: false,
        joystick: {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            deltaX: 0,
            deltaY: 0
        },
        action: {
            shooting: false,
            reloading: false
        }
    };

    // Event emitter for input events
    const _events = new Utils.EventEmitter();

    // Config
    const _config = {
        keyMapping: {
            movement: {
                forward: ['w', 'z', 'ArrowUp'],
                backward: ['s', 'ArrowDown'],
                left: ['a', 'q', 'ArrowLeft'],
                right: ['d', 'ArrowRight']
            },
            actions: {
                shoot: ['Space', 'mouse0'],
                reload: ['r']
            }
        },
        mouseSensitivity: 0.15,
        touchSensitivity: 0.5,
        joystickThreshold: 10, // Minimum pixels of movement to register joystick input
        joystickMaxRadius: 50 // Maximum radius of joystick movement
    };

    /**
     * Initialize input handlers
     * @param {HTMLElement} element - Element to attach listeners to
     * @param {Object} config - Optional configuration
     */
    function init(element, config = {}) {
        // Merge config
        Object.assign(_config, config);

        // Set up event listeners
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        element.addEventListener('mousedown', handleMouseDown);
        element.addEventListener('mouseup', handleMouseUp);
        element.addEventListener('mousemove', handleMouseMove);
        element.addEventListener('contextmenu', (e) => e.preventDefault());
        element.addEventListener('wheel', handleMouseWheel);

        // Touch events for mobile
        if (Utils.isMobileDevice()) {
            element.addEventListener('touchstart', handleTouchStart);
            element.addEventListener('touchmove', handleTouchMove);
            element.addEventListener('touchend', handleTouchEnd);
            element.addEventListener('touchcancel', handleTouchEnd);
        }

        // Pointer lock API for mouse look
        element.addEventListener('click', () => {
            if (!_mouse.locked) {
                requestPointerLock(element);
            }
        });

        document.addEventListener('pointerlockchange', handlePointerLockChange);
        document.addEventListener('mozpointerlockchange', handlePointerLockChange);
        document.addEventListener('webkitpointerlockchange', handlePointerLockChange);

        console.log('Input system initialized');

        // Emit init event
        _events.emit('init');
    }

    /**
     * Request pointer lock on an element
     * @param {HTMLElement} element - Element to lock pointer to
     */
    function requestPointerLock(element) {
        element.requestPointerLock = element.requestPointerLock ||
            element.mozRequestPointerLock ||
            element.webkitRequestPointerLock;
        if (element.requestPointerLock) {
            element.requestPointerLock();
        }
    }

    /**
     * Handle pointer lock change
     */
    function handlePointerLockChange() {
        if (document.pointerLockElement ||
            document.mozPointerLockElement ||
            document.webkitPointerLockElement) {
            _mouse.locked = true;
            _events.emit('pointerLockChange', true);
        } else {
            _mouse.locked = false;
            _events.emit('pointerLockChange', false);
        }
    }

    /**
     * Handle key down events
     * @param {KeyboardEvent} e - Key event
     */
    function handleKeyDown(e) {
        const key = e.key.toLowerCase();
        _keys[key] = true;
        _events.emit('keyDown', key);
    }

    /**
     * Handle key up events
     * @param {KeyboardEvent} e - Key event
     */
    function handleKeyUp(e) {
        const key = e.key.toLowerCase();
        _keys[key] = false;
        _events.emit('keyUp', key);
    }

    /**
     * Handle mouse down events
     * @param {MouseEvent} e - Mouse event
     */
    function handleMouseDown(e) {
        e.preventDefault();
        switch (e.button) {
            case 0: // Left button
                _mouse.buttons.left = true;
                _events.emit('mouseDown', 'left');
                break;
            case 1: // Middle button
                _mouse.buttons.middle = true;
                _events.emit('mouseDown', 'middle');
                break;
            case 2: // Right button
                _mouse.buttons.right = true;
                _events.emit('mouseDown', 'right');
                break;
        }
    }

    /**
     * Handle mouse up events
     * @param {MouseEvent} e - Mouse event
     */
    function handleMouseUp(e) {
        e.preventDefault();
        switch (e.button) {
            case 0: // Left button
                _mouse.buttons.left = false;
                _events.emit('mouseUp', 'left');
                break;
            case 1: // Middle button
                _mouse.buttons.middle = false;
                _events.emit('mouseUp', 'middle');
                break;
            case 2: // Right button
                _mouse.buttons.right = false;
                _events.emit('mouseUp', 'right');
                break;
        }
    }

    /**
     * Handle mouse move events
     * @param {MouseEvent} e - Mouse event
     */
    function handleMouseMove(e) {
        // Get the element the mouse is over
        const rect = e.target.getBoundingClientRect();

        // Absolute position within element
        _mouse.x = e.clientX - rect.left;
        _mouse.y = e.clientY - rect.top;

        // Movement delta for mouse look (when pointer is locked)
        if (_mouse.locked) {
            _mouse.dx = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
            _mouse.dy = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

            // Apply sensitivity
            _mouse.dx *= _config.mouseSensitivity;
            _mouse.dy *= _config.mouseSensitivity;

            _events.emit('mouseLook', _mouse.dx, _mouse.dy);
        }

        _events.emit('mouseMove', _mouse.x, _mouse.y);
    }

    /**
     * Handle mouse wheel events
     * @param {WheelEvent} e - Wheel event
     */
    function handleMouseWheel(e) {
        e.preventDefault();
        const delta = Math.sign(e.deltaY);
        _events.emit('mouseWheel', delta);
    }

    /**
     * Handle touch start events
     * @param {TouchEvent} e - Touch event
     */
    function handleTouchStart(e) {
        e.preventDefault();
        _touch.active = true;

        const touches = e.touches;

        // Left side of screen is for movement (joystick)
        // Right side is for actions (shooting, reloading)
        const screenWidth = window.innerWidth;
        const screenMidpoint = screenWidth / 2;

        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];

            if (touch.clientX < screenMidpoint) {
                // Left side - joystick
                _touch.joystick.active = true;
                _touch.joystick.startX = touch.clientX;
                _touch.joystick.startY = touch.clientY;
                _touch.joystick.currentX = touch.clientX;
                _touch.joystick.currentY = touch.clientY;
                _touch.joystick.deltaX = 0;
                _touch.joystick.deltaY = 0;
            } else {
                // Right side - shooting
                _touch.action.shooting = true;
            }
        }

        _events.emit('touchStart', _touch);
    }

    /**
     * Handle touch move events
     * @param {TouchEvent} e - Touch event
     */
    function handleTouchMove(e) {
        e.preventDefault();

        const touches = e.touches;
        const screenWidth = window.innerWidth;
        const screenMidpoint = screenWidth / 2;

        // Update joystick position if active
        if (_touch.joystick.active) {
            for (let i = 0; i < touches.length; i++) {
                const touch = touches[i];

                if (touch.clientX < screenMidpoint) {
                    // Update joystick data
                    _touch.joystick.currentX = touch.clientX;
                    _touch.joystick.currentY = touch.clientY;

                    // Calculate delta from start position
                    _touch.joystick.deltaX = _touch.joystick.currentX - _touch.joystick.startX;
                    _touch.joystick.deltaY = _touch.joystick.currentY - _touch.joystick.startY;

                    // Limit to max radius
                    const distance = Math.sqrt(
                        _touch.joystick.deltaX * _touch.joystick.deltaX +
                        _touch.joystick.deltaY * _touch.joystick.deltaY
                    );

                    if (distance > _config.joystickMaxRadius) {
                        const ratio = _config.joystickMaxRadius / distance;
                        _touch.joystick.deltaX *= ratio;
                        _touch.joystick.deltaY *= ratio;
                    }

                    break;
                }
            }
        }

        // Right side logic for looking around
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];

            if (touch.clientX >= screenMidpoint) {
                // Calculate movement for camera look
                const movementX = touch.clientX - (touch.target.previousTouchX || touch.clientX);
                const movementY = touch.clientY - (touch.target.previousTouchY || touch.clientY);

                // Store for next move event
                touch.target.previousTouchX = touch.clientX;
                touch.target.previousTouchY = touch.clientY;

                // Apply sensitivity
                _mouse.dx = movementX * _config.touchSensitivity;
                _mouse.dy = movementY * _config.touchSensitivity;

                _events.emit('mouseLook', _mouse.dx, _mouse.dy);
                break;
            }
        }

        _events.emit('touchMove', _touch);
    }

    /**
     * Handle touch end events
     * @param {TouchEvent} e - Touch event
     */
    function handleTouchEnd(e) {
        e.preventDefault();

        // Reset touch data if all touches are gone
        if (e.touches.length === 0) {
            _touch.active = false;
            _touch.joystick.active = false;
            _touch.joystick.deltaX = 0;
            _touch.joystick.deltaY = 0;
            _touch.action.shooting = false;
            _touch.action.reloading = false;
        } else {
            // Check which touches remain
            const screenWidth = window.innerWidth;
            const screenMidpoint = screenWidth / 2;
            let hasLeftSideTouch = false;
            let hasRightSideTouch = false;

            for (let i = 0; i < e.touches.length; i++) {
                const touch = e.touches[i];
                if (touch.clientX < screenMidpoint) {
                    hasLeftSideTouch = true;
                } else {
                    hasRightSideTouch = true;
                }
            }

            // Update joystick state
            if (!hasLeftSideTouch) {
                _touch.joystick.active = false;
                _touch.joystick.deltaX = 0;
                _touch.joystick.deltaY = 0;
            }

            // Update shooting state
            if (!hasRightSideTouch) {
                _touch.action.shooting = false;
            }
        }

        _events.emit('touchEnd', _touch);
    }

    /**
     * Check if a specific key or any of the keys for an action is pressed
     * @param {string|Array} keyOrAction - Key or action name
     * @returns {boolean} True if the key/action is active
     */
    function isPressed(keyOrAction) {
        // Check if it's a direct key
        if (typeof keyOrAction === 'string') {
            // Handle mouse buttons represented as keys
            if (keyOrAction === 'mouse0') return _mouse.buttons.left;
            if (keyOrAction === 'mouse1') return _mouse.buttons.middle;
            if (keyOrAction === 'mouse2') return _mouse.buttons.right;

            // Regular keys
            return !!_keys[keyOrAction.toLowerCase()];
        }

        // Check if it's an array of keys (any match)
        if (Array.isArray(keyOrAction)) {
            return keyOrAction.some(key => isPressed(key));
        }

        // Check if it's a named action
        const actions = _config.keyMapping.actions;
        if (actions[keyOrAction]) {
            return isPressed(actions[keyOrAction]);
        }

        return false;
    }

    /**
     * Get the movement input vector based on current key states
     * @returns {Object} x,y movement vector (-1 to 1 on each axis)
     */
    function getMovementVector() {
        const movement = { x: 0, y: 0 };
        const { forward, backward, left, right } = _config.keyMapping.movement;

        // Check keyboard input
        if (forward.some(key => isPressed(key))) movement.y -= 1;
        if (backward.some(key => isPressed(key))) movement.y += 1;
        if (left.some(key => isPressed(key))) movement.x -= 1;
        if (right.some(key => isPressed(key))) movement.x += 1;

        // Check touch joystick if active
        if (_touch.joystick.active) {
            const jx = _touch.joystick.deltaX;
            const jy = _touch.joystick.deltaY;

            // Only count joystick if it's moved beyond threshold
            const dist = Math.sqrt(jx * jx + jy * jy);
            if (dist > _config.joystickThreshold) {
                // Normalize to -1 to 1 range
                movement.x = Utils.clamp(jx / _config.joystickMaxRadius, -1, 1);
                movement.y = Utils.clamp(jy / _config.joystickMaxRadius, -1, 1);
            }
        }

        // Normalize diagonal movement
        if (movement.x !== 0 && movement.y !== 0) {
            const length = Math.sqrt(movement.x * movement.x + movement.y * movement.y);
            movement.x /= length;
            movement.y /= length;
        }

        return movement;
    }

    /**
     * Check if the shoot action is currently active
     * @returns {boolean} True if shooting
     */
    function isShooting() {
        return isPressed(_config.keyMapping.actions.shoot) || _touch.action.shooting;
    }

    /**
     * Check if the reload action is currently active
     * @returns {boolean} True if reloading
     */
    function isReloading() {
        return isPressed(_config.keyMapping.actions.reload) || _touch.action.reloading;
    }

    /**
     * Get the current mouse look delta
     * @returns {Object} dx,dy mouse movement delta
     */
    function getMouseLookDelta() {
        const delta = { x: _mouse.dx, y: _mouse.dy };
        // Reset deltas after reading
        _mouse.dx = 0;
        _mouse.dy = 0;
        return delta;
    }

    /**
     * Clean up event listeners
     */
    function cleanup() {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);

        // Mouse and touch events would be cleaned up here
        // We might not call this method as the game runs until page unload
    }

    // Export the public API
    MyApp.Input = {
        init,
        isPressed,
        getMovementVector,
        isShooting,
        isReloading,
        getMouseLookDelta,
        on: (event, listener) => _events.on(event, listener),
        off: (event, listener) => _events.off(event, listener),
        cleanup
    };

    console.log('Input module loaded');
})(window.MyApp || (window.MyApp = {}));
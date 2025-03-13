/**
 * Input.js - Handles user input for the FPS game
 */
(function (FPSGame) {
    // Create Input namespace
    FPSGame.Input = {};

    // Initialize input system
    FPSGame.Input.init = function (element) {
        // Current state of keys and mouse
        const keys = {};
        const mouse = {
            x: 0,
            y: 0,
            dx: 0,
            dy: 0,
            buttons: [false, false, false],
            locked: false
        };

        // Touch state
        const touch = {
            active: false,
            startX: 0,
            startY: 0,
            moveX: 0,
            moveY: 0,
            dx: 0,
            dy: 0
        };

        // Virtual joystick for mobile
        const virtualJoystick = {
            active: false,
            centerX: 0,
            centerY: 0,
            currentX: 0,
            currentY: 0,
            dx: 0,
            dy: 0,
            maxDistance: 50
        };

        // Touch buttons
        const touchButtons = {
            shoot: false,
            jump: false,
            reload: false,
            action: false
        };

        // Gamepad state
        const gamepad = {
            active: false,
            leftStick: { x: 0, y: 0 },
            rightStick: { x: 0, y: 0 },
            buttons: {}
        };

        // Check if device supports touch
        const isTouchDevice = 'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0;

        // Pointer lock support
        const pointerLockAvailable = 'pointerLockElement' in document ||
            'mozPointerLockElement' in document ||
            'webkitPointerLockElement' in document;

        // Key event handlers
        const onKeyDown = function (e) {
            keys[e.code] = true;

            // Prevent default for game controls
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
                e.preventDefault();
            }
        };

        const onKeyUp = function (e) {
            keys[e.code] = false;
        };

        // Mouse event handlers
        const onMouseMove = function (e) {
            mouse.x = e.clientX;
            mouse.y = e.clientY;

            if (mouse.locked) {
                mouse.dx += e.movementX || e.mozMovementX || e.webkitMovementX || 0;
                mouse.dy += e.movementY || e.mozMovementY || e.webkitMovementY || 0;
            }
        };

        const onMouseDown = function (e) {
            mouse.buttons[e.button] = true;

            // Request pointer lock on click
            if (!mouse.locked && pointerLockAvailable) {
                requestPointerLock(element);
            }

            e.preventDefault();
        };

        const onMouseUp = function (e) {
            mouse.buttons[e.button] = false;
            e.preventDefault();
        };

        // Touch event handlers
        const onTouchStart = function (e) {
            e.preventDefault();

            // Activate touch mode
            touch.active = true;

            // Get first touch
            if (e.touches.length > 0) {
                const t = e.touches[0];
                touch.startX = t.clientX;
                touch.startY = t.clientY;
                touch.moveX = t.clientX;
                touch.moveY = t.clientY;

                // Initialize virtual joystick
                virtualJoystick.active = true;
                virtualJoystick.centerX = t.clientX;
                virtualJoystick.centerY = t.clientY;
                virtualJoystick.currentX = t.clientX;
                virtualJoystick.currentY = t.clientY;
            }

            // Check for touch buttons
            processTouchButtons(e.touches);
        };

        const onTouchMove = function (e) {
            e.preventDefault();

            if (e.touches.length > 0) {
                const t = e.touches[0];
                touch.moveX = t.clientX;
                touch.moveY = t.clientY;

                // Update virtual joystick
                if (virtualJoystick.active) {
                    virtualJoystick.currentX = t.clientX;
                    virtualJoystick.currentY = t.clientY;

                    // Calculate joystick delta
                    let dx = virtualJoystick.currentX - virtualJoystick.centerX;
                    let dy = virtualJoystick.currentY - virtualJoystick.centerY;

                    // Limit to max distance
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance > virtualJoystick.maxDistance) {
                        const scaleFactor = virtualJoystick.maxDistance / distance;
                        dx *= scaleFactor;
                        dy *= scaleFactor;
                    }

                    virtualJoystick.dx = dx / virtualJoystick.maxDistance;
                    virtualJoystick.dy = dy / virtualJoystick.maxDistance;
                }

                // Calculate touch movement
                touch.dx = touch.moveX - touch.startX;
                touch.dy = touch.moveY - touch.startY;
            }

            // Update touch buttons
            processTouchButtons(e.touches);
        };

        const onTouchEnd = function (e) {
            e.preventDefault();

            if (e.touches.length === 0) {
                // Reset touch and virtual joystick
                touch.active = false;
                virtualJoystick.active = false;
                virtualJoystick.dx = 0;
                virtualJoystick.dy = 0;
                touchButtons.shoot = false;
                touchButtons.jump = false;
                touchButtons.reload = false;
                touchButtons.action = false;
            } else {
                // Update touch buttons
                processTouchButtons(e.touches);
            }
        };

        // Process touch button inputs based on touch positions
        const processTouchButtons = function (touches) {
            // Reset all buttons
            touchButtons.shoot = false;
            touchButtons.jump = false;
            touchButtons.reload = false;
            touchButtons.action = false;

            // Process each touch
            for (let i = 0; i < touches.length; i++) {
                const t = touches[i];

                // Right side of screen
                if (t.clientX > window.innerWidth / 2) {
                    // Bottom right = shoot
                    if (t.clientY > window.innerHeight * 0.7) {
                        touchButtons.shoot = true;
                    }
                    // Middle right = jump
                    else if (t.clientY > window.innerHeight * 0.4) {
                        touchButtons.jump = true;
                    }
                    // Top right = reload
                    else {
                        touchButtons.reload = true;
                    }
                }
                // Left side but not where joystick is
                else if (t.clientX < window.innerWidth / 2 &&
                    Math.abs(t.clientX - virtualJoystick.centerX) > virtualJoystick.maxDistance * 2 &&
                    Math.abs(t.clientY - virtualJoystick.centerY) > virtualJoystick.maxDistance * 2) {
                    touchButtons.action = true;
                }
            }
        };

        // Pointer lock handlers
        const onPointerLockChange = function () {
            mouse.locked = document.pointerLockElement === element ||
                document.mozPointerLockElement === element ||
                document.webkitPointerLockElement === element;
        };

        const onPointerLockError = function () {
            console.error('Pointer lock error');
            mouse.locked = false;
        };

        const requestPointerLock = function (element) {
            element.requestPointerLock = element.requestPointerLock ||
                element.mozRequestPointerLock ||
                element.webkitRequestPointerLock;
            if (element.requestPointerLock) {
                element.requestPointerLock();
            }
        };

        // Gamepad handlers
        const updateGamepads = function () {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() :
                (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);

            if (!gamepads) {
                return;
            }

            let activeGamepad = null;

            // Look for an active gamepad
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i] && gamepads[i].connected) {
                    activeGamepad = gamepads[i];
                    gamepad.active = true;
                    break;
                }
            }

            if (!activeGamepad) {
                gamepad.active = false;
                return;
            }

            // Update left stick (with deadzone)
            const deadzone = 0.1;
            gamepad.leftStick.x = Math.abs(activeGamepad.axes[0]) > deadzone ? activeGamepad.axes[0] : 0;
            gamepad.leftStick.y = Math.abs(activeGamepad.axes[1]) > deadzone ? activeGamepad.axes[1] : 0;

            // Update right stick (with deadzone)
            gamepad.rightStick.x = Math.abs(activeGamepad.axes[2]) > deadzone ? activeGamepad.axes[2] : 0;
            gamepad.rightStick.y = Math.abs(activeGamepad.axes[3]) > deadzone ? activeGamepad.axes[3] : 0;

            // Update buttons
            for (let i = 0; i < activeGamepad.buttons.length; i++) {
                gamepad.buttons[i] = activeGamepad.buttons[i].pressed;
            }
        };

        // Attach event listeners
        const addEventListeners = function () {
            // Keyboard events
            window.addEventListener('keydown', onKeyDown);
            window.addEventListener('keyup', onKeyUp);

            // Mouse events
            element.addEventListener('mousemove', onMouseMove);
            element.addEventListener('mousedown', onMouseDown);
            element.addEventListener('mouseup', onMouseUp);

            // Touch events
            if (isTouchDevice) {
                element.addEventListener('touchstart', onTouchStart, { passive: false });
                element.addEventListener('touchmove', onTouchMove, { passive: false });
                element.addEventListener('touchend', onTouchEnd, { passive: false });
            }

            // Pointer lock events
            document.addEventListener('pointerlockchange', onPointerLockChange);
            document.addEventListener('mozpointerlockchange', onPointerLockChange);
            document.addEventListener('webkitpointerlockchange', onPointerLockChange);
            document.addEventListener('pointerlockerror', onPointerLockError);
            document.addEventListener('mozpointerlockerror', onPointerLockError);
            document.addEventListener('webkitpointerlockerror', onPointerLockError);

            // Window events
            window.addEventListener('blur', () => {
                // Reset keys when window loses focus
                for (const key in keys) {
                    keys[key] = false;
                }
                mouse.buttons = [false, false, false];
            });
        };

        // Remove event listeners
        const removeEventListeners = function () {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);

            element.removeEventListener('mousemove', onMouseMove);
            element.removeEventListener('mousedown', onMouseDown);
            element.removeEventListener('mouseup', onMouseUp);

            if (isTouchDevice) {
                element.removeEventListener('touchstart', onTouchStart);
                element.removeEventListener('touchmove', onTouchMove);
                element.removeEventListener('touchend', onTouchEnd);
            }

            document.removeEventListener('pointerlockchange', onPointerLockChange);
            document.removeEventListener('mozpointerlockchange', onPointerLockChange);
            document.removeEventListener('webkitpointerlockchange', onPointerLockChange);
            document.removeEventListener('pointerlockerror', onPointerLockError);
            document.removeEventListener('mozpointerlockerror', onPointerLockError);
            document.removeEventListener('webkitpointerlockerror', onPointerLockError);
        };

        // Update function called every frame
        const update = function () {
            // Reset mouse delta
            const mouseDeltaX = mouse.dx;
            const mouseDeltaY = mouse.dy;
            mouse.dx = 0;
            mouse.dy = 0;

            // Update gamepad state
            updateGamepads();

            return {
                keys,
                mouse: {
                    x: mouse.x,
                    y: mouse.y,
                    dx: mouseDeltaX,
                    dy: mouseDeltaY,
                    buttons: mouse.buttons.slice(),
                    locked: mouse.locked
                },
                touch: {
                    active: touch.active,
                    dx: touch.dx,
                    dy: touch.dy
                },
                virtualJoystick: {
                    active: virtualJoystick.active,
                    dx: virtualJoystick.dx,
                    dy: virtualJoystick.dy
                },
                touchButtons: {
                    shoot: touchButtons.shoot,
                    jump: touchButtons.jump,
                    reload: touchButtons.reload,
                    action: touchButtons.action
                },
                gamepad: {
                    active: gamepad.active,
                    leftStick: {
                        x: gamepad.leftStick.x,
                        y: gamepad.leftStick.y
                    },
                    rightStick: {
                        x: gamepad.rightStick.x,
                        y: gamepad.rightStick.y
                    },
                    buttons: { ...gamepad.buttons }
                }
            };
        };

        // Add event listeners
        addEventListeners();

        // Public interface
        return {
            update,
            isKeyPressed: (code) => !!keys[code],
            isMouseButtonPressed: (button) => !!mouse.buttons[button],
            isPointerLocked: () => mouse.locked,
            requestPointerLock: () => requestPointerLock(element),
            exitPointerLock: () => document.exitPointerLock(),
            isTouchDevice: () => isTouchDevice,
            destroy: removeEventListeners
        };
    };

    console.log("Input module loaded");
})(window.FPSGame);
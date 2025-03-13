/**
 * Player.js - Handles player controller and physics
 */
(function (FPSGame) {
    // Create Player namespace
    FPSGame.Player = {};

    // Player controller class
    FPSGame.Player.Controller = class Controller {
        constructor() {
            // Player state
            this.position = new FPSGame.Math.Vector2(2, 2);
            this.velocity = new FPSGame.Math.Vector2(0, 0);
            this.direction = new FPSGame.Math.Vector2(1, 0);
            this.plane = new FPSGame.Math.Vector2(0, 0.66); // Camera plane

            // Player properties
            this.moveSpeed = 3.0; // Units per second
            this.rotateSpeed = 2.0; // Radians per second
            this.strafeSpeed = 2.5; // Units per second
            this.runMultiplier = 1.5; // Speed multiplier when running
            this.mouseSensitivity = 0.002;

            // Physics properties
            this.radius = 0.25; // Collision radius
            this.height = 1.8; // Player height

            // Player stats
            this.health = 100;
            this.maxHealth = 100;
            this.armor = 0;
            this.maxArmor = 100;

            // Weapon
            this.weapon = null;

            // Footstep timing
            this.footstepTime = 0;
            this.footstepInterval = 0.5; // Time between footsteps

            // View bobbing
            this.bobPhase = 0;
            this.bobAmount = 0;
            this.maxBobAmount = 0.01;

            // Movement state
            this.isMoving = false;
            this.isRunning = false;
            this.isShooting = false;

            // Damage effect
            this.damageEffect = 0;

            // Whether player is dead
            this.isDead = false;
        }

        // Initialize the player
        init(map) {
            // Set initial position to a spawn point
            const spawnPoint = map.getRandomSpawnPoint();
            this.position.set(spawnPoint.x, spawnPoint.y);

            // Set initial direction
            this.setRotation(spawnPoint.angle || 0);
        }

        // Set player rotation angle
        setRotation(angle) {
            // Calculate direction vector from angle
            this.direction.set(Math.cos(angle), Math.sin(angle));

            // Calculate perpendicular camera plane
            this.plane.set(this.direction.y * 0.66, -this.direction.x * 0.66);
        }

        // Rotate player by angle
        rotate(angle) {
            // Rotate direction vector
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            const oldDirX = this.direction.x;
            this.direction.x = oldDirX * cos - this.direction.y * sin;
            this.direction.y = oldDirX * sin + this.direction.y * cos;

            // Rotate camera plane
            const oldPlaneX = this.plane.x;
            this.plane.x = oldPlaneX * cos - this.plane.y * sin;
            this.plane.y = oldPlaneX * sin + this.plane.y * cos;
        }

        // Handle player input
        handleInput(input, deltaTime) {
            if (this.isDead) return;

            const keys = input.keys || {};
            const mouse = input.mouse || {};

            // Get any gamepad or virtual joystick input
            const gamepad = (input.gamepad && input.gamepad.active) ? input.gamepad : null;
            const touchJoystick = (input.virtualJoystick && input.virtualJoystick.active) ? input.virtualJoystick : null;

            // Determine if running
            this.isRunning = keys['ShiftLeft'] || keys['ShiftRight'] ||
                (gamepad && gamepad.buttons[10]) || // Left shoulder button
                false;

            // Movement speed factoring in run state
            const effectiveSpeed = this.moveSpeed * (this.isRunning ? this.runMultiplier : 1) * deltaTime;
            const effectiveStrafe = this.strafeSpeed * (this.isRunning ? this.runMultiplier : 1) * deltaTime;

            // Reset movement state
            this.isMoving = false;

            // Forward/backward movement
            let moveX = 0;
            let moveY = 0;

            // Keyboard movement (WASD/Arrows)
            if (keys['KeyW'] || keys['ArrowUp']) {
                moveX += this.direction.x * effectiveSpeed;
                moveY += this.direction.y * effectiveSpeed;
                this.isMoving = true;
            }
            if (keys['KeyS'] || keys['ArrowDown']) {
                moveX -= this.direction.x * effectiveSpeed;
                moveY -= this.direction.y * effectiveSpeed;
                this.isMoving = true;
            }
            if (keys['KeyA'] || keys['ArrowLeft']) {
                moveX += this.direction.y * effectiveStrafe;
                moveY -= this.direction.x * effectiveStrafe;
                this.isMoving = true;
            }
            if (keys['KeyD'] || keys['ArrowRight']) {
                moveX -= this.direction.y * effectiveStrafe;
                moveY += this.direction.x * effectiveStrafe;
                this.isMoving = true;
            }

            // Gamepad movement
            if (gamepad) {
                // Left stick for movement
                const leftX = gamepad.leftStick.x;
                const leftY = gamepad.leftStick.y;

                if (Math.abs(leftX) > 0.1 || Math.abs(leftY) > 0.1) {
                    // Forward/backward
                    moveX += this.direction.x * -leftY * effectiveSpeed;
                    moveY += this.direction.y * -leftY * effectiveSpeed;

                    // Strafe left/right
                    moveX += this.direction.y * leftX * effectiveStrafe;
                    moveY -= this.direction.x * leftX * effectiveStrafe;

                    this.isMoving = true;
                }

                // Right stick for rotation
                const rightX = gamepad.rightStick.x;
                if (Math.abs(rightX) > 0.1) {
                    this.rotate(-rightX * this.rotateSpeed * deltaTime);
                }
            }

            // Touch joystick movement
            if (touchJoystick) {
                const joyX = touchJoystick.dx;
                const joyY = touchJoystick.dy;

                if (Math.abs(joyX) > 0.1 || Math.abs(joyY) > 0.1) {
                    // Forward/backward
                    moveX += this.direction.x * -joyY * effectiveSpeed;
                    moveY += this.direction.y * -joyY * effectiveSpeed;

                    // Strafe left/right
                    moveX += this.direction.y * joyX * effectiveStrafe;
                    moveY -= this.direction.x * joyX * effectiveStrafe;

                    this.isMoving = true;
                }
            }

            // Apply movement with collision detection
            if (moveX !== 0 || moveY !== 0) {
                this.move(moveX, moveY, input.map);
            }

            // Mouse look
            if (mouse.locked && (mouse.dx !== 0 || mouse.dy !== 0)) {
                // Horizontal mouse movement rotates the player
                this.rotate(-mouse.dx * this.mouseSensitivity);

                // TODO: Vertical mouse movement for looking up/down (not implemented in this raycaster)
            }

            // Shooting
            this.isShooting = (mouse.buttons && mouse.buttons[0]) ||
                (keys['Space']) ||
                (gamepad && gamepad.buttons[7]) || // Right trigger
                (input.touchButtons && input.touchButtons.shoot) ||
                false;

            if (this.weapon && this.isShooting) {
                this.weapon.triggerPull();
            } else if (this.weapon) {
                this.weapon.triggerRelease();
            }

            // Reload
            const isReloading = keys['KeyR'] ||
                (gamepad && gamepad.buttons[2]) || // X button
                (input.touchButtons && input.touchButtons.reload) ||
                false;

            if (this.weapon && isReloading) {
                this.weapon.reload();
            }

            // Switch weapons (1-9 keys)
            for (let i = 1; i <= 9; i++) {
                if (keys[`Digit${i}`]) {
                    // TODO: Implement weapon switching
                }
            }

            // Update view bobbing
            if (this.isMoving) {
                this.bobPhase += deltaTime * (this.isRunning ? 10 : 5);
                this.bobAmount = this.maxBobAmount;
            } else {
                this.bobAmount = Math.max(0, this.bobAmount - deltaTime * 2);
            }

            // Handle footsteps
            if (this.isMoving) {
                this.footstepTime += deltaTime;
                if (this.footstepTime >= this.footstepInterval / (this.isRunning ? 1.5 : 1)) {
                    // TODO: Play footstep sound
                    this.footstepTime = 0;
                }
            } else {
                this.footstepTime = 0;
            }

            // Damage effect fade out
            if (this.damageEffect > 0) {
                this.damageEffect = Math.max(0, this.damageEffect - deltaTime);
            }
        }

        // Move player with collision detection
        move(dx, dy, map) {
            if (!map) return;

            // Try X movement
            const newX = this.position.x + dx;
            if (!map.isPointInWall(newX, this.position.y, this.radius)) {
                this.position.x = newX;
            }

            // Try Y movement
            const newY = this.position.y + dy;
            if (!map.isPointInWall(this.position.x, newY, this.radius)) {
                this.position.y = newY;
            }
        }

        // Apply damage to player
        takeDamage(amount, attacker) {
            if (this.isDead) return;

            // Reduce damage by armor
            let remainingDamage = amount;

            if (this.armor > 0) {
                // Armor absorbs 2/3 of damage
                const armorAbsorption = Math.min(this.armor, remainingDamage * 2 / 3);
                this.armor -= armorAbsorption;
                remainingDamage -= armorAbsorption;
            }

            // Apply remaining damage to health
            this.health -= remainingDamage;

            // Activate damage effect
            this.damageEffect = 1.0;

            // Check if dead
            if (this.health <= 0) {
                this.health = 0;
                this.die();
            }

            // TODO: Play damage sound
        }

        // Handle player death
        die() {
            this.isDead = true;
            this.health = 0;

            // TODO: Play death sound
            // TODO: Trigger game over
        }

        // Add health
        addHealth(amount) {
            this.health = Math.min(this.maxHealth, this.health + amount);
            return this.health === this.maxHealth;
        }

        // Add armor
        addArmor(amount) {
            this.armor = Math.min(this.maxArmor, this.armor + amount);
            return this.armor === this.maxArmor;
        }

        // Check if player is in range of an entity
        isInRangeOf(entity, range) {
            const dx = this.position.x - entity.position.x;
            const dy = this.position.y - entity.position.y;
            const distSquared = dx * dx + dy * dy;
            return distSquared <= range * range;
        }

        // Get the direction to an entity
        directionTo(entity) {
            const dx = entity.position.x - this.position.x;
            const dy = entity.position.y - this.position.y;
            return Math.atan2(dy, dx);
        }

        // Reset player to initial state
        reset(map) {
            this.health = this.maxHealth;
            this.armor = 0;
            this.isDead = false;
            this.damageEffect = 0;

            if (map) {
                this.init(map);
            }
        }
    };

    console.log("Player module loaded");
})(window.FPSGame);
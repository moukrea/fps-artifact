/**
 * Enemy module for the FPS game
 * Handles enemy AI, behavior and state
 */
(function (MyApp) {
    // Dependencies
    const Utils = MyApp.Utils;
    const Math3D = MyApp.Math3D;
    const Vector3 = Math3D.Vector3;
    const Ray = Math3D.Ray;

    // Enemy types enum
    const ENEMY_TYPE = {
        BASIC: 0,
        FAST: 1,
        TOUGH: 2,
        BOSS: 3
    };

    // Enemy states enum
    const ENEMY_STATE = {
        IDLE: 0,
        PATROL: 1,
        CHASE: 2,
        ATTACK: 3,
        STUNNED: 4,
        DEAD: 5
    };

    // Enemy class
    class Enemy {
        /**
         * Create a new enemy
         * @param {Object} options - Enemy options
         */
        constructor(options = {}) {
            // Basic properties
            this.id = Utils.createGuid();
            this.type = options.type || ENEMY_TYPE.BASIC;
            this.position = options.position || new Vector3(0, 0, 0);
            this.rotation = options.rotation || 0; // Yaw rotation in radians
            this.direction = new Vector3(0, 0, 1); // Forward vector
            this.targetPosition = null; // Current target position (for patrolling)
            this.playerLastKnownPosition = null; // Last known player position

            // State and behavior
            this.state = ENEMY_STATE.IDLE;
            this.stateDuration = 0; // How long in current state
            this.stateChangeTime = Utils.randomInt(3000, 6000); // When to consider changing state
            this.lastStateChange = Utils.now();
            this.patrolPoints = []; // For patrol behavior

            // Physics and movement
            this.velocity = new Vector3(0, 0, 0);
            this.speed = 0;
            this.maxSpeed = this._getMaxSpeedForType();
            this.acceleration = 0.01;
            this.turnSpeed = 0.05; // Radians per frame at 60fps
            this.radius = 0.4; // Collision radius
            this.height = 1.8; // Height for collision

            // Combat stats
            this.health = this._getHealthForType();
            this.maxHealth = this.health;
            this.damage = this._getDamageForType();
            this.attackRange = 1.5;
            this.attackCooldown = 1000; // 1 second between attacks
            this.lastAttackTime = 0;
            this.sightRange = this._getSightRangeForType();
            this.hearingRange = this.sightRange * 0.7;

            // Visual properties
            this.textureId = this.type;
            this.animationFrame = 0;
            this.animationSpeed = 0.1;
            this.visible = true;

            // AI properties
            this.intelligence = this._getIntelligenceForType();
            this.aggressiveness = this._getAggressivenessForType();
            this.canSeePlayer = false;
            this.canHearPlayer = false;
            this.targetPlayer = null; // Reference to player object

            // Apply custom options
            if (options) {
                Object.assign(this, options);
            }

            // Set up initial direction based on rotation
            this._updateDirection();
        }

        /**
         * Update enemy state and position
         * @param {number} deltaTime - Time since last update
         * @param {Object} player - Player object
         * @param {Object} map - Map object
         * @param {Array} enemies - Array of all enemies
         */
        update(deltaTime, player, map, enemies) {
            // Skip update if the enemy is dead
            if (this.state === ENEMY_STATE.DEAD) {
                return;
            }

            // Update target player reference
            this.targetPlayer = player;

            // Check for state timeout and transitions
            this._updateState(deltaTime);

            // Check if enemy can detect the player
            this._updateSenses(player, map);

            // Update behavior based on current state
            switch (this.state) {
                case ENEMY_STATE.IDLE:
                    this._updateIdle(deltaTime);
                    break;
                case ENEMY_STATE.PATROL:
                    this._updatePatrol(deltaTime, map);
                    break;
                case ENEMY_STATE.CHASE:
                    this._updateChase(deltaTime, player, map);
                    break;
                case ENEMY_STATE.ATTACK:
                    this._updateAttack(deltaTime, player);
                    break;
                case ENEMY_STATE.STUNNED:
                    this._updateStunned(deltaTime);
                    break;
            }

            // Apply physics and movement
            this._updatePhysics(deltaTime, map, enemies);

            // Update animation
            this._updateAnimation(deltaTime);
        }

        /**
         * Damage the enemy
         * @param {number} amount - Damage amount
         * @param {Vector3} hitPos - Hit position for feedback
         * @returns {boolean} True if the enemy died
         */
        damage(amount, hitPos) {
            // Apply damage
            this.health -= amount;

            // Check if dead
            if (this.health <= 0) {
                this.health = 0;
                this.state = ENEMY_STATE.DEAD;
                this.velocity.set(0, 0, 0);
                // Fall down
                this.position.y = -0.5;
                return true;
            }

            // Apply stun effect if hit hard enough
            if (amount > 20) {
                this.state = ENEMY_STATE.STUNNED;
                this.stateDuration = 0;
                this.lastStateChange = Utils.now();
            }

            // Alert the enemy to the player's presence
            if (this.state !== ENEMY_STATE.CHASE && this.state !== ENEMY_STATE.ATTACK) {
                this.state = ENEMY_STATE.CHASE;
                this.stateDuration = 0;
                this.lastStateChange = Utils.now();
            }

            return false;
        }

        /**
         * Check if the enemy is dead
         * @returns {boolean} True if dead
         */
        isDead() {
            return this.state === ENEMY_STATE.DEAD;
        }

        /**
         * Get initial health based on enemy type
         * @returns {number} Health value
         */
        _getHealthForType() {
            switch (this.type) {
                case ENEMY_TYPE.BASIC:
                    return 50;
                case ENEMY_TYPE.FAST:
                    return 30;
                case ENEMY_TYPE.TOUGH:
                    return 100;
                case ENEMY_TYPE.BOSS:
                    return 250;
                default:
                    return 50;
            }
        }

        /**
         * Get max speed based on enemy type
         * @returns {number} Max speed
         */
        _getMaxSpeedForType() {
            switch (this.type) {
                case ENEMY_TYPE.BASIC:
                    return 0.03;
                case ENEMY_TYPE.FAST:
                    return 0.05;
                case ENEMY_TYPE.TOUGH:
                    return 0.02;
                case ENEMY_TYPE.BOSS:
                    return 0.015;
                default:
                    return 0.03;
            }
        }

        /**
         * Get damage value based on enemy type
         * @returns {number} Damage value
         */
        _getDamageForType() {
            switch (this.type) {
                case ENEMY_TYPE.BASIC:
                    return 10;
                case ENEMY_TYPE.FAST:
                    return 5;
                case ENEMY_TYPE.TOUGH:
                    return 15;
                case ENEMY_TYPE.BOSS:
                    return 25;
                default:
                    return 10;
            }
        }

        /**
         * Get sight range based on enemy type
         * @returns {number} Sight range
         */
        _getSightRangeForType() {
            switch (this.type) {
                case ENEMY_TYPE.BASIC:
                    return 10;
                case ENEMY_TYPE.FAST:
                    return 8;
                case ENEMY_TYPE.TOUGH:
                    return 12;
                case ENEMY_TYPE.BOSS:
                    return 15;
                default:
                    return 10;
            }
        }

        /**
         * Get intelligence level based on enemy type
         * @returns {number} Intelligence (0-1)
         */
        _getIntelligenceForType() {
            switch (this.type) {
                case ENEMY_TYPE.BASIC:
                    return 0.5;
                case ENEMY_TYPE.FAST:
                    return 0.7;
                case ENEMY_TYPE.TOUGH:
                    return 0.3;
                case ENEMY_TYPE.BOSS:
                    return 0.9;
                default:
                    return 0.5;
            }
        }

        /**
         * Get aggressiveness level based on enemy type
         * @returns {number} Aggressiveness (0-1)
         */
        _getAggressivenessForType() {
            switch (this.type) {
                case ENEMY_TYPE.BASIC:
                    return 0.5;
                case ENEMY_TYPE.FAST:
                    return 0.8;
                case ENEMY_TYPE.TOUGH:
                    return 0.6;
                case ENEMY_TYPE.BOSS:
                    return 0.9;
                default:
                    return 0.5;
            }
        }

        /**
         * Update enemy state and handle transitions
         * @param {number} deltaTime - Time since last update
         */
        _updateState(deltaTime) {
            // Update time in current state
            const now = Utils.now();
            this.stateDuration = now - this.lastStateChange;

            // Check for state transitions based on duration
            if (this.stateDuration >= this.stateChangeTime) {
                // Consider changing state
                switch (this.state) {
                    case ENEMY_STATE.IDLE:
                        // Idle -> Patrol
                        if (Math.random() < 0.7) {
                            this.state = ENEMY_STATE.PATROL;
                            this._setRandomPatrolPoint();
                        }
                        break;

                    case ENEMY_STATE.PATROL:
                        // Patrol -> Idle
                        if (Math.random() < 0.3) {
                            this.state = ENEMY_STATE.IDLE;
                        }
                        break;

                    case ENEMY_STATE.CHASE:
                        // Chase -> Patrol (if lost player)
                        if (!this.canSeePlayer && !this.canHearPlayer) {
                            this.playerLastKnownPosition = null;
                            this.state = ENEMY_STATE.PATROL;
                            this._setRandomPatrolPoint();
                        }
                        break;

                    case ENEMY_STATE.STUNNED:
                        // Stunned -> Chase
                        this.state = ENEMY_STATE.CHASE;
                        break;
                }

                // Reset state timer
                this.lastStateChange = now;
                this.stateChangeTime = Utils.randomInt(3000, 6000);

                // Shorter state duration when chasing
                if (this.state === ENEMY_STATE.CHASE) {
                    this.stateChangeTime = 1000;
                }
            }

            // Handle immediate state transitions

            // If enemy sees or hears player, start chasing
            if ((this.canSeePlayer || this.canHearPlayer) &&
                this.state !== ENEMY_STATE.CHASE &&
                this.state !== ENEMY_STATE.ATTACK &&
                this.state !== ENEMY_STATE.STUNNED) {
                this.state = ENEMY_STATE.CHASE;
                this.lastStateChange = now;
            }

            // If in chase mode and player is in attack range, attack
            if (this.state === ENEMY_STATE.CHASE &&
                this.targetPlayer &&
                this.position.distanceTo(this.targetPlayer.position) <= this.attackRange) {
                this.state = ENEMY_STATE.ATTACK;
                this.lastStateChange = now;
            }

            // If attacking and player moved out of range, go back to chase
            if (this.state === ENEMY_STATE.ATTACK &&
                this.targetPlayer &&
                this.position.distanceTo(this.targetPlayer.position) > this.attackRange) {
                this.state = ENEMY_STATE.CHASE;
                this.lastStateChange = now;
            }
        }

        /**
         * Update enemy senses - check if can see or hear player
         * @param {Object} player - Player object
         * @param {Object} map - Map object for line of sight check
         */
        _updateSenses(player, map) {
            // Reset sense flags
            this.canSeePlayer = false;
            this.canHearPlayer = false;

            // Skip if no player or player is dead
            if (!player || player.isDead()) {
                return;
            }

            // Calculate distance to player
            const distToPlayer = this.position.distanceTo(player.position);

            // Check if player is in sight range
            if (distToPlayer <= this.sightRange) {
                // Check if player is in field of view (120° frontal cone)
                const toPlayer = new Vector3()
                    .copy(player.position)
                    .subtract(this.position)
                    .normalize();

                const dot = this.direction.dot(toPlayer);

                // Front 120° cone is approximately dot product > -0.5
                if (dot > -0.5) {
                    // Cast ray to check line of sight
                    const ray = new Ray(
                        new Vector3().copy(this.position).add(new Vector3(0, 1, 0)), // Eye level
                        toPlayer
                    );

                    const hit = map.castRay(ray, distToPlayer);

                    // Can see player if no wall hit before reaching player
                    this.canSeePlayer = !hit || hit.distance > distToPlayer - 0.5;

                    if (this.canSeePlayer) {
                        this.playerLastKnownPosition = new Vector3().copy(player.position);
                    }
                }
            }

            // Check if can hear player (based on player's speed/noise)
            if (distToPlayer <= this.hearingRange) {
                // Basic implementation - player makes noise proportional to speed
                const playerSpeed = player.velocity.length();
                const hearingProbability = playerSpeed * 0.5; // 0.5 factor to reduce sensitivity

                if (Math.random() < hearingProbability) {
                    this.canHearPlayer = true;
                    this.playerLastKnownPosition = new Vector3().copy(player.position);
                }
            }
        }

        /**
         * Update enemy when in idle state
         * @param {number} deltaTime - Time since last update
         */
        _updateIdle(deltaTime) {
            // In idle state, enemy just stands still or turns slightly randomly
            this.speed = 0;

            // Random slight rotation
            if (Math.random() < 0.05) {
                this.rotation += (Math.random() - 0.5) * 0.1;
                this._updateDirection();
            }
        }

        /**
         * Update enemy when in patrol state
         * @param {number} deltaTime - Time since last update
         * @param {Object} map - Map for navigation
         */
        _updatePatrol(deltaTime, map) {
            // If no target, set a random patrol point
            if (!this.targetPosition) {
                this._setRandomPatrolPoint();
            }

            // Check if reached target
            const distToTarget = this.position.distanceTo(this.targetPosition);
            if (distToTarget < 0.5) {
                // Set new patrol point
                this._setRandomPatrolPoint();
                return;
            }

            // Navigate to target
            this._navigateTo(this.targetPosition, 0.6, map);
        }

        /**
         * Update enemy when in chase state
         * @param {number} deltaTime - Time since last update
         * @param {Object} player - Player object
         * @param {Object} map - Map for navigation
         */
        _updateChase(deltaTime, player, map) {
            // If can see player, chase directly
            if (this.canSeePlayer && player) {
                this._navigateTo(player.position, 1.0, map);
                return;
            }

            // If has last known position, move there
            if (this.playerLastKnownPosition) {
                // Check if reached last known position
                const distToLastKnown = this.position.distanceTo(this.playerLastKnownPosition);
                if (distToLastKnown < 1.0) {
                    // Lost the player
                    this.playerLastKnownPosition = null;

                    // Search around briefly before giving up
                    if (Math.random() < this.intelligence) {
                        // Smarter enemies will look around more
                        this._setRandomPatrolPoint(3);
                    } else {
                        this.state = ENEMY_STATE.PATROL;
                        this._setRandomPatrolPoint();
                    }
                    return;
                }

                // Navigate to last known position
                this._navigateTo(this.playerLastKnownPosition, 1.0, map);
            } else {
                // No idea where player is, go back to patrol
                this.state = ENEMY_STATE.PATROL;
                this._setRandomPatrolPoint();
            }
        }

        /**
         * Update enemy when in attack state
         * @param {number} deltaTime - Time since last update
         * @param {Object} player - Player object
         */
        _updateAttack(deltaTime, player) {
            // Stop moving while attacking
            this.speed = 0;

            // Look at player
            if (player) {
                this._lookAt(player.position);
            }

            // Check attack cooldown
            const now = Utils.now();
            if (now - this.lastAttackTime >= this.attackCooldown) {
                // Can attack
                if (player && this.position.distanceTo(player.position) <= this.attackRange) {
                    // Deal damage to player
                    player.damage(this.damage, this.position);
                    this.lastAttackTime = now;

                    // Randomize cooldown a bit
                    this.attackCooldown = Utils.randomInt(800, 1200);
                }
            }
        }

        /**
         * Update enemy when in stunned state
         * @param {number} deltaTime - Time since last update
         */
        _updateStunned(deltaTime) {
            // Can't move while stunned
            this.speed = 0;
        }

        /**
         * Set a random patrol point around the enemy
         * @param {number} maxDistance - Maximum distance for patrol point
         */
        _setRandomPatrolPoint(maxDistance = 10) {
            // Random angle
            const angle = Math.random() * Math.PI * 2;
            // Random distance
            const distance = Math.random() * maxDistance + 2;

            // Calculate target position
            this.targetPosition = new Vector3(
                this.position.x + Math.cos(angle) * distance,
                0, // Ground level
                this.position.z + Math.sin(angle) * distance
            );
        }

        /**
         * Navigate to a target position
         * @param {Vector3} target - Target position
         * @param {number} speedFactor - Speed multiplier (0-1)
         * @param {Object} map - Map for collision check
         */
        _navigateTo(target, speedFactor, map) {
            // Calculate direction to target
            const toTarget = new Vector3()
                .copy(target)
                .subtract(this.position)
                .normalize();

            // Rotate to face target
            this._lookAt(target);

            // Set speed based on speedFactor
            this.speed = this.maxSpeed * speedFactor;

            // Check for obstacles ahead
            const ray = new Ray(
                new Vector3().copy(this.position),
                this.direction
            );

            const hit = map.castRay(ray, 1.0);

            // If hit wall, slow down or try to navigate around
            if (hit) {
                // Slow down near obstacles
                this.speed *= Math.min(1, hit.distance / 1.0);

                // Try to navigate around obstacles
                if (hit.distance < 0.5) {
                    // Random direction change to try and get around obstacle
                    this.rotation += (Math.random() - 0.5) * 0.3;
                    this._updateDirection();
                }
            }
        }

        /**
         * Look at a target position
         * @param {Vector3} target - Position to look at
         */
        _lookAt(target) {
            // Calculate direction to target
            const dx = target.x - this.position.x;
            const dz = target.z - this.position.z;

            // Calculate desired rotation
            const targetRotation = Math.atan2(dx, dz);

            // Smoothly rotate towards target
            const rotDiff = targetRotation - this.rotation;

            // Normalize angle difference to [-PI, PI]
            let normalizedDiff = rotDiff;
            while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
            while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;

            // Apply rotation at limited speed
            if (Math.abs(normalizedDiff) > 0.01) {
                this.rotation += Math.sign(normalizedDiff) * Math.min(this.turnSpeed, Math.abs(normalizedDiff));
            }

            // Update direction vector
            this._updateDirection();
        }

        /**
         * Update the direction vector based on rotation
         */
        _updateDirection() {
            this.direction.x = Math.sin(this.rotation);
            this.direction.z = Math.cos(this.rotation);
        }

        /**
         * Apply physics and movement
         * @param {number} deltaTime - Time since last update
         * @param {Object} map - Map for collision
         * @param {Array} enemies - Array of all enemies for collision
         */
        _updatePhysics(deltaTime, map, enemies) {
            // Apply speed to velocity
            this.velocity.x = this.direction.x * this.speed;
            this.velocity.z = this.direction.z * this.speed;

            // Check for collision with walls
            const newPosition = new Vector3().copy(this.position).add(this.velocity);

            // Check for wall collisions at new position
            if (map.isWall(newPosition.x, newPosition.z)) {
                // Wall collision, can't move
                this.velocity.set(0, 0, 0);
                return;
            }

            // Check for collision with other enemies
            for (const other of enemies) {
                if (other.id === this.id) continue; // Skip self

                const dx = newPosition.x - other.position.x;
                const dz = newPosition.z - other.position.z;
                const distSq = dx * dx + dz * dz;
                const minDist = this.radius + other.radius;

                if (distSq < minDist * minDist) {
                    // Collision with another enemy
                    // Push away from each other
                    const pushDirection = new Vector3(dx, 0, dz).normalize();

                    // Move away from collision
                    this.velocity.x = pushDirection.x * this.speed * 0.5;
                    this.velocity.z = pushDirection.z * this.speed * 0.5;
                    break;
                }
            }

            // Apply velocity to position
            this.position.add(this.velocity);
        }

        /**
         * Update animation state
         * @param {number} deltaTime - Time since last update
         */
        _updateAnimation(deltaTime) {
            // Basic animation based on movement
            if (this.speed > 0) {
                this.animationFrame += this.animationSpeed * deltaTime;

                // Loop animation frames
                if (this.animationFrame > 4) {
                    this.animationFrame = 0;
                }
            } else {
                this.animationFrame = 0;
            }

            // Special animations for different states
            if (this.state === ENEMY_STATE.ATTACK) {
                // Attack animation
                this.animationFrame = 4 + (this.stateDuration / 200) % 2;
            } else if (this.state === ENEMY_STATE.STUNNED) {
                // Stunned animation
                this.animationFrame = 6;
            } else if (this.state === ENEMY_STATE.DEAD) {
                // Dead animation
                this.animationFrame = 7;
            }
        }
    }

    /**
     * Manager for handling multiple enemies
     */
    class EnemyManager {
        constructor() {
            this.enemies = [];
            this.maxEnemies = 20;
            this.spawnInterval = 5000; // ms between spawns
            this.lastSpawnTime = 0;
            this.difficulty = 1.0;
            this.playerPosition = null;
            this.activeRadius = 50; // Enemies beyond this are inactive
            this.difficultyIncreaseFactor = 0.1; // Increase per enemy killed
        }

        /**
         * Initialize the enemy manager
         * @param {Object} options - Configuration options
         */
        init(options = {}) {
            if (options.maxEnemies) this.maxEnemies = options.maxEnemies;
            if (options.spawnInterval) this.spawnInterval = options.spawnInterval;
            if (options.difficulty) this.difficulty = options.difficulty;
            if (options.activeRadius) this.activeRadius = options.activeRadius;

            console.log('Enemy manager initialized');
        }

        /**
         * Update all enemies
         * @param {number} deltaTime - Time since last update
         * @param {Object} player - Player object
         * @param {Object} map - Map object
         */
        update(deltaTime, player, map) {
            // Store player position for activation checks
            if (player) {
                this.playerPosition = player.position;
            }

            // Update active enemies
            for (let i = 0; i < this.enemies.length; i++) {
                const enemy = this.enemies[i];

                // Check if enemy should be active
                if (this._isEnemyActive(enemy)) {
                    enemy.update(deltaTime, player, map, this.enemies);
                }

                // Remove dead enemies after some time
                if (enemy.isDead() && Utils.now() - enemy.lastStateChange > 5000) {
                    this.enemies.splice(i, 1);
                    i--;
                }
            }

            // Check if we should spawn new enemies
            this._checkSpawning(map);
        }

        /**
         * Add a new enemy
         * @param {Object} options - Enemy options
         * @returns {Enemy} The created enemy
         */
        addEnemy(options = {}) {
            if (this.enemies.length >= this.maxEnemies) {
                return null;
            }

            const enemy = new Enemy(options);
            this.enemies.push(enemy);

            return enemy;
        }

        /**
         * Get all enemies
         * @returns {Array} Array of enemies
         */
        getEnemies() {
            return this.enemies;
        }

        /**
         * Get active enemies
         * @returns {Array} Array of active enemies
         */
        getActiveEnemies() {
            return this.enemies.filter(enemy => this._isEnemyActive(enemy));
        }

        /**
         * Spawn enemies based on difficulty
         * @param {Object} map - Map for spawning positions
         */
        _checkSpawning(map) {
            const now = Utils.now();

            // Check if it's time to spawn
            if (now - this.lastSpawnTime < this.spawnInterval) {
                return;
            }

            // Don't spawn if at maximum
            if (this.enemies.length >= this.maxEnemies) {
                return;
            }

            // Chance to spawn based on difficulty
            const spawnChance = 0.3 * this.difficulty;
            if (Math.random() > spawnChance) {
                return;
            }

            // Get a spawn position
            const spawnPos = map.getRandomFreeSpace(false);
            if (!spawnPos) {
                return;
            }

            // Don't spawn too close to player
            if (this.playerPosition &&
                Utils.distance2D(spawnPos.x, spawnPos.z, this.playerPosition.x, this.playerPosition.z) < 10) {
                return;
            }

            // Determine enemy type based on difficulty
            let type = ENEMY_TYPE.BASIC;
            const randValue = Math.random();

            if (this.difficulty > 3.0) {
                // At high difficulty, chance for boss
                if (randValue > 0.95) {
                    type = ENEMY_TYPE.BOSS;
                } else if (randValue > 0.7) {
                    type = ENEMY_TYPE.TOUGH;
                } else if (randValue > 0.4) {
                    type = ENEMY_TYPE.FAST;
                }
            } else if (this.difficulty > 2.0) {
                // Medium difficulty
                if (randValue > 0.8) {
                    type = ENEMY_TYPE.TOUGH;
                } else if (randValue > 0.5) {
                    type = ENEMY_TYPE.FAST;
                }
            } else if (this.difficulty > 1.0) {
                // Low difficulty
                if (randValue > 0.7) {
                    type = ENEMY_TYPE.FAST;
                }
            }

            // Create the enemy
            this.addEnemy({
                type,
                position: new Vector3(spawnPos.x, 0, spawnPos.z),
                rotation: Math.random() * Math.PI * 2
            });

            // Update spawn time
            this.lastSpawnTime = now;

            // Adjust spawn interval based on difficulty
            this.spawnInterval = 5000 / this.difficulty;
        }

        /**
         * Check if an enemy should be active
         * @param {Enemy} enemy - Enemy to check
         * @returns {boolean} True if enemy should be active
         */
        _isEnemyActive(enemy) {
            // Dead enemies are always inactive
            if (enemy.isDead()) {
                return false;
            }

            // If no player position, all enemies are active
            if (!this.playerPosition) {
                return true;
            }

            // Check distance to player
            const distToPlayer = enemy.position.distanceTo(this.playerPosition);
            return distToPlayer <= this.activeRadius;
        }

        /**
         * Increase difficulty
         * @param {number} amount - Amount to increase
         */
        increaseDifficulty(amount = null) {
            if (amount === null) {
                amount = this.difficultyIncreaseFactor;
            }

            this.difficulty += amount;
            console.log(`Difficulty increased to ${this.difficulty.toFixed(2)}`);
        }

        /**
         * Reset the enemy manager
         */
        reset() {
            this.enemies = [];
            this.lastSpawnTime = 0;
        }
    }

    // Create enemy manager instance
    const enemyManager = new EnemyManager();

    // Export the public API
    MyApp.Enemy = {
        init: (options) => enemyManager.init(options),
        update: (deltaTime, player, map) => enemyManager.update(deltaTime, player, map),
        getEnemies: () => enemyManager.getEnemies(),
        getActiveEnemies: () => enemyManager.getActiveEnemies(),
        addEnemy: (options) => enemyManager.addEnemy(options),
        increaseDifficulty: (amount) => enemyManager.increaseDifficulty(amount),
        reset: () => enemyManager.reset(),
        ENEMY_TYPE
    };

    console.log('Enemy module loaded');
})(window.MyApp || (window.MyApp = {}));
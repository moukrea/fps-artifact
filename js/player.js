/**
 * Player module for the FPS game
 * Handles player state, movement, and combat
 */
(function (MyApp) {
    // Dependencies
    const Utils = MyApp.Utils;
    const Math3D = MyApp.Math3D;
    const Vector3 = Math3D.Vector3;
    const Ray = Math3D.Ray;

    // Private variables
    let _player = {
        // Position and movement
        position: new Vector3(0, 0, 0),
        velocity: new Vector3(0, 0, 0),
        direction: new Vector3(0, 0, 1), // Forward vector
        pitch: 0, // Looking up/down
        yaw: 0,   // Looking left/right

        // Physics constants
        height: 1.8,
        radius: 0.4,
        speed: 0.08,
        turnSpeed: 0.003,
        lookSpeed: 1.0,
        friction: 0.9,
        gravity: 0.01,

        // State
        state: 'alive', // 'alive', 'dead', 'invulnerable'
        health: 100,
        maxHealth: 100,
        armor: 0,
        maxArmor: 100,
        isDucking: false,
        isJumping: false,
        jumpVelocity: 0,

        // Weapon state
        weapon: {
            type: 'pistol',
            textureId: 0,
            ammo: 12,
            maxAmmo: 12,
            damage: 25,
            accuracy: 0.95,
            range: 50,
            cooldown: 500, // ms
            lastFired: 0,
            isReloading: false,
            reloadTime: 1500, // ms
            reloadStartTime: 0,
            bobbing: 0
        },

        // Inventory & stats
        score: 0,
        kills: 0,
        totalAmmo: 60,
        keys: 0,
        items: []
    };

    // Event emitter
    const _events = new Utils.EventEmitter();

    // Available weapons
    const WEAPONS = {
        pistol: {
            textureId: 0,
            ammo: 12,
            maxAmmo: 12,
            damage: 25,
            accuracy: 0.95,
            range: 50,
            cooldown: 500,
            reloadTime: 1500
        },
        shotgun: {
            textureId: 1,
            ammo: 8,
            maxAmmo: 8,
            damage: 15, // Per pellet, fires multiple
            accuracy: 0.85,
            range: 30,
            pellets: 6,
            cooldown: 900,
            reloadTime: 2000
        },
        rifle: {
            textureId: 2,
            ammo: 30,
            maxAmmo: 30,
            damage: 35,
            accuracy: 0.97,
            range: 100,
            cooldown: 100,
            reloadTime: 2500
        }
    };

    /**
     * Initialize the player
     * @param {Object} options - Optional configuration
     */
    function init(options = {}) {
        // Apply options
        if (options.position) _player.position.copy(options.position);
        if (options.direction) _player.direction.copy(options.direction);
        if (options.health) _player.health = options.health;
        if (options.weapon) _player.weapon = { ..._player.weapon, ...options.weapon };

        // Setup input handlers
        _setupInput();

        console.log('Player initialized');
    }

    /**
     * Reset the player to starting state
     * @param {Object} options - Optional reset options
     */
    function reset(options = {}) {
        _player = {
            // Position and movement
            position: new Vector3(0, 0, 0),
            velocity: new Vector3(0, 0, 0),
            direction: new Vector3(0, 0, 1),
            pitch: 0,
            yaw: 0,

            // Physics constants
            height: 1.8,
            radius: 0.4,
            speed: 0.08,
            turnSpeed: 0.003,
            lookSpeed: 1.0,
            friction: 0.9,
            gravity: 0.01,

            // State
            state: 'alive',
            health: 100,
            maxHealth: 100,
            armor: 0,
            maxArmor: 100,
            isDucking: false,
            isJumping: false,
            jumpVelocity: 0,

            // Weapon state
            weapon: {
                type: 'pistol',
                textureId: 0,
                ammo: 12,
                maxAmmo: 12,
                damage: 25,
                accuracy: 0.95,
                range: 50,
                cooldown: 500,
                lastFired: 0,
                isReloading: false,
                reloadTime: 1500,
                reloadStartTime: 0,
                bobbing: 0
            },

            // Inventory & stats
            score: 0,
            kills: 0,
            totalAmmo: 60,
            keys: 0,
            items: []
        };

        // Apply options
        if (options.position) _player.position.copy(options.position);
        if (options.direction) _player.direction.copy(options.direction);

        // Emit reset event
        _events.emit('reset', _player);

        console.log('Player reset');
    }

    /**
     * Set up input handlers
     */
    function _setupInput() {
        if (!MyApp.Input) {
            console.error('Input module not loaded');
            return;
        }

        // Handle mouse look events
        MyApp.Input.on('mouseLook', (dx, dy) => {
            if (_player.state === 'dead') return;

            // Update pitch (up/down) with limits
            _player.pitch -= dy * _player.lookSpeed;
            _player.pitch = Utils.clamp(_player.pitch, -Math.PI / 2.5, Math.PI / 2.5);

            // Update yaw (left/right)
            _player.yaw += dx * _player.lookSpeed;

            // Ensure yaw is normalized between 0 and 2π
            while (_player.yaw >= Math.PI * 2) _player.yaw -= Math.PI * 2;
            while (_player.yaw < 0) _player.yaw += Math.PI * 2;

            // Update direction vector
            _player.direction = Math3D.eulerToDirection(_player.pitch, _player.yaw);
        });

        // Handle shooting
        MyApp.Input.on('mouseDown', (button) => {
            if (button === 'left') {
                shoot();
            }
        });

        // Handle reload action
        MyApp.Input.on('keyDown', (key) => {
            if (key === 'r') {
                reload();
            }
        });
    }

    /**
     * Update player state
     * @param {number} deltaTime - Time since last update
     * @param {Object} map - Map object for collision
     * @param {Array} entities - Game entities for collision
     */
    function update(deltaTime, map, entities) {
        if (_player.state === 'dead') {
            // Dead players don't move
            return;
        }

        // Get movement input
        _updateMovement(deltaTime, map);

        // Update weapon state
        _updateWeapon(deltaTime);

        // Check for entity collisions
        _checkEntityCollisions(entities);

        // Auto-reload if empty
        if (_player.weapon.ammo === 0 && !_player.weapon.isReloading) {
            reload();
        }

        // Weapon bobbing based on movement
        const speed = _player.velocity.length();
        if (speed > 0.01) {
            _player.weapon.bobbing = 3 * Math.sin(Date.now() / 150) * speed / _player.speed;
        } else {
            _player.weapon.bobbing = 0;
        }
    }

    /**
     * Update player movement
     * @param {number} deltaTime - Time since last update
     * @param {Object} map - Map object for collision
     */
    function _updateMovement(deltaTime, map) {
        // Get movement vector from input
        const movement = MyApp.Input.getMovementVector();

        // Calculate forward and right vectors
        const forward = new Vector3(_player.direction.x, 0, _player.direction.z).normalize();
        const right = new Vector3(forward.z, 0, -forward.x);

        // Apply movement to velocity
        _player.velocity.x = (forward.x * movement.y + right.x * movement.x) * _player.speed;
        _player.velocity.z = (forward.z * movement.y + right.z * movement.x) * _player.speed;

        // Apply friction
        _player.velocity.x *= _player.friction;
        _player.velocity.z *= _player.friction;

        // Prevent sliding when very slow
        if (Math.abs(_player.velocity.x) < 0.001) _player.velocity.x = 0;
        if (Math.abs(_player.velocity.z) < 0.001) _player.velocity.z = 0;

        // Calculate new position
        const newPosition = new Vector3().copy(_player.position);

        // Try to move on x-axis
        newPosition.x += _player.velocity.x;

        // Check for wall collision on x-axis
        if (!map.isWall(newPosition.x - _player.radius, _player.position.z) &&
            !map.isWall(newPosition.x + _player.radius, _player.position.z)) {
            _player.position.x = newPosition.x;
        } else {
            _player.velocity.x = 0;
        }

        // Try to move on z-axis
        newPosition.copy(_player.position);
        newPosition.z += _player.velocity.z;

        // Check for wall collision on z-axis
        if (!map.isWall(_player.position.x, newPosition.z - _player.radius) &&
            !map.isWall(_player.position.x, newPosition.z + _player.radius)) {
            _player.position.z = newPosition.z;
        } else {
            _player.velocity.z = 0;
        }

        // Emit movement event for sound effects, etc.
        if (_player.velocity.lengthSquared() > 0.001) {
            _events.emit('move', _player.velocity.length());
        }
    }

    /**
     * Update weapon state
     * @param {number} deltaTime - Time since last update
     */
    function _updateWeapon(deltaTime) {
        const now = Utils.now();

        // Check for shooting input
        if (MyApp.Input.isShooting()) {
            shoot();
        }

        // Check for reload input
        if (MyApp.Input.isReloading()) {
            reload();
        }

        // Handle reload completion
        if (_player.weapon.isReloading) {
            if (now - _player.weapon.reloadStartTime >= _player.weapon.reloadTime) {
                // Reload complete
                _completeReload();
            }
        }

        // Update weapon firing state
        if (_player.weapon.isShooting && now - _player.weapon.lastFired > 100) {
            _player.weapon.isShooting = false;
        }
    }

    /**
     * Check for collisions with game entities
     * @param {Array} entities - Game entities
     */
    function _checkEntityCollisions(entities) {
        if (!entities) return;

        for (const entity of entities) {
            // Skip non-collidable entities
            if (!entity.collidable) continue;

            // Calculate distance from entity center
            const dx = entity.position.x - _player.position.x;
            const dz = entity.position.z - _player.position.z;
            const distSq = dx * dx + dz * dz;

            // Check if within collision radius
            const collisionRadius = _player.radius + (entity.radius || 0.5);
            if (distSq < collisionRadius * collisionRadius) {
                // Collision occurred
                if (entity.onCollision) {
                    entity.onCollision(_player);
                }

                // Handle different entity types
                if (entity.type === 'health') {
                    // Health pickup
                    heal(entity.amount || 25);
                    entity.active = false;
                } else if (entity.type === 'armor') {
                    // Armor pickup
                    addArmor(entity.amount || 25);
                    entity.active = false;
                } else if (entity.type === 'ammo') {
                    // Ammo pickup
                    addAmmo(entity.amount || 20);
                    entity.active = false;
                } else if (entity.type === 'weapon') {
                    // Weapon pickup
                    changeWeapon(entity.weaponType);
                    entity.active = false;
                } else if (entity.type === 'key') {
                    // Key pickup
                    _player.keys++;
                    entity.active = false;
                }
            }
        }
    }

    /**
     * Shoot the current weapon
     */
    function shoot() {
        const now = Utils.now();

        // Check if can shoot
        if (_player.weapon.isReloading ||
            _player.weapon.ammo <= 0 ||
            now - _player.weapon.lastFired < _player.weapon.cooldown ||
            _player.state === 'dead') {
            return false;
        }

        // Update weapon state
        _player.weapon.lastFired = now;
        _player.weapon.ammo--;
        _player.weapon.isShooting = true;

        // Emit shoot event
        _events.emit('shoot', _player.weapon.type);

        // Handle different weapon types
        if (_player.weapon.type === 'shotgun') {
            // Shotgun fires multiple pellets
            const pellets = _player.weapon.pellets || 6;
            let hits = 0;

            for (let i = 0; i < pellets; i++) {
                // Add random spread to direction
                const spread = (1 - _player.weapon.accuracy) * 0.05;
                const dir = new Vector3().copy(_player.direction);

                // Random spread
                dir.x += (Math.random() - 0.5) * spread;
                dir.y += (Math.random() - 0.5) * spread;
                dir.z += (Math.random() - 0.5) * spread;
                dir.normalize();

                // Create ray and check for hits
                const ray = new Ray(_player.position, dir);
                if (_checkShootHit(ray, _player.weapon.range, _player.weapon.damage)) {
                    hits++;
                }
            }

            return hits > 0;
        } else {
            // Regular gun shoots a single bullet
            // Apply accuracy - slight deviation from center
            const spread = (1 - _player.weapon.accuracy) * 0.02;
            const dir = new Vector3().copy(_player.direction);

            // Random spread
            dir.x += (Math.random() - 0.5) * spread;
            dir.y += (Math.random() - 0.5) * spread;
            dir.z += (Math.random() - 0.5) * spread;
            dir.normalize();

            // Create ray and check for hits
            const ray = new Ray(_player.position, dir);
            return _checkShootHit(ray, _player.weapon.range, _player.weapon.damage);
        }
    }

    /**
     * Check if a shot hits anything
     * @param {Ray} ray - Ray representing the shot
     * @param {number} range - Maximum range
     * @param {number} damage - Damage amount
     * @returns {boolean} True if hit something
     */
    function _checkShootHit(ray, range, damage) {
        // Check for wall hit
        const map = MyApp.Map;
        const mapHit = map.castRay(ray, range);
        let hitDistance = mapHit ? mapHit.distance : range;

        // Check for entity hits
        let entityHit = false;
        const enemies = MyApp.Enemy.getActiveEnemies();

        for (const enemy of enemies) {
            // Skip dead enemies
            if (enemy.isDead()) continue;

            // Calculate closest point on ray to enemy
            const toEnemy = new Vector3().copy(enemy.position).subtract(ray.origin);
            const rayLength = ray.direction.dot(toEnemy);

            // Skip if behind the ray or beyond range
            if (rayLength < 0 || rayLength > hitDistance) continue;

            // Calculate closest point on ray
            const closestPoint = new Vector3()
                .copy(ray.origin)
                .add(new Vector3().copy(ray.direction).multiplyScalar(rayLength));

            // Check if within enemy's radius
            const distToEnemy = closestPoint.distanceTo(enemy.position);
            if (distToEnemy <= enemy.radius) {
                // Hit enemy
                entityHit = true;

                // Calculate damage with distance falloff
                const falloff = 1 - (rayLength / range);
                const actualDamage = Math.max(1, Math.floor(damage * falloff));

                // Apply damage to enemy
                const killed = enemy.damage(actualDamage, closestPoint);

                // Update player stats
                if (killed) {
                    _player.kills++;
                    _player.score += 100;

                    // Emit kill event
                    _events.emit('kill', enemy);
                }

                // Only hit the closest enemy
                hitDistance = rayLength;
            }
        }

        return entityHit;
    }

    /**
     * Reload the current weapon
     */
    function reload() {
        const now = Utils.now();

        // Check if can reload
        if (_player.weapon.isReloading ||
            _player.weapon.ammo >= _player.weapon.maxAmmo ||
            _player.totalAmmo <= 0 ||
            _player.state === 'dead') {
            return false;
        }

        // Start reloading
        _player.weapon.isReloading = true;
        _player.weapon.reloadStartTime = now;

        // Emit reload event
        _events.emit('reload', _player.weapon.type);

        return true;
    }

    /**
     * Complete the reload process
     */
    function _completeReload() {
        // Calculate ammo to reload
        const ammoNeeded = _player.weapon.maxAmmo - _player.weapon.ammo;
        const ammoToUse = Math.min(ammoNeeded, _player.totalAmmo);

        // Add ammo to weapon, remove from reserve
        _player.weapon.ammo += ammoToUse;
        _player.totalAmmo -= ammoToUse;

        // Reset reloading state
        _player.weapon.isReloading = false;

        // Emit reload complete event
        _events.emit('reloadComplete', _player.weapon.type);
    }

    /**
     * Change to a different weapon
     * @param {string} weaponType - Type of weapon to switch to
     */
    function changeWeapon(weaponType) {
        // Check if weapon type exists
        if (!WEAPONS[weaponType]) {
            console.error(`Unknown weapon type: ${weaponType}`);
            return false;
        }

        // Check if already using this weapon
        if (_player.weapon.type === weaponType) {
            // Just add ammo
            addAmmo(20);
            return true;
        }

        // Store old weapon data
        const oldType = _player.weapon.type;

        // Change to new weapon
        _player.weapon = {
            ..._player.weapon,
            ...WEAPONS[weaponType],
            type: weaponType,
            isReloading: false
        };

        // Emit weapon change event
        _events.emit('weaponChange', _player.weapon.type, oldType);

        return true;
    }

    /**
     * Add ammo to the player's inventory
     * @param {number} amount - Amount of ammo to add
     */
    function addAmmo(amount) {
        _player.totalAmmo += amount;

        // Emit ammo pickup event
        _events.emit('ammoPickup', amount);

        return true;
    }

    /**
     * Deal damage to the player
     * @param {number} amount - Amount of damage
     * @param {Vector3} source - Source of the damage
     * @returns {boolean} True if player died
     */
    function damage(amount, source) {
        // Check if can take damage
        if (_player.state === 'invulnerable' || _player.state === 'dead') {
            return false;
        }

        // Calculate direction of damage for screen effect
        const damageDirection = new Vector3()
            .copy(source)
            .subtract(_player.position)
            .normalize();

        // Try to absorb with armor first
        if (_player.armor > 0) {
            const armorAbsorption = 0.6; // Armor absorbs 60% of damage
            const absorbedDamage = Math.min(_player.armor, amount * armorAbsorption);
            _player.armor -= absorbedDamage;
            amount -= absorbedDamage;
        }

        // Apply remaining damage to health
        _player.health -= amount;

        // Emit damage event
        _events.emit('damage', amount, damageDirection);

        // Check if dead
        if (_player.health <= 0) {
            _player.health = 0;
            _player.state = 'dead';

            // Emit death event
            _events.emit('death');
            return true;
        }

        return false;
    }

    /**
     * Heal the player
     * @param {number} amount - Amount to heal
     */
    function heal(amount) {
        const oldHealth = _player.health;
        _player.health = Math.min(_player.health + amount, _player.maxHealth);

        // Emit heal event if health actually increased
        if (_player.health > oldHealth) {
            _events.emit('heal', _player.health - oldHealth);
        }

        return true;
    }

    /**
     * Add armor to the player
     * @param {number} amount - Amount of armor to add
     */
    function addArmor(amount) {
        const oldArmor = _player.armor;
        _player.armor = Math.min(_player.armor + amount, _player.maxArmor);

        // Emit armor pickup event if armor actually increased
        if (_player.armor > oldArmor) {
            _events.emit('armorPickup', _player.armor - oldArmor);
        }

        return true;
    }

    /**
     * Add score to the player
     * @param {number} amount - Amount of score to add
     */
    function addScore(amount) {
        _player.score += amount;

        // Emit score event
        _events.emit('score', amount);

        return true;
    }

    /**
     * Check if the player is dead
     * @returns {boolean} True if dead
     */
    function isDead() {
        return _player.state === 'dead';
    }

    /**
     * Get player state for rendering
     * @returns {Object} Player state
     */
    function getState() {
        return { ..._player };
    }

    /**
     * Register an event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     */
    function on(event, callback) {
        return _events.on(event, callback);
    }

    // Export the public API
    MyApp.Player = {
        init,
        reset,
        update,
        damage,
        heal,
        addArmor,
        addAmmo,
        addScore,
        shoot,
        reload,
        changeWeapon,
        isDead,
        getState,
        on
    };

    console.log('Player module loaded');
})(window.MyApp || (window.MyApp = {}));
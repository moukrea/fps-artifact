/**
 * Enemy.js - Enemy AI and behavior for FPS game
 */
(function (FPSGame) {
    // Create Enemy namespace
    FPSGame.Enemy = {};

    // Base Enemy class
    FPSGame.Enemy.BaseEnemy = class BaseEnemy {
        constructor(x, y) {
            this.position = new FPSGame.Math.Vector2(x, y);
            this.velocity = new FPSGame.Math.Vector2(0, 0);
            this.direction = new FPSGame.Math.Vector2(1, 0);
            this.radius = 0.5;

            // Enemy stats
            this.health = 100;
            this.maxHealth = 100;
            this.damage = 10;
            this.attackRange = 2;
            this.sightRange = 12;
            this.attackInterval = 1.5;
            this.attackTimer = 0;
            this.moveSpeed = 1.5;

            // Enemy state
            this.state = 'idle'; // idle, patrol, chase, attack
            this.target = null;
            this.waypoints = [];
            this.currentWaypoint = 0;
            this.waypointThreshold = 0.3;
            this.lastKnownTargetPos = null;

            // Animation properties
            this.texture = null;
            this.animationFrame = 0;
            this.animationFrames = 1;
            this.animationSpeed = 5;
            this.isVisible = true;

            // Sound effects
            this.alertSound = "enemy_alert";
            this.attackSound = "enemy_attack";
            this.hitSound = "enemy_hit";
            this.deathSound = "enemy_death";
        }

        // Update enemy behavior
        update(deltaTime, map) {
            // Skip if dead
            if (this.isDead()) return;

            // Get player
            const player = FPSGame.Game.getPlayer();

            if (!player || !map) return;

            // Check if player is dead
            if (player.isDead) {
                // Return to idle or patrol
                if (this.state === 'chase' || this.state === 'attack') {
                    this.setState(this.waypoints.length > 0 ? 'patrol' : 'idle');
                }
            } else {
                // Check if player is visible
                const canSeePlayer = this.canSee(player, map);

                // Update state based on player visibility
                if (canSeePlayer) {
                    this.lastKnownTargetPos = player.position.clone();

                    // Determine if in attack range
                    const distToPlayer = this.position.distance(player.position);

                    if (distToPlayer <= this.attackRange) {
                        this.setState('attack');
                        this.target = player;
                    } else {
                        this.setState('chase');
                        this.target = player;
                    }
                } else if (this.state === 'chase' && this.lastKnownTargetPos) {
                    // Check if we've reached the last known position
                    const distToLastKnown = this.position.distance(this.lastKnownTargetPos);

                    if (distToLastKnown <= this.waypointThreshold) {
                        // Lost the player, go back to patrol or idle
                        this.setState(this.waypoints.length > 0 ? 'patrol' : 'idle');
                        this.lastKnownTargetPos = null;
                    }
                }
            }

            // Update behavior based on current state
            switch (this.state) {
                case 'idle':
                    this.updateIdle(deltaTime);
                    break;
                case 'patrol':
                    this.updatePatrol(deltaTime, map);
                    break;
                case 'chase':
                    this.updateChase(deltaTime, map);
                    break;
                case 'attack':
                    this.updateAttack(deltaTime, map);
                    break;
            }

            // Apply velocity with collision
            this.move(this.velocity.x * deltaTime, this.velocity.y * deltaTime, map);

            // Update animation
            this.updateAnimation(deltaTime);
        }

        // Set enemy state
        setState(state) {
            if (this.state === state) return;

            // Handle state change
            const oldState = this.state;
            this.state = state;

            // Play alert sound when first detecting player
            if ((oldState === 'idle' || oldState === 'patrol') &&
                (state === 'chase' || state === 'attack') &&
                FPSGame.Audio && FPSGame.Audio.manager) {
                FPSGame.Audio.manager.playSound(this.alertSound, {
                    position: this.position,
                    listener: FPSGame.Game.getPlayer()
                });
            }
        }

        // Update idle behavior
        updateIdle(deltaTime) {
            // Occasionally look around
            this.velocity.set(0, 0);
        }

        // Update patrol behavior
        updatePatrol(deltaTime, map) {
            // If no waypoints, go idle
            if (this.waypoints.length === 0) {
                this.setState('idle');
                return;
            }

            // Get current waypoint
            const waypoint = this.waypoints[this.currentWaypoint];

            // Calculate direction to waypoint
            const toWaypoint = new FPSGame.Math.Vector2(
                waypoint.x - this.position.x,
                waypoint.y - this.position.y
            );

            // Check if we've reached the waypoint
            const distToWaypoint = toWaypoint.magnitude();

            if (distToWaypoint <= this.waypointThreshold) {
                // Move to next waypoint
                this.currentWaypoint = (this.currentWaypoint + 1) % this.waypoints.length;
            } else {
                // Move toward waypoint
                toWaypoint.normalize();
                this.direction = toWaypoint.clone();
                this.velocity.set(
                    toWaypoint.x * this.moveSpeed,
                    toWaypoint.y * this.moveSpeed
                );
            }
        }

        // Update chase behavior
        updateChase(deltaTime, map) {
            // No target? Go back to patrol
            if (!this.target && !this.lastKnownTargetPos) {
                this.setState(this.waypoints.length > 0 ? 'patrol' : 'idle');
                return;
            }

            // Get position to chase
            const targetPos = this.target ? this.target.position : this.lastKnownTargetPos;

            // Calculate direction to target
            const toTarget = new FPSGame.Math.Vector2(
                targetPos.x - this.position.x,
                targetPos.y - this.position.y
            );

            // Calculate distance to target
            const distToTarget = toTarget.magnitude();

            // Check if in attack range
            if (this.target && distToTarget <= this.attackRange) {
                this.setState('attack');
                return;
            }

            // Move toward target
            toTarget.normalize();
            this.direction = toTarget.clone();
            this.velocity.set(
                toTarget.x * this.moveSpeed,
                toTarget.y * this.moveSpeed
            );
        }

        // Update attack behavior
        updateAttack(deltaTime, map) {
            // No target? Go back to chase
            if (!this.target) {
                this.setState('chase');
                return;
            }

            // Calculate direction to target
            const toTarget = new FPSGame.Math.Vector2(
                this.target.position.x - this.position.x,
                this.target.position.y - this.position.y
            );

            // Calculate distance to target
            const distToTarget = toTarget.magnitude();

            // If target moved out of range, chase them
            if (distToTarget > this.attackRange) {
                this.setState('chase');
                return;
            }

            // Face the target
            toTarget.normalize();
            this.direction = toTarget.clone();

            // Stop moving while attacking
            this.velocity.set(0, 0);

            // Attack timer
            this.attackTimer -= deltaTime;

            if (this.attackTimer <= 0) {
                this.attack();
                this.attackTimer = this.attackInterval;
            }
        }

        // Perform attack
        attack() {
            if (!this.target || typeof this.target.takeDamage !== 'function') return;

            // Deal damage to target
            this.target.takeDamage(this.damage, this);

            // Play attack sound
            if (FPSGame.Audio && FPSGame.Audio.manager) {
                FPSGame.Audio.manager.playSound(this.attackSound, {
                    position: this.position,
                    listener: FPSGame.Game.getPlayer()
                });
            }
        }

        // Check if enemy can see target
        canSee(target, map) {
            // Calculate direction and distance to target
            const toTarget = new FPSGame.Math.Vector2(
                target.position.x - this.position.x,
                target.position.y - this.position.y
            );

            const distToTarget = toTarget.magnitude();

            // Too far away
            if (distToTarget > this.sightRange) return false;

            // Cast ray to check for walls
            toTarget.normalize();
            const ray = new FPSGame.Math.Ray(this.position, toTarget);
            const hit = map.castRay(ray.origin, ray.direction, distToTarget);

            // If we hit a wall before the target, we can't see them
            if (hit && hit.distance < distToTarget) return false;

            return true;
        }

        // Move with collision detection
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

        // Take damage
        takeDamage(amount, attacker) {
            // Skip if already dead
            if (this.isDead()) return;

            // Reduce health
            this.health -= amount;

            // Check if dead
            if (this.health <= 0) {
                this.health = 0;
                this.die();
                return;
            }

            // Play hit sound
            if (FPSGame.Audio && FPSGame.Audio.manager) {
                FPSGame.Audio.manager.playSound(this.hitSound, {
                    position: this.position,
                    listener: FPSGame.Game.getPlayer()
                });
            }

            // If hit by player, chase them
            if (attacker === FPSGame.Game.getPlayer()) {
                this.setState('chase');
                this.target = attacker;
                this.lastKnownTargetPos = attacker.position.clone();
            }
        }

        // Handle death
        die() {
            // Play death sound
            if (FPSGame.Audio && FPSGame.Audio.manager) {
                FPSGame.Audio.manager.playSound(this.deathSound, {
                    position: this.position,
                    listener: FPSGame.Game.getPlayer()
                });
            }

            // TODO: Spawn death effects
        }

        // Check if enemy is dead
        isDead() {
            return this.health <= 0;
        }

        // Update animation
        updateAnimation(deltaTime) {
            // Update animation frame
            if (this.animationFrames > 1) {
                this.animationFrame += deltaTime * this.animationSpeed;
                this.animationFrame %= this.animationFrames;
            }
        }

        // Set patrol waypoints
        setWaypoints(waypoints) {
            this.waypoints = waypoints;
            this.currentWaypoint = 0;
        }
    };

    // Zombie enemy class
    FPSGame.Enemy.Zombie = class Zombie extends FPSGame.Enemy.BaseEnemy {
        constructor(x, y) {
            super(x, y);

            this.health = 80;
            this.maxHealth = 80;
            this.damage = 15;
            this.attackRange = 1.5;
            this.sightRange = 10;
            this.attackInterval = 2;
            this.moveSpeed = 1.2;

            this.animationFrames = 4;

            this.alertSound = "zombie_alert";
            this.attackSound = "zombie_attack";
            this.hitSound = "zombie_hit";
            this.deathSound = "zombie_death";
        }
    };

    // Soldier enemy class
    FPSGame.Enemy.Soldier = class Soldier extends FPSGame.Enemy.BaseEnemy {
        constructor(x, y) {
            super(x, y);

            this.health = 100;
            this.maxHealth = 100;
            this.damage = 10;
            this.attackRange = 10; // Can attack from range
            this.sightRange = 15;
            this.attackInterval = 1;
            this.moveSpeed = 2;

            this.animationFrames = 4;

            this.alertSound = "soldier_alert";
            this.attackSound = "soldier_shoot";
            this.hitSound = "soldier_hit";
            this.deathSound = "soldier_death";
        }

        // Override attack for ranged behavior
        attack() {
            if (!this.target || typeof this.target.takeDamage !== 'function') return;

            // Calculate direction to target
            const toTarget = new FPSGame.Math.Vector2(
                this.target.position.x - this.position.x,
                this.target.position.y - this.position.y
            );

            // Calculate distance
            const distToTarget = toTarget.magnitude();

            // Normalize for direction
            toTarget.normalize();

            // Cast ray to check for walls
            const ray = new FPSGame.Math.Ray(this.position, toTarget);
            const map = FPSGame.Game.getMap();
            const hit = map ? map.castRay(ray.origin, ray.direction, distToTarget) : null;

            // If we hit a wall before the target, we can't hit them
            if (hit && hit.distance < distToTarget) return;

            // Deal damage to target with falloff by distance
            const damageFalloff = 1 - (distToTarget / this.attackRange) * 0.5;
            this.target.takeDamage(this.damage * damageFalloff, this);

            // Play attack sound
            if (FPSGame.Audio && FPSGame.Audio.manager) {
                FPSGame.Audio.manager.playSound(this.attackSound, {
                    position: this.position,
                    listener: FPSGame.Game.getPlayer()
                });
            }
        }
    };

    console.log("Enemy module loaded");
})(window.FPSGame);
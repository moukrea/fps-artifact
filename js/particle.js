/**
 * Particle.js - Particle system for visual effects
 */
(function (FPSGame) {
    // Create Particle namespace
    FPSGame.Particle = {};

    // Particle class
    FPSGame.Particle.Particle = class Particle {
        constructor(x, y, options = {}) {
            this.position = new FPSGame.Math.Vector2(x, y);
            this.velocity = new FPSGame.Math.Vector2(
                options.vx || FPSGame.Utils.randomFloat(-1, 1),
                options.vy || FPSGame.Utils.randomFloat(-1, 1)
            );

            // Particle properties
            this.size = options.size || FPSGame.Utils.randomFloat(0.05, 0.2);
            this.color = options.color || '#FFFFFF';
            this.alpha = options.alpha || 1;
            this.lifetime = options.lifetime || FPSGame.Utils.randomFloat(0.5, 1.5);
            this.age = 0;
            this.gravity = options.gravity || 0;
            this.drag = options.drag || 0.98;
            this.fadeout = options.fadeout !== undefined ? options.fadeout : true;
            this.shrink = options.shrink !== undefined ? options.shrink : true;
            this.collide = options.collide !== undefined ? options.collide : false;
            this.bounceFactor = options.bounceFactor || 0.5;
        }

        // Update particle state
        update(deltaTime, map) {
            // Update age
            this.age += deltaTime;

            // Check if expired
            if (this.isDead()) return;

            // Apply gravity
            this.velocity.y += this.gravity * deltaTime;

            // Apply drag
            this.velocity.multiply(Math.pow(this.drag, deltaTime * 60));

            // Calculate new position
            const newX = this.position.x + this.velocity.x * deltaTime;
            const newY = this.position.y + this.velocity.y * deltaTime;

            // Handle collision if enabled
            if (this.collide && map) {
                const hit = map.isPointInWall(newX, newY);

                if (hit) {
                    // Simple bounce
                    if (map.isPointInWall(newX, this.position.y)) {
                        this.velocity.x *= -this.bounceFactor;
                    } else {
                        this.position.x = newX;
                    }

                    if (map.isPointInWall(this.position.x, newY)) {
                        this.velocity.y *= -this.bounceFactor;
                    } else {
                        this.position.y = newY;
                    }
                } else {
                    // No collision, update position
                    this.position.x = newX;
                    this.position.y = newY;
                }
            } else {
                // No collision, update position
                this.position.x = newX;
                this.position.y = newY;
            }

            // Apply fadeout
            if (this.fadeout) {
                this.alpha = 1 - (this.age / this.lifetime);
            }

            // Apply shrink
            if (this.shrink) {
                this.size *= 1 - (deltaTime / this.lifetime);
            }
        }

        // Check if particle is dead
        isDead() {
            return this.age >= this.lifetime || this.alpha <= 0 || this.size <= 0.01;
        }
    };

    // Particle emitter class
    FPSGame.Particle.Emitter = class Emitter {
        constructor(x, y, options = {}) {
            this.position = new FPSGame.Math.Vector2(x, y);
            this.particles = [];

            // Emitter properties
            this.rate = options.rate || 20; // Particles per second
            this.burstAmount = options.burstAmount || 0;
            this.duration = options.duration || 0; // 0 = forever
            this.age = 0;
            this.emitTimer = 0;
            this.active = true;

            // Particle properties
            this.particleOptions = options.particleOptions || {};
            this.particleOptions.colors = options.particleOptions?.colors || ['#FFFFFF'];

            // Do initial burst if specified
            if (this.burstAmount > 0) {
                this.burst(this.burstAmount);
            }
        }

        // Update emitter and particles
        update(deltaTime, map) {
            // Update age
            this.age += deltaTime;

            // Check if expired
            if (this.duration > 0 && this.age >= this.duration) {
                this.active = false;
            }

            // Emit new particles
            if (this.active && this.rate > 0) {
                this.emitTimer += deltaTime;
                const particlesThisFrame = Math.floor(this.emitTimer * this.rate);

                if (particlesThisFrame > 0) {
                    this.emitTimer -= particlesThisFrame / this.rate;

                    for (let i = 0; i < particlesThisFrame; i++) {
                        this.emit();
                    }
                }
            }

            // Update particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const particle = this.particles[i];
                particle.update(deltaTime, map);

                // Remove dead particles
                if (particle.isDead()) {
                    this.particles.splice(i, 1);
                }
            }
        }

        // Emit a single particle
        emit() {
            const options = { ...this.particleOptions };

            // Randomize color if multiple colors are provided
            if (options.colors && options.colors.length > 0) {
                const colorIndex = Math.floor(Math.random() * options.colors.length);
                options.color = options.colors[colorIndex];
            }

            // Create particle with random variations
            const particle = new FPSGame.Particle.Particle(
                this.position.x,
                this.position.y,
                options
            );

            this.particles.push(particle);
            return particle;
        }

        // Emit a burst of particles
        burst(amount) {
            for (let i = 0; i < amount; i++) {
                this.emit();
            }
        }

        // Move the emitter
        move(x, y) {
            this.position.x = x;
            this.position.y = y;
        }

        // Set emitter active state
        setActive(active) {
            this.active = active;
        }

        // Check if emitter is done (inactive and no particles)
        isDone() {
            return !this.active && this.particles.length === 0;
        }
    };

    // Particle system manager
    FPSGame.Particle.ParticleSystem = class ParticleSystem {
        constructor() {
            this.emitters = [];
        }

        // Update all emitters and particles
        update(deltaTime, map) {
            for (let i = this.emitters.length - 1; i >= 0; i--) {
                const emitter = this.emitters[i];
                emitter.update(deltaTime, map);

                // Remove completed emitters
                if (emitter.isDone()) {
                    this.emitters.splice(i, 1);
                }
            }
        }

        // Create blood splatter effect
        createBloodSplatter(x, y, amount = 20) {
            const emitter = new FPSGame.Particle.Emitter(x, y, {
                burstAmount: amount,
                rate: 0,
                particleOptions: {
                    colors: ['#8B0000', '#AA0000', '#990000'],
                    size: 0.1,
                    lifetime: 1.0,
                    gravity: 1,
                    drag: 0.96,
                    collide: true,
                    bounceFactor: 0.3
                }
            });

            this.emitters.push(emitter);
            return emitter;
        }

        // Create bullet impact effect
        createBulletImpact(x, y, normal) {
            const emitter = new FPSGame.Particle.Emitter(x, y, {
                burstAmount: 15,
                rate: 0,
                particleOptions: {
                    colors: ['#FFCC00', '#FFAA00', '#FF8800'],
                    size: 0.05,
                    lifetime: 0.4,
                    gravity: 1,
                    drag: 0.9
                }
            });

            // Adjust particles based on impact normal
            for (const particle of emitter.particles) {
                // Reflect particles along normal
                const dot = particle.velocity.x * normal.x + particle.velocity.y * normal.y;
                particle.velocity.x -= 2 * dot * normal.x;
                particle.velocity.y -= 2 * dot * normal.y;

                // Add randomness
                particle.velocity.x += FPSGame.Utils.randomFloat(-0.5, 0.5);
                particle.velocity.y += FPSGame.Utils.randomFloat(-0.5, 0.5);

                // Scale velocity
                particle.velocity.multiply(FPSGame.Utils.randomFloat(1, 3));
            }

            this.emitters.push(emitter);
            return emitter;
        }

        // Create explosion effect
        createExplosion(x, y, size = 1) {
            // Flash emitter (center bright flash)
            const flash = new FPSGame.Particle.Emitter(x, y, {
                burstAmount: 1,
                rate: 0,
                particleOptions: {
                    colors: ['#FFFFFF'],
                    size: 0.8 * size,
                    lifetime: 0.2,
                    fadeout: true,
                    shrink: false,
                    gravity: 0,
                    drag: 1
                }
            });

            // Fire emitter (orange/red particles)
            const fire = new FPSGame.Particle.Emitter(x, y, {
                burstAmount: 30 * size,
                rate: 0,
                particleOptions: {
                    colors: ['#FF4500', '#FF8C00', '#FFD700'],
                    size: 0.2 * size,
                    lifetime: 0.6,
                    gravity: -0.5,
                    drag: 0.95
                }
            });

            // Smoke emitter (gray particles that linger)
            const smoke = new FPSGame.Particle.Emitter(x, y, {
                burstAmount: 20 * size,
                rate: 0,
                particleOptions: {
                    colors: ['#555555', '#777777', '#999999'],
                    size: 0.3 * size,
                    lifetime: 2.0,
                    gravity: -0.2,
                    drag: 0.98
                }
            });

            this.emitters.push(flash, fire, smoke);
            return [flash, fire, smoke];
        }

        // Create muzzle flash effect
        createMuzzleFlash(x, y, direction) {
            const dirX = Math.cos(direction);
            const dirY = Math.sin(direction);

            const emitter = new FPSGame.Particle.Emitter(x, y, {
                burstAmount: 10,
                rate: 0,
                particleOptions: {
                    colors: ['#FFFF00', '#FFAA00'],
                    size: 0.1,
                    lifetime: 0.15,
                    fadeout: true,
                    gravity: 0,
                    drag: 0.9
                }
            });

            // Adjust particles to go in muzzle direction
            for (const particle of emitter.particles) {
                particle.velocity.x = dirX * FPSGame.Utils.randomFloat(1, 3) + FPSGame.Utils.randomFloat(-0.5, 0.5);
                particle.velocity.y = dirY * FPSGame.Utils.randomFloat(1, 3) + FPSGame.Utils.randomFloat(-0.5, 0.5);
            }

            this.emitters.push(emitter);
            return emitter;
        }
    };

    console.log("Particle module loaded");
})(window.FPSGame);
/**
 * Weapon.js - Weapons system for the FPS game
 */
(function (FPSGame) {
    // Create Weapon namespace
    FPSGame.Weapon = {};

    // Base weapon class
    FPSGame.Weapon.BaseWeapon = class BaseWeapon {
        constructor(player) {
            this.player = player;
            this.name = "Unknown Weapon";
            this.damage = 10;
            this.fireRate = 1; // Shots per second
            this.accuracy = 0.9; // 1.0 = perfect accuracy
            this.range = 20;
            this.reloadTime = 2; // Seconds
            this.magSize = 10;
            this.currentAmmo = 10;
            this.reserveAmmo = 30;
            this.isAutomatic = false;

            // Weapon state
            this.isReloading = false;
            this.lastFireTime = 0;
            this.reloadTimer = 0;
            this.isFiring = false;

            // Weapon animation
            this.texture = null;
            this.muzzleFlash = null;
            this.bobPhase = 0;
            this.bobAmount = 0;

            // Firing sound
            this.fireSound = "pistol_fire";
            this.reloadSound = "pistol_reload";
            this.emptySound = "gun_empty";
        }

        // Handle trigger pull
        triggerPull() {
            // Can't fire if reloading
            if (this.isReloading) return;

            // Auto weapons keep firing, semi-auto need to release trigger
            if (this.isFiring && !this.isAutomatic) return;

            const currentTime = performance.now() / 1000;
            const timeSinceLastFire = currentTime - this.lastFireTime;

            // Check fire rate
            if (timeSinceLastFire < 1 / this.fireRate) return;

            // Check ammo
            if (this.currentAmmo <= 0) {
                this.isFiring = false;

                // Play empty sound
                if (FPSGame.Audio && FPSGame.Audio.manager) {
                    FPSGame.Audio.manager.playSound(this.emptySound);
                }

                // Auto-reload if we have reserve ammo
                if (this.reserveAmmo > 0) {
                    this.reload();
                }

                return;
            }

            // Fire the weapon
            this.fire();

            // Update state
            this.isFiring = true;
            this.lastFireTime = currentTime;
        }

        // Handle trigger release
        triggerRelease() {
            this.isFiring = false;
        }

        // Fire the weapon
        fire() {
            // Reduce ammo
            this.currentAmmo--;

            // Play fire sound
            if (FPSGame.Audio && FPSGame.Audio.manager) {
                FPSGame.Audio.manager.playSound(this.fireSound);
            }

            // Calculate firing direction with accuracy
            const dir = this.player.direction.clone();

            // Add random spread based on accuracy
            if (this.accuracy < 1.0) {
                const spread = (1 - this.accuracy) * 0.1;
                dir.x += FPSGame.Utils.randomFloat(-spread, spread);
                dir.y += FPSGame.Utils.randomFloat(-spread, spread);
                dir.normalize();
            }

            // Cast ray to find what we hit
            const origin = this.player.position.clone();
            const map = FPSGame.Game.getMap(); // Get current map

            if (!map) return;

            // Check for wall hit
            const wallHit = map.castRay(origin, dir, this.range);

            // Check for entity hits
            let closestEntityDist = this.range;
            let hitEntity = null;

            for (const entity of map.entities) {
                // Skip entities that can't be damaged
                if (typeof entity.takeDamage !== 'function') continue;

                // Calculate vector to entity
                const toEntity = new FPSGame.Math.Vector2(
                    entity.position.x - origin.x,
                    entity.position.y - origin.y
                );

                // Distance to entity
                const distToEntity = toEntity.magnitude();

                // Skip if too far
                if (distToEntity > closestEntityDist) continue;

                // Calculate angle between ray and entity
                const entityAngle = Math.atan2(toEntity.y, toEntity.x);
                const rayAngle = Math.atan2(dir.y, dir.x);
                let angleDiff = Math.abs(entityAngle - rayAngle);

                // Normalize angle difference
                if (angleDiff > Math.PI) {
                    angleDiff = 2 * Math.PI - angleDiff;
                }

                // Check if entity is in the firing cone
                // Angular size depends on distance (closer = bigger target)
                const angularSize = Math.atan2(entity.radius || 0.5, distToEntity);

                if (angleDiff <= angularSize) {
                    // Check if there's a wall in the way
                    if (wallHit && wallHit.distance < distToEntity) {
                        continue; // Wall blocks the shot
                    }

                    // This is the closest entity hit so far
                    closestEntityDist = distToEntity;
                    hitEntity = entity;
                }
            }

            // Apply damage to hit entity
            if (hitEntity) {
                // Calculate damage falloff based on distance
                const damageFalloff = 1 - (closestEntityDist / this.range) * 0.5;
                const finalDamage = this.damage * damageFalloff;

                // Apply damage
                hitEntity.takeDamage(finalDamage, this.player);

                // Create hit effect
                this.createHitEffect(hitEntity.position);
            }

            // Create impact effect on wall
            if (wallHit) {
                this.createImpactEffect(wallHit.point, wallHit.normal);
            }
        }

        // Reload the weapon
        reload() {
            // Can't reload if already reloading or no ammo needed
            if (this.isReloading || this.currentAmmo >= this.magSize || this.reserveAmmo <= 0) {
                return;
            }

            this.isReloading = true;
            this.reloadTimer = this.reloadTime;

            // Play reload sound
            if (FPSGame.Audio && FPSGame.Audio.manager) {
                FPSGame.Audio.manager.playSound(this.reloadSound);
            }
        }

        // Update weapon state
        update(deltaTime) {
            // Update reloading
            if (this.isReloading) {
                this.reloadTimer -= deltaTime;

                if (this.reloadTimer <= 0) {
                    this.finishReload();
                }
            }

            // Update weapon bobbing
            this.bobPhase = this.player.bobPhase;
            this.bobAmount = this.player.bobAmount;
        }

        // Finish reload
        finishReload() {
            // Calculate how much ammo to add
            const ammoNeeded = this.magSize - this.currentAmmo;
            const ammoToAdd = Math.min(this.reserveAmmo, ammoNeeded);

            // Add ammo to mag and remove from reserve
            this.currentAmmo += ammoToAdd;
            this.reserveAmmo -= ammoToAdd;

            // Reset state
            this.isReloading = false;
            this.reloadTimer = 0;
        }

        // Add ammo to reserve
        addAmmo(amount) {
            this.reserveAmmo += amount;
            return true;
        }

        // Create hit effect on entity
        createHitEffect(position) {
            // TODO: Implement particle effects
        }

        // Create impact effect on wall
        createImpactEffect(position, normal) {
            // TODO: Implement particle effects
        }
    };

    // Pistol class
    FPSGame.Weapon.Pistol = class Pistol extends FPSGame.Weapon.BaseWeapon {
        constructor(player) {
            super(player);

            this.name = "Pistol";
            this.damage = 15;
            this.fireRate = 2;
            this.accuracy = 0.9;
            this.range = 20;
            this.reloadTime = 1.5;
            this.magSize = 12;
            this.currentAmmo = 12;
            this.reserveAmmo = 36;
            this.isAutomatic = false;

            this.fireSound = "pistol_fire";
            this.reloadSound = "pistol_reload";
        }
    };

    // Shotgun class
    FPSGame.Weapon.Shotgun = class Shotgun extends FPSGame.Weapon.BaseWeapon {
        constructor(player) {
            super(player);

            this.name = "Shotgun";
            this.damage = 8; // Per pellet
            this.fireRate = 1;
            this.accuracy = 0.7;
            this.range = 15;
            this.reloadTime = 2.5;
            this.magSize = 8;
            this.currentAmmo = 8;
            this.reserveAmmo = 24;
            this.isAutomatic = false;
            this.pelletCount = 8;

            this.fireSound = "shotgun_fire";
            this.reloadSound = "shotgun_reload";
        }

        // Override fire to handle multiple pellets
        fire() {
            // Reduce ammo
            this.currentAmmo--;

            // Play fire sound
            if (FPSGame.Audio && FPSGame.Audio.manager) {
                FPSGame.Audio.manager.playSound(this.fireSound);
            }

            const origin = this.player.position.clone();
            const map = FPSGame.Game.getMap();

            if (!map) return;

            // Fire multiple pellets
            for (let i = 0; i < this.pelletCount; i++) {
                // Calculate firing direction with spread
                const dir = this.player.direction.clone();

                // Add random spread
                const spread = (1 - this.accuracy) * 0.2;
                dir.x += FPSGame.Utils.randomFloat(-spread, spread);
                dir.y += FPSGame.Utils.randomFloat(-spread, spread);
                dir.normalize();

                // Rest of firing logic similar to base class...
                // (Simplified to avoid duplication)
                const wallHit = map.castRay(origin, dir, this.range);

                // Check for entity hits (simplified)
                const entities = map.getEntitiesInRadius(origin.x, origin.y, this.range);
                for (const entity of entities) {
                    if (typeof entity.takeDamage !== 'function') continue;

                    // Simple distance check for shotgun pellets
                    const dx = entity.position.x - origin.x;
                    const dy = entity.position.y - origin.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist <= this.range) {
                        // Apply damage with falloff
                        const damageFalloff = 1 - (dist / this.range) * 0.7;
                        entity.takeDamage(this.damage * damageFalloff, this.player);
                    }
                }

                // Create impact effect on wall
                if (wallHit) {
                    this.createImpactEffect(wallHit.point, wallHit.normal);
                }
            }
        }
    };

    // Assault rifle class
    FPSGame.Weapon.AssaultRifle = class AssaultRifle extends FPSGame.Weapon.BaseWeapon {
        constructor(player) {
            super(player);

            this.name = "Assault Rifle";
            this.damage = 12;
            this.fireRate = 8;
            this.accuracy = 0.85;
            this.range = 30;
            this.reloadTime = 2;
            this.magSize = 30;
            this.currentAmmo = 30;
            this.reserveAmmo = 90;
            this.isAutomatic = true;

            this.fireSound = "rifle_fire";
            this.reloadSound = "rifle_reload";
        }
    };

    console.log("Weapon module loaded");
})(window.FPSGame);
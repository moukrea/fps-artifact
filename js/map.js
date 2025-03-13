/**
 * Map.js - Handles the game map and level construction
 */
(function (FPSGame) {
    // Create Map namespace
    FPSGame.Map = {};

    // Map class
    FPSGame.Map.GameMap = class GameMap {
        constructor() {
            this.walls = [];
            this.entities = [];
            this.pickups = [];
            this.spawnPoints = [];
            this.width = 0;
            this.height = 0;
            this.floorColor = '#333';
            this.ceilingColor = '#111';
            this.fogColor = '#000';
            this.fogDistance = 8;
            this.name = '';
            this.skybox = null;
        }

        // Add a wall to the map
        addWall(x1, y1, x2, y2, texture = null) {
            const wall = new FPSGame.Math.Segment(x1, y1, x2, y2, texture);
            this.walls.push(wall);
            return wall;
        }

        // Add entity to the map
        addEntity(entity) {
            this.entities.push(entity);
            return entity;
        }

        // Add pickup to the map
        addPickup(pickup) {
            this.pickups.push(pickup);
            return pickup;
        }

        // Add spawn point
        addSpawnPoint(x, y, angle = 0) {
            this.spawnPoints.push({
                x, y, angle
            });
        }

        // Get random spawn point
        getRandomSpawnPoint() {
            if (this.spawnPoints.length === 0) {
                return { x: 0, y: 0, angle: 0 };
            }
            const index = Math.floor(Math.random() * this.spawnPoints.length);
            return this.spawnPoints[index];
        }

        // Check if a point is inside a wall
        isPointInWall(x, y, radius = 0) {
            // For each wall, check if point is too close
            for (const wall of this.walls) {
                const wallStart = wall.start;
                const wallEnd = wall.end;

                // Calculate distance from point to line segment
                const dx = wallEnd.x - wallStart.x;
                const dy = wallEnd.y - wallStart.y;
                const length = Math.sqrt(dx * dx + dy * dy);

                if (length === 0) {
                    continue; // Skip zero-length walls
                }

                // Project point onto line
                const t = ((x - wallStart.x) * dx + (y - wallStart.y) * dy) / (length * length);

                let distance;

                if (t < 0) {
                    // Point is past the start of the segment
                    distance = Math.sqrt((x - wallStart.x) * (x - wallStart.x) + (y - wallStart.y) * (y - wallStart.y));
                } else if (t > 1) {
                    // Point is past the end of the segment
                    distance = Math.sqrt((x - wallEnd.x) * (x - wallEnd.x) + (y - wallEnd.y) * (y - wallEnd.y));
                } else {
                    // Point is within the segment
                    const projX = wallStart.x + t * dx;
                    const projY = wallStart.y + t * dy;
                    distance = Math.sqrt((x - projX) * (x - projX) + (y - projY) * (y - projY));
                }

                if (distance <= radius) {
                    return true;
                }
            }

            return false;
        }

        // Find intersection with walls
        castRay(origin, direction, maxDistance = Infinity) {
            const ray = new FPSGame.Math.Ray(origin, direction);

            let closestHit = null;
            let closestDistance = maxDistance;

            for (const wall of this.walls) {
                const hit = ray.cast(wall);

                if (hit && hit.distance < closestDistance) {
                    closestHit = hit;
                    closestDistance = hit.distance;
                }
            }

            return closestHit;
        }

        // Get all entities within a radius of a point
        getEntitiesInRadius(x, y, radius) {
            return this.entities.filter(entity => {
                const dx = entity.position.x - x;
                const dy = entity.position.y - y;
                const distanceSquared = dx * dx + dy * dy;
                return distanceSquared <= radius * radius;
            });
        }

        // Get all pickups within a radius of a point
        getPickupsInRadius(x, y, radius) {
            return this.pickups.filter(pickup => {
                if (pickup.collected) return false;

                const dx = pickup.position.x - x;
                const dy = pickup.position.y - y;
                const distanceSquared = dx * dx + dy * dy;
                return distanceSquared <= radius * radius;
            });
        }

        // Update all entities
        update(deltaTime) {
            // Update entities
            for (let i = this.entities.length - 1; i >= 0; i--) {
                const entity = this.entities[i];
                entity.update(deltaTime, this);

                // Remove dead entities
                if (entity.isDead && entity.isDead()) {
                    this.entities.splice(i, 1);
                }
            }

            // Update pickups
            for (let i = this.pickups.length - 1; i >= 0; i--) {
                const pickup = this.pickups[i];
                pickup.update(deltaTime, this);

                // Remove collected pickups
                if (pickup.collected && pickup.shouldRemove) {
                    this.pickups.splice(i, 1);
                }
            }
        }

        // Create a test map
        static createTestMap() {
            const map = new FPSGame.Map.GameMap();

            // Set map properties
            map.width = 20;
            map.height = 20;
            map.name = 'Test Map';

            // Add outer walls
            map.addWall(0, 0, map.width, 0); // Top
            map.addWall(map.width, 0, map.width, map.height); // Right
            map.addWall(map.width, map.height, 0, map.height); // Bottom
            map.addWall(0, map.height, 0, 0); // Left

            // Add some obstacles
            map.addWall(5, 5, 5, 10);
            map.addWall(5, 10, 10, 10);
            map.addWall(15, 5, 15, 15);
            map.addWall(8, 16, 12, 16);
            map.addWall(8, 16, 8, 20);

            // Add spawn points
            map.addSpawnPoint(2, 2, 0);
            map.addSpawnPoint(18, 2, Math.PI);
            map.addSpawnPoint(18, 18, Math.PI * 1.5);
            map.addSpawnPoint(2, 18, Math.PI * 0.5);

            return map;
        }

        // Create a more complex level
        static createLevel1() {
            const map = new FPSGame.Map.GameMap();

            // Set map properties
            map.width = 32;
            map.height = 32;
            map.name = 'Level 1';
            map.floorColor = '#555';
            map.ceilingColor = '#222';
            map.fogColor = '#111';
            map.fogDistance = 12;

            // Add outer walls
            map.addWall(0, 0, map.width, 0); // Top
            map.addWall(map.width, 0, map.width, map.height); // Right
            map.addWall(map.width, map.height, 0, map.height); // Bottom
            map.addWall(0, map.height, 0, 0); // Left

            // Add interior walls to create rooms and corridors

            // Room 1 (top left)
            map.addWall(0, 8, 8, 8);
            map.addWall(8, 0, 8, 3);
            map.addWall(8, 5, 8, 8);

            // Room 2 (top right)
            map.addWall(16, 0, 16, 8);
            map.addWall(16, 8, 24, 8);
            map.addWall(24, 8, 24, 0);

            // Room 3 (center)
            map.addWall(12, 12, 12, 20);
            map.addWall(12, 12, 20, 12);
            map.addWall(20, 12, 20, 20);
            map.addWall(12, 20, 15, 20);
            map.addWall(17, 20, 20, 20);

            // Room 4 (bottom left)
            map.addWall(0, 24, 8, 24);
            map.addWall(8, 24, 8, 32);

            // Room 5 (bottom right)
            map.addWall(24, 24, 24, 32);
            map.addWall(24, 24, 32, 24);

            // Add some columns and obstacles
            map.addWall(4, 4, 5, 4);
            map.addWall(5, 4, 5, 5);
            map.addWall(5, 5, 4, 5);
            map.addWall(4, 5, 4, 4);

            map.addWall(27, 4, 28, 4);
            map.addWall(28, 4, 28, 5);
            map.addWall(28, 5, 27, 5);
            map.addWall(27, 5, 27, 4);

            map.addWall(27, 27, 28, 27);
            map.addWall(28, 27, 28, 28);
            map.addWall(28, 28, 27, 28);
            map.addWall(27, 28, 27, 27);

            map.addWall(4, 27, 5, 27);
            map.addWall(5, 27, 5, 28);
            map.addWall(5, 28, 4, 28);
            map.addWall(4, 28, 4, 27);

            // Add center column
            map.addWall(15, 15, 17, 15);
            map.addWall(17, 15, 17, 17);
            map.addWall(17, 17, 15, 17);
            map.addWall(15, 17, 15, 15);

            // Add spawn points
            map.addSpawnPoint(4, 4, 0);
            map.addSpawnPoint(28, 4, Math.PI);
            map.addSpawnPoint(28, 28, Math.PI * 1.5);
            map.addSpawnPoint(4, 28, Math.PI * 0.5);
            map.addSpawnPoint(16, 16, Math.PI * 0.25);

            return map;
        }
    };

    console.log("Map module loaded");
})(window.FPSGame);
/**
 * Raycaster.js - Handles the raycasting and rendering of the 3D world
 */
(function (FPSGame) {
    // Create Raycaster namespace
    FPSGame.Raycaster = {};

    // Raycaster class
    FPSGame.Raycaster.Renderer = class Renderer {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');

            // Screen dimensions
            this.width = canvas.width;
            this.height = canvas.height;

            // FOV (field of view in radians)
            this.fov = 60 * Math.PI / 180;

            // Resolution - number of rays to cast
            this.resolution = 320;

            // Maximum view distance
            this.maxViewDistance = 20;

            // Textures
            this.textures = {
                wall: null,
                floor: null,
                ceiling: null
            };

            // Calculated values
            this.aspectRatio = this.width / this.height;
            this.halfWidth = this.width / 2;
            this.halfHeight = this.height / 2;
            this.halfFov = this.fov / 2;
            this.viewDist = this.halfWidth / Math.tan(this.halfFov);

            // Off-screen canvas for floor/ceiling
            this.floorCanvas = document.createElement('canvas');
            this.floorCanvas.width = this.width;
            this.floorCanvas.height = this.height;
            this.floorCtx = this.floorCanvas.getContext('2d');

            // Off-screen canvas for walls
            this.wallCanvas = document.createElement('canvas');
            this.wallCanvas.width = this.width;
            this.wallCanvas.height = this.height;
            this.wallCtx = this.wallCanvas.getContext('2d');

            // Resize handler
            this.onResize = this.onResize.bind(this);
            window.addEventListener('resize', this.onResize);
            this.onResize();
        }

        // Set textures
        setTextures(textures) {
            this.textures = textures;
        }

        // Handle resize
        onResize() {
            // Update canvas dimensions
            this.width = this.canvas.width = this.canvas.clientWidth;
            this.height = this.canvas.height = this.canvas.clientHeight;

            // Update off-screen canvases
            this.floorCanvas.width = this.width;
            this.floorCanvas.height = this.height;
            this.wallCanvas.width = this.width;
            this.wallCanvas.height = this.height;

            // Recalculate values
            this.aspectRatio = this.width / this.height;
            this.halfWidth = this.width / 2;
            this.halfHeight = this.height / 2;
            this.viewDist = this.halfWidth / Math.tan(this.halfFov);

            // Adjust resolution based on screen width
            this.resolution = Math.min(Math.floor(this.width / 2), 480);
        }

        // Clean up
        destroy() {
            window.removeEventListener('resize', this.onResize);
        }

        // Render the view from player position
        render(map, player) {
            const startTime = performance.now();

            // Clear the screen
            this.ctx.clearRect(0, 0, this.width, this.height);
            this.wallCtx.clearRect(0, 0, this.width, this.height);

            // If no map or player, just return
            if (!map || !player) {
                return;
            }

            // Draw ceiling and floor
            this.renderFloorAndCeiling(map);

            // Cast rays and draw walls
            this.renderWalls(map, player);

            // Render sprites (entities, pickups, etc.)
            this.renderSprites(map, player);

            // Combine all layers and render to screen
            this.ctx.drawImage(this.floorCanvas, 0, 0);
            this.ctx.drawImage(this.wallCanvas, 0, 0);

            // Apply fog if needed
            if (map.fogDistance < this.maxViewDistance) {
                this.applyFog(map);
            }

            // Debug render time
            const renderTime = performance.now() - startTime;
            return renderTime;
        }

        // Render floor and ceiling
        renderFloorAndCeiling(map) {
            // Simpler approach: just fill with colors
            this.floorCtx.fillStyle = map.floorColor || '#333';
            this.floorCtx.fillRect(0, this.halfHeight, this.width, this.halfHeight);

            this.floorCtx.fillStyle = map.ceilingColor || '#111';
            this.floorCtx.fillRect(0, 0, this.width, this.halfHeight);

            // TODO: Add textured floor/ceiling in the future
        }

        // Render walls with raycasting
        renderWalls(map, player) {
            const position = player.position;
            const direction = player.direction;
            const plane = player.plane;

            // For each pixel column in the viewport
            const columnWidth = this.width / this.resolution;

            for (let x = 0; x < this.resolution; x++) {
                // Calculate ray position and direction
                const cameraX = 2 * x / this.resolution - 1; // x-coordinate in camera space
                const rayDirX = direction.x + plane.x * cameraX;
                const rayDirY = direction.y + plane.y * cameraX;

                // Create ray from player position in the calculated direction
                const ray = new FPSGame.Math.Ray(
                    new FPSGame.Math.Vector2(position.x, position.y),
                    new FPSGame.Math.Vector2(rayDirX, rayDirY)
                );

                // Cast the ray against the map walls
                const hit = map.castRay(ray.origin, ray.direction, this.maxViewDistance);

                if (hit) {
                    // Calculate distance projected on camera direction
                    const perpWallDist = hit.distance *
                        (direction.x * rayDirX + direction.y * rayDirY) /
                        (rayDirX * rayDirX + rayDirY * rayDirY);

                    // Calculate height of line to draw on screen
                    const lineHeight = Math.min(this.height, Math.floor(this.height / perpWallDist));

                    // Calculate lowest and highest pixel to fill
                    const drawStart = Math.max(0, Math.floor(-lineHeight / 2 + this.halfHeight));
                    const drawEnd = Math.min(this.height - 1, Math.floor(lineHeight / 2 + this.halfHeight));

                    // Calculate wall brightness based on distance
                    const brightness = 1 - FPSGame.Utils.clamp(hit.distance / this.maxViewDistance, 0, 0.9);

                    // Apply wall texture if available
                    if (this.textures.wall) {
                        // Calculate exact position where the ray hit the wall
                        const wallX = hit.point.x - Math.floor(hit.point.x);

                        // Calculate texture X coordinate
                        let texX = Math.floor(wallX * this.textures.wall.width);

                        // Draw the textured wall column
                        const screenX = Math.floor(x * columnWidth);
                        const columnWidth = Math.ceil(this.width / this.resolution);

                        // Fix texture drawing dimensions to avoid artifacts
                        const sourceX = texX;
                        const sourceWidth = 1;
                        const destWidth = Math.ceil(columnWidth);

                        this.wallCtx.globalAlpha = brightness;
                        this.wallCtx.drawImage(
                            this.textures.wall,
                            sourceX, 0, sourceWidth, this.textures.wall.height,
                            screenX, drawStart, destWidth, drawEnd - drawStart
                        );
                    } else {
                        // Draw a simple colored wall if no texture
                        this.wallCtx.fillStyle = `rgb(${Math.floor(brightness * 180)}, ${Math.floor(brightness * 120)}, ${Math.floor(brightness * 120)})`;

                        // Draw wall column
                        const screenX = Math.floor(x * columnWidth);
                        const width = Math.ceil(columnWidth);
                        this.wallCtx.fillRect(screenX, drawStart, width, drawEnd - drawStart);
                    }
                }
            }
        }

        // Render sprites (enemies, items, etc.)
        renderSprites(map, player) {
            const position = player.position;
            const direction = player.direction;
            const plane = player.plane;

            // Combine all renderable objects
            const sprites = [
                ...map.entities.filter(e => e.isVisible !== false),
                ...map.pickups.filter(p => !p.collected)
            ];

            // Sort sprites from far to close for correct rendering
            sprites.sort((a, b) => {
                const distA = Math.pow(position.x - a.position.x, 2) + Math.pow(position.y - a.position.y, 2);
                const distB = Math.pow(position.x - b.position.x, 2) + Math.pow(position.y - b.position.y, 2);
                return distB - distA;
            });

            // Render each sprite
            for (const sprite of sprites) {
                if (!sprite.texture) continue;

                // Translate sprite position relative to player
                const spriteX = sprite.position.x - position.x;
                const spriteY = sprite.position.y - position.y;

                // Transform sprite with the inverse camera matrix
                // [ plane.x   dir.x ] -1                                      [ dir.y   -dir.x ]
                // [               ]       =  1/(plane.x*dir.y-plane.y*dir.x) * [                ]
                // [ plane.y   dir.y ]                                          [ -plane.y  plane.x ]

                const invDet = 1.0 / (plane.x * direction.y - direction.x * plane.y);

                const transformX = invDet * (direction.y * spriteX - direction.x * spriteY);
                const transformY = invDet * (-plane.y * spriteX + plane.x * spriteY);

                // Skip sprites behind the player or too far
                if (transformY <= 0.1 || transformY > this.maxViewDistance) continue;

                // Calculate sprite size on screen
                const spriteHeight = Math.abs(Math.floor(this.height / transformY));
                const spriteWidth = Math.abs(Math.floor(this.height / transformY * (sprite.width || 1)));

                // Calculate screen position
                const spriteScreenX = Math.floor(this.halfWidth * (1 + transformX / transformY));

                // Calculate drawing bounds
                const drawStartY = Math.max(0, Math.floor(this.halfHeight - spriteHeight / 2));
                const drawEndY = Math.min(this.height, Math.floor(this.halfHeight + spriteHeight / 2));

                const drawStartX = Math.max(0, Math.floor(spriteScreenX - spriteWidth / 2));
                const drawEndX = Math.min(this.width, Math.floor(spriteScreenX + spriteWidth / 2));

                // Calculate brightness based on distance
                const brightness = 1 - FPSGame.Utils.clamp(transformY / this.maxViewDistance, 0, 0.9);

                // Draw the sprite
                this.wallCtx.globalAlpha = brightness;
                this.wallCtx.drawImage(
                    sprite.texture,
                    0, 0, sprite.texture.width, sprite.texture.height,
                    drawStartX, drawStartY, drawEndX - drawStartX, drawEndY - drawStartY
                );
            }

            // Reset alpha
            this.wallCtx.globalAlpha = 1;
        }

        // Apply fog effect
        applyFog(map) {
            // Create a gradient from transparent to fog color
            const gradient = this.ctx.createRadialGradient(
                this.halfWidth, this.halfHeight, 0,
                this.halfWidth, this.halfHeight, Math.max(this.halfWidth, this.halfHeight)
            );

            gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            gradient.addColorStop(map.fogDistance / this.maxViewDistance, 'rgba(0, 0, 0, 0)');
            gradient.addColorStop(1, map.fogColor || 'rgba(0, 0, 0, 1)');

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        // Render a weapon in first person view
        renderWeapon(weapon) {
            if (!weapon || !weapon.texture) return;

            // Determine weapon position on screen
            const weaponX = this.width / 2 - weapon.texture.width / 2;
            const weaponY = this.height - weapon.texture.height;

            // Apply weapon bobbing based on animation
            const offsetX = Math.sin(weapon.bobPhase * 2) * 5 * weapon.bobAmount;
            const offsetY = Math.abs(Math.cos(weapon.bobPhase)) * 5 * weapon.bobAmount;

            // Draw the weapon
            this.ctx.drawImage(
                weapon.texture,
                0, 0, weapon.texture.width, weapon.texture.height,
                weaponX + offsetX, weaponY + offsetY, weapon.texture.width, weapon.texture.height
            );

            // If firing, add muzzle flash
            if (weapon.isFiring && weapon.muzzleFlash) {
                const flashX = this.width / 2 - weapon.muzzleFlash.width / 2;
                const flashY = this.height - weapon.texture.height - weapon.muzzleFlash.height / 2;

                this.ctx.drawImage(
                    weapon.muzzleFlash,
                    0, 0, weapon.muzzleFlash.width, weapon.muzzleFlash.height,
                    flashX + offsetX, flashY + offsetY, weapon.muzzleFlash.width, weapon.muzzleFlash.height
                );
            }
        }

        // Draw a simple minimap in the corner
        renderMinimap(map, player, size = 150) {
            const padding = 10;
            const mapSize = size - padding * 2;
            const scale = mapSize / Math.max(map.width, map.height);

            // Draw minimap background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(padding, padding, mapSize, mapSize);

            // Draw walls
            this.ctx.strokeStyle = '#FFF';
            this.ctx.lineWidth = 1;

            for (const wall of map.walls) {
                this.ctx.beginPath();
                this.ctx.moveTo(padding + wall.start.x * scale, padding + wall.start.y * scale);
                this.ctx.lineTo(padding + wall.end.x * scale, padding + wall.end.y * scale);
                this.ctx.stroke();
            }

            // Draw entities
            this.ctx.fillStyle = '#F00';
            for (const entity of map.entities) {
                this.ctx.fillRect(
                    padding + entity.position.x * scale - 2,
                    padding + entity.position.y * scale - 2,
                    4, 4
                );
            }

            // Draw pickups
            this.ctx.fillStyle = '#0F0';
            for (const pickup of map.pickups) {
                if (!pickup.collected) {
                    this.ctx.fillRect(
                        padding + pickup.position.x * scale - 2,
                        padding + pickup.position.y * scale - 2,
                        4, 4
                    );
                }
            }

            // Draw player
            this.ctx.fillStyle = '#00F';
            this.ctx.beginPath();
            this.ctx.arc(
                padding + player.position.x * scale,
                padding + player.position.y * scale,
                3, 0, Math.PI * 2
            );
            this.ctx.fill();

            // Draw player direction
            this.ctx.strokeStyle = '#00F';
            this.ctx.beginPath();
            this.ctx.moveTo(
                padding + player.position.x * scale,
                padding + player.position.y * scale
            );
            this.ctx.lineTo(
                padding + (player.position.x + player.direction.x * 2) * scale,
                padding + (player.position.y + player.direction.y * 2) * scale
            );
            this.ctx.stroke();
        }
    };

    console.log("Raycaster module loaded");
})(window.FPSGame);
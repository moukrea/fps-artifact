/**
 * Renderer module for the game
 * Handles the raycasting and sprite rendering
 */
(function (MyApp) {
    // Dependencies
    const Utils = MyApp.Utils;
    const Math3D = MyApp.Math3D;
    const Vector3 = Math3D.Vector3;
    const Vector2 = Math3D.Vector2;
    const Ray = Math3D.Ray;

    // Private variables
    let _canvas = null;
    let _ctx = null;
    let _width = 0;
    let _height = 0;
    let _halfWidth = 0;
    let _halfHeight = 0;
    let _aspectRatio = 1;
    let _fov = 60; // Field of view in degrees
    let _fovRad = Utils.degreesToRadians(_fov);
    let _pixelRatio = 1;

    // Camera settings
    const _camera = {
        position: new Vector3(0, 0, 0),
        direction: new Vector3(0, 0, 1),
        pitch: 0,
        yaw: 0,
        // up vector is always (0, 1, 0) in our simple FPS
        planeDistance: 1.0,
        zNear: 0.1,
        zFar: 1000
    };

    // Rendering settings
    const _settings = {
        wallHeight: 1.0,
        textureSize: 64,
        fogEnabled: true,
        fogDistance: 10,
        fogColor: '#000',
        lightingEnabled: true,
        skyColor: '#87CEEB',
        floorColor: '#8B4513',
        renderDistance: 20
    };

    // Textures and sprites
    const _textures = {
        walls: [],
        sprites: [],
        weapons: []
    };

    // Pre-computed rendering data
    let _zbuffer = []; // For sprite depth sorting

    /**
     * Initialize the renderer
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {Object} options - Optional configuration
     */
    function init(canvas, options = {}) {
        _canvas = canvas;
        _ctx = canvas.getContext('2d');

        // Apply options
        if (options.fov) _fov = options.fov;
        if (options.settings) Object.assign(_settings, options.settings);

        // Calculate FOV in radians
        _fovRad = Utils.degreesToRadians(_fov);

        // Initial resize
        resize();

        // Load default textures and placeholders
        _loadPlaceholderTextures();

        console.log('Renderer initialized');
    }

    /**
     * Load placeholder textures for development
     */
    function _loadPlaceholderTextures() {
        // Create some simple placeholder textures
        const textureSize = _settings.textureSize;

        // Wall textures
        const wallTextures = [
            _createBrickTexture('#8B0000', '#A52A2A'),
            _createCheckerboardTexture('#444', '#888'),
            _createCircleTexture('#666', '#AAA'),
            _createStripedTexture('#396', '#7BA')
        ];

        // Sprite textures (enemies)
        const spriteTextures = [
            _createEnemySprite('#F00'),
            _createEnemySprite('#0F0'),
            _createEnemySprite('#00F')
        ];

        // Weapon textures
        const weaponTextures = [
            _createWeaponTexture('#888')
        ];

        // Store textures
        _textures.walls = wallTextures;
        _textures.sprites = spriteTextures;
        _textures.weapons = weaponTextures;
    }

    /**
     * Create a simple brick texture
     * @param {string} color1 - First color
     * @param {string} color2 - Second color
     * @returns {HTMLCanvasElement} Texture canvas
     */
    function _createBrickTexture(color1, color2) {
        const size = _settings.textureSize;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = size;
        tempCanvas.height = size;
        const ctx = tempCanvas.getContext('2d');

        // Background
        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, size, size);

        // Brick pattern
        ctx.fillStyle = color2;
        const brickHeight = 16;
        const brickWidth = 32;
        const mortarSize = 2;

        for (let y = 0; y < size; y += brickHeight) {
            const offset = (Math.floor(y / brickHeight) % 2) * (brickWidth / 2);
            for (let x = -brickWidth; x < size; x += brickWidth) {
                ctx.fillRect(x + offset, y, brickWidth - mortarSize, brickHeight - mortarSize);
            }
        }

        return tempCanvas;
    }

    /**
     * Create a checkerboard texture
     * @param {string} color1 - First color
     * @param {string} color2 - Second color
     * @returns {HTMLCanvasElement} Texture canvas
     */
    function _createCheckerboardTexture(color1, color2) {
        const size = _settings.textureSize;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = size;
        tempCanvas.height = size;
        const ctx = tempCanvas.getContext('2d');

        const tileSize = 16;

        for (let y = 0; y < size; y += tileSize) {
            for (let x = 0; x < size; x += tileSize) {
                ctx.fillStyle = ((x / tileSize + y / tileSize) % 2 === 0) ? color1 : color2;
                ctx.fillRect(x, y, tileSize, tileSize);
            }
        }

        return tempCanvas;
    }

    /**
     * Create a texture with a circle pattern
     * @param {string} color1 - Background color
     * @param {string} color2 - Circle color
     * @returns {HTMLCanvasElement} Texture canvas
     */
    function _createCircleTexture(color1, color2) {
        const size = _settings.textureSize;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = size;
        tempCanvas.height = size;
        const ctx = tempCanvas.getContext('2d');

        // Background
        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, size, size);

        // Circle
        ctx.fillStyle = color2;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 3, 0, Math.PI * 2);
        ctx.fill();

        return tempCanvas;
    }

    /**
     * Create a texture with a striped pattern
     * @param {string} color1 - First color
     * @param {string} color2 - Second color
     * @returns {HTMLCanvasElement} Texture canvas
     */
    function _createStripedTexture(color1, color2) {
        const size = _settings.textureSize;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = size;
        tempCanvas.height = size;
        const ctx = tempCanvas.getContext('2d');

        // Background
        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, size, size);

        // Stripes
        const stripeWidth = 8;
        ctx.fillStyle = color2;

        for (let i = 0; i < size; i += stripeWidth * 2) {
            ctx.fillRect(i, 0, stripeWidth, size);
        }

        return tempCanvas;
    }

    /**
     * Create a simple enemy sprite
     * @param {string} color - Sprite color
     * @returns {HTMLCanvasElement} Sprite canvas
     */
    function _createEnemySprite(color) {
        const size = _settings.textureSize;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = size;
        tempCanvas.height = size;
        const ctx = tempCanvas.getContext('2d');

        // Transparent background
        ctx.clearRect(0, 0, size, size);

        // Draw a simple humanoid figure
        const centerX = size / 2;
        const centerY = size / 2;

        // Head
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 20, 10, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillRect(centerX - 10, centerY - 10, 20, 30);

        // Arms
        ctx.fillRect(centerX - 20, centerY - 5, 10, 5);
        ctx.fillRect(centerX + 10, centerY - 5, 10, 5);

        // Legs
        ctx.fillRect(centerX - 8, centerY + 20, 6, 15);
        ctx.fillRect(centerX + 2, centerY + 20, 6, 15);

        return tempCanvas;
    }

    /**
     * Create a simple weapon texture
     * @param {string} color - Weapon color
     * @returns {HTMLCanvasElement} Weapon canvas
     */
    function _createWeaponTexture(color) {
        const width = 256;
        const height = 128;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext('2d');

        // Transparent background
        ctx.clearRect(0, 0, width, height);

        // Draw a simple gun shape
        ctx.fillStyle = color;

        // Barrel
        ctx.fillRect(width / 2 - 5, 20, 10, 60);

        // Body
        ctx.fillRect(width / 2 - 15, 70, 30, 40);

        // Handle
        ctx.fillRect(width / 2 - 10, 110, 8, 18);

        return tempCanvas;
    }

    /**
     * Resize the renderer to match canvas dimensions
     */
    function resize() {
        const displayWidth = _canvas.clientWidth;
        const displayHeight = _canvas.clientHeight;

        // Check if canvas needs resizing
        if (_canvas.width !== displayWidth || _canvas.height !== displayHeight) {
            // Update canvas and context
            const { width, height, ratio } = Utils.resizeCanvas(_canvas, displayWidth, displayHeight);
            _width = width;
            _height = height;
            _halfWidth = _width / 2;
            _halfHeight = _height / 2;
            _aspectRatio = _width / _height;
            _pixelRatio = ratio;

            // Reallocate z-buffer
            _zbuffer = new Array(_width).fill(Infinity);

            console.log(`Renderer resized to ${_width}x${_height}, pixel ratio: ${_pixelRatio}`);
        }
    }

    /**
     * Render the scene
     * @param {Object} map - Map data
     * @param {Array} entities - Game entities to render
     * @param {Object} player - Player object
     */
    function render(map, entities, player) {
        // Skip rendering if any required components are missing
        if (!map || !player || !player.position) {
            console.warn('Missing required components for rendering:', {
                map: !!map,
                player: !!player,
                playerPosition: player && !!player.position
            });
            return;
        }

        try {
            // Clear the canvas first
            clear();

            // Check if we're in a state where game world should be rendered
            if (MyApp.UI && MyApp.UI.getGameState() === 'playing') {
                // Draw sky
                _drawSky();

                // Draw floor
                _drawFloor();

                // Draw walls using raycasting
                _drawWalls(map);

                // Draw sprites (enemies, items, etc.)
                if (entities && entities.length > 0) {
                    _drawSprites(entities);
                }

                // Draw weapon
                if (player.weapon) {
                    _drawWeapon(player.weapon);
                }
            }

            // Draw UI/HUD - always do this last so it's on top
            if (MyApp.UI) {
                MyApp.UI.render(_ctx, player, _width, _height);
            }
        } catch (error) {
            console.error('Error during rendering:', error);
        }
    }

    /**
     * Draw the sky
     */
    function _drawSky() {
        // Simple sky gradient
        const gradient = _ctx.createLinearGradient(0, 0, 0, _halfHeight);
        gradient.addColorStop(0, _settings.skyColor);
        gradient.addColorStop(1, '#FFF');

        _ctx.fillStyle = gradient;
        _ctx.fillRect(0, 0, _width, _halfHeight);
    }

    /**
     * Draw the floor
     */
    function _drawFloor() {
        _ctx.fillStyle = _settings.floorColor;
        _ctx.fillRect(0, _halfHeight, _width, _halfHeight);
    }

    /**
     * Draw walls using raycasting
     * @param {Object} map - Map data
     */
    function _drawWalls(map) {
        // For each column of the screen
        for (let x = 0; x < _width; x++) {
            // Calculate ray position and direction
            // x-coordinate in camera space (-1 to +1)
            const cameraX = 2 * (x / _width) - 1;

            // Ray direction for current column
            const rayDirX = _camera.direction.x + _camera.planeDistance * cameraX * _aspectRatio;
            const rayDirY = _camera.direction.z + _camera.planeDistance * cameraX;

            // Ray starting position
            const rayStart = new Vector3(
                _camera.position.x,
                _camera.position.y,
                _camera.position.z
            );

            // Create ray
            const ray = new Ray(
                rayStart,
                new Vector3(rayDirX, 0, rayDirY).normalize()
            );

            // Perform raycasting from player position
            const hit = map.castRay(ray, _settings.renderDistance);

            if (hit) {
                // Calculate wall height
                const perpWallDist = hit.distance * Math.cos(cameraX * _fovRad / 2);
                const wallHeight = Math.floor(_height / perpWallDist);

                // Calculate wall Y position
                const drawStart = Math.max(0, Math.floor(_halfHeight - wallHeight / 2));
                const drawEnd = Math.min(_height, Math.floor(_halfHeight + wallHeight / 2));

                // Get texture
                const wallTexture = _textures.walls[hit.textureId % _textures.walls.length];

                // Calculate texture X coordinate
                let wallX;
                if (hit.side === 0) { // X-side
                    wallX = rayStart.z + hit.distance * ray.direction.z;
                } else { // Y-side
                    wallX = rayStart.x + hit.distance * ray.direction.x;
                }
                wallX -= Math.floor(wallX);

                // Texture coordinates
                let texX = Math.floor(wallX * _settings.textureSize);
                if ((hit.side === 0 && ray.direction.x > 0) ||
                    (hit.side === 1 && ray.direction.z < 0)) {
                    texX = _settings.textureSize - texX - 1;
                }

                // How much to increase the texture coordinate per screen pixel
                const step = _settings.textureSize / wallHeight;
                // Starting texture coordinate
                let texPos = (drawStart - _halfHeight + wallHeight / 2) * step;

                // Apply shading based on wall orientation for a 3D effect
                const shadingFactor = hit.side === 1 ? 0.7 : 1.0;

                // Apply fog based on distance
                let fogFactor = 0;
                if (_settings.fogEnabled) {
                    fogFactor = Math.min(1, hit.distance / _settings.fogDistance);
                }

                // Draw the wall column
                _drawTexturedColumn(x, drawStart, drawEnd, wallTexture, texX, texPos, step, shadingFactor, fogFactor);

                // Save distance in z-buffer for sprite rendering
                _zbuffer[x] = hit.distance;
            } else {
                // No wall hit, set z-buffer to maximum
                _zbuffer[x] = _settings.renderDistance;
            }
        }
    }

    /**
     * Draw a textured column for wall rendering
     * @param {number} x - Screen x coordinate
     * @param {number} start - Starting y coordinate
     * @param {number} end - Ending y coordinate
     * @param {HTMLCanvasElement} texture - Wall texture
     * @param {number} texX - Texture x coordinate
     * @param {number} texPos - Starting texture position
     * @param {number} step - Texture step per pixel
     * @param {number} shadingFactor - Shading factor (0-1)
     * @param {number} fogFactor - Fog factor (0-1)
     */
    function _drawTexturedColumn(x, start, end, texture, texX, texPos, step, shadingFactor, fogFactor) {
        // Get texture context and data
        const texCtx = texture.getContext('2d');
        const texData = texCtx.getImageData(texX, 0, 1, _settings.textureSize).data;

        // For each pixel in the column
        for (let y = start; y < end; y++) {
            // Current texture Y coordinate
            const texY = Math.min(_settings.textureSize - 1, Math.floor(texPos) & (_settings.textureSize - 1));
            texPos += step;

            // Get pixel color from texture
            const texIndex = texY * 4;
            let r = texData[texIndex];
            let g = texData[texIndex + 1];
            let b = texData[texIndex + 2];

            // Apply shading
            if (_settings.lightingEnabled) {
                r = Math.floor(r * shadingFactor);
                g = Math.floor(g * shadingFactor);
                b = Math.floor(b * shadingFactor);
            }

            // Apply fog
            if (_settings.fogEnabled && fogFactor > 0) {
                const fogColor = _hexToRgb(_settings.fogColor);
                r = Math.floor(r * (1 - fogFactor) + fogColor.r * fogFactor);
                g = Math.floor(g * (1 - fogFactor) + fogColor.g * fogFactor);
                b = Math.floor(b * (1 - fogFactor) + fogColor.b * fogFactor);
            }

            // Draw pixel
            _ctx.fillStyle = `rgb(${r},${g},${b})`;
            _ctx.fillRect(x, y, 1, 1);
        }
    }

    /**
     * Convert hex color to RGB object
     * @param {string} hex - Hex color string
     * @returns {Object} RGB color object
     */
    function _hexToRgb(hex) {
        // Remove # if present
        hex = hex.replace(/^#/, '');

        // Parse components
        const bigint = parseInt(hex, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;

        return { r, g, b };
    }

    /**
     * Draw sprites (enemies, items, etc.)
     * @param {Array} entities - Game entities to render
     */
    function _drawSprites(entities) {
        if (!entities || entities.length === 0) return;

        // Sort sprites by distance (far to near)
        const sortedEntities = [...entities].filter(entity => entity.visible)
            .sort((a, b) => {
                const distA = a.position.distanceToSquared(_camera.position);
                const distB = b.position.distanceToSquared(_camera.position);
                return distB - distA; // Far to near
            });

        // Transform and draw each sprite
        for (const entity of sortedEntities) {
            _drawSprite(entity);
        }
    }

    /**
     * Draw a single sprite
     * @param {Object} entity - Entity to draw
     */
    function _drawSprite(entity) {
        // Vector from camera to sprite
        const spritePos = new Vector3().copy(entity.position).subtract(_camera.position);

        // Transform sprite with the inverse camera matrix
        // Camera matrix is a rotation around y-axis and then translation
        // First, rotate around y-axis
        const invDet = 1.0 / (_camera.direction.z * _camera.planeDistance - _camera.direction.x * -_camera.planeDistance);

        const transformX = invDet * (_camera.direction.z * spritePos.x - _camera.direction.x * spritePos.z);
        const transformY = invDet * (-_camera.planeDistance * spritePos.x + _camera.planeDistance * spritePos.z);

        // Calculate sprite screen position
        const spriteScreenX = Math.floor((_halfWidth) * (1 + transformX / transformY));

        // Calculate sprite height and width on screen
        const spriteSize = Math.abs(Math.floor(_height / transformY));
        const halfSpriteSize = spriteSize / 2;

        // Calculate drawing bounds
        const drawStartY = Math.max(0, Math.floor(_halfHeight - halfSpriteSize));
        const drawEndY = Math.min(_height, Math.floor(_halfHeight + halfSpriteSize));

        const drawStartX = Math.max(0, Math.floor(spriteScreenX - halfSpriteSize));
        const drawEndX = Math.min(_width, Math.floor(spriteScreenX + halfSpriteSize));

        // Get the sprite texture
        const spriteTexture = _textures.sprites[entity.textureId % _textures.sprites.length];

        // Draw the sprite
        for (let x = drawStartX; x < drawEndX; x++) {
            // Check if sprite is in front of wall
            if (transformY > 0 && transformY < _zbuffer[x]) {
                // Get texture X coordinate
                const texX = Math.floor((x - (spriteScreenX - halfSpriteSize)) * _settings.textureSize / spriteSize);

                // Draw column if texX is valid
                if (texX >= 0 && texX < _settings.textureSize) {
                    // Get texture data
                    const texCtx = spriteTexture.getContext('2d');
                    const texData = texCtx.getImageData(texX, 0, 1, _settings.textureSize).data;

                    // Draw the column
                    for (let y = drawStartY; y < drawEndY; y++) {
                        // Calculate texture Y coordinate
                        const texY = Math.floor((y - drawStartY) * _settings.textureSize / spriteSize);

                        // Get pixel color from texture
                        const texIndex = texY * 4;
                        const r = texData[texIndex];
                        const g = texData[texIndex + 1];
                        const b = texData[texIndex + 2];
                        const a = texData[texIndex + 3];

                        // Only draw visible pixels (alpha > 0)
                        if (a > 0) {
                            // Apply fog based on distance
                            let fogFactor = 0;
                            if (_settings.fogEnabled) {
                                const distance = entity.position.distanceTo(_camera.position);
                                fogFactor = Math.min(1, distance / _settings.fogDistance);
                            }

                            // Apply fog
                            let finalR = r, finalG = g, finalB = b;
                            if (_settings.fogEnabled && fogFactor > 0) {
                                const fogColor = _hexToRgb(_settings.fogColor);
                                finalR = Math.floor(r * (1 - fogFactor) + fogColor.r * fogFactor);
                                finalG = Math.floor(g * (1 - fogFactor) + fogColor.g * fogFactor);
                                finalB = Math.floor(b * (1 - fogFactor) + fogColor.b * fogFactor);
                            }

                            _ctx.fillStyle = `rgba(${finalR},${finalG},${finalB},${a / 255})`;
                            _ctx.fillRect(x, y, 1, 1);
                        }
                    }
                }
            }
        }
    }

    /**
     * Draw the player's weapon
     * @param {Object} weapon - Weapon data
     */
    function _drawWeapon(weapon) {
        // Get weapon texture
        const weaponTexture = _textures.weapons[weapon.textureId % _textures.weapons.length];
        const weaponWidth = weaponTexture.width;
        const weaponHeight = weaponTexture.height;

        // Calculate weapon position
        const drawX = Math.floor(_width / 2 - weaponWidth / 2);
        const drawY = _height - weaponHeight;

        // Apply weapon bobbing effect based on movement
        const bobAmount = weapon.bobbing || 0;
        const adjustedY = drawY + Math.floor(Math.sin(Date.now() / 150) * bobAmount);

        // Draw weapon
        _ctx.drawImage(weaponTexture, drawX, adjustedY);

        // Apply muzzle flash if shooting
        if (weapon.isShooting) {
            // Draw a simple muzzle flash
            const flashSize = 20;
            const flashX = _width / 2;
            const flashY = _height - weaponHeight + 30;

            const gradient = _ctx.createRadialGradient(flashX, flashY, 0, flashX, flashY, flashSize);
            gradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
            gradient.addColorStop(0.7, 'rgba(255, 100, 0, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

            _ctx.fillStyle = gradient;
            _ctx.beginPath();
            _ctx.arc(flashX, flashY, flashSize, 0, Math.PI * 2);
            _ctx.fill();
        }
    }

    // Define the public API early to avoid reference issues
    MyApp.Renderer = {
        init: function(canvas, options) {
            return init(canvas, options);
        },
        resize: function() {
            return resize();
        },
        render: function(map, entities, player) {
            return render(map, entities, player);
        },
        setCamera: function(position, pitch, yaw) {
            try {
                if (!position) {
                    console.warn('Invalid camera position provided');
                    return;
                }
                
                _camera.position.copy(position);
                _camera.pitch = pitch || 0;
                _camera.yaw = yaw || 0;
                
                // Update camera direction vector
                _camera.direction = Math3D.eulerToDirection(_camera.pitch, _camera.yaw);
                
                // Log successful camera update
                console.log('Camera position updated:', 
                    position.x.toFixed(2), 
                    position.y.toFixed(2), 
                    position.z.toFixed(2)
                );
            } catch (error) {
                console.error('Error setting camera:', error);
            }
        },
        clear: function() {
            return clear();
        }
    };

    /**
     * Ensure setCamera is definitely defined
     * @param {Vector3} position - Camera position
     * @param {number} pitch - Camera pitch in radians
     * @param {number} yaw - Camera yaw in radians
     */
    function setCamera(position, pitch, yaw) {
        return MyApp.Renderer.setCamera(position, pitch, yaw);
    }

    // No need to export again, we already did it
    console.log('Renderer module loaded with functions:', Object.keys(MyApp.Renderer).join(', '));
})(window.MyApp || (window.MyApp = {}));
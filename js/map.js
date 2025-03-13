/**
 * Map module for the FPS game
 * Handles procedural map generation and raycasting
 */
(function (MyApp) {
    // Dependencies
    const Utils = MyApp.Utils;
    const Math3D = MyApp.Math3D;
    const Vector3 = Math3D.Vector3;
    const Ray = Math3D.Ray;

    // Private variables
    let _mapData = [];         // 2D grid of map cells
    let _mapSize = 64;         // Size of the initially generated map
    let _mapSeed = 0;          // Seed for procedural generation
    let _cellSize = 1.0;       // Size of each cell in world units
    let _boundaryWalls = true; // Whether to add boundary walls
    let _freeSpaces = [];      // List of free spaces for spawning

    // Map generation settings
    const _settings = {
        minRoomSize: 3,
        maxRoomSize: 8,
        roomDensity: 0.6,        // Higher = more rooms
        corridorWidth: 1,
        extraConnections: 0.2    // Chance of adding extra corridors between rooms
    };

    /**
     * Map cell types
     */
    const CELL_TYPE = {
        EMPTY: 0,
        WALL: 1,
        DOOR: 2,
        ITEM: 3
    };

    /**
     * Initialize the map
     * @param {Object} options - Optional configuration
     */
    function init(options = {}) {
        // Apply options
        if (options.mapSize) _mapSize = options.mapSize;
        if (options.seed) _mapSeed = options.seed;
        if (options.cellSize) _cellSize = options.cellSize;
        if (options.settings) Object.assign(_settings, options.settings);

        // Generate the map
        generate();
        console.log('Map initialized');
    }

    /**
     * Generate a new procedural map
     * @param {number} seed - Optional seed for generation
     */
    function generate(seed = Date.now()) {
        // Set seed for deterministic generation
        _mapSeed = seed;
        
        // Initialize seedrandom library if it exists
        if (typeof Math.seedrandom === 'function') {
            Math.seedrandom(_mapSeed.toString());
        }
        
        console.log(`Generating map with seed: ${_mapSeed}`);

        // Initialize map data with empty cells
        _mapData = Array(_mapSize).fill().map(() => Array(_mapSize).fill(CELL_TYPE.EMPTY));

        // Clear existing free spaces
        _freeSpaces = [];

        // Add boundary walls if enabled
        if (_boundaryWalls) {
            _addBoundaryWalls();
        }

        // Generate rooms and corridors
        _generateRooms();

        // Add some random walls for variety
        _addRandomWalls();

        // Find and store all free spaces for entity spawning
        _findFreeSpaces();

        // Debug output
        console.log(`Map generated: ${_mapSize}x${_mapSize}, free spaces: ${_freeSpaces.length}`);
        
        // Force regeneration of free spaces if none are found
        if (_freeSpaces.length === 0) {
            console.warn('No free spaces found in map! Generating fallback spaces...');
            // Create some guaranteed free spaces
            for (let x = 5; x < _mapSize - 5; x += 10) {
                for (let y = 5; y < _mapSize - 5; y += 10) {
                    // Create a small free area
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            if (x + dx >= 0 && x + dx < _mapSize && y + dy >= 0 && y + dy < _mapSize) {
                                _mapData[y + dy][x + dx] = CELL_TYPE.EMPTY;
                            }
                        }
                    }
                    // Add to free spaces
                    _freeSpaces.push({ x, y });
                }
            }
            console.log('Generated fallback spaces:', _freeSpaces.length);
        }

        return _mapData;
    }

    /**
     * Add walls around the map boundary
     */
    function _addBoundaryWalls() {
        // Top and bottom walls
        for (let x = 0; x < _mapSize; x++) {
            _mapData[0][x] = CELL_TYPE.WALL;
            _mapData[_mapSize - 1][x] = CELL_TYPE.WALL;
        }

        // Left and right walls
        for (let y = 0; y < _mapSize; y++) {
            _mapData[y][0] = CELL_TYPE.WALL;
            _mapData[y][_mapSize - 1] = CELL_TYPE.WALL;
        }
    }

    /**
     * Generate rooms and connect them with corridors
     */
    function _generateRooms() {
        const rooms = [];
        const maxAttempts = 100;
        const targetRoomCount = Math.floor(_mapSize * _mapSize * 0.01 * _settings.roomDensity);

        // Try to place rooms
        for (let i = 0; i < maxAttempts && rooms.length < targetRoomCount; i++) {
            const width = Utils.randomInt(_settings.minRoomSize, _settings.maxRoomSize);
            const height = Utils.randomInt(_settings.minRoomSize, _settings.maxRoomSize);
            const x = Utils.randomInt(1, _mapSize - width - 1);
            const y = Utils.randomInt(1, _mapSize - height - 1);

            // Check if the room overlaps with any existing room
            let overlaps = false;
            for (let j = 0; j < rooms.length; j++) {
                const room = rooms[j];
                if (_roomsOverlap(x, y, width, height, room.x, room.y, room.width, room.height, 1)) {
                    overlaps = true;
                    break;
                }
            }

            if (!overlaps) {
                rooms.push({ x, y, width, height });

                // Create the room by adding walls
                for (let ry = y; ry < y + height; ry++) {
                    for (let rx = x; rx < x + width; rx++) {
                        if (ry === y || ry === y + height - 1 || rx === x || rx === x + width - 1) {
                            _mapData[ry][rx] = CELL_TYPE.WALL;
                        } else {
                            _mapData[ry][rx] = CELL_TYPE.EMPTY;
                        }
                    }
                }

                // Add a door in a random wall
                const doorWall = Utils.randomInt(0, 3); // 0=top, 1=right, 2=bottom, 3=left
                let doorX = 0, doorY = 0;

                switch (doorWall) {
                    case 0: // Top
                        doorX = Utils.randomInt(x + 1, x + width - 2);
                        doorY = y;
                        break;
                    case 1: // Right
                        doorX = x + width - 1;
                        doorY = Utils.randomInt(y + 1, y + height - 2);
                        break;
                    case 2: // Bottom
                        doorX = Utils.randomInt(x + 1, x + width - 2);
                        doorY = y + height - 1;
                        break;
                    case 3: // Left
                        doorX = x;
                        doorY = Utils.randomInt(y + 1, y + height - 2);
                        break;
                }

                _mapData[doorY][doorX] = CELL_TYPE.DOOR;
            }
        }

        // Connect rooms with corridors
        if (rooms.length > 1) {
            for (let i = 0; i < rooms.length - 1; i++) {
                const roomA = rooms[i];
                const roomB = rooms[i + 1];

                _connectRooms(roomA, roomB);
            }

            // Add some extra connections for complexity
            for (let i = 0; i < rooms.length; i++) {
                for (let j = i + 2; j < rooms.length; j++) {
                    if (Math.random() < _settings.extraConnections) {
                        _connectRooms(rooms[i], rooms[j]);
                    }
                }
            }
        }
    }

    /**
     * Check if two rooms overlap
     * @param {number} x1 - First room x
     * @param {number} y1 - First room y
     * @param {number} w1 - First room width
     * @param {number} h1 - First room height
     * @param {number} x2 - Second room x
     * @param {number} y2 - Second room y
     * @param {number} w2 - Second room width
     * @param {number} h2 - Second room height
     * @param {number} padding - Extra padding to check
     * @returns {boolean} True if rooms overlap
     */
    function _roomsOverlap(x1, y1, w1, h1, x2, y2, w2, h2, padding = 0) {
        return !(
            x1 > x2 + w2 + padding ||
            x1 + w1 + padding < x2 ||
            y1 > y2 + h2 + padding ||
            y1 + h1 + padding < y2
        );
    }

    /**
     * Connect two rooms with a corridor
     * @param {Object} roomA - First room
     * @param {Object} roomB - Second room
     */
    function _connectRooms(roomA, roomB) {
        // Get center points of each room
        const centerA = {
            x: Math.floor(roomA.x + roomA.width / 2),
            y: Math.floor(roomA.y + roomA.height / 2)
        };

        const centerB = {
            x: Math.floor(roomB.x + roomB.width / 2),
            y: Math.floor(roomB.y + roomB.height / 2)
        };

        // Randomly decide whether to go horizontal first or vertical first
        if (Math.random() < 0.5) {
            // Horizontal first, then vertical
            _createHorizontalCorridor(centerA.x, centerB.x, centerA.y);
            _createVerticalCorridor(centerA.y, centerB.y, centerB.x);
        } else {
            // Vertical first, then horizontal
            _createVerticalCorridor(centerA.y, centerB.y, centerA.x);
            _createHorizontalCorridor(centerA.x, centerB.x, centerB.y);
        }
    }

    /**
     * Create a horizontal corridor
     * @param {number} x1 - Start x
     * @param {number} x2 - End x
     * @param {number} y - Y position
     */
    function _createHorizontalCorridor(x1, x2, y) {
        const start = Math.min(x1, x2);
        const end = Math.max(x1, x2);
        const width = _settings.corridorWidth;

        for (let x = start; x <= end; x++) {
            for (let dy = -Math.floor(width / 2); dy <= Math.floor(width / 2); dy++) {
                const cy = y + dy;

                // Make sure we're within map bounds
                if (cy > 0 && cy < _mapSize - 1) {
                    // If it's a wall, make it a door (unless it's a boundary wall)
                    if (_mapData[cy][x] === CELL_TYPE.WALL &&
                        cy > 0 && cy < _mapSize - 1 &&
                        x > 0 && x < _mapSize - 1) {
                        _mapData[cy][x] = CELL_TYPE.DOOR;
                    } else if (_mapData[cy][x] !== CELL_TYPE.DOOR) {
                        _mapData[cy][x] = CELL_TYPE.EMPTY;
                    }
                }
            }
        }
    }

    /**
     * Create a vertical corridor
     * @param {number} y1 - Start y
     * @param {number} y2 - End y
     * @param {number} x - X position
     */
    function _createVerticalCorridor(y1, y2, x) {
        const start = Math.min(y1, y2);
        const end = Math.max(y1, y2);
        const width = _settings.corridorWidth;

        for (let y = start; y <= end; y++) {
            for (let dx = -Math.floor(width / 2); dx <= Math.floor(width / 2); dx++) {
                const cx = x + dx;

                // Make sure we're within map bounds
                if (cx > 0 && cx < _mapSize - 1) {
                    // If it's a wall, make it a door (unless it's a boundary wall)
                    if (_mapData[y][cx] === CELL_TYPE.WALL &&
                        y > 0 && y < _mapSize - 1 &&
                        cx > 0 && cx < _mapSize - 1) {
                        _mapData[y][cx] = CELL_TYPE.DOOR;
                    } else if (_mapData[y][cx] !== CELL_TYPE.DOOR) {
                        _mapData[y][cx] = CELL_TYPE.EMPTY;
                    }
                }
            }
        }
    }

    /**
     * Add random walls for variety
     */
    function _addRandomWalls() {
        const wallCount = Math.floor(_mapSize * _mapSize * 0.01);

        for (let i = 0; i < wallCount; i++) {
            const x = Utils.randomInt(1, _mapSize - 2);
            const y = Utils.randomInt(1, _mapSize - 2);

            // Only place a wall if the cell and its neighbors are empty
            if (_mapData[y][x] === CELL_TYPE.EMPTY) {
                let hasNeighborWall = false;

                // Check immediate neighbors
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (_mapData[y + dy][x + dx] === CELL_TYPE.WALL) {
                            hasNeighborWall = true;
                            break;
                        }
                    }
                    if (hasNeighborWall) break;
                }

                // Add wall if there's a neighbor wall
                if (hasNeighborWall) {
                    _mapData[y][x] = CELL_TYPE.WALL;
                }
            }
        }
    }

    /**
     * Find all free spaces in the map for entity spawning
     */
    function _findFreeSpaces() {
        _freeSpaces = [];

        for (let y = 1; y < _mapSize - 1; y++) {
            for (let x = 1; x < _mapSize - 1; x++) {
                if (_mapData[y][x] === CELL_TYPE.EMPTY) {
                    // Check all 8 neighbors to ensure it's not too close to a wall
                    let isClear = true;
                    for (let dy = -1; dy <= 1 && isClear; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (_mapData[y + dy][x + dx] === CELL_TYPE.WALL) {
                                isClear = false;
                                break;
                            }
                        }
                    }

                    if (isClear) {
                        _freeSpaces.push({ x, y });
                    }
                }
            }
        }
    }

    /**
     * Get a random free space for entity spawning
     * @param {boolean} remove - Whether to remove the space from available spaces
     * @returns {Object|null} Free space coordinates or null if none available
     */
    function getRandomFreeSpace(remove = false) {
        if (_freeSpaces.length === 0) {
            console.warn('No free spaces available for spawning!');
            
            // Create a default spawn point in a safe location
            const defaultSpace = { 
                x: _cellSize * Math.floor(_mapSize / 2), 
                y: 0, 
                z: _cellSize * Math.floor(_mapSize / 2) 
            };
            
            console.log('Using default spawn position:', defaultSpace);
            return defaultSpace;
        }
        
        const index = Utils.randomInt(0, _freeSpaces.length - 1);
        const space = _freeSpaces[index];
        
        // Create the world position
        const worldPos = {
            x: space.x * _cellSize,
            y: 0, // Ground level
            z: space.y * _cellSize
        };
        
        console.log('Selected spawn position:', worldPos);
        
        if (remove) {
            _freeSpaces.splice(index, 1);
        }
        
        return worldPos;
    }

    /**
     * Check if a world position is a wall
     * @param {number} x - World X coordinate
     * @param {number} z - World Z coordinate
     * @returns {boolean} True if position is a wall
     */
    function isWall(x, z) {
        // Convert world coordinates to map coordinates
        const mapX = Math.floor(x / _cellSize);
        const mapZ = Math.floor(z / _cellSize);

        // Check if within map bounds
        if (mapX < 0 || mapX >= _mapSize || mapZ < 0 || mapZ >= _mapSize) {
            return true; // Out of bounds is considered a wall
        }

        // Check if the cell is a wall
        return _mapData[mapZ][mapX] === CELL_TYPE.WALL;
    }

    /**
     * Get the cell type at a world position
     * @param {number} x - World X coordinate
     * @param {number} z - World Z coordinate
     * @returns {number} Cell type
     */
    function getCellType(x, z) {
        // Convert world coordinates to map coordinates
        const mapX = Math.floor(x / _cellSize);
        const mapZ = Math.floor(z / _cellSize);

        // Check if within map bounds
        if (mapX < 0 || mapX >= _mapSize || mapZ < 0 || mapZ >= _mapSize) {
            return CELL_TYPE.WALL; // Out of bounds is considered a wall
        }

        return _mapData[mapZ][mapX];
    }

    /**
     * Cast a ray against the map
     * @param {Ray} ray - Ray to cast
     * @param {number} maxDistance - Maximum distance to check
     * @returns {Object|null} Hit information or null if no hit
     */
    function castRay(ray, maxDistance = 100) {
        // DDA (Digital Differential Analysis) algorithm for raycasting

        // Starting position of the ray in map coordinates
        const mapPos = {
            x: Math.floor(ray.origin.x / _cellSize),
            z: Math.floor(ray.origin.z / _cellSize)
        };

        // Direction of the ray
        const rayDir = ray.direction;

        // Length of ray from current position to next x or z-side
        let sideDistX;
        let sideDistZ;

        // Length of ray from one x or z-side to next x or z-side
        const deltaDistX = Math.abs(1 / rayDir.x);
        const deltaDistZ = Math.abs(1 / rayDir.z);

        // Direction to step in x or z direction (either +1 or -1)
        const stepX = rayDir.x < 0 ? -1 : 1;
        const stepZ = rayDir.z < 0 ? -1 : 1;

        // Calculate initial sideDistX and sideDistZ
        if (rayDir.x < 0) {
            sideDistX = (ray.origin.x / _cellSize - mapPos.x) * deltaDistX;
        } else {
            sideDistX = (mapPos.x + 1 - ray.origin.x / _cellSize) * deltaDistX;
        }

        if (rayDir.z < 0) {
            sideDistZ = (ray.origin.z / _cellSize - mapPos.z) * deltaDistZ;
        } else {
            sideDistZ = (mapPos.z + 1 - ray.origin.z / _cellSize) * deltaDistZ;
        }

        // Perform DDA
        let hit = false;
        let side = 0; // 0 for x-side, 1 for z-side
        let hitDistance = 0;

        while (!hit && hitDistance < maxDistance) {
            // Jump to next map square, either in x or in z direction
            if (sideDistX < sideDistZ) {
                sideDistX += deltaDistX;
                mapPos.x += stepX;
                side = 0;
            } else {
                sideDistZ += deltaDistZ;
                mapPos.z += stepZ;
                side = 1;
            }

            // Check if ray has hit a wall
            if (mapPos.x < 0 || mapPos.x >= _mapSize || mapPos.z < 0 || mapPos.z >= _mapSize) {
                // Out of map bounds
                hit = true;
            } else if (_mapData[mapPos.z][mapPos.x] === CELL_TYPE.WALL) {
                hit = true;
            }

            // Calculate distance along the ray
            if (side === 0) {
                hitDistance = (mapPos.x - ray.origin.x / _cellSize + (1 - stepX) / 2) / rayDir.x;
            } else {
                hitDistance = (mapPos.z - ray.origin.z / _cellSize + (1 - stepZ) / 2) / rayDir.z;
            }

            // Convert to world units
            hitDistance *= _cellSize;
        }

        if (hit && hitDistance < maxDistance) {
            // Determine which wall texture to use (can be based on position, orientation, etc.)
            const textureId = (mapPos.x + mapPos.z) % 4;

            return {
                hit: true,
                distance: hitDistance,
                side: side,
                mapX: mapPos.x,
                mapZ: mapPos.z,
                textureId: textureId
            };
        }

        return null;
    }

    /**
     * Get the map size
     * @returns {number} Map size
     */
    function getMapSize() {
        return _mapSize;
    }

    /**
     * Get the cell size
     * @returns {number} Cell size
     */
    function getCellSize() {
        return _cellSize;
    }

    /**
     * Get the raw map data array
     * @returns {Array} 2D array of map data
     */
    function getMapData() {
        return _mapData;
    }

    /**
     * Expand the map in a given direction
     * This adds more procedurally generated content as the player explores
     * @param {string} direction - Direction to expand ('north', 'east', 'south', 'west')
     */
    function expandMap(direction) {
        // Save the current size
        const oldSize = _mapSize;
        let newMapData = [];

        // Create a new larger map data array
        switch (direction) {
            case 'north':
                // Add new rows at the beginning
                _mapSize += _settings.maxRoomSize;
                newMapData = Array(_mapSize).fill().map(() => Array(oldSize).fill(CELL_TYPE.EMPTY));

                // Copy existing data to the bottom of the new map
                for (let y = 0; y < oldSize; y++) {
                    for (let x = 0; x < oldSize; x++) {
                        newMapData[y + _settings.maxRoomSize][x] = _mapData[y][x];
                    }
                }
                break;

            case 'south':
                // Add new rows at the end
                _mapSize += _settings.maxRoomSize;
                newMapData = Array(_mapSize).fill().map(() => Array(oldSize).fill(CELL_TYPE.EMPTY));

                // Copy existing data to the top of the new map
                for (let y = 0; y < oldSize; y++) {
                    for (let x = 0; x < oldSize; x++) {
                        newMapData[y][x] = _mapData[y][x];
                    }
                }
                break;

            case 'west':
                // Add new columns at the beginning
                newMapData = Array(oldSize).fill().map(() => Array(oldSize + _settings.maxRoomSize).fill(CELL_TYPE.EMPTY));

                // Copy existing data to the right side of the new map
                for (let y = 0; y < oldSize; y++) {
                    for (let x = 0; x < oldSize; x++) {
                        newMapData[y][x + _settings.maxRoomSize] = _mapData[y][x];
                    }
                }

                // Update map size
                _mapSize = oldSize + _settings.maxRoomSize;
                break;

            case 'east':
                // Add new columns at the end
                newMapData = Array(oldSize).fill().map(() => Array(oldSize + _settings.maxRoomSize).fill(CELL_TYPE.EMPTY));

                // Copy existing data to the left side of the new map
                for (let y = 0; y < oldSize; y++) {
                    for (let x = 0; x < oldSize; x++) {
                        newMapData[y][x] = _mapData[y][x];
                    }
                }

                // Update map size
                _mapSize = oldSize + _settings.maxRoomSize;
                break;
        }

        // Replace the map data
        _mapData = newMapData;

        // Generate new content in the expanded area
        _generateExtraContent(direction, oldSize);

        // Update free spaces
        _findFreeSpaces();

        console.log(`Map expanded ${direction} to ${_mapSize}x${_mapSize}`);
    }

    /**
     * Generate new content in the expanded map area
     * @param {string} direction - Direction that was expanded
     * @param {number} oldSize - Previous map size
     */
    function _generateExtraContent(direction, oldSize) {
        // Generate walls and rooms based on direction
        switch (direction) {
            case 'north':
                // Generate content in the top rows
                for (let y = 0; y < _settings.maxRoomSize; y++) {
                    for (let x = 0; x < oldSize; x++) {
                        if (y === 0 || y === _settings.maxRoomSize - 1 || x === 0 || x === oldSize - 1) {
                            _mapData[y][x] = CELL_TYPE.WALL;
                        } else if (Math.random() < 0.2) {
                            _mapData[y][x] = CELL_TYPE.WALL;
                        }
                    }
                }

                // Connect to existing map
                for (let x = 1; x < oldSize - 1; x += 10) {
                    _mapData[_settings.maxRoomSize - 1][x] = CELL_TYPE.EMPTY;
                }
                break;

            case 'south':
                // Generate content in the bottom rows
                for (let y = oldSize; y < _mapSize; y++) {
                    for (let x = 0; x < oldSize; x++) {
                        if (y === oldSize || y === _mapSize - 1 || x === 0 || x === oldSize - 1) {
                            _mapData[y][x] = CELL_TYPE.WALL;
                        } else if (Math.random() < 0.2) {
                            _mapData[y][x] = CELL_TYPE.WALL;
                        }
                    }
                }

                // Connect to existing map
                for (let x = 1; x < oldSize - 1; x += 10) {
                    _mapData[oldSize][x] = CELL_TYPE.EMPTY;
                }
                break;

            case 'west':
                // Generate content in the left columns
                for (let y = 0; y < oldSize; y++) {
                    for (let x = 0; x < _settings.maxRoomSize; x++) {
                        if (y === 0 || y === oldSize - 1 || x === 0 || x === _settings.maxRoomSize - 1) {
                            _mapData[y][x] = CELL_TYPE.WALL;
                        } else if (Math.random() < 0.2) {
                            _mapData[y][x] = CELL_TYPE.WALL;
                        }
                    }
                }

                // Connect to existing map
                for (let y = 1; y < oldSize - 1; y += 10) {
                    _mapData[y][_settings.maxRoomSize - 1] = CELL_TYPE.EMPTY;
                }
                break;

            case 'east':
                // Generate content in the right columns
                for (let y = 0; y < oldSize; y++) {
                    for (let x = oldSize; x < _mapSize; x++) {
                        if (y === 0 || y === oldSize - 1 || x === oldSize || x === _mapSize - 1) {
                            _mapData[y][x] = CELL_TYPE.WALL;
                        } else if (Math.random() < 0.2) {
                            _mapData[y][x] = CELL_TYPE.WALL;
                        }
                    }
                }

                // Connect to existing map
                for (let y = 1; y < oldSize - 1; y += 10) {
                    _mapData[y][oldSize] = CELL_TYPE.EMPTY;
                }
                break;
        }
    }

    // Export the public API
    MyApp.Map = {
        init,
        generate,
        getRandomFreeSpace,
        isWall,
        getCellType,
        castRay,
        getMapSize,
        getCellSize,
        getMapData,
        expandMap,
        CELL_TYPE
    };

    console.log('Map module loaded');
})(window.MyApp || (window.MyApp = {}));
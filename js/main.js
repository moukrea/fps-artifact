// FPS Game Engine
// Constants for game configuration
const WALL_SIZE = 1.0;         // Size of wall blocks
const FOV = 60 * Math.PI/180;  // Field of view in radians
const MOVEMENT_SPEED = 0.05;   // Movement speed
const ROTATION_SPEED = 0.03;   // Rotation speed
const MOUSE_SENSITIVITY = 0.002; // Mouse look sensitivity
const WEAPON_COOLDOWN = 500;   // Reload time in milliseconds

// Canvas and context
let canvas, ctx;
let canvasWidth, canvasHeight;
let lastTime = 0;
let fps = 0;
let frameCount = 0;
let frameTime = 0;
let isAzerty = false;

// Player state
const player = {
  x: 1.5,
  y: 1.5,
  angle: 0,
  verticalAngle: 0,
  walking: false,
  shooting: false,
  reloading: false,
  reloadTimer: 0,
  lastShootTime: 0,
  bobPhase: 0,
  bobAmount: 0.006,
  bobSpeed: 0.01
};

// Input state
const keys = {};
let mouseX = 0, mouseY = 0;
let mouseDX = 0, mouseDY = 0;
let isPointerLocked = false;

// Map definition - Simple square room (1 = wall, 0 = empty)
const mapSize = 10;
const map = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

// Texture patterns for walls
const wallTextures = {
  createBrickPattern: (color1, color2) => {
    const textureSize = 64;
    const brickWidth = 16;
    const brickHeight = 8;
    
    const canvas = document.createElement('canvas');
    canvas.width = textureSize;
    canvas.height = textureSize;
    const context = canvas.getContext('2d');
    
    // Background
    context.fillStyle = color1;
    context.fillRect(0, 0, textureSize, textureSize);
    
    // Draw bricks
    context.fillStyle = color2;
    for (let y = 0; y < textureSize; y += brickHeight) {
      const offset = (Math.floor(y / brickHeight) % 2) * (brickWidth / 2);
      for (let x = 0; x < textureSize; x += brickWidth) {
        context.fillRect(x + offset, y, brickWidth - 1, brickHeight - 1);
      }
    }
    
    return canvas;
  }
};

// Particles system
const particles = [];
const MAX_PARTICLES = 100;

// Screen shake effect
let screenShake = {
  intensity: 0,
  duration: 0,
  offsetX: 0,
  offsetY: 0
};

// Initialize textures
let wallTexture;

// Initialize the game
function init() {
  // Set up canvas
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  
  // Generate wall texture
  wallTexture = wallTextures.createBrickPattern('#553322', '#774433');
  
  // Resize canvas to fill window
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Set up input handlers
  setupInputHandlers();
  
  // Detect keyboard layout
  detectKeyboardLayout();
  
  // Start the game loop
  requestAnimationFrame(gameLoop);
}

// Resize canvas to fill window
function resizeCanvas() {
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
}

// Detect keyboard layout (QWERTY vs AZERTY)
function detectKeyboardLayout() {
  // Simple detection based on browser language
  const language = navigator.language || navigator.userLanguage;
  
  // French and Belgian layouts are typically AZERTY
  if (language.startsWith('fr') || language.startsWith('be')) {
    isAzerty = true;
  }
  
  console.log(`Detected keyboard layout: ${isAzerty ? 'AZERTY' : 'QWERTY'}`);
}

// Set up input handlers
function setupInputHandlers() {
  // Keyboard input
  window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    e.preventDefault();
  });
  
  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    e.preventDefault();
  });
  
  // Mouse movement
  document.addEventListener('mousemove', (e) => {
    if (isPointerLocked) {
      mouseDX += e.movementX || 0;
      mouseDY += e.movementY || 0;
    } else {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }
  });
  
  // Mouse click
  canvas.addEventListener('click', (e) => {
    if (!isPointerLocked) {
      canvas.requestPointerLock = canvas.requestPointerLock || 
                                canvas.mozRequestPointerLock || 
                                canvas.webkitRequestPointerLock;
      canvas.requestPointerLock();
    }
    
    // If not reloading, shoot
    if (!player.reloading) {
      shoot();
    }
  });
  
  // Pointer lock change
  document.addEventListener('pointerlockchange', lockChangeAlert, false);
  document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
  document.addEventListener('webkitpointerlockchange', lockChangeAlert, false);
  
  function lockChangeAlert() {
    if (document.pointerLockElement === canvas || 
        document.mozPointerLockElement === canvas ||
        document.webkitPointerLockElement === canvas) {
      isPointerLocked = true;
    } else {
      isPointerLocked = false;
    }
  }
}

// Main game loop
function gameLoop(timestamp) {
  // Calculate delta time and FPS
  const deltaTime = timestamp - lastTime || 16.67; // Default to 60fps if first frame
  lastTime = timestamp;
  
  // Update FPS counter
  frameCount++;
  frameTime += deltaTime;
  if (frameTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    frameTime = 0;
  }
  
  // Update game state
  update(deltaTime);
  
  // Render the game
  render();
  
  // Request next frame
  requestAnimationFrame(gameLoop);
}

// Update game state
function update(deltaTime) {
  // Normalize deltaTime to avoid large jumps
  const dt = Math.min(deltaTime, 100) / 16.67; // Normalized to 60fps
  
  // Handle player movement
  updatePlayerMovement(dt);
  
  // Handle player actions
  updatePlayerActions(deltaTime);
  
  // Update particles
  updateParticles(deltaTime);
  
  // Update screen shake
  updateScreenShake(deltaTime);
}

// Update player movement
function updatePlayerMovement(dt) {
  // Mouse look
  if (mouseDX !== 0) {
    player.angle += mouseDX * MOUSE_SENSITIVITY;
    mouseDX = 0;
  }
  
  if (mouseDY !== 0) {
    player.verticalAngle += mouseDY * MOUSE_SENSITIVITY;
    // Clamp vertical angle to avoid flipping
    player.verticalAngle = Math.max(-Math.PI/3, Math.min(Math.PI/3, player.verticalAngle));
    mouseDY = 0;
  }
  
  // Keyboard movement
  let moveX = 0;
  let moveY = 0;
  
  // Forward/backward movement
  if (keys['w'] || (isAzerty && keys['z'])) {
    moveX += Math.cos(player.angle) * MOVEMENT_SPEED * dt;
    moveY += Math.sin(player.angle) * MOVEMENT_SPEED * dt;
    player.walking = true;
  } else if (keys['s']) {
    moveX -= Math.cos(player.angle) * MOVEMENT_SPEED * dt;
    moveY -= Math.sin(player.angle) * MOVEMENT_SPEED * dt;
    player.walking = true;
  }
  
  // Strafe left/right
  if (keys['a'] || (isAzerty && keys['q'])) {
    moveX += Math.cos(player.angle - Math.PI/2) * MOVEMENT_SPEED * dt;
    moveY += Math.sin(player.angle - Math.PI/2) * MOVEMENT_SPEED * dt;
    player.walking = true;
  } else if (keys['d']) {
    moveX += Math.cos(player.angle + Math.PI/2) * MOVEMENT_SPEED * dt;
    moveY += Math.sin(player.angle + Math.PI/2) * MOVEMENT_SPEED * dt;
    player.walking = true;
  }
  
  // If no movement keys pressed, player is not walking
  if (!((keys['w'] || (isAzerty && keys['z'])) || keys['s'] || (keys['a'] || (isAzerty && keys['q'])) || keys['d'])) {
    player.walking = false;
  }
  
  // Update bobbing effect when walking
  if (player.walking) {
    player.bobPhase += player.bobSpeed * dt * 16.67;
    if (player.bobPhase > Math.PI * 2) {
      player.bobPhase -= Math.PI * 2;
    }
  } else {
    // Gradually reset bobbing when not walking
    if (player.bobPhase !== 0) {
      // Find the closest path to 0
      const target = player.bobPhase > Math.PI ? Math.PI * 2 : 0;
      player.bobPhase = approach(player.bobPhase, target, player.bobSpeed * dt * 16.67);
      if (Math.abs(player.bobPhase - target) < 0.01) {
        player.bobPhase = target % (Math.PI * 2);
      }
    }
  }
  
  // Collision detection - simple approach
  const newX = player.x + moveX;
  const newY = player.y + moveY;
  
  // Check if the new position would be inside a wall
  const cellX = Math.floor(newX);
  const cellY = Math.floor(newY);
  
  // Player radius (for collision)
  const playerRadius = 0.3;
  
  // Check corners of player's collision circle
  const checkCollision = (x, y) => {
    const cellX = Math.floor(x);
    const cellY = Math.floor(y);
    return cellX >= 0 && cellX < mapSize && cellY >= 0 && cellY < mapSize && map[cellY][cellX] === 0;
  };
  
  // Check collisions
  const isValidX = checkCollision(newX + playerRadius, player.y) &&
                  checkCollision(newX - playerRadius, player.y);
  
  const isValidY = checkCollision(player.x, newY + playerRadius) &&
                  checkCollision(player.x, newY - playerRadius);
  
  // Apply movement
  if (isValidX) player.x = newX;
  if (isValidY) player.y = newY;
}

// Helper to smoothly approach a target value
function approach(current, target, step) {
  if (current < target) {
    return Math.min(current + step, target);
  } else {
    return Math.max(current - step, target);
  }
}

// Update player actions (shooting, reloading)
function updatePlayerActions(deltaTime) {
  // Update reload timer
  if (player.reloading) {
    player.reloadTimer -= deltaTime;
    if (player.reloadTimer <= 0) {
      player.reloading = false;
    }
  }
}

// Shoot the weapon
function shoot() {
  const currentTime = performance.now();
  
  // Prevent shooting too rapidly
  if (currentTime - player.lastShootTime < 200) {
    return;
  }
  
  player.lastShootTime = currentTime;
  player.shooting = true;
  
  // Add muzzle flash particles
  addMuzzleFlashParticles();
  
  // Add screen shake
  addScreenShake(0.05, 150);
  
  // After a delay, start reloading
  player.reloading = true;
  player.reloadTimer = WEAPON_COOLDOWN;
  
  // Reset shooting flag after a short delay
  setTimeout(() => {
    player.shooting = false;
  }, 100);
}

// Add muzzle flash particles
function addMuzzleFlashParticles() {
  for (let i = 0; i < 15; i++) {
    if (particles.length < MAX_PARTICLES) {
      particles.push({
        x: 0,
        y: 0,
        z: 0,
        size: Math.random() * 0.03 + 0.01,
        speed: Math.random() * 0.1 + 0.05,
        angle: Math.random() * Math.PI * 2,
        vertAngle: Math.random() * Math.PI - Math.PI/2,
        life: Math.random() * 200 + 100,
        color: `rgba(255, ${Math.floor(Math.random() * 100 + 156)}, 0, ${Math.random() * 0.7 + 0.3})`
      });
    }
  }
}

// Update particles
function updateParticles(deltaTime) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    
    // Update particle position
    particle.x += Math.cos(particle.angle) * Math.cos(particle.vertAngle) * particle.speed * deltaTime / 16.67;
    particle.y += Math.sin(particle.angle) * Math.cos(particle.vertAngle) * particle.speed * deltaTime / 16.67;
    particle.z += Math.sin(particle.vertAngle) * particle.speed * deltaTime / 16.67;
    
    // Update particle life
    particle.life -= deltaTime;
    
    // Remove dead particles
    if (particle.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

// Add screen shake effect
function addScreenShake(intensity, duration) {
  screenShake.intensity = Math.max(screenShake.intensity, intensity);
  screenShake.duration = Math.max(screenShake.duration, duration);
}

// Update screen shake effect
function updateScreenShake(deltaTime) {
  if (screenShake.duration > 0) {
    screenShake.duration -= deltaTime;
    
    // Calculate random shake offset
    screenShake.offsetX = (Math.random() * 2 - 1) * screenShake.intensity * canvasWidth;
    screenShake.offsetY = (Math.random() * 2 - 1) * screenShake.intensity * canvasHeight;
    
    // Fade out intensity as duration decreases
    if (screenShake.duration <= 0) {
      screenShake.intensity = 0;
      screenShake.offsetX = 0;
      screenShake.offsetY = 0;
    }
  }
}

// Render the game
function render() {
  // Apply screen shake
  ctx.save();
  ctx.translate(screenShake.offsetX, screenShake.offsetY);
  
  // Clear canvas
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // Render 3D view (raycasting)
  renderRaycasting();
  
  // Render weapon
  renderWeapon();
  
  // Render particles
  renderParticles();
  
  // Render HUD
  renderHUD();
  
  // Render crosshair
  renderCrosshair();
  
  // Reset screen shake
  ctx.restore();
}

// Render the 3D view using raycasting
function renderRaycasting() {
  const rayCount = Math.floor(canvasWidth);
  const rayStep = FOV / rayCount;
  
  // Apply bobbing effect
  const bobbingOffset = player.walking ? Math.sin(player.bobPhase) * player.bobAmount * canvasHeight : 0;
  
  for (let i = 0; i < rayCount; i++) {
    // Calculate ray angle
    const rayAngle = player.angle - FOV/2 + i * rayStep;
    
    // Cast the ray
    const result = castRay(player.x, player.y, rayAngle);
    
    // Calculate wall height based on distance
    const distance = result.distance * Math.cos(rayAngle - player.angle); // Fix fisheye effect
    const wallHeight = (WALL_SIZE / distance) * ((canvasWidth/2) / Math.tan(FOV/2));
    
    // Calculate vertical position with perspective and bobbing
    const verticalOffset = player.verticalAngle * canvasHeight/2 + bobbingOffset;
    const wallTop = (canvasHeight - wallHeight) / 2 + verticalOffset;
    
    // Calculate shading based on distance and wall orientation
    let brightness = Math.min(1, 1.0 / (distance * 0.3 + 0.3));
    
    // Apply different shading based on which wall face was hit
    if (result.side === 0) { // Horizontal wall face
      brightness *= 0.8; // Slightly darker
    }
    
    // Draw the wall strip
    if (wallTexture) {
      // Calculate texture coordinate
      let wallX;
      if (result.side === 0) {
        wallX = player.y + distance * Math.sin(rayAngle);
      } else {
        wallX = player.x + distance * Math.cos(rayAngle);
      }
      wallX -= Math.floor(wallX);
      
      // Calculate texture column
      let texX = Math.floor(wallX * wallTexture.width);
      if ((result.side === 0 && Math.cos(rayAngle) > 0) || 
          (result.side === 1 && Math.sin(rayAngle) < 0)) {
        texX = wallTexture.width - texX - 1;
      }
      
      // Create a pattern from the sliced texture column
      try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 1;
        tempCanvas.height = wallTexture.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(wallTexture, texX, 0, 1, wallTexture.height, 0, 0, 1, wallTexture.height);
        
        // Apply brightness
        tempCtx.fillStyle = `rgba(0, 0, 0, ${1 - brightness})`;
        tempCtx.fillRect(0, 0, 1, wallTexture.height);
        
        const pattern = ctx.createPattern(tempCanvas, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fillRect(i, wallTop, 1, wallHeight);
      } catch (e) {
        // Fallback to solid color if texture fails
        const r = Math.floor(200 * brightness);
        const g = Math.floor(170 * brightness);
        const b = Math.floor(150 * brightness);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(i, wallTop, 1, wallHeight);
      }
    } else {
      // Fallback to solid color
      const r = Math.floor(200 * brightness);
      const g = Math.floor(170 * brightness);
      const b = Math.floor(150 * brightness);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(i, wallTop, 1, wallHeight);
    }
    
    // Draw the floor and ceiling
    const floorGradient = ctx.createLinearGradient(0, wallTop + wallHeight, 0, canvasHeight);
    floorGradient.addColorStop(0, `rgba(50, 50, 50, 1)`);
    floorGradient.addColorStop(1, `rgba(10, 10, 10, 1)`);
    
    const ceilingGradient = ctx.createLinearGradient(0, 0, 0, wallTop);
    ceilingGradient.addColorStop(0, `rgba(10, 10, 10, 1)`);
    ceilingGradient.addColorStop(1, `rgba(50, 50, 50, 1)`);
    
    ctx.fillStyle = floorGradient;
    ctx.fillRect(i, wallTop + wallHeight, 1, canvasHeight - (wallTop + wallHeight));
    
    ctx.fillStyle = ceilingGradient;
    ctx.fillRect(i, 0, 1, wallTop);
  }
}

// Cast a single ray and return hit information
function castRay(startX, startY, angle) {
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  
  // Current map cell
  let mapX = Math.floor(startX);
  let mapY = Math.floor(startY);
  
  // Distance to next x or y grid line
  let deltaDistX = Math.abs(1 / dirX);
  let deltaDistY = Math.abs(1 / dirY);
  
  // Distance from start to first x or y grid line
  let sideDistX, sideDistY;
  
  // Direction to step in (+1 or -1)
  let stepX, stepY;
  
  // Hit flag and side (0 = x-side, 1 = y-side)
  let hit = false;
  let side;
  
  // Calculate step and initial sideDist
  if (dirX < 0) {
    stepX = -1;
    sideDistX = (startX - mapX) * deltaDistX;
  } else {
    stepX = 1;
    sideDistX = (mapX + 1 - startX) * deltaDistX;
  }
  
  if (dirY < 0) {
    stepY = -1;
    sideDistY = (startY - mapY) * deltaDistY;
  } else {
    stepY = 1;
    sideDistY = (mapY + 1 - startY) * deltaDistY;
  }
  
  // DDA algorithm
  while (!hit) {
    // Jump to next map square
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
      side = 0;
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
      side = 1;
    }
    
    // Check if ray has hit a wall
    if (mapX < 0 || mapX >= mapSize || mapY < 0 || mapY >= mapSize || map[mapY][mapX] === 1) {
      hit = true;
    }
  }
  
  // Calculate distance to the wall
  let wallDist;
  if (side === 0) {
    wallDist = (mapX - startX + (1 - stepX) / 2) / dirX;
  } else {
    wallDist = (mapY - startY + (1 - stepY) / 2) / dirY;
  }
  
  return {
    distance: wallDist,
    side: side,
    mapX: mapX,
    mapY: mapY
  };
}

// Render the weapon
function renderWeapon() {
  const weaponWidth = canvasWidth * 0.4;
  const weaponHeight = weaponWidth * 0.5;
  const weaponX = (canvasWidth - weaponWidth) / 2;
  const weaponY = canvasHeight - weaponHeight + 20;
  
  // Apply bobbing effect to weapon
  const weaponBobX = player.walking ? Math.sin(player.bobPhase) * 5 : 0;
  const weaponBobY = player.walking ? Math.abs(Math.cos(player.bobPhase) * 5) : 0;
  
  // Apply recoil effect when shooting
  const recoilY = player.shooting ? -20 : 0;
  
  // Create weapon gradient
  const weaponGradient = ctx.createLinearGradient(
    weaponX + weaponBobX, 
    weaponY + weaponBobY + recoilY, 
    weaponX + weaponBobX, 
    weaponY + weaponBobY + recoilY + weaponHeight
  );
  weaponGradient.addColorStop(0, '#444');
  weaponGradient.addColorStop(0.5, '#222');
  weaponGradient.addColorStop(1, '#111');
  
  // Draw weapon with effects
  ctx.fillStyle = weaponGradient;
  ctx.fillRect(weaponX + weaponBobX, weaponY + weaponBobY + recoilY, weaponWidth, weaponHeight);
  
  // Draw weapon barrel
  ctx.fillStyle = '#222';
  ctx.fillRect(
    weaponX + weaponWidth * 0.2 + weaponBobX, 
    weaponY - 10 + weaponBobY + recoilY, 
    weaponWidth * 0.6, 
    30
  );
  
  // Add weapon details
  ctx.fillStyle = '#555';
  ctx.fillRect(
    weaponX + weaponWidth * 0.3 + weaponBobX, 
    weaponY + 20 + weaponBobY + recoilY, 
    weaponWidth * 0.4, 
    weaponHeight * 0.3
  );
  
  // Draw muzzle flash when shooting
  if (player.shooting) {
    const flashSize = 30 + Math.random() * 10;
    const flashX = weaponX + weaponWidth/2 + weaponBobX;
    const flashY = weaponY - 10 + weaponBobY + recoilY;
    
    // Create radial gradient for muzzle flash
    const flashGradient = ctx.createRadialGradient(
      flashX, flashY, 0,
      flashX, flashY, flashSize
    );
    flashGradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
    flashGradient.addColorStop(0.5, 'rgba(255, 200, 50, 0.7)');
    flashGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
    
    ctx.fillStyle = flashGradient;
    ctx.beginPath();
    ctx.arc(flashX, flashY, flashSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Show reload indicator
  if (player.reloading) {
    const reloadProgress = 1 - (player.reloadTimer / WEAPON_COOLDOWN);
    const indicatorWidth = weaponWidth * 0.8;
    
    ctx.fillStyle = '#444';
    ctx.fillRect(
      weaponX + weaponWidth * 0.1 + weaponBobX, 
      weaponY + weaponHeight - 20 + weaponBobY + recoilY, 
      indicatorWidth, 
      10
    );
    
    ctx.fillStyle = '#f70';
    ctx.fillRect(
      weaponX + weaponWidth * 0.1 + weaponBobX, 
      weaponY + weaponHeight - 20 + weaponBobY + recoilY, 
      indicatorWidth * reloadProgress, 
      10
    );
  }
}

// Render particles
function renderParticles() {
  for (const particle of particles) {
    // Project particle position to screen coordinates
    const relX = particle.x;
    const relY = particle.z;
    const relZ = particle.y;
    
    // Calculate distance to player
    const distance = Math.sqrt(relX * relX + relY * relY + relZ * relZ);
    
    // Calculate screen position
    const screenX = canvasWidth / 2 + (relX / distance) * canvasWidth;
    const screenY = canvasHeight / 2 + (relY / distance) * canvasHeight;
    
    // Calculate particle size based on distance
    const size = (particle.size / distance) * canvasWidth;
    
    // Only render if in front of player and on screen
    if (screenX >= 0 && screenX < canvasWidth && screenY >= 0 && screenY < canvasHeight && distance > 0.1) {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Render HUD
function renderHUD() {
  // Draw FPS counter
  ctx.fillStyle = '#fff';
  ctx.font = '14px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`FPS: ${fps}`, 10, 20);
  
  // Draw player position
  ctx.fillText(`X: ${player.x.toFixed(2)} Y: ${player.y.toFixed(2)}`, 10, 40);
  
  // Draw keyboard layout indicator
  ctx.fillText(`Keyboard: ${isAzerty ? 'AZERTY' : 'QWERTY'}`, 10, 60);
}

// Render crosshair
function renderCrosshair() {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const size = 10;
  
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  
  // Horizontal line
  ctx.beginPath();
  ctx.moveTo(centerX - size, centerY);
  ctx.lineTo(centerX + size, centerY);
  ctx.stroke();
  
  // Vertical line
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - size);
  ctx.lineTo(centerX, centerY + size);
  ctx.stroke();
}

// Start the game when the page is loaded
window.addEventListener('load', init);
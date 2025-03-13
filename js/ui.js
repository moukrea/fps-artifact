/**
 * UI module for the FPS game
 * Handles HUD rendering and game interface
 */
(function (MyApp) {
    // Dependencies
    const Utils = MyApp.Utils;

    // Private variables
    let _canvas = null;
    let _ctx = null;
    let _width = 0;
    let _height = 0;
    let _gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameover'
    let _menuSelection = 0;
    let _damageOverlay = {
        active: false,
        alpha: 0,
        time: 0,
        direction: { x: 0, y: 0 }
    };
    let _messageQueue = [];
    let _showFps = false;
    let _fpsCounter = {
        frames: 0,
        lastTime: 0,
        value: 0
    };

    // UI settings
    const _settings = {
        hudColor: '#fff',
        hudShadowColor: 'rgba(0, 0, 0, 0.5)',
        healthBarColor: '#f33',
        armorBarColor: '#3af',
        ammoColor: '#fd3',
        messageTimeVisible: 3000, // ms
        crosshairSize: 10,
        crosshairThickness: 2,
        crosshairColor: '#fff',
        damageFadeTime: 500, // ms
        damageOverlayColor: '#f00'
    };

    // Menu items
    const _menuItems = [
        { label: 'Start Game', action: 'startGame' },
        { label: 'Options', action: 'showOptions' },
        { label: 'Controls', action: 'showControls' },
        { label: 'Credits', action: 'showCredits' }
    ];

    /**
     * Initialize the UI module
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {Object} options - Optional configuration
     */
    function init(canvas, options = {}) {
        // Store canvas reference (but will use context from renderer)
        _canvas = canvas;

        // Apply options
        if (options.settings) Object.assign(_settings, options.settings);

        // Set initial sizes
        _width = canvas.width;
        _height = canvas.height;

        // Set up input handlers for UI
        _setupInput();

        // Set up player event listeners
        if (MyApp.Player) {
            _setupPlayerEvents();
        }

        console.log('UI initialized');
    }

    /**
     * Set up input handlers
     */
    function _setupInput() {
        if (!MyApp.Input) {
            console.error('Input module not loaded');
            return;
        }

        // Listen for key presses
        MyApp.Input.on('keyDown', (key) => {
            // Toggle FPS counter with F key
            if (key === 'f') {
                _showFps = !_showFps;
            }

            // Menu navigation
            if (_gameState === 'menu') {
                if (key === 'arrowup' || key === 'w') {
                    _menuSelection = (_menuSelection - 1 + _menuItems.length) % _menuItems.length;
                } else if (key === 'arrowdown' || key === 's') {
                    _menuSelection = (_menuSelection + 1) % _menuItems.length;
                } else if (key === 'enter' || key === ' ') {
                    _handleMenuSelection();
                }
            }

            // Pause/unpause
            if (key === 'escape') {
                if (_gameState === 'playing') {
                    _gameState = 'paused';
                } else if (_gameState === 'paused') {
                    _gameState = 'playing';
                }
            }
        });
    }

    /**
     * Set up player event listeners
     */
    function _setupPlayerEvents() {
        // Listen for damage events
        MyApp.Player.on('damage', (amount, direction) => {
            // Show damage overlay
            _damageOverlay.active = true;
            _damageOverlay.alpha = Math.min(0.7, amount / 50); // Alpha based on damage amount
            _damageOverlay.time = Utils.now();
            _damageOverlay.direction = direction;

            // Add message for heavy damage
            if (amount > 20) {
                addMessage('Heavy damage taken!', '#f55');
            }
        });

        // Listen for heal events
        MyApp.Player.on('heal', (amount) => {
            addMessage(`+${amount} Health`, '#5f5');
        });

        // Listen for armor pickup events
        MyApp.Player.on('armorPickup', (amount) => {
            addMessage(`+${amount} Armor`, '#5af');
        });

        // Listen for ammo pickup events
        MyApp.Player.on('ammoPickup', (amount) => {
            addMessage(`+${amount} Ammo`, '#fd5');
        });

        // Listen for weapon change events
        MyApp.Player.on('weaponChange', (newWeapon, oldWeapon) => {
            addMessage(`Weapon changed to ${newWeapon.toUpperCase()}`, '#fff');
        });

        // Listen for kill events
        MyApp.Player.on('kill', (enemy) => {
            addMessage('Enemy killed! +100 score', '#f55');
        });

        // Listen for reload events
        MyApp.Player.on('reload', (weaponType) => {
            addMessage('Reloading...', '#aaa');
        });

        // Listen for reload complete events
        MyApp.Player.on('reloadComplete', (weaponType) => {
            addMessage('Reload complete', '#aaa');
        });

        // Listen for death events
        MyApp.Player.on('death', () => {
            _gameState = 'gameover';
            addMessage('YOU DIED', '#f00', 5000);
        });
    }

    /**
     * Handle menu selection
     */
    function _handleMenuSelection() {
        const selected = _menuItems[_menuSelection];

        switch (selected.action) {
            case 'startGame':
                _gameState = 'playing';
                if (MyApp.Game) {
                    MyApp.Game.startGame();
                }
                break;
            case 'showOptions':
                // TODO: Show options menu
                break;
            case 'showControls':
                // TODO: Show controls screen
                break;
            case 'showCredits':
                // TODO: Show credits
                break;
        }
    }

    /**
     * Render the UI layer
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} player - Player state
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    function render(ctx, player, width, height) {
        // Update context and dimensions
        _ctx = ctx;
        _width = width;
        _height = height;

        // Update FPS counter
        _updateFpsCounter();

        // Render based on game state
        switch (_gameState) {
            case 'menu':
                _renderMenu();
                break;
            case 'playing':
                _renderHud(player);
                break;
            case 'paused':
                _renderHud(player);
                _renderPauseScreen();
                break;
            case 'gameover':
                _renderGameOver(player);
                break;
        }
    }

    /**
     * Render the main menu
     */
    function _renderMenu() {
        // Draw black semi-transparent background
        _ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        _ctx.fillRect(0, 0, _width, _height);

        // Draw title
        _ctx.fillStyle = '#ff3333';
        _ctx.font = 'bold 48px Arial';
        _ctx.textAlign = 'center';
        _ctx.textBaseline = 'middle';
        _ctx.fillText('FPS GAME', _width / 2, _height / 4);

        // Draw subtitle
        _ctx.fillStyle = '#ffffff';
        _ctx.font = '20px Arial';
        _ctx.fillText('A simple doom-like game', _width / 2, _height / 4 + 50);

        // Draw menu items
        _ctx.font = '24px Arial';
        const menuY = _height / 2;
        const menuItemHeight = 40;

        for (let i = 0; i < _menuItems.length; i++) {
            const item = _menuItems[i];
            const y = menuY + i * menuItemHeight;

            // Highlight selected item
            if (i === _menuSelection) {
                _ctx.fillStyle = '#ffcc00';
                _ctx.fillText('> ' + item.label + ' <', _width / 2, y);
            } else {
                _ctx.fillStyle = '#aaaaaa';
                _ctx.fillText(item.label, _width / 2, y);
            }
        }

        // Draw instructions
        _ctx.fillStyle = '#888888';
        _ctx.font = '16px Arial';
        _ctx.fillText('Use arrow keys or WASD to navigate, ENTER to select', _width / 2, _height - 100);
        _ctx.fillText('Press ESC to pause/unpause the game', _width / 2, _height - 70);
    }

    /**
     * Render the HUD (heads-up display)
     * @param {Object} player - Player state
     */
    function _renderHud(player) {
        // Draw crosshair
        _renderCrosshair();

        // Draw health bar
        _renderHealthBar(player);

        // Draw ammo counter
        _renderAmmoCounter(player);

        // Draw score
        _renderScore(player);

        // Draw messages
        _renderMessages();

        // Draw damage overlay
        _renderDamageOverlay();

        // Draw FPS counter if enabled
        if (_showFps) {
            _renderFpsCounter();
        }
    }

    /**
     * Render the crosshair
     */
    function _renderCrosshair() {
        const center = { x: _width / 2, y: _height / 2 };
        const size = _settings.crosshairSize;
        const thickness = _settings.crosshairThickness;

        _ctx.strokeStyle = _settings.crosshairColor;
        _ctx.lineWidth = thickness;

        // Draw horizontal line
        _ctx.beginPath();
        _ctx.moveTo(center.x - size, center.y);
        _ctx.lineTo(center.x + size, center.y);
        _ctx.stroke();

        // Draw vertical line
        _ctx.beginPath();
        _ctx.moveTo(center.x, center.y - size);
        _ctx.lineTo(center.x, center.y + size);
        _ctx.stroke();
    }

    /**
     * Render health and armor bars
     * @param {Object} player - Player state
     */
    function _renderHealthBar(player) {
        const barWidth = 200;
        const barHeight = 20;
        const padding = 10;
        const x = padding;
        const y = _height - barHeight - padding;

        // Draw health bar background
        _ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        _ctx.fillRect(x, y, barWidth, barHeight);

        // Draw health bar
        const healthPct = player.health / player.maxHealth;
        _ctx.fillStyle = _settings.healthBarColor;
        _ctx.fillRect(x, y, barWidth * healthPct, barHeight);

        // Draw health text
        _ctx.fillStyle = _settings.hudColor;
        _ctx.font = 'bold 14px Arial';
        _ctx.textAlign = 'left';
        _ctx.textBaseline = 'middle';
        _ctx.fillText(`HEALTH: ${Math.ceil(player.health)}`, x + 10, y + barHeight / 2);

        // Draw armor bar if player has armor
        if (player.armor > 0) {
            const armorY = y - barHeight - 5;

            // Draw armor bar background
            _ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            _ctx.fillRect(x, armorY, barWidth, barHeight);

            // Draw armor bar
            const armorPct = player.armor / player.maxArmor;
            _ctx.fillStyle = _settings.armorBarColor;
            _ctx.fillRect(x, armorY, barWidth * armorPct, barHeight);

            // Draw armor text
            _ctx.fillStyle = _settings.hudColor;
            _ctx.font = 'bold 14px Arial';
            _ctx.textAlign = 'left';
            _ctx.textBaseline = 'middle';
            _ctx.fillText(`ARMOR: ${Math.ceil(player.armor)}`, x + 10, armorY + barHeight / 2);
        }
    }

    /**
     * Render ammo counter
     * @param {Object} player - Player state
     */
    function _renderAmmoCounter(player) {
        const padding = 10;
        const x = _width - padding;
        const y = _height - padding;

        // Draw ammo counter
        _ctx.fillStyle = _settings.ammoColor;
        _ctx.font = 'bold 36px Arial';
        _ctx.textAlign = 'right';
        _ctx.textBaseline = 'bottom';

        // Draw current/max ammo
        _ctx.fillText(`${player.weapon.ammo}/${player.weapon.maxAmmo}`, x, y);

        // Draw total ammo
        _ctx.fillStyle = _settings.hudColor;
        _ctx.font = '18px Arial';
        _ctx.fillText(`AMMO: ${player.totalAmmo}`, x, y - 40);

        // Draw weapon name
        _ctx.fillText(`WEAPON: ${player.weapon.type.toUpperCase()}`, x, y - 70);

        // Draw reload message if reloading
        if (player.weapon.isReloading) {
            _ctx.fillStyle = '#ff5555';
            _ctx.fillText('RELOADING...', x, y - 100);
        }
    }

    /**
     * Render score display
     * @param {Object} player - Player state
     */
    function _renderScore(player) {
        const padding = 10;

        // Draw score
        _ctx.fillStyle = _settings.hudColor;
        _ctx.font = 'bold 24px Arial';
        _ctx.textAlign = 'left';
        _ctx.textBaseline = 'top';
        _ctx.fillText(`SCORE: ${player.score}`, padding, padding);

        // Draw kills count
        _ctx.font = '18px Arial';
        _ctx.fillText(`KILLS: ${player.kills}`, padding, padding + 30);
    }

    /**
     * Render message queue
     */
    function _renderMessages() {
        const now = Utils.now();
        const padding = 10;
        const messageHeight = 20;
        let y = _height / 3;

        // Filter and sort messages
        const activeMessages = _messageQueue.filter(msg => now - msg.time < msg.duration);

        // Update message queue
        _messageQueue = activeMessages;

        // Draw messages
        _ctx.textAlign = 'center';
        _ctx.textBaseline = 'middle';

        for (let i = 0; i < activeMessages.length; i++) {
            const msg = activeMessages[i];
            const age = now - msg.time;
            const alpha = Math.min(1, (_settings.messageTimeVisible - age) / 1000);

            _ctx.font = msg.font || '18px Arial';
            _ctx.fillStyle = msg.color || _settings.hudColor;

            // Apply alpha
            const rgba = _hexToRgba(msg.color || _settings.hudColor, alpha);
            _ctx.fillStyle = rgba;

            // Draw text with shadow
            _ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            _ctx.shadowBlur = 4;
            _ctx.fillText(msg.text, _width / 2, y);
            _ctx.shadowBlur = 0;

            y += messageHeight;
        }
    }

    /**
     * Render damage overlay
     */
    function _renderDamageOverlay() {
        if (!_damageOverlay.active) return;

        const now = Utils.now();
        const age = now - _damageOverlay.time;

        // Fade out over time
        if (age > _settings.damageFadeTime) {
            _damageOverlay.active = false;
            return;
        }

        // Calculate alpha based on age
        const alpha = _damageOverlay.alpha * (1 - age / _settings.damageFadeTime);

        // Create radial gradient based on damage direction
        const centerX = _width / 2 + _damageOverlay.direction.x * _width / 4;
        const centerY = _height / 2 + _damageOverlay.direction.y * _height / 4;

        const gradient = _ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, _width
        );

        gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
        gradient.addColorStop(0.5, `rgba(255, 0, 0, ${alpha * 0.3})`);
        gradient.addColorStop(1, `rgba(255, 0, 0, ${alpha})`);

        // Draw overlay
        _ctx.fillStyle = gradient;
        _ctx.fillRect(0, 0, _width, _height);
    }

    /**
     * Render the pause screen
     */
    function _renderPauseScreen() {
        // Draw semi-transparent background
        _ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        _ctx.fillRect(0, 0, _width, _height);

        // Draw pause text
        _ctx.fillStyle = '#ffffff';
        _ctx.font = 'bold 48px Arial';
        _ctx.textAlign = 'center';
        _ctx.textBaseline = 'middle';
        _ctx.fillText('PAUSED', _width / 2, _height / 2);

        // Draw instructions
        _ctx.font = '24px Arial';
        _ctx.fillText('Press ESC to resume', _width / 2, _height / 2 + 50);
    }

    /**
     * Render the game over screen
     * @param {Object} player - Player state
     */
    function _renderGameOver(player) {
        // Draw semi-transparent background
        _ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        _ctx.fillRect(0, 0, _width, _height);

        // Draw game over text
        _ctx.fillStyle = '#ff3333';
        _ctx.font = 'bold 72px Arial';
        _ctx.textAlign = 'center';
        _ctx.textBaseline = 'middle';
        _ctx.fillText('GAME OVER', _width / 2, _height / 3);

        // Draw stats
        _ctx.fillStyle = '#ffffff';
        _ctx.font = '28px Arial';
        _ctx.fillText(`Score: ${player.score}`, _width / 2, _height / 2);
        _ctx.fillText(`Kills: ${player.kills}`, _width / 2, _height / 2 + 40);

        // Draw restart instruction
        _ctx.font = '24px Arial';
        _ctx.fillText('Press ENTER to restart', _width / 2, _height / 2 + 120);
    }

    /**
     * Update FPS counter
     */
    function _updateFpsCounter() {
        _fpsCounter.frames++;

        const now = Utils.now();
        const elapsed = now - _fpsCounter.lastTime;

        if (elapsed >= 1000) {
            _fpsCounter.value = Math.round(_fpsCounter.frames * 1000 / elapsed);
            _fpsCounter.frames = 0;
            _fpsCounter.lastTime = now;
        }
    }

    /**
     * Render FPS counter
     */
    function _renderFpsCounter() {
        _ctx.fillStyle = _fpsCounter.value >= 50 ? '#00ff00' : _fpsCounter.value >= 30 ? '#ffff00' : '#ff0000';
        _ctx.font = '14px Arial';
        _ctx.textAlign = 'right';
        _ctx.textBaseline = 'top';
        _ctx.fillText(`FPS: ${_fpsCounter.value}`, _width - 10, 10);
    }

    /**
     * Convert hex color to rgba
     * @param {string} hex - Hex color
     * @param {number} alpha - Alpha value
     * @returns {string} RGBA color string
     */
    function _hexToRgba(hex, alpha) {
        let r, g, b;

        // Check if it's already an rgba string
        if (hex.startsWith('rgba')) {
            return hex;
        }

        // Remove # if present
        hex = hex.replace('#', '');

        if (hex.length === 3) {
            r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
            g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
            b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
        } else {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        }

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Add a message to the queue
     * @param {string} text - Message text
     * @param {string} color - Text color
     * @param {number} duration - Display duration in ms
     * @param {string} font - Font to use
     */
    function addMessage(text, color = '#ffffff', duration = null, font = null) {
        _messageQueue.push({
            text,
            color,
            font,
            time: Utils.now(),
            duration: duration || _settings.messageTimeVisible
        });

        // Limit queue size
        if (_messageQueue.length > 10) {
            _messageQueue.shift();
        }
    }

    /**
     * Set the game state
     * @param {string} state - New state
     */
    function setGameState(state) {
        if (['menu', 'playing', 'paused', 'gameover'].includes(state)) {
            _gameState = state;
        } else {
            console.error(`Invalid game state: ${state}`);
        }
    }

    /**
     * Get the current game state
     * @returns {string} Current game state
     */
    function getGameState() {
        return _gameState;
    }

    // Export the public API
    MyApp.UI = {
        init,
        render,
        addMessage,
        setGameState,
        getGameState
    };

    console.log('UI module loaded');
})(window.MyApp || (window.MyApp = {}));
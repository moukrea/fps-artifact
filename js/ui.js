/**
 * UI.js - User interface and HUD system
 */
(function (FPSGame) {
    // Create UI namespace
    FPSGame.UI = {};

    // UI manager class
    FPSGame.UI.UIManager = class UIManager {
        constructor(container) {
            this.container = container;
            this.elements = {};
            this.isVisible = true;
            this.messageQueue = [];
            this.messageTimer = 0;
            this.messageDisplayTime = 3; // seconds

            // Create main HUD elements
            this.createHUDElements();
        }

        // Create HUD elements
        createHUDElements() {
            // Get existing HUD elements
            this.elements.hud = document.getElementById('hud');
            if (!this.elements.hud) {
                // Create HUD container if it doesn't exist
                this.elements.hud = document.createElement('div');
                this.elements.hud.id = 'hud';
                this.elements.hud.style.position = 'absolute';
                this.elements.hud.style.top = '0';
                this.elements.hud.style.left = '0';
                this.elements.hud.style.width = '100%';
                this.elements.hud.style.height = '100%';
                this.elements.hud.style.pointerEvents = 'none';
                this.elements.hud.style.zIndex = '100';
                this.container.appendChild(this.elements.hud);
            }

            // Crosshair
            this.elements.crosshair = document.getElementById('crosshair');
            if (!this.elements.crosshair) {
                this.elements.crosshair = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                this.elements.crosshair.id = 'crosshair';
                this.elements.crosshair.setAttribute('viewBox', '0 0 24 24');
                this.elements.crosshair.style.position = 'absolute';
                this.elements.crosshair.style.top = '50%';
                this.elements.crosshair.style.left = '50%';
                this.elements.crosshair.style.transform = 'translate(-50%, -50%)';
                this.elements.crosshair.style.width = '20px';
                this.elements.crosshair.style.height = '20px';
                this.elements.crosshair.style.opacity = '0.8';

                // Add crosshair elements
                this.elements.crosshair.innerHTML = `
            <circle cx="12" cy="12" r="9" fill="none" stroke="white" stroke-width="1.5"/>
            <line x1="12" y1="4" x2="12" y2="8" stroke="white" stroke-width="1.5"/>
            <line x1="12" y1="16" x2="12" y2="20" stroke="white" stroke-width="1.5"/>
            <line x1="4" y1="12" x2="8" y2="12" stroke="white" stroke-width="1.5"/>
            <line x1="16" y1="12" x2="20" y2="12" stroke="white" stroke-width="1.5"/>
          `;

                this.elements.hud.appendChild(this.elements.crosshair);
            }

            // Health bar
            this.elements.healthBar = document.getElementById('health-bar');
            if (!this.elements.healthBar) {
                this.elements.healthBar = document.createElement('div');
                this.elements.healthBar.id = 'health-bar';
                this.elements.healthBar.style.position = 'absolute';
                this.elements.healthBar.style.bottom = '20px';
                this.elements.healthBar.style.left = '20px';
                this.elements.healthBar.style.width = '200px';
                this.elements.healthBar.style.height = '20px';
                this.elements.healthBar.style.background = 'rgba(0, 0, 0, 0.5)';
                this.elements.healthBar.style.border = '2px solid white';

                // Health fill
                this.elements.healthFill = document.createElement('div');
                this.elements.healthFill.id = 'health-fill';
                this.elements.healthFill.style.width = '100%';
                this.elements.healthFill.style.height = '100%';
                this.elements.healthFill.style.background = '#ff3333';

                this.elements.healthBar.appendChild(this.elements.healthFill);
                this.elements.hud.appendChild(this.elements.healthBar);
            } else {
                this.elements.healthFill = document.getElementById('health-fill');
            }

            // Armor bar
            this.elements.armorBar = document.getElementById('armor-bar');
            if (!this.elements.armorBar) {
                this.elements.armorBar = document.createElement('div');
                this.elements.armorBar.id = 'armor-bar';
                this.elements.armorBar.style.position = 'absolute';
                this.elements.armorBar.style.bottom = '45px';
                this.elements.armorBar.style.left = '20px';
                this.elements.armorBar.style.width = '200px';
                this.elements.armorBar.style.height = '20px';
                this.elements.armorBar.style.background = 'rgba(0, 0, 0, 0.5)';
                this.elements.armorBar.style.border = '2px solid white';

                // Armor fill
                this.elements.armorFill = document.createElement('div');
                this.elements.armorFill.id = 'armor-fill';
                this.elements.armorFill.style.width = '0%';
                this.elements.armorFill.style.height = '100%';
                this.elements.armorFill.style.background = '#3333ff';

                this.elements.armorBar.appendChild(this.elements.armorFill);
                this.elements.hud.appendChild(this.elements.armorBar);
            } else {
                this.elements.armorFill = document.getElementById('armor-fill');
            }

            // Ammo counter
            this.elements.ammoCounter = document.getElementById('ammo-counter');
            if (!this.elements.ammoCounter) {
                this.elements.ammoCounter = document.createElement('div');
                this.elements.ammoCounter.id = 'ammo-counter';
                this.elements.ammoCounter.style.position = 'absolute';
                this.elements.ammoCounter.style.bottom = '20px';
                this.elements.ammoCounter.style.right = '20px';
                this.elements.ammoCounter.style.color = 'white';
                this.elements.ammoCounter.style.fontFamily = 'Arial, sans-serif';
                this.elements.ammoCounter.style.fontSize = '24px';
                this.elements.ammoCounter.style.textShadow = '2px 2px 2px rgba(0, 0, 0, 0.5)';
                this.elements.ammoCounter.textContent = '0/0';

                this.elements.hud.appendChild(this.elements.ammoCounter);
            }

            // Message area
            this.elements.messageArea = document.getElementById('message-area');
            if (!this.elements.messageArea) {
                this.elements.messageArea = document.createElement('div');
                this.elements.messageArea.id = 'message-area';
                this.elements.messageArea.style.position = 'absolute';
                this.elements.messageArea.style.top = '20%';
                this.elements.messageArea.style.left = '50%';
                this.elements.messageArea.style.transform = 'translateX(-50%)';
                this.elements.messageArea.style.color = 'white';
                this.elements.messageArea.style.fontFamily = 'Arial, sans-serif';
                this.elements.messageArea.style.fontSize = '18px';
                this.elements.messageArea.style.textAlign = 'center';
                this.elements.messageArea.style.textShadow = '2px 2px 2px rgba(0, 0, 0, 0.5)';
                this.elements.messageArea.style.opacity = '0';
                this.elements.messageArea.style.transition = 'opacity 0.3s ease-in-out';

                this.elements.hud.appendChild(this.elements.messageArea);
            }

            // Damage indicator overlay
            this.elements.damageOverlay = document.getElementById('damage-overlay');
            if (!this.elements.damageOverlay) {
                this.elements.damageOverlay = document.createElement('div');
                this.elements.damageOverlay.id = 'damage-overlay';
                this.elements.damageOverlay.style.position = 'absolute';
                this.elements.damageOverlay.style.top = '0';
                this.elements.damageOverlay.style.left = '0';
                this.elements.damageOverlay.style.width = '100%';
                this.elements.damageOverlay.style.height = '100%';
                this.elements.damageOverlay.style.background = 'radial-gradient(circle, transparent 50%, rgba(255, 0, 0, 0.5) 100%)';
                this.elements.damageOverlay.style.opacity = '0';
                this.elements.damageOverlay.style.pointerEvents = 'none';
                this.elements.damageOverlay.style.zIndex = '50';

                this.container.appendChild(this.elements.damageOverlay);
            }

            // Game over screen
            this.elements.gameOver = document.getElementById('game-over');
            if (!this.elements.gameOver) {
                this.elements.gameOver = document.createElement('div');
                this.elements.gameOver.id = 'game-over';
                this.elements.gameOver.style.position = 'fixed';
                this.elements.gameOver.style.top = '0';
                this.elements.gameOver.style.left = '0';
                this.elements.gameOver.style.width = '100%';
                this.elements.gameOver.style.height = '100%';
                this.elements.gameOver.style.background = 'rgba(0, 0, 0, 0.8)';
                this.elements.gameOver.style.display = 'flex';
                this.elements.gameOver.style.flexDirection = 'column';
                this.elements.gameOver.style.justifyContent = 'center';
                this.elements.gameOver.style.alignItems = 'center';
                this.elements.gameOver.style.color = 'white';
                this.elements.gameOver.style.fontFamily = 'Arial, sans-serif';
                this.elements.gameOver.style.zIndex = '1000';
                this.elements.gameOver.style.display = 'none';

                // Game over title
                const gameOverTitle = document.createElement('h1');
                gameOverTitle.textContent = 'Game Over';

                // Score
                this.elements.score = document.createElement('div');
                this.elements.score.id = 'score';
                this.elements.score.style.fontSize = '48px';
                this.elements.score.style.marginBottom = '20px';
                this.elements.score.textContent = 'Score: 0';

                // Restart button
                this.elements.restartButton = document.createElement('button');
                this.elements.restartButton.id = 'restart-button';
                this.elements.restartButton.style.padding = '10px 20px';
                this.elements.restartButton.style.background = '#ff3333';
                this.elements.restartButton.style.color = 'white';
                this.elements.restartButton.style.border = 'none';
                this.elements.restartButton.style.borderRadius = '5px';
                this.elements.restartButton.style.fontSize = '20px';
                this.elements.restartButton.style.cursor = 'pointer';
                this.elements.restartButton.textContent = 'Play Again';
                this.elements.restartButton.style.pointerEvents = 'auto';

                // Add event listener for restart
                this.elements.restartButton.addEventListener('click', () => {
                    if (typeof FPSGame.Game.restart === 'function') {
                        FPSGame.Game.restart();
                    }
                    this.hideGameOver();
                });

                this.elements.gameOver.appendChild(gameOverTitle);
                this.elements.gameOver.appendChild(this.elements.score);
                this.elements.gameOver.appendChild(this.elements.restartButton);
                this.container.appendChild(this.elements.gameOver);
            } else {
                this.elements.score = document.getElementById('score');
                this.elements.restartButton = document.getElementById('restart-button');
            }
        }

        // Update UI based on game state
        update(deltaTime, player, gameState) {
            if (!this.isVisible) return;

            // Update health bar
            if (player && this.elements.healthFill) {
                const healthPercent = Math.max(0, player.health / player.maxHealth * 100);
                this.elements.healthFill.style.width = `${healthPercent}%`;

                // Change color based on health
                if (healthPercent < 25) {
                    this.elements.healthFill.style.background = '#ff0000';
                } else if (healthPercent < 50) {
                    this.elements.healthFill.style.background = '#ff7700';
                } else {
                    this.elements.healthFill.style.background = '#ff3333';
                }
            }

            // Update armor bar
            if (player && this.elements.armorFill) {
                const armorPercent = Math.max(0, player.armor / player.maxArmor * 100);
                this.elements.armorFill.style.width = `${armorPercent}%`;
            }

            // Update ammo counter
            if (player && player.weapon && this.elements.ammoCounter) {
                this.elements.ammoCounter.textContent = `${player.weapon.currentAmmo}/${player.weapon.reserveAmmo}`;
            }

            // Update damage overlay
            if (player && this.elements.damageOverlay) {
                this.elements.damageOverlay.style.opacity = player.damageEffect.toString();
            }

            // Update message queue
            this.updateMessages(deltaTime);
        }

        // Update message queue
        updateMessages(deltaTime) {
            if (this.messageQueue.length === 0) return;

            this.messageTimer -= deltaTime;

            if (this.messageTimer <= 0) {
                // Remove current message
                this.messageQueue.shift();

                if (this.messageQueue.length > 0) {
                    // Show next message
                    const message = this.messageQueue[0];
                    this.elements.messageArea.textContent = message;
                    this.elements.messageArea.style.opacity = '1';
                    this.messageTimer = this.messageDisplayTime;
                } else {
                    // No more messages, hide message area
                    this.elements.messageArea.style.opacity = '0';
                }
            }
        }

        // Show a message on screen
        showMessage(message, displayTime = null) {
            this.messageQueue.push(message);

            // If it's the first message, show it immediately
            if (this.messageQueue.length === 1) {
                this.elements.messageArea.textContent = message;
                this.elements.messageArea.style.opacity = '1';
                this.messageTimer = displayTime || this.messageDisplayTime;
            }
        }

        // Show game over screen
        showGameOver(score = 0) {
            if (this.elements.gameOver) {
                this.elements.gameOver.style.display = 'flex';

                if (this.elements.score) {
                    this.elements.score.textContent = `Score: ${score}`;
                }
            }
        }

        // Hide game over screen
        hideGameOver() {
            if (this.elements.gameOver) {
                this.elements.gameOver.style.display = 'none';
            }
        }

        // Show/hide UI
        setVisible(visible) {
            this.isVisible = visible;

            if (this.elements.hud) {
                this.elements.hud.style.display = visible ? 'block' : 'none';
            }
        }

        // Create mobile touch controls
        createMobileControls() {
            // Check if already created
            if (this.elements.touchControls) return;

            // Create touch controls container
            this.elements.touchControls = document.createElement('div');
            this.elements.touchControls.id = 'touch-controls';
            this.elements.touchControls.style.position = 'absolute';
            this.elements.touchControls.style.top = '0';
            this.elements.touchControls.style.left = '0';
            this.elements.touchControls.style.width = '100%';
            this.elements.touchControls.style.height = '100%';
            this.elements.touchControls.style.zIndex = '90';
            this.elements.touchControls.style.display = 'none'; // Hide initially

            // Create touch buttons
            const createTouchButton = (id, text, right, bottom, color) => {
                const button = document.createElement('div');
                button.id = id;
                button.className = 'touch-button';
                button.textContent = text;
                button.style.position = 'absolute';
                button.style.right = right ? `${right}px` : 'auto';
                button.style.bottom = `${bottom}px`;
                button.style.width = '60px';
                button.style.height = '60px';
                button.style.borderRadius = '50%';
                button.style.background = color || 'rgba(255, 255, 255, 0.3)';
                button.style.color = 'white';
                button.style.display = 'flex';
                button.style.justifyContent = 'center';
                button.style.alignItems = 'center';
                button.style.fontSize = '16px';
                button.style.fontWeight = 'bold';
                button.style.pointerEvents = 'none'; // Let touch events pass through to container

                return button;
            };

            // Add shoot button
            const shootButton = createTouchButton('touch-shoot', 'FIRE', 20, 20, 'rgba(255, 0, 0, 0.3)');
            this.elements.touchControls.appendChild(shootButton);

            // Add jump button
            const jumpButton = createTouchButton('touch-jump', 'JUMP', 90, 80, 'rgba(0, 255, 0, 0.3)');
            this.elements.touchControls.appendChild(jumpButton);

            // Add reload button
            const reloadButton = createTouchButton('touch-reload', 'RELOAD', 90, 150, 'rgba(0, 0, 255, 0.3)');
            this.elements.touchControls.appendChild(reloadButton);

            // Add joystick indicator
            this.elements.joystickOuter = document.createElement('div');
            this.elements.joystickOuter.id = 'joystick-outer';
            this.elements.joystickOuter.style.position = 'absolute';
            this.elements.joystickOuter.style.left = '60px';
            this.elements.joystickOuter.style.bottom = '60px';
            this.elements.joystickOuter.style.width = '100px';
            this.elements.joystickOuter.style.height = '100px';
            this.elements.joystickOuter.style.borderRadius = '50%';
            this.elements.joystickOuter.style.border = '2px solid rgba(255, 255, 255, 0.3)';
            this.elements.joystickOuter.style.display = 'none';

            this.elements.joystickInner = document.createElement('div');
            this.elements.joystickInner.id = 'joystick-inner';
            this.elements.joystickInner.style.position = 'absolute';
            this.elements.joystickInner.style.left = '50%';
            this.elements.joystickInner.style.top = '50%';
            this.elements.joystickInner.style.width = '40px';
            this.elements.joystickInner.style.height = '40px';
            this.elements.joystickInner.style.borderRadius = '50%';
            this.elements.joystickInner.style.background = 'rgba(255, 255, 255, 0.5)';
            this.elements.joystickInner.style.transform = 'translate(-50%, -50%)';

            this.elements.joystickOuter.appendChild(this.elements.joystickInner);
            this.elements.touchControls.appendChild(this.elements.joystickOuter);

            // Add to container
            this.container.appendChild(this.elements.touchControls);

            // Only show on touch devices
            if ('ontouchstart' in window) {
                this.elements.touchControls.style.display = 'block';
            }
        }

        // Show touch controls joystick at position
        showJoystick(x, y) {
            if (!this.elements.joystickOuter) return;

            this.elements.joystickOuter.style.display = 'block';
            this.elements.joystickOuter.style.left = `${x - 50}px`;
            this.elements.joystickOuter.style.top = `${y - 50}px`;
            this.elements.joystickInner.style.left = '50%';
            this.elements.joystickInner.style.top = '50%';
        }

        // Update joystick position
        updateJoystick(x, y) {
            if (!this.elements.joystickOuter || !this.elements.joystickInner) return;

            // Calculate joystick center
            const rect = this.elements.joystickOuter.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Calculate joystick delta
            let dx = x - centerX;
            let dy = y - centerY;

            // Limit to joystick radius
            const maxRadius = rect.width / 2 - 20;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > maxRadius) {
                const ratio = maxRadius / distance;
                dx *= ratio;
                dy *= ratio;
            }

            // Update joystick position
            this.elements.joystickInner.style.left = `calc(50% + ${dx}px)`;
            this.elements.joystickInner.style.top = `calc(50% + ${dy}px)`;
        }

        // Hide joystick
        hideJoystick() {
            if (!this.elements.joystickOuter) return;
            this.elements.joystickOuter.style.display = 'none';
        }

        // Clean up
        destroy() {
            // Remove event listeners, etc.
        }
    };

    console.log("UI module loaded");
})(window.FPSGame);
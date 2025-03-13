/**
 * Texture.js - Handles loading and management of game textures
 */
(function (FPSGame) {
    // Create Texture namespace
    FPSGame.Texture = {};

    // Texture manager class
    FPSGame.Texture.TextureManager = class TextureManager {
        constructor() {
            this.textures = {};
            this.sprites = {};
            this.textureBaseUrl = '';
        }

        // Set the base URL for textures
        setBaseUrl(url) {
            this.textureBaseUrl = url.endsWith('/') ? url : url + '/';
        }

        // Load a texture by name and URL
        loadTexture(name, url, options = {}) {
            return new Promise((resolve, reject) => {
                const fullUrl = url.startsWith('http') ? url : this.textureBaseUrl + url;
                const img = new Image();

                img.onload = () => {
                    // Create canvas for processing if needed
                    if (options.processTexture) {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');

                        // Draw image to canvas
                        ctx.drawImage(img, 0, 0);

                        // Apply processing functions
                        if (options.colorize) {
                            this.colorizeTexture(ctx, canvas.width, canvas.height, options.colorize);
                        }

                        if (options.pixelate) {
                            this.pixelateTexture(ctx, canvas.width, canvas.height, options.pixelate);
                        }

                        if (options.brightness) {
                            this.adjustBrightness(ctx, canvas.width, canvas.height, options.brightness);
                        }

                        // Create a new image from canvas
                        const processedImg = new Image();
                        processedImg.onload = () => {
                            this.textures[name] = processedImg;
                            resolve(processedImg);
                        };
                        processedImg.onerror = reject;
                        processedImg.src = canvas.toDataURL('image/png');
                    } else {
                        // Use the loaded image directly
                        this.textures[name] = img;
                        resolve(img);
                    }
                };

                img.onerror = () => {
                    console.error(`Failed to load texture: ${fullUrl}`);
                    reject(`Failed to load texture: ${fullUrl}`);
                };

                img.src = fullUrl;
            });
        }

        // Load multiple textures at once
        loadTextures(texturesConfig) {
            const promises = Object.entries(texturesConfig).map(([name, config]) => {
                // Handle different config formats
                if (typeof config === 'string') {
                    return this.loadTexture(name, config);
                } else {
                    return this.loadTexture(name, config.url, config.options || {});
                }
            });

            return Promise.all(promises);
        }

        // Create a sprite sheet
        createSpriteSheet(name, texture, spriteWidth, spriteHeight, options = {}) {
            const img = typeof texture === 'string' ? this.textures[texture] : texture;

            if (!img) {
                console.error(`Texture not found: ${texture}`);
                return null;
            }

            // Calculate number of sprites in sheet
            const columns = Math.floor(img.width / spriteWidth);
            const rows = Math.floor(img.height / spriteHeight);

            // Get individual sprites
            const sprites = [];

            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < columns; x++) {
                    // Create canvas for this sprite
                    const canvas = document.createElement('canvas');
                    canvas.width = spriteWidth;
                    canvas.height = spriteHeight;
                    const ctx = canvas.getContext('2d');

                    // Extract sprite from sheet
                    ctx.drawImage(
                        img,
                        x * spriteWidth, y * spriteHeight, spriteWidth, spriteHeight,
                        0, 0, spriteWidth, spriteHeight
                    );

                    // Create image from canvas
                    const spriteImg = new Image();
                    spriteImg.src = canvas.toDataURL('image/png');

                    sprites.push(spriteImg);
                }
            }

            // Store sprite sheet
            this.sprites[name] = {
                texture: img,
                spriteWidth,
                spriteHeight,
                columns,
                rows,
                sprites,
                options
            };

            return this.sprites[name];
        }

        // Get a sprite from a sprite sheet
        getSprite(sheetName, index) {
            const sheet = this.sprites[sheetName];
            if (!sheet) {
                console.error(`Sprite sheet not found: ${sheetName}`);
                return null;
            }

            if (index >= sheet.sprites.length) {
                console.error(`Sprite index out of bounds: ${index}`);
                return null;
            }

            return sheet.sprites[index];
        }

        // Get a sprite by row and column
        getSpriteAt(sheetName, column, row) {
            const sheet = this.sprites[sheetName];
            if (!sheet) {
                console.error(`Sprite sheet not found: ${sheetName}`);
                return null;
            }

            const index = row * sheet.columns + column;
            return this.getSprite(sheetName, index);
        }

        // Get a texture by name
        getTexture(name) {
            return this.textures[name] || null;
        }

        // Create a blank texture
        createBlankTexture(name, width, height, color = '#000000') {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Fill with color
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, width, height);

            // Create image from canvas
            const img = new Image();
            img.src = canvas.toDataURL('image/png');

            // Store texture
            this.textures[name] = img;

            return img;
        }

        // Create a procedural wall texture
        createWallTexture(name, width, height, options = {}) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Base color
            const baseColor = options.baseColor || '#555555';
            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, width, height);

            // Add noise
            if (options.noise !== false) {
                const noiseAmount = options.noiseAmount || 0.2;
                const noiseSize = options.noiseSize || 1;

                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;

                for (let y = 0; y < height; y += noiseSize) {
                    for (let x = 0; x < width; x += noiseSize) {
                        // Generate noise value
                        const noise = (Math.random() * 2 - 1) * noiseAmount;

                        for (let ny = 0; ny < noiseSize && y + ny < height; ny++) {
                            for (let nx = 0; nx < noiseSize && x + nx < width; nx++) {
                                const idx = ((y + ny) * width + (x + nx)) * 4;

                                // Apply noise to RGB channels
                                data[idx] = Math.max(0, Math.min(255, data[idx] + noise * 255));
                                data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + noise * 255));
                                data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + noise * 255));
                            }
                        }
                    }
                }

                ctx.putImageData(imageData, 0, 0);
            }

            // Add brick pattern
            if (options.bricks) {
                const brickWidth = options.brickWidth || width / 4;
                const brickHeight = options.brickHeight || height / 8;
                const mortar = options.mortar || 2;
                const mortarColor = options.mortarColor || '#333333';

                ctx.strokeStyle = mortarColor;
                ctx.lineWidth = mortar;

                // Draw horizontal lines (mortar between brick rows)
                for (let y = brickHeight; y < height; y += brickHeight) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(width, y);
                    ctx.stroke();
                }

                // Draw vertical lines with offset for brick pattern
                for (let row = 0; row < Math.ceil(height / brickHeight); row++) {
                    const offset = row % 2 === 0 ? 0 : brickWidth / 2;

                    for (let x = offset; x < width; x += brickWidth) {
                        ctx.beginPath();
                        ctx.moveTo(x, row * brickHeight);
                        ctx.lineTo(x, (row + 1) * brickHeight);
                        ctx.stroke();
                    }
                }
            }

            // Create image from canvas
            const img = new Image();
            img.src = canvas.toDataURL('image/png');

            // Store texture
            this.textures[name] = img;

            return img;
        }

        // Utility function to colorize a texture
        colorizeTexture(ctx, width, height, color) {
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            // Parse color
            let r, g, b;
            if (typeof color === 'string') {
                // Convert hex or named color to RGB
                const div = document.createElement('div');
                div.style.color = color;
                document.body.appendChild(div);
                const colorStyle = window.getComputedStyle(div).color;
                document.body.removeChild(div);

                const match = colorStyle.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (match) {
                    r = parseInt(match[1]);
                    g = parseInt(match[2]);
                    b = parseInt(match[3]);
                } else {
                    r = g = b = 128; // Default to gray if invalid color
                }
            } else if (Array.isArray(color)) {
                // Use RGB array
                [r, g, b] = color;
            } else {
                r = color.r || 0;
                g = color.g || 0;
                b = color.b || 0;
            }

            // Apply colorization
            for (let i = 0; i < data.length; i += 4) {
                // Preserve alpha
                const alpha = data[i + 3];

                // Get original brightness (grayscale)
                const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3 / 255;

                // Apply color, preserving brightness
                data[i] = r * brightness;
                data[i + 1] = g * brightness;
                data[i + 2] = b * brightness;
                data[i + 3] = alpha;
            }

            ctx.putImageData(imageData, 0, 0);
        }

        // Utility function to pixelate a texture
        pixelateTexture(ctx, width, height, pixelSize) {
            // Get image data
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            // Create temporary data for pixelated image
            const tempData = new Uint8ClampedArray(data);

            // Pixelate by averaging pixels in blocks
            for (let y = 0; y < height; y += pixelSize) {
                for (let x = 0; x < width; x += pixelSize) {
                    // Calculate average color in this pixel block
                    let r = 0, g = 0, b = 0, a = 0, count = 0;

                    for (let py = 0; py < pixelSize && y + py < height; py++) {
                        for (let px = 0; px < pixelSize && x + px < width; px++) {
                            const idx = ((y + py) * width + (x + px)) * 4;
                            r += data[idx];
                            g += data[idx + 1];
                            b += data[idx + 2];
                            a += data[idx + 3];
                            count++;
                        }
                    }

                    // Calculate average
                    r = Math.floor(r / count);
                    g = Math.floor(g / count);
                    b = Math.floor(b / count);
                    a = Math.floor(a / count);

                    // Apply average color to all pixels in this block
                    for (let py = 0; py < pixelSize && y + py < height; py++) {
                        for (let px = 0; px < pixelSize && x + px < width; px++) {
                            const idx = ((y + py) * width + (x + px)) * 4;
                            tempData[idx] = r;
                            tempData[idx + 1] = g;
                            tempData[idx + 2] = b;
                            tempData[idx + 3] = a;
                        }
                    }
                }
            }

            // Create new image data with pixelated result
            const pixelatedImageData = new ImageData(tempData, width, height);
            ctx.putImageData(pixelatedImageData, 0, 0);
        }

        // Utility function to adjust brightness
        adjustBrightness(ctx, width, height, factor) {
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.max(0, Math.min(255, data[i] * factor));
                data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * factor));
                data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * factor));
            }

            ctx.putImageData(imageData, 0, 0);
        }
    };

    console.log("Texture module loaded");
})(window.FPSGame);
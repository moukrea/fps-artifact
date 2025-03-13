/**
 * Audio.js - Audio system for the FPS game
 */
(function (FPSGame) {
    // Create Audio namespace
    FPSGame.Audio = {};

    // Audio manager class
    FPSGame.Audio.AudioManager = class AudioManager {
        constructor() {
            // Check if audio is supported
            this.audioContext = null;
            this.sounds = {};
            this.music = null;
            this.isMuted = false;
            this.masterVolume = 1.0;
            this.soundVolume = 1.0;
            this.musicVolume = 0.5;
            this.audioEnabled = false;

            // Try to initialize audio context
            try {
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();
                this.audioEnabled = true;
                console.log("Audio system initialized");
            } catch (e) {
                console.warn("Web Audio API not supported");
                this.audioEnabled = false;
            }

            // Master gain node
            if (this.audioEnabled) {
                this.masterGain = this.audioContext.createGain();
                this.masterGain.gain.value = this.masterVolume;
                this.masterGain.connect(this.audioContext.destination);

                // Sound effects gain node
                this.soundGain = this.audioContext.createGain();
                this.soundGain.gain.value = this.soundVolume;
                this.soundGain.connect(this.masterGain);

                // Music gain node
                this.musicGain = this.audioContext.createGain();
                this.musicGain.gain.value = this.musicVolume;
                this.musicGain.connect(this.masterGain);
            }
        }

        // Load a sound file
        loadSound(name, url) {
            if (!this.audioEnabled) return Promise.resolve(null);

            return fetch(url)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    this.sounds[name] = audioBuffer;
                    return audioBuffer;
                })
                .catch(error => {
                    console.error("Error loading sound", name, error);
                    return null;
                });
        }

        // Load multiple sounds at once
        loadSounds(sounds) {
            if (!this.audioEnabled) return Promise.resolve({});

            const promises = Object.entries(sounds).map(([name, url]) => {
                return this.loadSound(name, url).then(buffer => ({ [name]: buffer }));
            });

            return Promise.all(promises).then(results => {
                return Object.assign({}, ...results);
            });
        }

        // Play a sound
        playSound(name, options = {}) {
            if (!this.audioEnabled || this.isMuted || !this.sounds[name]) return null;

            // Create source node
            const source = this.audioContext.createBufferSource();
            source.buffer = this.sounds[name];

            // Create gain node for this sound instance
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = typeof options.volume === 'number' ? options.volume : 1.0;

            // Handle spatial positioning if provided
            if (options.position && options.listener) {
                // Create panner node
                const panner = this.audioContext.createPanner();
                panner.panningModel = 'HRTF';
                panner.distanceModel = 'inverse';
                panner.refDistance = 1;
                panner.maxDistance = 100;
                panner.rolloffFactor = 1;

                // Position the sound
                panner.positionX.value = options.position.x;
                panner.positionY.value = 0;
                panner.positionZ.value = options.position.y;

                // Position the listener
                const listener = this.audioContext.listener;
                listener.positionX.value = options.listener.position.x;
                listener.positionY.value = 0;
                listener.positionZ.value = options.listener.position.y;

                // Set listener orientation (facing direction)
                const dir = options.listener.direction;
                listener.forwardX.value = dir.x;
                listener.forwardY.value = 0;
                listener.forwardZ.value = dir.y;
                listener.upX.value = 0;
                listener.upY.value = 1;
                listener.upZ.value = 0;

                // Connect nodes
                source.connect(gainNode);
                gainNode.connect(panner);
                panner.connect(this.soundGain);
            } else {
                // Connect directly for non-spatial sounds
                source.connect(gainNode);
                gainNode.connect(this.soundGain);
            }

            // Start playback
            source.start(0);

            // Handle looping
            if (options.loop) {
                source.loop = true;
            }

            // Return control object
            return {
                source,
                gainNode,
                stop() {
                    try {
                        source.stop();
                    } catch (e) {
                        // Ignore errors when stopping
                    }
                },
                setVolume(volume) {
                    gainNode.gain.value = volume;
                }
            };
        }

        // Play background music
        playMusic(name, fadeInTime = 2) {
            if (!this.audioEnabled || !this.sounds[name]) return;

            // Stop current music if playing
            if (this.music) {
                this.stopMusic(0.5);
            }

            // Create new music source
            const source = this.audioContext.createBufferSource();
            source.buffer = this.sounds[name];
            source.loop = true;

            // Create gain node for fading
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = 0;

            // Connect
            source.connect(gainNode);
            gainNode.connect(this.musicGain);

            // Start playback
            source.start(0);

            // Fade in
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + fadeInTime);

            // Store reference
            this.music = {
                source,
                gainNode,
                name
            };
        }

        // Stop music with fade out
        stopMusic(fadeOutTime = 1) {
            if (!this.music) return;

            const { gainNode, source } = this.music;

            // Fade out
            gainNode.gain.setValueAtTime(gainNode.gain.value, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeOutTime);

            // Stop after fade
            setTimeout(() => {
                try {
                    source.stop();
                } catch (e) {
                    // Ignore errors when stopping
                }
            }, fadeOutTime * 1000);

            this.music = null;
        }

        // Set master volume
        setMasterVolume(volume) {
            this.masterVolume = FPSGame.Utils.clamp(volume, 0, 1);

            if (this.audioEnabled) {
                this.masterGain.gain.value = this.masterVolume;
            }
        }

        // Set sound effects volume
        setSoundVolume(volume) {
            this.soundVolume = FPSGame.Utils.clamp(volume, 0, 1);

            if (this.audioEnabled) {
                this.soundGain.gain.value = this.soundVolume;
            }
        }

        // Set music volume
        setMusicVolume(volume) {
            this.musicVolume = FPSGame.Utils.clamp(volume, 0, 1);

            if (this.audioEnabled) {
                this.musicGain.gain.value = this.musicVolume;
            }
        }

        // Set mute state
        setMuted(muted) {
            this.isMuted = muted;

            if (this.audioEnabled) {
                this.masterGain.gain.value = muted ? 0 : this.masterVolume;
            }
        }

        // Resume audio context (needed for browsers that suspend audio context until user interaction)
        resume() {
            if (this.audioEnabled && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        }
    };

    console.log("Audio module loaded");
})(window.FPSGame);
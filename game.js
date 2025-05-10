document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const scoreElement = document.getElementById('score');
    const livesContainer = document.getElementById('lives-container');
    const ultimateChargesContainer = document.getElementById('ultimate-charges-container');

    const gameContainer = document.querySelector('.game-container');
    const gameInfoElement = gameContainer.querySelector('.game-info');
    const contentArea = document.querySelector('.content-area');

    const aboutButton = document.getElementById('menu-about');
    const playButton = document.getElementById('menu-play');
    const scoresButton = document.getElementById('menu-scores');

    canvas.width = 650;
    canvas.height = 650;

    let gameState = 'menu';

    const backgroundImage = new Image();
    backgroundImage.src = 'images/Background2.jpg';

    const playerIdleSpriteSheet = new Image();
    playerIdleSpriteSheet.src = 'images/Warrior000.png';

    const playerRunningSpriteSheet = new Image();
    playerRunningSpriteSheet.src = 'images/Warrior_running.png';

    const enemySpriteSheet = new Image();
    enemySpriteSheet.src = 'images/Goblin_running_right.png';

    const projectileSpriteSheet = new Image();
    projectileSpriteSheet.src = 'images/Fireball_Animation.png';

    const powerUpImage = new Image();
    powerUpImage.src = 'images/Potion003.png';

    const explosionSpriteSheet = new Image();
    explosionSpriteSheet.src = 'images/Fireball_ExplosionSprite.png';

    const playerExplosionSpriteSheet = new Image();
    playerExplosionSpriteSheet.src = 'images/Explosions.png';

    const multiShotPowerUpImage = new Image();
    multiShotPowerUpImage.src = 'images/Potion002.png';

    const massDestructionPowerUpImage = new Image();
    massDestructionPowerUpImage.src = 'images/Potion001.png';

    const lightningSpriteSheet = new Image();
    lightningSpriteSheet.src = 'images/LightningSprite.png';

    const fastGoblinSpriteSheet = new Image();
    fastGoblinSpriteSheet.src = 'images/TorchGoblin007.png';

    const fastGoblinAttackSpriteSheet = new Image();
    fastGoblinAttackSpriteSheet.src = 'images/TorchGoblin014.png';

    const fireTrailSpriteSheet = new Image();
    fireTrailSpriteSheet.src = 'images/Fire.png';

    const sorcererSpriteSheet = new Image();
    sorcererSpriteSheet.src = 'images/Slime.png';

    const smallHeartImage = new Image();
    smallHeartImage.src = 'images/small_heart.png';

    const PREVIEW_DISPLAY_SIZE = 96;

    function drawSingleFramePreview(canvasId, spriteSheet, frameWidth, frameHeight, displaySize) {
        const previewCanvas = document.getElementById(canvasId);
        if (!previewCanvas) {
            return;
        }
        const previewCtx = previewCanvas.getContext('2d');
        previewCanvas.width = displaySize;
        previewCanvas.height = displaySize;

        const draw = () => {
            previewCtx.clearRect(0, 0, displaySize, displaySize);
            if (spriteSheet.complete && spriteSheet.naturalHeight !== 0) {
                previewCtx.imageSmoothingEnabled = false;
                previewCtx.drawImage(
                    spriteSheet,
                    0, 0,
                    frameWidth, frameHeight,
                    0, 0,
                    displaySize, displaySize
                );
            } else {
                previewCtx.fillStyle = '#f0f0f0';
                previewCtx.fillRect(0, 0, displaySize, displaySize);
                previewCtx.fillStyle = 'black';
                previewCtx.textAlign = 'center';
                previewCtx.fillText('N/A', displaySize / 2, displaySize / 2 + 5);
            }
        };

        if (spriteSheet.complete && spriteSheet.naturalHeight !== 0) {
            draw();
        } else {
            spriteSheet.onload = draw;
            spriteSheet.onerror = draw;
            draw();
        }
    }

    const projectiles = [];

    let enemies = [];
    let enemySpawnTimer = 0;
    const enemySpawnInterval = 120;

    const pointsPerEnemy = 100;
    const POINTS_PER_FAST_GOBLIN = 200;

    let powerUps = [];
    const powerUpDropChance = 0.1;

    const FAST_GOBLIN_SPAWN_CHANCE = 0.3;
    const FAST_GOBLIN_MIN_DIFFICULTY = 1;
    const FAST_GOBLIN_SIZE = 100;
    const FAST_GOBLIN_SPEED = 3.0;
    const FAST_GOBLIN_ORBIT_RADIUS = 360;
    const FAST_GOBLIN_ANGULAR_SPEED = 0.04;
    const FAST_GOBLIN_FIRE_SPAWN_INTERVAL = 120;
    const FAST_GOBLIN_SAFE_DISTANCE_FROM_PLAYER = 200;
    const FAST_GOBLIN_SPRITE_FRAME_WIDTH = 192;
    const FAST_GOBLIN_SPRITE_FRAME_HEIGHT = 192;
    const FAST_GOBLIN_FRAME_COUNT = 6;
    const FAST_GOBLIN_ANIM_INTERVAL = 8;
    const FAST_GOBLIN_ATTACK_FRAME_COUNT = 6;
    const FAST_GOBLIN_ATTACK_ANIM_INTERVAL = 7;
    const FAST_GOBLIN_ATTACK_COOLDOWN = 145;
    const FAST_GOBLIN_FIRE_SPAWN_DELAY_AFTER_ATTACK = 0;

    const SORCERER_SPAWN_CHANCE = 0.07; 
    const SORCERER_MIN_DIFFICULTY = 2; 
    const SORCERER_SIZE = 96;
    const SORCERER_INITIAL_HEALTH = 1; 
    const SORCERER_ABILITY_COOLDOWN = 420;
    const SORCERER_HEALTH_BUFF_AMOUNT = 1;
    const SORCERER_SAFE_DISTANCE_FROM_PLAYER = 250; 
    const SORCERER_PREFERRED_DISTANCE_BEHIND_ALLIES = 80; 
    const SORCERER_ALLY_SEARCH_RADIUS = 400; 
    const SORCERER_CAST_SETUP_TIME = 60; 
    const SORCERER_CAST_DURATION = 60;   
    const SORCERER_BUFF_RADIUS = 200; 
    const SORCERER_SPRITE_FRAME_WIDTH = 32;
    const SORCERER_SPRITE_FRAME_HEIGHT = 32;
    const SORCERER_FRAME_COUNT = 6;
    const SORCERER_ANIM_INTERVAL = 10; 
    const BUFF_HEART_SIZE = 16; 
    const SORCERER_CAST_EFFECT_DRAW_DURATION = 120; 

    const SORCERER_BUFF_TIER1_TIME = 3600;    
    const SORCERER_BUFF_STRENGTH_TIER1 = 2;

    const SORCERER_BUFF_TIER2_TIME = 7200;    
    const SORCERER_BUFF_STRENGTH_TIER2 = 3;

    const SORCERER_BUFF_TIER3_TIME = 14400;   
    const SORCERER_BUFF_STRENGTH_TIER3 = 4;

    const FIRE_TRAIL_SIZE = 100; 
    const FIRE_TRAIL_DURATION = 360; 
    const FIRE_TRAIL_SPRITE_FRAME_WIDTH = 128; 
    const FIRE_TRAIL_SPRITE_FRAME_HEIGHT = 128; 
    const FIRE_TRAIL_FRAME_COUNT = 7; 
    const FIRE_TRAIL_ANIM_INTERVAL = 6; 
    
    const ENEMY_INVULNERABILITY_DURATION = 60; 

    const explosions = [];

    const skullExplosions = [];

    const lightningExplosions = []; 
    const fireTrails = []; 

    let player = {
        x: canvas.width / 2 - 96,
        y: canvas.height / 2 - 96,
        width: 100,
        height: 100,
        idleSpriteSheet: playerIdleSpriteSheet,
        runningSpriteSheet: playerRunningSpriteSheet,
        currentSpriteSheet: playerIdleSpriteSheet, 
        frameWidth: 192,
        frameHeight: 192,
        frameCount: 6, 
        frameIndex: 0,
        frameTimer: 0,
        frameInterval: 8, 
        direction: 1, 
        isMoving: false, 
        baseSpeed: 2,
        speed: 2.5,
        lives: 3,
        score: 0,
        monstersKilled: 0, 
        potionsCollected: 0, 
        survivalTime: 0,    
        shootCooldown: 0,
        shootDelay: 30, 
        baseShootDelay: 30, 
        activeEffects: {}, 
        hasMultiShot: false, 
        ultimateCharges: 3, 
        maxUltimateCharges: 3, 
        previousUltimateCharges: 3, 
        ULTIMATE_MAX_TARGETS: 7, 

        draw: function() {
            if (gameState !== 'gameOver' && gameState !== 'menu') {
                if (this.currentSpriteSheet.complete && this.currentSpriteSheet.naturalHeight !== 0) {
                    ctx.save();
                    
                    if (this.direction === -1) {
                        ctx.translate(this.x + this.width, this.y);
                        ctx.scale(-1, 1);
                        ctx.drawImage(
                            this.currentSpriteSheet,
                            this.frameIndex * this.frameWidth, 0,
                            this.frameWidth, this.frameHeight,
                            0, 0,
                            this.width, this.height
                        );
                    } else {
                        ctx.drawImage(
                            this.currentSpriteSheet,
                            this.frameIndex * this.frameWidth, 0,
                            this.frameWidth, this.frameHeight,
                            this.x, this.y,
                            this.width, this.height
                        );
                    }
                    
                    ctx.restore();
                } else {
                    ctx.fillStyle = 'blue';
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                }
            }
            
            if (gameState === 'playing' || gameState === 'paused' || gameState === 'gameOver') {
                scoreElement.textContent = this.score;
                
                if (previousLives !== this.lives) {
                    updateLives(this.lives);
                }
                if (this.previousUltimateCharges !== this.ultimateCharges) {
                    updateUltimateChargesDisplay(this.ultimateCharges);
                    this.previousUltimateCharges = this.ultimateCharges;
                }
            }
        },

        update: function() {
            if (gameState !== 'playing') return;

            this.survivalTime++;

            this.frameTimer++;
            if (this.frameTimer >= this.frameInterval) {
                this.frameIndex = (this.frameIndex + 1) % this.frameCount;
                this.frameTimer = 0;
            }

            for (const effectName in this.activeEffects) {
                if (this.activeEffects.hasOwnProperty(effectName)) {
                    this.activeEffects[effectName].timer--;
                    if (this.activeEffects[effectName].timer <= 0) {
                        this.deactivateEffect(effectName);
                        delete this.activeEffects[effectName];
                    }
                }
            }

            if (this.shootCooldown > 0) {
                this.shootCooldown--;
            }

            let moveX = 0;
            let moveY = 0;

            if (keysPressed['w'] || keysPressed['ц']) moveY -= 1;
            if (keysPressed['s'] || keysPressed['ы']) moveY += 1;
            if (keysPressed['a'] || keysPressed['ф']) moveX -= 1;
            if (keysPressed['d'] || keysPressed['в']) moveX += 1;

            this.isMoving = (moveX !== 0 || moveY !== 0);
            
            if (moveX !== 0) {
                this.direction = moveX > 0 ? 1 : -1;
            }
            
            this.currentSpriteSheet = this.isMoving ? this.runningSpriteSheet : this.idleSpriteSheet;

            if (this.isMoving) {
                let currentSpeed = this.speed;
                if (moveX !== 0 && moveY !== 0) {
                    currentSpeed /= Math.sqrt(2);
                }
                this.x += moveX * currentSpeed;
                this.y += moveY * currentSpeed;
            }

            if (this.shootCooldown === 0) {
                let shootX = 0;
                let shootY = 0;
                
                if (keysPressed['ArrowUp'] && !keysPressed['ArrowDown']) shootY = -1;
                else if (keysPressed['ArrowDown'] && !keysPressed['ArrowUp']) shootY = 1;
                if (keysPressed['ArrowLeft'] && !keysPressed['ArrowRight']) shootX = -1;
                else if (keysPressed['ArrowRight'] && !keysPressed['ArrowLeft']) shootX = 1;
                
                const isShootKeyPressed = (shootX !== 0 || shootY !== 0);
                
                if (isShootKeyPressed) {
                    if (this.hasMultiShot) {
                        this.createProjectile(1, 0);   
                        this.createProjectile(-1, 0);  
                        this.createProjectile(0, 1);   
                        this.createProjectile(0, -1);  
                        this.createProjectile(1, 1);   
                        this.createProjectile(-1, 1);  
                        this.createProjectile(1, -1);  
                        this.createProjectile(-1, -1); 
                    } else {
                        this.createProjectile(shootX, shootY);
                    }
                    
                    this.shootCooldown = this.shootDelay;
                    
                    if (!this.hasMultiShot && shootX !== 0) {
                        this.direction = shootX > 0 ? 1 : -1;
                    }
                }
            }

            if (this.x < 0) {
                this.x = 0;
            }
            if (this.x + this.width > canvas.width) {
                this.x = canvas.width - this.width;
            }
            if (this.y < 0) {
                this.y = 0;
            }
            if (this.y + this.height > canvas.height) {
                this.y = canvas.height - this.height;
            }
        },

        createProjectile: function(dirXComp, dirYComp) {
            const projectileBaseSpeed = 7;
            const projectileWidth = 20;
            const projectileHeight = 20;
            const projectileFrameWidth = 20;
            const projectileFrameHeight = 20;
            const projectileFrameCount = 5;

            let pDx = dirXComp * projectileBaseSpeed;
            let pDy = dirYComp * projectileBaseSpeed;

            if (dirXComp !== 0 && dirYComp !== 0) {
                const normalizationFactor = Math.sqrt(2);
                pDx /= normalizationFactor;
                pDy /= normalizationFactor;
            }

            const angle = Math.atan2(pDy, pDx);

            projectiles.push({
                x: this.x + this.width / 2 - projectileWidth / 2,
                y: this.y + this.height / 2 - projectileHeight / 2,
                width: projectileWidth,
                height: projectileHeight,
                spriteSheet: projectileSpriteSheet,
                frameWidth: projectileFrameWidth,
                frameHeight: projectileFrameHeight,
                frameCount: projectileFrameCount,
                frameIndex: 0, 
                frameTimer: 0,
                frameInterval: 5, 
                dx: pDx,
                dy: pDy,
                angle: angle, 
                draw: function() {
                    if (this.spriteSheet.complete && this.spriteSheet.naturalHeight !== 0) {
                        ctx.save();
                        
                        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
                        
                        ctx.rotate(this.angle);
                        
                        ctx.drawImage(
                            this.spriteSheet,
                            this.frameIndex * this.frameWidth, 0,
                            this.frameWidth, this.frameHeight,
                            -this.width / 2, -this.height / 2,
                            this.width, this.height
                        );
                        
                        ctx.restore();
                    } else {
                        ctx.fillStyle = 'red';
                        ctx.fillRect(this.x, this.y, this.width, this.height);
                    }
                },
                update: function() {
                    this.x += this.dx;
                    this.y += this.dy;
                    
                    this.frameTimer++;
                    if (this.frameTimer >= this.frameInterval) {
                        this.frameIndex = (this.frameIndex + 1) % this.frameCount;
                        this.frameTimer = 0;
                    }
                }
            });
        },

        reset: function() {
            this.x = canvas.width / 2 - 96;
            this.y = canvas.height / 2 - 96;
            this.lives = 3;
            this.score = 0;
            this.speed = this.baseSpeed;
            this.monstersKilled = 0;
            this.potionsCollected = 0;
            this.survivalTime = 0;
            
            this.shootDelay = this.baseShootDelay; 
            this.shootCooldown = 0;
            this.activeEffects = {}; 
            this.hasMultiShot = false; 
            this.ultimateCharges = 3; 
            this.previousUltimateCharges = this.ultimateCharges; 
            updateUltimateChargesDisplay(this.ultimateCharges); 

            for (const effectName in this.activeEffects) {
                if (this.activeEffects.hasOwnProperty(effectName)) {
                    this.deactivateEffect(effectName);
                }
            }
            this.activeEffects = {};
            this.speed = this.baseSpeed;
            this.hasMultiShot = false;
        },

        activatePowerUp: function(type, image) { 
            this.potionsCollected++;
            
            if (type === 'speedBoost') {
                this.activeEffects.speedBoost = { timer: 300, image: image }; 
                this.speed = this.baseSpeed * 1.5; 
                console.log("Speed Boost ON!");
                return true; 
            } 
            else if (type === 'multiShot') {
                this.activeEffects.multiShot = { timer: 480, image: image }; 
                this.hasMultiShot = true;
                this.shootDelay = 60; 
                console.log("Multi-Shot ON!");
                return true; 
            }
            else if (type === 'massDestruction') { 
                if (this.ultimateCharges < this.maxUltimateCharges) {
                    this.addUltimateCharge();
                    console.log("Ultimate charge collected!");
                    return true; 
                } else {
                    console.log("Ultimate charges already max. Potion not consumed.");
                    this.potionsCollected--; 
                    return false; 
                }
            }
            return false; 
        },
        
        deactivateEffect: function(effectName) { 
            if (effectName === 'speedBoost') {
                this.speed = this.baseSpeed;
                console.log("Speed Boost OFF (timer expired)!");
            } else if (effectName === 'multiShot') {
                this.hasMultiShot = false;
                this.shootDelay = this.baseShootDelay; 
                console.log("Multi-Shot OFF (timer expired)!");
            }
        },

        useDestructionPotion: function() {
            let enemiesKilledThisUlt = 0;
            const targetsForUltimate = [];
            
            const sorcerers = [];
            const otherEnemies = [];

            for (const enemy of enemies) {
                if (enemy.type === 'sorcerer') {
                    sorcerers.push(enemy);
                } else {
                    otherEnemies.push(enemy);
                }
            }

            for (const enemy of otherEnemies) {
                if (targetsForUltimate.length >= this.ULTIMATE_MAX_TARGETS) break;
                targetsForUltimate.push(enemy);
            }

            if (targetsForUltimate.length < this.ULTIMATE_MAX_TARGETS) {
                for (const enemy of sorcerers) {
                    if (targetsForUltimate.length >= this.ULTIMATE_MAX_TARGETS) break;
                    targetsForUltimate.push(enemy);
                }
            }

            for (const enemyToDestroy of targetsForUltimate) {
                const explosionX = enemyToDestroy.x + enemyToDestroy.width / 2;
                const explosionY = enemyToDestroy.y + enemyToDestroy.height / 2;
                createLightningExplosion(explosionX, explosionY);

                if (enemyToDestroy.type === 'fastGoblin') {
                    this.score += POINTS_PER_FAST_GOBLIN;
                } else { 
                    this.score += pointsPerEnemy;
                }

                const indexInEnemiesArray = enemies.indexOf(enemyToDestroy);
                if (indexInEnemiesArray > -1) {
                    enemies.splice(indexInEnemiesArray, 1);
                }
                enemiesKilledThisUlt++;
            }
            
            this.monstersKilled += enemiesKilledThisUlt;
            console.log(`Ultimate hit ${enemiesKilledThisUlt} enemies.`);
        },
        addUltimateCharge: function() {
            if (this.ultimateCharges < this.maxUltimateCharges) {
                this.ultimateCharges++;
            }
            console.log(`Ultimate charges: ${this.ultimateCharges}/${this.maxUltimateCharges}`);
        },
        tryActivateUltimate: function() {
            if (this.ultimateCharges > 0 && gameState === 'playing') {
                this.useDestructionPotion();
                this.ultimateCharges--;
                console.log(`Ultimate activated! Charges left: ${this.ultimateCharges}`);
            } else {
                console.log("Cannot activate ultimate: no charges or not in playing state.");
            }
        }
    };

    const keysPressed = {
        'w': false,
        'a': false,
        's': false,
        'd': false,
        'ц': false, 
        'ф': false,
        'ы': false,
        'в': false,
        'ArrowUp': false,
        'ArrowDown': false,
        'ArrowLeft': false,
        'ArrowRight': false,
        'Enter': false, 
        'Escape': false, 
        'r': false, 
        'к': false 
    };

    document.addEventListener('keydown', (event) => {
        const key = event.key;
        const lowerKey = key.toLowerCase();

        if (keysPressed.hasOwnProperty(lowerKey)) {
            keysPressed[lowerKey] = true;
        } else if (keysPressed.hasOwnProperty(key)) { 
            keysPressed[key] = true;
        }
        
        if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
            event.preventDefault();
        }
        if (gameState === 'gameOver' && key === 'Enter') {
            resetGame();
        }
        if (key === 'Escape' && (gameState === 'playing' || gameState === 'paused')) {
            togglePause();
        }
        if ((lowerKey === 'r' || lowerKey === 'к') && gameState === 'playing') {
            player.tryActivateUltimate();
        }
    });

    document.addEventListener('keyup', (event) => {
        const key = event.key;
        const lowerKey = key.toLowerCase();

        if (keysPressed.hasOwnProperty(lowerKey)) {
            keysPressed[lowerKey] = false;
        } else if (keysPressed.hasOwnProperty(key)) {
            keysPressed[key] = false;
        }
    });

    let gameTimer = 0; 
    const difficultyInterval = 60 * 4; 
    let difficultyLevel = 0; 
    let currentEnemySpeed = 1; 
    let currentEnemySpawnInterval = 120; 
    const enemySpawnReduction = 10; 
    const minEnemySpawnInterval = 20; 

    function spawnEnemy() {
        if (gameState !== 'playing') return;

        const enemySize = 100; 
        let spawnX, spawnY;
        let enemyType = 'normal'; 

        const side = Math.floor(Math.random() * 4);

        const sorcererExists = enemies.some(enemy => enemy.type === 'sorcerer');

        if (!sorcererExists && difficultyLevel >= SORCERER_MIN_DIFFICULTY && Math.random() < SORCERER_SPAWN_CHANCE) {
            enemyType = 'sorcerer';
        } 
        else if (difficultyLevel >= FAST_GOBLIN_MIN_DIFFICULTY && Math.random() < FAST_GOBLIN_SPAWN_CHANCE) {
            enemyType = 'fastGoblin';
        }

        let currentEnemySize;
        if (enemyType === 'fastGoblin') {
            currentEnemySize = FAST_GOBLIN_SIZE;
        } else if (enemyType === 'sorcerer') {
            currentEnemySize = SORCERER_SIZE;
        } else {
            currentEnemySize = enemySize;
        }


        switch (side) {
            case 0: spawnX = Math.random() * (canvas.width - currentEnemySize); spawnY = -currentEnemySize; break;
            case 1: spawnX = canvas.width; spawnY = Math.random() * (canvas.height - currentEnemySize); break;
            case 2: spawnX = Math.random() * (canvas.width - currentEnemySize); spawnY = canvas.height; break; // ИСПРАВЛЕНО: spawnY теперь canvas.height
            case 3: spawnX = -currentEnemySize; spawnY = Math.random() * (canvas.height - currentEnemySize); break;
        }


        const enemyFrameWidth = 192; 
        const enemyFrameHeight = 192; 
        const enemyFrameCount = 6;

        let enemyData = {
            x: spawnX,
            y: spawnY,
            maxHealth: 1, 
            hasHealthBuff: false, 
            invulnerableTimer: ENEMY_INVULNERABILITY_DURATION, 
            buffAmountReceived: 0, 

            draw: function() {
                if (this.type === 'fastGoblin') {
                    let currentSpriteSheet = this.spriteSheet; 
                    let currentFrameWidth = this.frameWidth;
                    let currentFrameHeight = this.frameHeight;
                    let currentFrameIndex = this.frameIndex;

                    if (this.state === 'attacking') {
                        currentSpriteSheet = this.attackSpriteSheet;
                        currentFrameIndex = this.attackFrameIndex;
                    }

                    if (currentSpriteSheet && currentSpriteSheet.complete && currentSpriteSheet.naturalHeight !== 0) {
                        ctx.save();
                        if (this.directionX === -1) { 
                            ctx.translate(this.x + this.width, this.y);
                            ctx.scale(-1, 1);
                            ctx.drawImage(
                                currentSpriteSheet,
                                currentFrameIndex * currentFrameWidth, 0,
                                currentFrameWidth, currentFrameHeight,
                                0, 0,
                                this.width, this.height
                            );
                        } else { 
                            ctx.drawImage(
                                currentSpriteSheet,
                                currentFrameIndex * currentFrameWidth, 0,
                                currentFrameWidth, currentFrameHeight,
                                this.x, this.y,
                                this.width, this.height
                            );
                        }
                        ctx.restore();
                    } else {
                        ctx.fillStyle = 'lime';
                        ctx.fillRect(this.x, this.y, this.width, this.height);
                    }
                } else if (this.type === 'sorcerer') {
                    if (this.spriteSheet && this.spriteSheet.complete && this.spriteSheet.naturalHeight !== 0) {
                        ctx.drawImage(
                            this.spriteSheet,
                            this.frameIndex * this.frameWidth, 0, 
                            this.frameWidth, this.frameHeight,
                            this.x, this.y,
                            this.width, this.height
                        );
                    } else {
                        ctx.fillStyle = 'purple'; 
                        ctx.fillRect(this.x, this.y, this.width, this.height);
                    }

                    if ((this.state === 'casting_effect' || this.state === 'casting_setup') && this.castEffectDrawTimer > 0 && this.abilityCooldownTimer <= SORCERER_CAST_SETUP_TIME) {
                        ctx.beginPath();
                        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, SORCERER_BUFF_RADIUS, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)'; // Полупрозрачный золотой
                        ctx.fill();
                        ctx.strokeStyle = 'gold';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                } else { 
                    if (this.spriteSheet && this.spriteSheet.complete && this.spriteSheet.naturalHeight !== 0) {
                        const dxToPlayer = player.x + player.width / 2 - (this.x + this.width / 2);
                        ctx.save();
                        if (dxToPlayer < 0) { // Враг движется влево (или игрок слева от врага)
                            ctx.translate(this.x + this.width, this.y);
                            ctx.scale(-1, 1);
                            ctx.drawImage(
                                this.spriteSheet,
                                this.frameIndex * this.frameWidth, 0,
                                this.frameWidth, this.frameHeight,
                                0, 0, 
                                this.width, this.height
                            );
                        } else { 
                            ctx.drawImage(
                                this.spriteSheet,
                                this.frameIndex * this.frameWidth, 0,
                                this.frameWidth, this.frameHeight,
                                this.x, this.y,
                                this.width, this.height
                            );
                        }
                        ctx.restore();
                    } else {
                        ctx.fillStyle = 'darkgreen'; 
                        ctx.fillRect(this.x, this.y, this.width, this.height);
                    }
                }

                if (this.hasHealthBuff && smallHeartImage.complete && smallHeartImage.naturalHeight !== 0) {
                    const currentBonusHP = this.health - this.maxHealth; 

                    if (currentBonusHP >= 1) { 
                        ctx.drawImage(
                            smallHeartImage,
                            this.x + this.width - BUFF_HEART_SIZE, 
                            this.y,                                
                            BUFF_HEART_SIZE,
                            BUFF_HEART_SIZE
                        );
                    }
                    if (currentBonusHP >= 2) { 
                        ctx.drawImage(
                            smallHeartImage,
                            this.x + this.width - BUFF_HEART_SIZE * 2 - 2, 
                            this.y,               
                            BUFF_HEART_SIZE,
                            BUFF_HEART_SIZE
                        );
                    }
                    if (currentBonusHP >= 3) { 
                        ctx.drawImage(
                            smallHeartImage,
                            this.x + this.width - BUFF_HEART_SIZE * 3 - 4, 
                            this.y,               
                            BUFF_HEART_SIZE,
                            BUFF_HEART_SIZE
                        );
                    }
                    if (currentBonusHP >= 4) { 
                        ctx.drawImage(
                            smallHeartImage,
                            this.x + this.width - BUFF_HEART_SIZE * 4 - 6, 
                            this.y,               
                            BUFF_HEART_SIZE,
                            BUFF_HEART_SIZE
                        );
                    }
                }
            },
            
            update: function() {
                if (gameState !== 'playing') return;
                
                if (this.invulnerableTimer > 0) {
                    this.invulnerableTimer--;
                }
                
                if (this.type === 'fastGoblin') {
                    if (this.state === 'orbiting') {
                        this.frameTimer++;
                        if (this.frameTimer >= this.animInterval) {
                            this.frameIndex = (this.frameIndex + 1) % this.frameCount;
                            this.frameTimer = 0;
                        }

                        this.orbitAngle += this.currentAngularSpeed; 

                        const playerCenterX = player.x + player.width / 2;
                        const playerCenterY = player.y + player.height / 2;
                        const enemyCenterX = this.x + this.width / 2;
                        const enemyCenterY = this.y + this.height / 2;
                        const dxToPlayerCenter = playerCenterX - enemyCenterX;
                        const dyToPlayerCenter = playerCenterY - enemyCenterY;
                        const distanceToPlayer = Math.sqrt(dxToPlayerCenter * dxToPlayerCenter + dyToPlayerCenter * dyToPlayerCenter);

                        let moveDx, moveDy;

                        if (distanceToPlayer < FAST_GOBLIN_SAFE_DISTANCE_FROM_PLAYER && distanceToPlayer > 0) {
                            if (this.currentAngularSpeed > 0) { 
                                moveDx = dyToPlayerCenter; 
                                moveDy = -dxToPlayerCenter; 
                            } else { 
                                moveDx = -dyToPlayerCenter; 
                                moveDy = dxToPlayerCenter;  
                            }
                            const tangentMagnitude = Math.sqrt(moveDx * moveDx + moveDy * moveDy);
                            if (tangentMagnitude > 0) {
                                moveDx = (moveDx / tangentMagnitude) * this.speed;
                                moveDy = (moveDy / tangentMagnitude) * this.speed;
                            } else { 
                                moveDx = this.speed; 
                                moveDy = 0;
                            }
                        } else {
                            const targetOrbitX = playerCenterX + this.orbitRadius * Math.cos(this.orbitAngle);
                            const targetOrbitY = playerCenterY + this.orbitRadius * Math.sin(this.orbitAngle);
                            const angleToTargetOrbitPoint = Math.atan2(targetOrbitY - enemyCenterY, targetOrbitX - enemyCenterX);
                            moveDx = Math.cos(angleToTargetOrbitPoint) * this.speed;
                            moveDy = Math.sin(angleToTargetOrbitPoint) * this.speed;
                        }

                        if (moveDx > 0) this.directionX = 1; 
                        else if (moveDx < 0) this.directionX = -1; 

                        this.x += moveDx;
                        this.y += moveDy;

                        this.attackCooldownTimer++;
                        if (this.attackCooldownTimer >= FAST_GOBLIN_ATTACK_COOLDOWN) {
                            this.state = 'attacking';
                            this.attackFrameIndex = 0;
                            this.attackFrameTimer = 0;
                            this.attackCooldownTimer = 0; 
                            const angleToPlayerToAttack = Math.atan2(playerCenterY - enemyCenterY, playerCenterX - enemyCenterX); 
                            this.directionX = (Math.cos(angleToPlayerToAttack) >= 0) ? 1 : -1;
                        }

                    } else if (this.state === 'attacking') {
                        this.attackFrameTimer++;
                        if (this.attackFrameTimer >= this.attackAnimInterval) {
                            this.attackFrameIndex++;
                            this.attackFrameTimer = 0;

                            if (this.attackFrameIndex >= this.attackFrameCount) {
                                setTimeout(() => {
                                    spawnFireTrail(this.x + this.width / 2 - FIRE_TRAIL_SIZE / 2, this.y + this.height / 2 - FIRE_TRAIL_SIZE / 2);
                                }, FAST_GOBLIN_FIRE_SPAWN_DELAY_AFTER_ATTACK);
                                
                                this.state = 'orbiting'; 
                                this.frameIndex = 0; 
                                this.frameTimer = 0;
                            }
                        }
                    }
                } else if (this.type === 'sorcerer') { 
                    this.frameTimer++;
                    if (this.frameTimer >= this.animInterval) {
                        this.frameIndex = (this.frameIndex + 1) % this.frameCount;
                        this.frameTimer = 0;
                    }

                    if (this.state === undefined) {
                        this.state = 'moving'; 
                        this.actualCastTimer = 0; 
                        this.castEffectDrawTimer = 0; 
                        this.currentBuffValue = SORCERER_HEALTH_BUFF_AMOUNT; // Initialize current buff strength
                    }

                    if (gameTimer >= SORCERER_BUFF_TIER3_TIME) {
                        this.currentBuffValue = SORCERER_BUFF_STRENGTH_TIER3;
                    } else if (gameTimer >= SORCERER_BUFF_TIER2_TIME) {
                        this.currentBuffValue = SORCERER_BUFF_STRENGTH_TIER2;
                    } else if (gameTimer >= SORCERER_BUFF_TIER1_TIME) {
                        this.currentBuffValue = SORCERER_BUFF_STRENGTH_TIER1;
                    } else {
                        this.currentBuffValue = SORCERER_HEALTH_BUFF_AMOUNT; // Base strength
                    }
                    

                    if (this.state === 'moving') {
                        let moveDx = 0;
                        let moveDy = 0;
                        const speed = this.speed * 0.7; 

                        const dxToPlayer = player.x + player.width / 2 - (this.x + this.width / 2);
                        const dyToPlayer = player.y + player.height / 2 - (this.y + this.height / 2);
                        const distToPlayer = Math.sqrt(dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer);

                        if (distToPlayer < SORCERER_SAFE_DISTANCE_FROM_PLAYER && distToPlayer > 0) {
                            moveDx -= (dxToPlayer / distToPlayer) * speed; // Двигаться от игрока
                            moveDy -= (dyToPlayer / distToPlayer) * speed;
                        } else if (distToPlayer > SORCERER_SAFE_DISTANCE_FROM_PLAYER + 50) { // Если слишком далеко, немного приблизиться
                            moveDx += (dxToPlayer / distToPlayer) * speed * 0.5;
                            moveDy += (dyToPlayer / distToPlayer) * speed * 0.5;
                        }

                        let alliesCenterX = 0;
                        let alliesCenterY = 0;
                        let nearbyAlliesCount = 0;
                        enemies.forEach(e => {
                            if (e !== this && (e.type === 'normal' || e.type === 'fastGoblin')) {
                                const dToAlly = Math.sqrt(Math.pow(this.x - e.x, 2) + Math.pow(this.y - e.y, 2));
                                if (dToAlly < SORCERER_ALLY_SEARCH_RADIUS) {
                                    alliesCenterX += e.x + e.width / 2;
                                    alliesCenterY += e.y + e.height / 2;
                                    nearbyAlliesCount++;
                                }
                            }
                        });

                        if (nearbyAlliesCount > 0) {
                            alliesCenterX /= nearbyAlliesCount;
                            alliesCenterY /= nearbyAlliesCount;

                            const dxAllyToPlayer = player.x + player.width / 2 - alliesCenterX;
                            const dyAllyToPlayer = player.y + player.height / 2 - alliesCenterY;
                            const distAllyToPlayer = Math.sqrt(dxAllyToPlayer * dxAllyToPlayer + dyAllyToPlayer * dyAllyToPlayer);

                            if (distAllyToPlayer > 0) {
                                const targetX = alliesCenterX - (dxAllyToPlayer / distAllyToPlayer) * SORCERER_PREFERRED_DISTANCE_BEHIND_ALLIES;
                                const targetY = alliesCenterY - (dyAllyToPlayer / distAllyToPlayer) * SORCERER_PREFERRED_DISTANCE_BEHIND_ALLIES;

                                const dxToTarget = targetX - (this.x + this.width / 2);
                                const dyToTarget = targetY - (this.y + this.height / 2);
                                const distToTarget = Math.sqrt(dxToTarget * dxToTarget + dyToTarget * dyToTarget);

                                if (distToTarget > speed) { 
                                    moveDx += (dxToTarget / distToTarget) * speed * 0.6; 
                                    moveDy += (dyToTarget / distToTarget) * speed * 0.6;
                                }
                            }
                        } else {
                        }
                        
                        const totalMoveMagnitude = Math.sqrt(moveDx * moveDx + moveDy * moveDy);
                        if (totalMoveMagnitude > 0) {
                            this.x += (moveDx / totalMoveMagnitude) * speed;
                            this.y += (moveDy / totalMoveMagnitude) * speed;
                        }


                        this.x = Math.max(0, Math.min(this.x, canvas.width - this.width));
                        this.y = Math.max(0, Math.min(this.y, canvas.height - this.height));

                        if (this.abilityCooldownTimer > 0) {
                            this.abilityCooldownTimer--;
                            if (this.abilityCooldownTimer <= SORCERER_CAST_SETUP_TIME) {
                                this.state = 'casting_setup';
                                this.castEffectDrawTimer = SORCERER_CAST_EFFECT_DRAW_DURATION; // Начинаем показывать круг заранее
                                console.log("Sorcerer entering cast_setup state, starting cast effect draw timer.");
                            }
                        }
                    } else if (this.state === 'casting_setup') {
                        if (this.castEffectDrawTimer > 0) this.castEffectDrawTimer--; // Таймер круга тикает

                        if (this.abilityCooldownTimer <= 0) {
                            let buffedCount = 0;
                            const maxBuffTargets = 20;
                            const sorcererCenterX = this.x + this.width / 2;
                            const sorcererCenterY = this.y + this.height / 2;

                            const currentBuffAmount = this.currentBuffValue; 

                            enemies.forEach(enemy => {
                                if (buffedCount >= maxBuffTargets) return; 

                                if (enemy !== this && !enemy.hasHealthBuff) {
                                    const enemyCenterX = enemy.x + enemy.width / 2;
                                    const enemyCenterY = enemy.y + enemy.height / 2;
                                    const distanceToEnemy = Math.sqrt(
                                        Math.pow(sorcererCenterX - enemyCenterX, 2) +
                                        Math.pow(sorcererCenterY - enemyCenterY, 2)
                                    );

                                    if (distanceToEnemy <= SORCERER_BUFF_RADIUS) {
                                        enemy.health += currentBuffAmount; // Применяем текущую силу баффа
                                        enemy.hasHealthBuff = true;
                                        enemy.buffAmountReceived = currentBuffAmount; // Запоминаем сколько получил
                                        buffedCount++;
                                        console.log(`Sorcerer buffed ${enemy.type} with +${currentBuffAmount} HP. Total buffed this wave: ${buffedCount}`);
                                    }
                                }
                            });

                            this.abilityCooldownTimer = SORCERER_ABILITY_COOLDOWN; 
                            this.state = 'casting_effect'; 
                            this.actualCastTimer = SORCERER_CAST_DURATION; 
                            console.log(`Sorcerer used health buff (Power: ${currentBuffAmount})! ${buffedCount} allies buffed. Entering casting_effect state.`);
                        } else {
                           this.abilityCooldownTimer--; 
                        }
                    } else if (this.state === 'casting_effect') {
                        this.actualCastTimer--;
                        if (this.castEffectDrawTimer > 0) this.castEffectDrawTimer--; 

                        if (this.actualCastTimer <= 0) {
                            this.state = 'moving'; 
                            console.log("Sorcerer finished casting_effect, returning to moving state.");
                        }
                    }

                } else { 
                    this.frameTimer++;
                    if (this.frameTimer >= this.frameInterval) {
                        this.frameIndex = (this.frameIndex + 1) % this.frameCount;
                        this.frameTimer = 0;
                    }
                    
                    const angleToPlayer = Math.atan2(
                        player.y + player.height / 2 - (this.y + this.height / 2),
                        player.x + player.width / 2 - (this.x + this.width / 2)
                    );
                    
                    this.x += Math.cos(angleToPlayer) * this.speed;
                    this.y += Math.sin(angleToPlayer) * this.speed;
                }
            }
        };

        if (enemyType === 'fastGoblin') {
            enemyData.type = 'fastGoblin';
            enemyData.width = FAST_GOBLIN_SIZE; 
            enemyData.height = FAST_GOBLIN_SIZE; 
            enemyData.speed = FAST_GOBLIN_SPEED;
            enemyData.orbitAngle = Math.random() * Math.PI * 2;
            enemyData.orbitRadius = FAST_GOBLIN_ORBIT_RADIUS;
            enemyData.currentAngularSpeed = FAST_GOBLIN_ANGULAR_SPEED * (Math.random() < 0.5 ? 1 : -1); 
            enemyData.maxHealth = 1; 
            enemyData.health = enemyData.maxHealth;
            
            enemyData.state = 'orbiting'; 
            enemyData.attackCooldownTimer = Math.random() * FAST_GOBLIN_ATTACK_COOLDOWN; 

            enemyData.spriteSheet = fastGoblinSpriteSheet;
            enemyData.frameWidth = FAST_GOBLIN_SPRITE_FRAME_WIDTH; 
            enemyData.frameHeight = FAST_GOBLIN_SPRITE_FRAME_HEIGHT; 
            enemyData.frameCount = FAST_GOBLIN_FRAME_COUNT;       
            enemyData.frameIndex = 0;                             
            enemyData.frameTimer = 0;                             
            enemyData.animInterval = FAST_GOBLIN_ANIM_INTERVAL;   
            enemyData.directionX = 1; 

            enemyData.attackSpriteSheet = fastGoblinAttackSpriteSheet;
            enemyData.attackFrameCount = FAST_GOBLIN_ATTACK_FRAME_COUNT;
            enemyData.attackFrameIndex = 0;
            enemyData.attackFrameTimer = 0;
            enemyData.attackAnimInterval = FAST_GOBLIN_ATTACK_ANIM_INTERVAL;

        } else if (enemyType === 'sorcerer') {
            enemyData.type = 'sorcerer';
            enemyData.width = SORCERER_SIZE;
            enemyData.height = SORCERER_SIZE;
            enemyData.speed = currentEnemySpeed; 
            enemyData.maxHealth = SORCERER_INITIAL_HEALTH;
            enemyData.health = enemyData.maxHealth;
            enemyData.abilityCooldownTimer = SORCERER_ABILITY_COOLDOWN; 
            enemyData.state = 'moving'; 
            enemyData.currentBuffValue = SORCERER_HEALTH_BUFF_AMOUNT; 

            enemyData.spriteSheet = sorcererSpriteSheet;
            enemyData.frameWidth = SORCERER_SPRITE_FRAME_WIDTH;
            enemyData.frameHeight = SORCERER_SPRITE_FRAME_HEIGHT;
            enemyData.frameCount = SORCERER_FRAME_COUNT;
            enemyData.frameIndex = 0;
            enemyData.frameTimer = 0;
            enemyData.animInterval = SORCERER_ANIM_INTERVAL;
        } else { 
            enemyData.type = 'normal';
            enemyData.width = enemySize;
            enemyData.height = enemySize;
            enemyData.speed = currentEnemySpeed; 
            enemyData.spriteSheet = enemySpriteSheet;
            enemyData.frameWidth = enemyFrameWidth;
            enemyData.frameHeight = enemyFrameHeight;
            enemyData.frameCount = enemyFrameCount;
            enemyData.frameIndex = 0;
            enemyData.frameTimer = 0;
            enemyData.frameInterval = 8;
            enemyData.maxHealth = 1; 
            enemyData.health = enemyData.maxHealth;
            enemyData.abilityCooldownTimer = SORCERER_ABILITY_COOLDOWN; 
            enemyData.state = 'moving'; 
        }
        enemies.push(enemyData);
    }

    function spawnFireTrail(x, y) {
        fireTrails.push({
            x: x,
            y: y,
            width: FIRE_TRAIL_SIZE, 
            height: FIRE_TRAIL_SIZE,
            lifeTimer: FIRE_TRAIL_DURATION,
            spriteSheet: fireTrailSpriteSheet,
            frameWidth: FIRE_TRAIL_SPRITE_FRAME_WIDTH,
            frameHeight: FIRE_TRAIL_SPRITE_FRAME_HEIGHT,
            frameCount: FIRE_TRAIL_FRAME_COUNT,
            frameIndex: 0,
            frameTimer: 0,
            animInterval: FIRE_TRAIL_ANIM_INTERVAL,
            draw: function() {
                if (this.spriteSheet && this.spriteSheet.complete && this.spriteSheet.naturalHeight !== 0) {
                    ctx.drawImage(
                        this.spriteSheet,
                        this.frameIndex * this.frameWidth, 0,
                        this.frameWidth, this.frameHeight,
                        this.x, this.y,
                        this.width, this.height
                    );
                } else {
                    ctx.fillStyle = 'red';
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                }
            },
            update: function() {
                if (gameState !== 'playing') return;
                this.lifeTimer--;

                this.frameTimer++;
                if (this.frameTimer >= this.animInterval) {
                    this.frameIndex = (this.frameIndex + 1) % this.frameCount;
                    this.frameTimer = 0;
                }
            }
        });
    }

    function checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    function checkDeepCollision(rect1, rect2, threshold = 0.7) {
        if (!checkCollision(rect1, rect2)) return false;
        
        const overlapX = Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - Math.max(rect1.x, rect2.x);
        const overlapY = Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - Math.max(rect1.y, rect2.y);
        const overlapArea = overlapX * overlapY;
        const smallerObjectArea = Math.min(rect1.width * rect1.height, rect2.width * rect2.height);
        return overlapArea >= smallerObjectArea * threshold;
    }
    function resetGame() {
        player.reset();
        enemies = [];
        projectiles.length = 0;
        powerUps = [];
        fireTrails.length = 0; 
        enemySpawnTimer = 0;
        gameState = 'playing';
        
        gameTimer = 0;
        difficultyLevel = 0;
        currentEnemySpeed = 1;
        currentEnemySpawnInterval = 120;
        
        canvas.classList.add('visible');
        contentArea.classList.remove('visible');
        
        updateGameInfoVisibility();
        
        scoreElement.textContent = player.score;
        updateLives(player.lives);
        
        scoreSaved = false;
        
        if (playerNameInput) {
            document.body.removeChild(playerNameInput);
            document.body.removeChild(saveScoreButton);
            playerNameInput = null;
            saveScoreButton = null;
        }
        
        initializeLives();
    }

    function spawnPowerUp(x, y) {
        const powerUpSize = 32; 
        const POWERUP_LIFETIME = 900; 

        const powerUpTypes = [
            { type: 'speedBoost', image: powerUpImage },
            { type: 'multiShot', image: multiShotPowerUpImage },
            { type: 'massDestruction', image: massDestructionPowerUpImage }
        ];

        let availableTypes = powerUpTypes;

        if (player.ultimateCharges >= player.maxUltimateCharges) {
            availableTypes = availableTypes.filter(pu => pu.type !== 'massDestruction');
        }
        if (player.activeEffects && player.activeEffects.multiShot && player.activeEffects.multiShot.timer > 0) {
            availableTypes = availableTypes.filter(pu => pu.type !== 'multiShot');
        }

        if (availableTypes.length === 0) return;

        const powerUpInfo = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        
        powerUps.push({
            x: x - powerUpSize / 2, 
            y: y - powerUpSize / 2,
            width: powerUpSize,
            height: powerUpSize,
            image: powerUpInfo.image,
            type: powerUpInfo.type,
            lifeTimer: POWERUP_LIFETIME,
            draw: function() {
                if (this.image.complete && this.image.naturalHeight !== 0) {
                    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
                } else {
                    ctx.fillStyle = 'purple';
                    ctx.beginPath();
                    ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            },
            update: function() {
                this.lifeTimer--;
            }
        });
    }
    function showAbout() {
        gameState = 'menu';
        contentArea.innerHTML = `
            <div class="about-content">
                <h2>Об игре "Король Прерий"</h2>
                <p>Добро пожаловать в захватывающий мир аркадного шутера "Король Прерий"! Вам предстоит сражаться с ордами монстров, проверить свою реакцию и улучшить свои навыки, чтобы стать настоящим героем прерий.</p>

                <h3 class="section-title">Управление игрой</h3>
                <p>
                    <strong>Движение:</strong> <span class="key-control">W</span> <span class="key-control">A</span> <span class="key-control">S</span> <span class="key-control">D</span> или <span class="key-control">Ц</span> <span class="key-control">Ф</span> <span class="key-control">Ы</span> <span class="key-control">В</span> (русская раскладка)<br>
                    <strong>Стрельба:</strong> <span class="key-control">↑</span> <span class="key-control">↓</span> <span class="key-control">←</span> <span class="key-control">→</span> (стрелки)<br>
                    <strong>Ультимейт:</strong> <span class="key-control">R</span> или <span class="key-control">К</span> (при наличии зарядов)<br>
                    <strong>Пауза:</strong> <span class="key-control">ESC</span>
                </p>

                <h3 class="section-title">Усиления (Зелья)</h3>
                <p>Во время битвы вам могут встретиться волшебные зелья. Не упускайте шанс их подобрать – они даруют ценные преимущества!</p>
                <div class="potions-list">
                    <div class="potion-item">
                        <img src="images/Potion003.png" alt="Зелье ускорения" class="potion-icon">
                        <div>
                            <strong>Розовое зелье (Жажда Скорости):</strong> На короткое время значительно увеличивает скорость вашего передвижения. Идеально, чтобы увернуться от толпы врагов или быстро собрать другие бонусы!
                        </div>
                    </div>
                    <div class="potion-item">
                        <img src="images/Potion002.png" alt="Зелье Шквал Огня" class="potion-icon"> 
                        <div>
                            <strong>Зеленое зелье (Шквал Огня):</strong> Ваш персонаж начинает стрелять одновременно в восьми направлениях, создавая настоящий огненный вихрь. Отлично подходит для уничтожения больших скоплений противников. 
                        </div>
                    </div>
                    <div class="potion-item">
                        <img src="images/Potion001.png" alt="Зелье Эссенция Мощи" class="potion-icon"> 
                        <div>
                            <strong>Синее зелье (Эссенция Молний):</strong> Добавляет один заряд для вашей ультимативной способности. Собирайте эссенции, чтобы чаще обрушивать на врагов свою разрушительную силу! 
                        </div>
                    </div>
                </div>

                <h3 class="section-title">Ультимативная Способность: Гнев Прерий</h3>
                <p>
                    Это ваша самая мощная атака! При накоплении хотя бы одного заряда (⚡) от Синего зелья (Эссенция Молний), нажмите <span class="key-control">R</span> или <span class="key-control">К</span>, чтобы обрушить "Гнев Прерий". 
                    Способность мгновенно уничтожает до <strong>${player.ULTIMATE_MAX_TARGETS}</strong> случайных врагов на экране. Однако будьте внимательны: мудрые Слизни-Старейшины уничтожаются этой способностью в последнюю очередь.
                    Вы можете накопить до <strong>${player.maxUltimateCharges}</strong> зарядов ультимейта. Используйте их с умом!
                </p>

                <h3 class="section-title">Обитатели Прерий (Противники)</h3>
                <p>В своих странствиях вы столкнетесь с различными врагами. Знание их повадок – ключ к выживанию:</p>
                <div class="enemies-showcase">
                    <div class="enemy-card">
                        <h4>Гоблин-Подрывник</h4>
                        <canvas id="goblinPreviewCanvas" class="enemy-preview-canvas" width="${PREVIEW_DISPLAY_SIZE}" height="${PREVIEW_DISPLAY_SIZE}"></canvas>
                        <p>Самый распространенный противник. Эти настырные существа просто идут напролом, пытаясь задавить числом. Поодиночке слабы, но в группе могут доставить неприятностей.</p>
                    </div>
                    <div class="enemy-card">
                        <h4>Гоблин-Поджигатель</h4>
                        <canvas id="fastGoblinPreviewCanvas" class="enemy-preview-canvas" width="${PREVIEW_DISPLAY_SIZE}" height="${PREVIEW_DISPLAY_SIZE}"></canvas>
                        <p>Более проворный и коварный тип гоблинов. Он предпочитает держаться на расстоянии, кружа вокруг вас, и периодически совершает выпады, оставляя за собой выжигающие землю огненные следы.</p>
                    </div>
                    <div class="enemy-card">
                        <h4>Слизень-Старейшина</h4>
                        <canvas id="sorcererPreviewCanvas" class="enemy-preview-canvas" width="${PREVIEW_DISPLAY_SIZE}" height="${PREVIEW_DISPLAY_SIZE}"></canvas>
                        <p>Этот загадочный слизень не атакует вас напрямую. Вместо этого он держится в арьергарде, усиливая своих союзников-гоблинов дополнительным здоровьем. Чем дольше идет битва, тем мощнее становятся его чары! К счастью, он любит обнимашки, поэтому безвреден при контакте.</p>
                    </div>
                </div>
                
                <h3 class="section-title">Цель игры</h3>
                <p>Ваша задача – выжить как можно дольше, отбиваясь от волн монстров, становись сильнее с помощью зелий и устанавливай новые рекорды! Станьте истинным Королем Прерий!</p>
                
                <p class="game-hint"><em>Игра создана под вдохновением от "Journey of the Prairie King" из Stardew Valley.</em></p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <button class="back-button" id="start-game-button">Начать Игру!</button>
                </div>
            </div>
        `;
        
        contentArea.classList.add('visible');
        canvas.classList.remove('visible');
        updateGameInfoVisibility();
        document.getElementById('start-game-button').addEventListener('click', startGame);

        drawSingleFramePreview('goblinPreviewCanvas', enemySpriteSheet, 192, 192, PREVIEW_DISPLAY_SIZE);
        drawSingleFramePreview('fastGoblinPreviewCanvas', fastGoblinSpriteSheet, FAST_GOBLIN_SPRITE_FRAME_WIDTH, FAST_GOBLIN_SPRITE_FRAME_HEIGHT, PREVIEW_DISPLAY_SIZE);
        drawSingleFramePreview('sorcererPreviewCanvas', sorcererSpriteSheet, SORCERER_SPRITE_FRAME_WIDTH, SORCERER_SPRITE_FRAME_HEIGHT, PREVIEW_DISPLAY_SIZE);
    }


    function startGame() {
        if (gameState === 'menu' || gameState === 'gameOver' || gameState === 'paused') {
            resetGame(); 
        }
        updateGameInfoVisibility();
        console.log("Starting/Resetting game");
    }

    function showScores() {
        gameState = 'menu';
        
        contentArea.innerHTML = `
            <h2>Таблица рекордов</h2>
            <div style="text-align: center; padding: 40px;">
                <div class="loader"></div>
                <p>Загрузка рекордов...</p>
            </div>
        `;
        contentArea.classList.add('visible');
        canvas.classList.remove('visible');
        updateGameInfoVisibility();
        
        getScores(20).then(scores => {
            if (scores.length === 0) {
                contentArea.innerHTML = `
                    <h2>Таблица рекордов</h2>
                    <div style="text-align: center; padding: 40px;">
                        <p>Пока нет ни одного рекорда. Будьте первым!</p>
                        <button class="back-button" id="back-to-menu">Вернуться в меню</button>
                    </div>
                `;
                document.getElementById('back-to-menu').addEventListener('click', showAbout);
                return;
            }
            
            scores.sort((a, b) => b.score - a.score);
            scores.forEach((score, index) => {
                score.rank = index + 1;
            });
            let sortControlsHTML = `
                <div class="sort-controls">
                    <span>Сортировать по:</span>
                    <select id="sort-criteria">
                        <option value="score">Очкам</option>
                        <option value="monstersKilled">Убитым монстрам</option>
                        <option value="potionsCollected">Собранным зельям</option>
                        <option value="survivalTime">Времени выживания</option>
                        <option value="timestamp">Дате (новые сверху)</option>
                    </select>
                </div>
            `;
            let tableHTML = `
                <h2>Таблица рекордов</h2>
                ${sortControlsHTML}
                <table class="scores-table" id="scores-table">
                    <thead>
                        <tr>
                            <th>Место</th>
                            <th>Имя</th>
                            <th data-sort="score" class="sortable active">Очки ↓</th>
                            <th data-sort="monstersKilled" class="sortable">Убито монстров</th>
                            <th data-sort="potionsCollected" class="sortable">Собрано зелий</th>
                            <th data-sort="survivalTime" class="sortable">Время выживания</th>
                            <th data-sort="timestamp" class="sortable">Дата</th>
                        </tr>
                    </thead>
                    <tbody id="scores-tbody">
                    </tbody>
                </table>
                <div style="text-align: center; margin-top: 20px;">
                    <button class="back-button" id="back-to-menu">Вернуться в меню</button>
                </div>
            `;
            
            contentArea.innerHTML = tableHTML;
            
            function renderSortedTable(sortedScores, sortBy) {
                let tbodyHTML = '';
                
                sortedScores.forEach((score) => {
                    const date = new Date(score.timestamp).toLocaleDateString();
                    
                    const survivalTime = score.survivalTime || 0;
                    const minutes = Math.floor(survivalTime / 60);
                    const seconds = survivalTime % 60;
                    const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
                    
                    const scoreClass = sortBy === 'score' ? 'highlight' : '';
                    const monstersClass = sortBy === 'monstersKilled' ? 'highlight' : '';
                    const potionsClass = sortBy === 'potionsCollected' ? 'highlight' : '';
                    const timeClass = sortBy === 'survivalTime' ? 'highlight' : '';
                    const dateClass = sortBy === 'timestamp' ? 'highlight' : '';
                    
                    tbodyHTML += `
                        <tr>
                            <td>${score.rank}</td>
                            <td>${score.name}</td>
                            <td class="${scoreClass}">${score.score}</td>
                            <td class="${monstersClass}">${score.monstersKilled || 0}</td>
                            <td class="${potionsClass}">${score.potionsCollected || 0}</td>
                            <td class="${timeClass}">${formattedTime}</td>
                            <td class="${dateClass}">${date}</td>
                        </tr>
                    `;
                });
                
                document.getElementById('scores-tbody').innerHTML = tbodyHTML;
                
                document.querySelectorAll('th.sortable').forEach(th => {
                    if (th.getAttribute('data-sort') === sortBy) {
                        th.classList.add('active');
                        th.textContent = th.textContent.replace(/[\s↑↓]+$/, '') + ' ↓';
                    } else {
                        th.classList.remove('active');
                        th.textContent = th.textContent.replace(/[\s↑↓]+$/, '');
                    }
                });
            }
            
            function sortScores(scoresCopy, sortBy) {
                let sortedScores = [...scoresCopy];
                switch (sortBy) {
                    case 'score':
                        sortedScores.sort((a, b) => b.score - a.score);
                        break;
                    case 'monstersKilled':
                        sortedScores.sort((a, b) => {
                            const diffMonsters = (b.monstersKilled || 0) - (a.monstersKilled || 0);
                            return diffMonsters !== 0 ? diffMonsters : a.rank - b.rank;
                        });
                        break;
                    case 'potionsCollected':
                        sortedScores.sort((a, b) => {
                            const diffPotions = (b.potionsCollected || 0) - (a.potionsCollected || 0);
                            return diffPotions !== 0 ? diffPotions : a.rank - b.rank;
                        });
                        break;
                    case 'survivalTime':
                        sortedScores.sort((a, b) => {
                            const diffTime = (b.survivalTime || 0) - (a.survivalTime || 0);
                            return diffTime !== 0 ? diffTime : a.rank - b.rank;
                        });
                        break;
                    case 'timestamp':
                        sortedScores.sort((a, b) => {
                            const dateA = new Date(a.timestamp);
                            const dateB = new Date(b.timestamp);
                            const diffTime = dateB.getTime() - dateA.getTime();
                            return diffTime !== 0 ? diffTime : a.rank - b.rank;
                        });
                        break;
                }
                
                return sortedScores;
            }
            renderSortedTable(scores, 'score');
            document.querySelectorAll('th.sortable').forEach(th => {
                th.addEventListener('click', () => {
                    const sortBy = th.getAttribute('data-sort');
                    const sortedScores = sortScores(scores, sortBy);
                    renderSortedTable(sortedScores, sortBy);
                    document.getElementById('sort-criteria').value = sortBy;
                });
            });
            document.getElementById('sort-criteria').addEventListener('change', (event) => {
                const sortBy = event.target.value;
                const sortedScores = sortScores(scores, sortBy);
                renderSortedTable(sortedScores, sortBy);
                document.querySelectorAll('th.sortable').forEach(th => {
                    if (th.getAttribute('data-sort') === sortBy) {
                        th.classList.add('active');
                        th.textContent = th.textContent.replace(/[\s↑↓]+$/, '') + ' ↓';
                    } else {
                        th.classList.remove('active');
                        th.textContent = th.textContent.replace(/[\s↑↓]+$/, '');
                    }
                });
            });
            document.getElementById('back-to-menu').addEventListener('click', showAbout);
        });
        
        console.log("Showing Scores section");
    }
    aboutButton.addEventListener('click', showAbout);
    playButton.addEventListener('click', startGame);
    scoresButton.addEventListener('click', showScores);
    function createExplosion(x, y) {
        const explosionSize = 50; 
        const frameWidth = 320; 
        const frameHeight = 320; 
        const frameCount = 5; 
        explosions.push({
            x: x - explosionSize / 2, 
            y: y - explosionSize / 2,
            width: explosionSize,
            height: explosionSize,
            spriteSheet: explosionSpriteSheet,
            frameWidth: frameWidth,
            frameHeight: frameHeight,
            frameCount: frameCount,
            frameIndex: 0,
            frameTimer: 0,
            frameInterval: 5, 
            isComplete: false 
        });
    }

    function createPlayerExplosion(x, y) {
        const explosionSize = 192; 
        
        const frameWidth = 192; 
        const frameHeight = 192; 
        const frameCount = 9; 
        
        skullExplosions.push({
            x: x - explosionSize / 2, 
            y: y - explosionSize / 2,
            width: explosionSize,
            height: explosionSize,
            spriteSheet: playerExplosionSpriteSheet, 
            frameWidth: frameWidth,
            frameHeight: frameHeight,
            frameCount: frameCount,
            frameIndex: 0,
            frameTimer: 0,
            frameInterval: 4, 
            isComplete: false 
        });
    }

    function createLightningExplosion(x, y) {
        const explosionSize = 128; 
        
        const frameWidth = lightningSpriteSheet.width / 5; 
        const frameHeight = lightningSpriteSheet.height / 4; 
        const frameCount = 14; 
        
        lightningExplosions.push({
            x: x - explosionSize / 2,
            y: y - explosionSize / 2,
            width: explosionSize,
            height: explosionSize,
            spriteSheet: lightningSpriteSheet,
            frameWidth: frameWidth,
            frameHeight: frameHeight,
            frameCount: frameCount,
            frameIndex: 0,
            frameTimer: 0,
            frameInterval: 4, 
            isComplete: false
        });
    }

    function updateDifficulty() {
        if (gameState !== 'playing') return;
        
        gameTimer++;
        
        if (gameTimer % difficultyInterval === 0) {
            difficultyLevel++;
            currentEnemySpawnInterval = Math.max(
                minEnemySpawnInterval,
                currentEnemySpawnInterval - enemySpawnReduction
            );
            
            console.log(`Difficulty increased to level ${difficultyLevel}. Spawn interval: ${currentEnemySpawnInterval}`);
        }
    }

    function togglePause() {
        if (gameState === 'playing') {
            gameState = 'paused';
            console.log("Game paused");
        } else if (gameState === 'paused') {
            gameState = 'playing';
            console.log("Game resumed");
        }
        updateGameInfoVisibility();
    }

    function gameLoop() {
        if (backgroundImage.complete && backgroundImage.naturalHeight !== 0) {
            ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (gameState === 'playing') {
            updateDifficulty();
            player.update();
            enemySpawnTimer++;
            if (enemySpawnTimer >= currentEnemySpawnInterval) {
                spawnEnemy();
                enemySpawnTimer = 0;
            }
            for (let i = projectiles.length - 1; i >= 0; i--) {
                const p = projectiles[i];
                if (!p) continue;
                p.update();

                for (let j = enemies.length - 1; j >= 0; j--) {
                    const enemy = enemies[j];
                    if (enemy.invulnerableTimer <= 0 && checkDeepCollision(p, enemy, 0.9)) { 
                        const explosionX = enemy.x + enemy.width / 2;
                        const explosionY = enemy.y + enemy.height / 2;
                        createExplosion(explosionX, explosionY);
                        
                        projectiles.splice(i, 1); 
                        
                        enemy.health--;
                        console.log(`Enemy ${enemy.type} hit. Health: ${enemy.health}/${enemy.maxHealth}, Buffed: ${enemy.hasHealthBuff}`);

                        if (enemy.hasHealthBuff && enemy.health <= enemy.maxHealth) {
                            enemy.hasHealthBuff = false; 
                            console.log(`Enemy ${enemy.type} lost health buff. Current health: ${enemy.health}`);
                        }

                        if (enemy.health <= 0) {
                            const enemyCenterX = enemy.x + enemy.width / 2;
                            const enemyCenterY = enemy.y + enemy.height / 2;
                            if (enemy.type === 'fastGoblin') {
                                player.score += POINTS_PER_FAST_GOBLIN;
                            } else { 
                                player.score += pointsPerEnemy;
                            }
                            
                            enemies.splice(j, 1); 
                            player.monstersKilled++;
                            console.log(`Enemy ${enemy.type} defeated.`);

                            if (Math.random() < powerUpDropChance) {
                                spawnPowerUp(enemyCenterX, enemyCenterY);
                            }
                        }
                        break; 
                    }
                }
                if (projectiles[i] && (p.x + p.width < 0 || p.x > canvas.width || p.y + p.height < 0 || p.y > canvas.height)) {
                    projectiles.splice(i, 1);
                }
            }

            for (let i = enemies.length - 1; i >= 0; i--) {
                const enemy = enemies[i];
                enemy.update(); 
                if (checkDeepCollision(enemy, player, 0.7)) { 
                    if (enemy.type !== 'fastGoblin') {
                        if (enemy.invulnerableTimer <= 0) {
                            const explosionX = enemy.x + enemy.width / 2;
                            const explosionY = enemy.y + enemy.height / 2;
                            createPlayerExplosion(explosionX, explosionY);
                            
                            enemies.splice(i, 1);
                            player.lives--;
                            if (player.lives <= 0) {
                                gameState = 'gameOver';
                            }
                        }
                    }
                }
            }

            for (let i = powerUps.length - 1; i >= 0; i--) {
                const pu = powerUps[i];
                if (typeof pu.update === 'function') pu.update();
                
                if (pu.lifeTimer !== undefined && pu.lifeTimer <= 0) {
                    powerUps.splice(i, 1);
                    continue; 
                }
                
                if (checkDeepCollision(player, pu, 0.9)) { 
                    if (player.activatePowerUp(pu.type, pu.image)) { 
                        powerUps.splice(i, 1);
                    }
                }
            }

            if (player.ultimateCharges >= player.maxUltimateCharges) {
                for (let i = powerUps.length - 1; i >= 0; i--) {
                    if (powerUps[i].type === 'massDestruction') {
                        powerUps.splice(i, 1);
                    }
                }
            }
        } 

        if (canvas.classList.contains('visible')) {
            player.draw();
            
            updateAndDrawFireTrails();
            
            for (let i = 0; i < projectiles.length; i++) {
                projectiles[i].draw();
            }
            for (let i = 0; i < enemies.length; i++) {
                enemies[i].draw();
            }
            for (let i = 0; i < powerUps.length; i++) {
                powerUps[i].draw();
            }
            updateAndDrawExplosions();
            updateAndDrawSkullExplosions();
            updateAndDrawLightningExplosions(); 
            
            let iconOffsetIndex = 0;
            const powerUpIconSize = 24;
            const iconSpacing = 5; 

            for (const effectName in player.activeEffects) {
                if (player.activeEffects.hasOwnProperty(effectName)) {
                    const effect = player.activeEffects[effectName];
                    if (effect.timer > 0 && effect.image) { 
                        const iconX = 20 + iconOffsetIndex * (powerUpIconSize + iconSpacing);
                        const iconY = 20;
                        
                        ctx.save();
                        ctx.globalAlpha = 0.7;
                        
                        ctx.drawImage(effect.image, iconX, iconY, powerUpIconSize, powerUpIconSize);
                        
                        const remainingTime = Math.ceil(effect.timer / 60); // в секундах
                        ctx.font = '14px Arial';
                        ctx.fillStyle = 'white';
                        ctx.textAlign = 'center';
                        ctx.fillText(remainingTime.toString(), iconX + powerUpIconSize / 2, iconY + powerUpIconSize + 14);
                        
                        ctx.restore();
                        iconOffsetIndex++;
                    }
                }
            }
            
            if (gameState === 'paused') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2 - 40);
                ctx.shadowColor = '#4a90e2';
                ctx.shadowBlur = 20;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                
                ctx.font = 'bold 48px "Segoe UI", sans-serif';
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.fillText('ПАУЗА', 0, 0);
                
                ctx.font = '24px "Segoe UI", sans-serif';
                ctx.shadowBlur = 10;
                ctx.fillText('Нажмите ESC для продолжения', 0, 60);
                
                ctx.restore();
            }
        }

        if (gameState === 'gameOver') {
            canvas.classList.add('visible');
            gameInfoElement.classList.add('visible');
            contentArea.classList.remove('visible');
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.shadowColor = '#ff4040';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.font = 'bold 48px "Segoe UI", sans-serif';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 80);
            ctx.shadowBlur = 0;
            const survivalTimeInSeconds = Math.floor(player.survivalTime / 60);
            const minutes = Math.floor(survivalTimeInSeconds / 60);
            const seconds = survivalTimeInSeconds % 60;
            const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            ctx.font = '22px "Segoe UI", sans-serif';
            ctx.fillText(`🏆 Ваш счёт: ${player.score}`, canvas.width / 2, canvas.height / 2 - 30);
            ctx.fillText(`👾 Убито монстров: ${player.monstersKilled}`, canvas.width / 2, canvas.height / 2 + 10);
            ctx.fillText(`🧪 Собрано зелий: ${player.potionsCollected}`, canvas.width / 2, canvas.height / 2 + 50);
            ctx.fillText(`⏱️ Время выживания: ${formattedTime}`, canvas.width / 2, canvas.height / 2 + 90);
            ctx.restore();
            if (!scoreSaved) {
                ctx.textAlign = 'center'; 
                ctx.fillStyle = 'white';
                ctx.font = '22px "Segoe UI", sans-serif';
                ctx.fillText('Введите ваше имя:', canvas.width / 2, canvas.height / 2 + 140);
                
                if (!playerNameInput) {
                    playerNameInput = document.createElement('input');
                    playerNameInput.type = 'text';
                    playerNameInput.maxLength = 20;
                    playerNameInput.placeholder = 'Ваше имя';
                    playerNameInput.className = 'name-input';
                    playerNameInput.style.position = 'absolute';
                    playerNameInput.style.left = '50%'; 
                    playerNameInput.style.transform = 'translateX(-50%)'; 
                    playerNameInput.style.top = `${canvas.offsetTop + canvas.height / 2 + 160}px`;
                    
                    saveScoreButton = document.createElement('button');
                    saveScoreButton.textContent = 'Сохранить рекорд';
                    saveScoreButton.className = 'save-button';
                    saveScoreButton.style.position = 'absolute';
                    saveScoreButton.style.left = '50%'; 
                    saveScoreButton.style.transform = 'translateX(-50%)'; 
                    saveScoreButton.style.top = `${canvas.offsetTop + canvas.height / 2 + 220}px`;
                    
                    saveScoreButton.addEventListener('click', async () => {
                        if (playerNameInput.value.trim()) {
                            const success = await saveScore(playerNameInput.value.trim(), player.score);
                            if (success) {
                                document.body.removeChild(playerNameInput);
                                document.body.removeChild(saveScoreButton);
                                playerNameInput = null;
                                saveScoreButton = null;
                                
                                scoreSaved = true;
                            }
                        }
                    });
                    
                    document.body.appendChild(playerNameInput);
                    document.body.appendChild(saveScoreButton);
                    
                    setTimeout(() => playerNameInput.focus(), 100);
                }
            } else {
                ctx.textAlign = 'center'; 
                ctx.fillStyle = 'white';
                ctx.font = '22px "Segoe UI", sans-serif';
                ctx.fillText('Рекорд сохранен! Нажмите ENTER для новой игры', canvas.width / 2, canvas.height / 2 + 160);
            }
        }
        
        requestAnimationFrame(gameLoop);
    }

    function updateAndDrawExplosions() {
        for (let i = explosions.length - 1; i >= 0; i--) {
            const explosion = explosions[i];
            if (explosion.spriteSheet.complete && explosion.spriteSheet.naturalHeight !== 0) {
                ctx.drawImage(
                    explosion.spriteSheet,
                    explosion.frameIndex * explosion.frameWidth, 0, 
                    explosion.frameWidth, explosion.frameHeight,  
                    explosion.x, explosion.y,                     
                    explosion.width, explosion.height             
                );
            }
            
            if (gameState === 'playing') {
                explosion.frameTimer++;
                if (explosion.frameTimer >= explosion.frameInterval) {
                    explosion.frameIndex++;
                    explosion.frameTimer = 0;
                    
                    if (explosion.frameIndex >= explosion.frameCount) {
                        explosion.isComplete = true;
                    }
                }
                
                if (explosion.isComplete) {
                    explosions.splice(i, 1);
                }
            }
        }
    }

    function updateAndDrawSkullExplosions() {
        for (let i = skullExplosions.length - 1; i >= 0; i--) {
            const explosion = skullExplosions[i];
            if (explosion.spriteSheet.complete && explosion.spriteSheet.naturalHeight !== 0) {
                ctx.drawImage(
                    explosion.spriteSheet,
                    explosion.frameIndex * explosion.frameWidth, 0, 
                    explosion.frameWidth, explosion.frameHeight,  
                    explosion.x, explosion.y,                     
                    explosion.width, explosion.height             
                );
            }
            
            if (gameState === 'playing') {
                explosion.frameTimer++;
                if (explosion.frameTimer >= explosion.frameInterval) {
                    explosion.frameIndex++;
                    explosion.frameTimer = 0;
                    
                    if (explosion.frameIndex >= explosion.frameCount) {
                        explosion.isComplete = true;
                    }
                }
                
                if (explosion.isComplete) {
                    skullExplosions.splice(i, 1);
                }
            }
        }
    }

    function updateAndDrawLightningExplosions() {
        for (let i = lightningExplosions.length - 1; i >= 0; i--) {
            const explosion = lightningExplosions[i];
            
            if (explosion.spriteSheet.complete && explosion.spriteSheet.naturalHeight !== 0) {
                const column = explosion.frameIndex % 5; 
                const row = Math.floor(explosion.frameIndex / 5); 
                
                const sx = column * explosion.frameWidth;
                const sy = row * explosion.frameHeight;
                
                ctx.drawImage(
                    explosion.spriteSheet,
                    sx, sy,                                    
                    explosion.frameWidth, explosion.frameHeight,  
                    explosion.x, explosion.y,                     
                    explosion.width, explosion.height             
                );
            }
            
            if (gameState === 'playing') {
                explosion.frameTimer++;
                if (explosion.frameTimer >= explosion.frameInterval) {
                    explosion.frameIndex++;
                    explosion.frameTimer = 0;
                    
                    if (explosion.frameIndex >= explosion.frameCount) {
                        explosion.isComplete = true;
                    }
                }
                
                if (explosion.isComplete) {
                    lightningExplosions.splice(i, 1);
                }
            }
        }
    }

    function updateAndDrawFireTrails() {
        for (let i = fireTrails.length - 1; i >= 0; i--) {
            const fire = fireTrails[i];
            fire.draw();

            if (gameState === 'playing') {
                fire.update();
                if (checkDeepCollision(player, fire, 0.6)) {
                    player.lives--;
                    createPlayerExplosion(player.x + player.width / 2, player.y + player.height / 2); 
                    fireTrails.splice(i, 1); 
                    
                    if (player.lives <= 0) {
                        gameState = 'gameOver';
                    }
                    continue; 
                }

                if (fire.lifeTimer <= 0) {
                    fireTrails.splice(i, 1);
                }
            }
        }
    }
    showAbout(); 
    gameLoop();
    async function saveScore(name, score) {
        try {
            const survivalTimeInSeconds = Math.floor(player.survivalTime / 60);
            
            const response = await fetch('/api/scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    name, 
                    score,
                    monstersKilled: player.monstersKilled,
                    potionsCollected: player.potionsCollected,
                    survivalTime: survivalTimeInSeconds
                }),
            });
            
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error saving score:', error);
            return false;
        }
    }

    async function getScores(limit = 10) {
        try {
            const response = await fetch(`/api/scores?limit=${limit}`);
            const scores = await response.json();
            return scores;
        } catch (error) {
            console.error('Error fetching scores:', error);
            return [];
        }
    }

    let playerNameInput = null;
    let saveScoreButton = null;
    let scoreSaved = false;

    let previousLives = player.lives;

    function updateLives(lives) {
        const lostLife = lives < previousLives;
        previousLives = lives;
        
        livesContainer.innerHTML = '';
        for (let i = 0; i < lives; i++) {
            const heart = document.createElement('span');
            heart.className = 'heart';
            heart.textContent = '❤️';
            livesContainer.appendChild(heart);
        }
        if (lostLife) {
            const removingHeart = document.createElement('span');
            removingHeart.className = 'heart heart-removing';
            removingHeart.textContent = '❤️';
            livesContainer.appendChild(removingHeart);
            setTimeout(() => {
                if (livesContainer.contains(removingHeart)) {
                    livesContainer.removeChild(removingHeart);
                }
            }, 100); 
        }
    }

    function initializeLives() {
        previousLives = player.lives;
        updateLives(player.lives);
    }

    function updateGameInfoVisibility() {
        if (gameState === 'playing' || gameState === 'paused' || gameState === 'gameOver') {
            gameInfoElement.classList.add('visible');
        } else {
            gameInfoElement.classList.remove('visible');
        }
    }

    function updateUltimateChargesDisplay(charges) {
        if (!ultimateChargesContainer) return;
        ultimateChargesContainer.innerHTML = ''; 
        for (let i = 0; i < charges; i++) {
            const boltIcon = document.createElement('span');
            boltIcon.className = 'ultimate-bolt';
            boltIcon.textContent = '⚡';
            ultimateChargesContainer.appendChild(boltIcon);
        }
    }
});

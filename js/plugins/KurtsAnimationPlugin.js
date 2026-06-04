//=============================================================================
// KurtsAnimationPlugin.js
//=============================================================================
/*:
 * @plugindesc v1.0.6 Allows different number of frames for each character animation using JSON frame data
 * @author Furkan Kurt
 * 
 * @param Idle Up Speed
 * @text Idle Up Animation Speed
 * @desc Speed modifier for idle up animations. Use 'f' for frame count. Example: f * 0.5
 * @default f * 0.5
 * 
 * @param Idle Down Speed
 * @text Idle Down Animation Speed
 * @desc Speed modifier for idle down animations. Use 'f' for frame count. Example: f * 0.5
 * @default f * 0.5
 * 
 * @param Idle Left Speed
 * @text Idle Left Animation Speed
 * @desc Speed modifier for idle left animations. Use 'f' for frame count. Example: f * 0.5
 * @default f * 0.5
 * 
 * @param Idle Right Speed
 * @text Idle Right Animation Speed
 * @desc Speed modifier for idle right animations. Use 'f' for frame count. Example: f * 0.5
 * @default f * 0.5
 * 
 * @param Walk Up Speed
 * @text Walk Up Animation Speed
 * @desc Speed modifier for walk up animations. Use 'f' for frame count. Example: f * 0.8
 * @default f * 0.8
 * 
 * @param Walk Down Speed
 * @text Walk Down Animation Speed
 * @desc Speed modifier for walk down animations. Use 'f' for frame count. Example: f * 0.8
 * @default f * 0.8
 * 
 * @param Walk Left Speed
 * @text Walk Left Animation Speed
 * @desc Speed modifier for walk left animations. Use 'f' for frame count. Example: f * 0.8
 * @default f * 0.8
 * 
 * @param Walk Right Speed
 * @text Walk Right Animation Speed
 * @desc Speed modifier for walk right animations. Use 'f' for frame count. Example: f * 0.8
 * @default f * 0.8
 * 
 * @param Run Up Speed
 * @text Run Up Animation Speed
 * @desc Speed modifier for run up animations. Use 'f' for frame count. Example: f * 1.0
 * @default f * 1.0
 * 
 * @param Run Down Speed
 * @text Run Down Animation Speed
 * @desc Speed modifier for run down animations. Use 'f' for frame count. Example: f * 1.0
 * @default f * 1.0
 * 
 * @param Run Left Speed
 * @text Run Left Animation Speed
 * @desc Speed modifier for run left animations. Use 'f' for frame count. Example: f * 1.0
 * @default f * 1.0
 * 
 * @param Run Right Speed
 * @text Run Right Animation Speed
 * @desc Speed modifier for run right animations. Use 'f' for frame count. Example: f * 1.0
 * @default f * 1.0
 * 
 * @param Run Speed Threshold
 * @text Run Speed Threshold
 * @desc Move speed value at which character is considered running (instead of walking). Default is 5.
 * @type number
 * @min 1
 * @max 8
 * @default 5
 *
 * @param Post Run Idle Speed Boost
 * @text Post-Run Idle Speed Boost
 * @desc After running then stopping, idle anim plays this many times faster at first, then eases to normal. 1 = feature off.
 * @type number
 * @decimals 2
 * @min 1
 * @max 10
 * @default 1.80
 *
 * @param Post Run Min Run Seconds
 * @text Post-Run Min Run (sec)
 * @desc Minimum continuous run time before post-run idle boost applies. 0 = no minimum (any run qualifies).
 * @type number
 * @decimals 2
 * @min 0
 * @max 120
 * @default 0.35
 *
 * @param Post Run Idle Hold Seconds
 * @text Post-Run Idle Hold (sec)
 * @desc After qualifying run→idle, hold full boost for this long before easing down. 0 = start easing immediately.
 * @type number
 * @decimals 2
 * @min 0
 * @max 30
 * @default 0.50
 *
 * @param Post Run Idle Recovery Seconds
 * @text Post-Run Idle Ease Down (sec)
 * @desc After the hold, seconds to linearly blend idle speed from boost down to 1× normal.
 * @type number
 * @decimals 1
 * @min 0.05
 * @max 60
 * @default 3.0
 *
 * @param Enable Debug
 * @text Enable Debug
 * @desc Show on-screen debug overlay with animation state (anim, pattern, rect, etc.)
 * @type boolean
 * @default false
 * 
 * @param JSON Animation Characters
 * @text JSON only for these $
 * @desc ONLY these $ sheets load a .json (one per line). Leave empty to use built-in default ($clem). Add lines when you add more *.json files.
 * @type note
 * @default
 * 
 * @param Static Dollar Characters
 * @text No-JSON $ characters
 * @desc Used only when "JSON only for these $" is empty. One name per line; skips XHR for listed $ sheets.
 * @type note
 * @default
 * 
 * @help
 * ============================================================================
 * JSON Frame Animations Plugin
 * ============================================================================
 * 
 * This plugin allows you to use different numbers of frames for each character
 * animation by reading frame data from JSON files exported by LibreSprite.
 * 
 * USAGE:
 * ------
 * 1. Name your character image files starting with $ (e.g., $clem.png)
 * 2. Export a JSON file with the same name from LibreSprite (e.g., $clem.json)
 * 3. The JSON should contain frame names following this pattern:
 *    - idleUp0, idleUp1, idleUp2... (idle animation facing up)
 *    - idleDown0, idleDown1, idleDown2... (idle animation facing down)
 *    - idleLeft0, idleLeft1, idleLeft2... (idle animation facing left)
 *    - idleRight0, idleRight1, idleRight2... (idle animation facing right)
 *    - walkUp0, walkUp1, walkUp2... (walking animation facing up)
 *    - walkDown0, walkDown1, walkDown2... (walking animation facing down)
 *    - walkLeft0, walkLeft1, walkLeft2... (walking animation facing left)
 *    - walkRight0, walkRight1, walkRight2... (walking animation facing right)
 *    - runUp0, runUp1, runUp2... (running animation facing up)
 *    - runDown0, runDown1, runDown2... (running animation facing down)
 *    - runLeft0, runLeft1, runLeft2... (running animation facing left)
 *    - runRight0, runRight1, runRight2... (running animation facing right)
 * 
 * 4. If any animation is missing, the plugin will display the very first
 *    frame of the sprite sheet (idle0 or the first frame in the JSON).
 * 
 * 5. "JSON only for these $" defaults to $clem when left empty (only that sheet loads .json).
 *    Type * alone for legacy: No-JSON list + try json on every other $ sheet.
 * 
 * NOTE:
 * -----
 * - This plugin works with character files starting with $ symbol
 * - Each animation can have a different number of frames
 * - The plugin automatically detects walking vs running based on move speed
 * - You can configure the run speed threshold in plugin parameters (default: 5)
 * - Speed parameters (f * …): animation wait = max(1, round(15 / result)) for idle,
 *   walk, and run. Larger values = faster; smaller values = slower than engine default.
 * - Post-Run Idle: run→idle can boost idle speed if the run lasted at least Min Run seconds;
 *   then Hold seconds at full boost, then Ease Down seconds back to 1×. Boost 1 = off.
 * 
 * ============================================================================
 */

(() => {
    'use strict';

    // Read plugin parameters
    const parameters = PluginManager.parameters('KurtsAnimationPlugin');
    
    // Run speed threshold (move speed >= this value is considered running)
    const RUN_SPEED_THRESHOLD = Number(parameters['Run Speed Threshold']) || 5;

    const POST_RUN_IDLE_BOOST = Number(parameters['Post Run Idle Speed Boost']);
    const POST_RUN_IDLE_BOOST_CL =
        Number.isFinite(POST_RUN_IDLE_BOOST) && POST_RUN_IDLE_BOOST > 1.0001
            ? POST_RUN_IDLE_BOOST
            : 1;
    const POST_RUN_IDLE_RECOVERY_SEC = Math.max(
        0.05,
        Number(parameters['Post Run Idle Recovery Seconds']) || 3
    );
    const _prmMinRun = Number(parameters['Post Run Min Run Seconds']);
    const POST_RUN_MIN_RUN_SEC_CL =
        Number.isFinite(_prmMinRun) && _prmMinRun >= 0 ? _prmMinRun : 0;
    const _prmHold = Number(parameters['Post Run Idle Hold Seconds']);
    const POST_RUN_HOLD_SEC_CL =
        Number.isFinite(_prmHold) && _prmHold >= 0 ? _prmHold : 0;
    
    // Speed modifiers for each animation type and direction
    const SPEED_MODIFIERS = {
        'idleUp': parameters['Idle Up Speed'] || 'f * 0.5',
        'idleDown': parameters['Idle Down Speed'] || 'f * 0.5',
        'idleLeft': parameters['Idle Left Speed'] || 'f * 0.5',
        'idleRight': parameters['Idle Right Speed'] || 'f * 0.5',
        'walkUp': parameters['Walk Up Speed'] || 'f * 0.8',
        'walkDown': parameters['Walk Down Speed'] || 'f * 0.8',
        'walkLeft': parameters['Walk Left Speed'] || 'f * 0.8',
        'walkRight': parameters['Walk Right Speed'] || 'f * 0.8',
        'runUp': parameters['Run Up Speed'] || 'f * 1.0',
        'runDown': parameters['Run Down Speed'] || 'f * 1.0',
        'runLeft': parameters['Run Left Speed'] || 'f * 1.0',
        'runRight': parameters['Run Right Speed'] || 'f * 1.0'
    };

    // Direction mapping: 2=down, 4=left, 6=right, 8=up
    const DIRECTION_NAMES = {
        2: 'Down',
        4: 'Left',
        6: 'Right',
        8: 'Up'
    };

    const DEBUG = parameters['Enable Debug'] === 'true';

    function normalizeCharacterKey(name) {
        if (!name) return '';
        let n = String(name).trim();
        if (!n.startsWith('$')) n = '$' + n;
        return n.replace(/\.png$/i, '');
    }

    const STATIC_CHAR_NO_JSON = (function() {
        const raw = parameters['Static Dollar Characters'] || '';
        const set = new Set();
        if (!String(raw).trim()) return set;
        String(raw).split(/[\r\n,]+/).forEach(function(line) {
            const key = normalizeCharacterKey(line);
            if (key.length > 1) set.add(key);
        });
        return set;
    })();

    /**
     * Only these $ sheets may load img/characters/*.json (no XHR for props like $dressRed).
     * If the plugin param is empty/missing, default to $clem (only json shipped in many projects).
     * Set the param explicitly to add more names (one per line) when you add more .json files.
     */
    const JSON_ANIMATION_CHARS = (function() {
        let raw = parameters['JSON Animation Characters'];
        if (raw === undefined || raw === null) raw = '';
        raw = String(raw).trim();
        // Legacy: type * to use only "No-JSON $" + XHR for other $ (old behavior).
        if (raw === '*') {
            return new Set();
        }
        if (!raw) {
            raw = '$clem';
        }
        const set = new Set();
        String(raw).split(/[\r\n,]+/).forEach(function(line) {
            const key = normalizeCharacterKey(line);
            if (key.length > 1) set.add(key);
        });
        return set;
    })();

    let _debugDiv = null;
    function ensureDebugDiv() {
        if (!DEBUG) {
            if (_debugDiv) { _debugDiv.style.display = 'none'; }
            return null;
        }
        if (_debugDiv) {
            _debugDiv.style.display = '';
            return _debugDiv;
        }
        _debugDiv = document.createElement('div');
        Object.assign(_debugDiv.style, {
            position: 'fixed', top: '8px', left: '8px', zIndex: '9999',
            background: 'rgba(0,0,0,0.8)', color: '#0f0', fontFamily: 'monospace',
            fontSize: '13px', padding: '6px 10px', borderRadius: '4px',
            pointerEvents: 'none', whiteSpace: 'pre', lineHeight: '1.4'
        });
        document.body.appendChild(_debugDiv);
        return _debugDiv;
    }

    // Cache for loaded JSON data
    const _jsonCache = {};

    // Cache for parsed frame data
    const _frameDataCache = {};

    /**
     * Load JSON file for a character
     */
    function loadCharacterJSON(characterName) {
        // Return cached data if available
        if (_jsonCache[characterName] !== undefined) {
            return _jsonCache[characterName];
        }

        // Check if character name starts with $
        if (!characterName || !characterName.startsWith('$')) {
            _jsonCache[characterName] = null;
            return null;
        }

        const key = normalizeCharacterKey(characterName);
        if (JSON_ANIMATION_CHARS.size > 0) {
            if (!JSON_ANIMATION_CHARS.has(key)) {
                _jsonCache[characterName] = null;
                return null;
            }
        } else if (STATIC_CHAR_NO_JSON.has(key)) {
            _jsonCache[characterName] = null;
            return null;
        }

        // Get JSON filename (replace .png with .json, or add .json)
        const jsonName = characterName.replace(/\.png$/i, '') + '.json';
        const jsonPath = 'img/characters/' + jsonName;

        try {
            // Try to load JSON synchronously
            const xhr = new XMLHttpRequest();
            xhr.open('GET', jsonPath, false);
            xhr.overrideMimeType('application/json');
            xhr.send(null);
            
            if (xhr.status === 200 || xhr.status === 0) {
                const jsonData = JSON.parse(xhr.responseText);
                _jsonCache[characterName] = jsonData;
                return jsonData;
            } else {
                // Cache null to avoid repeated failed attempts
                _jsonCache[characterName] = null;
            }
        } catch (e) {
            _jsonCache[characterName] = null;
        }

        return null;
    }

    /**
     * Parse frame data from JSON
     */
    function parseFrameData(characterName) {
        if (_frameDataCache[characterName]) {
            return _frameDataCache[characterName];
        }

        const jsonData = loadCharacterJSON(characterName);
        if (!jsonData || !jsonData.frames) {
            return null;
        }

        const frameData = {
            animations: {},
            firstFrame: null
        };

        // Get all frame names
        const frameNames = Object.keys(jsonData.frames);
        
        // Find first frame (fallback)
        if (frameNames.length > 0) {
            const firstFrameName = frameNames[0];
            frameData.firstFrame = jsonData.frames[firstFrameName];
        }

        // Parse animations: idle, walk, run in 4 directions
        const directions = ['Up', 'Down', 'Left', 'Right'];
        const animTypes = ['idle', 'walk', 'run'];

        for (const animType of animTypes) {
            for (const direction of directions) {
                const animKey = animType + direction;
                const frames = [];

                // Find all frames for this animation (e.g., walkUp0, walkUp1, walkUp2...)
                let frameIndex = 0;
                while (true) {
                    const frameName = animKey + frameIndex;
                    if (jsonData.frames[frameName]) {
                        frames.push({
                            name: frameName,
                            data: jsonData.frames[frameName]
                        });
                        frameIndex++;
                    } else {
                        break;
                    }
                }

                if (frames.length > 0) {
                    frameData.animations[animKey] = frames;
                }
            }
        }

        _frameDataCache[characterName] = frameData;
        return frameData;
    }

    /**
     * Helper function to check if character is actively walking
     * Uses movement intent (_movementSuccess) instead of just isMoving()
     * to avoid false negatives between tiles
     */
    Game_CharacterBase.prototype.isActivelyWalking = function() {
        return this.isMoving() || (this._movementSuccess !== undefined && this._movementSuccess);
    };

    /**
     * Helper function to detect when character just stopped moving
     * Used for idle transition - fires exactly once when movement ends
     */
    Game_CharacterBase.prototype.justStoppedMoving = function() {
        return !this.isMoving() && this._stopCount === 1;
    };

    /**
     * Get current animation type based on character state
     */
    function getAnimationType(character) {
        // If we've flagged that we should stay idle (until actually moving again)
        if (character._forceIdleUntilMoving) {
            // Only clear the flag when actually moving (not just _movementSuccess)
            // Use isMoving() directly, not isActivelyWalking() which includes _movementSuccess
            const isMoving = character.isMoving ? character.isMoving() : false;
            if (isMoving) {
                character._forceIdleUntilMoving = false;
                // Now check movement type
                const moveSpeed = character.realMoveSpeed ? character.realMoveSpeed() : 4;
                if (moveSpeed >= RUN_SPEED_THRESHOLD) {
                    return 'run';
                }
                return 'walk';
            }
            // Still not moving, stay idle
            return 'idle';
        }
        
        // Check if character is actively walking (using intent, not just movement state)
        const isWalking = character.isActivelyWalking ? character.isActivelyWalking() : false;
        
        if (!isWalking) {
            return 'idle';
        }
        
        // Check if running (move speed >= threshold)
        // In RPG Maker, running typically has higher move speed
        const moveSpeed = character.realMoveSpeed ? character.realMoveSpeed() : 4;
        if (moveSpeed >= RUN_SPEED_THRESHOLD) {
            return 'run';
        }
        
        return 'walk';
    }

    /**
     * Get direction name from direction number
     */
    function getDirectionName(direction) {
        return DIRECTION_NAMES[direction] || 'Down';
    }

    /**
     * Get current frame for character
     */
    function getCurrentFrame(character, characterName) {
        if (!character || !characterName) {
            return null;
        }

        const frameData = parseFrameData(characterName);
        if (!frameData) {
            return null;
        }

        const animType = getAnimationType(character);
        const direction = getDirectionName(character.direction());
        const animKey = animType + direction;

        // Get animation frames
        const animation = frameData.animations[animKey];
        
        // If animation doesn't exist, use first frame
        if (!animation || animation.length === 0) {
            return frameData.firstFrame;
        }

        // Switch to animation if changed (ensures pattern resets)
        switchToAnimation(character, animKey, animation);

        // Get current pattern (frame index)
        // Initialize pattern if needed
        if (character._pattern === undefined || character._pattern === null) {
            character._pattern = 0;
        }
        
        let pattern = character._pattern;
        
        // Ensure pattern is within bounds of current animation
        if (pattern < 0) {
            pattern = 0;
            character._pattern = 0;
        } else if (pattern >= animation.length) {
            pattern = pattern % animation.length;
            character._pattern = pattern;
        }
        
        const frameIndex = Math.min(Math.max(0, pattern), animation.length - 1);
        
        return animation[frameIndex].data;
    }

    /**
     * Override Sprite_Character.setCharacterBitmap
     */
    const _Sprite_Character_setCharacterBitmap = Sprite_Character.prototype.setCharacterBitmap;
    Sprite_Character.prototype.setCharacterBitmap = function() {
        _Sprite_Character_setCharacterBitmap.call(this);
        
        if (this._characterName && this._characterName.startsWith('$')) {
            const fd = parseFrameData(this._characterName);
            this._jsonFrameData = fd;
            this._usesJsonFrames = !!fd;
        } else {
            this._usesJsonFrames = false;
            this._jsonFrameData = null;
        }
    };

    /**
     * Override Sprite_Character.updateCharacterFrame
     */
    const _Sprite_Character_updateCharacterFrame = Sprite_Character.prototype.updateCharacterFrame;
    Sprite_Character.prototype.updateCharacterFrame = function() {
        if (this._usesJsonFrames && this._jsonFrameData) {
            const character = this._character;
            const frame = getCurrentFrame(character, this._characterName);
            
            if (frame && frame.frame) {
                const frameRect = frame.frame;
                const sx = frameRect.x;
                const sy = frameRect.y;
                const pw = frameRect.w;
                const ph = frameRect.h;

                if (DEBUG && character === $gamePlayer) {
                    const animType = getAnimationType(character);
                    const dir = getDirectionName(character.direction());
                    const animKey = animType + dir;
                    const anim = this._jsonFrameData.animations[animKey];
                    const totalFrames = anim ? anim.length : 0;
                    const pat = character._pattern;
                    const div = ensureDebugDiv();
                    if (div) {
                        const prStart = character._jsonPostRunIdleStartFrame;
                        const prH = character._jsonPostRunHoldFrames || 0;
                        const prE = character._jsonPostRunEaseFrames || 0;
                        let prLine = 'postRun: off';
                        if (
                            POST_RUN_IDLE_BOOST_CL > 1.0001 &&
                            prStart != null &&
                            prH + prE > 0
                        ) {
                            const el = Graphics.frameCount - prStart;
                            const tot = prH + prE;
                            prLine = `postRun: ${el}/${tot}f (hold ${prH}, ease ${prE})`;
                        }
                        div.textContent =
                            `anim: ${animKey}\n` +
                            `pattern: ${pat} / ${totalFrames}\n` +
                            `rect: (${sx}, ${sy}, ${pw}, ${ph})\n` +
                            `isMoving: ${character.isMoving()}\n` +
                            `stopCount: ${character._stopCount}\n` +
                            `forceIdle: ${!!character._forceIdleUntilMoving}\n` +
                            `${prLine}\n` +
                            `animWait: ${character.animationWait()}  jsonPatSpd: ${character._jsonPatSpd}`;
                    }
                }

                this.updateHalfBodySprites();
                if (this._bushDepth > 0) {
                    const d = this._bushDepth;
                    this._upperBody.setFrame(sx, sy, pw, ph - d);
                    this._lowerBody.setFrame(sx, sy + ph - d, pw, d);
                    this.setFrame(sx, sy, 0, ph);
                } else {
                    this.setFrame(sx, sy, pw, ph);
                }
            } else {
                if (DEBUG && character === $gamePlayer) {
                    const div = ensureDebugDiv();
                    if (div) div.textContent = `NO FRAME! char: ${this._characterName}`;
                }
                _Sprite_Character_updateCharacterFrame.call(this);
            }
        } else {
            _Sprite_Character_updateCharacterFrame.call(this);
        }
    };
    

    /**
     * Store last animation key to detect animation changes
     */
    Game_CharacterBase.prototype._lastJsonAnimKey = null;

    /**
     * Helper function to switch to a new animation
     * Resets pattern and updates all tracking variables
     */
    function switchToAnimation(character, animKey, animation) {
        if (character._lastJsonAnimKey !== animKey) {
            // Animation changed - reset everything
            character._pattern = 0;
            character._lastJsonAnimKey = animKey;
            
            if (animation && animation.length > 0) {
                character._jsonFrameCount = animation.length;
                character._jsonAnimKey = animKey;
                
                // Calculate speed modifier
                const modifier = SPEED_MODIFIERS[animKey];
                if (modifier) {
                    const f = animation.length;
                    try {
                        character._jsonPatSpd = eval(modifier);
                    } catch (e) {
                        character._jsonPatSpd = 0;
                    }
                } else {
                    character._jsonPatSpd = 0;
                }
            }
        }
    }

    /**
     * Override Game_CharacterBase.updatePattern to handle variable frame counts
     * Following GALV's approach: handle moving animations, let default handle stopped
     */
    const _Game_CharacterBase_updatePattern = Game_CharacterBase.prototype.updatePattern;
    Game_CharacterBase.prototype.updatePattern = function() {
        // Check if character uses JSON frames
        let characterName = null;
        try {
            characterName = this.characterName ? this.characterName() : null;
        } catch (e) {
            // characterName() might not exist in all contexts
        }
        
        if (characterName && characterName.startsWith('$')) {
            const frameData = parseFrameData(characterName);
            
            if (frameData) {
                // Get current animation type and direction
                const animType = getAnimationType(this);
                const direction = getDirectionName(this.direction());
                const animKey = animType + direction;
                const animation = frameData.animations[animKey];
                
                if (animation && animation.length > 0) {
                    // Switch to animation (resets pattern if animation changed)
                    switchToAnimation(this, animKey, animation);
                    
                    // Ensure pattern is initialized and valid
                    if (this._pattern === undefined || this._pattern === null || this._pattern < 0) {
                        this._pattern = 0;
                    }
                    
                    // Ensure pattern is within bounds
                    if (this._pattern >= animation.length) {
                        this._pattern = this._pattern % animation.length;
                    }
                    
                    this._pattern = (this._pattern + 1) % animation.length;
                    
                    return;
                } else {
                    // Animation doesn't exist, reset tracking and use default
                    this._lastJsonAnimKey = null;
                }
            }
        } else {
            // Not a JSON character, reset tracking
            this._lastJsonAnimKey = null;
        }
        
        // Default behavior for non-JSON characters or when JSON animation doesn't exist
        _Game_CharacterBase_updatePattern.call(this);
    };

    /**
     * Override Game_CharacterBase.pattern to handle variable frame counts
     */
    const _Game_CharacterBase_pattern = Game_CharacterBase.prototype.pattern;
    Game_CharacterBase.prototype.pattern = function() {
        let characterName = null;
        try {
            characterName = this.characterName ? this.characterName() : null;
        } catch (e) {
            // characterName() might not exist in all contexts
        }
        
        if (characterName && characterName.startsWith('$')) {
            const frameData = parseFrameData(characterName);
            
            if (frameData) {
                const animType = getAnimationType(this);
                const direction = getDirectionName(this.direction());
                const animKey = animType + direction;
                const animation = frameData.animations[animKey];
                
                if (animation && animation.length > 0) {
                    // Switch to animation (resets pattern if animation changed)
                    switchToAnimation(this, animKey, animation);
                    
                    // Return pattern within animation frame count
                    return this._pattern < animation.length ? this._pattern : 0;
                }
            }
        }
        
        // Default behavior
        return _Game_CharacterBase_pattern.call(this);
    };

    /**
     * Override isOriginalPattern so that JSON-animated characters
     * never "settle" on the original frame -- this keeps
     * updateAnimationCount incrementing even while idle.
     */
    const _Game_CharacterBase_isOriginalPattern = Game_CharacterBase.prototype.isOriginalPattern;
    Game_CharacterBase.prototype.isOriginalPattern = function() {
        let characterName = null;
        try {
            characterName = this.characterName ? this.characterName() : null;
        } catch (e) {}
        if (characterName && characterName.startsWith('$') && parseFrameData(characterName)) {
            return false;
        }
        return _Game_CharacterBase_isOriginalPattern.call(this);
    };

    /**
     * Override Game_CharacterBase.resetPattern
     */
    const _Game_CharacterBase_resetPattern = Game_CharacterBase.prototype.resetPattern;
    Game_CharacterBase.prototype.resetPattern = function() {
        let characterName = null;
        try {
            characterName = this.characterName ? this.characterName() : null;
        } catch (e) {
            // characterName() might not exist in all contexts
        }
        
        if (characterName && characterName.startsWith('$')) {
            const frameData = parseFrameData(characterName);
            
            if (frameData) {
                // Reset to first frame (pattern 0)
                this._pattern = 0;
                this._lastJsonAnimKey = null; // Reset animation tracking
                this._jsonPostRunPrevAnimType = null;
                this._jsonPostRunIdleStartFrame = null;
                this._jsonPostRunHoldFrames = 0;
                this._jsonPostRunEaseFrames = 0;
                this._jsonRunSegmentFrames = 0;
                this._jsonRunDurPrevType = null;
                return;
            }
        }
        
        // Default behavior
        _Game_CharacterBase_resetPattern.call(this);
    };

    /**
     * Override Game_CharacterBase.animationWait to apply speed modifiers.
     * Idle, walk, and run use the same formula: wait = max(1, round(15 / jsonPatSpd))
     * so small multipliers can slow below the engine default wait.
     */
    const _Game_CharacterBase_animationWait = Game_CharacterBase.prototype.animationWait;
    Game_CharacterBase.prototype.animationWait = function() {
        let characterName = null;
        try {
            characterName = this.characterName ? this.characterName() : null;
        } catch (e) {
            // characterName() might not exist in all contexts
        }
        
        if (!characterName || !characterName.startsWith('$')) {
            return _Game_CharacterBase_animationWait.call(this);
        }
        const frameData = parseFrameData(characterName);
        if (!frameData) return _Game_CharacterBase_animationWait.call(this);
        const animType = getAnimationType(this);
        const direction = getDirectionName(this.direction());
        const animKey = animType + direction;
        const animation = frameData.animations[animKey];
        if (!animation || animation.length === 0) return _Game_CharacterBase_animationWait.call(this);
        const modifier = SPEED_MODIFIERS[animKey];
        let jsonPatSpd = 0;
        if (modifier) {
            try {
                const f = animation.length;
                jsonPatSpd = eval(modifier);
            } catch (e) {}
        }

        const prevAnim = this._jsonPostRunPrevAnimType;
        if (prevAnim === 'run' && animType === 'idle') {
            const segFrames = this._jsonRunSegmentFrames || 0;
            this._jsonRunSegmentFrames = 0;
            if (POST_RUN_IDLE_BOOST_CL > 1.0001) {
                const minFrames =
                    POST_RUN_MIN_RUN_SEC_CL > 0
                        ? Math.round(POST_RUN_MIN_RUN_SEC_CL * 60)
                        : 0;
                const minOk = minFrames === 0 || segFrames >= minFrames;
                if (minOk) {
                    this._jsonPostRunIdleStartFrame = Graphics.frameCount;
                    this._jsonPostRunHoldFrames = Math.round(POST_RUN_HOLD_SEC_CL * 60);
                    this._jsonPostRunEaseFrames = Math.max(
                        1,
                        Math.round(POST_RUN_IDLE_RECOVERY_SEC * 60)
                    );
                }
            }
        }
        if (animType !== 'idle') {
            this._jsonPostRunIdleStartFrame = null;
            this._jsonPostRunHoldFrames = 0;
            this._jsonPostRunEaseFrames = 0;
        }
        if (
            animType === 'idle' &&
            jsonPatSpd > 0 &&
            POST_RUN_IDLE_BOOST_CL > 1.0001
        ) {
            const start = this._jsonPostRunIdleStartFrame;
            const holdF = this._jsonPostRunHoldFrames || 0;
            const easeF = this._jsonPostRunEaseFrames || 0;
            if (start != null && holdF + easeF > 0) {
                const elapsed = Graphics.frameCount - start;
                const total = holdF + easeF;
                if (elapsed < total) {
                    let mult = 1;
                    if (elapsed < holdF) {
                        mult = POST_RUN_IDLE_BOOST_CL;
                    } else {
                        const t = (elapsed - holdF) / easeF;
                        mult =
                            POST_RUN_IDLE_BOOST_CL +
                            (1 - POST_RUN_IDLE_BOOST_CL) * t;
                    }
                    jsonPatSpd *= mult;
                } else {
                    this._jsonPostRunIdleStartFrame = null;
                    this._jsonPostRunHoldFrames = 0;
                    this._jsonPostRunEaseFrames = 0;
                }
            }
        }
        this._jsonPostRunPrevAnimType = animType;

        if (jsonPatSpd > 0) {
            return Math.max(1, Math.round(15 / jsonPatSpd));
        }
        if (animType === 'idle') {
            return 15;
        }
        return _Game_CharacterBase_animationWait.call(this);
    };

    /**
     * Override Game_CharacterBase.update to reset pattern when truly stopped
     */
    const _Game_CharacterBase_update = Game_CharacterBase.prototype.update;
    Game_CharacterBase.prototype.update = function() {
        _Game_CharacterBase_update.call(this);
        
        // Check if character uses JSON frames
        let characterName = null;
        try {
            characterName = this.characterName ? this.characterName() : null;
        } catch (e) {
            // characterName() might not exist in all contexts
        }
        
        if (characterName && characterName.startsWith('$')) {
            const frameData = parseFrameData(characterName);
            
            if (frameData) {
                // Only reset to idle when character just stopped moving
                // Use justStoppedMoving() for edge detection (fires exactly once)
                if (this.justStoppedMoving()) {
                    // Set flag to force idle until actually moving again
                    this._forceIdleUntilMoving = true;
                    
                    // Immediately switch to idle animation for current direction
                    const direction = getDirectionName(this.direction());
                    const idleKey = 'idle' + direction;
                    const idleAnimation = frameData.animations[idleKey];
                    
                    if (idleAnimation && idleAnimation.length > 0) {
                        // Force switch to idle animation (resets pattern to 0)
                        this._lastJsonAnimKey = null; // Force animation change detection
                        switchToAnimation(this, idleKey, idleAnimation);
                    } else {
                        // No idle animation, reset everything
                        this._pattern = 0;
                        this._lastJsonAnimKey = null;
                        this._jsonFrameCount = null;
                        this._jsonAnimKey = null;
                        this._jsonPatSpd = 0;
                    }
                }

                // Contiguous run length (frames @ 60Hz) for post-run min gate (animationWait reads on run→idle)
                const curAnim = getAnimationType(this);
                if (curAnim === 'run') {
                    this._jsonRunSegmentFrames = (this._jsonRunSegmentFrames || 0) + 1;
                } else if (this._jsonRunDurPrevType === 'run' && curAnim === 'walk') {
                    this._jsonRunSegmentFrames = 0;
                }
                this._jsonRunDurPrevType = curAnim;
            }
        }
    };

})();

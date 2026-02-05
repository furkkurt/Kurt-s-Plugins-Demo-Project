//=============================================================================
// KurtsInteractionRangePlugin.js
//=============================================================================
/*:
 * @plugindesc v2.1.0 Expands event interaction area with directional ranges
 * @author Furkan Kurt
 *
 * @param Enable Debug
 * @text Enable Debug Logging
 * @desc Enable console logging for debugging. Turn OFF in production.
 * @type boolean
 * @default false
 *
 * @param Icon Image
 * @text Icon Image Name
 * @desc Name of the icon image file (without extension). Place in img/system/. Default: interact
 * @default interact
 *
 * @param Icon Offset Y
 * @text Icon Y Offset
 * @desc Vertical offset of the icon above the player (in pixels). Negative values move it up.
 * @type number
 * @default -6
 *
 * @param Interaction Origin %
 * @text Interaction Origin (% of sprite height)
 * @desc Adjusts interaction feel: 50 = middle of sprite (default), 100 = feet (vanilla), 0 = top. Ranges are still tile-based for correct directional behavior.
 * @type number
 * @min 0
 * @max 100
 * @default 50
 *
 * @help
 * ============================================================================
 * Kurts Interaction Range Plugin
 * ============================================================================
 *
 * This plugin expands the interaction area of events with directional ranges.
 * It uses a high-performance range-checking system that scales to hundreds
 * of events without performance issues.
 *
 * USAGE:
 * ------
 * Add this note tag to your event's Note box:
 *
 *   <interactionRange:2222>
 *
 * FORMAT:
 * -------
 * <interactionRange:URDL[directions]>
 *
 * Where:
 *   U = Up range (tiles)
 *   R = Right range (tiles)
 *   D = Down range (tiles)
 *   L = Left range (tiles)
 *   [directions] = Optional: u, d, l, r (or combination like lu, ud, etc.)
 *
 * The digits are in order: Up, Right, Down, Left
 *
 * DIRECTION REQUIREMENTS:
 * -----------------------
 * After the 4 range digits, you can optionally specify which direction(s) the
 * player must be facing for the icon to show:
 *
 *   <interactionRange:0000>     - No direction check (icon shows regardless of facing)
 *   <interactionRange:0000l>    - Icon only shows when player faces left
 *   <interactionRange:0000lu>   - Icon shows when player faces left OR up
 *   <interactionRange:2222ud>   - Icon shows when player faces up OR down
 *
 * ICON DISPLAY:
 * -------------
 * By default, all events with an interaction range will show an interaction icon.
 * To hide the icon on a specific event page, add this comment to that page:
 *
 *   <noInteractIcon>
 *
 * This allows you to show/hide the icon based on which event page is active.
 *
 * EXAMPLES:
 * ---------
 * <interactionRange:2222>      - 2 tiles in all directions, icon shown by default
 * <interactionRange:2222l>     - 2 tiles in all directions, icon only when facing left
 * <interactionRange:4112lu>    - 4 up, 1 right, 1 down, 2 left, icon when facing left or up
 * <interactionRange:0000>      - No interaction range
 * <interactionRange:5000u>      - 5 tiles up only, icon only when facing up
 *
 * TRIGGERS:
 * ---------
 * Works with all event trigger types:
 * - Action Button (0)
 * - Player Touch (1)
 * - Event Touch (2)
 *
 * NOTES:
 * ------
 * - Only one event sprite is displayed (no duplication)
 * - Works with all event trigger types
 * - High performance - scales to hundreds of events
 * - No memory overhead - no clones created
 * - Safe for save/load
 * - Directional ranges allow asymmetric interaction zones
 *
 * ============================================================================
 */

(() => {
    'use strict';

    const parameters = PluginManager.parameters('KurtsInteractionRangePlugin');
    const ENABLE_DEBUG = parameters['Enable Debug'] === 'true';
    const ICON_IMAGE = parameters['Icon Image'] || 'interact';
    const ICON_OFFSET_Y = Number(parameters['Icon Offset Y']) || -6;
    const INTERACTION_ORIGIN_PERCENT = Number(parameters['Interaction Origin %'] || 50) / 100;

    /**
     * Debug logging helper
     */
    function debugLog(...args) {
        if (ENABLE_DEBUG) {
            console.log('[KurtsInteractionRange]', ...args);
        }
    }


    /**
     * Check if event page has <noInteractIcon> comment
     * @param {Game_Event} event - The game event
     * @returns {boolean} True if the current page has <noInteractIcon> comment
     */
    function hasNoInteractIconComment(event) {
        if (!event || event._pageIndex < 0) return false;
        
        try {
            const page = event.page();
            if (!page || !page.list) return false;
            
            // Check all commands in the page list for comment commands
            for (const command of page.list) {
                // Comment commands: 108 = single line, 408 = continuation
                if (command.code === 108 || command.code === 408) {
                    const commentText = command.parameters[0] || '';
                    if (commentText.includes('<noInteractIcon>')) {
                        return true;
                    }
                }
            }
        } catch (e) {
            // If page is not available, return false
            return false;
        }
        
        return false;
    }

    /**
     * Convert direction letter to direction number
     * @param {string} letter - Direction letter (u, d, l, r)
     * @returns {number} Direction number (2=down, 4=left, 6=right, 8=up)
     */
    function directionLetterToNumber(letter) {
        const dir = letter.toLowerCase();
        if (dir === 'u') return 8; // up
        if (dir === 'd') return 2; // down
        if (dir === 'l') return 4; // left
        if (dir === 'r') return 6; // right
        return 0;
    }

    /**
     * Parse interaction range from event note tag
     * Format: <interactionRange:URDL[directions]> where U=up, R=right, D=down, L=left
     * Optional directions: u, d, l, r (or combination)
     * @param {Game_Event} event - The game event
     * @returns {Object|null} Object with up, right, down, left, requiredDirections properties, or null if not found
     */
    function parseInteractionRange(event) {
        if (!event || !event.event()) return null;
        
        const eventData = event.event();
        const note = eventData.note || '';
        
        // Try to get from meta first (RPG Maker MZ extracts metadata)
        if (eventData.meta && eventData.meta.interactionRange) {
            const metaValue = eventData.meta.interactionRange;
            const match = metaValue.match(/^(\d)(\d)(\d)(\d)([udlr]*)$/i);
            if (match) {
                const requiredDirections = match[5] ? match[5].split('').map(directionLetterToNumber).filter(d => d > 0) : null;
                return {
                    up: Number(match[1]),
                    right: Number(match[2]),
                    down: Number(match[3]),
                    left: Number(match[4]),
                    requiredDirections: requiredDirections
                };
            }
        }
        
        // Fallback: parse from note directly
        const match = note.match(/<interactionRange:(\d)(\d)(\d)(\d)([udlr]*)>/i);
        if (match) {
            const requiredDirections = match[5] ? match[5].split('').map(directionLetterToNumber).filter(d => d > 0) : null;
            return {
                up: Number(match[1]),
                right: Number(match[2]),
                down: Number(match[3]),
                left: Number(match[4]),
                requiredDirections: requiredDirections
            };
        }
        
        return null;
    }

    /**
     * Check if player is within rectangular interaction range of event
     * Uses rectangle logic: player must be within bounds on BOTH axes
     * Range calculation is tile-based for correct directional behavior
     * Sprite origin is applied as a bias for better visual feel
     * @param {Game_Player} player - The player
     * @param {Game_Event} event - The event
     * @param {Object} range - Object with up, right, down, left properties
     * @returns {boolean} True if player is within range
     */
    function isPlayerInInteractionRange(player, event, range) {
        if (!player || !event || !range) return false;
        
        // TILE-BASED deltas (feet-to-feet) - this preserves directional meaning
        const dx = player.x - event.x; // + = player right of event, - = player left of event
        const dy = player.y - event.y; // + = player below event, - = player above event
        
        // Apply sprite origin bias for better visual feel
        // originBias: 50% → -0.5 tiles (check slightly higher than feet)
        //             100% → 0.0 tiles (vanilla behavior, feet-to-feet)
        //             0% → -1.0 tiles (check at top of sprite)
        const originBias = INTERACTION_ORIGIN_PERCENT - 1.0;
        const dyAdjusted = dy + originBias;
        
        // Rectangle check: player must be within bounds on both axes
        // dx must be between -left and +right
        // dyAdjusted must be between -up and +down
        return (
            dx >= -range.left && dx <= range.right &&
            dyAdjusted >= -range.up && dyAdjusted <= range.down
        );
    }

    /**
     * Check if player direction matches required directions
     * @param {Game_Player} player - The player
     * @param {Array<number>|null} requiredDirections - Array of direction numbers, or null if no requirement
     * @returns {boolean} True if direction matches (or no requirement)
     */
    function checkPlayerDirection(player, requiredDirections) {
        // If no direction requirement, always return true
        if (!requiredDirections || requiredDirections.length === 0) {
            return true;
        }
        
        // Check if player's current direction matches any required direction
        const playerDir = player.direction();
        return requiredDirections.includes(playerDir);
    }

    /**
     * Update the interaction prompt icon flag
     * Checks for any interactable event in range (icon shown by default unless <noInteractIcon> comment exists)
     * Also checks direction requirements if specified in the tag
     * @param {Game_Player} player - The player
     */
    function updateInteractionPrompt(player) {
        if (!player || !$gameMap || !$gameMap.events || $gameMap.isEventRunning()) {
            if (player) {
                player._hasInteractPrompt = false;
            }
            return;
        }
        
        // Reset flag
        player._hasInteractPrompt = false;
        
        // Check all events for any interactable trigger (0=Action Button, 1=Player Touch, 2=Event Touch)
        const allTriggers = [0, 1, 2];
        const events = $gameMap.events();
        
        for (const event of events) {
            if (!event || !event.event() || event.isStarting()) continue;
            
            const range = parseInteractionRange(event);
            if (!range) continue; // Skip events without range tag
            
            // Skip if this page has <noInteractIcon> comment
            if (hasNoInteractIconComment(event)) continue;
            
            // Check if player is in range
            if (!isPlayerInInteractionRange(player, event, range)) continue;
            
            // Check if player direction matches requirement (if any)
            if (!checkPlayerDirection(player, range.requiredDirections)) continue;
            
            // Check if event has an interactable trigger
            if (event.isTriggerIn(allTriggers)) {
                player._hasInteractPrompt = true;
                break; // Found one, no need to check more
            }
        }
    }

    /**
     * Check for events within range and trigger them
     * @param {Game_Player} player - The player
     * @param {Array<number>} triggers - Trigger types to check
     */
    function checkEventsInRange(player, triggers) {
        if (!$gameMap || !$gameMap.events || $gameMap.isEventRunning()) {
            // Reset icon flag if map is not ready or event is running
            if (player) {
                player._hasInteractPrompt = false;
            }
            return;
        }
        
        // Update interaction prompt icon (checks all trigger types)
        updateInteractionPrompt(player);
        
        const events = $gameMap.events();
        let eventsChecked = 0;
        let eventsInRange = 0;
        let eventsTriggered = 0;
        
        for (const event of events) {
            if (!event || !event.event() || event.isStarting()) continue;
            
            const range = parseInteractionRange(event);
            if (!range) continue; // Skip events without range tag
            
            eventsChecked++;
            
            // Check if player is within range
            if (isPlayerInInteractionRange(player, event, range)) {
                eventsInRange++;
                
                const eventId = event.eventId();
                const eventTrigger = event._trigger;
                const isTriggerMatch = event.isTriggerIn(triggers);
                const isAnyEventStarting = $gameMap.isAnyEventStarting();
                const priorityType = event._priorityType;
                
                debugLog(`Event ${eventId} in range: trigger=${eventTrigger}, isTriggerMatch=${isTriggerMatch}, priorityType=${priorityType}, isAnyEventStarting=${isAnyEventStarting}, triggers=[${triggers.join(',')}], range=U${range.up}R${range.right}D${range.down}L${range.left}`);
                
                // Check if event matches trigger (ignore priority for range-based events)
                if (isTriggerMatch) {
                    if (!isAnyEventStarting) {
                        eventsTriggered++;
                        debugLog('Triggering event', eventId, 'at range U' + range.up + 'R' + range.right + 'D' + range.down + 'L' + range.left);
                        event.start();
                        return; // Only trigger one event at a time
                    } else {
                        debugLog('Event', eventId, 'not triggered - another event is starting');
                    }
                } else {
                    debugLog('Event', eventId, 'not triggered - trigger mismatch');
                }
            }
        }
        
        if (ENABLE_DEBUG && eventsChecked > 0) {
            debugLog('Checked', eventsChecked, 'events,', eventsInRange, 'in range,', eventsTriggered, 'triggered');
        }
    }

    // Override checkEventTriggerThere to include range-based events
    const _Game_Player_checkEventTriggerThere = Game_Player.prototype.checkEventTriggerThere;
    Game_Player.prototype.checkEventTriggerThere = function(triggers) {
        // Check for range-based events FIRST (before normal check)
        // This allows range-based events to take priority
        if (this.canStartLocalEvents() && !$gameMap.isEventRunning()) {
            const hadEventStarting = $gameMap.isAnyEventStarting();
            checkEventsInRange(this, triggers);
            // If we triggered a range-based event, don't check normal events
            if ($gameMap.isAnyEventStarting() && !hadEventStarting) {
                return;
            }
        }
        
        // Call original function (normal behavior)
        _Game_Player_checkEventTriggerThere.call(this, triggers);
    };

    // Override checkEventTriggerTouch to include range-based events
    const _Game_Player_checkEventTriggerTouch = Game_Player.prototype.checkEventTriggerTouch;
    Game_Player.prototype.checkEventTriggerTouch = function(x, y) {
        // Call original function first (normal behavior)
        _Game_Player_checkEventTriggerTouch.call(this, x, y);
        
        // Then check for range-based events
        if (this.canStartLocalEvents() && !$gameMap.isAnyEventStarting()) {
            checkEventsInRange(this, [1, 2]);
        }
    };

    // Override Game_Event.checkEventTriggerTouch to handle range-based player touch
    const _Game_Event_checkEventTriggerTouch = Game_Event.prototype.checkEventTriggerTouch;
    Game_Event.prototype.checkEventTriggerTouch = function(x, y) {
        // Call original function first
        _Game_Event_checkEventTriggerTouch.call(this, x, y);
        
        // Check if this event has interaction range
        const range = parseInteractionRange(this);
        if (range) {
            // Check if player is within range
            if (isPlayerInInteractionRange($gamePlayer, this, range)) {
                if (!$gameMap.isEventRunning()) {
                    if (this._trigger === 2 && !this.isJumping() && this.isNormalPriority()) {
                        debugLog('Event touch triggered for event', this.eventId(), 'at range U' + range.up + 'R' + range.right + 'D' + range.down + 'L' + range.left);
                        this.start();
                    }
                }
            }
        }
    };

    // ============================================================================
    // Interaction Icon Rendering
    // ============================================================================
    
    // Override Spriteset_Map.createLowerLayer to add interaction icon after tilemap is created
    const _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _Spriteset_Map_createLowerLayer.call(this);
        // Create icon after tilemap is created
        this.createInteractIcon();
    };

    /**
     * Create the interaction icon sprite
     */
    Spriteset_Map.prototype.createInteractIcon = function() {
        if (this._interactIcon) return; // Already created
        
        this._interactIcon = new Sprite(ImageManager.loadSystem(ICON_IMAGE));
        this._interactIcon.anchor.set(0.5, 1); // Center horizontally, anchor at bottom
        this._interactIcon.visible = false;
        this._interactIcon.opacity = 0; // Start invisible for fade-in
        this._interactIcon.z = 7; // Above balloons (z=7) but below animations
        
        // Animation state
        this._interactIcon._animFrame = 0;
        this._interactIcon._wasVisible = false;
        this._interactIcon._baseY = 0;
        this._interactIcon._animState = 'idle'; // 'fadeIn', 'fadeOut', 'idle'
        
        // Add to tilemap so it follows camera correctly
        if (this._tilemap) {
            this._tilemap.addChild(this._interactIcon);
        }
    };

    // Override Spriteset_Map.update to update interaction icon
    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        this.updateInteractIcon();
    };

    /**
     * Update the interaction icon position and visibility with animation
     */
    Spriteset_Map.prototype.updateInteractIcon = function() {
        if (!this._interactIcon) return;

        const player = $gamePlayer;
        if (!player) {
            this._interactIcon.visible = false;
            this._interactIcon.opacity = 0;
            this._interactIcon._wasVisible = false;
            this._interactIcon._animState = 'idle';
            return;
        }

        // Update the interaction prompt flag continuously
        updateInteractionPrompt(player);

        // Show/hide icon based on the interaction prompt flag
        const shouldShow = !!(player._hasInteractPrompt && !$gameMap.isEventRunning());
        
        // Check if icon just appeared (was hidden, now visible)
        const justAppeared = shouldShow && !this._interactIcon._wasVisible;
        // Check if icon just disappeared (was visible, now hidden)
        const justDisappeared = !shouldShow && this._interactIcon._wasVisible;
        
        if (justAppeared) {
            // Start fade-in animation
            this._interactIcon._animFrame = 0;
            this._interactIcon._animState = 'fadeIn';
            this._interactIcon.visible = true;
        } else if (justDisappeared) {
            // Start fade-out animation
            this._interactIcon._animFrame = 0;
            this._interactIcon._animState = 'fadeOut';
            // Keep visible during fade-out
            this._interactIcon.visible = true;
        }
        
        this._interactIcon._wasVisible = shouldShow;

        // Find the player's sprite
        const playerSprite = this._characterSprites.find(
            sprite => sprite._character === player
        );
        
        if (!playerSprite) {
            this._interactIcon.visible = false;
            return;
        }

        // Position icon at top center of character sprite
        // sprite.y is at bottom (feet), sprite.height is full height
        // So top is: sprite.y - sprite.height
        const topY = playerSprite.y - playerSprite.height;
        this._interactIcon._baseY = topY + ICON_OFFSET_Y;
        
        // Always center horizontally on sprite
        this._interactIcon.x = playerSprite.x;

        // Handle animations
        const animFrames = 20; // Total animation frames
        const fadeFrames = 10; // Fade duration
        
        if (this._interactIcon._animState === 'fadeIn') {
            // Fade-in and jump animation
            const frame = this._interactIcon._animFrame;
            
            if (frame < animFrames) {
                // Fade-in: 0 to 255 over fadeFrames
                if (frame < fadeFrames) {
                    this._interactIcon.opacity = Math.floor((frame / fadeFrames) * 255);
                } else {
                    this._interactIcon.opacity = 255;
                }
                
                // Jump animation: bounce up and settle
                const jumpHeight = 8 * Math.sin((frame / animFrames) * Math.PI);
                this._interactIcon.y = this._interactIcon._baseY - jumpHeight;
                
                this._interactIcon._animFrame++;
            } else {
                // Animation complete
                this._interactIcon.opacity = 255;
                this._interactIcon.y = this._interactIcon._baseY;
                this._interactIcon._animState = 'idle';
            }
        } else if (this._interactIcon._animState === 'fadeOut') {
            // Fade-out and jump animation
            const frame = this._interactIcon._animFrame;
            
            if (frame < animFrames) {
                // Fade-out: 255 to 0 over fadeFrames
                if (frame < fadeFrames) {
                    this._interactIcon.opacity = Math.floor(255 - (frame / fadeFrames) * 255);
                } else {
                    this._interactIcon.opacity = 0;
                }
                
                // Jump animation: bounce up (reverse of fade-in)
                const jumpHeight = 8 * Math.sin((frame / animFrames) * Math.PI);
                this._interactIcon.y = this._interactIcon._baseY - jumpHeight;
                
                this._interactIcon._animFrame++;
            } else {
                // Animation complete, hide icon
                this._interactIcon.opacity = 0;
                this._interactIcon.visible = false;
                this._interactIcon._animState = 'idle';
            }
        } else {
            // Idle state - no animation, stay at base position
            if (shouldShow) {
                this._interactIcon.opacity = 255;
                this._interactIcon.y = this._interactIcon._baseY;
                this._interactIcon.visible = true;
            } else {
                this._interactIcon.visible = false;
                this._interactIcon.opacity = 0;
            }
        }
    };

    // Initialize debug logging
    if (ENABLE_DEBUG) {
        debugLog('Plugin loaded. Icon Image:', ICON_IMAGE);
    }

})();

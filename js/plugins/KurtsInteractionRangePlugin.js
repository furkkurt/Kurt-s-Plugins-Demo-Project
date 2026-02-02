//=============================================================================
// KurtsInteractionRangePlugin.js
//=============================================================================
/*:
 * @plugindesc v1.0.0 Expands event interaction area without duplicating visuals
 * @author Furkan Kurt
 *
 * @param Default Range
 * @text Default Interaction Range
 * @desc Default interaction range for events (if not specified in note tag). Set to 0 to disable default.
 * @type number
 * @min 0
 * @max 20
 * @default 4
 *
 * @param Enable Debug
 * @text Enable Debug Logging
 * @desc Enable console logging for debugging. Turn OFF in production.
 * @type boolean
 * @default false
 *
 * @help
 * ============================================================================
 * Kurts Interaction Range Plugin
 * ============================================================================
 *
 * This plugin expands the interaction area of events without creating clones.
 * It uses a high-performance range-checking system that scales to hundreds
 * of events without performance issues.
 *
 * USAGE:
 * ------
 * Add this note tag to your event's Note box:
 *
 *   <interactionRange:4>
 *
 * This creates an interaction area of 4 tiles in each direction (9x9 grid).
 * If no note tag is specified, the Default Range parameter will be used.
 *
 * EXAMPLES:
 * ---------
 * <interactionRange:2>  - 2 tile radius (5x5 area)
 * <interactionRange:4>  - 4 tile radius (9x9 area)
 * <interactionRange:8>  - 8 tile radius (17x17 area)
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
 *
 * ============================================================================
 */

(() => {
    'use strict';

    const parameters = PluginManager.parameters('KurtsInteractionRangePlugin');
    const DEFAULT_RANGE = Number(parameters['Default Range']) || 0;
    const ENABLE_DEBUG = parameters['Enable Debug'] === 'true';

    /**
     * Debug logging helper
     */
    function debugLog(...args) {
        if (ENABLE_DEBUG) {
            console.log('[KurtsInteractionRange]', ...args);
        }
    }

    /**
     * Get interaction range from event note tag or use default
     * @param {Game_Event} event - The game event
     * @returns {number} Interaction range, or 0 if not set
     */
    function getInteractionRange(event) {
        if (!event || !event.event()) return 0;
        
        const eventData = event.event();
        let range = 0;
        
        // Try to get from meta first (RPG Maker MZ extracts metadata)
        if (eventData.meta && eventData.meta.interactionRange) {
            range = Number(eventData.meta.interactionRange);
            if (!isNaN(range) && range > 0) {
                return range;
            }
        }
        
        // Fallback: parse from note directly
        const note = eventData.note || '';
        const match = note.match(/<interactionRange:(\d+)>/i);
        if (match) {
            range = Number(match[1]);
            if (!isNaN(range) && range > 0) {
                return range;
            }
        }
        
        // Use default range if no note tag found
        if (DEFAULT_RANGE > 0) {
            return DEFAULT_RANGE;
        }
        
        return 0;
    }

    /**
     * Check if player is within interaction range of event
     * @param {Game_Player} player - The player
     * @param {Game_Event} event - The event
     * @param {number} range - Interaction range
     * @returns {boolean} True if player is within range
     */
    function isPlayerInRange(player, event, range) {
        if (!player || !event || range <= 0) return false;
        
        const dx = Math.abs(player.x - event.x);
        const dy = Math.abs(player.y - event.y);
        
        return dx <= range && dy <= range;
    }

    /**
     * Check for events within range and trigger them
     * @param {Game_Player} player - The player
     * @param {Array<number>} triggers - Trigger types to check
     */
    function checkEventsInRange(player, triggers) {
        if (!$gameMap || !$gameMap.events || $gameMap.isEventRunning()) return;
        
        const events = $gameMap.events();
        let eventsChecked = 0;
        let eventsInRange = 0;
        let eventsTriggered = 0;
        
        for (const event of events) {
            if (!event || !event.event() || event.isStarting()) continue;
            
            const range = getInteractionRange(event);
            if (range <= 0) continue; // Skip events without range
            
            eventsChecked++;
            
            // Check if player is within range
            if (isPlayerInRange(player, event, range)) {
                eventsInRange++;
                
                const eventId = event.eventId();
                const eventTrigger = event._trigger;
                const isTriggerMatch = event.isTriggerIn(triggers);
                const isAnyEventStarting = $gameMap.isAnyEventStarting();
                const priorityType = event._priorityType;
                
                debugLog(`Event ${eventId} in range: trigger=${eventTrigger}, isTriggerMatch=${isTriggerMatch}, priorityType=${priorityType}, isAnyEventStarting=${isAnyEventStarting}, triggers=[${triggers.join(',')}]`);
                
                // Check if event matches trigger (ignore priority for range-based events)
                if (isTriggerMatch) {
                    if (!isAnyEventStarting) {
                        eventsTriggered++;
                        debugLog('Triggering event', eventId, 'at range', range);
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
        const range = getInteractionRange(this);
        if (range > 0) {
            // Check if player is within range
            if (isPlayerInRange($gamePlayer, this, range)) {
                if (!$gameMap.isEventRunning()) {
                    if (this._trigger === 2 && !this.isJumping() && this.isNormalPriority()) {
                        debugLog('Event touch triggered for event', this.eventId(), 'at range', range);
                        this.start();
                    }
                }
            }
        }
    };

    // Initialize debug logging
    if (ENABLE_DEBUG) {
        debugLog('Plugin loaded. Default Range:', DEFAULT_RANGE);
    }

})();

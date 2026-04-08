//=============================================================================
// KurtsKeyMapper.js
//=============================================================================
/*:
 * @plugindesc v2.0.0 Customizable keyboard controls with runtime support
 * @author Furkan Kurt
 *
 * @param Action Button
 * @text Action Button Key
 * @desc Default action key
 * @type select
 * @option Mouse Click (Default)
 * @value mouse
 * @option Enter
 * @value enter
 * @option E
 * @value e
 * @option Space
 * @value space
 * @default mouse
 *
 * @param Movement Keys
 * @text Movement Keys
 * @desc Default movement key layout
 * @type select
 * @option Arrow Keys (Default)
 * @value arrows
 * @option WASD
 * @value wasd
 * @default arrows
 *
 * @help
 * ============================================================================
 * Kurts Key Mapper Plugin v2.0
 * ============================================================================
 *
 * Customizable keyboard controls. Settings can be changed at runtime
 * via the options menu (KurtsOptionsMenu plugin).
 *
 * ACTION BUTTON: Mouse Click, Enter, E, or Space
 * MOVEMENT KEYS: Arrow Keys or WASD
 *
 * Mouse click for actions always works regardless of action key setting.
 *
 * TEXT CODES (use in message boxes):
 *   [movementKeys] or \MOVEMENTKEYS - displays "WASD" or "Arrow Keys" based on settings
 *   [actionKey] or \ACTIONKEY - displays the current action key (Mouse Click, Enter, etc.)
 *
 * ============================================================================
 */

(() => {
    'use strict';

    const parameters = PluginManager.parameters('KurtsKeyMapper');
    const DEFAULT_ACTION = parameters['Action Button'] || 'mouse';
    const DEFAULT_MOVEMENT = parameters['Movement Keys'] || 'arrows';

    // Keycode mappings
    const KEYCODES = {
        enter: 13, e: 69, space: 32,
        w: 87, a: 65, s: 83, d: 68,
        arrowUp: 38, arrowDown: 40, arrowLeft: 37, arrowRight: 39
    };

    // Store the original key mapper state (RPG Maker defaults)
    const ORIGINAL_KEYMAP = Object.assign({}, Input.keyMapper);

    // Initialize ConfigManager properties
    if (ConfigManager.actionButton === undefined) {
        ConfigManager.actionButton = DEFAULT_ACTION;
    }
    if (ConfigManager.movementKeys === undefined) {
        ConfigManager.movementKeys = DEFAULT_MOVEMENT;
    }

    /**
     * Apply key mappings based on current ConfigManager settings.
     * Called on startup and whenever settings change.
     */
    window.KurtsKeyMapper_apply = function() {
        // Reset to original RPG Maker defaults first
        Object.keys(Input.keyMapper).forEach(k => delete Input.keyMapper[k]);
        Object.assign(Input.keyMapper, ORIGINAL_KEYMAP);

        // Remove potential conflicts: clear E, Space from non-ok mappings
        // (they might have old mappings we want to override)
        
        // Apply action button
        const action = ConfigManager.actionButton || DEFAULT_ACTION;
        if (action === 'enter') {
            Input.keyMapper[KEYCODES.enter] = 'ok';
        } else if (action === 'e') {
            Input.keyMapper[KEYCODES.e] = 'ok';
        } else if (action === 'space') {
            Input.keyMapper[KEYCODES.space] = 'ok';
        }
        // 'mouse' = no extra keyboard mapping needed

        // Apply movement keys
        const movement = ConfigManager.movementKeys || DEFAULT_MOVEMENT;
        if (movement === 'wasd') {
            Input.keyMapper[KEYCODES.w] = 'up';
            Input.keyMapper[KEYCODES.a] = 'left';
            Input.keyMapper[KEYCODES.s] = 'down';
            Input.keyMapper[KEYCODES.d] = 'right';
        }
        // 'arrows' = default arrow keys already mapped
    };

    /**
     * Get display text for movement keys (for use in message boxes)
     */
    window.KurtsKeyMapper_movementKeysText = function() {
        const m = ConfigManager.movementKeys || DEFAULT_MOVEMENT;
        return m === 'wasd' ? 'WASD' : 'Arrow Keys';
    };

    /**
     * Get display text for action key (for use in message boxes)
     */
    window.KurtsKeyMapper_actionKeyText = function() {
        const a = ConfigManager.actionButton || DEFAULT_ACTION;
        if (a === 'mouse') return 'Mouse Click';
        if (a === 'enter') return 'Enter';
        if (a === 'e') return 'E';
        if (a === 'space') return 'Space';
        return 'Mouse Click';
    };

    // Hook convertEscapeCharacters to replace [movementKeys], [actionKey], \MOVEMENTKEYS, \ACTIONKEY
    const _Window_Base_convertEscapeCharacters = Window_Base.prototype.convertEscapeCharacters;
    Window_Base.prototype.convertEscapeCharacters = function(text) {
        text = _Window_Base_convertEscapeCharacters.call(this, text);
        text = text.replace(/\[movementKeys\]/gi, KurtsKeyMapper_movementKeysText());
        text = text.replace(/\[actionKey\]/gi, KurtsKeyMapper_actionKeyText());
        text = text.replace(/\x1bMOVEMENTKEYS/gi, KurtsKeyMapper_movementKeysText());
        text = text.replace(/\x1bACTIONKEY/gi, KurtsKeyMapper_actionKeyText());
        return text;
    };

    // Apply on startup
    KurtsKeyMapper_apply();

})();

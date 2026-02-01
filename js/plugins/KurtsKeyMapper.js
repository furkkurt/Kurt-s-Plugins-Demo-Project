//=============================================================================
// KurtsKeyMapper.js
//=============================================================================
/*:
 * @plugindesc v1.0.0 Customizable keyboard controls for action and movement
 * @author Furkan Kurt
 *
 * @param Action Button
 * @text Action Button Key
 * @desc Choose which key triggers actions (mouse click always works)
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
 * @desc Choose movement key layout
 * @type select
 * @option Arrow Keys (Default)
 * @value arrows
 * @option WASD
 * @value wasd
 * @default arrows
 *
 * @help
 * ============================================================================
 * Kurts Key Mapper Plugin
 * ============================================================================
 *
 * This plugin allows you to customize keyboard controls for actions and movement.
 *
 * ACTION BUTTON:
 * -------------
 * Choose which keyboard key triggers actions (talking to NPCs, interacting, etc.)
 * Mouse click always works regardless of this setting.
 * Options: Mouse Click (default), Enter, E, Space
 *
 * MOVEMENT KEYS:
 * -------------
 * Choose between Arrow Keys (default) or WASD for character movement.
 *
 * NOTE:
 * -----
 * - Mouse click for actions always works
 * - Multiple action keys can work simultaneously
 * - Changing settings requires reloading the game
 *
 * ============================================================================
 */

(() => {
    'use strict';

    const parameters = PluginManager.parameters('KurtsKeyMapper');
    const ACTION_BUTTON = parameters['Action Button'] || 'mouse';
    const MOVEMENT_KEYS = parameters['Movement Keys'] || 'arrows';

    // Keycode mappings
    const KEYCODES = {
        enter: 13,
        e: 69,
        space: 32,
        // WASD
        w: 87,
        a: 65,
        s: 83,
        d: 68,
        // Arrow keys (already mapped by default)
        arrowUp: 38,
        arrowDown: 40,
        arrowLeft: 37,
        arrowRight: 39
    };

    // Map action button
    if (ACTION_BUTTON === 'enter') {
        // Enter is already mapped to 'ok' by default, but ensure it's there
        Input.keyMapper[KEYCODES.enter] = 'ok';
    } else if (ACTION_BUTTON === 'e') {
        Input.keyMapper[KEYCODES.e] = 'ok';
    } else if (ACTION_BUTTON === 'space') {
        // Space is already mapped to 'ok' by default, but ensure it's there
        Input.keyMapper[KEYCODES.space] = 'ok';
    }
    // If 'mouse' is selected, no additional keyboard mapping is needed
    // Mouse click works through TouchInput by default

    // Map movement keys
    if (MOVEMENT_KEYS === 'wasd') {
        // Map WASD to movement directions
        Input.keyMapper[KEYCODES.w] = 'up';
        Input.keyMapper[KEYCODES.a] = 'left';
        Input.keyMapper[KEYCODES.s] = 'down';
        Input.keyMapper[KEYCODES.d] = 'right';
        
        // Remove default mappings for W (was pagedown) and Q (was pageup) if needed
        // But keep arrow keys working too for flexibility
    }
    // If 'arrows' is selected, arrow keys are already mapped by default

})();

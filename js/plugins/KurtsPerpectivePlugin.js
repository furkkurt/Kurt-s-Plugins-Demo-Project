//=============================================================================
// KurtsPerpectivePlugin.js
//=============================================================================
/*:
 * @plugindesc v1.0.0 Adds 2.5D perspective effect by scaling characters based on Y position
 * @author Furkan Kurt
 *
 * @param Min Scale
 * @text Minimum Scale (Top of Map)
 * @desc Scale value at the top of the map. Lower values = smaller characters at top. Default: 0.97
 * @type number
 * @decimals 2
 * @default 0.97
 *
 * @param Max Scale
 * @text Maximum Scale (Bottom of Map)
 * @desc Scale value at the bottom of the map. Higher values = larger characters at bottom. Default: 1.03
 * @type number
 * @decimals 2
 * @default 1.03
 *
 * @param Control Point Y
 * @text Control Point Y Position (%)
 * @desc Y position (as percentage 0-100) where the control point is set. Set to -1 to disable control point. Default: -1
 * @type number
 * @decimals 1
 * @min -1
 * @max 100
 * @default -1
 *
 * @param Control Point Scale
 * @text Control Point Scale Value
 * @desc Scale value at the control point. Only used if Control Point Y is set (not -1). Default: 1.0
 * @type number
 * @decimals 2
 * @default 1.0
 *
 * @param Use Screen Based
 * @text Use Screen-Based Scaling
 * @desc If ON, scaling is relative to screen position. If OFF, scaling is relative to map position.
 * @type boolean
 * @default false
 *
 * @help
 * ============================================================================
 * Kurts Perspective Plugin
 * ============================================================================
 *
 * This plugin adds a 2.5D perspective effect by scaling character sprites
 * based on their Y position on the map.
 *
 * CONTROL POINT:
 * -------------
 * Set Control Point Y to a percentage (0-100) to create a two-segment scaling curve:
 * - From top (0%) to control point: interpolates from Min Scale to Control Point Scale
 * - From control point to bottom (100%): interpolates from Control Point Scale to Max Scale
 * Example: Control Point Y = 50, Control Point Scale = 0.5, Min = 0.4, Max = 1.0
 *   - Top half (0-50%): scales from 0.4 to 0.5 (faster change)
 *   - Bottom half (50-100%): scales from 0.5 to 1.0 (slower change)
 * Set Control Point Y to -1 to disable and use simple linear scaling.
 *
 * ============================================================================
 */

(() => {
    'use strict';

    const parameters = PluginManager.parameters('KurtsPerpectivePlugin');
    const MIN_SCALE = Number(parameters['Min Scale']) || 0.97;
    const MAX_SCALE = Number(parameters['Max Scale']) || 1.03;
    const CONTROL_POINT_Y = Number(parameters['Control Point Y']) || -1;
    const CONTROL_POINT_SCALE = Number(parameters['Control Point Scale']) || 1.0;
    const USE_SCREEN_BASED = parameters['Use Screen Based'] === 'true';

    const USE_CONTROL_POINT = CONTROL_POINT_Y >= 0 && CONTROL_POINT_Y <= 100;
    const CONTROL_POINT_T = USE_CONTROL_POINT ? CONTROL_POINT_Y / 100 : 0;

    Sprite_Character.prototype.updatePerspectiveScale = function() {
        if (!this._character || !$gameMap) return;

        let t;

        if (USE_SCREEN_BASED) {
            const screenY = this.y;
            const screenHeight = Graphics.height || 816;
            if (screenHeight <= 0) return;
            t = screenY / screenHeight;
            t = Math.max(0, Math.min(1, t));
        } else {
            if (this._character._realY === undefined || this._character._realY === null) return;
            const tileHeight = $gameMap.tileHeight() || 48;
            const mapHeight = $gameMap.height() || 20;
            if (mapHeight <= 0 || tileHeight <= 0) return;
            
            const mapY = this._character._realY * tileHeight;
            const totalMapHeight = mapHeight * tileHeight;
            t = mapY / totalMapHeight;
            t = Math.max(0, Math.min(1, t));
        }

        let scale;
        if (USE_CONTROL_POINT) {
            if (t <= CONTROL_POINT_T) {
                const segmentT = CONTROL_POINT_T > 0 ? t / CONTROL_POINT_T : 0;
                scale = MIN_SCALE + (CONTROL_POINT_SCALE - MIN_SCALE) * segmentT;
            } else {
                const segmentRange = 1 - CONTROL_POINT_T;
                const segmentT = segmentRange > 0 ? (t - CONTROL_POINT_T) / segmentRange : 0;
                scale = CONTROL_POINT_SCALE + (MAX_SCALE - CONTROL_POINT_SCALE) * segmentT;
            }
        } else {
            scale = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * t;
        }

        this.scale.x = scale;
        this.scale.y = scale;
    };

    const _Sprite_Character_update = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function() {
        _Sprite_Character_update.call(this);
        this.updatePerspectiveScale();
    };

})();

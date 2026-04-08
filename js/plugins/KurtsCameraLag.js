//=============================================================================
// KurtsCameraLag.js
//=============================================================================
/*:
 * @plugindesc v2.0.0 Adds smooth camera lag/easing when following the player
 * @author Furkan Kurt
 *
 * @param Lag Strength
 * @text Camera Lag Strength
 * @desc How fast the camera catches up to the player (0.03 = very slow/dreamlike, 0.15 = cinematic, 0.30 = subtle). Lower = more lag.
 * @type number
 * @min 0.01
 * @max 1.0
 * @decimals 2
 * @default 0.15
 *
 * @param Center Zoom Threshold
 * @text Center Zoom Threshold
 * @desc When zoom is at or below this value, camera freezes and centers map. Above this, camera follows player with lag.
 * @type number
 * @min 0.5
 * @max 2.0
 * @decimals 2
 * @default 1.2
 *
 * @param Player Y Offset
 * @text Player Y Offset
 * @desc Vertical offset for player centering in pixels. Negative = up, Positive = down.
 * @type number
 * @min -100
 * @max 100
 * @default 0
 *
 * @help
 * ============================================================================
 * Kurts Camera Lag Plugin
 * ============================================================================
 *
 * Adds smooth camera lag/easing when following the player.
 * A single Camera Lag value controls both follow lag and transition lag.
 * The value can be changed at runtime via the options menu.
 *
 * ============================================================================
 */

(() => {
    'use strict';

    const parameters = PluginManager.parameters('KurtsCameraLag');
    const DEFAULT_LAG = Number(parameters['Lag Strength'] || 0.15);
    const CENTER_ZOOM_THRESHOLD = Number(parameters['Center Zoom Threshold'] || 1.2);
    const PLAYER_Y_OFFSET = Number(parameters['Player Y Offset'] || 0);

    // Reference resolution — zoom threshold scales with this
    const REFERENCE_WIDTH = 1280;

    // Initialize ConfigManager property with default
    if (ConfigManager.cameraLag === undefined) {
        ConfigManager.cameraLag = DEFAULT_LAG;
    }

    // Store smooth camera position (null = not initialized)
    let camX = null;
    let camY = null;

    // Track previous mode for transition detection
    let previousMode = null;

    // Override Game_Map.setDisplayPos to remove clamping
    const _Game_Map_setDisplayPos = Game_Map.prototype.setDisplayPos;
    Game_Map.prototype.setDisplayPos = function(x, y) {
        this._displayX = x;
        this._displayY = y;
        this._parallaxX = x;
        this._parallaxY = y;
    };

    // Override Game_Player.updateScroll to prevent direct camera modification
    const _Game_Player_updateScroll = Game_Player.prototype.updateScroll;
    Game_Player.prototype.updateScroll = function(lastScrolledX, lastScrolledY) {
        // Intentionally empty — our lag system handles camera following
    };

    // Override Game_Map.updateScroll to add camera lag/easing
    const _Game_Map_updateScroll = Game_Map.prototype.updateScroll;
    Game_Map.prototype.updateScroll = function() {
        if (this.isScrolling()) {
            _Game_Map_updateScroll.call(this);
            camX = this._displayX;
            camY = this._displayY;
            return;
        }

        if (!$gamePlayer) return;

        const tw = this.tileWidth();
        const th = this.tileHeight();
        const viewW = Graphics.width / tw;
        const viewH = Graphics.height / th;
        const zoom = $gameScreen.zoomScale();
        const resScale = Graphics.width / REFERENCE_WIDTH;
        const scaledThreshold = CENTER_ZOOM_THRESHOLD * resScale;
        const currentMode = (zoom <= scaledThreshold) ? 'static' : 'follow';

        let targetX, targetY;

        if (currentMode === 'static') {
            const mapW = this.width();
            const mapH = this.height();
            targetX = (mapW - viewW) / 2;
            targetY = (mapH - viewH) / 2;
        } else {
            const playerX = $gamePlayer._realX + 0.5;
            const playerY = $gamePlayer._realY + 0.5 - (PLAYER_Y_OFFSET / th);
            targetX = playerX - viewW / 2;
            targetY = playerY - viewH / 2;
        }

        previousMode = currentMode;

        if (camX === null) camX = this._displayX;
        if (camY === null) camY = this._displayY;

        // Use the single camera lag value from ConfigManager
        const lag = ConfigManager.cameraLag || DEFAULT_LAG;

        // Smooth interpolation
        camX += (targetX - camX) * lag;
        camY += (targetY - camY) * lag;

        const SNAP_THRESHOLD = 0.0001;
        if (Math.abs(camX - targetX) < SNAP_THRESHOLD) camX = targetX;
        if (Math.abs(camY - targetY) < SNAP_THRESHOLD) camY = targetY;

        this._displayX = Math.round(camX * tw) / tw;
        this._displayY = Math.round(camY * th) / th;
    };

    // Reset camera position when map changes
    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        camX = null;
        camY = null;
        previousMode = null;
    };

})();

//=============================================================================
// KurtsCameraLag.js
//=============================================================================
/*:
 * @plugindesc v1.0.0 Adds smooth camera lag/easing when following the player
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
 * @param Horizontal Lag
 * @text Horizontal Lag Strength
 * @desc Separate lag for horizontal movement. Leave at 0 to use main lag strength. Useful for side-scrolling games.
 * @type number
 * @min 0
 * @max 1.0
 * @decimals 2
 * @default 0
 *
 * @param Vertical Lag
 * @text Vertical Lag Strength
 * @desc Separate lag for vertical movement. Leave at 0 to use main lag strength. Useful for top-down games.
 * @type number
 * @min 0
 * @max 1.0
 * @decimals 2
 * @default 0
 *
 * @help
 * ============================================================================
 * Kurts Camera Lag Plugin
 * ============================================================================
 *
 * This plugin adds smooth camera lag/easing when following the player,
 * creating a more cinematic and intentional feel to movement.
 *
 * FEATURES:
 * --------
 * - Smooth camera interpolation (easing/lerp)
 * - Configurable lag strength
 * - Separate horizontal/vertical lag support
 * - Respects map bounds
 * - Compatible with zoom, parallax, and all camera features
 * - Works with all existing plugins
 *
 * USAGE:
 * ------
 * Simply enable the plugin. The camera will automatically follow the player
 * with a smooth, cinematic delay instead of being hard-locked.
 *
 * RECOMMENDED VALUES:
 * ------------------
 * Lag Strength:
 * - 0.30 = Subtle smoothing (barely noticeable)
 * - 0.15 = Cinematic (recommended default)
 * - 0.08 = Floaty / horror atmosphere
 * - 0.03 = Dreamlike (very slow, may cause motion sickness)
 *
 * SEPARATE AXIS LAG:
 * ------------------
 * If you set Horizontal Lag or Vertical Lag to a value > 0, that axis will
 * use its own lag strength instead of the main Lag Strength.
 *
 * Examples:
 * - Horizontal Lag: 0.12, Vertical Lag: 0.20
 *   → Camera lags more on vertical movement (good for top-down games)
 * - Horizontal Lag: 0.20, Vertical Lag: 0.12
 *   → Camera lags more on horizontal movement (good for side-scrolling)
 *
 * NOTES:
 * ------
 * - Camera lag works with zoom, parallax, and all camera features
 * - Does NOT affect player collision or movement
 * - Respects map boundaries (won't scroll outside map bounds)
 * - Compatible with KurtsMouseWheelZoom plugin
 * - Works with all event triggers and interaction ranges
 * - Smooth interpolation prevents jittery camera movement
 *
 * ============================================================================
 */

(() => {
    'use strict';

    const parameters = PluginManager.parameters('KurtsCameraLag');
    const LAG_STRENGTH = Number(parameters['Lag Strength'] || 0.15);
    const LAG_HORIZONTAL = Number(parameters['Horizontal Lag'] || 0);
    const LAG_VERTICAL = Number(parameters['Vertical Lag'] || 0);

    // Use separate lag values if provided, otherwise use main lag strength
    const LAG_X = LAG_HORIZONTAL > 0 ? LAG_HORIZONTAL : LAG_STRENGTH;
    const LAG_Y = LAG_VERTICAL > 0 ? LAG_VERTICAL : LAG_STRENGTH;

    // Store smooth camera position (null = not initialized)
    let camX = null;
    let camY = null;

    // Override Game_Player.updateScroll to prevent direct camera modification
    // The vanilla function calls scroll functions which directly set _displayX/Y
    // We need to prevent this so our lag system can handle camera movement
    const _Game_Player_updateScroll = Game_Player.prototype.updateScroll;
    Game_Player.prototype.updateScroll = function(lastScrolledX, lastScrolledY) {
        // Don't call the original - it would directly modify camera position
        // Our lag system in Game_Map.updateScroll handles camera following
        // This function is intentionally left empty to prevent vanilla camera behavior
    };

    // Override Game_Map.updateScroll to add camera lag/easing
    const _Game_Map_updateScroll = Game_Map.prototype.updateScroll;
    Game_Map.prototype.updateScroll = function() {
        // Handle programmatic scrolling first (if any)
        if (this.isScrolling()) {
            _Game_Map_updateScroll.call(this);
            // Reset smooth camera position when programmatic scroll happens
            camX = this._displayX;
            camY = this._displayY;
            return;
        }

        // Apply camera lag to normal player following
        if (!$gamePlayer) {
            return;
        }

        const tw = this.tileWidth();
        const th = this.tileHeight();

        // Visible size WITHOUT zoom (important!)
        // _displayX/Y must stay in map tile space, zoom only affects rendering
        const viewW = Graphics.width / tw;
        const viewH = Graphics.height / th;

        // Always follow player in map space
        // Camera should always be centered on player, zoom only changes visible area
        const targetX = $gamePlayer._realX - viewW / 2 + 0.5;
        const targetY = $gamePlayer._realY - viewH / 2 + 0.5;

        // Initialize camera position on first frame
        if (camX === null) {
            camX = targetX;
        }
        if (camY === null) {
            camY = targetY;
        }

        // Smooth interpolation (linear interpolation / lerp)
        // This creates the lag/easing effect
        camX += (targetX - camX) * LAG_X;
        camY += (targetY - camY) * LAG_Y;

        // Clamp camera position to map bounds
        // Only center if map is smaller than screen (can't scroll)
        // Otherwise always follow player
        const mapW = this.width();
        const mapH = this.height();

        // Calculate max camera position (how far camera can scroll)
        const maxX = Math.max(0, mapW - viewW);
        const maxY = Math.max(0, mapH - viewH);

        // Horizontal: Only center if we can't scroll (map smaller than screen)
        if (maxX <= 0) {
            // Map is smaller than screen - center it horizontally
            this._displayX = (mapW - viewW) / 2;
        } else {
            // Map is larger than screen - always follow player with clamping
            this._displayX = Math.max(0, Math.min(camX, maxX));
        }

        // Vertical: Only center if we can't scroll (map smaller than screen)
        if (maxY <= 0) {
            // Map is smaller than screen - center it vertically
            this._displayY = (mapH - viewH) / 2;
        } else {
            // Map is larger than screen - always follow player with clamping
            this._displayY = Math.max(0, Math.min(camY, maxY));
        }
    };

    // Reset camera position when map changes
    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        // Reset smooth camera position when entering a new map
        camX = null;
        camY = null;
    };

})();

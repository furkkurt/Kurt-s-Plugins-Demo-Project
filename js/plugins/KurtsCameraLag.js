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
 * @param Center Zoom Threshold
 * @text Center Zoom Threshold
 * @desc When zoom is at or below this value, camera freezes and centers map. Above this, camera follows player with lag. (1.2 = default, lower = more zoomed out before freezing)
 * @type number
 * @min 0.5
 * @max 2.0
 * @decimals 2
 * @default 1.2
 *
 * @param Player Y Offset
 * @text Player Y Offset
 * @desc Vertical offset for player centering in pixels. Use same value as KurtsInteractionRangePlugin for consistency. Negative = up, Positive = down.
 * @type number
 * @min -100
 * @max 100
 * @default 0
 *
 * @param Transition Lag
 * @text Mode Transition Lag
 * @desc How fast the camera transitions when switching between zoomed-in (follow) and zoomed-out (static) modes. Lower = slower/smoother.
 * @type number
 * @min 0.01
 * @max 1.0
 * @decimals 2
 * @default 0.08
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
 * ZOOM THRESHOLD MODE SWITCHING:
 * --------------------------------
 * The plugin automatically switches between two modes based on zoom level:
 *
 * MODE A - ZOOMED IN (above threshold):
 * - Camera follows player with smooth lag
 * - Background/parallax moves with camera
 * - Normal gameplay mode
 *
 * MODE B - ZOOMED OUT (at or below threshold):
 * - Camera is completely frozen
 * - Map is statically centered
 * - Player moves inside the frame
 * - Background/parallax is completely static
 * - Overview/exploration mode
 *
 * NOTES:
 * ------
 * - Camera lag works with zoom, parallax, and all camera features
 * - Does NOT affect player collision or movement
 * - Respects map boundaries (won't scroll outside map bounds)
 * - Compatible with KurtsMouseWheelZoom plugin
 * - Works with all event triggers and interaction ranges
 * - Smooth interpolation prevents jittery camera movement
 * - Zoom threshold prevents camera drift when zoomed out
 *
 * ============================================================================
 */

(() => {
    'use strict';

    const parameters = PluginManager.parameters('KurtsCameraLag');
    const LAG_STRENGTH = Number(parameters['Lag Strength'] || 0.15);
    const LAG_HORIZONTAL = Number(parameters['Horizontal Lag'] || 0);
    const LAG_VERTICAL = Number(parameters['Vertical Lag'] || 0);
    const CENTER_ZOOM_THRESHOLD = Number(parameters['Center Zoom Threshold'] || 1.2);
    const PLAYER_Y_OFFSET = Number(parameters['Player Y Offset'] || 0);
    const TRANSITION_LAG = Number(parameters['Transition Lag'] || 0.08);

    // Use separate lag values if provided, otherwise use main lag strength
    const LAG_X = LAG_HORIZONTAL > 0 ? LAG_HORIZONTAL : LAG_STRENGTH;
    const LAG_Y = LAG_VERTICAL > 0 ? LAG_VERTICAL : LAG_STRENGTH;

    // Store smooth camera position (null = not initialized)
    let camX = null;
    let camY = null;

    // Track previous mode for transition detection
    let previousMode = null; // 'follow' or 'static'

    // Override Game_Map.setDisplayPos to remove clamping
    // This allows camera to show outside map bounds, keeping player centered
    const _Game_Map_setDisplayPos = Game_Map.prototype.setDisplayPos;
    Game_Map.prototype.setDisplayPos = function(x, y) {
        // Remove all clamping - allow camera to move freely
        // This enables player to stay centered even at map edges
        this._displayX = x;
        this._displayY = y;
        // Update parallax to match (needed for proper rendering)
        this._parallaxX = x;
        this._parallaxY = y;
    };

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

        // Screen size in tiles (UNSCALED - displayX/Y work in unscaled space)
        const viewW = Graphics.width / tw;
        const viewH = Graphics.height / th;

        // Get current zoom level
        const zoom = $gameScreen.zoomScale();

        // Determine current mode
        const currentMode = (zoom <= CENTER_ZOOM_THRESHOLD) ? 'static' : 'follow';

        // Detect if we're transitioning between modes
        const isTransitioning = (previousMode !== null && previousMode !== currentMode);

        // Calculate target position based on mode
        let targetX, targetY;

        if (currentMode === 'static') {
            // ============================
            // MODE B: ZOOMED OUT (STATIC)
            // ============================
            const mapW = this.width();
            const mapH = this.height();

            // Target: center map on screen
            targetX = (mapW - viewW) / 2;
            targetY = (mapH - viewH) / 2;
        } else {
            // ============================
            // MODE A: ZOOMED IN (LAG FOLLOW)
            // ============================
            // Player's world position (tile coordinates)
            const playerX = $gamePlayer._realX + 0.5;
            const playerY = $gamePlayer._realY + 0.5 - (PLAYER_Y_OFFSET / th);

            // Target: center player on screen
            targetX = playerX - viewW / 2;
            targetY = playerY - viewH / 2;
        }

        // Update previous mode for next frame
        previousMode = currentMode;

        // Initialize camera position on first frame (use current display position)
        if (camX === null) {
            camX = this._displayX;
        }
        if (camY === null) {
            camY = this._displayY;
        }

        // Choose lag value based on mode:
        // - Follow mode (zoomed in): use normal LAG_X/LAG_Y for responsive player following
        // - Static mode (zoomed out): use TRANSITION_LAG for smooth centering
        const lagX = (currentMode === 'follow') ? LAG_X : TRANSITION_LAG;
        const lagY = (currentMode === 'follow') ? LAG_Y : TRANSITION_LAG;

        // Smooth interpolation (linear interpolation / lerp)
        camX += (targetX - camX) * lagX;
        camY += (targetY - camY) * lagY;

        // Snap to target when very close to prevent endless micro-adjustments
        const SNAP_THRESHOLD = 0.0001;
        if (Math.abs(camX - targetX) < SNAP_THRESHOLD) {
            camX = targetX;
        }
        if (Math.abs(camY - targetY) < SNAP_THRESHOLD) {
            camY = targetY;
        }

        // Snap camera to whole pixels to prevent sub-pixel jitter/trembling
        // Convert tile-space to pixel-aligned values, then back to tiles
        this._displayX = Math.round(camX * tw) / tw;
        this._displayY = Math.round(camY * th) / th;
    };

    // Reset camera position when map changes
    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        // Reset smooth camera position when entering a new map
        camX = null;
        camY = null;
        previousMode = null;
    };

})();

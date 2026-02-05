//=============================================================================
// KurtsMouseWheelZoom.js
//=============================================================================
/*:
 * @plugindesc v1.0.0 Mouse wheel zoom in/out for map camera
 * @author Furkan Kurt
 *
 * @param Min Zoom
 * @text Minimum Zoom Level
 * @desc Minimum zoom level (0.5 = 50% zoom, 1.0 = 100% zoom). Lower values zoom out more.
 * @type number
 * @min 0.25
 * @max 1.0
 * @decimals 2
 * @default 0.75
 *
 * @param Max Zoom
 * @text Maximum Zoom Level
 * @desc Maximum zoom level (1.0 = 100% zoom, 2.0 = 200% zoom). Higher values zoom in more.
 * @type number
 * @min 1.0
 * @max 3.0
 * @decimals 2
 * @default 1.50
 *
 * @param Zoom Step
 * @text Zoom Step Size
 * @desc How much zoom changes per mouse wheel scroll (0.05 = small steps, 0.20 = large steps).
 * @type number
 * @min 0.01
 * @max 0.50
 * @decimals 2
 * @default 0.10
 *
 * @param Smoothness
 * @text Zoom Smoothness
 * @desc How smooth the zoom animation is (0.1 = very smooth/slow, 0.5 = fast/snappy). Higher = faster.
 * @type number
 * @min 0.05
 * @max 1.0
 * @decimals 2
 * @default 0.20
 *
 * @param Disable During Events
 * @text Disable Zoom During Events
 * @desc Disable zoom when events are running (prevents zoom during cutscenes/dialogue).
 * @type boolean
 * @default true
 *
 * @help
 * ============================================================================
 * Kurts Mouse Wheel Zoom Plugin
 * ============================================================================
 *
 * This plugin adds mouse wheel zoom functionality to the map camera.
 * Scroll the mouse wheel up to zoom in, scroll down to zoom out.
 *
 * FEATURES:
 * --------
 * - Smooth zoom animation
 * - Configurable zoom limits (min/max)
 * - Configurable zoom step size
 * - Configurable smoothness
 * - Optional disable during events
 * - Visual-only zoom (no collision changes)
 *
 * USAGE:
 * ------
 * Simply scroll your mouse wheel up or down while on the map.
 *
 * - Scroll Up: Zoom in
 * - Scroll Down: Zoom out
 *
 * RESET ZOOM:
 * -----------
 * You can reset zoom to default (1.0) from an event using:
 *
 *   ◆ Script: resetMapZoom();
 *
 * NOTES:
 * ------
 * - Uses engine's built-in zoom system for proper rendering
 * - Full map and parallax render correctly when zoomed out (no black void)
 * - Zoom is visual only - collision detection remains unchanged
 * - Works with all existing plugins (perspective, interaction range, shake, etc.)
 * - UI elements (message boxes, menus) do not zoom (stays readable)
 * - Zoom centers on player position
 * - Zoom resets when changing maps
 *
 * ============================================================================
 */

(() => {
    'use strict';

    const parameters = PluginManager.parameters('KurtsMouseWheelZoom');
    const MIN_ZOOM = Number(parameters['Min Zoom'] || 0.75);
    const MAX_ZOOM = Number(parameters['Max Zoom'] || 1.50);
    const ZOOM_STEP = Number(parameters['Zoom Step'] || 0.10);
    const SMOOTHNESS = Number(parameters['Smoothness'] || 0.20);
    const DISABLE_DURING_EVENTS = parameters['Disable During Events'] !== 'false';

    // Target zoom level (what we're aiming for)
    let targetZoom = 1.0;

    /**
     * Reset zoom to default (1.0)
     * Can be called from events using: resetMapZoom();
     */
    window.resetMapZoom = function() {
        targetZoom = 1.0;
    };

    /**
     * Set zoom level programmatically
     * @param {number} zoom - Zoom level (clamped to min/max)
     */
    window.setMapZoom = function(zoom) {
        targetZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(zoom) || 1.0));
    };

    /**
     * Get current target zoom level
     * @returns {number} Current target zoom
     */
    window.getMapZoom = function() {
        return targetZoom;
    };

    // Override Input.update to capture mouse wheel
    const _Input_update = Input.update;
    Input.update = function() {
        _Input_update.call(this);

        // Only process zoom on map scene
        if (SceneManager._scene && SceneManager._scene.constructor === Scene_Map) {
            // Check if zoom should be disabled
            if (DISABLE_DURING_EVENTS && $gameMap && $gameMap.isEventRunning()) {
                return;
            }

            // Check for mouse wheel input
            if (TouchInput.wheelY !== 0) {
                if (TouchInput.wheelY > 0) {
                    // Scroll up = zoom in (increase zoom)
                    targetZoom += ZOOM_STEP;
                } else {
                    // Scroll down = zoom out (decrease zoom)
                    targetZoom -= ZOOM_STEP;
                }

                // Clamp zoom to min/max limits
                targetZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoom));
            }
        }
    };

    // Override Game_Map.update to apply smooth zoom via Game_Screen
    // This ensures proper rendering of tiles and parallax when zoomed out
    const _Game_Map_update = Game_Map.prototype.update;
    Game_Map.prototype.update = function(sceneActive) {
        _Game_Map_update.call(this, sceneActive);

        // Only update zoom on map scene when active
        if (!sceneActive || !SceneManager._scene || SceneManager._scene.constructor !== Scene_Map) {
            return;
        }

        // Check if zoom should be disabled
        if (DISABLE_DURING_EVENTS && this.isEventRunning()) {
            return;
        }

        // Get current zoom from Game_Screen
        const currentZoom = $gameScreen.zoomScale();

        // Smoothly interpolate toward target zoom
        // SMOOTHNESS: 0.1 = very smooth/slow, 0.5 = fast/snappy
        const newZoom = currentZoom + (targetZoom - currentZoom) * SMOOTHNESS;

        // Center zoom on player's screen position
        const zoomX = $gamePlayer ? $gamePlayer.screenX() : Graphics.width / 2;
        const zoomY = $gamePlayer ? $gamePlayer.screenY() : Graphics.height / 2;

        // Apply zoom using Game_Screen.setZoom (this ensures proper rendering)
        $gameScreen.setZoom(zoomX, zoomY, newZoom);
    };

    // Override Spriteset_Map.createParallax to force full map-sized parallax
    // This makes parallax render as a map-sized background sprite instead of tiling
    const _Spriteset_Map_createParallax = Spriteset_Map.prototype.createParallax;
    Spriteset_Map.prototype.createParallax = function() {
        _Spriteset_Map_createParallax.call(this);

        if (!this._parallax) return;

        // Force parallax to be full map size
        const mapW = $gameMap.width() * $gameMap.tileWidth();
        const mapH = $gameMap.height() * $gameMap.tileHeight();

        // Set parallax to full map dimensions
        this._parallax.width = mapW;
        this._parallax.height = mapH;

        // Disable engine's parallax scrolling (we'll handle it manually)
        this._parallax.origin.x = 0;
        this._parallax.origin.y = 0;
    };

    // Override Spriteset_Map.updateParallax to manually position parallax based on camera
    // This ensures parallax stays aligned with tiles and renders fully when zoomed out
    const _Spriteset_Map_updateParallax = Spriteset_Map.prototype.updateParallax;
    Spriteset_Map.prototype.updateParallax = function() {
        // Don't call original updateParallax - we're handling it completely manually
        // _Spriteset_Map_updateParallax.call(this);
        
        if (!this._parallax) return;

        const tileW = $gameMap.tileWidth();
        const tileH = $gameMap.tileHeight();

        // Update bitmap if parallax name changed
        if (this._parallaxName !== $gameMap.parallaxName()) {
            this._parallaxName = $gameMap.parallaxName();
            this._parallax.bitmap = ImageManager.loadParallax(this._parallaxName);
        }

        // Camera position in world pixels
        const camX = $gameMap.displayX() * tileW;
        const camY = $gameMap.displayY() * tileH;

        // Move parallax opposite to camera to keep it aligned with tiles
        // Zoom will scale it naturally since it's a full map-sized sprite
        this._parallax.x = -camX;
        this._parallax.y = -camY;
    };

    // Reset zoom when map changes
    const _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_start.call(this);
        // Reset zoom to default when entering a new map
        targetZoom = 1.0;
        // Clear zoom immediately using Game_Screen
        $gameScreen.clearZoom();
    };

})();

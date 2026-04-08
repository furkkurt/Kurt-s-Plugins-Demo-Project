//=============================================================================
// KurtsMapForeground.js
//=============================================================================
/*:
 * @plugindesc v1.2.0 Displays pictures as foreground layers anchored to the map
 * @author Furkan Kurt
 *
 * @param Offset X
 * @text Offset X (pixels)
 * @desc Horizontal offset from the default position. Positive = right, Negative = left.
 * @type number
 * @min -9999
 * @max 9999
 * @default 0
 *
 * @param Offset Y
 * @text Offset Y (pixels)
 * @desc Vertical offset from the default position. Positive = down, Negative = up.
 * @type number
 * @min -9999
 * @max 9999
 * @default 0
 *
 * @help
 * ============================================================================
 * Kurts Map Foreground Plugin
 * ============================================================================
 *
 * Displays pictures from img/pictures/ as foreground layers on the map,
 * rendered ABOVE tiles and characters. The picture's bottom-right corner
 * is aligned to the map's bottom-right corner (same as the parallax image).
 *
 * IMPORTANT:
 * ----------
 * Do NOT use RPG Maker's "Show Picture" / "Move Picture" event commands
 * to control foreground pictures. Those commands operate on a completely
 * separate picture system and will NOT affect foreground layers.
 *
 * Use the Script event commands listed below instead.
 *
 * USAGE:
 * ------
 * Add this note tag to a Map's Note field (in the Map Properties):
 *
 *   <foreground:pictureName>
 *
 * You can add multiple foreground layers:
 *
 *   <foreground:clemsRoomWall>
 *   <foreground:clemsRoomWall2>
 *
 * OFFSET:
 * -------
 * Use the Offset X / Offset Y plugin parameters to shift all foreground
 * pictures from their default bottom-right aligned position.
 *
 * OPACITY CONTROL (from events):
 * ------------------------------
 * Use the "Script" event command (Event Commands → Page 3 → Script).
 *
 * !! DO NOT use "Show Picture" or "Move Picture" !!
 * !! Those are for a different system and won't work !!
 *
 * Set opacity instantly:
 *   setForegroundOpacity("clemsRoomWall", 0);       // fully transparent
 *   setForegroundOpacity("clemsRoomWall", 128);     // half transparent
 *   setForegroundOpacity("clemsRoomWall", 255);     // fully visible
 *
 * Fade opacity over time (smooth transition):
 *   fadeForeground("clemsRoomWall", 0, 60);         // fade out in 60 frames
 *   fadeForeground("clemsRoomWall", 255, 120);      // fade in in 120 frames
 *
 * Set ALL foreground layers at once:
 *   setForegroundOpacity("all", 0);                 // hide all
 *   fadeForeground("all", 255, 60);                 // fade all in
 *
 * Check if a fade is still running (useful in Parallel Process):
 *   isForegroundFading("clemsRoomWall")             // true if mid-fade
 *
 * EVENT SETUP TIPS (avoid freezing):
 * -----------------------------------
 * - Use trigger "Action Button" or "Player Touch" for one-shot events
 * - If using "Autorun", ALWAYS turn on a Self Switch at the end
 *   so it only runs once, e.g.:
 *     ◆ Script: fadeForeground("clemsRoomWall", 0, 60);
 *     ◆ Wait: 60 frames
 *     ◆ Control Self Switch: A = ON
 *   Then make Page 2 with condition "Self Switch A" and leave it empty.
 * - "Parallel Process" is safe for ongoing checks but avoid calling
 *   fadeForeground every frame (use a condition/switch to run once).
 *
 * FEATURES:
 * ---------
 * - Picture stays fixed to map coordinates (follows camera correctly)
 * - Works with camera lag (KurtsCameraLag.js)
 * - Works with zoom (KurtsMouseWheelZoom.js)
 * - Renders ABOVE characters and tiles (foreground layer)
 * - Per-map control via note tags
 * - Supports multiple foreground layers per map
 * - Configurable X/Y offset via plugin manager
 * - Opacity controllable from events (instant or fade)
 * - No performance impact (simple sprite positioning)
 *
 * PLUGIN ORDER:
 * -------------
 * Load AFTER KurtsMouseWheelZoom.js and KurtsCameraLag.js
 *
 * ============================================================================
 */

(() => {
    'use strict';

    const parameters = PluginManager.parameters('KurtsMapForeground');
    const OFFSET_X = Number(parameters['Offset X'] || 0);
    const OFFSET_Y = Number(parameters['Offset Y'] || 0);

    // ========================================================================
    // Helper: safely get foreground sprites
    // ========================================================================

    function getForegroundSprites() {
        try {
            const scene = SceneManager._scene;
            if (!scene || !scene._spriteset) return null;
            const fg = scene._spriteset._mapForegrounds;
            if (!fg || !Array.isArray(fg)) return null;
            return fg;
        } catch (e) {
            return null;
        }
    }

    // ========================================================================
    // Global script call functions (usable from event Script commands)
    // ========================================================================

    /**
     * Set foreground opacity instantly.
     * @param {string} name - Picture name or "all" for all foregrounds
     * @param {number} opacity - 0 (invisible) to 255 (fully visible)
     */
    window.setForegroundOpacity = function(name, opacity) {
        const sprites = getForegroundSprites();
        if (!sprites) return;

        opacity = Number(opacity) || 0;
        opacity = Math.max(0, Math.min(255, Math.round(opacity)));

        for (const sprite of sprites) {
            if (name === 'all' || sprite._foregroundName === name) {
                sprite.opacity = opacity;
                // Cancel any ongoing fade
                sprite._fadeTarget = null;
                sprite._fadeDuration = 0;
                sprite._fadeSpeed = 0;
            }
        }
    };

    /**
     * Fade foreground opacity over time.
     * @param {string} name - Picture name or "all" for all foregrounds
     * @param {number} opacity - Target opacity (0-255)
     * @param {number} duration - Duration in frames (60 = ~1 second)
     */
    window.fadeForeground = function(name, opacity, duration) {
        const sprites = getForegroundSprites();
        if (!sprites) return;

        opacity = Number(opacity) || 0;
        opacity = Math.max(0, Math.min(255, Math.round(opacity)));
        duration = Number(duration) || 60;
        duration = Math.max(1, Math.round(duration));

        for (const sprite of sprites) {
            if (name === 'all' || sprite._foregroundName === name) {
                sprite._fadeTarget = opacity;
                sprite._fadeDuration = duration;
                sprite._fadeSpeed = (opacity - sprite.opacity) / duration;
            }
        }
    };

    /**
     * Check if a foreground is currently mid-fade.
     * @param {string} name - Picture name or "all" to check any foreground
     * @returns {boolean} True if a fade animation is still in progress
     */
    window.isForegroundFading = function(name) {
        const sprites = getForegroundSprites();
        if (!sprites) return false;

        for (const sprite of sprites) {
            if (name === 'all' || sprite._foregroundName === name) {
                if (sprite._fadeTarget !== null && sprite._fadeDuration > 0) {
                    return true;
                }
            }
        }
        return false;
    };

    // ========================================================================
    // Create foreground sprites when the map spriteset is built
    // ========================================================================

    const _Spriteset_Map_createUpperLayer = Spriteset_Map.prototype.createUpperLayer;
    Spriteset_Map.prototype.createUpperLayer = function() {
        // Create foreground BEFORE upper layer so it renders above tiles/chars
        // but below UI elements (pictures, timer, etc.)
        this.createMapForegrounds();
        _Spriteset_Map_createUpperLayer.call(this);
    };

    Spriteset_Map.prototype.createMapForegrounds = function() {
        this._mapForegrounds = [];

        // Read map note for <foreground:pictureName> tags
        const note = $dataMap && $dataMap.note ? $dataMap.note : '';
        const regex = /<foreground:\s*(.+?)\s*>/gi;
        let match;

        while ((match = regex.exec(note)) !== null) {
            const pictureName = match[1].trim();
            const sprite = new Sprite();
            sprite.bitmap = ImageManager.loadPicture(pictureName);
            sprite._foregroundName = pictureName; // Store name for script calls
            sprite._fadeTarget = null;
            sprite._fadeDuration = 0;
            sprite._fadeSpeed = 0;
            this._baseSprite.addChild(sprite);
            this._mapForegrounds.push(sprite);
        }
    };

    // ========================================================================
    // Update foreground positions and opacity every frame
    // ========================================================================

    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        this.updateMapForegrounds();
    };

    Spriteset_Map.prototype.updateMapForegrounds = function() {
        if (!this._mapForegrounds || this._mapForegrounds.length === 0) return;

        const tw = $gameMap.tileWidth();
        const th = $gameMap.tileHeight();

        // Map size in pixels
        const mapW = $gameMap.width() * tw;
        const mapH = $gameMap.height() * th;

        // Camera position in pixels
        const camX = $gameMap.displayX() * tw;
        const camY = $gameMap.displayY() * th;

        for (const sprite of this._mapForegrounds) {
            // -- Position --
            const bmp = sprite.bitmap;
            if (bmp && bmp.isReady() && bmp.width > 0 && bmp.height > 0) {
                // Anchor picture's bottom-right to map's bottom-right + offset
                const worldX = mapW - bmp.width + OFFSET_X;
                const worldY = mapH - bmp.height + OFFSET_Y;

                // Convert to screen position (same math as parallax layer)
                sprite.x = worldX - camX;
                sprite.y = worldY - camY;
            }

            // -- Opacity fade animation --
            if (sprite._fadeTarget !== null && sprite._fadeDuration > 0) {
                sprite._fadeDuration--;
                if (sprite._fadeDuration <= 0) {
                    // Snap to exact target on last frame
                    sprite.opacity = sprite._fadeTarget;
                    sprite._fadeTarget = null;
                    sprite._fadeDuration = 0;
                    sprite._fadeSpeed = 0;
                } else {
                    sprite.opacity = Math.max(0, Math.min(255,
                        sprite.opacity + sprite._fadeSpeed
                    ));
                }
            }
        }
    };

})();

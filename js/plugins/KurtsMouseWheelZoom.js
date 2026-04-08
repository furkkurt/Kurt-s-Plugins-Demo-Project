//=============================================================================
// KurtsMouseWheelZoom.js
//=============================================================================
/*:
 * @plugindesc v1.4.0 Mouse wheel zoom in/out for map camera (resolution-adaptive)
 * @author Furkan Kurt
 *
 * @param Min Zoom
 * @text Minimum Zoom Factor
 * @desc Minimum zoom factor at reference resolution (0.5 = 50%, 1.0 = default). Lower = zoom out more.
 * @type number
 * @min 0.25
 * @max 1.0
 * @decimals 2
 * @default 0.75
 *
 * @param Max Zoom
 * @text Maximum Zoom Factor
 * @desc Maximum zoom factor at reference resolution (1.0 = default, 2.0 = 200%). Higher = zoom in more.
 * @type number
 * @min 1.0
 * @max 3.0
 * @decimals 2
 * @default 1.50
 *
 * @param Zoom Step
 * @text Zoom Step Size
 * @desc How much zoom changes per mouse wheel scroll.
 * @type number
 * @min 0.01
 * @max 0.50
 * @decimals 2
 * @default 0.10
 *
 * @param Smoothness
 * @text Zoom Smoothness
 * @desc How smooth the zoom animation is (0.1 = slow, 0.5 = snappy).
 * @type number
 * @min 0.05
 * @max 1.0
 * @decimals 2
 * @default 0.20
 *
 * @param Disable During Events
 * @text Disable Zoom During Events
 * @desc Disable zoom while the main map event is running (Autorun, touch, etc.). Parallel processes do not block. Set false to allow zoom during any script.
 * @type boolean
 * @default true
 *
 * @param Disable During Message
 * @text Disable Zoom During Message / Text
 * @desc When true, wheel zoom is ignored while dialogue is active: message queue, open message window, scroll text, or similar. Set false to zoom during Show Text.
 * @type boolean
 * @default true
 *
 * @help
 * ============================================================================
 * Kurts Mouse Wheel Zoom Plugin  v1.4
 * ============================================================================
 *
 * RESOLUTION-ADAPTIVE ZOOM
 * All zoom values are resolution-independent "factors" relative to a
 * 1280×720 reference.  The engine zoom is automatically scaled so the
 * same visible world area is shown at every screen resolution.
 *
 *   factor 1.0  = default view (same tiles visible as 1280×720 @ zoom 1×)
 *   factor 0.75 = zoomed out  (more tiles visible)
 *   factor 1.50 = zoomed in   (fewer tiles visible)
 *
 * Script calls:
 *   resetMapZoom()        — reset to default
 *   setMapZoom(factor)    — set zoom factor (0.75 – 1.50)
 *   getMapZoom()          — current target factor
 *
 * Maps whose display name starts with "cutscene" (case-insensitive) skip
 * this plugin entirely: no wheel zoom, no per-frame zoom, default parallax.
 *
 * ============================================================================
 */

(() => {
    'use strict';

    const parameters = PluginManager.parameters('KurtsMouseWheelZoom');
    const MIN_ZOOM   = Number(parameters['Min Zoom'] || 0.75);
    const MAX_ZOOM   = Number(parameters['Max Zoom'] || 1.50);
    const ZOOM_STEP  = Number(parameters['Zoom Step'] || 0.10);
    const SMOOTHNESS = Number(parameters['Smoothness'] || 0.20);
    const DISABLE_DURING_EVENTS = parameters['Disable During Events'] !== 'false';
    const DISABLE_DURING_MESSAGE = parameters['Disable During Message'] !== 'false';

    // Reference resolution — all factors are defined relative to this width
    const REFERENCE_WIDTH = 1280;

    /** Resolution scale: current width ÷ reference width */
    function getResScale() {
        return Graphics.width / REFERENCE_WIDTH;
    }

    function isCutsceneMap() {
        // Do not call $gameMap.displayName() — it reads $dataMap.displayName and throws if $dataMap is null (title, loading, etc.)
        if (!$gameMap || !$dataMap) return false;
        const name = String($dataMap.displayName || '')
            .trim()
            .toLowerCase();
        return name.startsWith('cutscene');
    }

    /** Main map interpreter only — not parallel map/common event interpreters */
    function isMainMapEventRunning() {
        return $gameMap && $gameMap._interpreter && $gameMap._interpreter.isRunning();
    }

    /** Show Text, choices, scroll text, or message window still open */
    function isMapMessageOrTextActive() {
        if (!$gameMessage) return false;
        if ($gameMessage.isBusy()) return true;
        const scene = SceneManager._scene;
        if (!scene || scene.constructor !== Scene_Map) return false;
        const mw = scene._messageWindow;
        if (mw && mw.isOpen()) return true;
        const sw = scene._scrollTextWindow;
        if (sw && sw.visible && sw._text) return true;
        return false;
    }

    // Resolution-independent zoom factor (1.0 = default view at any res)
    let targetFactor = 1.0;

    // ---- public helpers -------------------------------------------------

    window.resetMapZoom = function() {
        targetFactor = 1.0;
    };

    window.setMapZoom = function(factor) {
        targetFactor = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(factor) || 1.0));
    };

    window.getMapZoom = function() {
        return targetFactor;
    };

    // ---- mouse-wheel input ----------------------------------------------

    const _Input_update = Input.update;
    Input.update = function() {
        _Input_update.call(this);

        if (SceneManager._scene && SceneManager._scene.constructor === Scene_Map) {
            if (isCutsceneMap()) return;
            if (DISABLE_DURING_EVENTS && isMainMapEventRunning()) return;
            if (DISABLE_DURING_MESSAGE && isMapMessageOrTextActive()) return;

            if (TouchInput.wheelY !== 0) {
                targetFactor += (TouchInput.wheelY > 0 ? ZOOM_STEP : -ZOOM_STEP);
                targetFactor  = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetFactor));
            }
        }
    };

    // ---- apply zoom each frame ------------------------------------------

    const _Game_Map_update = Game_Map.prototype.update;
    Game_Map.prototype.update = function(sceneActive) {
        _Game_Map_update.call(this, sceneActive);

        if (!sceneActive || !SceneManager._scene ||
            SceneManager._scene.constructor !== Scene_Map) return;
        if (isCutsceneMap()) return;
        if (DISABLE_DURING_EVENTS && isMainMapEventRunning()) return;
        if (DISABLE_DURING_MESSAGE && isMapMessageOrTextActive()) return;

        // Engine zoom = factor × resolution scale
        const resScale     = getResScale();
        const engineTarget = targetFactor * resScale;
        const currentZoom  = $gameScreen.zoomScale();
        const newZoom      = currentZoom + (engineTarget - currentZoom) * SMOOTHNESS;

        // Zoom centred on screen centre (camera plugin handles position)
        $gameScreen.setZoom(Graphics.width / 2, Graphics.height / 2, newZoom);
    };

    // ---- full-map parallax ----------------------------------------------

    const _Spriteset_Map_createParallax = Spriteset_Map.prototype.createParallax;
    Spriteset_Map.prototype.createParallax = function() {
        _Spriteset_Map_createParallax.call(this);
        if (isCutsceneMap()) return;
        if (!this._parallax) return;

        const mapW = $gameMap.width()  * $gameMap.tileWidth();
        const mapH = $gameMap.height() * $gameMap.tileHeight();
        this._parallax.width  = mapW;
        this._parallax.height = mapH;
        this._parallax.origin.x = 0;
        this._parallax.origin.y = 0;
    };

    const _Spriteset_Map_updateParallax = Spriteset_Map.prototype.updateParallax;
    Spriteset_Map.prototype.updateParallax = function() {
        if (isCutsceneMap()) {
            _Spriteset_Map_updateParallax.call(this);
            return;
        }
        if (!this._parallax) return;

        if (this._parallaxName !== $gameMap.parallaxName()) {
            this._parallaxName = $gameMap.parallaxName();
            this._parallax.bitmap = ImageManager.loadParallax(this._parallaxName);
        }

        const camX = $gameMap.displayX() * $gameMap.tileWidth();
        const camY = $gameMap.displayY() * $gameMap.tileHeight();
        this._parallax.x = -camX;
        this._parallax.y = -camY;
    };

    // ---- reset on map change --------------------------------------------

    const _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_start.call(this);
        if (isCutsceneMap()) {
            $gameScreen.setZoom(0, 0, 1);
            return;
        }
        targetFactor = 1.0;
        // Set zoom immediately to the resolution-correct default (no transition)
        const resScale = getResScale();
        $gameScreen.setZoom(Graphics.width / 2, Graphics.height / 2, resScale);
    };

})();

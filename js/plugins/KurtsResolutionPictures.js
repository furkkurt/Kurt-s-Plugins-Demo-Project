/*:
 * @target MZ
 * @plugindesc v1.4.4 Resolution-adaptive pictures & message windows
 * @author Kurts
 *
 * @param Reference Width
 * @type number
 * @desc The screen width your pictures were designed/positioned for
 * @default 1280
 *
 * @param Reference Height
 * @type number
 * @desc The screen height your pictures were designed/positioned for
 * @default 720
 *
 * @help
 * ============================================================================
 * KurtsResolutionPictures  v1.4.4
 * ============================================================================
 *
 * 1) Picture Show / Move: reference x/y and scale % (default 1280×720). Positions
 *    account for screen zoom pivot (Spriteset_Base: offset −zoom×(scale−1) plus
 *    child×scale) so edges match a z=1 layout. Scale uses (width/ref)÷zoom.
 *
 * 2) Scales the message window, name-box and related text so they
 *    occupy the same screen proportion at every resolution. Per-line height
 *    in calcTextHeight matches scaled fonts (fixes line overlap on small
 *    resolutions).
 *
 * 3) \PX[n] and \PY[n] escape codes use the message box size vs reference.
 *
 * Script / other plugins: window.KurtsResolutionUiScale() returns
 * Graphics.boxHeight / Reference Height (same factor used for message UI).
 * Load before KurtsTranslationTooltip if you rely on the global; the tooltip
 * plugin can also read this plugin's parameters as a fallback.
 */

(() => {
    'use strict';

    const pluginName = 'KurtsResolutionPictures';
    const params = PluginManager.parameters(pluginName);
    const REF_W = Number(params['Reference Width'] || 1280);
    const REF_H = Number(params['Reference Height'] || 720);

    /**
     * Scale % only: undo double scaling vs spriteset zoom (same as before).
     */
    function pictureScaleAdjustFactor() {
        const s = Graphics.width / REF_W;
        const z = $gameScreen.zoomScale();
        if (!z || z <= 0) return s;
        return s / z;
    }

    /**
     * Reference layout → Game_Picture x,y. Target screen position matches
     * ref×(Graphics.width/refW) for both axes (same as typical cutscene scripts).
     * Compensates Spriteset_Base zoom: world = −zoom·(z−1) + stored·z.
     */
    function pictureRefToStoredXY(refX, refY) {
        const s = Graphics.width / REF_W;
        const z = $gameScreen.zoomScale();
        const zx = $gameScreen.zoomX();
        const zy = $gameScreen.zoomY();
        if (!z || z <= 0) {
            return { x: refX * s, y: refY * s };
        }
        const invZ = 1 / z;
        const pivot = (z - 1) * invZ;
        return {
            x: refX * s * invZ + zx * pivot,
            y: refY * s * invZ + zy * pivot,
        };
    }

    /** Resolution scale factor (height-based for UI) */
    function uiScale() {
        return Graphics.boxHeight / REF_H;
    }

    window.KurtsResolutionUiScale = function() {
        return Graphics.boxHeight / REF_H;
    };

    // =========================================================================
    // 1.  Pictures: reference-space coords → current resolution
    // =========================================================================
    const _Game_Screen_showPicture = Game_Screen.prototype.showPicture;
    Game_Screen.prototype.showPicture = function(
        pictureId, name, origin, x, y, scaleX, scaleY, opacity, blendMode
    ) {
        const pos = pictureRefToStoredXY(x, y);
        const f = pictureScaleAdjustFactor();
        _Game_Screen_showPicture.call(
            this,
            pictureId,
            name,
            origin,
            pos.x,
            pos.y,
            scaleX * f,
            scaleY * f,
            opacity,
            blendMode
        );
    };

    const _Game_Screen_movePicture = Game_Screen.prototype.movePicture;
    Game_Screen.prototype.movePicture = function(
        pictureId, origin, x, y, scaleX, scaleY, opacity, blendMode, duration,
        easingType
    ) {
        const pos = pictureRefToStoredXY(x, y);
        const f = pictureScaleAdjustFactor();
        _Game_Screen_movePicture.call(
            this,
            pictureId,
            origin,
            pos.x,
            pos.y,
            scaleX * f,
            scaleY * f,
            opacity,
            blendMode,
            duration,
            easingType
        );
    };

    // =========================================================================
    // 2.  Message window — proportional height & scaled text
    // =========================================================================

    // --- message window rect: scale height to keep same screen % -----------
    const _Scene_Message_messageWindowRect =
        Scene_Message.prototype.messageWindowRect;
    Scene_Message.prototype.messageWindowRect = function() {
        const rect = _Scene_Message_messageWindowRect.call(this);
        const s = uiScale();
        rect.height = Math.round(rect.height * s);
        return rect;
    };

    // --- line height: proportional to resolution ---------------------------
    const _WM_lineHeight = Window_Message.prototype.lineHeight;
    Window_Message.prototype.lineHeight = function() {
        return Math.round(_WM_lineHeight.call(this) * uiScale());
    };

    // --- font size: proportional -------------------------------------------
    const _WM_resetFontSettings = Window_Message.prototype.resetFontSettings;
    Window_Message.prototype.resetFontSettings = function() {
        _WM_resetFontSettings.call(this);
        this.contents.fontSize = Math.round(this.contents.fontSize * uiScale());
    };

    // --- padding: proportional ---------------------------------------------
    const _WM_updatePadding = Window_Message.prototype.updatePadding;
    Window_Message.prototype.updatePadding = function() {
        _WM_updatePadding.call(this);
        this._padding = Math.round(this._padding * uiScale());
    };

    /**
     * Engine calcTextHeight uses lineHeight() - mainFontSize(). We scale
     * lineHeight but resetFontSettings scales font from mainFontSize; leaving
     * mainFontSize unscaled here makes lineSpacing negative at low resolutions
     * and lines overlap. Use the same scaled reference as resetFontSettings.
     */
    function calcTextHeightScaledLineSpacing(self, textState) {
        const refMain = Math.round($gameSystem.mainFontSize() * uiScale());
        const lineSpacing = self.lineHeight() - refMain;
        const lastFontSize = self.contents.fontSize;
        const lines = textState.text.slice(textState.index).split('\n');
        const textHeight = self.maxFontSizeInLine(lines[0]) + lineSpacing;
        self.contents.fontSize = lastFontSize;
        return textHeight;
    }

    Window_Message.prototype.calcTextHeight = function(textState) {
        return calcTextHeightScaledLineSpacing(this, textState);
    };

    // --- name-box: same scaling --------------------------------------------
    const _WNB_lineHeight = Window_NameBox.prototype.lineHeight;
    Window_NameBox.prototype.lineHeight = function() {
        return Math.round((_WNB_lineHeight || _WM_lineHeight).call(this) * uiScale());
    };

    const _WNB_resetFontSettings = Window_NameBox.prototype.resetFontSettings;
    Window_NameBox.prototype.resetFontSettings = function() {
        _WNB_resetFontSettings.call(this);
        this.contents.fontSize = Math.round(this.contents.fontSize * uiScale());
    };

    const _WNB_updatePadding = Window_NameBox.prototype.updatePadding;
    Window_NameBox.prototype.updatePadding = function() {
        _WNB_updatePadding.call(this);
        this._padding = Math.round(this._padding * uiScale());
    };

    Window_NameBox.prototype.calcTextHeight = function(textState) {
        return calcTextHeightScaledLineSpacing(this, textState);
    };

    // =========================================================================
    // 3.  Scale \PX[n] and \PY[n] escape codes by resolution
    // =========================================================================
    const _WB_processEscapeCharacter =
        Window_Base.prototype.processEscapeCharacter;
    Window_Base.prototype.processEscapeCharacter = function(code, textState) {
        if (code === 'PX') {
            const px = this.obtainEscapeParam(textState);
            textState.x = Math.round(px * (Graphics.boxWidth / REF_W));
            return;
        }
        if (code === 'PY') {
            const py = this.obtainEscapeParam(textState);
            textState.y = Math.round(py * (Graphics.boxHeight / REF_H));
            return;
        }
        _WB_processEscapeCharacter.call(this, code, textState);
    };

})();

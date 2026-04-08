/*:
 * @target MZ
 * @plugindesc v1.4.0 Hoverable translation tooltips in message text
 * @author Kurts
 *
 * @param Box Image
 * @desc Background image for tooltip box (in img/pictures/)
 * @default translationBox
 *
 * @param Tooltip Font Size
 * @type number
 * @desc Font size for translation text inside the tooltip
 * @default 20
 *
 * @param Foreign Text Color
 * @desc Hex color for the hoverable foreign text in messages
 * @default #FFD700
 *
 * @param Tooltip Offset Y
 * @type number
 * @desc Extra vertical offset for the tooltip (negative = higher), in reference pixels (scaled when Match Resolution UI is on)
 * @default 0
 * @min -200
 * @max 200
 *
 * @param Match Resolution UI Scaling
 * @type boolean
 * @default true
 * @desc When true, tooltip box padding, font size, line spacing, and offsets scale with KurtsResolutionPictures (Reference Height vs current box height). Uses that plugin's parameters if loaded after it, or reads them directly.
 *
 * @help
 * ============================================================================
 * KurtsTranslationTooltip  v1.4.0
 * ============================================================================
 *
 * Adds hoverable translation tooltips to message windows.
 *
 * Usage in "Show Text" commands:
 *   \TR<displayed text|translation>
 *
 * Example:
 *   She said \TR<Привет мир|Hello world> and smiled.
 *
 * - "Привет мир" displays inline in gold with an underline.
 * - Hovering the mouse over it shows a tooltip with "Hello world"
 *   using translationBox.png as the background.
 * - Moving the mouse away hides the tooltip.
 *
 * You can use multiple \TR<...|...> in the same message.
 * The tooltip automatically scales to fit the translation text.
 *
 * Load AFTER KurtsResolutionPictures (recommended) so tooltip sizing matches
 * message window scaling. If order differs, Reference Height is still read
 * from that plugin's settings when possible.
 */

(() => {
    'use strict';

    const pluginName = 'KurtsTranslationTooltip';
    const params = PluginManager.parameters(pluginName);
    const BOX_IMAGE         = String(params['Box Image'] || 'translationBox');
    const TOOLTIP_FONT_SIZE = Number(params['Tooltip Font Size'] || 20);
    const FOREIGN_COLOR     = String(params['Foreign Text Color'] || '#FFD700');
    const TOOLTIP_OFFSET_Y  = Number(params['Tooltip Offset Y'] || 0);
    const MATCH_RES_UI      = params['Match Resolution UI Scaling'] !== 'false';

    function trUiScale() {
        if (!MATCH_RES_UI) return 1;
        if (typeof window.KurtsResolutionUiScale === 'function') {
            const s = window.KurtsResolutionUiScale();
            if (typeof s === 'number' && s > 0 && isFinite(s)) return s;
        }
        const p = PluginManager.parameters('KurtsResolutionPictures');
        const refH = Number(p['Reference Height'] || 720);
        return refH > 0 ? Graphics.boxHeight / refH : 1;
    }

    // =========================================================================
    // Mouse hover position tracking
    // =========================================================================
    let _hoverX = 0;
    let _hoverY = 0;

    document.addEventListener('mousemove', event => {
        if (Graphics._canvas) {
            _hoverX = Graphics.pageToCanvasX(event.pageX);
            _hoverY = Graphics.pageToCanvasY(event.pageY);
        }
    });

    // =========================================================================
    // Pre-load the tooltip background image at boot
    // =========================================================================
    const _Scene_Boot_loadGameFonts = Scene_Boot.prototype.loadGameFonts;
    Scene_Boot.prototype.loadGameFonts = function() {
        _Scene_Boot_loadGameFonts.call(this);
        ImageManager.loadPicture(BOX_IMAGE);
    };

    // =========================================================================
    // Window_TranslationTooltip  (Window_Base subclass — reliable rendering)
    // =========================================================================
    function Window_TranslationTooltip() {
        this.initialize.apply(this, arguments);
    }
    Window_TranslationTooltip.prototype = Object.create(Window_Base.prototype);
    Window_TranslationTooltip.prototype.constructor = Window_TranslationTooltip;

    // Box sizing (reference px; scaled in _rebuildTooltip via trUiScale)
    const BOX_PAD_H   = 60;   // horizontal padding each side
    const BOX_PAD_TOP = 10;   // padding above text
    const BOX_PAD_BOT = 30;   // space below text (e.g. pointer)
    const LINE_GAP    = 8;    // extra vertical space per line (reference px)

    // Cached crop rect of the non-transparent area in translationBox.png
    let _bgCrop = null;

    Window_TranslationTooltip.prototype.initialize = function() {
        Window_Base.prototype.initialize.call(this, new Rectangle(0, 0, 1, 1));
        this._text = '';
        this._tooltipDirty = false;
        this.visible = false;
        this.opacity = 0;          // hide window frame / background
        this.backOpacity = 0;
        this._padding = 0;         // no padding — full area is our content
    };

    // Override so padding stays 0 even after updatePadding calls
    Window_TranslationTooltip.prototype.updatePadding = function() {
        this._padding = 0;
    };

    // FIX: The WindowLayer normally calls _updateFilterArea during its
    // render(), but this tooltip lives outside the WindowLayer.  Override
    // so the filterArea is always kept in sync with the window position.
    Window_TranslationTooltip.prototype._updateFilterArea = function() {
        const fa = this._clientArea ? this._clientArea.filterArea : null;
        if (!fa) return;
        fa.x = this.x;
        fa.y = this.y;
        fa.width  = this.innerWidth;
        fa.height = this.innerHeight;
    };

    Window_TranslationTooltip.prototype.setText = function(text) {
        if (this._text !== text) {
            this._text = text;
            this._tooltipDirty = true;
        }
    };

    Window_TranslationTooltip.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        if (this._tooltipDirty) this._rebuildTooltip();
    };

    // Auto-detect the non-transparent bounding box of the bg image (once)
    function getCropRect(bmp) {
        if (_bgCrop) return _bgCrop;
        const w = bmp.width, h = bmp.height;
        const ctx = bmp.context;
        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;
        let x0 = w, y0 = h, x1 = 0, y1 = 0;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (d[(y * w + x) * 4 + 3] > 10) {
                    if (x < x0) x0 = x;
                    if (x > x1) x1 = x;
                    if (y < y0) y0 = y;
                    if (y > y1) y1 = y;
                }
            }
        }
        _bgCrop = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
        return _bgCrop;
    }

    Window_TranslationTooltip.prototype._rebuildTooltip = function() {
        const bgBmp = ImageManager.loadPicture(BOX_IMAGE);
        if (!bgBmp.isReady() || bgBmp.width === 0) return;   // wait until loaded
        this._tooltipDirty = false;

        // Get the actual visible area of the source image (skip transparent margins)
        const crop = getCropRect(bgBmp);

        const scale = trUiScale();
        const padH   = Math.round(BOX_PAD_H * scale);
        const padTop = Math.round(BOX_PAD_TOP * scale);
        const padBot = Math.round(BOX_PAD_BOT * scale);
        const fontSz = Math.max(1, Math.round(TOOLTIP_FONT_SIZE * scale));
        const lineH  = fontSz + Math.round(LINE_GAP * scale);

        // Split text into lines (support \n in the translation string)
        const lines = this._text.split(/\\n|\n/);
        const numLines = lines.length;

        // Measure the widest line
        const tmpBmp = new Bitmap(1, 1);
        tmpBmp.fontFace = $gameSystem.mainFontFace();
        tmpBmp.fontSize = fontSz;
        let maxLineW = 0;
        for (const line of lines) {
            maxLineW = Math.max(maxLineW, tmpBmp.measureTextWidth(line));
        }
        tmpBmp.destroy();

        // Box dimensions: generous padding around the text
        const textBlockH = numLines * lineH;
        const minW = Math.round(160 * scale);
        const bw = Math.max(minW, Math.ceil(maxLineW) + padH * 2);
        const bh = textBlockH + padTop + padBot;

        // Resize the window (padding=0, so window size = content size)
        this.move(this.x, this.y, bw, bh);
        this.createContents();

        // Draw ONLY the visible part of the bg image, stretched to fill tooltip
        this.contents.blt(
            bgBmp,
            crop.x, crop.y, crop.w, crop.h,   // source: cropped to visible area
            0, 0, bw, bh                        // dest: fill entire tooltip
        );

        // Draw each line of text, vertically centred as a block
        this.contents.fontFace     = $gameSystem.mainFontFace();
        this.contents.fontSize     = fontSz;
        this.contents.textColor    = '#FFFFFF';
        this.contents.outlineColor = 'rgba(0,0,0,0.65)';
        this.contents.outlineWidth = Math.max(1, Math.round(3 * scale));
        const startY = padTop;
        for (let i = 0; i < lines.length; i++) {
            this.contents.drawText(
                lines[i], 0, startY + i * lineH, bw, lineH, 'center'
            );
        }
    };

    // =========================================================================
    // Create tooltip window ONCE during scene initialisation
    // =========================================================================
    const _Scene_Message_createAllWindows =
        Scene_Message.prototype.createAllWindows;
    Scene_Message.prototype.createAllWindows = function() {
        _Scene_Message_createAllWindows.call(this);
        this._trTooltip = new Window_TranslationTooltip();
        this.addChild(this._trTooltip);        // on top of everything
    };

    // Helper – get the tooltip window from the current scene
    function sceneTooltip() {
        const s = SceneManager._scene;
        return s ? s._trTooltip : null;
    }

    // =========================================================================
    // Pre-process \TR<foreign|translation> in startMessage
    // =========================================================================
    const _Window_Message_startMessage = Window_Message.prototype.startMessage;
    Window_Message.prototype.startMessage = function() {
        this._trRegions    = [];
        this._trData       = [];
        this._trBuildStart = null;

        const origTexts = $gameMessage._texts;
        const processed = [];
        let idx = 0;
        for (let i = 0; i < origTexts.length; i++) {
            processed.push(
                origTexts[i].replace(
                    /\\TR<([^|]*)\|([^>]*)>/g,
                    (_m, foreign, translation) => {
                        const n = idx++;
                        this._trData.push(translation.trim());
                        return `\\TRS[${n}]${foreign}\\TRE[${n}]`;
                    }
                )
            );
        }
        $gameMessage._texts = processed;
        try {
            _Window_Message_startMessage.call(this);
        } finally {
            $gameMessage._texts = origTexts;
        }
    };

    // =========================================================================
    // Handle TRS / TRE escape codes
    // =========================================================================
    const _WM_processEscapeChar =
        Window_Message.prototype.processEscapeCharacter;

    Window_Message.prototype.processEscapeCharacter = function(code, textState) {
        if (code === 'TRS') {
            const idx = this.obtainEscapeParam(textState);
            this._trBuildStart = { x: textState.x, y: textState.y, idx: idx };
            this.changeTextColor(FOREIGN_COLOR);
            return;
        }
        if (code === 'TRE') {
            const idx = this.obtainEscapeParam(textState);
            const start = this._trBuildStart;
            if (start && start.idx === idx) {
                // Shift region down — text glyphs render in the bottom
                // ~55% of the lineHeight due to baseline alignment.
                const lh = this.lineHeight();
                const regionY = start.y + Math.floor(lh * 1.25);
                const region = {
                    x: start.x,
                    y: regionY,
                    width:  textState.x - start.x,
                    height: Math.ceil(lh * 0.55),
                    translation: this._trData[idx]
                };
                if (!this._trRegions) this._trRegions = [];
                this._trRegions.push(region);

                // Underline
                const uy = start.y + this.lineHeight() - 6;
                this.contents.paintOpacity = 140;
                this.contents.fillRect(start.x, uy, region.width, 2, FOREIGN_COLOR);
                this.contents.paintOpacity = 255;
                this._trBuildStart = null;
            }
            this.changeTextColor(ColorManager.normalColor());
            return;
        }
        _WM_processEscapeChar.call(this, code, textState);
    };

    // =========================================================================
    // Hover detection & tooltip display
    // =========================================================================
    const _Window_Message_update = Window_Message.prototype.update;
    Window_Message.prototype.update = function() {
        _Window_Message_update.call(this);
        this._updateTranslationHover();
    };

    Window_Message.prototype._updateTranslationHover = function() {
        const tip = sceneTooltip();

        if (!this.isOpen() || !this._trRegions || this._trRegions.length === 0) {
            if (tip) tip.visible = false;
            return;
        }

        // Use toGlobal() which forces a PIXI transform update, giving
        // the real screen position of the contents sprite top-left.
        const cs = this._contentsSprite;
        let originX, originY;
        if (cs && cs.toGlobal) {
            const p = cs.toGlobal(new PIXI.Point(0, 0));
            originX = p.x;
            originY = p.y;
        } else {
            originX = this.x + this.padding;
            originY = this.y + this.padding;
        }

        const cx = _hoverX - originX;
        const cy = _hoverY - originY;

        const scale = trUiScale();
        // Expand hit area with overflow so hovering near the text still triggers
        const OVERFLOW = Math.round(12 * scale);
        let hit = null;
        for (const r of this._trRegions) {
            if (cx >= r.x - OVERFLOW && cx <= r.x + r.width + OVERFLOW &&
                cy >= r.y - OVERFLOW && cy <= r.y + r.height + OVERFLOW) {
                hit = r;
                break;
            }
        }

        if (hit && tip) {
            tip.setText(hit.translation);

            // Position: centre the tooltip horizontally over the region,
            // nudged slightly right and down so the triangle points at the text.
            const ttW = tip.width;
            const ttH = tip.height;
            let tx = Math.round(originX + hit.x + hit.width / 2 - ttW / 2 + Math.round(8 * scale));
            let ty = Math.round(
                originY + hit.y + Math.round(TOOLTIP_OFFSET_Y * scale) - ttH - Math.round(48 * scale)
            );

            // Clamp horizontal
            tx = Math.max(0, Math.min(Graphics.width - ttW, tx));

            // Flip below text if it would go off the top
            if (ty < 0) {
                ty = Math.round(originY + hit.y + hit.height + Math.round(8 * scale));
            }

            tip.x = tx;
            tip.y = ty;
            tip.visible = true;
        } else if (tip) {
            tip.visible = false;
        }
    };

    // Hide tooltip when message closes
    const _Window_Message_terminateMessage =
        Window_Message.prototype.terminateMessage;
    Window_Message.prototype.terminateMessage = function() {
        this._trRegions = [];
        const tip = sceneTooltip();
        if (tip) tip.visible = false;
        _Window_Message_terminateMessage.call(this);
    };

})();

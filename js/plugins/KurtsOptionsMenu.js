//=============================================================================
// KurtsOptionsMenu.js
//=============================================================================
/*:
 * @plugindesc v3.2.0 Custom menus with RoyalnCurvy font, styled selections, menuBg background
 * @author Furkan Kurt
 *
 * @help
 * ============================================================================
 * Kurts Options Menu v3.2
 * ============================================================================
 *
 * Uses fonts/RoyalnCurvy.ttf as the game-wide font.
 * Uses img/pictures/menuBg.png as the background for title, options,
 * controls, and in-game menu scenes.
 *
 * Title screen shows "LINE" at the top-right, with the command window
 * positioned at the centre-right (no borders, no cursor).
 *
 * All custom windows use:
 *   - Transparent background (no white borders)
 *   - No blue cursor rect
 *   - Text-based selection highlight (► prefix + bright text)
 *
 * DISPLAY:
 *   Screen Resolution — dropdown (8 standard 16:9 options)
 *
 * PERFORMANCE:
 *   FPS Limit (30 / 60 / Unlimited)
 *
 * CAMERA:
 *   Camera Lag slider (0.03 – 0.50)
 *
 * CONTROLS: (submenu with dropdowns)
 *   Movement Keys (Arrow Keys / WASD)
 *   Action Button  (Mouse Click / Enter / E / Space)
 *
 * SOUND:
 *   BGM / BGS / ME / SE Volume
 *
 * PLUGIN ORDER: Load AFTER KurtsCameraLag, KurtsKeyMapper, KurtsFPSLogger
 *
 * v3.1: Saved resolution is re-applied after boot (Scene_Boot was resetting to
 * database size). Title command text/rows scale with box width vs 1280. Resolution
 * choice saves immediately when confirmed in the dropdown.
 * v3.2: Options + Controls menus use the same 1280-ref scaling as the title menu.
 * ============================================================================
 */

(() => {
    'use strict';

    // ========================================================================
    // Configuration Constants
    // ========================================================================
    const RESOLUTIONS = [
        { label: '640 x 360 (nHD)',      short: '640 x 360',   w: 640,  h: 360  },
        { label: '854 x 480 (FWVGA)',    short: '854 x 480',   w: 854,  h: 480  },
        { label: '960 x 540 (qHD)',      short: '960 x 540',   w: 960,  h: 540  },
        { label: '1024 x 576 (WSVGA)',   short: '1024 x 576',  w: 1024, h: 576  },
        { label: '1280 x 720 (HD)',      short: '1280 x 720',  w: 1280, h: 720  },
        { label: '1366 x 768 (FWXGA)',   short: '1366 x 768',  w: 1366, h: 768  },
        { label: '1600 x 900 (HD+)',     short: '1600 x 900',  w: 1600, h: 900  },
        { label: '1920 x 1080 (FHD)',    short: '1920 x 1080', w: 1920, h: 1080 }
    ];

    const FPS_OPTIONS = [
        { label: '30 FPS',    value: 30 },
        { label: '60 FPS',    value: 60 },
        { label: 'Unlimited', value: 0  }
    ];

    const CAMERA_LAG_MIN  = 0.03;
    const CAMERA_LAG_MAX  = 0.50;
    const CAMERA_LAG_STEP = 0.01;

    const MOVEMENT_OPTIONS = [
        { label: 'Arrow Keys', value: 'arrows' },
        { label: 'WASD',       value: 'wasd'   }
    ];

    const ACTION_OPTIONS = [
        { label: 'Mouse Click', value: 'mouse' },
        { label: 'Enter',       value: 'enter' },
        { label: 'E',           value: 'e'     },
        { label: 'Space',       value: 'space'  }
    ];

    const MENU_BG_NAME       = 'menuBg';           // img/pictures/menuBg.png
    const WINDOW_RIGHT_MARGIN = 24;                 // px from right edge
    const DEFAULT_RES_INDEX   = 4;                  // 1280 x 720
    /** Title menu text/row sizing: same screen fraction as at 1280×720 */
    const MENU_REF_WIDTH      = 1280;
    const TITLE_BASE_LINE_H   = 36;
    const TITLE_ROW_EXTRA     = 8;                  // selectable row gap (engine default)

    // --- Font & Title ---
    const CUSTOM_FONT_NAME = 'RoyalnCurvy';
    const CUSTOM_FONT_FILE = 'RoyalnCurvy.ttf';
    const TITLE_TEXT       = 'LINE';

    // --- Selection colours ---
    const SELECTED_COLOR = '#ffffff';
    const NORMAL_COLOR   = 'rgba(200,200,200,0.65)';

    // ========================================================================
    // Load Custom Font (globally)
    // ========================================================================
    FontManager.load(CUSTOM_FONT_NAME, CUSTOM_FONT_FILE);

    Game_System.prototype.mainFontFace = function() {
        return CUSTOM_FONT_NAME + ', ' + $dataSystem.advanced.fallbackFonts;
    };

    // ========================================================================
    // ConfigManager extensions — save / load custom settings
    // ========================================================================
    if (ConfigManager.screenResolution === undefined) ConfigManager.screenResolution = DEFAULT_RES_INDEX;
    if (ConfigManager.fpsLimit === undefined)         ConfigManager.fpsLimit = 60;
    if (ConfigManager.cameraLag === undefined)        ConfigManager.cameraLag = 0.15;
    if (ConfigManager.movementKeys === undefined)     ConfigManager.movementKeys = 'arrows';
    if (ConfigManager.actionButton === undefined)     ConfigManager.actionButton = 'mouse';

    const _ConfigManager_makeData = ConfigManager.makeData;
    ConfigManager.makeData = function() {
        const config = _ConfigManager_makeData.call(this);
        config.screenResolution = this.screenResolution;
        config.fpsLimit         = this.fpsLimit;
        config.cameraLag        = this.cameraLag;
        config.movementKeys     = this.movementKeys;
        config.actionButton     = this.actionButton;
        return config;
    };

    const _ConfigManager_applyData = ConfigManager.applyData;
    ConfigManager.applyData = function(config) {
        _ConfigManager_applyData.call(this, config);
        const rawRes = config.screenResolution !== undefined
            ? Number(config.screenResolution) : DEFAULT_RES_INDEX;
        this.screenResolution = Math.max(0, Math.min(rawRes, RESOLUTIONS.length - 1));
        this.fpsLimit = config.fpsLimit !== undefined
            ? Number(config.fpsLimit) : 60;
        this.cameraLag = config.cameraLag !== undefined
            ? Number(config.cameraLag) : 0.15;
        this.movementKeys = config.movementKeys || 'arrows';
        this.actionButton = config.actionButton || 'mouse';
        applyResolution(this.screenResolution);
        applyKeyMappings();
    };

    // ========================================================================
    // Apply helpers
    // ========================================================================
    function applyResolution(index) {
        const res = RESOLUTIONS[index];
        if (!res) return;
        Graphics.resize(res.w, res.h);
        Graphics.boxWidth  = res.w;
        Graphics.boxHeight = res.h;
        if (typeof nw !== 'undefined' && nw.Window) {
            const win = nw.Window.get();
            if (win) win.resizeTo(res.w, res.h);
        }
    }

    function applyKeyMappings() {
        if (typeof KurtsKeyMapper_apply === 'function') KurtsKeyMapper_apply();
    }

    function titleMenuScale() {
        return Graphics.boxWidth / MENU_REF_WIDTH;
    }

    function menuScaledLineHeight() {
        return Math.max(1, Math.round(TITLE_BASE_LINE_H * titleMenuScale()));
    }

    function menuScaledItemHeight() {
        return (
            menuScaledLineHeight() +
            Math.max(0, Math.round(TITLE_ROW_EXTRA * titleMenuScale()))
        );
    }

    function menuScaledWindowPadding() {
        return Math.max(12, Math.round($gameSystem.windowPadding() * titleMenuScale()));
    }

    /** Selectable list rows (title / options / controls / dropdowns) */
    function menuListWindowHeightSelectable(numLines) {
        return numLines * menuScaledItemHeight() + menuScaledWindowPadding() * 2;
    }

    /** Single-line header rows (e.g. Controls title bar) */
    function menuListWindowHeightNonSelectable(numLines) {
        return numLines * menuScaledLineHeight() + menuScaledWindowPadding() * 2;
    }

    function menuScaledMargin() {
        return Math.max(8, Math.round(10 * titleMenuScale()));
    }

    function menuScaledRightMargin() {
        return Math.max(8, Math.round(WINDOW_RIGHT_MARGIN * titleMenuScale()));
    }

    /** Window height for N title command rows */
    function titleCommandWindowHeight(numLines) {
        return menuListWindowHeightSelectable(numLines);
    }

    // Scene_Boot.resizeScreen() reapplies $dataSystem resolution after async config load;
    // re-apply saved user resolution so it persists across launches.
    const _Scene_Boot_resizeScreen = Scene_Boot.prototype.resizeScreen;
    Scene_Boot.prototype.resizeScreen = function() {
        _Scene_Boot_resizeScreen.call(this);
        applyResolution(ConfigManager.screenResolution);
        Graphics.defaultScale = this.screenScale();
    };

    // ========================================================================
    // Background helpers (shared by several scenes)
    // ========================================================================
    function createMenuBackground(scene) {
        scene._backgroundSprite = new Sprite();
        scene._backgroundSprite.bitmap = ImageManager.loadPicture(MENU_BG_NAME);
        scene._backgroundSprite.bitmap.addLoadListener(function() {
            rescaleMenuBackground(scene);
        });
        scene.addChild(scene._backgroundSprite);
    }

    function rescaleMenuBackground(scene) {
        if (!scene._backgroundSprite || !scene._backgroundSprite.bitmap) return;
        const bmp = scene._backgroundSprite.bitmap;
        if (bmp.width > 0 && bmp.height > 0) {
            scene._backgroundSprite.scale.x = Graphics.width  / bmp.width;
            scene._backgroundSprite.scale.y = Graphics.height / bmp.height;
        }
    }

    // ========================================================================
    // Options / Controls / dropdown list windows — same row & font scale as title
    // ========================================================================
    function patchMenuListWindow(WindowClass) {
        WindowClass.prototype.lineHeight = function() {
            return menuScaledLineHeight();
        };
        WindowClass.prototype.itemHeight = function() {
            return menuScaledItemHeight();
        };
        const _menuListResetFont = Window_Base.prototype.resetFontSettings;
        WindowClass.prototype.resetFontSettings = function() {
            _menuListResetFont.call(this);
            this.contents.fontSize = Math.max(
                8,
                Math.round($gameSystem.mainFontSize() * titleMenuScale())
            );
        };
        WindowClass.prototype.updatePadding = function() {
            Window_Base.prototype.updatePadding.call(this);
            this.padding = menuScaledWindowPadding();
        };
    }

    // ========================================================================
    // Custom window styling helper
    // — hides cursor rect, removes row backgrounds, redraws on select
    // ========================================================================
    function enableCustomStyle(WindowClass) {
        const _origSelect = WindowClass.prototype.select;
        WindowClass.prototype.select = function(index) {
            const prev = this._index;
            _origSelect.call(this, index);
            if (this.contents && prev !== index) {
                if (prev >= 0) this.redrawItem(prev);
                if (index >= 0) this.redrawItem(index);
            }
        };

        WindowClass.prototype.refreshCursor = function() {
            this.setCursorRect(0, 0, 0, 0);
        };

        WindowClass.prototype.drawItemBackground = function() {};
    }

    // Apply to built-in window classes now (they already exist)
    enableCustomStyle(Window_TitleCommand);
    enableCustomStyle(Window_Options);
    patchMenuListWindow(Window_Options);

    Window_TitleCommand.prototype.lineHeight = function() {
        return Math.max(1, Math.round(TITLE_BASE_LINE_H * titleMenuScale()));
    };

    Window_TitleCommand.prototype.itemHeight = function() {
        return this.lineHeight() + Math.max(0, Math.round(TITLE_ROW_EXTRA * titleMenuScale()));
    };

    const _WTC_resetFontSettings = Window_Base.prototype.resetFontSettings;
    Window_TitleCommand.prototype.resetFontSettings = function() {
        _WTC_resetFontSettings.call(this);
        this.contents.fontSize = Math.max(
            8,
            Math.round($gameSystem.mainFontSize() * titleMenuScale())
        );
    };

    // ========================================================================
    // Window_TitleCommand — custom draw with selection highlight
    // ========================================================================
    Window_TitleCommand.prototype.drawItem = function(index) {
        const rect = this.itemLineRect(index);
        const isSelected = (index === this.index());
        this.changePaintOpacity(this.isCommandEnabled(index));
        this.contents.textColor = isSelected ? SELECTED_COLOR : NORMAL_COLOR;
        const prefix = isSelected ? '\u25BA  ' : '';
        this.drawText(prefix + this.commandName(index), rect.x, rect.y, rect.width, 'right');
        this.resetTextColor();
    };

    // ========================================================================
    // Symbol helpers
    // ========================================================================
    function isHeader(s)   { return s.startsWith('header_'); }
    function isChoice(s)   { return s === 'fpsLimit'; }
    function isSlider(s)   { return s === 'cameraLag'; }
    function isSubmenu(s)  { return s === 'controls'; }
    function isDropdown(s) { return s === 'screenResolution'; }

    // ========================================================================
    //  Window_Options — build command list
    // ========================================================================
    Window_Options.prototype.makeCommandList = function() {
        this.addCommand('--- Display ---',      'header_display');
        this.addCommand('Resolution',           'screenResolution');
        this.addCommand('--- Performance ---',   'header_performance');
        this.addCommand('FPS Limit',            'fpsLimit');
        this.addCommand('--- Camera ---',        'header_camera');
        this.addCommand('Camera Lag',           'cameraLag');
        this.addCommand('--- Controls ---',      'header_controls');
        this.addCommand('Controls',             'controls');
        this.addCommand('--- Sound ---',         'header_sound');
        this.addCommand(TextManager.bgmVolume,  'bgmVolume');
        this.addCommand(TextManager.bgsVolume,  'bgsVolume');
        this.addCommand(TextManager.meVolume,   'meVolume');
        this.addCommand(TextManager.seVolume,   'seVolume');
    };

    // ========================================================================
    //  Status text per symbol
    // ========================================================================
    Window_Options.prototype.statusText = function(index) {
        const sym = this.commandSymbol(index);
        if (isHeader(sym))  return '';
        if (isSubmenu(sym)) return '\u25BA';
        if (this.isVolumeSymbol(sym))
            return this.volumeStatusText(this.getConfigValue(sym));

        if (sym === 'screenResolution') {
            const i = ConfigManager.screenResolution || 0;
            const r = RESOLUTIONS[i];
            return r ? r.short + ' \u25BC' : '???';
        }
        if (sym === 'fpsLimit') {
            const o = FPS_OPTIONS.find(e => e.value === ConfigManager.fpsLimit);
            return o ? o.label : ConfigManager.fpsLimit + ' FPS';
        }
        if (sym === 'cameraLag') return '';
        return this.booleanStatusText(this.getConfigValue(sym));
    };

    Window_Options.prototype.statusWidth = function() {
        return Math.max(80, Math.round(200 * titleMenuScale()));
    };

    // ========================================================================
    //  Draw items — headers, slider gauge, default (with selection highlight)
    // ========================================================================
    Window_Options.prototype.drawItem = function(index) {
        const sym = this.commandSymbol(index);
        const isSelected = (index === this.index());

        // Header row — always system colour, no selection indicator
        if (isHeader(sym)) {
            const rect = this.itemLineRect(index);
            this.changeTextColor(ColorManager.systemColor());
            this.changePaintOpacity(true);
            this.drawText(this.commandName(index), rect.x, rect.y, rect.width, 'left');
            this.resetTextColor();
            return;
        }

        // Slider row (camera lag)
        if (isSlider(sym)) {
            this._drawSlider(index);
            return;
        }

        // Standard row
        const title  = this.commandName(index);
        const status = this.statusText(index);
        const rect   = this.itemLineRect(index);
        const sw     = this.statusWidth();
        const tw     = rect.width - sw;

        this.changePaintOpacity(this.isCommandEnabled(index));
        this.contents.textColor = isSelected ? SELECTED_COLOR : NORMAL_COLOR;
        const prefix = isSelected ? '\u25BA ' : '   ';
        this.drawText(prefix + title,  rect.x,      rect.y, tw, 'left');
        this.drawText(status, rect.x + tw, rect.y, sw, 'right');
        this.resetTextColor();
    };

    // --- Visual slider gauge for camera lag (with selection awareness) ---
    Window_Options.prototype._drawSlider = function(index) {
        const rect  = this.itemLineRect(index);
        const isSelected = (index === this.index());
        const sw    = this.statusWidth();
        const tw    = rect.width - sw;
        const value = ConfigManager.cameraLag;
        const rate  = (value - CAMERA_LAG_MIN) / (CAMERA_LAG_MAX - CAMERA_LAG_MIN);

        // Title text
        this.changePaintOpacity(true);
        this.contents.textColor = isSelected ? SELECTED_COLOR : NORMAL_COLOR;
        const prefix = isSelected ? '\u25BA ' : '   ';
        this.drawText(prefix + this.commandName(index), rect.x, rect.y, tw, 'left');

        // Gauge dimensions (scale with menu ref)
        const s = titleMenuScale();
        const textW  = Math.max(28, Math.round(44 * s));
        const gap    = Math.max(2, Math.round(4 * s));
        const gaugeX = rect.x + tw + gap;
        const gaugeW = Math.max(20, sw - textW - gap * 2);
        const gaugeH = Math.max(6, Math.round(12 * s));
        const gaugeY = rect.y + Math.floor((rect.height - gaugeH) / 2);

        // Background
        this.contents.fillRect(gaugeX, gaugeY, gaugeW, gaugeH, 'rgba(0,0,0,0.6)');
        // Fill
        const fillW = Math.round(gaugeW * Math.max(0, Math.min(1, rate)));
        if (fillW > 0) {
            this.contents.gradientFillRect(
                gaugeX, gaugeY, fillW, gaugeH, '#2266aa', '#44aaff'
            );
        }
        // Border
        const bc = isSelected ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)';
        this.contents.fillRect(gaugeX, gaugeY, gaugeW, 1, bc);
        this.contents.fillRect(gaugeX, gaugeY + gaugeH - 1, gaugeW, 1, bc);
        this.contents.fillRect(gaugeX, gaugeY, 1, gaugeH, bc);
        this.contents.fillRect(gaugeX + gaugeW - 1, gaugeY, 1, gaugeH, bc);

        // Value label
        this.drawText(
            value.toFixed(2),
            gaugeX + gaugeW + gap, rect.y, textW, 'right'
        );
        this.resetTextColor();
    };

    // ========================================================================
    //  Headers are not selectable & skip them on navigate
    // ========================================================================
    Window_Options.prototype.isCurrentItemEnabled = function() {
        return !isHeader(this.commandSymbol(this.index()));
    };

    const _WO_cursorDown = Window_Options.prototype.cursorDown;
    Window_Options.prototype.cursorDown = function(wrap) {
        _WO_cursorDown.call(this, wrap);
        this._skipHeaders(1, wrap);
    };

    const _WO_cursorUp = Window_Options.prototype.cursorUp;
    Window_Options.prototype.cursorUp = function(wrap) {
        _WO_cursorUp.call(this, wrap);
        this._skipHeaders(-1, wrap);
    };

    Window_Options.prototype._skipHeaders = function(dir, wrap) {
        let n = 0;
        while (isHeader(this.commandSymbol(this.index())) && n < this.maxItems()) {
            const i = this.index() + dir;
            if (i >= 0 && i < this.maxItems()) {
                this.select(i);
            } else if (wrap) {
                this.select(dir > 0 ? 0 : this.maxItems() - 1);
            } else {
                this.select(this.index() - dir);
                break;
            }
            n++;
        }
    };

    // Start cursor on first real option (skip first header)
    const _WO_initialize = Window_Options.prototype.initialize;
    Window_Options.prototype.initialize = function(rect) {
        _WO_initialize.call(this, rect);
        if (this.maxItems() > 1 && isHeader(this.commandSymbol(0))) {
            this.select(1);
        }
    };

    // ========================================================================
    //  OK / Left / Right handlers
    // ========================================================================
    Window_Options.prototype.processOk = function() {
        const sym = this.commandSymbol(this.index());
        if (isHeader(sym)) return;

        // Open submenu
        if (isSubmenu(sym)) {
            SoundManager.playOk();
            SceneManager.push(Scene_Controls);
            return;
        }

        // Open dropdown (resolution)
        if (isDropdown(sym)) {
            SoundManager.playOk();
            this._pendingDropdownSymbol = sym;
            this.deactivate();
            this.callHandler('dropdown');
            return;
        }

        if (this.isVolumeSymbol(sym))  this.changeVolume(sym, true, true);
        else if (isChoice(sym))         this.cycleChoice(sym, 1);
        else if (isSlider(sym))         this.changeSlider(sym, 1);
        else                             this.changeValue(sym, !this.getConfigValue(sym));
    };

    Window_Options.prototype.cursorRight = function() {
        const sym = this.commandSymbol(this.index());
        if (isHeader(sym) || isSubmenu(sym) || isDropdown(sym)) return;
        if (this.isVolumeSymbol(sym))  this.changeVolume(sym, true, false);
        else if (isChoice(sym))         this.cycleChoice(sym, 1);
        else if (isSlider(sym))         this.changeSlider(sym, 1);
        else                             this.changeValue(sym, true);
    };

    Window_Options.prototype.cursorLeft = function() {
        const sym = this.commandSymbol(this.index());
        if (isHeader(sym) || isSubmenu(sym) || isDropdown(sym)) return;
        if (this.isVolumeSymbol(sym))  this.changeVolume(sym, false, false);
        else if (isChoice(sym))         this.cycleChoice(sym, -1);
        else if (isSlider(sym))         this.changeSlider(sym, -1);
        else                             this.changeValue(sym, false);
    };

    // ========================================================================
    //  Cycle through discrete choices (FPS only now)
    // ========================================================================
    Window_Options.prototype.cycleChoice = function(symbol, direction) {
        if (symbol === 'fpsLimit') {
            const opts = FPS_OPTIONS;
            const cv   = ConfigManager.fpsLimit;
            let ci     = opts.findIndex(o => o.value === cv);
            if (ci < 0) ci = 1;
            ci = (ci + direction + opts.length) % opts.length;
            ConfigManager.fpsLimit = opts[ci].value;
        }
        this.redrawItem(this.findSymbol(symbol));
        this.playCursorSound();
    };

    // ========================================================================
    //  Slider adjustment (camera lag)
    // ========================================================================
    Window_Options.prototype.changeSlider = function(symbol, direction) {
        if (symbol !== 'cameraLag') return;
        let v = ConfigManager.cameraLag || 0.15;
        v += direction * CAMERA_LAG_STEP;
        v  = Math.max(CAMERA_LAG_MIN, Math.min(CAMERA_LAG_MAX, v));
        v  = Math.round(v * 100) / 100;
        if (v !== ConfigManager.cameraLag) {
            ConfigManager.cameraLag = v;
            this.redrawItem(this.findSymbol(symbol));
            this.playCursorSound();
        }
    };

    // ========================================================================
    //  Scene_Options overrides
    // ========================================================================
    Scene_Options.prototype.maxCommands = function() {
        return 13;
    };

    Scene_Options.prototype.maxVisibleCommands = function() {
        return 13;
    };

    // --- Custom background: menuBg.png ---
    Scene_Options.prototype.createBackground = function() {
        createMenuBackground(this);
    };

    // --- Override create to also build a resolution dropdown ---
    const _Scene_Options_create = Scene_Options.prototype.create;
    Scene_Options.prototype.create = function() {
        _Scene_Options_create.call(this);
        this.createResolutionDropdown();
    };

    // --- Transparent window, positioned centre-right ---
    const _Scene_Options_createOptionsWindow = Scene_Options.prototype.createOptionsWindow;
    Scene_Options.prototype.createOptionsWindow = function() {
        _Scene_Options_createOptionsWindow.call(this);
        this._optionsWindow.opacity = 0;
        this._optionsWindow.setHandler('dropdown', this.onOptionDropdown.bind(this));
    };

    Scene_Options.prototype.optionsWindowRect = function() {
        const n = Math.min(this.maxCommands(), this.maxVisibleCommands());
        const m = menuScaledMargin();
        const rm = menuScaledRightMargin();
        const s = titleMenuScale();
        const ww = Math.min(
            Math.max(200, Math.round(500 * s)),
            Graphics.boxWidth - m * 2
        );
        const idealH = menuListWindowHeightSelectable(n);
        const wh = Math.min(idealH, Graphics.boxHeight - m * 2);
        const wx = Math.max(m, Graphics.boxWidth - ww - rm);
        const wy = Math.round((Graphics.boxHeight - wh) / 2);
        return new Rectangle(wx, wy, ww, wh);
    };

    // --- Apply resolution only when leaving the options scene ---
    const _Scene_Options_terminate = Scene_Options.prototype.terminate;
    Scene_Options.prototype.terminate = function() {
        _Scene_Options_terminate.call(this);
        applyResolution(ConfigManager.screenResolution);
    };

    // --- Resolution dropdown window (hidden until needed) ---
    Scene_Options.prototype.createResolutionDropdown = function() {
        this._resDropdown = new Window_ControlDropdown(new Rectangle(0, 0, 10, 10));
        this._resDropdown.setHandler('ok',     this.onResDropdownOk.bind(this));
        this._resDropdown.setHandler('cancel', this.onResDropdownCancel.bind(this));
        this._resDropdown.hide();
        this._resDropdown.deactivate();
        this.addWindow(this._resDropdown);
    };

    Scene_Options.prototype.onOptionDropdown = function() {
        const sym = this._optionsWindow._pendingDropdownSymbol;
        if (sym === 'screenResolution') {
            this.openResolutionDropdown();
        }
    };

    Scene_Options.prototype.openResolutionDropdown = function() {
        const ow  = this._optionsWindow;
        const idx = ow.findSymbol('screenResolution');
        const ir  = ow.itemRect(idx);

        const s = titleMenuScale();
        const m = menuScaledMargin();
        const dropW = Math.max(160, Math.round(280 * s));
        const idealH = menuListWindowHeightSelectable(RESOLUTIONS.length);
        const dropH  = Math.min(idealH, Graphics.boxHeight - m * 2);

        let dropX = ow.x + ow.width - dropW;
        let dropY = ow.y + ow.padding + ir.y + ir.height;

        if (dropX + dropW > Graphics.boxWidth)  dropX = Graphics.boxWidth  - dropW;
        if (dropX < 0) dropX = 0;
        if (dropY + dropH > Graphics.boxHeight) dropY = ow.y + ow.padding + ir.y - dropH;
        if (dropY < 0) dropY = 0;

        const currentIdx = ConfigManager.screenResolution || 0;
        const resOptions = RESOLUTIONS.map(function(r, i) {
            return { label: r.label, value: i };
        });

        this._resDropdown.move(dropX, dropY, dropW, dropH);
        this._resDropdown.createContents();
        this._resDropdown.setOptions(resOptions, currentIdx, 'screenResolution');
        this._resDropdown.show();
        this._resDropdown.activate();
        this._resDropdown.select(currentIdx);
    };

    Scene_Options.prototype.onResDropdownOk = function() {
        const sel = this._resDropdown.currentOption();
        if (sel) {
            ConfigManager.screenResolution = sel.value;
            this._optionsWindow.refresh();
            ConfigManager.save();
        }
        this._closeResDropdown();
    };

    Scene_Options.prototype.onResDropdownCancel = function() {
        this._closeResDropdown();
    };

    Scene_Options.prototype._closeResDropdown = function() {
        this._resDropdown.hide();
        this._resDropdown.deactivate();
        this._optionsWindow.activate();
    };

    // ========================================================================
    //  Scene_Title — custom background, title text, command window
    // ========================================================================

    // --- Background: menuBg.png ---
    Scene_Title.prototype.createBackground = function() {
        this._backSprite1 = new Sprite();
        this._backSprite2 = new Sprite();
        this.addChild(this._backSprite1);
        this.addChild(this._backSprite2);
        const bmp = ImageManager.loadPicture(MENU_BG_NAME);
        this._backSprite1.bitmap = bmp;
        bmp.addLoadListener(function() {
            if (bmp.width > 0 && bmp.height > 0) {
                this._backSprite1.scale.x = Graphics.width  / bmp.width;
                this._backSprite1.scale.y = Graphics.height / bmp.height;
            }
        }.bind(this));
    };

    Scene_Title.prototype.adjustBackground = function() {};

    // --- Foreground: always draw custom title ---
    Scene_Title.prototype.createForeground = function() {
        this._gameTitleSprite = new Sprite(
            new Bitmap(Graphics.width, Graphics.height)
        );
        this.addChild(this._gameTitleSprite);
        this.drawGameTitle();
    };

    // --- Draw "LINE" at top-right ---
    Scene_Title.prototype.drawGameTitle = function() {
        const bitmap = this._gameTitleSprite.bitmap;
        bitmap.fontFace = CUSTOM_FONT_NAME + ', sans-serif';
        bitmap.outlineColor = 'rgba(0,0,0,0.7)';
        const ts = titleMenuScale();
        bitmap.outlineWidth = Math.max(2, Math.round(6 * ts));
        bitmap.fontSize = Math.max(16, Math.round(80 * ts));

        const titleW = Math.round(400 * ts);
        const titleX =
            Graphics.width - titleW - menuScaledRightMargin() - Math.round(12 * ts);
        const titleY = Math.round(Graphics.height * 0.13);

        bitmap.drawText(TITLE_TEXT, titleX, titleY, titleW, Math.round(80 * ts), 'right');
    };

    // --- Command window: centre-right, transparent ---
    Scene_Title.prototype.commandWindowRect = function() {
        const s = titleMenuScale();
        const ww = Math.min(Math.max(120, Math.round(300 * s)), Graphics.boxWidth - 20);
        const wh = titleCommandWindowHeight(3);
        const wx = Math.max(menuScaledMargin(), Graphics.boxWidth - ww - menuScaledRightMargin());
        const wy = Math.round((Graphics.boxHeight - wh) / 2);
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Title.prototype.createCommandWindow = function() {
        const rect = this.commandWindowRect();
        this._commandWindow = new Window_TitleCommand(rect);
        this._commandWindow.opacity = 0;
        this._commandWindow.setHandler("newGame",  this.commandNewGame.bind(this));
        this._commandWindow.setHandler("continue", this.commandContinue.bind(this));
        this._commandWindow.setHandler("options",  this.commandOptions.bind(this));
        this.addWindow(this._commandWindow);
    };

    // ========================================================================
    //  Scene_Menu — custom background (menuBg.png)
    // ========================================================================
    Scene_Menu.prototype.createBackground = function() {
        createMenuBackground(this);
    };

    // ====================================================================
    // ====================================================================
    //  CONTROLS SUBMENU  (Scene_Controls + dropdown windows)
    // ====================================================================
    // ====================================================================

    // ========================================================================
    //  Scene_Controls
    // ========================================================================
    function Scene_Controls() {
        this.initialize(...arguments);
    }

    Scene_Controls.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_Controls.prototype.constructor = Scene_Controls;

    Scene_Controls.prototype.initialize = function() {
        Scene_MenuBase.prototype.initialize.call(this);
    };

    Scene_Controls.prototype.createBackground = function() {
        createMenuBackground(this);
    };

    Scene_Controls.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this.createTitleWindow();
        this.createControlsWindow();
        this.createDropdownWindow();
    };

    Scene_Controls.prototype.terminate = function() {
        Scene_MenuBase.prototype.terminate.call(this);
        ConfigManager.save();
    };

    Scene_Controls.prototype.createTitleWindow = function() {
        const rect = this.titleWindowRect();
        this._titleWindow = new Window_Base(rect);
        this._titleWindow.opacity = 0;
        this._titleWindow.padding = menuScaledWindowPadding();
        this._titleWindow.createContents();
        this._titleWindow.contents.fontFace = CUSTOM_FONT_NAME + ', sans-serif';
        this._titleWindow.contents.fontSize = Math.max(
            8,
            Math.round($gameSystem.mainFontSize() * titleMenuScale())
        );
        this._titleWindow.drawText(
            'Controls', 0, 0,
            rect.width - this._titleWindow.padding * 2, 'center'
        );
        this.addWindow(this._titleWindow);
    };

    Scene_Controls.prototype.titleWindowRect = function() {
        const s = titleMenuScale();
        const m = menuScaledMargin();
        const rm = menuScaledRightMargin();
        const gap = Math.max(2, Math.round(4 * s));
        const ww = Math.min(
            Math.max(200, Math.round(420 * s)),
            Graphics.boxWidth - m * 2
        );
        const wh = menuListWindowHeightNonSelectable(1);
        const totalH = wh + gap + menuListWindowHeightSelectable(2);
        const wx = Math.max(m, Graphics.boxWidth - ww - rm);
        const wy = Math.round((Graphics.boxHeight - totalH) / 2);
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Controls.prototype.createControlsWindow = function() {
        const rect = this.controlsWindowRect();
        this._controlsWindow = new Window_ControlOptions(rect);
        this._controlsWindow.opacity = 0;
        this._controlsWindow.setHandler('cancel', this.popScene.bind(this));
        this._controlsWindow.setHandler('ok',     this.onControlOk.bind(this));
        this.addWindow(this._controlsWindow);
    };

    Scene_Controls.prototype.controlsWindowRect = function() {
        const titleRect = this.titleWindowRect();
        const ww = titleRect.width;
        const wh = menuListWindowHeightSelectable(2);
        const wx = titleRect.x;
        const wy = titleRect.y + titleRect.height + Math.max(2, Math.round(4 * titleMenuScale()));
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Controls.prototype.createDropdownWindow = function() {
        this._dropdownWindow = new Window_ControlDropdown(new Rectangle(0, 0, 10, 10));
        this._dropdownWindow.setHandler('ok',     this.onDropdownOk.bind(this));
        this._dropdownWindow.setHandler('cancel', this.onDropdownCancel.bind(this));
        this._dropdownWindow.hide();
        this._dropdownWindow.deactivate();
        this.addWindow(this._dropdownWindow);
    };

    Scene_Controls.prototype.onControlOk = function() {
        const sym = this._controlsWindow.currentSymbol();
        let options, currentValue;

        if (sym === 'movementKeys') {
            options      = MOVEMENT_OPTIONS;
            currentValue = ConfigManager.movementKeys;
        } else if (sym === 'actionButton') {
            options      = ACTION_OPTIONS;
            currentValue = ConfigManager.actionButton;
        } else {
            this._controlsWindow.activate();
            return;
        }

        const cw  = this._controlsWindow;
        const ir  = cw.itemRect(cw.index());
        const s = titleMenuScale();
        const dropW = Math.max(120, Math.round(200 * s));
        const dropH = menuListWindowHeightSelectable(options.length);

        let dropX = cw.x + cw.width - dropW;
        let dropY = cw.y + cw.padding + ir.y + ir.height;

        if (dropX + dropW > Graphics.boxWidth)  dropX = Graphics.boxWidth  - dropW;
        if (dropX < 0) dropX = 0;
        if (dropY + dropH > Graphics.boxHeight) dropY = cw.y + cw.padding + ir.y - dropH;
        if (dropY < 0) dropY = 0;

        this._dropdownWindow.move(dropX, dropY, dropW, dropH);
        this._dropdownWindow.createContents();
        this._dropdownWindow.setOptions(options, currentValue, sym);
        this._dropdownWindow.show();
        this._dropdownWindow.activate();

        const si = options.findIndex(o => o.value === currentValue);
        this._dropdownWindow.select(si >= 0 ? si : 0);
    };

    Scene_Controls.prototype.onDropdownOk = function() {
        const sym = this._dropdownWindow._controlSymbol;
        const sel = this._dropdownWindow.currentOption();
        if (sel) {
            ConfigManager[sym] = sel.value;
            applyKeyMappings();
            this._controlsWindow.refresh();
        }
        this._closeDropdown();
    };

    Scene_Controls.prototype.onDropdownCancel = function() {
        this._closeDropdown();
    };

    Scene_Controls.prototype._closeDropdown = function() {
        this._dropdownWindow.hide();
        this._dropdownWindow.deactivate();
        this._controlsWindow.activate();
    };

    window.Scene_Controls = Scene_Controls;

    // ========================================================================
    //  Window_ControlOptions — the control settings list
    // ========================================================================
    function Window_ControlOptions() {
        this.initialize(...arguments);
    }

    Window_ControlOptions.prototype = Object.create(Window_Command.prototype);
    Window_ControlOptions.prototype.constructor = Window_ControlOptions;

    Window_ControlOptions.prototype.initialize = function(rect) {
        Window_Command.prototype.initialize.call(this, rect);
    };

    Window_ControlOptions.prototype.makeCommandList = function() {
        this.addCommand('Movement Keys', 'movementKeys');
        this.addCommand('Action Button', 'actionButton');
    };

    // ========================================================================
    //  Window_ControlDropdown — popup choice list (used by Options & Controls)
    // ========================================================================
    function Window_ControlDropdown() {
        this.initialize(...arguments);
    }

    Window_ControlDropdown.prototype = Object.create(Window_Command.prototype);
    Window_ControlDropdown.prototype.constructor = Window_ControlDropdown;

    Window_ControlDropdown.prototype.initialize = function(rect) {
        this._options       = [];
        this._controlSymbol = '';
        this._currentValue  = '';
        Window_Command.prototype.initialize.call(this, rect);
        // Dim background (dark translucent) without windowskin borders
        this.setBackgroundType(1);
    };

    Window_ControlDropdown.prototype.setOptions = function(opts, current, symbol) {
        this._options       = opts;
        this._currentValue  = current;
        this._controlSymbol = symbol;
        this.refresh();
    };

    Window_ControlDropdown.prototype.makeCommandList = function() {
        for (const o of this._options) {
            this.addCommand(o.label, o.value);
        }
    };

    Window_ControlDropdown.prototype.currentOption = function() {
        return this._options[this.index()] || null;
    };

    // ========================================================================
    //  Apply custom styling to control windows (now that they exist)
    // ========================================================================
    enableCustomStyle(Window_ControlOptions);
    enableCustomStyle(Window_ControlDropdown);
    patchMenuListWindow(Window_ControlOptions);
    patchMenuListWindow(Window_ControlDropdown);

    // ========================================================================
    //  Window_ControlOptions — draw with selection highlight
    // ========================================================================
    Window_ControlOptions.prototype.drawItem = function(index) {
        const rect   = this.itemLineRect(index);
        const symbol = this.commandSymbol(index);
        const isSelected = (index === this.index());
        const sw     = Math.max(100, Math.round(170 * titleMenuScale()));
        const tw     = rect.width - sw;

        this.changePaintOpacity(true);
        this.contents.textColor = isSelected ? SELECTED_COLOR : NORMAL_COLOR;

        const prefix = isSelected ? '\u25BA ' : '   ';
        this.drawText(prefix + this.commandName(index), rect.x, rect.y, tw, 'left');

        let label = '';
        if (symbol === 'movementKeys') {
            const o = MOVEMENT_OPTIONS.find(e => e.value === ConfigManager.movementKeys);
            label = o ? o.label : ConfigManager.movementKeys;
        } else if (symbol === 'actionButton') {
            const o = ACTION_OPTIONS.find(e => e.value === ConfigManager.actionButton);
            label = o ? o.label : ConfigManager.actionButton;
        }

        this.drawText(label + ' \u25BC', rect.x + tw, rect.y, sw, 'right');
        this.resetTextColor();
    };

    // ========================================================================
    //  Window_ControlDropdown — draw with selection highlight
    // ========================================================================
    Window_ControlDropdown.prototype.drawItem = function(index) {
        const rect = this.itemLineRect(index);
        const opt  = this._options[index];
        if (!opt) return;

        const isSelected = (index === this.index());
        this.changePaintOpacity(true);

        if (isSelected) {
            this.contents.textColor = SELECTED_COLOR;
        } else if (opt.value === this._currentValue) {
            this.changeTextColor(ColorManager.systemColor());
        } else {
            this.contents.textColor = NORMAL_COLOR;
        }

        const prefix = isSelected ? '\u25BA ' : '   ';
        this.drawText(prefix + opt.label, rect.x, rect.y, rect.width, 'left');
        this.resetTextColor();
    };

})();

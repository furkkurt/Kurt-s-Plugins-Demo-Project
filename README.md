# RPG Maker MZ — Kurts plugin suite

Custom plugins and conventions for this project: resolution-aware UI, camera, cutscenes, interaction, animation, and options.  
**Author:** Furkan Kurt

---

## Table of contents

1. [Quick reference](#quick-reference)
2. [Recommended plugin order](#recommended-plugin-order)
3. [Plugins (reference)](#plugins-reference)
4. [Cutscenes, pictures, and scripting](#cutscenes-pictures-and-scripting)
5. [Installation](#installation)
6. [Compatibility & troubleshooting](#compatibility--troubleshooting)
7. [License](#license)

---

## Quick reference

| Plugin | Role |
|--------|------|
| **KurtsAnimationPlugin** | Per-direction frame counts via LibreSprite JSON for `$` characters |
| **KurtsPerpectivePlugin** | Optional Y-based sprite scale (2.5D depth) |
| **KurtsKeyMapper** | Action key + movement (e.g. WASD) |
| **KurtsInteractionRangePlugin** | Directional interaction ranges + optional facing + icon |
| **KurtsShakePlugin** | Player-only sprite shake |
| **KurtsMouseWheelZoom** | Map zoom (wheel), resolution-aware; cutscene maps excluded by name |
| **KurtsCameraLag** | Smooth follow + “static” camera when zoomed out |
| **KurtsMapForeground** | Map-anchored foreground pictures (above chars); script opacity API |
| **KurtsFPSLogger** | FPS console log + works with options FPS cap |
| **KurtsOptionsMenu** | Title/options UI, resolution list, FPS, camera lag, controls |
| **KurtsTranslationTooltip** | `\TR<text|tooltip>` hover tooltips in messages |
| **KurtsPlayerDefaults** | Default speed / frequency / facing / through; clears transparency on map change |
| **KurtsResolutionPictures** | Reference-based pictures + scaled message UI + `\PX` / `\PY` |

---

## Recommended plugin order

Load **KurtsResolutionPictures** before **KurtsTranslationTooltip** so tooltip scaling can use `KurtsResolutionUiScale()`.

Suggested order (adjust to what you enable):

1. KurtsAnimationPlugin  
2. KurtsPerpectivePlugin (if used)  
3. KurtsKeyMapper  
4. KurtsInteractionRangePlugin  
5. KurtsShakePlugin  
6. KurtsMouseWheelZoom  
7. KurtsCameraLag  
8. KurtsMapForeground *(after zoom & camera lag)*  
9. KurtsFPSLogger  
10. KurtsOptionsMenu *(after CameraLag, KeyMapper, FPSLogger)*  
11. KurtsResolutionPictures  
12. KurtsTranslationTooltip  
13. KurtsPlayerDefaults  

---

## Plugins (reference)

### KurtsAnimationPlugin

- **Purpose:** Use different frame counts per animation (idle / walk / run × 4 directions) using JSON exported from LibreSprite.
- **Files:** `$Name.png` + optional `$Name.json` in `img/characters/`.
- **Frame names:** e.g. `idleUp0`, `walkLeft3`, `runDown2`, etc. (see plugin help for full list).
- **Parameters:** Speed formulas use `f` (frame count) per direction; run threshold; optional debug overlay; **JSON Animation Characters** whitelist (only listed `$` sheets load JSON; empty uses built-in default); **Static Dollar Characters** when whitelist is empty.
- **Missing data:** Falls back safely when animations or JSON are missing.

### KurtsPerpectivePlugin

- **Purpose:** Scale character sprites by Y (map or screen) for a simple depth effect. **Visual only** — no collision changes.
- **Status:** Often disabled in projects; enable if you want the effect.

### KurtsKeyMapper

- **Purpose:** Choose **action** key (e.g. E, Space, Enter — mouse still works) and **movement** layout (arrows vs WASD).

### KurtsInteractionRangePlugin

- **Purpose:** Expand how far the player can trigger events, with **per-direction** ranges and optional **facing** rules; optional **interact** icon above the player.
- **Note tag format:** `<interactionRange:URDL[suffix]>` — four digits = up, right, down, left tile reach; optional suffix `u` `d` `l` `r` for which facings show the icon (e.g. `lu`).
- **Hide icon on a page:** `<noInteractIcon>` in notes.
- **Parameters:** Debug log, icon graphic (`img/system/`), icon Y offset, interaction origin % on sprite.

### KurtsShakePlugin

- **Script:** `$gamePlayer.startShake(power, speed, duration);` — shakes **player sprite only** (not the camera).  
- Example: `$gamePlayer.startShake(4, 10, 20);`

### KurtsMouseWheelZoom

- **Purpose:** Wheel zoom on **Scene_Map**; zoom is expressed as a **factor** relative to **1280×** reference width so the same world area feels consistent across resolutions.
- **Script:** `resetMapZoom()`, `setMapZoom(factor)`, `getMapZoom()`.
- **Cutscene maps:** If the map’s **display name** starts with `cutscene` (case-insensitive), this plugin does **not** apply (no wheel zoom, default parallax behaviour for that map).
- **Parameters:** Min/max factor, step, smoothness, **Disable During Events** (main map interpreter only — Parallel does not block), **Disable During Message** (blocks while dialogue / message window / scroll text is active).

### KurtsCameraLag

- **Purpose:** Camera eases toward the player instead of snapping; when zoom is at or below a **scaled** threshold, the camera can stay **centered** on the map (“static” mode).
- **Options menu:** `ConfigManager.cameraLag` is driven by **KurtsOptionsMenu** when used together.

### KurtsMapForeground

- **Purpose:** Draw `img/pictures/` layers **above** tiles and characters, aligned like parallax (bottom-right of picture to bottom-right of map), with optional global offset.
- **Map note:** `<foreground:pictureName>` (multiple lines allowed).
- **Not** controllable with **Show Picture** / **Move Picture** — use **Script**:
  - `setForegroundOpacity("name", 0–255)` or `"all"`
  - `fadeForeground("name", targetOpacity, frames)`
  - `isForegroundFading("name")`
- **Order:** After MouseWheelZoom and CameraLag.

### KurtsFPSLogger

- **Purpose:** Optional **once-per-second** FPS log in the browser console (F8); integrates with **FPS limit** from options via `ConfigManager.fpsLimit`.

### KurtsOptionsMenu

- **Purpose:** Custom title / options / game menu styling (e.g. `fonts/RoyalnCurvy.ttf`, `img/pictures/menuBg.png`), **resolution** dropdown (16:9 presets), **FPS limit**, **camera lag** slider, **movement** and **action** controls (works with KurtsKeyMapper / ConfigManager).
- **Load after:** KurtsCameraLag, KurtsKeyMapper, KurtsFPSLogger.

### KurtsTranslationTooltip

- **Purpose:** In **Show Text**, use `\TR<shown text|tooltip text>` — the left part is styled (default gold + underline); hovering shows the translation in a picture-backed tooltip.
- **Parameters:** Box picture name, font size, colour, Y offset, **Match Resolution UI Scaling** (ties to KurtsResolutionPictures).
- **Load after:** KurtsResolutionPictures (recommended).

### KurtsPlayerDefaults

- **Purpose:** Applies move speed, frequency, facing (optional), and **Through** on new game and **after every map transfer**.
- **Extra:** When transferring to a **different map**, forces `$gamePlayer.setTransparent(false)` so cutscenes that hide the player do not leave them invisible on the next map.

### KurtsResolutionPictures

- **Reference size:** Default **1280×720** (parameters: Reference Width / Height). All **Show Picture** / **Move Picture** **x, y, and scale** are interpreted in that space, then adjusted for real resolution and **screen zoom** so layout stays consistent.
- **Message window:** Scales height, padding, font, and **line height** so text does not overlap at low resolutions; **Name Box** matches.
- **Escape codes in text:** `\PX[n]` and `\PY[n]` position using reference vs current box size.
- **Script API:** `window.KurtsResolutionUiScale()` → `Graphics.boxHeight / Reference Height` for custom UI or other plugins.

---

## Cutscenes, pictures, and scripting

This project treats **1280×720** (or your Reference Width/Height) as the layout coordinate system for **pictures** when **KurtsResolutionPictures** is on.

### 1. “Cutscene” maps and zoom

- Set the map **Display Name** (Map Properties) to something starting with **`cutscene`** so **KurtsMouseWheelZoom** fully skips that map (no wheel zoom, no per-frame zoom from that plugin).
- Useful for comic-style maps driven by pictures instead of tile movement.

### 2. Picture helpers in Script blocks

A common pattern is to define small helpers at the top of a Script command, then call them:

```javascript
function picShow(id, name, origin, x, y, scalePct, opacity) {
    $gameScreen.showPicture(id, name, origin, x, y, scalePct, scalePct, opacity, 0);
}
function picMove(id, origin, x, y, scalePct, opacity, duration) {
    $gameScreen.movePicture(id, origin, x, y, scalePct, scalePct, opacity, 0, duration);
}
function picErase(id) {
    $gameScreen.erasePicture(id);
}
```

- **x, y, scalePct** are in **reference** space; the plugin converts to stored coordinates and scale for the current resolution and zoom.
- **Fade screen:** use event commands **Fadeout Screen** (221) / **Fadein Screen** (222) around transfers or picture setup.
- **Wait:** use event **Wait** commands for delays; do not rely on `this.wait()` inside a single Script block unless you understand interpreter timing (see below).

### 3. Hiding the player during a cutscene

- **Script:** `$gamePlayer.setTransparent(true);` — player is invisible but can still run events.
- **Important:** Before **Transfer Player** (or on the destination map), use `$gamePlayer.setTransparent(false);` **or** rely on **KurtsPlayerDefaults**, which clears transparency when changing maps.

### 4. Parallel vs Autorun; “event running” vs zoom

- **Autorun** that never turns off a self-switch will **freeze** the map; prefer **Parallel** for loops, or Autorun + self-switch + empty second page.
- **KurtsMouseWheelZoom** “Disable During Events” uses the **main map interpreter** (`$gameMap._interpreter`), not `isEventRunning()`, so **Parallel** events do **not** block wheel zoom the same way Autorun does.

### 5. Message text and layout

- **KurtsResolutionPictures:** message and name box scale with resolution; use **\PX[n]** and **\PY[n]** for pixel-precise placement in reference space.
- **KurtsTranslationTooltip:** `\TR<shown text|tooltip text>` — multiple per message allowed; tooltip image in `img/pictures/`.

### 6. Foreground (room overlays) vs pictures

- **Show Picture** = screen picture stack (good for cutscenes, UI).
- **Map foreground** = tied to the map, draws **over** the player; configured with map note `<foreground:name>` and **only** the script functions `setForegroundOpacity` / `fadeForeground` / `isForegroundFading` from **KurtsMapForeground**.

### 7. Camera and zoom during gameplay

- **Wheel zoom** and **camera lag** work together; at strong zoom-out, lag plugin may keep the camera **centered** on the map (see **Center Zoom Threshold**).
- **Script:** `setMapZoom(factor)`, `resetMapZoom()`, `getMapZoom()` from **KurtsMouseWheelZoom**.

### 8. Effects

- **Shake:** `$gamePlayer.startShake(power, speed, duration);` (**KurtsShakePlugin**).

### 9. Optional: wheel in script

- `TouchInput.wheelY` can be used in **Conditional Branch → Script** for custom behaviour; remember wheel is also consumed by KurtsMouseWheelZoom on the map unless disabled by the plugin’s rules.

---

## Installation

1. Copy the desired `Kurts*.js` files into `js/plugins/`.
2. RPG Maker MZ → **Tools** → **Plugin Manager** → add/enable plugins.
3. Set **plugin order** as above.
4. For **KurtsOptionsMenu**, add assets it expects (`fonts/`, `img/pictures/menuBg.png`, etc.) if you use that plugin.
5. For **KurtsAnimationPlugin**, add `$` sheets and optional JSON under `img/characters/`.

---

## Compatibility & troubleshooting

- **Engine:** RPG Maker MZ.
- **F8 console:** Use for **KurtsFPSLogger**, **KurtsInteractionRangePlugin** debug, and general errors.
- **Line overlap in messages at low resolution:** addressed in **KurtsResolutionPictures** by fixing `calcTextHeight` vs scaled fonts; keep that plugin enabled and Reference Height aligned with your design.
- **Invisible player after cutscene:** use `setTransparent(false)` before transfer or **KurtsPlayerDefaults**.
- **Plugin conflicts:** change **load order** first; then check for other plugins that patch `Game_Screen` pictures, `Window_Message`, or `Game_Map` scroll.

---

## License

Provided as-is for use in RPG Maker MZ projects; you may modify them for your games.

---

**Created by Furkan Kurt**

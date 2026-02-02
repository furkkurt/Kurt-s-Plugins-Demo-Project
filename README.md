# RPG Maker MZ Plugins by Furkan Kurt

A collection of five plugins for RPG Maker MZ that enhance character animations, add perspective effects, provide customizable keyboard controls, expand event interaction areas, and add sprite shake effects.

## 📋 Table of Contents

- [KurtsAnimationPlugin](#kurtsanimationplugin)
- [KurtsPerpectivePlugin](#kurtsperspectiveplugin)
- [KurtsKeyMapper](#kurtskeymapper)
- [KurtsInteractionRangePlugin](#kurtsinteractionrangeplugin)
- [KurtsShakePlugin](#kurtsshakeplugin)
- [Installation](#installation)
- [Compatibility](#compatibility)

---

## KurtsAnimationPlugin

**Version:** 1.0.0

Allows you to use different numbers of frames for each character animation by reading frame data from JSON files exported by LibreSprite.

### Features

- ✅ Variable frame counts for each animation (idle, walk, run in 4 directions)
- ✅ Supports up to 12 different animation sequences per character
- ✅ Individual speed modifiers for each animation type
- ✅ Automatic fallback to first frame if animation is missing
- ✅ Configurable run speed threshold
- ✅ Smooth animation transitions

### Usage

1. **Prepare your character sprites:**
   - Name your character image files starting with `$` (e.g., `$clem.png`)
   - Export a JSON file with the same name from LibreSprite (e.g., `$clem.json`)

2. **Frame naming convention:**
   Your JSON file should contain frame names following this pattern:
   - `idleUp0`, `idleUp1`, `idleUp2...` (idle animation facing up)
   - `idleDown0`, `idleDown1`, `idleDown2...` (idle animation facing down)
   - `idleLeft0`, `idleLeft1`, `idleLeft2...` (idle animation facing left)
   - `idleRight0`, `idleRight1`, `idleRight2...` (idle animation facing right)
   - `walkUp0`, `walkUp1`, `walkUp2...` (walking animation facing up)
   - `walkDown0`, `walkDown1`, `walkDown2...` (walking animation facing down)
   - `walkLeft0`, `walkLeft1`, `walkLeft2...` (walking animation facing left)
   - `walkRight0`, `walkRight1`, `walkRight2...` (walking animation facing right)
   - `runUp0`, `runUp1`, `runUp2...` (running animation facing up)
   - `runDown0`, `runDown1`, `runDown2...` (running animation facing down)
   - `runLeft0`, `runLeft1`, `runLeft2...` (running animation facing left)
   - `runRight0`, `runRight1`, `runRight2...` (running animation facing right)

3. **Missing animations:**
   - If any of the 12 animation sequences are missing, the plugin will display the very first frame of the sprite sheet

### Plugin Parameters

#### Speed Modifiers

Each animation type has its own speed modifier. Use `f` to represent the frame count in your formula.

**Examples:**
- `f * 0.5` - Slower animation (half speed)
- `f * 0.8` - Slightly slower
- `f * 1.0` - Normal speed
- `f * 1.5` - Faster animation

**Available speed modifiers:**
- `Idle Up Speed` (default: `f * 0.5`)
- `Idle Down Speed` (default: `f * 0.5`)
- `Idle Left Speed` (default: `f * 0.5`)
- `Idle Right Speed` (default: `f * 0.5`)
- `Walk Up Speed` (default: `f * 0.8`)
- `Walk Down Speed` (default: `f * 0.8`)
- `Walk Left Speed` (default: `f * 0.8`)
- `Walk Right Speed` (default: `f * 0.8`)
- `Run Up Speed` (default: `f * 1.0`)
- `Run Down Speed` (default: `f * 1.0`)
- `Run Left Speed` (default: `f * 1.0`)
- `Run Right Speed` (default: `f * 1.0`)

#### Run Speed Threshold

- **Default:** 5
- **Range:** 1-8
- Determines the character's move speed value at which the character is considered "running" instead of "walking"

### Tips

- If different directions have different frame counts (e.g., left/right have 6 frames, up/down have 4), adjust speed modifiers accordingly to make them play at the same visual speed
- Example: If left has 6 frames and up has 4, use `f * 1.5` for left and `f * 1.0` for up to match speeds

---

## KurtsPerpectivePlugin

**Version:** 1.0.0

Adds a 2.5D perspective effect by scaling character sprites based on their Y position on the map, creating a depth illusion.

### Features

- ✅ Smooth scaling based on map position
- ✅ Configurable min/max scale values
- ✅ Optional control point for piecewise linear scaling
- ✅ Screen-based or map-based scaling options
- ✅ Purely visual effect (does not affect collision or movement)

### Plugin Parameters

#### Min Scale
- **Default:** 0.97
- Scale value at the top of the map (characters appear smaller)
- Lower values = smaller characters at top

#### Max Scale
- **Default:** 1.03
- Scale value at the bottom of the map (characters appear larger)
- Higher values = larger characters at bottom

#### Control Point Y Position (%)
- **Default:** -1 (disabled)
- **Range:** -1 to 100
- Y position as a percentage where the control point is set
- Set to -1 to disable and use simple linear scaling

#### Control Point Scale Value
- **Default:** 1.0
- Scale value at the control point
- Only used if Control Point Y is set (not -1)

#### Use Screen-Based Scaling
- **Default:** false
- If ON, scaling is relative to screen position
- If OFF, scaling is relative to map position

### Control Point System

The control point allows you to create a two-segment scaling curve for more complex depth effects.

**Example Setup:**
- Control Point Y = 50%
- Control Point Scale = 0.5
- Min Scale = 0.4
- Max Scale = 1.0

**Result:**
- Top half (0-50%): Scales from 0.4 to 0.5 (faster change)
- Bottom half (50-100%): Scales from 0.5 to 1.0 (slower change)

This creates a non-linear scaling effect where characters shrink faster in the first half of the map, then slower in the second half.

### Recommended Values

**For indoor maps:**
- Min Scale: 0.97
- Max Scale: 1.03

**For large outdoor maps:**
- Min Scale: 0.95
- Max Scale: 1.05

**Note:** Keep the difference between min and max scale subtle (max ±7%) for best results. Larger differences can look stylized but may be distracting.

---

## KurtsKeyMapper

**Version:** 1.0.0

Allows you to customize keyboard controls for actions and movement, providing flexibility for different player preferences.

### Features

- ✅ Customizable action button (Mouse Click, Enter, E, Space)
- ✅ WASD movement support
- ✅ Mouse click always works for actions (regardless of setting)
- ✅ Multiple action keys can work simultaneously

### Plugin Parameters

#### Action Button Key
Choose which keyboard key triggers actions (talking to NPCs, interacting, etc.)

**Options:**
- **Mouse Click (Default)** - Uses mouse click only
- **Enter** - Maps Enter key to actions
- **E** - Maps E key to actions
- **Space** - Maps Space key to actions

**Note:** Mouse click always works regardless of this setting. Multiple action keys can work simultaneously.

#### Movement Keys
Choose movement key layout

**Options:**
- **Arrow Keys (Default)** - Uses arrow keys for movement
- **WASD** - Uses W/A/S/D keys for movement

### Usage Tips

- Changing settings requires reloading the game
- If you select "E" for action button, both mouse click and E will work
- WASD movement works alongside arrow keys (both are active when WASD is selected)

---

## KurtsInteractionRangePlugin

**Version:** 1.0.0

Expands the interaction area of events using a high-performance range-checking system. No event cloning - just smart interaction detection that scales to hundreds of events without performance issues.

### Features

- ✅ Expand interaction area in all directions (square grid)
- ✅ No visual duplication (single event sprite)
- ✅ High performance - O(1) per event check
- ✅ Scales to hundreds of events without lag
- ✅ Works with all event trigger types
- ✅ Simple note tag configuration
- ✅ Configurable default range via plugin manager
- ✅ Debug logging for troubleshooting
- ✅ No memory overhead - no clones created
- ✅ Safe for save/load
- ✅ Backward compatible (events without tag work normally)

### Plugin Parameters

#### Default Range
- **Default:** 4
- **Range:** 0-20
- Default interaction range for events that don't have a note tag
- Set to 0 to disable default (only events with note tags will have expanded range)

#### Enable Debug
- **Default:** true
- Enable console logging for debugging
- Turn OFF in production to reduce console spam

### Usage

1. **Add the note tag to your event (optional):**
   In the event's Note box, add:
   ```
   <interactionRange:4>
   ```
   If no note tag is specified, the Default Range parameter will be used.

2. **Set the interaction range:**
   The number represents tiles in each direction:
   - `4` = 4 tiles left, right, up, and down (9x9 area total)
   - `2` = 2 tiles in each direction (5x5 area total)
   - `8` = 8 tiles in each direction (17x17 area total)

3. **Configure event trigger:**
   Works with all trigger types:
   - **Action Button** (0) - Press action key when facing the event
   - **Player Touch** (1) - Player walks into the event
   - **Event Touch** (2) - Event touches the player

### Examples

**Small interaction zone:**
```
<interactionRange:2>
```
Creates a 5x5 tile interaction area.

**Medium interaction zone:**
```
<interactionRange:4>
```
Creates a 9x9 tile interaction area (as shown in your screenshot).

**Large interaction zone:**
```
<interactionRange:8>
```
Creates a 17x17 tile interaction area.

### How It Works

- Uses a high-performance range-checking system that runs only when interaction is checked
- Checks if the player is within the specified range of any event with the `interactionRange` tag
- Uses Manhattan distance (square grid) - checks both X and Y distance
- No event cloning - expands interaction logic, not the map
- Only one event image is displayed (no duplication)
- The event logic runs once when triggered (no duplication)
- Industry-standard approach used by professional RPG Maker developers

### Debugging

When debug logging is enabled, the plugin will log:
- Total events on the map
- Events with interaction range configured
- Events currently in range of the player
- Events that were triggered
- Event positions and distances

Open the browser console (F8) to see debug information.

### Tips

- Use larger ranges for important NPCs or objects that should be easy to interact with
- Combine with different trigger types for different interaction styles
- Events without the tag will use the Default Range parameter (if set)
- The range is checked from the event's position, not the player's
- Turn off debug logging in production for better performance

---

## KurtsShakePlugin

**Version:** 1.0.0

Adds a sprite shake effect for the player character. Shakes only the player sprite, not the camera, creating a localized visual effect perfect for impacts, hits, or dramatic moments.

### Features

- ✅ Player sprite shake only (no camera shake)
- ✅ Configurable power, speed, and duration
- ✅ Smooth sine wave-based shake animation
- ✅ Easy to call from event scripts
- ✅ Lightweight and performant

### Usage

Call from an event script:

```javascript
$gamePlayer.startShake(power, speed, duration);
```

**Parameters:**
- `power` - Shake intensity (higher = more shake)
- `speed` - Shake speed (higher = faster shake)
- `duration` - Number of frames the shake lasts

### Examples

**Light shake:**
```javascript
$gamePlayer.startShake(2, 5, 15);
```

**Medium shake:**
```javascript
$gamePlayer.startShake(4, 10, 20);
```

**Strong shake:**
```javascript
$gamePlayer.startShake(8, 15, 30);
```

### Use Cases

- Character taking damage
- Impact effects
- Dramatic moments
- Environmental effects (earthquake, explosion nearby)
- Status effects (poison, confusion)

### Tips

- Lower power values (2-4) work well for subtle effects
- Higher power values (6-10) create dramatic shake effects
- Speed controls how fast the shake oscillates
- Duration is in frames (60 frames = 1 second at 60 FPS)

---

## Installation

1. Copy the plugin files to your project's `js/plugins/` folder:
   - `KurtsAnimationPlugin.js`
   - `KurtsPerpectivePlugin.js`
   - `KurtsKeyMapper.js`
   - `KurtsInteractionRangePlugin.js`
   - `KurtsShakePlugin.js`

2. Open RPG Maker MZ

3. Go to **Tools** → **Plugin Manager**

4. Enable each plugin you want to use

5. Configure the plugin parameters as needed

6. Save your project

### File Structure

```
Your Project/
├── js/
│   └── plugins/
│       ├── KurtsAnimationPlugin.js
│       ├── KurtsPerpectivePlugin.js
│       ├── KurtsKeyMapper.js
│       ├── KurtsInteractionRangePlugin.js
│       └── KurtsShakePlugin.js
└── img/
    └── characters/
        ├── $clem.png
        └── $clem.json
```

---

## Compatibility

- **RPG Maker MZ:** Compatible with all versions
- **Other Plugins:** These plugins are designed to be compatible with most other plugins. However, if you encounter conflicts, try adjusting plugin load order in the Plugin Manager.
- **Platform:** Works on Windows, Mac, and Linux versions of RPG Maker MZ

### Plugin Load Order

For best results, load plugins in this order:
1. KurtsAnimationPlugin
2. KurtsPerpectivePlugin
3. KurtsKeyMapper
4. KurtsInteractionRangePlugin
5. KurtsShakePlugin

---

## License

These plugins are provided as-is for use in RPG Maker MZ projects. Feel free to modify and use them in your projects.

---

## Support

If you encounter any issues or have questions:
1. Check that all plugin parameters are configured correctly
2. Ensure JSON files are properly formatted (LibreSprite export)
3. Verify character image files are named correctly (starting with `$`)
4. Check the browser console (F8) for any error messages

---

## Changelog

### KurtsAnimationPlugin v1.0.0
- Initial release
- Variable frame count support
- Individual speed modifiers for each animation
- Configurable run speed threshold

### KurtsPerpectivePlugin v1.0.0
- Initial release
- Y-position based scaling
- Control point system for piecewise scaling
- Screen-based and map-based scaling options

### KurtsKeyMapper v1.0.0
- Initial release
- Customizable action button
- WASD movement support

### KurtsInteractionRangePlugin v1.0.0
- Initial release
- High-performance range-checking system (no cloning)
- Expanded interaction areas via note tags
- Configurable default range via plugin manager
- Debug logging for troubleshooting
- Support for all event trigger types
- Scales to hundreds of events without performance issues

### KurtsShakePlugin v1.0.0
- Initial release
- Player sprite shake effect
- Configurable power, speed, and duration
- Sine wave-based smooth animation

---

**Created by Furkan Kurt**

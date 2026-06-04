//=============================================================================
// KurtsFPSLogger.js
//=============================================================================
/*:
 * @plugindesc v2.0.0 FPS logging and frame rate limiter
 * @author Furkan Kurt
 *
 * @param Enabled
 * @text Enable FPS Logging
 * @desc Toggle FPS console logging on/off
 * @type boolean
 * @default true
 *
 * @param Default FPS Limit
 * @text Default FPS Limit
 * @desc Default frame rate limit (30, 60, or 0 for unlimited)
 * @type select
 * @option 30 FPS
 * @value 30
 * @option 60 FPS
 * @value 60
 * @option Unlimited
 * @value 0
 * @default 60
 *
 * @help
 * ============================================================================
 * Kurts FPS Logger & Limiter
 * ============================================================================
 *
 * Logs FPS to console once per second (toggle via parameter).
 * Also provides frame rate limiting (30/60/unlimited) controllable
 * from the options menu via ConfigManager.fpsLimit.
 *
 * Check FPS with F8 → Console tab.
 *
 * ============================================================================
 */

(() => {
    'use strict';

    const params = PluginManager.parameters('KurtsFPSLogger');
    const LOG_ENABLED = params['Enabled'] === 'true';
    const DEFAULT_FPS_LIMIT = Number(params['Default FPS Limit'] || 60);

    // Initialize ConfigManager property
    if (ConfigManager.fpsLimit === undefined) {
        ConfigManager.fpsLimit = DEFAULT_FPS_LIMIT;
    }

    // FPS logging
    let frameCount = 0;
    let lastLogTime = performance.now();

    // FPS limiting — accumulate engine deltaTime (do not use requestAnimationFrame here;
    // rAF passes a DOM timestamp, not deltaTime, and breaks SceneManager.update).
    let fpsAccumulator = 0;

    const _SceneManager_update = SceneManager.update;
    SceneManager.update = function(deltaTime) {
        const fpsLimit = Number(ConfigManager.fpsLimit) || 0;
        if (fpsLimit > 0) {
            fpsAccumulator += deltaTime;
            const frameTime = 1 / fpsLimit;
            if (fpsAccumulator < frameTime) {
                return;
            }
            fpsAccumulator -= frameTime;
            if (fpsAccumulator > frameTime * 4) {
                fpsAccumulator = 0;
            }
        } else {
            fpsAccumulator = 0;
        }

        _SceneManager_update.call(this, deltaTime);

        // FPS logging
        if (LOG_ENABLED) {
            frameCount++;
            const now = performance.now();
            if (now - lastLogTime >= 1000) {
                const fps = (frameCount / ((now - lastLogTime) / 1000)).toFixed(1);
                console.log('[FPS]', fps);
                frameCount = 0;
                lastLogTime = now;
            }
        }
    };

})();

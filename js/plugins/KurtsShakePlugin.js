//=============================================================================
// KurtsShakePlugin.js
//=============================================================================
/*:
 * @plugindesc v1.0.0 Shake the player sprite only (no camera shake)
 * @author Furkan Kurt
 *
 * @help
 * ============================================================================
 * Kurts Shake Plugin
 * ============================================================================
 *
 * Adds a sprite shake effect for the player character. Shakes only the player
 * sprite, not the camera, creating a localized visual effect.
 *
 * USAGE:
 * ------
 * Call from event script:
 *   $gamePlayer.startShake(power, speed, duration);
 *
 * PARAMETERS:
 * -----------
 * - power: Shake intensity (higher = more shake)
 * - speed: Shake speed (higher = faster shake)
 * - duration: Number of frames the shake lasts
 *
 * EXAMPLES:
 * ---------
 * Light shake:   $gamePlayer.startShake(2, 5, 15);
 * Medium shake:  $gamePlayer.startShake(4, 10, 20);
 * Strong shake:  $gamePlayer.startShake(8, 15, 30);
 *
 * ============================================================================
 */

(() => {

  // Store shake data on character
  Game_CharacterBase.prototype.startShake = function(power, speed, duration) {
    this._shakePower = power;
    this._shakeSpeed = speed;
    this._shakeDuration = duration;
    this._shakePhase = 0;
  };

  // Alias Sprite_Character updatePosition
  const _updatePosition = Sprite_Character.prototype.updatePosition;
  Sprite_Character.prototype.updatePosition = function() {
    _updatePosition.call(this);

    const ch = this._character;
    if (!ch || ch !== $gamePlayer) return;
    if (!ch._shakeDuration || ch._shakeDuration <= 0) return;

    ch._shakePhase += ch._shakeSpeed;
    const offset = Math.sin(ch._shakePhase) * ch._shakePower;

    this.x += offset;

    ch._shakeDuration--;
  };

})();

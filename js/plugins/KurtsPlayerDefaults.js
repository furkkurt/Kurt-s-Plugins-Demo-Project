/*:
 * @target MZ
 * @plugindesc Sets default player speed, frequency, and facing direction on map load.
 * @author Kurt
 *
 * @param Move Speed
 * @type select
 * @option 1 - x8 Slower
 * @value 1
 * @option 2 - x4 Slower
 * @value 2
 * @option 3 - x2 Slower
 * @value 3
 * @option 4 - Normal
 * @value 4
 * @option 5 - x2 Faster
 * @value 5
 * @option 6 - x4 Faster
 * @value 6
 * @default 3
 * @desc Player movement speed. 4 = default RPG Maker speed.
 *
 * @param Move Frequency
 * @type select
 * @option 1 - Lowest
 * @value 1
 * @option 2 - Lower
 * @value 2
 * @option 3 - Normal
 * @value 3
 * @option 4 - Higher
 * @value 4
 * @option 5 - Highest
 * @value 5
 * @default 3
 * @desc Player movement frequency. 3 = default.
 *
 * @param Facing Direction
 * @type select
 * @option Down
 * @value 2
 * @option Left
 * @value 4
 * @option Right
 * @value 6
 * @option Up
 * @value 8
 * @option Don't Change
 * @value 0
 * @default 2
 * @desc Initial facing direction. "Don't Change" keeps whatever the transfer sets.
 *
 * @param Through
 * @type boolean
 * @default true
 * @desc Allow player to walk through obstacles? (Through ON)
 *
 * @help
 * ============================================================================
 * KurtsPlayerDefaults
 * ============================================================================
 * Sets player movement speed, frequency, facing direction, and through mode
 * once when the game starts and on each new map load.
 *
 * No events needed — just configure the plugin parameters.
 * ============================================================================
 */

(() => {
    const params = PluginManager.parameters('KurtsPlayerDefaults');
    const MOVE_SPEED     = Number(params['Move Speed'] || 3);
    const MOVE_FREQUENCY = Number(params['Move Frequency'] || 3);
    const FACING         = Number(params['Facing Direction'] || 0);
    const THROUGH        = params['Through'] === 'true';

    // Apply defaults when the player is initialized (new game)
    const _Game_Player_initMembers = Game_Player.prototype.initMembers;
    Game_Player.prototype.initMembers = function() {
        _Game_Player_initMembers.call(this);
        this.setMoveSpeed(MOVE_SPEED);
        this.setMoveFrequency(MOVE_FREQUENCY);
        this.setThrough(THROUGH);
        if (FACING > 0) {
            this.setDirection(FACING);
        }
    };

    // Re-apply on each map setup (after transfer)
    const _Game_Player_performTransfer = Game_Player.prototype.performTransfer;
    Game_Player.prototype.performTransfer = function() {
        const changingMap = this.isTransferring() && this._newMapId !== $gameMap.mapId();
        _Game_Player_performTransfer.call(this);
        if (changingMap) {
            this.setTransparent(false);
        }
        this.setMoveSpeed(MOVE_SPEED);
        this.setMoveFrequency(MOVE_FREQUENCY);
        this.setThrough(THROUGH);
        if (FACING > 0) {
            this.setDirection(FACING);
        }
    };
})();

//-----------------------------------------------------------------------------
// Scene_Load
//
// The scene class of the load screen.

import { DataManager } from '../rpg_managers/DataManager';
import { SceneManager } from '../rpg_managers/SceneManager';
import { SoundManager } from '../rpg_managers/SoundManager';
import { TextManager } from '../rpg_managers/TextManager';
import { Scene_File } from './Scene_File';
import { Scene_Map } from './Scene_Map';

export function Scene_Load() {
    this.initialize.apply(this, arguments);
}

Scene_Load.prototype = Object.create(Scene_File.prototype);
Scene_Load.prototype.constructor = Scene_Load;

Scene_Load.prototype.initialize = function () {
    Scene_File.prototype.initialize.call(this);
    this._loadSuccess = false;
};

Scene_Load.prototype.terminate = function () {
    Scene_File.prototype.terminate.call(this);
    if (this._loadSuccess) {
        global.$gameSystem.onAfterLoad();
    }
};

Scene_Load.prototype.mode = function () {
    return 'load';
};

Scene_Load.prototype.helpWindowText = function () {
    return TextManager.loadMessage;
};

Scene_Load.prototype.firstSavefileIndex = function () {
    return DataManager.latestSavefileId() - 1;
};

Scene_Load.prototype.onSavefileOk = function () {
    Scene_File.prototype.onSavefileOk.call(this);
    if (DataManager.loadGame(this.savefileId())) {
        this.onLoadSuccess();
    } else {
        this.onLoadFailure();
    }
};

Scene_Load.prototype.onLoadSuccess = function () {
    SoundManager.playLoad();
    this.fadeOutAll();
    this.reloadMapIfUpdated();
    SceneManager.goto(Scene_Map);
    this._loadSuccess = true;
};

Scene_Load.prototype.onLoadFailure = function () {
    SoundManager.playBuzzer();
    this.activateListWindow();
};

Scene_Load.prototype.reloadMapIfUpdated = function () {
    if (global.$gameSystem.versionId() !== global.$dataSystem.versionId) {
        global.$gamePlayer.reserveTransfer(global.$gameMap.mapId(), global.$gamePlayer.x, global.$gamePlayer.y);
        global.$gamePlayer.requestMapReload();
    }
};

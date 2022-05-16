import { DataManager } from '../rpg_managers/DataManager';
import { SceneManager } from '../rpg_managers/SceneManager';
import { SoundManager } from '../rpg_managers/SoundManager';
import { TextManager } from '../rpg_managers/TextManager';
import { Scene_File } from './Scene_File';
import { Scene_Map } from './Scene_Map';

/**
 * The scene class of the load screen.
 */
export class Scene_Load extends Scene_File {
    constructor() {
        super();

        this._loadSuccess = false;
    }

    terminate() {
        super.terminate();
        if (this._loadSuccess) {
            global.$gameSystem.onAfterLoad();
        }
    }

    mode() {
        return 'load';
    }

    helpWindowText() {
        return TextManager.loadMessage;
    }

    firstSavefileIndex() {
        return DataManager.latestSavefileId() - 1;
    }

    onSavefileOk() {
        super.onSavefileOk();
        if (DataManager.loadGame(this.savefileId())) {
            this.onLoadSuccess();
        } else {
            this.onLoadFailure();
        }
    }

    onLoadSuccess() {
        SoundManager.playLoad();
        this.fadeOutAll();
        this.reloadMapIfUpdated();
        SceneManager.goto(Scene_Map);
        this._loadSuccess = true;
    }

    onLoadFailure() {
        SoundManager.playBuzzer();
        this.activateListWindow();
    }

    reloadMapIfUpdated() {
        if (global.$gameSystem.versionId() !== global.$dataSystem.versionId) {
            global.$gamePlayer.reserveTransfer(global.$gameMap.mapId(), global.$gamePlayer.x, global.$gamePlayer.y);
            global.$gamePlayer.requestMapReload();
        }
    }
}

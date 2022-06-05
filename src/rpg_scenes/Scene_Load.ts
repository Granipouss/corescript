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
    protected _loadSuccess: boolean;

    constructor() {
        super();

        this._loadSuccess = false;
    }

    terminate(): void {
        super.terminate();
        if (this._loadSuccess) {
            window.$gameSystem.onAfterLoad();
        }
    }

    mode(): 'load' {
        return 'load';
    }

    helpWindowText(): string {
        return TextManager.loadMessage;
    }

    firstSavefileIndex(): number {
        return DataManager.latestSavefileId() - 1;
    }

    onSavefileOk(): void {
        super.onSavefileOk();
        if (DataManager.loadGame(this.savefileId())) {
            this.onLoadSuccess();
        } else {
            this.onLoadFailure();
        }
    }

    onLoadSuccess(): void {
        SoundManager.playLoad();
        this.fadeOutAll();
        this.reloadMapIfUpdated();
        SceneManager.goto(Scene_Map);
        this._loadSuccess = true;
    }

    onLoadFailure(): void {
        SoundManager.playBuzzer();
        this.activateListWindow();
    }

    reloadMapIfUpdated(): void {
        if (window.$gameSystem.versionId() !== window.$dataSystem.versionId) {
            window.$gamePlayer.reserveTransfer(window.$gameMap.mapId(), window.$gamePlayer.x, window.$gamePlayer.y);
            window.$gamePlayer.requestMapReload();
        }
    }
}

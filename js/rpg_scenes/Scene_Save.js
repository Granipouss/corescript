import { DataManager } from '../rpg_managers/DataManager';
import { SoundManager } from '../rpg_managers/SoundManager';
import { StorageManager } from '../rpg_managers/StorageManager';
import { TextManager } from '../rpg_managers/TextManager';
import { Scene_File } from './Scene_File';

/**
 * The scene class of the save screen.
 */
export class Scene_Save extends Scene_File {
    mode() {
        return 'save';
    }

    helpWindowText() {
        return TextManager.saveMessage;
    }

    firstSavefileIndex() {
        return DataManager.lastAccessedSavefileId() - 1;
    }

    onSavefileOk() {
        if (DataManager.isAutoSaveFileId(this.savefileId())) {
            this.onSaveFailure();
            return;
        }
        super.onSavefileOk();
        global.$gameSystem.onBeforeSave();
        if (DataManager.saveGame(this.savefileId())) {
            this.onSaveSuccess();
        } else {
            this.onSaveFailure();
        }
    }

    onSaveSuccess() {
        SoundManager.playSave();
        StorageManager.cleanBackup(this.savefileId());
        this.popScene();
    }

    onSaveFailure() {
        SoundManager.playBuzzer();
        this.activateListWindow();
    }
}

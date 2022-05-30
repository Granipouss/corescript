import { DataManager } from '../rpg_managers/DataManager';
import { SoundManager } from '../rpg_managers/SoundManager';
import { StorageManager } from '../rpg_managers/StorageManager';
import { TextManager } from '../rpg_managers/TextManager';
import { Scene_File } from './Scene_File';

/**
 * The scene class of the save screen.
 */
export class Scene_Save extends Scene_File {
    mode(): string {
        return 'save';
    }

    helpWindowText(): string {
        return TextManager.saveMessage;
    }

    firstSavefileIndex(): number {
        return DataManager.lastAccessedSavefileId() - 1;
    }

    onSavefileOk(): void {
        if (DataManager.isAutoSaveFileId(this.savefileId())) {
            this.onSaveFailure();
            return;
        }
        super.onSavefileOk();
        window.$gameSystem.onBeforeSave();
        if (DataManager.saveGame(this.savefileId())) {
            this.onSaveSuccess();
        } else {
            this.onSaveFailure();
        }
    }

    onSaveSuccess(): void {
        SoundManager.playSave();
        StorageManager.cleanBackup(this.savefileId());
        this.popScene();
    }

    onSaveFailure(): void {
        SoundManager.playBuzzer();
        this.activateListWindow();
    }
}

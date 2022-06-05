import { ConfigManager } from '../rpg_managers/ConfigManager';
import { Window_Options } from '../rpg_windows/Window_Options';
import { Scene_MenuBase } from './Scene_MenuBase';

/**
 * The scene class of the options screen.
 */
export class Scene_Options extends Scene_MenuBase {
    protected _optionsWindow: Window_Options;

    create(): void {
        super.create();
        this.createOptionsWindow();
    }

    terminate(): void {
        super.terminate();
        ConfigManager.save();
    }

    createOptionsWindow(): void {
        this._optionsWindow = new Window_Options();
        this._optionsWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._optionsWindow);
    }
}

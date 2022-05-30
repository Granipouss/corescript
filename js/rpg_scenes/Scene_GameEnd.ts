import { SceneManager } from '../rpg_managers/SceneManager';
import { Window_GameEnd } from '../rpg_windows/Window_GameEnd';
import { Scene_MenuBase } from './Scene_MenuBase';
import { Scene_Title } from './Scene_Title';

/**
 * The scene class of the game end screen.
 */
export class Scene_GameEnd extends Scene_MenuBase {
    protected _commandWindow: Window_GameEnd;

    create(): void {
        super.create();
        this.createCommandWindow();
    }

    stop(): void {
        super.stop();
        this._commandWindow.close();
    }

    createBackground(): void {
        super.createBackground();
        this.setBackgroundOpacity(128);
    }

    createCommandWindow(): void {
        this._commandWindow = new Window_GameEnd();
        this._commandWindow.setHandler('toTitle', this.commandToTitle.bind(this));
        this._commandWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._commandWindow);
    }

    commandToTitle(): void {
        this.fadeOutAll();
        SceneManager.goto(Scene_Title);
    }
}

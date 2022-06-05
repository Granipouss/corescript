import { Window_Status } from '../rpg_windows/Window_Status';
import { Scene_MenuBase } from './Scene_MenuBase';

/**
 * The scene class of the status screen.
 */
export class Scene_Status extends Scene_MenuBase {
    protected _statusWindow: Window_Status;

    create(): void {
        super.create();
        this._statusWindow = new Window_Status();
        this._statusWindow.setHandler('cancel', this.popScene.bind(this));
        this._statusWindow.setHandler('pagedown', this.nextActor.bind(this));
        this._statusWindow.setHandler('pageup', this.previousActor.bind(this));
        this._statusWindow.reserveFaceImages();
        this.addWindow(this._statusWindow);
    }

    start(): void {
        super.start();
        this.refreshActor();
    }

    refreshActor(): void {
        const actor = this.actor();
        this._statusWindow.setActor(actor);
    }

    onActorChange(): void {
        this.refreshActor();
        this._statusWindow.activate();
    }
}

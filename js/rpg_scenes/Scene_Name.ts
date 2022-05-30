import { Window_NameEdit } from '../rpg_windows/Window_NameEdit';
import { Window_NameInput } from '../rpg_windows/Window_NameInput';
import { Scene_MenuBase } from './Scene_MenuBase';

/**
 * The scene class of the name input screen.
 */
export class Scene_Name extends Scene_MenuBase {
    protected _editWindow: Window_NameEdit;
    protected _inputWindow: Window_NameInput;

    protected _actorId: number;
    protected _maxLength: number;

    prepare(actorId: number, maxLength: number): void {
        this._actorId = actorId;
        this._maxLength = maxLength;
    }

    create(): void {
        super.create();
        this._actor = window.$gameActors.actor(this._actorId);
        this.createEditWindow();
        this.createInputWindow();
    }

    start(): void {
        super.start();
        this._editWindow.refresh();
    }

    createEditWindow(): void {
        this._editWindow = new Window_NameEdit(this._actor, this._maxLength);
        this.addWindow(this._editWindow);
    }

    createInputWindow(): void {
        this._inputWindow = new Window_NameInput(this._editWindow);
        this._inputWindow.setHandler('ok', this.onInputOk.bind(this));
        this.addWindow(this._inputWindow);
    }

    onInputOk(): void {
        this._actor.setName(this._editWindow.getName());
        this.popScene();
    }
}

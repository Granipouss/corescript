import { Graphics } from '../rpg_core/Graphics';
import { SceneManager } from '../rpg_managers/SceneManager';
import { Window_Gold } from '../rpg_windows/Window_Gold';
import { Window_MenuCommand } from '../rpg_windows/Window_MenuCommand';
import { Window_MenuStatus } from '../rpg_windows/Window_MenuStatus';
import { Scene_Equip } from './Scene_Equip';
import { Scene_GameEnd } from './Scene_GameEnd';
import { Scene_Item } from './Scene_Item';
import { Scene_MenuBase } from './Scene_MenuBase';
import { Scene_Options } from './Scene_Options';
import { Scene_Save } from './Scene_Save';
import { Scene_Skill } from './Scene_Skill';
import { Scene_Status } from './Scene_Status';

/**
 * The scene class of the menu screen.
 */
export class Scene_Menu extends Scene_MenuBase {
    protected _commandWindow: Window_MenuCommand;
    protected _goldWindow: Window_Gold;
    protected _statusWindow: Window_MenuStatus;

    create(): void {
        super.create();
        this.createCommandWindow();
        this.createGoldWindow();
        this.createStatusWindow();
    }

    start(): void {
        super.start();
        this._statusWindow.refresh();
    }

    createCommandWindow(): void {
        this._commandWindow = new Window_MenuCommand(0, 0);
        this._commandWindow.setHandler('item', this.commandItem.bind(this));
        this._commandWindow.setHandler('skill', this.commandPersonal.bind(this));
        this._commandWindow.setHandler('equip', this.commandPersonal.bind(this));
        this._commandWindow.setHandler('status', this.commandPersonal.bind(this));
        this._commandWindow.setHandler('formation', this.commandFormation.bind(this));
        this._commandWindow.setHandler('options', this.commandOptions.bind(this));
        this._commandWindow.setHandler('save', this.commandSave.bind(this));
        this._commandWindow.setHandler('gameEnd', this.commandGameEnd.bind(this));
        this._commandWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._commandWindow);
    }

    createGoldWindow(): void {
        this._goldWindow = new Window_Gold(0, 0);
        this.addWindow(this._goldWindow);
        this._goldWindow.y = Graphics.boxHeight - this._goldWindow.height;
    }

    createStatusWindow(): void {
        this._statusWindow = new Window_MenuStatus(this._commandWindow.width, 0);
        this._statusWindow.reserveFaceImages();
        this.addWindow(this._statusWindow);
    }

    commandItem(): void {
        SceneManager.push(Scene_Item);
    }

    commandPersonal(): void {
        this._statusWindow.setFormationMode(false);
        this._statusWindow.selectLast();
        this._statusWindow.activate();
        this._statusWindow.setHandler('ok', this.onPersonalOk.bind(this));
        this._statusWindow.setHandler('cancel', this.onPersonalCancel.bind(this));
    }

    commandFormation(): void {
        this._statusWindow.setFormationMode(true);
        this._statusWindow.selectLast();
        this._statusWindow.activate();
        this._statusWindow.setHandler('ok', this.onFormationOk.bind(this));
        this._statusWindow.setHandler('cancel', this.onFormationCancel.bind(this));
    }

    commandOptions(): void {
        SceneManager.push(Scene_Options);
    }

    commandSave(): void {
        SceneManager.push(Scene_Save);
    }

    commandGameEnd(): void {
        SceneManager.push(Scene_GameEnd);
    }

    onPersonalOk(): void {
        switch (this._commandWindow.currentSymbol()) {
            case 'skill':
                SceneManager.push(Scene_Skill);
                break;
            case 'equip':
                SceneManager.push(Scene_Equip);
                break;
            case 'status':
                SceneManager.push(Scene_Status);
                break;
        }
    }

    onPersonalCancel(): void {
        this._statusWindow.deselect();
        this._commandWindow.activate();
    }

    onFormationOk(): void {
        const index = this._statusWindow.index();
        // const actor = window.$gameParty.members()[index];
        const pendingIndex = this._statusWindow.pendingIndex();
        if (pendingIndex >= 0) {
            window.$gameParty.swapOrder(index, pendingIndex);
            this._statusWindow.setPendingIndex(-1);
            this._statusWindow.redrawItem(index);
        } else {
            this._statusWindow.setPendingIndex(index);
        }
        this._statusWindow.activate();
    }

    onFormationCancel(): void {
        if (this._statusWindow.pendingIndex() >= 0) {
            this._statusWindow.setPendingIndex(-1);
            this._statusWindow.activate();
        } else {
            this._statusWindow.deselect();
            this._commandWindow.activate();
        }
    }
}

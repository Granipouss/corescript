import { Graphics } from '../rpg_core/Graphics';
import type { RPGArmor } from '../rpg_data/armor';
import type { RPGWeapon } from '../rpg_data/weapon';
import { SoundManager } from '../rpg_managers/SoundManager';
import { Window_EquipCommand } from '../rpg_windows/Window_EquipCommand';
import { Window_EquipItem } from '../rpg_windows/Window_EquipItem';
import { Window_EquipSlot } from '../rpg_windows/Window_EquipSlot';
import { Window_EquipStatus } from '../rpg_windows/Window_EquipStatus';
import { Scene_MenuBase } from './Scene_MenuBase';

/**
 * The scene class of the equipment screen.
 */
export class Scene_Equip extends Scene_MenuBase {
    protected _statusWindow: Window_EquipStatus;
    protected _commandWindow: Window_EquipCommand;
    protected _slotWindow: Window_EquipSlot;
    protected _itemWindow: Window_EquipItem;

    create(): void {
        super.create();
        this.createHelpWindow();
        this.createStatusWindow();
        this.createCommandWindow();
        this.createSlotWindow();
        this.createItemWindow();
        this.refreshActor();
    }

    createStatusWindow(): void {
        this._statusWindow = new Window_EquipStatus(0, this._helpWindow.height);
        this.addWindow(this._statusWindow);
    }

    createCommandWindow(): void {
        const wx = this._statusWindow.width;
        const wy = this._helpWindow.height;
        const ww = Graphics.boxWidth - this._statusWindow.width;
        this._commandWindow = new Window_EquipCommand(wx, wy, ww);
        this._commandWindow.setHelpWindow(this._helpWindow);
        this._commandWindow.setHandler('equip', this.commandEquip.bind(this));
        this._commandWindow.setHandler('optimize', this.commandOptimize.bind(this));
        this._commandWindow.setHandler('clear', this.commandClear.bind(this));
        this._commandWindow.setHandler('cancel', this.popScene.bind(this));
        this._commandWindow.setHandler('pagedown', this.nextActor.bind(this));
        this._commandWindow.setHandler('pageup', this.previousActor.bind(this));
        this.addWindow(this._commandWindow);
    }

    createSlotWindow(): void {
        const wx = this._statusWindow.width;
        const wy = this._commandWindow.y + this._commandWindow.height;
        const ww = Graphics.boxWidth - this._statusWindow.width;
        const wh = this._statusWindow.height - this._commandWindow.height;
        this._slotWindow = new Window_EquipSlot(wx, wy, ww, wh);
        this._slotWindow.setHelpWindow(this._helpWindow);
        this._slotWindow.setStatusWindow(this._statusWindow);
        this._slotWindow.setHandler('ok', this.onSlotOk.bind(this));
        this._slotWindow.setHandler('cancel', this.onSlotCancel.bind(this));
        this.addWindow(this._slotWindow);
    }

    createItemWindow(): void {
        const wx = 0;
        const wy = this._statusWindow.y + this._statusWindow.height;
        const ww = Graphics.boxWidth;
        const wh = Graphics.boxHeight - wy;
        this._itemWindow = new Window_EquipItem(wx, wy, ww, wh);
        this._itemWindow.setHelpWindow(this._helpWindow);
        this._itemWindow.setStatusWindow(this._statusWindow);
        this._itemWindow.setHandler('ok', this.onItemOk.bind(this));
        this._itemWindow.setHandler('cancel', this.onItemCancel.bind(this));
        this._slotWindow.setItemWindow(this._itemWindow);
        this.addWindow(this._itemWindow);
    }

    refreshActor(): void {
        const actor = this.actor();
        this._statusWindow.setActor(actor);
        this._slotWindow.setActor(actor);
        this._itemWindow.setActor(actor);
    }

    commandEquip(): void {
        this._slotWindow.activate();
        this._slotWindow.select(0);
    }

    commandOptimize(): void {
        SoundManager.playEquip();
        this.actor().optimizeEquipments();
        this._statusWindow.refresh();
        this._slotWindow.refresh();
        this._commandWindow.activate();
    }

    commandClear(): void {
        SoundManager.playEquip();
        this.actor().clearEquipments();
        this._statusWindow.refresh();
        this._slotWindow.refresh();
        this._commandWindow.activate();
    }

    onSlotOk(): void {
        this._itemWindow.activate();
        this._itemWindow.select(0);
    }

    onSlotCancel(): void {
        this._slotWindow.deselect();
        this._commandWindow.activate();
    }

    onItemOk(): void {
        SoundManager.playEquip();
        this.actor().changeEquip(this._slotWindow.index(), this._itemWindow.item() as RPGWeapon | RPGArmor);
        this._slotWindow.activate();
        this._slotWindow.refresh();
        this._itemWindow.deselect();
        this._itemWindow.refresh();
        this._statusWindow.refresh();
    }

    onItemCancel(): void {
        this._slotWindow.activate();
        this._itemWindow.deselect();
    }

    onActorChange(): void {
        this.refreshActor();
        this._commandWindow.activate();
    }
}

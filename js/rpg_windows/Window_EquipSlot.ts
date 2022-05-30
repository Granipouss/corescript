import { RPGArmor } from '../rpg_data/armor';
import { RPGWeapon } from '../rpg_data/weapon';
import { Game_Actor } from '../rpg_objects/Game_Actor';
import { Window_EquipItem } from './Window_EquipItem';
import { Window_EquipStatus } from './Window_EquipStatus';
import { Window_Selectable } from './Window_Selectable';

/**
 * The window for selecting an equipment slot on the equipment screen.
 */
export class Window_EquipSlot extends Window_Selectable {
    protected _actor: Game_Actor;

    protected _statusWindow: Window_EquipStatus;
    protected _itemWindow: Window_EquipItem;

    initialize(x, y, width, height) {
        super.initialize(x, y, width, height);
        this._actor = null;
        this.refresh();
    }

    setActor(actor) {
        if (this._actor !== actor) {
            this._actor = actor;
            this.refresh();
        }
    }

    update() {
        super.update();
        if (this._itemWindow) {
            this._itemWindow.setSlotId(this.index());
        }
    }

    maxItems() {
        return this._actor ? this._actor.equipSlots().length : 0;
    }

    item(): RPGArmor | RPGWeapon {
        return this._actor ? this._actor.equips()[this.index()] : null;
    }

    drawItem(index) {
        if (this._actor) {
            const rect = this.itemRectForText(index);
            this.changeTextColor(this.systemColor());
            this.changePaintOpacity(this.isEnabled(index));
            this.drawText(this.slotName(index), rect.x, rect.y, 138);
            this.drawItemName(this._actor.equips()[index], rect.x + 138, rect.y);
            this.changePaintOpacity(true);
        }
    }

    slotName(index) {
        const slots = this._actor.equipSlots();
        return this._actor ? window.$dataSystem.equipTypes[slots[index]] : '';
    }

    isEnabled(index) {
        return this._actor ? this._actor.isEquipChangeOk(index) : false;
    }

    isCurrentItemEnabled() {
        return this.isEnabled(this.index());
    }

    setStatusWindow(statusWindow) {
        this._statusWindow = statusWindow;
        this.callUpdateHelp();
    }

    setItemWindow(itemWindow) {
        this._itemWindow = itemWindow;
    }

    updateHelp() {
        super.updateHelp();
        this.setHelpWindowItem(this.item());
        if (this._statusWindow) {
            this._statusWindow.setTempActor(null);
        }
    }
}

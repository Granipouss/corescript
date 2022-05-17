import { JsonEx } from '../rpg_core/JsonEx';
import { Window_ItemList } from './Window_ItemList';

/**
 * The window for selecting an equipment item on the equipment screen.
 */
export class Window_EquipItem extends Window_ItemList {
    initialize(x, y, width, height) {
        super.initialize(x, y, width, height);
        this._actor = null;
        this._slotId = 0;
    }

    setActor(actor) {
        if (this._actor !== actor) {
            this._actor = actor;
            this.refresh();
            this.resetScroll();
        }
    }

    setSlotId(slotId) {
        if (this._slotId !== slotId) {
            this._slotId = slotId;
            this.refresh();
            this.resetScroll();
        }
    }

    includes(item) {
        if (item === null) {
            return true;
        }
        if (this._slotId < 0 || item.etypeId !== this._actor.equipSlots()[this._slotId]) {
            return false;
        }
        return this._actor.canEquip(item);
    }

    isEnabled(_item) {
        return true;
    }

    selectLast() {}

    setStatusWindow(statusWindow) {
        this._statusWindow = statusWindow;
        this.callUpdateHelp();
    }

    updateHelp() {
        super.updateHelp();
        if (this._actor && this._statusWindow) {
            var actor = JsonEx.makeDeepCopy(this._actor);
            actor.forceChangeEquip(this._slotId, this.item());
            this._statusWindow.setTempActor(actor);
        }
    }

    playOkSound() {}
}

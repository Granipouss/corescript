import { JsonEx } from '../rpg_core/JsonEx';
import type { RPGArmor } from '../rpg_data/armor';
import type { RPGItem } from '../rpg_data/item';
import type { RPGWeapon } from '../rpg_data/weapon';
import type { Game_Actor } from '../rpg_objects/Game_Actor';
import type { Window_EquipStatus } from './Window_EquipStatus';
import { Window_ItemList } from './Window_ItemList';

/**
 * The window for selecting an equipment item on the equipment screen.
 */
export class Window_EquipItem extends Window_ItemList {
    protected _actor: Game_Actor = null;
    protected _slotId = 0;

    protected _statusWindow: Window_EquipStatus;

    setActor(actor: Game_Actor): void {
        if (this._actor !== actor) {
            this._actor = actor;
            this.refresh();
            this.resetScroll();
        }
    }

    setSlotId(slotId: number): void {
        if (this._slotId !== slotId) {
            this._slotId = slotId;
            this.refresh();
            this.resetScroll();
        }
    }

    includes(item: RPGArmor | RPGWeapon): boolean {
        if (item === null) {
            return true;
        }
        if (this._slotId < 0 || item.etypeId !== this._actor.equipSlots()[this._slotId]) {
            return false;
        }
        return this._actor.canEquip(item);
    }

    isEnabled(_item: RPGItem): boolean {
        return true;
    }

    selectLast(): void {
        // ...
    }

    setStatusWindow(statusWindow: Window_EquipStatus): void {
        this._statusWindow = statusWindow;
        this.callUpdateHelp();
    }

    updateHelp(): void {
        super.updateHelp();
        if (this._actor && this._statusWindow) {
            const actor = JsonEx.makeDeepCopy(this._actor);
            actor.forceChangeEquip(this._slotId, this.item() as RPGWeapon | RPGArmor);
            this._statusWindow.setTempActor(actor);
        }
    }

    playOkSound(): void {
        // ...
    }
}

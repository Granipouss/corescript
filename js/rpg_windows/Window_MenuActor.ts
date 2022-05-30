import { RPGItem } from '../rpg_data/item';
import { RPGSkill } from '../rpg_data/skill';
import { DataManager } from '../rpg_managers/DataManager';
import { Game_Action } from '../rpg_objects/Game_Action';
import { Window_MenuStatus } from './Window_MenuStatus';

/**
 * The window for selecting a target actor on the item and skill screens.
 */
export class Window_MenuActor extends Window_MenuStatus {
    initialize() {
        super.initialize(0, 0);
        this.hide();
    }

    processOk(): void {
        if (!this.cursorAll()) {
            window.$gameParty.setTargetActor(window.$gameParty.members()[this.index()]);
        }
        this.callOkHandler();
    }

    selectLast(): void {
        this.select(window.$gameParty.targetActor().index() || 0);
    }

    selectForItem(item: RPGSkill | RPGItem): void {
        const actor = window.$gameParty.menuActor();
        const action = new Game_Action(actor);
        action.setItemObject(item);
        this.setCursorFixed(false);
        this.setCursorAll(false);
        if (action.isForUser()) {
            if (DataManager.isSkill(item)) {
                this.setCursorFixed(true);
                this.select(actor.index());
            } else {
                this.selectLast();
            }
        } else if (action.isForAll()) {
            this.setCursorAll(true);
            this.select(0);
        } else {
            this.selectLast();
        }
    }
}

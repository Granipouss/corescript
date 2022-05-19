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

    processOk() {
        if (!this.cursorAll()) {
            global.$gameParty.setTargetActor(global.$gameParty.members()[this.index()]);
        }
        this.callOkHandler();
    }

    selectLast() {
        this.select(global.$gameParty.targetActor().index() || 0);
    }

    selectForItem(item) {
        const actor = global.$gameParty.menuActor();
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

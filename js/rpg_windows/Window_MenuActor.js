//-----------------------------------------------------------------------------
// Window_MenuActor
//
// The window for selecting a target actor on the item and skill screens.

import { DataManager } from '../rpg_managers/DataManager';
import { Game_Action } from '../rpg_objects/Game_Action';
import { Window_MenuStatus } from './Window_MenuStatus';

export function Window_MenuActor() {
    this.initialize.apply(this, arguments);
}

Window_MenuActor.prototype = Object.create(Window_MenuStatus.prototype);
Window_MenuActor.prototype.constructor = Window_MenuActor;

Window_MenuActor.prototype.initialize = function () {
    Window_MenuStatus.prototype.initialize.call(this, 0, 0);
    this.hide();
};

Window_MenuActor.prototype.processOk = function () {
    if (!this.cursorAll()) {
        global.$gameParty.setTargetActor(global.$gameParty.members()[this.index()]);
    }
    this.callOkHandler();
};

Window_MenuActor.prototype.selectLast = function () {
    this.select(global.$gameParty.targetActor().index() || 0);
};

Window_MenuActor.prototype.selectForItem = function (item) {
    var actor = global.$gameParty.menuActor();
    var action = new Game_Action(actor);
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
};

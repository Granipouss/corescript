import { Graphics } from '../rpg_core/Graphics';
import { SceneManager } from '../rpg_managers/SceneManager';
import { SoundManager } from '../rpg_managers/SoundManager';
import { Game_Action } from '../rpg_objects/Game_Action';
import { Window_MenuActor } from '../rpg_windows/Window_MenuActor';
import { Scene_Map } from './Scene_Map';
import { Scene_MenuBase } from './Scene_MenuBase';

/**
 * The superclass of Scene_Item and Scene_Skill.
 */
export class Scene_ItemBase extends Scene_MenuBase {
    createActorWindow() {
        this._actorWindow = new Window_MenuActor();
        this._actorWindow.setHandler('ok', this.onActorOk.bind(this));
        this._actorWindow.setHandler('cancel', this.onActorCancel.bind(this));
        this.addWindow(this._actorWindow);
    }

    item() {
        return this._itemWindow.item();
    }

    user() {
        return null;
    }

    isCursorLeft() {
        return this._itemWindow.index() % 2 === 0;
    }

    showSubWindow(window) {
        window.x = this.isCursorLeft() ? Graphics.boxWidth - window.width : 0;
        window.show();
        window.activate();
    }

    hideSubWindow(window) {
        window.hide();
        window.deactivate();
        this.activateItemWindow();
    }

    onActorOk() {
        if (this.canUse()) {
            this.useItem();
        } else {
            SoundManager.playBuzzer();
        }
    }

    onActorCancel() {
        this.hideSubWindow(this._actorWindow);
    }

    action() {
        var action = new Game_Action(this.user());
        action.setItemObject(this.item());
        return action;
    }

    determineItem() {
        var action = this.action();
        if (action.isForFriend()) {
            this.showSubWindow(this._actorWindow);
            this._actorWindow.selectForItem(this.item());
        } else {
            this.useItem();
            this.activateItemWindow();
        }
    }

    useItem() {
        this.playSeForItem();
        this.user().useItem(this.item());
        this.applyItem();
        this.checkCommonEvent();
        this.checkGameover();
        this._actorWindow.refresh();
    }

    activateItemWindow() {
        this._itemWindow.refresh();
        this._itemWindow.activate();
    }

    itemTargetActors() {
        var action = this.action();
        if (!action.isForFriend()) {
            return [];
        } else if (action.isForAll()) {
            return global.$gameParty.members();
        } else {
            return [global.$gameParty.members()[this._actorWindow.index()]];
        }
    }

    canUse() {
        var user = this.user();
        if (user) {
            return user.canUse(this.item()) && this.isItemEffectsValid();
        }
        return false;
    }

    isItemEffectsValid() {
        var action = this.action();
        return this.itemTargetActors().some(function (target) {
            return action.testApply(target);
        }, this);
    }

    applyItem() {
        var action = this.action();
        var targets = this.itemTargetActors();
        targets.forEach(function (battler) {
            var repeats = action.numRepeats();
            for (var i = 0; i < repeats; i++) {
                action.apply(battler);
            }
        });
        action.applyGlobal();
    }

    checkCommonEvent() {
        if (global.$gameTemp.isCommonEventReserved()) {
            SceneManager.goto(Scene_Map);
        }
    }
}

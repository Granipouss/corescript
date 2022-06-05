import { Graphics } from '../rpg_core/Graphics';
import type { RPGItem } from '../rpg_data/item';
import type { RPGSkill } from '../rpg_data/skill';
import { SceneManager } from '../rpg_managers/SceneManager';
import { SoundManager } from '../rpg_managers/SoundManager';
import { Game_Action } from '../rpg_objects/Game_Action';
import type { Game_Battler } from '../rpg_objects/Game_Battler';
import type { Window_ItemList } from '../rpg_windows/Window_ItemList';
import { Window_MenuActor } from '../rpg_windows/Window_MenuActor';
import type { Window_SkillList } from '../rpg_windows/Window_SkillList';
import { Scene_Map } from './Scene_Map';
import { Scene_MenuBase } from './Scene_MenuBase';

/**
 * The superclass of Scene_Item and Scene_Skill.
 */
export abstract class Scene_ItemBase<T extends RPGSkill | RPGItem> extends Scene_MenuBase {
    protected _actorWindow: Window_MenuActor;
    protected _itemWindow: Window_ItemList | Window_SkillList;

    createActorWindow(): void {
        this._actorWindow = new Window_MenuActor();
        this._actorWindow.setHandler('ok', this.onActorOk.bind(this));
        this._actorWindow.setHandler('cancel', this.onActorCancel.bind(this));
        this.addWindow(this._actorWindow);
    }

    item(): T {
        return this._itemWindow.item() as T;
    }

    user(): Game_Battler {
        return null;
    }

    isCursorLeft(): boolean {
        return this._itemWindow.index() % 2 === 0;
    }

    showSubWindow(window: Window_MenuActor): void {
        window.x = this.isCursorLeft() ? Graphics.boxWidth - window.width : 0;
        window.show();
        window.activate();
    }

    hideSubWindow(window: Window_MenuActor): void {
        window.hide();
        window.deactivate();
        this.activateItemWindow();
    }

    onActorOk(): void {
        if (this.canUse()) {
            this.useItem();
        } else {
            SoundManager.playBuzzer();
        }
    }

    onActorCancel(): void {
        this.hideSubWindow(this._actorWindow);
    }

    action(): Game_Action {
        const action = new Game_Action(this.user());
        action.setItemObject(this.item());
        return action;
    }

    determineItem(): void {
        const action = this.action();
        if (action.isForFriend()) {
            this.showSubWindow(this._actorWindow);
            this._actorWindow.selectForItem(this.item());
        } else {
            this.useItem();
            this.activateItemWindow();
        }
    }

    useItem(): void {
        this.playSeForItem();
        this.user().useItem(this.item());
        this.applyItem();
        this.checkCommonEvent();
        this.checkGameover();
        this._actorWindow.refresh();
    }

    activateItemWindow(): void {
        this._itemWindow.refresh();
        this._itemWindow.activate();
    }

    itemTargetActors(): Game_Battler[] {
        const action = this.action();
        if (!action.isForFriend()) {
            return [];
        } else if (action.isForAll()) {
            return window.$gameParty.members();
        } else {
            return [window.$gameParty.members()[this._actorWindow.index()]];
        }
    }

    canUse(): boolean {
        const user = this.user();
        if (user) {
            return user.canUse(this.item()) && this.isItemEffectsValid();
        }
        return false;
    }

    isItemEffectsValid(): boolean {
        const action = this.action();
        return this.itemTargetActors().some((target) => action.testApply(target), this);
    }

    applyItem(): void {
        const action = this.action();
        const targets = this.itemTargetActors();
        targets.forEach((battler) => {
            const repeats = action.numRepeats();
            for (let i = 0; i < repeats; i++) {
                action.apply(battler);
            }
        });
        action.applyGlobal();
    }

    checkCommonEvent(): void {
        if (window.$gameTemp.isCommonEventReserved()) {
            SceneManager.goto(Scene_Map);
        }
    }

    abstract playSeForItem(): void;
}

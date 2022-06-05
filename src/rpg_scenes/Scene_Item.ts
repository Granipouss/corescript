import { Graphics } from '../rpg_core/Graphics';
import type { RPGItem } from '../rpg_data/item';
import { SoundManager } from '../rpg_managers/SoundManager';
import type { Game_Actor } from '../rpg_objects/Game_Actor';
import { Window_ItemCategory } from '../rpg_windows/Window_ItemCategory';
import { Window_ItemList } from '../rpg_windows/Window_ItemList';
import { Scene_ItemBase } from './Scene_ItemBase';

/**
 * The scene class of the item screen.
 */
export class Scene_Item extends Scene_ItemBase<RPGItem> {
    protected _categoryWindow: Window_ItemCategory;

    create(): void {
        super.create();
        this.createHelpWindow();
        this.createCategoryWindow();
        this.createItemWindow();
        this.createActorWindow();
    }

    createCategoryWindow(): void {
        this._categoryWindow = new Window_ItemCategory();
        this._categoryWindow.setHelpWindow(this._helpWindow);
        this._categoryWindow.y = this._helpWindow.height;
        this._categoryWindow.setHandler('ok', this.onCategoryOk.bind(this));
        this._categoryWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._categoryWindow);
    }

    createItemWindow(): void {
        const wy = this._categoryWindow.y + this._categoryWindow.height;
        const wh = Graphics.boxHeight - wy;
        this._itemWindow = new Window_ItemList(0, wy, Graphics.boxWidth, wh);
        this._itemWindow.setHelpWindow(this._helpWindow);
        this._itemWindow.setHandler('ok', this.onItemOk.bind(this));
        this._itemWindow.setHandler('cancel', this.onItemCancel.bind(this));
        this.addWindow(this._itemWindow);
        this._categoryWindow.setItemWindow(this._itemWindow);
    }

    user(): Game_Actor {
        const members = window.$gameParty.movableMembers();
        let bestActor = members[0];
        let bestPha = 0;
        for (let i = 0; i < members.length; i++) {
            if (members[i].pha > bestPha) {
                bestPha = members[i].pha;
                bestActor = members[i];
            }
        }
        return bestActor;
    }

    onCategoryOk(): void {
        this._itemWindow.activate();
        this._itemWindow.selectLast();
    }

    onItemOk(): void {
        window.$gameParty.setLastItem(this.item());
        this.determineItem();
    }

    onItemCancel(): void {
        this._itemWindow.deselect();
        this._categoryWindow.activate();
    }

    playSeForItem(): void {
        SoundManager.playUseItem();
    }

    useItem(): void {
        super.useItem();
        this._itemWindow.redrawCurrentItem();
    }
}

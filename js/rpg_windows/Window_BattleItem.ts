import { RPGItem } from '../rpg_data/item';
import { Window_ItemList } from './Window_ItemList';

/**
 * The window for selecting an item to use on the battle screen.
 */
export class Window_BattleItem extends Window_ItemList {
    initialize(x, y, width, height) {
        super.initialize(x, y, width, height);
        this.hide();
    }

    includes(item: RPGItem): boolean {
        return window.$gameParty.canUse(item);
    }

    show(): void {
        this.selectLast();
        this.showHelpWindow();
        super.show();
    }

    hide(): void {
        this.hideHelpWindow();
        super.hide();
    }
}

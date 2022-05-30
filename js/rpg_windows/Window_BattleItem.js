import { Window_ItemList } from './Window_ItemList';

/**
 * The window for selecting an item to use on the battle screen.
 */
export class Window_BattleItem extends Window_ItemList {
    initialize(x, y, width, height) {
        super.initialize(x, y, width, height);
        this.hide();
    }

    includes(item) {
        return window.$gameParty.canUse(item);
    }

    show() {
        this.selectLast();
        this.showHelpWindow();
        super.show();
    }

    hide() {
        this.hideHelpWindow();
        super.hide();
    }
}

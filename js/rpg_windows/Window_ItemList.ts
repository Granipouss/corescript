import { DataManager } from '../rpg_managers/DataManager';
import { Window_Selectable } from './Window_Selectable';

/**
 * The window for selecting an item on the item screen.
 * @abstract
 */
export class Window_ItemList extends Window_Selectable {
    protected _category: string;
    protected _data: any[];

    initialize(x, y, width, height) {
        super.initialize(x, y, width, height);
        this._category = 'none';
        this._data = [];
    }

    setCategory(category) {
        if (this._category !== category) {
            this._category = category;
            this.refresh();
            this.resetScroll();
        }
    }

    maxCols() {
        return 2;
    }

    spacing() {
        return 48;
    }

    maxItems() {
        return this._data ? this._data.length : 1;
    }

    item() {
        const index = this.index();
        return this._data && index >= 0 ? this._data[index] : null;
    }

    isCurrentItemEnabled() {
        return this.isEnabled(this.item());
    }

    includes(item) {
        switch (this._category) {
            case 'item':
                return DataManager.isItem(item) && item.itypeId === 1;
            case 'weapon':
                return DataManager.isWeapon(item);
            case 'armor':
                return DataManager.isArmor(item);
            case 'keyItem':
                return DataManager.isItem(item) && item.itypeId === 2;
            default:
                return false;
        }
    }

    needsNumber() {
        return true;
    }

    isEnabled(item) {
        return window.$gameParty.canUse(item);
    }

    makeItemList() {
        this._data = window.$gameParty.allItems().filter(function (item) {
            return this.includes(item);
        }, this);
        if (this.includes(null)) {
            this._data.push(null);
        }
    }

    selectLast() {
        const index = this._data.indexOf(window.$gameParty.lastItem());
        this.select(index >= 0 ? index : 0);
    }

    drawItem(index) {
        const item = this._data[index];
        if (item) {
            const numberWidth = this.numberWidth();
            const rect = this.itemRect(index);
            rect.width -= this.textPadding();
            this.changePaintOpacity(this.isEnabled(item));
            this.drawItemName(item, rect.x, rect.y, rect.width - numberWidth);
            this.drawItemNumber(item, rect.x, rect.y, rect.width);
            this.changePaintOpacity(true);
        }
    }

    numberWidth() {
        return this.textWidth('000');
    }

    drawItemNumber(item, x, y, width) {
        if (this.needsNumber()) {
            this.drawText(':', x, y, width - this.textWidth('00'), 'right');
            this.drawText(window.$gameParty.numItems(item).toFixed(), x, y, width, 'right');
        }
    }

    updateHelp() {
        this.setHelpWindowItem(this.item());
    }

    refresh() {
        this.makeItemList();
        this.createContents();
        this.drawAllItems();
    }
}

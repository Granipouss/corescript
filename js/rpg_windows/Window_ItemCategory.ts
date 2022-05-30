import { Graphics } from '../rpg_core/Graphics';
import { TextManager } from '../rpg_managers/TextManager';
import { Window_HorzCommand } from './Window_HorzCommand';
import { Window_ItemList } from './Window_ItemList';

/**
 * The window for selecting a category of items on the item and shop screens.
 */
export class Window_ItemCategory extends Window_HorzCommand {
    private _itemWindow: Window_ItemList;

    initialize() {
        super.initialize(0, 0);
    }

    windowWidth(): number {
        return Graphics.boxWidth;
    }

    maxCols(): number {
        return 4;
    }

    update(): void {
        super.update();
        if (this._itemWindow) {
            this._itemWindow.setCategory(this.currentSymbol());
        }
    }

    makeCommandList(): void {
        this.addCommand(TextManager.item, 'item');
        this.addCommand(TextManager.weapon, 'weapon');
        this.addCommand(TextManager.armor, 'armor');
        this.addCommand(TextManager.keyItem, 'keyItem');
    }

    setItemWindow(itemWindow: Window_ItemList): void {
        this._itemWindow = itemWindow;
    }
}

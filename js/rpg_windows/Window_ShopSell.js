import { Window_ItemList } from './Window_ItemList';

/**
 * The window for selecting an item to sell on the shop screen.
 */
export class Window_ShopSell extends Window_ItemList {
    isEnabled(item) {
        return item && item.price > 0;
    }
}

import type { RPGArmor } from '../rpg_data/armor';
import type { RPGItem } from '../rpg_data/item';
import type { RPGWeapon } from '../rpg_data/weapon';
import { Window_ItemList } from './Window_ItemList';

/**
 * The window for selecting an item to sell on the shop screen.
 */
export class Window_ShopSell extends Window_ItemList {
    isEnabled(item: RPGItem | RPGWeapon | RPGArmor): boolean {
        return item && item.price > 0;
    }
}

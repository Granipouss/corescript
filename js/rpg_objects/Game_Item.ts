import type { RPGArmor } from '../rpg_data/armor';
import type { RPGItem } from '../rpg_data/item';
import type { RPGSkill } from '../rpg_data/skill';
import type { RPGWeapon } from '../rpg_data/weapon';
import { DataManager } from '../rpg_managers/DataManager';

/**
 * The game object class for handling skills, items, weapons, and armor. It is
 * required because save data should not include the database object itself.
 */
export class Game_Item {
    private _dataClass: string;
    private _itemId: number;

    constructor(item: RPGSkill | RPGArmor | RPGWeapon | RPGItem = null) {
        this._dataClass = '';
        this._itemId = 0;
        if (item) {
            this.setObject(item);
        }
    }

    isSkill(): boolean {
        return this._dataClass === 'skill';
    }

    isItem(): boolean {
        return this._dataClass === 'item';
    }

    isUsableItem(): boolean {
        return this.isSkill() || this.isItem();
    }

    isWeapon(): boolean {
        return this._dataClass === 'weapon';
    }

    isArmor(): boolean {
        return this._dataClass === 'armor';
    }

    isEquipItem(): boolean {
        return this.isWeapon() || this.isArmor();
    }

    isNull(): boolean {
        return this._dataClass === '';
    }

    itemId(): number {
        return this._itemId;
    }

    object(): RPGSkill | RPGArmor | RPGWeapon | RPGItem {
        if (this.isSkill()) {
            return window.$dataSkills[this._itemId];
        } else if (this.isItem()) {
            return window.$dataItems[this._itemId];
        } else if (this.isWeapon()) {
            return window.$dataWeapons[this._itemId];
        } else if (this.isArmor()) {
            return window.$dataArmors[this._itemId];
        } else {
            return null;
        }
    }

    setObject(item: RPGSkill | RPGArmor | RPGWeapon | RPGItem): void {
        if (DataManager.isSkill(item)) {
            this._dataClass = 'skill';
        } else if (DataManager.isItem(item)) {
            this._dataClass = 'item';
        } else if (DataManager.isWeapon(item)) {
            this._dataClass = 'weapon';
        } else if (DataManager.isArmor(item)) {
            this._dataClass = 'armor';
        } else {
            this._dataClass = '';
        }
        this._itemId = item ? item.id : 0;
    }

    setEquip(isWeapon: boolean, itemId: number): void {
        this._dataClass = isWeapon ? 'weapon' : 'armor';
        this._itemId = itemId;
    }
}

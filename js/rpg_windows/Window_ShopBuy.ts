import { RPGArmor } from '../rpg_data/armor';
import { RPGItem } from '../rpg_data/item';
import { RPGWeapon } from '../rpg_data/weapon';
import { Window_Selectable } from './Window_Selectable';
import { Window_ShopStatus } from './Window_ShopStatus';

/**
 * The window for selecting an item to buy on the shop screen.
 */
export class Window_ShopBuy extends Window_Selectable {
    protected _shopGoods: [number, number, number, number][];
    protected _money = 0;
    protected _data: (RPGItem | RPGArmor | RPGWeapon)[];
    protected _price: number[];
    protected _statusWindow: Window_ShopStatus;

    constructor(x: number, y: number, height: number, shopGoods: [number, number, number, number][]) {
        super(x, y, 0, height);
        this._shopGoods = shopGoods;
    }

    initialize(x: number, y: number, _width: number, height: number): void {
        const width = this.windowWidth();
        super.initialize(x, y, width, height);
        this.refresh();
        this.select(0);
    }

    windowWidth(): number {
        return 456;
    }

    maxItems(): number {
        return this._data ? this._data.length : 1;
    }

    item(): RPGItem | RPGArmor | RPGWeapon {
        return this._data[this.index()];
    }

    setMoney(money: number): void {
        this._money = money;
        this.refresh();
    }

    isCurrentItemEnabled(): boolean {
        return this.isEnabled(this._data[this.index()]);
    }

    price(item: RPGItem | RPGArmor | RPGWeapon): number {
        return this._price[this._data.indexOf(item)] || 0;
    }

    isEnabled(item: RPGItem | RPGArmor | RPGWeapon): boolean {
        return item && this.price(item) <= this._money && !window.$gameParty.hasMaxItems(item);
    }

    refresh(): void {
        this.makeItemList();
        this.createContents();
        this.drawAllItems();
    }

    makeItemList(): void {
        this._data = [];
        this._price = [];
        this._shopGoods.forEach(function (goods) {
            let item = null;
            switch (goods[0]) {
                case 0:
                    item = window.$dataItems[goods[1]];
                    break;
                case 1:
                    item = window.$dataWeapons[goods[1]];
                    break;
                case 2:
                    item = window.$dataArmors[goods[1]];
                    break;
            }
            if (item) {
                this._data.push(item);
                this._price.push(goods[2] === 0 ? item.price : goods[3]);
            }
        }, this);
    }

    drawItem(index: number): void {
        const item = this._data[index];
        const rect = this.itemRect(index);
        const priceWidth = 96;
        rect.width -= this.textPadding();
        this.changePaintOpacity(this.isEnabled(item));
        this.drawItemName(item, rect.x, rect.y, rect.width - priceWidth);
        this.drawText(this.price(item).toFixed(), rect.x + rect.width - priceWidth, rect.y, priceWidth, 'right');
        this.changePaintOpacity(true);
    }

    setStatusWindow(statusWindow: Window_ShopStatus): void {
        this._statusWindow = statusWindow;
        this.callUpdateHelp();
    }

    updateHelp(): void {
        this.setHelpWindowItem(this.item());
        if (this._statusWindow) {
            this._statusWindow.setItem(this.item());
        }
    }
}

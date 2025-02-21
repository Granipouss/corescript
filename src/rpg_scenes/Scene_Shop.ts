import { Graphics } from '../rpg_core/Graphics';
import type { RPGArmor } from '../rpg_data/armor';
import type { RPGItem } from '../rpg_data/item';
import type { RPGWeapon } from '../rpg_data/weapon';
import { SoundManager } from '../rpg_managers/SoundManager';
import { Window_Base } from '../rpg_windows/Window_Base';
import { Window_Gold } from '../rpg_windows/Window_Gold';
import { Window_ItemCategory } from '../rpg_windows/Window_ItemCategory';
import { Window_ShopBuy } from '../rpg_windows/Window_ShopBuy';
import { Window_ShopCommand } from '../rpg_windows/Window_ShopCommand';
import { Window_ShopNumber } from '../rpg_windows/Window_ShopNumber';
import { Window_ShopSell } from '../rpg_windows/Window_ShopSell';
import { Window_ShopStatus } from '../rpg_windows/Window_ShopStatus';
import { Scene_MenuBase } from './Scene_MenuBase';

/**
 * The scene class of the shop screen.
 */
export class Scene_Shop extends Scene_MenuBase {
    protected _goldWindow: Window_Gold;
    protected _commandWindow: Window_ShopCommand;
    protected _dummyWindow: Window_Base;
    protected _numberWindow: Window_ShopNumber;
    protected _statusWindow: Window_ShopStatus;
    protected _buyWindow: Window_ShopBuy;
    protected _categoryWindow: Window_ItemCategory;
    protected _sellWindow: Window_ShopSell;

    protected _goods: [number, number, number, number][];
    protected _purchaseOnly: boolean;
    protected _item: RPGItem | RPGArmor | RPGWeapon;

    constructor(goods: [number, number, number, number][], purchaseOnly = false) {
        super();

        this._goods = goods;
        this._purchaseOnly = purchaseOnly;
        this._item = null;
    }

    create(): void {
        super.create();
        this.createHelpWindow();
        this.createGoldWindow();
        this.createCommandWindow();
        this.createDummyWindow();
        this.createNumberWindow();
        this.createStatusWindow();
        this.createBuyWindow();
        this.createCategoryWindow();
        this.createSellWindow();
    }

    createGoldWindow(): void {
        this._goldWindow = new Window_Gold(0, this._helpWindow.height);
        this._goldWindow.x = Graphics.boxWidth - this._goldWindow.width;
        this.addWindow(this._goldWindow);
    }

    createCommandWindow(): void {
        this._commandWindow = new Window_ShopCommand(this._goldWindow.x, this._purchaseOnly);
        this._commandWindow.y = this._helpWindow.height;
        this._commandWindow.setHandler('buy', this.commandBuy.bind(this));
        this._commandWindow.setHandler('sell', this.commandSell.bind(this));
        this._commandWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._commandWindow);
    }

    createDummyWindow(): void {
        const wy = this._commandWindow.y + this._commandWindow.height;
        const wh = Graphics.boxHeight - wy;
        this._dummyWindow = new Window_Base(0, wy, Graphics.boxWidth, wh);
        this.addWindow(this._dummyWindow);
    }

    createNumberWindow(): void {
        const wy = this._dummyWindow.y;
        const wh = this._dummyWindow.height;
        this._numberWindow = new Window_ShopNumber(0, wy, wh);
        this._numberWindow.hide();
        this._numberWindow.setHandler('ok', this.onNumberOk.bind(this));
        this._numberWindow.setHandler('cancel', this.onNumberCancel.bind(this));
        this.addWindow(this._numberWindow);
    }

    createStatusWindow(): void {
        const wx = this._numberWindow.width;
        const wy = this._dummyWindow.y;
        const ww = Graphics.boxWidth - wx;
        const wh = this._dummyWindow.height;
        this._statusWindow = new Window_ShopStatus(wx, wy, ww, wh);
        this.addWindow(this._statusWindow);
        this._statusWindow.hide();
    }

    createBuyWindow(): void {
        const wy = this._dummyWindow.y;
        const wh = this._dummyWindow.height;
        this._buyWindow = new Window_ShopBuy(0, wy, wh, this._goods);
        this._buyWindow.setHelpWindow(this._helpWindow);
        this._buyWindow.setStatusWindow(this._statusWindow);
        this._buyWindow.setHandler('ok', this.onBuyOk.bind(this));
        this._buyWindow.setHandler('cancel', this.onBuyCancel.bind(this));
        this.addWindow(this._buyWindow);
        this._buyWindow.hide();
    }

    createCategoryWindow(): void {
        this._categoryWindow = new Window_ItemCategory();
        this._categoryWindow.setHelpWindow(this._helpWindow);
        this._categoryWindow.y = this._dummyWindow.y;
        this._categoryWindow.setHandler('ok', this.onCategoryOk.bind(this));
        this._categoryWindow.setHandler('cancel', this.onCategoryCancel.bind(this));
        this.addWindow(this._categoryWindow);
        this._categoryWindow.hide();
        this._categoryWindow.deactivate();
    }

    createSellWindow(): void {
        const wy = this._categoryWindow.y + this._categoryWindow.height;
        const wh = Graphics.boxHeight - wy;
        this._sellWindow = new Window_ShopSell(0, wy, Graphics.boxWidth, wh);
        this._sellWindow.setHelpWindow(this._helpWindow);
        this._sellWindow.setHandler('ok', this.onSellOk.bind(this));
        this._sellWindow.setHandler('cancel', this.onSellCancel.bind(this));
        this._categoryWindow.setItemWindow(this._sellWindow);
        this.addWindow(this._sellWindow);
        this._sellWindow.hide();
    }

    activateBuyWindow(): void {
        this._buyWindow.setMoney(this.money());
        this._buyWindow.show();
        this._buyWindow.activate();
        this._statusWindow.show();
    }

    activateSellWindow(): void {
        this._categoryWindow.show();
        this._sellWindow.refresh();
        this._sellWindow.show();
        this._sellWindow.activate();
        this._statusWindow.hide();
    }

    commandBuy(): void {
        this._dummyWindow.hide();
        this.activateBuyWindow();
    }

    commandSell(): void {
        this._dummyWindow.hide();
        this._categoryWindow.show();
        this._categoryWindow.activate();
        this._sellWindow.show();
        this._sellWindow.deselect();
        this._sellWindow.refresh();
    }

    onBuyOk(): void {
        this._item = this._buyWindow.item();
        this._buyWindow.hide();
        this._numberWindow.setup(this._item, this.maxBuy(), this.buyingPrice());
        this._numberWindow.setCurrencyUnit(this.currencyUnit());
        this._numberWindow.show();
        this._numberWindow.activate();
    }

    onBuyCancel(): void {
        this._commandWindow.activate();
        this._dummyWindow.show();
        this._buyWindow.hide();
        this._statusWindow.hide();
        this._statusWindow.setItem(null);
        this._helpWindow.clear();
    }

    onCategoryOk(): void {
        this.activateSellWindow();
        this._sellWindow.select(0);
    }

    onCategoryCancel(): void {
        this._commandWindow.activate();
        this._dummyWindow.show();
        this._categoryWindow.hide();
        this._sellWindow.hide();
    }

    onSellOk(): void {
        this._item = this._sellWindow.item();
        this._categoryWindow.hide();
        this._sellWindow.hide();
        this._numberWindow.setup(this._item, this.maxSell(), this.sellingPrice());
        this._numberWindow.setCurrencyUnit(this.currencyUnit());
        this._numberWindow.show();
        this._numberWindow.activate();
        this._statusWindow.setItem(this._item);
        this._statusWindow.show();
    }

    onSellCancel(): void {
        this._sellWindow.deselect();
        this._categoryWindow.activate();
        this._statusWindow.setItem(null);
        this._helpWindow.clear();
    }

    onNumberOk(): void {
        SoundManager.playShop();
        switch (this._commandWindow.currentSymbol()) {
            case 'buy':
                this.doBuy(this._numberWindow.number());
                break;
            case 'sell':
                this.doSell(this._numberWindow.number());
                break;
        }
        this.endNumberInput();
        this._goldWindow.refresh();
        this._statusWindow.refresh();
    }

    onNumberCancel(): void {
        SoundManager.playCancel();
        this.endNumberInput();
    }

    doBuy(number: number): void {
        window.$gameParty.loseGold(number * this.buyingPrice());
        window.$gameParty.gainItem(this._item, number);
    }

    doSell(number: number): void {
        window.$gameParty.gainGold(number * this.sellingPrice());
        window.$gameParty.loseItem(this._item, number);
    }

    endNumberInput(): void {
        this._numberWindow.hide();
        switch (this._commandWindow.currentSymbol()) {
            case 'buy':
                this.activateBuyWindow();
                break;
            case 'sell':
                this.activateSellWindow();
                break;
        }
    }

    maxBuy(): number {
        const max = window.$gameParty.maxItems(this._item) - window.$gameParty.numItems(this._item);
        const price = this.buyingPrice();
        if (price > 0) {
            return Math.min(max, Math.floor(this.money() / price));
        } else {
            return max;
        }
    }

    maxSell(): number {
        return window.$gameParty.numItems(this._item);
    }

    money(): number {
        return this._goldWindow.value();
    }

    currencyUnit(): string {
        return this._goldWindow.currencyUnit();
    }

    buyingPrice(): number {
        return this._buyWindow.price(this._item);
    }

    sellingPrice(): number {
        return Math.floor(this._item.price / 2);
    }
}

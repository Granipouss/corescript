import { clamp } from '../rpg_core/extension';
import { Input } from '../rpg_core/Input';
import { TouchInput } from '../rpg_core/TouchInput';
import type { RPGArmor } from '../rpg_data/armor';
import type { RPGItem } from '../rpg_data/item';
import type { RPGWeapon } from '../rpg_data/weapon';
import { ImageManager } from '../rpg_managers/ImageManager';
import { SoundManager } from '../rpg_managers/SoundManager';
import { TextManager } from '../rpg_managers/TextManager';
import { Sprite_Button } from '../rpg_sprites/Sprite_Button';
import { Window_Selectable } from './Window_Selectable';

/**
 * The window for inputting quantity of items to buy or sell on the shop
 * screen.
 */
export class Window_ShopNumber extends Window_Selectable {
    protected _item: RPGItem | RPGArmor | RPGWeapon = null;
    protected _max = 1;
    protected _price = 0;
    protected _number = 1;
    protected _currencyUnit = TextManager.currencyUnit;

    protected _buttons: Sprite_Button[];

    initialize(x: number, y: number, _width: number, height: number): void {
        const width = this.windowWidth();
        super.initialize(x, y, width, height);
        this.createButtons();
    }

    windowWidth(): number {
        return 456;
    }

    number(): number {
        return this._number;
    }

    setup(item: RPGItem | RPGArmor | RPGWeapon, max: number, price: number): void {
        this._item = item;
        this._max = Math.floor(max);
        this._price = price;
        this._number = 1;
        this.placeButtons();
        this.updateButtonsVisiblity();
        this.refresh();
    }

    setCurrencyUnit(currencyUnit: string): void {
        this._currencyUnit = currencyUnit;
        this.refresh();
    }

    createButtons(): void {
        const bitmap = ImageManager.loadSystem('ButtonSet');
        const buttonWidth = 48;
        const buttonHeight = 48;
        this._buttons = [];
        for (let i = 0; i < 5; i++) {
            const button = new Sprite_Button();
            const x = buttonWidth * i;
            const w = buttonWidth * (i === 4 ? 2 : 1);
            button.bitmap = bitmap;
            button.setColdFrame(x, 0, w, buttonHeight);
            button.setHotFrame(x, buttonHeight, w, buttonHeight);
            button.visible = false;
            this._buttons.push(button);
            this.addChild(button);
        }
        this._buttons[0].setClickHandler(this.onButtonDown2.bind(this));
        this._buttons[1].setClickHandler(this.onButtonDown.bind(this));
        this._buttons[2].setClickHandler(this.onButtonUp.bind(this));
        this._buttons[3].setClickHandler(this.onButtonUp2.bind(this));
        this._buttons[4].setClickHandler(this.onButtonOk.bind(this));
    }

    placeButtons(): void {
        const numButtons = this._buttons.length;
        const spacing = 16;
        let totalWidth = -spacing;
        for (let i = 0; i < numButtons; i++) {
            totalWidth += this._buttons[i].width + spacing;
        }
        let x = (this.width - totalWidth) / 2;
        for (let j = 0; j < numButtons; j++) {
            const button = this._buttons[j];
            button.x = x;
            button.y = this.buttonY();
            x += button.width + spacing;
        }
    }

    updateButtonsVisiblity(): void {
        if (TouchInput.date > Input.date) {
            this.showButtons();
        } else {
            this.hideButtons();
        }
    }

    showButtons(): void {
        for (let i = 0; i < this._buttons.length; i++) {
            this._buttons[i].visible = true;
        }
    }

    hideButtons(): void {
        for (let i = 0; i < this._buttons.length; i++) {
            this._buttons[i].visible = false;
        }
    }

    refresh(): void {
        this.contents.clear();
        this.drawItemName(this._item, 0, this.itemY());
        this.drawMultiplicationSign();
        this.drawNumber();
        this.drawTotalPrice();
    }

    drawMultiplicationSign(): void {
        const sign = '\u00d7';
        const width = this.textWidth(sign);
        const x = this.cursorX() - width * 2;
        const y = this.itemY();
        this.resetTextColor();
        this.drawText(sign, x, y, width);
    }

    drawNumber(): void {
        const x = this.cursorX();
        const y = this.itemY();
        const width = this.cursorWidth() - this.textPadding();
        this.resetTextColor();
        this.drawText(this._number.toFixed(), x, y, width, 'right');
    }

    drawTotalPrice(): void {
        const total = this._price * this._number;
        const width = this.contentsWidth() - this.textPadding();
        this.drawCurrencyValue(total, this._currencyUnit, 0, this.priceY(), width);
    }

    itemY(): number {
        return Math.round(this.contentsHeight() / 2 - this.lineHeight() * 1.5);
    }

    priceY(): number {
        return Math.round(this.contentsHeight() / 2 + this.lineHeight() / 2);
    }

    buttonY(): number {
        return Math.round(this.priceY() + this.lineHeight() * 2.5);
    }

    cursorWidth(): number {
        const digitWidth = this.textWidth('0');
        return this.maxDigits() * digitWidth + this.textPadding() * 2;
    }

    cursorX(): number {
        return this.contentsWidth() - this.cursorWidth() - this.textPadding();
    }

    maxDigits(): number {
        return 2;
    }

    update(): void {
        super.update();
        this.processNumberChange();
    }

    isOkTriggered(): boolean {
        return Input.isTriggered('ok');
    }

    playOkSound(): void {
        // ...
    }

    processNumberChange(): void {
        if (this.isOpenAndActive()) {
            if (Input.isRepeated('right')) {
                this.changeNumber(1);
            }
            if (Input.isRepeated('left')) {
                this.changeNumber(-1);
            }
            if (Input.isRepeated('up')) {
                this.changeNumber(10);
            }
            if (Input.isRepeated('down')) {
                this.changeNumber(-10);
            }
        }
    }

    changeNumber(amount: number): void {
        const lastNumber = this._number;
        this._number = clamp(this._number + amount, [1, this._max]);
        if (this._number !== lastNumber) {
            SoundManager.playCursor();
            this.refresh();
        }
    }

    updateCursor(): void {
        this.setCursorRect(this.cursorX(), this.itemY(), this.cursorWidth(), this.lineHeight());
    }

    onButtonUp(): void {
        this.changeNumber(1);
    }

    onButtonUp2(): void {
        this.changeNumber(10);
    }

    onButtonDown(): void {
        this.changeNumber(-1);
    }

    onButtonDown2(): void {
        this.changeNumber(-10);
    }

    onButtonOk(): void {
        this.processOk();
    }
}

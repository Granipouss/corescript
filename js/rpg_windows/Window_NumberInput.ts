import { clamp } from '../rpg_core/extension';
import { Graphics } from '../rpg_core/Graphics';
import { Input } from '../rpg_core/Input';
import { TouchInput } from '../rpg_core/TouchInput';
import { ImageManager } from '../rpg_managers/ImageManager';
import { SoundManager } from '../rpg_managers/SoundManager';
import { Sprite_Button } from '../rpg_sprites/Sprite_Button';
import { Window_Message } from './Window_Message';
import { Window_Selectable } from './Window_Selectable';

/**
 * The window used for the event command [Input Number].
 */
export class Window_NumberInput extends Window_Selectable {
    protected _messageWindow: Window_Message;

    protected _number: number;
    protected _maxDigits: number;

    protected _buttons: Sprite_Button[];

    initialize(messageWindow) {
        this._messageWindow = messageWindow;
        super.initialize(0, 0, 0, 0);
        this._number = 0;
        this._maxDigits = 1;
        this.openness = 0;
        this.createButtons();
        this.deactivate();
    }

    start(): void {
        this._maxDigits = window.$gameMessage.numInputMaxDigits();
        this._number = window.$gameVariables.value(window.$gameMessage.numInputVariableId());
        this._number = clamp(this._number, [0, Math.pow(10, this._maxDigits) - 1]);
        this.updatePlacement();
        this.placeButtons();
        this.updateButtonsVisiblity();
        this.createContents();
        this.refresh();
        this.open();
        this.activate();
        this.select(0);
    }

    updatePlacement(): void {
        const messageY = this._messageWindow.y;
        const spacing = 8;
        this.width = this.windowWidth();
        this.height = this.windowHeight();
        this.x = (Graphics.boxWidth - this.width) / 2;
        if (messageY >= Graphics.boxHeight / 2) {
            this.y = messageY - this.height - spacing;
        } else {
            this.y = messageY + this._messageWindow.height + spacing;
        }
    }

    windowWidth(): number {
        return this.maxCols() * this.itemWidth() + this.padding * 2;
    }

    windowHeight(): number {
        return this.fittingHeight(1);
    }

    maxCols(): number {
        return this._maxDigits;
    }

    maxItems(): number {
        return this._maxDigits;
    }

    spacing(): number {
        return 0;
    }

    itemWidth(): number {
        return 32;
    }

    createButtons(): void {
        const bitmap = ImageManager.loadSystem('ButtonSet');
        const buttonWidth = 48;
        const buttonHeight = 48;
        this._buttons = [];
        for (let i = 0; i < 3; i++) {
            const button = new Sprite_Button();
            const x = buttonWidth * [1, 2, 4][i];
            const w = buttonWidth * (i === 2 ? 2 : 1);
            button.bitmap = bitmap;
            button.setColdFrame(x, 0, w, buttonHeight);
            button.setHotFrame(x, buttonHeight, w, buttonHeight);
            button.visible = false;
            this._buttons.push(button);
            this.addChild(button);
        }
        this._buttons[0].setClickHandler(this.onButtonDown.bind(this));
        this._buttons[1].setClickHandler(this.onButtonUp.bind(this));
        this._buttons[2].setClickHandler(this.onButtonOk.bind(this));
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

    buttonY(): number {
        const spacing = 8;
        if (this._messageWindow.y >= Graphics.boxHeight / 2) {
            return 0 - this._buttons[0].height - spacing;
        } else {
            return this.height + spacing;
        }
    }

    update(): void {
        super.update();
        this.processDigitChange();
    }

    processDigitChange(): void {
        if (this.isOpenAndActive()) {
            if (Input.isRepeated('up')) {
                this.changeDigit(true);
            } else if (Input.isRepeated('down')) {
                this.changeDigit(false);
            }
        }
    }

    changeDigit(up = false): void {
        const index = this.index();
        const place = Math.pow(10, this._maxDigits - 1 - index);
        let n = Math.floor(this._number / place) % 10;
        this._number -= n * place;
        if (up) {
            n = (n + 1) % 10;
        } else {
            n = (n + 9) % 10;
        }
        this._number += n * place;
        this.refresh();
        SoundManager.playCursor();
    }

    isTouchOkEnabled(): boolean {
        return false;
    }

    isOkEnabled(): boolean {
        return true;
    }

    isCancelEnabled(): boolean {
        return false;
    }

    isOkTriggered(): boolean {
        return Input.isTriggered('ok');
    }

    processOk(): void {
        SoundManager.playOk();
        window.$gameVariables.setValue(window.$gameMessage.numInputVariableId(), this._number);
        this._messageWindow.terminateMessage();
        this.updateInputData();
        this.deactivate();
        this.close();
    }

    drawItem(index: number): void {
        const rect = this.itemRect(index);
        const align = 'center';
        const s = this._number.toString().padStart(this._maxDigits, '0');
        const c = s.slice(index, index + 1);
        this.resetTextColor();
        this.drawText(c, rect.x, rect.y, rect.width, align);
    }

    onButtonUp(): void {
        this.changeDigit(true);
    }

    onButtonDown(): void {
        this.changeDigit(false);
    }

    onButtonOk(): void {
        this.processOk();
        this.hideButtons();
    }
}

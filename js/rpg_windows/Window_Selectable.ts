import * as PIXI from 'pixi.js';

import { clamp } from '../rpg_core/extension';
import { Input } from '../rpg_core/Input';
import { TouchInput } from '../rpg_core/TouchInput';
import { SoundManager } from '../rpg_managers/SoundManager';
import { Window_Base } from './Window_Base';
import { Window_Help } from './Window_Help';

/**
 * The window class with cursor movement and scroll functions.
 * @abstract
 */
export class Window_Selectable extends Window_Base {
    protected _index: number;
    protected _cursorFixed: boolean;
    protected _cursorAll: boolean;
    protected _stayCount: number;
    protected _helpWindow: Window_Help;
    protected _handlers: Record<string, () => void>;
    protected _touching: boolean;
    protected _scrollX: number;
    protected _scrollY: number;

    initialize(x: number, y: number, width: number, height: number) {
        super.initialize(x, y, width, height);
        this._index = -1;
        this._cursorFixed = false;
        this._cursorAll = false;
        this._stayCount = 0;
        this._helpWindow = null;
        this._handlers = {};
        this._touching = false;
        this._scrollX = 0;
        this._scrollY = 0;
        this.deactivate();
    }

    index(): number {
        return this._index;
    }

    cursorFixed(): boolean {
        return this._cursorFixed;
    }

    setCursorFixed(cursorFixed: boolean): void {
        this._cursorFixed = cursorFixed;
    }

    cursorAll(): boolean {
        return this._cursorAll;
    }

    setCursorAll(cursorAll: boolean): void {
        this._cursorAll = cursorAll;
    }

    maxCols(): number {
        return 1;
    }

    maxItems(): number {
        return 0;
    }

    spacing(): number {
        return 12;
    }

    itemWidth(): number {
        return Math.floor((this.width - this.padding * 2 + this.spacing()) / this.maxCols() - this.spacing());
    }

    itemHeight(): number {
        return this.lineHeight();
    }

    maxRows(): number {
        return Math.max(Math.ceil(this.maxItems() / this.maxCols()), 1);
    }

    activate(): void {
        super.activate();
        this.reselect();
    }

    deactivate(): void {
        super.deactivate();
        this.reselect();
    }

    select(index: number): void {
        this._index = index;
        this._stayCount = 0;
        this.ensureCursorVisible();
        this.updateCursor();
        this.callUpdateHelp();
    }

    deselect(): void {
        this.select(-1);
    }

    reselect(): void {
        this.select(this._index);
    }

    row(): number {
        return Math.floor(this.index() / this.maxCols());
    }

    topRow(): number {
        return Math.floor(this._scrollY / this.itemHeight());
    }

    maxTopRow(): number {
        return Math.max(0, this.maxRows() - this.maxPageRows());
    }

    setTopRow(row: number): void {
        const scrollY = clamp(row, [0, this.maxTopRow()]) * this.itemHeight();
        if (this._scrollY !== scrollY) {
            this._scrollY = scrollY;
            this.refresh();
            this.updateCursor();
        }
    }

    resetScroll(): void {
        this.setTopRow(0);
    }

    maxPageRows(): number {
        const pageHeight = this.height - this.padding * 2;
        return Math.floor(pageHeight / this.itemHeight());
    }

    maxPageItems(): number {
        return this.maxPageRows() * this.maxCols();
    }

    isHorizontal(): boolean {
        return this.maxPageRows() === 1;
    }

    bottomRow(): number {
        return Math.max(0, this.topRow() + this.maxPageRows() - 1);
    }

    setBottomRow(row: number): void {
        this.setTopRow(row - (this.maxPageRows() - 1));
    }

    topIndex(): number {
        return this.topRow() * this.maxCols();
    }

    itemRect(index: number): PIXI.Rectangle {
        const rect = new PIXI.Rectangle();
        const maxCols = this.maxCols();
        rect.width = this.itemWidth();
        rect.height = this.itemHeight();
        rect.x = (index % maxCols) * (rect.width + this.spacing()) - this._scrollX;
        rect.y = Math.floor(index / maxCols) * rect.height - this._scrollY;
        return rect;
    }

    itemRectForText(index: number): PIXI.Rectangle {
        const rect = this.itemRect(index);
        rect.x += this.textPadding();
        rect.width -= this.textPadding() * 2;
        return rect;
    }

    setHelpWindow(helpWindow: Window_Help): void {
        this._helpWindow = helpWindow;
        this.callUpdateHelp();
    }

    showHelpWindow(): void {
        if (this._helpWindow) {
            this._helpWindow.show();
        }
    }

    hideHelpWindow(): void {
        if (this._helpWindow) {
            this._helpWindow.hide();
        }
    }

    setHandler(symbol: string, method: () => void): void {
        this._handlers[symbol] = method;
    }

    isHandled(symbol: string): boolean {
        return !!this._handlers[symbol];
    }

    callHandler(symbol: string): void {
        if (this.isHandled(symbol)) {
            this._handlers[symbol]();
        }
    }

    isOpenAndActive(): boolean {
        return this.isOpen() && this.active;
    }

    isCursorMovable(): boolean {
        return this.isOpenAndActive() && !this._cursorFixed && !this._cursorAll && this.maxItems() > 0;
    }

    cursorDown(wrap = false): void {
        const index = this.index();
        const maxItems = this.maxItems();
        const maxCols = this.maxCols();
        if (index < maxItems - maxCols || (wrap && maxCols === 1)) {
            this.select((index + maxCols) % maxItems);
        }
    }

    cursorUp(wrap = false): void {
        const index = this.index();
        const maxItems = this.maxItems();
        const maxCols = this.maxCols();
        if (index >= maxCols || (wrap && maxCols === 1)) {
            this.select((index - maxCols + maxItems) % maxItems);
        }
    }

    cursorRight(wrap = false): void {
        const index = this.index();
        const maxItems = this.maxItems();
        const maxCols = this.maxCols();
        if (maxCols >= 2 && (index < maxItems - 1 || (wrap && this.isHorizontal()))) {
            this.select((index + 1) % maxItems);
        }
    }

    cursorLeft(wrap = false): void {
        const index = this.index();
        const maxItems = this.maxItems();
        const maxCols = this.maxCols();
        if (maxCols >= 2 && (index > 0 || (wrap && this.isHorizontal()))) {
            this.select((index - 1 + maxItems) % maxItems);
        }
    }

    cursorPagedown(): void {
        const index = this.index();
        const maxItems = this.maxItems();
        if (this.topRow() + this.maxPageRows() < this.maxRows()) {
            this.setTopRow(this.topRow() + this.maxPageRows());
            this.select(Math.min(index + this.maxPageItems(), maxItems - 1));
        }
    }

    cursorPageup(): void {
        const index = this.index();
        if (this.topRow() > 0) {
            this.setTopRow(this.topRow() - this.maxPageRows());
            this.select(Math.max(index - this.maxPageItems(), 0));
        }
    }

    scrollDown(): void {
        if (this.topRow() + 1 < this.maxRows()) {
            this.setTopRow(this.topRow() + 1);
        }
    }

    scrollUp(): void {
        if (this.topRow() > 0) {
            this.setTopRow(this.topRow() - 1);
        }
    }

    update(): void {
        super.update();
        this.updateArrows();
        this.processCursorMove();
        this.processHandling();
        this.processWheel();
        this.processTouch();
        this._stayCount++;
    }

    updateArrows(): void {
        const topRow = this.topRow();
        const maxTopRow = this.maxTopRow();
        this.downArrowVisible = maxTopRow > 0 && topRow < maxTopRow;
        this.upArrowVisible = topRow > 0;
    }

    processCursorMove(): void {
        if (this.isCursorMovable()) {
            const lastIndex = this.index();
            if (Input.isRepeated('down')) {
                this.cursorDown(Input.isTriggered('down'));
            }
            if (Input.isRepeated('up')) {
                this.cursorUp(Input.isTriggered('up'));
            }
            if (Input.isRepeated('right')) {
                this.cursorRight(Input.isTriggered('right'));
            }
            if (Input.isRepeated('left')) {
                this.cursorLeft(Input.isTriggered('left'));
            }
            if (!this.isHandled('pagedown') && Input.isTriggered('pagedown')) {
                this.cursorPagedown();
            }
            if (!this.isHandled('pageup') && Input.isTriggered('pageup')) {
                this.cursorPageup();
            }
            if (this.index() !== lastIndex) {
                SoundManager.playCursor();
            }
        }
    }

    processHandling(): void {
        if (this.isOpenAndActive()) {
            if (this.isOkEnabled() && this.isOkTriggered()) {
                this.processOk();
            } else if (this.isCancelEnabled() && this.isCancelTriggered()) {
                this.processCancel();
            } else if (this.isHandled('pagedown') && Input.isTriggered('pagedown')) {
                this.processPagedown();
            } else if (this.isHandled('pageup') && Input.isTriggered('pageup')) {
                this.processPageup();
            }
        }
    }

    processWheel(): void {
        if (this.isOpenAndActive()) {
            const threshold = 20;
            if (TouchInput.wheelY >= threshold) {
                this.scrollDown();
            }
            if (TouchInput.wheelY <= -threshold) {
                this.scrollUp();
            }
        }
    }

    processTouch(): void {
        if (this.isOpenAndActive()) {
            if (TouchInput.isTriggered() && this.isTouchedInsideFrame()) {
                this._touching = true;
                this.onTouch(true);
            } else if (TouchInput.isCancelled()) {
                if (this.isCancelEnabled()) {
                    this.processCancel();
                }
            }
            if (this._touching) {
                if (TouchInput.isPressed()) {
                    this.onTouch(false);
                } else {
                    this._touching = false;
                }
            }
        } else {
            this._touching = false;
        }
    }

    isTouchedInsideFrame(): boolean {
        const x = this.canvasToLocalX(TouchInput.x);
        const y = this.canvasToLocalY(TouchInput.y);
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }

    onTouch(triggered = false): void {
        const lastIndex = this.index();
        const x = this.canvasToLocalX(TouchInput.x);
        const y = this.canvasToLocalY(TouchInput.y);
        const hitIndex = this.hitTest(x, y);
        if (hitIndex >= 0) {
            if (hitIndex === this.index()) {
                if (triggered && this.isTouchOkEnabled()) {
                    this.processOk();
                }
            } else if (this.isCursorMovable()) {
                this.select(hitIndex);
            }
        } else if (this._stayCount >= 10) {
            if (y < this.padding) {
                this.cursorUp();
            } else if (y >= this.height - this.padding) {
                this.cursorDown();
            }
        }
        if (this.index() !== lastIndex) {
            SoundManager.playCursor();
        }
    }

    hitTest(x: number, y: number): number {
        if (this.isContentsArea(x, y)) {
            const cx = x - this.padding;
            const cy = y - this.padding;
            const topIndex = this.topIndex();
            for (let i = 0; i < this.maxPageItems(); i++) {
                const index = topIndex + i;
                if (index < this.maxItems()) {
                    const rect = this.itemRect(index);
                    const right = rect.x + rect.width;
                    const bottom = rect.y + rect.height;
                    if (cx >= rect.x && cy >= rect.y && cx < right && cy < bottom) {
                        return index;
                    }
                }
            }
        }
        return -1;
    }

    isContentsArea(x: number, y: number): boolean {
        const left = this.padding;
        const top = this.padding;
        const right = this.width - this.padding;
        const bottom = this.height - this.padding;
        return x >= left && y >= top && x < right && y < bottom;
    }

    isTouchOkEnabled(): boolean {
        return this.isOkEnabled();
    }

    isOkEnabled(): boolean {
        return this.isHandled('ok');
    }

    isCancelEnabled(): boolean {
        return this.isHandled('cancel');
    }

    isOkTriggered(): boolean {
        return Input.isRepeated('ok');
    }

    isCancelTriggered(): boolean {
        return Input.isRepeated('cancel');
    }

    processOk(): void {
        if (this.isCurrentItemEnabled()) {
            this.playOkSound();
            this.updateInputData();
            this.deactivate();
            this.callOkHandler();
        } else {
            this.playBuzzerSound();
        }
    }

    playOkSound(): void {
        SoundManager.playOk();
    }

    playBuzzerSound(): void {
        SoundManager.playBuzzer();
    }

    callOkHandler(): void {
        this.callHandler('ok');
    }

    processCancel(): void {
        SoundManager.playCancel();
        this.updateInputData();
        this.deactivate();
        this.callCancelHandler();
    }

    callCancelHandler(): void {
        this.callHandler('cancel');
    }

    processPageup(): void {
        SoundManager.playCursor();
        this.updateInputData();
        this.deactivate();
        this.callHandler('pageup');
    }

    processPagedown(): void {
        SoundManager.playCursor();
        this.updateInputData();
        this.deactivate();
        this.callHandler('pagedown');
    }

    updateInputData(): void {
        Input.update();
        TouchInput.update();
    }

    updateCursor(): void {
        if (this._cursorAll) {
            const allRowsHeight = this.maxRows() * this.itemHeight();
            this.setCursorRect(0, 0, this.contents.width, allRowsHeight);
            this.setTopRow(0);
        } else if (this.isCursorVisible()) {
            const rect = this.itemRect(this.index());
            this.setCursorRect(rect.x, rect.y, rect.width, rect.height);
        } else {
            this.setCursorRect(0, 0, 0, 0);
        }
    }

    isCursorVisible(): boolean {
        const row = this.row();
        return row >= this.topRow() && row <= this.bottomRow();
    }

    ensureCursorVisible(): void {
        const row = this.row();
        if (row < this.topRow()) {
            this.setTopRow(row);
        } else if (row > this.bottomRow()) {
            this.setBottomRow(row);
        }
    }

    callUpdateHelp(): void {
        if (this.active && this._helpWindow) {
            this.updateHelp();
        }
    }

    updateHelp(): void {
        this._helpWindow.clear();
    }

    setHelpWindowItem(item: { description: string }): void {
        if (this._helpWindow) {
            this._helpWindow.setItem(item);
        }
    }

    isCurrentItemEnabled(): boolean {
        return true;
    }

    drawAllItems(): void {
        const topIndex = this.topIndex();
        for (let i = 0; i < this.maxPageItems(); i++) {
            const index = topIndex + i;
            if (index < this.maxItems()) {
                this.drawItem(index);
            }
        }
    }

    drawItem(_index: number): void {
        // ...
    }

    clearItem(index: number): void {
        const rect = this.itemRect(index);
        this.contents.clearRect(rect.x, rect.y, rect.width, rect.height);
    }

    redrawItem(index: number): void {
        if (index >= 0) {
            this.clearItem(index);
            this.drawItem(index);
        }
    }

    redrawCurrentItem(): void {
        this.redrawItem(this.index());
    }

    refresh(): void {
        if (this.contents) {
            this.contents.clear();
            this.drawAllItems();
        }
    }
}

import { Window_Selectable } from './Window_Selectable';

export type Command = {
    name: string;
    symbol: string;
    enabled: boolean;
    ext: unknown;
};

/**
 * The superclass of windows for selecting a command.
 * @abstract
 */
export class Window_Command extends Window_Selectable {
    protected _list: Command[];

    initialize(x: number, y: number): void {
        this.clearCommandList();
        this.makeCommandList();
        const width = this.windowWidth();
        const height = this.windowHeight();
        super.initialize(x, y, width, height);
        this.refresh();
        this.select(0);
        this.activate();
    }

    windowWidth(): number {
        return 240;
    }

    windowHeight(): number {
        return this.fittingHeight(this.numVisibleRows());
    }

    numVisibleRows(): number {
        return Math.ceil(this.maxItems() / this.maxCols());
    }

    maxItems(): number {
        return this._list.length;
    }

    clearCommandList(): void {
        this._list = [];
    }

    makeCommandList(): void {
        // ...
    }

    addCommand(name: string, symbol: string, enabled = true, ext = null): void {
        this._list.push({ name, symbol, enabled, ext });
    }

    commandName(index: number): string {
        return this._list[index].name;
    }

    commandSymbol(index: number): string {
        return this._list[index].symbol;
    }

    isCommandEnabled(index: number): boolean {
        return this._list[index].enabled;
    }

    currentData(): Command {
        return this.index() >= 0 ? this._list[this.index()] : null;
    }

    isCurrentItemEnabled(): boolean {
        return this.currentData() ? this.currentData().enabled : false;
    }

    currentSymbol(): string {
        return this.currentData() ? this.currentData().symbol : null;
    }

    currentExt(): unknown {
        return this.currentData() ? this.currentData().ext : null;
    }

    findSymbol(symbol: string): number {
        for (let i = 0; i < this._list.length; i++) {
            if (this._list[i].symbol === symbol) {
                return i;
            }
        }
        return -1;
    }

    selectSymbol(symbol: string): void {
        const index = this.findSymbol(symbol);
        if (index >= 0) {
            this.select(index);
        } else {
            this.select(0);
        }
    }

    findExt(ext: unknown): number {
        for (let i = 0; i < this._list.length; i++) {
            if (this._list[i].ext === ext) {
                return i;
            }
        }
        return -1;
    }

    selectExt(ext: unknown): void {
        const index = this.findExt(ext);
        if (index >= 0) {
            this.select(index);
        } else {
            this.select(0);
        }
    }

    drawItem(index: number): void {
        const rect = this.itemRectForText(index);
        const align = this.itemTextAlign();
        this.resetTextColor();
        this.changePaintOpacity(this.isCommandEnabled(index));
        this.drawText(this.commandName(index), rect.x, rect.y, rect.width, align);
    }

    itemTextAlign(): CanvasTextAlign {
        return 'left';
    }

    isOkEnabled(): boolean {
        return true;
    }

    callOkHandler(): void {
        const symbol = this.currentSymbol();
        if (this.isHandled(symbol)) {
            this.callHandler(symbol);
        } else if (this.isHandled('ok')) {
            super.callOkHandler();
        } else {
            this.activate();
        }
    }

    refresh(): void {
        this.clearCommandList();
        this.makeCommandList();
        this.createContents();
        super.refresh();
    }
}

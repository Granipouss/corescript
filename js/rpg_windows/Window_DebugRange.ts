import { Graphics } from '../rpg_core/Graphics';
import { Input } from '../rpg_core/Input';
import { Window_DebugEdit } from './Window_DebugEdit';
import { Window_Selectable } from './Window_Selectable';

/**
 * The window for selecting a block of switches/variables on the debug screen.
 */
export class Window_DebugRange extends Window_Selectable {
    static lastTopRow = 0;
    static lastIndex = 0;

    protected _maxSwitches: number;
    protected _maxVariables: number;
    protected _editWindow: Window_DebugEdit;

    initialize(x, y) {
        this._maxSwitches = Math.ceil((window.$dataSystem.switches.length - 1) / 10);
        this._maxVariables = Math.ceil((window.$dataSystem.variables.length - 1) / 10);
        const width = this.windowWidth();
        const height = this.windowHeight();
        super.initialize(x, y, width, height);
        this.refresh();
        this.setTopRow(Window_DebugRange.lastTopRow);
        this.select(Window_DebugRange.lastIndex);
        this.activate();
    }

    windowWidth(): number {
        return 246;
    }

    windowHeight(): number {
        return Graphics.boxHeight;
    }

    maxItems(): number {
        return this._maxSwitches + this._maxVariables;
    }

    update(): void {
        super.update();
        if (this._editWindow) {
            this._editWindow.setMode(this.mode());
            this._editWindow.setTopId(this.topId());
        }
    }

    mode(): 'switch' | 'variable' {
        return this.index() < this._maxSwitches ? 'switch' : 'variable';
    }

    topId(): number {
        const index = this.index();
        if (index < this._maxSwitches) {
            return index * 10 + 1;
        } else {
            return (index - this._maxSwitches) * 10 + 1;
        }
    }

    refresh(): void {
        this.createContents();
        this.drawAllItems();
    }

    drawItem(index: number): void {
        const rect = this.itemRectForText(index);
        let start: number;
        let text: string;
        if (index < this._maxSwitches) {
            start = index * 10 + 1;
            text = 'S';
        } else {
            start = (index - this._maxSwitches) * 10 + 1;
            text = 'V';
        }
        const end = start + 9;
        text += ' [' + String(start).padStart(4, '0') + '-' + String(end).padStart(4, '0') + ']';
        this.drawText(text, rect.x, rect.y, rect.width);
    }

    isCancelTriggered(): boolean {
        return super.isCancelTriggered() || Input.isTriggered('debug');
    }

    processCancel(): void {
        super.processCancel();
        Window_DebugRange.lastTopRow = this.topRow();
        Window_DebugRange.lastIndex = this.index();
    }

    setEditWindow(editWindow: Window_DebugEdit): void {
        this._editWindow = editWindow;
    }
}

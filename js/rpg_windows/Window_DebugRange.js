import { Graphics } from '../rpg_core/Graphics';
import { Input } from '../rpg_core/Input';
import { Window_Selectable } from './Window_Selectable';

/**
 * The window for selecting a block of switches/variables on the debug screen.
 */
export class Window_DebugRange extends Window_Selectable {
    static lastTopRow = 0;
    static lastIndex = 0;

    initialize(x, y) {
        this._maxSwitches = Math.ceil((global.$dataSystem.switches.length - 1) / 10);
        this._maxVariables = Math.ceil((global.$dataSystem.variables.length - 1) / 10);
        var width = this.windowWidth();
        var height = this.windowHeight();
        super.initialize(x, y, width, height);
        this.refresh();
        this.setTopRow(Window_DebugRange.lastTopRow);
        this.select(Window_DebugRange.lastIndex);
        this.activate();
    }

    windowWidth() {
        return 246;
    }

    windowHeight() {
        return Graphics.boxHeight;
    }

    maxItems() {
        return this._maxSwitches + this._maxVariables;
    }

    update() {
        super.update();
        if (this._editWindow) {
            this._editWindow.setMode(this.mode());
            this._editWindow.setTopId(this.topId());
        }
    }

    mode() {
        return this.index() < this._maxSwitches ? 'switch' : 'variable';
    }

    topId() {
        var index = this.index();
        if (index < this._maxSwitches) {
            return index * 10 + 1;
        } else {
            return (index - this._maxSwitches) * 10 + 1;
        }
    }

    refresh() {
        this.createContents();
        this.drawAllItems();
    }

    drawItem(index) {
        var rect = this.itemRectForText(index);
        var start;
        var text;
        if (index < this._maxSwitches) {
            start = index * 10 + 1;
            text = 'S';
        } else {
            start = (index - this._maxSwitches) * 10 + 1;
            text = 'V';
        }
        var end = start + 9;
        text += ' [' + start.padZero(4) + '-' + end.padZero(4) + ']';
        this.drawText(text, rect.x, rect.y, rect.width);
    }

    isCancelTriggered() {
        return super.isCancelTriggered() || Input.isTriggered('debug');
    }

    processCancel() {
        super.processCancel();
        Window_DebugRange.lastTopRow = this.topRow();
        Window_DebugRange.lastIndex = this.index();
    }

    setEditWindow(editWindow) {
        this._editWindow = editWindow;
    }
}

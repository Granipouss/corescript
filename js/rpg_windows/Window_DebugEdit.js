import { Input } from '../rpg_core/Input';
import { SoundManager } from '../rpg_managers/SoundManager';
import { Window_Selectable } from './Window_Selectable';

/**
 * The window for displaying switches and variables on the debug screen.
 */
export class Window_DebugEdit extends Window_Selectable {
    initialize(x, y, width) {
        const height = this.fittingHeight(10);
        super.initialize(x, y, width, height);
        this._mode = 'switch';
        this._topId = 1;
        this.refresh();
    }

    maxItems() {
        return 10;
    }

    refresh() {
        this.contents.clear();
        this.drawAllItems();
    }

    drawItem(index) {
        const dataId = this._topId + index;
        const idText = dataId.padStart(4, '0') + ':';
        const idWidth = this.textWidth(idText);
        const statusWidth = this.textWidth('-00000000');
        const name = this.itemName(dataId);
        const status = this.itemStatus(dataId);
        const rect = this.itemRectForText(index);
        this.resetTextColor();
        this.drawText(idText, rect.x, rect.y, rect.width);
        rect.x += idWidth;
        rect.width -= idWidth + statusWidth;
        this.drawText(name, rect.x, rect.y, rect.width);
        this.drawText(status, rect.x + rect.width, rect.y, statusWidth, 'right');
    }

    itemName(dataId) {
        if (this._mode === 'switch') {
            return window.$dataSystem.switches[dataId];
        } else {
            return window.$dataSystem.variables[dataId];
        }
    }

    itemStatus(dataId) {
        if (this._mode === 'switch') {
            return window.$gameSwitches.value(dataId) ? '[ON]' : '[OFF]';
        } else {
            return String(window.$gameVariables.value(dataId));
        }
    }

    setMode(mode) {
        if (this._mode !== mode) {
            this._mode = mode;
            this.refresh();
        }
    }

    setTopId(id) {
        if (this._topId !== id) {
            this._topId = id;
            this.refresh();
        }
    }

    currentId() {
        return this._topId + this.index();
    }

    update() {
        super.update();
        if (this.active) {
            if (this._mode === 'switch') {
                this.updateSwitch();
            } else {
                this.updateVariable();
            }
        }
    }

    updateSwitch() {
        if (Input.isRepeated('ok')) {
            const switchId = this.currentId();
            SoundManager.playCursor();
            window.$gameSwitches.setValue(switchId, !window.$gameSwitches.value(switchId));
            this.redrawCurrentItem();
        }
    }

    updateVariable() {
        const variableId = this.currentId();
        let value = window.$gameVariables.value(variableId);
        if (typeof value === 'number') {
            if (Input.isRepeated('right')) {
                value++;
            }
            if (Input.isRepeated('left')) {
                value--;
            }
            if (Input.isRepeated('pagedown')) {
                value += 10;
            }
            if (Input.isRepeated('pageup')) {
                value -= 10;
            }
            if (window.$gameVariables.value(variableId) !== value) {
                window.$gameVariables.setValue(variableId, value);
                SoundManager.playCursor();
                this.redrawCurrentItem();
            }
        }
    }
}

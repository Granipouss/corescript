import { Graphics } from '../rpg_core/Graphics';
import { Window_Base } from './Window_Base';

/**
 * The window for displaying the description of the selected item.
 */
export class Window_Help extends Window_Base {
    initialize(numLines) {
        const width = Graphics.boxWidth;
        const height = this.fittingHeight(numLines || 2);
        super.initialize(0, 0, width, height);
        this._text = '';
    }

    setText(text) {
        if (this._text !== text) {
            this._text = text;
            this.refresh();
        }
    }

    clear() {
        this.setText('');
    }

    setItem(item) {
        this.setText(item ? item.description : '');
    }

    refresh() {
        this.contents.clear();
        this.drawTextEx(this._text, this.textPadding(), 0);
    }
}

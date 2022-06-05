import { Graphics } from '../rpg_core/Graphics';
import { Window_Base } from './Window_Base';

/**
 * The window for displaying the description of the selected item.
 */
export class Window_Help extends Window_Base {
    protected _text = '';
    protected _numLines: number;

    constructor(numLines = 2) {
        super();
        this._numLines = numLines;
    }

    initialize(): void {
        const width = Graphics.boxWidth;
        const height = this.fittingHeight(this._numLines);
        super.initialize(0, 0, width, height);
    }

    setText(text: string): void {
        if (this._text !== text) {
            this._text = text;
            this.refresh();
        }
    }

    clear(): void {
        this.setText('');
    }

    setItem(item: { description: string }): void {
        this.setText(item ? item.description : '');
    }

    refresh(): void {
        this.contents.clear();
        this.drawTextEx(this._text, this.textPadding(), 0);
    }
}

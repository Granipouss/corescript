import { Graphics } from '../rpg_core/Graphics';
import { Input } from '../rpg_core/Input';
import { TouchInput } from '../rpg_core/TouchInput';
import type { TextState } from './Window_Base';
import { Window_Base } from './Window_Base';

/**
 * The window for displaying scrolling text. No frame is displayed, but it
 * is handled as a window for convenience.
 */
export class Window_ScrollText extends Window_Base {
    protected _text = '';
    protected _allTextHeight = 0;

    initialize(): void {
        const width = Graphics.boxWidth;
        const height = Graphics.boxHeight;
        super.initialize(0, 0, width, height);
        this.opacity = 0;
        this.hide();
    }

    update(): void {
        super.update();
        if (window.$gameMessage.scrollMode()) {
            if (this._text) {
                this.updateMessage();
            }
            if (!this._text && window.$gameMessage.hasText()) {
                this.startMessage();
            }
        }
    }

    startMessage(): void {
        this._text = window.$gameMessage.allText();
        this.refresh();
        this.show();
    }

    refresh(): void {
        const textState: TextState = { index: 0 };
        textState.text = this.convertEscapeCharacters(this._text);
        this.resetFontSettings();
        this._allTextHeight = this.calcTextHeight(textState, true);
        this.createContents();
        this.origin.y = -this.height;
        this.drawTextEx(this._text, this.textPadding(), 1);
    }

    contentsHeight(): number {
        return Math.max(this._allTextHeight, 1);
    }

    updateMessage(): void {
        this.origin.y += this.scrollSpeed();
        if (this.origin.y >= this.contents.height) {
            this.terminateMessage();
        }
    }

    scrollSpeed(): number {
        let speed = window.$gameMessage.scrollSpeed() / 2;
        if (this.isFastForward()) {
            speed *= this.fastForwardRate();
        }
        return speed;
    }

    isFastForward(): boolean {
        if (window.$gameMessage.scrollNoFast()) {
            return false;
        } else {
            return Input.isPressed('ok') || Input.isPressed('shift') || TouchInput.isPressed();
        }
    }

    fastForwardRate(): number {
        return 3;
    }

    terminateMessage(): void {
        this._text = null;
        window.$gameMessage.clear();
        this.hide();
    }
}

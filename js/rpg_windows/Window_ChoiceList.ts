import { Graphics } from '../rpg_core/Graphics';
import { Input } from '../rpg_core/Input';
import { Window_Command } from './Window_Command';
import { Window_Message } from './Window_Message';

/**
 * The window used for the event command [Show Choices].
 */
export class Window_ChoiceList extends Window_Command {
    protected _messageWindow: Window_Message;
    protected _background: number;

    initialize(messageWindow) {
        this._messageWindow = messageWindow;
        super.initialize(0, 0);
        this.openness = 0;
        this.deactivate();
        this._background = 0;
    }

    start(): void {
        this.updatePlacement();
        this.updateBackground();
        this.refresh();
        this.selectDefault();
        this.open();
        this.activate();
    }

    selectDefault(): void {
        this.select(window.$gameMessage.choiceDefaultType());
    }

    updatePlacement(): void {
        const positionType = window.$gameMessage.choicePositionType();
        const messageY = this._messageWindow.y;
        this.width = this.windowWidth();
        this.height = this.windowHeight();
        switch (positionType) {
            case 0:
                this.x = 0;
                break;
            case 1:
                this.x = (Graphics.boxWidth - this.width) / 2;
                break;
            case 2:
                this.x = Graphics.boxWidth - this.width;
                break;
        }
        if (messageY >= Graphics.boxHeight / 2) {
            this.y = messageY - this.height;
        } else {
            this.y = messageY + this._messageWindow.height;
        }
    }

    updateBackground(): void {
        this._background = window.$gameMessage.choiceBackground();
        this.setBackgroundType(this._background);
    }

    windowWidth(): number {
        const width = this.maxChoiceWidth() + this.padding * 2;
        return Math.min(width, Graphics.boxWidth);
    }

    numVisibleRows(): number {
        const messageY = this._messageWindow.y;
        const messageHeight = this._messageWindow.height;
        const centerY = Graphics.boxHeight / 2;
        const choices = window.$gameMessage.choices();
        let numLines = choices.length;
        let maxLines = 8;
        if (messageY < centerY && messageY + messageHeight > centerY) {
            maxLines = 4;
        }
        if (numLines > maxLines) {
            numLines = maxLines;
        }
        return numLines;
    }

    maxChoiceWidth(): number {
        let maxWidth = 96;
        const choices = window.$gameMessage.choices();
        for (let i = 0; i < choices.length; i++) {
            const choiceWidth = this.textWidthEx(choices[i]) + this.textPadding() * 2;
            if (maxWidth < choiceWidth) {
                maxWidth = choiceWidth;
            }
        }
        return maxWidth;
    }

    textWidthEx(text: string): number {
        return this.drawTextEx(text, 0, this.contents.height);
    }

    contentsHeight(): number {
        return this.maxItems() * this.itemHeight();
    }

    makeCommandList(): void {
        const choices = window.$gameMessage.choices();
        for (let i = 0; i < choices.length; i++) {
            this.addCommand(choices[i], 'choice');
        }
    }

    drawItem(index: number): void {
        const rect = this.itemRectForText(index);
        this.drawTextEx(this.commandName(index), rect.x, rect.y);
    }

    isCancelEnabled(): boolean {
        return window.$gameMessage.choiceCancelType() !== -1;
    }

    isOkTriggered(): boolean {
        return Input.isTriggered('ok');
    }

    callOkHandler(): void {
        window.$gameMessage.onChoice(this.index());
        this._messageWindow.terminateMessage();
        this.close();
    }

    callCancelHandler(): void {
        window.$gameMessage.onChoice(window.$gameMessage.choiceCancelType());
        this._messageWindow.terminateMessage();
        this.close();
    }
}

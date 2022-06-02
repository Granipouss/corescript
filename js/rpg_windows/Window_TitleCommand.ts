import { Graphics } from '../rpg_core/Graphics';
import { DataManager } from '../rpg_managers/DataManager';
import { TextManager } from '../rpg_managers/TextManager';
import { Window_Command } from './Window_Command';

/**
 * The window for selecting New Game/Continue on the title screen.
 */
export class Window_TitleCommand extends Window_Command {
    initialize(): void {
        super.initialize(0, 0);
        this.updatePlacement();
        this.openness = 0;
        this.selectLast();
    }

    static _lastCommandSymbol: string = null;

    static initCommandPosition() {
        this._lastCommandSymbol = null;
    }

    windowWidth(): number {
        return 240;
    }

    updatePlacement(): void {
        this.x = (Graphics.boxWidth - this.width) / 2;
        this.y = Graphics.boxHeight - this.height - 96;
    }

    makeCommandList(): void {
        this.addCommand(TextManager.newGame, 'newGame');
        this.addCommand(TextManager.continue_, 'continue', this.isContinueEnabled());
        this.addCommand(TextManager.options, 'options');
    }

    isContinueEnabled(): boolean {
        return DataManager.isAnySavefileExists();
    }

    processOk(): void {
        Window_TitleCommand._lastCommandSymbol = this.currentSymbol();
        super.processOk();
    }

    selectLast(): void {
        if (Window_TitleCommand._lastCommandSymbol) {
            this.selectSymbol(Window_TitleCommand._lastCommandSymbol);
        } else if (this.isContinueEnabled()) {
            this.selectSymbol('continue');
        }
    }
}

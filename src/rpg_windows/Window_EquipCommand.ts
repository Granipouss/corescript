import { TextManager } from '../rpg_managers/TextManager';
import { Window_HorzCommand } from './Window_HorzCommand';

/**
 * The window for selecting a command on the equipment screen.
 */
export class Window_EquipCommand extends Window_HorzCommand {
    protected _windowWidth: number;

    constructor(x: number, y: number, width: number) {
        super(x, y);
        this._windowWidth = width;
    }

    windowWidth(): number {
        return this._windowWidth;
    }

    maxCols(): number {
        return 3;
    }

    makeCommandList(): void {
        this.addCommand(TextManager.equip2, 'equip');
        this.addCommand(TextManager.optimize, 'optimize');
        this.addCommand(TextManager.clear, 'clear');
    }
}

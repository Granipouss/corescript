import { TextManager } from '../rpg_managers/TextManager';
import { Window_HorzCommand } from './Window_HorzCommand';

/**
 * The window for selecting buy/sell on the shop screen.
 */
export class Window_ShopCommand extends Window_HorzCommand {
    protected _windowWidth: number;
    protected _purchaseOnly: boolean;

    constructor(width: number, purchaseOnly = false) {
        super();

        this._windowWidth = width;
        this._purchaseOnly = purchaseOnly;
    }

    initialize() {
        super.initialize(0, 0);
    }

    windowWidth(): number {
        return this._windowWidth;
    }

    maxCols(): number {
        return 3;
    }

    makeCommandList(): void {
        this.addCommand(TextManager.buy, 'buy');
        this.addCommand(TextManager.sell, 'sell', !this._purchaseOnly);
        this.addCommand(TextManager.cancel, 'cancel');
    }
}

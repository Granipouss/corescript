import { TextManager } from '../rpg_managers/TextManager';
import { Window_Base } from './Window_Base';

/**
 * The window for displaying the party's gold.
 */
export class Window_Gold extends Window_Base {
    initialize(x: number, y: number): void {
        const width = this.windowWidth();
        const height = this.windowHeight();
        super.initialize(x, y, width, height);
        this.refresh();
    }

    windowWidth(): number {
        return 240;
    }

    windowHeight(): number {
        return this.fittingHeight(1);
    }

    refresh(): void {
        const x = this.textPadding();
        const width = this.contents.width - this.textPadding() * 2;
        this.contents.clear();
        this.drawCurrencyValue(this.value(), this.currencyUnit(), x, 0, width);
    }

    value(): number {
        return window.$gameParty.gold();
    }

    currencyUnit(): string {
        return TextManager.currencyUnit;
    }

    open(): void {
        this.refresh();
        super.open();
    }
}

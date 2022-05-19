import { TextManager } from '../rpg_managers/TextManager';
import { Window_Base } from './Window_Base';

/**
 * The window for displaying the party's gold.
 */
export class Window_Gold extends Window_Base {
    initialize(x, y) {
        const width = this.windowWidth();
        const height = this.windowHeight();
        super.initialize(x, y, width, height);
        this.refresh();
    }

    windowWidth() {
        return 240;
    }

    windowHeight() {
        return this.fittingHeight(1);
    }

    refresh() {
        const x = this.textPadding();
        const width = this.contents.width - this.textPadding() * 2;
        this.contents.clear();
        this.drawCurrencyValue(this.value(), this.currencyUnit(), x, 0, width);
    }

    value() {
        return global.$gameParty.gold();
    }

    currencyUnit() {
        return TextManager.currencyUnit;
    }

    open() {
        this.refresh();
        super.open();
    }
}

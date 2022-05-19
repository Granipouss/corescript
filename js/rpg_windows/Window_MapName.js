import { Window_Base } from './Window_Base';

/**
 * The window for displaying the map name on the map screen.
 */
export class Window_MapName extends Window_Base {
    initialize() {
        const wight = this.windowWidth();
        const height = this.windowHeight();
        super.initialize(0, 0, wight, height);
        this.opacity = 0;
        this.contentsOpacity = 0;
        this._showCount = 0;
        this.refresh();
    }

    windowWidth() {
        return 360;
    }

    windowHeight() {
        return this.fittingHeight(1);
    }

    update() {
        super.update();
        if (this._showCount > 0 && global.$gameMap.isNameDisplayEnabled()) {
            this.updateFadeIn();
            this._showCount--;
        } else {
            this.updateFadeOut();
        }
    }

    updateFadeIn() {
        this.contentsOpacity += 16;
    }

    updateFadeOut() {
        this.contentsOpacity -= 16;
    }

    open() {
        this.refresh();
        this._showCount = 150;
    }

    close() {
        this._showCount = 0;
    }

    refresh() {
        this.contents.clear();
        if (global.$gameMap.displayName()) {
            const width = this.contentsWidth();
            this.drawBackground(0, 0, width, this.lineHeight());
            this.drawText(global.$gameMap.displayName(), 0, 0, width, 'center');
        }
    }

    drawBackground(x, y, width, height) {
        const color1 = this.dimColor1();
        const color2 = this.dimColor2();
        this.contents.gradientFillRect(x, y, width / 2, height, color2, color1);
        this.contents.gradientFillRect(x + width / 2, y, width / 2, height, color1, color2);
    }
}

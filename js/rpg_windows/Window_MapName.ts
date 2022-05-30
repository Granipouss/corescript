import { Window_Base } from './Window_Base';

/**
 * The window for displaying the map name on the map screen.
 */
export class Window_MapName extends Window_Base {
    protected _showCount: number;

    initialize() {
        const wight = this.windowWidth();
        const height = this.windowHeight();
        super.initialize(0, 0, wight, height);
        this.opacity = 0;
        this.contentsOpacity = 0;
        this._showCount = 0;
        this.refresh();
    }

    windowWidth(): number {
        return 360;
    }

    windowHeight(): number {
        return this.fittingHeight(1);
    }

    update(): void {
        super.update();
        if (this._showCount > 0 && window.$gameMap.isNameDisplayEnabled()) {
            this.updateFadeIn();
            this._showCount--;
        } else {
            this.updateFadeOut();
        }
    }

    updateFadeIn(): void {
        this.contentsOpacity += 16;
    }

    updateFadeOut(): void {
        this.contentsOpacity -= 16;
    }

    open(): void {
        this.refresh();
        this._showCount = 150;
    }

    close(): void {
        this._showCount = 0;
    }

    refresh(): void {
        this.contents.clear();
        if (window.$gameMap.displayName()) {
            const width = this.contentsWidth();
            this.drawBackground(0, 0, width, this.lineHeight());
            this.drawText(window.$gameMap.displayName(), 0, 0, width, 'center');
        }
    }

    drawBackground(x: number, y: number, width: number, height: number): void {
        const color1 = this.dimColor1();
        const color2 = this.dimColor2();
        this.contents.gradientFillRect(x, y, width / 2, height, color2, color1);
        this.contents.gradientFillRect(x + width / 2, y, width / 2, height, color1, color2);
    }
}

import { Bitmap } from '../rpg_core/Bitmap';
import { Graphics } from '../rpg_core/Graphics';
import { Sprite } from '../rpg_core/Sprite';

/**
 * The sprite for displaying the timer.
 */
export class Sprite_Timer extends Sprite {
    protected _seconds: number;

    constructor() {
        super();
        this._seconds = 0;
        this.createBitmap();
        this.update();
    }

    createBitmap(): void {
        this.bitmap = new Bitmap(96, 48);
        this.bitmap.fontSize = 32;
    }

    update(): void {
        super.update();
        this.updateBitmap();
        this.updatePosition();
        this.updateVisibility();
    }

    updateBitmap(): void {
        if (this._seconds !== window.$gameTimer.seconds()) {
            this._seconds = window.$gameTimer.seconds();
            this.redraw();
        }
    }

    redraw(): void {
        const text = this.timerText();
        const width = this.bitmap.width;
        const height = this.bitmap.height;
        this.bitmap.clear();
        this.bitmap.drawText(text, 0, 0, width, height, 'center');
    }

    timerText(): string {
        const min = Math.floor(this._seconds / 60) % 60;
        const sec = this._seconds % 60;
        return String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
    }

    updatePosition(): void {
        this.x = Graphics.width - this.bitmap.width;
        this.y = 0;
    }

    updateVisibility(): void {
        this.visible = window.$gameTimer.isWorking();
    }
}

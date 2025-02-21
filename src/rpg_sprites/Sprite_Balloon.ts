import { ImageManager } from '../rpg_managers/ImageManager';
import { Sprite_Base } from './Sprite_Base';

/**
 * The sprite for displaying a balloon icon.
 */
export class Sprite_Balloon extends Sprite_Base {
    protected _balloonId: number;
    protected _duration: number;

    constructor() {
        super();

        this.initMembers();
        this.loadBitmap();
    }

    initMembers(): void {
        this._balloonId = 0;
        this._duration = 0;
        this.anchor.x = 0.5;
        this.anchor.y = 1;
        this.z = 7;
    }

    loadBitmap(): void {
        this.bitmap = ImageManager.loadSystem('Balloon');
        this.setFrame(0, 0, 0, 0);
    }

    setup(balloonId: number): void {
        this._balloonId = balloonId;
        this._duration = 8 * this.speed() + this.waitTime();
    }

    update(): void {
        super.update();
        if (this._duration > 0) {
            this._duration--;
            if (this._duration > 0) {
                this.updateFrame();
            }
        }
    }

    updateFrame(): void {
        const w = 48;
        const h = 48;
        const sx = this.frameIndex() * w;
        const sy = (this._balloonId - 1) * h;
        this.setFrame(sx, sy, w, h);
    }

    speed(): number {
        return 8;
    }

    waitTime(): number {
        return 12;
    }

    frameIndex(): number {
        const index = (this._duration - this.waitTime()) / this.speed();
        return 7 - Math.max(Math.floor(index), 0);
    }

    isPlaying(): boolean {
        return this._duration > 0;
    }
}

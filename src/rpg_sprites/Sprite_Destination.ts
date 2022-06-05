import { Bitmap } from '../rpg_core/Bitmap';
import { Graphics } from '../rpg_core/Graphics';
import { Sprite } from '../rpg_core/Sprite';

/**
 * The sprite for displaying the destination place of the touch input.
 */
export class Sprite_Destination extends Sprite {
    private _frameCount: number;

    constructor() {
        super();
        this.createBitmap();
        this._frameCount = 0;
    }

    update(): void {
        super.update();
        if (window.$gameTemp.isDestinationValid()) {
            this.updatePosition();
            this.updateAnimation();
            this.visible = true;
        } else {
            this._frameCount = 0;
            this.visible = false;
        }
    }

    createBitmap(): void {
        const tileWidth = window.$gameMap.tileWidth();
        const tileHeight = window.$gameMap.tileHeight();
        this.bitmap = new Bitmap(tileWidth, tileHeight);
        this.bitmap.fillAll('white');
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        this.blendMode = Graphics.BLEND_ADD;
    }

    updatePosition(): void {
        const tileWidth = window.$gameMap.tileWidth();
        const tileHeight = window.$gameMap.tileHeight();
        const x = window.$gameTemp.destinationX();
        const y = window.$gameTemp.destinationY();
        this.x = (window.$gameMap.adjustX(x) + 0.5) * tileWidth;
        this.y = (window.$gameMap.adjustY(y) + 0.5) * tileHeight;
    }

    updateAnimation(): void {
        this._frameCount++;
        this._frameCount %= 20;
        this.opacity = (20 - this._frameCount) * 6;
        this.scale.x = 1 + this._frameCount / 20;
        this.scale.y = this.scale.x;
    }
}

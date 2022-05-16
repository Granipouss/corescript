import { Bitmap } from '../rpg_core/Bitmap';
import { Graphics } from '../rpg_core/Graphics';
import { Sprite } from '../rpg_core/Sprite';

/**
 * The sprite for displaying the destination place of the touch input.
 */
export class Sprite_Destination extends Sprite {
    constructor() {
        super();
        super.initialize();

        this.createBitmap();
        this._frameCount = 0;
    }

    update() {
        super.update();
        if (global.$gameTemp.isDestinationValid()) {
            this.updatePosition();
            this.updateAnimation();
            this.visible = true;
        } else {
            this._frameCount = 0;
            this.visible = false;
        }
    }

    createBitmap() {
        var tileWidth = global.$gameMap.tileWidth();
        var tileHeight = global.$gameMap.tileHeight();
        this.bitmap = new Bitmap(tileWidth, tileHeight);
        this.bitmap.fillAll('white');
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        this.blendMode = Graphics.BLEND_ADD;
    }

    updatePosition() {
        var tileWidth = global.$gameMap.tileWidth();
        var tileHeight = global.$gameMap.tileHeight();
        var x = global.$gameTemp.destinationX();
        var y = global.$gameTemp.destinationY();
        this.x = (global.$gameMap.adjustX(x) + 0.5) * tileWidth;
        this.y = (global.$gameMap.adjustY(y) + 0.5) * tileHeight;
    }

    updateAnimation() {
        this._frameCount++;
        this._frameCount %= 20;
        this.opacity = (20 - this._frameCount) * 6;
        this.scale.x = 1 + this._frameCount / 20;
        this.scale.y = this.scale.x;
    }
}

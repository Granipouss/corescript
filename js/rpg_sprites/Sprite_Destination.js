//-----------------------------------------------------------------------------
// Sprite_Destination
//
// The sprite for displaying the destination place of the touch input.

import { Bitmap } from '../rpg_core/Bitmap';
import { Graphics } from '../rpg_core/Graphics';
import { Sprite } from '../rpg_core/Sprite';

export function Sprite_Destination() {
    this.initialize.apply(this, arguments);
}

Sprite_Destination.prototype = Object.create(Sprite.prototype);
Sprite_Destination.prototype.constructor = Sprite_Destination;

Sprite_Destination.prototype.initialize = function () {
    Sprite.prototype.initialize.call(this);
    this.createBitmap();
    this._frameCount = 0;
};

Sprite_Destination.prototype.update = function () {
    Sprite.prototype.update.call(this);
    if (global.$gameTemp.isDestinationValid()) {
        this.updatePosition();
        this.updateAnimation();
        this.visible = true;
    } else {
        this._frameCount = 0;
        this.visible = false;
    }
};

Sprite_Destination.prototype.createBitmap = function () {
    var tileWidth = global.$gameMap.tileWidth();
    var tileHeight = global.$gameMap.tileHeight();
    this.bitmap = new Bitmap(tileWidth, tileHeight);
    this.bitmap.fillAll('white');
    this.anchor.x = 0.5;
    this.anchor.y = 0.5;
    this.blendMode = Graphics.BLEND_ADD;
};

Sprite_Destination.prototype.updatePosition = function () {
    var tileWidth = global.$gameMap.tileWidth();
    var tileHeight = global.$gameMap.tileHeight();
    var x = global.$gameTemp.destinationX();
    var y = global.$gameTemp.destinationY();
    this.x = (global.$gameMap.adjustX(x) + 0.5) * tileWidth;
    this.y = (global.$gameMap.adjustY(y) + 0.5) * tileHeight;
};

Sprite_Destination.prototype.updateAnimation = function () {
    this._frameCount++;
    this._frameCount %= 20;
    this.opacity = (20 - this._frameCount) * 6;
    this.scale.x = 1 + this._frameCount / 20;
    this.scale.y = this.scale.x;
};

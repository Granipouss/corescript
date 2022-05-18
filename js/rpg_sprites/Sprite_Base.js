import { Sprite } from '../rpg_core/Sprite';
import { Sprite_Animation } from './Sprite_Animation';

/**
 * The sprite class with a feature which displays animations.
 */
export class Sprite_Base extends Sprite {
    constructor() {
        super();
        this._animationSprites = [];
        this._effectTarget = this;
        this._hiding = false;
    }

    update() {
        super.update();
        this.updateVisibility();
        this.updateAnimationSprites();
    }

    hide() {
        this._hiding = true;
        this.updateVisibility();
    }

    show() {
        this._hiding = false;
        this.updateVisibility();
    }

    updateVisibility() {
        this.visible = !this._hiding;
    }

    updateAnimationSprites() {
        if (this._animationSprites.length > 0) {
            var sprites = this._animationSprites.clone();
            this._animationSprites = [];
            for (var i = 0; i < sprites.length; i++) {
                var sprite = sprites[i];
                if (sprite.isPlaying()) {
                    this._animationSprites.push(sprite);
                } else {
                    sprite.remove();
                }
            }
        }
    }

    startAnimation(animation, mirror, delay) {
        var sprite = new Sprite_Animation();
        sprite.setup(this._effectTarget, animation, mirror, delay);
        this.parent.addChild(sprite);
        this._animationSprites.push(sprite);
    }

    isAnimationPlaying() {
        return this._animationSprites.length > 0;
    }
}

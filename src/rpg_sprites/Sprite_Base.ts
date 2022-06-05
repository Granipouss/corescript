import { arrayClone } from '../rpg_core/extension';
import { Sprite } from '../rpg_core/Sprite';
import type { RPGAnimation } from '../rpg_data/animation';
import { Sprite_Animation } from './Sprite_Animation';

/**
 * The sprite class with a feature which displays animations.
 */
export class Sprite_Base extends Sprite {
    protected _animationSprites: Sprite_Animation[];
    protected _effectTarget: Sprite_Base;
    protected _hiding: boolean;

    constructor() {
        super();
        this._animationSprites = [];
        this._effectTarget = this;
        this._hiding = false;
    }

    update(): void {
        super.update();
        this.updateVisibility();
        this.updateAnimationSprites();
    }

    hide(): void {
        this._hiding = true;
        this.updateVisibility();
    }

    show(): void {
        this._hiding = false;
        this.updateVisibility();
    }

    updateVisibility(): void {
        this.visible = !this._hiding;
    }

    updateAnimationSprites(): void {
        if (this._animationSprites.length > 0) {
            const sprites = arrayClone(this._animationSprites);
            this._animationSprites = [];
            for (let i = 0; i < sprites.length; i++) {
                const sprite = sprites[i];
                if (sprite.isPlaying()) {
                    this._animationSprites.push(sprite);
                } else {
                    sprite.remove();
                }
            }
        }
    }

    startAnimation(animation: RPGAnimation, mirror: boolean, delay: number): void {
        const sprite = new Sprite_Animation();
        sprite.setup(this._effectTarget, animation, mirror, delay);
        this.parent.addChild(sprite);
        this._animationSprites.push(sprite);
    }

    isAnimationPlaying(): boolean {
        return this._animationSprites.length > 0;
    }
}

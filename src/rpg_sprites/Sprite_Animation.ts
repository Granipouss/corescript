import type { Bitmap } from '../rpg_core/Bitmap';
import type { Tone } from '../rpg_core/extension';
import { arrayClone } from '../rpg_core/extension';
import { ScreenSprite } from '../rpg_core/ScreenSprite';
import { Sprite } from '../rpg_core/Sprite';
import type { RPGAnimation, RPGAnimationTiming } from '../rpg_data/animation';
import { AudioManager } from '../rpg_managers/AudioManager';
import { ImageManager } from '../rpg_managers/ImageManager';
import type { Sprite_Base } from './Sprite_Base';

/**
 * The sprite for displaying an animation.
 */
export class Sprite_Animation extends Sprite {
    private static _checker1 = new Map<RPGAnimation, boolean>();
    private static _checker2 = new Map<RPGAnimation, boolean>();

    private _reduceArtifacts: boolean;

    private _target: Sprite_Base;
    private _animation: RPGAnimation;
    private _mirror: boolean;
    private _delay: number;
    private _rate: number;
    private _duration: number;
    private _flashColor: Tone;
    private _flashDuration: number;
    private _screenFlashDuration: number;
    private _hidingDuration: number;
    private _bitmap1: Bitmap;
    private _bitmap2: Bitmap;
    private _cellSprites: Sprite[];
    private _screenFlashSprite: ScreenSprite;
    private _duplicated: boolean;

    constructor() {
        super();
        this._reduceArtifacts = true;
        this.initMembers();
    }

    initMembers(): void {
        this._target = null;
        this._animation = null;
        this._mirror = false;
        this._delay = 0;
        this._rate = 4;
        this._duration = 0;
        this._flashColor = [0, 0, 0, 0];
        this._flashDuration = 0;
        this._screenFlashDuration = 0;
        this._hidingDuration = 0;
        this._bitmap1 = null;
        this._bitmap2 = null;
        this._cellSprites = [];
        this._screenFlashSprite = null;
        this._duplicated = false;
        this.z = 8;
    }

    setup(target: Sprite_Base, animation: RPGAnimation, mirror: boolean, delay: number): void {
        this._target = target;
        this._animation = animation;
        this._mirror = mirror;
        this._delay = delay;
        if (this._animation) {
            this.remove();
            this.setupRate();
            this.setupDuration();
            this.loadBitmaps();
            this.createSprites();
        }
    }

    remove(): void {
        if (this.parent && this.parent.removeChild(this)) {
            this._target.setBlendColor([0, 0, 0, 0]);
            this._target.show();
        }
    }

    setupRate(): void {
        this._rate = 4;
    }

    setupDuration(): void {
        this._duration = this._animation.frames.length * this._rate + 1;
    }

    update(): void {
        super.update();
        this.updateMain();
        this.updateFlash();
        this.updateScreenFlash();
        this.updateHiding();
        Sprite_Animation._checker1 = new Map<RPGAnimation, boolean>();
        Sprite_Animation._checker2 = new Map<RPGAnimation, boolean>();
    }

    updateFlash(): void {
        if (this._flashDuration > 0) {
            const d = this._flashDuration--;
            this._flashColor[3] *= (d - 1) / d;
            this._target.setBlendColor(this._flashColor);
        }
    }

    updateScreenFlash(): void {
        if (this._screenFlashDuration > 0) {
            const d = this._screenFlashDuration--;
            if (this._screenFlashSprite) {
                this._screenFlashSprite.x = -this.absoluteX();
                this._screenFlashSprite.y = -this.absoluteY();
                this._screenFlashSprite.opacity *= (d - 1) / d;
                this._screenFlashSprite.visible = this._screenFlashDuration > 0;
            }
        }
    }

    absoluteX(): number {
        let x = 0;
        let object = this as PIXI.DisplayObject;
        while (object) {
            x += object.x;
            object = object.parent;
        }
        return x;
    }

    absoluteY(): number {
        let y = 0;
        let object = this as PIXI.DisplayObject;
        while (object) {
            y += object.y;
            object = object.parent;
        }
        return y;
    }

    updateHiding(): void {
        if (this._hidingDuration > 0) {
            this._hidingDuration--;
            if (this._hidingDuration === 0) {
                this._target.show();
            }
        }
    }

    isPlaying(): boolean {
        return this._duration > 0;
    }

    loadBitmaps(): void {
        const name1 = this._animation.animation1Name;
        const name2 = this._animation.animation2Name;
        const hue1 = this._animation.animation1Hue;
        const hue2 = this._animation.animation2Hue;
        this._bitmap1 = ImageManager.loadAnimation(name1, hue1);
        this._bitmap2 = ImageManager.loadAnimation(name2, hue2);
    }

    isReady(): boolean {
        return this._bitmap1 && this._bitmap1.isReady() && this._bitmap2 && this._bitmap2.isReady();
    }

    createSprites(): void {
        if (!Sprite_Animation._checker2.get(this._animation)) {
            this.createCellSprites();
            if (this._animation.position === 3) {
                Sprite_Animation._checker2.set(this._animation, true);
            }
            this.createScreenFlashSprite();
        }
        if (Sprite_Animation._checker1.get(this._animation)) {
            this._duplicated = true;
        } else {
            this._duplicated = false;
            if (this._animation.position === 3) {
                Sprite_Animation._checker1.set(this._animation, true);
            }
        }
    }

    createCellSprites(): void {
        this._cellSprites = [];
        for (let i = 0; i < 16; i++) {
            const sprite = new Sprite();
            sprite.anchor.x = 0.5;
            sprite.anchor.y = 0.5;
            this._cellSprites.push(sprite);
            this.addChild(sprite);
        }
    }

    createScreenFlashSprite(): void {
        this._screenFlashSprite = new ScreenSprite();
        this.addChild(this._screenFlashSprite);
    }

    updateMain(): void {
        if (this.isPlaying() && this.isReady()) {
            if (this._delay > 0) {
                this._delay--;
            } else {
                this._duration--;
                this.updatePosition();
                if (this._duration % this._rate === 0) {
                    this.updateFrame();
                }
            }
        }
    }

    updatePosition(): void {
        if (this._animation.position === 3) {
            this.x = this.parent.width / 2;
            this.y = this.parent.height / 2;
        } else {
            const parent = this._target.parent;
            const grandparent = parent ? parent.parent : null;
            this.x = this._target.x;
            this.y = this._target.y;
            if (this.parent === grandparent) {
                this.x += parent.x;
                this.y += parent.y;
            }
            if (this._animation.position === 0) {
                this.y -= this._target.height;
            } else if (this._animation.position === 1) {
                this.y -= this._target.height / 2;
            }
        }
    }

    updateFrame(): void {
        if (this._duration > 0) {
            const frameIndex = this.currentFrameIndex();
            this.updateAllCellSprites(this._animation.frames[frameIndex]);
            this._animation.timings.forEach(function (timing) {
                if (timing.frame === frameIndex) {
                    this.processTimingData(timing);
                }
            }, this);
        }
    }

    currentFrameIndex(): number {
        return this._animation.frames.length - Math.floor((this._duration + this._rate - 1) / this._rate);
    }

    updateAllCellSprites(frame: number[][]): void {
        for (let i = 0; i < this._cellSprites.length; i++) {
            const sprite = this._cellSprites[i];
            if (i < frame.length) {
                this.updateCellSprite(sprite, frame[i]);
            } else {
                sprite.visible = false;
            }
        }
    }

    updateCellSprite(sprite: Sprite, cell: number[]): void {
        const pattern = cell[0];
        if (pattern >= 0) {
            const sx = (pattern % 5) * 192;
            const sy = Math.floor((pattern % 100) / 5) * 192;
            const mirror = this._mirror;
            sprite.bitmap = pattern < 100 ? this._bitmap1 : this._bitmap2;
            sprite.setFrame(sx, sy, 192, 192);
            sprite.x = cell[1];
            sprite.y = cell[2];
            sprite.rotation = (cell[4] * Math.PI) / 180;
            sprite.scale.x = cell[3] / 100;

            if (cell[5]) {
                sprite.scale.x *= -1;
            }
            if (mirror) {
                sprite.x *= -1;
                sprite.rotation *= -1;
                sprite.scale.x *= -1;
            }

            sprite.scale.y = cell[3] / 100;
            sprite.opacity = cell[6];
            sprite.blendMode = cell[7];
            sprite.visible = true;
        } else {
            sprite.visible = false;
        }
    }

    processTimingData(timing: RPGAnimationTiming): void {
        const duration = timing.flashDuration * this._rate;
        switch (timing.flashScope) {
            case 1:
                this.startFlash(timing.flashColor, duration);
                break;
            case 2:
                this.startScreenFlash(timing.flashColor, duration);
                break;
            case 3:
                this.startHiding(duration);
                break;
        }
        if (!this._duplicated && timing.se) {
            AudioManager.playSe(timing.se);
        }
    }

    startFlash(color: Tone, duration: number): void {
        this._flashColor = arrayClone(color);
        this._flashDuration = duration;
    }

    startScreenFlash(color: number[], duration: number): void {
        this._screenFlashDuration = duration;
        if (this._screenFlashSprite) {
            this._screenFlashSprite.setColor(color[0], color[1], color[2]);
            this._screenFlashSprite.opacity = color[3];
        }
    }

    startHiding(duration: number): void {
        this._hidingDuration = duration;
        this._target.hide();
    }
}

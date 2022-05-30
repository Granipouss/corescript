import { arrayClone, arrayEquals } from '../rpg_core/extension';
import { Graphics } from '../rpg_core/Graphics';
import { ScreenSprite } from '../rpg_core/ScreenSprite';
import { Sprite } from '../rpg_core/Sprite';
import { ToneFilter } from '../rpg_core/ToneFilter';
import { ToneSprite } from '../rpg_core/ToneSprite';
import { Sprite_Picture } from './Sprite_Picture';
import { Sprite_Timer } from './Sprite_Timer';

/**
 * The superclass of Spriteset_Map and Spriteset_Battle.
 */
export class Spriteset_Base extends Sprite {
    protected _tone: number[];
    protected _baseSprite: Sprite;
    protected _blackScreen: ScreenSprite;
    protected _toneFilter: ToneFilter;
    protected _toneSprite: ToneSprite;
    protected _pictureContainer: Sprite;
    protected _timerSprite: Sprite_Timer;
    protected _flashSprite: ScreenSprite;
    protected _fadeSprite: ScreenSprite;

    constructor() {
        super();
        this.setFrame(0, 0, Graphics.width, Graphics.height);
        this._tone = [0, 0, 0, 0];
        this.opaque = true;
        this.createLowerLayer();
        this.createToneChanger();
        this.createUpperLayer();
        this.update();
    }

    createLowerLayer(): void {
        this.createBaseSprite();
    }

    createUpperLayer(): void {
        this.createPictures();
        this.createTimer();
        this.createScreenSprites();
    }

    update(): void {
        super.update();
        this.updateScreenSprites();
        this.updateToneChanger();
        this.updatePosition();
    }

    createBaseSprite(): void {
        this._baseSprite = new Sprite();
        this._baseSprite.setFrame(0, 0, this.width, this.height);
        this._blackScreen = new ScreenSprite();
        this._blackScreen.opacity = 255;
        this.addChild(this._baseSprite);
        this._baseSprite.addChild(this._blackScreen);
    }

    createToneChanger(): void {
        if (Graphics.isWebGL()) {
            this.createWebGLToneChanger();
        } else {
            this.createCanvasToneChanger();
        }
    }

    createWebGLToneChanger(): void {
        const margin = 48;
        const width = Graphics.width + margin * 2;
        const height = Graphics.height + margin * 2;
        this._toneFilter = new ToneFilter();
        this._toneFilter.enabled = false;
        this._baseSprite.filters = [this._toneFilter];
        this._baseSprite.filterArea = new PIXI.Rectangle(-margin, -margin, width, height);
    }

    createCanvasToneChanger(): void {
        this._toneSprite = new ToneSprite();
        this.addChild(this._toneSprite);
    }

    createPictures(): void {
        const width = Graphics.boxWidth;
        const height = Graphics.boxHeight;
        const x = (Graphics.width - width) / 2;
        const y = (Graphics.height - height) / 2;
        this._pictureContainer = new Sprite();
        this._pictureContainer.setFrame(x, y, width, height);
        for (let i = 1; i <= window.$gameScreen.maxPictures(); i++) {
            this._pictureContainer.addChild(new Sprite_Picture(i));
        }
        this.addChild(this._pictureContainer);
    }

    createTimer(): void {
        this._timerSprite = new Sprite_Timer();
        this.addChild(this._timerSprite);
    }

    createScreenSprites(): void {
        this._flashSprite = new ScreenSprite();
        this._fadeSprite = new ScreenSprite();
        this.addChild(this._flashSprite);
        this.addChild(this._fadeSprite);
    }

    updateScreenSprites(): void {
        const color = window.$gameScreen.flashColor();
        this._flashSprite.setColor(color[0], color[1], color[2]);
        this._flashSprite.opacity = color[3];
        this._fadeSprite.opacity = 255 - window.$gameScreen.brightness();
    }

    updateToneChanger(): void {
        const tone = window.$gameScreen.tone();
        if (!arrayEquals(this._tone, tone)) {
            this._tone = arrayClone(tone);
            if (Graphics.isWebGL()) {
                this.updateWebGLToneChanger();
            } else {
                this.updateCanvasToneChanger();
            }
        }
    }

    updateWebGLToneChanger(): void {
        const tone = this._tone;
        this._toneFilter.reset();
        if (tone[0] || tone[1] || tone[2] || tone[3]) {
            this._toneFilter.enabled = true;
            this._toneFilter.adjustTone(tone[0], tone[1], tone[2]);
            this._toneFilter.adjustSaturation(-tone[3]);
        } else {
            this._toneFilter.enabled = false;
        }
    }

    updateCanvasToneChanger(): void {
        const tone = this._tone;
        this._toneSprite.setTone(tone[0], tone[1], tone[2], tone[3]);
    }

    updatePosition(): void {
        const screen = window.$gameScreen;
        const scale = screen.zoomScale();
        this.scale.x = scale;
        this.scale.y = scale;
        this.x = Math.round(-screen.zoomX() * (scale - 1));
        this.y = Math.round(-screen.zoomY() * (scale - 1));
        this.x += Math.round(screen.shake());
    }
}

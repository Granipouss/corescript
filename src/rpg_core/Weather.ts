import * as PIXI from 'pixi.js';

import { Bitmap } from './Bitmap';
import { Graphics } from './Graphics';
import { ScreenSprite } from './ScreenSprite';
import { Sprite } from './Sprite';
import { randomInt } from './extension';

export type WeatherType = 'none' | 'rain' | 'storm' | 'snow';

type WeatherSprite = Sprite & { ax?: number; ay?: number };

/**
 * The weather effect which displays rain, storm, or snow.
 */
export class Weather extends PIXI.Container {
    private _width: number;
    private _height: number;
    private _sprites: WeatherSprite[];

    private _rainBitmap: Bitmap;
    private _stormBitmap: Bitmap;
    private _snowBitmap: Bitmap;

    private _dimmerSprite: ScreenSprite;

    constructor() {
        super();

        this._width = Graphics.width;
        this._height = Graphics.height;
        this._sprites = [];

        this._createBitmaps();
        this._createDimmer();
    }

    /**
     * The type of the weather in ['none', 'rain', 'storm', 'snow'].
     */
    type: WeatherType = 'none';

    /**
     * The power of the weather in the range (0, 9).
     */
    power = 0;

    /**
     * The origin point of the weather for scrolling.
     */
    origin = new PIXI.Point();

    /**
     * Updates the weather for each frame.
     */
    update(): void {
        this._updateDimmer();
        this._updateAllSprites();
    }

    private _createBitmaps(): void {
        this._rainBitmap = new Bitmap(1, 60);
        this._rainBitmap.fillAll('white');
        this._stormBitmap = new Bitmap(2, 100);
        this._stormBitmap.fillAll('white');
        this._snowBitmap = new Bitmap(9, 9);
        this._snowBitmap.drawCircle(4, 4, 4, 'white');
    }

    private _createDimmer(): void {
        this._dimmerSprite = new ScreenSprite();
        this._dimmerSprite.setColor(80, 80, 80);
        this.addChild(this._dimmerSprite);
    }

    private _updateDimmer(): void {
        this._dimmerSprite.opacity = Math.floor(this.power * 6);
    }

    private _updateAllSprites(): void {
        const maxSprites = Math.floor(this.power * 10);
        while (this._sprites.length < maxSprites) {
            this._addSprite();
        }
        while (this._sprites.length > maxSprites) {
            this._removeSprite();
        }
        this._sprites.forEach((sprite) => {
            this._updateSprite(sprite);
            sprite.x = sprite.ax - this.origin.x;
            sprite.y = sprite.ay - this.origin.y;
        });
    }

    private _addSprite(): void {
        const sprite = new Sprite();
        sprite.opacity = 0;
        this._sprites.push(sprite);
        this.addChild(sprite);
    }

    private _removeSprite(): void {
        this.removeChild(this._sprites.pop());
    }

    private _updateSprite(sprite: Sprite): void {
        switch (this.type) {
            case 'rain':
                this._updateRainSprite(sprite);
                break;
            case 'storm':
                this._updateStormSprite(sprite);
                break;
            case 'snow':
                this._updateSnowSprite(sprite);
                break;
        }
        if (sprite.opacity < 40) {
            this._rebornSprite(sprite);
        }
    }

    private _updateRainSprite(sprite: WeatherSprite): void {
        sprite.bitmap = this._rainBitmap;
        sprite.rotation = Math.PI / 16;
        sprite.ax -= 6 * Math.sin(sprite.rotation);
        sprite.ay += 6 * Math.cos(sprite.rotation);
        sprite.opacity -= 6;
    }

    private _updateStormSprite(sprite: WeatherSprite): void {
        sprite.bitmap = this._stormBitmap;
        sprite.rotation = Math.PI / 8;
        sprite.ax -= 8 * Math.sin(sprite.rotation);
        sprite.ay += 8 * Math.cos(sprite.rotation);
        sprite.opacity -= 8;
    }

    private _updateSnowSprite(sprite: WeatherSprite): void {
        sprite.bitmap = this._snowBitmap;
        sprite.rotation = Math.PI / 16;
        sprite.ax -= 3 * Math.sin(sprite.rotation);
        sprite.ay += 3 * Math.cos(sprite.rotation);
        sprite.opacity -= 3;
    }

    private _rebornSprite(sprite: WeatherSprite): void {
        sprite.ax = randomInt(Graphics.width + 100) - 100 + this.origin.x;
        sprite.ay = randomInt(Graphics.height + 200) - 200 + this.origin.y;
        sprite.opacity = 160 + randomInt(60);
    }
}

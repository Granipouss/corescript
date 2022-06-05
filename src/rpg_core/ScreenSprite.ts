import * as PIXI from 'pixi.js';

import { Graphics } from './Graphics';
import { Utils } from './Utils';
import { clamp } from './extension';

/**
 * The sprite which covers the entire game screen.
 */
export class ScreenSprite extends PIXI.Container {
    protected _graphics: PIXI.Graphics;

    protected _red: number;
    protected _green: number;
    protected _blue: number;
    protected _colorText: string;

    constructor() {
        super();

        this._graphics = new PIXI.Graphics();
        this.addChild(this._graphics);
        this.opacity = 0;

        this._red = -1;
        this._green = -1;
        this._blue = -1;
        this._colorText = '';
        this.setBlack();
    }

    /**
     * The opacity of the sprite (0 to 255).
     */
    get opacity(): number {
        return this.alpha * 255;
    }
    set opacity(value: number) {
        this.alpha = clamp(value, [0, 255]) / 255;
    }

    get blendMode(): number {
        return this._graphics.blendMode;
    }
    set blendMode(value: number) {
        this._graphics.blendMode = value;
    }

    /**
     * Sets black to the color of the screen sprite.
     */
    setBlack(): void {
        this.setColor(0, 0, 0);
    }

    /**
     * Sets white to the color of the screen sprite.
     */
    setWhite(): void {
        this.setColor(255, 255, 255);
    }

    /**
     * Sets the color of the screen sprite by values.
     * @param r The red value in the range (0, 255)
     * @param g The green value in the range (0, 255)
     * @param b The blue value in the range (0, 255)
     */
    setColor(r = 0, g = 0, b = 0): void {
        if (this._red !== r || this._green !== g || this._blue !== b) {
            r = clamp(Math.round(r || 0), [0, 255]);
            g = clamp(Math.round(g || 0), [0, 255]);
            b = clamp(Math.round(b || 0), [0, 255]);
            this._red = r;
            this._green = g;
            this._blue = b;
            this._colorText = Utils.rgbToCssColor(r, g, b);

            const graphics = this._graphics;
            graphics.clear();
            const intColor = (r << 16) | (g << 8) | b;
            graphics.beginFill(intColor, 1);
            // Whole screen with zoom. BWAHAHAHAHA
            graphics.drawRect(-Graphics.width * 5, -Graphics.height * 5, Graphics.width * 10, Graphics.height * 10);
        }
    }
}

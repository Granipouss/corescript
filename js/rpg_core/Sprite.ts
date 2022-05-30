import * as PIXI from 'pixi.js';

import { Graphics } from './Graphics';
import { Utils } from './Utils';
import { arrayClone, arrayEquals, clamp, Tone } from './extension';
import type { Bitmap } from './Bitmap';

/**
 * The basic object that is rendered to the game screen.
 */
export class Sprite extends PIXI.Sprite {
    protected _bitmap: Bitmap;
    protected _frame: PIXI.Rectangle;
    protected _realFrame: PIXI.Rectangle;
    protected _blendColor: Tone;
    protected _colorTone: Tone;
    protected _canvas: HTMLCanvasElement;
    protected _context: CanvasRenderingContext2D;
    protected _tintTexture: PIXI.BaseTexture;

    spriteId: number;
    opaque: boolean;
    z = 0;

    protected _refreshFrame: boolean;

    constructor(bitmap?: Bitmap) {
        const texture = new PIXI.Texture(new PIXI.BaseTexture());

        super(texture);

        this._bitmap = null;
        this._frame = new PIXI.Rectangle();
        this._realFrame = new PIXI.Rectangle();
        this._blendColor = [0, 0, 0, 0];
        this._colorTone = [0, 0, 0, 0];
        this._canvas = null;
        this._context = null;
        this._tintTexture = null;

        this.spriteId = Sprite._counter++;
        this.opaque = false;

        this.bitmap = bitmap;
    }

    /**
     * use heavy renderer that will reduce border artifacts and apply advanced blendModes
     */
    protected _isPicture = false;

    // Number of the created objects.
    static _counter = 0;

    /**
     * The image for the sprite.
     */
    get bitmap(): Bitmap {
        return this._bitmap;
    }
    set bitmap(value: Bitmap) {
        if (this._bitmap !== value) {
            this._bitmap = value;

            if (value) {
                this._refreshFrame = true;
                value.addLoadListener(this._onBitmapLoad.bind(this));
            } else {
                this._refreshFrame = false;
                this.texture.frame = PIXI.Rectangle.EMPTY;
            }
        }
    }

    /**
     * The width of the sprite without the scale.
     */
    // FIXME:
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    get width(): number {
        return this._frame.width;
    }
    set width(value: number) {
        this._frame.width = value;
        this._refresh();
    }

    /**
     * The height of the sprite without the scale.
     */
    // FIXME:
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    get height(): number {
        return this._frame.height;
    }
    set height(value: number) {
        this._frame.height = value;
        this._refresh();
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

    /**
     * Updates the sprite for each frame.
     */
    update(): void {
        this.children.forEach((child: PIXI.DisplayObject & { update?: () => void }) => {
            if (child.update) {
                child.update();
            }
        });
    }

    /**
     * Sets the x and y at once.
     */
    move(x: number, y: number, _width?: number, _height?: number): void {
        this.x = x;
        this.y = y;
    }

    /**
     * Sets the rectagle of the bitmap that the sprite displays.
     */
    setFrame(x: number, y: number, width: number, height: number): void {
        this._refreshFrame = false;
        const frame = this._frame;
        if (x !== frame.x || y !== frame.y || width !== frame.width || height !== frame.height) {
            frame.x = x;
            frame.y = y;
            frame.width = width;
            frame.height = height;
            this._refresh();
        }
    }

    /**
     * Gets the blend color for the sprite.
     * @return The blend color [r, g, b, a]
     */
    getBlendColor(): Tone {
        return arrayClone(this._blendColor);
    }

    /**
     * Sets the blend color for the sprite.
     * @param color The blend color [r, g, b, a]
     */
    setBlendColor(color: Tone) {
        if (!(color instanceof Array)) {
            throw new Error('Argument must be an array');
        }
        if (!arrayEquals(this._blendColor, color)) {
            this._blendColor = arrayClone(color);
            this._refresh();
        }
    }

    /**
     * Gets the color tone for the sprite.
     * @return The color tone [r, g, b, gray]
     */
    getColorTone(): Tone {
        return arrayClone(this._colorTone);
    }

    /**
     * Sets the color tone for the sprite.
     * @param tone The color tone [r, g, b, gray]
     */
    setColorTone(tone: Tone) {
        if (!(tone instanceof Array)) {
            throw new Error('Argument must be an array');
        }
        if (!arrayEquals(this._colorTone, tone)) {
            this._colorTone = arrayClone(tone);
            this._refresh();
        }
    }

    protected _onBitmapLoad(bitmapLoaded): void {
        if (bitmapLoaded === this._bitmap) {
            if (this._refreshFrame && this._bitmap) {
                this._refreshFrame = false;
                this._frame.width = this._bitmap.width;
                this._frame.height = this._bitmap.height;
            }
        }

        this._refresh();
    }

    protected _refresh(): void {
        const frameX = Math.floor(this._frame.x);
        const frameY = Math.floor(this._frame.y);
        const frameW = Math.floor(this._frame.width);
        const frameH = Math.floor(this._frame.height);
        const bitmapW = this._bitmap ? this._bitmap.width : 0;
        const bitmapH = this._bitmap ? this._bitmap.height : 0;
        const realX = clamp(frameX, [0, bitmapW]);
        const realY = clamp(frameY, [0, bitmapH]);
        const realW = clamp(frameW - realX + frameX, [0, bitmapW - realX]);
        const realH = clamp(frameH - realY + frameY, [0, bitmapH - realY]);

        this._realFrame.x = realX;
        this._realFrame.y = realY;
        this._realFrame.width = realW;
        this._realFrame.height = realH;
        this.pivot.x = frameX - realX;
        this.pivot.y = frameY - realY;

        if (realW > 0 && realH > 0) {
            if (this._needsTint()) {
                this._createTinter(realW, realH);
                this._executeTint(realX, realY, realW, realH);
                this._tintTexture.update();
                this.texture.baseTexture = this._tintTexture;
                this.texture.frame = new PIXI.Rectangle(0, 0, realW, realH);
            } else {
                if (this._bitmap) {
                    this.texture.baseTexture = this._bitmap.baseTexture;
                }
                this.texture.frame = this._realFrame;
            }
        } else if (this._bitmap) {
            this.texture.frame = PIXI.Rectangle.EMPTY;
        } else {
            this.texture.baseTexture.width = Math.max(
                this.texture.baseTexture.width,
                this._frame.x + this._frame.width
            );
            this.texture.baseTexture.height = Math.max(
                this.texture.baseTexture.height,
                this._frame.y + this._frame.height
            );
            this.texture.frame = this._frame;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.texture as any)._updateID++;
    }

    protected _isInBitmapRect(x: number, y: number, w: number, h: number): boolean {
        return this._bitmap && x + w > 0 && y + h > 0 && x < this._bitmap.width && y < this._bitmap.height;
    }

    protected _needsTint(): boolean {
        const tone = this._colorTone;
        return !!tone[0] || !!tone[1] || !!tone[2] || !!tone[3] || this._blendColor[3] > 0;
    }

    protected _createTinter(w: number, h: number): void {
        if (!this._canvas) {
            this._canvas = document.createElement('canvas');
            this._context = this._canvas.getContext('2d');
        }

        this._canvas.width = w;
        this._canvas.height = h;

        if (!this._tintTexture) {
            this._tintTexture = new PIXI.BaseTexture(this._canvas);
        }

        this._tintTexture.width = w;
        this._tintTexture.height = h;
        this._tintTexture.scaleMode = this._bitmap.baseTexture.scaleMode;
    }

    protected _executeTint(x: number, y: number, w: number, h: number) {
        const context = this._context;
        const tone = this._colorTone;
        const color = this._blendColor;

        context.globalCompositeOperation = 'copy';
        context.drawImage(this._bitmap.canvas, x, y, w, h, 0, 0, w, h);

        if (tone[0] || tone[1] || tone[2] || tone[3]) {
            if (Graphics.canUseSaturationBlend()) {
                const gray = Math.max(0, tone[3]);
                context.globalCompositeOperation = 'saturation';
                context.fillStyle = 'rgba(255,255,255,' + gray / 255 + ')';
                context.fillRect(0, 0, w, h);
            }

            const r1 = Math.max(0, tone[0]);
            const g1 = Math.max(0, tone[1]);
            const b1 = Math.max(0, tone[2]);
            context.globalCompositeOperation = 'lighter';
            context.fillStyle = Utils.rgbToCssColor(r1, g1, b1);
            context.fillRect(0, 0, w, h);

            if (Graphics.canUseDifferenceBlend()) {
                context.globalCompositeOperation = 'difference';
                context.fillStyle = 'white';
                context.fillRect(0, 0, w, h);

                const r2 = Math.max(0, -tone[0]);
                const g2 = Math.max(0, -tone[1]);
                const b2 = Math.max(0, -tone[2]);
                context.globalCompositeOperation = 'lighter';
                context.fillStyle = Utils.rgbToCssColor(r2, g2, b2);
                context.fillRect(0, 0, w, h);

                context.globalCompositeOperation = 'difference';
                context.fillStyle = 'white';
                context.fillRect(0, 0, w, h);
            }
        }

        const r3 = Math.max(0, color[0]);
        const g3 = Math.max(0, color[1]);
        const b3 = Math.max(0, color[2]);
        const a3 = Math.max(0, color[3]);
        context.globalCompositeOperation = 'source-atop';
        context.fillStyle = Utils.rgbToCssColor(r3, g3, b3);
        context.globalAlpha = a3 / 255;
        context.fillRect(0, 0, w, h);

        context.globalCompositeOperation = 'destination-in';
        context.globalAlpha = 1;
        context.drawImage(this._bitmap.canvas, x, y, w, h, 0, 0, w, h);
    }

    override _renderCanvas(renderer: PIXI.CanvasRenderer): void {
        if (this.bitmap) {
            this.bitmap.touch();
        }
        if (this.bitmap && !this.bitmap.isReady()) {
            return;
        }

        if (this.texture.frame.width > 0 && this.texture.frame.height > 0) {
            super._renderCanvas(renderer);
        }
    }

    /**
     * checks if we need to speed up custom blendmodes
     */
    static speedUpCustomBlendModes(renderer: PIXI.WebGLRenderer, blend: number): void {
        const picture = renderer.plugins.picture;
        if (renderer.renderingToScreen && renderer._activeRenderTarget.root) {
            if (picture.drawModes[blend]) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const stage = (renderer as any)._lastObjectRendered;
                const f = stage._filters;
                if (!f || !f[0]) {
                    setTimeout(() => {
                        const f = stage._filters;
                        if (!f || !f[0]) {
                            stage.filters = [];
                            stage.filterArea = new PIXI.Rectangle(0, 0, Graphics.width, Graphics.height);
                        }
                    }, 0);
                }
            }
        }
    }

    override _renderWebGL(renderer: PIXI.WebGLRenderer): void {
        if (this.bitmap) {
            this.bitmap.touch();
        }
        if (this.bitmap && !this.bitmap.isReady()) {
            return;
        }
        if (this.texture.frame.width > 0 && this.texture.frame.height > 0) {
            if (this._bitmap) {
                this._bitmap.checkDirty();
            }

            //copy of pixi-v4 internal code
            this.calculateVertices();

            if (this.pluginName === 'sprite' && this._isPicture) {
                // use heavy renderer, which reduces artifacts and applies corrent blendMode,
                // but does not use multitexture optimization
                Sprite.speedUpCustomBlendModes(renderer, this.blendMode);
                renderer.setObjectRenderer(renderer.plugins.picture);
                renderer.plugins.picture.render(this);
            } else {
                // use pixi super-speed renderer
                renderer.setObjectRenderer(renderer.plugins[this.pluginName]);
                renderer.plugins[this.pluginName].render(this);
            }
        }
    }
}

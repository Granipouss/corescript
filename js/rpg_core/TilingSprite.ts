import * as PIXI from 'pixi.js';

import { Sprite } from './Sprite';
import { clamp } from './extension';
import type { Bitmap } from './Bitmap';

/**
 * The sprite object for a tiling image.
 *
 * @param {Bitmap} bitmap The image for the tiling sprite
 */
export class TilingSprite extends PIXI.extras.TilingSprite {
    protected _bitmap: Bitmap;
    protected _frame: PIXI.Rectangle;
    readonly spriteId: number;

    constructor(bitmap?: Bitmap) {
        const texture = new PIXI.Texture(new PIXI.BaseTexture());

        super(texture);

        this._bitmap = null;
        this._width = 0;
        this._height = 0;
        this._frame = new PIXI.Rectangle();
        this.spriteId = Sprite._counter++;

        this.bitmap = bitmap;
    }

    /**
     * The origin point of the tiling sprite for scrolling.
     */
    origin = new PIXI.Point();

    _renderCanvas(renderer: PIXI.CanvasRenderer): void {
        if (this._bitmap) {
            this._bitmap.touch();
        }
        if (this.texture.frame.width > 0 && this.texture.frame.height > 0) {
            super._renderCanvas(renderer);
        }
    }

    /**
     * The image for the tiling sprite.
     */
    get bitmap(): Bitmap {
        return this._bitmap;
    }
    set bitmap(value: Bitmap) {
        if (this._bitmap !== value) {
            this._bitmap = value;
            if (this._bitmap) {
                this._bitmap.addLoadListener(this._onBitmapLoad.bind(this));
            } else {
                this.texture.frame = PIXI.Rectangle.EMPTY;
            }
        }
    }

    /**
     * The opacity of the tiling sprite (0 to 255).
     */
    get opacity(): number {
        return this.alpha * 255;
    }
    set opacity(value: number) {
        this.alpha = clamp(value, [0, 255]) / 255;
    }

    /**
     * Updates the tiling sprite for each frame.
     */
    update(): void {
        this.children.forEach((child: PIXI.DisplayObject & { update?: () => void }) => {
            if (child.update) {
                child.update();
            }
        });
    }

    /**
     * Sets the x, y, width, and height all at once.
     */
    move(x: number, y: number, width: number, height: number): void {
        this.x = x || 0;
        this.y = y || 0;
        this._width = width || 0;
        this._height = height || 0;
    }

    /**
     * Specifies the region of the image that the tiling sprite will use.
     */
    setFrame(x: number, y: number, width: number, height: number): void {
        this._frame.x = x;
        this._frame.y = y;
        this._frame.width = width;
        this._frame.height = height;
        this._refresh();
    }

    updateTransform() {
        this.tilePosition.x = Math.round(-this.origin.x);
        this.tilePosition.y = Math.round(-this.origin.y);
        super.updateTransform();
    }

    private _onBitmapLoad(): void {
        this.texture.baseTexture = this._bitmap.baseTexture;
        this._refresh();
    }

    private _refresh(): void {
        const frame = this._frame.clone();
        if (frame.width === 0 && frame.height === 0 && this._bitmap) {
            frame.width = this._bitmap.width;
            frame.height = this._bitmap.height;
        }
        this.texture.frame = frame;
        // FIXME:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.texture as any)._updateID++;
        // FIXME:
        // this.tilingTexture = null;
    }

    _renderWebGL(renderer: PIXI.WebGLRenderer): void {
        if (this._bitmap) {
            this._bitmap.touch();
            this._bitmap.checkDirty();
        }

        Sprite.speedUpCustomBlendModes(renderer, this.blendMode);

        super._renderWebGL(renderer);
    }
}

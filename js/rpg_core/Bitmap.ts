import * as PIXI from 'pixi.js';
import type { CacheEntry } from './CacheEntry';

import { Decrypter } from './Decrypter';
import { Graphics } from './Graphics';
import { ResourceHandler } from './ResourceHandler';

export type BitmapState =
    /** Empty Bitmap */
    | 'none'
    /** Url requested, but pending to load until startRequest called */
    | 'pending'
    /** Url request completed and purged. */
    | 'purged'
    /** Requesting supplied URI now. */
    | 'requesting'
    /** Request completed */
    | 'requestCompleted'
    /** Requesting encrypted data from supplied URI or decrypting it. */
    | 'decrypting'
    /** Decrypt completed */
    | 'decryptCompleted'
    /** Loaded. isReady() === true, so It's usable. */
    | 'loaded'
    /** Error occurred */
    | 'error';

/**
 * The basic object that represents an image.
 */
export class Bitmap {
    //for iOS. img consumes memory. so reuse it.
    static _reuseImages: HTMLImageElement[] = [];

    private _defer: boolean;
    private _url: string;
    private _paintOpacity: number;
    private _smooth: boolean;
    private _loadListeners: ((bitmap: Bitmap) => void)[];
    private _loadingState: BitmapState;
    private _decodeAfterRequest: boolean;

    private _loadListener: () => void;
    private _errorListener: () => void;
    private _loader: () => void;
    private _dirty: boolean;

    /**
     * Bitmap states(Bitmap._loadingState):
     *
     * none:
     * Empty Bitmap
     *
     * pending:
     * Url requested, but pending to load until startRequest called
     *
     * purged:
     * Url request completed and purged.
     *
     * requesting:
     * Requesting supplied URI now.
     *
     * requestCompleted:
     * Request completed
     *
     * decrypting:
     * requesting encrypted data from supplied URI or decrypting it.
     *
     * decryptCompleted:
     * Decrypt completed
     *
     * loaded:
     * loaded. isReady() === true, so It's usable.
     *
     * error:
     * error occurred
     *
     */

    private __canvas: HTMLCanvasElement;
    private __context: CanvasRenderingContext2D;

    private _createCanvas(width = 0, height = 0): void {
        this.__canvas = this.__canvas || document.createElement('canvas');
        this.__context = this.__canvas.getContext('2d');

        this.__canvas.width = Math.max(width || 0, 1);
        this.__canvas.height = Math.max(height || 0, 1);

        if (this._image) {
            const w = Math.max(this._image.width || 0, 1);
            const h = Math.max(this._image.height || 0, 1);
            this.__canvas.width = w;
            this.__canvas.height = h;
            this._createBaseTexture(this._canvas);

            this.__context.drawImage(this._image, 0, 0);
        }

        this._setDirty();
    }

    private __baseTexture: PIXI.BaseTexture;

    private _createBaseTexture(source: HTMLImageElement | HTMLCanvasElement): void {
        this.__baseTexture = new PIXI.BaseTexture(source);
        this.__baseTexture.mipmap = false;
        this.__baseTexture.width = source.width;
        this.__baseTexture.height = source.height;

        if (this._smooth) {
            this._baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
        } else {
            this._baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
        }
    }

    private _image: HTMLImageElement;

    private _clearImgInstance(): void {
        this._image.src = '';
        this._image.onload = null;
        this._image.onerror = null;
        this._errorListener = null;
        this._loadListener = null;

        Bitmap._reuseImages.push(this._image);
        this._image = null;
    }

    //
    // We don't want to waste memory, so creating canvas is deferred.
    //

    private get _canvas(): HTMLCanvasElement {
        if (!this.__canvas) this._createCanvas();
        return this.__canvas;
    }
    private get _context(): CanvasRenderingContext2D {
        if (!this.__context) this._createCanvas();
        return this.__context;
    }

    private get _baseTexture(): PIXI.BaseTexture {
        if (!this.__baseTexture) this._createBaseTexture(this._image || this.__canvas);
        return this.__baseTexture;
    }

    private _renewCanvas(): void {
        const newImage = this._image;
        if (
            newImage &&
            this.__canvas &&
            (this.__canvas.width < newImage.width || this.__canvas.height < newImage.height)
        ) {
            this._createCanvas();
        }
    }

    constructor(width = 0, height = 0, defer = false) {
        this._defer = defer;
        if (!this._defer) {
            this._createCanvas(width, height);
        }

        this._image = null;
        this._url = '';
        this._paintOpacity = 255;
        this._smooth = false;
        this._loadListeners = [];
        this._loadingState = 'none';
        this._decodeAfterRequest = false;
    }

    /**
     * Cache entry, for images. In all cases _url is the same as cacheEntry.key
     */
    cacheEntry: CacheEntry<Bitmap> = null;

    /**
     * The face name of the font.
     */
    fontFace = 'GameFont';

    /**
     * The size of the font in pixels.
     */
    fontSize = 28;

    /**
     * Whether the font is italic.
     */
    fontItalic = false;

    /**
     * The color of the text in CSS format.
     */
    textColor = '#ffffff';

    /**
     * The color of the outline of the text in CSS format.
     */
    outlineColor = 'rgba(0, 0, 0, 0.5)';

    /**
     * The width of the outline of the text.
     */
    outlineWidth = 4;

    /**
     * Loads a image file and returns a new bitmap object.
     */
    static load(url: string): Bitmap {
        const bitmap = new Bitmap(0, 0, true);

        bitmap._decodeAfterRequest = true;
        bitmap._requestImage(url);

        return bitmap;
    }

    /**
     * Takes a snapshot of the game screen and returns a new bitmap object.
     */
    static snap(stage: PIXI.DisplayObject): Bitmap {
        const width = Graphics.width;
        const height = Graphics.height;
        const bitmap = new Bitmap(width, height);
        const context = bitmap._context;
        const renderTexture = PIXI.RenderTexture.create(width, height);
        if (stage) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const renderer = (Graphics as any)._renderer as PIXI.WebGLRenderer | PIXI.CanvasRenderer;
            renderer.render(stage, renderTexture);
            stage.worldTransform.identity();
            let canvas: HTMLCanvasElement = null;
            if (renderer instanceof PIXI.WebGLRenderer) {
                canvas = renderer.extract.canvas(renderTexture);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                canvas = (renderTexture as any).baseTexture._canvasRenderTarget.canvas;
            }
            context.drawImage(canvas, 0, 0);
        }
        renderTexture.destroy(true);
        bitmap._setDirty();
        return bitmap;
    }

    /**
     * Checks whether the bitmap is ready to render.
     */
    isReady(): boolean {
        return this._loadingState === 'loaded' || this._loadingState === 'none';
    }

    /**
     * Checks whether a loading error has occurred.
     */
    isError(): boolean {
        return this._loadingState === 'error';
    }

    /**
     * Touch the resource
     */
    touch(): void {
        if (this.cacheEntry) {
            this.cacheEntry.touch();
        }
    }

    /**
     * [read-only] The url of the image file.
     */
    get url(): string {
        return this._url;
    }

    /**
     * [read-only] The base texture that holds the image.
     */
    get baseTexture(): PIXI.BaseTexture {
        return this._baseTexture;
    }

    /**
     * [read-only] The bitmap canvas.
     */
    get canvas(): HTMLCanvasElement {
        return this._canvas;
    }

    /**
     * [read-only] The 2d context of the bitmap canvas.
     */
    get context(): CanvasRenderingContext2D {
        return this._context;
    }

    /**
     * [read-only] The width of the bitmap.
     */
    get width(): number {
        if (this.isReady()) {
            return this._image ? this._image.width : this._canvas.width;
        }

        return 0;
    }

    /**
     * [read-only] The height of the bitmap.
     */
    get height(): number {
        if (this.isReady()) {
            return this._image ? this._image.height : this._canvas.height;
        }

        return 0;
    }

    /**
     * [read-only] The rectangle of the bitmap.
     */
    get rect(): PIXI.Rectangle {
        return new PIXI.Rectangle(0, 0, this.width, this.height);
    }

    /**
     * Whether the smooth scaling is applied.
     */
    get smooth(): boolean {
        return this._smooth;
    }
    set smooth(value: boolean) {
        if (this._smooth !== value) {
            this._smooth = value;
            if (this.__baseTexture) {
                if (this._smooth) {
                    this._baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
                } else {
                    this._baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
                }
            }
        }
    }

    /**
     * The opacity of the drawing object in the range (0, 255).
     */
    get paintOpacity(): number {
        return this._paintOpacity;
    }
    set paintOpacity(value: number) {
        if (this._paintOpacity !== value) {
            this._paintOpacity = value;
            this._context.globalAlpha = this._paintOpacity / 255;
        }
    }

    /**
     * Resizes the bitmap.
     */
    resize(width: number, height: number): void {
        width = Math.max(width || 0, 1);
        height = Math.max(height || 0, 1);
        this._canvas.width = width;
        this._canvas.height = height;
        this._baseTexture.width = width;
        this._baseTexture.height = height;
    }

    /**
     * Performs a block transfer.
     * @param source The bitmap to draw
     * @param sx The x coordinate in the source
     * @param sy The y coordinate in the source
     * @param sw The width of the source image
     * @param sh The height of the source image
     * @param dx The x coordinate in the destination
     * @param dy The y coordinate in the destination
     * @param dw The width to draw the image in the destination
     * @param dh The height to draw the image in the destination
     */
    blt(
        source: Bitmap,
        sx: number,
        sy: number,
        sw: number,
        sh: number,
        dx: number,
        dy: number,
        dw = sw,
        dh = sh
    ): void {
        if (
            sx >= 0 &&
            sy >= 0 &&
            sw > 0 &&
            sh > 0 &&
            dw > 0 &&
            dh > 0 &&
            sx + sw <= source.width &&
            sy + sh <= source.height
        ) {
            this._context.globalCompositeOperation = 'source-over';
            this._context.drawImage(source._canvas, sx, sy, sw, sh, dx, dy, dw, dh);
            this._setDirty();
        }
    }

    /**
     * Performs a block transfer, using assumption that original image was not modified (no hue)
     * @param source The bitmap to draw
     * @param sx The x coordinate in the source
     * @param sy The y coordinate in the source
     * @param sw The width of the source image
     * @param sh The height of the source image
     * @param dx The x coordinate in the destination
     * @param dy The y coordinate in the destination
     * @param dw The width to draw the image in the destination
     * @param dh The height to draw the image in the destination
     */
    bltImage(
        source: Bitmap,
        sx: number,
        sy: number,
        sw: number,
        sh: number,
        dx: number,
        dy: number,
        dw = sw,
        dh = sh
    ): void {
        dw = dw || sw;
        dh = dh || sh;
        if (
            sx >= 0 &&
            sy >= 0 &&
            sw > 0 &&
            sh > 0 &&
            dw > 0 &&
            dh > 0 &&
            sx + sw <= source.width &&
            sy + sh <= source.height
        ) {
            this._context.globalCompositeOperation = 'source-over';
            this._context.drawImage(source._image, sx, sy, sw, sh, dx, dy, dw, dh);
            this._setDirty();
        }
    }

    /**
     * Returns pixel color at the specified point. (hex format)
     */
    getPixel(x: number, y: number): string {
        const data = this._context.getImageData(x, y, 1, 1).data;
        let result = '#';
        for (let i = 0; i < 3; i++) {
            result += data[i].toString(16).padStart(2, '0');
        }
        return result;
    }

    /**
     * Returns alpha pixel value at the specified point.
     */
    getAlphaPixel(x: number, y: number): number {
        const data = this._context.getImageData(x, y, 1, 1).data;
        return data[3];
    }

    /**
     * Clears the specified rectangle.
     */
    clearRect(x: number, y: number, width: number, height: number): void {
        this._context.clearRect(x, y, width, height);
        this._setDirty();
    }

    /**
     * Clears the entire bitmap.
     */
    clear(): void {
        this.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Fills the specified rectangle.
     * The color of the rectangle in CSS format
     */
    fillRect(x: number, y: number, width: number, height: number, color: string): void {
        const context = this._context;
        context.save();
        context.fillStyle = color;
        context.fillRect(x, y, width, height);
        context.restore();
        this._setDirty();
    }

    /**
     * Fills the entire bitmap.
     * The color of the rectangle in CSS format
     */
    fillAll(color: string): void {
        this.fillRect(0, 0, this.width, this.height, color);
    }

    /**
     * Draws the rectangle with a gradation.
     */
    gradientFillRect(
        x: number,
        y: number,
        width: number,
        height: number,
        color1: string,
        color2: string,
        vertical = false
    ): void {
        const context = this._context;
        const grad = vertical
            ? context.createLinearGradient(x, y, x, y + height)
            : context.createLinearGradient(x, y, x + width, y);
        grad.addColorStop(0, color1);
        grad.addColorStop(1, color2);
        context.save();
        context.fillStyle = grad;
        context.fillRect(x, y, width, height);
        context.restore();
        this._setDirty();
    }

    /**
     * Draw a bitmap in the shape of a circle
     * The color of the circle in CSS format
     */
    drawCircle(x: number, y: number, radius: number, color: string): void {
        const context = this._context;
        context.save();
        context.fillStyle = color;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2, false);
        context.fill();
        context.restore();
        this._setDirty();
    }

    /**
     * Draws the outline text to the bitmap.
     */
    drawText(text: string, x: number, y: number, maxWidth: number, lineHeight: number, align?: CanvasTextAlign): void {
        // Note: Firefox has a bug with textBaseline: Bug 737852
        //       So we use 'alphabetic' here.
        if (text !== undefined) {
            if (this.fontSize < Bitmap.minFontSize) {
                this.drawSmallText(text, x, y, maxWidth, lineHeight, align);
                return;
            }
            let tx = x;
            const ty = y + lineHeight - Math.round((lineHeight - this.fontSize * 0.7) / 2);
            const context = this._context;
            const alpha = context.globalAlpha;
            maxWidth = maxWidth || 0xffffffff;
            if (align === 'center') {
                tx += maxWidth / 2;
            }
            if (align === 'right') {
                tx += maxWidth;
            }
            context.save();
            context.font = this._makeFontNameText();
            context.textAlign = align;
            context.textBaseline = 'alphabetic';
            context.globalAlpha = 1;
            this._drawTextOutline(text, tx, ty, maxWidth);
            context.globalAlpha = alpha;
            this._drawTextBody(text, tx, ty, maxWidth);
            context.restore();
            this._setDirty();
        }
    }

    /**
     * Draws the small text big once and resize it because modern broswers are poor at drawing small text.
     */
    drawSmallText(
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        lineHeight: number,
        align?: CanvasTextAlign
    ): void {
        const minFontSize = Bitmap.minFontSize;
        const bitmap = Bitmap.drawSmallTextBitmap;
        bitmap.fontFace = this.fontFace;
        bitmap.fontSize = minFontSize;
        bitmap.fontItalic = this.fontItalic;
        bitmap.textColor = this.textColor;
        bitmap.outlineColor = this.outlineColor;
        bitmap.outlineWidth = (this.outlineWidth * minFontSize) / this.fontSize;
        maxWidth = maxWidth || 816;
        const height = this.fontSize * 1.5;
        const scaledMaxWidth = (maxWidth * minFontSize) / this.fontSize;
        const scaledMaxWidthWithOutline = scaledMaxWidth + bitmap.outlineWidth * 2;
        const scaledHeight = (height * minFontSize) / this.fontSize;
        const scaledHeightWithOutline = scaledHeight + bitmap.outlineWidth * 2;

        let bitmapWidth = bitmap.width;
        let bitmapHeight = bitmap.height;
        while (scaledMaxWidthWithOutline > bitmapWidth) bitmapWidth *= 2;
        while (scaledHeightWithOutline > bitmapHeight) bitmapHeight *= 2;
        if (bitmap.width !== bitmapWidth || bitmap.height !== bitmapHeight) bitmap.resize(bitmapWidth, bitmapHeight);

        bitmap.drawText(text, bitmap.outlineWidth, bitmap.outlineWidth, scaledMaxWidth, minFontSize, align);
        this.blt(
            bitmap,
            0,
            0,
            scaledMaxWidthWithOutline,
            scaledHeightWithOutline,
            x - this.outlineWidth,
            y - this.outlineWidth + (lineHeight - this.fontSize) / 2,
            maxWidth + this.outlineWidth * 2,
            height + this.outlineWidth * 2
        );
        bitmap.clear();
    }

    /**
     * Returns the width of the specified text.
     * The width of the text in pixels
     */
    measureTextWidth(text: string): number {
        const context = this._context;
        context.save();
        context.font = this._makeFontNameText();
        const width = context.measureText(text).width;
        context.restore();
        return width;
    }

    /**
     * Changes the color tone of the entire bitmap.
     * @param r The red strength in the range (-255, 255)
     * @param g The green strength in the range (-255, 255)
     * @param b The blue strength in the range (-255, 255)
     */
    adjustTone(r: number, g: number, b: number): void {
        if ((r || g || b) && this.width > 0 && this.height > 0) {
            const context = this._context;
            const imageData = context.getImageData(0, 0, this.width, this.height);
            const pixels = imageData.data;
            for (let i = 0; i < pixels.length; i += 4) {
                pixels[i + 0] += r;
                pixels[i + 1] += g;
                pixels[i + 2] += b;
            }
            context.putImageData(imageData, 0, 0);
            this._setDirty();
        }
    }

    /**
     * Rotates the hue of the entire bitmap.
     * @param offset The hue offset in 360 degrees
     */
    rotateHue(offset: number): void {
        function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
            const cmin = Math.min(r, g, b);
            const cmax = Math.max(r, g, b);
            let h = 0;
            let s = 0;
            const l = (cmin + cmax) / 2;
            const delta = cmax - cmin;

            if (delta > 0) {
                if (r === cmax) {
                    h = 60 * (((g - b) / delta + 6) % 6);
                } else if (g === cmax) {
                    h = 60 * ((b - r) / delta + 2);
                } else {
                    h = 60 * ((r - g) / delta + 4);
                }
                s = delta / (255 - Math.abs(2 * l - 255));
            }
            return [h, s, l];
        }

        function hslToRgb(h: number, s: number, l: number): [number, number, number] {
            const c = (255 - Math.abs(2 * l - 255)) * s;
            const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
            const m = l - c / 2;
            const cm = c + m;
            const xm = x + m;

            if (h < 60) {
                return [cm, xm, m];
            } else if (h < 120) {
                return [xm, cm, m];
            } else if (h < 180) {
                return [m, cm, xm];
            } else if (h < 240) {
                return [m, xm, cm];
            } else if (h < 300) {
                return [xm, m, cm];
            } else {
                return [cm, m, xm];
            }
        }

        if (offset && this.width > 0 && this.height > 0) {
            offset = ((offset % 360) + 360) % 360;
            const context = this._context;
            const imageData = context.getImageData(0, 0, this.width, this.height);
            const pixels = imageData.data;
            for (let i = 0; i < pixels.length; i += 4) {
                const hsl = rgbToHsl(pixels[i + 0], pixels[i + 1], pixels[i + 2]);
                const h = (hsl[0] + offset) % 360;
                const s = hsl[1];
                const l = hsl[2];
                const rgb = hslToRgb(h, s, l);
                pixels[i + 0] = rgb[0];
                pixels[i + 1] = rgb[1];
                pixels[i + 2] = rgb[2];
            }
            context.putImageData(imageData, 0, 0);
            this._setDirty();
        }
    }

    /**
     * Applies a blur effect to the bitmap.
     */
    blur(): void {
        for (let i = 0; i < 2; i++) {
            const w = this.width;
            const h = this.height;
            const canvas = this._canvas;
            const context = this._context;
            const tempCanvas = document.createElement('canvas');
            const tempContext = tempCanvas.getContext('2d');
            tempCanvas.width = w + 2;
            tempCanvas.height = h + 2;
            tempContext.drawImage(canvas, 0, 0, w, h, 1, 1, w, h);
            tempContext.drawImage(canvas, 0, 0, w, 1, 1, 0, w, 1);
            tempContext.drawImage(canvas, 0, 0, 1, h, 0, 1, 1, h);
            tempContext.drawImage(canvas, 0, h - 1, w, 1, 1, h + 1, w, 1);
            tempContext.drawImage(canvas, w - 1, 0, 1, h, w + 1, 1, 1, h);
            context.save();
            context.fillStyle = 'black';
            context.fillRect(0, 0, w, h);
            context.globalCompositeOperation = 'lighter';
            context.globalAlpha = 1 / 9;
            for (let y = 0; y < 3; y++) {
                for (let x = 0; x < 3; x++) {
                    context.drawImage(tempCanvas, x, y, w, h, 0, 0, w, h);
                }
            }
            context.restore();
        }
        this._setDirty();
    }

    /**
     * Add a callback function that will be called when the bitmap is loaded.
     */
    addLoadListener(listner: (bitmap: Bitmap) => void): void {
        if (!this.isReady()) {
            this._loadListeners.push(listner);
        } else {
            listner(this);
        }
    }

    private _makeFontNameText(): string {
        return (this.fontItalic ? 'Italic ' : '') + this.fontSize + 'px ' + this.fontFace;
    }

    private _drawTextOutline(text: string, tx: number, ty: number, maxWidth: number): void {
        const context = this._context;
        context.strokeStyle = this.outlineColor;
        context.lineWidth = this.outlineWidth;
        context.lineJoin = 'round';
        context.strokeText(text, tx, ty, maxWidth);
    }

    private _drawTextBody(text: string, tx: number, ty: number, maxWidth: number): void {
        const context = this._context;
        context.fillStyle = this.textColor;
        context.fillText(text, tx, ty, maxWidth);
    }

    private _onLoad(): void {
        this._image.removeEventListener('load', this._loadListener);
        this._image.removeEventListener('error', this._errorListener);

        this._renewCanvas();

        switch (this._loadingState) {
            case 'requesting':
                this._loadingState = 'requestCompleted';
                if (this._decodeAfterRequest) {
                    this.decode();
                } else {
                    this._loadingState = 'purged';
                    this._clearImgInstance();
                }
                break;

            case 'decrypting':
                window.URL.revokeObjectURL(this._image.src);
                this._loadingState = 'decryptCompleted';
                if (this._decodeAfterRequest) {
                    this.decode();
                } else {
                    this._loadingState = 'purged';
                    this._clearImgInstance();
                }
                break;
        }
    }

    decode(): void {
        switch (this._loadingState) {
            case 'requestCompleted':
            case 'decryptCompleted':
                this._loadingState = 'loaded';

                if (!this.__canvas) this._createBaseTexture(this._image);
                this._setDirty();
                this._callLoadListeners();
                break;

            case 'requesting':
            case 'decrypting':
                this._decodeAfterRequest = true;
                if (!this._loader) {
                    this._loader = ResourceHandler.createLoader(
                        this._url,
                        this._requestImage.bind(this, this._url),
                        this._onError.bind(this)
                    );
                    this._image.removeEventListener('error', this._errorListener);
                    this._image.addEventListener('error', (this._errorListener = this._loader));
                }
                break;

            case 'pending':
            case 'purged':
            case 'error':
                this._decodeAfterRequest = true;
                this._requestImage(this._url);
                break;
        }
    }

    private _callLoadListeners(): void {
        while (this._loadListeners.length > 0) {
            const listener = this._loadListeners.shift();
            listener(this);
        }
    }

    private _onError(): void {
        this._image.removeEventListener('load', this._loadListener);
        this._image.removeEventListener('error', this._errorListener);
        this._loadingState = 'error';
    }

    private _setDirty(): void {
        this._dirty = true;
    }

    /**
     * updates texture is bitmap was dirty
     */
    checkDirty(): void {
        if (this._dirty) {
            this._baseTexture.update();
            const baseTexture = this._baseTexture;
            setTimeout(() => {
                baseTexture.update();
            }, 0);
            this._dirty = false;
        }
    }

    static request(url: string): Bitmap {
        const bitmap = new Bitmap(0, 0, true);

        bitmap._url = url;
        bitmap._loadingState = 'pending';

        return bitmap;
    }

    private _requestImage(url: string): void {
        if (Bitmap._reuseImages.length !== 0) {
            this._image = Bitmap._reuseImages.pop();
        } else {
            this._image = new Image();
        }

        if (this._decodeAfterRequest && !this._loader) {
            this._loader = ResourceHandler.createLoader(
                url,
                this._requestImage.bind(this, url),
                this._onError.bind(this)
            );
        }

        this._url = url;
        this._loadingState = 'requesting';

        if (!Decrypter.checkImgIgnore(url) && Decrypter.hasEncryptedImages) {
            this._loadingState = 'decrypting';
            Decrypter.decrypt(
                url,
                (source) => {
                    this._image.src = source;
                    this._image.addEventListener('load', (this._loadListener = (): void => this._onLoad()));
                    this._image.addEventListener(
                        'error',
                        (this._errorListener = this._loader || ((): void => this._onError()))
                    );
                },
                () => {
                    if (this._loader) {
                        this._loader();
                    } else {
                        this._onError();
                    }
                }
            );
        } else {
            this._image.src = url;

            this._image.addEventListener('load', (this._loadListener = Bitmap.prototype._onLoad.bind(this)));
            this._image.addEventListener(
                'error',
                (this._errorListener = this._loader || Bitmap.prototype._onError.bind(this))
            );
        }
    }

    isRequestOnly(): boolean {
        return !(this._decodeAfterRequest || this.isReady());
    }

    isRequestReady(): boolean {
        return (
            this._loadingState !== 'pending' &&
            this._loadingState !== 'requesting' &&
            this._loadingState !== 'decrypting'
        );
    }

    startRequest(): void {
        if (this._loadingState === 'pending') {
            this._decodeAfterRequest = false;
            this._requestImage(this._url);
        }
    }

    static minFontSize = 21;
    static drawSmallTextBitmap = new Bitmap(1632, Bitmap.minFontSize);
}

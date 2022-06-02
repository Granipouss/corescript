import * as PIXI from 'pixi.js';

import { Graphics } from '../rpg_core/Graphics';
import type { Sprite } from './Sprite';
import type { Window } from './Window';

/**
 * The layer which contains game windows.
 */
export class WindowLayer extends PIXI.Container {
    protected _width: number;
    protected _height: number;
    protected _tempCanvas: HTMLCanvasElement;
    protected _translationMatrix: number[];
    protected _windowMask: PIXI.Graphics;
    protected _windowRect: PIXI.Rectangle;
    protected _renderSprite: Sprite;

    constructor() {
        super();

        this._width = 0;
        this._height = 0;
        this._tempCanvas = null;
        this._translationMatrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];

        this._windowMask = new PIXI.Graphics();
        this._windowMask.beginFill(0xffffff, 1);
        this._windowMask.drawRect(0, 0, 0, 0);
        this._windowMask.endFill();
        // FIXME:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._windowRect = (this._windowMask as any).graphicsData[0].shape;

        this._renderSprite = null;
        this.filterArea = new PIXI.Rectangle();
        this.filters = [WindowLayer.voidFilter];

        // Temporary fix for memory leak bug
        this.on('removed', this.onRemoveAsAChild);
    }

    onRemoveAsAChild(): void {
        this.removeChildren();
    }

    // FIXME:
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static voidFilter = new (PIXI.filters as any).VoidFilter();

    /**
     * The width of the window layer in pixels.
     */
    // FIXME:
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    get width(): number {
        return this._width;
    }
    set width(value: number) {
        this._width = value;
    }

    /**
     * The height of the window layer in pixels.
     */
    // FIXME:
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    get height(): number {
        return this._height;
    }
    set height(value: number) {
        this._height = value;
    }

    /**
     * Sets the x, y, width, and height all at once.
     */
    move(x: number, y: number, width: number, height: number): void {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    /**
     * Updates the window layer for each frame.
     */
    update(): void {
        this.children.forEach((child: PIXI.DisplayObject & { update?: () => void }) => {
            if (child.update) {
                child.update();
            }
        });
    }

    renderCanvas(renderer: PIXI.CanvasRenderer): void {
        if (!this.visible || !this.renderable) {
            return;
        }

        if (!this._tempCanvas) {
            this._tempCanvas = document.createElement('canvas');
        }

        this._tempCanvas.width = Graphics.width;
        this._tempCanvas.height = Graphics.height;

        const realCanvasContext = renderer.context;
        const context = this._tempCanvas.getContext('2d');

        context.save();
        context.clearRect(0, 0, Graphics.width, Graphics.height);
        context.beginPath();
        context.rect(this.x, this.y, this.width, this.height);
        context.closePath();
        context.clip();

        renderer.context = context;

        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i] as Window;
            if (child._isWindow && child.visible && child.openness > 0) {
                this._canvasClearWindowRect(renderer, child);
                context.save();
                child.renderCanvas(renderer);
                context.restore();
            }
        }

        context.restore();

        renderer.context = realCanvasContext;
        renderer.context.setTransform(1, 0, 0, 1, 0, 0);
        renderer.context.globalCompositeOperation = 'source-over';
        renderer.context.globalAlpha = 1;
        renderer.context.drawImage(this._tempCanvas, 0, 0);

        for (let j = 0; j < this.children.length; j++) {
            if (!this.children[j]._isWindow) {
                this.children[j].renderCanvas(renderer);
            }
        }
    }

    protected _canvasClearWindowRect(renderSession: PIXI.CanvasRenderer, window: Window): void {
        const rx = this.x + window.x;
        const ry = this.y + window.y + (window.height / 2) * (1 - window.openness / 255);
        const rw = window.width;
        const rh = (window.height * window.openness) / 255;
        renderSession.context.clearRect(rx, ry, rw, rh);
    }

    renderWebGL(renderer: PIXI.WebGLRenderer): void {
        if (!this.visible || !this.renderable) {
            return;
        }

        if (this.children.length == 0) {
            return;
        }

        renderer.flush();
        this.filterArea.x = this.x;
        this.filterArea.y = this.y;
        this.filterArea.width = this.width;
        this.filterArea.height = this.height;

        // FIXME:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderer.filterManager.pushFilter(this as any, this.filters);
        renderer.currentRenderer.start();

        const shift = new PIXI.Point();
        const rt = renderer._activeRenderTarget;
        const projectionMatrix = rt.projectionMatrix;
        shift.x = Math.round(((projectionMatrix.tx + 1) / 2) * rt.sourceFrame.width);
        shift.y = Math.round(((projectionMatrix.ty + 1) / 2) * rt.sourceFrame.height);

        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i] as Window;
            if (child._isWindow && child.visible && child.openness > 0) {
                this._maskWindow(child, shift);
                // FIXME:
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                renderer.maskManager.pushScissorMask(this as any, this._windowMask);
                renderer.clear();
                renderer.maskManager.popScissorMask();
                renderer.currentRenderer.start();
                child.renderWebGL(renderer);
                renderer.currentRenderer.flush();
            }
        }

        renderer.flush();
        renderer.filterManager.popFilter();
        renderer.maskManager.popScissorMask();

        for (let j = 0; j < this.children.length; j++) {
            if (!this.children[j]._isWindow) {
                this.children[j].renderWebGL(renderer);
            }
        }
    }

    protected _maskWindow(window: Window, shift: PIXI.Point): void {
        // FIXME:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this._windowMask as any)._currentBounds = null;
        // FIXME:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this._windowMask as any).boundsDirty = true;
        const rect = this._windowRect;
        rect.x = this.x + shift.x + window.x;
        rect.y = this.y + shift.y + window.y + (window.height / 2) * (1 - window.openness / 255);
        rect.width = window.width;
        rect.height = (window.height * window.openness) / 255;
    }

    // The important members from Pixi.js

    /**
     * The x coordinate of the window layer.
     *
     * @property x
     * @type Number
     */

    /**
     * The y coordinate of the window layer.
     *
     * @property y
     * @type Number
     */

    /**
     * [read-only] The array of children of the window layer.
     */
    children: (PIXI.DisplayObject & { _isWindow?: boolean })[];

    /**
     * [read-only] The object that contains the window layer.
     *
     * @property parent
     * @type Object
     */

    /**
     * Adds a child to the container.
     *
     * @method addChild
     * @param {Object} child The child to add
     * @return {Object} The child that was added
     */

    /**
     * Adds a child to the container at a specified index.
     *
     * @method addChildAt
     * @param {Object} child The child to add
     * @param {Number} index The index to place the child in
     * @return {Object} The child that was added
     */

    /**
     * Removes a child from the container.
     *
     * @method removeChild
     * @param {Object} child The child to remove
     * @return {Object} The child that was removed
     */

    /**
     * Removes a child from the specified index position.
     *
     * @method removeChildAt
     * @param {Number} index The index to get the child from
     * @return {Object} The child that was removed
     */
}

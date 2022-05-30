import { Sprite } from '../rpg_core/Sprite';
import { TouchInput } from '../rpg_core/TouchInput';

/**
 * The sprite for displaying a button.
 */
export class Sprite_Button extends Sprite {
    protected _touching: boolean;
    protected _coldFrame: PIXI.Rectangle;
    protected _hotFrame: PIXI.Rectangle;
    protected _clickHandler: () => void;

    constructor() {
        super();
        this._touching = false;
        this._coldFrame = null;
        this._hotFrame = null;
        this._clickHandler = null;
    }

    update(): void {
        super.update();
        this.updateFrame();
        this.processTouch();
    }

    updateFrame(): void {
        let frame: PIXI.Rectangle;
        if (this._touching) {
            frame = this._hotFrame;
        } else {
            frame = this._coldFrame;
        }
        if (frame) {
            this.setFrame(frame.x, frame.y, frame.width, frame.height);
        }
    }

    setColdFrame(x: number, y: number, width: number, height: number): void {
        this._coldFrame = new PIXI.Rectangle(x, y, width, height);
    }

    setHotFrame(x: number, y: number, width: number, height: number): void {
        this._hotFrame = new PIXI.Rectangle(x, y, width, height);
    }

    setClickHandler(method: () => void): void {
        this._clickHandler = method;
    }

    callClickHandler(): void {
        if (this._clickHandler) {
            this._clickHandler();
        }
    }

    processTouch(): void {
        if (this.isActive()) {
            if (TouchInput.isTriggered() && this.isButtonTouched()) {
                this._touching = true;
            }
            if (this._touching) {
                if (TouchInput.isReleased() || !this.isButtonTouched()) {
                    this._touching = false;
                    if (TouchInput.isReleased()) {
                        this.callClickHandler();
                    }
                }
            }
        } else {
            this._touching = false;
        }
    }

    isActive(): boolean {
        let node = this as PIXI.DisplayObject;
        while (node) {
            if (!node.visible) {
                return false;
            }
            node = node.parent;
        }
        return true;
    }

    isButtonTouched(): boolean {
        const x = this.canvasToLocalX(TouchInput.x);
        const y = this.canvasToLocalY(TouchInput.y);
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }

    canvasToLocalX(x: number): number {
        let node = this as PIXI.DisplayObject;
        while (node) {
            x -= node.x;
            node = node.parent;
        }
        return x;
    }

    canvasToLocalY(y: number): number {
        let node = this as PIXI.DisplayObject;
        while (node) {
            y -= node.y;
            node = node.parent;
        }
        return y;
    }
}

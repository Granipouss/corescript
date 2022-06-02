import { Utils } from './Utils';
import { Graphics } from './Graphics';

/**
 * The static class that handles input data from the mouse and touchscreen.
 */
export const TouchInput = new (class TouchInput {
    private _mousePressed: boolean;
    private _screenPressed: boolean;
    private _pressedTime: number;
    private _events: {
        triggered: boolean;
        cancelled: boolean;
        moved: boolean;
        released: boolean;
        wheelX: number;
        wheelY: number;
    };
    private _triggered: boolean;
    private _cancelled: boolean;
    private _moved: boolean;
    private _released: boolean;
    private _wheelX: number;
    private _wheelY: number;
    private _x: number;
    private _y: number;
    private _date: number;

    /**
     * Initializes the touch system.
     */
    constructor() {
        this.clear();
        this._setupEventHandlers();
    }

    /**
     * The wait time of the pseudo key repeat in frames.
     */
    keyRepeatWait = 24;

    /**
     * The interval of the pseudo key repeat in frames.
     */
    keyRepeatInterval = 6;

    /**
     * Clears all the touch data.
     */
    clear(): void {
        this._mousePressed = false;
        this._screenPressed = false;
        this._pressedTime = 0;
        this._events = {
            triggered: false,
            cancelled: false,
            moved: false,
            released: false,
            wheelX: 0,
            wheelY: 0,
        };
        this._triggered = false;
        this._cancelled = false;
        this._moved = false;
        this._released = false;
        this._wheelX = 0;
        this._wheelY = 0;
        this._x = 0;
        this._y = 0;
        this._date = 0;
    }

    /**
     * Updates the touch data.
     */
    update(): void {
        this._triggered = this._events.triggered;
        this._cancelled = this._events.cancelled;
        this._moved = this._events.moved;
        this._released = this._events.released;
        this._wheelX = this._events.wheelX;
        this._wheelY = this._events.wheelY;
        this._events.triggered = false;
        this._events.cancelled = false;
        this._events.moved = false;
        this._events.released = false;
        this._events.wheelX = 0;
        this._events.wheelY = 0;
        if (this.isPressed()) {
            this._pressedTime++;
        }
    }

    /**
     * Checks whether the mouse button or touchscreen is currently pressed down.
     */
    isPressed(): boolean {
        return this._mousePressed || this._screenPressed;
    }

    /**
     * Checks whether the left mouse button or touchscreen is just pressed.
     */
    isTriggered(): boolean {
        return this._triggered;
    }

    /**
     * Checks whether the left mouse button or touchscreen is just pressed
     * or a pseudo key repeat occurred.
     */
    isRepeated(): boolean {
        return (
            this.isPressed() &&
            (this._triggered ||
                (this._pressedTime >= this.keyRepeatWait && this._pressedTime % this.keyRepeatInterval === 0))
        );
    }

    /**
     * Checks whether the left mouse button or touchscreen is kept depressed.
     */
    isLongPressed(): boolean {
        return this.isPressed() && this._pressedTime >= this.keyRepeatWait;
    }

    /**
     * Checks whether the right mouse button is just pressed.
     */
    isCancelled(): boolean {
        return this._cancelled;
    }

    /**
     * Checks whether the mouse or a finger on the touchscreen is moved.
     */
    isMoved(): boolean {
        return this._moved;
    }

    /**
     * Checks whether the left mouse button or touchscreen is released.
     */
    isReleased(): boolean {
        return this._released;
    }

    /**
     * [read-only] The horizontal scroll amount.
     */
    get wheelX(): number {
        return this._wheelX;
    }

    /**
     * [read-only] The vertical scroll amount.
     */
    get wheelY(): number {
        return this._wheelY;
    }

    /**
     * [read-only] The x coordinate on the canvas area of the latest touch event.
     */
    get x(): number {
        return this._x;
    }

    /**
     * [read-only] The y coordinate on the canvas area of the latest touch event.
     */
    get y(): number {
        return this._y;
    }

    /**
     * [read-only] The time of the last input in milliseconds.
     */
    get date(): number {
        return this._date;
    }

    private _setupEventHandlers(): void {
        const isSupportPassive = Utils.isSupportPassiveEvent();
        document.addEventListener('mousedown', this._onMouseDown.bind(this));
        document.addEventListener('mousemove', this._onMouseMove.bind(this));
        document.addEventListener('mouseup', this._onMouseUp.bind(this));
        document.addEventListener('wheel', this._onWheel.bind(this));
        document.addEventListener(
            'touchstart',
            this._onTouchStart.bind(this),
            isSupportPassive ? { passive: false } : false
        );
        document.addEventListener(
            'touchmove',
            this._onTouchMove.bind(this),
            isSupportPassive ? { passive: false } : false
        );
        document.addEventListener('touchend', (ev) => this._onTouchEnd(ev));
        document.addEventListener('touchcancel', (ev) => this._onTouchCancel(ev));
        document.addEventListener('pointerdown', (ev) => this._onPointerDown(ev));
        window.addEventListener('blur', () => this._onLostFocus());
    }

    private _onMouseDown(event: MouseEvent): void {
        if (event.button === 0) {
            this._onLeftButtonDown(event);
        } else if (event.button === 1) {
            this._onMiddleButtonDown(event);
        } else if (event.button === 2) {
            this._onRightButtonDown(event);
        }
    }

    private _onLeftButtonDown(event: MouseEvent): void {
        const x = Graphics.pageToCanvasX(event.pageX);
        const y = Graphics.pageToCanvasY(event.pageY);
        if (Graphics.isInsideCanvas(x, y)) {
            this._mousePressed = true;
            this._pressedTime = 0;
            this._onTrigger(x, y);
        }
    }

    private _onMiddleButtonDown(_event: MouseEvent): void {
        // ...
    }

    private _onRightButtonDown(event: MouseEvent): void {
        const x = Graphics.pageToCanvasX(event.pageX);
        const y = Graphics.pageToCanvasY(event.pageY);
        if (Graphics.isInsideCanvas(x, y)) {
            this._onCancel(x, y);
        }
    }

    private _onMouseMove(event: MouseEvent): void {
        if (this._mousePressed) {
            const x = Graphics.pageToCanvasX(event.pageX);
            const y = Graphics.pageToCanvasY(event.pageY);
            this._onMove(x, y);
        }
    }

    private _onMouseUp(event: MouseEvent): void {
        if (event.button === 0) {
            const x = Graphics.pageToCanvasX(event.pageX);
            const y = Graphics.pageToCanvasY(event.pageY);
            this._mousePressed = false;
            this._onRelease(x, y);
        }
    }

    private _onWheel(event: WheelEvent): void {
        this._events.wheelX += event.deltaX;
        this._events.wheelY += event.deltaY;
        event.preventDefault();
    }

    private _onTouchStart(event: TouchEvent): void {
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            const x = Graphics.pageToCanvasX(touch.pageX);
            const y = Graphics.pageToCanvasY(touch.pageY);
            if (Graphics.isInsideCanvas(x, y)) {
                this._screenPressed = true;
                this._pressedTime = 0;
                if (event.touches.length >= 2) {
                    this._onCancel(x, y);
                } else {
                    this._onTrigger(x, y);
                }
                event.preventDefault();
            }
        }
        // FIXME:
        // if (window.cordova || window.navigator.standalone) {
        //     event.preventDefault();
        // }
    }

    private _onTouchMove(event: TouchEvent): void {
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            const x = Graphics.pageToCanvasX(touch.pageX);
            const y = Graphics.pageToCanvasY(touch.pageY);
            this._onMove(x, y);
        }
    }

    private _onTouchEnd(event: TouchEvent): void {
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            const x = Graphics.pageToCanvasX(touch.pageX);
            const y = Graphics.pageToCanvasY(touch.pageY);
            this._screenPressed = false;
            this._onRelease(x, y);
        }
    }

    private _onTouchCancel(_event: TouchEvent): void {
        this._screenPressed = false;
    }

    private _onPointerDown(event: PointerEvent): void {
        if (event.pointerType === 'touch' && !event.isPrimary) {
            const x = Graphics.pageToCanvasX(event.pageX);
            const y = Graphics.pageToCanvasY(event.pageY);
            if (Graphics.isInsideCanvas(x, y)) {
                // For Microsoft Edge
                this._onCancel(x, y);
                event.preventDefault();
            }
        }
    }

    private _onLostFocus(): void {
        this.clear();
    }

    private _onTrigger(x: number, y: number): void {
        this._events.triggered = true;
        this._x = x;
        this._y = y;
        this._date = Date.now();
    }

    private _onCancel(x: number, y: number): void {
        this._events.cancelled = true;
        this._x = x;
        this._y = y;
    }

    private _onMove(x: number, y: number): void {
        this._events.moved = true;
        this._x = x;
        this._y = y;
    }

    private _onRelease(x: number, y: number): void {
        this._events.released = true;
        this._x = x;
        this._y = y;
    }
})();

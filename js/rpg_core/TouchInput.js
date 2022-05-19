import { Utils } from '../rpg_core/Utils';
import { Graphics } from '../rpg_core/Graphics';

/**
 * The static class that handles input data from the mouse and touchscreen.
 */
export const TouchInput = new (class TouchInput {
    /**
     * Initializes the touch system.
     */
    constructor() {
        this.clear();
        this._setupEventHandlers();
    }

    /**
     * The wait time of the pseudo key repeat in frames.
     *
     * @property keyRepeatWait
     * @type Number
     */
    keyRepeatWait = 24;

    /**
     * The interval of the pseudo key repeat in frames.
     *
     * @property keyRepeatInterval
     * @type Number
     */
    keyRepeatInterval = 6;

    /**
     * Clears all the touch data.
     */
    clear() {
        this._mousePressed = false;
        this._screenPressed = false;
        this._pressedTime = 0;
        this._events = {};
        this._events.triggered = false;
        this._events.cancelled = false;
        this._events.moved = false;
        this._events.released = false;
        this._events.wheelX = 0;
        this._events.wheelY = 0;
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
    update() {
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
     *
     * @method isPressed
     * @return {Boolean} True if the mouse button or touchscreen is pressed
     */
    isPressed() {
        return this._mousePressed || this._screenPressed;
    }

    /**
     * Checks whether the left mouse button or touchscreen is just pressed.
     *
     * @method isTriggered
     * @return {Boolean} True if the mouse button or touchscreen is triggered
     */
    isTriggered() {
        return this._triggered;
    }

    /**
     * Checks whether the left mouse button or touchscreen is just pressed
     * or a pseudo key repeat occurred.
     *
     * @method isRepeated
     * @return {Boolean} True if the mouse button or touchscreen is repeated
     */
    isRepeated() {
        return (
            this.isPressed() &&
            (this._triggered ||
                (this._pressedTime >= this.keyRepeatWait && this._pressedTime % this.keyRepeatInterval === 0))
        );
    }

    /**
     * Checks whether the left mouse button or touchscreen is kept depressed.
     *
     * @method isLongPressed
     * @return {Boolean} True if the left mouse button or touchscreen is long-pressed
     */
    isLongPressed() {
        return this.isPressed() && this._pressedTime >= this.keyRepeatWait;
    }

    /**
     * Checks whether the right mouse button is just pressed.
     *
     * @method isCancelled
     * @return {Boolean} True if the right mouse button is just pressed
     */
    isCancelled() {
        return this._cancelled;
    }

    /**
     * Checks whether the mouse or a finger on the touchscreen is moved.
     *
     * @method isMoved
     * @return {Boolean} True if the mouse or a finger on the touchscreen is moved
     */
    isMoved() {
        return this._moved;
    }

    /**
     * Checks whether the left mouse button or touchscreen is released.
     *
     * @method isReleased
     * @return {Boolean} True if the mouse button or touchscreen is released
     */
    isReleased() {
        return this._released;
    }

    /**
     * [read-only] The horizontal scroll amount.
     *
     * @property wheelX
     * @type Number
     */
    get wheelX() {
        return this._wheelX;
    }

    /**
     * [read-only] The vertical scroll amount.
     *
     * @property wheelY
     * @type Number
     */
    get wheelY() {
        return this._wheelY;
    }

    /**
     * [read-only] The x coordinate on the canvas area of the latest touch event.
     *
     * @property x
     * @type Number
     */
    get x() {
        return this._x;
    }

    /**
     * [read-only] The y coordinate on the canvas area of the latest touch event.
     *
     * @property y
     * @type Number
     */
    get y() {
        return this._y;
    }

    /**
     * [read-only] The time of the last input in milliseconds.
     *
     * @property date
     * @type Number
     */
    get date() {
        return this._date;
    }

    /**
     * @private
     */
    _setupEventHandlers() {
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
        document.addEventListener('touchend', this._onTouchEnd.bind(this));
        document.addEventListener('touchcancel', this._onTouchCancel.bind(this));
        document.addEventListener('pointerdown', this._onPointerDown.bind(this));
        window.addEventListener('blur', this._onLostFocus.bind(this));
    }

    /**
     * @param {MouseEvent} event
     * @private
     */
    _onMouseDown(event) {
        if (event.button === 0) {
            this._onLeftButtonDown(event);
        } else if (event.button === 1) {
            this._onMiddleButtonDown(event);
        } else if (event.button === 2) {
            this._onRightButtonDown(event);
        }
    }

    /**
     * @param {MouseEvent} event
     * @private
     */
    _onLeftButtonDown(event) {
        const x = Graphics.pageToCanvasX(event.pageX);
        const y = Graphics.pageToCanvasY(event.pageY);
        if (Graphics.isInsideCanvas(x, y)) {
            this._mousePressed = true;
            this._pressedTime = 0;
            this._onTrigger(x, y);
        }
    }

    /**
     * @param {MouseEvent} event
     * @private
     */
    _onMiddleButtonDown(_event) {
        // ...
    }

    /**
     * @param {MouseEvent} event
     * @private
     */
    _onRightButtonDown(event) {
        const x = Graphics.pageToCanvasX(event.pageX);
        const y = Graphics.pageToCanvasY(event.pageY);
        if (Graphics.isInsideCanvas(x, y)) {
            this._onCancel(x, y);
        }
    }

    /**
     * @param {MouseEvent} event
     * @private
     */
    _onMouseMove(event) {
        if (this._mousePressed) {
            const x = Graphics.pageToCanvasX(event.pageX);
            const y = Graphics.pageToCanvasY(event.pageY);
            this._onMove(x, y);
        }
    }

    /**
     * @param {MouseEvent} event
     * @private
     */
    _onMouseUp(event) {
        if (event.button === 0) {
            const x = Graphics.pageToCanvasX(event.pageX);
            const y = Graphics.pageToCanvasY(event.pageY);
            this._mousePressed = false;
            this._onRelease(x, y);
        }
    }

    /**
     * @param {WheelEvent} event
     * @private
     */
    _onWheel(event) {
        this._events.wheelX += event.deltaX;
        this._events.wheelY += event.deltaY;
        event.preventDefault();
    }

    /**
     * @param {TouchEvent} event
     * @private
     */
    _onTouchStart(event) {
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
        if (window.cordova || window.navigator.standalone) {
            event.preventDefault();
        }
    }

    /**
     * @param {TouchEvent} event
     * @private
     */
    _onTouchMove(event) {
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            const x = Graphics.pageToCanvasX(touch.pageX);
            const y = Graphics.pageToCanvasY(touch.pageY);
            this._onMove(x, y);
        }
    }

    /**
     * @param {TouchEvent} event
     * @private
     */
    _onTouchEnd(event) {
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            const x = Graphics.pageToCanvasX(touch.pageX);
            const y = Graphics.pageToCanvasY(touch.pageY);
            this._screenPressed = false;
            this._onRelease(x, y);
        }
    }

    /**
     * @param {TouchEvent} event
     * @private
     */
    _onTouchCancel(_event) {
        this._screenPressed = false;
    }

    /**
     * @param {PointerEvent} event
     * @private
     */
    _onPointerDown(event) {
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

    /**
     * @private
     */
    _onLostFocus() {
        this.clear();
    }

    /**
     * @param {Number} x
     * @param {Number} y
     * @private
     */
    _onTrigger(x, y) {
        this._events.triggered = true;
        this._x = x;
        this._y = y;
        this._date = Date.now();
    }

    /**
     * @param {Number} x
     * @param {Number} y
     * @private
     */
    _onCancel(x, y) {
        this._events.cancelled = true;
        this._x = x;
        this._y = y;
    }

    /**
     * @param {Number} x
     * @param {Number} y
     * @private
     */
    _onMove(x, y) {
        this._events.moved = true;
        this._x = x;
        this._y = y;
    }

    /**
     * @param {Number} x
     * @param {Number} y
     * @private
     */
    _onRelease(x, y) {
        this._events.released = true;
        this._x = x;
        this._y = y;
    }
})();

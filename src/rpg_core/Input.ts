import { ResourceHandler } from './ResourceHandler';

export type InputKey =
    | 'tab'
    | 'ok'
    | 'shift'
    | 'control'
    | 'escape'
    | 'pageup'
    | 'pagedown'
    | 'left'
    | 'up'
    | 'right'
    | 'down'
    | 'debug'
    | 'cancel'
    | 'menu';

type KeyMapper = Record<number, InputKey>;

/**
 * The static class that handles input data from the keyboard and gamepads.
 */
export const Input = new (class Input {
    private _currentState: Record<string, boolean>;
    private _previousState: Record<string, boolean>;
    private _gamepadStates: unknown[][];
    private _latestButton?: string;
    private _pressedTime: number;
    private _dir4: number;
    private _dir8: number;
    private _preferredAxis: string;
    private _date: number;

    /**
     * Initializes the input system.
     */
    constructor() {
        this.clear();
        this._setupEventHandlers();
    }

    /**
     * The wait time of the key repeat in frames.
     */
    keyRepeatWait = 24;

    /**
     * The interval of the key repeat in frames.
     */
    keyRepeatInterval = 6;

    /**
     * A hash table to convert from a virtual key code to a mapped key name.
     */
    readonly keyMapper: KeyMapper = {
        9: 'tab', // tab
        13: 'ok', // enter
        16: 'shift', // shift
        17: 'control', // control
        18: 'control', // alt
        27: 'escape', // escape
        32: 'ok', // space
        33: 'pageup', // pageup
        34: 'pagedown', // pagedown
        37: 'left', // left arrow
        38: 'up', // up arrow
        39: 'right', // right arrow
        40: 'down', // down arrow
        45: 'escape', // insert
        81: 'pageup', // Q
        87: 'pagedown', // W
        88: 'escape', // X
        90: 'ok', // Z
        96: 'escape', // numpad 0
        98: 'down', // numpad 2
        100: 'left', // numpad 4
        102: 'right', // numpad 6
        104: 'up', // numpad 8
        120: 'debug', // F9
    };

    /**
     * A hash table to convert from a gamepad button to a mapped key name.
     */
    readonly gamepadMapper: KeyMapper = {
        0: 'ok', // A
        1: 'cancel', // B
        2: 'shift', // X
        3: 'menu', // Y
        4: 'pageup', // LB
        5: 'pagedown', // RB
        12: 'up', // D-pad up
        13: 'down', // D-pad down
        14: 'left', // D-pad left
        15: 'right', // D-pad right
    };

    /**
     * Clears all the input data.
     */
    clear(): void {
        this._currentState = {};
        this._previousState = {};
        this._gamepadStates = [];
        this._latestButton = null;
        this._pressedTime = 0;
        this._dir4 = 0;
        this._dir8 = 0;
        this._preferredAxis = '';
        this._date = 0;
    }

    /**
     * Updates the input data.
     */
    update(): void {
        this._pollGamepads();
        if (this._currentState[this._latestButton]) {
            this._pressedTime++;
        } else {
            this._latestButton = null;
        }
        for (const name in this._currentState) {
            if (this._currentState[name] && !this._previousState[name]) {
                this._latestButton = name;
                this._pressedTime = 0;
                this._date = Date.now();
            }
            this._previousState[name] = this._currentState[name];
        }
        this._updateDirection();
    }

    /**
     * Checks whether a key is currently pressed down.
     */
    isPressed(keyName: InputKey): boolean {
        if (this._isEscapeCompatible(keyName) && this.isPressed('escape')) {
            return true;
        } else {
            return !!this._currentState[keyName];
        }
    }

    /**
     * Checks whether a key is just pressed.
     */
    isTriggered(keyName: InputKey): boolean {
        if (this._isEscapeCompatible(keyName) && this.isTriggered('escape')) {
            return true;
        } else {
            return this._latestButton === keyName && this._pressedTime === 0;
        }
    }

    /**
     * Checks whether a key is just pressed or a key repeat occurred.
     */
    isRepeated(keyName: InputKey): boolean {
        if (this._isEscapeCompatible(keyName) && this.isRepeated('escape')) {
            return true;
        } else {
            return (
                this._latestButton === keyName &&
                (this._pressedTime === 0 ||
                    (this._pressedTime >= this.keyRepeatWait && this._pressedTime % this.keyRepeatInterval === 0))
            );
        }
    }

    /**
     * Checks whether a key is kept depressed.
     */
    isLongPressed(keyName: InputKey): boolean {
        if (this._isEscapeCompatible(keyName) && this.isLongPressed('escape')) {
            return true;
        } else {
            return this._latestButton === keyName && this._pressedTime >= this.keyRepeatWait;
        }
    }

    /**
     * [read-only] The four direction value as a number of the numpad, or 0 for neutral.
     */
    get dir4(): number {
        return this._dir4;
    }

    /**
     * [read-only] The eight direction value as a number of the numpad, or 0 for neutral.
     */
    get dir8(): number {
        return this._dir8;
    }

    /**
     * [read-only] The time of the last input in milliseconds.
     */
    get date(): number {
        return this._date;
    }

    private _setupEventHandlers(): void {
        document.addEventListener('keydown', this._onKeyDown.bind(this));
        document.addEventListener('keyup', this._onKeyUp.bind(this));
        window.addEventListener('blur', this._onLostFocus.bind(this));
    }

    private _onKeyDown(event: KeyboardEvent): void {
        if (this._shouldPreventDefault(event.keyCode)) {
            event.preventDefault();
        }
        if (event.keyCode === 144) {
            // Numlock
            this.clear();
        }
        const buttonName = this.keyMapper[event.keyCode];
        if (ResourceHandler.exists() && buttonName === 'ok') {
            ResourceHandler.retry();
        } else if (buttonName) {
            this._currentState[buttonName] = true;
        }
    }

    private _shouldPreventDefault(keyCode: number): boolean {
        switch (keyCode) {
            case 8: // backspace
            case 33: // pageup
            case 34: // pagedown
            case 37: // left arrow
            case 38: // up arrow
            case 39: // right arrow
            case 40: // down arrow
                return true;
        }
        return false;
    }

    private _onKeyUp(event: KeyboardEvent): void {
        const buttonName = this.keyMapper[event.keyCode];
        if (buttonName) {
            this._currentState[buttonName] = false;
        }
        if (event.keyCode === 0) {
            // For QtWebEngine on OS X
            this.clear();
        }
    }

    private _onLostFocus(): void {
        this.clear();
    }

    private _pollGamepads(): void {
        if (navigator.getGamepads) {
            const gamepads = navigator.getGamepads();
            if (gamepads) {
                for (let i = 0; i < gamepads.length; i++) {
                    const gamepad = gamepads[i];
                    if (gamepad && gamepad.connected) {
                        this._updateGamepadState(gamepad);
                    }
                }
            }
        }
    }

    private _updateGamepadState(gamepad: Gamepad): void {
        const lastState = this._gamepadStates[gamepad.index] || [];
        const newState = [];
        const buttons = gamepad.buttons;
        const axes = gamepad.axes;
        const threshold = 0.5;
        newState[12] = false;
        newState[13] = false;
        newState[14] = false;
        newState[15] = false;
        for (let i = 0; i < buttons.length; i++) {
            newState[i] = buttons[i].pressed;
        }
        if (axes[1] < -threshold) {
            newState[12] = true; // up
        } else if (axes[1] > threshold) {
            newState[13] = true; // down
        }
        if (axes[0] < -threshold) {
            newState[14] = true; // left
        } else if (axes[0] > threshold) {
            newState[15] = true; // right
        }
        for (let j = 0; j < newState.length; j++) {
            if (newState[j] !== lastState[j]) {
                const buttonName = this.gamepadMapper[j];
                if (buttonName) {
                    this._currentState[buttonName] = newState[j];
                }
            }
        }
        this._gamepadStates[gamepad.index] = newState;
    }

    private _updateDirection(): void {
        let x = this._signX();
        let y = this._signY();

        this._dir8 = this._makeNumpadDirection(x, y);

        if (x !== 0 && y !== 0) {
            if (this._preferredAxis === 'x') {
                y = 0;
            } else {
                x = 0;
            }
        } else if (x !== 0) {
            this._preferredAxis = 'y';
        } else if (y !== 0) {
            this._preferredAxis = 'x';
        }

        this._dir4 = this._makeNumpadDirection(x, y);
    }

    private _signX(): number {
        let x = 0;

        if (this.isPressed('left')) {
            x--;
        }
        if (this.isPressed('right')) {
            x++;
        }
        return x;
    }

    private _signY(): number {
        let y = 0;

        if (this.isPressed('up')) {
            y--;
        }
        if (this.isPressed('down')) {
            y++;
        }
        return y;
    }

    private _makeNumpadDirection(x: number, y: number): number {
        if (x !== 0 || y !== 0) {
            return 5 - y * 3 + x;
        }
        return 0;
    }

    private _isEscapeCompatible(keyName: InputKey): boolean {
        return keyName === 'cancel' || keyName === 'menu';
    }
})();

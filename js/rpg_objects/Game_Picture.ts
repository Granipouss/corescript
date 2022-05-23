import { arrayClone, Tone } from '../rpg_core/extension';

/**
 * The game object class for a picture.
 */
export class Game_Picture {
    private _name: string;
    private _origin: number;
    private _x: number;
    private _y: number;
    private _scaleX: number;
    private _scaleY: number;
    private _opacity: number;
    private _blendMode: number;
    private _tone: Tone;
    private _angle: number;
    private _targetX: number;
    private _targetY: number;
    private _targetScaleX: number;
    private _targetScaleY: number;
    private _targetOpacity: number;
    private _duration: number;
    private _toneTarget: Tone;
    private _toneDuration: number;
    private _rotationSpeed: number;

    constructor() {
        this.initBasic();
        this.initTarget();
        this.initTone();
        this.initRotation();
    }

    name(): string {
        return this._name;
    }

    origin(): number {
        return this._origin;
    }

    x(): number {
        return this._x;
    }

    y(): number {
        return this._y;
    }

    scaleX(): number {
        return this._scaleX;
    }

    scaleY(): number {
        return this._scaleY;
    }

    opacity(): number {
        return this._opacity;
    }

    blendMode(): number {
        return this._blendMode;
    }

    tone(): Tone {
        return this._tone;
    }

    angle(): number {
        return this._angle;
    }

    initBasic(): void {
        this._name = '';
        this._origin = 0;
        this._x = 0;
        this._y = 0;
        this._scaleX = 100;
        this._scaleY = 100;
        this._opacity = 255;
        this._blendMode = 0;
    }

    initTarget(): void {
        this._targetX = this._x;
        this._targetY = this._y;
        this._targetScaleX = this._scaleX;
        this._targetScaleY = this._scaleY;
        this._targetOpacity = this._opacity;
        this._duration = 0;
    }

    initTone(): void {
        this._tone = null;
        this._toneTarget = null;
        this._toneDuration = 0;
    }

    initRotation(): void {
        this._angle = 0;
        this._rotationSpeed = 0;
    }

    show(
        name: string,
        origin: number,
        x: number,
        y: number,
        scaleX: number,
        scaleY: number,
        opacity: number,
        blendMode: number
    ): void {
        this._name = name;
        this._origin = origin;
        this._x = x;
        this._y = y;
        this._scaleX = scaleX;
        this._scaleY = scaleY;
        this._opacity = opacity;
        this._blendMode = blendMode;
        this.initTarget();
        this.initTone();
        this.initRotation();
    }

    move(
        origin: number,
        x: number,
        y: number,
        scaleX: number,
        scaleY: number,
        opacity: number,
        blendMode: number,
        duration: number
    ): void {
        this._origin = origin;
        this._targetX = x;
        this._targetY = y;
        this._targetScaleX = scaleX;
        this._targetScaleY = scaleY;
        this._targetOpacity = opacity;
        this._blendMode = blendMode;
        this._duration = duration;
    }

    rotate(speed: number): void {
        this._rotationSpeed = speed;
    }

    tint(tone: Tone, duration: number): void {
        if (!this._tone) {
            this._tone = [0, 0, 0, 0];
        }
        this._toneTarget = arrayClone(tone);
        this._toneDuration = duration;
        if (this._toneDuration === 0) {
            this._tone = arrayClone(this._toneTarget);
        }
    }

    erase(): void {
        this._name = '';
        this._origin = 0;
        this.initTarget();
        this.initTone();
        this.initRotation();
    }

    update(): void {
        this.updateMove();
        this.updateTone();
        this.updateRotation();
    }

    updateMove(): void {
        if (this._duration > 0) {
            const d = this._duration;
            this._x = (this._x * (d - 1) + this._targetX) / d;
            this._y = (this._y * (d - 1) + this._targetY) / d;
            this._scaleX = (this._scaleX * (d - 1) + this._targetScaleX) / d;
            this._scaleY = (this._scaleY * (d - 1) + this._targetScaleY) / d;
            this._opacity = (this._opacity * (d - 1) + this._targetOpacity) / d;
            this._duration--;
        }
    }

    updateTone(): void {
        if (this._toneDuration > 0) {
            const d = this._toneDuration;
            for (let i = 0; i < 4; i++) {
                this._tone[i] = (this._tone[i] * (d - 1) + this._toneTarget[i]) / d;
            }
            this._toneDuration--;
        }
    }

    updateRotation(): void {
        if (this._rotationSpeed !== 0) {
            this._angle += this._rotationSpeed / 2;
        }
    }
}

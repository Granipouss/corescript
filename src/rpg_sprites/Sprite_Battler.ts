import type { Game_Battler } from '../rpg_objects/Game_Battler';
import { Sprite_Base } from './Sprite_Base';
import { Sprite_Damage } from './Sprite_Damage';

/**
 * The superclass of Sprite_Actor and Sprite_Enemy.
 */
export class Sprite_Battler extends Sprite_Base {
    protected _battler: Game_Battler;
    protected _damages: Sprite_Damage[];
    protected _homeX: number;
    protected _homeY: number;
    protected _offsetX: number;
    protected _offsetY: number;
    protected _targetOffsetX: number;
    protected _targetOffsetY: number;
    protected _movementDuration: number;
    protected _selectionEffectCount: number;

    constructor(battler: Game_Battler) {
        super();

        this.initMembers();
        this.setBattler(battler);
    }

    initMembers(): void {
        this.anchor.x = 0.5;
        this.anchor.y = 1;
        this._battler = null;
        this._damages = [];
        this._homeX = 0;
        this._homeY = 0;
        this._offsetX = 0;
        this._offsetY = 0;
        this._targetOffsetX = NaN;
        this._targetOffsetY = NaN;
        this._movementDuration = 0;
        this._selectionEffectCount = 0;
    }

    setBattler(battler: Game_Battler): void {
        this._battler = battler;
    }

    setHome(x: number, y: number): void {
        this._homeX = x;
        this._homeY = y;
        this.updatePosition();
    }

    update(): void {
        super.update();
        if (this._battler) {
            this.updateMain();
            this.updateAnimation();
            this.updateDamagePopup();
            this.updateSelectionEffect();
        } else {
            this.bitmap = null;
        }
    }

    updateVisibility(): void {
        super.updateVisibility();
        if (!this._battler || !this._battler.isSpriteVisible()) {
            this.visible = false;
        }
    }

    updateMain(): void {
        if (this._battler.isSpriteVisible()) {
            this.updateBitmap();
            this.updateFrame();
        }
        this.updateMove();
        this.updatePosition();
    }

    updateBitmap(): void {
        // ...
    }

    updateFrame(): void {
        // ...
    }

    updateMove(): void {
        if (this._movementDuration > 0) {
            const d = this._movementDuration;
            this._offsetX = (this._offsetX * (d - 1) + this._targetOffsetX) / d;
            this._offsetY = (this._offsetY * (d - 1) + this._targetOffsetY) / d;
            this._movementDuration--;
            if (this._movementDuration === 0) {
                this.onMoveEnd();
            }
        }
    }

    updatePosition(): void {
        this.x = this._homeX + this._offsetX;
        this.y = this._homeY + this._offsetY;
    }

    updateAnimation(): void {
        this.setupAnimation();
    }

    updateDamagePopup(): void {
        this.setupDamagePopup();
        if (this._damages.length > 0) {
            for (let i = 0; i < this._damages.length; i++) {
                this._damages[i].update();
            }
            if (!this._damages[0].isPlaying()) {
                this.parent.removeChild(this._damages[0]);
                this._damages.shift();
            }
        }
    }

    updateSelectionEffect(): void {
        const target = this._effectTarget;
        if (this._battler.isSelected()) {
            this._selectionEffectCount++;
            if (this._selectionEffectCount % 30 < 15) {
                target.setBlendColor([255, 255, 255, 64]);
            } else {
                target.setBlendColor([0, 0, 0, 0]);
            }
        } else if (this._selectionEffectCount > 0) {
            this._selectionEffectCount = 0;
            target.setBlendColor([0, 0, 0, 0]);
        }
    }

    setupAnimation(): void {
        while (this._battler.isAnimationRequested()) {
            const data = this._battler.shiftAnimation();
            const animation = window.$dataAnimations[data.animationId];
            const mirror = data.mirror;
            const delay = animation.position === 3 ? 0 : data.delay;
            this.startAnimation(animation, mirror, delay);
            for (let i = 0; i < this._animationSprites.length; i++) {
                const sprite = this._animationSprites[i];
                sprite.visible = this._battler.isSpriteVisible();
            }
        }
    }

    setupDamagePopup(): void {
        if (this._battler.isDamagePopupRequested()) {
            if (this._battler.isSpriteVisible()) {
                const sprite = new Sprite_Damage();
                sprite.x = this.x + this.damageOffsetX();
                sprite.y = this.y + this.damageOffsetY();
                sprite.setup(this._battler);
                this._damages.push(sprite);
                this.parent.addChild(sprite);
            }
            this._battler.clearDamagePopup();
            this._battler.clearResult();
        }
    }

    damageOffsetX(): number {
        return 0;
    }

    damageOffsetY(): number {
        return 0;
    }

    startMove(x: number, y: number, duration: number): void {
        if (this._targetOffsetX !== x || this._targetOffsetY !== y) {
            this._targetOffsetX = x;
            this._targetOffsetY = y;
            this._movementDuration = duration;
            if (duration === 0) {
                this._offsetX = x;
                this._offsetY = y;
            }
        }
    }

    onMoveEnd(): void {
        // ...
    }

    isEffecting(): boolean {
        return false;
    }

    isMoving(): boolean {
        return this._movementDuration > 0;
    }

    inHomePosition(): boolean {
        return this._offsetX === 0 && this._offsetY === 0;
    }
}

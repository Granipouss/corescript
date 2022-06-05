import type { Bitmap } from '../rpg_core/Bitmap';
import type { Tone } from '../rpg_core/extension';
import { Sprite } from '../rpg_core/Sprite';
import { ImageManager } from '../rpg_managers/ImageManager';
import type { Game_Battler } from '../rpg_objects/Game_Battler';

type ExtendedSprite = Sprite & { dy?: number; ry?: number };

/**
 * The sprite for displaying a popup damage.
 */
export class Sprite_Damage extends Sprite {
    protected _duration: number;
    protected _flashColor: Tone;
    protected _flashDuration: number;
    protected _damageBitmap: Bitmap;

    constructor() {
        super();
        this._duration = 90;
        this._flashColor = [0, 0, 0, 0];
        this._flashDuration = 0;
        this._damageBitmap = ImageManager.loadSystem('Damage');
    }

    setup(target: Game_Battler): void {
        const result = target.result();
        if (result.missed || result.evaded) {
            this.createMiss();
        } else if (result.hpAffected) {
            this.createDigits(0, result.hpDamage);
        } else if (target.isAlive() && result.mpDamage !== 0) {
            this.createDigits(2, result.mpDamage);
        }
        if (result.critical) {
            this.setupCriticalEffect();
        }
    }

    setupCriticalEffect(): void {
        this._flashColor = [255, 0, 0, 160];
        this._flashDuration = 60;
    }

    digitWidth(): number {
        return this._damageBitmap ? this._damageBitmap.width / 10 : 0;
    }

    digitHeight(): number {
        return this._damageBitmap ? this._damageBitmap.height / 5 : 0;
    }

    createMiss(): void {
        const w = this.digitWidth();
        const h = this.digitHeight();
        const sprite = this.createChildSprite() as ExtendedSprite;
        sprite.setFrame(0, 4 * h, 4 * w, h);
        sprite.dy = 0;
    }

    createDigits(baseRow: number, value: number): void {
        const string = Math.abs(value).toString();
        const row = baseRow + (value < 0 ? 1 : 0);
        const w = this.digitWidth();
        const h = this.digitHeight();
        for (let i = 0; i < string.length; i++) {
            const sprite = this.createChildSprite() as ExtendedSprite;
            const n = Number(string[i]);
            sprite.setFrame(n * w, row * h, w, h);
            sprite.x = (i - (string.length - 1) / 2) * w;
            sprite.dy = -i;
        }
    }

    createChildSprite(): Sprite {
        const sprite = new Sprite() as ExtendedSprite;
        sprite.bitmap = this._damageBitmap;
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 1;
        sprite.y = -40;
        sprite.ry = sprite.y;
        this.addChild(sprite);
        return sprite;
    }

    update(): void {
        super.update();
        if (this._duration > 0) {
            this._duration--;
            for (let i = 0; i < this.children.length; i++) {
                this.updateChild(this.children[i] as ExtendedSprite);
            }
        }
        this.updateFlash();
        this.updateOpacity();
    }

    updateChild(sprite: ExtendedSprite): void {
        sprite.dy += 0.5;
        sprite.ry += sprite.dy;
        if (sprite.ry >= 0) {
            sprite.ry = 0;
            sprite.dy *= -0.6;
        }
        sprite.y = Math.round(sprite.ry);
        sprite.setBlendColor(this._flashColor);
    }

    updateFlash(): void {
        if (this._flashDuration > 0) {
            const d = this._flashDuration--;
            this._flashColor[3] *= (d - 1) / d;
        }
    }

    updateOpacity(): void {
        if (this._duration < 10) {
            this.opacity = (255 * this._duration) / 10;
        }
    }

    isPlaying(): boolean {
        return this._duration > 0;
    }
}

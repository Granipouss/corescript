import { ImageManager } from '../rpg_managers/ImageManager';
import { Sprite_Base } from './Sprite_Base';

/**
 * The sprite for displaying a weapon image for attacking.
 */
export class Sprite_Weapon extends Sprite_Base {
    protected _weaponImageId: number;
    protected _animationCount: number;
    protected _pattern: number;

    constructor() {
        super();
        this.initMembers();
    }

    initMembers() {
        this._weaponImageId = 0;
        this._animationCount = 0;
        this._pattern = 0;
        this.anchor.x = 0.5;
        this.anchor.y = 1;
        this.x = -16;
    }

    setup(weaponImageId: number): void {
        this._weaponImageId = weaponImageId;
        this._animationCount = 0;
        this._pattern = 0;
        this.loadBitmap();
        this.updateFrame();
    }

    update(): void {
        super.update();
        this._animationCount++;
        if (this._animationCount >= this.animationWait()) {
            this.updatePattern();
            this.updateFrame();
            this._animationCount = 0;
        }
    }

    animationWait(): number {
        return 12;
    }

    updatePattern(): void {
        this._pattern++;
        if (this._pattern >= 3) {
            this._weaponImageId = 0;
        }
    }

    loadBitmap(): void {
        const pageId = Math.floor((this._weaponImageId - 1) / 12) + 1;
        if (pageId >= 1) {
            this.bitmap = ImageManager.loadSystem('Weapons' + pageId);
        } else {
            this.bitmap = ImageManager.loadSystem('');
        }
    }

    updateFrame(): void {
        if (this._weaponImageId > 0) {
            const index = (this._weaponImageId - 1) % 12;
            const w = 96;
            const h = 64;
            const sx = (Math.floor(index / 6) * 3 + this._pattern) * w;
            const sy = Math.floor(index % 6) * h;
            this.setFrame(sx, sy, w, h);
        } else {
            this.setFrame(0, 0, 0, 0);
        }
    }

    isPlaying(): boolean {
        return this._weaponImageId > 0;
    }
}

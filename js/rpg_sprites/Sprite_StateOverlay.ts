import { ImageManager } from '../rpg_managers/ImageManager';
import type { Game_Battler } from '../rpg_objects/Game_Battler';
import { Sprite_Base } from './Sprite_Base';

/**
 * The sprite for displaying an overlay image for a state.
 */
export class Sprite_StateOverlay extends Sprite_Base {
    protected _battler: Game_Battler;
    protected _overlayIndex: number;
    protected _animationCount: number;
    protected _pattern: number;

    constructor() {
        super();

        this.initMembers();
        this.loadBitmap();
    }

    initMembers(): void {
        this._battler = null;
        this._overlayIndex = 0;
        this._animationCount = 0;
        this._pattern = 0;
        this.anchor.x = 0.5;
        this.anchor.y = 1;
    }

    loadBitmap(): void {
        this.bitmap = ImageManager.loadSystem('States');
        this.setFrame(0, 0, 0, 0);
    }

    setup(battler: Game_Battler): void {
        this._battler = battler;
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
        return 8;
    }

    updatePattern(): void {
        this._pattern++;
        this._pattern %= 8;
        if (this._battler) {
            this._overlayIndex = this._battler.stateOverlayIndex();
        }
    }

    updateFrame(): void {
        if (this._overlayIndex > 0) {
            const w = 96;
            const h = 96;
            const sx = this._pattern * w;
            const sy = (this._overlayIndex - 1) * h;
            this.setFrame(sx, sy, w, h);
        } else {
            this.setFrame(0, 0, 0, 0);
        }
    }
}

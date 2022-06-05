import { Sprite } from '../rpg_core/Sprite';
import { ImageManager } from '../rpg_managers/ImageManager';
import type { Game_Picture } from '../rpg_objects/Game_Picture';

/**
 * The sprite for displaying a picture.
 */
export class Sprite_Picture extends Sprite {
    protected _pictureId: number;
    protected _pictureName: string;

    constructor(pictureId: number) {
        super();
        this._pictureId = pictureId;
        this._pictureName = '';
        this._isPicture = true;
        this.update();
    }

    picture(): Game_Picture {
        return window.$gameScreen.picture(this._pictureId);
    }

    update(): void {
        super.update();
        this.updateBitmap();
        if (this.visible) {
            this.updateOrigin();
            this.updatePosition();
            this.updateScale();
            this.updateTone();
            this.updateOther();
        }
    }

    updateBitmap(): void {
        const picture = this.picture();
        if (picture) {
            const pictureName = picture.name();
            if (this._pictureName !== pictureName) {
                this._pictureName = pictureName;
                this.loadBitmap();
            }
            this.visible = true;
        } else {
            this._pictureName = '';
            this.bitmap = null;
            this.visible = false;
        }
    }

    updateOrigin(): void {
        const picture = this.picture();
        if (picture.origin() === 0) {
            this.anchor.x = 0;
            this.anchor.y = 0;
        } else {
            this.anchor.x = 0.5;
            this.anchor.y = 0.5;
        }
    }

    updatePosition(): void {
        const picture = this.picture();
        this.x = Math.floor(picture.x());
        this.y = Math.floor(picture.y());
    }

    updateScale(): void {
        const picture = this.picture();
        this.scale.x = picture.scaleX() / 100;
        this.scale.y = picture.scaleY() / 100;
    }

    updateTone(): void {
        const picture = this.picture();
        if (picture.tone()) {
            this.setColorTone(picture.tone());
        } else {
            this.setColorTone([0, 0, 0, 0]);
        }
    }

    updateOther(): void {
        const picture = this.picture();
        this.opacity = picture.opacity();
        this.blendMode = picture.blendMode();
        this.rotation = (picture.angle() * Math.PI) / 180;
    }

    loadBitmap(): void {
        this.bitmap = ImageManager.loadPicture(this._pictureName);
    }
}

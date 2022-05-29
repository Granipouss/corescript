import type { Bitmap } from '../rpg_core/Bitmap';
import { Sprite } from '../rpg_core/Sprite';
import { ImageManager } from '../rpg_managers/ImageManager';
import type { Game_Character } from '../rpg_objects/Game_Character';
import { Sprite_Balloon } from './Sprite_Balloon';
import { Sprite_Base } from './Sprite_Base';

/**
 * The sprite for displaying a character.
 */
export class Sprite_Character extends Sprite_Base {
    protected _character: Game_Character;
    protected _balloonDuration: number;
    protected _tilesetId: number;
    protected _upperBody: Sprite;
    protected _lowerBody: Sprite;
    protected _tileId: number;
    protected _characterName: string;
    protected _characterIndex: number;
    protected _isBigCharacter: boolean;
    protected _bushDepth: number;
    protected _balloonSprite: Sprite_Balloon;

    constructor(character: Game_Character) {
        super();

        this.initMembers();
        this.setCharacter(character);
    }

    initMembers(): void {
        this.anchor.x = 0.5;
        this.anchor.y = 1;
        this._character = null;
        this._balloonDuration = 0;
        this._tilesetId = 0;
        this._upperBody = null;
        this._lowerBody = null;
    }

    setCharacter(character: Game_Character): void {
        this._character = character;
    }

    update(): void {
        super.update();
        this.updateBitmap();
        this.updateFrame();
        this.updatePosition();
        this.updateAnimation();
        this.updateBalloon();
        this.updateOther();
    }

    updateVisibility(): void {
        super.updateVisibility();
        if (this._character.isTransparent()) {
            this.visible = false;
        }
    }

    isTile(): boolean {
        return this._character.tileId() > 0;
    }

    tilesetBitmap(tileId: number): Bitmap {
        const tileset = window.$gameMap.tileset();
        const setNumber = 5 + Math.floor(tileId / 256);
        return ImageManager.loadTileset(tileset.tilesetNames[setNumber]);
    }

    updateBitmap(): void {
        if (this.isImageChanged()) {
            this._tilesetId = window.$gameMap.tilesetId();
            this._tileId = this._character.tileId();
            this._characterName = this._character.characterName();
            this._characterIndex = this._character.characterIndex();
            if (this._tileId > 0) {
                this.setTileBitmap();
            } else {
                this.setCharacterBitmap();
            }
        }
    }

    isImageChanged(): boolean {
        return (
            this._tilesetId !== window.$gameMap.tilesetId() ||
            this._tileId !== this._character.tileId() ||
            this._characterName !== this._character.characterName() ||
            this._characterIndex !== this._character.characterIndex()
        );
    }

    setTileBitmap(): void {
        this.bitmap = this.tilesetBitmap(this._tileId);
    }

    setCharacterBitmap(): void {
        this.bitmap = ImageManager.loadCharacter(this._characterName);
        this._isBigCharacter = ImageManager.isBigCharacter(this._characterName);
    }

    updateFrame(): void {
        if (this._tileId > 0) {
            this.updateTileFrame();
        } else {
            this.updateCharacterFrame();
        }
    }

    updateTileFrame(): void {
        const pw = this.patternWidth();
        const ph = this.patternHeight();
        const sx = ((Math.floor(this._tileId / 128) % 2) * 8 + (this._tileId % 8)) * pw;
        const sy = (Math.floor((this._tileId % 256) / 8) % 16) * ph;
        this.setFrame(sx, sy, pw, ph);
    }

    updateCharacterFrame(): void {
        const pw = this.patternWidth();
        const ph = this.patternHeight();
        const sx = (this.characterBlockX() + this.characterPatternX()) * pw;
        const sy = (this.characterBlockY() + this.characterPatternY()) * ph;
        this.updateHalfBodySprites();
        if (this._bushDepth > 0) {
            const d = this._bushDepth;
            this._upperBody.setFrame(sx, sy, pw, ph - d);
            this._lowerBody.setFrame(sx, sy + ph - d, pw, d);
            this.setFrame(sx, sy, 0, ph);
        } else {
            this.setFrame(sx, sy, pw, ph);
        }
    }

    characterBlockX(): number {
        if (this._isBigCharacter) {
            return 0;
        } else {
            const index = this._character.characterIndex();
            return (index % 4) * 3;
        }
    }

    characterBlockY(): number {
        if (this._isBigCharacter) {
            return 0;
        } else {
            const index = this._character.characterIndex();
            return Math.floor(index / 4) * 4;
        }
    }

    characterPatternX(): number {
        return this._character.pattern();
    }

    characterPatternY(): number {
        return (this._character.direction() - 2) / 2;
    }

    patternWidth(): number {
        if (this._tileId > 0) {
            return window.$gameMap.tileWidth();
        } else if (this._isBigCharacter) {
            return this.bitmap.width / 3;
        } else {
            return this.bitmap.width / 12;
        }
    }

    patternHeight(): number {
        if (this._tileId > 0) {
            return window.$gameMap.tileHeight();
        } else if (this._isBigCharacter) {
            return this.bitmap.height / 4;
        } else {
            return this.bitmap.height / 8;
        }
    }

    updateHalfBodySprites(): void {
        if (this._bushDepth > 0) {
            this.createHalfBodySprites();
            this._upperBody.bitmap = this.bitmap;
            this._upperBody.visible = true;
            this._upperBody.y = -this._bushDepth;
            this._lowerBody.bitmap = this.bitmap;
            this._lowerBody.visible = true;
            this._upperBody.setBlendColor(this.getBlendColor());
            this._lowerBody.setBlendColor(this.getBlendColor());
            this._upperBody.setColorTone(this.getColorTone());
            this._lowerBody.setColorTone(this.getColorTone());
        } else if (this._upperBody) {
            this._upperBody.visible = false;
            this._lowerBody.visible = false;
        }
    }

    createHalfBodySprites(): void {
        if (!this._upperBody) {
            this._upperBody = new Sprite();
            this._upperBody.anchor.x = 0.5;
            this._upperBody.anchor.y = 1;
            this.addChild(this._upperBody);
        }
        if (!this._lowerBody) {
            this._lowerBody = new Sprite();
            this._lowerBody.anchor.x = 0.5;
            this._lowerBody.anchor.y = 1;
            this._lowerBody.opacity = 128;
            this.addChild(this._lowerBody);
        }
    }

    updatePosition(): void {
        this.x = this._character.screenX();
        this.y = this._character.screenY();
        this.z = this._character.screenZ();
    }

    updateAnimation(): void {
        this.setupAnimation();
        if (!this.isAnimationPlaying()) {
            this._character.endAnimation();
        }
        if (!this.isBalloonPlaying()) {
            this._character.endBalloon();
        }
    }

    updateOther(): void {
        this.opacity = this._character.opacity();
        this.blendMode = this._character.blendMode();
        this._bushDepth = this._character.bushDepth();
    }

    setupAnimation(): void {
        if (this._character.animationId() > 0) {
            const animation = window.$dataAnimations[this._character.animationId()];
            this.startAnimation(animation, false, 0);
            this._character.startAnimation();
        }
    }

    setupBalloon(): void {
        if (this._character.balloonId() > 0) {
            this.startBalloon();
            this._character.startBalloon();
        }
    }

    startBalloon(): void {
        if (!this._balloonSprite) {
            this._balloonSprite = new Sprite_Balloon();
        }
        this._balloonSprite.setup(this._character.balloonId());
        this.parent.addChild(this._balloonSprite);
    }

    updateBalloon(): void {
        this.setupBalloon();
        if (this._balloonSprite) {
            this._balloonSprite.x = this.x;
            this._balloonSprite.y = this.y - this.height;
            if (!this._balloonSprite.isPlaying()) {
                this.endBalloon();
            }
        }
    }

    endBalloon(): void {
        if (this._balloonSprite) {
            this.parent.removeChild(this._balloonSprite);
            this._balloonSprite = null;
        }
    }

    isBalloonPlaying(): boolean {
        return !!this._balloonSprite;
    }
}

import type { Bitmap } from '../rpg_core/Bitmap';
import { Graphics } from '../rpg_core/Graphics';
import { Sprite } from '../rpg_core/Sprite';
import { TilingSprite } from '../rpg_core/TilingSprite';
import { BattleManager } from '../rpg_managers/BattleManager';
import { ImageManager } from '../rpg_managers/ImageManager';
import { SceneManager } from '../rpg_managers/SceneManager';
import { Spriteset_Base } from './Spriteset_Base';
import { Sprite_Actor } from './Sprite_Actor';
import type { Sprite_Battler } from './Sprite_Battler';
import { Sprite_Enemy } from './Sprite_Enemy';

/**
 * The set of sprites on the battle screen.
 */
export class Spriteset_Battle extends Spriteset_Base {
    protected _battlebackLocated: boolean;
    protected _backgroundSprite: Sprite;
    protected _battleField: Sprite;
    protected _back1Sprite: TilingSprite;
    protected _back2Sprite: TilingSprite;
    protected _enemySprites: Sprite_Battler[];
    protected _actorSprites: Sprite_Battler[];

    constructor() {
        super();
        this._battlebackLocated = false;
    }

    createLowerLayer(): void {
        super.createLowerLayer();
        this.createBackground();
        this.createBattleField();
        this.createBattleback();
        this.createEnemies();
        this.createActors();
    }

    createBackground(): void {
        this._backgroundSprite = new Sprite();
        this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
        this._baseSprite.addChild(this._backgroundSprite);
    }

    update(): void {
        super.update();
        this.updateActors();
        this.updateBattleback();
    }

    createBattleField(): void {
        const width = Graphics.boxWidth;
        const height = Graphics.boxHeight;
        const x = (Graphics.width - width) / 2;
        const y = (Graphics.height - height) / 2;
        this._battleField = new Sprite();
        this._battleField.setFrame(x, y, width, height);
        this._battleField.x = x;
        this._battleField.y = y;
        this._baseSprite.addChild(this._battleField);
    }

    createBattleback(): void {
        const margin = 32;
        const x = -this._battleField.x - margin;
        const y = -this._battleField.y - margin;
        const width = Graphics.width + margin * 2;
        const height = Graphics.height + margin * 2;
        this._back1Sprite = new TilingSprite();
        this._back2Sprite = new TilingSprite();
        this._back1Sprite.bitmap = this.battleback1Bitmap();
        this._back2Sprite.bitmap = this.battleback2Bitmap();
        this._back1Sprite.move(x, y, width, height);
        this._back2Sprite.move(x, y, width, height);
        this._battleField.addChild(this._back1Sprite);
        this._battleField.addChild(this._back2Sprite);
    }

    updateBattleback(): void {
        if (!this._battlebackLocated) {
            this.locateBattleback();
            this._battlebackLocated = true;
        }
    }

    locateBattleback(): void {
        const width = this._battleField.width;
        const height = this._battleField.height;
        const sprite1 = this._back1Sprite;
        const sprite2 = this._back2Sprite;
        sprite1.origin.x = sprite1.x + (sprite1.bitmap.width - width) / 2;
        sprite2.origin.x = sprite1.y + (sprite2.bitmap.width - width) / 2;
        if (window.$gameSystem.isSideView()) {
            sprite1.origin.y = sprite1.x + sprite1.bitmap.height - height;
            sprite2.origin.y = sprite1.y + sprite2.bitmap.height - height;
        }
    }

    battleback1Bitmap(): Bitmap {
        return ImageManager.loadBattleback1(this.battleback1Name());
    }

    battleback2Bitmap(): Bitmap {
        return ImageManager.loadBattleback2(this.battleback2Name());
    }

    battleback1Name(): string {
        if (BattleManager.isBattleTest()) {
            return window.$dataSystem.battleback1Name;
        } else if (window.$gameMap.battleback1Name()) {
            return window.$gameMap.battleback1Name();
        } else if (window.$gameMap.isOverworld()) {
            return this.overworldBattleback1Name();
        } else {
            return '';
        }
    }

    battleback2Name(): string {
        if (BattleManager.isBattleTest()) {
            return window.$dataSystem.battleback2Name;
        } else if (window.$gameMap.battleback2Name()) {
            return window.$gameMap.battleback2Name();
        } else if (window.$gameMap.isOverworld()) {
            return this.overworldBattleback2Name();
        } else {
            return '';
        }
    }

    overworldBattleback1Name(): string {
        if (window.$gameMap.battleback1Name() === '') return '';
        if (window.$gamePlayer.isInVehicle()) {
            return this.shipBattleback1Name();
        } else {
            return this.normalBattleback1Name();
        }
    }

    overworldBattleback2Name(): string {
        if (window.$gameMap.battleback2Name() === '') return '';
        if (window.$gamePlayer.isInVehicle()) {
            return this.shipBattleback2Name();
        } else {
            return this.normalBattleback2Name();
        }
    }

    normalBattleback1Name(): string {
        return (
            this.terrainBattleback1Name(this.autotileType(1)) ||
            this.terrainBattleback1Name(this.autotileType(0)) ||
            this.defaultBattleback1Name()
        );
    }

    normalBattleback2Name(): string {
        return (
            this.terrainBattleback2Name(this.autotileType(1)) ||
            this.terrainBattleback2Name(this.autotileType(0)) ||
            this.defaultBattleback2Name()
        );
    }

    terrainBattleback1Name(type: number): string {
        switch (type) {
            case 24:
            case 25:
                return 'Wasteland';
            case 26:
            case 27:
                return 'DirtField';
            case 32:
            case 33:
                return 'Desert';
            case 34:
                return 'Lava1';
            case 35:
                return 'Lava2';
            case 40:
            case 41:
                return 'Snowfield';
            case 42:
                return 'Clouds';
            case 4:
            case 5:
                return 'PoisonSwamp';
            default:
                return null;
        }
    }

    terrainBattleback2Name(type: number): string {
        switch (type) {
            case 20:
            case 21:
                return 'Forest';
            case 22:
            case 30:
            case 38:
                return 'Cliff';
            case 24:
            case 25:
            case 26:
            case 27:
                return 'Wasteland';
            case 32:
            case 33:
                return 'Desert';
            case 34:
            case 35:
                return 'Lava';
            case 40:
            case 41:
                return 'Snowfield';
            case 42:
                return 'Clouds';
            case 4:
            case 5:
                return 'PoisonSwamp';
        }
    }

    defaultBattleback1Name(): string {
        return 'Grassland';
    }

    defaultBattleback2Name(): string {
        return 'Grassland';
    }

    shipBattleback1Name(): string {
        return 'Ship';
    }

    shipBattleback2Name(): string {
        return 'Ship';
    }

    autotileType(z: number): number {
        return window.$gameMap.autotileType(window.$gamePlayer.x, window.$gamePlayer.y, z);
    }

    createEnemies(): void {
        const enemies = window.$gameTroop.members();
        const sprites = [];
        for (let i = 0; i < enemies.length; i++) {
            sprites[i] = new Sprite_Enemy(enemies[i]);
        }
        sprites.sort(this.compareEnemySprite.bind(this));
        for (let j = 0; j < sprites.length; j++) {
            this._battleField.addChild(sprites[j]);
        }
        this._enemySprites = sprites;
    }

    compareEnemySprite(a: Sprite, b: Sprite): number {
        if (a.y !== b.y) {
            return a.y - b.y;
        } else {
            return b.spriteId - a.spriteId;
        }
    }

    createActors(): void {
        this._actorSprites = [];
        for (let i = 0; i < window.$gameParty.maxBattleMembers(); i++) {
            this._actorSprites[i] = new Sprite_Actor();
            this._battleField.addChild(this._actorSprites[i]);
        }
    }

    updateActors(): void {
        const members = window.$gameParty.battleMembers();
        for (let i = 0; i < this._actorSprites.length; i++) {
            this._actorSprites[i].setBattler(members[i]);
        }
    }

    battlerSprites(): Sprite_Battler[] {
        return this._enemySprites.concat(this._actorSprites);
    }

    isAnimationPlaying(): boolean {
        return this.battlerSprites().some((sprite) => sprite.isAnimationPlaying());
    }

    isEffecting(): boolean {
        return this.battlerSprites().some((sprite) => sprite.isEffecting());
    }

    isAnyoneMoving(): boolean {
        return this.battlerSprites().some((sprite) => sprite.isMoving());
    }

    isBusy(): boolean {
        return this.isAnimationPlaying() || this.isAnyoneMoving();
    }
}

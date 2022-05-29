import { CanvasTilemap } from '../rpg_core/CanvasTilemap';
import { arrayEquals } from '../rpg_core/extension';
import { Graphics } from '../rpg_core/Graphics';
import { ShaderTilemap } from '../rpg_core/ShaderTilemap';
import { Sprite } from '../rpg_core/Sprite';
import type { Tilemap } from '../rpg_core/Tilemap';
import { TilingSprite } from '../rpg_core/TilingSprite';
import { Weather } from '../rpg_core/Weather';
import { RPGTileset } from '../rpg_data/tileset';
import { ImageManager } from '../rpg_managers/ImageManager';
import { Spriteset_Base } from './Spriteset_Base';
import { Sprite_Character } from './Sprite_Character';
import { Sprite_Destination } from './Sprite_Destination';

/**
 * The set of sprites on the map screen.
 */
export class Spriteset_Map extends Spriteset_Base {
    protected _characterSprites: Sprite_Character[];
    protected _parallax: TilingSprite;
    protected _tilemap: Tilemap;
    protected _tileset: RPGTileset;
    protected _shadowSprite: Sprite;
    protected _destinationSprite: Sprite_Destination;
    protected _weather: Weather;
    private _parallaxName: string;

    createLowerLayer(): void {
        super.createLowerLayer();
        this.createParallax();
        this.createTilemap();
        this.createCharacters();
        this.createShadow();
        this.createDestination();
        this.createWeather();
    }

    update(): void {
        super.update();
        this.updateTileset();
        this.updateParallax();
        this.updateTilemap();
        this.updateShadow();
        this.updateWeather();
    }

    hideCharacters(): void {
        for (let i = 0; i < this._characterSprites.length; i++) {
            const sprite = this._characterSprites[i];
            if (!sprite.isTile()) {
                sprite.hide();
            }
        }
    }

    createParallax(): void {
        this._parallax = new TilingSprite();
        this._parallax.move(0, 0, Graphics.width, Graphics.height);
        this._baseSprite.addChild(this._parallax);
    }

    createTilemap(): void {
        if (Graphics.isWebGL()) {
            this._tilemap = new ShaderTilemap();
        } else {
            this._tilemap = new CanvasTilemap();
        }
        this._tilemap.tileWidth = window.$gameMap.tileWidth();
        this._tilemap.tileHeight = window.$gameMap.tileHeight();
        this._tilemap.setData(window.$gameMap.width(), window.$gameMap.height(), window.$gameMap.data());
        this._tilemap.horizontalWrap = window.$gameMap.isLoopHorizontal();
        this._tilemap.verticalWrap = window.$gameMap.isLoopVertical();
        this.loadTileset();
        this._baseSprite.addChild(this._tilemap);
    }

    loadTileset(): void {
        this._tileset = window.$gameMap.tileset();
        if (this._tileset) {
            const tilesetNames = this._tileset.tilesetNames;
            for (let i = 0; i < tilesetNames.length; i++) {
                this._tilemap.bitmaps[i] = ImageManager.loadTileset(tilesetNames[i]);
            }
            const newTilesetFlags = window.$gameMap.tilesetFlags();
            this._tilemap.refreshTileset();
            if (!arrayEquals(this._tilemap.flags, newTilesetFlags)) {
                this._tilemap.refresh();
            }
            this._tilemap.flags = newTilesetFlags;
        }
    }

    createCharacters(): void {
        this._characterSprites = [];
        window.$gameMap.events().forEach(function (event) {
            this._characterSprites.push(new Sprite_Character(event));
        }, this);
        window.$gameMap.vehicles().forEach(function (vehicle) {
            this._characterSprites.push(new Sprite_Character(vehicle));
        }, this);
        window.$gamePlayer.followers().reverseEach(function (follower) {
            this._characterSprites.push(new Sprite_Character(follower));
        }, this);
        this._characterSprites.push(new Sprite_Character(window.$gamePlayer));
        for (let i = 0; i < this._characterSprites.length; i++) {
            this._tilemap.addChild(this._characterSprites[i]);
        }
    }

    createShadow(): void {
        this._shadowSprite = new Sprite();
        this._shadowSprite.bitmap = ImageManager.loadSystem('Shadow1');
        this._shadowSprite.anchor.x = 0.5;
        this._shadowSprite.anchor.y = 1;
        this._shadowSprite.z = 6;
        this._tilemap.addChild(this._shadowSprite);
    }

    createDestination(): void {
        this._destinationSprite = new Sprite_Destination();
        this._destinationSprite.z = 9;
        this._tilemap.addChild(this._destinationSprite);
    }

    createWeather(): void {
        this._weather = new Weather();
        this.addChild(this._weather);
    }

    updateTileset(): void {
        if (this._tileset !== window.$gameMap.tileset()) {
            this.loadTileset();
        }
    }

    /*
     * Simple fix for canvas parallax issue, destroy old parallax and readd to  the tree.
     */
    protected _canvasReAddParallax(): void {
        const index = this._baseSprite.children.indexOf(this._parallax);
        this._baseSprite.removeChild(this._parallax);
        this._parallax = new TilingSprite();
        this._parallax.move(0, 0, Graphics.width, Graphics.height);
        this._parallax.bitmap = ImageManager.loadParallax(this._parallaxName);
        this._baseSprite.addChildAt(this._parallax, index);
    }

    updateParallax(): void {
        if (this._parallaxName !== window.$gameMap.parallaxName()) {
            this._parallaxName = window.$gameMap.parallaxName();

            if (this._parallax.bitmap && Graphics.isWebGL() != true) {
                this._canvasReAddParallax();
            } else {
                this._parallax.bitmap = ImageManager.loadParallax(this._parallaxName);
            }
        }
        if (this._parallax.bitmap) {
            this._parallax.origin.x = window.$gameMap.parallaxOx();
            this._parallax.origin.y = window.$gameMap.parallaxOy();
        }
    }

    updateTilemap(): void {
        this._tilemap.origin.x = window.$gameMap.displayX() * window.$gameMap.tileWidth();
        this._tilemap.origin.y = window.$gameMap.displayY() * window.$gameMap.tileHeight();
    }

    updateShadow(): void {
        const airship = window.$gameMap.airship();
        this._shadowSprite.x = airship.shadowX();
        this._shadowSprite.y = airship.shadowY();
        this._shadowSprite.opacity = airship.shadowOpacity();
    }

    updateWeather(): void {
        this._weather.type = window.$gameScreen.weatherType();
        this._weather.power = window.$gameScreen.weatherPower();
        this._weather.origin.x = window.$gameMap.displayX() * window.$gameMap.tileWidth();
        this._weather.origin.y = window.$gameMap.displayY() * window.$gameMap.tileHeight();
    }
}

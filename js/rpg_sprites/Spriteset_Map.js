import { arrayEquals } from '../rpg_core/extension';
import { Graphics } from '../rpg_core/Graphics';
import { ShaderTilemap } from '../rpg_core/ShaderTilemap';
import { Sprite } from '../rpg_core/Sprite';
import { Tilemap } from '../rpg_core/Tilemap';
import { TilingSprite } from '../rpg_core/TilingSprite';
import { Weather } from '../rpg_core/Weather';
import { ImageManager } from '../rpg_managers/ImageManager';
import { Spriteset_Base } from './Spriteset_Base';
import { Sprite_Character } from './Sprite_Character';
import { Sprite_Destination } from './Sprite_Destination';

/**
 * The set of sprites on the map screen.
 */
export class Spriteset_Map extends Spriteset_Base {
    createLowerLayer() {
        super.createLowerLayer();
        this.createParallax();
        this.createTilemap();
        this.createCharacters();
        this.createShadow();
        this.createDestination();
        this.createWeather();
    }

    update() {
        super.update();
        this.updateTileset();
        this.updateParallax();
        this.updateTilemap();
        this.updateShadow();
        this.updateWeather();
    }

    hideCharacters() {
        for (let i = 0; i < this._characterSprites.length; i++) {
            const sprite = this._characterSprites[i];
            if (!sprite.isTile()) {
                sprite.hide();
            }
        }
    }

    createParallax() {
        this._parallax = new TilingSprite();
        this._parallax.move(0, 0, Graphics.width, Graphics.height);
        this._baseSprite.addChild(this._parallax);
    }

    createTilemap() {
        if (Graphics.isWebGL()) {
            this._tilemap = new ShaderTilemap();
        } else {
            this._tilemap = new Tilemap();
        }
        this._tilemap.tileWidth = global.$gameMap.tileWidth();
        this._tilemap.tileHeight = global.$gameMap.tileHeight();
        this._tilemap.setData(global.$gameMap.width(), global.$gameMap.height(), global.$gameMap.data());
        this._tilemap.horizontalWrap = global.$gameMap.isLoopHorizontal();
        this._tilemap.verticalWrap = global.$gameMap.isLoopVertical();
        this.loadTileset();
        this._baseSprite.addChild(this._tilemap);
    }

    loadTileset() {
        this._tileset = global.$gameMap.tileset();
        if (this._tileset) {
            const tilesetNames = this._tileset.tilesetNames;
            for (let i = 0; i < tilesetNames.length; i++) {
                this._tilemap.bitmaps[i] = ImageManager.loadTileset(tilesetNames[i]);
            }
            const newTilesetFlags = global.$gameMap.tilesetFlags();
            this._tilemap.refreshTileset();
            if (!arrayEquals(this._tilemap.flags, newTilesetFlags)) {
                this._tilemap.refresh();
            }
            this._tilemap.flags = newTilesetFlags;
        }
    }

    createCharacters() {
        this._characterSprites = [];
        global.$gameMap.events().forEach(function (event) {
            this._characterSprites.push(new Sprite_Character(event));
        }, this);
        global.$gameMap.vehicles().forEach(function (vehicle) {
            this._characterSprites.push(new Sprite_Character(vehicle));
        }, this);
        global.$gamePlayer.followers().reverseEach(function (follower) {
            this._characterSprites.push(new Sprite_Character(follower));
        }, this);
        this._characterSprites.push(new Sprite_Character(global.$gamePlayer));
        for (let i = 0; i < this._characterSprites.length; i++) {
            this._tilemap.addChild(this._characterSprites[i]);
        }
    }

    createShadow() {
        this._shadowSprite = new Sprite();
        this._shadowSprite.bitmap = ImageManager.loadSystem('Shadow1');
        this._shadowSprite.anchor.x = 0.5;
        this._shadowSprite.anchor.y = 1;
        this._shadowSprite.z = 6;
        this._tilemap.addChild(this._shadowSprite);
    }

    createDestination() {
        this._destinationSprite = new Sprite_Destination();
        this._destinationSprite.z = 9;
        this._tilemap.addChild(this._destinationSprite);
    }

    createWeather() {
        this._weather = new Weather();
        this.addChild(this._weather);
    }

    updateTileset() {
        if (this._tileset !== global.$gameMap.tileset()) {
            this.loadTileset();
        }
    }

    /*
     * Simple fix for canvas parallax issue, destroy old parallax and readd to  the tree.
     */
    _canvasReAddParallax() {
        const index = this._baseSprite.children.indexOf(this._parallax);
        this._baseSprite.removeChild(this._parallax);
        this._parallax = new TilingSprite();
        this._parallax.move(0, 0, Graphics.width, Graphics.height);
        this._parallax.bitmap = ImageManager.loadParallax(this._parallaxName);
        this._baseSprite.addChildAt(this._parallax, index);
    }

    updateParallax() {
        if (this._parallaxName !== global.$gameMap.parallaxName()) {
            this._parallaxName = global.$gameMap.parallaxName();

            if (this._parallax.bitmap && Graphics.isWebGL() != true) {
                this._canvasReAddParallax();
            } else {
                this._parallax.bitmap = ImageManager.loadParallax(this._parallaxName);
            }
        }
        if (this._parallax.bitmap) {
            this._parallax.origin.x = global.$gameMap.parallaxOx();
            this._parallax.origin.y = global.$gameMap.parallaxOy();
        }
    }

    updateTilemap() {
        this._tilemap.origin.x = global.$gameMap.displayX() * global.$gameMap.tileWidth();
        this._tilemap.origin.y = global.$gameMap.displayY() * global.$gameMap.tileHeight();
    }

    updateShadow() {
        const airship = global.$gameMap.airship();
        this._shadowSprite.x = airship.shadowX();
        this._shadowSprite.y = airship.shadowY();
        this._shadowSprite.opacity = airship.shadowOpacity();
    }

    updateWeather() {
        this._weather.type = global.$gameScreen.weatherType();
        this._weather.power = global.$gameScreen.weatherPower();
        this._weather.origin.x = global.$gameMap.displayX() * global.$gameMap.tileWidth();
        this._weather.origin.y = global.$gameMap.displayY() * global.$gameMap.tileHeight();
    }
}

//-----------------------------------------------------------------------------
// Spriteset_Map
//
// The set of sprites on the map screen.

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

export function Spriteset_Map() {
    this.initialize.apply(this, arguments);
}

Spriteset_Map.prototype = Object.create(Spriteset_Base.prototype);
Spriteset_Map.prototype.constructor = Spriteset_Map;

Spriteset_Map.prototype.initialize = function () {
    Spriteset_Base.prototype.initialize.call(this);
};

Spriteset_Map.prototype.createLowerLayer = function () {
    Spriteset_Base.prototype.createLowerLayer.call(this);
    this.createParallax();
    this.createTilemap();
    this.createCharacters();
    this.createShadow();
    this.createDestination();
    this.createWeather();
};

Spriteset_Map.prototype.update = function () {
    Spriteset_Base.prototype.update.call(this);
    this.updateTileset();
    this.updateParallax();
    this.updateTilemap();
    this.updateShadow();
    this.updateWeather();
};

Spriteset_Map.prototype.hideCharacters = function () {
    for (var i = 0; i < this._characterSprites.length; i++) {
        var sprite = this._characterSprites[i];
        if (!sprite.isTile()) {
            sprite.hide();
        }
    }
};

Spriteset_Map.prototype.createParallax = function () {
    this._parallax = new TilingSprite();
    this._parallax.move(0, 0, Graphics.width, Graphics.height);
    this._baseSprite.addChild(this._parallax);
};

Spriteset_Map.prototype.createTilemap = function () {
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
};

Spriteset_Map.prototype.loadTileset = function () {
    this._tileset = global.$gameMap.tileset();
    if (this._tileset) {
        var tilesetNames = this._tileset.tilesetNames;
        for (var i = 0; i < tilesetNames.length; i++) {
            this._tilemap.bitmaps[i] = ImageManager.loadTileset(tilesetNames[i]);
        }
        var newTilesetFlags = global.$gameMap.tilesetFlags();
        this._tilemap.refreshTileset();
        if (!this._tilemap.flags.equals(newTilesetFlags)) {
            this._tilemap.refresh();
        }
        this._tilemap.flags = newTilesetFlags;
    }
};

Spriteset_Map.prototype.createCharacters = function () {
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
    for (var i = 0; i < this._characterSprites.length; i++) {
        this._tilemap.addChild(this._characterSprites[i]);
    }
};

Spriteset_Map.prototype.createShadow = function () {
    this._shadowSprite = new Sprite();
    this._shadowSprite.bitmap = ImageManager.loadSystem('Shadow1');
    this._shadowSprite.anchor.x = 0.5;
    this._shadowSprite.anchor.y = 1;
    this._shadowSprite.z = 6;
    this._tilemap.addChild(this._shadowSprite);
};

Spriteset_Map.prototype.createDestination = function () {
    this._destinationSprite = new Sprite_Destination();
    this._destinationSprite.z = 9;
    this._tilemap.addChild(this._destinationSprite);
};

Spriteset_Map.prototype.createWeather = function () {
    this._weather = new Weather();
    this.addChild(this._weather);
};

Spriteset_Map.prototype.updateTileset = function () {
    if (this._tileset !== global.$gameMap.tileset()) {
        this.loadTileset();
    }
};

/*
 * Simple fix for canvas parallax issue, destroy old parallax and readd to  the tree.
 */
Spriteset_Map.prototype._canvasReAddParallax = function () {
    var index = this._baseSprite.children.indexOf(this._parallax);
    this._baseSprite.removeChild(this._parallax);
    this._parallax = new TilingSprite();
    this._parallax.move(0, 0, Graphics.width, Graphics.height);
    this._parallax.bitmap = ImageManager.loadParallax(this._parallaxName);
    this._baseSprite.addChildAt(this._parallax, index);
};

Spriteset_Map.prototype.updateParallax = function () {
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
};

Spriteset_Map.prototype.updateTilemap = function () {
    this._tilemap.origin.x = global.$gameMap.displayX() * global.$gameMap.tileWidth();
    this._tilemap.origin.y = global.$gameMap.displayY() * global.$gameMap.tileHeight();
};

Spriteset_Map.prototype.updateShadow = function () {
    var airship = global.$gameMap.airship();
    this._shadowSprite.x = airship.shadowX();
    this._shadowSprite.y = airship.shadowY();
    this._shadowSprite.opacity = airship.shadowOpacity();
};

Spriteset_Map.prototype.updateWeather = function () {
    this._weather.type = global.$gameScreen.weatherType();
    this._weather.power = global.$gameScreen.weatherPower();
    this._weather.origin.x = global.$gameMap.displayX() * global.$gameMap.tileWidth();
    this._weather.origin.y = global.$gameMap.displayY() * global.$gameMap.tileHeight();
};

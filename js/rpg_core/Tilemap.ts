import * as PIXI from 'pixi.js';

import { Bitmap } from './Bitmap';
import { Graphics } from './Graphics';
import { mod } from './extension';

/**
 * The tilemap which displays 2D tile-based game map.
 */
export abstract class Tilemap extends PIXI.Container {
    protected _margin: number;
    protected _width: number;
    protected _height: number;
    protected _tileWidth: number;
    protected _tileHeight: number;
    protected _mapWidth: number;
    protected _mapHeight: number;
    protected _mapData: readonly number[];
    protected _layerWidth: number;
    protected _layerHeight: number;

    protected _needsRepaint: boolean;
    protected _lastAnimationFrame: number;
    protected _lastStartX: number;
    protected _lastStartY: number;
    protected _frameUpdated: boolean;

    animationFrame: number;

    constructor() {
        super();

        this._margin = 20;
        this._width = Graphics.width + this._margin * 2;
        this._height = Graphics.height + this._margin * 2;
        this._tileWidth = 48;
        this._tileHeight = 48;
        this._mapWidth = 0;
        this._mapHeight = 0;
        this._mapData = null;
        this._layerWidth = 0;
        this._layerHeight = 0;

        this._createLayers();
        this.refresh();
    }

    /**
     * The bitmaps used as a tileset.
     */
    bitmaps: Bitmap[] = [];

    /**
     * The origin point of the tilemap for scrolling.
     */
    origin = new PIXI.Point();

    /**
     * The tileset flags.
     */
    flags: readonly number[] = [];

    /**
     * The animation count for autotiles.
     */
    animationCount = 0;

    /**
     * Whether the tilemap loops horizontal.
     */
    horizontalWrap = false;

    /**
     * Whether the tilemap loops vertical.
     */
    verticalWrap = false;

    /**
     * The width of the screen in pixels.
     */
    // FIXME:
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    get width(): number {
        return this._width;
    }
    set width(value: number) {
        if (this._width !== value) {
            this._width = value;
            this._createLayers();
        }
    }

    /**
     * The height of the screen in pixels.
     */
    // FIXME:
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    get height(): number {
        return this._height;
    }
    set height(value: number) {
        if (this._height !== value) {
            this._height = value;
            this._createLayers();
        }
    }

    /**
     * The width of a tile in pixels.
     */
    get tileWidth(): number {
        return this._tileWidth;
    }
    set tileWidth(value: number) {
        if (this._tileWidth !== value) {
            this._tileWidth = value;
            this._createLayers();
        }
    }

    /**
     * The height of a tile in pixels.
     */
    get tileHeight(): number {
        return this._tileHeight;
    }
    set tileHeight(value: number) {
        if (this._tileHeight !== value) {
            this._tileHeight = value;
            this._createLayers();
        }
    }

    /**
     * Sets the tilemap data.
     * @param width The width of the map in number of tiles
     * @param height The height of the map in number of tiles
     * @param data The one dimensional array for the map data
     */
    setData(width: number, height: number, data: readonly number[]): void {
        this._mapWidth = width;
        this._mapHeight = height;
        this._mapData = data;
    }

    /**
     * Checks whether the tileset is ready to render.
     */
    isReady(): boolean {
        for (let i = 0; i < this.bitmaps.length; i++) {
            if (this.bitmaps[i] && !this.bitmaps[i].isReady()) {
                return false;
            }
        }
        return true;
    }

    /**
     * Updates the tilemap for each frame.
     */
    update(): void {
        this.animationCount++;
        this.animationFrame = Math.floor(this.animationCount / 30);
        this.children.forEach((child: PIXI.DisplayObject & { update?: () => void }) => {
            if (child.update) {
                child.update();
            }
        });
        for (let i = 0; i < this.bitmaps.length; i++) {
            if (this.bitmaps[i]) {
                this.bitmaps[i].touch();
            }
        }
    }

    /**
     * Forces to repaint the entire tilemap.
     */
    abstract refresh(): void;

    /**
     * Forces to refresh the tileset
     */
    refreshTileset(): void {
        // ...
    }

    updateTransform(): void {
        const ox = Math.floor(this.origin.x);
        const oy = Math.floor(this.origin.y);
        const startX = Math.floor((ox - this._margin) / this._tileWidth);
        const startY = Math.floor((oy - this._margin) / this._tileHeight);
        this._updateLayerPositions(startX, startY);
        if (
            this._needsRepaint ||
            this._lastAnimationFrame !== this.animationFrame ||
            this._lastStartX !== startX ||
            this._lastStartY !== startY
        ) {
            this._frameUpdated = this._lastAnimationFrame !== this.animationFrame;
            this._lastAnimationFrame = this.animationFrame;
            this._lastStartX = startX;
            this._lastStartY = startY;
            this._paintAllTiles(startX, startY);
            this._needsRepaint = false;
        }
        this._sortChildren();
        super.updateTransform();
    }

    protected abstract _createLayers(): void;

    protected abstract _updateLayerPositions(_startX: number, _startY: number): void;

    protected _paintAllTiles(startX: number, startY: number): void {
        const tileCols = Math.ceil(this._width / this._tileWidth) + 1;
        const tileRows = Math.ceil(this._height / this._tileHeight) + 1;
        for (let y = 0; y < tileRows; y++) {
            for (let x = 0; x < tileCols; x++) {
                this._paintTiles(startX, startY, x, y);
            }
        }
    }

    protected abstract _paintTiles(startX: number, startY: number, x: number, y: number): void;

    protected _readMapData(x: number, y: number, z: number): number {
        if (this._mapData) {
            const width = this._mapWidth;
            const height = this._mapHeight;
            if (this.horizontalWrap) {
                x = mod(x, width);
            }
            if (this.verticalWrap) {
                y = mod(y, height);
            }
            if (x >= 0 && x < width && y >= 0 && y < height) {
                return this._mapData[(z * height + y) * width + x] || 0;
            } else {
                return 0;
            }
        } else {
            return 0;
        }
    }

    protected _isHigherTile(tileId: number): boolean {
        return !!(this.flags[tileId] & 0x10);
    }

    protected _isTableTile(tileId: number): boolean {
        return Tilemap.isTileA2(tileId) && !!(this.flags[tileId] & 0x80);
    }

    protected _isOverpassPosition(_mx: number, _my: number): boolean {
        return false;
    }

    protected _sortChildren() {
        this.children.sort((a, b) => {
            if (a.z !== b.z) {
                return a.z - b.z;
            } else if (a.y !== b.y) {
                return a.y - b.y;
            } else {
                return a.spriteId - b.spriteId;
            }
        });
    }

    // Tile type checkers

    static readonly TILE_ID_B = 0;
    static readonly TILE_ID_C = 256;
    static readonly TILE_ID_D = 512;
    static readonly TILE_ID_E = 768;
    static readonly TILE_ID_A5 = 1536;
    static readonly TILE_ID_A1 = 2048;
    static readonly TILE_ID_A2 = 2816;
    static readonly TILE_ID_A3 = 4352;
    static readonly TILE_ID_A4 = 5888;
    static readonly TILE_ID_MAX = 8192;

    static isVisibleTile(tileId: number): boolean {
        return tileId > 0 && tileId < this.TILE_ID_MAX;
    }

    static isAutotile(tileId: number): boolean {
        return tileId >= this.TILE_ID_A1;
    }

    static getAutotileKind(tileId: number): number {
        return Math.floor((tileId - this.TILE_ID_A1) / 48);
    }

    static getAutotileShape(tileId: number): number {
        return (tileId - this.TILE_ID_A1) % 48;
    }

    static makeAutotileId(kind: number, shape: number): number {
        return this.TILE_ID_A1 + kind * 48 + shape;
    }

    static isSameKindTile(tileID1: number, tileID2: number): boolean {
        if (this.isAutotile(tileID1) && this.isAutotile(tileID2)) {
            return this.getAutotileKind(tileID1) === this.getAutotileKind(tileID2);
        } else {
            return tileID1 === tileID2;
        }
    }

    static isTileA1(tileId: number): boolean {
        return tileId >= this.TILE_ID_A1 && tileId < this.TILE_ID_A2;
    }

    static isTileA2(tileId: number): boolean {
        return tileId >= this.TILE_ID_A2 && tileId < this.TILE_ID_A3;
    }

    static isTileA3(tileId: number): boolean {
        return tileId >= this.TILE_ID_A3 && tileId < this.TILE_ID_A4;
    }

    static isTileA4(tileId: number): boolean {
        return tileId >= this.TILE_ID_A4 && tileId < this.TILE_ID_MAX;
    }

    static isTileA5(tileId: number): boolean {
        return tileId >= this.TILE_ID_A5 && tileId < this.TILE_ID_A1;
    }

    static isWaterTile(tileId: number): boolean {
        if (this.isTileA1(tileId)) {
            return !(tileId >= this.TILE_ID_A1 + 96 && tileId < this.TILE_ID_A1 + 192);
        } else {
            return false;
        }
    }

    static isWaterfallTile(tileId: number): boolean {
        if (tileId >= this.TILE_ID_A1 + 192 && tileId < this.TILE_ID_A2) {
            return this.getAutotileKind(tileId) % 2 === 1;
        } else {
            return false;
        }
    }

    static isGroundTile(tileId: number): boolean {
        return this.isTileA1(tileId) || this.isTileA2(tileId) || this.isTileA5(tileId);
    }

    static isShadowingTile(tileId: number): boolean {
        return this.isTileA3(tileId) || this.isTileA4(tileId);
    }

    static isRoofTile(tileId: number): boolean {
        return this.isTileA3(tileId) && this.getAutotileKind(tileId) % 16 < 8;
    }

    static isWallTopTile(tileId: number): boolean {
        return this.isTileA4(tileId) && this.getAutotileKind(tileId) % 16 < 8;
    }

    static isWallSideTile(tileId: number): boolean {
        return (this.isTileA3(tileId) || this.isTileA4(tileId)) && this.getAutotileKind(tileId) % 16 >= 8;
    }

    static isWallTile(tileId: number): boolean {
        return this.isWallTopTile(tileId) || this.isWallSideTile(tileId);
    }

    static isFloorTypeAutotile(tileId: number): boolean {
        return (
            (this.isTileA1(tileId) && !this.isWaterfallTile(tileId)) ||
            this.isTileA2(tileId) ||
            this.isWallTopTile(tileId)
        );
    }

    static isWallTypeAutotile(tileId: number): boolean {
        return this.isRoofTile(tileId) || this.isWallSideTile(tileId);
    }

    static isWaterfallTypeAutotile(tileId: number): boolean {
        return this.isWaterfallTile(tileId);
    }

    // Autotile shape number to coordinates of tileset images

    static readonly FLOOR_AUTOTILE_TABLE = [
        [
            [2, 4],
            [1, 4],
            [2, 3],
            [1, 3],
        ],
        [
            [2, 0],
            [1, 4],
            [2, 3],
            [1, 3],
        ],
        [
            [2, 4],
            [3, 0],
            [2, 3],
            [1, 3],
        ],
        [
            [2, 0],
            [3, 0],
            [2, 3],
            [1, 3],
        ],
        [
            [2, 4],
            [1, 4],
            [2, 3],
            [3, 1],
        ],
        [
            [2, 0],
            [1, 4],
            [2, 3],
            [3, 1],
        ],
        [
            [2, 4],
            [3, 0],
            [2, 3],
            [3, 1],
        ],
        [
            [2, 0],
            [3, 0],
            [2, 3],
            [3, 1],
        ],
        [
            [2, 4],
            [1, 4],
            [2, 1],
            [1, 3],
        ],
        [
            [2, 0],
            [1, 4],
            [2, 1],
            [1, 3],
        ],
        [
            [2, 4],
            [3, 0],
            [2, 1],
            [1, 3],
        ],
        [
            [2, 0],
            [3, 0],
            [2, 1],
            [1, 3],
        ],
        [
            [2, 4],
            [1, 4],
            [2, 1],
            [3, 1],
        ],
        [
            [2, 0],
            [1, 4],
            [2, 1],
            [3, 1],
        ],
        [
            [2, 4],
            [3, 0],
            [2, 1],
            [3, 1],
        ],
        [
            [2, 0],
            [3, 0],
            [2, 1],
            [3, 1],
        ],
        [
            [0, 4],
            [1, 4],
            [0, 3],
            [1, 3],
        ],
        [
            [0, 4],
            [3, 0],
            [0, 3],
            [1, 3],
        ],
        [
            [0, 4],
            [1, 4],
            [0, 3],
            [3, 1],
        ],
        [
            [0, 4],
            [3, 0],
            [0, 3],
            [3, 1],
        ],
        [
            [2, 2],
            [1, 2],
            [2, 3],
            [1, 3],
        ],
        [
            [2, 2],
            [1, 2],
            [2, 3],
            [3, 1],
        ],
        [
            [2, 2],
            [1, 2],
            [2, 1],
            [1, 3],
        ],
        [
            [2, 2],
            [1, 2],
            [2, 1],
            [3, 1],
        ],
        [
            [2, 4],
            [3, 4],
            [2, 3],
            [3, 3],
        ],
        [
            [2, 4],
            [3, 4],
            [2, 1],
            [3, 3],
        ],
        [
            [2, 0],
            [3, 4],
            [2, 3],
            [3, 3],
        ],
        [
            [2, 0],
            [3, 4],
            [2, 1],
            [3, 3],
        ],
        [
            [2, 4],
            [1, 4],
            [2, 5],
            [1, 5],
        ],
        [
            [2, 0],
            [1, 4],
            [2, 5],
            [1, 5],
        ],
        [
            [2, 4],
            [3, 0],
            [2, 5],
            [1, 5],
        ],
        [
            [2, 0],
            [3, 0],
            [2, 5],
            [1, 5],
        ],
        [
            [0, 4],
            [3, 4],
            [0, 3],
            [3, 3],
        ],
        [
            [2, 2],
            [1, 2],
            [2, 5],
            [1, 5],
        ],
        [
            [0, 2],
            [1, 2],
            [0, 3],
            [1, 3],
        ],
        [
            [0, 2],
            [1, 2],
            [0, 3],
            [3, 1],
        ],
        [
            [2, 2],
            [3, 2],
            [2, 3],
            [3, 3],
        ],
        [
            [2, 2],
            [3, 2],
            [2, 1],
            [3, 3],
        ],
        [
            [2, 4],
            [3, 4],
            [2, 5],
            [3, 5],
        ],
        [
            [2, 0],
            [3, 4],
            [2, 5],
            [3, 5],
        ],
        [
            [0, 4],
            [1, 4],
            [0, 5],
            [1, 5],
        ],
        [
            [0, 4],
            [3, 0],
            [0, 5],
            [1, 5],
        ],
        [
            [0, 2],
            [3, 2],
            [0, 3],
            [3, 3],
        ],
        [
            [0, 2],
            [1, 2],
            [0, 5],
            [1, 5],
        ],
        [
            [0, 4],
            [3, 4],
            [0, 5],
            [3, 5],
        ],
        [
            [2, 2],
            [3, 2],
            [2, 5],
            [3, 5],
        ],
        [
            [0, 2],
            [3, 2],
            [0, 5],
            [3, 5],
        ],
        [
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1],
        ],
    ];

    static readonly WALL_AUTOTILE_TABLE = [
        [
            [2, 2],
            [1, 2],
            [2, 1],
            [1, 1],
        ],
        [
            [0, 2],
            [1, 2],
            [0, 1],
            [1, 1],
        ],
        [
            [2, 0],
            [1, 0],
            [2, 1],
            [1, 1],
        ],
        [
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1],
        ],
        [
            [2, 2],
            [3, 2],
            [2, 1],
            [3, 1],
        ],
        [
            [0, 2],
            [3, 2],
            [0, 1],
            [3, 1],
        ],
        [
            [2, 0],
            [3, 0],
            [2, 1],
            [3, 1],
        ],
        [
            [0, 0],
            [3, 0],
            [0, 1],
            [3, 1],
        ],
        [
            [2, 2],
            [1, 2],
            [2, 3],
            [1, 3],
        ],
        [
            [0, 2],
            [1, 2],
            [0, 3],
            [1, 3],
        ],
        [
            [2, 0],
            [1, 0],
            [2, 3],
            [1, 3],
        ],
        [
            [0, 0],
            [1, 0],
            [0, 3],
            [1, 3],
        ],
        [
            [2, 2],
            [3, 2],
            [2, 3],
            [3, 3],
        ],
        [
            [0, 2],
            [3, 2],
            [0, 3],
            [3, 3],
        ],
        [
            [2, 0],
            [3, 0],
            [2, 3],
            [3, 3],
        ],
        [
            [0, 0],
            [3, 0],
            [0, 3],
            [3, 3],
        ],
    ];

    static readonly WATERFALL_AUTOTILE_TABLE = [
        [
            [2, 0],
            [1, 0],
            [2, 1],
            [1, 1],
        ],
        [
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1],
        ],
        [
            [2, 0],
            [3, 0],
            [2, 1],
            [3, 1],
        ],
        [
            [0, 0],
            [3, 0],
            [0, 1],
            [3, 1],
        ],
    ];

    // The important members from Pixi.js

    /**
     * [read-only] The array of children of the sprite.
     */
    declare children: (PIXI.DisplayObject & { z: number; spriteId: number })[];

    /**
     * [read-only] The object that contains the tilemap.
     *
     * @property parent
     * @type Object
     */

    /**
     * Adds a child to the container.
     *
     * @method addChild
     * @param {Object} child The child to add
     * @return {Object} The child that was added
     */

    /**
     * Adds a child to the container at a specified index.
     *
     * @method addChildAt
     * @param {Object} child The child to add
     * @param {Number} index The index to place the child in
     * @return {Object} The child that was added
     */

    /**
     * Removes a child from the container.
     *
     * @method removeChild
     * @param {Object} child The child to remove
     * @return {Object} The child that was removed
     */

    /**
     * Removes a child from the specified index position.
     *
     * @method removeChildAt
     * @param {Number} index The index to get the child from
     * @return {Object} The child that was removed
     */
}

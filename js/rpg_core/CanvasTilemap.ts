import { Bitmap } from './Bitmap';
import { Sprite } from './Sprite';
import { arrayEquals, mod } from './extension';
import { Tilemap } from './Tilemap';

/**
 * The tilemap which displays 2D tile-based game map without shader.
 */
export class CanvasTilemap extends Tilemap {
    protected _lastTiles: number[][][][];

    protected _lowerBitmap: Bitmap;
    protected _upperBitmap: Bitmap;
    protected _lowerLayer: Sprite;
    protected _upperLayer: Sprite;

    animationFrame: number;

    constructor() {
        super();
        this._lastTiles = [];
    }

    /**
     * Forces to repaint the entire tilemap.
     */
    refresh(): void {
        this._lastTiles.length = 0;
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

    protected _createLayers(): void {
        const width = this._width;
        const height = this._height;
        const margin = this._margin;
        const tileCols = Math.ceil(width / this._tileWidth) + 1;
        const tileRows = Math.ceil(height / this._tileHeight) + 1;
        const layerWidth = tileCols * this._tileWidth;
        const layerHeight = tileRows * this._tileHeight;
        this._lowerBitmap = new Bitmap(layerWidth, layerHeight);
        this._upperBitmap = new Bitmap(layerWidth, layerHeight);
        this._layerWidth = layerWidth;
        this._layerHeight = layerHeight;

        /*
         * Z coordinate:
         *
         * 0 : Lower tiles
         * 1 : Lower characters
         * 3 : Normal characters
         * 4 : Upper tiles
         * 5 : Upper characters
         * 6 : Airship shadow
         * 7 : Balloon
         * 8 : Animation
         * 9 : Destination
         */

        this._lowerLayer = new Sprite();
        this._lowerLayer.move(-margin, -margin, width, height);
        this._lowerLayer.z = 0;

        this._upperLayer = new Sprite();
        this._upperLayer.move(-margin, -margin, width, height);
        this._upperLayer.z = 4;

        for (let i = 0; i < 4; i++) {
            this._lowerLayer.addChild(new Sprite(this._lowerBitmap));
            this._upperLayer.addChild(new Sprite(this._upperBitmap));
        }

        this.addChild(this._lowerLayer);
        this.addChild(this._upperLayer);
    }

    protected _updateLayerPositions(_startX: number, _startY: number): void {
        const m = this._margin;
        const ox = Math.floor(this.origin.x);
        const oy = Math.floor(this.origin.y);
        const x2 = mod(ox - m, this._layerWidth);
        const y2 = mod(oy - m, this._layerHeight);
        const w1 = this._layerWidth - x2;
        const h1 = this._layerHeight - y2;
        const w2 = this._width - w1;
        const h2 = this._height - h1;

        for (let i = 0; i < 2; i++) {
            let children: Sprite[];
            if (i === 0) {
                children = this._lowerLayer.children as Sprite[];
            } else {
                children = this._upperLayer.children as Sprite[];
            }
            children[0].move(0, 0, w1, h1);
            children[0].setFrame(x2, y2, w1, h1);
            children[1].move(w1, 0, w2, h1);
            children[1].setFrame(0, y2, w2, h1);
            children[2].move(0, h1, w1, h2);
            children[2].setFrame(x2, 0, w1, h2);
            children[3].move(w1, h1, w2, h2);
            children[3].setFrame(0, 0, w2, h2);
        }
    }

    protected _paintAllTiles(startX: number, startY: number): void {
        const tileCols = Math.ceil(this._width / this._tileWidth) + 1;
        const tileRows = Math.ceil(this._height / this._tileHeight) + 1;
        for (let y = 0; y < tileRows; y++) {
            for (let x = 0; x < tileCols; x++) {
                this._paintTiles(startX, startY, x, y);
            }
        }
    }

    protected _paintTiles(startX: number, startY: number, x: number, y: number): void {
        const tableEdgeVirtualId = 10000;
        const mx = startX + x;
        const my = startY + y;
        const dx = mod(mx * this._tileWidth, this._layerWidth);
        const dy = mod(my * this._tileHeight, this._layerHeight);
        const lx = dx / this._tileWidth;
        const ly = dy / this._tileHeight;
        const tileId0 = this._readMapData(mx, my, 0);
        const tileId1 = this._readMapData(mx, my, 1);
        const tileId2 = this._readMapData(mx, my, 2);
        const tileId3 = this._readMapData(mx, my, 3);
        const shadowBits = this._readMapData(mx, my, 4);
        const upperTileId1 = this._readMapData(mx, my - 1, 1);
        const lowerTiles = [];
        const upperTiles = [];

        if (this._isHigherTile(tileId0)) {
            upperTiles.push(tileId0);
        } else {
            lowerTiles.push(tileId0);
        }
        if (this._isHigherTile(tileId1)) {
            upperTiles.push(tileId1);
        } else {
            lowerTiles.push(tileId1);
        }

        lowerTiles.push(-shadowBits);

        if (this._isTableTile(upperTileId1) && !this._isTableTile(tileId1)) {
            if (!Tilemap.isShadowingTile(tileId0)) {
                lowerTiles.push(tableEdgeVirtualId + upperTileId1);
            }
        }

        if (this._isOverpassPosition(mx, my)) {
            upperTiles.push(tileId2);
            upperTiles.push(tileId3);
        } else {
            if (this._isHigherTile(tileId2)) {
                upperTiles.push(tileId2);
            } else {
                lowerTiles.push(tileId2);
            }
            if (this._isHigherTile(tileId3)) {
                upperTiles.push(tileId3);
            } else {
                lowerTiles.push(tileId3);
            }
        }

        const lastLowerTiles = this._readLastTiles(0, lx, ly);
        if (!arrayEquals(lowerTiles, lastLowerTiles) || (Tilemap.isTileA1(tileId0) && this._frameUpdated)) {
            this._lowerBitmap.clearRect(dx, dy, this._tileWidth, this._tileHeight);
            for (let i = 0; i < lowerTiles.length; i++) {
                const lowerTileId = lowerTiles[i];
                if (lowerTileId < 0) {
                    this._drawShadow(this._lowerBitmap, shadowBits, dx, dy);
                } else if (lowerTileId >= tableEdgeVirtualId) {
                    this._drawTableEdge(this._lowerBitmap, upperTileId1, dx, dy);
                } else {
                    this._drawTile(this._lowerBitmap, lowerTileId, dx, dy);
                }
            }
            this._writeLastTiles(0, lx, ly, lowerTiles);
        }

        const lastUpperTiles = this._readLastTiles(1, lx, ly);
        if (!arrayEquals(upperTiles, lastUpperTiles)) {
            this._upperBitmap.clearRect(dx, dy, this._tileWidth, this._tileHeight);
            for (let j = 0; j < upperTiles.length; j++) {
                this._drawTile(this._upperBitmap, upperTiles[j], dx, dy);
            }
            this._writeLastTiles(1, lx, ly, upperTiles);
        }
    }

    protected _readLastTiles(i: number, x: number, y: number): number[] {
        const array1 = this._lastTiles[i];
        if (array1) {
            const array2 = array1[y];
            if (array2) {
                const tiles = array2[x];
                if (tiles) {
                    return tiles;
                }
            }
        }
        return [];
    }

    protected _writeLastTiles(i: number, x: number, y: number, tiles: number[]): void {
        console.log({ tiles });

        let array1 = this._lastTiles[i];
        if (!array1) {
            array1 = this._lastTiles[i] = [] as number[][][];
        }
        let array2 = array1[y];
        if (!array2) {
            array2 = array1[y] = [] as number[][];
        }
        array2[x] = tiles;
    }

    protected _drawTile(bitmap: Bitmap, tileId: number, dx: number, dy: number): void {
        if (Tilemap.isVisibleTile(tileId)) {
            if (Tilemap.isAutotile(tileId)) {
                this._drawAutotile(bitmap, tileId, dx, dy);
            } else {
                this._drawNormalTile(bitmap, tileId, dx, dy);
            }
        }
    }

    protected _drawNormalTile(bitmap: Bitmap, tileId: number, dx: number, dy: number): void {
        let setNumber = 0;

        if (Tilemap.isTileA5(tileId)) {
            setNumber = 4;
        } else {
            setNumber = 5 + Math.floor(tileId / 256);
        }

        const w = this._tileWidth;
        const h = this._tileHeight;
        const sx = ((Math.floor(tileId / 128) % 2) * 8 + (tileId % 8)) * w;
        const sy = (Math.floor((tileId % 256) / 8) % 16) * h;

        const source = this.bitmaps[setNumber];
        if (source) {
            bitmap.bltImage(source, sx, sy, w, h, dx, dy, w, h);
        }
    }

    protected _drawAutotile(bitmap: Bitmap, tileId: number, dx: number, dy: number): void {
        let autotileTable = Tilemap.FLOOR_AUTOTILE_TABLE;
        const kind = Tilemap.getAutotileKind(tileId);
        const shape = Tilemap.getAutotileShape(tileId);
        const tx = kind % 8;
        const ty = Math.floor(kind / 8);
        let bx = 0;
        let by = 0;
        let setNumber = 0;
        let isTable = false;

        if (Tilemap.isTileA1(tileId)) {
            const waterSurfaceIndex = [0, 1, 2, 1][this.animationFrame % 4];
            setNumber = 0;
            if (kind === 0) {
                bx = waterSurfaceIndex * 2;
                by = 0;
            } else if (kind === 1) {
                bx = waterSurfaceIndex * 2;
                by = 3;
            } else if (kind === 2) {
                bx = 6;
                by = 0;
            } else if (kind === 3) {
                bx = 6;
                by = 3;
            } else {
                bx = Math.floor(tx / 4) * 8;
                by = ty * 6 + (Math.floor(tx / 2) % 2) * 3;
                if (kind % 2 === 0) {
                    bx += waterSurfaceIndex * 2;
                } else {
                    bx += 6;
                    autotileTable = Tilemap.WATERFALL_AUTOTILE_TABLE;
                    by += this.animationFrame % 3;
                }
            }
        } else if (Tilemap.isTileA2(tileId)) {
            setNumber = 1;
            bx = tx * 2;
            by = (ty - 2) * 3;
            isTable = this._isTableTile(tileId);
        } else if (Tilemap.isTileA3(tileId)) {
            setNumber = 2;
            bx = tx * 2;
            by = (ty - 6) * 2;
            autotileTable = Tilemap.WALL_AUTOTILE_TABLE;
        } else if (Tilemap.isTileA4(tileId)) {
            setNumber = 3;
            bx = tx * 2;
            by = Math.floor((ty - 10) * 2.5 + (ty % 2 === 1 ? 0.5 : 0));
            if (ty % 2 === 1) {
                autotileTable = Tilemap.WALL_AUTOTILE_TABLE;
            }
        }

        const table = autotileTable[shape];
        const source = this.bitmaps[setNumber];

        if (table && source) {
            const w1 = this._tileWidth / 2;
            const h1 = this._tileHeight / 2;
            for (let i = 0; i < 4; i++) {
                const qsx = table[i][0];
                const qsy = table[i][1];
                const sx1 = (bx * 2 + qsx) * w1;
                const sy1 = (by * 2 + qsy) * h1;
                const dx1 = dx + (i % 2) * w1;
                let dy1 = dy + Math.floor(i / 2) * h1;
                if (isTable && (qsy === 1 || qsy === 5)) {
                    let qsx2 = qsx;
                    const qsy2 = 3;
                    if (qsy === 1) {
                        qsx2 = [0, 3, 2, 1][qsx];
                    }
                    const sx2 = (bx * 2 + qsx2) * w1;
                    const sy2 = (by * 2 + qsy2) * h1;
                    bitmap.bltImage(source, sx2, sy2, w1, h1, dx1, dy1, w1, h1);
                    dy1 += h1 / 2;
                    bitmap.bltImage(source, sx1, sy1, w1, h1 / 2, dx1, dy1, w1, h1 / 2);
                } else {
                    bitmap.bltImage(source, sx1, sy1, w1, h1, dx1, dy1, w1, h1);
                }
            }
        }
    }

    protected _drawTableEdge(bitmap: Bitmap, tileId: number, dx: number, dy: number): void {
        if (Tilemap.isTileA2(tileId)) {
            const autotileTable = Tilemap.FLOOR_AUTOTILE_TABLE;
            const kind = Tilemap.getAutotileKind(tileId);
            const shape = Tilemap.getAutotileShape(tileId);
            const tx = kind % 8;
            const ty = Math.floor(kind / 8);
            const setNumber = 1;
            const bx = tx * 2;
            const by = (ty - 2) * 3;
            const table = autotileTable[shape];

            if (table) {
                const source = this.bitmaps[setNumber];
                const w1 = this._tileWidth / 2;
                const h1 = this._tileHeight / 2;
                for (let i = 0; i < 2; i++) {
                    const qsx = table[2 + i][0];
                    const qsy = table[2 + i][1];
                    const sx1 = (bx * 2 + qsx) * w1;
                    const sy1 = (by * 2 + qsy) * h1 + h1 / 2;
                    const dx1 = dx + (i % 2) * w1;
                    const dy1 = dy + Math.floor(i / 2) * h1;
                    bitmap.bltImage(source, sx1, sy1, w1, h1 / 2, dx1, dy1, w1, h1 / 2);
                }
            }
        }
    }

    protected _drawShadow(bitmap: Bitmap, shadowBits: number, dx: number, dy: number): void {
        if (shadowBits & 0x0f) {
            const w1 = this._tileWidth / 2;
            const h1 = this._tileHeight / 2;
            const color = 'rgba(0,0,0,0.5)';
            for (let i = 0; i < 4; i++) {
                if (shadowBits & (1 << i)) {
                    const dx1 = dx + (i % 2) * w1;
                    const dy1 = dy + Math.floor(i / 2) * h1;
                    bitmap.fillRect(dx1, dy1, w1, h1, color);
                }
            }
        }
    }
}

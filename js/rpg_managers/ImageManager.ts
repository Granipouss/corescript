import { Bitmap } from '../rpg_core/Bitmap';
import { CacheMap } from '../rpg_core/CacheMap';
import { ImageCache } from '../rpg_core/ImageCache';
import { RequestQueue } from '../rpg_core/RequestQueue';
import { Utils } from '../rpg_core/Utils';

/**
 * The static class that loads images, creates bitmap objects and retains them.
 */
export const ImageManager = new (class ImageManager {
    cache = new CacheMap(this);

    private _imageCache = new ImageCache();
    private _requestQueue = new RequestQueue();
    private _systemReservationId = Utils.generateRuntimeId();

    private _creationHook?: (bitmap: Bitmap) => void;
    private _defaultReservationId?: number;

    private _generateCacheKey(path: string, hue = 0): string {
        return path + ':' + hue;
    }

    loadAnimation(filename: string, hue = 0): Bitmap {
        return this.loadBitmap('img/animations/', filename, hue, true);
    }

    loadBattleback1(filename: string, hue = 0): Bitmap {
        return this.loadBitmap('img/battlebacks1/', filename, hue, true);
    }

    loadBattleback2(filename: string, hue = 0): Bitmap {
        return this.loadBitmap('img/battlebacks2/', filename, hue, true);
    }

    loadEnemy(filename: string, hue = 0): Bitmap {
        return this.loadBitmap('img/enemies/', filename, hue, true);
    }

    loadCharacter(filename: string, hue = 0): Bitmap {
        return this.loadBitmap('img/characters/', filename, hue, false);
    }

    loadFace(filename: string, hue = 0): Bitmap {
        return this.loadBitmap('img/faces/', filename, hue, true);
    }

    loadParallax(filename: string, hue = 0): Bitmap {
        return this.loadBitmap('img/parallaxes/', filename, hue, true);
    }

    loadPicture(filename: string, hue = 0): Bitmap {
        return this.loadBitmap('img/pictures/', filename, hue, true);
    }

    loadSvActor(filename: string, hue = 0): Bitmap {
        return this.loadBitmap('img/sv_actors/', filename, hue, false);
    }

    loadSvEnemy(filename: string, hue = 0): Bitmap {
        return this.loadBitmap('img/sv_enemies/', filename, hue, true);
    }

    loadSystem(filename: string, hue = 0): Bitmap {
        return this.loadBitmap('img/system/', filename, hue, false);
    }

    loadTileset(filename: string, hue = 0): Bitmap {
        return this.loadBitmap('img/tilesets/', filename, hue, false);
    }

    loadTitle1(filename: string, hue = 0): Bitmap {
        return this.loadBitmap('img/titles1/', filename, hue, true);
    }

    loadTitle2(filename: string, hue = 0): Bitmap {
        return this.loadBitmap('img/titles2/', filename, hue, true);
    }

    loadBitmap(folder: string, filename: string, hue = 0, smooth = false): Bitmap {
        if (filename) {
            const path = folder + encodeURIComponent(filename) + '.png';
            const bitmap = this.loadNormalBitmap(path, hue || 0);
            bitmap.smooth = smooth;
            return bitmap;
        } else {
            return this.loadEmptyBitmap();
        }
    }

    loadEmptyBitmap(): Bitmap {
        let empty = this._imageCache.get('empty');
        if (!empty) {
            empty = new Bitmap();
            this._imageCache.add('empty', empty);
            this._imageCache.reserve('empty', empty, this._systemReservationId);
        }

        return empty;
    }

    loadNormalBitmap(path: string, hue = 0): Bitmap {
        const key = this._generateCacheKey(path, hue);
        let bitmap = this._imageCache.get(key);
        if (!bitmap) {
            bitmap = Bitmap.load(path);
            this._callCreationHook(bitmap);

            bitmap.addLoadListener(() => {
                bitmap.rotateHue(hue);
            });
            this._imageCache.add(key, bitmap);
        } else if (!bitmap.isReady()) {
            bitmap.decode();
        }

        return bitmap;
    }

    clear(): void {
        this._imageCache = new ImageCache();
    }

    isReady(): boolean {
        return this._imageCache.isReady();
    }

    isObjectCharacter(filename: string): boolean {
        const sign = filename.match(/^[!$]+/);
        return sign && sign[0].includes('!');
    }

    isBigCharacter(filename: string): boolean {
        const sign = filename.match(/^[!$]+/);
        return sign && sign[0].includes('$');
    }

    isZeroParallax(filename: string): boolean {
        return filename.charAt(0) === '!';
    }

    reserveAnimation(filename: string, hue = 0, reservationId?: number): Bitmap {
        return this.reserveBitmap('img/animations/', filename, hue, true, reservationId);
    }

    reserveBattleback1(filename: string, hue = 0, reservationId?: number): Bitmap {
        return this.reserveBitmap('img/battlebacks1/', filename, hue, true, reservationId);
    }

    reserveBattleback2(filename: string, hue = 0, reservationId?: number): Bitmap {
        return this.reserveBitmap('img/battlebacks2/', filename, hue, true, reservationId);
    }

    reserveEnemy(filename: string, hue = 0, reservationId?: number): Bitmap {
        return this.reserveBitmap('img/enemies/', filename, hue, true, reservationId);
    }

    reserveCharacter(filename: string, hue = 0, reservationId?: number): Bitmap {
        return this.reserveBitmap('img/characters/', filename, hue, false, reservationId);
    }

    reserveFace(filename: string, hue = 0, reservationId?: number): Bitmap {
        return this.reserveBitmap('img/faces/', filename, hue, true, reservationId);
    }

    reserveParallax(filename: string, hue = 0, reservationId?: number): Bitmap {
        return this.reserveBitmap('img/parallaxes/', filename, hue, true, reservationId);
    }

    reservePicture(filename: string, hue = 0, reservationId?: number): Bitmap {
        return this.reserveBitmap('img/pictures/', filename, hue, true, reservationId);
    }

    reserveSvActor(filename: string, hue = 0, reservationId?: number): Bitmap {
        return this.reserveBitmap('img/sv_actors/', filename, hue, false, reservationId);
    }

    reserveSvEnemy(filename: string, hue = 0, reservationId?: number): Bitmap {
        return this.reserveBitmap('img/sv_enemies/', filename, hue, true, reservationId);
    }

    reserveSystem(filename: string, hue = 0, reservationId?: number): Bitmap {
        return this.reserveBitmap('img/system/', filename, hue, false, reservationId || this._systemReservationId);
    }

    reserveTileset(filename: string, hue = 0, reservationId?: number): Bitmap {
        return this.reserveBitmap('img/tilesets/', filename, hue, false, reservationId);
    }

    reserveTitle1(filename: string, hue = 0, reservationId?: number): Bitmap {
        return this.reserveBitmap('img/titles1/', filename, hue, true, reservationId);
    }

    reserveTitle2(filename: string, hue = 0, reservationId?: number): Bitmap {
        return this.reserveBitmap('img/titles2/', filename, hue, true, reservationId);
    }

    reserveBitmap(folder: string, filename: string, hue = 0, smooth = false, reservationId?: number): Bitmap {
        if (filename) {
            const path = folder + encodeURIComponent(filename) + '.png';
            const bitmap = this.reserveNormalBitmap(path, hue || 0, reservationId || this._defaultReservationId);
            bitmap.smooth = smooth;
            return bitmap;
        } else {
            return this.loadEmptyBitmap();
        }
    }

    reserveNormalBitmap(path: string, hue: number, reservationId: number): Bitmap {
        const bitmap = this.loadNormalBitmap(path, hue);
        this._imageCache.reserve(this._generateCacheKey(path, hue), bitmap, reservationId);

        return bitmap;
    }

    releaseReservation(reservationId: number): void {
        this._imageCache.releaseReservation(reservationId);
    }

    setDefaultReservationId(reservationId: number): void {
        this._defaultReservationId = reservationId;
    }

    requestAnimation(filename: string, hue = 0): Bitmap {
        return this.requestBitmap('img/animations/', filename, hue, true);
    }

    requestBattleback1(filename: string, hue = 0): Bitmap {
        return this.requestBitmap('img/battlebacks1/', filename, hue, true);
    }

    requestBattleback2(filename: string, hue = 0): Bitmap {
        return this.requestBitmap('img/battlebacks2/', filename, hue, true);
    }

    requestEnemy(filename: string, hue = 0): Bitmap {
        return this.requestBitmap('img/enemies/', filename, hue, true);
    }

    requestCharacter(filename: string, hue = 0): Bitmap {
        return this.requestBitmap('img/characters/', filename, hue, false);
    }

    requestFace(filename: string, hue = 0): Bitmap {
        return this.requestBitmap('img/faces/', filename, hue, true);
    }

    requestParallax(filename: string, hue = 0): Bitmap {
        return this.requestBitmap('img/parallaxes/', filename, hue, true);
    }

    requestPicture(filename: string, hue = 0): Bitmap {
        return this.requestBitmap('img/pictures/', filename, hue, true);
    }

    requestSvActor(filename: string, hue = 0): Bitmap {
        return this.requestBitmap('img/sv_actors/', filename, hue, false);
    }

    requestSvEnemy(filename: string, hue = 0): Bitmap {
        return this.requestBitmap('img/sv_enemies/', filename, hue, true);
    }

    requestSystem(filename: string, hue = 0): Bitmap {
        return this.requestBitmap('img/system/', filename, hue, false);
    }

    requestTileset(filename: string, hue = 0): Bitmap {
        return this.requestBitmap('img/tilesets/', filename, hue, false);
    }

    requestTitle1(filename: string, hue = 0): Bitmap {
        return this.requestBitmap('img/titles1/', filename, hue, true);
    }

    requestTitle2(filename: string, hue = 0): Bitmap {
        return this.requestBitmap('img/titles2/', filename, hue, true);
    }

    requestBitmap(folder: string, filename: string, hue = 0, smooth = false): Bitmap {
        if (filename) {
            const path = folder + encodeURIComponent(filename) + '.png';
            const bitmap = this.requestNormalBitmap(path, hue || 0);
            bitmap.smooth = smooth;
            return bitmap;
        } else {
            return this.loadEmptyBitmap();
        }
    }

    requestNormalBitmap(path: string, hue = 0): Bitmap {
        const key = this._generateCacheKey(path, hue);
        let bitmap = this._imageCache.get(key);
        if (!bitmap) {
            bitmap = Bitmap.request(path);
            this._callCreationHook(bitmap);

            bitmap.addLoadListener(() => {
                bitmap.rotateHue(hue);
            });
            this._imageCache.add(key, bitmap);
            this._requestQueue.enqueue(key, bitmap);
        } else {
            this._requestQueue.raisePriority(key);
        }

        return bitmap;
    }

    update(): void {
        this._requestQueue.update();
    }

    clearRequest(): void {
        this._requestQueue.clear();
    }

    setCreationHook(hook: (bitmap: Bitmap) => void): void {
        this._creationHook = hook;
    }

    private _callCreationHook(bitmap: Bitmap): void {
        if (this._creationHook) this._creationHook(bitmap);
    }
})();

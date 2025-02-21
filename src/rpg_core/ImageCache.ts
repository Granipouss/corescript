import type { Bitmap } from './Bitmap';

type Entry = {
    bitmap: Bitmap;
    touch: number;
    key: string;
    reservationId?: number;
};

export class ImageCache {
    static limit = 10 * 1000 * 1000;

    private _items: Record<string, Entry> = {};

    add(key: string, value: Bitmap): void {
        this._items[key] = {
            bitmap: value,
            touch: Date.now(),
            key: key,
        };

        this._truncateCache();
    }

    get(key: string): Bitmap | null {
        if (this._items[key]) {
            const item = this._items[key];
            item.touch = Date.now();
            return item.bitmap;
        }

        return null;
    }

    reserve(key: string, value: Bitmap, reservationId: number): void {
        if (!this._items[key]) {
            this._items[key] = {
                bitmap: value,
                touch: Date.now(),
                key: key,
            };
        }

        this._items[key].reservationId = reservationId;
    }

    releaseReservation(reservationId: number): void {
        const items = this._items;

        Object.keys(items)
            .map((key) => items[key])
            .forEach((item) => {
                if (item.reservationId === reservationId) {
                    delete item.reservationId;
                }
            });
    }

    private _truncateCache(): void {
        const items = this._items;
        let sizeLeft = ImageCache.limit;

        Object.keys(items)
            .map((key) => items[key])
            .sort((a, b) => b.touch - a.touch)
            .forEach((item) => {
                if (sizeLeft > 0 || this._mustBeHeld(item)) {
                    const bitmap = item.bitmap;
                    sizeLeft -= bitmap.width * bitmap.height;
                } else {
                    delete items[item.key];
                }
            });
    }

    private _mustBeHeld(item: Entry): boolean {
        // request only is weak so It's purgeable
        if (item.bitmap.isRequestOnly()) return false;
        // reserved item must be held
        if (item.reservationId) return true;
        // not ready bitmap must be held (because of checking isReady())
        if (!item.bitmap.isReady()) return true;
        // then the item may purgeable
        return false;
    }

    isReady(): boolean {
        const items = this._items;
        return !Object.keys(items).some((key) => !items[key].bitmap.isRequestOnly() && !items[key].bitmap.isReady());
    }

    getErrorBitmap(): Bitmap | null {
        const items = this._items;
        let bitmap: Bitmap | null = null;
        if (
            Object.keys(items).some((key) => {
                if (items[key].bitmap.isError()) {
                    bitmap = items[key].bitmap;
                    return true;
                }
                return false;
            })
        ) {
            return bitmap;
        }

        return null;
    }
}

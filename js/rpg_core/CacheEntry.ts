import type { CacheMap } from './CacheMap';

/**
 * The resource class. Allows to be collected as a garbage if not use for some time or ticks
 */
export class CacheEntry<T> {
    constructor(
        readonly cache: CacheMap<T>, //
        readonly key: string,
        readonly item: T
    ) {}

    cached = false;
    touchTicks = 0;
    touchSeconds = 0;
    ttlTicks = 0;
    ttlSeconds = 0;
    freedByTTL = false;

    /**
     * frees the resource
     */
    free(byTTL = false) {
        this.freedByTTL = byTTL;
        if (this.cached) {
            this.cached = false;
            delete this.cache._inner[this.key];
        }
    }

    /**
     * Allocates the resource
     */
    allocate(): this {
        if (!this.cached) {
            this.cache._inner[this.key] = this;
            this.cached = true;
        }
        this.touch();
        return this;
    }

    /**
     * Sets the time to live
     * @param ticks TTL in ticks, 0 if not set
     * @param seconds TTL in seconds, 0 if not set
     */
    setTimeToLive(ticks = 0, seconds = 0): this {
        this.ttlTicks = ticks;
        this.ttlSeconds = seconds;
        return this;
    }

    isStillAlive(): boolean {
        const cache = this.cache;
        return (
            (this.ttlTicks == 0 || this.touchTicks + this.ttlTicks < cache.updateTicks) &&
            (this.ttlSeconds == 0 || this.touchSeconds + this.ttlSeconds < cache.updateSeconds)
        );
    }

    /**
     * makes sure that resource wont freed by Time To Live
     * if resource was already freed by TTL, put it in cache again
     */
    touch(): void {
        const cache = this.cache;
        if (this.cached) {
            this.touchTicks = cache.updateTicks;
            this.touchSeconds = cache.updateSeconds;
        } else if (this.freedByTTL) {
            this.freedByTTL = false;
            if (!cache._inner[this.key]) {
                cache._inner[this.key] = this;
            }
        }
    }
}

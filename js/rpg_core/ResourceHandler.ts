import { Graphics } from './Graphics';

import { SceneManager } from '../rpg_managers/SceneManager';

/**
 * The static class that handles resource loading.
 */
export const ResourceHandler = new (class ResourceHandler {
    private _reloaders: (() => void)[] = [];
    private _defaultRetryInterval = [500, 1000, 3000];

    createLoader(
        url: string,
        retryMethod: () => void,
        resignMethod?: () => void,
        retryInterval = this._defaultRetryInterval
    ): () => void {
        const reloaders = this._reloaders;
        let retryCount = 0;
        return function () {
            if (retryCount < retryInterval.length) {
                setTimeout(retryMethod, retryInterval[retryCount]);
                retryCount++;
            } else {
                if (resignMethod) {
                    resignMethod();
                }
                if (url) {
                    if (reloaders.length === 0) {
                        Graphics.printLoadingError(url);
                        SceneManager.stop();
                    }
                    reloaders.push(() => {
                        retryCount = 0;
                        retryMethod();
                    });
                }
            }
        };
    }

    exists(): boolean {
        return this._reloaders.length > 0;
    }

    retry(): void {
        if (this._reloaders.length > 0) {
            Graphics.eraseLoadingError();
            SceneManager.resume();
            this._reloaders.forEach((reloader) => {
                reloader();
            });
            this._reloaders.length = 0;
        }
    }
})();

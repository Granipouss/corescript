import { Graphics } from '../rpg_core/Graphics';
import { SceneManager } from '../rpg_managers/SceneManager';

/**
 * The static class that handles resource loading.
 */
export const ResourceHandler = new (class ResourceHandler {
    _reloaders = [];
    _defaultRetryInterval = [500, 1000, 3000];

    createLoader(url, retryMethod, resignMethod, retryInterval) {
        retryInterval = retryInterval || this._defaultRetryInterval;
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
                    reloaders.push(function () {
                        retryCount = 0;
                        retryMethod();
                    });
                }
            }
        };
    }

    exists() {
        return this._reloaders.length > 0;
    }

    retry() {
        if (this._reloaders.length > 0) {
            Graphics.eraseLoadingError();
            SceneManager.resume();
            this._reloaders.forEach(function (reloader) {
                reloader();
            });
            this._reloaders.length = 0;
        }
    }
})();

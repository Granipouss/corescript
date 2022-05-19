import { AudioManager } from '../rpg_managers/AudioManager';
import { ImageManager } from '../rpg_managers/ImageManager';

export const ProgressWatcher = new (class ProgressWatcher {
    // FIXME:
    initialize() {
        this.clearProgress();
        ImageManager.setCreationHook(this._bitmapListener.bind(this));
        AudioManager.setCreationHook(this._audioListener.bind(this));
    }

    _bitmapListener(bitmap) {
        this._countLoading++;
        bitmap.addLoadListener(() => {
            this._countLoaded++;
            this._progressListener(this._countLoaded, this._countLoading);
        });
    }

    _audioListener(audio) {
        this._countLoading++;
        audio.addLoadListener(() => {
            this._countLoaded++;
            this._progressListener(this._countLoaded, this._countLoading);
        });
    }

    setProgressListener(progressListener) {
        this._progressListener = progressListener;
    }

    clearProgress() {
        this._countLoading = 0;
        this._countLoaded = 0;
    }

    truncateProgress() {
        if (this._countLoaded) {
            this._countLoading -= this._countLoaded;
            this._countLoaded = 0;
        }
    }
})();

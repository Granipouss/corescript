import { AudioManager } from '../rpg_managers/AudioManager';
import { ImageManager } from '../rpg_managers/ImageManager';
import type { Bitmap } from './Bitmap';
import type { WebAudio } from './WebAudio';

export const ProgressWatcher = new (class ProgressWatcher {
    private _countLoading = 0;
    private _countLoaded = 0;
    private _progressListener: (countLoaded: number, countLoading: number) => void;

    // FIXME:
    initialize(): void {
        this.clearProgress();
        ImageManager.setCreationHook(this._bitmapListener.bind(this));
        AudioManager.setCreationHook(this._audioListener.bind(this));
    }

    private _bitmapListener(bitmap: Bitmap): void {
        this._countLoading++;
        bitmap.addLoadListener(() => {
            this._countLoaded++;
            this._progressListener(this._countLoaded, this._countLoading);
        });
    }

    private _audioListener(audio: WebAudio): void {
        this._countLoading++;
        audio.addLoadListener(() => {
            this._countLoaded++;
            this._progressListener(this._countLoaded, this._countLoading);
        });
    }

    setProgressListener(progressListener: (countLoaded: number, countLoading: number) => void): void {
        this._progressListener = progressListener;
    }

    clearProgress(): void {
        this._countLoading = 0;
        this._countLoaded = 0;
    }

    truncateProgress(): void {
        if (this._countLoaded) {
            this._countLoading -= this._countLoaded;
            this._countLoaded = 0;
        }
    }
})();

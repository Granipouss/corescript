export const ProgressWatcher = new (class ProgressWatcher {
    private _countLoading = 0;
    private _countLoaded = 0;
    private _progressListener: (countLoaded: number, countLoading: number) => void;

    makeLoaderListener(): () => void {
        this._countLoading++;
        return () => {
            this._countLoaded++;
            this._progressListener(this._countLoaded, this._countLoading);
        };
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

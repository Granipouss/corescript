import { Decrypter } from './Decrypter';

/**
 * The static class that handles HTML5 Audio.
 */
export const Html5Audio = new (class Html5Audio {
    private _initialized = false;
    private _unlocked = false;
    private _audioElement: HTMLAudioElement = null;
    private _gainTweenInterval = null;
    private _tweenGain = 0;
    private _tweenTargetGain = 0;
    private _tweenGainStep = 0;
    private _staticSePath = null;
    private _url: string;
    private _isLoading: boolean;
    private _buffered: boolean;
    private _hasError: boolean;
    private _volume: number;
    private _loadListeners: (() => void)[];
    private _autoPlay: boolean;
    private _tweenInterval: NodeJS.Timeout;

    /**
     * Sets up the Html5 Audio.
     * @param url The url of the audio file
     */
    setup(url: string): void {
        if (!this._initialized) {
            this.initialize();
        }
        this.clear();

        if (Decrypter.hasEncryptedAudio && this._audioElement.src) {
            window.URL.revokeObjectURL(this._audioElement.src);
        }
        this._url = url;
    }

    /**
     * Initializes the audio system.
     * @return True if the audio system is available
     */
    initialize(): boolean {
        if (!this._initialized) {
            if (!this._audioElement) {
                try {
                    this._audioElement = new Audio();
                } catch (e) {
                    this._audioElement = null;
                }
            }
            if (this._audioElement) this._setupEventHandlers();
            this._initialized = true;
        }
        return !!this._audioElement;
    }

    private _setupEventHandlers(): void {
        document.addEventListener('touchstart', this._onTouchStart.bind(this));
        document.addEventListener('visibilitychange', this._onVisibilityChange.bind(this));
        this._audioElement.addEventListener('loadeddata', this._onLoadedData.bind(this));
        this._audioElement.addEventListener('error', this._onError.bind(this));
        this._audioElement.addEventListener('ended', this._onEnded.bind(this));
    }

    private _onTouchStart(): void {
        if (this._audioElement && !this._unlocked) {
            if (this._isLoading) {
                this._load(this._url);
                this._unlocked = true;
            } else {
                if (this._staticSePath) {
                    this._audioElement.src = this._staticSePath;
                    this._audioElement.volume = 0;
                    this._audioElement.loop = false;
                    this._audioElement.play();
                    this._unlocked = true;
                }
            }
        }
    }

    private _onVisibilityChange(): void {
        if (document.visibilityState === 'hidden') {
            this._onHide();
        } else {
            this._onShow();
        }
    }

    private _onLoadedData(): void {
        this._buffered = true;
        if (this._unlocked) this._onLoad();
    }

    private _onError(): void {
        this._hasError = true;
    }

    private _onEnded(): void {
        if (!this._audioElement.loop) {
            this.stop();
        }
    }

    private _onHide(): void {
        this._audioElement.volume = 0;
        this._tweenGain = 0;
    }

    private _onShow(): void {
        this.fadeIn(0.5);
    }

    /**
     * Clears the audio data.
     */
    clear() {
        this.stop();
        this._volume = 1;
        this._loadListeners = [];
        this._hasError = false;
        this._autoPlay = false;
        this._isLoading = false;
        this._buffered = false;
    }

    /**
     * Set the URL of static se.
     * @param {String} url
     */
    setStaticSe(url: string): void {
        if (!this._initialized) {
            this.initialize();
            this.clear();
        }
        this._staticSePath = url;
    }

    /**
     * [read-only] The url of the audio file.
     */
    get url(): string {
        return this._url;
    }

    /**
     * The volume of the audio.
     */
    get volume(): number {
        return this._volume;
    }
    set volume(value: number) {
        this._volume = value;
        if (this._audioElement) {
            this._audioElement.volume = this._volume;
        }
    }

    /**
     * Checks whether the audio data is ready to play.
     */
    isReady(): boolean {
        return this._buffered;
    }

    /**
     * Checks whether a loading error has occurred.
     */
    isError(): boolean {
        return this._hasError;
    }

    /**
     * Checks whether the audio is playing.
     */
    isPlaying(): boolean {
        return !this._audioElement.paused;
    }

    /**
     * Plays the audio.
     * @param loop Whether the audio data play in a loop
     * @param offset The start position to play in seconds
     */
    play(loop: boolean, offset = 0): void {
        if (this.isReady()) {
            offset = offset || 0;
            this._startPlaying(loop, offset);
        } else if (this._audioElement) {
            this._autoPlay = true;
            this.addLoadListener(() => {
                if (this._autoPlay) {
                    this.play(loop, offset);
                    if (this._gainTweenInterval) {
                        clearInterval(this._gainTweenInterval);
                        this._gainTweenInterval = null;
                    }
                }
            });
            if (!this._isLoading) this._load(this._url);
        }
    }

    /**
     * Stops the audio.
     */
    stop() {
        if (this._audioElement) this._audioElement.pause();
        this._autoPlay = false;
        if (this._tweenInterval) {
            clearInterval(this._tweenInterval);
            this._tweenInterval = null;
            this._audioElement.volume = 0;
        }
    }

    /**
     * Performs the audio fade-in.
     * @param {Number} duration Fade-in time in seconds
     */
    fadeIn(duration: number): void {
        if (this.isReady()) {
            if (this._audioElement) {
                this._tweenTargetGain = this._volume;
                this._tweenGain = 0;
                this._startGainTween(duration);
            }
        } else if (this._autoPlay) {
            this.addLoadListener(() => {
                this.fadeIn(duration);
            });
        }
    }

    /**
     * Performs the audio fade-out.
     * @param duration Fade-out time in seconds
     */
    fadeOut(duration: number): void {
        if (this._audioElement) {
            this._tweenTargetGain = 0;
            this._tweenGain = this._volume;
            this._startGainTween(duration);
        }
    }

    /**
     * Gets the seek position of the audio.
     */
    seek(): number {
        if (this._audioElement) {
            return this._audioElement.currentTime;
        } else {
            return 0;
        }
    }

    /**
     * Add a callback function that will be called when the audio data is loaded.
     */
    addLoadListener(listner: () => void): void {
        this._loadListeners.push(listner);
    }

    private _load(url: string): void {
        if (this._audioElement) {
            this._isLoading = true;
            this._audioElement.src = url;
            this._audioElement.load();
        }
    }

    private _startPlaying(loop: boolean, offset: number): void {
        this._audioElement.loop = loop;
        if (this._gainTweenInterval) {
            clearInterval(this._gainTweenInterval);
            this._gainTweenInterval = null;
        }
        if (this._audioElement) {
            this._audioElement.volume = this._volume;
            this._audioElement.currentTime = offset;
            this._audioElement.play();
        }
    }

    private _onLoad(): void {
        this._isLoading = false;
        while (this._loadListeners.length > 0) {
            const listener = this._loadListeners.shift();
            listener();
        }
    }

    private _startGainTween(duration: number): void {
        this._audioElement.volume = this._tweenGain;
        if (this._gainTweenInterval) {
            clearInterval(this._gainTweenInterval);
            this._gainTweenInterval = null;
        }
        this._tweenGainStep = (this._tweenTargetGain - this._tweenGain) / (60 * duration);
        this._gainTweenInterval = setInterval(() => {
            this._applyTweenValue(this._tweenTargetGain);
        }, 1000 / 60);
    }

    private _applyTweenValue(volume: number): void {
        this._tweenGain += this._tweenGainStep;
        if (this._tweenGain < 0 && this._tweenGainStep < 0) {
            this._tweenGain = 0;
        } else if (this._tweenGain > volume && this._tweenGainStep > 0) {
            this._tweenGain = volume;
        }

        if (Math.abs(this._tweenTargetGain - this._tweenGain) < 0.01) {
            this._tweenGain = this._tweenTargetGain;
            clearInterval(this._gainTweenInterval);
            this._gainTweenInterval = null;
        }

        this._audioElement.volume = this._tweenGain;
    }
})();

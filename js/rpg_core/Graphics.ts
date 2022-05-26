// FIXME:
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as PIXI from 'pixi.js';

import { ProgressWatcher } from './ProgressWatcher';
import { ResourceHandler } from './ResourceHandler';
import { Utils } from './Utils';

import { SceneManager } from '../rpg_managers/SceneManager';
import { clamp, format } from './extension';
import type { Stage } from './Stage';

export type RendererType = 'canvas' | 'webgl' | 'auto';

declare const FPSMeter: new (options: unknown) => any;

/**
 * The static class that carries out graphics processing.
 */
export const Graphics = new (class Graphics {
    private _cssFontLoading = document.fonts && document.fonts.ready && document.fonts.ready.then;
    private _fontLoaded = null;
    private _videoVolume = 1;

    private _width: number;
    private _height: number;
    private _rendererType: RendererType;
    private _boxWidth: number;
    private _boxHeight: number;

    private _scale: number;
    private _realScale: number;

    private _errorShowed: boolean;
    private _errorPrinter: HTMLElement;
    private _canvas: HTMLCanvasElement;
    private _video: HTMLVideoElement;
    private _videoUnlocked: boolean;
    private _videoLoading: boolean;
    private _upperCanvas: HTMLCanvasElement;
    private _renderer: PIXI.SystemRenderer;
    private _fpsMeter: any;
    private _modeBox: HTMLElement;
    private _skipCount: number;
    private _maxSkip: number;
    private _rendered: boolean;
    private _loadingImage: HTMLImageElement;
    private _loadingCount: number;
    private _fpsMeterToggled: boolean;
    private _stretchEnabled: boolean;

    private _canUseDifferenceBlend: boolean;
    private _canUseSaturationBlend: boolean;
    private _hiddenCanvas: HTMLCanvasElement;

    private _progressEnabled: boolean;
    private _progressTimeout: NodeJS.Timeout;
    private _progressElement: HTMLDivElement;
    private _barElement: HTMLDivElement;
    private _filledBarElement: HTMLDivElement;
    private _errorMessage: string;
    private _showErrorDetail: boolean;
    private _videoLoader: () => void;

    // FIXME:
    /**
     * Initializes the graphics system.
     */
    initialize(width: number, height: number, type: RendererType): void {
        this._width = width || 800;
        this._height = height || 600;
        this._rendererType = type || 'auto';
        this._boxWidth = this._width;
        this._boxHeight = this._height;

        this._scale = 1;
        this._realScale = 1;

        this._errorShowed = false;
        this._errorPrinter = null;
        this._canvas = null;
        this._video = null;
        this._videoUnlocked = false;
        this._videoLoading = false;
        this._upperCanvas = null;
        this._renderer = null;
        this._fpsMeter = null;
        this._modeBox = null;
        this._skipCount = 0;
        this._maxSkip = 3;
        this._rendered = false;
        this._loadingImage = null;
        this._loadingCount = 0;
        this._fpsMeterToggled = false;
        this._stretchEnabled = this._defaultStretchMode();

        this._canUseDifferenceBlend = false;
        this._canUseSaturationBlend = false;
        this._hiddenCanvas = null;

        this._testCanvasBlendModes();
        this._modifyExistingElements();
        this._updateRealScale();
        this._createAllElements();
        this._disableTextSelection();
        this._disableContextMenu();
        this._setupEventHandlers();
        this._setupCssFontLoading();
        this._setupProgress();
    }

    private _setupCssFontLoading(): void {
        if (this._cssFontLoading) {
            document.fonts.ready
                .then((fonts) => {
                    this._fontLoaded = fonts;
                })
                .catch((error) => {
                    SceneManager.onError(error);
                });
        }
    }

    canUseCssFontLoading(): boolean {
        return !!this._cssFontLoading;
    }

    /**
     * The total frame count of the game screen.
     */
    frameCount = 0;

    /**
     * The alias of PIXI.blendModes.NORMAL.
     */
    readonly BLEND_NORMAL = 0;

    /**
     * The alias of PIXI.blendModes.ADD.
     */
    readonly BLEND_ADD = 1;

    /**
     * The alias of PIXI.blendModes.MULTIPLY.
     */
    readonly BLEND_MULTIPLY = 2;

    /**
     * The alias of PIXI.blendModes.SCREEN.
     */
    readonly BLEND_SCREEN = 3;

    /**
     * Marks the beginning of each frame for FPSMeter.
     */
    tickStart(): void {
        if (this._fpsMeter) {
            this._fpsMeter.tickStart();
        }
    }

    /**
     * Marks the end of each frame for FPSMeter.
     */
    tickEnd(): void {
        if (this._fpsMeter && this._rendered) {
            this._fpsMeter.tick();
        }
    }

    /**
     * Renders the stage to the game screen.
     */
    render(stage: Stage): void {
        if (this._skipCount <= 0) {
            const startTime = Date.now();
            if (stage) {
                this._renderer.render(stage);
                if (this._renderer instanceof PIXI.WebGLRenderer) {
                    this._renderer.gl.flush();
                }
            }
            const endTime = Date.now();
            const elapsed = endTime - startTime;
            this._skipCount = Math.min(Math.floor(elapsed / 15), this._maxSkip);
            this._rendered = true;
        } else {
            this._skipCount--;
            this._rendered = false;
        }
        this.frameCount++;
    }

    /**
     * Checks whether the renderer type is WebGL.
     */
    isWebGL(): boolean {
        return this._renderer && this._renderer.type === PIXI.RENDERER_TYPE.WEBGL;
    }

    /**
     * Checks whether the current browser supports WebGL.
     */
    hasWebGL(): boolean {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }

    /**
     * Checks whether the canvas blend mode 'difference' is supported.
     */
    canUseDifferenceBlend(): boolean {
        return this._canUseDifferenceBlend;
    }

    /**
     * Checks whether the canvas blend mode 'saturation' is supported.
     */
    canUseSaturationBlend(): boolean {
        return this._canUseSaturationBlend;
    }

    /**
     * Sets the source of the "Now Loading" image.
     */
    setLoadingImage(src: string): void {
        this._loadingImage = new Image();
        this._loadingImage.src = src;
    }

    /**
     * Sets whether the progress bar is enabled.
     */
    setProgressEnabled(enable: boolean): void {
        this._progressEnabled = enable;
    }

    /**
     * Initializes the counter for displaying the "Now Loading" image.
     */
    startLoading() {
        this._loadingCount = 0;

        ProgressWatcher.truncateProgress();
        ProgressWatcher.setProgressListener(this._updateProgressCount.bind(this));
        this._progressTimeout = setTimeout(() => {
            this._showProgress();
        }, 1500);
    }

    private _setupProgress(): void {
        this._progressElement = document.createElement('div');
        this._progressElement.id = 'loading-progress';
        this._progressElement.style.visibility = 'hidden';

        this._barElement = document.createElement('div');
        this._barElement.id = 'loading-bar';
        this._barElement.style.width = '100%';
        this._barElement.style.height = '10%';
        this._barElement.style.background = 'linear-gradient(to top, gray, lightgray)';
        this._barElement.style.border = '5px solid white';
        this._barElement.style.borderRadius = '15px';
        this._barElement.style.marginTop = '40%';

        this._filledBarElement = document.createElement('div');
        this._filledBarElement.id = 'loading-filled-bar';
        this._filledBarElement.style.width = '0%';
        this._filledBarElement.style.height = '100%';
        this._filledBarElement.style.background = 'linear-gradient(to top, lime, honeydew)';
        this._filledBarElement.style.borderRadius = '10px';

        this._progressElement.appendChild(this._barElement);
        this._barElement.appendChild(this._filledBarElement);
        this._updateProgress();

        document.body.appendChild(this._progressElement);
    }

    private _showProgress(): void {
        if (this._progressEnabled) {
            // FIXME:
            // this._progressElement.value = 0;
            this._progressElement.style.visibility = 'visible';
            this._progressElement.style.zIndex = '98';
        }
    }

    private _hideProgress(): void {
        this._progressElement.style.visibility = 'hidden';
        clearTimeout(this._progressTimeout);
    }

    private _updateProgressCount(countLoaded, countLoading): void {
        let progressValue;
        if (countLoading !== 0) {
            progressValue = (countLoaded / countLoading) * 100;
        } else {
            progressValue = 100;
        }

        this._filledBarElement.style.width = progressValue + '%';
    }

    private _updateProgress(): void {
        this._centerElement(this._progressElement, 600, 300);
    }

    /**
     * Increments the loading counter and displays the "Now Loading" image if necessary.
     */
    updateLoading(): void {
        this._loadingCount++;
        this._paintUpperCanvas();
        this._upperCanvas.style.opacity = '1';
        this._updateProgress();
    }

    /**
     * Erases the "Now Loading" image.
     */
    endLoading(): void {
        this._clearUpperCanvas();
        this._upperCanvas.style.opacity = '0';
        this._hideProgress();
    }

    /**
     * Displays the loading error text to the screen.
     */
    printLoadingError(url: string): void {
        if (this._errorPrinter && !this._errorShowed) {
            this._updateErrorPrinter();
            this._errorPrinter.innerHTML = this._makeErrorHtml('Loading Error', 'Failed to load: ' + url);
            this._errorPrinter.style.userSelect = 'text';
            (this._errorPrinter as any).style.webkitUserSelect = 'text';
            (this._errorPrinter as any).style.msUserSelect = 'text';
            (this._errorPrinter as any).style.mozUserSelect = 'text';
            this._errorPrinter.oncontextmenu = null; // enable context menu
            const button = document.createElement('button');
            button.innerHTML = 'Retry';
            button.style.fontSize = '24px';
            button.style.color = '#ffffff';
            button.style.backgroundColor = '#000000';
            button.addEventListener('touchstart', (event) => {
                event.stopPropagation();
            });
            button.addEventListener('click', (_event) => {
                ResourceHandler.retry();
            });
            this._errorPrinter.appendChild(button);
            this._loadingCount = -Infinity;
        }
    }

    /**
     * Erases the loading error text.
     */
    eraseLoadingError(): void {
        if (this._errorPrinter && !this._errorShowed) {
            this._errorPrinter.innerHTML = '';
            this._errorPrinter.style.userSelect = 'none';
            (this._errorPrinter as any).style.webkitUserSelect = 'none';
            (this._errorPrinter as any).style.msUserSelect = 'none';
            (this._errorPrinter as any).style.mozUserSelect = 'none';
            this._errorPrinter.oncontextmenu = function () {
                return false;
            };
            this.startLoading();
        }
    }

    // The following code is partly borrowed from triacontane.

    /**
     * Displays the error text to the screen.
     */
    printError(name: string, message: string): void {
        this._errorShowed = true;
        this._hideProgress();
        this.hideFps();
        if (this._errorPrinter) {
            this._updateErrorPrinter();
            this._errorPrinter.innerHTML = this._makeErrorHtml(name, message);
            this._errorPrinter.style.userSelect = 'text';
            (this._errorPrinter as any).style.webkitUserSelect = 'text';
            (this._errorPrinter as any).style.msUserSelect = 'text';
            (this._errorPrinter as any).style.mozUserSelect = 'text';
            this._errorPrinter.oncontextmenu = null; // enable context menu
            if (this._errorMessage) {
                this._makeErrorMessage();
            }
        }
        this._applyCanvasFilter();
        this._clearUpperCanvas();
    }

    /**
     * Shows the detail of error.
     */
    printErrorDetail(error: any) {
        if (this._errorPrinter && this._showErrorDetail) {
            const eventInfo = this._formatEventInfo(error);
            const eventCommandInfo = this._formatEventCommandInfo(error);
            const info = eventCommandInfo ? eventInfo + ', ' + eventCommandInfo : eventInfo;
            const stack = this._formatStackTrace(error);
            this._makeErrorDetail(info, stack);
        }
    }

    /**
     * Sets the error message.
     */
    setErrorMessage(message: string): void {
        this._errorMessage = message;
    }

    /**
     * Sets whether shows the detail of error.
     */
    setShowErrorDetail(showErrorDetail: boolean): void {
        this._showErrorDetail = showErrorDetail;
    }

    /**
     * Shows the FPSMeter element.
     */
    showFps(): void {
        if (this._fpsMeter) {
            this._fpsMeter.show();
            this._modeBox.style.opacity = '1';
        }
    }

    /**
     * Hides the FPSMeter element.
     */
    hideFps(): void {
        if (this._fpsMeter) {
            this._fpsMeter.hide();
            this._modeBox.style.opacity = '0';
        }
    }

    /**
     * Loads a font file.
     */
    loadFont(name: string, url: string): void {
        const style = document.createElement('style');
        const head = document.getElementsByTagName('head');
        const rule = '@font-face { font-family: "' + name + '"; src: url("' + url + '"); }';
        style.type = 'text/css';
        head.item(0).appendChild(style);
        style.sheet.insertRule(rule, 0);
        this._createFontLoader(name);
    }

    /**
     * Checks whether the font file is loaded.
     */
    isFontLoaded(name: string): boolean {
        if (this._cssFontLoading) {
            if (this._fontLoaded) {
                return this._fontLoaded.check('10px "' + name + '"');
            }

            return false;
        } else {
            if (!this._hiddenCanvas) {
                this._hiddenCanvas = document.createElement('canvas');
            }
            const context = this._hiddenCanvas.getContext('2d');
            const text = 'abcdefghijklmnopqrstuvwxyz';
            context.font = '40px ' + name + ', sans-serif';
            const width1 = context.measureText(text).width;
            context.font = '40px sans-serif';
            const width2 = context.measureText(text).width;
            return width1 !== width2;
        }
    }

    /**
     * Starts playback of a video.
     */
    playVideo(src: string) {
        this._videoLoader = ResourceHandler.createLoader(
            null,
            this._playVideo.bind(this, src),
            this._onVideoError.bind(this)
        );
        this._playVideo(src);
    }

    private _playVideo(src: string) {
        this._video.src = src;
        this._video.onloadeddata = this._onVideoLoad.bind(this);
        this._video.onerror = this._videoLoader;
        this._video.onended = this._onVideoEnd.bind(this);
        this._video.load();
        this._videoLoading = true;
    }

    /**
     * Checks whether the video is playing.
     */
    isVideoPlaying(): boolean {
        return this._videoLoading || this._isVideoVisible();
    }

    /**
     * Checks whether the browser can play the specified video type.
     */
    canPlayVideoType(type: string): boolean {
        return this._video && !!this._video.canPlayType(type);
    }

    /**
     * Sets volume of a video.
     */
    setVideoVolume(value: number) {
        this._videoVolume = value;
        if (this._video) {
            this._video.volume = this._videoVolume;
        }
    }

    /**
     * Converts an x coordinate on the page to the corresponding
     * x coordinate on the canvas area.
     */
    pageToCanvasX(x: number): number {
        if (this._canvas) {
            const left = this._canvas.offsetLeft;
            return Math.round((x - left) / this._realScale);
        } else {
            return 0;
        }
    }

    /**
     * Converts a y coordinate on the page to the corresponding
     * y coordinate on the canvas area.
     */
    pageToCanvasY(y: number): number {
        if (this._canvas) {
            const top = this._canvas.offsetTop;
            return Math.round((y - top) / this._realScale);
        } else {
            return 0;
        }
    }

    /**
     * Checks whether the specified point is inside the game canvas area.
     */
    isInsideCanvas(x: number, y: number): boolean {
        return x >= 0 && x < this._width && y >= 0 && y < this._height;
    }

    /**
     * Calls pixi.js garbage collector
     */
    callGC(): void {
        if (this._renderer instanceof PIXI.WebGLRenderer) {
            this._renderer.textureGC.run();
        }
    }

    /**
     * The width of the game screen.
     */
    get width(): number {
        return this._width;
    }
    set width(value: number) {
        if (this._width !== value) {
            this._width = value;
            this._updateAllElements();
        }
    }

    /**
     * The height of the game screen.
     */
    get height(): number {
        return this._height;
    }
    set height(value: number) {
        if (this._height !== value) {
            this._height = value;
            this._updateAllElements();
        }
    }

    /**
     * The width of the window display area.
     */
    get boxWidth(): number {
        return this._boxWidth;
    }
    set boxWidth(value: number) {
        this._boxWidth = value;
    }

    /**
     * The height of the window display area.
     */
    get boxHeight(): number {
        return this._boxHeight;
    }
    set boxHeight(value: number) {
        this._boxHeight = value;
    }

    /**
     * The zoom scale of the game screen.
     */
    get scale(): number {
        return this._scale;
    }
    set scale(value: number) {
        if (this._scale !== value) {
            this._scale = value;
            this._updateAllElements();
        }
    }

    private _createAllElements(): void {
        this._createErrorPrinter();
        this._createCanvas();
        this._createVideo();
        this._createUpperCanvas();
        this._createRenderer();
        this._createFPSMeter();
        this._createModeBox();
        this._createGameFontLoader();
    }

    private _updateAllElements(): void {
        this._updateRealScale();
        this._updateErrorPrinter();
        this._updateCanvas();
        this._updateVideo();
        this._updateUpperCanvas();
        this._updateRenderer();
        this._paintUpperCanvas();
        this._updateProgress();
    }

    private _updateRealScale() {
        if (this._stretchEnabled) {
            let h = window.innerWidth / this._width;
            let v = window.innerHeight / this._height;
            if (h >= 1 && h - 0.01 <= 1) h = 1;
            if (v >= 1 && v - 0.01 <= 1) v = 1;
            this._realScale = Math.min(h, v);
        } else {
            this._realScale = this._scale;
        }
    }

    private _makeErrorHtml(name: string, message: string): string {
        return (
            '<font color="yellow"><b>' +
            name +
            '</b></font><br>' +
            '<font color="white">' +
            decodeURIComponent(message) +
            '</font><br>'
        );
    }

    private _defaultStretchMode(): boolean {
        return Utils.isNwjs() || Utils.isMobileDevice();
    }

    private _testCanvasBlendModes(): void {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const context = canvas.getContext('2d');
        context.globalCompositeOperation = 'source-over';
        context.fillStyle = 'white';
        context.fillRect(0, 0, 1, 1);
        context.globalCompositeOperation = 'difference';
        context.fillStyle = 'white';
        context.fillRect(0, 0, 1, 1);
        const imageData1 = context.getImageData(0, 0, 1, 1);
        context.globalCompositeOperation = 'source-over';
        context.fillStyle = 'black';
        context.fillRect(0, 0, 1, 1);
        context.globalCompositeOperation = 'saturation';
        context.fillStyle = 'white';
        context.fillRect(0, 0, 1, 1);
        const imageData2 = context.getImageData(0, 0, 1, 1);
        this._canUseDifferenceBlend = imageData1.data[0] === 0;
        this._canUseSaturationBlend = imageData2.data[0] === 0;
    }

    private _modifyExistingElements(): void {
        const elements = document.getElementsByTagName('*');
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i] as HTMLElement;
            if (Number(element.style.zIndex) > 0) {
                element.style.zIndex = '0';
            }
        }
    }

    private _createErrorPrinter(): void {
        this._errorPrinter = document.createElement('p');
        this._errorPrinter.id = 'ErrorPrinter';
        this._updateErrorPrinter();
        document.body.appendChild(this._errorPrinter);
    }

    private _updateErrorPrinter(): void {
        const width = this._width * 0.9;
        let height: number;
        if (this._errorShowed && this._showErrorDetail) {
            height = this._height * 0.9;
        } else if (this._errorShowed && this._errorMessage) {
            height = 100;
        } else {
            height = 40;
        }
        this._errorPrinter.style.textAlign = 'center';
        this._errorPrinter.style.textShadow = '1px 1px 3px #000';
        this._errorPrinter.style.fontSize = '20px';
        this._errorPrinter.style.zIndex = '99';
        this._centerElement(this._errorPrinter, width, height);
    }

    private _makeErrorMessage(): void {
        const mainMessage = document.createElement('div');
        const style = mainMessage.style;
        style.color = 'white';
        style.textAlign = 'left';
        style.fontSize = '18px';
        mainMessage.innerHTML = '<hr>' + this._errorMessage;
        this._errorPrinter.appendChild(mainMessage);
    }

    private _makeErrorDetail(info: string, stack: string): void {
        const detail = document.createElement('div');
        const style = detail.style;
        style.color = 'white';
        style.textAlign = 'left';
        style.fontSize = '18px';
        detail.innerHTML = '<br><hr>' + info + '<br><br>' + stack;
        this._errorPrinter.appendChild(detail);
    }

    private _formatEventInfo(error: any): string {
        switch (String(error.eventType)) {
            case 'map_event':
                return format(
                    'MapID: %1, MapEventID: %2, page: %3, line: %4',
                    error.mapId,
                    error.mapEventId,
                    error.page,
                    error.line
                );
            case 'common_event':
                return format('CommonEventID: %1, line: %2', error.commonEventId, error.line);
            case 'battle_event':
                return format('TroopID: %1, page: %2, line: %3', error.troopId, error.page, error.line);
            case 'test_event':
                return format('TestEvent, line: %1', error.line);
            default:
                return 'No information';
        }
    }

    private _formatEventCommandInfo(error: any): string {
        switch (String(error.eventCommand)) {
            case 'plugin_command':
                return '◆Plugin Command: ' + error.content;
            case 'script':
                return '◆Script: ' + error.content;
            case 'control_variables':
                return '◆Control Variables: Script: ' + error.content;
            case 'conditional_branch_script':
                return '◆If: Script: ' + error.content;
            case 'set_route_script':
                return '◆Set Movement Route: ◇Script: ' + error.content;
            case 'auto_route_script':
                return 'Autonomous Movement Custom Route: ◇Script: ' + error.content;
            case 'other':
            default:
                return '';
        }
    }

    private _formatStackTrace(error: Error): string {
        return decodeURIComponent(
            (error.stack || '')
                .replace(/file:.*js\//g, '')
                .replace(/http:.*js\//g, '')
                .replace(/https:.*js\//g, '')
                .replace(/chrome-extension:.*js\//g, '')
                .replace(/\n/g, '<br>')
        );
    }

    private _createCanvas(): void {
        this._canvas = document.createElement('canvas');
        this._canvas.id = 'GameCanvas';
        this._updateCanvas();
        document.body.appendChild(this._canvas);
    }

    private _updateCanvas(): void {
        this._canvas.width = this._width;
        this._canvas.height = this._height;
        this._canvas.style.zIndex = '1';
        this._centerElement(this._canvas, this._width, this._height);
    }

    private _createVideo(): void {
        this._video = document.createElement('video');
        this._video.id = 'GameVideo';
        this._video.style.opacity = '0';
        this._video.setAttribute('playsinline', '');
        this._video.volume = this._videoVolume;
        this._updateVideo();
        makeVideoPlayableInline(this._video);
        document.body.appendChild(this._video);
    }

    private _updateVideo(): void {
        this._video.width = this._width;
        this._video.height = this._height;
        this._video.style.zIndex = '2';
        this._centerElement(this._video, this._width, this._height);
    }

    private _createUpperCanvas(): void {
        this._upperCanvas = document.createElement('canvas');
        this._upperCanvas.id = 'UpperCanvas';
        this._updateUpperCanvas();
        document.body.appendChild(this._upperCanvas);
    }

    private _updateUpperCanvas(): void {
        this._upperCanvas.width = this._width;
        this._upperCanvas.height = this._height;
        this._upperCanvas.style.zIndex = '3';
        this._centerElement(this._upperCanvas, this._width, this._height);
    }

    private _clearUpperCanvas(): void {
        const context = this._upperCanvas.getContext('2d');
        context.clearRect(0, 0, this._width, this._height);
    }

    private _paintUpperCanvas(): void {
        this._clearUpperCanvas();
        if (this._loadingImage && this._loadingCount >= 20) {
            const context = this._upperCanvas.getContext('2d');
            const dx = (this._width - this._loadingImage.width) / 2;
            const dy = (this._height - this._loadingImage.height) / 2;
            const alpha = clamp((this._loadingCount - 20) / 30, [0, 1]);
            context.save();
            context.globalAlpha = alpha;
            context.drawImage(this._loadingImage, dx, dy);
            context.restore();
        }
    }

    private _createRenderer(): void {
        // FIXME:
        // PIXI.dontSayHello = true;
        const width = this._width;
        const height = this._height;
        const options = { view: this._canvas };
        try {
            switch (this._rendererType) {
                case 'canvas':
                    this._renderer = new PIXI.CanvasRenderer(width, height, options);
                    break;
                case 'webgl':
                    this._renderer = new PIXI.WebGLRenderer(width, height, options);
                    break;
                default:
                    this._renderer = PIXI.autoDetectRenderer(width, height, options);
                    break;
            }

            if (this._renderer instanceof PIXI.WebGLRenderer && this._renderer.textureGC) this._renderer.textureGC.maxIdle = 1;
        } catch (e) {
            this._renderer = null;
        }
    }

    private _updateRenderer(): void {
        if (this._renderer) {
            this._renderer.resize(this._width, this._height);
        }
    }

    private _createFPSMeter(): void {
        const options = {
            graph: 1,
            decimals: 0,
            theme: 'transparent',
            toggleOn: null,
        };
        this._fpsMeter = new FPSMeter(options);
        this._fpsMeter.hide();
    }

    private _createModeBox(): void {
        const box = document.createElement('div');
        box.id = 'modeTextBack';
        box.style.position = 'absolute';
        box.style.left = '5px';
        box.style.top = '5px';
        box.style.width = '119px';
        box.style.height = '58px';
        box.style.background = 'rgba(0,0,0,0.2)';
        box.style.zIndex = '9';
        box.style.opacity = '0';

        const text = document.createElement('div');
        text.id = 'modeText';
        text.style.position = 'absolute';
        text.style.left = '0px';
        text.style.top = '41px';
        text.style.width = '119px';
        text.style.fontSize = '12px';
        text.style.fontFamily = 'monospace';
        text.style.color = 'white';
        text.style.textAlign = 'center';
        text.style.textShadow = '1px 1px 0 rgba(0,0,0,0.5)';
        text.innerHTML = this.isWebGL() ? 'WebGL mode' : 'Canvas mode';

        document.body.appendChild(box);
        box.appendChild(text);

        this._modeBox = box;
    }

    private _createGameFontLoader(): void {
        this._createFontLoader('GameFont');
    }

    private _createFontLoader(name: string): void {
        const div = document.createElement('div');
        const text = document.createTextNode('.');
        div.style.fontFamily = name;
        div.style.fontSize = '0px';
        div.style.color = 'transparent';
        div.style.position = 'absolute';
        div.style.margin = 'auto';
        div.style.top = '0px';
        div.style.left = '0px';
        div.style.width = '1px';
        div.style.height = '1px';
        div.appendChild(text);
        document.body.appendChild(div);
    }

    private _centerElement(element: HTMLElement, width: number, height: number): void {
        width = width * this._realScale;
        height = height * this._realScale;
        element.style.position = 'absolute';
        element.style.margin = 'auto';
        element.style.top = '0';
        element.style.left = '0';
        element.style.right = '0';
        element.style.bottom = '0';
        element.style.width = width + 'px';
        element.style.height = height + 'px';
    }

    private _disableTextSelection(): void {
        const body = document.body;
        body.style.userSelect = 'none';
        (body.style as any).webkitUserSelect = 'none';
        (body.style as any).msUserSelect = 'none';
        (body.style as any).mozUserSelect = 'none';
    }

    private _disableContextMenu(): void {
        const elements = document.body.getElementsByTagName('*');
        const oncontextmenu = function () {
            return false;
        };
        for (let i = 0; i < elements.length; i++) {
            elements[i].addEventListener('contextmenu', oncontextmenu);
        }
    }

    private _applyCanvasFilter(): void {
        if (this._canvas) {
            this._canvas.style.opacity = '0.5';
            this._canvas.style.filter = 'blur(8px)';
            this._canvas.style.webkitFilter = 'blur(8px)';
        }
    }

    private _onVideoLoad(): void {
        this._video.play();
        this._updateVisibility(true);
        this._videoLoading = false;
    }

    private _onVideoError(): void {
        this._updateVisibility(false);
        this._videoLoading = false;
    }

    private _onVideoEnd(): void {
        this._updateVisibility(false);
    }

    private _updateVisibility(videoVisible: boolean): void {
        this._video.style.opacity = videoVisible ? '1' : '0';
        this._canvas.style.opacity = videoVisible ? '0' : '1';
    }

    private _isVideoVisible(): boolean {
        return Number(this._video.style.opacity) > 0;
    }

    private _setupEventHandlers(): void {
        window.addEventListener('resize', this._onWindowResize.bind(this));
        document.addEventListener('keydown', this._onKeyDown.bind(this));
        document.addEventListener('keydown', this._onTouchEnd.bind(this));
        document.addEventListener('mousedown', this._onTouchEnd.bind(this));
        document.addEventListener('touchend', this._onTouchEnd.bind(this));
    }

    private _onWindowResize(): void {
        this._updateAllElements();
    }

    private _onKeyDown(event: KeyboardEvent): void {
        if (!event.ctrlKey && !event.altKey) {
            switch (event.keyCode) {
                case 113: // F2
                    event.preventDefault();
                    this._switchFPSMeter();
                    break;
                case 114: // F3
                    event.preventDefault();
                    this._switchStretchMode();
                    break;
                case 115: // F4
                    event.preventDefault();
                    this._switchFullScreen();
                    break;
            }
        }
    }

    private _onTouchEnd(_event: TouchEvent): void {
        if (!this._videoUnlocked) {
            this._video.play();
            this._videoUnlocked = true;
        }
        if (this._isVideoVisible() && this._video.paused) {
            this._video.play();
        }
    }

    private _switchFPSMeter(): void {
        if (this._fpsMeter.isPaused) {
            this.showFps();
            this._fpsMeter.showFps();
            this._fpsMeterToggled = false;
        } else if (!this._fpsMeterToggled) {
            this._fpsMeter.showDuration();
            this._fpsMeterToggled = true;
        } else {
            this.hideFps();
        }
    }

    private _switchStretchMode(): void {
        this._stretchEnabled = !this._stretchEnabled;
        this._updateAllElements();
    }

    private _switchFullScreen(): void {
        if (this._isFullScreen()) {
            this._cancelFullScreen();
        } else {
            this._requestFullScreen();
        }
    }

    private _isFullScreen(): boolean {
        return (
            document.fullscreenElement ||
            (document as any).mozFullScreen ||
            (document as any).webkitFullscreenElement ||
            (document as any).msFullscreenElement
        );
    }

    private _requestFullScreen(): void {
        const element = document.body;
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
            (element as any).mozRequestFullScreen();
        } else if ((element as any).webkitRequestFullScreen) {
            (element as any).webkitRequestFullScreen((Element as any).ALLOW_KEYBOARD_INPUT);
        } else if ((element as any).msRequestFullscreen) {
            (element as any).msRequestFullscreen();
        }
    }

    private _cancelFullScreen(): void {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
            (document as any).mozCancelFullScreen();
        } else if ((document as any).webkitCancelFullScreen) {
            (document as any).webkitCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
            (document as any).msExitFullscreen();
        }
    }
})();

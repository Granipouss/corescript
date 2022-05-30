import { Bitmap } from '../rpg_core/Bitmap';
import { Utils } from '../rpg_core/Utils';
import { Graphics, RendererType } from '../rpg_core/Graphics';
import { WebAudio } from '../rpg_core/WebAudio';
import { TouchInput } from '../rpg_core/TouchInput';
import { Input } from '../rpg_core/Input';
import type { Scene_Base } from '../rpg_scenes/Scene_Base';

import { AudioManager } from './AudioManager';
import { ImageManager } from './ImageManager';
import { PluginManager } from './PluginManager';

type SceneClass = new (...args: unknown[]) => Scene_Base;

/**
 * The static class that manages scene transitions.
 */
export const SceneManager = new (class SceneManager {
    /*
     * Gets the current time in ms without on iOS Safari.
     */
    private _getTimeInMsWithoutMobileSafari() {
        return performance.now();
    }

    private _scene: Scene_Base = null;
    private _nextScene: Scene_Base = null;
    private _stack: SceneClass[] = [];
    private _stopped = false;
    private _sceneStarted = false;
    private _exiting = false;
    private _previousClass: SceneClass = null;
    private _backgroundBitmap: Bitmap = null;
    private _screenWidth = 816;
    private _screenHeight = 624;
    private _boxWidth = 816;
    private _boxHeight = 624;
    private _deltaTime = 1.0 / 60.0;
    private _currentTime = !Utils.isMobileSafari() ? this._getTimeInMsWithoutMobileSafari() : undefined;
    private _accumulator = 0.0;
    private _frameCount = 0;

    run(sceneClass: SceneClass): void {
        try {
            this.initialize();
            this.goto(sceneClass);
            this.requestUpdate();
        } catch (e) {
            this.catchException(e);
        }
    }

    initialize(): void {
        this.initGraphics();
        this.checkFileAccess();
        this.initAudio();
        this.checkPluginErrors();
        this.setupErrorHandlers();
    }

    initGraphics(): void {
        const type = this.preferableRendererType();
        Graphics.initialize(this._screenWidth, this._screenHeight, type);
        Graphics.boxWidth = this._boxWidth;
        Graphics.boxHeight = this._boxHeight;
        Graphics.setLoadingImage('img/system/Loading.png');
        if (Utils.isOptionValid('showfps')) {
            Graphics.showFps();
        }
        if (type === 'webgl') {
            this.checkWebGL();
        }
    }

    preferableRendererType(): RendererType {
        if (Utils.isOptionValid('canvas')) {
            return 'canvas';
        } else if (Utils.isOptionValid('webgl')) {
            return 'webgl';
        } else {
            return 'auto';
        }
    }

    shouldUseCanvasRenderer(): boolean {
        return Utils.isMobileDevice();
    }

    checkWebGL(): void {
        if (!Graphics.hasWebGL()) {
            throw new Error('Your browser does not support WebGL.');
        }
    }

    checkFileAccess(): void {
        if (!Utils.canReadGameFiles()) {
            throw new Error('Your browser does not allow to read local files.');
        }
    }

    initAudio(): void {
        const noAudio = Utils.isOptionValid('noaudio');
        if (!WebAudio.initialize(noAudio) && !noAudio) {
            throw new Error('Your browser does not support Web Audio API.');
        }
    }

    checkPluginErrors(): void {
        PluginManager.checkErrors();
    }

    setupErrorHandlers(): void {
        window.addEventListener('error', this.onError.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    frameCount(): number {
        return this._frameCount;
    }

    setFrameCount(frameCount: number): void {
        this._frameCount = frameCount;
    }

    resetFrameCount(): void {
        this._frameCount = 0;
    }

    requestUpdate(): void {
        if (!this._stopped) {
            requestAnimationFrame(this.update.bind(this));
        }
    }

    update(): void {
        try {
            this.tickStart();
            if (Utils.isMobileSafari()) {
                this.updateInputData();
            }
            this.updateManagers();
            this.updateMain();
            this.tickEnd();
        } catch (e) {
            this.catchException(e);
        }
    }

    terminate(): void {
        window.close();
    }

    onError(e: Error & { filename?: string; lineno?: number }): void {
        console.error(e.message);
        if (e.filename || e.lineno) {
            console.error(e.filename, e.lineno);
            try {
                this.stop();
                Graphics.printError('Error', e.message);
                AudioManager.stopAll();
            } catch (e2) {
                // ...
            }
        }
    }

    onKeyDown(event: KeyboardEvent): void {
        if (!event.ctrlKey && !event.altKey) {
            switch (event.keyCode) {
                case 116: // F5
                    location.reload();
                    break;
            }
        }
    }

    catchException(e: unknown): void {
        if (e instanceof Error) {
            Graphics.printError(e.name, e.message);
            Graphics.printErrorDetail(e);
            console.error(e.stack);
        } else {
            Graphics.printError('UnknownError', String(e));
        }
        AudioManager.stopAll();
        this.stop();
    }

    tickStart(): void {
        Graphics.tickStart();
    }

    tickEnd(): void {
        Graphics.tickEnd();
    }

    updateInputData(): void {
        Input.update();
        TouchInput.update();
    }

    updateMain(): void {
        if (Utils.isMobileSafari()) {
            this.changeScene();
            this.updateScene();
        } else {
            const newTime = this._getTimeInMsWithoutMobileSafari();
            if (this._currentTime === undefined) {
                this._currentTime = newTime;
            }
            let fTime = (newTime - this._currentTime) / 1000;
            if (fTime > 0.25) {
                fTime = 0.25;
            }
            this._currentTime = newTime;
            this._accumulator += fTime;
            while (this._accumulator >= this._deltaTime) {
                this.updateInputData();
                this.changeScene();
                this.updateScene();
                this._accumulator -= this._deltaTime;
            }
        }
        this.renderScene();
        this.requestUpdate();
    }

    updateManagers(): void {
        ImageManager.update();
    }

    changeScene(): void {
        if (this.isSceneChanging() && !this.isCurrentSceneBusy()) {
            if (this._scene) {
                this._scene.terminate();
                this._scene.detachReservation();
                this._previousClass = this._scene.constructor as SceneClass;
            }
            this._scene = this._nextScene;
            if (this._scene) {
                this._scene.attachReservation();
                this._scene.create();
                this._nextScene = null;
                this._sceneStarted = false;
                this.onSceneCreate();
            }
            if (this._exiting) {
                this.terminate();
            }
        }
    }

    updateScene(): void {
        if (this._scene) {
            if (!this._sceneStarted && this._scene.isReady()) {
                this._scene.start();
                this._sceneStarted = true;
                this.onSceneStart();
            }
            if (this.isCurrentSceneStarted()) {
                this.updateFrameCount();
                this._scene.update();
            }
        }
    }

    renderScene(): void {
        if (this.isCurrentSceneStarted()) {
            Graphics.render(this._scene);
        } else if (this._scene) {
            this.onSceneLoading();
        }
    }

    updateFrameCount(): void {
        this._frameCount++;
    }

    onSceneCreate(): void {
        Graphics.startLoading();
    }

    onSceneStart(): void {
        Graphics.endLoading();
    }

    onSceneLoading(): void {
        Graphics.updateLoading();
    }

    isSceneChanging(): boolean {
        return this._exiting || !!this._nextScene;
    }

    isCurrentSceneBusy(): boolean {
        return this._scene && this._scene.isBusy();
    }

    isCurrentSceneStarted(): boolean {
        return this._scene && this._sceneStarted;
    }

    isNextScene(sceneClass: SceneClass): boolean {
        return this._nextScene && this._nextScene.constructor === sceneClass;
    }

    isPreviousScene(sceneClass: SceneClass) {
        return this._previousClass === sceneClass;
    }

    goto(sceneClass: SceneClass): void {
        if (sceneClass) {
            this._nextScene = new sceneClass();
        }
        if (this._scene) {
            this._scene.stop();
        }
    }

    push(sceneClass: SceneClass): void {
        this._stack.push(this._scene.constructor as SceneClass);
        this.goto(sceneClass);
    }

    pop(): void {
        if (this._stack.length > 0) {
            this.goto(this._stack.pop());
        } else {
            this.exit();
        }
    }

    exit(): void {
        this.goto(null);
        this._exiting = true;
    }

    clearStack(): void {
        this._stack = [];
    }

    stop(): void {
        this._stopped = true;
    }

    prepareNextScene(...args: unknown[]) {
        // FIXME:
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this._nextScene.prepare(...args);
    }

    snap(): Bitmap {
        return Bitmap.snap(this._scene);
    }

    snapForBackground(): void {
        this._backgroundBitmap = this.snap();
        this._backgroundBitmap.blur();
    }

    backgroundBitmap(): Bitmap {
        return this._backgroundBitmap;
    }

    resume(): void {
        this._stopped = false;
        this.requestUpdate();
        if (!Utils.isMobileSafari()) {
            this._currentTime = this._getTimeInMsWithoutMobileSafari();
            this._accumulator = 0;
        }
    }
})();

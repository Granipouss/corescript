import { Bitmap } from '../rpg_core/Bitmap';
import { Utils } from '../rpg_core/Utils';
import { Graphics } from '../rpg_core/Graphics';
import { ProgressWatcher } from '../rpg_core/ProgressWatcher';
import { WebAudio } from '../rpg_core/WebAudio';
import { TouchInput } from '../rpg_core/TouchInput';
import { Input } from '../rpg_core/Input';

import { AudioManager } from '../rpg_managers/AudioManager';
import { ImageManager } from '../rpg_managers/ImageManager';
import { PluginManager } from '../rpg_managers/PluginManager';

/**
 * The static class that manages scene transitions.
 */
export const SceneManager = new (class SceneManager {
    /*
     * Gets the current time in ms without on iOS Safari.
     * @private
     */
    _getTimeInMsWithoutMobileSafari() {
        return performance.now();
    }

    _scene = null;
    _nextScene = null;
    _stack = [];
    _stopped = false;
    _sceneStarted = false;
    _exiting = false;
    _previousClass = null;
    _backgroundBitmap = null;
    _screenWidth = 816;
    _screenHeight = 624;
    _boxWidth = 816;
    _boxHeight = 624;
    _deltaTime = 1.0 / 60.0;
    _currentTime = !Utils.isMobileSafari() ? this._getTimeInMsWithoutMobileSafari() : undefined;
    _accumulator = 0.0;
    _frameCount = 0;

    run(sceneClass) {
        try {
            this.initialize();
            this.goto(sceneClass);
            this.requestUpdate();
        } catch (e) {
            this.catchException(e);
        }
    }

    initialize() {
        this.initProgressWatcher();
        this.initGraphics();
        this.checkFileAccess();
        this.initAudio();
        this.checkPluginErrors();
        this.setupErrorHandlers();
    }

    initProgressWatcher() {
        ProgressWatcher.initialize();
    }

    initGraphics() {
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

    preferableRendererType() {
        if (Utils.isOptionValid('canvas')) {
            return 'canvas';
        } else if (Utils.isOptionValid('webgl')) {
            return 'webgl';
        } else {
            return 'auto';
        }
    }

    shouldUseCanvasRenderer() {
        return Utils.isMobileDevice();
    }

    checkWebGL() {
        if (!Graphics.hasWebGL()) {
            throw new Error('Your browser does not support WebGL.');
        }
    }

    checkFileAccess() {
        if (!Utils.canReadGameFiles()) {
            throw new Error('Your browser does not allow to read local files.');
        }
    }

    initAudio() {
        const noAudio = Utils.isOptionValid('noaudio');
        if (!WebAudio.initialize(noAudio) && !noAudio) {
            throw new Error('Your browser does not support Web Audio API.');
        }
    }

    checkPluginErrors() {
        PluginManager.checkErrors();
    }

    setupErrorHandlers() {
        window.addEventListener('error', this.onError.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    frameCount() {
        return this._frameCount;
    }

    setFrameCount(frameCount) {
        this._frameCount = frameCount;
    }

    resetFrameCount() {
        this._frameCount = 0;
    }

    requestUpdate() {
        if (!this._stopped) {
            requestAnimationFrame(this.update.bind(this));
        }
    }

    update() {
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

    terminate() {
        window.close();
    }

    onError(e) {
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

    onKeyDown(event) {
        if (!event.ctrlKey && !event.altKey) {
            switch (event.keyCode) {
                case 116: // F5
                    location.reload();
                    break;
            }
        }
    }

    catchException(e) {
        if (e instanceof Error) {
            Graphics.printError(e.name, e.message);
            Graphics.printErrorDetail(e);
            console.error(e.stack);
        } else {
            Graphics.printError('UnknownError', e);
        }
        AudioManager.stopAll();
        this.stop();
    }

    tickStart() {
        Graphics.tickStart();
    }

    tickEnd() {
        Graphics.tickEnd();
    }

    updateInputData() {
        Input.update();
        TouchInput.update();
    }

    updateMain() {
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

    updateManagers() {
        ImageManager.update();
    }

    changeScene() {
        if (this.isSceneChanging() && !this.isCurrentSceneBusy()) {
            if (this._scene) {
                this._scene.terminate();
                this._scene.detachReservation();
                this._previousClass = this._scene.constructor;
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

    updateScene() {
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

    renderScene() {
        if (this.isCurrentSceneStarted()) {
            Graphics.render(this._scene);
        } else if (this._scene) {
            this.onSceneLoading();
        }
    }

    updateFrameCount() {
        this._frameCount++;
    }

    onSceneCreate() {
        Graphics.startLoading();
    }

    onSceneStart() {
        Graphics.endLoading();
    }

    onSceneLoading() {
        Graphics.updateLoading();
    }

    isSceneChanging() {
        return this._exiting || !!this._nextScene;
    }

    isCurrentSceneBusy() {
        return this._scene && this._scene.isBusy();
    }

    isCurrentSceneStarted() {
        return this._scene && this._sceneStarted;
    }

    isNextScene(sceneClass) {
        return this._nextScene && this._nextScene.constructor === sceneClass;
    }

    isPreviousScene(sceneClass) {
        return this._previousClass === sceneClass;
    }

    goto(sceneClass) {
        if (sceneClass) {
            this._nextScene = new sceneClass();
        }
        if (this._scene) {
            this._scene.stop();
        }
    }

    push(sceneClass) {
        this._stack.push(this._scene.constructor);
        this.goto(sceneClass);
    }

    pop() {
        if (this._stack.length > 0) {
            this.goto(this._stack.pop());
        } else {
            this.exit();
        }
    }

    exit() {
        this.goto(null);
        this._exiting = true;
    }

    clearStack() {
        this._stack = [];
    }

    stop() {
        this._stopped = true;
    }

    prepareNextScene(...args) {
        this._nextScene.prepare(...args);
    }

    snap() {
        return Bitmap.snap(this._scene);
    }

    snapForBackground() {
        this._backgroundBitmap = this.snap();
        this._backgroundBitmap.blur();
    }

    backgroundBitmap() {
        return this._backgroundBitmap;
    }

    resume() {
        this._stopped = false;
        this.requestUpdate();
        if (!Utils.isMobileSafari()) {
            this._currentTime = this._getTimeInMsWithoutMobileSafari();
            this._accumulator = 0;
        }
    }
})();

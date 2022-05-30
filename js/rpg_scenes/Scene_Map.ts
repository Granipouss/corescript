import { Tone } from '../rpg_core/extension';
import { Input } from '../rpg_core/Input';
import { TouchInput } from '../rpg_core/TouchInput';
import { AudioManager } from '../rpg_managers/AudioManager';
import { BattleManager } from '../rpg_managers/BattleManager';
import { DataManager } from '../rpg_managers/DataManager';
import { ImageManager } from '../rpg_managers/ImageManager';
import { SceneManager } from '../rpg_managers/SceneManager';
import { SoundManager } from '../rpg_managers/SoundManager';
import { Spriteset_Map } from '../rpg_sprites/Spriteset_Map';
import { Window_MapName } from '../rpg_windows/Window_MapName';
import { Window_MenuCommand } from '../rpg_windows/Window_MenuCommand';
import { Window_Message } from '../rpg_windows/Window_Message';
import { Window_ScrollText } from '../rpg_windows/Window_ScrollText';
import { Scene_Base } from './Scene_Base';
import { Scene_Battle } from './Scene_Battle';
import { Scene_Debug } from './Scene_Debug';
import { Scene_Gameover } from './Scene_Gameover';
import { Scene_Load } from './Scene_Load';
import { Scene_Menu } from './Scene_Menu';
import { Scene_Title } from './Scene_Title';

/**
 * The scene class of the map screen.
 */
export class Scene_Map extends Scene_Base {
    protected _waitCount: number;
    protected _encounterEffectDuration: number;
    protected _mapLoaded: boolean;
    protected _touchCount: number;

    protected _transfer: boolean;

    protected _mapNameWindow: Window_MapName;
    protected _messageWindow: Window_Message;
    protected _scrollTextWindow: Window_ScrollText;
    protected _spriteset: Spriteset_Map;

    menuCalling: boolean;

    constructor() {
        super();

        this._waitCount = 0;
        this._encounterEffectDuration = 0;
        this._mapLoaded = false;
        this._touchCount = 0;
    }

    create(): void {
        super.create();
        this._transfer = window.$gamePlayer.isTransferring();
        const mapId = this._transfer ? window.$gamePlayer.newMapId() : window.$gameMap.mapId();
        DataManager.loadMapData(mapId);
    }

    isReady(): boolean {
        if (!this._mapLoaded && DataManager.isMapLoaded()) {
            this.onMapLoaded();
            this._mapLoaded = true;
        }
        return this._mapLoaded && super.isReady();
    }

    onMapLoaded(): void {
        if (this._transfer) {
            window.$gamePlayer.performTransfer();
        }
        this.createDisplayObjects();
    }

    start(): void {
        super.start();
        SceneManager.clearStack();
        if (this._transfer) {
            this.fadeInForTransfer();
            this._mapNameWindow.open();
            window.$gameMap.autoplay();
        } else if (this.needsFadeIn()) {
            this.startFadeIn(this.fadeSpeed(), false);
        }
        this.menuCalling = false;
    }

    update(): void {
        this.updateDestination();
        this.updateMainMultiply();
        if (this.isSceneChangeOk()) {
            this.updateScene();
        } else if (SceneManager.isNextScene(Scene_Battle)) {
            this.updateEncounterEffect();
        }
        this.updateWaitCount();
        super.update();
    }

    updateMainMultiply(): void {
        this.updateMain();
        if (this.isFastForward()) {
            if (!this.isMapTouchOk()) {
                this.updateDestination();
            }
            this.updateMain();
        }
    }

    updateMain(): void {
        const active = this.isActive();
        window.$gameMap.update(active);
        window.$gamePlayer.update(active);
        window.$gameTimer.update(active);
        window.$gameScreen.update();
    }

    isFastForward(): boolean {
        return (
            window.$gameMap.isEventRunning() &&
            !SceneManager.isSceneChanging() &&
            (Input.isLongPressed('ok') || TouchInput.isLongPressed())
        );
    }

    stop(): void {
        super.stop();
        window.$gamePlayer.straighten();
        this._mapNameWindow.close();
        if (this.needsSlowFadeOut()) {
            this.startFadeOut(this.slowFadeSpeed(), false);
        } else if (SceneManager.isNextScene(Scene_Map)) {
            this.fadeOutForTransfer();
        } else if (SceneManager.isNextScene(Scene_Battle)) {
            this.launchBattle();
        }
    }

    isBusy(): boolean {
        return (
            (this._messageWindow && this._messageWindow.isClosing()) ||
            this._waitCount > 0 ||
            this._encounterEffectDuration > 0 ||
            super.isBusy()
        );
    }

    terminate(): void {
        super.terminate();
        if (!SceneManager.isNextScene(Scene_Battle)) {
            this._spriteset.update();
            this._mapNameWindow.hide();
            SceneManager.snapForBackground();
        } else {
            ImageManager.clearRequest();
        }

        if (SceneManager.isNextScene(Scene_Map)) {
            ImageManager.clearRequest();
        }

        window.$gameScreen.clearZoom();

        this.removeChild(this._fadeSprite);
        this.removeChild(this._mapNameWindow);
        this.removeChild(this._windowLayer);
        this.removeChild(this._spriteset);
    }

    needsFadeIn(): boolean {
        return SceneManager.isPreviousScene(Scene_Battle) || SceneManager.isPreviousScene(Scene_Load);
    }

    needsSlowFadeOut(): boolean {
        return SceneManager.isNextScene(Scene_Title) || SceneManager.isNextScene(Scene_Gameover);
    }

    updateWaitCount(): boolean {
        if (this._waitCount > 0) {
            this._waitCount--;
            return true;
        }
        return false;
    }

    updateDestination(): void {
        if (this.isMapTouchOk()) {
            this.processMapTouch();
        } else {
            window.$gameTemp.clearDestination();
            this._touchCount = 0;
        }
    }

    isMapTouchOk(): boolean {
        return this.isActive() && window.$gamePlayer.canMove();
    }

    processMapTouch(): void {
        if (TouchInput.isTriggered() || this._touchCount > 0) {
            if (TouchInput.isPressed()) {
                if (this._touchCount === 0 || this._touchCount >= 15) {
                    const x = window.$gameMap.canvasToMapX(TouchInput.x);
                    const y = window.$gameMap.canvasToMapY(TouchInput.y);
                    window.$gameTemp.setDestination(x, y);
                }
                this._touchCount++;
            } else {
                this._touchCount = 0;
            }
        }
    }

    isSceneChangeOk(): boolean {
        return this.isActive() && !window.$gameMessage.isBusy();
    }

    updateScene(): void {
        this.checkGameover();
        if (!SceneManager.isSceneChanging()) {
            this.updateTransferPlayer();
        }
        if (!SceneManager.isSceneChanging()) {
            this.updateEncounter();
        }
        if (!SceneManager.isSceneChanging()) {
            this.updateCallMenu();
        }
        if (!SceneManager.isSceneChanging()) {
            this.updateCallDebug();
        }
    }

    createDisplayObjects(): void {
        this.createSpriteset();
        this.createMapNameWindow();
        this.createWindowLayer();
        this.createAllWindows();
    }

    createSpriteset(): void {
        this._spriteset = new Spriteset_Map();
        this.addChild(this._spriteset);
    }

    createAllWindows(): void {
        this.createMessageWindow();
        this.createScrollTextWindow();
    }

    createMapNameWindow(): void {
        this._mapNameWindow = new Window_MapName();
        this.addChild(this._mapNameWindow);
    }

    createMessageWindow(): void {
        this._messageWindow = new Window_Message();
        this.addWindow(this._messageWindow);
        this._messageWindow.subWindows().forEach(function (window) {
            this.addWindow(window);
        }, this);
    }

    createScrollTextWindow(): void {
        this._scrollTextWindow = new Window_ScrollText();
        this.addWindow(this._scrollTextWindow);
    }

    updateTransferPlayer(): void {
        if (window.$gamePlayer.isTransferring()) {
            SceneManager.goto(Scene_Map);
        }
    }

    updateEncounter(): void {
        if (window.$gamePlayer.executeEncounter()) {
            SceneManager.push(Scene_Battle);
        }
    }

    updateCallMenu(): void {
        if (this.isMenuEnabled()) {
            if (this.isMenuCalled()) {
                this.menuCalling = true;
            }
            if (this.menuCalling && !window.$gamePlayer.isMoving()) {
                this.callMenu();
            }
        } else {
            this.menuCalling = false;
        }
    }

    isMenuEnabled(): boolean {
        return window.$gameSystem.isMenuEnabled() && !window.$gameMap.isEventRunning();
    }

    isMenuCalled(): boolean {
        return Input.isTriggered('menu') || TouchInput.isCancelled();
    }

    callMenu(): void {
        SoundManager.playOk();
        SceneManager.push(Scene_Menu);
        Window_MenuCommand.initCommandPosition();
        window.$gameTemp.clearDestination();
        this._mapNameWindow.hide();
        this._waitCount = 2;
    }

    updateCallDebug(): void {
        if (this.isDebugCalled()) {
            SceneManager.push(Scene_Debug);
        }
    }

    isDebugCalled(): boolean {
        return Input.isTriggered('debug') && window.$gameTemp.isPlaytest();
    }

    fadeInForTransfer(): void {
        const fadeType = window.$gamePlayer.fadeType();
        switch (fadeType) {
            case 0:
            case 1:
                this.startFadeIn(this.fadeSpeed(), fadeType === 1);
                break;
        }
    }

    fadeOutForTransfer(): void {
        const fadeType = window.$gamePlayer.fadeType();
        switch (fadeType) {
            case 0:
            case 1:
                this.startFadeOut(this.fadeSpeed(), fadeType === 1);
                break;
        }
    }

    launchBattle(): void {
        BattleManager.saveBgmAndBgs();
        this.stopAudioOnBattleStart();
        SoundManager.playBattleStart();
        this.startEncounterEffect();
        this._mapNameWindow.hide();
    }

    stopAudioOnBattleStart(): void {
        if (!AudioManager.isCurrentBgm(window.$gameSystem.battleBgm())) {
            AudioManager.stopBgm();
        }
        AudioManager.stopBgs();
        AudioManager.stopMe();
        AudioManager.stopSe();
    }

    startEncounterEffect(): void {
        this._spriteset.hideCharacters();
        this._encounterEffectDuration = this.encounterEffectSpeed();
    }

    updateEncounterEffect(): void {
        if (this._encounterEffectDuration > 0) {
            this._encounterEffectDuration--;
            const speed = this.encounterEffectSpeed();
            const n = speed - this._encounterEffectDuration;
            const p = n / speed;
            const q = ((p - 1) * 20 * p + 5) * p + 1;
            const zoomX = window.$gamePlayer.screenX();
            const zoomY = window.$gamePlayer.screenY() - 24;
            if (n === 2) {
                window.$gameScreen.setZoom(zoomX, zoomY, 1);
                this.snapForBattleBackground();
                this.startFlashForEncounter(speed / 2);
            }
            window.$gameScreen.setZoom(zoomX, zoomY, q);
            if (n === Math.floor(speed / 6)) {
                this.startFlashForEncounter(speed / 2);
            }
            if (n === Math.floor(speed / 2)) {
                BattleManager.playBattleBgm();
                this.startFadeOut(this.fadeSpeed());
            }
        }
    }

    snapForBattleBackground(): void {
        this._windowLayer.visible = false;
        SceneManager.snapForBackground();
        this._windowLayer.visible = true;
    }

    startFlashForEncounter(duration: number): void {
        const color = [255, 255, 255, 255] as Tone;
        window.$gameScreen.startFlash(color, duration);
    }

    encounterEffectSpeed(): number {
        return 60;
    }
}

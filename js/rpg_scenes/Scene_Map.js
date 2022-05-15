//-----------------------------------------------------------------------------
// Scene_Map
//
// The scene class of the map screen.

function Scene_Map() {
    this.initialize.apply(this, arguments);
}

Scene_Map.prototype = Object.create(Scene_Base.prototype);
Scene_Map.prototype.constructor = Scene_Map;

Scene_Map.prototype.initialize = function () {
    Scene_Base.prototype.initialize.call(this);
    this._waitCount = 0;
    this._encounterEffectDuration = 0;
    this._mapLoaded = false;
    this._touchCount = 0;
};

Scene_Map.prototype.create = function () {
    Scene_Base.prototype.create.call(this);
    this._transfer = global.$gamePlayer.isTransferring();
    var mapId = this._transfer ? global.$gamePlayer.newMapId() : global.$gameMap.mapId();
    DataManager.loadMapData(mapId);
};

Scene_Map.prototype.isReady = function () {
    if (!this._mapLoaded && DataManager.isMapLoaded()) {
        this.onMapLoaded();
        this._mapLoaded = true;
    }
    return this._mapLoaded && Scene_Base.prototype.isReady.call(this);
};

Scene_Map.prototype.onMapLoaded = function () {
    if (this._transfer) {
        global.$gamePlayer.performTransfer();
    }
    this.createDisplayObjects();
};

Scene_Map.prototype.start = function () {
    Scene_Base.prototype.start.call(this);
    SceneManager.clearStack();
    if (this._transfer) {
        this.fadeInForTransfer();
        this._mapNameWindow.open();
        global.$gameMap.autoplay();
    } else if (this.needsFadeIn()) {
        this.startFadeIn(this.fadeSpeed(), false);
    }
    this.menuCalling = false;
};

Scene_Map.prototype.update = function () {
    this.updateDestination();
    this.updateMainMultiply();
    if (this.isSceneChangeOk()) {
        this.updateScene();
    } else if (SceneManager.isNextScene(Scene_Battle)) {
        this.updateEncounterEffect();
    }
    this.updateWaitCount();
    Scene_Base.prototype.update.call(this);
};

Scene_Map.prototype.updateMainMultiply = function () {
    this.updateMain();
    if (this.isFastForward()) {
        if (!this.isMapTouchOk()) {
            this.updateDestination();
        }
        this.updateMain();
    }
};

Scene_Map.prototype.updateMain = function () {
    var active = this.isActive();
    global.$gameMap.update(active);
    global.$gamePlayer.update(active);
    global.$gameTimer.update(active);
    global.$gameScreen.update();
};

Scene_Map.prototype.isFastForward = function () {
    return (
        global.$gameMap.isEventRunning() &&
        !SceneManager.isSceneChanging() &&
        (Input.isLongPressed('ok') || TouchInput.isLongPressed())
    );
};

Scene_Map.prototype.stop = function () {
    Scene_Base.prototype.stop.call(this);
    global.$gamePlayer.straighten();
    this._mapNameWindow.close();
    if (this.needsSlowFadeOut()) {
        this.startFadeOut(this.slowFadeSpeed(), false);
    } else if (SceneManager.isNextScene(Scene_Map)) {
        this.fadeOutForTransfer();
    } else if (SceneManager.isNextScene(Scene_Battle)) {
        this.launchBattle();
    }
};

Scene_Map.prototype.isBusy = function () {
    return (
        (this._messageWindow && this._messageWindow.isClosing()) ||
        this._waitCount > 0 ||
        this._encounterEffectDuration > 0 ||
        Scene_Base.prototype.isBusy.call(this)
    );
};

Scene_Map.prototype.terminate = function () {
    Scene_Base.prototype.terminate.call(this);
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

    global.$gameScreen.clearZoom();

    this.removeChild(this._fadeSprite);
    this.removeChild(this._mapNameWindow);
    this.removeChild(this._windowLayer);
    this.removeChild(this._spriteset);
};

Scene_Map.prototype.needsFadeIn = function () {
    return SceneManager.isPreviousScene(Scene_Battle) || SceneManager.isPreviousScene(Scene_Load);
};

Scene_Map.prototype.needsSlowFadeOut = function () {
    return SceneManager.isNextScene(Scene_Title) || SceneManager.isNextScene(Scene_Gameover);
};

Scene_Map.prototype.updateWaitCount = function () {
    if (this._waitCount > 0) {
        this._waitCount--;
        return true;
    }
    return false;
};

Scene_Map.prototype.updateDestination = function () {
    if (this.isMapTouchOk()) {
        this.processMapTouch();
    } else {
        global.$gameTemp.clearDestination();
        this._touchCount = 0;
    }
};

Scene_Map.prototype.isMapTouchOk = function () {
    return this.isActive() && global.$gamePlayer.canMove();
};

Scene_Map.prototype.processMapTouch = function () {
    if (TouchInput.isTriggered() || this._touchCount > 0) {
        if (TouchInput.isPressed()) {
            if (this._touchCount === 0 || this._touchCount >= 15) {
                var x = global.$gameMap.canvasToMapX(TouchInput.x);
                var y = global.$gameMap.canvasToMapY(TouchInput.y);
                global.$gameTemp.setDestination(x, y);
            }
            this._touchCount++;
        } else {
            this._touchCount = 0;
        }
    }
};

Scene_Map.prototype.isSceneChangeOk = function () {
    return this.isActive() && !global.$gameMessage.isBusy();
};

Scene_Map.prototype.updateScene = function () {
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
};

Scene_Map.prototype.createDisplayObjects = function () {
    this.createSpriteset();
    this.createMapNameWindow();
    this.createWindowLayer();
    this.createAllWindows();
};

Scene_Map.prototype.createSpriteset = function () {
    this._spriteset = new Spriteset_Map();
    this.addChild(this._spriteset);
};

Scene_Map.prototype.createAllWindows = function () {
    this.createMessageWindow();
    this.createScrollTextWindow();
};

Scene_Map.prototype.createMapNameWindow = function () {
    this._mapNameWindow = new Window_MapName();
    this.addChild(this._mapNameWindow);
};

Scene_Map.prototype.createMessageWindow = function () {
    this._messageWindow = new Window_Message();
    this.addWindow(this._messageWindow);
    this._messageWindow.subWindows().forEach(function (window) {
        this.addWindow(window);
    }, this);
};

Scene_Map.prototype.createScrollTextWindow = function () {
    this._scrollTextWindow = new Window_ScrollText();
    this.addWindow(this._scrollTextWindow);
};

Scene_Map.prototype.updateTransferPlayer = function () {
    if (global.$gamePlayer.isTransferring()) {
        SceneManager.goto(Scene_Map);
    }
};

Scene_Map.prototype.updateEncounter = function () {
    if (global.$gamePlayer.executeEncounter()) {
        SceneManager.push(Scene_Battle);
    }
};

Scene_Map.prototype.updateCallMenu = function () {
    if (this.isMenuEnabled()) {
        if (this.isMenuCalled()) {
            this.menuCalling = true;
        }
        if (this.menuCalling && !global.$gamePlayer.isMoving()) {
            this.callMenu();
        }
    } else {
        this.menuCalling = false;
    }
};

Scene_Map.prototype.isMenuEnabled = function () {
    return global.$gameSystem.isMenuEnabled() && !global.$gameMap.isEventRunning();
};

Scene_Map.prototype.isMenuCalled = function () {
    return Input.isTriggered('menu') || TouchInput.isCancelled();
};

Scene_Map.prototype.callMenu = function () {
    SoundManager.playOk();
    SceneManager.push(Scene_Menu);
    Window_MenuCommand.initCommandPosition();
    global.$gameTemp.clearDestination();
    this._mapNameWindow.hide();
    this._waitCount = 2;
};

Scene_Map.prototype.updateCallDebug = function () {
    if (this.isDebugCalled()) {
        SceneManager.push(Scene_Debug);
    }
};

Scene_Map.prototype.isDebugCalled = function () {
    return Input.isTriggered('debug') && global.$gameTemp.isPlaytest();
};

Scene_Map.prototype.fadeInForTransfer = function () {
    var fadeType = global.$gamePlayer.fadeType();
    switch (fadeType) {
        case 0:
        case 1:
            this.startFadeIn(this.fadeSpeed(), fadeType === 1);
            break;
    }
};

Scene_Map.prototype.fadeOutForTransfer = function () {
    var fadeType = global.$gamePlayer.fadeType();
    switch (fadeType) {
        case 0:
        case 1:
            this.startFadeOut(this.fadeSpeed(), fadeType === 1);
            break;
    }
};

Scene_Map.prototype.launchBattle = function () {
    BattleManager.saveBgmAndBgs();
    this.stopAudioOnBattleStart();
    SoundManager.playBattleStart();
    this.startEncounterEffect();
    this._mapNameWindow.hide();
};

Scene_Map.prototype.stopAudioOnBattleStart = function () {
    if (!AudioManager.isCurrentBgm(global.$gameSystem.battleBgm())) {
        AudioManager.stopBgm();
    }
    AudioManager.stopBgs();
    AudioManager.stopMe();
    AudioManager.stopSe();
};

Scene_Map.prototype.startEncounterEffect = function () {
    this._spriteset.hideCharacters();
    this._encounterEffectDuration = this.encounterEffectSpeed();
};

Scene_Map.prototype.updateEncounterEffect = function () {
    if (this._encounterEffectDuration > 0) {
        this._encounterEffectDuration--;
        var speed = this.encounterEffectSpeed();
        var n = speed - this._encounterEffectDuration;
        var p = n / speed;
        var q = ((p - 1) * 20 * p + 5) * p + 1;
        var zoomX = global.$gamePlayer.screenX();
        var zoomY = global.$gamePlayer.screenY() - 24;
        if (n === 2) {
            global.$gameScreen.setZoom(zoomX, zoomY, 1);
            this.snapForBattleBackground();
            this.startFlashForEncounter(speed / 2);
        }
        global.$gameScreen.setZoom(zoomX, zoomY, q);
        if (n === Math.floor(speed / 6)) {
            this.startFlashForEncounter(speed / 2);
        }
        if (n === Math.floor(speed / 2)) {
            BattleManager.playBattleBgm();
            this.startFadeOut(this.fadeSpeed());
        }
    }
};

Scene_Map.prototype.snapForBattleBackground = function () {
    this._windowLayer.visible = false;
    SceneManager.snapForBackground();
    this._windowLayer.visible = true;
};

Scene_Map.prototype.startFlashForEncounter = function (duration) {
    var color = [255, 255, 255, 255];
    global.$gameScreen.startFlash(color, duration);
};

Scene_Map.prototype.encounterEffectSpeed = function () {
    return 60;
};
